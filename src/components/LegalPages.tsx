// ════════════════════════════════════════════════════════════
// Autofy — Production Legal Suite
// ------------------------------------------------------------
// Comprehensive Privacy Policy, Terms of Service, Refund Policy,
// and Contact Us pages for AI-powered WhatsApp Business Automation SaaS.
// ════════════════════════════════════════════════════════════
import React, { type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Shield,
  FileText,
  Lock,
  Bot,
  MessageSquare,
  CreditCard,
  Trash2,
  Mail,
  Scale,
  CheckCircle2,
  AlertTriangle,
  ExternalLink
} from "lucide-react";
import { Logo } from "./Logo";

// ─── EDITABLE LEGAL PLACEHOLDERS ──────────────────────────────
// Update these values with your registered business information
export const LEGAL_DETAILS = {
  companyName: "[Your Company Legal Name / Autofy Technologies]",
  brandName: "Autofy",
  registeredAddress: "[Your Registered Business Address, City, State, Postal Code, Country]",
  supportEmail: "[support@yourdomain.com]",
  privacyEmail: "[privacy@yourdomain.com]",
  jurisdiction: "[Your Governing Jurisdiction / City, State, Country]",
  lastUpdated: "15 August 2026",
  effectiveDate: "1 August 2026",
  websiteUrl: "https://autofysaas.com",
};

