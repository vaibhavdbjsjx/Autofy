import time
import logging
from collections import defaultdict
from typing import Dict, List, Tuple
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("rate_limiter")

class RateLimiterMiddleware(BaseHTTPMiddleware):
    """
    Production-safe sliding window rate limiter for public and sensitive API endpoints.
    Protects authentication, webhooks, and AI execution routes against brute-force / abuse.
    """
    def __init__(self, app, max_requests_per_minute: int = 120, sensitive_max_per_minute: int = 20):
        super().__init__(app)
        self.max_requests_per_minute = max_requests_per_minute
        self.sensitive_max_per_minute = sensitive_max_per_minute
        self.requests: Dict[str, List[float]] = defaultdict(list)
        
        # Paths requiring stricter rate limits
        self.sensitive_paths = {
            "/api/v1/auth/login",
            "/api/v1/auth/signup",
            "/api/v1/auth/delete-account",
            "/api/v1/payments/webhook",
        }

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        path = request.url.path
        now = time.time()
        window_start = now - 60.0

        # Filter out timestamps older than 60 seconds
        timestamps = [t for t in self.requests[client_ip] if t > window_start]
        self.requests[client_ip] = timestamps

        limit = self.sensitive_max_per_minute if path in self.sensitive_paths else self.max_requests_per_minute

        if len(timestamps) >= limit:
            logger.warning(f"Rate limit exceeded for IP {client_ip} on path {path}")
            from fastapi.responses import JSONResponse
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "success": False,
                    "error": {
                        "code": "TOO_MANY_REQUESTS",
                        "message": "Too many requests. Please slow down and try again in a minute."
                    }
                }
            )

        self.requests[client_ip].append(now)
        response = await call_next(request)
        return response
