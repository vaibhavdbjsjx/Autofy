// ════════════════════════════════════════════════════════════
// Autofy — Dynamic Razorpay Checkout SDK Loader
// ------------------------------------------------------------
// Loads https://checkout.razorpay.com/v1/checkout.js dynamically
// and ensures window.Razorpay is available before opening checkout.
// ════════════════════════════════════════════════════════════

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && (window as any).Razorpay) {
      resolve(true);
      return;
    }
    if (typeof document === "undefined") {
      resolve(false);
      return;
    }
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}
