from typing import Dict, Any

SUBSCRIPTION_PLANS: Dict[str, Dict[str, Any]] = {
    "starter": {
        "id": "starter",
        "name": "Starter Plan",
        "normal_price": 999.0,
        "promo_first_cycle_price": 300.0,
        "currency": "INR",
        "billing_interval": "monthly",
        "trial_days": 7,
        "features": [
            "Up to 1,000 Messages / mo",
            "Standard AI Response Speed",
            "Basic WhatsApp Integration",
            "Manual Lead Export",
            "Email Support"
        ],
        "entitlements": {
            "max_monthly_messages": 1000,
            "whatsapp_auto_reply": True,
            "custom_rag": False,
            "appointments_booking": False,
            "priority_support": False,
            "custom_model": False
        }
    },
    "pro": {
        "id": "pro",
        "name": "Pro Business Plan",
        "normal_price": 2499.0,
        "promo_first_cycle_price": 1000.0,
        "currency": "INR",
        "billing_interval": "monthly",
        "trial_days": 7,
        "features": [
            "Unlimited WhatsApp Messages",
            "24/7 Autonomous AI Employee",
            "Instant Live RAG Sync",
            "Auto Appointment & Booking",
            "UPI & Online Payment Links",
            "VIP Priority Support"
        ],
        "entitlements": {
            "max_monthly_messages": -1,  # Unlimited
            "whatsapp_auto_reply": True,
            "custom_rag": True,
            "appointments_booking": True,
            "priority_support": True,
            "custom_model": False
        }
    },
    "enterprise": {
        "id": "enterprise",
        "name": "Enterprise Plan",
        "normal_price": 4999.0,
        "promo_first_cycle_price": 2000.0,
        "currency": "INR",
        "billing_interval": "monthly",
        "trial_days": 7,
        "features": [
            "Everything in Pro +",
            "Custom Fine-tuned LLM Model",
            "Multi-Number WhatsApp Sync",
            "Dedicated Account Manager",
            "99.9% Uptime Guarantee SLA"
        ],
        "entitlements": {
            "max_monthly_messages": -1,
            "whatsapp_auto_reply": True,
            "custom_rag": True,
            "appointments_booking": True,
            "priority_support": True,
            "custom_model": True
        }
    }
}
