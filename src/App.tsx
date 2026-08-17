import React, { useState, useEffect, useRef } from "react";
import { Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { LoginView, SignUpView } from "./components/AuthPages";
import { OnboardingWizard } from "./components/OnboardingWizard";
import { Dashboard } from "./components/Dashboard";
import { NotFoundPage } from "./components/NotFoundPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { CursorGlow } from "./components/CursorGlow";
import { ThemeToggle } from "./components/ThemeToggle";
import { MagneticButton } from "./components/MagneticButton";
import { Logo } from "./components/Logo";
import { PrivacyPolicy, TermsOfService, RefundPolicy, ContactUs } from "./components/LegalPages";
import { PublicAccountDeletionPage } from "./components/PublicAccountDeletionPage";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { INITIAL_ONBOARDING_DATA, OnboardingData } from "./types";
import { getCurrentUser, signOut, completeOAuthLogin, onAuthStateChange, AuthUser } from "./lib/auth";
import { api } from "./lib/api";
import {
  loadTenantOnboardingData,
  saveTenantOnboardingData,
  clearTenantOnboardingData,
  purgeLegacyOnboardingKeys
} from "./lib/onboardingStorage";
import { loadRazorpayScript } from "./lib/razorpayLoader";
import { useTheme } from "./context/ThemeContext";
import { fadeUp, scaleIn, staggerContainer } from "./lib/motionVariants";
import {
  MessageSquare, ArrowRight, Menu, X,
  Zap, Calendar, CreditCard,
  Users, Check, Bot, Shield,
  BarChart3, BookOpen, Star,
  ChevronRight, Link2, CalendarDays, FileText, LayoutDashboard, Target,
  Sparkles, ArrowDown
} from "lucide-react";

// ════════════════════════════════════════════════════════════
// MARQUEE DATA
// ════════════════════════════════════════════════════════════
const MARQUEE_ROW1 = [
  { icon: <MessageSquare size={16} style={{ color: "#25D366" }} />, text: "WhatsApp AI" },
  { icon: <Target size={16} style={{ color: "#DC2626" }} />, text: "Lead Capture" },
  { icon: <Calendar size={16} style={{ color: "#2563EB" }} />, text: "Booking System" },
  { icon: <CreditCard size={16} style={{ color: "#D97706" }} />, text: "UPI Payment" },
  { icon: <Zap size={16} style={{ color: "#8B5CF6" }} />, text: "Auto Reply" },
  { icon: <Link2 size={16} style={{ color: "#2563EB" }} />, text: "CRM Sync" },
  { icon: <CalendarDays size={16} style={{ color: "#16A34A" }} />, text: "Smart Scheduling" },
  { icon: <FileText size={16} style={{ color: "#D97706" }} />, text: "Invoice Generation" },
  { icon: <BarChart3 size={16} style={{ color: "#9333EA" }} />, text: "Live Analytics" },
];
const MARQUEE_ROW2 = [
  { text: "Gyms" }, { text: "Salons" },
  { text: "Clinics" }, { text: "Coaching" },
  { text: "Restaurants" }, { text: "Pet Stores" },
  { text: "Car Service" }, { text: "Real Estate" },
  { text: "Wellness" }, { text: "Cafés" },
];

// ════════════════════════════════════════════════════════════
// NAVBAR
// ════════════════════════════════════════════════════════════
function Navbar() {
  const navigate = useNavigate();
  const [mobileNav, setMobileNav] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileNav ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileNav]);

  const navLinks = [
    { label: "Features", id: "features" },
    { label: "How It Works", id: "howitworks" },
    { label: "Pricing", id: "pricing" },
  ];

  const scrollTo = (id: string) => {
    setMobileNav(false);
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  return (
    <>
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, height: 64,
        background: scrolled ? "var(--header-bg)" : "transparent",
        backdropFilter: scrolled ? "blur(28px) saturate(180%)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(28px) saturate(180%)" : "none",
        borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
        transition: "all 0.35s cubic-bezier(0.22,1,0.36,1)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px", height: "100%",
          display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo */}
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <Logo size={32} />
            <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em",
              fontFamily: "'Plus Jakarta Sans',sans-serif", color: "var(--text)" }}>Autofy</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hide-mobile" style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {navLinks.map(l => (
              <button key={l.id} className="nav-link" onClick={() => scrollTo(l.id)}>{l.label}</button>
            ))}
          </nav>

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ThemeToggle size="small" />
            <button onClick={() => navigate("/login")} className="btn-nav hide-mobile">Sign In</button>
            <MagneticButton onClick={() => navigate("/signup")} className="btn-primary hide-mobile"
              >Get Started Free</MagneticButton>
            <button onClick={() => setMobileNav(!mobileNav)} className="show-mobile"
              style={{ background: "none", border: "none", color: "var(--text)", cursor: "pointer", padding: 6 }}>
              {mobileNav ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile fullscreen menu */}
      <AnimatePresence>
        {mobileNav && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mobile-menu">
            {navLinks.map(l => (
              <button key={l.id} className="mobile-nav-link" onClick={() => scrollTo(l.id)}>{l.label}</button>
            ))}
            <button className="mobile-nav-link" onClick={() => { setMobileNav(false); navigate("/login"); }}>Sign In</button>
            <button onClick={() => { setMobileNav(false); navigate("/signup"); }}
              className="btn-primary" style={{ marginTop: 24, height: 52, padding: "0 40px" }}>
              Start Free Trial <ArrowRight size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ════════════════════════════════════════════════════════════
// BROWSER DASHBOARD MOCKUP
// ════════════════════════════════════════════════════════════
function BrowserMockup() {
  return (
    <div style={{
      marginTop: 80,
      width: "100%",
      maxWidth: 960,
      alignSelf: "center",
      background: "var(--bg-2)",
      borderRadius: 16,
      border: "1px solid var(--border-strong)",
      overflow: "hidden",
      transform: "perspective(1200px) rotateX(4deg)",
      boxShadow: "0 40px 120px rgba(139,92,246,0.20)",
      display: "flex",
      flexDirection: "column",
      aspectRatio: "1.6/1",
    }}>
      {/* Browser Chrome Header */}
      <div style={{
        height: 40,
        background: "var(--bg)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        gap: 12,
        position: "relative"
      }}>
        {/* Chrome Window Dots */}
        <div style={{ display: "flex", gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF5F56" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FFBD2E" }} />
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#27C93F" }} />
        </div>
        {/* Address Bar */}
        <div style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          background: "var(--bg-2)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          height: 24,
          width: "40%",
          maxWidth: 320,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          color: "var(--text-muted)",
          fontWeight: 500,
        }}>
          app.autofy.io
        </div>
      </div>

      {/* Browser Inside Mockup Area */}
      <div style={{ display: "flex", flex: 1, background: "var(--bg)", overflow: "hidden" }}>
        {/* Mini Sidebar */}
        <div style={{
          width: 60,
          background: "var(--bg-2)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "16px 0",
          gap: 20
        }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 14 }}>A</div>
          {[1, 2, 3, 4].map(idx => (
            <div key={idx} style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background: idx === 1 ? "var(--brand-subtle)" : "transparent",
              border: idx === 1 ? "1px solid var(--brand)" : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: idx === 1 ? "var(--brand)" : "var(--text-subtle)" }} />
            </div>
          ))}
        </div>

        {/* Dashboard Main Area */}
        <div style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", gap: 20, overflow: "hidden" }}>
          {/* Header Row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
              <div style={{ width: 100, height: 14, borderRadius: 4, background: "var(--text-subtle)" }} />
              <div style={{ width: 60, height: 8, borderRadius: 4, background: "var(--text-subtle)", opacity: 0.5 }} />
            </div>
            <div style={{ width: 80, height: 28, borderRadius: 14, background: "var(--brand)", opacity: 0.2 }} />
          </div>

          {/* Cards Row */}
          <div style={{ display: "flex", gap: 16 }}>
            {[
              { color: "var(--brand)", label: "Total Leads", val: "428" },
              { color: "#10B981", label: "AI Chats", val: "1,248" },
              { color: "#F59E0B", label: "Payments", val: "₹48,990" }
            ].map((card, idx) => (
              <div key={idx} style={{
                flex: 1,
                padding: 16,
                background: "var(--bg-2)",
                borderRadius: 12,
                border: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 8
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{card.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text)" }}>{card.val}</div>
                <div style={{ width: "60%", height: 4, borderRadius: 2, background: card.color, opacity: 0.3 }} />
              </div>
            ))}
          </div>

          {/* Table Area */}
          <div style={{
            flex: 1,
            background: "var(--bg-2)",
            borderRadius: 12,
            border: "1px solid var(--border)",
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            overflow: "hidden"
          }}>
            <div style={{ width: 120, height: 10, borderRadius: 4, background: "var(--text-subtle)", alignSelf: "flex-start" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[1, 2, 3].map(row => (
                <div key={row} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingBottom: 8,
                  borderBottom: "1px solid var(--border)"
                }}>
                  <div style={{ display: "flex", gap: 8, items: "center" }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", background: "var(--brand)", opacity: 0.4 }} />
                    <div style={{ width: 80, height: 8, borderRadius: 4, background: "var(--text-subtle)", margin: "auto 0" }} />
                  </div>
                  <div style={{ width: 40, height: 8, borderRadius: 4, background: "var(--text-subtle)", opacity: 0.5, margin: "auto 0" }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// HERO SECTION
// ════════════════════════════════════════════════════════════
function Hero() {
  const navigate = useNavigate();
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0.2]);
  const orbScale = useTransform(scrollYProgress, [0, 1], [1, 1.3]);

  return (
    <section ref={sectionRef} style={{ position: "relative", minHeight: "100vh", overflow: "hidden",
      display: "flex", flexDirection: "column", paddingTop: 64, background: "var(--bg)" }}>

      {/* ── Futuristic background stack (all decorative, pointer-events:none) ──
          1. aurora   — drifting pink/blue/violet colour blobs
          2. grid     — tech grid, radially masked so it fades at the edges
          3. spotlight— soft glow behind the headline                        */}
      <motion.div className="aurora" style={{ scale: orbScale }}>
        <i className="a1" />
        <i className="a2" />
        <i className="a3" />
      </motion.div>
      <div className="hero-grid" />
      <div className="hero-spotlight" />

      {/* ── Floating glass cards: show the product's story at a glance.
           Decorative only; hidden below 1180px via .hero-float.        ── */}
      {[
        { cls: "bob-slow", pos: { top: "27%", left: "3.5%" }, delay: 0.9,
          icon: <Users size={15} style={{ color: "#3B82F6" }} />, tint: "rgba(59,130,246,0.12)",
          title: "New lead captured", sub: "WhatsApp lead qualified via AI" },
        { cls: "bob-mid", pos: { top: "23%", right: "3.5%" }, delay: 1.05,
          icon: <CreditCard size={15} style={{ color: "#16A34A" }} />, tint: "rgba(22,163,74,0.12)",
          title: "Payment received", sub: "Razorpay subscription verified" },
        { cls: "bob-fast", pos: { top: "40%", right: "5%" }, delay: 1.2,
          icon: <Zap size={15} style={{ color: "#8B5CF6" }} />, tint: "rgba(139,92,246,0.14)",
          title: "AI replied in 0.3s", sub: "98% confidence" },
      ].map((c, i) => (
        <motion.div
          key={i}
          className="hero-float"
          initial={{ opacity: 0, y: 24, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: c.delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: "absolute", zIndex: 5, pointerEvents: "none", ...c.pos }}
        >
          <div className={`glass-strong ${c.cls}`} style={{ display: "flex", alignItems: "center", gap: 11, padding: "13px 17px", minWidth: 232 }}>
            <span style={{ width: 30, height: 30, borderRadius: 9, background: c.tint,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {c.icon}
            </span>
            <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.35 }}>
              <span style={{ fontSize: 12.5, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.01em" }}>{c.title}</span>
              <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{c.sub}</span>
            </span>
          </div>
        </motion.div>
      ))}

      {/* Hero Content — width:100% + smaller side padding keeps the centered
          column from exceeding the mobile viewport (which clipped content). */}
      <motion.div style={{ y: heroY, opacity: heroOpacity,
        width: "100%", maxWidth: 1200, margin: "0 auto", padding: "100px 20px 60px", position: "relative", zIndex: 10,
        flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>

        {/* Badge — frosted glass pill with a gradient outline + live pulse */}
        <motion.div variants={scaleIn} initial="hidden" animate="visible" style={{ marginBottom: 30 }}>
          <span className="badge-glow" style={{ display: "inline-flex", alignItems: "center", gap: 9,
            padding: "9px 18px", fontSize: 12.5, fontWeight: 700, letterSpacing: "0.01em", color: "var(--text)" }}>
            <span className="pulse-dot" />
            AI-powered WhatsApp automation
            <Sparkles size={13} style={{ color: "var(--brand)" }} />
          </span>
        </motion.div>

        {/* Headline — "Answers Itself" carries the signature gradient */}
        <h1 style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          // Lower mobile floor (was 44px) so the longest line "24/7 on WhatsApp"
          // fits within a 375px viewport without clipping; scales up on desktop.
          fontSize: "clamp(34px, 8vw, 82px)",
          fontWeight: 900,
          color: "var(--text)",
          textAlign: "center",
          letterSpacing: "-0.045em",
          lineHeight: 1.02,
          maxWidth: "100%",
          margin: "0 auto 24px"
        }}>
          <div>Your Business</div>
          <div className="text-gradient-brand">Answers Itself</div>
          <div>
            24/7 on{" "}
            <span style={{ color: "#25D366", textShadow: "0 0 38px rgba(37,211,102,0.35)" }}>WhatsApp</span>
          </div>
        </h1>

        {/* Subheadline */}
        <motion.p variants={fadeUp} initial="hidden" animate="visible" className="body-large"
          style={{ maxWidth: 560, margin: "24px auto 0", textAlign: "center", fontSize: 17, weight: 400, color: "var(--text-muted)", lineHeight: 1.7 }}>
          Connect your WhatsApp number. Train your AI once. Watch it handle inquiries, book appointments, and collect payments — automatically.
        </motion.p>

        {/* CTAs */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.6 }}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap", marginTop: 40 }}>
          <MagneticButton onClick={() => navigate("/signup")} className="btn-primary cta-glow" style={{ height: 54, padding: "0 34px", borderRadius: 100, fontSize: 15 }}>
            Get Started Free <ArrowRight size={16} />
          </MagneticButton>
          <button onClick={() => document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" })}
            className="btn-secondary glass" style={{ height: 54, padding: "0 32px", borderRadius: 100, fontSize: 15 }}>
            Watch Demo <ArrowDown size={16} />
          </button>
        </motion.div>

        {/* Trust chips — frosted pills read better against the aurora */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85 }}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, flexWrap: "wrap", marginTop: 34 }}>
          {[
            { text: "Built for Indian businesses", color: "#16A34A" },
            { text: "4.9/5 average rating", color: "#F59E0B" },
            { text: "No credit card needed", color: "var(--brand)" }
          ].map((item, i) => (
            <span key={i} className="glass" style={{ display: "flex", alignItems: "center", gap: 8,
              padding: "8px 15px", borderRadius: 100, fontSize: 12.5, fontWeight: 600, color: "var(--text-muted)" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: item.color, flexShrink: 0 }} />
              {item.text}
            </span>
          ))}
        </motion.div>

        {/* Interactive browser mockup (carries its own violet glow + 3D tilt) */}
        <BrowserMockup />
      </motion.div>

      {/* Dual Marquee */}
      <div style={{ background: "var(--bg-2)", borderTop: "1px solid var(--border)",
        padding: "14px 0", overflow: "hidden", position: "relative", zIndex: 10 }}>
        <div className="marquee-track">
          {[...MARQUEE_ROW1, ...MARQUEE_ROW1].map((item, i) => (
            <span key={i} className="marquee-chip" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              {item.icon} {item.text}
            </span>
          ))}
        </div>
        <div className="marquee-track-reverse" style={{ marginTop: 8 }}>
          {[...MARQUEE_ROW2, ...MARQUEE_ROW2].map((item, i) => (
            <span key={i} className="marquee-chip" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--brand)" }} />
              {item.text}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════
// LIVE DEMO — 3-TAB JOURNEY SYSTEM
// ════════════════════════════════════════════════════════════
const DEMO_CHAT_JOURNEY = [
  { from: "customer" as const, text: "Hi, I want gym membership info" },
  { from: "ai" as const, text: "Hi! I'm Aria from Elite Fitness. We have 3 plans: Monthly ₹1,500 | Quarterly ₹3,999 | Annual ₹12,999. Which interests you?" },
  { from: "customer" as const, text: "Quarterly sounds good. How do I pay?" },
  { from: "ai" as const, text: "Great choice! I'll send you our secure payment link right now." },
  { from: "customer" as const, text: "Done! I paid." },
  { from: "ai" as const, text: "Payment confirmed. Welcome to Elite Fitness! Your membership starts today. See you soon!" },
];

function LiveDemoSection() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<"chat" | "payment" | "dashboard">("chat");
  const [chatCount, setChatCount] = useState(0);

  // Typewriting simulator for WhatsApp tab
  useEffect(() => {
    if (activeTab !== "chat") {
      setChatCount(0);
      return;
    }
    setChatCount(1);
    const interval = setInterval(() => {
      setChatCount(prev => {
        if (prev >= DEMO_CHAT_JOURNEY.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 1800);
    return () => clearInterval(interval);
  }, [activeTab]);

  return (
    <section id="demo" style={{ background: "var(--bg-2)", padding: "120px 0", position: "relative" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
        
        {/* Section Label & Headers */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <span className="section-label" style={{ color: "var(--brand)", fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <Sparkles size={12} /> LIVE DEMO
          </span>
          <h2 className="section-h2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 48, fontWeight: 800, color: "var(--text)" }}>
            See the Full Journey
          </h2>
          <p style={{ fontSize: 16, color: "var(--text-muted)", marginTop: 12 }}>
            From first WhatsApp message to payment — fully automated
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 50, flexWrap: "wrap" }}>
          {[
            { id: "chat" as const, label: "Customer Chat", icon: <MessageSquare size={14} /> },
            { id: "payment" as const, label: "Payment Flow", icon: <CreditCard size={14} /> },
            { id: "dashboard" as const, label: "Owner Dashboard", icon: <LayoutDashboard size={14} /> },
          ].map(tab => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  height: 40,
                  padding: "0 20px",
                  borderRadius: 100,
                  fontSize: 13,
                  fontWeight: isSelected ? 700 : 500,
                  background: isSelected ? "var(--brand)" : "var(--bg-elevated)",
                  color: isSelected ? "#ffffff" : "var(--text-muted)",
                  border: isSelected ? "1px solid var(--brand)" : "1px solid var(--border)",
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                  boxShadow: isSelected ? "0 4px 12px var(--brand-glow)" : "none"
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Dynamic Journey Views Container */}
        <div style={{ minHeight: 480, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <AnimatePresence mode="wait">
            
            {/* TAB 1: CUSTOMER CHAT (WHATSAPP) */}
            {activeTab === "chat" && (
              <motion.div
                key="chat-view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}
              >
                {/* Phone Silouette Wrapper */}
                <div style={{
                  width: "100%",
                  maxWidth: 380,
                  background: "var(--bg-card)",
                  border: theme === "dark" ? "8px solid #1A1A1A" : "8px solid #E5E5E5",
                  borderRadius: 40,
                  overflow: "hidden",
                  boxShadow: "0 30px 80px var(--shadow)"
                }}>
                  {/* WhatsApp Header */}
                  <div style={{ padding: "16px 20px", background: "#075E54", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "var(--brand)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: 14,
                      fontWeight: 800
                    }}>
                      A
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#ffffff" }}>Aria — Elite Fitness</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981" }} />
                        online
                      </div>
                    </div>
                  </div>

                  {/* Messages Bubble Container */}
                  <div style={{
                    padding: "20px 16px",
                    minHeight: 400,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    background: "var(--bg)",
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M9 24h1v1H9v-1zm0 3h1v1H9v-1z' fill='%237C3AED' fill-opacity='0.02'/%3E%3C/svg%3E")`
                  }}>
                    {DEMO_CHAT_JOURNEY.slice(0, chatCount).map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 12, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        style={{
                          maxWidth: "80%",
                          alignSelf: msg.from === "customer" ? "flex-end" : "flex-start",
                          padding: "10px 14px",
                          borderRadius: msg.from === "customer" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                          background: msg.from === "customer" ? "#DCF8C6" : "var(--bg-card)",
                          border: msg.from === "ai" ? "1px solid var(--border)" : "none",
                          color: msg.from === "customer" ? "#1a1a1a" : "var(--text)",
                          fontSize: 13,
                          lineHeight: 1.5
                        }}
                      >
                        {msg.text}
                      </motion.div>
                    ))}

                    {/* Typing Indicator */}
                    {chatCount > 0 && chatCount < DEMO_CHAT_JOURNEY.length && (
                      <div style={{ alignSelf: DEMO_CHAT_JOURNEY[chatCount]?.from === "customer" ? "flex-end" : "flex-start", display: "flex", gap: 4, padding: "8px 12px", background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border)" }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--text-subtle)", animation: "bounce-down 1s infinite" }} />
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--text-subtle)", animation: "bounce-down 1s 0.2s infinite" }} />
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--text-subtle)", animation: "bounce-down 1s 0.4s infinite" }} />
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: 24, fontSize: 12, fontWeight: 700, background: "var(--brand-subtle)", color: "var(--brand)", padding: "6px 16px", borderRadius: 100 }}>
                  Average response time: 0.3 seconds
                </div>
              </motion.div>
            )}

            {/* TAB 2: PAYMENT FLOW */}
            {activeTab === "payment" && (
              <motion.div
                key="payment-view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                style={{ width: "100%", maxWidth: 1000, display: "flex", flexDirection: "column", gap: 32 }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, alignItems: "stretch" }} className="payment-journey-grid">
                  
                  {/* Step 1: AI Sends Payment Link */}
                  <div style={{
                    padding: 24,
                    background: "var(--bg-card)",
                    borderRadius: 20,
                    border: "1px solid var(--border)",
                    borderTop: "4px solid var(--brand)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 16
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "var(--brand)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Step 1: AI Sends Payment Link</span>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                      {/* Simulated Bubble */}
                      <div style={{
                        background: "var(--bg)",
                        padding: 14,
                        borderRadius: "16px 16px 16px 4px",
                        border: "1px solid var(--border)",
                        fontSize: 12,
                        lineHeight: 1.4,
                        display: "flex",
                        flexDirection: "column",
                        gap: 10
                      }}>
                        <div>Great choice! I'll send you our secure payment link right now:</div>
                        <div style={{
                          background: "var(--bg-2)",
                          border: "1px solid var(--border-strong)",
                          borderRadius: 10,
                          padding: 12,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 10
                        }}>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: 11 }}>Elite Gym Quarterly Pass</div>
                            <div style={{ fontSize: 10, color: "var(--accent-amber)", fontWeight: 700 }}>Amount: ₹3,999</div>
                          </div>
                          <button style={{ background: "var(--brand)", color: "white", border: "none", fontSize: 10, fontWeight: 700, padding: "6px 12px", borderRadius: 6 }}>Pay Now</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Customer Pays */}
                  <div style={{
                    padding: 24,
                    background: "var(--bg-card)",
                    borderRadius: 20,
                    border: "1px solid var(--border)",
                    borderTop: "4px solid var(--accent-blue)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 16
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "var(--accent-blue)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Step 2: Customer Pays</span>
                    <div style={{
                      background: "var(--bg)",
                      borderRadius: 14,
                      border: "1px solid var(--border-strong)",
                      padding: 16,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 10
                    }}>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>UPI Secure Checkout</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: "var(--text)" }}>₹3,999.00</div>
                      <div style={{ fontSize: 9, fontFamily: "monospace", color: "var(--text-muted)" }}>UPI ID: merchant@razorpay</div>
                      
                      {/* Fake QR */}
                      <div style={{
                        width: 72,
                        height: 72,
                        border: "1px solid var(--border-strong)",
                        background: "var(--bg-2)",
                        display: "grid",
                        gridTemplateColumns: "repeat(6, 1fr)",
                        padding: 6,
                        gap: 2
                      }}>
                        {Array.from({ length: 36 }).map((_, i) => (
                          <div key={i} style={{ background: (i % 2 === 0 || i % 5 === 0) ? "var(--text)" : "transparent" }} />
                        ))}
                      </div>

                      <button style={{ width: "100%", background: "#10B981", color: "white", border: "none", fontSize: 11, fontWeight: 800, padding: "8px 0", borderRadius: 8 }}>Pay with UPI</button>
                    </div>
                  </div>

                  {/* Step 3: Owner Gets Notified */}
                  <div style={{
                    padding: 24,
                    background: "var(--bg-card)",
                    borderRadius: 20,
                    border: "1px solid var(--border)",
                    borderTop: "4px solid #10B981",
                    display: "flex",
                    flexDirection: "column",
                    gap: 16
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#10B981", textTransform: "uppercase", letterSpacing: "0.08em" }}>Step 3: Owner Notified</span>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 12 }}>
                      <div style={{
                        border: "1px dashed #10B981",
                        background: "rgba(16,185,129,0.04)",
                        borderRadius: 12,
                        padding: 16,
                        display: "flex",
                        alignItems: "center",
                        gap: 12
                      }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#10B981", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}><Check size={16} /></div>
                        <div style={{ textAlign: "left" }}>
                          <div style={{ fontSize: 12, fontWeight: 800 }}>Payment Received</div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Payment mandate verified</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center" }}>
                        Membership activated automatically
                      </div>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

            {/* TAB 3: OWNER DASHBOARD */}
            {activeTab === "dashboard" && (
              <motion.div
                key="dashboard-view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}
              >
                {/* Mini Dashboard inside Browser Wrapper */}
                <div style={{
                  width: "100%",
                  maxWidth: 880,
                  background: "var(--bg-2)",
                  borderRadius: 16,
                  border: "1px solid var(--border-strong)",
                  overflow: "hidden",
                  boxShadow: "0 30px 80px var(--shadow)"
                }}>
                  {/* Browser chrome header */}
                  <div style={{ height: 38, background: "var(--bg)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", padding: "0 16px", position: "relative" }}>
                    <div style={{ display: "flex", gap: 5 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF5F56" }} />
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FFBD2E" }} />
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#27C93F" }} />
                    </div>
                    <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", fontSize: 10, color: "var(--text-muted)", fontWeight: 500 }}>
                      app.autofy.io/dashboard
                    </div>
                  </div>

                  {/* Dashboard body */}
                  <div style={{ display: "flex", height: 380, background: "var(--bg)" }}>
                    {/* Mini Sidebar */}
                    <div style={{ width: 50, background: "var(--bg-2)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0", gap: 16 }}>
                      <div style={{ width: 24, height: 24, borderRadius: 6, background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 10, fontWeight: 900 }}>A</div>
                      <div style={{ width: 22, height: 22, borderRadius: 6, background: "var(--brand-subtle)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <LayoutDashboard size={12} style={{ color: "var(--brand)" }} />
                      </div>
                      {[1, 2, 3].map(i => (
                        <div key={i} style={{ width: 22, height: 22, borderRadius: 6, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--text-subtle)" }} />
                        </div>
                      ))}
                    </div>

                    {/* Dashboard Contents */}
                    <div style={{ flex: 1, padding: 20, display: "flex", flexDirection: "column", gap: 16, overflow: "hidden" }}>
                      
                      {/* Stat cards row */}
                      <div style={{ display: "flex", gap: 12 }}>
                        {[
                          { val: "28", desc: "Conversations Today", change: "+12%", color: "var(--brand)" },
                          { val: "₹47,200", desc: "Revenue This Month", change: "+8%", color: "#10B981" },
                          { val: "94%", desc: "AI Resolution Rate", change: "+3%", color: "var(--accent-blue)" }
                        ].map((stat, i) => (
                          <div key={i} style={{ flex: 1, background: "var(--bg-2)", border: "1px solid var(--border)", padding: 12, borderRadius: 12, display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
                            <div style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 600 }}>{stat.desc}</div>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                              <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>{stat.val}</span>
                              <span style={{ fontSize: 9, fontWeight: 700, color: "#10B981" }}>{stat.change}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Main grid */}
                      <div style={{ display: "flex", gap: 12, flex: 1, minHeight: 0 }}>
                        {/* Recent activity log */}
                        <div style={{ flex: 1.5, background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", gap: 8, overflow: "hidden", textAlign: "left" }}>
                          <span style={{ fontSize: 9, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>Recent Activity</span>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {[
                              { dot: "#10B981", text: "Subscription mandate verified — Autofy Pro", time: "2m ago" },
                              { dot: "var(--accent-blue)", text: "Inbound customer inquiry answered via AI", time: "8m ago" },
                              { dot: "var(--accent-amber)", text: "Appointment confirmed & synced to calendar", time: "15m ago" }
                            ].map((act, i) => (
                              <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 10, paddingBottom: 6, borderBottom: i < 2 ? "1px solid var(--border)" : "none" }}>
                                <div style={{ display: "flex", gap: 6, alignItems: "center", overflow: "hidden" }}>
                                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: act.dot, flexShrink: 0 }} />
                                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text)" }}>{act.text}</span>
                                </div>
                                <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>{act.time}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Flex bars mini chart */}
                        <div style={{ flex: 1, background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", gap: 8, overflow: "hidden" }}>
                          <span style={{ fontSize: 9, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", textAlign: "left" }}>Conversation Load</span>
                          <div style={{ display: "flex", flex: 1, alignItems: "flex-end", justifyContent: "space-between", padding: "10px 4px 4px" }}>
                            {[20, 35, 15, 45, 30, 25, 40].map((h, i) => (
                              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
                                <div style={{
                                  width: 8,
                                  height: `${h * 2.2}px`,
                                  background: "linear-gradient(to top, var(--brand), var(--brand-light))",
                                  borderRadius: 4
                                }} />
                                <span style={{ fontSize: 8, color: "var(--text-muted)" }}>{["M","T","W","T","F","S","S"][i]}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════
// FEATURES SECTION — Horizontal scroll on desktop, vertical on mobile
// ════════════════════════════════════════════════════════════
const FEATURES = [
  { title: "AI Replies Instantly", desc: "Respond to customer WhatsApp messages 24/7 with human-like AI that knows your business.",
    icon: <MessageSquare size={22} />, accent: "#8B5CF6", badge: "< 0.3s response time",
    gradientDark: "linear-gradient(145deg, #1E0A3C, #2D1B69)", gradientLight: "linear-gradient(145deg, #EDE9FE, #DDD6FE)" },
  { title: "Auto Lead Capture", desc: "Every WhatsApp conversation is a potential lead. Autofy captures name, number, and intent automatically.",
    icon: <Users size={22} />, accent: "#3B82F6", badge: "Auto-captured from WhatsApp",
    gradientDark: "linear-gradient(145deg, #0A1628, #1E3A5F)", gradientLight: "linear-gradient(145deg, #EFF6FF, #DBEAFE)" },
  { title: "UPI & Card Payments", desc: "Collect payments via UPI, cards, and netbanking directly in WhatsApp. Powered by Razorpay & Stripe.",
    icon: <CreditCard size={22} />, accent: "#10B981", badge: "Razorpay + Stripe",
    gradientDark: "linear-gradient(145deg, #0A2818, #1A4731)", gradientLight: "linear-gradient(145deg, #ECFDF5, #D1FAE5)" },
  { title: "Smart Booking", desc: "Let customers book appointments through WhatsApp. Zero double-bookings with smart calendar sync.",
    icon: <Calendar size={22} />, accent: "#F59E0B", badge: "Zero double-bookings",
    gradientDark: "linear-gradient(145deg, #1A0A00, #3D1F00)", gradientLight: "linear-gradient(145deg, #FFFBEB, #FEF3C7)" },
  { title: "Analytics Dashboard", desc: "Track conversations, revenue, leads, and AI performance — all in real-time.",
    icon: <BarChart3 size={22} />, accent: "#9333EA", badge: "Real-time insights",
    gradientDark: "linear-gradient(145deg, #1A0020, #3D0050)", gradientLight: "linear-gradient(145deg, #FDF4FF, #FAE8FF)" },
  { title: "Knowledge Base AI", desc: "Train your AI once with your business info, FAQs, and pricing. It learns and never forgets.",
    icon: <BookOpen size={22} />, accent: "#06B6D4", badge: "Train once, works forever",
    gradientDark: "linear-gradient(145deg, #001A1A, #004040)", gradientLight: "linear-gradient(145deg, #F0FDFA, #CCFBF1)" },
];

function FeatureCard({ feature, index }: { feature: typeof FEATURES[0]; index: number; key?: React.Key }) {
  const { theme } = useTheme();
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current || window.innerWidth < 1024) return;
    const rect = cardRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const tiltX = ((e.clientX - cx) / (rect.width / 2)) * 8;
    const tiltY = -((e.clientY - cy) / (rect.height / 2)) * 8;
    setTilt({ x: tiltX, y: tiltY });
  };

  return (
    <motion.div
      ref={cardRef}
      variants={fadeUp}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      style={{
        minWidth: 340, maxWidth: 340, flex: "0 0 340px",
        borderRadius: 20, overflow: "hidden",
        background: theme === "dark" ? feature.gradientDark : feature.gradientLight,
        border: `1px solid ${feature.accent}22`,
        padding: "28px 24px",
        cursor: "default",
        transform: `perspective(1000px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
        transition: "transform 0.4s ease",
        display: "flex", flexDirection: "column", gap: 16,
      }}
    >
      {/* Accent bar */}
      <div style={{ width: 40, height: 3, borderRadius: 2, background: feature.accent }} />

      {/* Icon */}
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: `${feature.accent}18`, border: `1px solid ${feature.accent}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: feature.accent,
      }}>
        {feature.icon}
      </div>

      {/* Content */}
      <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)",
        fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{feature.title}</h3>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-muted)", flex: 1 }}>{feature.desc}</p>

      {/* Badge */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "6px 12px", borderRadius: 100,
        background: `${feature.accent}12`, border: `1px solid ${feature.accent}25`,
        fontSize: 11, fontWeight: 700, color: feature.accent,
        width: "fit-content",
      }}>
        <Check size={12} /> {feature.badge}
      </div>
    </motion.div>
  );
}

function FeaturesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const fn = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const x = useTransform(scrollYProgress, [0.05, 0.95], ["0%", "-65%"]);

  return (
    <section id="features" ref={sectionRef}
      style={{ position: "relative", background: "var(--bg)" }}
    >
      {/* Section header */}
      <div style={{ paddingTop: 120, paddingBottom: isDesktop ? 40 : 40, maxWidth: 1200, margin: "0 auto", padding: "120px 32px 40px" }}>
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}
          style={{ textAlign: "center" }}>
          <span className="section-label text-gradient-primary">FEATURES</span>
          <h2 className="section-h2">Everything Your Business <span className="text-gradient-rainbow">Needs</span></h2>
          <p className="body-large" style={{ maxWidth: 520, margin: "16px auto 0" }}>
            From WhatsApp AI replies to payment collection — Autofy handles it all.
          </p>
        </motion.div>
      </div>

      {isDesktop ? (
        /* Desktop: horizontal scroll */
        <div style={{ height: "350vh" }}>
          <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden",
            display: "flex", alignItems: "center" }}>
            <motion.div style={{ x, display: "flex", gap: 24, paddingLeft: 80, paddingRight: 200 }}>
              {FEATURES.map((f, i) => (
                <FeatureCard key={i} feature={f} index={i} />
              ))}
            </motion.div>
          </div>
        </div>
      ) : (
        /* Mobile: vertical stack */
        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          style={{ display: "flex", flexDirection: "column", gap: 20, padding: "0 20px 80px", maxWidth: 400, margin: "0 auto" }}>
          {FEATURES.map((f, i) => (
            <FeatureCard key={i} feature={f} index={i} />
          ))}
        </motion.div>
      )}
    </section>
  );
}

// ════════════════════════════════════════════════════════════
// HOW IT WORKS
// ════════════════════════════════════════════════════════════
const STEPS = [
  { num: 1, title: "Connect WhatsApp", desc: "Link your WhatsApp Business number in 2 minutes. No coding required.", color: "#8B5CF6", icon: <Zap size={20} /> },
  { num: 2, title: "Train Your AI", desc: "Upload your services, pricing, and FAQs. The AI learns your business instantly.", color: "#3B82F6", icon: <BookOpen size={20} /> },
  { num: 3, title: "Watch It Work", desc: "Your AI starts replying, capturing leads, and collecting payments — automatically.", color: "#10B981", icon: <Check size={20} /> },
];

function HowItWorksSection() {
  return (
    <section id="howitworks" style={{ background: "var(--bg-2)", padding: "120px 0", position: "relative" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}
          style={{ textAlign: "center", marginBottom: 72 }}>
          <span className="section-label text-gradient-primary">HOW IT WORKS</span>
          <h2 className="section-h2">Setup in <span className="text-gradient-primary">3 Simple Steps</span></h2>
        </motion.div>

        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 32, position: "relative" }}>
          {STEPS.map((step, i) => (
            <motion.div key={i} variants={fadeUp} style={{
              padding: 32, borderRadius: 20,
              background: "var(--bg-card)", border: "1px solid var(--border)",
              textAlign: "center", position: "relative",
            }}>
              {/* Step number */}
              <div style={{
                width: 56, height: 56, borderRadius: "50%", margin: "0 auto 20px",
                background: `${step.color}15`, border: `2px solid ${step.color}40`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: step.color, fontSize: 22, fontWeight: 900,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}>
                {step.num}
              </div>

              {/* Connecting line (not on last step) */}
              {i < STEPS.length - 1 && (
                <div className="hide-mobile" style={{
                  position: "absolute", top: 52, right: -16, width: 32, height: 2,
                  background: `linear-gradient(90deg, ${step.color}40, ${STEPS[i + 1].color}40)`,
                }} />
              )}

              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: "var(--text)",
                fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{step.title}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-muted)" }}>{step.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════
// PRICING SECTION
// ════════════════════════════════════════════════════════════
function PricingSection() {
  const navigate = useNavigate();
  const [annual, setAnnual] = useState(true);

  const features = [
    "Unlimited WhatsApp Automation & AI Replies",
    "24/7 Autonomous AI Employee Engine",
    "Instant Live RAG Knowledge Base Indexing",
    "Automated Appointment Booking & Reminders",
    "UPI & Online Payment Links Collection",
    "Lead CRM Capture & Inbox Management",
    "VIP Priority Customer Support",
  ];

  return (
    <section id="pricing" style={{ background: "var(--bg)", padding: "120px 0", position: "relative" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 32px" }}>
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}
          style={{ textAlign: "center", marginBottom: 40 }}>
          <span className="section-label text-gradient-primary">PRICING</span>
          <h2 className="section-h2">Everything you need to <span className="text-gradient-primary">automate your business.</span></h2>
          <p style={{ color: "var(--text-muted)", fontSize: 15, marginTop: 8 }}>
            Autofy Pro includes complete AI automation with zero feature lockouts.
          </p>
        </motion.div>

        {/* Billing Toggle */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 40 }}>
          <div style={{ display: "flex", background: "var(--input-bg)", borderRadius: 100, padding: 4, border: "1px solid var(--border)", gap: 4 }}>
            <button onClick={() => setAnnual(false)} style={{
              padding: "10px 24px", borderRadius: 100, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 700,
              background: !annual ? "var(--brand)" : "transparent",
              color: !annual ? "#fff" : "var(--text-muted)",
              transition: "all 0.2s ease"
            }}>MONTHLY</button>
            <button onClick={() => setAnnual(true)} style={{
              padding: "10px 24px", borderRadius: 100, border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 8,
              background: annual ? "var(--brand)" : "transparent",
              color: annual ? "#fff" : "var(--text-muted)",
              transition: "all 0.2s ease"
            }}>
              <span>YEARLY</span>
              <span style={{ fontSize: 10, background: "rgba(251,191,36,0.2)", color: "#FBBF24",
                padding: "2px 8px", borderRadius: 100, fontWeight: 800 }}>SAVE ~25%</span>
            </button>
          </div>
        </div>

        {/* Autofy Pro Card */}
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}
          className="gradient-border"
          style={{
            borderRadius: 28,
            background: "var(--bg-card)",
            padding: "40px",
            position: "relative",
            maxWidth: 800,
            margin: "0 auto"
          }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyBetween: "space-between", alignItems: "flex-end", gap: 24, paddingBottom: 28, borderBottom: "1px solid var(--border)" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#8B5CF6", background: "rgba(139,92,246,0.1)", padding: "4px 12px", borderRadius: 100 }}>
                  Autofy Pro
                </span>
                {annual && (
                  <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#10B981", background: "rgba(16,185,129,0.1)", padding: "4px 12px", borderRadius: 100 }}>
                    Best Value
                  </span>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span className="text-gradient-primary" style={{ fontSize: 48, fontWeight: 900, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {annual ? "₹6,899" : "₹699"}
                </span>
                <span style={{ fontSize: 15, color: "var(--text-muted)", fontWeight: 600 }}>
                  /{annual ? "year" : "month"}
                </span>
              </div>

              {annual ? (
                <div style={{ fontSize: 13, color: "#10B981", fontWeight: 600, marginTop: 4 }}>
                  Save ₹1,499 every year (~₹575/month equivalent)
                </div>
              ) : (
                <div style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500, marginTop: 4 }}>
                  Full AI automation with monthly flexibility.
                </div>
              )}
            </div>

            <div style={{ background: "rgba(0,0,0,0.3)", padding: "14px 20px", borderRadius: 16, border: "1px solid rgba(139,92,246,0.2)" }}>
              <div style={{ color: "#FBBF24", fontSize: 12, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
                <span>{annual ? "14-DAY FREE TRIAL" : "7-DAY FREE TRIAL"}</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace", marginTop: 2 }}>
                Start free today.
              </div>
            </div>
          </div>

          {/* Disclosure */}
          <div style={{ margin: "24px 0", padding: 16, borderRadius: 16, background: "rgba(24,24,27,0.6)", border: "1px solid rgba(39,39,42,0.8)", fontSize: 12, color: "#D4D4D8", fontFamily: "monospace" }}>
            <div style={{ fontWeight: 700, color: "#fff", marginBottom: 6 }}>Automatic Billing Disclosure</div>
            {annual ? (
              <>
                <div>• <strong>Start free today. You won't be charged today.</strong></div>
                <div>• After your 14-day free trial, <strong>₹6,899/year</strong> will automatically renew until cancelled.</div>
              </>
            ) : (
              <>
                <div>• <strong>Start free today. You won't be charged today.</strong></div>
                <div>• After your 7-day free trial, <strong>₹699/month</strong> will automatically renew until cancelled.</div>
              </>
            )}
          </div>

          {/* Features */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 16, letterSpacing: "0.05em" }}>
              Everything included in Autofy Pro
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
              {features.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--text)", background: "var(--input-bg)", padding: "10px 14px", borderRadius: 12, border: "1px solid var(--border)" }}>
                  <Check size={16} style={{ color: "#8B5CF6", flexShrink: 0 }} />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div style={{ textAlign: "center" }}>
            <MagneticButton
              onClick={() => navigate("/signup")}
              className="btn-primary"
              style={{ width: "100%", padding: "16px", fontSize: 15, justifyContent: "center" }}
            >
              {annual ? "Start 14-Day Free Trial" : "Start 7-Day Free Trial"} <ChevronRight size={18} />
            </MagneticButton>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginTop: 10 }}>No charge today</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Cancel anytime before your trial ends to avoid the charge.</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════
// TESTIMONIALS
// ════════════════════════════════════════════════════════════
const TESTIMONIALS = [
  { name: "Rajesh Kumar", role: "Owner, Elite Fitness Gym", quote: "Autofy reduced our response time from 2 hours to 0.3 seconds. Our lead conversion went up 340% in the first month.",
    stars: 5, color: "#8B5CF6" },
  { name: "Priya Sharma", role: "Director, Glow Salon & Spa", quote: "We stopped missing customer messages at night. Autofy handles bookings, answers pricing questions, and even collects deposits — all automatically.",
    stars: 5, color: "#3B82F6" },
  { name: "Dr. Ankit Mehta", role: "Founder, HealthFirst Clinic", quote: "The AI knows our entire service menu, insurance policies, and booking rules. Patients love the instant responses on WhatsApp.",
    stars: 5, color: "#10B981" },
];

function TestimonialsSection() {
  return (
    <section style={{ background: "var(--bg-2)", padding: "120px 0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}
          style={{ textAlign: "center", marginBottom: 60 }}>
          <span className="section-label text-gradient-primary">TESTIMONIALS</span>
          <h2 className="section-h2">Loved by <span className="text-gradient-primary">Business Owners</span></h2>
        </motion.div>

        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
          {TESTIMONIALS.map((t, i) => (
            <motion.div key={i} variants={fadeUp} style={{
              padding: 28, borderRadius: 20,
              background: "var(--bg-card)", border: "1px solid var(--border)",
              borderLeft: `3px solid ${t.color}`,
              position: "relative",
            }}>
              {/* Quote mark */}
              <div style={{ position: "absolute", top: 16, right: 20, fontSize: 48,
                fontFamily: "serif", color: t.color, opacity: 0.12, lineHeight: 1 }}>"</div>

              {/* Stars */}
              <div style={{ display: "flex", gap: 3, marginBottom: 16 }}>
                {Array.from({ length: t.stars }).map((_, j) => (
                  <Star key={j} size={14} fill="#F59E0B" color="#F59E0B" />
                ))}
              </div>

              <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text-muted)", marginBottom: 20,
                fontStyle: "italic" }}>"{t.quote}"</p>

              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{t.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-subtle)" }}>{t.role}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════
// FINAL CTA
// ════════════════════════════════════════════════════════════
function CTASection() {
  const navigate = useNavigate();
  return (
    <section style={{ padding: "120px 0", background: "var(--bg)", position: "relative", overflow: "hidden" }}>
      {/* Background orb */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)",
        pointerEvents: "none" }} />
      <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
        style={{ textAlign: "center", position: "relative", zIndex: 1, maxWidth: 600, margin: "0 auto", padding: "0 32px" }}>
        <h2 className="section-h2" style={{ marginBottom: 16 }}>
          Start Your <span className="text-gradient-primary">14-Day Free Trial</span>
        </h2>
        <p className="body-large" style={{ marginBottom: 36 }}>
          No credit card required. Set up in 5 minutes. Cancel anytime.
        </p>
        <MagneticButton onClick={() => navigate("/signup")} className="btn-primary"
          >Get Started Free <ArrowRight size={16} /></MagneticButton>
      </motion.div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════
// FOOTER
// ════════════════════════════════════════════════════════════
function Footer() {
  const navigate = useNavigate();
  const footerLinks = {
    Product: ["Features", "Pricing", "Integrations", "API Docs"],
    Company: ["About", "Blog", "Careers", "Contact"],
    Resources: ["Documentation", "Help Center", "Status", "Terms"],
    "For Business": ["Gyms", "Clinics", "Salons", "Restaurants"],
  };

  return (
    <footer style={{ background: "var(--bg-elevated)", borderTop: "1px solid var(--border)", padding: "60px 0 32px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr repeat(4, 1fr)", gap: 40, marginBottom: 48 }}
          className="footer-grid">
          {/* Brand */}
          <div>
            <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: "var(--brand-subtle)",
                border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Logo size={20} />
              </div>
              <span className="text-gradient-primary" style={{ fontSize: 20, fontWeight: 800,
                fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Autofy</span>
            </Link>
            <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 260 }}>
              AI-powered WhatsApp automation for Indian businesses. Turn every chat into a customer.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em",
                textTransform: "uppercase", color: "var(--text)", marginBottom: 16 }}>{title}</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {links.map(link => (
                  <button key={link} onClick={() => {}} style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: 13, color: "var(--text-muted)", textAlign: "left",
                    transition: "color 0.15s", padding: 0,
                  }}
                    onMouseEnter={e => (e.currentTarget.style.color = "var(--brand)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
                  >{link}</button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 24,
          display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <p style={{ fontSize: 12, color: "var(--text-subtle)" }}>© {new Date().getFullYear()} Autofy Technologies Pvt. Ltd.</p>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <Link to="/privacy-policy" style={{ fontSize: 12, color: "var(--text-muted)", textDecoration: "none", fontWeight: 600 }}>Privacy Policy</Link>
            <Link to="/terms-of-service" style={{ fontSize: 12, color: "var(--text-muted)", textDecoration: "none", fontWeight: 600 }}>Terms of Service</Link>
            <Link to="/refund" style={{ fontSize: 12, color: "var(--text-muted)", textDecoration: "none", fontWeight: 600 }}>Refund Policy</Link>
            <Link to="/contact" style={{ fontSize: 12, color: "var(--text-muted)", textDecoration: "none", fontWeight: 600 }}>Contact Us</Link>
            <span style={{ fontSize: 12, color: "var(--text-subtle)" }}>Made with care in India</span>
          </div>
        </div>
      </div>
      <style>{`
        @media(max-width:768px) {
          .footer-grid { grid-template-columns: 1fr 1fr !important; gap: 32px !important; }
        }
      `}</style>
    </footer>
  );
}

// ════════════════════════════════════════════════════════════
// LANDING PAGE — composed of all sections
// ════════════════════════════════════════════════════════════
function LandingPage() {
  const [scroll, setScroll] = useState(0);
  useEffect(() => {
    const fn = () => setScroll(window.scrollY);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => { document.title = "Autofy — WhatsApp Business Automation Platform"; }, []);

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", minHeight: "100vh", fontFamily: "'Inter',sans-serif" }}>
      <div className="noise-overlay" />
      <div className="scroll-progress-bar" style={{ transform: `scaleX(${Math.min(scroll / 4000, 1)})` }} />
      <Navbar />
      <Hero />
      <LiveDemoSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// LOGIN/SIGNUP PAGE WRAPPERS (for React Router)
// ════════════════════════════════════════════════════════════
function LoginPage() {
  const navigate = useNavigate();
  useEffect(() => { document.title = "Autofy — Sign In"; }, []);
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <LoginView
        // The JWT is stored by signInWithEmail before onSuccess fires.
        onSuccess={() => navigate("/dashboard")}
        onNavigateToSignUp={() => navigate("/signup")}
        onBackToHome={() => navigate("/")}
        onGoToDashboard={() => navigate("/dashboard")}
      />
    </div>
  );
}

function SignUpPage() {
  const navigate = useNavigate();
  useEffect(() => { document.title = "Autofy — Create Account"; }, []);
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <SignUpView
        // The JWT is stored by signUpWithEmail before onSuccess fires.
        onSuccess={() => navigate("/onboarding")}
        onNavigateToLogin={() => navigate("/login")}
        onBackToHome={() => navigate("/")}
        onGoToDashboard={() => navigate("/dashboard")}
      />
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// OAUTH CALLBACK — lands here after Google redirects back with the token
// ════════════════════════════════════════════════════════════
function OAuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const fullUrl = window.location.href;
    console.info(`[OAuth Frontend] callback URL received: ${fullUrl}`);

    // Parse parameters from both hash fragment and search query string
    let hashClean = window.location.hash.replace(/^#\/?/, "");
    // If hash contains a nested query (e.g. #/auth/callback?access_token=...), extract query
    if (hashClean.includes("?")) {
      hashClean = hashClean.split("?")[1] || "";
    }
    const hashParams = new URLSearchParams(hashClean);
    const searchParams = new URLSearchParams(window.location.search);

    const accessToken = hashParams.get("access_token") || searchParams.get("access_token");
    const userId = hashParams.get("user_id") || searchParams.get("user_id") || "";
    const businessId = hashParams.get("business_id") || searchParams.get("business_id") || "";
    const role = hashParams.get("role") || searchParams.get("role") || "";
    const email = hashParams.get("email") || searchParams.get("email") || "";
    const name = hashParams.get("name") || searchParams.get("name") || "";
    const isOnboardedParam = hashParams.get("is_onboarded") || searchParams.get("is_onboarded");
    const authError = hashParams.get("auth_error") || searchParams.get("auth_error");

    const tokenDetected = Boolean(accessToken);
    console.info(`[OAuth Frontend] token detected: ${tokenDetected ? "YES" : "NO"}`);

    if (!accessToken) {
      const errorMsg = authError || "No authentication token was received from Google.";
      console.warn(`[OAuth Frontend] token detected: NO. Redirecting to /login with error: ${errorMsg}`);
      navigate(`/login#auth_error=${encodeURIComponent(errorMsg)}`, { replace: true });
      return;
    }

    // 1. Establish session across storage layers (localStorage, sessionStorage, cookie, memory)
    const user = completeOAuthLogin({
      access_token: accessToken,
      user_id: userId,
      business_id: businessId,
      role: role,
      email: email,
      name: name,
    });
    console.info(`[OAuth Frontend] token saved: YES (user_id=${user.id}, business_id=${user.business_id})`);

    // 2. Fetch fresh /api/v1/auth/me to verify server-side session and onboarding status
    (async () => {
      let resolvedOnboarded = isOnboardedParam === "true";
      try {
        const me = await api.get<{
          user_id: string;
          name: string;
          email: string;
          role: string;
          is_onboarded: boolean;
          business?: { id: string; name: string; is_onboarded: boolean };
        }>("/api/v1/auth/me");
        console.info("[OAuth Frontend] /auth/me response: SUCCESS", me);
        if (typeof me?.is_onboarded === "boolean") {
          resolvedOnboarded = me.is_onboarded;
        } else if (typeof me?.business?.is_onboarded === "boolean") {
          resolvedOnboarded = me.business.is_onboarded;
        }
      } catch (meErr) {
        console.warn("[OAuth Frontend] /auth/me call error (falling back to token payload):", meErr);
      }

      try {
        sessionStorage.setItem(
          "autofy_onboarded_state",
          JSON.stringify({ is_onboarded: resolvedOnboarded, timestamp: Date.now() })
        );
      } catch {}

      // 3. Final navigation
      const destination = resolvedOnboarded ? "/dashboard" : "/onboarding";
      console.info(`[OAuth Frontend] final redirect destination: ${destination}`);
      navigate(destination, { replace: true });
    })();
  }, [navigate]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          border: "3px solid var(--border)",
          borderTopColor: "var(--brand)",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <p style={{ color: "var(--text-muted)", fontSize: "14px", fontWeight: 600 }}>
        Authenticating & launching Autofy OS...
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// MAIN APP — React Router
// ════════════════════════════════════════════════════════════
export default function App() {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem("autofy-user");
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  });

  // Track active authenticated business_id
  const businessId = currentUser?.business_id;

  const [onboardingData, setOnboardingData] = useState<OnboardingData>(() => {
    return loadTenantOnboardingData(businessId);
  });

  // Preload Razorpay checkout SDK in background on mount
  useEffect(() => {
    loadRazorpayScript().catch(() => {});
  }, []);

  // Listen to auth events (sign in, completeOAuthLogin, sign out)
  useEffect(() => {
    const { data: { subscription } } = onAuthStateChange((_event, session) => {
      const authSession = session as { user: AuthUser } | null;
      setCurrentUser(authSession?.user ?? null);
      if (authSession?.user?.business_id) {
        setOnboardingData(loadTenantOnboardingData(authSession.user.business_id));
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Re-sync user session & re-hydrate tenant-scoped onboarding draft on route change or business switch
  useEffect(() => {
    purgeLegacyOnboardingKeys();
    getCurrentUser().then(({ user }) => {
      setCurrentUser(user);
      const activeBiz = user?.business_id;
      const dataForBiz = loadTenantOnboardingData(activeBiz);
      setOnboardingData(dataForBiz);
    });
  }, [location.pathname]);

  // Persist onboarding draft strictly under autofy-onboarding-data:<business_id>
  useEffect(() => {
    if (businessId) {
      saveTenantOnboardingData(businessId, onboardingData);
    }
  }, [businessId, onboardingData]);

  const handleFinishOnboarding = async (d: OnboardingData) => {
    // MUST persist completion to backend before navigating.
    // Without this, is_onboarded stays false in the DB and ProtectedRoute
    // redirects the user back to /onboarding (infinite loop).
    try {
      await api.post("/api/v1/business/complete-onboarding", {
        name: d.businessName || "My Business",
        classification: d.industryType || "Other",
        phone: d.phoneNumber || "N/A",
        website: d.website || undefined,
        address: d.address || undefined,
      });
    } catch (err) {
      // If the API fails (e.g. missing required fields), log but still
      // attempt to navigate — a lenient fallback is better than a hard block.
      console.warn("[Onboarding] complete-onboarding API call failed:", err);
    }
    clearTenantOnboardingData(businessId);
    setOnboardingData(INITIAL_ONBOARDING_DATA);
    window.location.href = "/dashboard";
  };

  return (
    <ErrorBoundary>
      <CursorGlow />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/auth/callback" element={<OAuthCallback />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/cancellation-policy" element={<RefundPolicy />} />
        <Route path="/refund" element={<RefundPolicy />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/contact-us" element={<ContactUs />} />
        <Route path="/account-deletion" element={<PublicAccountDeletionPage />} />
        <Route path="/onboarding" element={
          <ProtectedRoute requireUnonboarded>
            <OnboardingWizard
              initialData={onboardingData}
              onComplete={handleFinishOnboarding}
              onOpenDashboard={handleFinishOnboarding}
              onTestAssistant={handleFinishOnboarding}
              onBackToHome={() => { window.location.href = "/"; }}
            />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/*" element={
          <ProtectedRoute requireOnboarded>
            <Dashboard
              onboardingData={onboardingData}
              activeTab="overview"
              onLogout={() => {
                signOut().finally(() => { window.location.href = "/"; });
              }}
              onOpenTestSimulator={() => {}}
              setActiveTab={() => {}}
            />
          </ProtectedRoute>
        } />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  );
}
