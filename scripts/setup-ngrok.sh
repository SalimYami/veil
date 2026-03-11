#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════
# VEIL — ngrok HTTPS Tunnel Setup
# Creates a public HTTPS URL for your local VEIL instance
#
# Usage:
#   bash scripts/setup-ngrok.sh           → tunnel :80 (frontend)
#   bash scripts/setup-ngrok.sh api       → tunnel :8000 (API)
#   bash scripts/setup-ngrok.sh all       → both tunnels
# ═══════════════════════════════════════════════════════════
set -euo pipefail

MODE="${1:-frontend}"

echo ""
echo "🌐 VEIL — ngrok Tunnel Setup"
echo "─────────────────────────────────────"

# ── Check ngrok installed ────────────────────────────────────
if ! command -v ngrok &>/dev/null; then
    echo "📦 Installing ngrok..."
    if [[ "$(uname)" == "Darwin" ]]; then
        brew install ngrok/ngrok/ngrok
    elif [[ "$(uname)" == "Linux" ]]; then
        curl -sSL https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
        echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
        sudo apt-get update && sudo apt-get install ngrok -y
    else
        echo "Windows: Download from https://ngrok.com/download"
        echo "         Then run: ngrok http 80"
        exit 1
    fi
fi

echo "✅ ngrok found: $(ngrok version)"

# ── Check VEIL is running ────────────────────────────────────
echo ""
echo "🔍 Checking VEIL stack is running..."
if ! curl -sf http://localhost:8000/health >/dev/null 2>&1; then
    echo ""
    echo "⚠️  VEIL API not detected on :8000"
    echo "   Start the stack first:"
    echo "   → make dev    (hot-reload)"
    echo "   → make prod   (production)"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo ""
    [[ $REPLY =~ ^[Yy]$ ]] || exit 1
fi

# ── Launch ngrok ─────────────────────────────────────────────
echo ""
case "$MODE" in
    api)
        echo "🚀 Opening ngrok tunnel for API (:8000)..."
        echo "   Update VEIL_ALLOWED_ORIGINS in .env with the ngrok URL!"
        echo ""
        ngrok http 8000 --log=stdout
        ;;
    all)
        echo "🚀 Multi-tunnel: frontend (:80) + API (:8000)..."
        echo "   (Requires ngrok config file)"
        cat > /tmp/ngrok-veil.yml << 'EOF'
version: "2"
tunnels:
  frontend:
    addr: 80
    proto: http
    inspect: true
  api:
    addr: 8000
    proto: http
    inspect: true
EOF
        ngrok start --all --config /tmp/ngrok-veil.yml
        ;;
    frontend|*)
        echo "🚀 Opening ngrok tunnel for Frontend (:80)..."
        echo ""
        echo "📋 Once tunnel is up, share the HTTPS URL!"
        echo "   Example: https://abc123.ngrok-free.app"
        echo ""
        ngrok http 80 --log=stdout
        ;;
esac
