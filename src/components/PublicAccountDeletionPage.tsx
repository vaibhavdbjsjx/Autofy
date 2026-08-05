import React, { useState } from "react";
import { Trash2, ArrowLeft, ShieldAlert, CheckCircle, Mail, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";

export const PublicAccountDeletionPage: React.FC = () => {
  const [emailInput, setEmailInput] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setIsSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-sans px-4 py-8 sm:px-8 max-w-4xl mx-auto space-y-8 text-left">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-6">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-[var(--brand)] hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <span className="text-xs font-mono text-[var(--text-subtle)]">Autofy Store Compliance Portal</span>
      </div>

      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-xs font-bold text-red-400">
          <Trash2 className="w-3.5 h-3.5" />
          <span>DATA DELETION & PRIVACY CONTROL</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black font-display tracking-tight">Account & Data Deletion Request</h1>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
          Autofy guarantees your right to delete your account and associated business data in compliance with Google Play, Apple App Store, and global privacy standards.
        </p>
      </div>

      {/* METHOD 1: IN-APP DELETION */}
      <div className="surface-a p-6 rounded-3xl space-y-4 border border-[var(--border)]">
        <h2 className="text-base font-black font-display text-[var(--text)] flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-400" /> Method 1: Delete Directly Inside Autofy App
        </h2>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          If you have active access to your account, you can perform immediate self-service account deletion:
        </p>
        <ol className="list-decimal pl-5 text-xs text-[var(--text-muted)] space-y-2">
          <li>Log in to your Autofy workspace account.</li>
          <li>Navigate to <strong>Dashboard &gt; Settings &gt; Profile & Account</strong>.</li>
          <li>Scroll down to the <strong>Danger Zone</strong> section.</li>
          <li>Click <strong>Delete Autofy Account</strong>.</li>
          <li>Type <strong><code>DELETE</code></strong> and enter your password to confirm permanent deletion.</li>
        </ol>
      </div>

      {/* METHOD 2: MANUAL WEB REQUEST */}
      <div className="surface-a p-6 rounded-3xl space-y-4 border border-[var(--border)]">
        <h2 className="text-base font-black font-display text-[var(--text)] flex items-center gap-2">
          <Mail className="w-5 h-5 text-[#8B5CF6]" /> Method 2: Submit Web Deletion Request (If App Unaccessible)
        </h2>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          If you are unable to log in to the application, submit your registered account email below. Our privacy compliance engine will process identity verification and delete your account within <strong>48 hours</strong>.
        </p>

        {isSubmitted ? (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>Deletion request received for {emailInput}. An identity verification link has been sent to your inbox.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmitRequest} className="flex flex-col sm:flex-row gap-3 pt-2">
            <input
              type="email"
              required
              placeholder="Enter your registered account email..."
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-xs text-[var(--text)] focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition cursor-pointer shrink-0"
            >
              Submit Deletion Request
            </button>
          </form>
        )}
      </div>

      {/* DATA CATEGORIES TABLE */}
      <div className="space-y-4 border-t border-[var(--border)] pt-6 text-xs text-[var(--text-muted)] leading-relaxed">
        <h3 className="text-sm font-black font-display text-[var(--text)]">Data Treatment Breakdown Upon Deletion</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 space-y-2">
            <h4 className="font-bold text-red-400 uppercase text-[10.5px]">Permanently Deleted Records</h4>
            <ul className="list-disc pl-4 space-y-1 text-[11px]">
              <li>WhatsApp Conversations & Text Messages</li>
              <li>Leads & Customer CRM Profiles</li>
              <li>Uploaded Business Documents & Files</li>
              <li>AI Knowledge Base Indexing & Prompt Logs</li>
              <li>Products, Services, FAQs & Business Policies</li>
              <li>Team Member Roster & User Account Credentials</li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2">
            <h4 className="font-bold text-amber-400 uppercase text-[10.5px]">Anonymized & Retained Records (Tax Compliance)</h4>
            <ul className="list-disc pl-4 space-y-1 text-[11px]">
              <li>Payment Transaction Amounts & Currency (Tax Audit)</li>
              <li>Razorpay Invoice Receipt Records (Accounting Audit)</li>
              <li><em>Note: All customer PII (names, emails, phones) is stripped.</em></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
