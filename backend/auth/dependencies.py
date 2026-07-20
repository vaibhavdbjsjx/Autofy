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
