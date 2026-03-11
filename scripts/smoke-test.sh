#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════
# VEIL — Smoke Tests
# Runs curl-based health checks against the live stack.
# Usage: bash scripts/smoke-test.sh [BASE_URL]
# ═══════════════════════════════════════════════════════════
set -euo pipefail

BASE_URL="${1:-http://localhost:8000}"
FRONTEND_URL="${2:-http://localhost:80}"
PASS=0
FAIL=0

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
RESP=$(curl -s -o /tmp/veil_resp.json -w "%{http_code}" "$BASE_URL/health")
BODY=$(cat /tmp/veil_resp.json 2>/dev/null || echo "")
check "GET /health returns 200" "200" "$RESP" "$BODY"

# Validate JSON content
if echo "$BODY" | grep -q '"status"'; then
    STATUS=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status','?'))" 2>/dev/null || echo "?")
    echo -e "   ${YELLOW}→ API Status: $STATUS${NC}"
fi

# ── 2. OpenAPI Docs ──────────────────────────────────────────
RESP=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/docs")
check "GET /docs (Swagger UI) returns 200" "200" "$RESP" ""

# ── 3. OpenAPI Schema ────────────────────────────────────────
RESP=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/openapi.json")
check "GET /openapi.json returns 200" "200" "$RESP" ""

# ── 4. Auth Returns 401 Without Token ────────────────────────
RESP=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/files")
check "GET /api/files without token → 401" "401" "$RESP" ""

# ── 5. Register a Test User ──────────────────────────────────
REGISTER_BODY='{"email":"smoke@salimyami.dev","auth_hash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1"}'
RESP=$(curl -s -o /tmp/veil_reg.json -w "%{http_code}" \
    -X POST "$BASE_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "$REGISTER_BODY")
REG_BODY=$(cat /tmp/veil_reg.json 2>/dev/null || echo "")

# 201 = new user, 400 = already exists (both acceptable)
if [[ "$RESP" == "201" || "$RESP" == "400" ]]; then
    echo -e "${GREEN}✅ PASS${NC} [$RESP] POST /api/auth/register"
    ((PASS++))
else
    echo -e "${RED}❌ FAIL${NC} [$RESP] POST /api/auth/register"
    ((FAIL++))
fi

# ── 6. Login and Get Token ────────────────────────────────────
LOGIN_BODY='{"email":"smoke@salimyami.dev","auth_hash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1"}'
RESP=$(curl -s -o /tmp/veil_login.json -w "%{http_code}" \
    -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "$LOGIN_BODY")
LOGIN_JSON=$(cat /tmp/veil_login.json 2>/dev/null || echo "")
check "POST /api/auth/login returns 200" "200" "$RESP" "$LOGIN_JSON"

# Extract token
TOKEN=$(echo "$LOGIN_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('access_token',''))" 2>/dev/null || echo "")

if [[ -n "$TOKEN" ]]; then
    echo -e "   ${YELLOW}→ Token obtained${NC} (${TOKEN:0:30}...)"

    # ── 7. Authenticated /api/files ────────────────────────────
    RESP=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: Bearer $TOKEN" \
        "$BASE_URL/api/files")
    check "GET /api/files with token → 200" "200" "$RESP" ""

    # ── 8. /api/stats ─────────────────────────────────────────
    RESP=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: Bearer $TOKEN" \
        "$BASE_URL/api/stats")
    check "GET /api/stats with token → 200" "200" "$RESP" ""
fi

# ── 9. Frontend Reachable ────────────────────────────────────
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

if [[ $FAIL -gt 0 ]]; then
    echo -e "${RED}❌ Smoke tests FAILED${NC}"
    exit 1
else
    echo -e "${GREEN}✅ All smoke tests PASSED — VEIL is healthy!${NC}"
    exit 0
fi
