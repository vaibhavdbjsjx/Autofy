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
    def get_or_create_plan_id(client: Optional[razorpay.Client], plan_id: str) -> str:
        """
        Resolves authoritative Razorpay Plan ID for normal recurring price.
        Does NOT create duplicate plans on every subscription.
        """
        if plan_id not in SUBSCRIPTION_PLANS:
            plan_id = "starter"

        # 1. Check environment variables
        env_var_map = {
            "starter": settings.RAZORPAY_STARTER_PLAN_ID,
            "pro": settings.RAZORPAY_PRO_PLAN_ID,
            "enterprise": settings.RAZORPAY_ENTERPRISE_PLAN_ID,
        }
        if env_var_map.get(plan_id):
            return env_var_map[plan_id]

        # 2. Check runtime memory cache
        if plan_id in _PLAN_ID_CACHE:
            return _PLAN_ID_CACHE[plan_id]

        # 3. Create plan via Razorpay API if client available
        plan_config = SUBSCRIPTION_PLANS[plan_id]
        if client:
            try:
                amount_in_paise = int(plan_config["normal_price"] * 100)
                res = client.plan.create({
                    "period": "monthly",
                    "interval": 1,
                    "item": {
                        "name": f"Autofy AI — {plan_config['name']}",
                        "amount": amount_in_paise,
                        "currency": "INR",
                        "description": f"Autofy AI SaaS Subscription - {plan_config['name']} (Normal recurring price ₹{plan_config['normal_price']}/mo)"
                    }
                })
                rzp_plan_id = res.get("id")
                if rzp_plan_id:
                    _PLAN_ID_CACHE[plan_id] = rzp_plan_id
                    logger.info(f"Created Razorpay Plan ID for {plan_id}: {rzp_plan_id}")
                    return rzp_plan_id
            except Exception as err:
                logger.error(f"Error creating Razorpay plan for {plan_id}: {err}")

        # Fallback synthetic ID for test mode without live API key
        mock_id = f"plan_mock_{plan_id}"
        _PLAN_ID_CACHE[plan_id] = mock_id
        return mock_id

    @staticmethod
    def get_or_create_offer_id(client: Optional[razorpay.Client], plan_id: str) -> Optional[str]:
        """
        Resolves Razorpay Offer ID for first-cycle promotional discount.
        """
        if plan_id not in SUBSCRIPTION_PLANS:
            plan_id = "starter"

        env_var_map = {
            "starter": settings.RAZORPAY_STARTER_OFFER_ID,
            "pro": settings.RAZORPAY_PRO_OFFER_ID,
            "enterprise": settings.RAZORPAY_ENTERPRISE_OFFER_ID,
        }
        if env_var_map.get(plan_id):
            return env_var_map[plan_id]

        if plan_id in _OFFER_ID_CACHE:
            return _OFFER_ID_CACHE[plan_id]

        plan_config = SUBSCRIPTION_PLANS[plan_id]
        discount_amount = plan_config["normal_price"] - plan_config["promo_first_cycle_price"]

        if client and discount_amount > 0:
            try:
                discount_paise = int(discount_amount * 100)
                res = client.post("/offers", {
                    "name": f"Autofy 15-Day Signup Offer - {plan_config['name']}",
                    "display_type": "flat",
                    "period": "month",
                    "amount": discount_paise,
                    "max_usage": 1,
                    "cycles": 1
                })
                offer_id = res.get("id")
                if offer_id:
                    _OFFER_ID_CACHE[plan_id] = offer_id
                    logger.info(f"Created Razorpay Offer ID for {plan_id}: {offer_id}")
                    return offer_id
            except Exception as err:
                logger.error(f"Error creating Razorpay offer for {plan_id}: {err}")

        mock_id = f"offer_mock_{plan_id}"
        _OFFER_ID_CACHE[plan_id] = mock_id
        return mock_id

    @staticmethod
    def create_subscription(
        business_id: str,
        plan_id: str,
        is_promo_eligible: bool,
        trial_days: int = 7
    ) -> Dict[str, Any]:
        """
        Creates an official Razorpay Subscription object via API.
        Enforces:
        1. Normal Plan ID for recurring mandate (₹999/mo, ₹2,499/mo, ₹4,999/mo).
        2. start_at timestamp for provider-level 7-day free trial.
        3. offer_id for first-cycle discount (₹300, ₹1,000, ₹2,000 first paid cycle).
        """
        client = RazorpaySubscriptionService.get_client()
        rzp_plan_id = RazorpaySubscriptionService.get_or_create_plan_id(client, plan_id)
        offer_id = RazorpaySubscriptionService.get_or_create_offer_id(client, plan_id) if is_promo_eligible else None

        now = datetime.utcnow()
        trial_end_time = now + timedelta(days=trial_days)
        start_at_timestamp = int(trial_end_time.timestamp())

        sub_payload: Dict[str, Any] = {
            "plan_id": rzp_plan_id,
            "total_count": 120, # 10 years recurring cycles
            "quantity": 1,
            "start_at": start_at_timestamp,
            "customer_notify": 1,
            "notes": {
                "business_id": business_id,
                "plan_id": plan_id,
                "is_promo_eligible": is_promo_eligible
            }
        }

        if is_promo_eligible and offer_id:
            sub_payload["offer_id"] = offer_id

        if client:
            try:
                subscription_obj = client.subscription.create(sub_payload)
                logger.info(f"Created Razorpay Subscription: {subscription_obj.get('id')}")
                return {
                    "provider_subscription_id": subscription_obj.get("id"),
                    "razorpay_plan_id": rzp_plan_id,
                    "razorpay_offer_id": offer_id,
                    "status": subscription_obj.get("status", "created"),
                    "start_at": start_at_timestamp,
                    "raw": subscription_obj
                }
            except Exception as err:
                logger.error(f"Razorpay subscription.create API failed: {err}")

        # Fallback mock subscription for local dev without live keys
        return {
            "provider_subscription_id": f"sub_mock_{business_id[:8]}_{int(now.timestamp())}",
            "razorpay_plan_id": rzp_plan_id,
            "razorpay_offer_id": offer_id,
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
