"""
=============================================================================
VEIL Backend - API Zero-Knowledge Storage
=============================================================================

🔒 ARCHITECTURE ZERO-KNOWLEDGE:
-------------------------------
Le serveur ne voit JAMAIS les données en clair !

1. L'utilisateur entre son mot de passe dans le navigateur
2. Le navigateur dérive 2 clés avec Argon2:
   - authKey: envoyée au serveur (hashée) pour s'authentifier
   - encryptionKey: JAMAIS envoyée, reste dans le navigateur
3. Les fichiers sont chiffrés côté client AVANT l'upload
4. Le serveur stocke uniquement des blobs chiffrés (illisibles sans la clé)

=============================================================================
"""

import os
import uuid
import logging
import time
from datetime import datetime, timedelta
from typing import Optional, List
from pathlib import Path

# --- FastAPI & Dépendances ---
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, Header, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, EmailStr, Field, validator
from starlette.middleware.base import BaseHTTPMiddleware

# --- Authentification ---
from passlib.context import CryptContext
from jose import JWTError, jwt

# --- Logging Configuration ---
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("veil")


# =============================================================================
# MIDDLEWARE DE LOGGING
# =============================================================================

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware pour logger toutes les requêtes HTTP avec leur temps de réponse.
    Utile pour le monitoring et le debugging.
    """
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # Logger la requête entrante
        logger.info(f"→ {request.method} {request.url.path}")
        
        # Traiter la requête
        response = await call_next(request)
        
        # Calculer le temps de traitement
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        
        # Logger la réponse
        logger.info(
            f"← {request.method} {request.url.path} "
            f"[{response.status_code}] {process_time:.3f}s"
        )
        
        return response

# =============================================================================
# CONFIGURATION
# =============================================================================

# Clés secrètes pour signer les JWT (EN PRODUCTION: utiliser des variables d'env!)
SECRET_KEY = os.getenv("VEIL_SECRET_KEY", "veil-super-secret-key-change-this-in-production")
REFRESH_SECRET_KEY = os.getenv("VEIL_REFRESH_SECRET_KEY", "veil-refresh-secret-key-change-this-in-production")
ALGORITHM = "HS256"  # Algorithme de signature JWT

# Durées de vie des tokens
ACCESS_TOKEN_EXPIRE_MINUTES = 15  # Access token : 15 minutes (courte durée)
REFRESH_TOKEN_EXPIRE_DAYS = 7     # Refresh token : 7 jours (longue durée)

# Limites de sécurité
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100 MB
MAX_FILES_PER_USER = 1000

# Dossier où stocker les fichiers chiffrés
STORAGE_DIR = Path("./storage")
STORAGE_DIR.mkdir(exist_ok=True)

# Configuration du hashing (bcrypt)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# =============================================================================
# BASE DE DONNÉES (Simplifiée - En mémoire pour le MVP)
# =============================================================================

# 💡 En production, on utiliserait SQLite/PostgreSQL/DynamoDB
# Pour le MVP, on utilise des dictionnaires en mémoire

# Structure: { email: { "id": uuid, "email": email, "auth_hash": hash } }
users_db: dict = {}

# Structure: { user_id: [refresh_token_hash, ...] } pour stocker les refresh tokens valides
# Permet la révocation et le multi-device
refresh_tokens_db: dict = {}

# Structure: { user_id: [{ "id": uuid, "name": str, "iv": str, "size": int, "created_at": datetime }] }
files_db: dict = {}


# =============================================================================
# MODÈLES PYDANTIC (Validation des données)
# =============================================================================

class UserRegister(BaseModel):
    """
    Données reçues lors de l'inscription.
    
    🔐 IMPORTANT: On reçoit 'auth_hash', PAS le mot de passe en clair !
    L'auth_hash est calculé côté client: SHA256(Argon2(password, email))
    """
    email: EmailStr
    auth_hash: str = Field(..., min_length=64, max_length=128)
    
    @validator('auth_hash')
    def validate_hash(cls, v):
        if not all(c in '0123456789abcdefABCDEF' for c in v):
            raise ValueError("auth_hash doit être un hash hexadécimal valide")
        return v.lower()


class UserLogin(BaseModel):
    """Données reçues lors de la connexion."""
    email: EmailStr
    auth_hash: str = Field(..., min_length=64, max_length=128)
    
    @validator('auth_hash')
    def validate_hash(cls, v):
        if not all(c in '0123456789abcdefABCDEF' for c in v):
            raise ValueError("auth_hash doit être un hash hexadécimal valide")
        return v.lower()


class Token(BaseModel):
    """
    Tokens JWT retournés après authentification.
    
    🔐 SYSTÈME DUAL TOKEN:
    - access_token: Courte durée (15 min), utilisé pour les requêtes API
    - refresh_token: Longue durée (7 jours), utilisé pour obtenir de nouveaux access tokens
    """
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: str
    expires_in: int  # Durée de vie de l'access token en secondes


class RefreshTokenRequest(BaseModel):
    """Requête pour renouveler un access token."""
    refresh_token: str


class FileMetadata(BaseModel):
    """Métadonnées d'un fichier (sans le contenu chiffré)."""
    id: str
    name: str
    iv: str  # Vecteur d'initialisation (nécessaire pour déchiffrer)
    size: int
    created_at: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class UserStats(BaseModel):
    """Statistiques d'utilisation de l'utilisateur."""
    total_files: int
    total_size_bytes: int
    total_size_mb: float
    oldest_file: Optional[datetime] = None
    newest_file: Optional[datetime] = None
    average_file_size_mb: float
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }


class UploadInit(BaseModel):
    """Données pour initialiser un upload."""
    file_name: str = Field(..., min_length=1, max_length=255)
    iv: str = Field(..., min_length=16)  # IV utilisé pour le chiffrement côté client
    size: int = Field(..., gt=0, le=MAX_FILE_SIZE)
    
    @validator('file_name')
    def validate_filename(cls, v):
        # Empêcher les caractères dangereux dans les noms de fichiers
        forbidden = ['/', '\\', '..', '\0']
        if any(char in v for char in forbidden):
            raise ValueError("Nom de fichier invalide")
        return v


# =============================================================================
# FONCTIONS UTILITAIRES
# =============================================================================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Vérifie si un hash correspond au mot de passe.
    
    ⚠️ Dans VEIL, on ne vérifie pas un mot de passe mais un auth_hash !
    Le client envoie: SHA256(authKey)
    On compare avec le hash stocké en base.
    """
    return pwd_context.verify(plain_password, hashed_password)


def hash_password(password: str) -> str:
    """
    Hash un mot de passe/auth_hash avec bcrypt.
    
    bcrypt est résistant aux attaques par force brute car il est lent
    et utilise un salt automatique.
    """
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Crée un Access Token JWT (courte durée).
    
    Le JWT contient:
    - sub: l'identifiant de l'utilisateur (user_id)
    - exp: date d'expiration
    - iat: date de création
    - type: "access" pour distinguer du refresh token
    
    Le token est signé avec notre SECRET_KEY, donc personne ne peut
    le falsifier sans connaître la clé.
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access"
    })
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    """
    Crée un Refresh Token JWT (longue durée).
    
    🔐 DIFFÉRENCES AVEC L'ACCESS TOKEN:
    - Durée de vie plus longue (7 jours vs 15 minutes)
    - Signé avec une clé différente (REFRESH_SECRET_KEY)
    - Contient un token_type "refresh" pour éviter toute confusion
    - Stocké en base pour pouvoir être révoqué
    
    Le refresh token permet d'obtenir de nouveaux access tokens
    sans redemander le mot de passe à l'utilisateur.
    """
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = {
        "sub": user_id,
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "refresh"
    }
    refresh_token = jwt.encode(to_encode, REFRESH_SECRET_KEY, algorithm=ALGORITHM)
    
    # Stocker le hash du refresh token pour pouvoir le révoquer plus tard
    token_hash = pwd_context.hash(refresh_token)
    if user_id not in refresh_tokens_db:
        refresh_tokens_db[user_id] = []
    refresh_tokens_db[user_id].append(token_hash)
    
    # Limiter à 5 refresh tokens par utilisateur (multi-device)
    if len(refresh_tokens_db[user_id]) > 5:
        refresh_tokens_db[user_id] = refresh_tokens_db[user_id][-5:]
    
    return refresh_token


def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """
    Extrait l'utilisateur du token JWT depuis le header Authorization.
    
    Appelé à chaque requête protégée pour vérifier que l'utilisateur
    est bien authentifié.
    
    Format attendu: "Bearer <token>"
    """
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Header Authorization manquant",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(
                status_code=401,
                detail="Schéma d'authentification invalide. Utilisez 'Bearer'",
                headers={"WWW-Authenticate": "Bearer"}
            )
    except ValueError:
        raise HTTPException(
            status_code=401,
            detail="Format du header Authorization invalide",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=401,
                detail="Token invalide",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        # Vérifier que l'utilisateur existe toujours
        user_exists = any(u["id"] == user_id for u in users_db.values())
        if not user_exists:
            raise HTTPException(
                status_code=401,
                detail="Utilisateur introuvable",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        return {"user_id": user_id}
    except JWTError as e:
        logger.warning(f"Erreur JWT: {str(e)}")
        raise HTTPException(
            status_code=401,
            detail="Token invalide ou expiré",
            headers={"WWW-Authenticate": "Bearer"}
        )


# =============================================================================
# APPLICATION FASTAPI
# =============================================================================

app = FastAPI(
    title="🔒 VEIL API",
    description="""
    # Zero-Knowledge Cloud Storage
    
    VEIL est un système de stockage cloud **zero-knowledge** où le serveur ne voit JAMAIS vos données en clair.
    
    ## 🔐 Sécurité
    
    - **Chiffrement côté client** : Les fichiers sont chiffrés dans votre navigateur avec AES-256-GCM
    - **Dérivation de clés** : Utilisation d'Argon2 pour dériver les clés depuis votre mot de passe
    - **Double hashing** : Votre mot de passe n'est jamais envoyé au serveur
    - **Authentification JWT** : Tokens signés avec un secret côté serveur
    
    ## 🚀 Utilisation
    
    1. **Inscription** : Créez un compte avec votre email et mot de passe
    2. **Upload** : Chiffrez vos fichiers côté client et uploadez-les
    3. **Download** : Téléchargez vos fichiers chiffrés et déchiffrez-les côté client
    
    ⚠️ **Important** : Si vous perdez votre mot de passe, vos fichiers sont DÉFINITIVEMENT perdus !
    """,
    version="1.1.0",
    contact={
        "name": "VEIL Support",
        "url": "https://github.com/yourusername/veil",
    },
    license_info={
        "name": "MIT",
    },
)

# Ajouter le middleware de logging
app.add_middleware(RequestLoggingMiddleware)

# Configuration CORS (permet au frontend de communiquer avec l'API)
allowed_origins = os.getenv(
    "VEIL_ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-File-IV", "X-File-Name"],
    expose_headers=["X-File-IV", "X-File-Name", "X-Process-Time"]
)


# =============================================================================
# ROUTES - AUTHENTIFICATION
# =============================================================================

@app.post(
    "/api/auth/register",
    response_model=Token,
    status_code=status.HTTP_201_CREATED,
    tags=["Authentication"],
    summary="Créer un nouveau compte",
    description="Inscrivez-vous avec votre email et auth_hash dérivé côté client"
)
async def register(user: UserRegister):
    """
    📝 INSCRIPTION
    
    Flux:
    1. Le client dérive les clés: Argon2(password, email) → authKey + encryptionKey
    2. Le client envoie: { email, auth_hash: SHA256(authKey) }
    3. On hash l'auth_hash avec bcrypt et on le stocke
    4. On retourne un JWT pour authentifier les prochaines requêtes
    
    🔐 Le serveur ne connaît JAMAIS:
    - Le mot de passe original
    - L'encryptionKey (utilisée pour chiffrer les fichiers)
    """
    logger.info(f"Tentative d'inscription: {user.email}")
    
    # Vérifier si l'utilisateur existe déjà
    if user.email in users_db:
        logger.warning(f"Inscription échouée: email déjà utilisé {user.email}")
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    
    # Créer l'utilisateur
    user_id = str(uuid.uuid4())
    users_db[user.email] = {
        "id": user_id,
        "email": user.email,
        "auth_hash": hash_password(user.auth_hash),  # Double hashing: client + serveur
        "created_at": datetime.utcnow()
    }
    
    # Initialiser le stockage de fichiers pour cet utilisateur
    files_db[user_id] = []
    user_storage = STORAGE_DIR / user_id
    user_storage.mkdir(exist_ok=True)
    
    # Créer les tokens JWT
    access_token = create_access_token(
        data={"sub": user_id},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    refresh_token = create_refresh_token(user_id)
    
    logger.info(f"Inscription réussie: {user.email} (ID: {user_id})")
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=user_id,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60  # En secondes
    )


@app.post(
    "/api/auth/login",
    response_model=Token,
    tags=["Authentication"],
    summary="Se connecter à un compte existant",
    description="Authentifiez-vous avec votre email et auth_hash"
)
async def login(user: UserLogin):
    """
    🔑 CONNEXION
    
    Flux similaire à l'inscription:
    1. Le client re-dérive les clés depuis le mot de passe
    2. Le client envoie auth_hash
    3. On vérifie que le hash correspond
    4. On retourne un JWT si OK
    
    ⚠️ Si le mot de passe est incorrect, les clés dérivées seront fausses
    et le fichier ne pourra pas être déchiffré (même si le serveur était compromis!)
    """
    logger.info(f"Tentative de connexion: {user.email}")
    
    # Chercher l'utilisateur
    if user.email not in users_db:
        logger.warning(f"Connexion échouée: utilisateur introuvable {user.email}")
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    
    db_user = users_db[user.email]
    
    # Vérifier l'auth_hash
    if not verify_password(user.auth_hash, db_user["auth_hash"]):
        logger.warning(f"Connexion échouée: auth_hash invalide pour {user.email}")
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    
    # Créer les tokens JWT
    access_token = create_access_token(
        data={"sub": db_user["id"]},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    refresh_token = create_refresh_token(db_user["id"])
    
    logger.info(f"Connexion réussie: {user.email}")
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=db_user["id"],
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60  # En secondes
    )


@app.post(
    "/api/auth/refresh",
    response_model=Token,
    tags=["Authentication"],
    summary="Renouveler l'access token",
    description="Utilisez votre refresh token pour obtenir un nouvel access token"
)
async def refresh_token(request: RefreshTokenRequest):
    """
    🔄 RENOUVELLEMENT DE TOKEN
    
    Flux:
    1. Le client envoie son refresh token
    2. On vérifie sa validité (signature, expiration, révocation)
    3. On génère un nouvel access token (et optionnellement un nouveau refresh token)
    4. On retourne les nouveaux tokens
    
    ⚠️ Le refresh token n'est pas renouvelé systématiquement pour éviter
    une session infinie. L'utilisateur devra se reconnecter après 7 jours.
    """
    try:
        # Décoder le refresh token avec la clé de refresh
        payload = jwt.decode(
            request.refresh_token, 
            REFRESH_SECRET_KEY, 
            algorithms=[ALGORITHM]
        )
        
        # Vérifier le type de token
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Token invalide")
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token invalide")
        
        # Vérifier que le refresh token est dans notre base (non révoqué)
        user_tokens = refresh_tokens_db.get(user_id, [])
        token_valid = any(
            pwd_context.verify(request.refresh_token, stored_hash)
            for stored_hash in user_tokens
        )
        
        if not token_valid:
            logger.warning(f"Refresh token révoqué ou invalide pour {user_id}")
            raise HTTPException(status_code=401, detail="Refresh token révoqué")
        
        # Vérifier que l'utilisateur existe toujours
        user_exists = any(u["id"] == user_id for u in users_db.values())
        if not user_exists:
            raise HTTPException(status_code=401, detail="Utilisateur introuvable")
        
        # Créer un nouvel access token
        new_access_token = create_access_token(
            data={"sub": user_id},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        
        logger.info(f"Access token renouvelé pour {user_id}")
        return Token(
            access_token=new_access_token,
            refresh_token=request.refresh_token,  # On garde le même refresh token
            user_id=user_id,
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
        
    except JWTError as e:
        logger.warning(f"Erreur de refresh token: {str(e)}")
        raise HTTPException(status_code=401, detail="Refresh token invalide ou expiré")


@app.post(
    "/api/auth/logout",
    tags=["Authentication"],
    summary="Déconnexion",
    description="Révoque tous les refresh tokens de l'utilisateur"
)
async def logout(user: dict = Depends(get_current_user)):
    """
    🚪 DÉCONNEXION
    
    Révoque tous les refresh tokens de l'utilisateur.
    L'utilisateur devra se reconnecter sur tous ses appareils.
    """
    user_id = user["user_id"]
    
    # Supprimer tous les refresh tokens
    if user_id in refresh_tokens_db:
        refresh_tokens_db[user_id] = []
        logger.info(f"Tous les refresh tokens révoqués pour {user_id}")
    
    return {"message": "Déconnexion réussie, tous les tokens ont été révoqués"}


# =============================================================================
# ROUTES - FICHIERS
# =============================================================================

@app.get(
    "/api/files",
    response_model=List[FileMetadata],
    tags=["Files"],
    summary="Lister tous les fichiers de l'utilisateur",
    description="Récupérez la liste de tous vos fichiers avec leurs métadonnées"
)
async def list_files(user: dict = Depends(get_current_user)):
    """
    📂 LISTE DES FICHIERS
    
    Retourne les métadonnées des fichiers de l'utilisateur.
    Le contenu des fichiers n'est PAS retourné ici (trop lourd).
    
    Note: L'IV (vecteur d'initialisation) est nécessaire pour déchiffrer.
    Il est stocké en clair car il n'a pas besoin d'être secret.
    """
    user_files = files_db.get(user["user_id"], [])
    logger.info(f"Liste de fichiers demandée: {user['user_id']} ({len(user_files)} fichiers)")
    return user_files


@app.get(
    "/api/stats",
    response_model=UserStats,
    tags=["Files"],
    summary="Obtenir les statistiques d'utilisation",
    description="Récupérez vos statistiques d'utilisation (nombre de fichiers, espace utilisé, etc.)"
)
async def get_stats(user: dict = Depends(get_current_user)):
    """
    📊 STATISTIQUES UTILISATEUR
    
    Retourne des statistiques sur l'utilisation du stockage :
    - Nombre total de fichiers
    - Espace total utilisé
    - Taille moyenne des fichiers
    - Date du fichier le plus ancien/récent
    """
    user_files = files_db.get(user["user_id"], [])
    
    if not user_files:
        return UserStats(
            total_files=0,
            total_size_bytes=0,
            total_size_mb=0.0,
            oldest_file=None,
            newest_file=None,
            average_file_size_mb=0.0
        )
    
    total_size = sum(f["size"] for f in user_files)
    dates = [f["created_at"] for f in user_files]
    
    stats = UserStats(
        total_files=len(user_files),
        total_size_bytes=total_size,
        total_size_mb=round(total_size / (1024 * 1024), 2),
        oldest_file=min(dates),
        newest_file=max(dates),
        average_file_size_mb=round((total_size / len(user_files)) / (1024 * 1024), 2)
    )
    
    logger.info(f"Statistiques demandées: {user['user_id']} - {stats.total_files} fichiers, {stats.total_size_mb} MB")
    return stats


@app.post(
    "/api/files/upload",
    status_code=status.HTTP_201_CREATED,
    tags=["Files"],
    summary="Uploader un fichier chiffré",
    description="Uploadez un fichier déjà chiffré côté client avec AES-256-GCM"
)
async def upload_file(
    file_name: str = Form(..., description="Nom original du fichier"),
    iv: str = Form(..., description="Vecteur d'initialisation en base64"),
    file: UploadFile = File(..., description="Fichier chiffré"),
    user: dict = Depends(get_current_user)
):
    """
    📤 UPLOAD D'UN FICHIER CHIFFRÉ
    
    Le fichier reçu est DÉJÀ chiffré côté client !
    
    Flux:
    1. Frontend: file → AES-256-GCM(file, encryptionKey, iv) → encryptedBlob
    2. Frontend: envoie encryptedBlob + iv + fileName
    3. Backend: stocke encryptedBlob tel quel (on ne peut pas le lire!)
    
    🔐 Même si un attaquant accède au serveur, il ne peut rien faire
    sans l'encryptionKey qui n'a JAMAIS quitté le navigateur.
    """
    user_id = user["user_id"]
    
    # Vérifier le nombre de fichiers de l'utilisateur
    user_files = files_db.get(user_id, [])
    if len(user_files) >= MAX_FILES_PER_USER:
        logger.warning(f"Limite de fichiers atteinte pour {user_id}")
        raise HTTPException(
            status_code=400,
            detail=f"Limite de {MAX_FILES_PER_USER} fichiers atteinte"
        )
    
    # Générer un ID unique pour le fichier
    file_id = str(uuid.uuid4())
    
    # Chemin de stockage: storage/<user_id>/<file_id>
    file_path = STORAGE_DIR / user_id / file_id
    
    # Lire le contenu chiffré
    content = await file.read()
    
    # Vérifier la taille du fichier
    if len(content) > MAX_FILE_SIZE:
        logger.warning(f"Fichier trop volumineux: {len(content)} bytes pour {user_id}")
        raise HTTPException(
            status_code=400,
            detail=f"Fichier trop volumineux (max: {MAX_FILE_SIZE / 1024 / 1024} MB)"
        )
    
    # Sauvegarder le fichier chiffré
    try:
        with open(file_path, "wb") as f:
            f.write(content)
    except Exception as e:
        logger.error(f"Erreur lors de l'écriture du fichier {file_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur lors de l'upload")
    
    # Enregistrer les métadonnées
    file_metadata = FileMetadata(
        id=file_id,
        name=file_name,
        iv=iv,
        size=len(content),
        created_at=datetime.utcnow()
    )
    
    if user_id not in files_db:
        files_db[user_id] = []
    files_db[user_id].append(file_metadata.model_dump())
    
    logger.info(f"Fichier uploadé: {file_name} ({len(content)} bytes) pour {user_id}")
    return {
        "message": "Fichier uploadé avec succès",
        "file_id": file_id,
        "file_name": file_name,
        "size_bytes": len(content),
        "size_mb": round(len(content) / (1024 * 1024), 2)
    }


@app.get(
    "/api/files/{file_id}",
    tags=["Files"],
    summary="Télécharger un fichier chiffré",
    description="Téléchargez un fichier chiffré pour le déchiffrer côté client"
)
async def download_file(file_id: str, user: dict = Depends(get_current_user)):
    """
    📥 TÉLÉCHARGEMENT D'UN FICHIER CHIFFRÉ
    
    Retourne le blob chiffré tel qu'il a été uploadé.
    
    Flux de déchiffrement (côté client):
    1. Backend: retourne encryptedBlob + métadonnées (iv)
    2. Frontend: AES-256-GCM.decrypt(encryptedBlob, encryptionKey, iv)
    3. Frontend: obtient le fichier original
    
    ⚠️ Si l'utilisateur a oublié son mot de passe, les fichiers sont
    DÉFINITIVEMENT perdus ! C'est le prix de la sécurité zero-knowledge.
    """
    user_id = user["user_id"]
    
    # Vérifier que le fichier appartient à l'utilisateur
    user_files = files_db.get(user_id, [])
    file_meta = next((f for f in user_files if f["id"] == file_id), None)
    
    if not file_meta:
        logger.warning(f"Fichier {file_id} non trouvé pour {user_id}")
        raise HTTPException(status_code=404, detail="Fichier non trouvé")
    
    # Chemin du fichier chiffré
    file_path = STORAGE_DIR / user_id / file_id
    
    if not file_path.exists():
        logger.error(f"Fichier physique {file_id} manquant pour {user_id}")
        raise HTTPException(status_code=404, detail="Fichier non trouvé sur le disque")
    
    # Retourner le fichier chiffré avec ses métadonnées
    logger.info(f"Téléchargement du fichier {file_id} par {user_id}")
    return FileResponse(
        path=file_path,
        filename=f"{file_meta['name']}.encrypted",
        headers={
            "X-File-IV": file_meta["iv"],  # IV nécessaire pour déchiffrer
            "X-File-Name": file_meta["name"]
        }
    )


@app.delete(
    "/api/files/{file_id}",
    status_code=status.HTTP_200_OK,
    tags=["Files"],
    summary="Supprimer un fichier",
    description="Supprimez définitivement un fichier chiffré et ses métadonnées"
)
async def delete_file(file_id: str, user: dict = Depends(get_current_user)):
    """
    🗑️ SUPPRESSION D'UN FICHIER
    
    Supprime le fichier chiffré et ses métadonnées.
    """
    user_id = user["user_id"]
    
    # Trouver et supprimer les métadonnées
    user_files = files_db.get(user_id, [])
    file_meta = next((f for f in user_files if f["id"] == file_id), None)
    
    if not file_meta:
        logger.warning(f"Tentative de suppression d'un fichier inexistant {file_id} par {user_id}")
        raise HTTPException(status_code=404, detail="Fichier non trouvé")
    
    # Supprimer le fichier physique
    file_path = STORAGE_DIR / user_id / file_id
    if file_path.exists():
        try:
            os.remove(file_path)
        except Exception as e:
            logger.error(f"Erreur lors de la suppression du fichier {file_id}: {str(e)}")
            raise HTTPException(status_code=500, detail="Erreur lors de la suppression")
    
    # Supprimer les métadonnées
    files_db[user_id] = [f for f in user_files if f["id"] != file_id]
    
    logger.info(f"Fichier {file_id} supprimé par {user_id}")
    return {"message": "Fichier supprimé"}


# =============================================================================
# ROUTE SANTÉ (Health Check)
# =============================================================================

@app.get(
    "/health",
    tags=["System"],
    summary="Vérification de santé de l'API",
    description="Endpoint pour vérifier que l'API fonctionne correctement"
)
async def health_check():
    """
    ❤️ Health Check
    
    Utilisé par Kubernetes/Docker pour vérifier que l'API est en vie.
    """
    return {
        "status": "healthy",
        "version": "1.1.0",
        "timestamp": datetime.utcnow().isoformat(),
        "total_users": len(users_db),
        "total_storage_mb": round(
            sum(
                sum(f["size"] for f in files)
                for files in files_db.values()
            ) / (1024 * 1024),
            2
        ),
        "message": "🔒 VEIL API is running - Your secrets are safe!"
    }


# =============================================================================
# POINT D'ENTRÉE
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    print("""
    ╔═══════════════════════════════════════════════════════════════╗
    ║                                                               ║
    ║   🔒 VEIL - Zero-Knowledge Cloud Storage                      ║
    ║                                                               ║
    ║   API: http://localhost:8000                                  ║
    ║   Docs: http://localhost:8000/docs (Swagger UI)               ║
    ║                                                               ║
    ╚═══════════════════════════════════════════════════════════════╝
    """)
    uvicorn.run(app, host="0.0.0.0", port=8000)
