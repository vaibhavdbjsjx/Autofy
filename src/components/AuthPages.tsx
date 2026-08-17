import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "./Logo";
import {
  Mail, Lock, User, Briefcase, ArrowRight,
  Eye, EyeOff, AlertCircle, CheckCircle, XCircle, ChevronLeft,
  Loader2, Target, CreditCard, Zap, Bot
} from "lucide-react";
import { signUpWithEmail, signInWithEmail, signInWithGoogle, signInWithApple } from "../lib/auth";
import { sendWelcomeEmail } from "../lib/emailService";

// ─── GOOGLE & APPLE LOGO SVGs ───────────────────────────────────────────
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style={{ marginRight: 8 }}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const AppleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 8 }}>
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.66-.8 1.11-1.92.99-3.04-.96.04-2.12.64-2.8 1.44-.6.7-1.13 1.84-.99 2.95 1.07.08 2.14-.55 2.8-1.35z"/>
  </svg>
);

// ─── VALIDATION HELPERS ────────────────────────────────────────
const validateEmail = (val: string) => {
  const trimmed = val.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
};

const getPasswordStrength = (val: string) => {
  if (!val) return { score: 0, label: "", color: "transparent", pct: 0 };
  if (val.length < 8) {
    return { score: 0, label: "Must be at least 8 characters", color: "var(--danger)", pct: 15 };
  }
  let score = 1;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;

  if (score <= 1) return { score, label: "Weak", color: "var(--danger)", pct: 30 };
  if (score <= 3) return { score, label: "Medium", color: "var(--warning)", pct: 65 };
  return { score, label: "Strong", color: "var(--success)", pct: 100 };
};

