from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Union
from jose import jwt, JWTError
from passlib.context import CryptContext
from config import settings

# Initialize password hashing engine
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Validates a plain password against its salted hash value.
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    Hashes a password utilizing the bcrypt algorithm.
    """
    return pwd_context.hash(password)

def create_access_token(
    subject: Union[str, Any],
    expires_delta: Optional[timedelta] = None,
    additional_claims: Optional[Dict[str, Any]] = None
) -> str:
    """
    Generates a secure cryptographically-signed JWT Access Token.
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    # Bundle key-value parameters inside the JWT Claims payload
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "access_token"
    }
    
    if additional_claims:
        to_encode.update(additional_claims)
        
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decodes and cryptographically verifies a JWT Access Token.
    Returns the claims dict if successful, or None if token is invalid/expired.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        if payload.get("type") != "access_token":
            return None
        return payload
    except JWTError:
        return None

def create_password_reset_token(email: str, expires_minutes: int = 15) -> str:
    """
    Generates a short-lived cryptographically signed token for password recovery.
    """
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
    to_encode = {
        "exp": expire,
        "sub": email.strip().lower(),
        "type": "password_reset"
    }
    return jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )

def decode_password_reset_token(token: str) -> Optional[str]:
    """
    Decodes and validates a password reset token, returning the subject email.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        if payload.get("type") != "password_reset":
            return None
        return payload.get("sub")
    except JWTError:
        return None