// ─── Shared Layout Shell ───────────────────────────────────────
function LegalLayout({
  title,
  subtitle,
  badge,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-sans antialiased selection:bg-[var(--brand)] selection:text-white">
      {/* Sticky Header */}
      <header className="glass-nav sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 no-underline group">
            <div className="w-8 h-8 rounded-xl bg-[var(--brand-subtle)] border border-[var(--border)] flex items-center justify-center transition-transform group-hover:scale-105">
              <Logo size={20} />
            </div>
            <span className="text-lg font-black tracking-tight font-display text-[var(--text)]">
              {LEGAL_DETAILS.brandName}
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-[var(--border)] bg-[var(--bg-card)] hover:bg-[var(--bg-elevated)] transition-colors text-[var(--text-muted)] hover:text-[var(--text)] no-underline"
            >
              <ArrowLeft size={14} />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Document Header Banner */}
        <div className="mb-10 pb-8 border-b border-[var(--border)]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[var(--brand-subtle)] text-[var(--brand)] border border-[var(--brand)]/20 mb-4">
            <Icon size={14} />
            <span>{badge}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight text-[var(--text)] mb-3">
            {title}
          </h1>
          <p className="text-sm sm:text-base text-[var(--text-muted)] max-w-2xl leading-relaxed">
            {subtitle}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[var(--text-subtle)] font-medium">
            <span>Last Updated: <strong className="text-[var(--text)]">{LEGAL_DETAILS.lastUpdated}</strong></span>
            <span>•</span>
            <span>Effective Date: <strong className="text-[var(--text)]">{LEGAL_DETAILS.effectiveDate}</strong></span>
          </div>
        </div>

        {/* Content Body */}
        <div className="legal-content text-sm sm:text-base text-[var(--text-muted)] leading-relaxed space-y-8">
          {children}
        </div>

        {/* Bottom Cross-Navigation & Legal Disclaimer Footer */}
        <div className="mt-16 pt-8 border-t border-[var(--border)] space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-semibold">
            <div className="flex flex-wrap gap-4 text-[var(--brand)]">
              <Link to="/privacy-policy" className="hover:underline">Privacy Policy</Link>
              <Link to="/terms-of-service" className="hover:underline">Terms of Service</Link>
              <Link to="/refund" className="hover:underline">Refund Policy</Link>
              <Link to="/account-deletion" className="hover:underline">Account Deletion</Link>
              <Link to="/contact" className="hover:underline">Contact Us</Link>
            </div>
            <p className="text-[var(--text-subtle)]">
              © {new Date().getFullYear()} {LEGAL_DETAILS.companyName}. All rights reserved.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-xs text-[var(--text-subtle)] leading-relaxed">
            <p>
              <strong>Disclaimer:</strong> {LEGAL_DETAILS.brandName} is an independent software automation platform that provides API connectors to the Meta WhatsApp Cloud API and generative AI models. {LEGAL_DETAILS.brandName} is not endorsed, sponsored, or affiliated with Meta Platforms, Inc. or WhatsApp LLC.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Document Section Helpers ─────────────────────────────────
const Section: React.FC<{ id?: string; title: string; children: ReactNode; icon?: React.ComponentType<{ className?: string; size?: number }> }> = ({
  id,
  title,
  children,
  icon: Icon,
}) => (
  <section id={id} className="scroll-mt-24 space-y-3.5">
    <h2 className="text-lg sm:text-xl font-extrabold font-display text-[var(--text)] tracking-tight flex items-center gap-2.5">
      {Icon && <Icon className="text-[var(--brand)] shrink-0" size={20} />}
      <span>{title}</span>
    </h2>
    <div className="space-y-3 text-[var(--text-muted)]">{children}</div>
  </section>
);

const NoticeBox: React.FC<{ type?: "info" | "warning"; title: string; children: ReactNode }> = ({
  type = "info",
  title,
  children,
}) => (
  <div
    className={`p-4 sm:p-5 rounded-2xl border ${
      type === "warning"
        ? "bg-amber-500/5 border-amber-500/20 text-amber-200"
        : "bg-[var(--brand-subtle)] border-[var(--brand)]/20 text-[var(--text)]"
    } text-xs sm:text-sm leading-relaxed`}
  >
    <div className="font-bold flex items-center gap-2 mb-1.5">
      {type === "warning" ? (
        <AlertTriangle size={16} className="text-amber-400 shrink-0" />
      ) : (
        <Shield size={16} className="text-[var(--brand)] shrink-0" />
      )}
      <span>{title}</span>
    </div>
    <div className="text-[var(--text-muted)] space-y-1.5">{children}</div>
  </div>
);

// ══════════════════════════════════════════════════════════════
// 1. PRIVACY POLICY COMPONENT
// ══════════════════════════════════════════════════════════════
export function PrivacyPolicy() {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="How Autofy collects, processes, secures, and handles business and WhatsApp customer data."
      badge="Data Protection & Privacy"
      icon={Shield}
    >
      <NoticeBox title="Platform Nature & Software Role Disclaimer">
        <p>
          <strong>{LEGAL_DETAILS.brandName} is a software platform provider.</strong> When you connect your WhatsApp Business account and utilize our AI concierge features, you (the Business) act as the <em>Data Controller</em> for all customer records and messages. {LEGAL_DETAILS.brandName} acts strictly as a <em>Data Processor</em> handling messages and instructions on your behalf.
        </p>
        <p className="mt-1">
          {LEGAL_DETAILS.brandName} is not responsible for the accuracy, legality, or nature of the messages, products, pricing, or communications transmitted by businesses through our software.
        </p>
      </NoticeBox>

      <Section title="1. Information We Collect" icon={FileText}>
        <p>
          We collect personal and organizational information necessary to deliver, manage, and secure our automated AI concierge platform:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Account & Workspace Information:</strong> Business name, owner/admin name, verified email address, business phone number, operating timezone, and workspace login credentials.
          </li>
          <li>
            <strong>Business Knowledge Base Data:</strong> FAQs, service catalogs, inventory lists, price sheets, store policies, custom prompt instructions, and PDF/document knowledge assets uploaded to train your AI agent.
          </li>
          <li>
            <strong>WhatsApp Business API Credentials:</strong> WhatsApp Business Account ID (WABA ID), Phone Number ID, App Secret, and Meta access tokens provided to bridge communications.
          </li>
          <li>
            <strong>Customer Interaction & Lead Records:</strong> Names, phone numbers, conversation message logs, lead scores, appointment booking details, and payment link statuses exchanged between your customers and your WhatsApp AI assistant.
          </li>
          <li>
            <strong>Billing & Transaction Metadata:</strong> Subscription plan type, billing interval, transaction receipts, and Razorpay payment identifiers. (We do <em>not</em> store raw debit/credit card numbers or CVVs on our servers).
          </li>
          <li>
            <strong>Technical & Diagnostic Data:</strong> IP addresses, browser user-agent, API request logs, latency metrics, error stack traces, and session authentication tokens.
          </li>
        </ul>
      </Section>

      <Section title="2. WhatsApp Business API Data Handling" icon={MessageSquare}>
        <p>
          Our platform integrates directly with Meta Platforms, Inc. via the official <strong>WhatsApp Business Cloud API</strong>:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Webhook Payload Processing:</strong> Inbound messages, delivery receipts (sent, delivered, read), and media files delivered to our secure webhook listeners are parsed in real time to trigger conversational AI responses and CRM synchronization.
          </li>
          <li>
            <strong>Tenant Isolation:</strong> WhatsApp messages are cryptographically partitioned by <code>business_id</code> in our database. No business tenant can access or view messages from another organization.
          </li>
          <li>
            <strong>Zero Advertising Monetization:</strong> We do <em>not</em> sell, rent, or monetize your customers' phone numbers or chat conversations. We do not use customer WhatsApp data to target advertisements.
          </li>
          <li>
            <strong>Meta Policies Compliance:</strong> Processing conforms to Meta's WhatsApp Business Messaging Policy and Cloud API Terms.
          </li>
        </ul>
      </Section>

      <Section title="3. AI Processing & Third-Party AI Services" icon={Bot}>
        <p>
          {LEGAL_DETAILS.brandName} utilizes state-of-the-art cognitive AI models (including Google Gemini AI via Google Cloud Platform) to generate autonomous contextual replies from your business knowledge base:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Context-Bounded Inference:</strong> Only the relevant business knowledge snippets, system instructions, and recent conversation turns are passed to the AI inference engine to synthesize responses.
          </li>
          <li>
            <strong>No Model Training on Private Data:</strong> Your proprietary business knowledge and confidential customer conversations are <strong>not</strong> used to train foundational AI models for public use.
          </li>
          <li>
            <strong>Automated Safety & Filtering:</strong> Inference pipelines include real-time toxicity and prompt-injection filtering to safeguard interactions.
          </li>
        </ul>
      </Section>

      <Section title="4. Account, Workspace & Team Data" icon={Lock}>
        <p>
          {LEGAL_DETAILS.brandName} supports multi-tenant corporate workspaces with Role-Based Access Control (RBAC):
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Team members assigned roles (Owner, Admin, Manager, Agent) only have access to modules permitted by their administrative privileges.</li>
          <li>Session authentication tokens are signed with cryptographically secure HMAC SHA-256 JWTs with bounded validity periods.</li>
        </ul>
      </Section>

      <Section title="5. Payment & Billing Information" icon={CreditCard}>
        <p>
          All subscription billing and payment link collections are processed through authorized payment gateways (e.g. <strong>Razorpay</strong>):
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Payment transactions comply with PCI-DSS standards maintained by our payment processors.</li>
          <li>We retain only payment reference tokens, subscription IDs, billing timestamps, and invoice metadata for tax and accounting compliance.</li>
        </ul>
      </Section>

      <Section title="6. Cookies, Local Storage & Session Analytics" icon={FileText}>
        <p>
          We use browser local storage and essential session cookies solely to:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Maintain your secure authenticated login session across page refreshes.</li>
          <li>Remember workspace preferences (e.g. dark mode UI preferences, active filters).</li>
          <li>Measure platform performance and uptime health without invasive cross-site tracking.</li>
        </ul>
      </Section>

      <Section title="7. Data Security Measures" icon={Shield}>
        <p>
          We apply robust administrative, technical, and physical safeguards to protect your business data:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Encryption in Transit:</strong> All web and API traffic is enforced over HTTPS with TLS 1.3 encryption.</li>
          <li><strong>Encryption at Rest:</strong> Database volumes and knowledge base files are encrypted at rest using industry-standard AES-256.</li>
          <li><strong>Webhook Signature Verification:</strong> Inbound Meta webhooks are verified against SHA-256 HMAC signatures (<code>X-Hub-Signature-256</code>) to prevent spoofing or unauthorized payload injection.</li>
        </ul>
      </Section>

      <Section title="8. Data Retention Policy" icon={CheckCircle2}>
        <p>
          We retain your account, workspace knowledge, and conversation history for as long as your workspace account remains active. Upon subscription cancellation or inactivity, data is retained for a grace period of 90 days for recovery purposes, after which it is queued for permanent cryptographic erasure unless required by law for accounting or fraud prevention.
        </p>
      </Section>

      <Section title="9. Your Rights & Privacy Choices" icon={Scale}>
        <p>Depending on your jurisdiction (including GDPR, CCPA, and India Digital Personal Data Protection Act), you have the right to:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Request access to the personal data we hold about your organization.</li>
          <li>Request corrections of inaccurate business profile information.</li>
          <li>Request export of your customer leads and knowledge base assets.</li>
          <li>Withdraw consent for optional communications.</li>
        </ul>
      </Section>

      <Section title="10. Account Deletion & Data Purge" icon={Trash2}>
        <p>
          You have the absolute right to delete your account and completely purge all associated business data at any time.
        </p>
        <p>
          To delete your account immediately, visit our self-service deletion portal at{" "}
          <Link to="/account-deletion" className="text-[var(--brand)] font-bold underline inline-flex items-center gap-1">
            <span>autofysaas.com/account-deletion</span>
            <ExternalLink size={13} />
          </Link>{" "}
          or email <a href={`mailto:${LEGAL_DETAILS.privacyEmail}`} className="text-[var(--brand)] font-semibold">{LEGAL_DETAILS.privacyEmail}</a>. All database records, chat logs, and uploaded files will be permanently purged within <strong>48 hours</strong>.
        </p>
      </Section>

      <Section title="11. Contact Information & Data Protection Officer" icon={Mail}>
        <p>
          For privacy inquiries, compliance verification, or Data Protection requests, please contact our team:
        </p>
        <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] space-y-1.5 text-xs sm:text-sm">
          <p><strong>Legal Entity:</strong> {LEGAL_DETAILS.companyName}</p>
          <p><strong>Support Email:</strong> <a href={`mailto:${LEGAL_DETAILS.supportEmail}`} className="text-[var(--brand)] font-semibold">{LEGAL_DETAILS.supportEmail}</a></p>
          <p><strong>Privacy Inquiries:</strong> <a href={`mailto:${LEGAL_DETAILS.privacyEmail}`} className="text-[var(--brand)] font-semibold">{LEGAL_DETAILS.privacyEmail}</a></p>
          <p><strong>Registered Address:</strong> {LEGAL_DETAILS.registeredAddress}</p>
        </div>
      </Section>
    </LegalLayout>
  );
}

