import React from "react";
import { validatePhone } from "../lib/phoneValidation";

export interface CountryOption {
  code: string;
  dialCode: string;
  name: string;
  flag: string;
}

export const SUPPORTED_COUNTRIES: CountryOption[] = [
  { code: "IN", dialCode: "+91", name: "India", flag: "🇮🇳" },
  { code: "US", dialCode: "+1", name: "United States", flag: "🇺🇸" },
  { code: "GB", dialCode: "+44", name: "United Kingdom", flag: "🇬🇧" },
  { code: "AE", dialCode: "+971", name: "UAE", flag: "🇦🇪" },
  { code: "SG", dialCode: "+65", name: "Singapore", flag: "🇸🇬" },
  { code: "CA", dialCode: "+1", name: "Canada", flag: "🇨🇦" },
  { code: "AU", dialCode: "+61", name: "Australia", flag: "🇦🇺" },
  { code: "DE", dialCode: "+49", name: "Germany", flag: "🇩🇪" },
  { code: "FR", dialCode: "+33", name: "France", flag: "🇫🇷" },
  { code: "SA", dialCode: "+966", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "QA", dialCode: "+974", name: "Qatar", flag: "🇶🇦" },
  { code: "KW", dialCode: "+965", name: "Kuwait", flag: "🇰🇼" },
  { code: "OM", dialCode: "+968", name: "Oman", flag: "🇴🇲" },
  { code: "BH", dialCode: "+973", name: "Bahrain", flag: "🇧🇭" },
  { code: "ID", dialCode: "+62", name: "Indonesia", flag: "🇮🇩" },
  { code: "MY", dialCode: "+60", name: "Malaysia", flag: "🇲🇾" },
  { code: "NP", dialCode: "+977", name: "Nepal", flag: "🇳🇵" },
  { code: "BD", dialCode: "+880", name: "Bangladesh", flag: "🇧🇩" },
  { code: "LK", dialCode: "+94", name: "Sri Lanka", flag: "🇱🇰" },
];

interface CountryPhoneInputProps {
  value: string;
  onChange: (fullE164Value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const CountryPhoneInput: React.FC<CountryPhoneInputProps> = ({
  value,
  onChange,
  placeholder = "e.g. 9876543210",
  className = "",
  disabled = false,
}) => {
  // Parse existing dial code if present in value
  const matchedCountry = SUPPORTED_COUNTRIES.find((c) => value.startsWith(c.dialCode));
  const selectedDialCode = matchedCountry ? matchedCountry.dialCode : "+91";
  
  const nationalDigits = value
    ? value.startsWith(selectedDialCode)
      ? value.slice(selectedDialCode.length).trim()
      : value.replace(/^\+\d+/, "").trim()
    : "";

  const handleCountryChange = (newDialCode: string) => {
    const combined = `${newDialCode}${nationalDigits.replace(/\D/g, "")}`;
    onChange(combined);
  };

  const handleDigitsChange = (newDigits: string) => {
    const cleanedDigits = newDigits.replace(/[^\d\s\-()]/g, "");
    if (!cleanedDigits) {
      onChange("");
      return;
    }
    const combined = `${selectedDialCode}${cleanedDigits.replace(/\D/g, "")}`;
    onChange(combined);
  };

  const validation = validatePhone(value);

  return (
    <div className="space-y-1.5 w-full min-w-0">
      <div className="flex items-center gap-2 w-full min-w-0">
        <select
          value={selectedDialCode}
          onChange={(e) => handleCountryChange(e.target.value)}
          disabled={disabled}
          className="bg-[var(--input-bg)] border border-[var(--border)] p-2.5 rounded-xl text-xs text-[var(--text)] font-mono font-bold focus:outline-none focus:border-[var(--brand)] shrink-0 cursor-pointer max-w-[120px]"
        >
          {SUPPORTED_COUNTRIES.map((c) => (
            <option key={`${c.code}-${c.dialCode}`} value={c.dialCode}>
              {c.flag} {c.dialCode}
            </option>
          ))}
        </select>

        <input
          type="tel"
          value={nationalDigits}
          onChange={(e) => handleDigitsChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`flex-1 min-w-0 bg-[var(--input-bg)] border border-[var(--border)] p-2.5 rounded-xl text-xs text-[var(--text)] placeholder-neutral-500 focus:outline-none focus:border-[var(--brand)] font-medium ${className}`}
        />
      </div>

      {value && !validation.ok && (
        <p className="text-[9px] text-red-400 font-medium">{validation.error}</p>
      )}
      {value && validation.ok && (
        <p className="text-[9px] text-green-400 font-medium">✓ E.164 Normalized: {validation.normalized}</p>
      )}
    </div>
  );
};
