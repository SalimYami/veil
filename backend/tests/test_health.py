"""
Tests — /health endpoint and API root.
"""


def test_health_returns_200(client):
    """Health endpoint must respond 200."""
    response = client.get("/health")
    assert response.status_code == 200


def test_health_json_structure(client):
    """Health response must contain required fields."""
    response = client.get("/health")
    data = response.json()
    assert "status" in data
    assert "database" in data
    assert "version" in data


def test_health_version(client):
    """Version must be set."""
    response = client.get("/health")
    data = response.json()
    assert data["version"] == "2.0.0"


def test_docs_available(client):
    """OpenAPI docs must be accessible."""
    response = client.get("/docs")
    assert response.status_code == 200


def test_openapi_schema(client):
    """OpenAPI schema endpoint must return valid JSON."""
    response = client.get("/openapi.json")
    assert response.status_code == 200
    schema = response.json()
    assert "info" in schema
    assert schema["info"]["title"] == "🔒 VEIL API"