// ══════════════════════════════════════════════════════════════
// 2. TERMS OF SERVICE COMPONENT
// ══════════════════════════════════════════════════════════════
export function TermsOfService() {
  return (
    <LegalLayout
      title="Terms of Service"
      subtitle="The binding legal agreement governing your access to and use of the Autofy SaaS platform."
      badge="Terms & Conditions"
      icon={Scale}
    >
      <NoticeBox type="warning" title="Important Notice Regarding WhatsApp Compliance & AI Automation">
        <p>
          By creating an account, connecting a WhatsApp Business Account, or subscribing to {LEGAL_DETAILS.brandName}, you agree that {LEGAL_DETAILS.brandName} is a software automation utility. You are solely responsible for ensuring your business practices, messaging frequency, and conversational content comply with Meta's WhatsApp Policies and local consumer protection regulations.
        </p>
      </NoticeBox>

      <Section title="1. Acceptance of Terms & Eligibility" icon={CheckCircle2}>
        <p>
          These Terms of Service ("Terms") constitute a legally binding agreement between <strong>{LEGAL_DETAILS.companyName}</strong> ("{LEGAL_DETAILS.brandName}", "we", "us", or "our") and the legal entity or individual ("Customer", "you", or "your") accessing or using our website, APIs, and AI concierge automation software (the "Service").
        </p>
        <p>
          You represent that you are at least 18 years of age and possess full legal authority to bind your organization to these Terms. If you do not agree to these Terms, you must not use or access the Service.
        </p>
      </Section>

      <Section title="2. Platform Role & Nature of Service" icon={FileText}>
        <p>
          {LEGAL_DETAILS.brandName} provides multi-tenant software tools enabling businesses to connect their official WhatsApp Business Cloud API accounts, configure automated knowledge bases, manage customer leads, generate payment links, and deploy AI-driven conversational assistants.
        </p>
        <p>
          <strong>{LEGAL_DETAILS.brandName} is a software tool, not a messaging sender.</strong> We do not author, endorse, verify, or control the specific messages, marketing offers, goods, or services your business offers. The business owner retains full legal custody and publisher responsibility for all outbound communications transmitted through their connected WhatsApp phone numbers.
        </p>
      </Section>

      <Section title="3. WhatsApp API & Meta Policy Compliance" icon={MessageSquare}>
        <p>As a condition of using our WhatsApp automation capabilities, you agree to strictly comply with:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Meta WhatsApp Business Messaging Policy:</strong> You must obtain explicit opt-in consent from your customers prior to sending proactive outbound or marketing template messages.</li>
          <li><strong>Meta WhatsApp Commerce Policy:</strong> You must not use our software to promote prohibited products or services (including unlicensed pharmaceuticals, illegal substances, weapons, adult content, counterfeit goods, or deceptive financial schemes).</li>
          <li><strong>Opt-Out Honoring:</strong> You must promptly honor all customer requests to unsubscribe or stop receiving messages (e.g. keywords like "STOP", "UNSUBSCRIBE").</li>
        </ul>
      </Section>

      <Section title="4. Acceptable Use Policy & Prohibited Conduct" icon={AlertTriangle}>
        <p>You agree not to misuse the Service or facilitate any of the following prohibited activities:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Sending unsolicited bulk spam or deceptive phishing messages.</li>
          <li>Attempting to probe, scan, reverse-engineer, decompile, or compromise the vulnerability of our software or infrastructure.</li>
          <li>Using automated scrapers or bots to harvest data from our platform without authorization.</li>
          <li>Impersonating another business, individual, or government authority.</li>
          <li>Transmitting malicious code, viruses, or prompt-injection exploits designed to hijack AI model behavior.</li>
        </ul>
      </Section>

      <Section title="5. AI-Generated Response Limitations & Disclaimers" icon={Bot}>
        <p>
          {LEGAL_DETAILS.brandName} utilizes probabilistic generative artificial intelligence models to assist with customer replies based on your uploaded knowledge base. You acknowledge and agree to the following AI limitations:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Probabilistic Nature:</strong> AI models generate responses based on statistical patterns. While highly accurate when supplied with clear knowledge bases, AI outputs may occasionally contain inaccuracies, incomplete answers, or misunderstandings ("hallucinations").</li>
          <li><strong>Customer Review Responsibility:</strong> You are responsible for inspecting your knowledge base documents, FAQs, and prompt guardrails. {LEGAL_DETAILS.brandName} is not liable for discounts, claims, or errors made in automated AI chats.</li>
          <li><strong>Human Escalation:</strong> Our software provides manual takeover and human escalation switches. You are advised to maintain human representative oversight for critical inquiries, high-value transactions, or customer disputes.</li>
        </ul>
      </Section>

      <Section title="6. Subscriptions, Payments & Billing Terms" icon={CreditCard}>
        <p>
          Access to live WhatsApp automation and Pro features requires an active paid subscription or authorized trial:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Billing Intervals:</strong> Subscriptions are offered on monthly and annual billing cycles, billed in advance.</li>
          <li><strong>Recurring Mandates:</strong> Paid plans auto-renew automatically at the end of each billing cycle unless cancelled prior to the renewal date through your dashboard settings.</li>
          <li><strong>Payment Processing:</strong> Payments are processed via authorized payment partners (e.g. Razorpay). By providing payment details, you authorize recurring debits for the agreed subscription fees.</li>
          <li><strong>Taxes:</strong> Fees are exclusive of applicable taxes (e.g. GST), which will be added at checkout where required by law.</li>
        </ul>
      </Section>

      <Section title="7. Service Availability & Uptime Disclaimer" icon={Shield}>
        <p>
          We strive to maintain 99.9% platform availability. However, you acknowledge that the Service depends on third-party telecommunications networks and external cloud infrastructure beyond our direct control, including:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Meta Platforms, Inc. (WhatsApp Cloud API availability and webhook delivery latencies).</li>
          <li>Google Cloud Platform (AI model inference availability).</li>
          <li>Razorpay (payment gateway processing networks).</li>
        </ul>
        <p>
          We do not guarantee uninterrupted or error-free operation. We reserve the right to perform scheduled maintenance with reasonable notice.
        </p>
      </Section>

      <Section title="8. Intellectual Property Rights" icon={Lock}>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Autofy IP:</strong> {LEGAL_DETAILS.companyName} retains all right, title, and interest in and to the platform software, algorithms, interfaces, trademarks, and documentation.</li>
          <li><strong>Customer Data Ownership:</strong> You retain 100% ownership of all business content, knowledge base files, logos, and customer data uploaded to the Service. You grant us a limited, non-exclusive license solely to host, process, and transmit this data to provide the Service to you.</li>
        </ul>
      </Section>

      <Section title="9. Account Suspension & Termination" icon={Trash2}>
        <p>
          We reserve the right to suspend or terminate your account immediately without prior notice if:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>You materially breach these Terms or Meta's WhatsApp Business Messaging Policies.</li>
          <li>Your WhatsApp account is flagged or banned by Meta for spam or abusive conduct.</li>
          <li>Subscription payments fail or remain unpaid following grace notifications.</li>
        </ul>
        <p>You may cancel your subscription and terminate your account at any time from your dashboard settings.</p>
      </Section>

      <Section title="10. Limitation of Liability & Indemnification" icon={Scale}>
        <p>
          To the maximum extent permitted by applicable law, in no event shall {LEGAL_DETAILS.companyName}, its directors, employees, or partners be liable for any indirect, incidental, special, consequential, or punitive damages (including loss of profits, loss of customer goodwill, business interruption, or data loss) arising out of your use of or inability to use the Service.
        </p>
        <p>
          Our total cumulative aggregate liability for all claims related to the Service shall be limited to the total subscription fees actually paid by you to {LEGAL_DETAILS.brandName} in the twelve (12) months preceding the incident.
        </p>
        <p>
          You agree to defend, indemnify, and hold harmless {LEGAL_DETAILS.companyName} from any third-party claims, fines (including Meta enforcement penalties), or damages resulting from the content you send or your violation of applicable laws.
        </p>
      </Section>

      <Section title="11. Governing Law & Dispute Resolution" icon={FileText}>
        <p>
          These Terms shall be governed by and construed in accordance with the laws of <strong>{LEGAL_DETAILS.jurisdiction}</strong>, without regard to conflict of law principles. Any dispute arising out of or relating to these Terms shall be subject to the exclusive jurisdiction of the competent courts located in {LEGAL_DETAILS.jurisdiction}.
        </p>
      </Section>

      <Section title="12. Changes to Terms & Contact" icon={Mail}>
        <p>
          We may modify these Terms from time to time. When changes are made, we will update the "Last Updated" date at the top of this page. Continued use of the platform after changes take effect constitutes your binding acceptance.
        </p>
        <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] space-y-1.5 text-xs sm:text-sm mt-3">
          <p><strong>Legal Entity:</strong> {LEGAL_DETAILS.companyName}</p>
          <p><strong>Support Email:</strong> <a href={`mailto:${LEGAL_DETAILS.supportEmail}`} className="text-[var(--brand)] font-semibold">{LEGAL_DETAILS.supportEmail}</a></p>
          <p><strong>Registered Address:</strong> {LEGAL_DETAILS.registeredAddress}</p>
        </div>
      </Section>
    </LegalLayout>
  );
}

