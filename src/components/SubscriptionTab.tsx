import React, { useState, useEffect } from "react";
import { Check, Sparkles, ShieldCheck, CreditCard, ArrowRight, Clock, Lock, Zap } from "lucide-react";
import { api } from "../lib/api";
import { isAuthenticated } from "../lib/auth";
import { loadRazorpayScript } from "../lib/razorpayLoader";

interface SubscriptionTabProps {
  triggerNotification?: (msg: string) => void;
}

export interface SubscriptionStatusResponse {
  business_id: string;
  status: "EXPLORING" | "TRIAL_PENDING" | "TRIAL_ACTIVE" | "ACTIVE" | "PAST_DUE" | "CANCEL_AT_PERIOD_END" | "CANCELLED" | "EXPIRED";
  plan_id: string;
  product_name?: string;
  plan_name: string;
  provider: string;
  provider_subscription_id?: string;
  is_live_accessible: boolean;
  is_paid: boolean;
  pricing: {
    currency: string;
    billing_interval: "monthly" | "yearly" | string;
    price: number;
    normal_price: number;
    monthly_equivalent?: number;
    savings_amount?: number;
    discount_percent?: number;
  };
  trial: {
    active: boolean;
    started_at: string | null;
    ends_at: string | null;
    days_remaining: number;
  };
  period: {
    start: string | null;
    end: string | null;
    cancel_at_period_end: boolean;
    cancelled_at: string | null;
  };
  entitlements: Record<string, any>;
}

