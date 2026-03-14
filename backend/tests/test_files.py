import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
import uuid
from datetime import datetime

# We'll patch minio_client in file_service
@pytest.fixture
def mock_minio():
    with patch("main.file_service.minio_client") as mock:
        yield mock

@pytest.fixture
def mock_minio_ext():
    with patch("main.file_service.minio_client_external") as mock:
        yield mock

def test_upload_initiate(authorized_client):
    response = authorized_client.post(
        "/api/files/upload-init",
        json={
            "file_name": "test.txt",
            "file_size": 1024,
            "iv": "1234567890123456",
            "auth_tag": "1234567890123456",
            "mime_type": "text/plain"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert "file_id" in data
    assert "upload_url" in data
    assert data["file_id"] is not None

def test_upload_confirm(authorized_client, mock_minio):
    # First initiate to get a file_id
    init_resp = authorized_client.post(
        "/api/files/upload-init",
        json={
            "file_name": "test_confirm.txt",
            "file_size": 1024,
            "iv": "1234567890123456",
            "auth_tag": "1234567890123456"
        }
    )
    file_id = init_resp.json()["file_id"]
    
    # Mock minio to say file exists
    mock_minio.object_exists.return_value = True
    
    response = authorized_client.post(
        "/api/files/upload-confirm",
        json={"file_id": file_id}
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Upload confirmed successfully"

def test_list_files(authorized_client, mock_minio):
    # Confirm a file first
    init_resp = authorized_client.post(
        "/api/files/upload-init",
        json={
            "file_name": "list_test.txt",
            "file_size": 1024,
            "iv": "1234567890123456",
            "auth_tag": "1234567890123456"
        }
    )
    file_id = init_resp.json()["file_id"]
    mock_minio.object_exists.return_value = True
    authorized_client.post("/api/files/upload-confirm", json={"file_id": file_id})
    
    response = authorized_client.get("/api/files")
    assert response.status_code == 200
    files = response.json()
    assert len(files) >= 1
    assert any(f["id"] == file_id for f in files)

def test_download_file(authorized_client, mock_minio, mock_minio_ext):
    # Confirm a file first
    init_resp = authorized_client.post(
        "/api/files/upload-init",
        json={
            "file_name": "download_test.txt",
            "file_size": 1024,
            "iv": "1234567890123456",
            "auth_tag": "1234567890123456"
        }
    )
    file_id = init_resp.json()["file_id"]
    mock_minio.object_exists.return_value = True
    authorized_client.post("/api/files/upload-confirm", json={"file_id": file_id})
    
    # Mock generate_download_url on external client
    mock_minio_ext.generate_download_url.return_value = "http://mock-download-url"
    
    response = authorized_client.get(f"/api/files/{file_id}")
    assert response.status_code == 200
    assert response.json()["download_url"] == "http://mock-download-url"

def test_delete_file(authorized_client, mock_minio):
    # Confirm a file first
    init_resp = authorized_client.post(
        "/api/files/upload-init",
        json={
            "file_name": "delete_test.txt",
            "file_size": 1024,
            "iv": "1234567890123456",
            "auth_tag": "1234567890123456"
        }
    )
    file_id = init_resp.json()["file_id"]
    mock_minio.object_exists.return_value = True
    authorized_client.post("/api/files/upload-confirm", json={"file_id": file_id})
    
    response = authorized_client.delete(f"/api/files/{file_id}")
    assert response.status_code == 200
    assert response.json()["message"] == "File deleted successfully"
    
    # Verify it's gone from list
    list_resp = authorized_client.get("/api/files")
    assert not any(f["id"] == file_id for f in list_resp.json())

def test_update_tags(authorized_client, mock_minio):
    # Confirm a file first
    init_resp = authorized_client.post(
        "/api/files/upload-init",
        json={
            "file_name": "tags_test.txt",
            "file_size": 1024,
            "iv": "1234567890123456",
            "auth_tag": "1234567890123456"
        }
    )
    file_id = init_resp.json()["file_id"]
    mock_minio.object_exists.return_value = True
    authorized_client.post("/api/files/upload-confirm", json={"file_id": file_id})
    
    response = authorized_client.put(
        f"/api/files/{file_id}/tags",
        json={"tags": ["urgent", "secret"]}
    )
    assert response.status_code == 200
    
    # Verify tags updated
    list_resp = authorized_client.get("/api/files")
    file_meta = next(f for f in list_resp.json() if f["id"] == file_id)
    assert "urgent" in file_meta["tags"]
    assert "secret" in file_meta["tags"]

def test_search_files(authorized_client, mock_minio, mock_minio_ext):
    # Create a unique file to search for
    name = f"search_{uuid.uuid4()}.txt"
    init_resp = authorized_client.post(
        "/api/files/upload-init",
        json={
            "file_name": name,
            "file_size": 1024,
            "iv": "1234567890123456",
            "auth_tag": "1234567890123456"
        }
    )
    file_id = init_resp.json()["file_id"]
    mock_minio.object_exists.return_value = True
    authorized_client.post("/api/files/upload-confirm", json={"file_id": file_id})
    
    # Mock generate_download_url on the external client
    mock_minio_ext.generate_download_url.return_value = "http://mock-download-url"
    
    response = authorized_client.get(f"/api/files/search?q={name}")
    assert response.status_code == 200
    results = response.json()["results"]
    assert len(results) >= 1
    assert results[0]["name"] == name

def test_get_stats(authorized_client):
    response = authorized_client.get("/api/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_files" in data
    assert "total_size_bytes" in data

def test_get_activity(authorized_client):
    response = authorized_client.get("/api/activity")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
