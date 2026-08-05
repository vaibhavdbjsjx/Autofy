# Autofy Data Collection & Privacy Inventory

**Document Type**: Store Compliance & Data Safety Declaration  
**Scope**: Google Play Data Safety Section & Apple App Privacy Details  

---

## 1. Data Collection Inventory Matrix

| Data Category | Data Subtype | Purpose of Collection | Collected vs Shared | Optional or Mandatory | Storage & Security |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Personal Info** | Name, Email, Phone | Account creation, authentication, team roster | Collected | Mandatory for Owners | Encrypted at rest, JWT auth |
| **Business Info** | Company Name, Timezone, Address | Business workspace setup, concierge identity | Collected | Mandatory | Multi-tenant isolated DB |
| **Customer Data** | Leads, Contact Name, Phone | CRM management, WhatsApp lead pipelines | Collected | Mandatory for CRM | Multi-tenant isolated DB |
| **Communications**| WhatsApp Chat Content | AI prompt evaluation, RAG response generation | Shared with Meta & Gemini API | Mandatory for AI Concierge | Transmitted via HTTPS TLS 1.3 |
| **Financial Info** | Payment Amounts, Txn IDs | Invoice logs, GST/Tax audit records | Shared with Razorpay | Mandatory for paid plans | Anonymized on account deletion |
| **Files & Docs** | Uploaded FAQs, PDF Guides | RAG knowledge base indexing | Collected | Optional | Multi-tenant disk storage |
| **App Activity** | AI Logs, Knowledge Gaps | Quality assurance, AI response tuning | Collected | Mandatory | Purged on account deletion |

---

## 2. Store Declarations

### Google Play Data Safety
- **Is Data Encrypted in Transit?** YES (HTTPS / TLS 1.3).
- **Does App Provide a Way for Users to Request Data Deletion?** YES (In-app self-service + Public web URL at `/account-deletion`).
- **Does App Collect Location?** NO.
- **Does App Share Data with Third Parties?** YES (Only to process core functionality via Meta WhatsApp API, Razorpay Payment Gateway, and Google Gemini API).

### Apple App Privacy (App Store Connect)
- **Data Used to Track You**: NONE.
- **Data Linked to You**: User Account Info, Financial Info, Contact Info, User Content.
- **Data Not Linked to You**: Anonymous crash and performance metrics.
