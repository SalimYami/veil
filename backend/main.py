"""
=============================================================================
VEIL Backend - API Zero-Knowledge Storage with PostgreSQL + MinIO
=============================================================================

🔒 ARCHITECTURE ZERO-KNOWLEDGE:
-------------------------------
Le serveur ne voit JAMAIS les données en clair !

1. L'utilisateur entre son mot de passe dans le navigateur
2. Le navigateur dérive 2 clés avec Argon2:
   - authKey: envoyée au serveur (hashée) pour s'authentifier
   - encryptionKey: JAMAIS envoyée, reste dans le navigateur
3. Les fichiers sont chiffrés côté client AVANT l'upload
4. Le serveur génère des presigned URLs pour upload/download direct vers MinIO
5. MinIO stocke uniquement des blobs chiffrés (illisibles sans la clé)

🗄️ PERSISTENCE:
---------------
- PostgreSQL: métadonnées uniquement (users, files, tokens, activity)
- MinIO: blobs chiffrés uniquement
- Backend: JAMAIS de clés de chiffrement, JAMAIS de données en clair

=============================================================================
"""

import os
import uuid
import hmac
import hashlib
import logging
import time
import traceback
from datetime import datetime
from typing import Optional, List
from contextlib import asynccontextmanager

# --- FastAPI & Dependencies ---
from fastapi import FastAPI, HTTPException, Depends, Header, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict
from starlette.middleware.base import BaseHTTPMiddleware
from jose import JWTError, jwt

# --- Database & Services ---
from database.connection import init_db, get_db, health_check, Base, get_engine
from database.models import User, File
from repositories.user_repository import UserRepository
from repositories.file_repository import FileRepository
from repositories.activity_repository import ActivityRepository
from storage.minio_client import MinIOClient
from services.auth_service import AuthService
from services.file_service import FileService
from sqlalchemy import func

# --- Configuration Fail-Fast ---
from config import settings

# --- Rate Limiting ---
from middleware.rate_limiter import RateLimitMiddleware

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
    """Middleware pour logger toutes les requêtes HTTP."""
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        logger.info(f"→ {request.method} {request.url.path}")
        
        response = await call_next(request)
        
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        
        logger.info(
            f"← {request.method} {request.url.path} "
            f"[{response.status_code}] {process_time:.3f}s"
        )
        
        return response


# =============================================================================
# CONFIGURATION (Fail-Fast via Pydantic — voir config.py)
# =============================================================================
# Toutes les valeurs viennent de `settings` (config.py).
# L'app crash au démarrage si un secret est absent du .env.

SECRET_KEY = settings.VEIL_SECRET_KEY
REFRESH_SECRET_KEY = settings.VEIL_REFRESH_SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
REFRESH_TOKEN_EXPIRE_DAYS = settings.REFRESH_TOKEN_EXPIRE_DAYS

ADMIN_KEY = settings.VEIL_ADMIN_KEY
DATABASE_URL = settings.DATABASE_URL

MINIO_ENDPOINT = settings.MINIO_ENDPOINT
MINIO_ACCESS_KEY = settings.MINIO_ACCESS_KEY
MINIO_SECRET_KEY = settings.MINIO_SECRET_KEY
MINIO_BUCKET = settings.MINIO_BUCKET
MINIO_EXTERNAL_ENDPOINT = settings.MINIO_EXTERNAL_ENDPOINT
MINIO_SECURE = settings.MINIO_SECURE

MAX_FILE_SIZE = settings.MAX_FILE_SIZE
MAX_FILES_PER_USER = settings.MAX_FILES_PER_USER


# =============================================================================
# INITIALIZE SERVICES
# =============================================================================

# Initialize database
logger.info("Initializing database connection...")
try:
    init_db(DATABASE_URL)
    logger.info("✅ Database initialized successfully")
    
    # Create tables if using SQLite (for smoke tests)
    if DATABASE_URL.startswith("sqlite"):
        Base.metadata.create_all(bind=get_engine())
        logger.info("✅ SQLite tables created/verified")
