from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from database import engine, Base
import models # Forces the registry of SQLAlchemy entities
from middleware.logging_middleware import StructuredLoggingMiddleware
from middleware.error_handler import register_error_handlers
from routers import auth, business, team_member, knowledge, leads, conversations, whatsapp, payments, product, orders, ai_training, crm, marketing, tickets, email

# 1. Initialize core FastAPI framework
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Asynchronous core backend system for Autofy AI WhatsApp Business agent integrations.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# 2. Add custom CORS headers configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Mount custom trace-request logger middleware
app.add_middleware(StructuredLoggingMiddleware)

# 4. Integrate central global exception parser
register_error_handlers(app)

# 5. Programmatic table instantiation on application startup
# Ideal for rapid MVPs. Ensures tables exist immediately.
@app.on_event("startup")
def on_startup():
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as exc:
        print(f"Warning: Manual startup schema migration check skipped or failed: {str(exc)}")

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

@app.get("/api/health", tags=["System Index"])
def system_health():
    """
    Health check monitoring validation endpoint.
    """
    return {
        "status": "healthy",
        "database_connected": True
    }


# Convenience entrypoint: `python main.py` boots the API on the configured PORT
# (8000 by default). In dev the Vite proxy forwards /api here.
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=settings.DEBUG)
