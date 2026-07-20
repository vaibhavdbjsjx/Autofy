from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from config import settings

# Create database engine.
# We branch on the URL scheme so the app runs out-of-the-box:
#   - SQLite (default for local dev): needs check_same_thread=False for FastAPI's
#     threaded request handling, and does NOT accept Postgres pool sizing args.
#   - PostgreSQL (production): use connection pooling + health checks.
if settings.DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},
        pool_pre_ping=True,
    )
else:
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,   # checks connection health before executing commands
        pool_size=10,
        max_overflow=20,
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
    finally:
        db.close()
