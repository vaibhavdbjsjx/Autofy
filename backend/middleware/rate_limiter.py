import time
import logging
from typing import Dict, Tuple, List, Optional
from fastapi import Request, Response, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from config import settings

logger = logging.getLogger("autofy_rate_limiter")

class RateLimitStore:
    """
    Sliding window in-memory rate limiter with per-key timestamps.
    Automatically purges expired buckets to maintain low memory footprint.
    """
    def __init__(self):
        # key -> list of float timestamps
        self._buckets: Dict[str, List[float]] = {}

    def is_allowed(self, key: str, max_requests: int, window_seconds: float = 60.0) -> Tuple[bool, int, int]:
        """
        Evaluates if key is within rate limit.
        Returns (is_allowed, remaining_requests, reset_seconds).
        """
        now = time.time()
        cutoff = now - window_seconds

        timestamps = self._buckets.get(key, [])
        # Filter out timestamps older than sliding window
        valid_timestamps = [t for t in timestamps if t > cutoff]

        if len(valid_timestamps) >= max_requests:
            oldest = valid_timestamps[0]
            reset_seconds = max(1, int(window_seconds - (now - oldest)))
            self._buckets[key] = valid_timestamps
            return False, 0, reset_seconds

        valid_timestamps.append(now)
        self._buckets[key] = valid_timestamps
        remaining = max(0, max_requests - len(valid_timestamps))
        reset_seconds = int(window_seconds)

        return True, remaining, reset_seconds

    def clean_stale(self, max_idle_seconds: float = 300.0):
        now = time.time()
        cutoff = now - max_idle_seconds
        keys_to_remove = [k for k, timestamps in self._buckets.items() if not timestamps or timestamps[-1] < cutoff]
        for k in keys_to_remove:
            self._buckets.pop(k, None)


# Global limiter store
limiter_store = RateLimitStore()


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if not settings.RATE_LIMIT_ENABLED:
            return await call_next(request)

        path = request.url.path

        # Bypass static health or ping routes
        if path in ["/health", "/api/v1/health", "/docs", "/openapi.json", "/redoc"]:
            return await call_next(request)

        # Identify rate limiting key: prefer auth/tenant header or client IP
        client_ip = request.client.host if request.client else "unknown"
        auth_header = request.headers.get("Authorization", "")
        key = f"auth_{auth_header[:20]}" if len(auth_header) > 10 else f"ip_{client_ip}"

        # Differentiate limits for public webhook vs standard APIs
        if "/whatsapp/webhook" in path:
            max_limit = settings.RATE_LIMIT_WEBHOOK_PER_MINUTE
            key = f"webhook_{client_ip}"
        else:
            max_limit = settings.RATE_LIMIT_DEFAULT_PER_MINUTE

        allowed, remaining, reset_seconds = limiter_store.is_allowed(key, max_limit, window_seconds=60.0)

        if not allowed:
            logger.warning(f"Rate limit exceeded for key={key}, limit={max_limit}/min")
            response = Response(
                content='{"detail": "Too many requests. Please slow down and try again."}',
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                media_type="application/json"
            )
            response.headers["Retry-After"] = str(reset_seconds)
            response.headers["X-RateLimit-Limit"] = str(max_limit)
            response.headers["X-RateLimit-Remaining"] = "0"
            response.headers["X-RateLimit-Reset"] = str(reset_seconds)
            return response

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(max_limit)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(reset_seconds)
        return response
