// ════════════════════════════════════════════════════════════
// Autofy — Auth (real backend JWT)
// ------------------------------------------------------------
// Talks to the FastAPI auth router (/api/v1/auth/*) through the shared
// api client. The backend returns a signed JWT which we store where the
// api client reads it (localStorage["autofy-access-token"]), so every
// subsequent API call is automatically authenticated.
//
// There is no /auth/me endpoint — the login/signup response *is* the
// session (it carries user_id, business_id, role). We persist a small
// user profile so getCurrentUser()/getSession() work without a round-trip.
//
// The public surface (signUpWithEmail, signInWithEmail, signInWithGoogle,
// signOut, getCurrentUser, getSession, onAuthStateChange) is unchanged so
// existing UI (AuthPages, PaymentsTab, ProtectedRoute) keeps working.
// ════════════════════════════════════════════════════════════
import { api, ApiError, setAuthToken, clearAuthToken, getAuthToken } from "./api";

// Supabase-compatible user shape so consumers like PaymentsTab
// (user.email, user.user_metadata.full_name) don't need changes.
export interface AuthUser {
  id: string;
  email: string;
  business_id: string;
  role: string;
  user_metadata: {
    full_name: string;
    business_name: string;
  };
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  business_id: string;
  role: string;
}

interface AuthResult {
  data: { user: AuthUser } | null;
  error: { message: string } | null;
}

const USER_KEY = "autofy-user";

// ─── Session storage helpers ───────────────────────────────────
function saveUser(user: AuthUser): void {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    /* storage unavailable — non-fatal */
  }
}

function readUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function clearUser(): void {
  try {
    localStorage.removeItem(USER_KEY);
  } catch {
    /* ignore */
  }
}

// Lightweight, unverified JWT expiry check (signature is verified server-side).
// Returns true if the token is missing or past its `exp` claim.
function isTokenExpired(token: string): boolean {
  try {
    const [, payload] = token.split(".");
    const claims = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    if (typeof claims.exp !== "number") return false; // no exp → treat as non-expiring
    return Date.now() >= claims.exp * 1000;
  } catch {
    return false; // can't parse → let the server be the judge
  }
}

// ─── Auth state listeners ──────────────────────────────────────
type AuthEvent = "SIGNED_IN" | "SIGNED_OUT";
const listeners: Array<(event: AuthEvent, session: { user: AuthUser } | null) => void> = [];

function emit(event: AuthEvent, session: { user: AuthUser } | null): void {
  listeners.forEach((cb) => {
    try {
      cb(event, session);
    } catch {
      /* a bad listener shouldn't break auth */
    }
  });
}

// Establishes the local session from a backend TokenResponse.
function establishSession(token: TokenResponse, profile: Partial<AuthUser["user_metadata"]>, email: string): AuthUser {
  setAuthToken(token.access_token);
  const user: AuthUser = {
    id: token.user_id,
    email,
    business_id: token.business_id,
    role: token.role,
    user_metadata: {
      full_name: profile.full_name ?? "",
      business_name: profile.business_name ?? "",
    },
  };
  saveUser(user);
  emit("SIGNED_IN", { user });
  return user;
}

function toErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    // Turn raw HTTP failures into something a business owner can act on.
    if (err.status === 0) {
      return "Can't reach the server. Check your connection and try again.";
    }
    if (err.status === 409) {
      return "This email is already registered. Please sign in instead.";
    }
    if (err.status === 401) {
      return "Incorrect email or password.";
    }
    if (err.status === 422) {
      // FastAPI validation errors arrive as a list of field problems.
      const d = err.detail as unknown;
      if (Array.isArray(d) && d.length) {
        const first = d[0] as { msg?: string };
        if (first?.msg) return first.msg;
      }
      return "Please check the details you entered and try again.";
    }
    if (err.status >= 500) {
      return "Server error — please try again in a moment.";
    }
    return err.message || fallback;
  }
  if (err instanceof Error) return err.message || fallback;
  return fallback;
}

