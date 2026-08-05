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
    plan_id: str = "starter"

class CreateCheckoutSchema(BaseModel):
    plan_id: str = "starter"

@router.get("/plans", response_model=Dict[str, Any])
def list_subscription_plans(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Returns available subscription plans, normal prices, promotional first-cycle prices, and features.
    """
    state = EntitlementService.evaluate_subscription_state(db, current_user.business_id)
    return {
        "plans": SUBSCRIPTION_PLANS,
        "promo": state["promo"],
        "current_status": state
    }

@router.get("/status", response_model=Dict[str, Any])
def get_subscription_status(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Server-authoritative subscription state machine status.
    Evaluates 15-day promo eligibility, 7-day free trial countdown, and entitlement flags.
    """
    return EntitlementService.evaluate_subscription_state(db, current_user.business_id)

@router.post("/start-trial", response_model=Dict[str, Any])
def start_free_trial(
    payload: StartTrialSchema,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Activates 7-Day Free Trial for specified plan.
    Locks first-cycle promotional price if activated within 15-day promotional window.
    """
    if payload.plan_id not in SUBSCRIPTION_PLANS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid plan_id: {payload.plan_id}. Must be one of: starter, pro, enterprise."
        )

    updated_state = EntitlementService.start_trial(db, current_user.business_id, payload.plan_id)

    return {
        "status": "success",
        "message": f"7-Day Free Trial for {updated_state['plan_name']} activated successfully!",
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
    Generates Razorpay Subscription configuration for recurring mandate.
    Creates a Razorpay Subscription tied to normal recurring plan (₹999/mo) with 7-day start_at and offer discount.
    """
    plan_id = payload.plan_id if payload.plan_id in SUBSCRIPTION_PLANS else "starter"
    state = EntitlementService.evaluate_subscription_state(db, current_user.business_id)

    plan_config = SUBSCRIPTION_PLANS[plan_id]
    pricing = state["pricing"]
    is_promo_eligible = state["promo"]["eligible"]

    from services.razorpay_subscription_service import RazorpaySubscriptionService
    rzp_sub = RazorpaySubscriptionService.create_subscription(
        business_id=current_user.business_id,
        plan_id=plan_id,
        is_promo_eligible=is_promo_eligible,
        trial_days=7
    )

    # Persist provider subscription ID on local database model
    from models.subscription import Subscription
    sub_record = db.query(Subscription).filter(Subscription.business_id == current_user.business_id).first()
    if sub_record:
        sub_record.provider_subscription_id = rzp_sub["provider_subscription_id"]
        sub_record.plan_id = plan_id
        db.commit()

    import os
    key_id = os.environ.get("RAZORPAY_KEY_ID") or settings.RAZORPAY_KEY_ID

    return {
        "status": "success",
        "business_id": current_user.business_id,
        "plan_id": plan_id,
        "plan_name": plan_config["name"],
        "charge_amount": pricing["effective_first_cycle_price"],
        "is_promotional": is_promo_eligible,
        "normal_recurring_price": plan_config["normal_price"],
        "razorpay_key_id": key_id,
        "razorpay_subscription_id": rzp_sub["provider_subscription_id"],
        "razorpay_plan_id": rzp_sub["razorpay_plan_id"],
        "razorpay_offer_id": rzp_sub.get("razorpay_offer_id"),
        "disclosures": {
            "amount_today": 0,
            "trial_days": 7,
            "first_charge_date": state["trial"]["ends_at"],
            "first_charge_amount": pricing["effective_first_cycle_price"],
            "subsequent_recurring_amount": plan_config["normal_price"],
            "billing_interval": "monthly"
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
