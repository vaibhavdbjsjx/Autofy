import time
import logging
import uuid
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

# Configure basic structured JSON logging format output
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("autofy_gateway")

class StructuredLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        """
        Intercepts incoming network logs, injects request tracing UUIDs,
        records processing lag parameters and delivers standardized logs.
        """
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        start_time = time.time()
        
        # Log incoming request context
        client_ip = request.client.host if request.client else "unknown"
        logger.info(
            f"[REQ_START] id={request_id} client={client_ip} "
            f"method={request.method} path={request.url.path}"
        )
        
        # Process active pipeline request
        try:
            response = await call_next(request)
            process_time = round((time.time() - start_time) * 1000, 2)
            
            # Log response criteria
            logger.info(
                f"[REQ_SUCCESS] id={request_id} status={response.status_code} "
                f"duration={process_time}ms"
            )
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Process-Time-Ms"] = str(process_time)
            return response
            
        except Exception as exc:
            process_time = round((time.time() - start_time) * 1000, 2)
            logger.error(
                f"[REQ_CRASH] id={request_id} error={str(exc)} "
                f"duration={process_time}ms",
                exc_info=True
            )
            raise exc