// ─── FLOATING EVENT CARD ───────────────────────────────────────
function FloatingEventCard({ icon, text, delay, duration = 3.5, yRange = -15 }: {
  icon: React.ReactNode; text: string; delay: number; duration?: number; yRange?: number;
}) {
  return (
    <motion.div
      animate={{ y: [0, yRange, 0] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut", delay }}
      className="glass"
      style={{
        padding: "14px 18px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        boxShadow: "0 8px 32px var(--shadow)",
        minWidth: 260,
      }}
    >
      <div style={{ flexShrink: 0 }}>{icon}</div>
      <span style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF" }}>{text}</span>
    </motion.div>
  );
}

// ─── DESKTOP RIGHT VISUAL PANEL ───────────────────────────────
function VisualPanel() {
  return (
    <div style={{
      position: "relative",
      width: "100%",
      height: "100%",
      background: "linear-gradient(135deg, #0D0B1E 0%, #1A0A3D 50%, #07070F 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    }}>
      {/* Background Center Orb */}
      <div style={{
        position: "absolute",
        width: 350,
        height: 350,
        borderRadius: "50%",
        background: "radial-gradient(circle, var(--brand) 0%, transparent 70%)",
        filter: "blur(60px)",
        opacity: 0.2,
        pointerEvents: "none",
      }} />

      {/* Floating Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20, zIndex: 1, marginBottom: 40 }}>
        <FloatingEventCard
          icon={<Target size={18} style={{ color: "#8B5CF6" }} />}
          text=" New Lead captured via WhatsApp AI"
          delay={0}
          duration={3.5}
          yRange={-15}
        />
        <FloatingEventCard
          icon={<CreditCard size={18} style={{ color: "#22C55E" }} />}
          text=" Razorpay Subscription Mandate verified"
          delay={1}
          duration={4.2}
          yRange={-12}
        />
        <FloatingEventCard
          icon={<Zap size={18} style={{ color: "#F59E0B" }} />}
          text=" AI replied in 0.28s — 98% confidence"
          delay={0.5}
          duration={3.8}
          yRange={-18}
        />
      </div>

      {/* Honest tagline (no fabricated user counts / avatars) */}
      <div style={{ zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.6)", textAlign: "center", maxWidth: 300 }}>
          Automate customer chats, capture leads, and get paid — right inside WhatsApp.
        </span>
      </div>
    </div>
  );
}

// ─── LOGIN VIEW ───────────────────────────────────────────────
interface LoginProps {
  onSuccess: (email: string) => void;
  onNavigateToSignUp: () => void;
  onBackToHome: () => void;
  onGoToDashboard?: () => void;
}

export const LoginView: React.FC<LoginProps> = ({
  onSuccess,
  onNavigateToSignUp,
  onBackToHome
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Parse any auth_error/error query/hash params on mount (e.g. from Google OAuth callback)
  useEffect(() => {
    try {
      const hashClean = window.location.hash.replace(/^#\/?/, "");
      const hashParams = new URLSearchParams(hashClean.includes("?") ? hashClean.split("?")[1] : hashClean);
      const searchParams = new URLSearchParams(window.location.search);
      const authErr = hashParams.get("detail") || searchParams.get("detail") || hashParams.get("auth_error") || searchParams.get("auth_error");
      const errCode = hashParams.get("error") || searchParams.get("error");
      if (authErr) {
        setError(decodeURIComponent(authErr));
      } else if (errCode === "oauth_failed") {
        setError("Google authentication was cancelled or encountered an error. Please try again.");
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Email Validation State
  const cleanEmail = email.trim();
  const isEmailValid = validateEmail(cleanEmail);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const normalizedEmail = email.trim().toLowerCase();

    if (!validateEmail(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }
    setIsLoading(true);
    const { error: authError } = await signInWithEmail(normalizedEmail, password);
    setIsLoading(false);
    if (authError) {
      setError(authError.message || "Invalid credentials.");
    } else {
      onSuccess(normalizedEmail);
    }
  };

  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingApple, setIsLoadingApple] = useState(false);

  const handleGoogleLogin = async () => {
    setError("");
    setIsLoadingGoogle(true);
    try {
      const { error: authError } = await signInWithGoogle("login");
      if (authError) {
        setError(authError.message || "Google sign in failed.");
        setIsLoadingGoogle(false);
      }
    } catch {
      setIsLoadingGoogle(false);
    }
  };

  const handleAppleLogin = async () => {
    setError("");
    setIsLoadingApple(true);
    try {
      const { error: authError } = await signInWithApple();
      if (authError) {
        setError(authError.message || "Apple sign in failed.");
        setIsLoadingApple(false);
      }
    } catch {
      setIsLoadingApple(false);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "100vh" }} className="auth-split">
      {/* Left Form side */}
      <div style={{
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        position: "relative",
      }}>
        {/* Back Link */}
        <button
          onClick={onBackToHome}
          style={{
            position: "absolute", top: 28, left: 24,
            display: "flex", alignItems: "center", gap: 6,
            background: "none", border: "none", cursor: "pointer",
            color: "var(--text-muted)", fontSize: 14, fontWeight: 600
          }}
        >
          <ChevronLeft size={16} /> Back to Home
        </button>

        <div style={{ width: "100%", maxWidth: 400, marginTop: 40 }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "var(--brand-subtle)", border: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Logo size={22} />
            </div>
            <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text)" }}>Autofy</span>
          </div>

          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.04em", color: "var(--text)", marginBottom: 8 }}>
            Welcome back
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 28 }}>
            Sign in to manage your WhatsApp AI agent.
          </p>

          {error && (
            <div style={{
              padding: "12px 16px", borderRadius: 12,
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
              color: "var(--danger)", fontSize: 13, display: "flex", alignItems: "center", gap: 8,
              marginBottom: 20
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} /> {error}
            </div>
          )}

          <form onSubmit={handleLogin} noValidate style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Email Field */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Email Address</label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <Mail size={16} style={{ position: "absolute", left: 14, color: "var(--text-subtle)" }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="name@business.com"
                  className="input-field"
                  style={{ paddingLeft: 42, paddingRight: 40 }}
                  required
                />
                {cleanEmail && (
                  <span style={{ position: "absolute", right: 14 }}>
                    {isEmailValid ? (
                      <CheckCircle size={16} style={{ color: "var(--success)" }} />
                    ) : (
                      <XCircle size={16} style={{ color: "var(--danger)" }} />
                    )}
                  </span>
                )}
              </div>
            </div>

            {/* Password Field */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Password</label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <Lock size={16} style={{ position: "absolute", left: 14, color: "var(--text-subtle)" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="••••••••"
                  className="input-field"
                  style={{ paddingLeft: 42, paddingRight: 42 }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute", right: 14, background: "none", border: "none",
                    cursor: "pointer", color: "var(--text-subtle)", padding: 0
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={isLoading} className="btn-primary" style={{ width: "100%", marginTop: 8 }}>
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Signing In...
                </>
              ) : (
                <>
                  Sign In <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "24px 0" }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span style={{ fontSize: 12, color: "var(--text-subtle)" }}>or</span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          {/* Social Sign In Stack */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={handleGoogleLogin} disabled={isLoadingGoogle || isLoadingApple || isLoading} className="btn-secondary" style={{ width: "100%" }}>
              {isLoadingGoogle ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Redirecting to Google...
                </>
              ) : (
                <>
                  <GoogleIcon /> Continue with Google
                </>
              )}
            </button>

            <button onClick={handleAppleLogin} disabled={isLoadingApple || isLoadingGoogle || isLoading} className="btn-secondary" style={{ width: "100%" }}>
              {isLoadingApple ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Redirecting to Apple...
                </>
              ) : (
                <>
                  <AppleIcon /> Continue with Apple
                </>
              )}
            </button>
          </div>

          {/* Footer Link */}
          <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "var(--text-muted)" }}>
            Don't have an account?{" "}
            <button
              onClick={onNavigateToSignUp}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--brand)", fontWeight: 700, padding: 0
              }}
            >
              Start free trial <ArrowRight size={14} className="inline ml-0.5" />
            </button>
          </p>
        </div>
      </div>

      {/* Right Visual side */}
      <div className="auth-visual-panel">
        <VisualPanel />
      </div>
    </div>
  );
};

// ─── SIGNUP VIEW ──────────────────────────────────────────────
interface SignUpProps {
  onSuccess: (data: { email: string; businessName: string }) => void;
  onNavigateToLogin: () => void;
  onBackToHome: () => void;
  onGoToDashboard?: () => void;
}

export const SignUpView: React.FC<SignUpProps> = ({
  onSuccess,
  onNavigateToLogin,
  onBackToHome
}) => {
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // App stores (and privacy law) require explicit consent before an account
  // is created. We record that the user agreed to the Privacy Policy + Terms.
  const [agreed, setAgreed] = useState(false);

  // Parse any auth_error query/hash params on mount
  useEffect(() => {
    try {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const searchParams = new URLSearchParams(window.location.search);
      const authErr = hashParams.get("auth_error") || searchParams.get("auth_error");
      if (authErr) {
        setError(decodeURIComponent(authErr));
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Real-time validations
  const cleanEmail = email.trim();
  const isNameValid = fullName.trim().length >= 2;
  const isBusinessValid = businessName.trim().length >= 2;
  const isEmailValid = validateEmail(cleanEmail);
  const strength = getPasswordStrength(password);
  const isPasswordValid = password.length >= 8;

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = fullName.trim();
    const normalizedBusiness = businessName.trim();

    if (normalizedName.length < 2) {
      setError("Please enter your full name.");
      return;
    }
    if (normalizedBusiness.length < 2) {
      setError("Please enter your business name.");
      return;
    }
    if (!validateEmail(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!agreed) {
      setError("Please agree to the Privacy Policy and Terms of Service to continue.");
      return;
    }
    // Persist the consent + timestamp so we have a record the user agreed.
    try {
      localStorage.setItem("autofy-consent", JSON.stringify({ agreed: true, at: new Date().toISOString() }));
    } catch { /* storage unavailable — ignore */ }

    setIsLoading(true);
    const { error: authError } = await signUpWithEmail(normalizedEmail, password, normalizedBusiness, normalizedName);
    setIsLoading(false);

    if (authError) {
      setError(authError.message || "Failed to create account.");
    } else {
      sendWelcomeEmail({
        userEmail: normalizedEmail,
        userName: normalizedName,
        businessName: normalizedBusiness,
      });
      onSuccess({ email: normalizedEmail, businessName: normalizedBusiness });
    }
  };

  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);

  const handleGoogleLogin = async () => {
    setError("");
    if (!agreed) {
      setError("Please agree to the Privacy Policy and Terms of Service to continue.");
      return;
    }
    setIsLoadingGoogle(true);
    try {
      localStorage.setItem("autofy-consent", JSON.stringify({ agreed: true, at: new Date().toISOString() }));
    } catch { /* ignore */ }
    try {
      const { error: authError } = await signInWithGoogle("signup");
      if (authError) {
        setError(authError.message || "Google sign in failed.");
        setIsLoadingGoogle(false);
      }
    } catch {
      setIsLoadingGoogle(false);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "100vh" }} className="auth-split">
      {/* Left Form side */}
      <div style={{
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        position: "relative",
      }}>
        {/* Back Link */}
        <button
          onClick={onBackToHome}
          style={{
            position: "absolute", top: 28, left: 24,
            display: "flex", alignItems: "center", gap: 6,
            background: "none", border: "none", cursor: "pointer",
            color: "var(--text-muted)", fontSize: 14, fontWeight: 600
          }}
        >
          <ChevronLeft size={16} /> Back to Home
        </button>

        <div style={{ width: "100%", maxWidth: 400, marginTop: 40 }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "var(--brand-subtle)", border: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Logo size={22} />
            </div>
            <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text)" }}>Autofy</span>
          </div>

          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.04em", color: "var(--text)", marginBottom: 8 }}>
            Start your free trial
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 28 }}>
            No credit card required. 14-day free trial.
          </p>

          {error && (
            <div style={{
              padding: "12px 16px", borderRadius: 12,
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
              color: "var(--danger)", fontSize: 13, display: "flex", alignItems: "center", gap: 8,
              marginBottom: 20
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} /> {error}
            </div>
          )}

          <form onSubmit={handleSignUp} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Full Name */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Full Name</label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <User size={16} style={{ position: "absolute", left: 14, color: "var(--text-subtle)" }} />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => { setFullName(e.target.value); setError(""); }}
                  placeholder="Karan Sharma"
                  className="input-field"
                  style={{ paddingLeft: 42, paddingRight: 40 }}
                  required
                />
                {fullName && (
                  <span style={{ position: "absolute", right: 14 }}>
                    {isNameValid ? (
                      <CheckCircle size={16} style={{ color: "var(--success)" }} />
                    ) : (
                      <XCircle size={16} style={{ color: "var(--danger)" }} />
                    )}
                  </span>
                )}
              </div>
            </div>

            {/* Business Name */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Business Name</label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <Briefcase size={16} style={{ position: "absolute", left: 14, color: "var(--text-subtle)" }} />
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => { setBusinessName(e.target.value); setError(""); }}
                  placeholder="Ironclad Fitness"
                  className="input-field"
                  style={{ paddingLeft: 42, paddingRight: 40 }}
                  required
                />
                {businessName && (
                  <span style={{ position: "absolute", right: 14 }}>
                    {isBusinessValid ? (
                      <CheckCircle size={16} style={{ color: "var(--success)" }} />
                    ) : (
                      <XCircle size={16} style={{ color: "var(--danger)" }} />
                    )}
                  </span>
                )}
              </div>
            </div>

            {/* Email Address */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Email Address</label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <Mail size={16} style={{ position: "absolute", left: 14, color: "var(--text-subtle)" }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="name@business.com"
                  className="input-field"
                  style={{ paddingLeft: 42, paddingRight: 40 }}
                  required
                />
                {cleanEmail && (
                  <span style={{ position: "absolute", right: 14 }}>
                    {isEmailValid ? (
                      <CheckCircle size={16} style={{ color: "var(--success)" }} />
                    ) : (
                      <XCircle size={16} style={{ color: "var(--danger)" }} />
                    )}
                  </span>
                )}
              </div>
            </div>

            {/* Password */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Password</label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <Lock size={16} style={{ position: "absolute", left: 14, color: "var(--text-subtle)" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  placeholder="••••••••"
                  className="input-field"
                  style={{ paddingLeft: 42, paddingRight: 42 }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute", right: 14, background: "none", border: "none",
                    cursor: "pointer", color: "var(--text-subtle)", padding: 0
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Strength Meter */}
              {password && (
                <div style={{ marginTop: 4 }}>
                  <div style={{ height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden", marginBottom: 4 }}>
                    <div style={{ height: "100%", width: `${strength.pct}%`, background: strength.color, transition: "width 0.3s ease" }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: strength.color }}>
                    Strength: {strength.label}
                  </span>
                </div>
              )}
            </div>

            {/* Privacy Policy + Terms consent — required to create an account */}
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginTop: 4 }}>
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                aria-label="Agree to Privacy Policy and Terms of Service"
                style={{
                  width: 18, height: 18, marginTop: 1, flexShrink: 0, cursor: "pointer",
                  accentColor: "var(--brand)",
                }}
              />
              <span style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--text-muted)" }}>
                I agree to Autofy's{" "}
                <Link to="/privacy" target="_blank" style={{ color: "var(--brand)", fontWeight: 600 }}>Privacy Policy</Link>
                {" "}and{" "}
                <Link to="/terms" target="_blank" style={{ color: "var(--brand)", fontWeight: 600 }}>Terms of Service</Link>.
              </span>
            </label>

            {/* Submit Button — disabled until the user agrees */}
            <button type="submit" disabled={isLoading || !agreed} className="btn-primary" style={{ width: "100%", marginTop: 8, opacity: agreed ? 1 : 0.6 }}>
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Creating Account...
                </>
              ) : (
                <>
                  Create Account <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "20px 0" }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span style={{ fontSize: 12, color: "var(--text-subtle)" }}>or</span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          {/* Google Sign In */}
          <button onClick={handleGoogleLogin} disabled={isLoadingGoogle || isLoading} className="btn-secondary" style={{ width: "100%" }}>
            {isLoadingGoogle ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Redirecting to Google...
              </>
            ) : (
              <>
                <GoogleIcon /> Continue with Google
              </>
            )}
          </button>

          {/* Footer Link */}
          <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "var(--text-muted)" }}>
            Already have an account?{" "}
            <button
              onClick={onNavigateToLogin}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--brand)", fontWeight: 700, padding: 0
              }}
            >
              Sign In <ArrowRight size={14} className="inline ml-0.5" />
            </button>
          </p>
        </div>
      </div>

      {/* Right Visual side */}
      <div className="auth-visual-panel">
        <VisualPanel />
      </div>
    </div>
  );
};
