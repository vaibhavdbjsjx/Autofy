// ════════════════════════════════════════════════════════════
// Autofy — Central Authentication Token Storage Abstraction
// ------------------------------------------------------------
// Provides a unified storage interface for JWT token persistence.
// Handles Web (localStorage) and defines native adapter extension points
// for Capacitor iOS (Keychain) & Android (Keystore).
// ════════════════════════════════════════════════════════════

const TOKEN_KEY = "autofy-access-token";

export async function getAccessToken(): Promise<string | null> {
  try {
    // Web storage fallback
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setAccessToken(token: string): Promise<void> {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* storage unavailable */
  }
}

export async function removeAccessToken(): Promise<void> {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}
