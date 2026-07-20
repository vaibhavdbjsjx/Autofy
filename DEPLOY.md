# Deploying Autofy

Autofy has **two parts** that deploy to **two different places**:

| Part | What it is | Where it goes |
|------|-----------|---------------|
| **Frontend** | React + Vite static site (`src/`) | **Netlify** (this repo is configured for it) |
| **Backend** | FastAPI Python API (`backend/`) | A server host — **Render / Railway / Fly** (Netlify can't run Python) |

Netlify serves static files only, so the FastAPI backend must live elsewhere and the frontend talks to it over the internet.

---

## 1. Deploy the frontend to Netlify

Everything is preconfigured in [`netlify.toml`](netlify.toml):
- Build command: `npm run build`
- Publish directory: `dist`
- Node version: 20
- SPA redirect (so `/dashboard`, `/login` etc. don't 404 on refresh)

**Steps:**
1. Push this repo to GitHub.
2. Netlify → **Add new site → Import from Git** → pick the repo.
3. Netlify auto-reads `netlify.toml`, so leave build settings as-is. Click **Deploy**.
4. Your site goes live at `https://<your-site>.netlify.app`.

The **landing page works immediately**. Login / dashboard need the backend (step 2) + env vars (step 3).

---

## 2. Deploy the backend (Render example)

1. Create a **PostgreSQL** database (Render, Neon, or Supabase) and copy its connection URL.
2. New **Web Service** from the same repo, root directory `backend`.
   - Build command: `pip install -r requirements.txt`
   - Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
3. Set the backend environment variables (see `.env.example` for the full list):
   - `DATABASE_URL` = your Postgres URL (e.g. `postgresql://...`)
   - `SECRET_KEY`, `GEMINI_API_KEY`, `RAZORPAY_KEY_ID/SECRET/WEBHOOK_SECRET`
   - `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `WHATSAPP_VERIFY_TOKEN`
   - `SMTP_*`, `GOOGLE_CLIENT_ID/SECRET`, `FRONTEND_URL` = your Netlify URL
4. Note the backend URL, e.g. `https://autofy-api.onrender.com`.

---

## 3. Connect frontend → backend

Pick **one**:

**Option A — Netlify proxy (recommended, no CORS setup):**
In `netlify.toml`, uncomment the `/api/*` redirect block and set `to` to your backend URL. Redeploy. Leave `VITE_API_URL` unset.

**Option B — Direct URL:**
In Netlify → Site settings → **Environment variables**, add `VITE_API_URL = https://your-backend-host`. Then in the backend, add your Netlify origin to the CORS allow-list. Redeploy the site (env vars are baked in at build time).

Optional frontend env vars (only if you use Supabase directly): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

---

## 4. Verify

- `https://<site>.netlify.app` → landing page loads, burnt-orange theme, light mode.
- Refresh on `/login` → no 404 (SPA redirect working).
- Sign up → should reach the backend and return you a dashboard.
- Backend health check: `https://<backend-host>/api/health` → `{"status":"healthy","database_connected":true}`.

---

## Local development (what's running now)

```bash
# Frontend  → http://localhost:3000
npm run dev

# Backend   → http://localhost:8000  (SQLite, zero setup)
cd backend && uvicorn main:app --reload --port 8000
```
The Vite dev server proxies `/api` → `localhost:8000` automatically.