except Exception as e:
    logger.error(f"❌ Failed to initialize database: {str(e)}")
    logger.error(traceback.format_exc())
    # On ne raise pas forcément ici pour permettre au healthcheck de montrer l'erreur
    # Mais FastAPI s'arrêtera probablement au premier appel DB

# Initialize MinIO
logger.info("Initializing MinIO clients...")
try:
    minio_region = settings.MINIO_REGION
    
    # Internal client (for backend-to-storage ops)
    minio_client = MinIOClient(
        endpoint=MINIO_ENDPOINT,
        access_key=MINIO_ACCESS_KEY,
        secret_key=MINIO_SECRET_KEY,
        secure=MINIO_SECURE,
        region=minio_region
    )

    # External client (for presigned URLs generated with localhost)
    ext_endpoint = MINIO_EXTERNAL_ENDPOINT.replace("http://", "").replace("https://", "").split("/")[0]
    minio_client_external = MinIOClient(
        endpoint=ext_endpoint,
        access_key=MINIO_ACCESS_KEY,
        secret_key=MINIO_SECRET_KEY,
        secure=MINIO_EXTERNAL_ENDPOINT.startswith("https"),
        region=minio_region
    )

    minio_client.initialize_bucket(MINIO_BUCKET)
    logger.info(f"✅ MinIO initialized successfully (region: {minio_region})")
except Exception as e:
    logger.error(f"❌ Failed to initialize MinIO: {str(e)}")
    logger.error(traceback.format_exc())

# Initialize services
try:
    auth_service = AuthService(
        secret_key=SECRET_KEY,
        refresh_secret_key=REFRESH_SECRET_KEY,
        algorithm=ALGORITHM,
        access_token_expire_minutes=ACCESS_TOKEN_EXPIRE_MINUTES,
        refresh_token_expire_days=REFRESH_TOKEN_EXPIRE_DAYS
    )

    file_service = FileService(
        minio_client=minio_client,
        minio_client_external=minio_client_external,
        bucket_name=MINIO_BUCKET,
        max_files_per_user=MAX_FILES_PER_USER
    )
    logger.info("✅ All services initialized successfully")
except Exception as e:
    logger.error(f"❌ Failed to initialize services: {str(e)}")


# =============================================================================
# PYDANTIC MODELS
# =============================================================================

class UserRegister(BaseModel):
    """User registration request."""
    email: EmailStr
    auth_hash: str = Field(..., min_length=64, max_length=128)
    
    @field_validator('auth_hash')
    @classmethod
    def validate_hash(cls, v):
        if not all(c in '0123456789abcdefABCDEF' for c in v):
            raise ValueError("auth_hash must be a valid hexadecimal hash")
        return v.lower()


class UserLogin(BaseModel):
    """User login request."""
    email: EmailStr
    auth_hash: str = Field(..., min_length=64, max_length=128)
    
    @field_validator('auth_hash')
    @classmethod
    def validate_hash(cls, v):
        if not all(c in '0123456789abcdefABCDEF' for c in v):
            raise ValueError("auth_hash must be a valid hexadecimal hash")
        return v.lower()


class AdminPromotion(BaseModel):
    """Admin promotion request."""
    secret_key: str


