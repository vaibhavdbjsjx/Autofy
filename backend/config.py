import os
from typing import List
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
    JWT_SECRET_KEY: str = "74cf0ee752be30a1bf8408f61548e6900f684824d5ea34c89ee425b0cb59f0f6"
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

    # Cognitive AI Layer
    GEMINI_API_KEY: str = ""

    # Razorpay Payments (INR — UPI, cards, netbanking, wallets)
    # Get keys from https://dashboard.razorpay.com/app/keys
    # WEBHOOK_SECRET is set when you create a webhook in the Razorpay dashboard.
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    RAZORPAY_WEBHOOK_SECRET: str = ""

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
        "http://localhost:5173",
        "https://autofysaas.com",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
