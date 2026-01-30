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
import shutil
from datetime import datetime, timedelta
from typing import Optional
from pathlib import Path

# --- FastAPI & Dépendances ---
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, EmailStr

# --- Authentification ---
from passlib.context import CryptContext
from jose import JWTError, jwt

# =============================================================================
# CONFIGURATION
# =============================================================================

# Clé secrète pour signer les JWT (EN PRODUCTION: utiliser une variable d'env!)
SECRET_KEY = "veil-super-secret-key-change-this-in-production"
ALGORITHM = "HS256"  # Algorithme de signature JWT
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # Durée de vie du token

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
    auth_hash: str  # Hash de la clé d'authentification (côté client)


class UserLogin(BaseModel):
    """Données reçues lors de la connexion."""
    email: EmailStr
    auth_hash: str


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
    file_name: str
    iv: str  # IV utilisé pour le chiffrement côté client
    size: int


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


def get_current_user(token: str) -> dict:
    """
    Extrait l'utilisateur du token JWT.
    
    Appelé à chaque requête protégée pour vérifier que l'utilisateur
    est bien authentifié.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token invalide")
        return {"user_id": user_id}
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalide ou expiré")


# =============================================================================
# APPLICATION FASTAPI
# =============================================================================

app = FastAPI(
    title="🔒 VEIL API",
    description="Zero-Knowledge Cloud Storage - Le serveur ne voit jamais vos données !",
    version="1.0.0"
)

# Configuration CORS (permet au frontend de communiquer avec l'API)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # URLs du frontend
    allow_credentials=True,
    allow_methods=["*"],  # GET, POST, PUT, DELETE, etc.
    allow_headers=["*"],  # Authorization, Content-Type, etc.
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
    # Vérifier si l'utilisateur existe déjà
    if user.email in users_db:
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
    # Chercher l'utilisateur
    if user.email not in users_db:
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    
    db_user = users_db[user.email]
    
    # Vérifier l'auth_hash
    if not verify_password(user.auth_hash, db_user["auth_hash"]):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    
    # Créer le token JWT
    access_token = create_access_token(
        data={"sub": db_user["id"]},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return Token(access_token=access_token, user_id=db_user["id"])


# =============================================================================
# ROUTES - FICHIERS
# =============================================================================

@app.get("/api/files", response_model=list[FileMetadata])
async def list_files(token: str):
    """
    📂 LISTE DES FICHIERS
    
    Retourne les métadonnées des fichiers de l'utilisateur.
    Le contenu des fichiers n'est PAS retourné ici (trop lourd).
    
    Note: L'IV (vecteur d'initialisation) est nécessaire pour déchiffrer.
    Il est stocké en clair car il n'a pas besoin d'être secret.
    """
    user = get_current_user(token)
    user_files = files_db.get(user["user_id"], [])
    return user_files


@app.post("/api/files/upload")
async def upload_file(
    token: str = Form(...),
    file_name: str = Form(...),
    iv: str = Form(...),  # IV en base64
    file: UploadFile = File(...)
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
    user = get_current_user(token)
    user_id = user["user_id"]
    
    # Générer un ID unique pour le fichier
    file_id = str(uuid.uuid4())
    
    # Chemin de stockage: storage/<user_id>/<file_id>
    file_path = STORAGE_DIR / user_id / file_id
    
    # Lire le contenu chiffré et le sauvegarder
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
    
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
    
    return {"message": "Fichier uploadé avec succès", "file_id": file_id}


@app.get("/api/files/{file_id}")
async def download_file(file_id: str, token: str):
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
    user = get_current_user(token)
    user_id = user["user_id"]
    
    # Vérifier que le fichier appartient à l'utilisateur
    user_files = files_db.get(user_id, [])
    file_meta = next((f for f in user_files if f["id"] == file_id), None)
    
    if not file_meta:
        raise HTTPException(status_code=404, detail="Fichier non trouvé")
    
    # Chemin du fichier chiffré
    file_path = STORAGE_DIR / user_id / file_id
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Fichier non trouvé sur le disque")
    
    # Retourner le fichier chiffré avec ses métadonnées
    return FileResponse(
        path=file_path,
        filename=f"{file_meta['name']}.encrypted",
        headers={
            "X-File-IV": file_meta["iv"],  # IV nécessaire pour déchiffrer
            "X-File-Name": file_meta["name"]
        }
    )


@app.delete("/api/files/{file_id}")
async def delete_file(file_id: str, token: str):
    """
    🗑️ SUPPRESSION D'UN FICHIER
    
    Supprime le fichier chiffré et ses métadonnées.
    """
    user = get_current_user(token)
    user_id = user["user_id"]
    
    # Trouver et supprimer les métadonnées
    user_files = files_db.get(user_id, [])
    file_meta = next((f for f in user_files if f["id"] == file_id), None)
    
    if not file_meta:
        raise HTTPException(status_code=404, detail="Fichier non trouvé")
    
    # Supprimer le fichier physique
    file_path = STORAGE_DIR / user_id / file_id
    if file_path.exists():
        os.remove(file_path)
    
    # Supprimer les métadonnées
    files_db[user_id] = [f for f in user_files if f["id"] != file_id]
    
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
