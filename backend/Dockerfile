# =============================================================================
# Backend Dockerfile — Multi-stage (production + development)
# =============================================================================

# ── Stage commun : dépendances ──────────────────────────────────────────────
FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Dépendances système (psycopg2, gcc)
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt


# ── Stage développement (hot-reload) ────────────────────────────────────────
FROM base AS development

# Le code sera monté via volume (docker-compose volume mount)
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload", "--log-level", "debug"]


# ── Stage production ─────────────────────────────────────────────────────────
FROM base AS production

COPY . .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2", "--log-level", "info"]
