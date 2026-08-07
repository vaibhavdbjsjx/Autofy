from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from decimal import Decimal
from database import get_db
from auth.dependencies import get_current_active_user, RoleChecker
from models.user import User
from models.product import Product
from schemas.product import (
    ProductCreate, 
    ProductUpdate, 
    ProductResponse, 
    ProductStockUpdate,
    ProductAnalyticsSummary
)

router = APIRouter(prefix="/products", tags=["Inventory & Product Management"])

owner_admin_manager = RoleChecker(["Owner", "Admin", "Manager"])

def map_product_to_response(product: Product) -> Dict[str, Any]:
    """Helper to convert SQLAlchemy Product model to a response dictionary with custom low stock alerts."""
    return {
        "id": product.id,
        "business_id": product.business_id,
        "name": product.name,
        "category": product.category,
        "price": product.price,
        "discount_percent": product.discount_percent,
        "discount_price": product.discount_price,
        "stock": product.stock,
        "low_stock_threshold": product.low_stock_threshold,
        "image_url": product.image_url,
        "additional_images": product.additional_images,
        "description": product.description,
        "variants": product.variants,
        "is_available": product.is_available,
        "is_low_stock": product.stock <= product.low_stock_threshold and product.is_available,
        "created_at": product.created_at,
        "updated_at": product.updated_at
    }

@router.get("", response_model=Dict[str, Any])
def get_all_products(
    search: Optional[str] = Query(None, description="Search term for name, description, category, or variants"),
    category: Optional[str] = Query(None, description="Filter by product category"),
    only_low_stock: bool = Query(False, description="Filter products that are in low stock state"),
    only_available: bool = Query(False, description="Filter strictly available products"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    List, paginate, filter, and search inventory products.
    """
    query = db.query(Product).filter(Product.business_id == current_user.business_id)

    if category:
        query = query.filter(Product.category.ilike(category))

    if only_available:
        query = query.filter(Product.is_available == True)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            Product.name.ilike(search_filter) |
            Product.description.ilike(search_filter) |
            Product.category.ilike(search_filter) |
            Product.variants.ilike(search_filter)
        )

    # Note: low stock is evaluated as stock <= low_stock_threshold
    if only_low_stock:
        query = query.filter(Product.stock <= Product.low_stock_threshold)

    total = query.count()
    products = query.order_by(Product.name.asc()).offset(skip).limit(limit).all()

    items = [map_product_to_response(p) for p in products]

    return {
        "items": items,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/analytics", response_model=ProductAnalyticsSummary)
def get_product_analytics(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Dynamic generation of product, inventory stock, valuation, and category distribution analytics.
    """
    products = db.query(Product).filter(Product.business_id == current_user.business_id).all()

    total_products = len(products)
    categories = set()
    out_of_stock = 0
    low_stock = 0
    total_value = Decimal("0.00")
    items_by_cat = {}

    for p in products:
        categories.add(p.category)
        
        # Calculate active selling price (original minus discount, or direct discount_price if active)
        active_price = p.price
        if p.discount_price > 0:
            active_price = p.discount_price
        elif p.discount_percent > 0:
            active_price = p.price * Decimal(1 - (p.discount_percent / 100.0))
            
        total_value += (active_price * p.stock)

        if p.stock <= 0:
            out_of_stock += 1
        elif p.stock <= p.low_stock_threshold:
            low_stock += 1

        items_by_cat[p.category] = items_by_cat.get(p.category, 0) + 1

    return {
        "total_products": total_products,
        "total_categories": len(categories),
        "out_of_stock_count": out_of_stock,
        "low_stock_count": low_stock,
        "total_stock_value": total_value,
        "items_by_category": items_by_cat
    }

@router.get("/{product_id}", response_model=ProductResponse)
def get_product_by_id(
    product_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve details of a single product.
    """
    product = db.query(Product).filter(
        Product.id == product_id, 
        Product.business_id == current_user.business_id
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found in this organization's inventory.")
    
    return map_product_to_response(product)

@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a new inventory product.
    """
    if payload.price < 0:
        raise HTTPException(status_code=400, detail="Invalid price: Product price cannot be negative.")
    if payload.stock < 0:
        raise HTTPException(status_code=400, detail="Invalid stock: Inventory level cannot be negative.")
    if payload.discount_percent < 0 or payload.discount_percent > 100:
        raise HTTPException(status_code=400, detail="Invalid discount: Discount percent must be between 0 and 100.")

    db_product = Product(
        business_id=current_user.business_id,
        name=payload.name,
        category=payload.category,
        price=payload.price,
        discount_percent=payload.discount_percent,
        discount_price=payload.discount_price,
        stock=payload.stock,
        low_stock_threshold=payload.low_stock_threshold,
        image_url=payload.image_url,
        additional_images=payload.additional_images,
        description=payload.description,
        variants=payload.variants,
        is_available=payload.is_available
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return map_product_to_response(db_product)

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: str,
    payload: ProductUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update details of an existing product.
    """
    db_product = db.query(Product).filter(
        Product.id == product_id, 
        Product.business_id == current_user.business_id
    ).first()

    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found or access denied.")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_product, key, value)

    db.commit()
    db.refresh(db_product)
    return map_product_to_response(db_product)

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: str,
    current_user: User = Depends(owner_admin_manager),
    db: Session = Depends(get_db)
):
    """
    Permanently purge a product from inventory listings.
    """
    db_product = db.query(Product).filter(
        Product.id == product_id, 
        Product.business_id == current_user.business_id
    ).first()

    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found or access denied.")

    db.delete(db_product)
    db.commit()
    return

@router.post("/{product_id}/stock", response_model=ProductResponse)
def adjust_product_stock(
    product_id: str,
    payload: ProductStockUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Adjust numerical stock quantity logs (supports additive and subtractive adjustments).
    """
    db_product = db.query(Product).filter(
        Product.id == product_id, 
        Product.business_id == current_user.business_id
    ).first()

    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found or access denied.")

    new_stock = db_product.stock + payload.quantity
    if new_stock < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Operation rejected: Stock adjustment would result in negative units count ({new_stock})."
        )

    db_product.stock = new_stock
    db.commit()
    db.refresh(db_product)
    return map_product_to_response(db_product)
