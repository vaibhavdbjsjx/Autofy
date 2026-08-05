# Apple App Store Release Checklist & Guide

This checklist details every required field and step to publish Autofy on the Apple App Store / TestFlight via App Store Connect.

---

## 1. APP STORE CONNECT LISTING METADATA
- **App Name**: Autofy
- **Subtitle**: AI WhatsApp Automation & CRM
- **Primary Category**: Business
- **Secondary Category**: Productivity
- **Bundle ID**: `com.autofy.app`
- **SKU**: `autofy-ios-app-001`
- **Primary Language**: English (US)
- **Privacy Policy URL**: `https://autofy11.netlify.app/privacy`
- **Support URL**: `https://autofy11.netlify.app`
- **Marketing URL**: `https://autofy11.netlify.app`
- **Account Deletion URL**: `https://autofy11.netlify.app/account-deletion`

---

## 2. APP REVIEW INFORMATION
- **Demo Reviewer Account Credentials**:
  - **Email**: `review_demo@autofy.io`
  - **Password**: `ReviewTest123!`
- **Review Notes**:
  > Autofy is a SaaS automation assistant for small businesses. Reviewers can log in with the provided credentials to explore the interactive dashboard, lead CRM, AI knowledge configuration, and legal settings.

---

## 3. SIGN IN WITH APPLE & SOCIAL LOGIN ASSESSMENT
- **Current App Setup**: Uses Email/Password and Google Sign-In.
- **App Store Guidelines Section 4.8**: If an app provides third-party social login (e.g. Google), Sign in with Apple is generally required unless the app exclusively uses your own company-owned account system.
- **Recommendation**: Adding Sign in with Apple prior to public App Store submission will prevent App Store Review rejection under Guideline 4.8.

---

## 4. EXPORT COMPLIANCE DECLARATION
- Autofy uses standard HTTPS (TLS 1.3) data encryption.
- Meets standard export compliance exemption under U.S. EAR Category 5, Part 2.
