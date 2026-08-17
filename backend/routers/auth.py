import logging
import hashlib
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


def _create_oauth_state(db: Session, provider: str = "google", user_intent: str = "login") -> str:
    state = secrets.token_urlsafe(32)
    now = datetime.utcnow()
    expires_at = now + timedelta(seconds=OAUTH_STATE_TTL_SECONDS)
    
    # 1. Clean up expired states from DB
    try:
        db.query(OAuthState).filter(OAuthState.expires_at <= now).delete(synchronize_session=False)
    except Exception as err:
        logger.warning(f"[OAuth][StateCleanup] State purge encountered non-fatal error: {err}")
        db.rollback()

    # 2. Persist to database (survives container/server restarts)
    db_state = OAuthState(
        state=state,
        provider=provider,
        user_intent=user_intent,
        expires_at=expires_at,
        created_at=now
    )
    db.add(db_state)
    db.commit()

    # 3. Store in Redis if enabled
    if settings.REDIS_ENABLED:
        try:
            import redis
            import json
            r = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
            r.setex(f"oauth_state:{state}", OAUTH_STATE_TTL_SECONDS, json.dumps({"provider": provider, "user_intent": user_intent}))
            logger.info(f"[OAuth][StateStore] State saved to Redis key 'oauth_state:{state[:8]}...' (TTL: {OAUTH_STATE_TTL_SECONDS}s)")
        except Exception as r_err:
            logger.warning(f"[OAuth][StateStore] Redis state storage error: {r_err}")

    logger.info(
        f"[OAuth][StateGen] Generated state ID='{state[:8]}...{state[-6:]}' "
        f"provider='{provider}' intent='{user_intent}' at='{now.isoformat()}' expires_at='{expires_at.isoformat()}'"
    )
    return state


def _consume_oauth_state(db: Session, state: Optional[str], provider: str = "google") -> Tuple[bool, str, str]:
    callback_time = datetime.utcnow()
    default_intent = "login"
    if not state:
        logger.warning(f"[OAuth][StateValidate] State validation failed: missing state parameter at {callback_time.isoformat()}")
        return False, "Missing state parameter", default_intent

    # 1. Query persistent database
    row = db.query(OAuthState).filter(
        OAuthState.state == state,
        OAuthState.provider == provider
    ).first()

    # 2. Query Redis fallback if DB record is missing
    found_in_redis = False
    redis_intent = default_intent
    if not row and settings.REDIS_ENABLED:
        try:
            import redis
            import json
            r = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
            val = r.get(f"oauth_state:{state}")
            if val:
                found_in_redis = True
                r.delete(f"oauth_state:{state}")
                try:
                    parsed = json.loads(val)
                    redis_intent = parsed.get("user_intent", default_intent)
                except Exception:
                    pass
        except Exception as r_err:
            logger.warning(f"[OAuth][StateValidate] Redis lookup error: {r_err}")

    if not row and not found_in_redis:
        logger.warning(
            f"[OAuth][StateValidate] State ID='{state[:8]}...{state[-6:]}' NOT found in persistent storage at {callback_time.isoformat()}. "
            f"Result=INVALID (Reason: State does not exist or already consumed)"
        )
        return False, "State does not exist or already consumed", default_intent

    if row:
        intent = row.user_intent or default_intent
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
            return False, "State expired", intent

        logger.info(
            f"[OAuth][StateValidate] State ID='{state[:8]}...{state[-6:]}' VALID (intent={intent}). "
            f"Stored at={stored_ts}, Callback at={callback_time.isoformat()}, Expires at={expires_ts}. Result=VALID"
        )
        return True, "Valid", intent

    if found_in_redis:
        logger.info(
            f"[OAuth][StateValidate] State ID='{state[:8]}...{state[-6:]}' validated via Redis at {callback_time.isoformat()}. Result=VALID"
        )
        return True, "Valid", redis_intent

    return False, "Validation failed", default_intent

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

    from services.activity_services import ActivityService
    ActivityService.log(
        db=db,
        business_id=user.business_id,
        action="USER_LOGIN",
        entity_type="User",
        entity_id=user.id,
        details=f"User {user.name} logged in via Email/Password credentials",
        user=user
    )

    return TokenResponse(
        access_token=access_token,
        user_id=user.id,
        business_id=user.business_id,
        role=user.role
    )

