# AUTOFY — PRODUCTION READINESS & SOURCE-TRUTH AUDIT MATRIX

This matrix reflects the verified status of every feature, component, integration, and target in the Autofy repository.

---

## 1. Feature Readiness Matrix

| Feature / Component | Status | Source of Truth | Real / Demo / Deferred | External Config Required | Store Blocker? | Operational Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Landing Page & Navigation** | `WORKING` | `src/App.tsx` | REAL | None | No | Semantic HTML, responsive layout verified. |
| **User Registration & Login** | `WORKING` | `backend/routers/auth.py` | REAL | JWT Secret (Prod) | No | Salted bcrypt passwords, JWT bearer claims. |
| **Google OAuth (Web)** | `WORKING — NEEDS EXTERNAL CONFIG` | `backend/auth/google_oauth.py` | REAL | Google Client ID/Secret | No | Web OAuth flow active; requires client credentials. |
| **Google OAuth (Native Android/iOS)** | `WORKING — NEEDS EXTERNAL CONFIG` | `src/components/AuthPages.tsx` | REAL | Native Deep Link Scheme | Yes | Native deep links require Google Cloud Console SHA-1 fingerprint registration. |
| **Dashboard Metrics (Live)** | `WORKING` | `backend/routers/business.py` | REAL | Database | No | Computes real DB totals (`0` counts for unconfigured tenants). |
| **Dashboard Metrics (Demo)** | `WORKING` | `src/data/demoDashboard.ts` | DEMO | None | No | Explicitly labeled Amber Preview banner (`?demo=true`). |
| **Leads & CRM Management** | `WORKING` | `backend/routers/leads.py` | REAL | Database | No | CRUD operations, native phone dialer (`tel:`), CSV export. |
| **Conversations & AI Chat** | `WORKING` | `backend/routers/conversations.py` | REAL | Gemini API Key | No | Strictly separates Live error states (`⚠️ [AI Assistant Unavailable]`) from Demo mode. |
| **WhatsApp Webhook Handshake** | `WORKING — NEEDS EXTERNAL CONFIG` | `backend/routers/whatsapp.py` | REAL | Meta Cloud Token & Phone ID | No | GET handshake verification implemented; deduplication check active. |
| **WhatsApp Tester / Simulator** | `WORKING` | `src/components/WhatsAppSetupTab.tsx` | DEMO ONLY | None | No | Visually tagged as `[LOCAL SANDBOX SIMULATOR]`. |
| **Super Admin Platform View** | `DEMO ONLY` | `src/components/SuperAdminDashboardTab.tsx` | DEMO ONLY | None | No | Tagged `[Demo]` to prevent confusing sample businesses with real multi-tenant data. |
| **Mobile Audit Tab** | `WORKING` | `src/components/MobileAuditTab.tsx` | DEMO ONLY | None | No | Tagged `[SIMULATED TEST TOOL]` to prevent fake penetration test claims. |
| **Account Deletion & Data Privacy** | `WORKING` | `backend/services/account_deletion_service.py` | REAL | Database | No | Server-authoritative cascading deletion with password verification. |
| **Native Storage Abstraction** | `WORKING` | `src/lib/authStorage.ts` | REAL | None | No | Centralized storage interface (`getAccessToken`, `setAccessToken`). |
| **Android Target (`android/`)** | `WORKING — NEEDS REAL DEVICE TEST` | `android/app/build.gradle` | REAL | Upload Keystore (Release) | Yes (Release) | `compileSdk=36`, `allowBackup=false`, `./gradlew assembleDebug` PASSED. |
| **iOS Target (`ios/`)** | `WORKING — NEEDS REAL DEVICE TEST` | `ios/App/App/PrivacyInfo.xcprivacy` | REAL | Apple Dev Signing | Yes (Release) | Deployment Target iOS 15.0, Privacy Manifest configured. |
| **Sign in with Apple** | `DEFERRED` | N/A | DEFERRED | Apple Developer Account | Yes (iOS Release) | Deferred per prompt directive. |
| **Push Notifications** | `DEFERRED` | N/A | DEFERRED | Firebase / APNs | No | Infrastructure missing; marked as deferred product enhancement. |
| **Razorpay Subscriptions & Billing** | `DEFERRED` | `backend/services/razorpay_subscription_service.py` | DEFERRED | Razorpay Mandate Keys | No | Phase 3 Billing frozen per prompt directive. |

---

## 2. Security & Compliance Summary
- **Android Backup Security**: `android:allowBackup="false"` enforced in `AndroidManifest.xml`.
- **Dependency Audit**: `npm audit fix` executed. 4 vulnerabilities remediated cleanly; 2 high-severity React Router RSC mode advisories noted without applying breaking version downgrades.
- **Secret Scan**: Regex scan (`sk_live`, `rzp_live`, `AIzaSy`) confirmed **0 live secret keys** committed in repository.
- **Tenant Isolation**: Verified all backend endpoints resolve tenant context strictly from JWT session claims.
