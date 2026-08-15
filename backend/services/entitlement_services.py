from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from models.business import Business
from models.subscription import Subscription
from config_plans import SUBSCRIPTION_PLANS

class EntitlementService:

    @staticmethod
    def get_or_create_subscription(db: Session, business_id: str) -> Subscription:
        """
        Ensures a business profile entity has a corresponding server-authoritative Subscription state record.
        Defaults to EXPLORING status for new accounts.
        """
        sub = db.query(Subscription).filter(Subscription.business_id == business_id).first()

        if not sub:
            sub = Subscription(
                business_id=business_id,
                plan_id="pro",
                provider="razorpay",
                status="EXPLORING",
                normal_price=699.00,
                first_cycle_price=699.00,
                currency="INR",
                billing_interval="monthly",
                promo_eligible_at_signup=False,
                promo_first_cycle_locked=False,
                promo_first_cycle_used=False
            )
            db.add(sub)
            db.commit()
            db.refresh(sub)

        return sub

    @staticmethod
    def evaluate_subscription_state(db: Session, business_id: str) -> Dict[str, Any]:
        """
        Server-authoritative state machine evaluator.
        Evaluates trial countdown, subscription period expiry, active entitlements, and pricing disclosures.
        """
        sub = EntitlementService.get_or_create_subscription(db, business_id)
        now = datetime.utcnow()

        # 1. Evaluate Trial Expiry
        if sub.status == "TRIAL_ACTIVE":
            if sub.trial_ends_at and now >= sub.trial_ends_at:
                # Trial expired without active payment: transition status to EXPIRED
                sub.status = "EXPIRED"
                db.commit()

        # 2. Evaluate Active Subscription Period Expiry
        if sub.status in ["ACTIVE", "CANCEL_AT_PERIOD_END"]:
            if sub.current_period_end and now >= sub.current_period_end:
                if sub.cancel_at_period_end:
                    sub.status = "CANCELLED"
                else:
                    # Transition to PAST_DUE if renewal pending
                    sub.status = "PAST_DUE"
                db.commit()

        # 3. Resolve Active Plan Configuration
        interval_key = "yearly" if str(sub.billing_interval).lower() == "yearly" else "monthly"
        plan_config = SUBSCRIPTION_PLANS.get(interval_key, SUBSCRIPTION_PLANS["monthly"])

        # 4. Access Control Entitlement Decision
        is_live_accessible = sub.status in ["TRIAL_ACTIVE", "ACTIVE", "CANCEL_AT_PERIOD_END"]
        is_paid = sub.status in ["ACTIVE", "CANCEL_AT_PERIOD_END"]

        trial_days_remaining = 0
        if sub.status == "TRIAL_ACTIVE" and sub.trial_ends_at:
            trial_days_remaining = max(0, (sub.trial_ends_at - now).days)

        return {
            "business_id": business_id,
            "status": sub.status,
            "plan_id": "pro" if is_live_accessible else "free",
            "product_name": "Autofy Pro" if is_live_accessible else "Free Tier",
            "plan_name": plan_config["name"] if is_live_accessible else "Free Tier",
            "provider": sub.provider,
            "provider_subscription_id": sub.provider_subscription_id,
            "is_live_accessible": is_live_accessible,
            "is_paid": is_paid,
            "pricing": {
                "currency": sub.currency,
                "billing_interval": interval_key,
                "price": float(sub.normal_price or plan_config["normal_price"]),
                "normal_price": float(plan_config["normal_price"]),
                "monthly_equivalent": plan_config.get("monthly_equivalent", float(plan_config["normal_price"])),
                "savings_amount": plan_config.get("savings_amount", 0.0),
                "discount_percent": plan_config.get("discount_percent", 0),
            },
            "trial": {
                "active": sub.status == "TRIAL_ACTIVE",
                "started_at": sub.trial_started_at.isoformat() if sub.trial_started_at else None,
                "ends_at": sub.trial_ends_at.isoformat() if sub.trial_ends_at else None,
                "days_remaining": trial_days_remaining,
            },
            "period": {
                "start": sub.current_period_start.isoformat() if sub.current_period_start else None,
                "end": sub.current_period_end.isoformat() if sub.current_period_end else None,
                "cancel_at_period_end": sub.cancel_at_period_end,
                "cancelled_at": sub.cancelled_at.isoformat() if sub.cancelled_at else None,
            },
            "entitlements": plan_config["entitlements"]
        }

    @staticmethod
    def start_trial(db: Session, business_id: str, plan_id_or_interval: str = "monthly") -> Dict[str, Any]:
        """
        Activates free trial for Autofy Pro.
        Monthly: 7-day free trial (₹699/mo after trial)
        Yearly:  14-day free trial (₹6,899/yr after trial)
        """
        interval_key = "yearly" if "year" in str(plan_id_or_interval).lower() or str(plan_id_or_interval).lower() == "enterprise" else "monthly"
        plan_config = SUBSCRIPTION_PLANS.get(interval_key, SUBSCRIPTION_PLANS["monthly"])

        sub = EntitlementService.get_or_create_subscription(db, business_id)
        now = datetime.utcnow()
        trial_days = plan_config.get("trial_days", 7 if interval_key == "monthly" else 14)

        sub.plan_id = "pro"
        sub.billing_interval = interval_key
        sub.status = "TRIAL_ACTIVE"
        sub.trial_started_at = now
        sub.trial_ends_at = now + timedelta(days=trial_days)
        sub.current_period_start = now
        sub.current_period_end = now + timedelta(days=trial_days)

        sub.normal_price = plan_config["normal_price"]
        sub.first_cycle_price = plan_config["normal_price"]

        db.commit()
        db.refresh(sub)

        return EntitlementService.evaluate_subscription_state(db, business_id)

    @staticmethod
    def cancel_subscription(db: Session, business_id: str) -> Dict[str, Any]:
        """
        Flag subscription to cancel at period end.
        Customer retains access until current_period_end, then transitions to EXPIRED/CANCELLED.
        NEVER deletes customer data, CRM, or conversations.
        """
        sub = EntitlementService.get_or_create_subscription(db, business_id)
        sub.cancel_at_period_end = True
        sub.cancelled_at = datetime.utcnow()
        if sub.status == "ACTIVE":
            sub.status = "CANCEL_AT_PERIOD_END"
        db.commit()
        return EntitlementService.evaluate_subscription_state(db, business_id)
