# Apple In-App Purchase (StoreKit 2) Integration Architecture

This document details how Autofy's provider-neutral entitlement service can accept Apple StoreKit 2 transactions for iOS digital SaaS subscription purchases.

---

## 1. ARCHITECTURE OVERVIEW

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
  iOS App (React)           Apple App Store           Autofy Backend   
  Capacitor Plugin   ───>   StoreKit 2 API    ───>    FastAPI Endpoint  
└─────────────────┘       └─────────────────┘       └─────────────────┘
                                                             │
                                                             ▼
                                                    `Subscription` Table
                                                    Status: ACTIVE
```

---

## 2. PROPOSED ENDPOINTS & DATA FLOW

### A. Purchase Execution (Frontend)
1. iOS client initiates StoreKit purchase for Product ID (e.g., `com.autofy.starter.monthly`).
2. App Store returns signed `JWS` transaction string (`originalTransactionId`).

### B. Server-Side Verification (Backend Endpoint)
- **Endpoint**: `POST /api/v1/subscriptions/apple/verify-transaction`
- **Request Payload**:
  ```json
  {
    "original_transaction_id": "2000000123456789",
    "product_id": "com.autofy.starter.monthly",
    "signed_payload": "eyJhbGciOiJFUzI1Ni..."
  }
  ```
- **Backend Action**:
  1. Validates JWS signature against Apple's Root CA certificate.
  2. Maps `product_id` to Autofy plan (`starter`, `pro`, `enterprise`).
  3. Updates `Subscription` table (`provider = 'apple'`, `status = 'ACTIVE'`).

---

## 3. PHASE 3 BILLING PRESERVATION
- **Phase 3 Remains ON HOLD**: No native StoreKit code or live pricing charges are enabled in the current release.
- Pricing UI allows plan exploration without attempting unsupported native checkouts.
