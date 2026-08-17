from typing import List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from config import settings
from database import get_db
from auth.security import decode_access_token
from models.user import User

# Standard OAuth2 password flow scheme
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Core dependency to extract, verify, and return the currently authenticated user.
    Throws 401 Unauthorized if token invalid or expired.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials, login session may have expired.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Cryptographically decode claims payload
    claims = decode_access_token(token)
    if claims is None:
        raise credentials_exception
        
    user_id: Optional[str] = claims.get("sub")
    if user_id is None:
        raise credentials_exception
        
    # Query Database for corresponding User entity
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
        
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Ensures that the authenticated user is currently safe and active.
    """
    if current_user.status != "Active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your workspace context account has been deactivated or is pending."
        )
    return current_user

class RoleChecker:
    """
    Reusable Role Based Access Control (RBAC) dependency helper.
    Restricts access to specific endpoints based on user roles (Owner, Admin, Manager, etc.).
    """
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_active_user)) -> User:
        """
        Executes role-level verification procedures on the user context object.
        """
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required permission roles: {self.allowed_roles}"
            )
        return current_user

def require_live_entitlement(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> User:
    """
    Server-side entitlement dependency.
    Validates that caller's business has an active subscription or active 7-day free trial.
    """
    from services.entitlement_services import EntitlementService
    sub_state = EntitlementService.evaluate_subscription_state(db, current_user.business_id)
    if not sub_state.get("is_live_accessible", False):
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Live operation requires an active subscription or active 7-day free trial. Please start a trial or upgrade your plan."
        )
    return current_user

class FeatureChecker:
    """
    Server-side feature entitlement dependency.
    Validates that caller's active plan includes permission for feature_name (e.g. 'custom_rag', 'appointments_booking').
    """
    def __init__(self, feature_name: str):
        self.feature_name = feature_name

    def __call__(
        self,
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
    ) -> User:
        from services.entitlement_services import EntitlementService
        sub_state = EntitlementService.evaluate_subscription_state(db, current_user.business_id)
        if not sub_state.get("is_live_accessible", False):
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="Live operation requires an active subscription or active 7-day free trial."
            )
        entitlements = sub_state.get("entitlements", {})
        if not entitlements.get(self.feature_name, True):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"The feature '{self.feature_name}' is not included in your current {sub_state.get('plan_name')}. Please upgrade your plan to unlock."
            )
        return current_user


def require_permission(permission_key: str):
    """
    Dependency checking fine-grained role capabilities against ROLE_PERMISSIONS_MATRIX.
    Supported permissions: can_edit_pricing, can_reply_chats, can_manage_payments,
    can_export_data, can_change_whatsapp, can_manage_team, can_delete_account.
    """
    def _perm_checker(current_user: User = Depends(get_current_active_user)) -> User:
        from routers.team_member import ROLE_PERMISSIONS_MATRIX
        role = current_user.role or "Support Agent"
        perms = ROLE_PERMISSIONS_MATRIX.get(role, ROLE_PERMISSIONS_MATRIX.get("Support Agent", {}))
        if not perms.get(permission_key, False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Your role '{role}' does not have the required '{permission_key}' permission."
            )
        return current_user
    return _perm_checker

