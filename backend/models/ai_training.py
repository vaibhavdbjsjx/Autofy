import uuid
from datetime import datetime
from sqlalchemy import Column, String, ForeignKey, DateTime, Text, Float, Boolean, Integer
from sqlalchemy.orm import relationship
from database import Base

class AILog(Base):
    __tablename__ = "ai_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    business_id = Column(String(36), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    user_query = Column(Text, nullable=False)
    ai_response = Column(Text, nullable=False)
    confidence = Column(Float, default=1.0, nullable=False) # 0.0 to 1.0 confidence reports
    status = Column(String(50), default="reviewed", nullable=False) # raw, corrected, verified
    corrected_response = Column(Text, nullable=True) # correction of wrong answers
    is_failed_or_low_confidence = Column(Boolean, default=False, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    business = relationship("Business")


class AIKnowledgeGap(Base):
    __tablename__ = "ai_knowledge_gaps"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    business_id = Column(String(36), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    topic = Column(String(255), nullable=False)
    unanswered_query = Column(Text, nullable=False)
    hit_count = Column(Integer, default=1, nullable=False)
    suggested_faq_question = Column(Text, nullable=True)
    suggested_faq_answer = Column(Text, nullable=True)
    status = Column(String(50), default="detected", nullable=False) # detected, trained, dismissed
    created_at = Column(DateTime, default=datetime.utcnow)

    business = relationship("Business")


class AITrainedAnswer(Base):
    __tablename__ = "ai_trained_answers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    business_id = Column(String(36), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    trigger_phrase = Column(String(255), nullable=False)
    trained_response = Column(Text, nullable=False)
    status = Column(String(50), default="active", nullable=False) # active, draft, archived
    created_at = Column(DateTime, default=datetime.utcnow)

    business = relationship("Business")
