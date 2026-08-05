# Apple App Store Privacy Questionnaire Declarations

This document maps all user data types collected by Autofy to App Store Connect Privacy Questionnaire categories.

---

## 1. DATA TYPES DECLARED IN APP PRIVACY

| Data Category | App Store Privacy Data Type | Data Collected | Linked to Identity | Tracking Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Contact Info** | Name | Yes | Yes | NO |
| **Contact Info** | Email Address | Yes | Yes | NO |
| **Contact Info** | Phone Number | Yes | Yes | NO |
| **Financial Info**| Payment Info | Yes (Web / External) | Yes | NO |
| **Financial Info**| Purchase History | Yes | Yes | NO |
| **User Content** | Customer Messages | Yes | Yes | NO |
| **Identifiers** | User ID | Yes | Yes | NO |

---

## 2. APP TRACKING TRANSPARENCY (ATT) & PRIVACY MANIFEST
- **Tracking Status**: Autofy does **NOT** track users across third-party apps or websites for targeted advertising.
- **`NSUserTrackingUsageDescription`**: Not required and omitted.
- **Privacy Manifest**: Created at [`ios/App/App/PrivacyInfo.xcprivacy`](file:///Users/vaibhavsg/Documents/Autofy/ios/App/App/PrivacyInfo.xcprivacy), declaring required-reason APIs (`UserDefaults` & `FileTimestamp`) with `NSPrivacyTracking: false`.
