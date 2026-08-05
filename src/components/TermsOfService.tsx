import React from "react";
import { FileText, ArrowLeft, AlertTriangle, ShieldCheck, Scale } from "lucide-react";
import { Link } from "react-router-dom";

export const TermsOfService: React.FC = () => {
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
          <Scale className="w-3.5 h-3.5" />
          <span>TERMS OF SERVICE</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black font-display tracking-tight">Terms of Service</h1>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
          These Terms of Service ("Terms") govern your access to and use of the Autofy AI SaaS platform, application services, APIs, and website.
        </p>
      </div>

      {/* PLACEHOLDER ALERT */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs leading-relaxed space-y-1">
        <p className="font-black uppercase tracking-wider text-[10px]">Unresolved Legal Entity Notice</p>
        <p>
          Governing jurisdiction and legal entity parameters are marked with configuration placeholders (<strong>[GOVERNING JURISDICTION]</strong>, <strong>[LEGAL ENTITY]</strong>).
        </p>
      </div>

      <div className="space-y-6 text-xs text-[var(--text-muted)] leading-relaxed border-t border-[var(--border)] pt-6">
        <section className="space-y-2">
          <h2 className="text-base font-black text-[var(--text)] font-display">1. Service Description</h2>
          <p>
            Autofy provides an AI-powered WhatsApp Business Concierge SaaS application enabling automated customer conversations, RAG document knowledge indexing, lead pipeline management, and online payment collection links.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-black text-[var(--text)] font-display">2. Account Responsibilities & Acceptable Use</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials. You agree NOT to use Autofy to transmit spam, fraudulent schemes, illegal content, or unsolicited commercial messages in violation of Meta WhatsApp Business Policies.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-black text-[var(--text)] font-display flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" /> 3. AI-Generated Responses Disclosure
          </h2>
          <p>
            Autofy utilizes generative artificial intelligence (LLM) models to produce customer responses based on your configured knowledge base. While we implement confidence threshold safeguards, AI responses are provided on an "as-is" basis. You are responsible for auditing your knowledge base accuracy.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-black text-[var(--text)] font-display">4. Subscriptions, Trials & Cancellations</h2>
          <p>
            Paid plans include a 7-day free trial. If you cancel during the trial, zero subscription fee is charged. Subscriptions auto-renew monthly unless cancelled prior to the renewal date via your Account Settings.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-black text-[var(--text)] font-display">5. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, Autofy shall not be liable for any indirect, incidental, or consequential damages resulting from service interruptions, WhatsApp Cloud API downtime, or third-party payment gateway failures.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-black text-[var(--text)] font-display">6. Contact & Legal Entity</h2>
          <p>
            For legal notices or questions regarding these Terms, contact:
            <br />
            <strong>[COMPANY LEGAL ENTITY NAME]</strong>
            <br />
            <strong>[OFFICIAL LEGAL EMAIL]</strong>
            <br />
            <strong>[GOVERNING JURISDICTION]</strong> (e.g. New Delhi, India)
          </p>
        </section>
      </div>
    </div>
  );
};