// ══════════════════════════════════════════════════════════════
// 3. REFUND POLICY COMPONENT
// ══════════════════════════════════════════════════════════════
export function RefundPolicy() {
  return (
    <LegalLayout
      title="Refund & Cancellation Policy"
      subtitle="Clear, transparent terms regarding subscriptions, cancellations, and billing disputes."
      badge="Billing & Refunds"
      icon={CreditCard}
    >
      <Section title="1. Subscription Cancellations" icon={CheckCircle2}>
        <p>
          You can cancel your {LEGAL_DETAILS.brandName} subscription at any time directly through your dashboard under <strong>Settings → Billing</strong>.
        </p>
        <p>
          Upon cancellation, your Pro plan will remain fully accessible until the conclusion of your current paid billing cycle. You will not be charged any subsequent renewal fees after cancellation.
        </p>
      </Section>

      <Section title="2. Refund Eligibility & 7-Day Billing Guarantee" icon={CreditCard}>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Billing Errors:</strong> If you experience duplicate charges or an unexpected billing error, contact our support team within <strong>7 days</strong> of the transaction. We will investigate and immediately refund eligible amounts.</li>
          <li><strong>Unused Annual Subscriptions:</strong> If you subscribe to an annual plan and decide to cancel within 7 days of purchase without substantial usage, you may request a full refund minus nominal payment gateway processing charges.</li>
          <li><strong>Monthly Subscriptions:</strong> Monthly subscription payments are non-refundable once the active billing period has commenced, except in cases of verified platform billing errors.</li>
        </ul>
      </Section>

      <Section title="3. Processing Time & Gateway Transfers" icon={Scale}>
        <p>
          Approved refunds are processed back to the original payment method (Credit Card, Debit Card, UPI, or Netbanking) via Razorpay within <strong>5 to 7 business days</strong>.
        </p>
      </Section>

      <Section title="4. How to Request a Refund" icon={Mail}>
        <p>
          To request a refund, email our billing department at <a href={`mailto:${LEGAL_DETAILS.supportEmail}`} className="text-[var(--brand)] font-semibold">{LEGAL_DETAILS.supportEmail}</a> with your registered account email and payment reference ID. Our billing team responds within 24–48 business hours.
        </p>
      </Section>
    </LegalLayout>
  );
}

