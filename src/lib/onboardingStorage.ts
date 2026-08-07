import { OnboardingData, INITIAL_ONBOARDING_DATA } from "../types";

const LEGACY_GLOBAL_KEY = "autofy-onboarding-data";
const LEGACY_GATEWAYS_KEY = "autofy-gateways";

/**
 * Returns tenant-scoped storage key: autofy-onboarding-data:<business_id>
 */
export function getTenantOnboardingKey(businessId?: string | null): string | null {
  if (!businessId || typeof businessId !== "string" || !businessId.trim()) {
    return null;
  }
  return `autofy-onboarding-data:${businessId.trim()}`;
}

/**
 * Purges legacy un-scoped global keys that cause cross-account leakage.
 */
export function purgeLegacyOnboardingKeys(): void {
  try {
    localStorage.removeItem(LEGACY_GLOBAL_KEY);
    localStorage.removeItem(LEGACY_GATEWAYS_KEY);
  } catch {
    /* ignore storage errors */
  }
}

/**
 * Loads onboarding draft strictly for the given business_id.
 * If business_id is missing or has no saved draft, returns clean INITIAL_ONBOARDING_DATA.
 */
export function loadTenantOnboardingData(businessId?: string | null): OnboardingData {
  purgeLegacyOnboardingKeys();

  const key = getTenantOnboardingKey(businessId);
  if (!key) {
    return { ...INITIAL_ONBOARDING_DATA };
  }

  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...INITIAL_ONBOARDING_DATA, ...parsed };
    }
  } catch {
    /* storage parse error — fall back to clean defaults */
  }

  return { ...INITIAL_ONBOARDING_DATA };
}

/**
 * Saves onboarding draft strictly for the given business_id.
 */
export function saveTenantOnboardingData(businessId: string | null | undefined, data: OnboardingData): void {
  purgeLegacyOnboardingKeys();

  const key = getTenantOnboardingKey(businessId);
  if (!key) return;

  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    /* storage quota / permission error — non-fatal */
  }
}

/**
 * Removes the saved onboarding draft for a given business_id once onboarding completes.
 */
export function clearTenantOnboardingData(businessId?: string | null): void {
  purgeLegacyOnboardingKeys();

  const key = getTenantOnboardingKey(businessId);
  if (key) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}
