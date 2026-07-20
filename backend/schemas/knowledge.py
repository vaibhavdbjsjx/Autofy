from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field

# ==================== SERVICE SCHEMAS ====================
class ServiceBase(BaseModel):
    name: str = Field(..., max_length=255)
    price: Decimal = Field(default=0.00, ge=0.0)
    description: Optional[str] = None
    duration_minutes: int = Field(default=30, gt=0)

class ServiceCreate(ServiceBase):
    pass

class ServiceUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    price: Optional[Decimal] = Field(None, ge=0.0)
    description: Optional[str] = None
    duration_minutes: Optional[int] = Field(None, gt=0)

class ServiceResponse(ServiceBase):
    id: str
    business_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== PRODUCT SCHEMAS ====================
class ProductBase(BaseModel):
    name: str = Field(..., max_length=255)
    price: Decimal = Field(default=0.00, ge=0.0)
    stock: int = Field(default=0, ge=0)
    image_url: Optional[str] = None
    description: Optional[str] = None
    is_available: bool = True

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    price: Optional[Decimal] = Field(None, ge=0.0)
    stock: Optional[int] = Field(None, ge=0)
    image_url: Optional[str] = None
    description: Optional[str] = None
    is_available: Optional[bool] = None

class ProductResponse(ProductBase):
    id: str
    business_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== MEMBERSHIP PLAN SCHEMAS ====================
class MembershipPlanBase(BaseModel):
    name: str = Field(..., max_length=255)
    price: Decimal = Field(default=0.00, ge=0.0)
    duration_months: int = Field(default=1, gt=0)
    description: Optional[str] = None

class MembershipPlanCreate(MembershipPlanBase):
    pass

class MembershipPlanUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    price: Optional[Decimal] = Field(None, ge=0.0)
    duration_months: Optional[int] = Field(None, gt=0)
    description: Optional[str] = None

class MembershipPlanResponse(MembershipPlanBase):
    id: str
    business_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== FAQ SCHEMAS ====================
class FAQBase(BaseModel):
    question: str
    answer: str

class FAQCreate(FAQBase):
    pass

class FAQUpdate(BaseModel):
    question: Optional[str] = None
    answer: Optional[str] = None

class FAQResponse(FAQBase):
    id: str
    business_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== POLICY SCHEMAS ====================
class BusinessPolicyBase(BaseModel):
    policy_type: str = Field(default="general", max_length=100)
    title: str = Field(..., max_length=255)
    content: str

class BusinessPolicyCreate(BusinessPolicyBase):
    pass

class BusinessPolicyUpdate(BaseModel):
    policy_type: Optional[str] = Field(None, max_length=100)
    title: Optional[str] = Field(None, max_length=255)
    content: Optional[str] = None

class BusinessPolicyResponse(BusinessPolicyBase):
    id: str
    business_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== DOCUMENT SCHEMAS ====================
class UploadedDocumentBase(BaseModel):
    title: str = Field(..., max_length=255)
    file_url: str
    file_type: Optional[str] = Field(None, max_length=50)

class UploadedDocumentCreate(UploadedDocumentBase):
    content_extracted: Optional[str] = None

class UploadedDocumentUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    file_url: Optional[str] = None
    file_type: Optional[str] = Field(None, max_length=50)
    content_extracted: Optional[str] = None
    status: Optional[str] = Field(None, max_length=50)

class UploadedDocumentResponse(UploadedDocumentBase):
    id: str
    business_id: str
    content_extracted: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
