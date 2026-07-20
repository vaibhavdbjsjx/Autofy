from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field

class PaymentBase(BaseModel):
    lead_id: Optional[str] = None
    amount: Decimal = Field(..., ge=0.0)
    currency: str = Field("INR", max_length=10)
    billing_type: str = Field("one-time", max_length=50) # 'one-time', 'subscription'
    description: Optional[str] = None

class PaymentCreate(PaymentBase):
    pass

class PaymentLinkCreate(PaymentBase):
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    description: Optional[str] = "Payment for Services"

class SubscriptionCreate(BaseModel):
    lead_id: str
    plan_id: str # Business MembershipPlan ID
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None

class PaymentResponse(PaymentBase):
    id: str
    business_id: str
    payment_link_id: Optional[str] = None
    payment_link_url: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    razorpay_subscription_id: Optional[str] = None
    status: str
    invoice_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class RazorpayVerification(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id: Optional[str] = None
    razorpay_subscription_id: Optional[str] = None
    razorpay_signature: str
