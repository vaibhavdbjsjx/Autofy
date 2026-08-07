import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime
from database import Base


class OAuthState(Base):
    __tablename__ = "oauth_states"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    state = Column(String(255), unique=True, nullable=False, index=True)
    provider = Column(String(50), default="google", nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
