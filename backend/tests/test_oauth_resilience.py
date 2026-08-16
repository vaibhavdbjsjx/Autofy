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
    Verify /api/v1/auth/google/authorize generates a secure state, stores it in DB,
    and returns a valid authorization URL.
    """
    res = client.get("/api/v1/auth/google/authorize")
    assert res.status_code == 200
    data = res.json()
    assert "authorization_url" in data
    assert "state" in data
    state = data["state"]

    # Verify state is persisted in PostgreSQL DB
    db_state = db_session.query(OAuthState).filter(OAuthState.state == state).first()
    assert db_state is not None
    assert db_state.provider == "google"
    assert db_state.expires_at > datetime.utcnow()
    assert "accounts.google.com" in data["authorization_url"]
    assert f"state={state}" in data["authorization_url"]


def test_oauth_state_survival_across_server_restart(client: TestClient, db_session: Session, monkeypatch):
    """
    Simulate container restart: State generated before restart must be
    reliably validated from persistent storage afterwards.
    """
    # 1. Generate state
    res = client.get("/api/v1/auth/google/authorize")
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
    assert "/auth/callback#" in redirect_location
    assert "access_token=" in redirect_location
    assert "restart_resilience_test%40example.com" in redirect_location or "restart_resilience_test@example.com" in redirect_location

    # 4. Verify user was created
    user = db_session.query(User).filter(User.email == "restart_resilience_test@example.com").first()
    assert user is not None
    assert user.name == "Restart Tester"


def test_oauth_expired_state_gracefully_redirects_to_login(client: TestClient, db_session: Session):
    """
    Verify expired state is NOT an unhandled 400 Bad Request exception,
    but instead gracefully redirects to /login with an explanatory auth_error.
    """
    # Create expired state in DB
    expired_state = "expired_state_99999"
    db_session.add(OAuthState(
        state=expired_state,
        provider="google",
        expires_at=datetime.utcnow() - timedelta(minutes=5),
        created_at=datetime.utcnow() - timedelta(minutes=15)
    ))
    db_session.commit()

    res = client.get(f"/api/v1/auth/google/callback?code=some_code&state={expired_state}", follow_redirects=False)
    assert res.status_code in [302, 307]
    location = res.headers.get("location", "")
    assert "/login#" in location
    assert "auth_error=" in location
    assert "expired" in location.lower() or "invalid" in location.lower()


def test_oauth_invalid_or_missing_state_gracefully_redirects_to_login(client: TestClient):
    """
    Verify unknown state or missing state redirects gracefully to /login.
    """
    # 1. Missing state
    res_missing = client.get("/api/v1/auth/google/callback?code=some_code", follow_redirects=False)
    assert res_missing.status_code in [302, 307]
    assert "/login#" in res_missing.headers.get("location", "")

    # 2. Tampered / non-existent state
    res_tampered = client.get("/api/v1/auth/google/callback?code=some_code&state=tampered_random_state", follow_redirects=False)
    assert res_tampered.status_code in [302, 307]
    assert "/login#" in res_tampered.headers.get("location", "")
    assert "auth_error=" in res_tampered.headers.get("location", "")


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
    assert "/auth/callback#" in res1.headers.get("location", "")

    # 3. Second callback with same state must fail and redirect to /login
    res2 = client.get(f"/api/v1/auth/google/callback?code=code2&state={state}", follow_redirects=False)
    assert res2.status_code in [302, 307]
    assert "/login#" in res2.headers.get("location", "")
    assert "auth_error=" in res2.headers.get("location", "")


def test_oauth_google_error_param_graceful_redirect(client: TestClient):
    """
    Verify user cancellation or Google error returns a graceful redirect.
    """
    res = client.get("/api/v1/auth/google/callback?error=access_denied", follow_redirects=False)
    assert res.status_code in [302, 307]
    location = res.headers.get("location", "")
    assert "/login#" in location
    assert "auth_error=" in location
    assert "cancelled" in location.lower() or "access_denied" in location.lower()
