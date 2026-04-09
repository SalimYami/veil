"""
=============================================================================
VEIL Configuration — Fail-Fast Pattern
=============================================================================

L'application REFUSE de démarrer si les secrets critiques sont absents.
Plus aucun fallback par défaut : si .env est incomplet, Pydantic lève
une ValidationError immédiate au démarrage.

=============================================================================
"""

from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """
    Tous les champs sans valeur par défaut sont OBLIGATOIRES.
    Si absents du .env ou des variables d'environnement, l'app crash.
    """

    # --- Secrets (AUCUN FALLBACK — Fail-Fast) ---
    VEIL_SECRET_KEY: str = Field(..., min_length=32)
    VEIL_REFRESH_SECRET_KEY: str = Field(..., min_length=32)
    VEIL_ADMIN_KEY: str = Field(..., min_length=8)

    # --- HMAC pour fake-salt anti-énumération ---
    SALT_HMAC_SECRET: str = Field(..., min_length=32)

    # --- Database ---
    DATABASE_URL: str = Field(..., description="PostgreSQL connection string")

    # --- MinIO ---
    MINIO_ENDPOINT: str = "veil-storage:9000"
    MINIO_ACCESS_KEY: str = Field(...)
    MINIO_SECRET_KEY: str = Field(...)
    MINIO_BUCKET: str = "veil-storage"
    MINIO_EXTERNAL_ENDPOINT: str = "http://127.0.0.1:9999"
    MINIO_SECURE: bool = False
    MINIO_REGION: str = "us-east-1"

    # --- Rate Limiting (Redis) ---
    REDIS_URL: str = "redis://veil-redis:6379/0"

    # --- Application ---
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    MAX_FILE_SIZE: int = 100 * 1024 * 1024  # 100 MB
    MAX_FILES_PER_USER: int = 1000
    VEIL_ALLOWED_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    model_config = {"env_file": ".env", "case_sensitive": True}


# Instanciation immédiate — crash ici si .env incomplet
settings = Settings()
