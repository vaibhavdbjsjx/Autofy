import React from "react";
import { CreditCard, ArrowLeft, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

export const RefundPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-sans px-4 py-8 sm:px-8 max-w-4xl mx-auto space-y-8 text-left">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-6">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-[var(--brand)] hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <span className="text-xs font-mono text-[var(--text-subtle)]">Last Updated: August 2026</span>
      </div>

      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-xs font-bold text-[#8B5CF6]">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>CANCELLATION & REFUND POLICY</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black font-display tracking-tight">Cancellation & Refund Policy</h1>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
          This policy details how subscription cancellations, 7-day trials, and billing refunds are handled on the Autofy SaaS platform.
        </p>
      </div>

      {/* PLACEHOLDER ALERT */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs leading-relaxed space-y-1">
        <p className="font-black uppercase tracking-wider text-[10px]">Business Decision Placeholder Notice</p>
        <p>
          Final refund approval SLAs and partial refund window policies are subject to business decision configuration (<strong>[REFUND SLA DAYS]</strong>).
        </p>
      </div>

      <div className="space-y-6 text-xs text-[var(--text-muted)] leading-relaxed border-t border-[var(--border)] pt-6">
        <section className="space-y-2">
          <h2 className="text-base font-black text-[var(--text)] font-display">1. 7-Day Free Trial Cancellation</h2>
          <p>
            All paid subscription plans include a 7-day free trial. You may cancel your trial at any time during the 7 days with <strong>zero charge</strong>. Your account will not be billed if cancelled prior to the trial expiration date.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-black text-[var(--text)] font-display">2. Subscription Cancellation Policy</h2>
          <p>
            You may cancel your monthly subscription at any time via <strong>Settings &gt; Subscription & Plans</strong>. When you cancel:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Your recurring mandate will be cancelled at the provider level.</li>
            <li>You will retain paid access to all feature entitlements until the end of your current billing period.</li>
            <li>Your business data, customer profiles, CRM history, and knowledge documents are <strong>never deleted</strong> upon cancellation.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-black text-[var(--text)] font-display">3. Refund Request Policy</h2>
          <p>
            If you experience a billing error or unauthorized duplicate charge, contact support at <strong>[OFFICIAL BILLING EMAIL]</strong> (e.g. billing@autofy.ai) within <strong>[REFUND SLA DAYS]</strong> (e.g. 7 days) of the transaction date. Valid duplicate charge claims will be refunded to the original payment method via Razorpay within 5–7 business days.
          </p>
        </section>
      </div>
    </div>
  );
};
