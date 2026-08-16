import logging
from datetime import datetime, timedelta
import secrets
from typing import Optional, Tuple
from urllib.parse import urlencode
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, Response
from fastapi.responses import RedirectResponse
from sqlalchemy import func
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field
from config import settings
from database import get_db
from models.user import User
from models.business import Business
from models.oauth_state import OAuthState
from auth.security import (
    get_password_hash, verify_password, create_access_token,
    create_password_reset_token, decode_password_reset_token
)
from auth.google_oauth import GoogleOAuthService
from auth.dependencies import get_current_active_user

logger = logging.getLogger("autofy.auth")

router = APIRouter(prefix="/auth", tags=["Authentication"])

OAUTH_STATE_TTL_SECONDS = 600  # 10 minutes TTL


def _normalize_email(email: str) -> str:
    return str(email).strip().lower()


def _create_oauth_state(db: Session, provider: str = "google") -> str:
    state = secrets.token_urlsafe(32)
    now = datetime.utcnow()
    expires_at = now + timedelta(seconds=OAUTH_STATE_TTL_SECONDS)
    
    # 1. Clean up expired states from DB
    try:
        db.query(OAuthState).filter(OAuthState.expires_at <= now).delete(synchronize_session=False)
    except Exception as err:
        logger.warning(f"[OAuth][StateCleanup] State purge encountered non-fatal error: {err}")
        db.rollback()

    # 2. Persist to PostgreSQL database (survives container/server restarts)
    db_state = OAuthState(
        state=state,
        provider=provider,
        expires_at=expires_at,
        created_at=now
    )
    db.add(db_state)
    db.commit()

    # 3. Store in Redis if enabled
    if settings.REDIS_ENABLED:
        try:
            import redis
            r = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
            r.setex(f"oauth_state:{state}", OAUTH_STATE_TTL_SECONDS, provider)
            logger.info(f"[OAuth][StateStore] State saved to Redis key 'oauth_state:{state[:8]}...' (TTL: {OAUTH_STATE_TTL_SECONDS}s)")
        except Exception as r_err:
            logger.warning(f"[OAuth][StateStore] Redis state storage error: {r_err}")

    logger.info(
        f"[OAuth][StateGen] Generated state ID='{state[:8]}...{state[-6:]}' "
        f"provider='{provider}' at='{now.isoformat()}' expires_at='{expires_at.isoformat()}'"
    )
    return state


def _consume_oauth_state(db: Session, state: Optional[str], provider: str = "google") -> Tuple[bool, str]:
    callback_time = datetime.utcnow()
    if not state:
        logger.warning(f"[OAuth][StateValidate] State validation failed: missing state parameter at {callback_time.isoformat()}")
        return False, "Missing state parameter"

    # 1. Query persistent PostgreSQL database
    row = db.query(OAuthState).filter(
        OAuthState.state == state,
        OAuthState.provider == provider
    ).first()

    # 2. Query Redis fallback if DB record is missing
    found_in_redis = False
    if not row and settings.REDIS_ENABLED:
        try:
            import redis
            r = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
            val = r.get(f"oauth_state:{state}")
            if val:
                found_in_redis = True
                r.delete(f"oauth_state:{state}")
        except Exception as r_err:
            logger.warning(f"[OAuth][StateValidate] Redis lookup error: {r_err}")

    if not row and not found_in_redis:
        logger.warning(
            f"[OAuth][StateValidate] State ID='{state[:8]}...{state[-6:]}' NOT found in persistent storage at {callback_time.isoformat()}. "
            f"Result=INVALID (Reason: State does not exist or already consumed)"
        )
        return False, "State does not exist or already consumed"

    if row:
        is_expired = row.expires_at <= callback_time
        stored_ts = row.created_at.isoformat() if row.created_at else "unknown"
        expires_ts = row.expires_at.isoformat() if row.expires_at else "unknown"
        
        # Single-use consumption: delete from DB immediately
        try:
            db.delete(row)
            db.commit()
        except Exception:
            db.rollback()

        if is_expired:
            logger.warning(
                f"[OAuth][StateValidate] State ID='{state[:8]}...{state[-6:]}' EXPIRED at {callback_time.isoformat()}. "
                f"Stored at={stored_ts}, expired at={expires_ts}. Result=EXPIRED"
            )
            return False, "State expired"

        logger.info(
            f"[OAuth][StateValidate] State ID='{state[:8]}...{state[-6:]}' VALID. "
            f"Stored at={stored_ts}, Callback at={callback_time.isoformat()}, Expires at={expires_ts}. Result=VALID"
        )
        return True, "Valid"

    if found_in_redis:
        logger.info(
            f"[OAuth][StateValidate] State ID='{state[:8]}...{state[-6:]}' validated via Redis at {callback_time.isoformat()}. Result=VALID"
        )
        return True, "Valid"

    return False, "Validation failed"

