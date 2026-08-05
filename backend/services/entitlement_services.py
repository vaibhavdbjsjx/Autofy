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
        biz = db.query(Business).filter(Business.id == business_id).first()

        # Ensure business has promo_expires_at set
        if biz and not biz.promo_expires_at:
            created = biz.created_at or datetime.utcnow()
            biz.promo_expires_at = created + timedelta(days=15)
            biz.promo_started_at = created
            db.commit()

        if not sub:
            sub = Subscription(
                business_id=business_id,
                plan_id="starter",
                provider="razorpay",
                status="EXPLORING",
                normal_price=999.00,
                first_cycle_price=300.00,
                promo_eligible_at_signup=True,
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
        Validates 15-day promotional window, 7-day trial expiry, active entitlements, and pricing transitions.
        """
        biz = db.query(Business).filter(Business.id == business_id).first()
        sub = EntitlementService.get_or_create_subscription(db, business_id)

        now = datetime.utcnow()

        # 1. Evaluate 15-Day Promotional Expiry
        promo_expires_at = biz.promo_expires_at if biz and biz.promo_expires_at else (biz.created_at + timedelta(days=15) if biz else now)
        is_promo_time_valid = now < promo_expires_at
        
        # PROMO LOCKING RULE:
        # If user locked promo during trial start or time is valid and first cycle not used:
        promo_eligible = (is_promo_time_valid or sub.promo_first_cycle_locked) and not sub.promo_first_cycle_used
        remaining_seconds = max(0, int((promo_expires_at - now).total_seconds()))

        # 2. Evaluate 7-Day Trial Expiry
        if sub.status == "TRIAL_ACTIVE":
            if sub.trial_ends_at and now >= sub.trial_ends_at:
                # Trial expired without active payment: transition status to EXPIRED
                sub.status = "EXPIRED"
                db.commit()

        # 3. Evaluate Active Subscription Period Expiry
        if sub.status in ["ACTIVE", "CANCEL_AT_PERIOD_END"]:
            if sub.current_period_end and now >= sub.current_period_end:
                if sub.cancel_at_period_end:
                    sub.status = "CANCELLED"
                else:
                    # Transition to PAST_DUE if renewal pending
                    sub.status = "PAST_DUE"
                db.commit()

        # 4. Resolve Active Plan Configuration
        plan_config = SUBSCRIPTION_PLANS.get(sub.plan_id, SUBSCRIPTION_PLANS["starter"])

        # Determine effective first-cycle charge and effective recurring price
        effective_first_cycle_price = plan_config["promo_first_cycle_price"] if promo_eligible else plan_config["normal_price"]
        effective_recurring_price = plan_config["normal_price"]

        # 5. Access Control Entitlement Decision
        is_live_accessible = sub.status in ["TRIAL_ACTIVE", "ACTIVE", "CANCEL_AT_PERIOD_END"]
        is_paid = sub.status in ["ACTIVE", "CANCEL_AT_PERIOD_END"]

        trial_days_remaining = 0
        if sub.status == "TRIAL_ACTIVE" and sub.trial_ends_at:
            trial_days_remaining = max(0, (sub.trial_ends_at - now).days)

        return {
            "business_id": business_id,
            "status": sub.status,
            "plan_id": sub.plan_id,
            "plan_name": plan_config["name"],
            "provider": sub.provider,
            "provider_subscription_id": sub.provider_subscription_id,
            "is_live_accessible": is_live_accessible,
            "is_paid": is_paid,
            "pricing": {
                "currency": sub.currency,
                "billing_interval": sub.billing_interval,
                "normal_price": plan_config["normal_price"],
                "promo_first_cycle_price": plan_config["promo_first_cycle_price"],
                "effective_first_cycle_price": effective_first_cycle_price,
                "effective_recurring_price": effective_recurring_price,
                "promo_first_cycle_locked": sub.promo_first_cycle_locked,
                "promo_first_cycle_used": sub.promo_first_cycle_used,
            },
            "promo": {
                "eligible": promo_eligible,
                "expires_at": promo_expires_at.isoformat(),
                "remaining_seconds": remaining_seconds,
                "started_at": biz.promo_started_at.isoformat() if biz and biz.promo_started_at else None,
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
    def start_trial(db: Session, business_id: str, plan_id: str) -> Dict[str, Any]:
        """
        Activates a 7-day free trial for the requested plan.
        If started within the 15-day promotional window, locks the first-cycle promo price server-side.
        """
        if plan_id not in SUBSCRIPTION_PLANS:
            plan_id = "starter"

        biz = db.query(Business).filter(Business.id == business_id).first()
        sub = EntitlementService.get_or_create_subscription(db, business_id)

        now = datetime.utcnow()
        promo_expires_at = biz.promo_expires_at if biz and biz.promo_expires_at else (now + timedelta(days=15))
        
        is_promo_valid = now < promo_expires_at
        
        # PROMO LOCKING RULE: Lock promo if trial started before promo_expires_at
        if is_promo_valid and not sub.promo_first_cycle_used:
            sub.promo_first_cycle_locked = True

        sub.plan_id = plan_id
        sub.status = "TRIAL_ACTIVE"
        sub.trial_started_at = now
        sub.trial_ends_at = now + timedelta(days=7)
        sub.current_period_start = now
        sub.current_period_end = now + timedelta(days=7)

        plan_config = SUBSCRIPTION_PLANS[plan_id]
        sub.normal_price = plan_config["normal_price"]
        sub.first_cycle_price = plan_config["promo_first_cycle_price"] if sub.promo_first_cycle_locked else plan_config["normal_price"]

        db.commit()
        db.refresh(sub)

        return EntitlementService.evaluate_subscription_state(db, business_id)

    @staticmethod
    def cancel_subscription(db: Session, business_id: str) -> Dict[str, Any]:
        """
        Flag subscription to cancel at period end.
        Customer retains access until current_period_end, then transitions to free/demo.
        NEVER deletes customer data, CRM, or conversations.
        """
        sub = EntitlementService.get_or_create_subscription(db, business_id)
        sub.cancel_at_period_end = True
        sub.cancelled_at = datetime.utcnow()
        if sub.status == "ACTIVE":
            sub.status = "CANCEL_AT_PERIOD_END"
        db.commit()
        return EntitlementService.evaluate_subscription_state(db, business_id)
