// ════════════════════════════════════════════════════════════
// Autofy — Legal pages (Privacy Policy + Terms of Service)
// Required by the Play Store / App Store and by privacy law before
// you can collect user data. These are solid, tailored starting
// points — have a lawyer review them and fill in the [BRACKETED]
// company details before you rely on them in production.
// ════════════════════════════════════════════════════════════
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Logo } from "./Logo";

const LAST_UPDATED = "27 July 2026";
const CONTACT_EMAIL = "hello@autofy.io"; // update to your real support inbox

// ─── Shared page shell (header + readable column + footer) ───
function LegalLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
      {/* Header */}
      <header className="glass-nav" style={{ position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: "var(--brand-subtle)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Logo size={18} />
            </div>
            <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em", fontFamily: "'Plus Jakarta Sans',sans-serif", color: "var(--text)" }}>Autofy</span>
          </Link>
          <Link to="/" className="btn-ghost" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <ArrowLeft size={15} /> Back to home
          </Link>
        </div>
      </header>

      {/* Body */}
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "48px 20px 80px" }}>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "clamp(30px,6vw,44px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 8 }}>
          {title}
        </h1>
        <p style={{ fontSize: 13.5, color: "var(--text-subtle)", marginBottom: 36 }}>Last updated: {LAST_UPDATED}</p>
        <div style={{ fontSize: 15, lineHeight: 1.75, color: "var(--text-muted)" }}>{children}</div>

        {/* Cross-link footer */}
        <div style={{ marginTop: 56, paddingTop: 24, borderTop: "1px solid var(--border)", display: "flex", gap: 20, fontSize: 14 }}>
          <Link to="/privacy" style={{ color: "var(--brand)", fontWeight: 600 }}>Privacy Policy</Link>
          <Link to="/terms" style={{ color: "var(--brand)", fontWeight: 600 }}>Terms of Service</Link>
          <span style={{ color: "var(--text-subtle)" }}>© {new Date().getFullYear()} Autofy</span>
        </div>
      </main>
    </div>
  );
}

// Small helpers for consistent section styling
const H2 = ({ children }: { children: ReactNode }) => (
  <h2 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 20, fontWeight: 800, color: "var(--text)", margin: "32px 0 12px", letterSpacing: "-0.01em" }}>{children}</h2>
);
const P = ({ children }: { children: ReactNode }) => <p style={{ marginBottom: 14 }}>{children}</p>;
const UL = ({ children }: { children: ReactNode }) => <ul style={{ margin: "0 0 14px", paddingLeft: 22, display: "flex", flexDirection: "column", gap: 7 }}>{children}</ul>;

// ═══════════════════════ PRIVACY POLICY ═══════════════════════
export function PrivacyPolicy() {
  return (
    <LegalLayout title="Privacy Policy">
      <P>
        This Privacy Policy explains how Autofy ("Autofy", "we", "us") collects, uses, and protects your
        information when you use our WhatsApp automation platform, website, and mobile apps (the "Service").
        By using Autofy you agree to this policy.
      </P>

      <H2>1. Information we collect</H2>
      <UL>
        <li><strong>Account information</strong> — your name, business name, email address, and phone number when you sign up.</li>
        <li><strong>Business content you provide</strong> — your knowledge base, services, pricing, FAQs, and AI persona settings.</li>
        <li><strong>WhatsApp conversations</strong> — messages exchanged between your customers and your AI assistant, processed to generate replies.</li>
        <li><strong>Your customers' data</strong> — leads, contacts, and appointment details you or your customers enter (you are the controller of this data; we process it on your behalf).</li>
        <li><strong>Payment information</strong> — processed securely by Razorpay. We do not store full card numbers on our servers.</li>
        <li><strong>Technical data</strong> — device type, log data, and a locally-stored session token to keep you signed in.</li>
      </UL>

      <H2>2. How we use your information</H2>
      <UL>
        <li>To provide, operate, and improve the Service.</li>
        <li>To generate AI replies to your customers using your knowledge base.</li>
        <li>To process subscription payments and send transactional emails (e.g. welcome and receipt emails).</li>
        <li>To provide support and to keep the Service secure.</li>
      </UL>

      <H2>3. Third-party services we rely on</H2>
      <P>Autofy shares data only as needed to operate, with these providers:</P>
      <UL>
        <li><strong>Meta (WhatsApp Business Cloud API)</strong> — to send and receive WhatsApp messages.</li>
        <li><strong>Google (Gemini AI &amp; Google Sign-In)</strong> — to generate AI responses and, if you choose, to sign you in.</li>
        <li><strong>Razorpay</strong> — to process payments.</li>
        <li><strong>Supabase</strong> — authentication and database hosting.</li>
        <li><strong>Email/SMTP provider</strong> — to send transactional emails.</li>
      </UL>
      <P>We do not sell your personal information to anyone.</P>

      <H2>4. Data storage &amp; security</H2>
      <P>
        Your data is stored in secured cloud databases with access controls and encryption in transit (HTTPS).
        We keep your data for as long as your account is active. You can request deletion at any time (see below).
      </P>

      <H2>5. Your rights</H2>
      <UL>
        <li>Access, correct, or export your personal data.</li>
        <li>Delete your account and associated data.</li>
        <li>Withdraw consent or object to certain processing.</li>
      </UL>
      <P>To exercise any of these, email us at <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "var(--brand)", fontWeight: 600 }}>{CONTACT_EMAIL}</a>.</P>

      <H2>6. Children's privacy</H2>
      <P>Autofy is a business tool and is not directed to anyone under 18. We do not knowingly collect data from children.</P>

      <H2>7. Changes to this policy</H2>
      <P>We may update this policy from time to time. Material changes will be posted here with a new "Last updated" date.</P>

      <H2>8. Contact us</H2>
      <P>
        Questions about privacy? Contact <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "var(--brand)", fontWeight: 600 }}>{CONTACT_EMAIL}</a>.
        [Add your registered business name and address here before publishing to the app stores.]
      </P>
    </LegalLayout>
  );
}