# Inbound Request Schemas
class SignupRequest(BaseModel):
    name: str                       # Owner name
    business_name: str              # Company name
    email: EmailStr                 # Workspace Admin unique email
    phone: str = ""                 # Contact line
    password: str = Field(..., min_length=8)  # Account password (minimum 8 characters)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    business_id: str
    role: str

@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    """
    Unified Account Setup: Registers a brand-new Company Business profile,
    and binds the initial corporate workspace Owner User account parameters.
    """
    # 1. Block existing email registrations
    normalized_email = _normalize_email(payload.email)
    existing_user = db.query(User).filter(func.lower(User.email) == normalized_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account is already registered with this email address."
        )

    # 2. Persist Business properties in a clean transactional unit
    new_business = Business(
        name=payload.business_name,
        email=normalized_email,
        phone=payload.phone,
        is_onboarded=False
    )
    db.add(new_business)
    db.flush()  # Extract the autogenerated business.id

    # 3. Create, salt/hash password, and save Owner User
    hashed_pwd = get_password_hash(payload.password)
    new_owner = User(
        business_id=new_business.id,
        name=payload.name,
        email=normalized_email,
        password_hash=hashed_pwd,
        role="Owner",
        status="Active"
    )
    db.add(new_owner)
    db.commit()
    db.refresh(new_owner)

    # 4. Generate signed authentication claims token
    access_token = create_access_token(
        subject=new_owner.id,
        additional_claims={
            "business_id": new_business.id,
            "role": "Owner"
        }
    )

    return TokenResponse(
        access_token=access_token,
        user_id=new_owner.id,
        business_id=new_business.id,
        role="Owner"
    )

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Core sign-in gateway verifying salted credentials and returning valid signed JWTs.
    """
    normalized_email = _normalize_email(payload.email)
    user = db.query(User).filter(func.lower(User.email) == normalized_email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password credential details."
        )

    if user.status != "Active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your corporate workspace account is currently deactivated."
        )

    access_token = create_access_token(
        subject=user.id,
        additional_claims={
            "business_id": user.business_id,
            "role": user.role
        }
    )

    return TokenResponse(
        access_token=access_token,
        user_id=user.id,
        business_id=user.business_id,
        role=user.role
    )

@router.get("/google/authorize")
def google_authorize(request: Request, response: Response, db: Session = Depends(get_db)):
    """
    Exposes the Google OAuth2 OpenID Connect permission redirect URI.

    If Google credentials aren't configured, fail with a clear message so the
    SPA shows "Google sign-in isn't set up" instead of sending the user to a
    broken Google error page (empty client_id).
    """
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google sign-in isn't configured yet. Please sign up with email, or add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to the backend .env.",
        )
    state = _create_oauth_state(db, provider="google")
    redirect_url = GoogleOAuthService.get_authorization_url(state=state)

    # Secure HTTPS Cookie fallback for Render/reverse proxies
    is_secure = (request.url.scheme == "https") or (request.headers.get("x-forwarded-proto") == "https")
    response.set_cookie(
        key="autofy_oauth_state",
        value=state,
        max_age=OAUTH_STATE_TTL_SECONDS,
        httponly=True,
        secure=is_secure,
        samesite="lax"
    )

    return {"authorization_url": redirect_url, "state": state}

@router.get("/apple/authorize")
def apple_authorize(request: Request, response: Response, db: Session = Depends(get_db)):
    """
    Exposes the Sign in with Apple OAuth2 OpenID Connect permission redirect URI.
    """
    if not getattr(settings, "APPLE_CLIENT_ID", "") or not getattr(settings, "APPLE_TEAM_ID", ""):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Sign in with Apple isn't configured yet. APPLE_CLIENT_ID and APPLE_TEAM_ID are required in .env.",
        )
    state = _create_oauth_state(db, provider="apple")
    params = {
        "client_id": settings.APPLE_CLIENT_ID,
        "redirect_uri": getattr(settings, "APPLE_REDIRECT_URI", "https://autofysaas.com/api/v1/auth/apple/callback"),
        "response_type": "code id_token",
        "response_mode": "form_post",
        "scope": "name email",
        "state": state
    }
    redirect_url = f"https://appleid.apple.com/auth/authorize?{urlencode(params)}"
    return {"authorization_url": redirect_url, "state": state}

def _frontend_redirect(path: str, params: dict, status_code: int = status.HTTP_307_TEMPORARY_REDIRECT) -> RedirectResponse:
    """
    Builds a browser redirect back into the SPA. Auth params ride in the URL
    fragment (#...) so the token never reaches server access logs / referrers.
    """
    fragment = urlencode(params)
    return RedirectResponse(url=f"{settings.FRONTEND_URL}{path}#{fragment}", status_code=status_code)


@router.get("/google/callback")
async def google_callback(
    request: Request,
    response: Response,
    code: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    error: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Receives Google's code exchange parameter, verifies state credentials,
    re-fetches active User account profiles, or registers brand new tenants,
    then redirects the browser back to the SPA with a signed session token.
    """
    # 1. Check if user cancelled Google consent or Google reported an error
    if error:
        logger.warning(f"[OAuth][Callback] Google OAuth returned error parameter: {error}")
        return _frontend_redirect("/login", {"auth_error": f"Google sign-in was cancelled or encountered an error ({error})."})

    if not code:
        logger.warning("[OAuth][Callback] Google callback missing authorization code.")
        return _frontend_redirect("/login", {"auth_error": "Missing authorization code from Google."})

    # 2. Check and consume state from persistent database / Redis
    cookie_state = request.cookies.get("autofy_oauth_state")
    effective_state = state or cookie_state
    is_valid, reason = _consume_oauth_state(db, effective_state, provider="google")

    if not is_valid:
        logger.warning(f"[OAuth][Callback] State validation failed: {reason}. Gracefully redirecting to login.")
        return _frontend_redirect(
            "/login",
            {"auth_error": "Your Google sign-in session expired or was invalid. Please try signing in again."}
        )

    # 3. Exchange authorization grant code for user identity profile
    try:
        google_profile = await GoogleOAuthService.exchange_code_for_user_info(code)
    except HTTPException as exc:
        logger.error(f"[OAuth][Callback] Google userinfo/token exchange error: {exc.detail}")
        return _frontend_redirect("/login", {"auth_error": str(exc.detail)})
    except Exception as exc:
        logger.error(f"[OAuth][Callback] Unexpected Google token exchange exception: {exc}")
        return _frontend_redirect("/login", {"auth_error": "Failed to exchange authorization grant with Google."})

    # Check if this third-party user already possesses an active Autofy profile
    normalized_email = _normalize_email(google_profile.email)
    user = db.query(User).filter(func.lower(User.email) == normalized_email).first()

    if not user:
        # Create a new Business workspace and Active User dynamically if not found (Needs onboarding)
        # We do NOT set default fallback strings like "Studio Suite" — business name must come from onboarding.
        new_business = Business(
            name=google_profile.name or "New Business",
            email=normalized_email,
            is_onboarded=False
        )
        db.add(new_business)
        db.flush()
        
        # Salt-hash dummy codes for federated SSO users
        dummy_pwd = get_password_hash(f"sso_google_{google_profile.sub}_auth_safe_2026")
        user = User(
            business_id=new_business.id,
            name=google_profile.name or normalized_email.split("@")[0],
            email=normalized_email,
            password_hash=dummy_pwd,
            role="Owner",
            status="Active"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        if user.status != "Active":
            return _frontend_redirect(
                "/login",
                {"auth_error": "Your third-party federated account is currently deactivated."}
            )

    token = create_access_token(
        subject=user.id,
        additional_claims={
            "business_id": user.business_id,
            "role": user.role
        }
    )

    # Hand the browser back to the SPA with the session token + profile.
    biz = db.query(Business).filter(Business.id == user.business_id).first()
    is_onboarded_str = "true" if (biz and biz.is_onboarded) else "false"

    return _frontend_redirect(
        "/auth/callback",
        {
            "access_token": token,
            "user_id": user.id,
            "business_id": user.business_id,
            "role": user.role,
            "email": user.email,
            "name": user.name or "",
            "is_onboarded": is_onboarded_str,
        }
    )

class AccountDeletionRequest(BaseModel):
    confirmation_text: str
    password: Optional[str] = None

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    business_name: Optional[str] = None
    phone: Optional[str] = None

@router.get("/me")
def get_current_user_profile(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Returns current authenticated user profile and business account info.
    """
    biz = db.query(Business).filter(Business.id == current_user.business_id).first()
    return {
        "user_id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "status": current_user.status,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        "is_onboarded": biz.is_onboarded if biz else True,
        "business": {
            "id": current_user.business_id,
            "name": biz.name if biz else "",
            "phone": biz.phone if biz else "",
            "email": biz.email if biz else "",
            "timezone": biz.timezone if biz else "IST - Kolkata (GMT+5:30)",
            "is_onboarded": biz.is_onboarded if biz else True,
        } if biz else None
    }

@router.put("/profile")
def update_current_user_profile(
    payload: ProfileUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Updates non-sensitive profile parameters (Name, Business Name, Phone).
    Email modifications are restricted to prevent identity takeover.
    """
    if payload.name:
        current_user.name = payload.name.strip()
    
    biz = db.query(Business).filter(Business.id == current_user.business_id).first()
    if biz:
        if payload.business_name:
            biz.name = payload.business_name.strip()
        if payload.phone:
            biz.phone = payload.phone.strip()

    db.commit()
    return {
        "status": "success",
        "message": "Profile updated successfully.",
        "name": current_user.name,
        "business_name": biz.name if biz else ""
    }

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)

@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Securely updates current authenticated user password.
    Requires valid current_password verification and minimum 8-character new password.
    """
    if current_user.password_hash and current_user.password_hash.startswith("$2"):
        if not verify_password(payload.current_password, current_user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Current password verification failed."
            )

    current_user.password_hash = get_password_hash(payload.new_password)
    db.commit()
    return {"status": "success", "message": "Password updated successfully."}

@router.delete("/delete-account")
def delete_account(
    payload: AccountDeletionRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Permanently deletes user account, business profile, and operational data.
    Requires explicit confirmation_text == 'DELETE' and password verification for password-authenticated accounts.
    """
    if payload.confirmation_text.strip() != "DELETE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account deletion requires explicit confirmation text 'DELETE'."
        )

    # Verify password if user has password set
    if current_user.password_hash and current_user.password_hash != "google_oauth_user":
        if not payload.password or not verify_password(payload.password, current_user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Password verification failed. Incorrect password."
            )

    from services.account_deletion_service import AccountDeletionService
    result = AccountDeletionService.execute_business_account_deletion(
        db=db,
        business_id=current_user.business_id,
        user_id=current_user.id
    )
    return result

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)

