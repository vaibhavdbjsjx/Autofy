from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from database import engine, Base
import models # Forces the registry of SQLAlchemy entities
from middleware.logging_middleware import StructuredLoggingMiddleware
from middleware.error_handler import register_error_handlers
from middleware.rate_limit_middleware import RateLimiterMiddleware
from routers import auth, business, team_member, knowledge, leads, conversations, whatsapp, payments, product, orders, ai_training, crm, marketing, tickets, email, subscriptions, appointments, system
from services.queue_services import JobQueueService
from sqlalchemy import text
from sqlalchemy.orm import Session
from database import get_db

# 1. Initialize core FastAPI framework
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Asynchronous core backend system for Autofy AI WhatsApp Business agent integrations.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# 2. Add custom CORS headers configuration (supports exact origins + all Netlify deployments)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https:\/\/([a-zA-Z0-9_-]+\.)?netlify\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Mount custom trace-request logger & rate limiter middleware
app.add_middleware(StructuredLoggingMiddleware)
app.add_middleware(RateLimiterMiddleware)

# 4. Integrate central global exception parser
register_error_handlers(app)

# 5. Startup & Shutdown lifecycle hooks for Background Job Workers
@app.on_event("startup")
async def on_startup():
    await JobQueueService.start_workers()

@app.on_event("shutdown")
async def on_shutdown():
    await JobQueueService.stop_workers()

# 6. Bind core routes pipelines
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(business.router, prefix=settings.API_V1_STR)
app.include_router(team_member.router, prefix=settings.API_V1_STR)
app.include_router(knowledge.router, prefix=settings.API_V1_STR)
app.include_router(leads.router, prefix=settings.API_V1_STR)
app.include_router(conversations.router, prefix=settings.API_V1_STR)
app.include_router(whatsapp.router, prefix=settings.API_V1_STR)
app.include_router(payments.router, prefix=settings.API_V1_STR)
app.include_router(product.router, prefix=settings.API_V1_STR)
app.include_router(orders.router, prefix=settings.API_V1_STR)
app.include_router(ai_training.router, prefix=settings.API_V1_STR)
app.include_router(crm.router, prefix=settings.API_V1_STR)
app.include_router(marketing.router, prefix=settings.API_V1_STR)
app.include_router(tickets.router, prefix=settings.API_V1_STR)
app.include_router(email.router, prefix=settings.API_V1_STR)
app.include_router(subscriptions.router, prefix=settings.API_V1_STR)
app.include_router(appointments.router, prefix=settings.API_V1_STR)
app.include_router(system.router, prefix=settings.API_V1_STR)

@app.get("/", tags=["System Index"])
def system_root():
    """
    Humble system status responder.
    """
    return {
        "status": "online",
        "service": "Autofy Core API Gateway",
        "version": "1.0.0"
    }

@app.get("/health/live", tags=["System Index"])
@app.get("/api/health/live", tags=["System Index"])
def liveness_probe():
    """
    Production liveness probe for orchestrators (Render, K8s).
    Fast check verifying the application container process is responsive.
    """
    return {"status": "alive", "version": "1.0.0"}

@app.get("/health/ready", tags=["System Index"])
@app.get("/api/health/ready", tags=["System Index"])
def readiness_probe(db: Session = Depends(get_db)):
    """
    Production readiness probe checking database connectivity.
    Returns HTTP 200 if ready to serve traffic, 503 if database unavailable.
    """
    from fastapi.responses import JSONResponse
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ready", "database_connected": True}
    except Exception:
        return JSONResponse(
            status_code=503,
            content={"status": "not_ready", "database_connected": False}
        )

@app.get("/health", tags=["System Index"])
@app.get("/api/health", tags=["System Index"])
def system_health(db: Session = Depends(get_db)):
    """
    Comprehensive system health check.
    """
    db_ok = False
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False

    return {
        "status": "healthy" if db_ok else "degraded",
        "database_connected": db_ok,
        "environment": settings.ENVIRONMENT,
        "features": settings.get_feature_health()
    }


# Convenience entrypoint: `python main.py` boots the API on the configured PORT
# (8000 by default). In dev the Vite proxy forwards /api here.
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=settings.DEBUG)
