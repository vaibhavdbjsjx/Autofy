# Google Play Store Release Checklist & Guide

This checklist details every required field and step to publish Autofy on the Google Play Console.

---

## 1. APP LISTING METADATA
- **App Name**: Autofy
- **Short Description**: AI-Powered WhatsApp Business Automation & Customer CRM for Small Businesses.
- **Full Description**: Autofy equips small business owners with an intelligent AI WhatsApp assistant that automatically handles customer inquiries, schedules service bookings, tracks leads, and manages orders 24/7.
- **Application ID**: `com.autofy.app`
- **Default Language**: English (US) / English (IN)
- **App Category**: Business / Productivity
- **Privacy Policy URL**: `https://autofy11.netlify.app/privacy`
- **Account Deletion Request URL**: `https://autofy11.netlify.app/account-deletion`
- **Support Email**: `privacy@autofy.io` / `hello@autofy.io`

---

## 2. GRAPHICS & MEDIA ASSETS
- [ ] **App Icon**: 512 x 512 px PNG (32-bit with alpha)
- [ ] **Feature Graphic**: 1024 x 500 px JPG or PNG
- [ ] **Phone Screenshots**: At least 2 screenshots (Min 320px, Max 3840px, 16:9 or 9:16 aspect ratio)
- [ ] **7-Inch / 10-Inch Tablet Screenshots**: Optional (recommended for tablet optimization)

---

## 3. STORE COMPLIANCE & DECLARATIONS
- **Data Safety Form**: Completed matching `docs/GOOGLE_PLAY_DATA_SAFETY.md`.
- **Target Audience**: 18 and over.
- **News App / Government App**: Select **NO**.
- **Financial Features**: Select **NO** (SaaS subscription purchase, not a financial/banking application).
- **App Access Credentials**: Provide test owner account credentials for Google Play App Reviewers:
  - **Login Email**: `review_demo@autofy.io`
  - **Password**: `ReviewTest123!`

---

## 4. RELEASE ARTIFACT & SIGNING
- **Target SDK**: API 36 (Android 15)
- **Min SDK**: API 24 (Android 7.0)
- **Production Artifact**: `android/app/build/outputs/bundle/release/app-release.aab`
- **Google Play App Signing**: Enabled by default in Play Console. Upload your signed `.aab` file to **Production Track** or **Internal Testing Track**.
