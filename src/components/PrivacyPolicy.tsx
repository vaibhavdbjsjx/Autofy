import React from "react";
import { Shield, ArrowLeft, Lock, FileText, Server, Trash2, Eye } from "lucide-react";
import { Link } from "react-router-dom";

export const PrivacyPolicy: React.FC = () => {
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
          <Shield className="w-3.5 h-3.5" />
          <span>AUTOFY PRIVACY FOUNDATION</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black font-display tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
          This Privacy Policy describes how Autofy ("we", "us", or "our") collects, uses, processes, and protects your business and customer information when you access or use our AI WhatsApp Business Concierge SaaS platform.
        </p>
      </div>

      {/* PLACEHOLDER LEGAL DISCLAIMER ALERT */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs leading-relaxed space-y-1">
        <p className="font-black uppercase tracking-wider text-[10px]">Unresolved Legal Entity Notice</p>
        <p>
          Specific corporate details in this policy are represented by configuration placeholders (e.g. <strong>[COMPANY LEGAL NAME]</strong>, <strong>[OFFICIAL SUPPORT EMAIL]</strong>). Final legal entity registration will be updated prior to commercial deployment.
        </p>
      </div>

      <div className="space-y-6 text-xs text-[var(--text-muted)] leading-relaxed border-t border-[var(--border)] pt-6">
        <section className="space-y-2">
          <h2 className="text-base font-black text-[var(--text)] font-display flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#8B5CF6]" /> 1. Data Categories We Collect
          </h2>
          <p>We collect and process the following categories of information to operate our SaaS services:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Account & Profile Information:</strong> Name, business name, corporate email address, contact phone number, and hashed authentication credentials.</li>
            <li><strong>Business & Knowledge Data:</strong> Business FAQs, service catalogs, price sheets, custom AI prompt configurations, and knowledge base documents uploaded to train your AI agent.</li>
            <li><strong>Customer & Lead Data:</strong> Customer names, phone numbers, lead statuses, notes, and CRM records imported or generated via WhatsApp interactions.</li>
            <li><strong>WhatsApp Communication Content:</strong> Inbound customer text messages and outbound AI/Agent responses processed through the Meta WhatsApp Cloud API.</li>
            <li><strong>Financial & Payment Transaction Data:</strong> Payment transaction amounts, currency, Razorpay order/subscription IDs, and billing status logs. (Full payment card numbers or UPI PINs are processed directly by PCI-DSS compliant providers and are never stored on Autofy servers).</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-black text-[var(--text)] font-display flex items-center gap-2">
            <Server className="w-4 h-4 text-[#8B5CF6]" /> 2. How We Use Your Data & AI Processing
          </h2>
          <p>Your data is used strictly for the operational purposes of delivering AI concierge automation:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Generating automated, context-aware AI answers to inbound customer queries on WhatsApp.</li>
            <li>Syncing live RAG knowledge indexing from your uploaded business documents.</li>
            <li>Managing CRM customer profiles, lead pipelines, and appointment scheduling.</li>
            <li>Processing subscription plans, invoices, and payment link receipts.</li>
          </ul>
          <p className="pt-1 font-semibold text-[var(--text)]">
            AI Training Notice: We do NOT use your proprietary customer WhatsApp conversations to train public LLM models.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-black text-[var(--text)] font-display flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#8B5CF6]" /> 3. Third-Party Data Processors
          </h2>
          <p>We share data with verified third-party infrastructure providers to deliver our platform services:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Meta WhatsApp Cloud API:</strong> Processes WhatsApp message delivery and webhook payloads.</li>
            <li><strong>Razorpay Software Private Limited:</strong> Handles billing mandates, checkout initialization, and payment callbacks.</li>
            <li><strong>Google Gemini API:</strong> Processes prompt context to generate autonomous customer responses.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-black text-[var(--text)] font-display flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-[#8B5CF6]" /> 4. Data Retention & Account Deletion
          </h2>
          <p>
            You retain complete control over your business data. You may initiate account deletion at any time via 
            <strong> Settings &gt; Account &gt; Danger Zone &gt; Delete Account</strong>, or via our public portal at 
            <Link to="/account-deletion" className="text-[var(--brand)] underline ml-1">/account-deletion</Link>.
          </p>
          <p>
            Upon account deletion, all operational data (conversations, leads, knowledge documents, AI logs, team profiles) is <strong>permanently destroyed</strong>. Legally required payment transaction records (amounts, tax totals, transaction IDs) are retained in anonymized form for accounting and tax audit compliance.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-black text-[var(--text)] font-display flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#8B5CF6]" /> 5. Contact Us
          </h2>
          <p>
            For questions or privacy requests, contact our Data Protection Officer at:
            <br />
            <strong>[OFFICIAL SUPPORT EMAIL]</strong> (e.g. privacy@autofy.ai)
            <br />
            <strong>[COMPANY LEGAL ENTITY NAME]</strong>
          </p>
        </section>
      </div>
    </div>
  );
};
