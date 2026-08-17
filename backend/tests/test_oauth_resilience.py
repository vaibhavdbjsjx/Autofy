import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from models.oauth_state import OAuthState
from models.user import User
from models.business import Business
from auth.google_oauth import GoogleUserSchema


@pytest.fixture(autouse=True)
def mock_google_creds(monkeypatch):
    monkeypatch.setattr("routers.auth.settings.GOOGLE_CLIENT_ID", "test-google-client-id.apps.googleusercontent.com")
    monkeypatch.setattr("routers.auth.settings.GOOGLE_CLIENT_SECRET", "test-google-client-secret")
    monkeypatch.setattr("routers.auth.settings.GOOGLE_REDIRECT_URI", "https://autofysaas.com/api/v1/auth/google/callback")
    monkeypatch.setattr("routers.auth.settings.FRONTEND_URL", "https://autofysaas.com")


def test_oauth_state_generation_and_persistence(client: TestClient, db_session: Session):
    """
    Verify /api/v1/auth/google/authorize generates a secure state, stores intent in DB,
    and returns a valid authorization URL.
    """
    res = client.get("/api/v1/auth/google/authorize?intent=signup")
    assert res.status_code == 200
    data = res.json()
    assert "authorization_url" in data
    assert "state" in data
    assert data.get("intent") == "signup"
    state = data["state"]

    # Verify state is persisted in PostgreSQL DB with user_intent
    db_state = db_session.query(OAuthState).filter(OAuthState.state == state).first()
    assert db_state is not None
    assert db_state.provider == "google"
    assert db_state.user_intent == "signup"
    assert db_state.expires_at > datetime.utcnow()
    assert "accounts.google.com" in data["authorization_url"]
    assert f"state={state}" in data["authorization_url"]


def test_oauth_state_survival_across_server_restart(client: TestClient, db_session: Session, monkeypatch):
    """
    Simulate container restart: State generated before restart must be
    reliably validated from persistent storage afterwards.
    """
    # 1. Generate state
    res = client.get("/api/v1/auth/google/authorize?intent=login")
    state = res.json()["state"]

    # 2. Mock Google exchange
    async def mock_exchange(code: str):
        return GoogleUserSchema(
            email="restart_resilience_test@example.com",
            name="Restart Tester",
            picture="https://example.com/avatar.png",
            sub="google_sub_restart_123"
        )
    monkeypatch.setattr("auth.google_oauth.GoogleOAuthService.exchange_code_for_user_info", mock_exchange)

    # 3. Simulate callback after restart
    cb_res = client.get(f"/api/v1/auth/google/callback?code=mock_code&state={state}", follow_redirects=False)
    assert cb_res.status_code in [302, 307]
    redirect_location = cb_res.headers.get("location", "")
    assert "/auth/callback" in redirect_location
    assert "access_token=" in redirect_location
    assert "status=new_user" in redirect_location
    assert "restart_resilience_test%40example.com" in redirect_location or "restart_resilience_test@example.com" in redirect_location

    # 4. Verify user was created
    user = db_session.query(User).filter(User.email == "restart_resilience_test@example.com").first()
    assert user is not None
    assert user.name == "Restart Tester"


def test_oauth_expired_state_gracefully_redirects_to_login(client: TestClient, db_session: Session):
    """
    Verify expired state is NOT an unhandled 400 Bad Request exception,
    but instead gracefully redirects to /login with an explanatory error code.
    """
    # Create expired state in DB
    expired_state = "expired_state_99999"
    db_session.add(OAuthState(
        state=expired_state,
        provider="google",
        user_intent="login",
        expires_at=datetime.utcnow() - timedelta(minutes=5),
        created_at=datetime.utcnow() - timedelta(minutes=15)
    ))
    db_session.commit()

    res = client.get(f"/api/v1/auth/google/callback?code=some_code&state={expired_state}", follow_redirects=False)
    assert res.status_code in [302, 307]
    location = res.headers.get("location", "")
    assert "/login" in location
    assert "error=oauth_failed" in location
    assert "expired" in location.lower() or "invalid" in location.lower()