// ─── Public auth functions ─────────────────────────────────────
export async function signUpWithEmail(
  email: string,
  password: string,
  businessName: string,
  fullName = "",
  phone = ""
): Promise<AuthResult> {
  try {
    const token = await api.post<TokenResponse>("/api/v1/auth/signup", {
      name: fullName || businessName,
      business_name: businessName,
      email,
      phone,
      password,
    });
    const user = establishSession(token, { full_name: fullName, business_name: businessName }, email);
    return { data: { user }, error: null };
  } catch (err) {
    return { data: null, error: { message: toErrorMessage(err, "Failed to create account.") } };
  }
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  try {
    const token = await api.post<TokenResponse>("/api/v1/auth/login", { email, password });
    // Login response has no name/business — keep any previously stored profile metadata.
    const prev = readUser();
    const user = establishSession(
      token,
      {
        full_name: prev?.user_metadata.full_name ?? "",
        business_name: prev?.user_metadata.business_name ?? "",
      },
      email
    );
    return { data: { user }, error: null };
  } catch (err) {
    return { data: null, error: { message: toErrorMessage(err, "Invalid email or password.") } };
  }
}

export async function signInWithGoogle(): Promise<AuthResult> {
  // Real OAuth: ask the backend for Google's consent URL, then hand the browser off.
  // NOTE: completing this loop requires GOOGLE_CLIENT_ID/SECRET to be set and the
  // backend /auth/google/callback to redirect back to the SPA with the token.
  try {
    const res = await api.get<{ authorization_url: string }>("/api/v1/auth/google/authorize");
    if (res?.authorization_url) {
      window.location.assign(res.authorization_url);
      return { data: null, error: null };
    }
    return { data: null, error: { message: "Google sign-in is not available right now." } };
  } catch (err) {
    return { data: null, error: { message: toErrorMessage(err, "Google sign-in is not available right now.") } };
  }
}

// Establishes a session from the token the backend hands back after the
// Google OAuth redirect (see the /auth/callback route). Returns the user.
export function completeOAuthLogin(fields: {
  access_token: string;
  user_id: string;
  business_id: string;
  role: string;
  email?: string;
  name?: string;
}): AuthUser {
  const token: TokenResponse = {
    access_token: fields.access_token,
    token_type: "bearer",
    user_id: fields.user_id,
    business_id: fields.business_id,
    role: fields.role,
  };
  return establishSession(token, { full_name: fields.name ?? "", business_name: "" }, fields.email ?? "");
}

export async function signOut(): Promise<{ error: null }> {
  clearAuthToken();
  clearUser();
  emit("SIGNED_OUT", null);
  return { error: null };
}

export async function getCurrentUser(): Promise<{ user: AuthUser | null }> {
  const u = readUser();
  return { user: u };
}

export async function getSession(): Promise<{ session: { user: AuthUser; access_token: string } | null }> {
  const token = getAuthToken();
  const user = readUser();
  if (!token || !user || isTokenExpired(token)) {
    if (token && isTokenExpired(token)) {
      // Stale token — clear it so the app treats the user as logged out.
      clearAuthToken();
      clearUser();
    }
    return { session: null };
  }
  return { session: { user, access_token: token } };
}

// Synchronous auth check for route guards.
export function isAuthenticated(): boolean {
  const token = getAuthToken();
  return !!token && !isTokenExpired(token);
}

export function onAuthStateChange(
  callback: (event: string, session: unknown) => void
): { data: { subscription: { unsubscribe: () => void } } } {
  const wrapped = (event: AuthEvent, session: { user: AuthUser } | null) => callback(event, session);
  listeners.push(wrapped);
  return {
    data: {
      subscription: {
        unsubscribe: () => {
          const idx = listeners.indexOf(wrapped);
          if (idx >= 0) listeners.splice(idx, 1);
        },
      },
    },
  };
}
