# Autofy Production Incident Recovery & Backup Guide

This document outlines backup procedures, disaster recovery steps, database migration rollbacks, and secret rotation workflows for Autofy production operations.

---

## 1. DATABASE BACKUP & RESTORE

### Automated Provider Backups (Managed PostgreSQL)
- **Render PostgreSQL / Supabase**: Daily automated point-in-time snapshots enabled by default on managed database instances.
- **Manual Database Dump**:
  ```bash
  pg_dump -h hostname -U username -d autofydb -F c -b -v -f autofy_backup_$(date +%Y%m%m).dump
  ```
- **Database Restore**:
  ```bash
  pg_restore -h hostname -U username -d autofydb -v autofy_backup_TARGET_DATE.dump
  ```

---

## 2. ALEMBIC MIGRATION ROLLBACK

If a database migration deployment encounters an error:
1. **Check Current Migration Revision**:
   ```bash
   python3 -m alembic current
   ```
2. **Downgrade to Previous Stable Revision**:
   ```bash
   python3 -m alembic downgrade -1
   ```
3. **Re-run Health Inspection**:
   ```bash
   curl -i https://autofy-backend.onrender.com/health
   ```

---

## 3. SECRET ROTATION WORKFLOW

### A. JWT Secret Key Rotation
1. Generate a fresh 64-character hexadecimal key:
   ```bash
   python3 -c "import secrets; print(secrets.token_hex(32))"
   ```
2. Update `JWT_SECRET_KEY` in Render environment settings.
3. Restart backend service. Active user sessions will be invalidated and users will re-authenticate cleanly.

### B. Third-Party API Key Rotation
- **Gemini AI**: Create new API key in Google AI Studio, update `GEMINI_API_KEY`, restart backend.
- **WhatsApp Webhook Token**: Update `WHATSAPP_VERIFY_TOKEN` in Render and update Meta Developer Console callback settings simultaneously.

---

## 4. INCIDENT RECOVERY CHECKLIST

| Incident Type | Initial Diagnostic | Immediate Action |
| :--- | :--- | :--- |
| **API Down (500 Error)** | Check `/health` endpoint and Render logs | Inspect `logger.critical` stack traces in Render log stream |
| **DB Connection Failure** | `/health` returns `{"status": "degraded"}` | Check PostgreSQL provider connection limits & pool overflow |
| **Rate Limit Triggered** | Client receives `HTTP 429` | Verify client IP, adjust `RateLimiterMiddleware` thresholds if needed |
| **CORS Blocked** | Browser console shows CORS error | Verify `CORS_ORIGINS` array matches frontend protocol and domain |
