// ════════════════════════════════════════════════════════════
// Native (Capacitor) bootstrap. Everything here is a no-op in the
// browser — it only runs when the app is packaged as the Android/iOS
// app, so the web build is unaffected.
// ════════════════════════════════════════════════════════════
import { Capacitor } from '@capacitor/core';

export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

/** Sync the native status bar with the current light/dark theme. */
export async function syncStatusBar(theme: 'light' | 'dark') {
  if (!isNative()) return;
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    // Style.Dark = dark ICONS (for a light background) and vice-versa.
    await StatusBar.setStyle({ style: theme === 'dark' ? Style.Dark : Style.Light });
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: theme === 'dark' ? '#0A0A0F' : '#FFFFFF' });
    }
  } catch { /* plugin unavailable — ignore */ }
}

// Global registry for custom back-button handlers (e.g. closing modals, going back in tab history)
type BackHandler = () => boolean; // Returns true if handled, false to pass down
const backHandlers: Set<BackHandler> = new Set();

/** Register a custom back-button action (e.g., closing a modal or popping a tab). Returns unregister function. */
export function registerBackHandler(handler: BackHandler): () => void {
  backHandlers.add(handler);
  return () => {
    backHandlers.delete(handler);
  };
}

/** Called once at startup from main.tsx. */
export async function initNative() {
  if (!isNative()) return;

  // Hide the splash screen once the web app has painted.
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide();
  } catch { /* ignore */ }

  // On Android, keep the status bar from drawing over the web content so the
  // navbar isn't hidden behind the clock/battery (iOS handles this via safe areas).
  try {
    const { StatusBar } = await import('@capacitor/status-bar');
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setOverlaysWebView({ overlay: false });
    }
  } catch { /* ignore */ }

  // Android hardware back button: run registered handlers first, then history, then exit.
  try {
    const { App } = await import('@capacitor/app');
    App.addListener('backButton', ({ canGoBack }) => {
      // Run custom registered back handlers in reverse insertion order
      const handlersArray = Array.from(backHandlers).reverse();
      for (const handler of handlersArray) {
        if (handler()) {
          return; // Handled by a component (e.g., modal closed or tab popped)
        }
      }

      if (canGoBack && window.history.length > 1) {
        window.history.back();
      } else {
        App.exitApp();
      }
    });
  } catch { /* ignore */ }

  // Initial status bar style follows the saved theme (light is default).
  const saved = (() => { try { return localStorage.getItem('autofy-theme'); } catch { return null; } })();
  syncStatusBar(saved === 'dark' ? 'dark' : 'light');
}

