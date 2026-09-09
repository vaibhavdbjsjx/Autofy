from typing import Dict, Any

# ════════════════════════════════════════════════════════════
# Autofy Pro — Single Product Subscription Model
# ------------------------------------------------------------
# Product: Autofy Pro
# Options:
#   • Monthly: ₹900 / month  (Immediate start, zero trial)
#   • Yearly:  ₹4,999 / year (Immediate start, zero trial)
# Both options share the exact same features & entitlements.
# ════════════════════════════════════════════════════════════

AUTOFY_PRO_FEATURES = [
    "Unlimited WhatsApp Automation & AI Replies",
    "24/7 Autonomous AI Employee Engine",
    "Instant Live RAG Knowledge Base Indexing",
    "Automated Appointment Booking & Reminders",
    "UPI & Online Payment Links Collection",
    "Lead CRM Capture & Inbox Management",
    "VIP Priority Customer Support"
]

AUTOFY_PRO_ENTITLEMENTS = {
    "max_monthly_messages": -1,  # Unlimited
    "whatsapp_auto_reply": True,
    "custom_rag": True,
    "appointments_booking": True,
    "priority_support": True,
    "custom_model": True
}

SUBSCRIPTION_PLANS: Dict[str, Dict[str, Any]] = {
    "monthly": {
        "id": "monthly",
        "product_name": "Autofy Pro",
        "name": "Autofy Pro Monthly",
        "price": 900.0,
        "normal_price": 900.0,
        "currency": "INR",
        "billing_interval": "monthly",
        "trial_days": 0,
        "razorpay_plan_id": "plan_TZx4AbrrftCAcm",
        "features": AUTOFY_PRO_FEATURES,
        "entitlements": AUTOFY_PRO_ENTITLEMENTS
    },
    "yearly": {
        "id": "yearly",
        "product_name": "Autofy Pro",
        "name": "Autofy Pro Yearly",
        "price": 4999.0,
        "normal_price": 4999.0,
        "currency": "INR",
        "billing_interval": "yearly",
        "trial_days": 0,
        "savings_amount": 5801.0,
        "monthly_equivalent": 417.0,
        "discount_percent": 54,
        "razorpay_plan_id": "plan_TZxFTBI4TK3IAY",
        "features": AUTOFY_PRO_FEATURES,
        "entitlements": AUTOFY_PRO_ENTITLEMENTS
    }
}

# Alias fallbacks for backwards compatibility with legacy database records
SUBSCRIPTION_PLANS["pro"] = SUBSCRIPTION_PLANS["monthly"]
SUBSCRIPTION_PLANS["starter"] = SUBSCRIPTION_PLANS["monthly"]
SUBSCRIPTION_PLANS["enterprise"] = SUBSCRIPTION_PLANS["yearly"]
