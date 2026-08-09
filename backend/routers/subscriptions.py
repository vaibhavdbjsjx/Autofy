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
    Monthly: ₹999/mo after 7-day trial.
    Yearly:  ₹8,999/yr after 14-day trial.
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
