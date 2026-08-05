import logging
from fastapi import Request, FastAPI
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("autofy_exception_handler")

def register_error_handlers(app: FastAPI) -> None:
    """
    Hooks central error-intercept patterns directly onto the FastAPI instance.
    """
    
    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        req_id = request.headers.get("X-Request-ID")
        logger.warning(f"HTTP clearance warning: path={request.url.path} status={exc.status_code} msg={exc.detail}")
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "request_id": req_id,
                "error": {
                    "code": "HTTP_EXCEPTION",
                    "message": exc.detail,
                    "details": None
                }
            }
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        req_id = request.headers.get("X-Request-ID")
        errors = exc.errors()
        logger.warning(f"Metadata format error: path={request.url.path} errors={errors}")
        return JSONResponse(
            status_code=422,
            content={
                "success": False,
                "request_id": req_id,
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Inbound request failed syntax integrity checks.",
                    "details": [{"loc": err["loc"], "msg": err["msg"], "type": err["type"]} for err in errors]
                }
            }
        )

    @app.exception_handler(IntegrityError)
    async def database_integrity_exception_handler(request: Request, exc: IntegrityError):
        req_id = request.headers.get("X-Request-ID")
        logger.error(f"Database constraint validation failed: path={request.url.path} error={str(exc)}")
        details_val = (str(exc.orig) if hasattr(exc, 'orig') else str(exc)) if app.debug else "A database constraint conflict occurred."
        return JSONResponse(
            status_code=409,
            content={
                "success": False,
                "request_id": req_id,
                "error": {
                    "code": "DB_INTEGRITY_CONFLICT",
                    "message": "The payload violates a database uniqueness or constraint rule. E.g. email already exists.",
                    "details": details_val
                }
            }
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        req_id = request.headers.get("X-Request-ID")
        logger.critical(f"Fatal system crash intercepted: path={request.url.path} error={str(exc)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "request_id": req_id,
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected server-side operation failure occurred on our end. Reach out to Autofy Support.",
                    "details": str(exc) if app.debug else None
                }
            }
        )
