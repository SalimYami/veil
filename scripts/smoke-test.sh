#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════
# VEIL — Smoke Tests
# Runs curl-based health checks against the live stack.
# Usage: bash scripts/smoke-test.sh [BASE_URL]
# ═══════════════════════════════════════════════════════════
set -uxo pipefail

BASE_URL="${1:-http://localhost:8000}"
FRONTEND_URL="${2:-http://localhost:80}"
PASS=0
FAIL=0

# Use local temp directory
TMP_DIR="./.smoke_tmp"
mkdir -p "$TMP_DIR"

# Detect python command
PYTHON_CMD="python"
if ! command -v python &> /dev/null; then
    if command -v python3 &> /dev/null; then
        PYTHON_CMD="python3"
    fi
fi

# Terminal colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check() {
    local name="$1"
    local expected_code="$2"
    local actual_code="$3"
    local body="$4"

    if [[ "$actual_code" == "$expected_code" ]]; then
        echo -e "${GREEN}✅ PASS${NC} [$actual_code] $name"
        ((PASS++))
    else
        echo -e "${RED}❌ FAIL${NC} [$actual_code != $expected_code] $name"
        if [[ -n "$body" ]]; then
            echo "   Response: ${body:0:120}"
        fi
        ((FAIL++))
    fi
}

echo ""
echo -e "${YELLOW}🔒 VEIL Smoke Tests — $BASE_URL${NC}"
echo "────────────────────────────────────────────"

# ── 1. Health Check ──────────────────────────────────────────
echo "Checking API health..."
RESP=$(curl -s -o "$TMP_DIR/resp.json" -w "%{http_code}" "$BASE_URL/health" || echo "000")
BODY=$(cat "$TMP_DIR/resp.json" 2>/dev/null || echo "")
check "GET /health returns 200" "200" "$RESP" "$BODY"

# Validate JSON content
if echo "$BODY" | grep -q '"status"'; then
    STATUS=$($PYTHON_CMD -c "import sys,json; d=json.load(sys.stdin); print(d.get('status','?'))" <<< "$BODY" 2>/dev/null || echo "?")
    echo -e "   ${YELLOW}→ API Status: $STATUS${NC}"
fi

# ── 2. OpenAPI Docs ──────────────────────────────────────────
echo "Checking documentation..."
RESP=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/docs" || echo "000")
check "GET /docs (Swagger UI) returns 200" "200" "$RESP" ""

# ── 3. OpenAPI Schema ────────────────────────────────────────
echo "Checking OpenAPI schema..."
RESP=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/openapi.json" || echo "000")
check "GET /openapi.json returns 200" "200" "$RESP" ""

# ── 4. Auth Returns 401 Without Token ────────────────────────
echo "Checking unauthorized access..."
RESP=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/files" || echo "000")
check "GET /api/files without token → 401" "401" "$RESP" ""

# ── 5. Register a Test User ──────────────────────────────────
echo "Registering test user..."
REGISTER_BODY='{"email":"smoke@salimyami.dev","auth_hash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1"}'
RESP=$(curl -s -o "$TMP_DIR/reg.json" -w "%{http_code}" \
    -X POST "$BASE_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "$REGISTER_BODY" || echo "000")
REG_BODY=$(cat "$TMP_DIR/reg.json" 2>/dev/null || echo "")

# 201 = new user, 400 = already exists (both acceptable)
if [[ "$RESP" == "201" || "$RESP" == "400" ]]; then
    echo -e "${GREEN}✅ PASS${NC} [$RESP] POST /api/auth/register"
    ((PASS++))
else
    echo -e "${RED}❌ FAIL${NC} [$RESP] POST /api/auth/register"
    echo "   Response: $REG_BODY"
    ((FAIL++))
fi

# ── 6. Login and Get Token ────────────────────────────────────
echo "Logging in..."
LOGIN_BODY='{"email":"smoke@salimyami.dev","auth_hash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1"}'
RESP=$(curl -s -o "$TMP_DIR/login.json" -w "%{http_code}" \
    -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "$LOGIN_BODY" || echo "000")
LOGIN_JSON=$(cat "$TMP_DIR/login.json" 2>/dev/null || echo "")
check "POST /api/auth/login returns 200" "200" "$RESP" "$LOGIN_JSON"

# Extract token
TOKEN=$($PYTHON_CMD -c "import sys,json; d=json.load(sys.stdin); print(d.get('access_token',''))" <<< "$LOGIN_JSON" 2>/dev/null || echo "")

if [[ -n "$TOKEN" ]]; then
    echo -e "   ${YELLOW}→ Token obtained${NC} (${TOKEN:0:30}...)"

    # ── 7. Authenticated /api/files ────────────────────────────
    echo "Checking authenticated files access..."
    RESP=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: Bearer $TOKEN" \
        "$BASE_URL/api/files" || echo "000")
    check "GET /api/files with token → 200" "200" "$RESP" ""

    # ── 8. /api/stats ─────────────────────────────────────────
    echo "Checking authenticated stats access..."
    RESP=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: Bearer $TOKEN" \
        "$BASE_URL/api/stats" || echo "000")
    check "GET /api/stats with token → 200" "200" "$RESP" ""
fi

# ── 9. Frontend Reachable ────────────────────────────────────
echo "Checking frontend..."
RESP=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" 2>/dev/null || echo "000")
if [[ "$RESP" == "200" || "$RESP" == "304" ]]; then
    echo -e "${GREEN}✅ PASS${NC} [$RESP] GET $FRONTEND_URL (frontend)"
    ((PASS++))
else
    echo -e "${YELLOW}⚠️ SKIP${NC} [$RESP] Frontend $FRONTEND_URL (not required in CI)"
fi

# ── Summary ──────────────────────────────────────────────────
echo ""
echo "────────────────────────────────────────────"
echo -e "Results: ${GREEN}$PASS passed${NC} | ${RED}$FAIL failed${NC}"
echo ""

# Cleanup
rm -rf "$TMP_DIR"

if [[ $FAIL -gt 0 ]]; then
    echo -e "${RED}❌ Smoke tests FAILED${NC}"
    exit 1
else
    echo -e "${GREEN}✅ All smoke tests PASSED — VEIL is healthy!${NC}"
    exit 0
fi