@router.get("/google/authorize")
def google_authorize(
    request: Request,
    response: Response,
    intent: Optional[str] = Query("login"),
    db: Session = Depends(get_db)
):
    """
    Exposes the Google OAuth2 OpenID Connect permission redirect URI with intent tracking.
    """
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google sign-in isn't configured yet. Please sign up with email, or add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to the backend .env.",
        )
    user_intent = "signup" if intent == "signup" else "login"
    state = _create_oauth_state(db, provider="google", user_intent=user_intent)
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

    return {"authorization_url": redirect_url, "state": state, "intent": user_intent}

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
    state = _create_oauth_state(db, provider="apple", user_intent="login")
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
    Builds a browser redirect back into the SPA.
    Embeds parameters in both the query string and the URL fragment (#...)
    so that both BrowserRouter and HashRouter receive the authentication payload.
    """
    encoded_params = urlencode(params)
    frontend_base = (settings.FRONTEND_URL or "http://localhost:3000").rstrip("/")
    separator = "&" if "?" in path else "?"
    target_url = f"{frontend_base}{path}{separator}{encoded_params}#{encoded_params}"
    return RedirectResponse(url=target_url, status_code=status_code)


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
    logger.info("[OAuth Callback] Received incoming Google OAuth callback request.")

    # 1. Check if user cancelled Google consent or Google reported an error
    if error:
        logger.warning(f"[OAuth Callback] Step 0: Google OAuth returned error parameter: {error}")
        return _frontend_redirect("/login", {"error": "oauth_failed", "detail": f"Google sign-in was cancelled or encountered an error ({error})."})

    if not code:
        logger.warning("[OAuth Callback] Step 0: Google callback missing authorization code.")
        return _frontend_redirect("/login", {"error": "oauth_failed", "detail": "Missing authorization code from Google."})

    # 2. Check and consume state from persistent database / Redis
    cookie_state = request.cookies.get("autofy_oauth_state")
    effective_state = state or cookie_state
    is_valid, reason, intent = _consume_oauth_state(db, effective_state, provider="google")

    if not is_valid:
        logger.warning(f"[OAuth Callback] Step 0: State validation failed: {reason}. Gracefully redirecting to login.")
        return _frontend_redirect(
            "/login",
            {"error": "oauth_failed", "detail": "Your Google sign-in session expired or was invalid. Please try signing in again."}
        )

    email_hash = "unknown"
    try:
        # Step 1: Google code exchange & profile fetch
        logger.info("[OAuth Callback] Step 1: Initiating Google authorization code exchange...")
        try:
            google_profile = await GoogleOAuthService.exchange_code_for_user_info(code)
        except HTTPException as exc:
            logger.error(f"[OAuth Callback] Step 1 FAILED: Google token exchange HTTPException: {exc.detail}")
            return _frontend_redirect("/login", {"error": "oauth_failed", "detail": "Google sign-in failed during identity verification. Please try again."})
        except Exception as exc:
            logger.exception(f"[OAuth Callback] Step 1 FAILED: Unexpected exception during Google exchange: {exc}")
            return _frontend_redirect("/login", {"error": "oauth_failed", "detail": "Google sign-in failed during identity verification. Please try again."})

        # Step 2: Normalize and hash email for safe logging
        normalized_email = _normalize_email(google_profile.email)
        email_hash = hashlib.sha256(normalized_email.encode("utf-8")).hexdigest()[:12]
        logger.info(f"[OAuth Callback] Step 2: Google profile validated successfully (email_hash={email_hash})")

        # Step 3: Existing user lookup
        logger.info(f"[OAuth Callback] Step 3: Querying database for existing user (email_hash={email_hash})...")
        user = db.query(User).filter(func.lower(User.email) == normalized_email).first()
        user_exists = bool(user)

        # Step 4 & 5: Business and User resolution
        if not user:
            logger.info(f"[OAuth Callback] Step 4: No existing user found for email_hash={email_hash}. Resolving business workspace...")
            # Check if an existing business is registered under this email (e.g. from prior invite or orphan)
            biz = db.query(Business).filter(func.lower(Business.email) == normalized_email).first()
            business_exists = bool(biz)
            if not biz:
                logger.info(f"[OAuth Callback] Step 4a: Creating new Business entity for email_hash={email_hash}...")
                biz = Business(
                    name=google_profile.name or "New Business",
                    email=normalized_email,
                    is_onboarded=False
                )
                db.add(biz)
                db.flush()
                logger.info(f"[OAuth Callback] Step 4a SUCCESS: Created Business id={biz.id}")
            else:
                logger.info(f"[OAuth Callback] Step 4b: Linked to existing Business id={biz.id}")

            logger.info(f"[OAuth Callback] Step 5: Creating User entity for email_hash={email_hash}...")
            dummy_pwd = get_password_hash(f"sso_google_{google_profile.sub}_auth_safe_2026")
            user = User(
                business_id=biz.id,
                name=google_profile.name or normalized_email.split("@")[0],
                email=normalized_email,
                password_hash=dummy_pwd,
                role="Owner",
                status="Active"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            logger.info(f"[OAuth Callback] Step 5 SUCCESS: User created user_id={user.id}, business_id={biz.id}")
            status_param = "new_user"
        else:
            biz = db.query(Business).filter(Business.id == user.business_id).first()
            business_exists = bool(biz)
            logger.info(f"[OAuth Callback] Step 3 SUCCESS: Existing user found user_id={user.id}, status={user.status}")
            if user.status != "Active":
                logger.warning(f"[OAuth Callback] User account is deactivated user_id={user.id}, status={user.status}")
                return _frontend_redirect(
                    "/login",
                    {"error": "oauth_failed", "detail": "Your third-party federated account is currently deactivated. Please contact support."}
                )
            status_param = "success"

        # Step 6: Verify Business relationship
        biz = db.query(Business).filter(Business.id == user.business_id).first()
        is_onboarded_str = "true" if (biz and biz.is_onboarded) else "false"

        # Step 7: JWT/access token generation
        logger.info(f"[OAuth Callback] Step 7: Generating signed JWT access token for user_id={user.id}...")
        token = create_access_token(
            subject=user.id,
            additional_claims={
                "business_id": user.business_id,
                "role": user.role
            }
        )
        logger.info(f"[OAuth Callback] Step 7 SUCCESS: Access token generated successfully.")

        # Log Activity audit record safely (non-blocking)
        try:
            from services.activity_services import ActivityService
            ActivityService.log(
                db=db,
                business_id=user.business_id,
                action="GOOGLE_AUTH_LOGIN",
                entity_type="User",
                entity_id=user.id,
                details=f"User {user.name} signed in via Google OAuth SSO",
                user=user
            )
        except Exception as act_err:
            logger.warning(f"[OAuth Callback] Non-fatal: ActivityService audit log skipped: {act_err}")

        # Required backend structured log format:
        final_redirect_path = f"/auth/callback?status={status_param}"
        logger.info(
            f"[OAuth Callback] intent={intent} email={user.email} user_exists={user_exists} "
            f"business_exists={business_exists} final_redirect={final_redirect_path}"
        )

        # Step 8: Frontend redirect
        return _frontend_redirect(
            "/auth/callback",
            {
                "status": status_param,
                "access_token": token,
                "user_id": user.id,
                "business_id": user.business_id,
                "role": user.role,
                "email": user.email,
                "name": user.name or "",
                "is_onboarded": is_onboarded_str,
                "source": intent,
            }
        )

    except Exception as exc:
        logger.exception(f"[OAuth Callback] FATAL unhandled exception during callback execution (email_hash={email_hash}): {exc}")
        try:
            db.rollback()
        except Exception:
            pass
        return _frontend_redirect(
            "/login",
            {"error": "oauth_failed", "detail": "Google login failed. Please try again."}
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
