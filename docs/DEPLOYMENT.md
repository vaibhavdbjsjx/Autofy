# Autofy Production Deployment Guide

This guide details the step-by-step procedure to deploy the Autofy SaaS application (React Frontend on Netlify, FastAPI Backend on Render, and Managed PostgreSQL).

---

## 1. BACKEND DEPLOYMENT (Render)

### Service Configuration
- **Platform**: [Render Web Services](https://render.com)
- **Blueprint File**: `render.yaml`
- **Environment**: Python 3.10+
- **Region**: Singapore (or nearest user latency region)
- **Build Command**:
  ```bash
  cd backend && pip install -r requirements.txt && python3 -m alembic upgrade head
  ```
- **Start Command**:
  ```bash
  cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
  ```
- **Health Check Path**: `/health` (Returns `{"status": "healthy", "database_connected": true}`)

### Production Environment Variables (Render Dashboard)
| Variable Name | Example Production Value | Purpose |
| :--- | :--- | :--- |
| `ENVIRONMENT` | `production` | Enables production security enforcement |
| `DEBUG` | `false` | Disables debug stack trace exposure |
| `DATABASE_URL` | `postgresql://user:pass@host:5432/autofydb` | Managed PostgreSQL connection string |
| `JWT_SECRET_KEY` | `[Generates 64-hex string]` | Signs JWT tokens (At least 32 chars) |
| `CORS_ORIGINS` | `["https://autofy11.netlify.app"]` | Allowed frontend origins |
| `FRONTEND_URL` | `https://autofy11.netlify.app` | Target SPA URL for OAuth redirects |
| `GOOGLE_CLIENT_ID` | `[Google Cloud Client ID]` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | `[Google Cloud Secret]` | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | `https://autofy-backend.onrender.com/api/v1/auth/google/callback` | OAuth callback URI |
| `WHATSAPP_TOKEN` | `[Meta Access Token]` | WhatsApp Cloud API token |
| `WHATSAPP_PHONE_ID` | `[Meta Phone ID]` | Default WhatsApp phone ID |
| `WHATSAPP_VERIFY_TOKEN` | `[Meta Webhook Token]` | Webhook verification token |
| `GEMINI_API_KEY` | `[Google Gemini Key]` | AI model key |

---

## 2. FRONTEND DEPLOYMENT (Netlify)

### Site Configuration
- **Platform**: [Netlify](https://netlify.com)
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **SPA Redirect Configuration**:
  - `netlify.toml` and `public/_redirects` enforce `/* -> /index.html 200` to prevent 404 errors on deep SPA routes (`/dashboard`, `/settings`, `/privacy`, `/terms`, `/cancellation-policy`, `/account-deletion`).

### Frontend Environment Variables (Netlify Dashboard)
| Variable Name | Value | Purpose |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://autofy-backend.onrender.com` | Backend FastAPI ingress URL |

---

## 3. POSTGRESQL DATABASE (Render / Supabase / Neon)
- Managed PostgreSQL 15+ database instance.
- **Connection Scheme**: Supports `postgresql://` and automatically converts legacy `postgres://` URLs.
- **Pooling**: `pool_size=10`, `max_overflow=20`, `pool_pre_ping=True`.
- **Migrations**: Automatically executed on deploy via `alembic upgrade head`.

---

## 4. GOOGLE OAUTH PRODUCTION SETUP
In [Google Cloud Console](https://console.cloud.google.com) under **APIs & Services &gt; Credentials**:
1. **Authorized JavaScript Origins**:
   - `https://autofy11.netlify.app`
2. **Authorized Redirect URIs**:
   - `https://autofy-backend.onrender.com/api/v1/auth/google/callback`

---

## 5. META WHATSAPP WEBHOOK SETUP
In [Meta Developer Dashboard](https://developers.facebook.com) under **WhatsApp &gt; Configuration**:
1. **Callback URL**: `https://autofy-backend.onrender.com/api/v1/whatsapp/webhook`
2. **Verify Token**: Matching `WHATSAPP_VERIFY_TOKEN` environment variable.
3. **Subscribed Fields**: `messages`.

---

## 6. RAZORPAY WEBHOOK SETUP (READINESS ONLY — PHASE 3 ON HOLD)
In [Razorpay Dashboard](https://dashboard.razorpay.com) under **Settings &gt; Webhooks**:
1. **Webhook URL**: `https://autofy-backend.onrender.com/api/v1/payments/webhook`
2. **Secret**: Matching `RAZORPAY_WEBHOOK_SECRET` environment variable.
3. **Active Events**: `subscription.authenticated`, `subscription.charged`, `subscription.halted`, `subscription.cancelled`.
