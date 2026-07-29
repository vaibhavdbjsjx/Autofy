import type { CapacitorConfig } from '@capacitor/cli';

// ════════════════════════════════════════════════════════════
// Capacitor config — wraps the built web app (dist/) into native
// Android + iOS apps. `npx cap sync` copies dist/ into the native
// projects; you then build the APK/IPA in Android Studio / Xcode.
// ════════════════════════════════════════════════════════════
const config: CapacitorConfig = {
  appId: 'com.autofy.app',        // reverse-domain id — used in the Play Store / App Store
  appName: 'Autofy',
  webDir: 'dist',                 // Vite's production output
  backgroundColor: '#ffffff',
  android: {
    // Allow the WebView to reach your HTTPS backend (Render)
    allowMixedContent: false,
  },
  ios: {
    contentInset: 'always',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#ffffff',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
    StatusBar: {
      // Dark text/icons on the light default theme
      style: 'LIGHT',
      backgroundColor: '#ffffff',
    },
    Keyboard: {
      resize: 'native',
    },
  },
};

export default config;
