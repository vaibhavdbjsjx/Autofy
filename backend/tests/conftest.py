import pytest
import os
import sys
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

# Ensure backend root is on Python path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from main import app
from database import Base, get_db
from models.user import User
from models.business import Business
from auth.security import create_access_token, get_password_hash

# Use SQLite in-memory for fast isolated test suites
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session() -> Session:
    session = TestingSessionLocal()
    yield session
    session.close()

@pytest.fixture
def client() -> TestClient:
    def _override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def test_business_a(db_session: Session) -> Business:
    biz = Business(
        id="biz-test-a",
        name="Alpha Auto Garage",
        classification="Automotive",
        email="biz_a@alphaauto.com",
        phone="+919876543210"
    )
    db_session.add(biz)
    db_session.commit()
    db_session.refresh(biz)
    from services.entitlement_services import EntitlementService
    EntitlementService.start_trial(db_session, biz.id, "pro")
    return biz

@pytest.fixture
def test_user_a(db_session: Session, test_business_a: Business) -> User:
    user = User(
        id="user-test-a",
        business_id=test_business_a.id,
        email="owner_a@alphaauto.com",
        name="Alpha Owner",
        password_hash=get_password_hash("Password123!"),
        role="Owner",
        status="Active"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def auth_headers_a(test_user_a: User) -> dict:
    token = create_access_token(subject=test_user_a.id, additional_claims={"business_id": test_user_a.business_id})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def test_business_b(db_session: Session) -> Business:
    biz = Business(
        id="biz-test-b",
        name="Beta Fitness Club",
        classification="Fitness",
        email="biz_b@betafitness.com",
        phone="+919876543211"
    )
    db_session.add(biz)
    db_session.commit()
    db_session.refresh(biz)
    from services.entitlement_services import EntitlementService
    EntitlementService.start_trial(db_session, biz.id, "pro")
    return biz

@pytest.fixture
def test_user_b(db_session: Session, test_business_b: Business) -> User:
    user = User(
        id="user-test-b",
        business_id=test_business_b.id,
        email="owner_b@betafitness.com",
        name="Beta Owner",
        password_hash=get_password_hash("Password123!"),
        role="Owner",
        status="Active"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def auth_headers_b(test_user_b: User) -> dict:
    token = create_access_token(subject=test_user_b.id, additional_claims={"business_id": test_user_b.business_id})
    return {"Authorization": f"Bearer {token}"}
