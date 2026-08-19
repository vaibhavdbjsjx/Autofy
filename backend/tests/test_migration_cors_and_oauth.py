import pytest
from fastapi.testclient import TestClient
from main import app
from config import settings

client = TestClient(app)

def test_cors_old_netlify_origin_allowed():
    """Verify that requests from the old Netlify frontend continue to be permitted with credentials."""
    headers = {
        "Origin": "https://autofy11.netlify.app",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Authorization,Content-Type",
    }
    response = client.options("/api/v1/auth/login", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://autofy11.netlify.app"
    assert response.headers.get("access-control-allow-credentials") == "true"

def test_cors_new_netlify_origin_allowed():
    """Verify that requests from a NEW Netlify frontend are automatically permitted with credentials."""
    new_origins = [
        "https://autofy-app.netlify.app",
        "https://autofy-production.netlify.app",
        "https://deploy-preview-42.netlify.app",
        "https://my-new-autofy-site.netlify.app",
    ]
    for origin in new_origins:
        headers = {
            "Origin": origin,
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Authorization",
        }
        response = client.options("/api/v1/auth/me", headers=headers)
        assert response.status_code == 200, f"Failed for origin: {origin}"
        assert response.headers.get("access-control-allow-origin") == origin, f"Origin not matched: {origin}"
        assert response.headers.get("access-control-allow-credentials") == "true"

def test_cors_localhost_allowed():
    """Verify that local development origins remain allowed."""
    headers = {
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "GET",
    }
    response = client.options("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"
    assert response.headers.get("access-control-allow-credentials") == "true"

def test_cors_unauthorized_origin_rejected():
    """Verify that random untrusted third-party origins do NOT get CORS headers."""
    headers = {
        "Origin": "https://evil-phishing-site.com",
        "Access-Control-Request-Method": "POST",
    }
    response = client.options("/api/v1/auth/login", headers=headers)
    assert response.headers.get("access-control-allow-origin") != "https://evil-phishing-site.com"

def test_oauth_redirect_uses_configured_frontend_url(monkeypatch):
    """Verify that OAuth callback redirects directly to the configured FRONTEND_URL."""
    from routers.auth import _frontend_redirect
    
    # Test with a new Netlify URL
    new_frontend = "https://autofy-brand-new.netlify.app"
    monkeypatch.setattr(settings, "FRONTEND_URL", new_frontend)
    
    redirect_resp = _frontend_redirect("/auth/callback", {"status": "success", "access_token": "mock_token_123"})
    assert redirect_resp.status_code == 307
    location = redirect_resp.headers.get("location", "")
    assert location.startswith(new_frontend)
    assert "/auth/callback" in location
    assert "status=success" in location
    assert "access_token=mock_token_123" in location
