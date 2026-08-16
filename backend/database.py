from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from config import settings

# Create database engine.
# We branch on the URL scheme so the app runs out-of-the-box:
#   - SQLite (default for local dev): needs check_same_thread=False for FastAPI's
#     threaded request handling, and does NOT accept Postgres pool sizing args.
#   - PostgreSQL (production): use connection pooling + health checks.
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

if db_url.startswith("sqlite"):
    engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False},
        pool_pre_ping=True,
    )
else:
    engine = create_engine(
        db_url,
        pool_pre_ping=True,                     # Validates connections before checkout to prevent dead socket errors
        pool_size=settings.DB_POOL_SIZE,        # Base pool of reusable persistent connections
        max_overflow=settings.DB_MAX_OVERFLOW,  # Burst headroom for heavy traffic spikes across 1000+ tenants
        pool_timeout=settings.DB_POOL_TIMEOUT,  # Max seconds to wait for an available connection from pool
        pool_recycle=settings.DB_POOL_RECYCLE,  # Recycles connections every 30m to avoid stale connection drops
    )

# Configure session local factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Declare declarative Base model
Base = declarative_base()

def get_db() -> Generator:
    """
    Dependency generator yielding a transactional database session scope.
    Closes the database session cleanly post-request and rolls back if an error occurred.
    """
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
