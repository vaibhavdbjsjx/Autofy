from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from database import get_db
from models.user import User
from models.business import Business
from auth.dependencies import get_current_active_user, RoleChecker

router = APIRouter(prefix="/business", tags=["Business Profiles"])

# Update payload schemas
class BusinessUpdateSchema(BaseModel):
    name: Optional[str] = None
    classification: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    website: Optional[str] = None
    address: Optional[str] = None
    logo_url: Optional[str] = None
    business_hours: Optional[str] = None
    timezone: Optional[str] = None

    # AI Behaviors parameters
    config_agent_name: Optional[str] = None
    config_welcome_message: Optional[str] = None
    config_fallback_message: Optional[str] = None
    config_confidence_threshold: Optional[float] = None

class BusinessResponseSchema(BaseModel):
    id: str
    name: str
    classification: Optional[str] = None
    phone: Optional[str] = None
    email: str
    website: Optional[str] = None
    address: Optional[str] = None
    logo_url: Optional[str] = None
    business_hours: Optional[str] = None
    timezone: str
    config_agent_name: str
    config_welcome_message: Optional[str] = None
    config_fallback_message: Optional[str] = None
    config_confidence_threshold: float

@router.get("/profile", response_model=BusinessResponseSchema)
def get_business_profile(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves the corporate business entity details corresponding to the caller's organization.
    """
    business = db.query(Business).filter(Business.id == current_user.business_id).first()
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business profile entity was not found."
        )
    return business

@router.put("/profile", response_model=BusinessResponseSchema)
def update_business_profile(
    payload: BusinessUpdateSchema,
    current_user: User = Depends(RoleChecker(["Owner", "Admin"])),
    db: Session = Depends(get_db)
):
    """
    Updates operational business parameters, hours, timezone, or AI parameters.
    Restricted to Owners and Admins only using RBAC.
    """
    business = db.query(Business).filter(Business.id == current_user.business_id).first()
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business profile entity not found."
        )

    # Perform recursive updates on specified non-null values
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(business, key, value)

    db.commit()
    db.refresh(business)
    return business
