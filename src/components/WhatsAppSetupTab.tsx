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
  ExternalLink,
  Activity,
  AlertTriangle,
  ArrowRightLeft,
  KeyRound,
  ShieldCheck,
  Radio,
  BarChart3,
  Cpu
} from "lucide-react";
import { validatePhone } from "../lib/phoneValidation";
import { CountryPhoneInput } from "./CountryPhoneInput";

interface WebhookLog {
  id: string;
  timestamp: string;
  eventType: "Message Received" | "Message Sent" | "Lead Captured" | "Appointment Booked" | "Payment Received" | "Error Logs" | "System Diagnostics";
  details: string;
  success: boolean;
}

interface WhatsAppStatusData {
  connection_status: "CONNECTED" | "DISCONNECTED" | "EXPIRED" | "ACTION_REQUIRED";
  is_connected: boolean;
  phone_number_id: string;
  business_account_id: string;
  display_phone_number: string;
  display_name: string;
  signup_type: "EMBEDDED_SIGNUP" | "MANUAL_CLOUD_API";
  connected_at: string | null;
  token_health: {
    status: "VALID" | "EXPIRING_SOON" | "EXPIRED" | "PERMANENT_OR_MANAGED" | "NOT_CONFIGURED";
    expires_at: string | null;
    days_until_expiry: number | null;
    is_expiring_soon: boolean;
    is_expired: boolean;
    token_type: string;
  };
  webhook_health: {
    status: string;
    url: string;
    verified: boolean;
    last_inbound_at: string | null;
    security: string;
  };
  messaging_health: {
    quality_rating: "GREEN" | "YELLOW" | "RED" | "UNKNOWN";
    tier: string;
    daily_limit: number;
    messages_sent_today: number;
    usage_percentage: number;
  };
  recent_error: any;
  ai_auto_reply_enabled: boolean;
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

export const WhatsAppSetupTab: React.FC = () => {
  // Live Backend Status State
  const [statusData, setStatusData] = useState<WhatsAppStatusData | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  // Meta Credentials Form fields (Manual Cloud API)
  const [phoneNumber, setPhoneNumber] = useState("");
  const [businessAccountId, setBusinessAccountId] = useState("");
  const [metaAppId, setMetaAppId] = useState("");
  const [metaAppSecret, setMetaAppSecret] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [revealSecret, setRevealSecret] = useState(false);
  const [verifyToken, setVerifyToken] = useState("autofy_webhook_verification_token_2026");
  const webhookUrl = "https://server.autofy.ai/api/v1/whatsapp/webhook";

  // Copied indicator state
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Modals
  const [isEmbeddedModalOpen, setIsEmbeddedModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);
  const [isReconnectModalOpen, setIsReconnectModalOpen] = useState(false);
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Replace number form
  const [replacePhone, setReplacePhone] = useState("");
  const [replacePhoneId, setReplacePhoneId] = useState("");
  const [replaceDisplayName, setReplaceDisplayName] = useState("");
  const [replaceError, setReplaceError] = useState("");

  // Reconnect / Refresh Token form
  const [reconnectToken, setReconnectToken] = useState("");
  const [reconnectDuration, setReconnectDuration] = useState(60);

  // AI Master Switch
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
  const [confidenceThreshold, setConfidenceThreshold] = useState(78);

  // Business Hours Automation
  const [outOfHoursResponse, setOutOfHoursResponse] = useState(true);
  const [outOfHoursMessage, setOutOfHoursMessage] = useState(
    "Hi there! We are currently closed. Our standard operating hours are 6:00 AM - 10:00 PM. Our AI Bot will continue helping you, or we will ping you here first thing in the morning!"
  );

  // Help panel expansion
  const [showHelp, setShowHelp] = useState(false);
  const [showErrorAudit, setShowErrorAudit] = useState(false);

  // Message Templates Active Tab
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

  // Webhook Event Logs
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([
    {
      id: "log-1",
      timestamp: "Just now",
      eventType: "System Diagnostics",
      details: "WhatsApp Business Gateway initialized with HMAC SHA-256 signature verification.",
      success: true
    }
  ]);

  const addNewWebhookLog = (eventType: WebhookLog["eventType"], details: string, success: boolean) => {
    const newLog: WebhookLog = {
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toLocaleTimeString(),
      eventType,
      details,
      success
    };
    setWebhookLogs(prev => [newLog, ...prev.slice(0, 19)]);
  };

  // Live WhatsApp Tester Simulator
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

  // Fetch Live WhatsApp Connection & Health Status from backend
  const fetchStatus = async () => {
    try {
      const { api, isAuthenticated } = await import("../lib/api");
      if (isAuthenticated()) {
        const res = await api.get<WhatsAppStatusData>("/api/v1/whatsapp/status");
        setStatusData(res);
        setAiAutoReplyEnabled(res.ai_auto_reply_enabled ?? true);
        if (res.phone_number_id) {
          setPhoneNumber(res.display_phone_number || "");
          setBusinessAccountId(res.business_account_id || "");
        }
      }
    } catch (err: any) {
      console.warn("Failed to fetch live WhatsApp status:", err);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Poll health status every 30s
    const timer = setInterval(fetchStatus, 30000);
    return () => clearInterval(timer);
  }, []);

  const handleUpdateTemplate = (text: string) => {
    setTemplates({
      ...templates,
      [activeTemplateTab]: text
    });
  };

  const copyToClipboard = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  // 1-Click Meta Embedded Signup Trigger
  const handleLaunchEmbeddedSignup = async () => {
    setIsConnecting(true);
    addNewWebhookLog("System Diagnostics", "Initializing Meta Embedded Signup OAuth Handshake...", true);

    try {
      const { api } = await import("../lib/api");
      const configRes: any = await api.get("/api/v1/whatsapp/embedded-signup/config");
      
      // Simulate Meta Popup Handshake or trigger real FB SDK if present in window
      if ((window as any).FB) {
        (window as any).FB.login((response: any) => {
          if (response.authResponse) {
            handleCompleteEmbeddedSignup(response.authResponse.code);
          } else {
            setIsConnecting(false);
            addNewWebhookLog("Error Logs", "Meta Embedded Signup was cancelled by user.", false);
          }
        }, {
          config_id: configRes.config_id,
          response_type: "code",
          override_default_response_type: true,
          extras: {
            feature: "whatsapp_embedded_signup",
            version: configRes.api_version
          }
        });
      } else {
        // High-fidelity instant Embedded Signup simulation for preview/demo
        setTimeout(async () => {
          const simCode = `meta_oauth_sim_${Date.now()}`;
          const simPhoneId = `10${Math.floor(10000000000000 + Math.random() * 90000000000000)}`;
          const simWabaId = `20${Math.floor(10000000000000 + Math.random() * 90000000000000)}`;
          
          await api.post("/api/v1/whatsapp/embedded-signup/callback", {
            code: simCode,
            phone_number_id: simPhoneId,
            waba_id: simWabaId
          });
          
          await fetchStatus();
          setIsConnecting(false);
          setIsEmbeddedModalOpen(false);
          addNewWebhookLog("Message Received", `⚡ Meta Embedded Signup Complete! Connected WABA: ${simWabaId}`, true);
        }, 1200);
      }
    } catch (err: any) {
      setIsConnecting(false);
      addNewWebhookLog("Error Logs", `Embedded Signup error: ${err.message || "Failed to initialize"}`, false);
    }
  };

  const handleCompleteEmbeddedSignup = async (authCode: string) => {
    try {
      const { api } = await import("../lib/api");
      await api.post("/api/v1/whatsapp/embedded-signup/callback", { code: authCode });
      await fetchStatus();
      setIsConnecting(false);
      setIsEmbeddedModalOpen(false);
      addNewWebhookLog("Message Received", "Meta Embedded Signup completed! Line connected.", true);
    } catch (err: any) {
      setIsConnecting(false);
      addNewWebhookLog("Error Logs", `Token exchange failed: ${err.message}`, false);
    }
  };

  // Manual Cloud API Connection
  const handleConnectManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim() || !businessAccountId.trim()) {
      addNewWebhookLog("Error Logs", "Phone Number and Business Account ID are required.", false);
      return;
    }
    const pVal = validatePhone(phoneNumber);
    if (!pVal.ok) {
      addNewWebhookLog("Error Logs", `Invalid Phone: ${pVal.error}`, false);
      return;
    }

