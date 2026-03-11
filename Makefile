# ═══════════════════════════════════════════════════
# VEIL — Makefile shortcuts
# ═══════════════════════════════════════════════════
# Usage: make <target>
#   make dev        → Start dev stack (hot-reload)
#   make prod       → Start production stack
#   make test       → Run pytest suite
#   make jenkins    → Start Jenkins CI
#   make smoke      → Curl-based smoke tests
# ═══════════════════════════════════════════════════

.PHONY: help dev prod test lint build push deploy \
        jenkins ngrok smoke clean logs status

# Default: show help
help:
	@echo ""
	@echo "  🔒 VEIL — Available Commands"
	@echo "  ─────────────────────────────────────"
	@echo "  make dev        Start dev stack (hot-reload :5173 + :8000)"
	@echo "  make prod       Start production stack (:80 + :8000)"
	@echo "  make test       Run pytest + coverage"
	@echo "  make lint       Ruff (Python) + ESLint (JS)"
	@echo "  make build      Docker build both images"
	@echo "  make push       Push images to salimyami/ DockerHub"
	@echo "  make deploy     Ansible local deploy"
	@echo "  make jenkins    Start Jenkins on :8080"
	@echo "  make ngrok      Expose :80 via ngrok HTTPS tunnel"
	@echo "  make smoke      Curl smoke tests (requires running stack)"
	@echo "  make status     Show running containers"
	@echo "  make logs       Tail all container logs"
	@echo "  make clean      Stop everything + remove volumes"
	@echo ""

# ── Dev Environment ─────────────────────────────────────────────
dev:
	@echo "🚀 Starting VEIL dev stack (hot-reload)..."
	docker compose -f docker-compose.dev.yml up -d
	@echo ""
	@echo "  Frontend  → http://localhost:5173"
	@echo "  API       → http://localhost:8000"
	@echo "  API Docs  → http://localhost:8000/docs"
	@echo "  MinIO UI  → http://localhost:9001"
	@echo ""

dev-logs:
	docker compose -f docker-compose.dev.yml logs -f

dev-down:
	docker compose -f docker-compose.dev.yml down

# ── Production Stack ────────────────────────────────────────────
prod:
	@echo "🏭 Starting VEIL production stack..."
	@test -f .env || (echo "❌ .env not found. Run: cp .env.example .env" && exit 1)
	docker compose up -d
	@echo ""
	@echo "  Frontend  → http://localhost"
	@echo "  API       → http://localhost:8000"
	@echo "  API Docs  → http://localhost:8000/docs"
	@echo "  MinIO UI  → http://localhost:9998"
	@echo ""

# ── Testing ────────────────────────────────────────────────────
test:
	@echo "🧪 Running VEIL test suite..."
	cd backend && \
		pip install pytest pytest-cov pytest-asyncio httpx --quiet && \
		pytest tests/ -v \
			--cov=. \
			--cov-report=term-missing \
			--cov-report=html:htmlcov \
			--cov-fail-under=70
	@echo "📊 Coverage report: backend/htmlcov/index.html"

# ── Linting ────────────────────────────────────────────────────
lint:
	@echo "🧹 Linting Python (ruff)..."
	cd backend && pip install ruff --quiet && ruff check . --output-format=text
	@echo "🧹 Linting TypeScript (eslint)..."
	cd frontend && npm run lint
	@echo "✅ Lint complete"

# ── Docker Build ───────────────────────────────────────────────
build:
	@echo "🐳 Building Docker images..."
	docker build -t salimyami/veil-backend:latest ./backend
	docker build -t salimyami/veil-frontend:latest ./frontend
	@echo "✅ Images built"
	docker images | grep veil

push: build
	@echo "📤 Pushing to DockerHub (salimyami)..."
	docker login -u salimyami
	docker push salimyami/veil-backend:latest
	docker push salimyami/veil-frontend:latest
	@echo "✅ Pushed!"

# ── Ansible Deploy ─────────────────────────────────────────────
deploy:
	@echo "🎭 Running Ansible playbook..."
	ansible-playbook ansible/playbook-local.yml \
		-i ansible/inventory.ini \
		--diff \
		-v

deploy-check:
	@echo "🎭 Ansible dry-run (--check)..."
	ansible-playbook ansible/playbook-local.yml \
		-i ansible/inventory.ini \
		--check --diff

# ── Jenkins ────────────────────────────────────────────────────
jenkins:
	@echo "🏗️ Starting Jenkins CI on :8080..."
	docker compose -f jenkins/docker-compose.jenkins.yml up -d
	@echo ""
	@echo "  Jenkins → http://localhost:8080"
	@echo "  (First run: check logs for initial admin password)"
	@echo "  make jenkins-password  ← get the initial password"
	@echo ""

jenkins-password:
	docker exec veil-jenkins cat /var/jenkins_home/secrets/initialAdminPassword

jenkins-down:
	docker compose -f jenkins/docker-compose.jenkins.yml down

# ── ngrok Tunnel ───────────────────────────────────────────────
ngrok:
	@echo "🌐 Opening ngrok tunnel on port 80..."
	@command -v ngrok >/dev/null 2>&1 || (echo "❌ ngrok not installed. Run: bash scripts/setup-ngrok.sh" && exit 1)
	ngrok http 80 --log=stdout

ngrok-api:
	ngrok http 8000 --log=stdout --subdomain=veil-api 2>/dev/null || ngrok http 8000

# ── Smoke Tests ────────────────────────────────────────────────
smoke:
	@echo "🔥 Running smoke tests..."
	bash scripts/smoke-test.sh

# ── Utils ─────────────────────────────────────────────────────
status:
	@echo "📦 VEIL Container Status:"
	docker ps --filter "name=veil" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

logs:
	docker compose logs -f --tail=50

clean:
	@echo "🧹 Stopping and cleaning VEIL stack..."
	docker compose down -v --remove-orphans 2>/dev/null || true
	docker compose -f docker-compose.dev.yml down -v --remove-orphans 2>/dev/null || true
	docker compose -f jenkins/docker-compose.jenkins.yml down -v 2>/dev/null || true
	@echo "✅ Clean done"