// ══════════════════════════════════════════════════════════════
// 4. CONTACT US COMPONENT
// ══════════════════════════════════════════════════════════════
export function ContactUs() {
  return (
    <LegalLayout
      title="Contact Us"
      subtitle="Get in touch with our customer support, partnership, and billing teams."
      badge="Support & Inquiries"
      icon={Mail}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] space-y-2">
          <div className="w-9 h-9 rounded-xl bg-[var(--brand-subtle)] border border-[var(--border)] flex items-center justify-center text-[var(--brand)]">
            <Mail size={18} />
          </div>
          <h3 className="text-base font-bold text-[var(--text)]">Customer Support</h3>
          <p className="text-xs text-[var(--text-muted)]">For technical assistance, setup guidance, and general inquiries.</p>
          <a href={`mailto:${LEGAL_DETAILS.supportEmail}`} className="text-xs font-bold text-[var(--brand)] inline-block mt-2">
            {LEGAL_DETAILS.supportEmail}
          </a>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] space-y-2">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Shield size={18} />
          </div>
          <h3 className="text-base font-bold text-[var(--text)]">Privacy & Compliance</h3>
          <p className="text-xs text-[var(--text-muted)]">For data deletion requests, GDPR, and security verification.</p>
          <a href={`mailto:${LEGAL_DETAILS.privacyEmail}`} className="text-xs font-bold text-purple-400 inline-block mt-2">
            {LEGAL_DETAILS.privacyEmail}
          </a>
        </div>
      </div>

      <Section title="Business Office Address" icon={FileText}>
        <p className="text-sm">
          <strong>{LEGAL_DETAILS.companyName}</strong><br />
          {LEGAL_DETAILS.registeredAddress}
        </p>
      </Section>

      <Section title="Operating Hours" icon={CheckCircle2}>
        <p className="text-sm">
          Monday through Saturday: <strong>09:30 AM – 06:30 PM IST</strong><br />
          Standard support ticket response SLA: <strong>&lt; 24 hours</strong>.
        </p>
      </Section>
    </LegalLayout>
  );
}
