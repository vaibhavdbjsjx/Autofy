import json
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from decimal import Decimal
from datetime import datetime, timedelta
from database import get_db
from auth.dependencies import get_current_active_user, RoleChecker
from models.user import User
from models.order import Order
from models.product import Product
from schemas.order import (
    OrderCreate,
    OrderUpdate,
    OrderResponse,
    OrderStatusUpdate,
    OrderCancelRequest,
    OrderRefundRequest,
    OrderAnalyticsSummary
)

router = APIRouter(prefix="/orders", tags=["Order Management System"])

owner_admin_manager = RoleChecker(["Owner", "Admin", "Manager"])

@router.get("", response_model=Dict[str, Any])
def get_all_orders(
    search: Optional[str] = Query(None, description="Search term for customer name, email, tracking, or address"),
    status: Optional[str] = Query(None, description="Filter orders by status (Pending, Confirmed, Packed, Shipped, Delivered, Cancelled, Refunded)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    List, paginate, filter, and search standard orders.
    """
    query = db.query(Order).filter(Order.business_id == current_user.business_id)

    if status:
        query = query.filter(Order.status == status)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            Order.customer_name.ilike(search_filter) |
            Order.customer_email.ilike(search_filter) |
            Order.customer_phone.ilike(search_filter) |
            Order.shipping_address.ilike(search_filter) |
            Order.tracking_number.ilike(search_filter)
        )

    total = query.count()
    orders = query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()

    return {
        "items": orders,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@router.get("/analytics", response_model=OrderAnalyticsSummary)
def get_order_analytics(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Produce rich statistics, pending metrics, net revenue tracking, and weekly timelines.
    """
    orders = db.query(Order).filter(Order.business_id == current_user.business_id).all()

    total_orders = len(orders)
    pending_count = 0
    confirmed_count = 0
    packed_count = 0
    shipped_count = 0
    delivered_count = 0
    cancelled_count = 0
    refunded_count = 0
    
    total_revenue = Decimal("0.00")
    total_refunds = Decimal("0.00")

    # Time series map last 7 days
    today = datetime.utcnow().date()
    series_map = { (today - timedelta(days=i)): 0 for i in range(6, -1, -1) }

    for o in orders:
        if o.status == "Pending":
            pending_count += 1
        elif o.status == "Confirmed":
            confirmed_count += 1
        elif o.status == "Packed":
            packed_count += 1
        elif o.status == "Shipped":
            shipped_count += 1
        elif o.status == "Delivered":
            delivered_count += 1
            total_revenue += o.total_price
        elif o.status == "Cancelled":
            cancelled_count += 1
        elif o.status == "Refunded":
            refunded_count += 1
            total_refunds += o.refund_amount
            # Count any non-refunded amount as remaining revenue
            total_revenue += max(Decimal("0.00"), o.total_price - o.refund_amount)

        # Plot timeline data
        order_date = o.created_at.date()
        if order_date in series_map:
            series_map[order_date] = series_map[order_date] + 1

    timeline_series = [
        {"date": d.strftime("%Y-%m-%d"), "orders": count}
        for d, count in sorted(series_map.items())
    ]

    return {
        "total_orders": total_orders,
        "pending_count": pending_count,
        "confirmed_count": confirmed_count,
        "packed_count": packed_count,
        "shipped_count": shipped_count,
        "delivered_count": delivered_count,
        "cancelled_count": cancelled_count,
        "refunded_count": refunded_count,
        "total_revenue": total_revenue,
        "total_refunds": total_refunds,
        "recent_activity_series": timeline_series
    }

@router.get("/{order_id}", response_model=OrderResponse)
def get_order_by_id(
    order_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Load complete info for a singular client order.
    """
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.business_id == current_user.business_id
    ).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found or authorization failed.")
    return order

@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_new_order(
    payload: OrderCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a new order and AUTOMATICALLY reduce in-stock levels of associated products.
    """
    if payload.business_id != current_user.business_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Cannot inject orders into another business domain."
        )

    # 1. Parse items_json
    try:
        items_list = json.loads(payload.items_json)
        if not isinstance(items_list, list) or len(items_list) == 0:
            raise ValueError("items_json must be a non-empty array.")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid items_json format: Should represent a non-empty parsed JSON array of products."
        )

    # 2. Authoritative price calculation & stock deduction
    calculated_total = Decimal("0.00")
    for item in items_list:
        p_id = item.get("id")
        p_qty = int(item.get("quantity", 1))
        
        if p_qty <= 0:
            raise HTTPException(status_code=400, detail="Invalid quantity: Order item quantity must be greater than 0.")

        if p_id:
            product = db.query(Product).filter(
                Product.id == p_id,
                Product.business_id == current_user.business_id
            ).with_for_update().first()

            if not product:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid product_id: Product '{p_id}' not found or belongs to another organization."
                )

            if product.stock < p_qty:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for product '{product.name}'. Available stock: {product.stock}, requested: {p_qty}."
                )

            unit_price = Decimal(str(product.discount_price)) if (product.discount_price and product.discount_price > 0) else Decimal(str(product.price))
            calculated_total += (unit_price * Decimal(str(p_qty)))
            product.stock -= p_qty
        else:
            item_price = Decimal(str(item.get("price", 0)))
            if item_price < 0:
                raise HTTPException(status_code=400, detail="Invalid item price: Price cannot be negative.")
            calculated_total += (item_price * Decimal(str(p_qty)))

    discount_val = Decimal(str(payload.discount_amount or 0))
    if discount_val < 0:
        raise HTTPException(status_code=400, detail="Invalid discount: Discount amount cannot be negative.")

    authoritative_total = max(Decimal("0.00"), calculated_total - discount_val)

    db_order = Order(
        business_id=current_user.business_id,
        customer_name=payload.customer_name,
        customer_email=payload.customer_email,
        customer_phone=payload.customer_phone,
        shipping_address=payload.shipping_address,
        items_json=payload.items_json,
        total_price=authoritative_total,
        discount_amount=discount_val,
        status=payload.status,
        notes=payload.notes
    )

    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order