export const SubscriptionTab: React.FC<SubscriptionTabProps> = ({ triggerNotification }) => {
  const [subState, setSubState] = useState<SubscriptionStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("yearly");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchStatus = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      if (isAuthenticated()) {
        const res = await api.get<SubscriptionStatusResponse>("/api/v1/subscriptions/status");
        setSubState(res);
        if (res.pricing.billing_interval === "monthly" || res.pricing.billing_interval === "yearly") {
          setBillingInterval(res.pricing.billing_interval as "monthly" | "yearly");
        }
      } else {
        // Unauthenticated preview fallback
        setSubState({
          business_id: "demo-biz",
          status: "EXPLORING",
          plan_id: "pro",
          product_name: "Autofy Pro",
          plan_name: "Autofy Pro Yearly",
          provider: "razorpay",
          is_live_accessible: false,
          is_paid: false,
          pricing: {
            currency: "INR",
            billing_interval: "yearly",
            price: 6899,
            normal_price: 6899,
            monthly_equivalent: 575,
            savings_amount: 1499,
            discount_percent: 18,
          },
          trial: {
            active: false,
            started_at: null,
            ends_at: null,
            days_remaining: 0,
          },
          period: {
            start: null,
            end: null,
            cancel_at_period_end: false,
            cancelled_at: null,
          },
          entitlements: {
            max_monthly_messages: -1,
            whatsapp_auto_reply: true,
            custom_rag: true,
            appointments_booking: true,
          },
        });
      }
    } catch (err: any) {
      setErrorMsg("Unable to load subscription state from server.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleStartTrial = async (interval: "monthly" | "yearly") => {
    // Open real Razorpay Standard Checkout mandate setup for trial
    await handleCreateCheckout(interval);
  };

  const handleCreateCheckout = async (interval: "monthly" | "yearly") => {
    setIsSubmitting(true);
    try {
      if (!isAuthenticated()) {
        triggerNotification?.("Please sign in to authorize your trial mandate.");
        return;
      }

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        triggerNotification?.("Unable to load Razorpay SDK. Please check your network connection.");
        return;
      }

      const res = await api.post<any>("/api/v1/subscriptions/create-checkout", { billing_interval: interval });

      if (!res?.razorpay_subscription_id) {
        triggerNotification?.("Unable to generate subscription checkout payload. Please retry.");
        return;
      }

      if ((window as any).Razorpay) {
        const options = {
          key: res.razorpay_key_id,
          subscription_id: res.razorpay_subscription_id,
          name: "Autofy Pro",
          description: `Mandate Setup — ${interval === "yearly" ? "14-Day Free Trial (₹6,899/yr after trial)" : "7-Day Free Trial (₹699/mo after trial)"}`,
          handler: async function (response: any) {
            try {
              setIsSubmitting(true);
              const verifyRes = await api.post<any>("/api/v1/payments/verify", {
                razorpay_payment_id: response.razorpay_payment_id || `pay_mandate_${Date.now()}`,
                razorpay_subscription_id: response.razorpay_subscription_id || res.razorpay_subscription_id,
                razorpay_signature: response.razorpay_signature || "signature_mandate_authorized",
              });
              
              if (verifyRes && verifyRes.status === "success") {
                await fetchStatus();
                triggerNotification?.("Payment mandate authorized successfully! Your Autofy Pro subscription is active.");
              } else {
                triggerNotification?.("Payment verification failed. Please try again.");
              }
            } catch (verifyErr: any) {
              triggerNotification?.(`Verification failed: ${verifyErr?.message || "Please contact support"}`);
            } finally {
              setIsSubmitting(false);
            }
          },
          modal: {
            ondismiss: function () {
              triggerNotification?.("Checkout cancelled. Trial mandate authorization was not completed.");
              setIsSubmitting(false);
            }
          },
          notes: {
            business_id: res.business_id,
            billing_interval: interval,
          },
          theme: {
            color: "#8B5CF6",
          },
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        triggerNotification?.("Razorpay SDK unavailable. Please refresh and try again.");
      }
    } catch (err: any) {
      triggerNotification?.("Checkout generation error. Please retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    setIsSubmitting(true);
    try {
      if (isAuthenticated()) {
        const res = await api.post<any>("/api/v1/subscriptions/cancel");
        setSubState(res.subscription);
        triggerNotification?.("Subscription scheduled to cancel at period end. Your account data remains intact.");
      }
    } catch (err: any) {
      triggerNotification?.("Cancellation request failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFormattedDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const featuresList = [
    "Unlimited WhatsApp Automation & AI Replies",
    "24/7 Autonomous AI Employee Engine",
    "Instant Live RAG Knowledge Base Indexing",
    "Automated Appointment Booking & Reminders",
    "UPI & Online Payment Links Collection",
    "Lead CRM Capture & Inbox Management",
    "VIP Priority Customer Support",
  ];

  const isAlreadySubscribed = subState?.status === "ACTIVE" || subState?.status === "CANCEL_AT_PERIOD_END";
  const isInTrial = subState?.status === "TRIAL_ACTIVE";

  return (
    <div id="subscription-plans-module" className="space-y-8 font-sans text-left max-w-5xl mx-auto">
      {/* SECTION HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight flex items-center gap-2" style={{ color: "var(--text)" }}>
            <CreditCard className="w-6 h-6 text-[#8B5CF6]" />
            Subscription & Billing
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Autofy Pro provides complete business automation with transparent, recurring billing.
          </p>
        </div>

        <div className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
          <span className="text-xs font-black text-[#8B5CF6] uppercase tracking-wider">
            Status: {subState?.status.replace(/_/g, " ") || "EXPLORING"}
          </span>
        </div>
      </div>

      {/* CURRENT ACTIVE SUBSCRIPTION / TRIAL BANNER */}
      {(isInTrial || isAlreadySubscribed) && (
        <div className="surface-a p-6 sm:p-8 rounded-3xl relative overflow-hidden border border-purple-500/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-xs font-black text-green-400">
              <ShieldCheck className="w-4 h-4" />
              <span>
                {isInTrial
                  ? `AUTOFY PRO — FREE TRIAL ACTIVE (${subState?.trial.days_remaining} DAYS REMAINING)`
                  : subState?.status === "ACTIVE"
                  ? "AUTOFY PRO — SUBSCRIPTION ACTIVE"
                  : "SUBSCRIPTION CANCELLED (ACTIVE UNTIL PERIOD END)"}
              </span>
            </div>

            <h3 className="text-2xl font-black font-display" style={{ color: "var(--text)" }}>
              Autofy Pro ({subState?.pricing.billing_interval === "yearly" ? "Yearly" : "Monthly"}) — ₹
              {subState?.pricing.price.toLocaleString("en-IN")} / {subState?.pricing.billing_interval}
            </h3>

            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              {isInTrial
                ? `Your ${subState?.trial.days_remaining}-day free trial is currently active. Next charge of ₹${subState?.pricing.price.toLocaleString("en-IN")} scheduled for ${getFormattedDate(subState?.trial.ends_at)}.`
                : subState?.status === "CANCEL_AT_PERIOD_END"
                ? `Your subscription is cancelled at the end of the billing period. Full access remains active until ${getFormattedDate(subState?.period.end)}.`
                : `Your recurring subscription is active. Next payment date: ${getFormattedDate(subState?.period.end)}.`}
            </p>
          </div>

          {subState?.status === "ACTIVE" && !subState?.period.cancel_at_period_end && (
            <button
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-xs font-bold text-red-400 transition cursor-pointer shrink-0"
            >
              Cancel Subscription
            </button>
          )}
        </div>
      )}

      {/* WORLD-CLASS AUTOFY PRO PRICING CARD */}
      <div className="space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-black text-purple-400 uppercase tracking-widest">
            <Zap className="w-3.5 h-3.5" />
            Autofy Pro
          </div>
          <h3 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-[var(--text)]">
            Everything you need to automate your business.
          </h3>
          <p className="text-sm text-[var(--text-muted)] max-w-lg mx-auto">
            One powerful subscription. Choose monthly or yearly billing with complete feature access.
          </p>

          {/* SEGMENTED BILLING TOGGLE */}
          <div className="pt-2 flex items-center justify-center">
            <div className="p-1 rounded-2xl bg-black/40 border border-[var(--border)] inline-flex items-center gap-1">
              <button
                type="button"
                onClick={() => setBillingInterval("monthly")}
                className={`px-5 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
                  billingInterval === "monthly"
                    ? "bg-[#8B5CF6] text-white shadow-lg shadow-purple-500/25"
                    : "text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                MONTHLY
              </button>
              <button
                type="button"
                onClick={() => setBillingInterval("yearly")}
                className={`px-5 py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-2 ${
                  billingInterval === "yearly"
                    ? "bg-[#8B5CF6] text-white shadow-lg shadow-purple-500/25"
                    : "text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                <span>YEARLY</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-extrabold text-[10px] uppercase border border-amber-400/30">
                  BEST VALUE
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* PRIMARY PRICING CARD CONTAINER */}
        <div className="surface-a rounded-3xl p-8 border-2 border-purple-500/30 shadow-2xl space-y-8 relative overflow-hidden bg-gradient-to-b from-purple-500/5 via-transparent to-transparent">
          {/* TOP PRICE & TRIAL CALLOUT */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[var(--border)] pb-8">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h4 className="text-2xl font-black font-display text-[var(--text)]">Autofy Pro</h4>
                {billingInterval === "yearly" ? (
                  <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-black uppercase tracking-wider">
                    BEST VALUE
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-black uppercase tracking-wider">
                    FLEXIBLE MONTHLY
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-2 pt-1">
                {billingInterval === "yearly" ? (
                  <>
                    <span className="text-4xl sm:text-5xl font-black font-display text-[var(--text)] tracking-tight">₹6,899</span>
                    <span className="text-sm font-semibold text-[var(--text-muted)]">/ year</span>
                  </>
                ) : (
                  <>
                    <span className="text-4xl sm:text-5xl font-black font-display text-[var(--text)] tracking-tight">₹699</span>
                    <span className="text-sm font-semibold text-[var(--text-muted)]">/ month</span>
                  </>
                )}
              </div>

              {billingInterval === "yearly" ? (
                <div className="text-xs font-medium text-emerald-400 flex items-center gap-2 pt-0.5">
                  <span>Save ₹1,499 every year</span>
                  <span>•</span>
                  <span>(~₹575/month equivalent)</span>
                </div>
              ) : (
                <div className="text-xs font-medium text-[var(--text-muted)] pt-0.5">
                  Full access with zero long-term commitment.
                </div>
              )}
            </div>

            {/* TRIAL BADGE DISPLAY */}
            <div className="shrink-0 p-4 rounded-2xl bg-black/40 border border-purple-500/30 space-y-1">
              <div className="flex items-center gap-2 text-amber-300 font-black text-xs uppercase tracking-widest">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>{billingInterval === "yearly" ? "14-DAY FREE TRIAL" : "7-DAY FREE TRIAL"}</span>
              </div>
              <p className="text-[11px] text-[var(--text-subtle)] font-mono">
                Start free today.
              </p>
            </div>
          </div>

          {/* DISCLOSURE BOX BEFORE AUTHORIZATION */}
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-xs space-y-1.5 text-zinc-300 font-mono">
            <div className="font-bold text-white flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-purple-400" />
              Automatic Billing Disclosure
            </div>
            {billingInterval === "yearly" ? (
              <>
                <p>• <strong>Start free today. You won't be charged today.</strong></p>
                <p>• After your 14-day free trial, <strong>₹6,899/year</strong> will automatically renew until cancelled.</p>
              </>
            ) : (
              <>
                <p>• <strong>Start free today. You won't be charged today.</strong></p>
                <p>• After your 7-day free trial, <strong>₹699/month</strong> will automatically renew until cancelled.</p>
              </>
            )}
          </div>

          {/* FEATURE GRID */}
          <div className="space-y-4">
            <h5 className="text-xs font-black uppercase tracking-wider text-[var(--text-subtle)]">
              Everything included in Autofy Pro
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {featuresList.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--border)] text-xs font-medium text-[var(--text)]">
                  <div className="p-1 rounded-full bg-purple-500/20 text-purple-400">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ACTION BUTTONS & DISCLOSURE */}
          <div className="space-y-3 pt-4 border-t border-[var(--border)] text-center">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleStartTrial(billingInterval)}
                className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-95 text-white font-black text-sm transition cursor-pointer shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2"
              >
                <span>
                  {billingInterval === "yearly" ? "Start 14-Day Free Trial" : "Start 7-Day Free Trial"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleCreateCheckout(billingInterval)}
                className="py-4 px-6 rounded-2xl surface-a hover:bg-[var(--bg-elevated)] border border-purple-500/40 text-purple-300 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4 text-purple-400" />
                <span>Authorize Recurring Mandate</span>
              </button>
            </div>

            <div className="space-y-0.5 pt-1">
              <p className="text-xs font-bold text-[var(--text)]">You won't be charged today.</p>
              <p className="text-[11px] text-[var(--text-subtle)]">
                Cancel anytime before your trial ends to avoid the charge.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
