// ════════════════════════════════════════════════════════════
// Autofy — Central API Client
// ------------------------------------------------------------
// One place for every backend call. Handles:
//   • Base URL      (VITE_API_URL, else relative → Vite dev proxy / same-origin)
//   • Auth header    (JWT bearer, read from localStorage)
//   • JSON encoding  (auto Content-Type + body serialization)
//   • Error handling (throws a typed ApiError with status + parsed detail)
//
// Usage:
//   import { api } from "@/src/lib/api";        // or relative path
//   const data = await api.get<Lead[]>("/api/v1/leads");
//   await api.post("/api/v1/tickets", { subject });
// ════════════════════════════════════════════════════════════

// Base URL: empty string in dev so requests stay relative and go through the
// Vite proxy (see vite.config.ts). In production set VITE_API_URL to the API origin.
export const API_BASE: string = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

// localStorage key holding the backend JWT access token. The real-auth flow
// (C3) writes here on login; until then requests simply go out unauthenticated.
const TOKEN_KEY = "autofy-access-token";

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* storage unavailable — ignore */
  }
}

export function clearAuthToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

// Typed error so callers can branch on status (e.g. 401 → re-login).
export class ApiError extends Error {
  readonly status: number;
  readonly detail: unknown;
  constructor(status: number, message: string, detail: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

type Json = Record<string, unknown> | unknown[];

interface RequestOptions extends Omit<RequestInit, "body"> {
  // Plain object/array bodies are JSON-encoded automatically. Pass a string,
  // FormData, etc. through `raw` if you need full control.
  body?: Json;
  raw?: BodyInit;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, raw, headers, ...rest } = options;

  const finalHeaders = new Headers(headers);
  const token = getAuthToken();
  if (token) finalHeaders.set("Authorization", `Bearer ${token}`);

  let finalBody: BodyInit | undefined = raw;
  if (body !== undefined && raw === undefined) {
    finalHeaders.set("Content-Type", "application/json");
    finalBody = JSON.stringify(body);
  }

  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  let res: Response | undefined;
  let lastError: unknown;
  const maxRetries = 2;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      res = await fetch(url, { ...rest, headers: finalHeaders, body: finalBody });
      break; // Request succeeded (HTTP response received)
    } catch (networkErr) {
      lastError = networkErr;
      if (attempt < maxRetries) {
        // Wait 1 second before retrying to allow backend cold-start / socket reconnect
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }

  if (!res) {
    // fetch only rejects on network failure / CORS — surface it as a 0-status ApiError.
    throw new ApiError(0, "Network error — could not reach the server. Please check connection.", lastError);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  if (!res.ok) {
    if (res.status === 401) {
      clearAuthToken();
      if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
        // Redirect cleanly to login without infinite loop
        window.location.href = "/login";
      }
    }

    let message: string | null = null;
    let detail: unknown = payload;

    if (isJson && payload && typeof payload === "object") {
      const p = payload as Record<string, unknown>;
      const wrapped = p.error as Record<string, unknown> | undefined;
      if (wrapped && typeof wrapped === "object" && typeof wrapped.message === "string") {
        message = wrapped.message;
        detail = wrapped.details ?? wrapped;
      } else if ("detail" in p) {
        const d = p.detail;
        detail = d;
        message = typeof d === "string" ? d : null;
      }
    }

    throw new ApiError(res.status, message || `Request failed with status ${res.status}`, detail);
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: Json, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: Json, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(path: string, body?: Json, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  del: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
  delete: <T>(path: string, body?: Json, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE", body }),
};

export default api;
