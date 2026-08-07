from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field

class AppointmentBase(BaseModel):
    customer_name: str = Field(..., max_length=255, description="Full name of customer booking appointment")
    customer_phone: Optional[str] = Field(None, max_length=50)
    customer_email: Optional[str] = Field(None, max_length=255)
    
    appointment_date: datetime = Field(..., description="Date and time of appointment in ISO format")
    start_time: str = Field(..., max_length=50, description="Start time string e.g. 10:00 AM")
    end_time: Optional[str] = Field(None, max_length=50, description="End time string e.g. 11:00 AM")
    timezone: str = Field("UTC", max_length=50)
    
    status: str = Field("Scheduled", description="Scheduled, Confirmed, Completed, Cancelled, No-show")
    notes: Optional[str] = None
    
    lead_id: Optional[str] = None
    service_id: Optional[str] = None
    conversation_id: Optional[str] = None

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentUpdate(BaseModel):
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    appointment_date: Optional[datetime] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    timezone: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    lead_id: Optional[str] = None
    service_id: Optional[str] = None

class AppointmentResponse(AppointmentBase):
    id: str
    business_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