// ═══════════════════════ TERMS OF SERVICE ═══════════════════════
export function TermsOfService() {
  return (
    <LegalLayout title="Terms of Service">
      <P>
        These Terms of Service ("Terms") govern your use of Autofy. By creating an account or using the Service,
        you agree to these Terms. If you do not agree, do not use Autofy.
      </P>

      <H2>1. Your account</H2>
      <P>
        You must provide accurate information and are responsible for keeping your login secure and for all
        activity under your account. You must be at least 18 and authorized to act for your business.
      </P>

      <H2>2. Acceptable use</H2>
      <UL>
        <li>Comply with WhatsApp's Business Messaging Policy and all applicable laws.</li>
        <li>Do not send spam, unlawful, or misleading messages through the Service.</li>
        <li>Only message customers who have opted in to hear from your business.</li>
        <li>Do not attempt to disrupt, reverse-engineer, or abuse the Service.</li>
      </UL>

      <H2>3. Subscriptions &amp; payments</H2>
      <P>
        Paid plans are billed as described at checkout. Payments are processed by Razorpay. Fees are non-refundable
        except where required by law. You can cancel at any time; access continues until the end of the paid period.
      </P>

      <H2>4. Your content &amp; your customers</H2>
      <P>
        You retain ownership of the content and customer data you upload. You are responsible for having the right
        to use that data and for how you communicate with your customers. You grant Autofy the limited rights needed
        to operate the Service on your behalf.
      </P>

      <H2>5. AI-generated responses</H2>
      <P>
        Autofy uses AI to draft replies from your knowledge base. AI can make mistakes. You are responsible for
        reviewing and for the content sent to your customers. Autofy is not liable for AI outputs.
      </P>

      <H2>6. Service availability</H2>
      <P>
        We work to keep Autofy available but do not guarantee uninterrupted service. Features may change or be
        discontinued. The Service depends on third parties (WhatsApp, Google, Razorpay) whose availability we do not control.
      </P>

      <H2>7. Limitation of liability</H2>
      <P>
        To the maximum extent permitted by law, Autofy is provided "as is" without warranties, and we are not liable
        for indirect or consequential damages, or for amounts exceeding what you paid us in the prior 12 months.
      </P>

      <H2>8. Termination</H2>
      <P>We may suspend or terminate accounts that violate these Terms. You may stop using and delete your account at any time.</P>

      <H2>9. Contact</H2>
      <P>
        Questions about these Terms? Contact <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "var(--brand)", fontWeight: 600 }}>{CONTACT_EMAIL}</a>.
        [Add your registered business name, jurisdiction, and governing law here before publishing.]
      </P>
    </LegalLayout>
  );
}

// ═══════════════ REFUND & CANCELLATION POLICY ═══════════════
// Razorpay activation REQUIRES a public refund/cancellation policy.
export function RefundPolicy() {
  return (
    <LegalLayout title="Refund & Cancellation Policy">
      <P>
        This policy explains how cancellations and refunds work for Autofy subscriptions. It applies to payments
        you make to Autofy for your own subscription. Payments your customers make to <em>your</em> business are
        governed by your business's own refund terms, not this policy.
      </P>

      <H2>1. Subscription cancellation</H2>
      <P>
        You can cancel your Autofy subscription at any time from your dashboard under Settings → Billing. When you
        cancel, your plan stays active until the end of the current billing period; you will not be charged again
        after that.
      </P>

      <H2>2. Refunds</H2>
      <UL>
        <li>Monthly plans are generally non-refundable once the billing period has started.</li>
        <li>If you were charged in error, or experienced a billing issue, contact us within <strong>7 days</strong> and we will review and refund eligible amounts.</li>
        <li>Approved refunds are processed back to your original payment method via Razorpay within <strong>5–7 business days</strong>.</li>
      </UL>

      <H2>3. How to request a refund</H2>
      <P>
        Email <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "var(--brand)", fontWeight: 600 }}>{CONTACT_EMAIL}</a> with
        your account email and the payment reference. We aim to respond within 2 business days.
      </P>

      <H2>4. Failed or duplicate payments</H2>
      <P>
        If a payment fails but you were still charged, or you were charged twice, the extra amount is refunded
        automatically to your source account. If you don't see it within 7 business days, contact us.
      </P>

      <H2>5. Contact</H2>
      <P>
        For any billing question, reach us at <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "var(--brand)", fontWeight: 600 }}>{CONTACT_EMAIL}</a>.
      </P>
    </LegalLayout>
  );
}

// ═══════════════════════ CONTACT US ═══════════════════════
// Razorpay activation also requires reachable contact details.
export function ContactUs() {
  return (
    <LegalLayout title="Contact Us">
      <P>We'd love to hear from you. For support, billing, or partnership questions, reach out any time.</P>

      <H2>Email</H2>
      <P><a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "var(--brand)", fontWeight: 600 }}>{CONTACT_EMAIL}</a></P>

      <H2>Support hours</H2>
      <P>Monday–Saturday, 10:00 AM – 7:00 PM IST. We typically respond within one business day.</P>

      <H2>Business address</H2>
      <P>
        [Add your registered business name and full postal address here — Razorpay requires this on your
        Contact page before they activate live payments.]
      </P>
    </LegalLayout>
  );
}