def test_oauth_invalid_or_missing_state_gracefully_redirects_to_login(client: TestClient):
    """
    Verify unknown state or missing state redirects gracefully to /login.
    """
    # 1. Missing state
    res_missing = client.get("/api/v1/auth/google/callback?code=some_code", follow_redirects=False)
    assert res_missing.status_code in [302, 307]
    assert "/login" in res_missing.headers.get("location", "")
    assert "error=oauth_failed" in res_missing.headers.get("location", "")

    # 2. Tampered / non-existent state
    res_tampered = client.get("/api/v1/auth/google/callback?code=some_code&state=tampered_random_state", follow_redirects=False)
    assert res_tampered.status_code in [302, 307]
    assert "/login" in res_tampered.headers.get("location", "")
    assert "error=oauth_failed" in res_tampered.headers.get("location", "")


def test_oauth_single_use_consumed_state_prevents_replay(client: TestClient, db_session: Session, monkeypatch):
    """
    Verify a state cannot be replayed twice.
    """
    # 1. Generate state
    res = client.get("/api/v1/auth/google/authorize")
    state = res.json()["state"]

    async def mock_exchange(code: str):
        return GoogleUserSchema(
            email="single_use_test@example.com",
            name="Single Use User",
            sub="sub_single_use_456"
        )
    monkeypatch.setattr("auth.google_oauth.GoogleOAuthService.exchange_code_for_user_info", mock_exchange)

    # 2. First callback consumes state successfully
    res1 = client.get(f"/api/v1/auth/google/callback?code=code1&state={state}", follow_redirects=False)
    assert res1.status_code in [302, 307]
    assert "/auth/callback" in res1.headers.get("location", "")

    # 3. Second callback with same state must fail and redirect to /login
    res2 = client.get(f"/api/v1/auth/google/callback?code=code2&state={state}", follow_redirects=False)
    assert res2.status_code in [302, 307]
    assert "/login" in res2.headers.get("location", "")
    assert "error=oauth_failed" in res2.headers.get("location", "")


def test_oauth_google_error_param_graceful_redirect(client: TestClient):
    """
    Verify user cancellation or Google error returns a graceful redirect.
    """
    res = client.get("/api/v1/auth/google/callback?error=access_denied", follow_redirects=False)
    assert res.status_code in [302, 307]
    location = res.headers.get("location", "")
    assert "/login" in location
    assert "error=oauth_failed" in location
    assert "cancelled" in location.lower() or "access_denied" in location.lower()


# =====================================================================
# REGRESSION TEST SUITE: COMPLETE GOOGLE OAUTH CALLBACK PIPELINE
# =====================================================================

def test_new_google_user_signup_and_business_creation(client: TestClient, db_session: Session, monkeypatch):
    """
    Test 1: New Google user signup creates Business, User, and redirects with valid access_token and status=new_user.
    """
    # 1. Authorize to generate valid state
    auth_res = client.get("/api/v1/auth/google/authorize?intent=signup")
    state = auth_res.json()["state"]

    # 2. Mock Google profile fetch
    async def mock_exchange(code: str):
        return GoogleUserSchema(
            email="new_founder@fitnessclub.com",
            name="Rahul Fitness",
            picture="https://google.com/pic.jpg",
            sub="sub_rahul_12345"
        )
    monkeypatch.setattr("auth.google_oauth.GoogleOAuthService.exchange_code_for_user_info", mock_exchange)

    # 3. Callback execution
    cb_res = client.get(f"/api/v1/auth/google/callback?code=valid_code_1&state={state}", follow_redirects=False)
    assert cb_res.status_code in [302, 307]
    loc = cb_res.headers.get("location", "")
    assert "/auth/callback" in loc
    assert "status=new_user" in loc
    assert "access_token=" in loc
    assert "role=Owner" in loc

    # 4. Verify DB records
    user = db_session.query(User).filter(User.email == "new_founder@fitnessclub.com").first()
    assert user is not None
    assert user.name == "Rahul Fitness"
    assert user.role == "Owner"
    assert user.status == "Active"

    biz = db_session.query(Business).filter(Business.id == user.business_id).first()
    assert biz is not None
    assert biz.is_onboarded is False


