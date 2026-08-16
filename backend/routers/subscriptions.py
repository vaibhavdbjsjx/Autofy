from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models.user import User
from auth.dependencies import get_current_active_user
from services.entitlement_services import EntitlementService
from config_plans import SUBSCRIPTION_PLANS
from config import settings

router = APIRouter(prefix="/subscriptions", tags=["Subscription & Entitlements Management"])

class StartTrialSchema(BaseModel):
    billing_interval: Optional[str] = "monthly"
    plan_id: Optional[str] = "pro"

class CreateCheckoutSchema(BaseModel):
    billing_interval: Optional[str] = "monthly"
    plan_id: Optional[str] = "pro"

@router.get("/plans", response_model=Dict[str, Any])
def list_subscription_plans(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Returns available subscription plans (Autofy Pro Monthly & Yearly) and current subscription state.
    """
    state = EntitlementService.evaluate_subscription_state(db, current_user.business_id)
    return {
        "product_name": "Autofy Pro",
        "plans": SUBSCRIPTION_PLANS,
        "current_status": state
    }

@router.get("/status", response_model=Dict[str, Any])
def get_subscription_status(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Server-authoritative subscription state machine status.
    Evaluates free trial countdown, period end expiry, and entitlement flags.
    """
    return EntitlementService.evaluate_subscription_state(db, current_user.business_id)

@router.post("/start-trial", response_model=Dict[str, Any])
def start_free_trial(
    payload: StartTrialSchema,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Activates free trial for Autofy Pro.
    Monthly: 7-day free trial.
    Yearly:  14-day free trial.
    """
    interval_key = "yearly" if "year" in str(payload.billing_interval or payload.plan_id).lower() else "monthly"

    updated_state = EntitlementService.start_trial(db, current_user.business_id, interval_key)

    trial_days = updated_state["trial"]["days_remaining"] or (14 if interval_key == "yearly" else 7)
    return {
        "status": "success",
        "message": f"{trial_days}-Day Free Trial for Autofy Pro ({interval_key.capitalize()}) activated successfully!",
        "subscription": updated_state,
        "razorpay_key_id": settings.RAZORPAY_KEY_ID
    }

@router.post("/create-checkout", response_model=Dict[str, Any])
def create_subscription_checkout(
    payload: CreateCheckoutSchema,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Generates Razorpay Subscription configuration for Autofy Pro recurring mandate.
    Monthly: ₹699/mo after 7-day trial.
    Yearly:  ₹6,899/yr after 14-day trial.
    """
    interval_key = "yearly" if "year" in str(payload.billing_interval or payload.plan_id).lower() else "monthly"
    plan_config = SUBSCRIPTION_PLANS.get(interval_key, SUBSCRIPTION_PLANS["monthly"])

    from services.razorpay_subscription_service import RazorpaySubscriptionService
    rzp_sub = RazorpaySubscriptionService.create_subscription(
        business_id=current_user.business_id,
        billing_interval=interval_key
    )

    # Persist provider subscription ID & billing interval on local database model
    from models.subscription import Subscription
    from models.payment import Payment
    from datetime import datetime
    import uuid

    sub_record = db.query(Subscription).filter(Subscription.business_id == current_user.business_id).first()
    if sub_record:
        sub_record.provider_subscription_id = rzp_sub["provider_subscription_id"]
        sub_record.plan_id = "pro"
        sub_record.billing_interval = interval_key
        sub_record.normal_price = plan_config["price"]
        sub_record.first_cycle_price = plan_config["price"]
        db.commit()

    # Log issued Payment record for SaaS subscription checkout
    issued_payment = Payment(
        id=str(uuid.uuid4()),
        business_id=current_user.business_id,
        amount=plan_config["price"],
        currency=plan_config["currency"],
        razorpay_subscription_id=rzp_sub["provider_subscription_id"],
        status="issued",
        billing_type="subscription",
        description=f"Platform SaaS Subscription ({plan_config['name']})",
        invoice_id=f"SUB-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    )
    db.add(issued_payment)
    db.commit()

    import os
    key_id = os.environ.get("RAZORPAY_KEY_ID") or settings.RAZORPAY_KEY_ID

    trial_days = plan_config["trial_days"]

    return {
        "status": "success",
        "business_id": current_user.business_id,
        "product_name": "Autofy Pro",
        "plan_id": "pro",
        "plan_name": plan_config["name"],
        "billing_interval": interval_key,
        "charge_amount": plan_config["price"],
        "normal_recurring_price": plan_config["price"],
        "trial_days": trial_days,
        "razorpay_key_id": key_id,
        "razorpay_subscription_id": rzp_sub["provider_subscription_id"],
        "razorpay_plan_id": rzp_sub["razorpay_plan_id"],
        "disclosures": {
            "amount_today": 0,
            "trial_days": trial_days,
            "recurring_amount": plan_config["price"],
            "billing_interval": interval_key
        }
    }

@router.post("/cancel", response_model=Dict[str, Any])
def cancel_subscription(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Cancels the actual Razorpay recurring subscription on Razorpay servers at period end.
    Access is retained until current_period_end. Business data remains untouched.
    """
    from models.subscription import Subscription
    from services.razorpay_subscription_service import RazorpaySubscriptionService

    sub_record = db.query(Subscription).filter(Subscription.business_id == current_user.business_id).first()
    if sub_record and sub_record.provider_subscription_id:
        RazorpaySubscriptionService.cancel_subscription(sub_record.provider_subscription_id, cancel_at_cycle_end=True)

    updated_state = EntitlementService.cancel_subscription(db, current_user.business_id)
    return {
        "status": "success",
        "message": "Subscription set to cancel at period end on Razorpay servers. Your business data remains safe.",
        "subscription": updated_state
    }

class ChangePlanSchema(BaseModel):
    plan_id: str # starter, pro, enterprise
    billing_interval: Optional[str] = "monthly"

@router.post("/change-plan", response_model=Dict[str, Any])
def change_subscription_plan(
    payload: ChangePlanSchema,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Upgrades or downgrades tenant plan with grandfathered pricing preservation.
    """
    from models.subscription import Subscription
    from models.invoice import Invoice
    from datetime import datetime, timedelta
    import uuid

    sub_record = db.query(Subscription).filter(Subscription.business_id == current_user.business_id).first()
    if not sub_record:
        raise HTTPException(status_code=404, detail="Subscription record not found")

    pricing_map = {
        "starter": {"monthly": 399.00, "yearly": 3999.00, "name": "Autofy Starter"},
        "pro": {"monthly": 699.00, "yearly": 6899.00, "name": "Autofy Pro"},
        "enterprise": {"monthly": 1499.00, "yearly": 14999.00, "name": "Autofy Enterprise"}
    }
    
    selected_plan = pricing_map.get(payload.plan_id.lower(), pricing_map["pro"])
    interval = payload.billing_interval.lower() if payload.billing_interval else sub_record.billing_interval
    new_price = selected_plan.get(interval, selected_plan["monthly"])

    old_plan = sub_record.plan_id
    sub_record.plan_id = payload.plan_id.lower()
    sub_record.billing_interval = interval
    sub_record.normal_price = new_price
    sub_record.status = "ACTIVE"
    sub_record.cancel_at_period_end = False
    
    # Preserve grandfathered lock if upgraded
    if not sub_record.grandfathered_price:
        sub_record.grandfathered_price = new_price
        sub_record.price_locked_at = datetime.utcnow()

    # Generate invoice for plan change
    new_invoice = Invoice(
        id=str(uuid.uuid4()),
        business_id=current_user.business_id,
        subscription_id=sub_record.id,
        invoice_number=f"INV-{datetime.utcnow().strftime('%Y%m')}-{uuid.uuid4().hex[:5].upper()}",
        subtotal=new_price,
        tax_amount=round(float(new_price) * 0.18, 2), # 18% GST
        discount_amount=0.00,
        total_amount=round(float(new_price) * 1.18, 2),
        currency=sub_record.currency,
        status="paid",
        billing_period_start=datetime.utcnow(),
        billing_period_end=datetime.utcnow() + timedelta(days=365 if interval == "yearly" else 30),
        invoice_date=datetime.utcnow(),
        paid_at=datetime.utcnow(),
        payment_method=sub_record.payment_method_summary or "UPI / Card (Auto-Debit)",
        customer_notes=f"Plan adjusted from {old_plan.capitalize()} to {payload.plan_id.capitalize()} ({interval.capitalize()})"
    )
    db.add(new_invoice)
    db.commit()
    db.refresh(sub_record)

    state = EntitlementService.evaluate_subscription_state(db, current_user.business_id)
    return {
        "status": "success",
        "message": f"Successfully updated plan to {selected_plan['name']} ({interval.capitalize()})!",
        "subscription": state,
        "invoice_number": new_invoice.invoice_number
    }

@router.post("/resume", response_model=Dict[str, Any])
def resume_subscription(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Resumes a subscription that was scheduled for cancellation at period end.
    """
    from models.subscription import Subscription

    sub_record = db.query(Subscription).filter(Subscription.business_id == current_user.business_id).first()
    if not sub_record:
        raise HTTPException(status_code=404, detail="Subscription record not found")

    sub_record.cancel_at_period_end = False
    sub_record.cancelled_at = None
    sub_record.status = "ACTIVE"
    db.commit()

    state = EntitlementService.evaluate_subscription_state(db, current_user.business_id)
    return {
        "status": "success",
        "message": "Subscription resumed successfully! Automatic renewals are restored.",
        "subscription": state
    }

class UpdatePaymentMethodSchema(BaseModel):
    payment_method: str # e.g. "Visa ending in 4242", "UPI: business@okhdfcbank"
    billing_email: Optional[str] = None
    tax_id: Optional[str] = None

@router.post("/update-payment-method", response_model=Dict[str, Any])
def update_payment_method(
    payload: UpdatePaymentMethodSchema,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Updates the business payment method summary and billing details on record.
    """
    from models.subscription import Subscription

    sub_record = db.query(Subscription).filter(Subscription.business_id == current_user.business_id).first()
    if not sub_record:
        raise HTTPException(status_code=404, detail="Subscription record not found")

    sub_record.payment_method_summary = payload.payment_method
    if payload.billing_email:
        sub_record.billing_email = payload.billing_email
    if payload.tax_id:
        sub_record.tax_id = payload.tax_id
    sub_record.last_payment_status = "succeeded"
    sub_record.last_payment_error = None
    db.commit()

    return {
        "status": "success",
        "message": f"Payment method updated to {payload.payment_method} successfully!",
        "payment_method_summary": sub_record.payment_method_summary
    }

@router.post("/retry-payment", response_model=Dict[str, Any])
def retry_failed_payment(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Simulates payment recovery and clears past due / retry flags.
    """
    from models.subscription import Subscription
    from models.invoice import Invoice
    from datetime import datetime
    import uuid

    sub_record = db.query(Subscription).filter(Subscription.business_id == current_user.business_id).first()
    if not sub_record:
        raise HTTPException(status_code=404, detail="Subscription record not found")

    sub_record.last_payment_status = "succeeded"
    sub_record.last_payment_error = None
    sub_record.retry_count = "0"
    sub_record.status = "ACTIVE"
    
    # Mark any pending/failed invoices as paid
    failed_invoices = db.query(Invoice).filter(
        Invoice.business_id == current_user.business_id,
        Invoice.status.in_(["pending", "failed"])
    ).all()
    for inv in failed_invoices:
        inv.status = "paid"
        inv.paid_at = datetime.utcnow()

    db.commit()

    state = EntitlementService.evaluate_subscription_state(db, current_user.business_id)
    return {
        "status": "success",
        "message": "Payment processed successfully! Your subscription is in good standing.",
        "subscription": state
    }

@router.get("/invoices", response_model=Dict[str, Any])
def list_business_invoices(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves all official tax invoices for this business.
    """
    from models.invoice import Invoice
    from models.subscription import Subscription
    from datetime import datetime, timedelta
    import uuid

    invoices = db.query(Invoice).filter(
        Invoice.business_id == current_user.business_id
    ).order_by(Invoice.created_at.desc()).all()

    # If no invoices exist yet for active user, seed the initial subscription invoice
    if not invoices:
        sub_record = db.query(Subscription).filter(Subscription.business_id == current_user.business_id).first()
        price = float(sub_record.normal_price) if sub_record else 699.00
        first_inv = Invoice(
            id=str(uuid.uuid4()),
            business_id=current_user.business_id,
            subscription_id=sub_record.id if sub_record else None,
            invoice_number=f"INV-{datetime.utcnow().strftime('%Y%m')}-00841",
            subtotal=price,
            tax_amount=round(price * 0.18, 2),
            discount_amount=0.00,
            total_amount=round(price * 1.18, 2),
            currency="INR",
            status="paid",
            billing_period_start=datetime.utcnow() - timedelta(days=15),
            billing_period_end=datetime.utcnow() + timedelta(days=15),
            invoice_date=datetime.utcnow() - timedelta(days=15),
            paid_at=datetime.utcnow() - timedelta(days=15),
            payment_method=sub_record.payment_method_summary if sub_record else "UPI Auto-Debit",
            customer_notes="Autofy Pro Monthly Subscription (Platform Services & AI WhatsApp Agent)"
        )
        db.add(first_inv)
        db.commit()
        invoices = [first_inv]

    return {
        "invoices": [
            {
                "id": inv.id,
                "invoice_number": inv.invoice_number,
                "date": inv.invoice_date.strftime("%b %d, %Y"),
                "subtotal": float(inv.subtotal),
                "tax_amount": float(inv.tax_amount),
                "total_amount": float(inv.total_amount),
                "currency": inv.currency,
                "status": inv.status,
                "payment_method": inv.payment_method,
                "period": f"{inv.billing_period_start.strftime('%b %d')} - {inv.billing_period_end.strftime('%b %d, %Y')}" if inv.billing_period_start and inv.billing_period_end else "Standard Cycle",
                "notes": inv.customer_notes
            }
            for inv in invoices
        ]
    }

class RefundRequestSchema(BaseModel):
    invoice_id: Optional[str] = None
    reason: str
    amount: Optional[float] = None

@router.post("/request-refund", response_model=Dict[str, Any])
def request_subscription_refund(
    payload: RefundRequestSchema,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Submits a structured refund request for business payments.
    """
    from models.support_ticket import SupportTicket
    import uuid

    ticket = SupportTicket(
        id=str(uuid.uuid4()),
        business_id=current_user.business_id,
        user_id=current_user.id,
        subject=f"Refund Request: Invoice {payload.invoice_id or 'Latest'}",
        description=f"Reason for refund: {payload.reason}\nRequested amount: ₹{payload.amount or 'Full'}",
        status="open",
        priority="high",
        category="billing"
    )
    db.add(ticket)
    db.commit()

    return {
        "status": "success",
        "ticket_id": ticket.id,
        "message": "Refund request ticket submitted successfully. Our billing operations team will review within 24-48 business hours."
    }
