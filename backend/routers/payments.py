from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status, Request
from sqlalchemy.orm import Session
from fastapi.responses import HTMLResponse
from database import get_db
from auth.dependencies import get_current_active_user, RoleChecker
from models.user import User
from models.payment import Payment
from schemas.payments import (
    PaymentLinkCreate, SubscriptionCreate, PaymentResponse, RazorpayVerification
)
from services.payment_services import RazorpayService

router = APIRouter(prefix="/payments", tags=["Razorpay Billing Ledger & Subscriptions"])

owner_admin = RoleChecker(["Owner", "Admin", "Manager"])

@router.get("", response_model=Dict[str, Any])
def list_business_payments(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Returns payment ledger records for current authenticated business tenant.
    """
    from models.payment import Payment
    payments = db.query(Payment).filter(Payment.business_id == current_user.business_id).order_by(Payment.created_at.desc()).all()
    items = []
    for p in payments:
        items.append({
            "id": p.id,
            "business_id": p.business_id,
            "lead_id": p.lead_id,
            "amount": float(p.amount) if p.amount else 0.0,
            "currency": p.currency or "INR",
            "status": p.status or "issued",
            "billing_type": p.billing_type or "one_time",
            "description": p.description or "Payment Invoice",
            "razorpay_payment_id": p.razorpay_payment_id,
            "razorpay_subscription_id": p.razorpay_subscription_id,
            "invoice_id": p.invoice_id,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        })
    return {"items": items, "count": len(items)}

@router.post("/links", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_payment_link_endpoint(
    payload: PaymentLinkCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Generate an official Razorpay Payment Link and log the transaction in billing ledger.
    """
    try:
        return await RazorpayService.create_payment_link(
            db=db,
            business_id=current_user.business_id,
            lead_id=payload.lead_id,
            amount=payload.amount,
            description=payload.description or f"Payment link for {current_user.business.name}",
            customer_name=payload.customer_name,
            customer_phone=payload.customer_phone,
            customer_email=payload.customer_email
        )
    except Exception as err:
        raise HTTPException(status_code=400, detail=str(err))

@router.post("/subscriptions", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_subscription_billing(
    payload: SubscriptionCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Subscribes a corporate lead to a recurring membership plan.
    Creates plans inside Razorpay configurations, and yields checkouts.
    """
    try:
        return await RazorpayService.create_subscription(
            db=db,
            business_id=current_user.business_id,
            lead_id=payload.lead_id,
            plan_id=payload.plan_id,
            customer_name=payload.customer_name,
            customer_phone=payload.customer_phone,
            customer_email=payload.customer_email
        )
    except Exception as err:
        raise HTTPException(status_code=400, detail=str(err))

@router.post("/verify", response_model=PaymentResponse)
def verify_payment_signature_endpoint(
    payload: RazorpayVerification,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Verifies Razorpay cryptographical SHA256 signatures for payment tamper checks.
    Transitions invoice records into paid statuses.
    """
    is_valid = RazorpayService.verify_payment_signature(
        razorpay_payment_id=payload.razorpay_payment_id,
        razorpay_order_id=payload.razorpay_order_id,
        razorpay_subscription_id=payload.razorpay_subscription_id,
        razorpay_signature=payload.razorpay_signature
    )
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid signature. Verification failure (malformed or tampered transaction).")

    payment = RazorpayService.update_payment_on_verification(
        db=db,
        razorpay_payment_id=payload.razorpay_payment_id,
        razorpay_order_id=payload.razorpay_order_id,
        razorpay_subscription_id=payload.razorpay_subscription_id,
        status="paid"
    )

    if not payment:
        raise HTTPException(status_code=404, detail="No matching transaction ledger record found to update.")
    return payment

@router.post("/webhook")
async def razorpay_async_webhook_listener(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Publicly reachable webhook endpoint accepting background paid alerts from Razorpay servers.
    Verifies X-Razorpay-Signature HMAC SHA256 header against RAZORPAY_WEBHOOK_SECRET before parsing or state mutation.
    """
    import os
    import hmac
    import hashlib
    import json
    from config import settings

    signature = request.headers.get("X-Razorpay-Signature") or request.headers.get("x-razorpay-signature")
    webhook_secret = os.environ.get("RAZORPAY_WEBHOOK_SECRET") or settings.RAZORPAY_WEBHOOK_SECRET
    raw_body = await request.body()

    is_prod = settings.ENVIRONMENT.lower() in ["production", "prod"]

    if is_prod and (not signature or not webhook_secret):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Webhook verification failed: Secret or signature header missing."
        )

    if signature and webhook_secret:
        expected_sig = hmac.new(
            key=webhook_secret.encode("utf-8"),
            msg=raw_body,
            digestmod=hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(expected_sig, signature):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Razorpay webhook signature verification."
            )

    try:
        payload = json.loads(raw_body.decode("utf-8") or "{}")
        result = await RazorpayService.process_webhook_callback(db, payload)
        return result
    except Exception as err:
        import logging
        logging.getLogger("autofy_pay_webhook").error(f"Razorpay Webhook parsing error: {err}")
        return {"status": "error_captured", "detail": str(err)}

@router.get("/{payment_id}/invoice", response_class=HTMLResponse)
def stream_printable_invoice(
    payment_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Fetches the printable HTML statement/invoice for offline verification and accounting.
    """
    payment = db.query(Payment).filter(
        Payment.id == payment_id,
        Payment.business_id == current_user.business_id
    ).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Invoice payment record not found.")

    invoice_content = RazorpayService.generate_invoice_html(payment, db)
    return HTMLResponse(content=invoice_content, status_code=200)
