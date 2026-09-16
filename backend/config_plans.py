import os
from typing import Dict, Any

# ════════════════════════════════════════════════════════════
# Autofy Pro — Single Product Subscription Model
# ------------------------------------------------------------
# Product: Autofy Pro
# Options:
#   • Monthly: ₹3,699 / month (Recurring charge on the 4th of every month)
#   • Yearly:  ₹999 / year   (Immediate start & upfront charge, yearly cycle)
#   • Plus:    ₹999 / month  (Recurring monthly subscription)
# All options share the exact same features & entitlements.
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
        "price": 3699.0,
        "normal_price": 3699.0,
        "currency": "INR",
        "billing_interval": "monthly",
        "billing_anchor_day": 4,
        "razorpay_plan_id": os.environ.get("RAZORPAY_MONTHLY_PLAN_ID", ""),
        "features": AUTOFY_PRO_FEATURES,
        "entitlements": AUTOFY_PRO_ENTITLEMENTS
    },
    "yearly": {
        "id": "yearly",
        "product_name": "Autofy Pro",
        "name": "Autofy Pro Yearly",
        "price": 999.0,
        "normal_price": 999.0,
        "currency": "INR",
        "billing_interval": "yearly",
        "savings_amount": 43389.0,
        "monthly_equivalent": 83.25,
        "discount_percent": 98,
        "razorpay_plan_id": os.environ.get("RAZORPAY_YEARLY_PLAN_ID", ""),
        "features": AUTOFY_PRO_FEATURES,
        "entitlements": AUTOFY_PRO_ENTITLEMENTS
    },
    "plus": {
        "id": "plus",
        "product_name": "Autofy Plus",
        "name": "Plus",
        "price": 999.0,
        "normal_price": 999.0,
        "currency": "INR",
        "billing_interval": "monthly",
        "billing_anchor_day": 15,
        "razorpay_plan_id": os.environ.get("RAZORPAY_PLUS_PLAN_ID", ""),
        "features": AUTOFY_PRO_FEATURES,
        "entitlements": AUTOFY_PRO_ENTITLEMENTS
    }
}

# Alias fallbacks for backwards compatibility with legacy database records
SUBSCRIPTION_PLANS["pro"] = SUBSCRIPTION_PLANS["monthly"]
SUBSCRIPTION_PLANS["starter"] = SUBSCRIPTION_PLANS["monthly"]
SUBSCRIPTION_PLANS["enterprise"] = SUBSCRIPTION_PLANS["yearly"]
SUBSCRIPTION_PLANS["autofy_plus"] = SUBSCRIPTION_PLANS["plus"]
