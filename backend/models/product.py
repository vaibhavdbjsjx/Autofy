import uuid
from datetime import datetime
from sqlalchemy import Column, String, ForeignKey, DateTime, Integer, Numeric, Text, Boolean
from sqlalchemy.orm import relationship
from database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    business_id = Column(String(36), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False, default="General")
    price = Column(Numeric(10, 2), nullable=False, default=0.00)
    discount_percent = Column(Integer, nullable=False, default=0)
    discount_price = Column(Numeric(10, 2), nullable=False, default=0.00)
    stock = Column(Integer, nullable=False, default=0)
    low_stock_threshold = Column(Integer, nullable=False, default=5)
    image_url = Column(Text, nullable=True) # Primary image URL
    additional_images = Column(Text, nullable=True) # Comma-separated list of extra image URLs
    description = Column(Text, nullable=True)
    variants = Column(Text, nullable=True) # Comma-separated or JSON string, e.g., "Color: Black, Silver; Size: Classic, Pro"
    is_available = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    business = relationship("Business")

