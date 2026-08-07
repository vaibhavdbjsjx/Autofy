import os
from typing import List
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Core Application Settings
    PROJECT_NAME: str = "Autofy Backend"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"
    
    # Port & Ingress routing config
    # 8000 keeps the API off the Vite dev server's port 3000 (they used to collide).
    PORT: int = 8000

    # Database connection.
    # Defaults to a local SQLite file so the backend runs with zero setup.
    # For production, set DATABASE_URL in .env to your Postgres instance, e.g.
    #   postgresql://user:password@host:5432/autofy
    DATABASE_URL: str = "sqlite:///./autofy.db"

    # Cryptographic JWT Secret Keys
    # Must be set via environment variable JWT_SECRET_KEY in production.
    JWT_SECRET_KEY: str = ""
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 2880  # 48 Hours duration

    # Third Party Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "https://autofysaas.com/api/v1/auth/google/callback"

    # Where the SPA lives — the Google callback redirects the browser back here
    # with the freshly minted token so the frontend can establish its session.
    FRONTEND_URL: str = "http://localhost:3000"

    # Meta WhatsApp Cloud API Configurations
    WHATSAPP_TOKEN: str = ""
    WHATSAPP_PHONE_ID: str = ""
    WHATSAPP_VERIFY_TOKEN: str = "autofy_webhook_verification_token_2026"
    META_APP_SECRET: str = ""

    # Cognitive AI Layer
    GEMINI_API_KEY: str = ""

    # Razorpay Payments (INR — UPI, cards, netbanking, wallets)
    # Get keys from https://dashboard.razorpay.com/app/keys
    # WEBHOOK_SECRET is set when you create a webhook in the Razorpay dashboard.
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    RAZORPAY_WEBHOOK_SECRET: str = ""

    # Razorpay Recurring Plan IDs (Normal Prices)
    RAZORPAY_STARTER_PLAN_ID: str = ""
    RAZORPAY_PRO_PLAN_ID: str = ""
    RAZORPAY_ENTERPRISE_PLAN_ID: str = ""

    # Razorpay Promotional First-Cycle Offer IDs
    RAZORPAY_STARTER_OFFER_ID: str = ""
    RAZORPAY_PRO_OFFER_ID: str = ""
    RAZORPAY_ENTERPRISE_OFFER_ID: str = ""

    # SMTP Settings for Email Notifications
    # For Gmail: go to Google Account > Security > 2-Step Verification > App Passwords
    # Generate an App Password for "Mail" and use that as SMTP_PASSWORD
    # Never use your real Gmail password here
    # For production: use Resend (resend.com) or SendGrid instead of Gmail SMTP
    # Resend free tier = 3000 emails/month, much more reliable for production
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 465
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "hello@autofy.io"

    # CORS Cleared Host domains
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:3007",
        "http://127.0.0.1:3007",
        "http://localhost:5173",
        "https://autofysaas.com",
        # Deployed website (Netlify)
        "https://autofy11.netlify.app",
        # Native app (Capacitor) origins — iOS uses capacitor://, Android uses https/http localhost
        "capacitor://localhost",
        "https://localhost",
        "http://localhost",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @model_validator(mode="after")
    def validate_security_credentials(self) -> "Settings":
        import secrets
        insecure_defaults = ["", "change_me", "74cf0ee752be30a1bf8408f61548e6900f684824d5ea34c89ee425b0cb59f0f6"]
        is_prod = self.ENVIRONMENT.lower() in ["production", "prod"]
        
        if is_prod:
            if not self.JWT_SECRET_KEY or self.JWT_SECRET_KEY in insecure_defaults or len(self.JWT_SECRET_KEY) < 32:
                raise ValueError("FATAL SECURITY ERROR: JWT_SECRET_KEY environment variable must be set to a strong secret (at least 32 characters) in production! Startup aborted.")
        else:
            if not self.JWT_SECRET_KEY or self.JWT_SECRET_KEY in insecure_defaults:
                self.JWT_SECRET_KEY = secrets.token_hex(32)
        return self

    def get_feature_health(self) -> dict:
        """
        Returns safe configuration status for external subsystems without exposing secrets.
        """
        return {
            "ai_provider": "CONFIGURED" if bool(self.GEMINI_API_KEY) else "NOT CONFIGURED",
            "whatsapp": "CONFIGURED" if bool(self.WHATSAPP_TOKEN and self.WHATSAPP_PHONE_ID) else "NOT CONFIGURED",
            "google_oauth": "CONFIGURED" if bool(self.GOOGLE_CLIENT_ID and self.GOOGLE_CLIENT_SECRET) else "NOT CONFIGURED",
            "smtp": "CONFIGURED" if bool(self.SMTP_USERNAME and self.SMTP_PASSWORD) else "NOT CONFIGURED",
            "razorpay": "CONFIGURED" if bool(self.RAZORPAY_KEY_ID and self.RAZORPAY_KEY_SECRET) else "NOT CONFIGURED",
        }

settings = Settings()