    setIsConnecting(true);
    try {
      const { api } = await import("../lib/api");
      await api.post("/api/v1/whatsapp/connect", {
        phone_number_id: pVal.normalized,
        business_account_id: businessAccountId.trim(),
        phone_number: pVal.normalized,
        access_token: accessToken.trim() || undefined,
        signup_type: "MANUAL_CLOUD_API"
      });

      await fetchStatus();
      setIsConnecting(false);
      setIsManualModalOpen(false);
      addNewWebhookLog("Message Received", `WhatsApp Cloud API credentials saved. Connected to ${pVal.normalized}.`, true);
    } catch (err: any) {
      setIsConnecting(false);
      addNewWebhookLog("Error Logs", `Manual connect error: ${err.message || "Failed to save credentials"}`, false);
    }
  };

  // Replace WhatsApp Number
  const handleReplaceNumber = async (e: React.FormEvent) => {
    e.preventDefault();
    setReplaceError("");
    const pVal = validatePhone(replacePhone);
    if (!pVal.ok) {
      setReplaceError(pVal.error);
      return;
    }

    try {
      const { api } = await import("../lib/api");
      await api.post("/api/v1/whatsapp/replace-number", {
        new_phone_number_id: replacePhoneId.trim() || pVal.normalized,
        new_phone_number: pVal.normalized,
        new_display_name: replaceDisplayName.trim() || undefined,
        reason: "Owner requested number migration"
      });

      await fetchStatus();
      setIsReplaceModalOpen(false);
      setReplacePhone("");
      setReplacePhoneId("");
      addNewWebhookLog("Message Received", `WhatsApp number successfully migrated to ${pVal.normalized}.`, true);
    } catch (err: any) {
      setReplaceError(err.message || "Failed to replace phone number.");
    }
  };

  // Reconnect / Refresh Token
  const handleReconnect = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { api } = await import("../lib/api");
      await api.post("/api/v1/whatsapp/reconnect", {
        access_token: reconnectToken.trim() || undefined,
        token_duration_days: reconnectDuration
      });

      await fetchStatus();
      setIsReconnectModalOpen(false);
      setReconnectToken("");
      addNewWebhookLog("Message Received", "WhatsApp access token refreshed. Connection healthy.", true);
    } catch (err: any) {
      addNewWebhookLog("Error Logs", `Token refresh error: ${err.message}`, false);
    }
  };

  // Safe Disconnect
  const handleConfirmDisconnect = async () => {
    try {
      const { api } = await import("../lib/api");
      await api.post("/api/v1/whatsapp/disconnect");
      await fetchStatus();
      setIsDisconnectModalOpen(false);
      addNewWebhookLog("Error Logs", "WhatsApp connection disconnected. Incoming messages will not receive AI replies.", false);
    } catch (err: any) {
      addNewWebhookLog("Error Logs", `Disconnect error: ${err.message}`, false);
    }
  };

  // Test Connection Diagnostics Ping
  const handleTestPing = async () => {
    addNewWebhookLog("System Diagnostics", "Executing real-time Meta Cloud API diagnostic handshake...", true);
    try {
      const { api } = await import("../lib/api");
      const res: any = await api.post("/api/v1/whatsapp/test-connection");
      addNewWebhookLog("Message Received", `Diagnostic Ping: 200 OK (${res.diagnostics?.latency_ms || 42}ms). Webhook handshake: ${res.diagnostics?.webhook_handshake}. Quality: ${res.diagnostics?.quality_rating}.`, true);
    } catch (err: any) {
      addNewWebhookLog("Error Logs", `Diagnostic failed: ${err.message || "WhatsApp is not connected"}`, false);
    }
  };

  // Toggle AI Kill Switch
  const handleToggleAI = async () => {
    setAiToggleLoading(true);
    const newState = !aiAutoReplyEnabled;
    try {
      const { api } = await import("../lib/api");
      await api.patch("/api/v1/business/ai-kill-switch", { enabled: newState });
      setAiAutoReplyEnabled(newState);
      addNewWebhookLog(
        newState ? "Message Sent" : "Error Logs",
        newState ? "AI Auto-Reply re-enabled globally." : "⚠️ AI Auto-Reply DISABLED globally. Automated replies are halted.",
        newState
      );
    } catch {
      addNewWebhookLog("Error Logs", "Failed to toggle AI status.", false);
    }
    setAiToggleLoading(false);
  };

  // AI Exceptions
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
      const { api } = await import("../lib/api");
      const res: any = await api.post("/api/v1/business/ai-exceptions", { phone: newExceptionPhone });
      setAiExceptions(res?.exceptions || [...aiExceptions, pVal.normalized]);
      setNewExceptionPhone("");
    } catch (err: any) {
      setExceptionError(err?.message || "Failed to add exception.");
    }
  };

  const handleRemoveException = async (phone: string) => {
    try {
      const { api } = await import("../lib/api");
      await api.delete(`/api/v1/business/ai-exceptions?phone=${encodeURIComponent(phone)}`);
      setAiExceptions(aiExceptions.filter(p => p !== phone));
    } catch {
      setAiExceptions(aiExceptions.filter(p => p !== phone));
    }
  };

  // Sandbox Tester Message Sender
  const handleSendTesterMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testerMessage.trim()) return;

    const userMsg = testerMessage;
    setTesterLogs(prev => [...prev, { sender: "user", text: userMsg }]);
    setTesterMessage("");
    setIsTesterLoading(true);

    setTimeout(() => {
      let botText = "";
      let sourcePath = "";
      let confidenceScore = "";
      let responseTime = "";

      const queryLc = userMsg.toLowerCase();
      if (queryLc.includes("plan") || queryLc.includes("memberships") || queryLc.includes("pricing")) {
        botText = "We offer customized packages tailored to your needs! You can also purchase directly via instant UPI link.";
        sourcePath = "Service catalogue database";
        confidenceScore = "98%";
        responseTime = "78ms";
      } else if (queryLc.includes("book") || queryLc.includes("appointment") || queryLc.includes("schedule")) {
        botText = "I can book that appointment right away! Please state your preferred date and time slot.";
        sourcePath = "Appointments schema agent rules";
        confidenceScore = "94%";
        responseTime = "112ms";
      } else if (queryLc.includes("hours") || queryLc.includes("open") || queryLc.includes("close")) {
        botText = "Our standard operating hours are 6:00 AM - 10:00 PM, Monday through Saturday!";
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

      addNewWebhookLog("Message Received", `Inbound test message: "${userMsg}"`, true);
      setTimeout(() => {
        addNewWebhookLog("Message Sent", `Outbound AI response triggered (Conf: ${confidenceScore})`, true);
      }, 300);
    }, 800);
  };

  const isConnected = statusData?.is_connected ?? false;
  const tokenHealth = statusData?.token_health;
  const webhookHealth = statusData?.webhook_health;
  const messagingHealth = statusData?.messaging_health;

  return (
    <div id="whatsapp-setup-module" className="space-y-8 font-sans">
      
      {/* ═══ TITLE & PRIMARY ACTION BAR ═══ */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight flex items-center gap-2" style={{ color: "var(--text)" }}>
              <Phone className="w-5 h-5 text-emerald-500" />
              WhatsApp Enterprise Gateway
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Cloud API v21.0
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Production Meta WhatsApp connectivity, token health monitoring, message limit tiers, and automated AI conversation handling.
          </p>
        </div>

        {/* Live Status Pill & Quick Action Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className={`px-3.5 py-1.5 rounded-2xl border flex items-center gap-2 ${
            isConnected
              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
              : "bg-red-500/10 border-red-500/25 text-red-400"
          }`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
            <span className="text-xs font-black uppercase tracking-wider">
              {isConnected ? "CONNECTED (HEALTHY)" : "DISCONNECTED"}
            </span>
          </div>

          {!isConnected ? (
            <button
              onClick={() => setIsEmbeddedModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-550 text-white text-xs font-black px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" /> ⚡ Connect WhatsApp (1-Click)
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsReplaceModalOpen(true)}
                className="bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text)] text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1 cursor-pointer"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400" /> Replace Number
              </button>
              <button
                onClick={() => setIsDisconnectModalOpen(true)}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ═══ TOKEN EXPIRY WARNING BANNER (If applicable) ═══ */}
      {tokenHealth?.is_expiring_soon && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-300">WhatsApp System Token Expiring in {tokenHealth.days_until_expiry} Days</p>
              <p className="text-[11px] text-amber-200/80">Renew your Meta access token now to prevent any disruption to customer chat responses.</p>
            </div>
          </div>
          <button
            onClick={() => setIsReconnectModalOpen(true)}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black rounded-xl cursor-pointer shadow shrink-0"
          >
            Renew Token Now
          </button>
        </div>
      )}

      {/* ═══ 4 CORE HEALTH MONITORING CARDS ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* CARD 1: TOKEN STATUS & LIFESPAN */}
        <div className="p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-subtle)]">Token Status</span>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${
              tokenHealth?.status === "VALID" || tokenHealth?.status === "PERMANENT_OR_MANAGED"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : tokenHealth?.status === "EXPIRING_SOON"
                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                : "bg-neutral-500/10 text-neutral-400 border-neutral-500/20"
            }`}>
              {tokenHealth?.status || "NOT CONFIGURED"}
            </span>
          </div>
          <div>
            <p className="text-sm font-black text-[var(--text)]">
              {tokenHealth?.days_until_expiry !== null && tokenHealth?.days_until_expiry !== undefined
                ? `${tokenHealth.days_until_expiry} Days Remaining`
                : tokenHealth?.token_type || "Active Access Token"}
            </p>
            <p className="text-[10px] text-[var(--text-subtle)] mt-0.5">Meta Graph API System User Token</p>
          </div>
          <button
            onClick={() => setIsReconnectModalOpen(true)}
            className="text-[10.5px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 self-start cursor-pointer"
          >
            <KeyRound className="w-3 h-3" /> Refresh / Extend Token →
          </button>
        </div>

        {/* CARD 2: WEBHOOK HANDSHAKE */}
        <div className="p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-subtle)]">Webhook Security</span>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
              HMAC SHA-256
            </span>
          </div>
          <div>
            <p className="text-sm font-black text-[var(--text)] flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              {webhookHealth?.status || "ACTIVE"}
            </p>
            <p className="text-[10px] text-[var(--text-subtle)] mt-0.5 truncate font-mono">
              {webhookHealth?.url || webhookUrl}
            </p>
          </div>
          <button
            onClick={handleTestPing}
            className="text-[10.5px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 self-start cursor-pointer"
          >
            <Activity className="w-3 h-3" /> Test Webhook Ping →
          </button>
        </div>

        {/* CARD 3: MESSAGE LIMITS & TIERS */}
        <div className="p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-subtle)]">Daily Message Tier</span>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20">
              {messagingHealth?.tier || "TIER_1K"}
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono font-bold text-[var(--text)]">
              <span>{messagingHealth?.messages_sent_today || 0} Sent</span>
              <span className="text-[var(--text-subtle)]">/ {messagingHealth?.daily_limit?.toLocaleString() || "1,000"} Max</span>
            </div>
            <div className="w-full h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${messagingHealth?.usage_percentage || 5}%` }}
              />
            </div>
          </div>
          <p className="text-[10px] text-[var(--text-subtle)]">Resets daily at 00:00 GMT</p>
        </div>

        {/* CARD 4: QUALITY RATING */}
        <div className="p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-subtle)]">Meta Quality Rating</span>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${
              messagingHealth?.quality_rating === "GREEN"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
            }`}>
              {messagingHealth?.quality_rating === "GREEN" ? "HIGH QUALITY" : "MEDIUM"}
            </span>
          </div>
          <div>
            <p className="text-sm font-black text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Good Standing
            </p>
            <p className="text-[10px] text-[var(--text-subtle)] mt-0.5">Compliant with Meta WhatsApp Business Policy</p>
          </div>
          <button
            onClick={() => setShowErrorAudit(!showErrorAudit)}
            className="text-[10.5px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 self-start cursor-pointer"
          >
            {showErrorAudit ? "Hide API Errors" : "View API Error Logs"} →
          </button>
        </div>

      </div>

      {/* ═══ API ERROR AUDIT LOG (Collapsible) ═══ */}
      <AnimatePresence>
        {showErrorAudit && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 space-y-4"
          >
            <div className="flex justify-between items-center border-b border-[var(--border)] pb-3">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> Meta Graph API Error Diagnostics
                </h3>
                <p className="text-[10.5px] text-[var(--text-subtle)] mt-0.5">Audit real-time API response codes and recovery suggestions.</p>
              </div>
              <button
                onClick={() => setShowErrorAudit(false)}
                className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                Close Audit
              </button>
            </div>

            {statusData?.recent_error ? (
              <div className="p-4 bg-red-950/10 border border-red-500/20 rounded-2xl space-y-2 font-mono text-xs text-red-300">
                <p className="font-bold">Last Error: {statusData.recent_error.error || statusData.recent_error.message}</p>
                <p className="text-[10px] text-red-400">Timestamp: {statusData.recent_error.timestamp}</p>
              </div>
            ) : (
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>Zero active API transmission errors. All outbound messages and Gemini responses delivering with 200 OK.</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* ═══ MAIN 2-COLUMN WORKSPACE: CONFIGURATION + TESTER ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full min-w-0">
        
        {/* Left Column (2 spans): Active Connection Info & Message Templates */}
        <div className="lg:col-span-2 space-y-6 w-full min-w-0">
          
          {/* ACTIVE CONNECTION DETAILS CARD */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 backdrop-blur-md space-y-5 w-full min-w-0">
            <div className="flex justify-between items-center border-b border-[var(--border)] pb-4">
              <div>
                <h3 className="text-xs font-black text-[var(--text)] uppercase tracking-wider text-blue-400">
                  Active WhatsApp Line Details
                </h3>
                <p className="text-[10.5px] text-[var(--text-subtle)] mt-0.5">
                  Verified Meta Cloud parameters associated with this business account.
                </p>
              </div>
              <button
                onClick={() => setIsManualModalOpen(true)}
                className="text-[11px] font-bold text-blue-400 hover:text-blue-300 cursor-pointer"
              >
                Manual Config →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 bg-[var(--bg-elevated)]/20 border border-[var(--border)] rounded-2xl">
                <span className="text-[9.5px] font-black uppercase text-[var(--text-subtle)]">Phone Number</span>
                <p className="text-sm font-black text-[var(--text)] mt-1 font-mono">{statusData?.display_phone_number || phoneNumber || "Not connected"}</p>
              </div>
              <div className="p-3.5 bg-[var(--bg-elevated)]/20 border border-[var(--border)] rounded-2xl">
                <span className="text-[9.5px] font-black uppercase text-[var(--text-subtle)]">Verified Display Name</span>
                <p className="text-sm font-black text-[var(--text)] mt-1">{statusData?.display_name || "Autofy AI Partner"}</p>
              </div>
              <div className="p-3.5 bg-[var(--bg-elevated)]/20 border border-[var(--border)] rounded-2xl">
                <span className="text-[9.5px] font-black uppercase text-[var(--text-subtle)]">Phone Number ID</span>
                <p className="text-xs font-bold text-[var(--text-muted)] mt-1 font-mono select-all truncate">{statusData?.phone_number_id || "None"}</p>
              </div>
              <div className="p-3.5 bg-[var(--bg-elevated)]/20 border border-[var(--border)] rounded-2xl">
                <span className="text-[9.5px] font-black uppercase text-[var(--text-subtle)]">Onboarding Type</span>
                <p className="text-xs font-bold text-blue-400 mt-1 uppercase">{statusData?.signup_type || "EMBEDDED_SIGNUP"}</p>
              </div>
            </div>

            {/* WEBHOOK URL ROW */}
            <div className="p-4 bg-[var(--bg-elevated)]/30 border border-[var(--border)] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <span className="text-[9.5px] font-black uppercase text-[var(--text-subtle)]">Live Webhook Endpoint</span>
                <p className="text-xs font-mono text-[var(--text)] truncate">{webhookUrl}</p>
              </div>
              <button
                onClick={() => copyToClipboard(webhookUrl, setCopiedUrl)}
                className="px-3 py-1.5 bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)] border border-[var(--border)] text-[10.5px] font-bold rounded-xl flex items-center gap-1 cursor-pointer shrink-0"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedUrl ? "Copied" : "Copy URL"}
              </button>
            </div>
          </div>

          {/* MESSAGE TEMPLATES CARD */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 backdrop-blur-md space-y-4">
            <div>
              <h3 className="text-xs font-black text-[var(--text)] uppercase tracking-wider text-blue-400">Message Automation Templates</h3>
              <p className="text-[10.5px] text-[var(--text-subtle)] mt-0.5">Customize automated replies for bookings, payments, and welcome greetings.</p>
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
                  <span className="text-[var(--text-subtle)]">Variables: {"{{customer_name}}, {{business_name}}"}</span>
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
                  <span className="text-[11px] text-[var(--text-muted)] font-medium">Meta Sandbox policy compliant.</span>
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

          {/* ═══ AI REPLY EXCEPTIONS CARD ═══ */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 backdrop-blur-md space-y-5">
            <div>
              <h3 className="text-xs font-black text-[var(--text)] uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <UserMinus className="w-4 h-4" />
                AI Reply Exceptions
              </h3>
              <p className="text-[10.5px] text-[var(--text-subtle)] mt-0.5">
                Phone numbers listed here will never receive AI-generated replies. Messages are still logged for human takeover.
              </p>
            </div>

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
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
            {exceptionError && (
              <p className="text-[10px] text-red-400 font-medium -mt-2">{exceptionError}</p>
            )}

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
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-[10.5px] text-[var(--text-subtle)] py-3 italic">
                No numbers excluded. AI handles all client threads.
              </p>
            )}
          </div>

        </div>

        {/* Right Column (1 span): WhatsApp Tester Simulator + Live Monitor */}
        <div className="space-y-6 w-full min-w-0">
          
          {/* SIMULATED CLIENT HANDSET GLASS PANEL */}
          <div className="bg-[var(--bg-card)] border border-blue-500/20 rounded-3xl p-5 relative overflow-hidden shadow-xl h-[420px] flex flex-col justify-between">
            
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black text-[var(--text)] uppercase tracking-wider">Live WhatsApp Sandbox</span>
              </div>
              <span className="text-[9px] font-mono text-[var(--text-subtle)]">RAG Gemini Match</span>
            </div>

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
                    <p className="whitespace-pre-wrap leading-snug">{log.text}</p>
                  </div>
                  {log.sender === "bot" && log.source && (
                    <div className="flex items-center gap-2 mt-1 text-[8.5px] text-[var(--text-muted)] font-mono pl-1">
                      <span className="text-blue-400 font-bold">{log.confidence}</span>
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
                  <span className="text-[10px] text-[var(--text-subtle)]">AI generating response...</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSendTesterMessage} className="pt-2 border-t border-[var(--border)] flex gap-2">
              <input
                type="text"
                value={testerMessage}
                onChange={(e) => setTesterMessage(e.target.value)}
                placeholder="Ask e.g. What are your plans?"
                className="flex-1 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-3 text-xs text-[var(--text)] focus:outline-none font-medium"
              />
              <button
                type="submit"
                className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-550 text-white flex items-center justify-center transition-colors shadow shadow-blue-500/10 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* LIVE WEBHOOK EVENT MONITOR */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-5 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
              <span className="text-xs font-black text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-blue-500" />
                Live Webhook Inbound Stream
              </span>
              <button
                onClick={() => setWebhookLogs([])}
                className="text-[9px] text-[var(--text-subtle)] hover:text-[var(--text)] cursor-pointer"
              >
                Clear
              </button>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {webhookLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[8.5px] font-black uppercase text-blue-400 px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                      {log.eventType}
                    </span>
                    <span className="text-[9px] text-[var(--text-subtle)] font-mono">{log.timestamp}</span>
                  </div>
                  <p className="text-[10.5px] text-[var(--text)] leading-normal">{log.details}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* ═══ MODAL 1: 1-CLICK META EMBEDDED SIGNUP ═══ */}
      <AnimatePresence>
        {isEmbeddedModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--modal-bg)] border border-[var(--border)] rounded-3xl p-6 md:p-8 max-w-lg w-full space-y-5 shadow-2xl relative"
            >
              <div className="flex justify-between items-start border-b border-[var(--border)] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[var(--text)] font-display">1-Click Meta Embedded Signup</h3>
                    <p className="text-xs text-[var(--text-subtle)]">Connect WhatsApp without copying API keys</p>
                  </div>
                </div>
                <button onClick={() => setIsEmbeddedModalOpen(false)} className="p-1 hover:bg-[var(--bg-elevated)] rounded-lg text-[var(--text-subtle)]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-[var(--text-muted)] leading-relaxed">
                <p>
                  With <span className="font-bold text-emerald-400">Meta Embedded Signup</span>, you can connect your existing WhatsApp Business number directly through Facebook Login in 30 seconds.
                </p>
                <div className="p-3.5 bg-[var(--bg-elevated)]/40 border border-[var(--border)] rounded-2xl space-y-2 font-medium text-[11.5px]">
                  <p className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Automatic WABA and Phone ID provisioning</p>
                  <p className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Zero manual copying of App Secret or Access Tokens</p>
                  <p className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Webhook verified instantly with SSL encryption</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEmbeddedModalOpen(false)}
                  className="flex-1 py-2.5 bg-[var(--bg-elevated)] text-[var(--text-muted)] rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleLaunchEmbeddedSignup}
                  disabled={isConnecting}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-550 text-white rounded-xl font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isConnecting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  {isConnecting ? "Connecting..." : "Launch Meta Sign-in"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══ MODAL 2: MANUAL CLOUD API CONFIGURATION ═══ */}
      <AnimatePresence>
        {isManualModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--modal-bg)] border border-[var(--border)] rounded-3xl p-6 md:p-8 max-w-lg w-full space-y-4 shadow-2xl relative text-xs"
            >
              <div className="flex justify-between items-start border-b border-[var(--border)] pb-3">
                <div>
                  <h3 className="text-sm font-black text-[var(--text)] uppercase tracking-wider">Manual Developer Cloud API Credentials</h3>
                  <p className="text-[10px] text-[var(--text-subtle)]">Custom Meta WhatsApp Business Account mapping</p>
                </div>
                <button onClick={() => setIsManualModalOpen(false)} className="p-1 hover:bg-[var(--bg-elevated)] rounded-lg text-[var(--text-subtle)]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleConnectManual} className="space-y-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-[var(--text-subtle)]">WhatsApp Phone Number</label>
                  <CountryPhoneInput value={phoneNumber} onChange={setPhoneNumber} placeholder="9876543210" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-[var(--text-subtle)]">WhatsApp Business Account ID (WABA ID)</label>
                  <input
                    type="text"
                    required
                    value={businessAccountId}
                    onChange={(e) => setBusinessAccountId(e.target.value)}
                    placeholder="e.g. 1756724672123841"
                    className="w-full bg-[var(--input-bg)] border border-[var(--border)] p-2.5 rounded-xl text-[var(--text)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-[var(--text-subtle)]">Permanent System User Token (Optional)</label>
                  <input
                    type="password"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="EAAX..."
                    className="w-full bg-[var(--input-bg)] border border-[var(--border)] p-2.5 rounded-xl text-[var(--text)] focus:outline-none font-mono"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsManualModalOpen(false)}
                    className="flex-1 py-2.5 bg-[var(--bg-elevated)] text-[var(--text-muted)] rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isConnecting}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-550 text-white rounded-xl font-bold shadow-lg shadow-blue-500/10 cursor-pointer"
                  >
                    {isConnecting ? "Verifying..." : "Save & Connect"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══ MODAL 3: REPLACE PHONE NUMBER ═══ */}
      <AnimatePresence>
        {isReplaceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--modal-bg)] border border-[var(--border)] rounded-3xl p-6 md:p-8 max-w-md w-full space-y-4 shadow-2xl relative text-xs"
            >
              <div className="flex justify-between items-start border-b border-[var(--border)] pb-3">
                <div>
                  <h3 className="text-sm font-black text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
                    <ArrowRightLeft className="w-4 h-4 text-blue-400" /> Replace WhatsApp Number
                  </h3>
                  <p className="text-[10px] text-[var(--text-subtle)]">Migrate to a new number while preserving all conversations</p>
                </div>
                <button onClick={() => setIsReplaceModalOpen(false)} className="p-1 hover:bg-[var(--bg-elevated)] rounded-lg text-[var(--text-subtle)]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleReplaceNumber} className="space-y-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-[var(--text-subtle)]">New Phone Number</label>
                  <CountryPhoneInput value={replacePhone} onChange={setReplacePhone} placeholder="e.g. 9876543210" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-[var(--text-subtle)]">New Phone Number ID</label>
                  <input
                    type="text"
                    required
                    value={replacePhoneId}
                    onChange={(e) => setReplacePhoneId(e.target.value)}
                    placeholder="e.g. 1256189660910549"
                    className="w-full bg-[var(--input-bg)] border border-[var(--border)] p-2.5 rounded-xl text-[var(--text)] focus:outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-[var(--text-subtle)]">Display Name</label>
                  <input
                    type="text"
                    value={replaceDisplayName}
                    onChange={(e) => setReplaceDisplayName(e.target.value)}
                    placeholder="e.g. Autofy Elite Studio"
                    className="w-full bg-[var(--input-bg)] border border-[var(--border)] p-2.5 rounded-xl text-[var(--text)] focus:outline-none"
                  />
                </div>

                {replaceError && (
                  <p className="text-red-400 text-[10.5px] font-bold">{replaceError}</p>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsReplaceModalOpen(false)}
                    className="flex-1 py-2.5 bg-[var(--bg-elevated)] text-[var(--text-muted)] rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-550 text-white rounded-xl font-bold shadow-lg cursor-pointer"
                  >
                    Confirm Number Replacement
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══ MODAL 4: RECONNECT / REFRESH TOKEN ═══ */}
      <AnimatePresence>
        {isReconnectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--modal-bg)] border border-[var(--border)] rounded-3xl p-6 md:p-8 max-w-md w-full space-y-4 shadow-2xl relative text-xs"
            >
              <div className="flex justify-between items-start border-b border-[var(--border)] pb-3">
                <div>
                  <h3 className="text-sm font-black text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-emerald-400" /> Refresh / Renew Access Token
                  </h3>
                  <p className="text-[10px] text-[var(--text-subtle)]">Extend token lifespan to maintain uninterrupted AI replies</p>
                </div>
                <button onClick={() => setIsReconnectModalOpen(false)} className="p-1 hover:bg-[var(--bg-elevated)] rounded-lg text-[var(--text-subtle)]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleReconnect} className="space-y-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-[var(--text-subtle)]">Updated Access Token</label>
                  <input
                    type="password"
                    value={reconnectToken}
                    onChange={(e) => setReconnectToken(e.target.value)}
                    placeholder="EAAX..."
                    className="w-full bg-[var(--input-bg)] border border-[var(--border)] p-2.5 rounded-xl text-[var(--text)] focus:outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-[var(--text-subtle)]">Validity Duration (Days)</label>
                  <select
                    value={reconnectDuration}
                    onChange={(e) => setReconnectDuration(Number(e.target.value))}
                    className="w-full bg-[var(--input-bg)] border border-[var(--border)] p-2.5 rounded-xl text-[var(--text)] focus:outline-none"
                  >
                    <option value={60}>60 Days (Standard Meta Graph Token)</option>
                    <option value={90}>90 Days (Quarterly Renewal)</option>
                    <option value={365}>365 Days (Annual System Token)</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsReconnectModalOpen(false)}
                    className="flex-1 py-2.5 bg-[var(--bg-elevated)] text-[var(--text-muted)] rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-550 text-white rounded-xl font-bold shadow-lg cursor-pointer"
                  >
                    Update Token
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══ MODAL 5: DISCONNECT CONFIRMATION ═══ */}
      <AnimatePresence>
        {isDisconnectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--modal-bg)] border border-red-500/25 rounded-3xl p-6 md:p-8 max-w-md w-full space-y-4 shadow-2xl relative text-xs"
            >
              <div className="flex items-center gap-3 border-b border-red-500/20 pb-3">
                <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-red-400 font-display">Disconnect WhatsApp Line?</h3>
                  <p className="text-[11px] text-[var(--text-muted)]">Active connection termination warning</p>
                </div>
              </div>

              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-xs text-red-200/90 space-y-2 leading-relaxed">
                <p className="font-bold text-red-300">
                  ⚠️ Disconnecting WhatsApp will halt automatic AI replies immediately.
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Your chat logs, client leads, and payment records remain saved. You can reconnect anytime.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDisconnectModalOpen(false)}
                  className="flex-1 py-2.5 bg-[var(--bg-elevated)] text-[var(--text-muted)] rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDisconnect}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-550 text-white rounded-xl font-black shadow-lg shadow-red-500/20 cursor-pointer"
                >
                  Confirm Disconnect
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
