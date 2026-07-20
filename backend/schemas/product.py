from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field

class ProductBase(BaseModel):
    name: str = Field(..., max_length=255)
    category: str = Field("General", max_length=100)
    price: Decimal = Field(Decimal("0.00"), ge=0)
    discount_percent: int = Field(0, ge=0, le=100)
    discount_price: Decimal = Field(Decimal("0.00"), ge=0)
    stock: int = Field(0, ge=0)
    low_stock_threshold: int = Field(5, ge=0)
    image_url: Optional[str] = None
    additional_images: Optional[str] = None # Comma-separated list of extra image URLs
    description: Optional[str] = None
    variants: Optional[str] = None # Comma-separated or JSON string for attributes
    is_available: bool = True

class ProductCreate(ProductBase):
    business_id: str = Field(..., max_length=36)

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    category: Optional[str] = Field(None, max_length=100)
    price: Optional[Decimal] = Field(None, ge=0)
    discount_percent: Optional[int] = Field(None, ge=0, le=100)
    discount_price: Optional[Decimal] = Field(None, ge=0)
    stock: Optional[int] = Field(None, ge=0)
    low_stock_threshold: Optional[int] = Field(None, ge=0)
    image_url: Optional[str] = None
    additional_images: Optional[str] = None
    description: Optional[str] = None
    variants: Optional[str] = None
    is_available: Optional[bool] = None

class ProductResponse(ProductBase):
    id: str
    business_id: str
    is_low_stock: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ProductStockUpdate(BaseModel):
    quantity: int = Field(..., description="Quantity to adjust stock. Can be positive or negative.")

class ProductsListResponse(BaseModel):
    products: List[ProductResponse]
    total_count: int

class ProductAnalyticsSummary(BaseModel):
    total_products: int
    total_categories: int
    out_of_stock_count: int
    low_stock_count: int
    total_stock_value: Decimal
    items_by_category: dict
