# Autofy — Mobile App (Android + iOS)

Autofy is now wrapped with **Capacitor**, which turns the existing React/Vite
web app into real native apps (an installable `.apk`/`.aab` for Android and an
`.ipa` for iOS) — **without rewriting anything**. The same responsive UI runs on
phones, tablets, and desktop.

```
web app (dist/)  →  Capacitor  →  android/  (Android Studio → APK/AAB)
                                →  ios/      (Xcode → IPA)
```

## What's already wired

- **`capacitor.config.ts`** — app id `com.autofy.app`, name "Autofy"
- **Native init** (`src/lib/native.ts`) — hides splash on load, themes the status
  bar to match light/dark, handles the Android hardware back button
- **Safe areas** — notch / home-indicator handled (see `index.css`)
- **Backend URL baked in** — `.env.production` points the app at your Render API
  (`https://autofy-3qhc.onrender.com`), and the backend CORS already allows the
  native app origins. So login/AI/payments work from inside the app.

## Rebuild after any code change

Whenever you change the web app, refresh the native projects:

```bash
npm run build:mobile      # = vite build && cap sync
```

---

## Build the Android APK

You have Android Studio + the SDK installed already.

```bash
npm run build:mobile
npm run open:android      # opens the project in Android Studio
```

In Android Studio:
1. Let Gradle finish syncing (first time downloads dependencies).
2. **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
3. When it finishes, click **locate** — that's your installable `.apk`.
4. For the Play Store, build a **signed AAB**: Build → Generate Signed Bundle/APK
   → Android App Bundle → create a keystore (keep it safe forever) → release.

Install the APK on a phone: enable "Install unknown apps", copy the `.apk` over,
and tap it.

## Build the iOS app (needs a Mac + Xcode)

```bash
cd ios/App && pod install && cd ../..   # first time only (installs CocoaPods deps)
npm run build:mobile
npm run open:ios          # opens the project in Xcode
```

In Xcode: select your team under **Signing & Capabilities**, pick a device, and
press **Run**. For the App Store: **Product → Archive → Distribute App**.
(You need a $99/yr Apple Developer account.)

---

## App icon & splash (make it premium)

A source icon lives at `resources/icon.svg` (gradient background + white speech
bubble). To generate every icon/splash size automatically:

```bash
# one-time: export the source to PNGs the generator expects
#   resources/icon.png     (1024x1024)
#   resources/splash.png   (2732x2732, icon centered on white)
# then:
npx @capacitor/assets generate --iconBackgroundColor '#8B5CF6' --splashBackgroundColor '#ffffff'
```

Or the no-command route: in Android Studio, right-click `res` → **New → Image
Asset**, choose `resources/icon.svg`, and it builds the adaptive icon for you.

---

## Push notifications (the missing native feature)

The web app can't send push notifications; the native app can. To add them:

1. `npm i @capacitor/push-notifications`
2. **Android:** create a Firebase project, add the Android app (`com.autofy.app`),
   download `google-services.json` into `android/app/`.
3. **iOS:** enable the Push Notifications capability in Xcode + an APNs key from
   your Apple Developer account.
4. Register for a device token on login and send it to your backend, then push
   from the server (e.g. "New lead", "Payment received ₹2,999").

This is a follow-up feature — the app builds and runs fully without it.

---

## Important notes

- **Rotate the keys** in `backend/.env` before a public release (they were shared
  during setup). Test Razorpay keys → live keys after KYC.
- **Cold start:** the Render free tier sleeps; the first request after idle takes
  ~30–50s. Keep it warm with a cron ping to `/api/health`, or upgrade the plan.
- The `android/` and `ios/` folders are committed (source), but their build
  outputs are git-ignored.
