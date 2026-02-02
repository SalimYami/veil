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
from datetime import datetime, timedelta
from typing import Optional
from pathlib import Path

# --- FastAPI & Dépendances ---
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, EmailStr, Field, validator

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
# CONFIGURATION
# =============================================================================

# Clé secrète pour signer les JWT (EN PRODUCTION: utiliser une variable d'env!)
SECRET_KEY = os.getenv("VEIL_SECRET_KEY", "veil-super-secret-key-change-this-in-production")
ALGORITHM = "HS256"  # Algorithme de signature JWT
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # Durée de vie du token

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
    """Token JWT retourné après authentification."""
    access_token: str
    token_type: str = "bearer"
    user_id: str


class FileMetadata(BaseModel):
    """Métadonnées d'un fichier (sans le contenu chiffré)."""
    id: str
    name: str
    iv: str  # Vecteur d'initialisation (nécessaire pour déchiffrer)
    size: int
    created_at: datetime


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
    Crée un JWT (JSON Web Token).
    
    Le JWT contient:
    - sub: l'identifiant de l'utilisateur (user_id)
    - exp: date d'expiration
    - iat: date de création
    
    Le token est signé avec notre SECRET_KEY, donc personne ne peut
    le falsifier sans connaître la clé.
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow()
    })
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


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
    description="Zero-Knowledge Cloud Storage - Le serveur ne voit jamais vos données !",
    version="1.0.0"
)

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
    expose_headers=["X-File-IV", "X-File-Name"]
)


# =============================================================================
# ROUTES - AUTHENTIFICATION
# =============================================================================

@app.post("/api/auth/register", response_model=Token)
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
    
    # Créer le token JWT
    access_token = create_access_token(
        data={"sub": user_id},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    logger.info(f"Inscription réussie: {user.email} (ID: {user_id})")
    return Token(access_token=access_token, user_id=user_id)


@app.post("/api/auth/login", response_model=Token)
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
    
    # Créer le token JWT
    access_token = create_access_token(
        data={"sub": db_user["id"]},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    logger.info(f"Connexion réussie: {user.email}")
    return Token(access_token=access_token, user_id=db_user["id"])


# =============================================================================
# ROUTES - FICHIERS
# =============================================================================

@app.get("/api/files", response_model=list[FileMetadata])
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


@app.post("/api/files/upload")
async def upload_file(
    file_name: str = Form(...),
    iv: str = Form(...),
    file: UploadFile = File(...),
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
    return {"message": "Fichier uploadé avec succès", "file_id": file_id}


@app.get("/api/files/{file_id}")
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


@app.delete("/api/files/{file_id}")
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

@app.get("/health")
async def health_check():
    """
    ❤️ Health Check
    
    Utilisé par Kubernetes/Docker pour vérifier que l'API est en vie.
    """
    return {
        "status": "healthy",
        "version": "1.0.0",
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
