import React, { useState, useEffect } from "react";
import { Check, Sparkles, ShieldCheck, CreditCard, ArrowRight, Clock, AlertCircle } from "lucide-react";
import { api } from "../lib/api";
import { isAuthenticated } from "../lib/auth";

interface SubscriptionTabProps {
  triggerNotification?: (msg: string) => void;
}

export interface SubscriptionStatusResponse {
  business_id: string;
  status: "EXPLORING" | "TRIAL_PENDING" | "TRIAL_ACTIVE" | "ACTIVE" | "PAST_DUE" | "CANCEL_AT_PERIOD_END" | "CANCELLED" | "EXPIRED";
  plan_id: string;
  plan_name: string;
  provider: string;
  is_live_accessible: boolean;
  is_paid: boolean;
  pricing: {
    currency: string;
    billing_interval: string;
    normal_price: number;
    promo_first_cycle_price: number;
    effective_first_cycle_price: number;
    effective_recurring_price: number;
    promo_first_cycle_locked: boolean;
    promo_first_cycle_used: boolean;
  };
  promo: {
    eligible: boolean;
    expires_at: string;
    remaining_seconds: number;
    started_at: string | null;
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
  const [countdownSecs, setCountdownSecs] = useState<number>(0);
  const [selectedPlanForTrial, setSelectedPlanForTrial] = useState<string | null>(null);

  const fetchStatus = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      if (isAuthenticated()) {
        const res = await api.get<SubscriptionStatusResponse>("/api/v1/subscriptions/status");
        setSubState(res);
        setCountdownSecs(res.promo.remaining_seconds);
      } else {
        // Fallback for unauthenticated local preview
        setSubState({
          business_id: "demo-biz",
          status: "EXPLORING",
          plan_id: "starter",
          plan_name: "Starter Plan",
          provider: "razorpay",
          is_live_accessible: false,
          is_paid: false,
          pricing: {
            currency: "INR",
            billing_interval: "monthly",
            normal_price: 999,
            promo_first_cycle_price: 300,
            effective_first_cycle_price: 300,
            effective_recurring_price: 999,
            promo_first_cycle_locked: false,
            promo_first_cycle_used: false,
          },
          promo: {
            eligible: true,
            expires_at: new Date(Date.now() + 14 * 86400000).toISOString(),
            remaining_seconds: 14 * 86400,
            started_at: new Date().toISOString(),
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
            max_monthly_messages: 1000,
            whatsapp_auto_reply: true,
          },
        });
        setCountdownSecs(14 * 86400);
      }
    } catch (err: any) {
      setErrorMsg("Unable to load subscription parameters from server.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Live countdown timer effect
  useEffect(() => {
    if (countdownSecs <= 0) return;
    const timer = setInterval(() => {
      setCountdownSecs((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          fetchStatus(); // Re-evaluate server state on expiry
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdownSecs]);

  const formatCountdown = (secs: number) => {
    const d = Math.floor(secs / 86400);
    const h = Math.floor((secs % 86400) / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    return `${String(d).padStart(2, "0")}d ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  };

  const handleStartTrial = async (planId: string, planName: string) => {
    try {
      if (isAuthenticated()) {
        const res = await api.post<any>("/api/v1/subscriptions/start-trial", { plan_id: planId });
        setSubState(res.subscription);
        triggerNotification?.(`7-Day Free Trial for ${planName} activated!`);
      } else {
        triggerNotification?.("Please sign in or connect business to activate trial.");
      }
    } catch (err: any) {
      triggerNotification?.("Trial activation error. Please retry.");
    }
  };

  const handleCreateCheckout = async (planId: string, planName: string) => {
    try {
      if (isAuthenticated()) {
        const res = await api.post<any>("/api/v1/subscriptions/create-checkout", { plan_id: planId });
        if (res.razorpay_subscription_id && (window as any).Razorpay) {
          const options = {
            key: res.razorpay_key_id,
            subscription_id: res.razorpay_subscription_id,
            name: "Autofy AI",
            description: `7-Day Free Trial — ${planName}`,
            handler: function (response: any) {
              triggerNotification?.("Recurring mandate successfully authorized! 7-day trial activated.");
              fetchStatus();
            },
            notes: {
              business_id: res.business_id,
              plan_id: planId,
            },
            theme: {
              color: "#8B5CF6",
            },
          };
          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        } else {
          triggerNotification?.(`Razorpay subscription mandate generated: ${res.razorpay_subscription_id}`);
        }
      } else {
        triggerNotification?.("Please sign in to proceed to payment authorization.");
      }
    } catch (err: any) {
      triggerNotification?.("Checkout generation error.");
    }
  };

  const handleCancel = async () => {
    try {
      if (isAuthenticated()) {
        const res = await api.post<any>("/api/v1/subscriptions/cancel");
        setSubState(res.subscription);
        triggerNotification?.("Subscription set to cancel at period end. Your business data remains safe.");
      }
    } catch (err: any) {
      triggerNotification?.("Cancellation request failed.");
    }
  };

  // Static pricing definitions for UI layout
  const plans = [
    {
      id: "starter",
      tag: "Entry Level",
      name: "Starter",
      normalPrice: 999,
      promoPrice: 300,
      desc: "Perfect for solo businesses getting started with WhatsApp automation.",
      features: [
        "Up to 1,000 Messages / mo",
        "Standard AI Response Speed",
        "Basic WhatsApp Integration",
        "Manual Lead Export",
        "Email Support",
      ],
      color: "var(--brand)",
    },
    {
      id: "pro",
      tag: "Growth Tier",
      name: "Pro Business",
      popular: true,
      normalPrice: 2499,
      promoPrice: 1000,
      desc: "Full AI Employee suite with live WhatsApp cloud & appointment booking.",
      features: [
        "Unlimited WhatsApp Messages",
        "24/7 Autonomous AI Employee",
        "Instant Live RAG Sync",
        "Auto Appointment & Booking",
        "UPI & Online Payment Links",
        "VIP Priority Support",
      ],
      color: "var(--brand-pink)",
    },
    {
      id: "enterprise",
      tag: "Scale Tier",
      name: "Enterprise",
      normalPrice: 4999,
      promoPrice: 2000,
      desc: "Custom fine-tuned AI model with dedicated support & multi-branch sync.",
      features: [
        "Everything in Pro +",
        "Custom Fine-tuned LLM Model",
        "Multi-Number WhatsApp Sync",
        "Dedicated Account Manager",
        "99.9% Uptime Guarantee SLA",
      ],
      color: "var(--accent-blue)",
    },
  ];

  const getFirstChargeDate = () => {
    if (subState?.trial.ends_at) {
      return new Date(subState.trial.ends_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    }
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div id="subscription-plans-module" className="space-y-8 font-sans text-left">
      {/* SECTION HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight flex items-center gap-2" style={{ color: "var(--text)" }}>
            <CreditCard className="w-6 h-6 text-[#8B5CF6]" />
            Subscription & Plans
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Manage your active Autofy subscription, 7-day free trial, and 15-day promotional offer entitlements.
          </p>
        </div>

        <div className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
          <span className="text-xs font-black text-[#8B5CF6] uppercase tracking-wider">
            Status: {subState?.status.replace(/_/g, " ") || "EXPLORING"}
          </span>
        </div>
      </div>

      {/* 15-DAY PROMOTIONAL COUNTDOWN BANNER */}
      {subState?.promo.eligible && countdownSecs > 0 && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-purple-900/30 via-pink-900/30 to-amber-900/30 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/20 rounded-2xl text-purple-400">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-black text-[9px] uppercase tracking-widest border border-amber-500/30">
                  LIMITED-TIME OFFER
                </span>
                <span className="text-xs font-bold text-[var(--text)]">15-Day Account Promotional Window</span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Lock your first-cycle discount by starting a 7-day free trial before timer expires!
              </p>
            </div>
          </div>

          <div className="shrink-0 font-mono text-sm font-black px-4 py-2 bg-black/40 rounded-2xl border border-purple-500/30 text-amber-300">
            Offer ends in: {formatCountdown(countdownSecs)}
          </div>
        </div>
      )}

      {/* CURRENT ACTIVE PLAN HERO CARD */}
      <div className="surface-a p-6 sm:p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-xs font-black text-green-500">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>
              {subState?.status === "TRIAL_ACTIVE"
                ? `PRO TRIAL — ${subState.trial.days_remaining} DAYS REMAINING`
                : subState?.status === "ACTIVE"
                ? "ACTIVE SUBSCRIPTION"
                : subState?.status === "CANCEL_AT_PERIOD_END"
                ? "CANCELLED (ACTIVE UNTIL PERIOD END)"
                : "FREE EXPLORATION MODE"}
            </span>
          </div>
          <h3 className="text-2xl font-black font-display" style={{ color: "var(--text)" }}>
            {subState?.plan_name || "Starter Plan"} —{" "}
            {subState?.promo.eligible ? (
              <>
                <span className="line-through text-zinc-500 text-lg mr-1.5">₹{subState?.pricing.normal_price}</span>
                <span className="text-amber-400 font-black">₹{subState?.pricing.effective_first_cycle_price} FIRST MONTH</span>
              </>
            ) : (
              <span>₹{subState?.pricing.normal_price} / month</span>
            )}
          </h3>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Your business is running on Autofy's high-capacity AI engine with WhatsApp Cloud API automation, live RAG knowledge indexing, and payment collection.
          </p>
          <div className="flex flex-wrap gap-4 text-xs font-semibold text-[var(--text-subtle)] pt-1">
            <span>Billing Cycle: <strong className="text-[var(--text)]">Monthly</strong></span>
            <span>•</span>
            <span>Next Billing Date: <strong className="text-[var(--text)]">{getFirstChargeDate()}</strong></span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
          {subState?.is_paid && !subState?.period.cancel_at_period_end && (
            <button
              onClick={handleCancel}
              className="px-4 py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-xs font-bold text-red-400 transition cursor-pointer"
            >
              Cancel Subscription
            </button>
          )}
          <button
            onClick={() => handleStartTrial("pro", "Pro Business Plan")}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-black hover:opacity-90 transition cursor-pointer shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
          >
            <span>Start 7-Day Free Trial</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PLANS COMPARISON GRID */}
      <div className="space-y-4">
        <h3 className="text-sm font-black uppercase tracking-wider text-[var(--text-subtle)] font-display">
          Available Subscription Tier Plans
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => {
            const isCurrent = subState?.plan_id === p.id;
            const isPromoActive = subState?.promo.eligible || subState?.pricing.promo_first_cycle_locked;
            const firstCyclePrice = isPromoActive ? p.promoPrice : p.normalPrice;

            return (
              <div
                key={p.id}
                className={`surface-a rounded-3xl p-6 flex flex-col justify-between space-y-6 relative transition-all ${
                  p.popular ? "border-2 border-purple-500/40 shadow-xl bg-gradient-to-b from-purple-500/5 to-transparent" : ""
                } ${isCurrent ? "ring-2 ring-purple-500" : ""}`}
              >
                {p.popular && (
                  <div className="absolute -top-3 right-6 px-3 py-0.5 bg-gradient-to-r from-purple-600 to-pink-600 text-[9px] font-black uppercase text-white rounded-full tracking-wider shadow">
                    Most Popular
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-500">{p.tag}</span>
                    <h4 className="text-xl font-black font-display text-[var(--text)] mt-0.5">{p.name}</h4>
                    <p className="text-xs text-[var(--text-muted)] mt-1">{p.desc}</p>
                  </div>

                  {/* PRICING DISPLAY WITH PROMO FIRST MONTH */}
                  <div className="space-y-1">
                    {isPromoActive ? (
                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs line-through text-zinc-500 font-bold">₹{p.normalPrice}</span>
                          <span className="text-2xl font-black font-display text-amber-400">
                            ₹{p.promoPrice} <span className="text-xs font-bold text-amber-300">FIRST MONTH</span>
                          </span>
                        </div>
                        <span className="text-[11px] font-extrabold text-emerald-400 mt-1">
                          7 DAYS FREE • Then ₹{p.normalPrice}/month from second cycle
                        </span>
                      </div>
                    ) : (
                      <div className="text-2xl font-black font-display text-[var(--text)]">
                        ₹{p.normalPrice} <span className="text-xs font-normal text-[var(--text-muted)]">/ mo</span>
                      </div>
                    )}
                  </div>

                  {/* CLEAR RECURRING DISCLOSURES */}
                  <div className="p-3 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-[10.5px] space-y-1 text-zinc-400 font-mono">
                    <p>• <strong>₹0 charged today</strong> (7-Day Free Trial)</p>
                    <p>• <strong>₹{firstCyclePrice}</strong> charged on {getFirstChargeDate()} (1st billing cycle)</p>
                    <p>• <strong>₹{p.normalPrice}/mo</strong> starting from second billing cycle onward</p>
                    <p>• Cancel anytime before trial ends with zero fee</p>
                  </div>

                  <div className="space-y-2.5 pt-2 border-t border-[var(--border)]">
                    {p.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                        <Check className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => handleStartTrial(p.id, p.name)}
                    className={`w-full py-3 rounded-2xl text-xs font-black transition cursor-pointer ${
                      isCurrent && subState?.status === "TRIAL_ACTIVE"
                        ? "bg-purple-500/10 text-purple-400 border border-purple-500/30 cursor-default"
                        : p.popular
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 shadow-md"
                        : "bg-[var(--input-bg)] hover:bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text)]"
                    }`}
                  >
                    {isCurrent && subState?.status === "TRIAL_ACTIVE"
                      ? "Current Active Trial"
                      : "Start 7-Day Free Trial"}
                  </button>
                  <button
                    onClick={() => handleCreateCheckout(p.id, p.name)}
                    className="w-full py-2 rounded-xl text-[11px] font-bold text-zinc-400 hover:text-white transition cursor-pointer text-center"
                  >
                    Authorize Payment via Razorpay
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
