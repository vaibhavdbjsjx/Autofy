# Google Play Data Safety Declaration Matrix

This document maps all user and business data collected or processed by the Autofy Android application for compliance with Google Play Console Data Safety requirements.

---

## 1. DATA COLLECTION & SHARING SUMMARY

| Data Category | Data Type | Collected | Shared | Purpose | Required / Optional |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Personal Info** | Name | Yes | No | Account Management / Personalization | Required for Signup |
| **Personal Info** | Email address | Yes | No | Authentication & Account Recovery | Required |
| **Personal Info** | Phone number | Yes | No | Business Contact & WhatsApp Integration | Optional / Business Setup |
| **Financial Info** | User payment info | Yes (Razorpay) | Yes (Razorpay) | Billing & Subscription Processing | Optional / Paid Tiers |
| **Financial Info** | Purchase history | Yes | No | Billing Records & Entitlement Access | Automatic on Purchase |
| **Messages** | Other in-app messages | Yes | Yes (Meta API) | AI WhatsApp Agent Response Generation | Core Feature |
| **App Info & Performance**| Crash logs / Diagnostics | Yes | No | App Stability & Bug Fixing | Automatic |
| **Identifiers** | User / Device IDs | Yes | No | Multi-Tenant Session Management | Required |

---

## 2. SECURITY PRACTICES
- **Data Encryption in Transit**: All network data transmitted between the Android app and Autofy backend API uses HTTPS / TLS 1.3 encryption.
- **Account Deletion**: Users can request complete account and data deletion directly inside the app (**Settings > Delete Account**) or via the public web portal at `https://autofy11.netlify.app/account-deletion`.

---

## 3. HUMAN CONFIRMATION CHECKLIST FOR PLAY CONSOLE
When filling out the Data Safety form in Google Play Console, confirm:
1. Does your app collect or share any of the required user data types? **YES**.
2. Is all user data collected by your app encrypted in transit? **YES**.
3. Do you provide a way for users to request that their data be deleted? **YES**.