@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Initiates password recovery. Always returns 200 generic message to prevent account enumeration.
    """
    normalized_email = _normalize_email(payload.email)
    user = db.query(User).filter(func.lower(User.email) == normalized_email).first()
    if user:
        reset_token = create_password_reset_token(normalized_email)
        # Log event securely (in production would trigger email dispatch)
        import logging
        logging.getLogger("auth_recovery").info(f"Password reset token issued for {normalized_email}")
        return {
            "status": "success",
            "message": "If an account matches that email address, password reset instructions have been dispatched.",
            "reset_token": reset_token if (settings.ENVIRONMENT.lower() in ["development", "dev", "test", "local"] or os.environ.get("TESTING") == "true") else None
        }
    return {
        "status": "success",
        "message": "If an account matches that email address, password reset instructions have been dispatched."
    }

@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Validates password reset token and securely sets a new password hash.
    """
    email = decode_password_reset_token(payload.token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid, malformed, or expired password reset token."
        )

    user = db.query(User).filter(func.lower(User.email) == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found."
        )

    user.password_hash = get_password_hash(payload.new_password)
    db.commit()
    return {
        "status": "success",
        "message": "Your password has been successfully reset. You may now log in."
    }

@router.post("/logout")
def logout(current_user: User = Depends(get_current_active_user)):
    """
    Client-side session termination handshake.
    """
    return {
        "status": "success",
        "message": "Logged out successfully."
    }
