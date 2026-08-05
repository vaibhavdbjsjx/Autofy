# AUTOFY — PRODUCTION OPERATIONS & OBSERVABILITY MANUAL

This manual details the operational architecture, health monitoring, structured logging, database reliability, backup/recovery, and incident response procedures for Autofy.

---

## 1. System Architecture & Ingress

- **Frontend Application**: React 18 + Vite, hosted on **Netlify** (`https://autofy11.netlify.app`). Single-page app routing with fallback handling (`public/_redirects`).
- **Backend API Gateway**: FastAPI (Python 3.10+), deployed on **Render Web Service** (`https://autofy-backend.onrender.com`). Single process bound to `$PORT` (default 8000).
- **Database Layer**: Managed PostgreSQL 15+ (Render / Supabase). Dev fallback uses local SQLite (`autofy.db`).
- **Mobile Clients**: Capacitor 8.0 iOS/Android (`com.autofy.app`). Origin header `capacitor://localhost` and `https://localhost`.

---

## 2. Health & Probe Architecture

Autofy exposes three distinct health monitoring probes:

1. **Liveness Probe (`GET /health/live`)**:
   - **Purpose**: Fast container process check for Render/K8s orchestrator restarts.
   - **DB Check**: None.
   - **Response**: `200 OK` `{"status": "alive", "version": "1.0.0"}`.
2. **Readiness Probe (`GET /health/ready`)**:
   - **Purpose**: Validates database connectivity before routing user traffic.
   - **DB Check**: Executes lightweight `SELECT 1`.
   - **Response**: `200 OK` if DB connected; `503 Service Unavailable` if database is unresponsive.
3. **Comprehensive Health (`GET /health`)**:
   - **Response**: Returns environment mode and safe subsystem status (`CONFIGURED` / `NOT CONFIGURED` for AI, WhatsApp, OAuth, SMTP, Razorpay). Zero credentials or tokens are exposed.

---

## 3. Structured Logging & Request Correlation

- **Middleware**: `StructuredLoggingMiddleware` (`backend/middleware/logging_middleware.py`).
- **Request ID Tracing**:
  - Every incoming HTTP request accepts or generates a unique `X-Request-ID` header.
  - The `X-Request-ID` is returned in all HTTP response headers and included in error JSON responses.
  - Logs format: `[REQ_START] id=<UUID> client=<IP> method=<VERB> path=<PATH>`
  - Logs format: `[REQ_SUCCESS] id=<UUID> status=<CODE> duration=<MS>ms`
- **Security Safeguard**: Logs **never** print passwords, JWT bearer tokens, `Authorization` headers, API keys, or customer payload secrets.

---

## 4. Database Reliability & Alembic Migrations

- **Connection Pool Configuration** (`backend/database.py`):
  - `pool_pre_ping=True`: Verifies connection freshness before executing queries.
  - `pool_size=10`, `max_overflow=20`: Production PostgreSQL pool limits.
  - Request-scoped DB sessions automatically roll back uncommitted transactions on exception (`except Exception: db.rollback(); raise`).
- **Migration Safety Procedure**:
  1. Export a manual database snapshot: `pg_dump -d $DATABASE_URL > backup_pre_migration.sql`
  2. Inspect migration script: `alembic edit <revision>`
  3. Execute upgrade: `alembic upgrade head`
  4. Verify health probe: `curl -I https://autofy-backend.onrender.com/health/ready`

---

## 5. Deployment Rollback Procedures

### Frontend Rollback (Netlify)
1. Go to Netlify Admin Dashboard > **Deploys**.
2. Select the previous green production deploy.
3. Click **Publish Deploy**.

### Backend Code Rollback (Render)
1. Go to Render Dashboard > Autofy Web Service > **Events**.
2. Select the previous stable commit release.
3. Click **Roll Back**.

### Database Schema Rollback
1. Execute step-down migration: `alembic downgrade -1`
2. If schema corruption occurred, restore pre-migration snapshot:
   ```bash
   psql -d $DATABASE_URL < backup_pre_migration.sql
   ```

---

## 6. Incident Response Runbooks

| Incident Type | Initial Diagnostic | Immediate Action |
| :--- | :--- | :--- |
| **Backend Down** | `curl -I https://autofy-backend.onrender.com/health/live` | Check Render deployment logs; restart web service container. |
| **Database Down** | `curl -I https://autofy-backend.onrender.com/health/ready` (returns 503) | Check Render/Supabase PostgreSQL cluster metrics and connection pool limits. |
| **AI Provider Timeout** | Inspect backend logs for `Gemini generation failure` | UI automatically presents `⚠️ [AI Assistant Unavailable]` error notice and triggers human takeover mode. |
| **Secret Compromise** | Identify leaked key in environment configuration | 1. Rotate secret in external provider dashboard.<br>2. Update Render environment variables.<br>3. Trigger manual app redeploy. |

---

## 7. Performance Baseline Benchmark

- **Health Probe (`/health`)**: Avg Latency: **~1.2 ms** | Throughput: **~820 req/sec** (Local SQLite/uvicorn).
- **Dashboard Summary (`/api/v1/business/dashboard-summary`)**: Avg Latency: **~4.5 ms**.
- **Frontend Bundle Size**: Minified `dist/assets/index-*.js`: **~1.79 MB** (Gzip: **~457 KB**).
