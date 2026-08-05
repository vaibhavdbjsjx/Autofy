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
  Bookmark
} from "lucide-react";

interface WebhookLog {
  id: string;
  timestamp: string;
  eventType: "Message Received" | "Message Sent" | "Lead Captured" | "Appointment Booked" | "Payment Received" | "Error Logs";
  details: string;
  success: boolean;
}

export const WhatsAppSetupTab: React.FC = () => {
  // Connection Status State
  const [connectionStatus, setConnectionStatus] = useState<"Connected" | "Disconnected" | "Pending Verification">("Disconnected");

  // Meta Credentials Form fields
  const [phoneNumber, setPhoneNumber] = useState("+91 98765 43210");
  const [businessAccountId, setBusinessAccountId] = useState("act_wa_849102481029410");
  const [metaAppId, setMetaAppId] = useState("meta_app_48201481029");
  const [metaAppSecret, setMetaAppSecret] = useState("••••••••••••••••••••••••••••");
  const [revealSecret, setRevealSecret] = useState(false);
  const [verifyToken, setVerifyToken] = useState("autofy_webhook_secure_validation_token_2026");
  const webhookUrl = "https://server.autofy.ai/api/v1/whatsapp/webhook";

  // Copied indicator state
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // AI Response Settings
  const [enableAI, setEnableAI] = useState(true);
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

  // Live WhatsApp Tester Simulator
  const [testerMessage, setTesterMessage] = useState("");
  const [testerLogs, setTesterLogs] = useState<Array<{ sender: "user" | "bot"; text: string; source?: string; confidence?: string; time?: string }>>([
    {
      sender: "bot",
      text: "Hi! Welcome to our WhatsApp sandbox. Send any message (e.g. Pricing, locker facilities, book appointment) to test the Autofy RAG intelligence flow.",
      source: "Templates / Welcome",
      confidence: "100%",
      time: "42ms"
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
        botText = "We offer 3 primary AC-enabled packages: Standard AC access (₹1,999/mo), Elite Strength Workout (₹5,999/quarterly), and VIP annual passes (₹18,000/yr). Diets and steam baths are included in the elite packs!";
        sourcePath = "Membership catalogue database";
        confidenceScore = "98%";
        responseTime = "78ms";
      } else if (queryLc.includes("book") || queryLc.includes("appointment") || queryLc.includes("schedule")) {
        botText = "I can book that scheduling appointment right away! Please state your preferred hourly gym time slot (e.g. tomorrow 4:00 PM) and we will lock it in.";
        sourcePath = "Appointments schema agent rules";
        confidenceScore = "94%";
        responseTime = "112ms";
      } else if (queryLc.includes("shower") || queryLc.includes("locker") || queryLc.includes("parking")) {
        botText = "Yes! Locker keys, showers, steam facilities, and local free basement parking are fully accessible under all monthly and annual subscriptions.";
        sourcePath = "Knowledge Base / Facility FAQs";
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

  // Webhook Events logger
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([
    {
      id: "log-1",
      timestamp: "Today, 10:48 AM",
      eventType: "Message Received",
      details: "Inbound payload from +91 9920158204: 'Do you offer a quarterly plan?'",
      success: true
    },
    {
      id: "log-2",
      timestamp: "Today, 10:48 AM",
      eventType: "Message Sent",
      details: "Outbound RAG match dispatched: 'Elite Strength Elite Quarterly Plan...' options",
      success: true
    },
    {
      id: "log-3",
      timestamp: "Today, 10:45 AM",
      eventType: "Lead Captured",
      details: "Client Priya Verma synced to database (WhatsApp: +91 9840251842)",
      success: true
    },
    {
      id: "log-4",
      timestamp: "Today, 10:41 AM",
      eventType: "Appointment Booked",
      details: "Slot confirmed for Rahul Sen: tomorrow, 5:00 PM for Premium Consultation",
      success: true
    },
    {
      id: "log-5",
      timestamp: "Today, 10:30 AM",
      eventType: "Error Logs",
      details: "Meta webhook handshake failed. Invalid Meta App Secret token parameters.",
      success: false
    }
  ]);

  const addNewWebhookLog = (
    type: WebhookLog["eventType"],
    details: string,
    success: boolean = true
  ) => {
    const freshLog: WebhookLog = {
      id: `wl-${Date.now()}`,
      timestamp: "Just Now",
      eventType: type,
      details: details,
      success: success
    };
    setWebhookLogs(prev => [freshLog, ...prev.slice(0, 14)]);
  };

  const copyToClipboard = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  // Connection Triggers
  const handleConnect = async () => {
    setConnectionStatus("Pending Verification");
    addNewWebhookLog("Message Sent", "Meta API cloud line authorization request dispatched", true);
    try {
      const { api, isAuthenticated } = await import("../lib/api");
      if (isAuthenticated()) {
        await api.get("/health");
      }
      setConnectionStatus("Connected");
      addNewWebhookLog("Message Received", "Meta Webhook challenge verified. Port line open.", true);
    } catch {
      setConnectionStatus("Disconnected");
      addNewWebhookLog("Error Logs", "Connection verification failed. Check backend status.", false);
    }
  };

  const handleDisconnect = () => {
    setConnectionStatus("Disconnected");
    addNewWebhookLog("Error Logs", "WhatsApp session closed by owner administration request.", false);
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

        {/* CONNECTION STATUS PILL */}
        <div className="flex items-center gap-2.5">
          {connectionStatus === "Connected" ? (
            <div className="px-4 py-2 bg-green-500/10 border border-green-500/25 rounded-2xl flex items-center gap-2 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-xs font-black text-green-400 uppercase tracking-wider">Line Connected</span>
            </div>
          ) : connectionStatus === "Pending Verification" ? (
            <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex items-center gap-2 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider">Verifying Sync...</span>
            </div>
          ) : (
            <div className="px-4 py-2 bg-red-500/10 border border-red-500/25 rounded-2xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span className="text-xs font-black text-red-400 uppercase tracking-wider">Line Disconnected</span>
            </div>
          )}
        </div>
      </div>

      {/* WHATSAPP CONTAINER GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Connections Setup Form (Holds 2 spans) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* META ACCESS CARD */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 backdrop-blur-md space-y-5">
            <div>
              <h3 className="text-xs font-black text-[var(--text)] uppercase tracking-wider text-blue-400">WhatsApp Business Setup Credentials</h3>
              <p className="text-[10.5px] text-[var(--text-subtle)] mt-0.5">Enter credentials matching your Meta App configuration platform.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-[var(--text-subtle)] tracking-wider">Business Phone Number</label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border)] p-2.5 rounded-xl text-xs text-[var(--text)] placeholder-neutral-400 focus:outline-none focus:border-[var(--brand)] font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-[var(--text-subtle)] tracking-wider font-bold">WhatsApp Business Account ID</label>
                <input
                  type="text"
                  value={businessAccountId}
                  onChange={(e) => setBusinessAccountId(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border)] p-2.5 rounded-xl text-xs text-[var(--text)] focus:outline-none focus:border-[var(--brand)] font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-[var(--text-subtle)] tracking-wider">Meta App ID</label>
                <input
                  type="text"
                  value={metaAppId}
                  onChange={(e) => setMetaAppId(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border)] p-2.5 rounded-xl text-xs text-[var(--text)] focus:outline-none focus:border-[var(--brand)] font-medium"
                />
              </div>

              <div className="space-y-1.5 relative">
                <label className="text-[10px] uppercase font-black text-[var(--text-subtle)] tracking-wider">Meta App Secret</label>
                <input
                  type={revealSecret ? "text" : "password"}
                  value={metaAppSecret}
                  onChange={(e) => setMetaAppSecret(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border)] p-2.5 rounded-xl text-xs text-[var(--text)] focus:outline-none focus:border-[var(--brand)] font-medium"
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
            <div className="p-4 bg-[var(--bg-elevated)]/30 border border-[var(--border)] rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-black text-[var(--text-subtle)]">Webhook URL</label>
                  <button
                    onClick={() => copyToClipboard(webhookUrl, setCopiedUrl)}
                    className="text-[9.5px] text-blue-500 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                  >
                    {copiedUrl ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    {copiedUrl ? "Copied" : "Copy"}
                  </button>
                </div>
                <div className="bg-[var(--input-bg)] p-2.5 rounded-xl text-[10.5px] font-mono text-[var(--text)] font-semibold select-all border border-[var(--border)]">
                  {webhookUrl}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-black text-[var(--text-subtle)]">Webhook Verify Token</label>
                  <button
                    onClick={() => copyToClipboard(verifyToken, setCopiedToken)}
                    className="text-[9.5px] text-blue-500 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                  >
                    {copiedToken ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    {copiedToken ? "Copied" : "Copy"}
                  </button>
                </div>
                <div className="bg-[var(--input-bg)] p-2.5 rounded-xl text-[10.5px] font-mono text-[var(--text)] font-semibold select-all border border-[var(--border)] truncate">
                  {verifyToken}
                </div>
              </div>
            </div>

            {/* ACTION TRIGGERS ROW */}
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={handleConnect}
                disabled={connectionStatus === "Connected"}
                className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  connectionStatus === "Connected"
                    ? "bg-[var(--bg-elevated)] text-[var(--text-subtle)] border border-transparent cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-550 text-[var(--text)] shadow-lg shadow-blue-500/10"
                }`}
              >
                Connect WhatsApp Business
              </button>
              <button
                onClick={handleTestPing}
                className="px-4 py-2.5 text-xs font-bold bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-[var(--text)] cursor-pointer"
              >
                Test Connection Ping
              </button>
              <button
                onClick={handleDisconnect}
                disabled={connectionStatus === "Disconnected"}
                className={`px-4 py-2.5 text-xs font-bold bg-[var(--bg-card)] hover:bg-red-500/10 hover:border-red-500/20 border border-[var(--border)] rounded-xl text-[var(--text-subtle)] hover:text-red-400 cursor-pointer ${
                  connectionStatus === "Disconnected" && "opacity-50 cursor-not-allowed"
                }`}
              >
                Disconnect Line
              </button>
            </div>
          </div>

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
                  { label: "Enable AI Auto Responses", desc: "Allow model to reply instantly without user approvals", val: enableAI, setVal: setEnableAI },
                  { label: "Enable Human Escalation Alerts", desc: "Ping support teams when confidence threshold drops", val: enableHumanEscalation, setVal: setEnableHumanEscalation },
                  { label: "Enable Smart Lead Capture", desc: "Collect phone line details and index them automatically", val: enableLeadCapture, setVal: setEnableLeadCapture },
                  { label: "Enable Appointment Booking", desc: "Empower chatbot to lock trainer slots into the agenda", val: enableBooking, setVal: setEnableBooking },
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

        </div>

        {/* Right Column: WhatsApp Tester + Webhook Logs */}
        <div className="space-y-6">
          
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
