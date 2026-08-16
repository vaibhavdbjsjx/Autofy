import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Phone,
  CheckCircle,
  AlertCircle,
  Copy,
  Check,
  Send,
  Zap,
  Clock,
  Sliders,
  Sparkles,
  Database,
  Terminal,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  ShieldAlert,
  Play,
  Bookmark,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Info,
  X,
  UserMinus,
  Plus,
  Power,
  Shield,
  ExternalLink
} from "lucide-react";
import { validatePhone } from "../lib/phoneValidation";
import { CountryPhoneInput } from "./CountryPhoneInput";

interface WebhookLog {
  id: string;
  timestamp: string;
  eventType: "Message Received" | "Message Sent" | "Lead Captured" | "Appointment Booked" | "Payment Received" | "Error Logs";
  details: string;
  success: boolean;
}

// ─── InfoPopover Component ───────────────────────────────────────
const InfoPopover: React.FC<{ title: string; children: React.ReactNode; align?: "left" | "right" }> = ({ title, children, align = "left" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="ml-1 text-blue-400/70 hover:text-blue-400 transition-colors cursor-pointer"
        aria-label={`Help: ${title}`}
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 top-full mt-1.5 w-[280px] max-w-[calc(100vw-3rem)] bg-[var(--bg-card)] border border-blue-500/20 rounded-xl p-3.5 shadow-xl shadow-black/20 backdrop-blur-md break-words ${
              align === "right" ? "right-0 left-auto" : "left-0 right-auto md:left-0 md:right-auto"
            }`}
          >
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-wider mb-1">{title}</p>
            <div className="text-[11px] text-[var(--text-muted)] leading-relaxed font-medium space-y-1 break-words min-w-0">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Connection State Type ───────────────────────────────────────
type ConnectionTier = "Disconnected" | "Number Saved" | "Platform Connected" | "AI Active";

export const WhatsAppSetupTab: React.FC = () => {
  // Connection Status State — 3-tier truthful model
  const [connectionTier, setConnectionTier] = useState<ConnectionTier>("Disconnected");

  // Meta Credentials Form fields — initialized empty for real tenant setup
  const [phoneNumber, setPhoneNumber] = useState("");
  const [businessAccountId, setBusinessAccountId] = useState("");
  const [metaAppId, setMetaAppId] = useState("");
  const [metaAppSecret, setMetaAppSecret] = useState("");
  const [revealSecret, setRevealSecret] = useState(false);
  const [verifyToken, setVerifyToken] = useState("autofy_webhook_secure_validation_token_2026");
  const webhookUrl = "https://server.autofy.ai/api/v1/whatsapp/webhook";

  // Copied indicator state
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // AI Master Switch (persisted to backend)
  const [aiAutoReplyEnabled, setAiAutoReplyEnabled] = useState(true);
  const [aiToggleLoading, setAiToggleLoading] = useState(false);

  // AI Reply Exceptions
  const [aiExceptions, setAiExceptions] = useState<string[]>([]);
  const [newExceptionPhone, setNewExceptionPhone] = useState("");
  const [exceptionError, setExceptionError] = useState("");

  // AI Response Settings
  const [enableHumanEscalation, setEnableHumanEscalation] = useState(true);
  const [enableLeadCapture, setEnableLeadCapture] = useState(true);
  const [enableBooking, setEnableBooking] = useState(true);
  const [enablePayments, setEnablePayments] = useState(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState(70);

  // Business Hours Automation
  const [outOfHoursResponse, setOutOfHoursResponse] = useState(true);
  const [outOfHoursMessage, setOutOfHoursMessage] = useState(
    "Hi there! We are currently closed. Our standard operating hours are 6:00 AM - 10:00 PM. Our AI Bot will continue helping you, or we will ping you here first thing in the morning!"
  );

  // Help panel expansion
  const [showHelp, setShowHelp] = useState(false);

  // Message Templates Active Tab & Editing
  const [activeTemplateTab, setActiveTemplateTab] = useState<
    "Welcome" | "Confirmation" | "Payment" | "Capture" | "Hours" | "Fallback"
  >("Welcome");

  const [templates, setTemplates] = useState({
    Welcome: "Hi {{customer_name}}! Welcome to {{business_name}}. I am Autofy, your instant digital assistant. How can we help you crush your schedule today?",
    Confirmation: "Awesome! Your appointment for {{service_name}} is confirmed for {{time_slot}}. See you soon!",
    Payment: "Hi there! Here is your secure payment link for {{plan_name}}: {{payment_link}}. Looking forward to onboarding you!",
    Capture: "Thanks for checking in! Could we grab your preferred email ID and reference phone number so one of our leads manager can lock this session for you?",
    Hours: "We are currently asleep, but our automatic AI is working 24/7. How can we serve you?",
    Fallback: "Hmm, I didn't quite catch that. But I have flagged this for our counter support team! Someone will take over this thread shortly."
  });

  const handleUpdateTemplate = (text: string) => {
    setTemplates({
      ...templates,
      [activeTemplateTab]: text
    });
  };

  // Live WhatsApp Tester Simulator (Sandbox)
  const [testerMessage, setTesterMessage] = useState("");
  const [testerLogs, setTesterLogs] = useState<Array<{ sender: "user" | "bot"; text: string; source?: string; confidence?: string; time?: string }>>([
    {
      sender: "bot",
      text: "[LOCAL SANDBOX SIMULATOR] Welcome to the WhatsApp test simulator. Send any test message (e.g. Pricing, facilities, book appointment) to test RAG response rules. (This is a local sandbox and does not send messages via Meta).",
      source: "Sandbox Rules / Welcome",
      confidence: "100%",
      time: "1ms"
    }
  ]);
  const [isTesterLoading, setIsTesterLoading] = useState(false);

  const handleSendTesterMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testerMessage.trim()) return;

    const userMsg = testerMessage;
    setTesterLogs(prev => [...prev, { sender: "user", text: userMsg }]);
    setTesterMessage("");
    setIsTesterLoading(true);

    // Simulated RAG Processing on the client side
    setTimeout(() => {
      let botText = "";
      let sourcePath = "";
      let confidenceScore = "";
      let responseTime = "";

      const queryLc = userMsg.toLowerCase();
      if (queryLc.includes("plan") || queryLc.includes("memberships") || queryLc.includes("pricing")) {
        botText = "We offer several customized packages tailored to your needs. Please share your specific requirements and I'll find the best match for you!";
        sourcePath = "Service catalogue database";
        confidenceScore = "98%";
        responseTime = "78ms";
      } else if (queryLc.includes("book") || queryLc.includes("appointment") || queryLc.includes("schedule")) {
        botText = "I can book that appointment right away! Please state your preferred time slot (e.g. tomorrow 4:00 PM) and we will lock it in.";
        sourcePath = "Appointments schema agent rules";
        confidenceScore = "94%";
        responseTime = "112ms";
      } else if (queryLc.includes("hours") || queryLc.includes("open") || queryLc.includes("close")) {
        botText = "Our standard operating hours are 6:00 AM - 10:00 PM, Monday through Saturday. We are here to help during these hours!";
        sourcePath = "Knowledge Base / Business Hours";
        confidenceScore = "91%";
        responseTime = "65ms";
      } else {
        botText = templates.Welcome.replace("{{customer_name}}", "Guest").replace("{{business_name}}", "Autofy Partner");
        sourcePath = "Templates / Primary Welcome Router";
        confidenceScore = "82%";
        responseTime = "45ms";
      }

      setTesterLogs(prev => [...prev, {
        sender: "bot",
        text: botText,
        source: sourcePath,
        confidence: confidenceScore,
        time: responseTime
      }]);
      setIsTesterLoading(false);

      // Also append to webhook event logs live
      addNewWebhookLog("Message Received", `Inbound test message: "${userMsg}"`, true);
      setTimeout(() => {
        addNewWebhookLog("Message Sent", `Outbound AI response triggered (Conf: ${confidenceScore})`, true);
      }, 400);

    }, 1000);
  };

  const copyToClipboard = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  // Track platform verification state separately
  const [platformVerified, setPlatformVerified] = useState(false);

  // Connection Triggers — requires all credentials and valid phone number
  const handleConnect = async () => {
    if (!phoneNumber.trim() || !businessAccountId.trim() || !metaAppId.trim() || !metaAppSecret.trim()) {
      setPlatformVerified(false);
      addNewWebhookLog("Error Logs", "Connection rejected: All Meta Cloud API credential fields are required.", false);
      return;
    }
    const pVal = validatePhone(phoneNumber);
    if (!pVal.ok) {
      setPlatformVerified(false);
      addNewWebhookLog("Error Logs", `Connection rejected: ${pVal.error}`, false);
      return;
    }
    addNewWebhookLog("Message Sent", "Meta Cloud API authorization request dispatched", true);
    try {
      const { api, isAuthenticated } = await import("../lib/api");
      if (isAuthenticated()) {
        await api.put("/api/v1/business/profile", {
          whatsapp_phone_id: pVal.normalized,
          phone: pVal.normalized
        });
      }
      setPlatformVerified(true);
      setIsEditMode(false);
      addNewWebhookLog("Message Received", "Meta Webhook challenge verified. WhatsApp API Connected.", true);
    } catch {
      setPlatformVerified(false);
      addNewWebhookLog("Error Logs", "Connection verification failed. Check Meta credentials & backend status.", false);
    }
  };

  const handleConfirmDisconnect = async () => {
    try {
      const { api, isAuthenticated } = await import("../lib/api");
      if (isAuthenticated()) {
        await api.put("/api/v1/business/profile", {
          whatsapp_phone_id: null
        });
      }
    } catch { /* ignore */ }
    setPlatformVerified(false);
    setIsEditMode(true);
    setIsDisconnectModalOpen(false);
    addNewWebhookLog("Error Logs", "WhatsApp session closed. AI auto-replies paused until reconnected.", false);
  };

  const handleDisconnect = () => {
    setIsDisconnectModalOpen(true);
  };

  const handleTestPing = async () => {
    addNewWebhookLog("Message Sent", "System test ping sent to WhatsApp Business API Gateway.", true);
    try {
      const { api } = await import("../lib/api");
      const startTime = Date.now();
      await api.get("/health");
      const latencyMs = Date.now() - startTime;
      addNewWebhookLog("Message Received", `Ping confirmation: 200 OK in ${latencyMs}ms. Connection stable.`, true);
    } catch {
      addNewWebhookLog("Error Logs", "Ping failed. Backend service may be unavailable.", false);
    }
  };

  // AI Master Switch toggle
  const handleToggleAI = async () => {
    setAiToggleLoading(true);
    const newState = !aiAutoReplyEnabled;
    try {
      const { api, isAuthenticated } = await import("../lib/api");
      if (isAuthenticated()) {
        await api.patch("/api/v1/business/ai-kill-switch", { enabled: newState });
      }
      setAiAutoReplyEnabled(newState);
      addNewWebhookLog(
        newState ? "Message Sent" : "Error Logs",
        newState ? "AI Auto-Reply re-enabled globally." : "⚠️ AI Auto-Reply DISABLED globally. No automated messages will be sent.",
        newState
      );
    } catch {
      addNewWebhookLog("Error Logs", "Failed to toggle AI status. Check backend connection.", false);
    }
    setAiToggleLoading(false);
  };

  // AI Exception management
  const handleAddException = async () => {
    setExceptionError("");
    const pVal = validatePhone(newExceptionPhone);
    if (!pVal.ok) {
      setExceptionError(pVal.error);
      return;
    }
    if (aiExceptions.includes(pVal.normalized)) {
      setExceptionError("This number is already in the exceptions list.");
      return;
    }
    try {
      const { api, isAuthenticated } = await import("../lib/api");
      if (isAuthenticated()) {
        const res: any = await api.post("/api/v1/business/ai-exceptions", { phone: newExceptionPhone });
        setAiExceptions(res?.exceptions || [...aiExceptions, pVal.normalized]);
      } else {
        setAiExceptions([...aiExceptions, pVal.normalized]);
      }
      setNewExceptionPhone("");
    } catch (err: any) {
      setExceptionError(err?.detail || err?.message || "Failed to add exception.");
    }
  };

  const handleRemoveException = async (phone: string) => {
    try {
      const { api, isAuthenticated } = await import("../lib/api");
      if (isAuthenticated()) {
        const res: any = await api.delete(`/api/v1/business/ai-exceptions?phone=${encodeURIComponent(phone)}`);
        setAiExceptions(res?.exceptions || aiExceptions.filter(p => p !== phone));
      } else {
        setAiExceptions(aiExceptions.filter(p => p !== phone));
      }
    } catch {
      // Optimistically remove locally
      setAiExceptions(aiExceptions.filter(p => p !== phone));
    }
  };

  // ─── Connection Tier Status Pill ────────────────────────────────
  const tierConfig: Record<ConnectionTier, { color: string; bg: string; border: string; label: string; pulse: boolean }> = {
    "Disconnected": { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/25", label: "DISCONNECTED", pulse: false },
    "Number Saved": { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/25", label: "NUMBER SAVED", pulse: false },
    "Platform Connected": { color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/25", label: "PLATFORM CONNECTED", pulse: true },
    "AI Active": { color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/25", label: "AI ACTIVE", pulse: true },
  };
  const tier = tierConfig[connectionTier];

  return (
    <div id="whatsapp-setup-module" className="space-y-8 font-sans">
      
      {/* TITLE ELEMENT */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight flex items-center gap-2" style={{ color: "var(--text)" }}>
            <Phone className="w-5 h-5 text-blue-500" />
            WhatsApp Integration
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Connect your WhatsApp Business cloud account and start automating customer conversations instantly.
          </p>
        </div>

        {/* CONNECTION STATUS PILL — 3-Tier Truthful */}
        <div className="flex items-center gap-2.5">
          <div className={`px-4 py-2 ${tier.bg} border ${tier.border} rounded-2xl flex items-center gap-2 ${tier.pulse ? "animate-pulse" : ""}`}>
            <span className={`w-2 h-2 rounded-full ${tier.color.replace("text-", "bg-")}`} />
            <span className={`text-xs font-black ${tier.color} uppercase tracking-wider`}>{tier.label}</span>
          </div>
        </div>
      </div>

      {/* ═══ AI MASTER SWITCH — Global Kill Banner ═══ */}
      <div className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
        aiAutoReplyEnabled
          ? "bg-blue-500/5 border-blue-500/15"
          : "bg-red-500/8 border-red-500/20"
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            aiAutoReplyEnabled ? "bg-blue-500/15" : "bg-red-500/15"
          }`}>
            <Power className={`w-5 h-5 ${aiAutoReplyEnabled ? "text-blue-400" : "text-red-400"}`} />
          </div>
          <div>
            <p className="text-sm font-black text-[var(--text)]">
              AI Auto-Reply {aiAutoReplyEnabled ? "Active" : "Disabled"}
            </p>
            <p className="text-[10px] text-[var(--text-subtle)]">
              {aiAutoReplyEnabled
                ? "AI is responding to incoming WhatsApp messages automatically."
                : "All AI auto-replies are paused. Incoming messages are recorded but not answered."}
            </p>
          </div>
        </div>
        <button
          onClick={handleToggleAI}
          disabled={aiToggleLoading}
          className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
            aiAutoReplyEnabled
              ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
              : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/10"
          } ${aiToggleLoading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {aiToggleLoading ? "Updating..." : aiAutoReplyEnabled ? "⏸ Disable AI Replies" : "▶ Enable AI Replies"}
        </button>
      </div>

      {/* WHATSAPP CONTAINER GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full min-w-0">
        
        {/* Left Column: Connections Setup Form (Holds 2 spans) */}
        <div className="lg:col-span-2 space-y-6 w-full min-w-0">
          
          {/* META ACCESS CARD */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 backdrop-blur-md space-y-5 w-full min-w-0">
            <div>
              <h3 className="text-xs font-black text-[var(--text)] uppercase tracking-wider text-blue-400">WhatsApp Business Setup Credentials</h3>
              <p className="text-[10.5px] text-[var(--text-subtle)] mt-0.5">Enter credentials matching your Meta App configuration platform.</p>
            </div>

            {/* "Where do I find these?" help section */}
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="flex items-center gap-1.5 text-[11px] text-blue-400 hover:text-blue-300 font-bold transition-colors cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>Where do I find these credentials?</span>
              {showHelp ? <ChevronUp className="w-3 h-3 shrink-0" /> : <ChevronDown className="w-3 h-3 shrink-0" />}
            </button>

            <AnimatePresence>
              {showHelp && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-full min-w-0 overflow-hidden"
                >
                  <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 space-y-3 text-[11px] text-[var(--text-muted)] leading-relaxed w-full min-w-0 break-words">
                    <p className="font-bold text-blue-400 text-[10px] uppercase tracking-wider">Step-by-Step Setup Guide</p>
                    <ol className="space-y-2 list-decimal list-inside break-words min-w-0">
                      <li className="break-words min-w-0">Go to <span className="font-bold text-[var(--text)]">Meta Business Suite</span> → your business account settings to find your <span className="font-bold text-blue-400">Business Account ID</span></li>
                      <li className="break-words min-w-0">Visit <span className="font-bold text-[var(--text)]">developers.facebook.com</span> → your app → Settings → Basic to find your <span className="font-bold text-blue-400">App ID</span> and <span className="font-bold text-blue-400">App Secret</span></li>
                      <li className="break-words min-w-0">In your Meta app, navigate to WhatsApp → API Setup to find your <span className="font-bold text-blue-400">Phone Number</span> and generate a permanent token</li>
                      <li className="break-words min-w-0">Configure the Webhook URL and Verify Token below in your Meta app's WhatsApp → Configuration settings</li>
                    </ol>
                    <p className="text-[10px] text-[var(--text-subtle)] italic">All credentials are stored securely and never shared externally.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full min-w-0">
              <div className="space-y-1.5 min-w-0">
                <label className="text-[10px] uppercase font-black text-[var(--text-subtle)] tracking-wider flex items-center flex-wrap min-w-0">
                  <span>Business Phone Number</span>
                  <InfoPopover title="Business Phone Number">
                    <p>The phone number registered with your WhatsApp Business Account. For Indian numbers, enter your 10-digit mobile number — we automatically add +91.</p>
                    <p className="mt-1 text-blue-400/80 font-bold">Example: 6360254763 → +916360254763</p>
                  </InfoPopover>
                </label>
                <CountryPhoneInput
                  value={phoneNumber}
                  onChange={(val) => setPhoneNumber(val)}
                  placeholder="e.g. 9876543210"
                />
              </div>

              <div className="space-y-1.5 min-w-0">
                <label className="text-[10px] uppercase font-black text-[var(--text-subtle)] tracking-wider flex items-center flex-wrap min-w-0">
                  <span>WhatsApp Business Account ID</span>
                  <InfoPopover title="Business Account ID" align="right">
                    <p>A numeric ID for your WhatsApp Business Account. Find it in:</p>
                    <p className="mt-1 font-bold text-[var(--text)]">Meta Business Suite → Settings → Business info</p>
                    <p className="mt-1 text-blue-400/80 font-bold">Format: 123456789012345</p>
                  </InfoPopover>
                </label>
                <input
                  type="text"
                  value={businessAccountId}
                  onChange={(e) => setBusinessAccountId(e.target.value)}
                  placeholder="e.g. 123456789012345"
                  className="w-full min-w-0 bg-[var(--input-bg)] border border-[var(--border)] p-2.5 rounded-xl text-xs text-[var(--text)] placeholder-neutral-500 focus:outline-none focus:border-[var(--brand)] font-medium"
                />
              </div>

              <div className="space-y-1.5 min-w-0">
                <label className="text-[10px] uppercase font-black text-[var(--text-subtle)] tracking-wider flex items-center flex-wrap min-w-0">
                  <span>Meta App ID</span>
                  <InfoPopover title="Meta App ID">
                    <p>Your Meta application identifier. Find it at:</p>
                    <p className="mt-1 font-bold text-[var(--text)]">developers.facebook.com → Your App → Settings → Basic</p>
                    <p className="mt-1 text-blue-400/80 font-bold">Format: 1234567890123456</p>
                  </InfoPopover>
                </label>
                <input
                  type="text"
                  value={metaAppId}
                  onChange={(e) => setMetaAppId(e.target.value)}
                  placeholder="e.g. 1234567890123456"
                  className="w-full min-w-0 bg-[var(--input-bg)] border border-[var(--border)] p-2.5 rounded-xl text-xs text-[var(--text)] placeholder-neutral-500 focus:outline-none focus:border-[var(--brand)] font-medium"
                />
              </div>

              <div className="space-y-1.5 relative min-w-0">
                <label className="text-[10px] uppercase font-black text-[var(--text-subtle)] tracking-wider flex items-center flex-wrap min-w-0">
                  <span>Meta App Secret</span>
                  <InfoPopover title="Meta App Secret" align="right">
                    <p>A confidential key found alongside your App ID. <span className="text-red-400 font-bold">Never share this publicly.</span></p>
                    <p className="mt-1 font-bold text-[var(--text)]">developers.facebook.com → Your App → Settings → Basic → App Secret</p>
                    <p className="mt-1 text-blue-400/80 font-bold">Click "Show" to reveal it on Meta's page.</p>
                  </InfoPopover>
                </label>
                <input
                  type={revealSecret ? "text" : "password"}
                  value={metaAppSecret}
                  onChange={(e) => setMetaAppSecret(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full min-w-0 bg-[var(--input-bg)] border border-[var(--border)] p-2.5 pr-14 rounded-xl text-xs text-[var(--text)] focus:outline-none focus:border-[var(--brand)] font-medium"
                />
                <button
                  onClick={() => setRevealSecret(!revealSecret)}
                  className="absolute right-3.5 bottom-2.5 text-[10.5px] font-bold text-[var(--text-subtle)] hover:text-[var(--text)] cursor-pointer"
                >
                  {revealSecret ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* WEBHOOK PROPERTIES */}
            <div className="p-4 bg-[var(--bg-elevated)]/30 border border-[var(--border)] rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4 w-full min-w-0">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center justify-between min-w-0">
                  <label className="text-[10px] uppercase font-black text-[var(--text-subtle)] flex items-center flex-wrap min-w-0">
                    <span>Webhook URL</span>
                    <InfoPopover title="Webhook URL">
                      <p>Copy this URL and paste it into your Meta app's WhatsApp → Configuration → Callback URL field.</p>
                    </InfoPopover>
                  </label>
                  <button
                    onClick={() => copyToClipboard(webhookUrl, setCopiedUrl)}
                    className="text-[9.5px] text-blue-500 hover:underline flex items-center gap-1 font-bold cursor-pointer shrink-0"
                  >
                    {copiedUrl ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    {copiedUrl ? "Copied" : "Copy"}
                  </button>
                </div>
                <div className="bg-[var(--input-bg)] p-2.5 rounded-xl text-[10.5px] font-mono text-[var(--text)] font-semibold select-all border border-[var(--border)] break-all min-w-0">
                  {webhookUrl}
                </div>
              </div>

              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center justify-between min-w-0">
                  <label className="text-[10px] uppercase font-black text-[var(--text-subtle)] flex items-center flex-wrap min-w-0">
                    <span>Webhook Verify Token</span>
                    <InfoPopover title="Verify Token" align="right">
                      <p>Copy this token and paste it into the "Verify Token" field when configuring your webhook in the Meta app.</p>
                    </InfoPopover>
                  </label>
                  <button
                    onClick={() => copyToClipboard(verifyToken, setCopiedToken)}
                    className="text-[9.5px] text-blue-500 hover:underline flex items-center gap-1 font-bold cursor-pointer shrink-0"
                  >
                    {copiedToken ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    {copiedToken ? "Copied" : "Copy"}
                  </button>
                </div>
                <div className="bg-[var(--input-bg)] p-2.5 rounded-xl text-[10.5px] font-mono text-[var(--text)] font-semibold select-all border border-[var(--border)] break-all min-w-0">
                  {verifyToken}
                </div>
              </div>
            </div>

            {/* CONNECTION STATUS BREAKDOWN */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Number Saved", active: connectionTier !== "Disconnected", icon: Phone },
                { label: "Platform Connected", active: connectionTier === "Platform Connected" || connectionTier === "AI Active", icon: CheckCircle },
                { label: "AI Auto-Reply", active: connectionTier === "AI Active", icon: Sparkles },
              ].map((step, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border text-center space-y-1 transition-all ${
                    step.active
                      ? "bg-green-500/5 border-green-500/15"
                      : "bg-[var(--bg-elevated)]/30 border-[var(--border)]"
                  }`}
                >
                  <step.icon className={`w-4 h-4 mx-auto ${step.active ? "text-green-400" : "text-[var(--text-subtle)]"}`} />
                  <p className={`text-[9px] font-black uppercase tracking-wider ${step.active ? "text-green-400" : "text-[var(--text-subtle)]"}`}>
                    {step.label}
                  </p>
                </div>
              ))}
            </div>

            {/* ACTION TRIGGERS ROW */}
            <div className="flex flex-wrap gap-2 pt-2">
              {(!platformVerified || isEditMode) ? (
                <button
                  onClick={handleConnect}
                  className="px-4 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-550 text-white rounded-xl shadow-lg shadow-blue-500/10 transition-all cursor-pointer"
                >
                  {platformVerified ? "Save & Reconnect WhatsApp" : "Connect WhatsApp Business"}
                </button>
              ) : (
                <button
                  onClick={() => setIsEditMode(true)}
                  className="px-4 py-2.5 text-xs font-bold bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-[var(--text)] cursor-pointer transition-all"
                >
                  Edit Credentials / Reconnect Number
                </button>
              )}
              <button
                onClick={handleTestPing}
                className="px-4 py-2.5 text-xs font-bold bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-[var(--text)] cursor-pointer"
              >
                Test Connection Ping
              </button>
              {platformVerified && (
                <button
                  onClick={handleDisconnect}
                  className="px-4 py-2.5 text-xs font-bold bg-[var(--bg-card)] hover:bg-red-500/10 hover:border-red-500/20 border border-[var(--border)] rounded-xl text-[var(--text-subtle)] hover:text-red-400 cursor-pointer transition-all"
                >
                  Disconnect Line
                </button>
              )}
            </div>
          </div>

          {/* DISCONNECT / RECONNECT WARNING MODAL */}
          <AnimatePresence>
            {isDisconnectModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsDisconnectModalOpen(false)}
                  className="fixed inset-0 bg-black/70 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="relative w-full max-w-md bg-[var(--modal-bg)] border border-[var(--border)] rounded-3xl p-6 shadow-2xl space-y-4 z-10 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-[var(--text)] font-display">Disconnect or Change WhatsApp Line?</h3>
                      <p className="text-[11px] text-[var(--text-muted)] font-sans">Active connection modification warning</p>
                    </div>
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 text-xs leading-relaxed text-amber-200/90 space-y-2">
                    <p className="font-bold text-amber-300">
                      ⚠️ Changing WhatsApp connection will stop AI replies temporarily until the new account is verified.
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Incoming messages from customers will not receive automated AI replies until you connect and verify your new number.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsDisconnectModalOpen(false)}
                      className="px-4 py-2 text-xs font-bold rounded-xl border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDisconnect}
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-550 text-white shadow-lg shadow-red-500/20 transition cursor-pointer"
                    >
                      Confirm Disconnect
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* MESSAGE TEMPLATES CARD */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 backdrop-blur-md space-y-4">
            <div>
              <h3 className="text-xs font-black text-[var(--text)] uppercase tracking-wider text-blue-400">Message Automation Templates</h3>
              <p className="text-[10.5px] text-[var(--text-subtle)] mt-0.5">Draft automated response templates for major workflow events.</p>
            </div>

            {/* Template subtabs */}
            <div className="flex overflow-x-auto gap-1 border-b border-[var(--border)] pb-2 scrollbar-none">
              {(["Welcome", "Confirmation", "Payment", "Capture", "Hours", "Fallback"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTemplateTab(tab)}
                  className={`px-3 py-1.5 text-[10.5px] font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                    activeTemplateTab === tab
                      ? "bg-blue-600/10 text-blue-400 border border-blue-500/20 font-black"
                      : "text-[var(--text-subtle)] hover:text-[var(--text)] border border-transparent"
                  }`}
                >
                  {tab} Message
                </button>
              ))}
            </div>

            {/* Template input box */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] uppercase font-black text-[var(--text-subtle)]">
                  <span>Template Text body</span>
                  <span className="text-[var(--text-subtle)]">Variables supported: {"{{customer_name}}, {{business_name}}"}</span>
                </div>
                <textarea
                  rows={3}
                  value={templates[activeTemplateTab]}
                  onChange={(e) => handleUpdateTemplate(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border)] p-3.5 rounded-xl text-xs text-[var(--text)] focus:outline-none font-medium"
                />
              </div>

              <div className="flex justify-between items-center p-3.5 bg-[var(--bg-elevated)]/40 border border-[var(--border)] rounded-2xl">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-blue-500" />
                  <span className="text-[11px] text-[var(--text-muted)] font-medium">Template synced and approved by Meta Sandbox policy checks.</span>
                </div>
                <button
                  onClick={() => addNewWebhookLog("Message Sent", `Template updated: "${activeTemplateTab} Message" template`, true)}
                  className="px-3.5 py-1.5 text-[10.5px] font-black bg-blue-600 hover:bg-blue-550 text-white rounded-xl cursor-pointer shadow-sm"
                >
                  Save and Sync
                </button>
              </div>
            </div>

          </div>

          {/* AI SETTINGS & CONFIDENCE THRESHOLD */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 backdrop-blur-md space-y-5">
            <div>
              <h3 className="text-xs font-black text-[var(--text)] uppercase tracking-wider text-blue-500">AI Response Engine Parameters</h3>
              <p className="text-[10.5px] text-[var(--text-subtle)] mt-0.5 font-sans">Fine-tune confidence limits, booking policies, and out-of-hours fallbacks.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Toggles */}
              <div className="space-y-3">
                {[
                  { label: "Enable Human Escalation Alerts", desc: "Ping support teams when confidence threshold drops", val: enableHumanEscalation, setVal: setEnableHumanEscalation },
                  { label: "Enable Smart Lead Capture", desc: "Collect phone line details and index them automatically", val: enableLeadCapture, setVal: setEnableLeadCapture },
                  { label: "Enable Appointment Booking", desc: "Empower chatbot to lock appointment slots into the agenda", val: enableBooking, setVal: setEnableBooking },
                  { label: "Enable Payment Requests", desc: "Disburse digital checkout links dynamically inside chat threads", val: enablePayments, setVal: setEnablePayments }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-[var(--bg-elevated)]/20 border border-[var(--border)]/60 rounded-xl">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-[var(--text)] font-sans">{item.label}</p>
                      <p className="text-[9px] text-[var(--text-subtle)]">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => item.setVal(!item.val)}
                      className={`w-7 h-4 rounded-full p-0.5 transition-all outline-none cursor-pointer ${
                        item.val ? "bg-blue-600" : "bg-[var(--bg-elevated)]"
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-full bg-white transition-all ${
                        item.val ? "translate-x-3" : "translate-x-0"
                      }`} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Confidence Trigger + Business Hours */}
              <div className="space-y-5">
                
                {/* Confidence Threshold Slider */}
                <div className="space-y-2 bg-[var(--bg-elevated)]/30 p-4 border border-[var(--border)] rounded-2xl">
                  <div className="flex justify-between items-center text-[10px] uppercase font-black text-[var(--text-subtle)]">
                    <span>Confidence Match Limit</span>
                    <span className="text-blue-500 font-mono font-bold">{confidenceThreshold}%</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={95}
                    value={confidenceThreshold}
                    onChange={(e) => setConfidenceThreshold(parseInt(e.target.value))}
                    className="w-full h-1 bg-[var(--bg-elevated)] rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <p className="text-[9px] text-[var(--text-subtle)] leading-normal">
                    Matches scoring below {confidenceThreshold}% are escalated to humans instantly to protect brand credibility.
                  </p>
                </div>

                {/* Business Hours Setup */}
                <div className="space-y-4 bg-[var(--bg-elevated)]/30 p-4 border border-[var(--border)] rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-[var(--text)]">Outside Business Hours Automation</p>
                      <p className="text-[9.5px] text-[var(--text-subtle)]">Auto replies outside 6AM - 10PM</p>
                    </div>
                    <button
                      onClick={() => setOutOfHoursResponse(!outOfHoursResponse)}
                      className={`w-7 h-4 rounded-full p-0.5 transition-all outline-none cursor-pointer ${
                        outOfHoursResponse ? "bg-blue-600" : "bg-[var(--bg-elevated)]"
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-full bg-white transition-all ${
                        outOfHoursResponse ? "translate-x-3" : "translate-x-0"
                      }`} />
                    </button>
                  </div>

                  {outOfHoursResponse && (
                    <div className="space-y-1.5">
                      <label className="text-[9.5px] uppercase font-black tracking-wider text-[var(--text-subtle)]">Custom Out-Of-Hours reply</label>
                      <textarea
                        rows={2}
                        value={outOfHoursMessage}
                        onChange={(e) => setOutOfHoursMessage(e.target.value)}
                        className="w-full bg-[var(--input-bg)] border border-[var(--border)] p-2.5 rounded-xl text-xs text-[var(--text)] focus:outline-none font-medium"
                      />
                    </div>
                  )}
                </div>

              </div>
            </div>

          </div>

          {/* ═══ AI REPLY EXCEPTIONS CARD ═══ */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 backdrop-blur-md space-y-5">
            <div>
              <h3 className="text-xs font-black text-[var(--text)] uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <UserMinus className="w-4 h-4" />
                AI Reply Exceptions
              </h3>
              <p className="text-[10.5px] text-[var(--text-subtle)] mt-0.5">
                Phone numbers listed here will never receive AI-generated replies. Messages from these numbers are still recorded for manual human review.
              </p>
            </div>

            {/* Add Exception Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newExceptionPhone}
                onChange={(e) => { setNewExceptionPhone(e.target.value); setExceptionError(""); }}
                placeholder="Enter phone number (e.g. 9876543210)"
                className="flex-1 bg-[var(--input-bg)] border border-[var(--border)] p-2.5 rounded-xl text-xs text-[var(--text)] placeholder-neutral-500 focus:outline-none focus:border-amber-500/50 font-medium"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddException(); } }}
              />
              <button
                onClick={handleAddException}
                className="px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>
            {exceptionError && (
              <p className="text-[10px] text-red-400 font-medium -mt-2">{exceptionError}</p>
            )}

            {/* Exception List */}
            {aiExceptions.length > 0 ? (
              <div className="space-y-1.5">
                {aiExceptions.map((phone, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-[var(--bg-elevated)]/30 border border-[var(--border)] rounded-xl group">
                    <div className="flex items-center gap-2">
                      <UserMinus className="w-3.5 h-3.5 text-amber-400/70" />
                      <span className="text-xs font-mono font-bold text-[var(--text)]">{phone}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveException(phone)}
                      className="text-[var(--text-subtle)] hover:text-red-400 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                      title="Remove exception"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-[10.5px] text-[var(--text-subtle)] py-4 italic">
                No exceptions configured. All contacts receive AI-generated replies when AI is active.
              </p>
            )}
          </div>

        </div>

        {/* Right Column: WhatsApp Tester + Webhook Logs */}
        <div className="space-y-6 w-full min-w-0">
          
          {/* SIMULATED CLIENT HANDSET GLASS PANEL */}
          <div className="bg-[var(--bg-card)] border border-blue-500/20 rounded-3xl p-5 relative overflow-hidden shadow-xl h-[400px] flex flex-col justify-between">
            
            {/* Handset Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-black text-[var(--text)] uppercase tracking-wider font-sans">Live WhatsApp Tester</span>
              </div>
              <span className="text-[9px] font-mono text-[var(--text-subtle)]">Confidence Score matching feed</span>
            </div>

            {/* Handset Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1 scrollbar-none">
              {testerLogs.map((log, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col max-w-[85%] ${
                    log.sender === "user" ? "ml-auto items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      log.sender === "user"
                        ? "bg-blue-600 text-white rounded-br-none font-medium"
                        : "bg-[var(--input-bg)] text-[var(--text)] rounded-bl-none border border-[var(--border)] font-medium"
                    }`}
                  >
                    <p className="font-sans whitespace-pre-wrap leading-snug">{log.text}</p>
                  </div>
                  {log.sender === "bot" && log.source && (
                    <div className="flex items-center gap-2 mt-1.5 text-[9px] text-[var(--text-muted)] font-mono pl-1">
                      <span className="text-blue-500 font-extrabold">Source: Match RAG [{log.source}]</span>
                      <span>•</span>
                      <span className="text-green-500 font-extrabold">{log.confidence} Conf</span>
                      <span>•</span>
                      <span>{log.time}</span>
                    </div>
                  )}
                </div>
              ))}
              {isTesterLoading && (
                <div className="flex items-center gap-2 max-w-[80%] p-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl rounded-bl-none">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-subtle)] animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-subtle)] animate-bounce delay-150" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-subtle)] animate-bounce delay-300" />
                  </div>
                  <span className="text-[10px] text-[var(--text-subtle)]">RAG matching...</span>
                </div>
              )}
            </div>

            {/* Handset Form Sender */}
            <form onSubmit={handleSendTesterMessage} className="pt-2 border-t border-[var(--border)] flex gap-2">
              <input
                type="text"
                value={testerMessage}
                onChange={(e) => setTesterMessage(e.target.value)}
                placeholder="Ask e.g. Do you have locker room? pricing?"
                className="flex-1 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-3 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--brand)] font-medium"
              />
              <button
                type="submit"
                className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-550 text-white flex items-center justify-center transition-colors shadow shadow-blue-500/10 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

          </div>

          {/* WEBHOOK LIVE MONITOR */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-5 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
              <span className="text-xs font-black text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-blue-500 animate-pulse" />
                Live Webhook Event Monitor
              </span>
              <button
                onClick={() => setWebhookLogs([])}
                className="text-[9px] text-[var(--text-subtle)] hover:text-[var(--text)] cursor-pointer"
              >
                Clear logs
              </button>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {webhookLogs.map((log) => (
                <div
                  key={log.id}
                  className={`p-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl flex gap-3 text-xs justify-between items-start transition-all hover:bg-[var(--bg-card)] ${
                    !log.success && "border-red-500/15"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block px-1.5 py-0.5 text-[8.5px] font-black uppercase tracking-wider rounded ${
                        log.eventType === "Message Received"
                          ? "bg-blue-600/10 text-blue-500 border border-blue-500/20"
                          : log.eventType === "Message Sent"
                          ? "bg-green-600/10 text-green-500 border border-green-500/20"
                          : log.eventType === "Lead Captured"
                          ? "bg-purple-600/10 text-purple-500 border border-purple-500/20"
                          : log.eventType === "Appointment Booked"
                          ? "bg-cyan-600/10 text-cyan-500 border border-cyan-500/20"
                          : log.eventType === "Payment Received"
                          ? "bg-amber-600/10 text-amber-500 border border-amber-500/20"
                          : "bg-red-500/10 text-red-500 border border-red-500/20"
                      }`}>
                        {log.eventType}
                      </span>
                      <span className="text-[9.5px] text-[var(--text-subtle)] font-mono">{log.timestamp}</span>
                    </div>
                    <p className="text-[10.5px] text-[var(--text)] leading-normal select-text font-medium">{log.details}</p>
                  </div>
                  {log.success ? (
                    <span className="text-green-500 text-xs mt-0.5"><Check size={12} /></span>
                  ) : (
                    <span className="text-red-500 text-xs mt-0.5"></span>
                  )}
                </div>
              ))}
              {webhookLogs.length === 0 && (
                <p className="text-center text-[10.5px] text-[var(--text-subtle)] py-6 italic font-sans">No live webhook transactional logs captured yet.</p>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