@router.put("/{order_id}", response_model=OrderResponse)
def update_order_details(
    order_id: str,
    payload: OrderUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Modify details for order shipment, notes, customer descriptors or shipping tracks.
    """
    db_order = db.query(Order).filter(
        Order.id == order_id,
        Order.business_id == current_user.business_id
    ).first()

    if not db_order:
        raise HTTPException(status_code=404, detail="Requested order not found.")

    update_data = payload.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(db_order, key, val)

    db.commit()
    db.refresh(db_order)
    return db_order

@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order_completely(
    order_id: str,
    current_user: User = Depends(owner_admin_manager),
    db: Session = Depends(get_db)
):
    """
    Admin purge of faulty or test order entries from historical logs.
    """
    db_order = db.query(Order).filter(
        Order.id == order_id,
        Order.business_id == current_user.business_id
    ).first()

    if not db_order:
        raise HTTPException(status_code=404, detail="Order lookup returned empty.")

    db.delete(db_order)
    db.commit()
    return

@router.post("/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: str,
    payload: OrderStatusUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Move order status across active stages: Pending -> Confirmed -> Packed -> Shipped -> Delivered
    """
    db_order = db.query(Order).filter(
        Order.id == order_id,
        Order.business_id == current_user.business_id
    ).first()

    if not db_order:
        raise HTTPException(status_code=404, detail="Order search returned null results.")

    # Validate statuses list
    allowed = ["Pending", "Confirmed", "Packed", "Shipped", "Delivered", "Cancelled", "Refunded"]
    if payload.status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid phase status choice. Allowed paths: {allowed}"
        )

    db_order.status = payload.status
    db.commit()
    db.refresh(db_order)
    return db_order

@router.post("/{order_id}/cancel", response_model=OrderResponse)
def cancel_order(
    order_id: str,
    payload: OrderCancelRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Submit immediate order cancellation request. Automatically cancels and optionally restores item stock levels.
    """
    db_order = db.query(Order).filter(
        Order.id == order_id,
        Order.business_id == current_user.business_id
    ).first()

    if not db_order:
        raise HTTPException(status_code=404, detail="Order metadata lookup failed.")

    if db_order.status in ["Delivered", "Refunded"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel order shipments already marked as '{db_order.status}'."
        )

    # 1. Change status to Cancelled
    old_status = db_order.status
    db_order.status = "Cancelled"
    db_order.cancellation_reason = payload.reason

    # 2. Return quantities to inventory stocks if cancelling earlier stages (e.g. Pending, Confirmed, Packed)
    if old_status in ["Pending", "Confirmed", "Packed"]:
        try:
            items_list = json.loads(db_order.items_json)
            for item in items_list:
                p_id = item.get("id")
                p_qty = int(item.get("quantity", 1))
                if p_id:
                    prod = db.query(Product).filter(
                        Product.id == p_id,
                        Product.business_id == current_user.business_id
                    ).first()
                    if prod:
                        prod.stock += p_qty
        except Exception:
            pass # Keep robust

    db.commit()
    db.refresh(db_order)
    return db_order

@router.post("/{order_id}/refund", response_model=OrderResponse)
def process_order_refund(
    order_id: str,
    payload: OrderRefundRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Submit immediate refund claims. Updates status to 'Refunded' and flags refund amounts.
    """
    db_order = db.query(Order).filter(
        Order.id == order_id,
        Order.business_id == current_user.business_id
    ).first()

    if not db_order:
        raise HTTPException(status_code=404, detail="No matching order found for this refund request.")

    # Apply defaults
    refund_val = payload.refund_amount if payload.refund_amount is not None else db_order.total_price

    if refund_val > db_order.total_price:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Filing error: Claimed refund magnitude (₹{refund_val}) exceeds full paid total price (₹{db_order.total_price})."
        )

    db_order.status = "Refunded"
    db_order.refund_reason = payload.reason
    db_order.refund_amount = refund_val

    db.commit()
    db.refresh(db_order)
    return db_order
