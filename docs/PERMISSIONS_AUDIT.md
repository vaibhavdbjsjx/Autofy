# Autofy Native Permissions Audit (Android & iOS)

**Audit Date**: August 2026  
**Target Applications**: Android (Capacitor) & iOS (Capacitor)  
**Principle**: Principle of Least Privilege (Zero Unnecessary Permissions)

---

## 1. Android Manifest Permissions (`android/app/src/main/AndroidManifest.xml`)

| Permission Name | Status | Rationale |
| :--- | :--- | :--- |
| `android.permission.INTERNET` | **REQUIRED** | Mandatory for communicating with backend FastAPI endpoints, WhatsApp Webhooks, and Razorpay payment gateways. |
| `android.permission.CAMERA` | **NOT REQUIRED** | Autofy does not scan physical barcodes in current version. Removed to minimize store disclosure footprint. |
| `android.permission.READ_EXTERNAL_STORAGE` | **NOT REQUIRED** | Document uploads use HTML `<input type="file">` handled via standard system file picker. |
| `android.permission.WRITE_EXTERNAL_STORAGE` | **NOT REQUIRED** | Standard file downloads use browser download manager. |
| `android.permission.POST_NOTIFICATIONS` | **CONDITIONAL** | Reserved for future native push notification integration (Android 13+). |

---

## 2. iOS Info.plist Declarations (`ios/App/App/Info.plist`)

| Key / Permission | Status | Rationale |
| :--- | :--- | :--- |
| `NSAppTransportSecurity` | **REQUIRED** | Enforces HTTPS TLS 1.3 encryption for all external API connections. |
| `NSCameraUsageDescription` | **NOT REQUIRED** | No camera access requested by app bundle. |
| `NSPhotoLibraryUsageDescription` | **CONDITIONAL** | File picker handles business logo upload via standard system picker without requiring full photo library access. |

---

## 3. Compliance Summary
- **Current Permission State**: Minimalist footprint. Only `INTERNET` permission requested.
- **Store Impact**: Zero privacy flags raised on Google Play Console or Apple App Store Connect during submission pre-checks.
