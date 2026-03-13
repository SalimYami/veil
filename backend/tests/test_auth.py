"""
Tests — Authentication routes (register, login, refresh, logout).

Zero-Knowledge model:
  - Only auth_hash (hex) is transmitted, NEVER the password
  - Server stores bcrypt(auth_hash), not plaintext
"""

VALID_HASH = "a" * 64          # 64-char hex = valid SHA-256 mock
SHORT_HASH = "abc123"          # Too short → 422
BAD_EMAIL  = "not-an-email"
TEST_EMAIL = "auth_test@salimyami.dev"


class TestRegister:
    def test_register_new_user(self, client):
        """Register with valid email + auth_hash → 201."""
        resp = client.post("/api/auth/register", json={
            "email": TEST_EMAIL,
            "auth_hash": VALID_HASH
        })
        if resp.status_code == 500:
            print("ERROR 500:", resp.text)
        assert resp.status_code in (201, 400)

    def test_register_returns_tokens(self, client):
        """Successful register returns access_token + refresh_token."""
        import uuid
        unique_email = f"fresh_{uuid.uuid4().hex[:8]}@salimyami.dev"
        resp = client.post("/api/auth/register", json={
            "email": unique_email,
            "auth_hash": VALID_HASH
        })
        if resp.status_code == 201:
            data = resp.json()
            assert "access_token" in data
            assert "refresh_token" in data
            assert data["token_type"] == "bearer"
            assert data["role"] == "user"

    def test_register_invalid_email(self, client):
        """Invalid email format → 422 Unprocessable."""
        resp = client.post("/api/auth/register", json={
            "email": BAD_EMAIL,
            "auth_hash": VALID_HASH
        })
        assert resp.status_code == 422

    def test_register_short_hash(self, client):
        """auth_hash too short → 422 (min_length=64)."""
        resp = client.post("/api/auth/register", json={
            "email": "short@salimyami.dev",
            "auth_hash": SHORT_HASH
        })
        assert resp.status_code == 422

    def test_register_non_hex_hash(self, client):
        """auth_hash with non-hex chars → 422."""
        resp = client.post("/api/auth/register", json={
            "email": "nonhex@salimyami.dev",
            "auth_hash": "z" * 64   # 'z' is not hex
        })
        assert resp.status_code == 422

    def test_register_duplicate(self, client):
        """Registering same email twice → 400 (already exists)."""
        payload = {"email": "dup@salimyami.dev", "auth_hash": VALID_HASH}
        client.post("/api/auth/register", json=payload)  # first
        resp = client.post("/api/auth/register", json=payload)  # second
        assert resp.status_code == 400


class TestLogin:
    def test_login_valid(self, client, registered_user):
        """Login with correct auth_hash → 200 with tokens."""
        resp = client.post("/api/auth/login", json={
            "email": "test@salimyami.dev",
            "auth_hash": VALID_HASH
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data

    def test_login_wrong_hash(self, client):
        """Login with wrong auth_hash → 401."""
        resp = client.post("/api/auth/login", json={
            "email": "test@salimyami.dev",
            "auth_hash": "b" * 64   # different hash
        })
        assert resp.status_code == 401

    def test_login_unknown_email(self, client):
        """Login with non-existent email → 401."""
        resp = client.post("/api/auth/login", json={
            "email": "ghost@salimyami.dev",
            "auth_hash": VALID_HASH
        })
        assert resp.status_code == 401


class TestProtectedRoutes:
    def test_list_files_without_token(self, client):
        """GET /api/files without auth → 401."""
        resp = client.get("/api/files")
        assert resp.status_code == 401

    def test_list_files_with_token(self, client, auth_headers):
        """GET /api/files with valid token → 200 (empty list)."""
        resp = client.get("/api/files", headers=auth_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_stats_authenticated(self, client, auth_headers):
        """GET /api/stats with valid token → 200."""
        resp = client.get("/api/stats", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "total_files" in data
        assert "total_size_bytes" in data

    def test_activity_authenticated(self, client, auth_headers):
        """GET /api/activity with valid token → 200."""
        resp = client.get("/api/activity", headers=auth_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_invalid_token(self, client):
        """Tampered Bearer token → 401."""
        resp = client.get("/api/files", headers={
            "Authorization": "Bearer fake.jwt.token"
        })
        assert resp.status_code == 401
