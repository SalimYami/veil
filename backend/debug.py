import os
import sys
from fastapi.testclient import TestClient

os.environ.update({
    "DATABASE_URL": "sqlite:///./test_veil2.db",
    "VEIL_SECRET_KEY": "test-secret-key-for-pytest-only-32chars!!",
    "VEIL_REFRESH_SECRET_KEY": "test-refresh-key-for-pytest-32chars!!",
    "VEIL_ADMIN_KEY": "test-admin-key",
    "MINIO_ENDPOINT": "localhost:9000",
    "MINIO_EXTERNAL_ENDPOINT": "http://localhost:9000",
    "MINIO_ACCESS_KEY": "minioadmin",
    "MINIO_SECRET_KEY": "minioadmin",
    "MINIO_BUCKET": "veil-test",
    "VEIL_ALLOWED_ORIGINS": "http://localhost",
    "MAX_FILE_SIZE": "104857600",
})

# Mock Minio as in conftest.py
from unittest.mock import MagicMock, patch
with patch("storage.minio_client.MinIOClient") as MockMinio:
    MockMinio.return_value = MagicMock()
    MockMinio.return_value.initialize_bucket.return_value = True
    
    from main import app
    from database.connection import Base, get_engine
    
    try:
        Base.metadata.create_all(bind=get_engine())
    except Exception as e:
        print("DB CREATE ERROR:", e)

    client = TestClient(app)
    resp = client.post("/api/auth/register", json={
        "email": "test@salimyami.dev",
        "auth_hash": "a" * 64
    })
    print("STATUS:", resp.status_code)
    print("BODY:", resp.text)
