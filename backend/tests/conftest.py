"""
Pytest configuration and fixtures for VEIL backend tests.
Uses SQLite in-memory DB to avoid requiring a real PostgreSQL instance.
"""
import os
import pytest
from fastapi.testclient import TestClient

# ── Override environment before importing main ─────────────────────────────
os.environ.update({
    "DATABASE_URL": "sqlite:///./test_veil.db",
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


@pytest.fixture(scope="module")
def client():
    """
    FastAPI test client with mocked MinIO.
    MinIO errors are expected in test env — API routes still return correct HTTP codes.
    """
    from unittest.mock import MagicMock, patch

    with patch("storage.minio_client.MinIOClient") as MockMinio:
        MockMinio.return_value = MagicMock()
        MockMinio.return_value.initialize_bucket.return_value = True
        MockMinio.return_value.generate_presigned_put_url.return_value = (
            "http://localhost:9000/veil-test/fake-key?X-Amz-Signature=fake"
        )
        MockMinio.return_value.generate_presigned_get_url.return_value = (
            "http://localhost:9000/veil-test/fake-key?X-Amz-Signature=fake"
        )
        MockMinio.return_value.delete_object.return_value = True

        from main import app
        with TestClient(app) as c:
            yield c


@pytest.fixture(scope="module")
def registered_user(client):
    """Register a test user and return the token data."""
    response = client.post("/api/auth/register", json={
        "email": "test@salimyami.dev",
        # Simulate a valid hex auth_hash (64 chars = SHA-256)
        "auth_hash": "a" * 64
    })
    # User might already exist on repeated runs
    if response.status_code in (200, 201):
        return response.json()
    # Try login instead
    response = client.post("/api/auth/login", json={
        "email": "test@salimyami.dev",
        "auth_hash": "a" * 64
    })
    return response.json()


@pytest.fixture
def auth_headers(registered_user):
    """Return Authorization headers for authenticated requests."""
    token = registered_user.get("access_token", "")
    return {"Authorization": f"Bearer {token}"}
