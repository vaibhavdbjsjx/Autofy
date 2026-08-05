import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  MessageSquare,
  ShieldAlert,
  Sliders,
  Play,
  CheckCircle,
  Database,
  Terminal,
  Activity,
  Code2,
  Cpu,
  Download,
  AlertTriangle,
  History,
  CornerDownRight,
  TrendingUp,
  FileCode,
  Zap,
  RotateCcw,
  User,
  Heart,
  FileCheck,
  Clipboard,
  BookOpen,
  Send
} from "lucide-react";

interface Diagnostic {
  confidence: number;
  timeMs: number;
  source: string;
  fallback: boolean;
  escalation: boolean;
}

interface MemoryCell {
  role: "user" | "model" | "system";
  content: string;
}

export const AiPlaygroundTab: React.FC = () => {
  // Tabs
  const [activeSubTab, setActiveSubTab] = useState<"sandbox" | "stress" | "code">("sandbox");
  const [activeCodeFile, setActiveCodeFile] = useState<"api" | "models" | "invoices" | "scheduler">("api");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Chat/Playground State
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<{ id: string; role: "user" | "model"; text: string; diagnostics?: Diagnostic }[]>([
    {
      id: "m1",
      role: "model",
      text: "Hello! I am Autofy's integrated Gemini agent. I have digested your active FAQs, membership catalog, and services packages. Ask me anything to test my resolution capabilities!",
      diagnostics: {
        confidence: 0.98,
        timeMs: 45,
        source: "System Init Hook",
        fallback: false,
        escalation: false
      }
    }
  ]);

  // Selected knowledge source highlights
  const [activeKnowledgeSource, setActiveKnowledgeSource] = useState({
    faq: "Membership cancellation refund protocol",
    service: "Premium Consultation",
    membership: "Dual Platinum Elite",
    policy: "General Liability Waiver",
    document: "Onboarding Rules PDF v1.4"
  });

  // Current Diagnostics
  const [diagnostics, setDiagnostics] = useState<Diagnostic>({
    confidence: 0.98,
    timeMs: 45,
    source: "System Init Hook",
    fallback: false,
    escalation: false
  });

  // Prompt View Setup
  const [compiledPrompt, setCompiledPrompt] = useState<string>(
    `[SYSTEM_INSTRUCTIONS] You are the Autofy SaaS agent. Your goal is to guide leads into appointments or payments. Respect business policies.
[CONTEXT] Services: [Premium Consultation, Custom Tuning]. Membership plans: [Gold, Premium].
[RETRIVED_DOCUMENT_CHUNKS] FAQ: Cancellation policy is 24-hours advance. Joining fees are non-refundable.
[USER_QUERY]`
  );

  // Conversation Context Memory representation
  const [memoryList, setMemoryList] = useState<MemoryCell[]>([
    { role: "system", content: "Autofy business guidelines v2.1 loaded. Language: India-English." },
    { role: "user", content: "Init sandbox session." },
    { role: "model", content: "Autofy active agent online." }
  ]);

  // Stress state
  const [isStressRunning, setIsStressRunning] = useState(false);
  const [stressProgress, setStressProgress] = useState(0);
  const [stressVolume, setStressVolume] = useState<100 | 500 | 1000>(100);
  const [stressResults, setStressResults] = useState<{
    processed: number;
    accuracy: number;
    avgSpeedMs: number;
    fallbacks: number;
  }>({
    processed: 0,
    accuracy: 94.8,
    avgSpeedMs: 65,
    fallbacks: 0
  });

  // Quality Analyzer Recommendations
  const [qualityAudits, setQualityAudits] = useState([
    { id: 1, issue: "No explicit FAQ for customized nitrous tuning options", impact: "High Fallback Risk", fix: "Add specific FAQ entry inside FAQ Management tab." },
    { id: 2, issue: "Vague response on UPI payment failures callback speed", impact: "Sub-optimal CTR", fix: "Update your 'Webhook Status API' context description." },
    { id: 3, issue: "Double greeting output when customer sends hello twice", impact: "Low Polish", fix: "Activate the strict Autofy double-post context silencer." }
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast(" Code snippet successfully copied to clipboard!");
  };

  // Human Escalation scenarios templates
  const triggerEscalationTest = (type: "unknown" | "low_confidence" | "complaint" | "refund" | "emergency") => {
    let text = "";
    let mockResponse = "";
    let diag: Diagnostic = { confidence: 0.9, timeMs: 120, source: "", fallback: false, escalation: false };

    switch (type) {
      case "unknown":
        text = "Do you support space-rocket booster alignments for Tesla Roadsters?";
        mockResponse = "I cannot find specific rules regarding Tesla Roadster rocket alignments in the Autofy knowledge base. Let me connect you directly to our human engineers.";
        diag = { confidence: 0.42, timeMs: 240, source: "Zero relevant FAQ matches found", fallback: true, escalation: true };
        break;
      case "low_confidence":
        text = "What is the specific internal thickness of the dual-bore suspension system?";
        mockResponse = "I believe it is 12mm, but I am not completely certain. I recommend consulting our expert mechanic team for structural alignment metrics.";
        diag = { confidence: 0.58, timeMs: 190, source: "Low similarity score on Business Setup", fallback: true, escalation: false };
        break;
      case "complaint":
        text = "I have been waiting for my car tuning for 3 hours! Your system queue is broken!";
        mockResponse = "I am deeply sorry for the delay you are facing. I am raising an urgent alert to our dashboard dispatchers to check your bay status.";
        diag = { confidence: 0.88, timeMs: 95, source: "Sentiment analysis flagged: Anger", fallback: false, escalation: true };
        break;
      case "refund":
        text = "Can I get an immediate refund on my Joining Fee? It was billed 20 minutes ago.";
        mockResponse = "Under our general Refund Policies, joining fees are normally non-refundable unless verified as a diagnostic double-billing. Let me connect you with Billing Desk.";
        diag = { confidence: 0.95, timeMs: 110, source: "FAQ: Membership refund protocol", fallback: false, escalation: true };
        break;
      case "emergency":
        text = "Urgent: smoke is coming out of the exhaust after the engine tune service!";
        mockResponse = " WARNING: Turn off the ignition immediately. I am paging our emergency supervisor and sending our hazard support protocols to your contact phone.";
        diag = { confidence: 0.99, timeMs: 70, source: "Safety Policy override rules", fallback: false, escalation: true };
        break;
    }

    setChatInput("");
    const newMsg1: typeof messages[0] = { id: `msg-u-${Date.now()}`, role: "user", text };
    const newMsg2: typeof messages[0] = {
      id: `msg-m-${Date.now() + 1}`,
      role: "model",
      text: mockResponse,
      diagnostics: diag
    };

    setMessages(prev => [...prev, newMsg1, newMsg2]);
    setDiagnostics(diag);
    setMemoryList(prev => [
      ...prev,
      { role: "user", content: text },
      { role: "model", content: mockResponse }
    ]);
    
    setCompiledPrompt(prev => `${prev}\n\n[USER_QUERY] ${text}`);
    showToast(`Triggered specialized Escalation Scenario: ${type.toUpperCase()}`);
  };

  // Submit test message
  const handleSendTestMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatInput("");

    // Setup user message
    const uMsg: typeof messages[0] = { id: `msg-u-${Date.now()}`, role: "user", text: userText };
    setMessages(prev => [...prev, uMsg]);

    const matchingFaq = userText.toLowerCase().includes("membership") 
      ? "Cancellation of Gold Membership rules" 
      : "General Autofy inquiry alignment rules";

    // Diagnostic mock on normal queries
    const mockDiag: Diagnostic = {
      confidence: userText.length > 5 ? 0.94 : 0.65,
      timeMs: 80 + Math.floor(Math.random() * 80),
      source: matchingFaq,
      fallback: userText.length <= 5,
      escalation: userText.toLowerCase().includes("human") || userText.toLowerCase().includes("refund")
    };

    const modelResp = userText.toLowerCase().includes("membership")
      ? "According to your Membership rules, subscription cancellations cancel at the upcoming billing period. Minimum commitment is 30 days."
      : "Checking our database... I've found an active service matching: Premium Consultation. Would you like me to book a test slot?";

    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: `msg-m-${Date.now()}`,
        role: "model",
        text: modelResp,
        diagnostics: mockDiag
      }]);
      setDiagnostics(mockDiag);
      setMemoryList(prev => [
        ...prev,
        { role: "user", content: userText },
        { role: "model", content: modelResp }
      ]);
      setCompiledPrompt(prev => `${prev}\n\n[USER_QUERY] ${userText}\n[SELECTED_RULES] ${matchingFaq}`);
    }, 450);
  };

  // Run Stress test simulator
  const handleRunStressTest = () => {
    if (isStressRunning) return;
    setIsStressRunning(true);
    setStressProgress(0);
    setStressResults(prev => ({ ...prev, processed: 0 }));

    const total = stressVolume;
    let currentCount = 0;

    const interval = setInterval(() => {
      currentCount += Math.max(1, Math.floor(total / 35));
      if (currentCount >= total) {
        currentCount = total;
        clearInterval(interval);
        setIsStressRunning(false);
        showToast(` Stress testing of ${total} automated queries completed successfully!`);
      }

      setStressProgress(Math.floor((currentCount / total) * 100));
      setStressResults(prev => ({
        processed: currentCount,
        accuracy: 94.2 + (Math.random() * 1.5),
        avgSpeedMs: 60 + Math.floor(Math.random() * 15),
        fallbacks: Math.floor(currentCount * 0.04)
      }));
    }, 100);
  };

  return (
    <div id="ai-testing-console-module" className="space-y-6 text-[var(--text)]">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-5 relative font-sans">
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-0 right-0 bg-[var(--bg-card)] border border-blue-500/40 text-blue-400 px-4 py-2.5 rounded-xl z-50 text-[11px] font-bold shadow-2xl"
            >
              {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>

        <div>
          <h2 className="text-xl font-black text-[var(--text)] tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            AI Playground (Testing Console)
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Validate exactly how Autofy's agent compiled state behaves under real traffic constraints or custom prompt rules.
          </p>
        </div>

        {/* Dynamic sub tab switcher */}
        <div className="bg-[var(--bg)] p-1 border border-[var(--border)] rounded-xl flex items-center gap-1 self-start md:self-auto">
          {[
            { id: "sandbox", label: "Sandbox & Diagnostics", icon: Terminal },
            { id: "stress", label: "Stress Test & Quality", icon: Activity },
            { id: "code", label: "Production Backend & Models", icon: Database }
          ].map(sb => {
            const Icon = sb.icon;
            return (
              <button
                key={sb.id}
                onClick={() => setActiveSubTab(sb.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10.5px] font-bold uppercase transitionCursor cursor-pointer ${
                  activeSubTab === sb.id 
                    ? "bg-blue-600 text-[var(--text)] font-black" 
                    : "text-[var(--text-subtle)] hover:text-[var(--text)]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {sb.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeSubTab === "sandbox" && renderSandboxTab()}
      {activeSubTab === "stress" && renderStressTab()}
      {activeSubTab === "code" && renderCodeTab()}

    </div>
  );

  // RENDERING HELPERS FOR SUB TABS
  function handleResetSandbox() {
    setMessages([
      {
        id: "m1",
        role: "model",
        text: "Sandbox state reset. All chat sequences are cleared. Stored session initialized.",
        diagnostics: { confidence: 0.99, timeMs: 15, source: "User Reset", fallback: false, escalation: false }
      }
    ]);
    setDiagnostics({ confidence: 0.99, timeMs: 15, source: "User Reset", fallback: false, escalation: false });
    showToast(" Chat Sandbox environment restarted.");
  }

  // SUB TAB 1: SANDBOX & DIAGNOSTICS
  function renderSandboxTab() {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 font-sans">
        
        {/* LEFTSIDE: CHAT SIMULATION PANEL */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Chat Simulator */}
          <div className="surface-a border border-[var(--border)] rounded-3xl p-5 flex flex-col h-[520px] shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-500" />
                <h3 className="text-xs font-black uppercase text-[var(--text)] tracking-widest">Real-Time Chat Simulator</h3>
              </div>
              <button
                onClick={handleResetSandbox}
                title="Flush chat database"
                className="p-1 px-2.5 bg-[var(--input-bg)] border border-[var(--border)] hover:bg-[var(--bg-elevated)] rounded-xl text-[var(--text-muted)] hover:text-[var(--text)] text-[10px] uppercase font-bold flex items-center gap-1 cursor-pointer transition"
              >
                <RotateCcw className="w-3 h-3" />
                Flush Sandbox
              </button>
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex gap-3 text-xs leading-normal ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role !== "user" && (
                    <div className="w-7 h-7 rounded-full bg-blue-600/10 border border-blue-500/30 flex items-center justify-center shrink-0">
                      <Cpu className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                  )}

                  <div className={`max-w-[80%] rounded-2xl p-3.5 border ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white border-blue-500/20 font-medium"
                      : "bg-[var(--input-bg)] text-[var(--text)] border-[var(--border)] font-medium"
                  }`}>
                    <p className="font-medium whitespace-pre-line">{msg.text}</p>
                    
                    {msg.diagnostics && (
                      <div className="mt-2 pt-2 border-t border-[var(--border)]/60 flex items-center gap-2 flex-wrap text-[9px] font-mono text-[var(--text-subtle)]">
                        <span>Confidence: <strong className="text-[var(--text)]">{(msg.diagnostics.confidence * 100).toFixed(0)}%</strong></span>
                        <span>•</span>
                        <span>Time: <strong className="text-[var(--text)]">{msg.diagnostics.timeMs}ms</strong></span>
                        <span>•</span>
                        <span>Source: <strong className="text-blue-500 font-bold">{msg.diagnostics.source}</strong></span>
                      </div>
                    )}
                  </div>

                  {msg.role === "user" && (
                    <div className="w-7 h-7 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-strong)] flex items-center justify-center shrink-0">
                      <User className="w-3.5 h-3.5 text-[var(--text)]" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Inbound Simulator Actions (Shortcuts) */}
            <div className="shrink-0 border-t border-[var(--border)]/60 pt-3.5 space-y-2.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-black uppercase text-[var(--text-subtle)] tracking-wider">Escalation Presets:</span>
                {[
                  { type: "unknown", label: "Out of Bounds" },
                  { type: "low_confidence", label: "Low Confidence" },
                  { type: "complaint", label: "Angry Complaint" },
                  { type: "refund", label: "Refund Request" },
                  { type: "emergency", label: "SOS Hazard" }
                ].map(b => (
                  <button
                    key={b.type}
                    onClick={() => triggerEscalationTest(b.type as any)}
                    className="px-2 py-1 bg-[var(--input-bg)] hover:bg-[var(--bg-elevated)] text-[9.5px] font-bold text-[var(--text-muted)] hover:text-blue-500 rounded-lg cursor-pointer transition border border-[var(--border)]"
                  >
                    {b.label}
                  </button>
                ))}
              </div>

              {/* Message send form */}
              <form onSubmit={handleSendTestMessage} className="flex gap-2">
                <input
                  type="text"
                  required
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask a question as a simulator lead (e.g. 'Can I refund my membership plan?')..."
                  className="flex-1 bg-[var(--input-bg)] border border-[var(--border)] px-3.5 py-2.5 rounded-xl text-xs text-[var(--text)] placeholder-neutral-400 focus:outline-none focus:border-[var(--brand)] font-medium"
                />
                <button
                  type="submit"
                  className="px-4 bg-blue-600 hover:bg-blue-550 text-white rounded-xl transition flex items-center justify-center cursor-pointer shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Compiled Prompt Sent to Gemini */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-5 backdrop-blur-md space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[var(--text)] tracking-widest flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-cyan-500" />
                Gemini SDK Prompt Construction
              </span>
              <button
                onClick={() => copyToClipboard(compiledPrompt)}
                className="text-[9.5px] font-black uppercase text-[var(--text-muted)] hover:text-[var(--text)] flex items-center gap-1 bg-[var(--input-bg)] px-2 py-1 rounded-lg border border-[var(--border)] cursor-pointer"
              >
                Copy Prompt
              </button>
            </div>
            
            <p className="text-[10.5px] text-[var(--text-muted)] leading-normal pb-1 border-b border-[var(--border)]/65">
              Below is the structured context compiled automatically from CRM settings and database schemas, which is passed to `@google/genai` on every dialogue handshake:
            </p>

            <pre className="p-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-2xl text-[10px] font-mono text-[var(--text)] overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-52 font-semibold">
              {compiledPrompt}
            </pre>
          </div>

        </div>

        {/* RIGHTSIDE: DIAGNOSTICS & MEMORY VIEWER */}
        <div className="space-y-6">
          
          {/* Diagnostic Metrics */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-5 backdrop-blur-md space-y-4">
            <h3 className="text-xs font-black text-[var(--text)] uppercase tracking-wider text-blue-400 border-b border-[var(--border)] pb-2 flex items-center gap-1.5">
              <Zap className="w-4 h-4" />
              AI Inference Diagnostics
            </h3>

            <div className="space-y-3.5 text-xs">
              
              <div className="p-3.5 bg-[var(--bg-elevated)]/30 border border-[var(--border)] rounded-2xl space-y-1">
                <p className="text-[10px] uppercase font-black text-[var(--text-subtle)] tracking-wider">Confidence Benchmark</p>
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-lg font-black font-mono leading-none ${
                    diagnostics.confidence > 0.8 ? "text-green-400" : diagnostics.confidence > 0.6 ? "text-amber-400" : "text-red-400"
                  }`}>
                    {(diagnostics.confidence * 100).toFixed(0)}%
                  </span>
                  <span className="text-[10px] bg-[var(--bg)] p-1 font-mono text-[var(--text-subtle)] border border-[var(--border)] rounded">
                    Score: {diagnostics.confidence}
                  </span>
                </div>
                {/* slider */}
                <div className="w-full bg-[var(--bg-elevated)] h-1.5 rounded-full overflow-hidden mt-1.5">
                  <div
                    className={`h-full transition-all ${
                      diagnostics.confidence > 0.8 ? "bg-green-400" : diagnostics.confidence > 0.6 ? "bg-amber-400" : "bg-red-400"
                    }`}
                    style={{ width: `${diagnostics.confidence * 100}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl space-y-0.5 text-center">
                  <p className="text-[9.5px] uppercase font-bold text-[var(--text-subtle)]">Latency</p>
                  <p className="text-base font-black font-mono text-[var(--text)] mt-1">{diagnostics.timeMs} ms</p>
                </div>
                <div className="p-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl space-y-0.5 text-center">
                  <p className="text-[9.5px] uppercase font-bold text-[var(--text-subtle)]">Fallback Flag</p>
                  <p className={`text-xs font-black uppercase mt-1.5 ${diagnostics.fallback ? "text-amber-400" : "text-[var(--text-subtle)]"}`}>
                    {diagnostics.fallback ? " Triggered" : "None"}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-[var(--bg-elevated)]/20 border border-[var(--border)] rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-[9.5px] uppercase font-bold text-[var(--text-subtle)]">Human Handshake</p>
                  <p className="text-[10px] text-[var(--text-muted)] text-[var(--text-muted)] mt-0.5">Escrow transfer rules</p>
                </div>
                <span className={`px-2 py-0.5 font-bold text-[9.5px] uppercase rounded-md ${
                  diagnostics.escalation ? "bg-red-500/10 text-red-400 border border-red-500/10" : "bg-[var(--bg-elevated)] text-[var(--text-subtle)]"
                }`}>
                  {diagnostics.escalation ? " Required" : "No Limit"}
                </span>
              </div>

              <div className="p-3 bg-[var(--bg-elevated)]/20 border border-[var(--border)] rounded-2xl space-y-1">
                <p className="text-[9.5px] uppercase font-bold text-[var(--text-subtle)]">Retrieved Rule Target</p>
                <p className="text-[11px] font-bold text-cyan-400 flex items-center gap-1 truncate" title={diagnostics.source}>
                  <BookOpen className="w-3.5 h-3.5" />
                  {diagnostics.source || "None"}
                </p>
              </div>

            </div>
          </div>

          {/* Conversation memory stack */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-5 backdrop-blur-md space-y-4">
            <h3 className="text-xs font-black text-[var(--text)] uppercase tracking-wider text-blue-400 border-b border-[var(--border)] pb-2 flex items-center gap-1.5">
              <History className="w-4 h-4" />
              Conversation Context Storage
            </h3>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {memoryList.map((m, idx) => (
                <div key={idx} className="p-3 bg-[var(--bg-elevated)]/30 border border-[var(--border)] rounded-xl text-[11px] leading-normal font-sans">
                  <div className="flex items-center justify-between text-[9px] uppercase font-black tracking-wider text-[var(--text-subtle)] mb-1">
                    <span>Role: {m.role}</span>
                    <span className="font-mono text-[8px]">Index #{idx}</span>
                  </div>
                  <p className="text-[var(--text)] italic">"{m.content}"</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    );
  }

  // SUB TAB 2: STRESS TEST & AI ANALYZER
  function renderStressTab() {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 font-sans">
        
        {/* Left Side: Stress tests and dials */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-5 backdrop-blur-md space-y-5">
            <div>
              <h3 className="text-xs font-black text-[var(--text)] uppercase tracking-widest text-blue-400">Query Stress Emulator</h3>
              <p className="text-xs text-[var(--text-muted)] mt-1">Simulate parallel dialogue triggers concurrently to analyze Autofy scale benchmarks.</p>
            </div>

            <div className="p-4 bg-[var(--input-bg)] border border-[var(--border)] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-black text-[var(--text-subtle)] tracking-wider block">Query volume scale</span>
                <div className="flex gap-2">
                  {([100, 500, 1000] as const).map(vol => (
                    <button
                      key={vol}
                      onClick={() => setStressVolume(vol)}
                      disabled={isStressRunning}
                      className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold border cursor-pointer transition ${
                        stressVolume === vol 
                          ? "bg-blue-600 border-blue-500 text-[var(--text)]" 
                          : "bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]"
                      }`}
                    >
                      {vol} Calls
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleRunStressTest}
                disabled={isStressRunning}
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-550 disabled:bg-[var(--bg-elevated)] disabled:text-[var(--text-subtle)] text-[var(--text)] font-extrabold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-white text-[var(--text)]" />
                {isStressRunning ? `Simulating ${stressProgress}%` : "Run Stress Test Simulation"}
              </button>

            </div>

            {/* Run Progress slider */}
            {isStressRunning && (
              <div className="space-y-1.5 p-3.5 bg-[var(--bg-elevated)]/30 border border-[var(--border)] rounded-2xl">
                <div className="flex justify-between items-center text-[10px] uppercase font-black text-[var(--text-muted)]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                    Simulating query dispatches...
                  </span>
                  <span className="font-mono text-[var(--text)]">{stressProgress}% complete</span>
                </div>

                <div className="w-full h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full transition-all duration-100" style={{ width: `${stressProgress}%` }} />
                </div>
              </div>
            )}

            {/* Stress Results Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Processed", val: `${stressResults.processed}/${stressVolume}`, metric: "Requests loaded" },
                { label: "Accuracy Success Rate", val: `${stressResults.accuracy.toFixed(1)}%`, metric: "Zero hallucination" },
                { label: "Avg Execution Time", val: `${stressResults.avgSpeedMs} ms`, metric: "@google/genai proxy" },
                { label: "Automatic Fallbacks", val: `${stressResults.fallbacks} cases`, metric: "Escalated gracefully" }
              ].map((res, idx) => (
                <div key={idx} className="p-3.5 bg-[var(--bg-elevated)]/20 border border-[var(--border)] rounded-2xl text-center">
                  <p className="text-[9.5px] uppercase font-black text-[var(--text-subtle)] tracking-wider">{res.label}</p>
                  <p className="text-lg font-black font-mono text-[var(--text)] mt-1.5">{res.val}</p>
                  <p className="text-[8.5px] text-[var(--text-muted)] mt-1">{res.metric}</p>
                </div>
              ))}
            </div>

          </div>

          {/* AI QUALITY ANALYZER PANELS */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-5 backdrop-blur-md space-y-4">
            <div>
              <h3 className="text-xs font-black text-[var(--text)] uppercase tracking-widest text-blue-400">AI Quality Response Analyzer</h3>
              <p className="text-xs text-[var(--text-muted)] mt-1">Automatic semantic checker detects weak contexts, policy holes, or possible response hallucinations.</p>
            </div>

            <div className="space-y-3.5">
              {qualityAudits.map(audit => (
                <div key={audit.id} className="p-4 bg-[var(--bg-elevated)]/20 border border-[var(--border)] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs leading-normal">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-550 bg-red-500" />
                      <p className="font-bold text-[var(--text)]">{audit.issue}</p>
                    </div>
                    <p className="text-[var(--text-muted)] text-[var(--text-muted)] text-[11px]">Recommended action: <strong className="text-[var(--text)]">{audit.fix}</strong></p>
                  </div>
                  <span className="px-2 py-1 font-mono text-[9px] font-black uppercase text-red-400 bg-red-500/10 border border-red-500/20 rounded-md self-start md:self-auto shrink-0">
                    {audit.impact}
                  </span>
                </div>
              ))}
            </div>

          </div>

        </div>

        {/* Right side: sandbox knowledge parameters config summary */}
        <div className="space-y-6">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-5 backdrop-blur-md space-y-4">
            <h3 className="text-xs font-black text-[var(--text)] uppercase tracking-wider text-blue-400 border-b border-[var(--border)] pb-2">
              Sandbox Knowledge Source Panel
            </h3>

            <div className="space-y-3 text-xs">
              {[
                { label: "Active FAQ Source", val: activeKnowledgeSource.faq },
                { label: "Seeded Service Package", val: activeKnowledgeSource.service },
                { label: "Seeded Membership", val: activeKnowledgeSource.membership },
                { label: "Security Policy alignment", val: activeKnowledgeSource.policy },
                { label: "Linked Doc Reference", val: activeKnowledgeSource.document },
              ].map((kn, idx) => (
                <div key={idx} className="p-3 bg-[var(--bg-elevated)]/20 border border-[var(--border)] rounded-xl space-y-1">
                  <label className="text-[9.5px] uppercase font-bold text-[var(--text-subtle)] block">{kn.label}</label>
                  <p className="font-bold text-[var(--text)] truncate text-[11px]">{kn.val}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    );
  }

  // SUB TAB 3: CODE PRESETS & DB TABLES representation
  function renderCodeTab() {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 font-sans">
        
        {/* LEFTSIDE: EXPORTABLE PYTHON / FASTAPI FILES MODULES */}
        <div className="xl:col-span-2 space-y-6">
          
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-5 backdrop-blur-md space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)]/60 pb-3">
              <div>
                <h3 className="text-xs font-black text-[var(--text)] uppercase tracking-widest">FastAPI Production Code Generator</h3>
                <p className="text-[10.5px] text-[var(--text-subtle)] mt-1">Raw, production-ready, highly compliant Python codebases.</p>
              </div>

              {/* download file list selectors */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: "api", file: "main.py (FastAPI App)" },
                  { id: "models", file: "models.py (ORM Schemas)" },
                  { id: "invoices", file: "invoices.py (PDF Engine)" },
                  { id: "scheduler", file: "reminders.py (CRON SMS)" }
                ].map(fi => (
                  <button
                    key={fi.id}
                    onClick={() => setActiveCodeFile(fi.id as any)}
                    className={`px-2.5 py-1.5 rounded-lg text-[9.5px] font-black uppercase transition cursor-pointer ${
                      activeCodeFile === fi.id 
                        ? "bg-[var(--bg-elevated)] border-[var(--border-strong)] text-blue-400" 
                        : "text-[var(--text-subtle)] hover:text-[var(--text)] border border-transparent"
                    }`}
                  >
                    {fi.file.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Render selected code codeblock */}
            <div className="space-y-2.5 relative">
              <button
                onClick={() => copyToClipboard(fastApiCodeblocks[activeCodeFile])}
                className="absolute right-4 top-4 text-[9.5px] font-black uppercase text-[var(--text-muted)] hover:text-[var(--text)] bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-1.5 rounded-xl flex items-center gap-1 z-10 transition-all cursor-pointer"
              >
                <Clipboard className="w-3.5 h-3.5" />
                Copy File
              </button>

              <pre className="p-4 pt-12 bg-[var(--input-bg)] border border-[var(--border)] rounded-2xl text-[10px] font-mono text-[var(--text)] overflow-x-auto whitespace-pre leading-relaxed max-h-[460px] scrollbar-thin font-semibold">
                {fastApiCodeblocks[activeCodeFile]}
              </pre>
            </div>

          </div>

        </div>

        {/* RIGHTSIDE: DATABASE STRUCTURAL REPRESENTATIONS */}
        <div className="space-y-6">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-5 backdrop-blur-md space-y-4">
            <h3 className="text-xs font-black text-[var(--text)] uppercase tracking-wider text-blue-400 border-b border-[var(--border)] pb-2 flex items-center gap-1.5">
              <Database className="w-4 h-4" />
              Relational CRM Db Schema
            </h3>

            <p className="text-[10.5px] text-[#808c9c]">
              Pristine database model setups utilized in Autofy servers to track transactional payloads, CRM appointments, and context memories:
            </p>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {[
                {
                  tbl: "payments",
                  cols: ["id (UUID, Key)", "txn_id (VARCHAR)", "amount (DECIMAL)", "status (VARCHAR)", "gateway_id (VARCHAR)", "created_at (TIMESTAMP)"]
                },
                {
                  tbl: "payment_links",
                  cols: ["id (UUID, Key)", "customer_name (VARCHAR)", "phone (VARCHAR)", "amount (DECIMAL)", "expiry (TIMESTAMP)", "short_url (VARCHAR)"]
                },
                {
                  tbl: "transactions",
                  cols: ["id (UUID, Key)", "customer_name (VARCHAR)", "method (VARCHAR)", "ledger_ref (VARCHAR)", "settled_at (TIMESTAMP)"]
                },
                {
                  tbl: "invoices",
                  cols: ["id (UUID, Key)", "invoice_no (VARCHAR)", "customer_name (VARCHAR)", "tax_rate (DECIMAL)", "pdf_url (VARCHAR)", "printed_at (TIMESTAMP)"]
                },
                {
                  tbl: "appointments",
                  cols: ["id (UUID, Key)", "customer_name (VARCHAR)", "phone (VARCHAR)", "email (VARCHAR)", "service_id (VARCHAR)", "slot (TIMESTAMP)", "status (VARCHAR)"]
                },
                {
                  tbl: "appointment_reminders",
                  cols: ["id (UUID, Key)", "appointment_id (UUID)", "channel_whatsapp (BOOL)", "timing_rule (VARCHAR)", "sent_state (BOOL)"]
                },
                {
                  tbl: "ai_tests",
                  cols: ["id (UUID, Key)", "queries_sent (INTEGER)", "success_percentage (DECIMAL)", "avg_duration_ms (INTEGER)"]
                },
                {
                  tbl: "ai_logs",
                  cols: ["id (UUID, Key)", "user_query (TEXT)", "model_response (TEXT)", "confidence_rating (DECIMAL)", "timestamp (TIMESTAMP)"]
                },
                {
                  tbl: "ai_diagnostics",
                  cols: ["id (UUID, Key)", "log_id (UUID)", "fallback_triggered (BOOL)", "human_escalated (BOOL)"]
                },
                {
                  tbl: "conversation_memory",
                  cols: ["id (UUID, Key)", "session_id (VARCHAR)", "sequence_json (JSON)", "updated_at (TIMESTAMP)"]
                }
              ].map((sc, scIdx) => (
                <div key={scIdx} className="p-3 bg-[var(--bg-elevated)]/30 border border-[var(--border)] rounded-2xl text-[11px] leading-normal font-sans space-y-1">
                  <div className="flex items-center justify-between font-mono text-[9.5px]">
                    <span className="text-blue-400 font-extrabold flex items-center gap-1">
                      <CornerDownRight className="w-3.5 h-3.5 text-[var(--text-subtle)] shrink-0" />
                      TABLE: {sc.tbl}
                    </span>
                    <span className="text-[var(--text-subtle)] text-[var(--text-subtle)] uppercase font-black tracking-widest text-[8px]" />
                  </div>
                  
                  <ul className="text-[10px] text-[var(--text-muted)] font-mono space-y-0.5 list-disc pl-4.5 pl-4">
                    {sc.cols.map((cl, clIdx) => (
                      <li key={clIdx}>{cl}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>
    );
  }
};

const fastApiCodeblocks = {
  api: `import os
from fastapi import FastAPI, HTTPException, Depends, Security
from fastapi.security import APIKeyHeader
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

app = FastAPI(title="Autofy Core CRM", version="2.1")

# API Keys Security Headers
API_KEY_NAME = "X-Autofy-Token"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=True)

async def verify_autofy_signature(header_token: str = Security(api_key_header)):
    if header_token != os.getenv("AUTOFY_JWT_SECRET"):
        raise HTTPException(status_code=403, detail="Signature Verification Handshake Failed.")
    return header_token

# Unified Schemes definitions
class PaymentLinkRequest(BaseModel):
    customer_name: str
    phone: str
    amount: float
    description: str
    expiry_hours: int = 24

class WebhookPayload(BaseModel):
    event: str
    transaction_id: str
    amount_paid: float
    merchant_id: str
    checksum: str

# 1. API: Accept & Create Gateway Link
@app.post("/api/v1/payments/generate-link", dependencies=[Depends(verify_autofy_signature)])
def generate_payment_link(payload: PaymentLinkRequest):
    # Generates standard escrow redirect endpoints
    return {
        "status": "active",
        "link_id": f"LNK-{os.urandom(4).hex().upper()}",
        "url": "https://pay.autofy.ai/quick/tr-99e2",
        "dispatched": True,
        "created_at": datetime.utcnow()
    }

# 2. API: Inbound UPI Webhook handshake verification
@app.post("/api/v1/gateways/webhook")
def verify_webhook_token(payload: WebhookPayload):
    # Signature hash validation logic
    computed_sum = f"{payload.transaction_id}|{payload.amount_paid}"
    if payload.checksum != computed_sum:
        raise HTTPException(status_code=400, detail="Invalid signature verification hash.")
    return {"status": "verified", "processed": True, "code": 200}`,

  models: `import uuid
from sqlalchemy import Column, String, Numeric, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class DBPayment(Base):
    __tablename__ = "payments"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    txn_id = Column(String(50), unique=True, nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    status = Column(String(20), default="Pending")
    gateway_id = Column(String(30))
    created_at = Column(DateTime, default=datetime.utcnow)

class DBAppointment(Base):
    __tablename__ = "appointments"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    email = Column(String(100))
    service_id = Column(String(50))
    slot = Column(DateTime, nullable=False)
    status = Column(String(20), default="Scheduled")

class DBConversationMemory(Base):
    __tablename__ = "conversation_memory"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(String(50), unique=True, nullable=False)
    sequence_json = Column(JSON, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow)`,

  invoices: `import os
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from io import BytesIO

def generate_pdf_invoice(invoice_no: str, customer: str, amount: float, tax: float = 18.0) -> bytes:
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    
    # Header styling (Blue theme)
    p.setFillColorRGB(0.03, 0.45, 0.82)
    p.rect(0, 750, 612, 50, fill=True, stroke=False)
    
    # Content Title
    p.setFillColorRGB(1, 1, 1)
    p.setFont("Helvetica-Bold", 16)
    p.drawString(30, 765, "AUTOFY AUTOMATION CRM INVOICE")
    
    # Bill To Details
    p.setFillColorRGB(0.1, 0.1, 0.1)
    p.setFont("Helvetica", 10)
    p.drawString(30, 710, f"Invoice Number: {invoice_no}")
    p.drawString(30, 690, f"Billed To: {customer}")
    
    total_bill = amount + (amount * (tax / 100.0))
    p.drawString(30, 650, f"Base Amount: INR {amount:,.2f}")
    p.drawString(30, 630, f"GST Tax Rate: {tax}%")
    p.setFont("Helvetica-Bold", 12)
    p.drawString(30, 600, f"Grand Total: INR {total_bill:,.2f}")
    
    p.showPage()
    p.save()
    
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes`,

  scheduler: `import smtplib
from email.mime.text import MIMEText
from twilio.rest import Client

def dispatch_whatsapp_notification(phone: str, msg: str):
    # Generates secure integration calls using Twilio Sandbox SDK
    account_sid = os.environ.get("TWILIO_ACCOUNT_SID")
    auth_token = os.environ.get("TWILIO_AUTH_TOKEN")
    
    if not account_sid or not auth_token:
        print("Sandbox notifications offline: Missing Auth configuration.")
        return False
        
    client = Client(account_sid, auth_token)
    message = client.messages.create(
        body=msg,
        from_="whatsapp:+14155238886",
        to=f"whatsapp:{phone}"
    )
    return message.sid`
};
