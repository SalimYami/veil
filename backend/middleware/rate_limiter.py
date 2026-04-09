"""
=============================================================================
VEIL — Rate Limiter distribué (Redis Sliding Window Log)
=============================================================================

Compatible multi-pods : l'état est partagé via Redis.
Défense en profondeur :
  - Routes sensibles (/auth/*) : 5 req/min par IP
  - Routes générales : 60 req/min par IP
  - Cooldown progressif : 10 échecs → blocage 15 min

=============================================================================
"""

import time
import logging

import redis.asyncio as redis
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware

from config import settings

logger = logging.getLogger("veil.security.ratelimit")

# ── Connexion Redis (lazy-init) ──────────────────────

_redis_pool: redis.Redis | None = None


async def get_redis() -> redis.Redis:
    """Lazy-initialize Redis connection pool."""
    global _redis_pool
    if _redis_pool is None:
        _redis_pool = redis.from_url(
            settings.REDIS_URL,
            decode_responses=True
        )
    return _redis_pool


# ── Middleware ───────────────────────────────────────

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Sliding Window Rate Limiter distribué via Redis.
    
    Algorithme : Sliding Window Log
    - Chaque requête est enregistrée avec son timestamp dans un ZSET Redis
    - Le ZSET est nettoyé des entrées hors fenêtre
    - Le nombre d'entrées restantes = nombre de requêtes dans la fenêtre
    """

    # Routes d'authentification (sensibles au brute-force)
    SENSITIVE_ROUTES = {
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/refresh",
        "/api/auth/salt",
    }

    # Limites
    SENSITIVE_LIMIT = 5         # 5 requêtes
    SENSITIVE_WINDOW = 60       # par minute
    GENERAL_LIMIT = 60          # 60 requêtes
    GENERAL_WINDOW = 60         # par minute

    # Cooldown progressif (anti-bruteforce agressif)
    COOLDOWN_THRESHOLD = 15     # Après 15 dépassements → cooldown
    COOLDOWN_DURATION = 900     # 15 minutes de blocage

    async def dispatch(self, request: Request, call_next):
        # Skip les routes de monitoring
        if request.url.path in ("/health", "/docs", "/openapi.json", "/redoc"):
            return await call_next(request)

        # Extraire l'IP réelle (derrière reverse proxy)
        forwarded = request.headers.get("X-Forwarded-For")
        client_ip = forwarded.split(",")[0].strip() if forwarded else request.client.host
        path = request.url.path

        try:
            r = await get_redis()

            # ── Vérifier le cooldown progressif ──
            cooldown_key = f"veil:cooldown:{client_ip}"
            if await r.exists(cooldown_key):
                ttl = await r.ttl(cooldown_key)
                logger.warning(
                    f"🚫 IP {client_ip} en cooldown ({ttl}s restantes) — brute-force détecté"
                )
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Trop de tentatives. Réessayez plus tard.",
                    headers={"Retry-After": str(ttl)}
                )

            # ── Déterminer les limites selon la route ──
            if path in self.SENSITIVE_ROUTES and request.method == "POST":
                limit = self.SENSITIVE_LIMIT
                window = self.SENSITIVE_WINDOW
                rate_key = f"veil:rate:auth:{client_ip}"
            else:
                limit = self.GENERAL_LIMIT
                window = self.GENERAL_WINDOW
                rate_key = f"veil:rate:general:{client_ip}"

            # ── Sliding Window Log (pipeline atomique) ──
            now = time.time()
            pipe = r.pipeline()
            pipe.zremrangebyscore(rate_key, 0, now - window)  # Nettoyer les anciennes entrées
            pipe.zadd(rate_key, {f"{now}:{id(request)}": now})  # Ajouter la requête courante
            pipe.zcard(rate_key)                                # Compter les requêtes actives
            pipe.expire(rate_key, window + 1)                   # TTL de sécurité
            results = await pipe.execute()
            request_count = results[2]

            if request_count > limit:
                # Incrémenter le compteur d'échecs pour cooldown progressif
                fail_key = f"veil:fails:{client_ip}"
                fails = await r.incr(fail_key)
                await r.expire(fail_key, 3600)  # 1h de mémoire

                if fails >= self.COOLDOWN_THRESHOLD:
                    await r.setex(cooldown_key, self.COOLDOWN_DURATION, "1")
                    logger.critical(
                        f"🔒 COOLDOWN activé pour IP {client_ip} "
                        f"({fails} dépassements en 1h)"
                    )

                logger.warning(
                    f"⚠️ Rate limit dépassé: {client_ip} "
                    f"({request_count}/{limit}) sur {path}"
                )
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Limite de requêtes dépassée. Maximum {limit} par {window}s.",
                    headers={"Retry-After": str(window)}
                )

        except HTTPException:
            raise
        except Exception as e:
            # Redis indisponible → fail-open (on laisse passer mais on log)
            logger.error(f"Redis indisponible (fail-open): {e}")

        response = await call_next(request)
        return response
