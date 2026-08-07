from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field

class OrderBase(BaseModel):
    customer_name: str = Field(..., max_length=255)
    customer_email: str = Field(..., max_length=255)
    customer_phone: Optional[str] = Field(None, max_length=50)
    shipping_address: str
    items_json: str # JSON representation of items ordered
    total_price: Decimal = Field(Decimal("0.00"), ge=0)
    discount_amount: Decimal = Field(Decimal("0.00"), ge=0)
    status: str = Field("Pending")
    notes: Optional[str] = None

class OrderCreate(OrderBase):
    pass

class OrderUpdate(BaseModel):
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    shipping_address: Optional[str] = None
    status: Optional[str] = None # e.g. Confirmed, Packed, Shipped, Delivered, Cancelled, Refunded
    shipping_carrier: Optional[str] = None
    tracking_number: Optional[str] = None
    estimated_delivery: Optional[datetime] = None
    cancellation_reason: Optional[str] = None
    refund_reason: Optional[str] = None
    refund_amount: Optional[Decimal] = None
    notes: Optional[str] = None

class OrderResponse(OrderBase):
    id: str
    business_id: str
    shipping_carrier: Optional[str] = None
    tracking_number: Optional[str] = None
    estimated_delivery: Optional[datetime] = None
    cancellation_reason: Optional[str] = None
    refund_reason: Optional[str] = None
    refund_amount: Optional[Decimal] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class OrderStatusUpdate(BaseModel):
    status: str = Field(..., description="The upgraded/downgraded state for this specific shipment.")

class OrderCancelRequest(BaseModel):
    reason: str = Field(..., description="The reason provided by the client or manager to cancel this order shipment.")

class OrderRefundRequest(BaseModel):
    reason: str = Field(..., description="The reason given for reclaiming payments.")
    refund_amount: Optional[Decimal] = Field(None, description="Optional custom partial refund amount.")

class OrderAnalyticsSummary(BaseModel):
    total_orders: int
    pending_count: int
    confirmed_count: int
    packed_count: int
    shipped_count: int
    delivered_count: int
    cancelled_count: int
    refunded_count: int
    total_revenue: Decimal
    total_refunds: Decimal
    recent_activity_series: List[Dict[str, Any]]