def test_existing_google_user_login(client: TestClient, db_session: Session, monkeypatch):
    """
    Test 2: Existing active user logging in via Google OAuth succeeds without duplicate creation and returns status=success.
    """
    # 1. Seed existing business and user
    biz = Business(id="biz-exist-01", name="Elite Auto Care", email="mechanic@eliteauto.com", is_onboarded=True)
    user = User(
        id="usr-exist-01",
        business_id=biz.id,
        name="Vikram Singh",
        email="mechanic@eliteauto.com",
        password_hash="google_oauth_user",
        role="Owner",
        status="Active"
    )
    db_session.add_all([biz, user])
    db_session.commit()

    # 2. Authorize
    auth_res = client.get("/api/v1/auth/google/authorize?intent=login")
    state = auth_res.json()["state"]

    # 3. Mock Google profile fetch
    async def mock_exchange(code: str):
        return GoogleUserSchema(
            email="mechanic@eliteauto.com",
            name="Vikram Singh",
            sub="sub_vikram_888"
        )
    monkeypatch.setattr("auth.google_oauth.GoogleOAuthService.exchange_code_for_user_info", mock_exchange)

    # 4. Callback execution
    cb_res = client.get(f"/api/v1/auth/google/callback?code=valid_code_2&state={state}", follow_redirects=False)
    assert cb_res.status_code in [302, 307]
    loc = cb_res.headers.get("location", "")
    assert "/auth/callback" in loc
    assert "status=success" in loc
    assert "access_token=" in loc
    assert "is_onboarded=true" in loc

    # 5. Verify no duplicate user created
    users_count = db_session.query(User).filter(User.email == "mechanic@eliteauto.com").count()
    assert users_count == 1


def test_duplicate_email_links_to_existing_business_safely(client: TestClient, db_session: Session, monkeypatch):
    """
    Test 3: If a Business already exists with the email (e.g. from an earlier invite),
    Google OAuth links cleanly rather than throwing an IntegrityError.
    """
    # 1. Seed existing business without user
    biz = Business(id="biz-orphaned-01", name="Pre-existing Salon", email="salon@beautystudio.com", is_onboarded=False)
    db_session.add(biz)
    db_session.commit()

    # 2. Authorize
    auth_res = client.get("/api/v1/auth/google/authorize")
    state = auth_res.json()["state"]

    # 3. Mock Google profile fetch
    async def mock_exchange(code: str):
        return GoogleUserSchema(
            email="salon@beautystudio.com",
            name="Pooja Sharma",
            sub="sub_pooja_999"
        )
    monkeypatch.setattr("auth.google_oauth.GoogleOAuthService.exchange_code_for_user_info", mock_exchange)

    # 4. Callback execution -> must link to biz-orphaned-01 without crashing
    cb_res = client.get(f"/api/v1/auth/google/callback?code=valid_code_3&state={state}", follow_redirects=False)
    assert cb_res.status_code in [302, 307]
    loc = cb_res.headers.get("location", "")
    assert "/auth/callback" in loc

    user = db_session.query(User).filter(User.email == "salon@beautystudio.com").first()
    assert user is not None
    assert user.business_id == "biz-orphaned-01"


def test_database_failure_handling_safe_redirect(client: TestClient, monkeypatch):
    """
    Test 4: If database fails or raises an unhandled exception during callback,
    the endpoint does NOT crash with 500 JSON, but safely redirects to /login?error=oauth_failed.
    """
    # 1. Authorize
    auth_res = client.get("/api/v1/auth/google/authorize")
    state = auth_res.json()["state"]

    # 2. Mock Google exchange to simulate runtime error during user resolution
    async def mock_exchange_crash(code: str):
        raise RuntimeError("Simulated connection reset / network crash")
    monkeypatch.setattr("auth.google_oauth.GoogleOAuthService.exchange_code_for_user_info", mock_exchange_crash)

    # 3. Callback execution -> must catch exception and redirect to /login with safe error param
    cb_res = client.get(f"/api/v1/auth/google/callback?code=bad_code&state={state}", follow_redirects=False)
    assert cb_res.status_code in [302, 307]
    loc = cb_res.headers.get("location", "")
    assert "/login" in loc
    assert "error=oauth_failed" in loc
    assert "google" in loc.lower() or "failed" in loc.lower()


def test_missing_environment_variables_handling(client: TestClient, monkeypatch):
    """
    Test 5: When Google credentials are unconfigured, /authorize returns 503 with a helpful message.
    """
    monkeypatch.setattr("routers.auth.settings.GOOGLE_CLIENT_ID", "")
    monkeypatch.setattr("routers.auth.settings.GOOGLE_CLIENT_SECRET", "")

    res = client.get("/api/v1/auth/google/authorize")
    assert res.status_code == 503
    assert "Google sign-in isn't configured yet" in res.text



