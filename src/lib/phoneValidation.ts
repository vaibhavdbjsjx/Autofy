// ─── E.164 phone validation & normalization ──────────────────
// Indian mobile: exactly 10 digits starting with [6-9], normalized to +91XXXXXXXXXX
// International: must start with +, 7-15 digits total, country code required
export function validatePhone(raw: string): { ok: boolean; normalized: string; error: string } {
  if (!raw || !raw.trim()) {
    return { ok: false, normalized: "", error: "Phone number is required." };
  }

  // Reject letters and invalid special characters
  if (/[a-zA-Z]/.test(raw) || /[^\d\s\-()+]/.test(raw)) {
    return { ok: false, normalized: "", error: "Phone number must contain only digits, spaces, +, and hyphens." };
  }

  const cleaned = raw.replace(/[\s\-()]/g, "").trim();

  // ── Numbers starting with + (explicit country code) ──
  if (cleaned.startsWith("+")) {
    let digits = cleaned.slice(1);

    // Fix double prefix: +91916360254763 → +916360254763
    if (digits.startsWith("9191") && digits.length === 14) {
      digits = digits.slice(2);
    }

    // Validate +91 Indian numbers
    if (digits.startsWith("91")) {
      const national = digits.slice(2);
      if (national.length !== 10 || !/^[6-9]/.test(national)) {
        return { ok: false, normalized: "", error: "Indian mobile number must be 10 digits starting with 6, 7, 8, or 9." };
      }
      return { ok: true, normalized: "+" + digits, error: "" };
    }

    // Other international: E.164 requires 7-15 digits after +
    if (digits.length < 7 || digits.length > 15) {
      return { ok: false, normalized: "", error: "International number must have 7–15 digits after +." };
    }
    return { ok: true, normalized: "+" + digits, error: "" };
  }

  // ── Numbers without + (assume Indian context from UI) ──
  let digitsOnly = cleaned.replace(/\D/g, "");

  // Strip leading 0 (trunk prefix): 06360254763 → 6360254763
  if (digitsOnly.startsWith("0") && digitsOnly.length === 11) {
    digitsOnly = digitsOnly.slice(1);
  }

  // Strip leading 91 (country code without +): 916360254763 → 6360254763
  if (digitsOnly.startsWith("91") && digitsOnly.length === 12) {
    const national = digitsOnly.slice(2);
    if (/^[6-9]/.test(national)) {
      digitsOnly = national;
    }
  }

  // Must be exactly 10 digits starting with 6-9 for Indian mobile
  if (digitsOnly.length === 10 && /^[6-9]/.test(digitsOnly)) {
    return { ok: true, normalized: "+91" + digitsOnly, error: "" };
  }

  return { ok: false, normalized: "", error: "Enter a valid 10-digit Indian mobile number (starting with 6–9) or international number with + country code." };
}
