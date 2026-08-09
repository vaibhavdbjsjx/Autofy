import os
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import razorpay
from config import settings
from config_plans import SUBSCRIPTION_PLANS

logger = logging.getLogger("razorpay_subscription_service")

# In-memory cache for created plan and offer IDs during runtime
_PLAN_ID_CACHE: Dict[str, str] = {}
_OFFER_ID_CACHE: Dict[str, str] = {}

class RazorpaySubscriptionService:

    @staticmethod
    def get_client() -> Optional[razorpay.Client]:
        """
        Instantiates Razorpay SDK Client using configured keys.
        """
        key_id = os.environ.get("RAZORPAY_KEY_ID") or settings.RAZORPAY_KEY_ID
        key_secret = os.environ.get("RAZORPAY_KEY_SECRET") or settings.RAZORPAY_KEY_SECRET

        if not key_id or not key_secret:
            logger.warning("Razorpay credentials unconfigured or missing.")
            return None

        try:
            return razorpay.Client(auth=(key_id, key_secret))
        except Exception as err:
            logger.error(f"Failed to initialize Razorpay Client: {err}")
            return None

    @staticmethod
    def get_or_create_plan_id(client: Optional[razorpay.Client], billing_interval: str = "monthly") -> str:
        """
        Resolves authoritative Razorpay Plan ID for Autofy Pro Monthly or Yearly.
        """
        interval_key = "yearly" if str(billing_interval).lower() == "yearly" else "monthly"

        # 1. Check environment variables
        env_var_map = {
            "monthly": settings.RAZORPAY_MONTHLY_PLAN_ID,
            "yearly": settings.RAZORPAY_YEARLY_PLAN_ID,
        }
        if env_var_map.get(interval_key):
            return env_var_map[interval_key]

        # 2. Check runtime memory cache
        if interval_key in _PLAN_ID_CACHE:
            return _PLAN_ID_CACHE[interval_key]

        # 3. Create plan via Razorpay API if client available
        plan_config = SUBSCRIPTION_PLANS.get(interval_key, SUBSCRIPTION_PLANS["monthly"])
        if client:
            try:
                amount_in_paise = int(plan_config["normal_price"] * 100)
                rzp_period = "yearly" if interval_key == "yearly" else "monthly"
                res = client.plan.create({
                    "period": rzp_period,
                    "interval": 1,
                    "item": {
                        "name": f"Autofy Pro — {plan_config['name']}",
                        "amount": amount_in_paise,
                        "currency": "INR",
                        "description": f"Autofy Pro SaaS Subscription ({plan_config['name']} ₹{plan_config['normal_price']}/{interval_key})"
                    }
                })
                rzp_plan_id = res.get("id")
                if rzp_plan_id:
                    _PLAN_ID_CACHE[interval_key] = rzp_plan_id
                    logger.info(f"Created Razorpay Plan ID for {interval_key}: {rzp_plan_id}")
                    return rzp_plan_id
            except Exception as err:
                logger.error(f"Error creating Razorpay plan for {interval_key}: {err}")

        # Fallback synthetic ID for test mode without live API key
        mock_id = f"plan_mock_pro_{interval_key}"
        _PLAN_ID_CACHE[interval_key] = mock_id
        return mock_id

    @staticmethod
    def create_subscription(
        business_id: str,
        billing_interval: str = "monthly"
    ) -> Dict[str, Any]:
        """
        Creates an official Razorpay Subscription object via API for Autofy Pro.
        Monthly: ₹699/mo, 7-day free trial (start_at = now + 7 days)
        Yearly:  ₹6,899/yr, 14-day free trial (start_at = now + 14 days)
        """
        interval_key = "yearly" if str(billing_interval).lower() == "yearly" else "monthly"
        plan_config = SUBSCRIPTION_PLANS.get(interval_key, SUBSCRIPTION_PLANS["monthly"])
        trial_days = plan_config.get("trial_days", 7 if interval_key == "monthly" else 14)

        client = RazorpaySubscriptionService.get_client()
        rzp_plan_id = RazorpaySubscriptionService.get_or_create_plan_id(client, interval_key)

        now = datetime.utcnow()
        trial_end_time = now + timedelta(days=trial_days)
        start_at_timestamp = int(trial_end_time.timestamp())

        total_count = 10 if interval_key == "yearly" else 120 # 10 years recurring duration

        sub_payload: Dict[str, Any] = {
            "plan_id": rzp_plan_id,
            "total_count": total_count,
            "quantity": 1,
            "start_at": start_at_timestamp,
            "customer_notify": 1,
            "notes": {
                "business_id": business_id,
                "plan_id": "pro",
                "billing_interval": interval_key
            }
        }

        if client:
            try:
                subscription_obj = client.subscription.create(sub_payload)
                logger.info(f"Created Razorpay Subscription ({interval_key}): {subscription_obj.get('id')}")
                return {
                    "provider_subscription_id": subscription_obj.get("id"),
                    "razorpay_plan_id": rzp_plan_id,
                    "status": subscription_obj.get("status", "created"),
                    "start_at": start_at_timestamp,
                    "raw": subscription_obj
                }
            except Exception as err:
                logger.error(f"Razorpay subscription.create API failed for {interval_key}: {err}")

        # Fallback mock subscription for local dev without live keys
        return {
            "provider_subscription_id": f"sub_mock_{business_id[:8]}_{int(now.timestamp())}",
            "razorpay_plan_id": rzp_plan_id,
            "status": "created",
            "start_at": start_at_timestamp,
            "raw": {"mock": True}
        }

    @staticmethod
    def cancel_subscription(provider_subscription_id: str, cancel_at_cycle_end: bool = True) -> bool:
        """
        Cancels the actual Razorpay recurring subscription on Razorpay servers.
        """
        if not provider_subscription_id or provider_subscription_id.startswith("sub_mock_"):
            return True

        client = RazorpaySubscriptionService.get_client()
        if client:
            try:
                client.subscription.cancel(
                    provider_subscription_id,
                    {"cancel_at_cycle_end": 1 if cancel_at_cycle_end else 0}
                )
                logger.info(f"Cancelled Razorpay Subscription: {provider_subscription_id}")
                return True
            except Exception as err:
                logger.error(f"Error cancelling Razorpay subscription {provider_subscription_id}: {err}")
                return False
        return True

    @staticmethod
    def fetch_subscription(provider_subscription_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetches live subscription state from Razorpay for server-side reconciliation.
        """
        if not provider_subscription_id or provider_subscription_id.startswith("sub_mock_"):
            return None

        client = RazorpaySubscriptionService.get_client()
        if client:
            try:
                return client.subscription.fetch(provider_subscription_id)
            except Exception as err:
                logger.error(f"Error fetching Razorpay subscription {provider_subscription_id}: {err}")
                return None
        return None
