import os
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import razorpay
from config import settings
from config_plans import SUBSCRIPTION_PLANS

logger = logging.getLogger("razorpay_subscription_service")

class RazorpaySubscriptionConfigurationError(RuntimeError):
    """Raised when checkout cannot be backed by a real Razorpay subscription."""

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

    # Known typos/aliases to prevent failed checkout if Render env vars still have transposed/confused characters
    PLAN_ID_ALIASES: Dict[str, str] = {
        # Transposition typo from prompt/notes: "A4" -> "4A"
        "plan_TZxA4BrrftCAcm": "plan_TZx4AbrrftCAcm",
        # Visual confusion typo from prompt/notes: digit "1" -> uppercase "I"
        "plan_TZxFTBI4TK31AY": "plan_TZxFTBI4TK3IAY",
        # Erroneous duplicate monthly 4999 plan created in dashboard -> route to genuine yearly plan
        "plan_TZx3DiNyEYalBE": "plan_TZxFTBI4TK3IAY",
    }

    # Old deprecated plans that must no longer be used for new subscriptions
    DEPRECATED_PLAN_IDS = {
        "plan_tngieyxltakim9", # Old monthly ₹699
        "plan_tngkw9ixatgcm3", # Old yearly ₹6,899
    }

    @staticmethod
    def get_configured_plan_id(billing_interval: str = "monthly") -> str:
        """
        Resolves the authoritative plan ID configured for the same Razorpay account as the API key.

        Plans must be provisioned in Razorpay before checkout.
        """
        interval_key = "yearly" if str(billing_interval).lower() == "yearly" else "monthly"
        env_var_map = {
            "monthly": (
                os.environ.get("RAZORPAY_MONTHLY_PLAN_ID")
                or settings.RAZORPAY_MONTHLY_PLAN_ID
                or SUBSCRIPTION_PLANS.get("monthly", {}).get("razorpay_plan_id")
            ),
            "yearly": (
                os.environ.get("RAZORPAY_YEARLY_PLAN_ID")
                or settings.RAZORPAY_YEARLY_PLAN_ID
                or SUBSCRIPTION_PLANS.get("yearly", {}).get("razorpay_plan_id")
            ),
        }
        plan_id = (env_var_map.get(interval_key) or "").strip()
        if not plan_id:
            raise RazorpaySubscriptionConfigurationError(
                f"Razorpay {interval_key} plan is not configured."
            )

        if plan_id.lower() in RazorpaySubscriptionService.DEPRECATED_PLAN_IDS:
            raise RazorpaySubscriptionConfigurationError(
                f"Deprecated Razorpay plan ID '{plan_id}' cannot be used for new subscriptions."
            )

        # Normalize any known typos from environment or dashboard
        normalized_id = RazorpaySubscriptionService.PLAN_ID_ALIASES.get(plan_id, plan_id)
        return normalized_id

    @staticmethod
    def create_subscription(
        business_id: str,
        billing_interval: str = "monthly"
    ) -> Dict[str, Any]:
        """
        Creates an official Razorpay Subscription object via API for Autofy Pro.
        Monthly: ₹900/mo, starts immediately.
        Yearly:  ₹4,999/yr, starts immediately.
        Zero free trial — customer is billed immediately upon checkout authorization.
        """
        interval_key = "yearly" if str(billing_interval).lower() == "yearly" else "monthly"

        client = RazorpaySubscriptionService.get_client()
        if client is None:
            raise RazorpaySubscriptionConfigurationError(
                "Razorpay API credentials are not configured."
            )

        rzp_plan_id = RazorpaySubscriptionService.get_configured_plan_id(interval_key)

        now = datetime.utcnow()
        total_count = 10 if interval_key == "yearly" else 120 # 10 years recurring duration

        # NOTE: NO start_at is sent.
        # Omitting start_at ensures the subscription activates immediately and bills
        # the customer upfront upon authorization with ZERO trial delay.
        sub_payload: Dict[str, Any] = {
            "plan_id": rzp_plan_id,
            "total_count": total_count,
            "quantity": 1,
            "customer_notify": 1,
            "notes": {
                "business_id": business_id,
                "plan_id": "pro",
                "billing_interval": interval_key
            }
        }

        try:
            subscription_obj = client.subscription.create(sub_payload)
        except Exception as err:
            logger.exception("Razorpay subscription.create API failed for %s (%s): %s", interval_key, rzp_plan_id, err)
            raise RazorpaySubscriptionConfigurationError(
                f"Razorpay could not initialize subscription for {interval_key} plan ({rzp_plan_id}): {err}"
            ) from err

        provider_subscription_id = subscription_obj.get("id")
        if not provider_subscription_id:
            raise RazorpaySubscriptionConfigurationError(
                "Razorpay returned an incomplete subscription response."
            )

        logger.info("Created Razorpay subscription (%s): %s", interval_key, provider_subscription_id)
        return {
            "provider_subscription_id": provider_subscription_id,
            "razorpay_plan_id": rzp_plan_id,
            "status": subscription_obj.get("status", "created"),
            "start_at": None,
            "raw": subscription_obj,
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
