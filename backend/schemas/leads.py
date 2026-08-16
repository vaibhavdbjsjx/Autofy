from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class LeadBase(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    email: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    status: str = Field("New", max_length=50)
    pipeline_stage: str = Field("New", max_length=50)
    source: str = Field("WhatsApp", max_length=100)
    score: int = Field(10, ge=0)
    deal_value: int = Field(0, ge=0)
    tags: Optional[str] = None
    notes: Optional[str] = None
    assigned_to_user_id: Optional[str] = None
    assigned_to_name: Optional[str] = None
    follow_up_at: Optional[datetime] = None
    follow_up_notes: Optional[str] = None

class LeadCreate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    email: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    status: Optional[str] = Field("New", max_length=50)
    pipeline_stage: Optional[str] = Field("New", max_length=50)
    source: Optional[str] = Field("WhatsApp", max_length=100)
    score: Optional[int] = Field(10, ge=0)
    deal_value: Optional[int] = Field(0, ge=0)
    tags: Optional[str] = None
    notes: Optional[str] = None
    assigned_to_user_id: Optional[str] = None
    assigned_to_name: Optional[str] = None
    follow_up_at: Optional[datetime] = None
    follow_up_notes: Optional[str] = None

class LeadUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    email: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    status: Optional[str] = Field(None, max_length=50)
    pipeline_stage: Optional[str] = Field(None, max_length=50)
    source: Optional[str] = Field(None, max_length=100)
    score: Optional[int] = Field(None, ge=0)
    deal_value: Optional[int] = Field(None, ge=0)
    tags: Optional[str] = None
    notes: Optional[str] = None
    assigned_to_user_id: Optional[str] = None
    assigned_to_name: Optional[str] = None
    follow_up_at: Optional[datetime] = None
    follow_up_notes: Optional[str] = None

class LeadResponse(LeadBase):
    id: str
    business_id: str
    converted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class LeadScoreResponse(BaseModel):
    lead_id: str
    previous_score: int
    new_score: int
    matched_criteria: List[str]
    notes: str