class Token(BaseModel):
    """JWT token response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: uuid.UUID
    role: str = "user"
    expires_in: int
    salt: Optional[str] = None  # Uniquement retourné lors de l'inscription


class RefreshTokenRequest(BaseModel):
    """Refresh token request."""
    refresh_token: str


class UploadInitRequest(BaseModel):
    """Upload initialization request."""
    file_name: str = Field(..., min_length=1, max_length=255)
    iv: str = Field(..., min_length=16)
    auth_tag: str = Field(..., min_length=16)
    file_size: int = Field(..., ge=0, le=MAX_FILE_SIZE)
    mime_type: Optional[str] = None
    
    @field_validator('file_name')
    @classmethod
    def validate_filename(cls, v):
        forbidden = ['/', '\\', '..', '\0']
        if any(char in v for char in forbidden):
            raise ValueError("Invalid filename")
        return v


class UploadConfirmRequest(BaseModel):
    """Upload confirmation request."""
    file_id: str


class FileMetadata(BaseModel):
    """File metadata response."""
    id: uuid.UUID
    name: str
    iv: str
    auth_tag: str
    size: int
    mime_type: Optional[str] = None
    tags: List[str] = []
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TagUpdate(BaseModel):
    """Tag update request."""
    tags: list = Field(..., max_length=20)


class ActivityEntry(BaseModel):
    """Activity log entry."""
    action: str
    file_name: str
    file_id: Optional[str]
    timestamp: datetime
    details: str = ""


class UserStats(BaseModel):
    """User statistics."""
    total_files: int
    total_size_bytes: int
    total_size_mb: float
    oldest_file: Optional[datetime] = None
    newest_file: Optional[datetime] = None
    average_file_size_mb: float


# =============================================================================
# AUTHENTICATION DEPENDENCY
# =============================================================================

def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """Extract user from JWT token."""
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization header missing",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication scheme",
                headers={"WWW-Authenticate": "Bearer"}
            )
    except ValueError:
        raise HTTPException(
            status_code=401,
            detail="Invalid Authorization header format",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        # Get user from database
        with get_db() as db:
            try:
                uid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
                user = UserRepository.get_user_by_id(db, uid)
            except ValueError:
                raise HTTPException(
                    status_code=401,
                    detail="Invalid token subject",
                    headers={"WWW-Authenticate": "Bearer"}
                )
            if not user:
                raise HTTPException(
                    status_code=401,
                    detail="User not found",
                    headers={"WWW-Authenticate": "Bearer"}
                )
            
            return {
                "id": user.id,
                "email": user.email,
                "role": user.role
            }
    
    except JWTError as e:
        logger.warning(f"JWT error: {str(e)}")
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"}
        )


def get_admin_user(current_user: dict = Depends(get_current_user)):
    """Verify user is admin."""
    if current_user.get("role") != "admin":
        logger.warning(f"Admin access denied for: {current_user.get('email', 'N/A')}")
        raise HTTPException(
            status_code=403,
            detail="Admin privileges required"
        )
    return current_user


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle events for the application."""
    # Startup
    logger.info("🚀 VEIL API starting up...")
    logger.info(f"📊 Database: {DATABASE_URL.split('@')[-1]}")
    logger.info(f"💾 MinIO: {MINIO_ENDPOINT} (bucket: {MINIO_BUCKET})")
    logger.info("✅ Application ready")
    
    yield
    
    # Shutdown
    logger.info("👋 VEIL API shutting down...")
    from database.connection import close_db
    close_db()
    logger.info("✅ Shutdown complete")


# =============================================================================
# FASTAPI APPLICATION
# =============================================================================

app = FastAPI(
    title="🔒 VEIL API",
    description="""
    # Zero-Knowledge Cloud Storage with PostgreSQL + MinIO
    
    VEIL est un système de stockage cloud **zero-knowledge** où le serveur ne voit JAMAIS vos données en clair.
    
    ## 🔐 Sécurité
    
    - **Chiffrement côté client** : AES-256-GCM dans le navigateur
    - **Dérivation de clés** : Argon2 pour dériver authKey + encryptionKey
    - **Presigned URLs** : Upload/download direct vers MinIO (bypass backend)
    - **PostgreSQL** : Métadonnées uniquement (NO plaintext, NO keys)
    - **MinIO** : Blobs chiffrés uniquement
    
    ## 🚀 Flux d'Upload
    
    1. Frontend chiffre le fichier
    2. Frontend demande une presigned URL au backend
    3. Backend génère l'URL et stocke les métadonnées (status='pending')
    4. Frontend upload directement vers MinIO
    5. Frontend confirme l'upload au backend (status='uploaded')
    
    ⚠️ **Important** : Si vous perdez votre mot de passe, vos fichiers sont DÉFINITIVEMENT perdus !
    """,
    version="2.0.0",
    contact={
        "name": "VEIL Support",
        "url": "https://github.com/yourusername/veil",
    },
    license_info={
        "name": "MIT",
    },
    lifespan=lifespan
)

