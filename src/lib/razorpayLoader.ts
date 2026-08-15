// ════════════════════════════════════════════════════════════
// Autofy — Dynamic Razorpay Checkout SDK Loader
// ------------------------------------------------------------
// Loads https://checkout.razorpay.com/v1/checkout.js dynamically
// and ensures window.Razorpay is available before opening checkout.
// ════════════════════════════════════════════════════════════

let razorpayPromise: Promise<boolean> | null = null;

export function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.resolve(false);
  }
  if ((window as any).Razorpay) {
    return Promise.resolve(true);
  }
  if (razorpayPromise) {
    return razorpayPromise;
  }

  razorpayPromise = new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => {
        razorpayPromise = null;
        resolve(false);
      }, { once: true });

      const checkInterval = setInterval(() => {
        if ((window as any).Razorpay) {
          clearInterval(checkInterval);
          resolve(true);
        }
      }, 50);
      setTimeout(() => {
        clearInterval(checkInterval);
        if ((window as any).Razorpay) {
          resolve(true);
        } else {
          razorpayPromise = null;
          resolve(false);
        }
      }, 3000);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      razorpayPromise = null;
      resolve(false);
    };
    document.head.appendChild(script);
  });

  return razorpayPromise;
}