# ═══════════════════════════════════════════════════════════════════════════
# EXCEPTION HANDLER GLOBAL (AVEC HEADERS CORS)
# ═══════════════════════════════════════════════════════════════════════════

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Gère toutes les exceptions non catchées avec headers CORS.
    PRODUCTION: Renvoie uniquement un trace_id au client.
    Le traceback complet est loggué côté serveur avec le même trace_id.
    """
    import uuid as _uuid
    trace_id = str(_uuid.uuid4())[:8]  # Court et mémorisable

    if isinstance(exc, HTTPException):
        # HTTPException = erreurs "voulues" → renvoyer normalement
        status_code = exc.status_code
        detail = exc.detail
    else:
        # Erreur inattendue → masquer le détail, logger le traceback
        status_code = 500
        detail = f"Internal server error [ref: {trace_id}]"
        logger.critical(
            f"❌ UNHANDLED [{trace_id}] {request.method} {request.url.path}\n"
            f"   Error: {type(exc).__name__}: {str(exc)}\n"
            f"   Traceback:\n{traceback.format_exc()}"
        )

    # Récupérer l'origine autorisée si possible
    origin = request.headers.get("origin")
    allowed_origin = origin if origin in allowed_origins else "*"

    # Retourner avec headers CORS explicites
    return JSONResponse(
        status_code=status_code,
        content={"detail": detail, "trace_id": trace_id},
        headers={
            "Access-Control-Allow-Origin": allowed_origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        }
    )

# Add middleware (ordre important : CORS en dernier = exécuté en premier)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(RateLimitMiddleware)

# CORS configuration
allowed_origins = settings.VEIL_ALLOWED_ORIGINS.split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    expose_headers=["X-Process-Time", "Retry-After"]
)


# =============================================================================
# HEALTH CHECK
# =============================================================================

@app.get("/health", tags=["Health"])
async def health():
    """Health check endpoint."""
    db_healthy = health_check()
    
    return {
        "status": "healthy" if db_healthy else "unhealthy",
        "database": "connected" if db_healthy else "disconnected",
        "version": "2.0.0"
    }


# =============================================================================
# AUTHENTICATION ROUTES
# =============================================================================

@app.post(
    "/api/auth/register",
    response_model=Token,
    status_code=status.HTTP_201_CREATED,
    tags=["Authentication"]
)
async def register(user: UserRegister):
    """Register a new user."""
    logger.info(f"📝 Registration attempt for: {user.email}")
    try:
        token_data = auth_service.register_user(user.email, user.auth_hash)
        logger.info(f"✅ User registered successfully: {user.email}")
        return Token(**token_data)
    except ValueError as e:
        logger.warning(f"❌ Registration failed for {user.email}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"❌ Unexpected error during registration: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post(
    "/api/auth/login",
    response_model=Token,
    tags=["Authentication"]
)
async def login(user: UserLogin):
    """Login user."""
    try:
        token_data = auth_service.login_user(user.email, user.auth_hash)
        return Token(**token_data)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@app.get(
    "/api/auth/salt",
    tags=["Authentication"]
)
async def get_salt(email: str):
    """
    Pre-flight salt retrieval (anti-énumération).
    
    Retourne TOUJOURS un sel, même si l'utilisateur n'existe pas.
    Pour un utilisateur réel : sel unique stocké en DB.
    Pour un utilisateur inexistant : faux sel déterministe via HMAC.
    
    Un attaquant ne peut pas distinguer un vrai sel d'un faux.
    """
    with get_db() as db:
        user = UserRepository.get_user_by_email(db, email)

        if user and hasattr(user, 'salt') and user.salt:
            # Utilisateur réel → sel cryptographique stocké en DB
            salt_hex = user.salt
        else:
            # Utilisateur inexistant (ou legacy sans sel)
            # → Faux sel déterministe via HMAC-SHA256(server_secret, email)
            # Le même email produit toujours le même faux sel
            salt_hex = hmac.new(
                settings.SALT_HMAC_SECRET.encode(),
                email.lower().encode(),
                hashlib.sha256
            ).hexdigest()[:32]  # 16 bytes en hex

    return {"salt": salt_hex}


@app.post(
    "/api/auth/refresh",
    response_model=Token,
    tags=["Authentication"]
)
async def refresh_token(request: RefreshTokenRequest):
    """Refresh access token."""
    try:
        token_data = auth_service.refresh_access_token(request.refresh_token)
        return Token(**token_data)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@app.post(
    "/api/auth/logout",
    tags=["Authentication"]
)
async def logout(user: dict = Depends(get_current_user)):
    """Logout user (revoke all refresh tokens)."""
    auth_service.logout_user(user["id"])
    return {"message": "Logged out successfully"}


@app.post(
    "/api/auth/promote-admin",
    tags=["Authentication"]
)
async def promote_admin(
    request: AdminPromotion,
    user: dict = Depends(get_current_user)
):
    """Promote user to admin."""
    try:
        success = auth_service.promote_to_admin(user["id"], request.secret_key, ADMIN_KEY)
        if success:
            return {"message": "Promoted to admin successfully", "role": "admin"}
        else:
            raise HTTPException(status_code=404, detail="User not found")
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))


# =============================================================================
# FILE ROUTES
# =============================================================================

@app.get(
    "/api/files",
    response_model=List[FileMetadata],
    tags=["Files"]
)
async def list_files(user: dict = Depends(get_current_user)):
    """List all user files."""
    with get_db() as db:
        files = FileRepository.get_user_files(db, user["id"])
        return [
            FileMetadata(
                id=str(f.id),
                name=f.file_name,
                iv=f.iv,
                auth_tag=f.auth_tag,
                size=f.file_size,
                mime_type=f.mime_type,
                tags=f.tags or [],
                created_at=f.created_at
            )
            for f in files
        ]


@app.post(
    "/api/files/upload-init",
    status_code=status.HTTP_201_CREATED,
    tags=["Files"]
)
async def upload_init(
    request: UploadInitRequest,
    user: dict = Depends(get_current_user)
):
    """
    Initialize file upload (generate presigned URL).
    
    Returns presigned URL for direct upload to MinIO.
    """
    try:
        result = file_service.initiate_upload(
            user_id=user["id"],
            file_name=request.file_name,
            iv=request.iv,
            auth_tag=request.auth_tag,
            file_size=request.file_size,
            mime_type=request.mime_type
        )
        return result
    except Exception as e:
        logger.error(f"Error in upload_init: {str(e)}")
        logger.error(traceback.format_exc())
        if isinstance(e, ValueError):
            raise HTTPException(status_code=400, detail=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post(
    "/api/files/upload-confirm",
    tags=["Files"]
)
async def upload_confirm(
    request: UploadConfirmRequest,
    user: dict = Depends(get_current_user)
):
    """Confirm file upload after client uploads to MinIO."""
    try:
        file_service.confirm_upload(user["id"], request.file_id)
        return {"message": "Upload confirmed successfully", "file_id": request.file_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get(
    "/api/files/search",
    tags=["Files"]
)
async def search_files(
    q: str = "",
    user: dict = Depends(get_current_user)
):
    """Search files by name."""
    with get_db() as db:
        files = FileRepository.search_files(db, user["id"], q, limit=10)
        return {
            "results": [
                {
                    "id": str(f.id),
                    "name": f.file_name,
                    "iv": f.iv,
                    "auth_tag": f.auth_tag,
                    "size": f.file_size,
                    "mime_type": f.mime_type,
                    "tags": f.tags or [],
                    "created_at": f.created_at.isoformat()
                }
                for f in files
            ],
            "query": q
        }


@app.get(
    "/api/files/{file_id}",
    tags=["Files"]
)
async def download_file(
    file_id: str,
    user: dict = Depends(get_current_user)
):
    """
    Get download URL for file.
    
    Returns presigned URL for direct download from MinIO.
    """
    try:
        result = file_service.get_download_url(user["id"], file_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.delete(
    "/api/files/{file_id}",
    tags=["Files"]
)
async def delete_file(
    file_id: str,
    user: dict = Depends(get_current_user)
):
    """Delete file."""
    try:
        file_service.delete_file(user["id"], file_id)
        return {"message": "File deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.put(
    "/api/files/{file_id}/tags",
    tags=["Files"]
)
async def update_tags(
    file_id: str,
    request: TagUpdate,
    user: dict = Depends(get_current_user)
):
    """Update file tags."""
    try:
        file_service.update_file_tags(user["id"], file_id, request.tags)
        return {"message": "Tags updated successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))





@app.get(
    "/api/stats",
    response_model=UserStats,
    tags=["Files"]
)
async def get_stats(user: dict = Depends(get_current_user)):
    """Get user statistics."""
    with get_db() as db:
        files = FileRepository.get_user_files(db, user["id"])
        
        if not files:
            return UserStats(
                total_files=0,
                total_size_bytes=0,
                total_size_mb=0.0,
                oldest_file=None,
                newest_file=None,
                average_file_size_mb=0.0
            )
        
        total_size = sum(f.file_size for f in files)
        dates = [f.created_at for f in files]
        
        return UserStats(
            total_files=len(files),
            total_size_bytes=total_size,
            total_size_mb=round(total_size / (1024 * 1024), 2),
            oldest_file=min(dates),
            newest_file=max(dates),
            average_file_size_mb=round((total_size / len(files)) / (1024 * 1024), 2)
        )


@app.get(
    "/api/activity",
    response_model=List[ActivityEntry],
    tags=["Files"]
)
async def get_activity(user: dict = Depends(get_current_user)):
    """Get user activity log."""
    with get_db() as db:
        activities = ActivityRepository.get_user_activity(db, user["id"], limit=100)
        return [
            ActivityEntry(
                action=a.action,
                file_name=a.file_name,
                file_id=str(a.file_id) if a.file_id else None,
                timestamp=a.timestamp,
                details=a.details or ""
            )
            for a in activities
        ]


# =============================================================================
# ADMIN ROUTES
# =============================================================================

@app.get(
    "/api/admin/users",
    tags=["Admin"]
)
async def list_users(admin: dict = Depends(get_admin_user)):
    """List all users (admin only)."""
    with get_db() as db:
        users = db.query(User).all()
        return [
            {
                "id": str(u.id),
                "email": u.email,
                "role": u.role,
                "created_at": u.created_at.isoformat()
            }
            for u in users
        ]


@app.get(
    "/api/admin/stats",
    tags=["Admin"]
)
async def admin_stats(admin: dict = Depends(get_admin_user)):
    """Get global statistics (admin only)."""
    with get_db() as db:
        total_users = db.query(User).count()
        total_files = db.query(File).filter(File.status == "uploaded").count()
        total_size = db.query(func.sum(File.file_size)).filter(File.status == "uploaded").scalar() or 0
        
        return {
            "total_users": total_users,
            "total_files": total_files,
            "total_size_bytes": total_size,
            "total_size_mb": round(total_size / (1024 * 1024), 2)
        }


# =============================================================================
# ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
