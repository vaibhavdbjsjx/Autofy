import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Building2,
  Cpu,
  Users,
  Bell,
  Shield,
  CreditCard,
  Layers,
  Key,
  X,
  Trash2,
  AlertTriangle,
  Upload,
  Clock,
  Globe,
  Settings,
  ChevronRight,
  Plus,
  HelpCircle,
  QrCode,
  Smartphone,
  MapPin,
  RefreshCw,
  Sliders,
  Check,
  Power,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
  Download,
  ExternalLink,
  Lock,
  Mail,
  UserCheck,
  CheckCircle,
  FileText,
  DollarSign
} from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Manager" | "Support Agent";
  status: "Active" | "Pending" | "Inactive";
}

interface SettingsTabProps {
  onboardingData?: any;
  triggerNotification: (text: string) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ onboardingData, triggerNotification }) => {
  // Navigation categories state
  const [activeCategory, setActiveCategory] = useState<string>("profile");
  
  // Custom states tracking Save Status / Autosave simulations
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Save changes trigger helper
  const triggerAutoSave = (feedbackMessage: string = "Settings saved successfully") => {
    setSaveStatus("saving");
    setTimeout(() => {
      setSaveStatus("saved");
      triggerNotification(` ${feedbackMessage}`);
      setTimeout(() => setSaveStatus("idle"), 2500);
    }, 1200);
  };

  // 1. BUSINESS PROFILE FORM STATES
  const [profile, setProfile] = useState({
    businessName: onboardingData?.businessName || "Autofy Premium SaaS",
    businessType: onboardingData?.businessType || "Automotive Direct Dealership",
    phone: onboardingData?.whatsappNumber || "+91 98765 43210",
    email: "owner@autofysaas.com",
    address: "742 Evergreen Terrace, Sector V, Salt Lake",
    website: "https://autofysaas.com",
    hours: "09:00 AM - 07:00 PM (Mon - Sat)",
    timezone: "IST - Kolkata (GMT+5:30)",
    logoPreview: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&h=120&q=80"
  });

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    triggerAutoSave("Business profile saved successfully!");
  };

  // 2. AI ASSISTANT CONFIGURATION STATES
  const [aiConfig, setAiConfig] = useState({
    assistantName: onboardingData?.agentName || "AutoBot Elite",
    welcomeMessage: onboardingData?.welcomeMessage || "Welcome to Autofy! How can I assist you with your premium booking today?",
    fallbackMessage: "I apologize, I am unable to resolve this request immediately. A professional service manager will assist you shortly.",
    tone: "premium" as "professional" | "friendly" | "casual" | "premium",
    responseLength: "medium" as "short" | "medium" | "detailed",
    humanEscalation: true,
    confidenceThreshold: 78,
    knowledgeAutoUpdate: true
  });

  const handleAiSave = (e: React.FormEvent) => {
    e.preventDefault();
    triggerAutoSave("AI Assistant agent behaviors re-calibrated!");
  };

  // 3. TEAM MEMBERS MANAGEMENT STATES
  const [team, setTeam] = useState<TeamMember[]>([
    { id: "tm-1", name: "Vaibhav Saxena", email: "vaibhav.sg18@gmail.com", role: "Owner", status: "Active" },
    { id: "tm-2", name: "Anish Chatterjee", email: "anish.c@autofysaas.com", role: "Admin", status: "Active" },
    { id: "tm-3", name: "Ria Sengupta", email: "ria@autofysaas.com", role: "Manager", status: "Active" },
    { id: "tm-4", name: "Ketan Mehta", email: "ketan.m@autofysaas.com", role: "Support Agent", status: "Pending" }
  ]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"Admin" | "Manager" | "Support Agent">("Support Agent");

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) {
      triggerNotification(" Please provide teammate name and email.");
      return;
    }
    const newTeammate: TeamMember = {
      id: `tm-${Date.now()}`,
      name: inviteName,
      email: inviteEmail,
      role: inviteRole as any,
      status: "Pending"
    };
    setTeam((prev) => [...prev, newTeammate]);
    setInviteName("");
    setInviteEmail("");
    setShowInviteModal(false);
    triggerNotification(` Dispatched registration invite to: ${inviteEmail}`);
  };

  const handleRemoveTeammate = (id: string, name: string) => {
    setTeam((prev) => prev.filter((tm) => tm.id !== id));
    triggerNotification(` Revoked access credentials for: ${name}`);
  };

  // 4. NOTIFICATIONS TOGGLES STATES
  const [notifs, setNotifs] = useState({
    newLead: true,
    payment: true,
    appointment: true,
    whatsappAlerts: true,
    emailAlerts: false,
    pushNotifs: true,
    summaryDaily: true,
    summaryWeekly: false
  });

  const toggleNotif = (key: keyof typeof notifs) => {
    setNotifs((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      triggerAutoSave("Notification preferences synchronized");
      return updated;
    });
  };

  // 5. SECURITY SYSTEM STATES
  const [passwordState, setPasswordState] = useState({ current: "", next: "", confirm: "" });
  const [enable2FA, setEnable2FA] = useState(false);
  const [sessions, setSessions] = useState([
    { id: "s-1", browser: "Chrome on macOS Venture", ip: "103.88.22.45 (Current)", location: "Kolkata, India", date: "Active now" },
    { id: "s-2", browser: "Safari on iPhone 15 Pro", ip: "21.140.92.8", location: "Kolkata, India", date: "2 hours ago" },
    { id: "s-3", browser: "Firefox on Windows 11 Enterprise", ip: "84.32.204.11", location: "San Francisco, USA", date: "June 18, 2026" }
  ]);

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordState.current || !passwordState.next) {
      triggerNotification(" Please fill in current and next password parameters.");
      return;
    }
    if (passwordState.next !== passwordState.confirm) {
      triggerNotification(" Next and confirm password passwords do not match.");
      return;
    }
    setPasswordState({ current: "", next: "", confirm: "" });
    triggerNotification(" Password credentials updated! All active session tokens updated.");
  };

  const handleLogoutAllDevices = () => {
    setSessions((prev) => prev.filter((s) => s.id === "s-1")); // keep current active session
    triggerNotification(" Terminated other active login sessions successfully.");
  };

  // 6. BILLING AND SUBSCRIPTION INFORMATION STATES
  const [billingPlan, setBillingPlan] = useState({
    name: "Growth Enterprise Premium",
    cost: "₹14,999/month",
    currentPeriod: "May 20, 2026 - Jun 20, 2026",
    renewalDate: "June 20, 2026",
    messagesUsed: 4250,
    messagesLimit: 10000,
    leadsCaptures: 1420,
    leadsLimit: 5000,
    paymentMethodCard: "Visa ending in 4242"
  });

  // Billing history list
  const [invoices] = useState([
    { id: "inv-05", date: "2026-05-20", amount: "₹14,999", status: "Paid" },
    { id: "inv-04", date: "2026-04-20", amount: "₹14,999", status: "Paid" },
    { id: "inv-03", date: "2026-03-20", amount: "₹14,999", status: "Paid" },
    { id: "inv-02", date: "2026-02-20", amount: "₹9,999", status: "Paid" }
  ]);

  // 7. DEVELOPER API CREDENTIALS STATES
  const [primaryApiKey, setPrimaryApiKey] = useState("af_live_9fae15549887cd8c8db990");
  const [showApiKey, setShowApiKey] = useState(false);
  const [webhookSecret, setWebhookSecret] = useState("whsec_5464d1f2efac9ebb7c1c0");

  const handleRegenerateApiKey = () => {
    const randHex = Array.from({ length: 22 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    setPrimaryApiKey(`af_live_${randHex}`);
    triggerNotification(" Regenerated secure production API access key. Ensure client services compile new key!");
  };

  // 8. DANGER ZONE CONFIRMATION MODEL
  const [dangerConfirmModal, setDangerConfirmModal] = useState<null | "data" | "account" | "kb">(null);

  const handleExecuteDangerAction = () => {
    if (dangerConfirmModal === "data") {
      triggerNotification(" Dispatched deep destruction request: All user logs, database leads values, and history deleted.");
    } else if (dangerConfirmModal === "account") {
      triggerNotification(" Workspace deactivated! Account subscription canceled and team deauthorized.");
    } else if (dangerConfirmModal === "kb") {
      triggerNotification(" Re-initialized AI Assistant knowledge base. Training set reverted to standard model templates.");
    }
    setDangerConfirmModal(null);
  };

  // Render Sidebar Nav item
  const renderNavItem = (id: string, label: string, icon: React.ReactNode) => {
    const isActive = activeCategory === id;
    return (
      <button
        key={id}
        onClick={() => {
          setActiveCategory(id);
          triggerNotification(` Switched Settings category: ${label}`);
        }}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition cursor-pointer text-left ${
          isActive
            ? "bg-blue-600/10 border border-blue-500/20 text-white font-bold"
            : "text-neutral-400 hover:text-white hover:bg-var(--bg-elevated)/40 border border-transparent"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className={`${isActive ? "text-blue-400" : "text-neutral-400"}`}>{icon}</span>
          <span className="text-xs font-sans">{label}</span>
        </div>
        <ChevronRight className={`w-3.5 h-3.5 opacity-50 ${isActive ? "text-blue-400 transform translate-x-0.5" : "text-neutral-600"}`} />
      </button>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Title Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-neutral-950/40 to-[#0e0e12]/60 border border-var(--border) rounded-3xl p-6 backdrop-blur-md">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-500 animate-[spin_5s_linear_infinite]" /> Settings <span className="bg-blue-500/10 text-blue-400 font-mono text-[9px] px-2 py-0.5 rounded-full border border-blue-500/10 font-bold">Autofy Console</span>
          </h2>
          <p className="text-xs text-neutral-400 font-medium mt-1">Manage your business parameters, AI assistant models behavior, team controls, notification pipelines, and developer tokens securely.</p>
        </div>

        {/* Dynamic Auto Save Status Bar */}
        <div className="flex items-center gap-2">
          <AnimatePresence mode="wait">
            {saveStatus === "saving" && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex items-center gap-2 bg-blue-500/5 border border-blue-500/10 px-4 py-2 rounded-xl text-[11px] text-blue-400"
              >
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Saving parameters...</span>
              </motion.div>
            )}
            {saveStatus === "saved" && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl text-[11px] text-emerald-400 font-medium"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Changes saved successfully</span>
              </motion.div>
            )}
            {saveStatus === "idle" && (
              <div className="text-[10px] text-neutral-500 font-mono bg-var(--bg-elevated)/40 border border-var(--border) px-3 py-2 rounded-xl">
                SYSTEM LINKED · GMT +5:30
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Grid Viewport Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: NAVIGATION SIDECAR */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-[#09090b]/80 border border-var(--border) rounded-2xl p-4 space-y-1">
            <span className="text-[10px] font-black uppercase text-neutral-500 tracking-wider px-4 py-2 block">Settings Console</span>
            
            {renderNavItem("profile", "Business Profile", <Building2 className="w-4 h-4" />)}
            {renderNavItem("ai", "AI Assistant Settings", <Cpu className="w-4 h-4" />)}
            {renderNavItem("team", "Team Members", <Users className="w-4 h-4" />)}
            {renderNavItem("notifications", "Notifications Alerts", <Bell className="w-4 h-4" />)}
            {renderNavItem("security", "Security & Keys", <Shield className="w-4 h-4" />)}
            {renderNavItem("billing", "Billing & Payments", <CreditCard className="w-4 h-4" />)}
            {renderNavItem("api", "API & Webhook Access", <Key className="w-4 h-4" />)}
          </div>

          <div className="bg-neutral-950 border border-var(--border) rounded-2xl p-4 text-center text-xs">
            <p className="text-neutral-400 font-bold">Questions on security?</p>
            <p className="text-[10px] text-neutral-500 mt-1 mb-3">Enterprise configurations require secure TLS parameters and authorization clearances.</p>
            <a href="/docs/security" target="_blank" className="text-[11px] text-blue-400 hover:text-white font-bold flex items-center justify-center gap-1">
              Read Security Manual <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE CONFIGURATION workspace */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* CATEGORY 1: BUSINESS PROFILE */}
          {activeCategory === "profile" && (
            <form onSubmit={handleProfileSave} className="bg-neutral-950 border border-var(--border) rounded-3xl p-6 md:p-8 space-y-6">
              <div className="border-b border-var(--border) pb-4">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-blue-500" /> Business Profile Information
                </h3>
                <p className="text-[10.5px] text-neutral-500 mt-0.5">Control how your customer-facing contact references are logged, indexed, and displayed in templates.</p>
              </div>

              {/* Logo Upload Segment */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-var(--bg-elevated)/10 border border-var(--border) rounded-2xl">
                <img
                  src={profile.logoPreview}
                  alt="Business Logo"
                  className="w-16 h-16 rounded-2xl object-cover border border-neutral-800 shrink-0"
                />
                <div className="space-y-1.5 text-center sm:text-left">
                  <p className="text-xs font-black text-white">Upload New Logo</p>
                  <p className="text-[10px] text-neutral-500 leading-normal">Requires PNG or JPEG file. Recommended size 512x512px. Max capacity allocated size 2MB.</p>
                  <div className="flex items-center gap-2 justify-center sm:justify-start pt-1.5">
                    <button
                      type="button"
                      onClick={() => triggerNotification(" File selector native simulation triggered.")}
                      className="px-3 py-1.5 bg-var(--bg-elevated) border border-neutral-800 hover:border-neutral-700 text-[10.5px] font-bold text-neutral-300 rounded-xl transition cursor-pointer flex items-center gap-1"
                    >
                      <Upload className="w-3.5 h-3.5" /> Upload Image
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProfile((prev) => ({ ...prev, logoPreview: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&h=120&q=80" }));
                        triggerNotification(" Reverted logo layout.");
                      }}
                      className="px-3 py-1.5 text-red-400 hover:text-white hover:bg-red-950/20 text-[10px] font-medium rounded-xl transition cursor-pointer"
                    >
                      Reset Default
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans text-xs">
                
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-neutral-500 tracking-wider">Business / Studio Name</label>
                  <input
                    type="text"
                    required
                    value={profile.businessName}
                    onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                    className="w-full bg-[#0a0a0d] border border-var(--border) p-3 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-neutral-500 tracking-wider">Business Classification Type</label>
                  <input
                    type="text"
                    required
                    value={profile.businessType}
                    onChange={(e) => setProfile({ ...profile, businessType: e.target.value })}
                    className="w-full bg-[#0a0a0d] border border-var(--border) p-3 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-neutral-500 tracking-wider">Contact Phone Number (WhatsApp Node)</label>
                  <input
                    type="text"
                    required
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full bg-[#0a0a0d] border border-var(--border) p-3 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/50 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-neutral-500 tracking-wider">Support Email Address</label>
                  <input
                    type="email"
                    required
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full bg-[#0a0a0d] border border-var(--border) p-3 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/50"
                  />
                </div>

                <div className="col-span-full space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-neutral-500 tracking-wider">Corporate Physical Address</label>
                  <input
                    type="text"
                    required
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    className="w-full bg-[#0a0a0d] border border-var(--border) p-3 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-neutral-500 tracking-wider">Website URL Domain</label>
                  <input
                    type="text"
                    required
                    value={profile.website}
                    onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                    className="w-full bg-[#0a0a0d] border border-var(--border) p-3 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/50 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-neutral-500 tracking-wider">Operational Business Hours Range</label>
                  <input
                    type="text"
                    required
                    value={profile.hours}
                    onChange={(e) => setProfile({ ...profile, hours: e.target.value })}
                    className="w-full bg-[#0a0a0d] border border-var(--border) p-3 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/50"
                  />
                </div>

                <div className="col-span-full space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-neutral-500 tracking-wider flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-neutral-500" /> Default Portal System Timezone
                  </label>
                  <select
                    value={profile.timezone}
                    onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                    className="w-full bg-[#0a0a0d] border border-var(--border) p-3 rounded-xl text-white focus:outline-none cursor-pointer focus:border-blue-500/50 font-sans"
                  >
                    <option>IST - Kolkata (GMT+5:30)</option>
                    <option>EST - New York (GMT-5:00)</option>
                    <option>PST - San Francisco (GMT-8:00)</option>
                    <option>GMT - London (GMT+0:00)</option>
                  </select>
                </div>

              </div>

              <div className="pt-4 border-t border-var(--border) flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs px-6 py-2.5 rounded-xl transition duration-200 shadow-md cursor-pointer"
                >
                  Save Business Changes
                </button>
              </div>
            </form>
          )}

          {/* CATEGORY 2: AI ASSISTANT SETTINGS */}
          {activeCategory === "ai" && (
            <form onSubmit={handleAiSave} className="bg-neutral-950 border border-var(--border) rounded-3xl p-6 md:p-8 space-y-6">
              
              <div className="border-b border-var(--border) pb-4">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-blue-500" /> AI Behavior Configuration
                </h3>
                <p className="text-[10.5px] text-neutral-500 mt-0.5">Finetune cognitive responses, support escalation rules, and system tone metrics to maximize customer conversions.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans text-xs">
                
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-neutral-500 tracking-wider">Assistant Custom Alias</label>
                  <input
                    type="text"
                    required
                    value={aiConfig.assistantName}
                    onChange={(e) => setAiConfig({ ...aiConfig, assistantName: e.target.value })}
                    className="w-full bg-[#0a0a0d] border border-var(--border) p-3 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-neutral-500 tracking-wider flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-neutral-500" /> Response Tone Accent
                  </label>
                  <select
                    value={aiConfig.tone}
                    onChange={(e) => setAiConfig({ ...aiConfig, tone: e.target.value as any })}
                    className="w-full bg-[#0a0a0d] border border-var(--border) p-3 rounded-xl text-white focus:outline-none cursor-pointer focus:border-blue-500/50 capitalize"
                  >
                    <option value="professional">Professional</option>
                    <option value="friendly">Friendly</option>
                    <option value="casual">Casual</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>

                <div className="col-span-full space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-neutral-500 tracking-wider">Automated Welcome Greeting Message</label>
                  <textarea
                    rows={2}
                    value={aiConfig.welcomeMessage}
                    onChange={(e) => setAiConfig({ ...aiConfig, welcomeMessage: e.target.value })}
                    className="w-full bg-[#0a0a0d] border border-var(--border) p-3 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/50 resize-y"
                  />
                </div>

                <div className="col-span-full space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-neutral-500 tracking-wider">Automatic Fallback Backup Answer</label>
                  <textarea
                    rows={2}
                    value={aiConfig.fallbackMessage}
                    onChange={(e) => setAiConfig({ ...aiConfig, fallbackMessage: e.target.value })}
                    className="w-full bg-[#0a0a0d] border border-var(--border) p-3 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/50 resize-y"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-neutral-500 tracking-wider">Default Response Density/Length</label>
                  <select
                    value={aiConfig.responseLength}
                    onChange={(e) => setAiConfig({ ...aiConfig, responseLength: e.target.value as any })}
                    className="w-full bg-[#0a0a0d] border border-var(--border) p-3 rounded-xl text-white focus:outline-none cursor-pointer focus:border-blue-500/50 capitalize"
                  >
                    <option value="short">Short (1-2 sentences)</option>
                    <option value="medium">Medium (Concisely detailed)</option>
                    <option value="detailed">Detailed (Thorough instructions list)</option>
                  </select>
                </div>

                {/* Confidence Slider Indicator */}
                <div className="space-y-1.5 bg-[#0a0a0d] border border-var(--border) rounded-2xl p-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] uppercase font-black text-neutral-500 tracking-wider">Cognitive Confidence Threshold</span>
                    <span className="text-blue-400 font-mono font-bold text-xs">{aiConfig.confidenceThreshold}% Minimum</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    value={aiConfig.confidenceThreshold}
                    onChange={(e) => setAiConfig({ ...aiConfig, confidenceThreshold: Number(e.target.value) })}
                    className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <p className="text-[9px] text-neutral-500 mt-1">Prevents hallucinated info. Checks below {aiConfig.confidenceThreshold}% will instantly trigger fallback route.</p>
                </div>

                {/* Switch 1: Human escalation */}
                <div className="p-4 bg-var(--bg-elevated)/30 border border-var(--border) rounded-2xl flex items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-white text-xs">Human Escalation Routing</p>
                    <p className="text-[10px] text-neutral-500 mt-0.5">Auto-flags threads in active chats when client asks for supervisor.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAiConfig((prev) => ({ ...prev, humanEscalation: !prev.humanEscalation }));
                      triggerNotification(`Escalation rules toggled.`);
                    }}
                    className="text-neutral-400 hover:text-white"
                  >
                    {aiConfig.humanEscalation ? (
                      <ToggleRight className="w-9 h-9 text-blue-500 cursor-pointer" />
                    ) : (
                      <ToggleLeft className="w-9 h-9 text-neutral-600 cursor-pointer" />
                    )}
                  </button>
                </div>

                {/* Switch 2: Knowledge Auto-Update */}
                <div className="p-4 bg-var(--bg-elevated)/30 border border-var(--border) rounded-2xl flex items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-white text-xs">Knowledge auto-update</p>
                    <p className="text-[10px] text-neutral-500 mt-0.5">Indexes external catalog modifications automatically to system DB.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAiConfig((prev) => ({ ...prev, knowledgeAutoUpdate: !prev.knowledgeAutoUpdate }));
                      triggerNotification(`Auto update toggled.`);
                    }}
                    className="text-neutral-400 hover:text-white"
                  >
                    {aiConfig.knowledgeAutoUpdate ? (
                      <ToggleRight className="w-9 h-9 text-blue-500 cursor-pointer" />
                    ) : (
                      <ToggleLeft className="w-9 h-9 text-neutral-600 cursor-pointer" />
                    )}
                  </button>
                </div>

              </div>

              {/* Danger reset knowledge panel wrapper */}
              <div className="p-4 bg-red-950/10 border border-red-500/10 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="font-sans">
                  <p className="font-black text-red-400 text-xs flex items-center gap-1">
                    <ShieldAlert className="w-4 h-4" /> Reset Cognitive Memory Database
                  </p>
                  <p className="text-[10px] text-neutral-500 mt-0.5 max-w-md">Erase your customized training datasets of services, catalogs, prices, and restore the base system schema templates.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDangerConfirmModal("kb")}
                  className="bg-red-950/20 hover:bg-red-900/30 text-red-450 text-red-400 border border-red-500/10 hover:text-white px-4 py-2 rounded-xl text-[10.5px] font-bold transition shrink-0 cursor-pointer"
                >
                  Reset AI Training Memory
                </button>
              </div>

              <div className="pt-4 border-t border-var(--border) flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs px-6 py-2.5 rounded-xl transition duration-200 shadow-md cursor-pointer"
                >
                  Calibrate AI Models
                </button>
              </div>
            </form>
          )}

          {/* CATEGORY 3: TEAM MEMBERS */}
          {activeCategory === "team" && (
            <div className="bg-neutral-950 border border-var(--border) rounded-3xl p-6 md:p-8 space-y-6">
              
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-var(--border) pb-4">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-blue-500" /> Authorized Team Members
                  </h3>
                  <p className="text-[10.5px] text-neutral-500 mt-0.5">Control enterprise level access, permissions grants, status trackers, and dashboard logins.</p>
                </div>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1 cursor-pointer self-start sm:self-center shadow-lg"
                >
                  <Plus className="w-4 h-4" /> Invite Teammate
                </button>
              </div>

              {/* Members listing Table */}
              <div className="overflow-x-auto border border-var(--border) rounded-2xl bg-[#040406]/60">
                <table className="w-full font-sans text-xs text-left min-w-[600px]">
                  <thead>
                    <tr className="bg-neutral-950 border-b border-var(--border) text-neutral-400 text-neutral-500 text-[10px] uppercase font-black tracking-wider">
                      <th className="py-3 px-4">Teammate Info</th>
                      <th className="py-3 px-4">Portal Scope Role</th>
                      <th className="py-3 px-4">Verification State</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900/60 text-white">
                    {team.map((member) => (
                      <tr key={member.id} className="hover:bg-var(--bg-elevated)/10 transition">
                        
                        {/* Name and email */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-550/10 bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold uppercase font-mono text-[11px]">
                              {member.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-white text-xs">{member.name}</p>
                              <p className="text-[10px] text-neutral-500 font-mono mt-0.5">{member.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Role selection dropdown */}
                        <td className="py-4 px-4">
                          {member.role === "Owner" ? (
                            <span className="bg-var(--bg-elevated) text-blue-400 border border-neutral-800 text-[9.5px] px-2.5 py-1 rounded font-bold uppercase font-mono">
                              Workspace Owner
                            </span>
                          ) : (
                            <select
                              value={member.role}
                              onChange={(e) => {
                                setTeam((prev) =>
                                  prev.map((t) => (t.id === member.id ? { ...t, role: e.target.value as any } : t))
                                );
                                triggerNotification(` Modified authorized permissions role to: ${e.target.value}`);
                              }}
                              className="bg-[#050508] border border-var(--border) rounded-lg text-neutral-300 font-medium px-2 py-1 text-[11px] focus:outline-none cursor-pointer font-sans"
                            >
                              <option value="Admin">Admin</option>
                              <option value="Manager">Manager</option>
                              <option value="Support Agent">Support Agent</option>
                            </select>
                          )}
                        </td>

                        {/* Status tracking pill */}
                        <td className="py-4 px-4 font-mono text-[10.5px]">
                          <span className={`inline-flex items-center gap-1.5 ${
                            member.status === "Active" ? "text-emerald-400" :
                            member.status === "Pending" ? "text-amber-400 animate-pulse" :
                            "text-neutral-500"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              member.status === "Active" ? "bg-emerald-400" :
                              member.status === "Pending" ? "bg-amber-400" :
                              "bg-neutral-600"
                            }`} />
                            {member.status}
                          </span>
                        </td>

                        {/* Destructive actions */}
                        <td className="py-4 px-4 text-right">
                          {member.role !== "Owner" ? (
                            <button
                              onClick={() => handleRemoveTeammate(member.id, member.name)}
                              className="p-1 px-2.5 text-[10px] font-bold text-red-500/80 hover:text-white hover:bg-red-950/20 rounded-lg transition"
                              title="Revoke Teammate Access"
                            >
                              Revoke Access
                            </button>
                          ) : (
                            <span className="text-[10px] text-neutral-600 font-mono italic">Primary Access</span>
                          )}
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Roles explanation helper footer */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-var(--bg-elevated)/25 border border-var(--border) rounded-2xl font-sans text-[10.5px]">
                <div>
                  <p className="font-bold text-neutral-300">Admin</p>
                  <p className="text-[9.5px] text-neutral-500 mt-0.5">Read/write access to AI models, WhatsApp integrations, and API keys credentials configuration.</p>
                </div>
                <div>
                  <p className="font-bold text-neutral-300">Manager</p>
                  <p className="text-[9.5px] text-neutral-500 mt-0.5">Allowed to view performance analytics reports, edit service catalogs, template responses.</p>
                </div>
                <div>
                  <p className="font-bold text-neutral-300">Support Agent</p>
                  <p className="text-[9.5px] text-neutral-500 mt-0.5">Can monitor live chats, answer customer escalations, log leads, schedule appointments.</p>
                </div>
              </div>

            </div>
          )}

          {/* CATEGORY 4: NOTIFICATIONS ALERTS */}
          {activeCategory === "notifications" && (
            <div className="bg-neutral-950 border border-var(--border) rounded-3xl p-6 md:p-8 space-y-6">
              
              <div className="border-b border-var(--border) pb-4">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-blue-500" /> Notifications Alerts & Rules
                </h3>
                <p className="text-[10.5px] text-neutral-500 mt-0.5">Determine how, where, and when your team is alerted of client events and payment milestones.</p>
              </div>

              <div className="space-y-4">
                
                {/* Section title: Event alerts */}
                <h4 className="text-[10px] uppercase font-black tracking-wider text-blue-400">Trigger Event Toggles</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {[
                    { key: "newLead", label: "New Lead Captured", desc: "Alert when client secures contact details on chat." },
                    { key: "payment", label: "Payment Notifications", desc: "Notify upon verified gateway settlement payouts transaction." },
                    { key: "appointment", label: "Appointment Bookings", desc: "Ping when reservation times are secured in calendar." }
                  ].map((notif) => (
                    <div key={notif.key} className="p-4 bg-neutral-905 bg-var(--bg-elevated)/50 border border-var(--border) rounded-2xl flex items-center justify-between gap-4">
                      <div className="font-sans text-xs">
                        <p className="font-bold text-white">{notif.label}</p>
                        <p className="text-[9.5px] text-neutral-500 leading-normal mt-0.5">{notif.desc}</p>
                      </div>
                      <button
                        onClick={() => toggleNotif(notif.key as any)}
                        className="cursor-pointer text-blue-500 hover:text-white shrink-0"
                      >
                        {notifs[notif.key as keyof typeof notifs] ? (
                          <ToggleRight className="w-8 h-8 text-blue-500" />
                        ) : (
                          <ToggleLeft className="w-8 h-8 text-neutral-600" />
                        )}
                      </button>
                    </div>
                  ))}

                </div>

                {/* Dispatch channels settings */}
                <h4 className="text-[10px] uppercase font-black tracking-wider text-purple-400 pt-2 block">Notification Channels</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {[
                    { key: "whatsappAlerts", label: "WhatsApp Chat alerts", icon: <Layers className="w-4 h-4 text-emerald-400" /> },
                    { key: "emailAlerts", label: "Email notifications SMTP", icon: <Mail className="w-4 h-4 text-[#e11d48]" /> },
                    { key: "pushNotifs", label: "In-App Push popups", icon: <Smartphone className="w-4 h-4 text-purple-400" /> }
                  ].map((ch) => (
                    <div key={ch.key} className="p-4 bg-var(--bg-elevated)/30 border border-var(--border) rounded-2xl flex flex-col justify-between gap-4">
                      <div className="flex items-center justify-between">
                        <span className="p-2 rounded-lg bg-neutral-950 border border-var(--border)">{ch.icon}</span>
                        <button onClick={() => toggleNotif(ch.key as any)} className="cursor-pointer">
                          {notifs[ch.key as keyof typeof notifs] ? (
                            <div className="toggle-dot w-9 h-5 rounded-full bg-blue-600 flex items-center justify-end p-0.5"><div className="w-4 h-4 rounded-full bg-white block" /></div>
                          ) : (
                            <div className="toggle-dot w-9 h-5 rounded-full bg-neutral-800 flex items-center justify-start p-0.5"><div className="w-4 h-4 rounded-full bg-neutral-500 block" /></div>
                          )}
                        </button>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{ch.label}</p>
                        <p className="text-[9.5px] text-neutral-500 mt-0.5">Active stream notifications.</p>
                      </div>
                    </div>
                  ))}

                </div>

                {/* Email digests summary */}
                <h4 className="text-[10px] uppercase font-black tracking-wider text-amber-500 pt-2 block">Executive Performance Digests</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {[
                    { key: "summaryDaily", label: "Daily Summary Reports", desc: "PDF of contacts, conversion metrics, and payment summaries every 24h." },
                    { key: "summaryWeekly", label: "Weekly Analysis Reviews", desc: "Long range optimization guides, AI accuracy analyses every Sunday." }
                  ].map((notif) => (
                    <div key={notif.key} className="p-4 bg-var(--bg-elevated)/50 border border-var(--border) rounded-2xl flex items-center justify-between gap-4">
                      <div className="font-sans text-xs">
                        <p className="font-bold text-white">{notif.label}</p>
                        <p className="text-[9.5px] text-neutral-500 leading-normal mt-0.5">{notif.desc}</p>
                      </div>
                      <button
                        onClick={() => toggleNotif(notif.key as any)}
                        className="cursor-pointer text-blue-500 hover:text-white shrink-0"
                      >
                        {notifs[notif.key as keyof typeof notifs] ? (
                          <ToggleRight className="w-8 h-8 text-blue-500" />
                        ) : (
                          <ToggleLeft className="w-8 h-8 text-neutral-600" />
                        )}
                      </button>
                    </div>
                  ))}

                </div>

              </div>

            </div>
          )}

          {/* CATEGORY 5: SECURITY & KEYS */}
          {activeCategory === "security" && (
            <div className="space-y-6">
              
              {/* Change credentials */}
              <form onSubmit={handlePasswordUpdate} className="bg-neutral-950 border border-var(--border) rounded-3xl p-6 md:p-8 space-y-6">
                <div className="border-b border-var(--border) pb-4">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-blue-500" /> Change Administrator Password
                  </h3>
                  <p className="text-[10.5px] text-neutral-500 mt-0.5">Re-verify and reset login credentials. Ensure robust length to pass security standards.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-sans text-xs">
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black text-neutral-500 tracking-wider">Current Passcode</label>
                    <input
                      type="password"
                      placeholder="••••••••••••"
                      value={passwordState.current}
                      onChange={(e) => setPasswordState({ ...passwordState, current: e.target.value })}
                      className="w-full bg-[#0a0a0d] border border-var(--border) p-3 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black text-neutral-500 tracking-wider">Next Password</label>
                    <input
                      type="password"
                      placeholder="Minimum 10 chars"
                      value={passwordState.next}
                      onChange={(e) => setPasswordState({ ...passwordState, next: e.target.value })}
                      className="w-full bg-[#0a0a0d] border border-var(--border) p-3 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black text-neutral-500 tracking-wider">Confirm Next Password</label>
                    <input
                      type="password"
                      placeholder="Confirm new code"
                      value={passwordState.confirm}
                      onChange={(e) => setPasswordState({ ...passwordState, confirm: e.target.value })}
                      className="w-full bg-[#0a0a0d] border border-var(--border) p-3 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/50"
                    />
                  </div>

                </div>

                <div className="pt-4 border-t border-var(--border) flex justify-end">
                  <button
                    type="submit"
                    className="bg-var(--bg-elevated) hover:bg-var(--bg-elevated) text-neutral-300 font-bold text-xs px-6 py-2.5 rounded-xl transition cursor-pointer border border-var(--border) hover:border-neutral-700"
                  >
                    Modify Password
                  </button>
                </div>
              </form>

              {/* Two-Factor verification */}
              <div className="bg-neutral-950 border border-var(--border) rounded-3xl p-6 md:p-8 space-y-5">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-var(--border) pb-4">
                  <div className="font-sans">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-blue-500" /> Two-Factor Authentication (2FA)
                    </h3>
                    <p className="text-[10.5px] text-neutral-500 mt-0.5">Protect developer assets, team logins, and credential parameters against breach.</p>
                  </div>
                  <div>
                    <button
                      onClick={() => {
                        setEnable2FA(!enable2FA);
                        triggerNotification(enable2FA ? " Disabled 2FA settings." : " 2FA security initialized. Show QR scan code details dialog.");
                      }}
                      className={`text-xs font-black px-4 py-2.5 rounded-xl transition cursor-pointer ${
                        enable2FA ? "bg-red-950/10 hover:bg-red-950/30 text-red-400 border border-red-500/10" : "bg-blue-600 hover:bg-blue-500 text-white"
                      }`}
                    >
                      {enable2FA ? "Disable 2FA Security" : "Enable 2FA Settings"}
                    </button>
                  </div>
                </div>

                {enable2FA && (
                  <div className="p-5 bg-var(--bg-elevated)/40 border border-var(--border) rounded-2xl flex flex-col sm:flex-row items-center gap-5 font-sans">
                    <div className="w-24 h-24 bg-white p-2 rounded-xl flex items-center justify-center shrink-0">
                      {/* Scan core mock placeholder QR layout */}
                      <div className="w-full h-full bg-[radial-gradient(#1e3a8a_2px,transparent_2px)] [background-size:6px_6px] flex items-center justify-center border-2 border-dashed border-neutral-300" />
                    </div>

                    <div className="space-y-2 text-xs text-center sm:text-left">
                      <p className="font-bold text-white">Scan Authenticator QR</p>
                      <p className="text-[10.5px] text-neutral-500 leading-relaxed max-w-md">Open standard authentication suite (Google Authenticator, Microsoft Auth, or Authy Duo) on your device, parse QR, and input code verification sequence.</p>
                      <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 font-mono">
                        <span className="bg-[#0a0a0d] border border-var(--border) px-3 py-1.5 rounded-lg text-white font-bold">129 481</span>
                        <button
                          onClick={() => triggerNotification(" Verified authorization keys!")}
                          className="px-3.5 py-1.5 bg-var(--bg-elevated) hover:bg-var(--bg-elevated) text-white font-bold text-[10.5px] rounded-lg transition border border-neutral-800"
                        >
                          Verify Code
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Active IP/Sessions tracker */}
              <div className="bg-neutral-950 border border-var(--border) rounded-3xl p-6 md:p-8 space-y-5">
                <div className="flex justify-between items-center border-b border-var(--border) pb-4">
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-blue-500" /> Account Active sessions
                    </h3>
                    <p className="text-[10.5px] text-neutral-500 mt-0.5">Audit connected devices and secure locations accessing Autofy.</p>
                  </div>
                  <button
                    onClick={handleLogoutAllDevices}
                    className="p-2 px-3 text-[10.5px] font-bold text-neutral-400 bg-[#0a0a0d] hover:bg-var(--bg-elevated) hover:text-white border border-var(--border) rounded-xl transition cursor-pointer"
                  >
                    Logout All Devices
                  </button>
                </div>

                <div className="space-y-3 font-sans text-xs">
                  {sessions.map((ses) => (
                    <div key={ses.id} className="p-4 bg-[#050508] border border-var(--border) rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex gap-3">
                        <span className="p-2.5 rounded-xl bg-var(--bg-elevated) text-neutral-400 border border-var(--border) self-start">
                          <Smartphone className="w-4 h-4" />
                        </span>
                        <div>
                          <p className="font-bold text-white flex items-center gap-2">
                            {ses.browser}
                            {ses.id === "s-1" && <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold">This Device</span>}
                          </p>
                          <p className="text-[10.5px] text-neutral-500 font-mono mt-0.5 flex items-center gap-1.5">
                            <span>IP Address: {ses.ip}</span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3 text-neutral-600" /> {ses.location}</span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right sm:text-right shrink-0">
                        <span className="text-[10.5px] text-neutral-400 font-medium font-mono">{ses.date}</span>
                      </div>
                    </div>
                  ))}
                </div>

              </div>

            </div>
          )}

          {/* CATEGORY 6: BILLING & PAYMENTS */}
          {activeCategory === "billing" && (
            <div className="space-y-6">
              
              {/* Premium Plan stats and features */}
              <div className="bg-neutral-950 border border-var(--border) rounded-3xl p-6 md:p-8 space-y-6">
                
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-var(--border) pb-4 animate-fade-in">
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-blue-500" /> Subscription & Plan Details
                    </h3>
                    <p className="text-[10.5px] text-neutral-500 mt-0.5">Examine usage, metrics allowances, renewal, subscription states and payment details.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => triggerNotification(" Pricing matrix overlay simulation open.")}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs px-4 py-2.5 rounded-xl transition cursor-pointer shadow-lg"
                    >
                      Upgrade Growth Plan
                    </button>
                    <button
                      onClick={() => triggerNotification(" Custom subscription parameters altered.")}
                      className="bg-var(--bg-elevated) border border-var(--border) hover:border-neutral-700 text-neutral-300 font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
                    >
                      Cancel Subscription
                    </button>
                  </div>
                </div>

                {/* Plan parameters cards layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans text-xs">
                  
                  {/* Card 1: Active status */}
                  <div className="bg-[#050508] border border-var(--border) rounded-2xl p-5 hover:border-blue-550/20 transition-all">
                    <span className="text-[9.5px] uppercase font-black text-neutral-500 tracking-wider">Current Package Tier</span>
                    <h4 className="text-sm font-black text-white mt-1.5 font-sans text-blue-450 text-blue-400">{billingPlan.name}</h4>
                    <p className="text-xl font-bold text-white font-mono mt-1">{billingPlan.cost}</p>
                    <p className="text-[9px] text-neutral-500 mt-2 font-mono">Renewal period: {billingPlan.renewalDate}</p>
                  </div>

                  {/* Card 2: WhatsApp messages tokens progress */}
                  <div className="bg-[#050508] border border-var(--border) rounded-2xl p-5">
                    <div className="flex justify-between items-center text-[9.5px] uppercase font-black text-neutral-400">
                      <span>WhatsApp API Limit</span>
                      <span className="font-mono text-white text-[11px] font-bold">{billingPlan.messagesUsed}/{billingPlan.messagesLimit}</span>
                    </div>
                    
                    {/* Linear progress bar */}
                    <div className="w-full h-1.5 bg-var(--bg-elevated) rounded-full mt-3 overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(billingPlan.messagesUsed / billingPlan.messagesLimit) * 100}%` }} />
                    </div>
                    <p className="text-[9px] text-neutral-500 mt-2">Allocated API tokens reset every 20th of month.</p>
                  </div>

                  {/* Card 3: Lead synchronization metrics progress */}
                  <div className="bg-[#050508] border border-var(--border) rounded-2xl p-5">
                    <div className="flex justify-between items-center text-[9.5px] uppercase font-black text-neutral-400">
                      <span>CRM Lead Allocations</span>
                      <span className="font-mono text-white text-[11px] font-bold">{billingPlan.leadsCaptures}/{billingPlan.leadsLimit}</span>
                    </div>
                    
                    {/* Linear progress bar */}
                    <div className="w-full h-1.5 bg-var(--bg-elevated) rounded-full mt-3 overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(billingPlan.leadsCaptures / billingPlan.leadsLimit) * 100}%` }} />
                    </div>
                    <p className="text-[9px] text-neutral-500 mt-2">Includes automated Zoho & HubSpot triggers.</p>
                  </div>

                </div>

                {/* Card payment methods profile updates option */}
                <div className="p-4 bg-var(--bg-elevated)/30 border border-var(--border) rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans text-xs">
                  <div className="flex gap-3">
                    <span className="p-2.5 rounded-xl bg-var(--bg-elevated) text-neutral-400 border border-var(--border) flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-blue-500" />
                    </span>
                    <div>
                      <p className="font-bold text-white">Default Payment Method</p>
                      <p className="text-[10px] text-neutral-500 mt-0.5">Linked Visa card: •••• •••• •••• 4242 (Expires 09/2028)</p>
                    </div>
                  </div>
                  <button
                    onClick={() => triggerNotification(" Payment gateway portal billing checkout loaded.")}
                    className="p-2 px-3 text-[10.5px] font-bold text-neutral-300 bg-var(--bg-elevated) hover:bg-var(--bg-elevated) hover:text-white border border-var(--border) rounded-xl transition cursor-pointer"
                  >
                    Change Method Card
                  </button>
                </div>

              </div>

              {/* Transactions History Table */}
              <div className="bg-neutral-950 border border-var(--border) rounded-3xl p-6 md:p-8 space-y-5">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-500" /> Transaction Invoices History
                  </h3>
                  <p className="text-[10.5px] text-neutral-500 mt-0.5">Download past corporate invoices and billing snapshots files.</p>
                </div>

                <div className="overflow-x-auto border border-var(--border) rounded-xl bg-[#040406]/60">
                  <table className="w-full font-sans text-xs text-left min-w-[500px]">
                    <thead>
                      <tr className="bg-neutral-950 border-b border-var(--border) text-neutral-400 text-neutral-500 text-[10px] uppercase font-black tracking-wider">
                        <th className="py-2.5 px-4">Invoice Reference Key</th>
                        <th className="py-2.5 px-4">Billing Date</th>
                        <th className="py-2.5 px-4">Calculated Cost</th>
                        <th className="py-2.5 px-4">Receipt Status</th>
                        <th className="py-2.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-900/50 text-white font-mono text-[11px]">
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-var(--bg-elevated)/10 transition">
                          <td className="py-3 px-4 font-bold text-neutral-300">INV-2026-00{inv.id.replace("inv-", "")}</td>
                          <td className="py-3 px-4 text-neutral-400">{inv.date}</td>
                          <td className="py-3 px-4 text-white">{inv.amount}</td>
                          <td className="py-3 px-4 text-emerald-450 text-emerald-400">{inv.status}</td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => triggerNotification(` Initializing PDF file download for INV-${inv.id}`)}
                              className="p-1 px-2 hover:bg-var(--bg-elevated) rounded transition font-bold font-sans text-blue-500 hover:text-white flex items-center gap-1 ml-auto cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" /> PDF
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>
          )}

          {/* CATEGORY 7: API & WEBHOOK ACCESS */}
          {activeCategory === "api" && (
            <div className="space-y-6">
              
              {/* API and developer information */}
              <div className="bg-neutral-950 border border-var(--border) rounded-3xl p-6 md:p-8 space-y-6">
                
                <div className="border-b border-var(--border) pb-4">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-blue-500" /> Developer API Credentials
                  </h3>
                  <p className="text-[10.5px] text-neutral-500 mt-0.5">Securely integrate custom CRM tools, trigger chat events via code, and automate webhook deliveries.</p>
                </div>

                <div className="space-y-4 font-sans text-xs">
                  
                  {/* Secret token view field */}
                  <div className="p-4 bg-neutral-905 bg-var(--bg-elevated)/40 border border-var(--border) rounded-2xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] uppercase font-black text-neutral-500 tracking-wider">Secret Production Key</span>
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-550/20 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase">
                        TLS Verified API Mode
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type={showApiKey ? "text" : "password"}
                        readOnly
                        value={primaryApiKey}
                        className="flex-1 bg-[#0a0a0d] border border-var(--border) p-2.5 rounded-xl text-white font-mono text-[11px] select-all focus:outline-none"
                      />
                      <button
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="px-3.5 py-1.5 bg-var(--bg-elevated) hover:bg-var(--bg-elevated) text-neutral-300 rounded-xl transition border border-neutral-800 text-[10px] cursor-pointer"
                      >
                        {showApiKey ? "Hide Key" : "Reveal Key"}
                      </button>
                    </div>
                    <p className="text-[9px] text-neutral-500">Provide this secret token during customized webhook or platform connections requests to authenticate clients.</p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center">
                    <button
                      onClick={handleRegenerateApiKey}
                      className="bg-var(--bg-elevated) hover:bg-var(--bg-elevated) text-neutral-300 hover:text-white border border-neutral-800 hover:border-neutral-700 text-xs font-black px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Regenerate API Secret Key
                    </button>
                    <a
                      href="https://autofysaas.com/docs/api-guide"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 hover:text-white font-black text-xs flex items-center gap-1 cursor-pointer pt-2 sm:pt-0"
                    >
                      Browse API Schema Docs <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                </div>

              </div>

              {/* Webhook security details secret */}
              <div className="bg-neutral-950 border border-var(--border) rounded-3xl p-6 md:p-8 space-y-5">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-500" /> Outbound Webhook Security
                  </h3>
                  <p className="text-[10.5px] text-neutral-500 mt-0.5">Verify that inbound event packets originated indeed from Autofy servers using custom signatures.</p>
                </div>

                <div className="p-4 bg-var(--bg-elevated)/30 border border-var(--border) rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans text-xs">
                  <div>
                    <span className="text-[9px] text-neutral-500 uppercase font-black">Webhook Secret Signature Hash</span>
                    <p className="text-white font-mono mt-1 font-bold">{webhookSecret}</p>
                  </div>
                  <button
                    onClick={() => {
                      const randHex = Array.from({ length: 18 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
                      setWebhookSecret(`whsec_${randHex}`);
                      triggerNotification(" Rotated outbound webhook secret. Ensure checksum handlers compile updated secret.");
                    }}
                    className="p-2 px-3 text-[10.5px] font-bold text-neutral-300 bg-var(--bg-elevated) hover:bg-var(--bg-elevated) hover:text-white border border-var(--border) rounded-xl transition cursor-pointer shrink-0"
                  >
                    Rotate Secrets signature
                  </button>
                </div>

                <div className="p-4 bg-[#050508] border border-var(--border) rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans text-xs">
                  <div>
                    <p className="font-bold text-white">Rate Limit Information</p>
                    <p className="text-[10px] text-neutral-400 text-neutral-400 mt-0.5">Workspace account default restrictions limits.</p>
                  </div>
                  <div className="font-mono text-neutral-400 text-[10.5px] text-right">
                    <p className="text-white font-bold">1,000 / minute max</p>
                    <p className="text-[9.5px]">0.02% utilized</p>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* DANGER ZONE - ALWAYS ACTIVE LOWER CARD */}
          <div className="bg-red-950/5 border border-red-900/30 rounded-3xl p-6 md:p-8 space-y-5 relative overflow-hidden backdrop-blur-md">
            {/* Absolute ambient corner alert glow */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 rounded-full filter blur-xl pointer-events-none" />

            <div className="border-b border-red-900/20 pb-4">
              <h3 className="text-sm font-black text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-500" /> Danger Zone Settings
              </h3>
              <p className="text-[10.5px] text-neutral-500 mt-0.5 leading-relaxed">Irreversible, dangerous actions. Ensure that all data backups have been finalized prior to executing items below.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans text-xs">
              
              {/* Danger action 1 */}
              <div className="p-4 bg-neutral-950 border border-var(--border) hover:border-red-900/40 rounded-2xl flex flex-col justify-between gap-3 transition">
                <div>
                  <p className="font-extrabold text-white text-xs">Delete Business Data logs</p>
                  <p className="text-[10px] text-neutral-500 leading-normal mt-0.5">Purges all customer chats records history, appointment files logs, and uploaded documents data, keeping account details active.</p>
                </div>
                <button
                  onClick={() => {
                    setDangerConfirmModal("data");
                    triggerNotification(" Destructive data purge action initiated. Security confirmation modal raised.");
                  }}
                  className="bg-red-950/20 hover:bg-red-900 hover:text-white text-red-400 border border-red-500/10 text-[10.5px] font-bold px-4 py-2 rounded-xl transition cursor-pointer self-start"
                >
                  Clear workspace data logs
                </button>
              </div>

              {/* Danger action 2 */}
              <div className="p-4 bg-neutral-950 border border-var(--border) hover:border-red-900/40 rounded-2xl flex flex-col justify-between gap-3 transition">
                <div>
                  <p className="font-extrabold text-white text-xs">Disconnect WhatsApp Gateway Node</p>
                  <p className="text-[10px] text-neutral-500 leading-normal mt-0.5">Terminate live cloud connection with Meta Developer Sandbox. Customers will cease receiving instant automatic answers.</p>
                </div>
                <button
                  onClick={() => {
                    triggerNotification(" Disconnected WhatsApp Node active linkages.");
                  }}
                  className="bg-red-950/20 hover:bg-red-900 hover:text-white text-red-400 border border-red-500/10 text-[10.5px] font-bold px-4 py-2 rounded-xl transition cursor-pointer self-start"
                >
                  Deauthorize Meta Sandbox Gateway
                </button>
              </div>

              {/* Danger action 3 */}
              <div className="p-4 bg-neutral-950 border border-var(--border) hover:border-red-900/40 rounded-2xl flex flex-col justify-between gap-3 transition col-span-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-extrabold text-white text-xs">Delete Account & Terminate Plan</p>
                    <p className="text-[10px] text-neutral-500 leading-normal mt-0.5">Immediately deletes company space and cancels billing subscription. This action cannot be revoked; data becomes permanently destroyed.</p>
                  </div>
                  <button
                    onClick={() => {
                      setDangerConfirmModal("account");
                    }}
                    className="bg-red-600 hover:bg-red-500 text-white font-extrabold text-[10.5px] px-5 py-2.5 rounded-xl transition cursor-pointer shadow-lg"
                  >
                    Delete Workspace Account
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* MODAL 1: TEAM INVITEMATE MODAL SCREEN Overlay */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 bg-[#000000]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-neutral-950 border border-var(--border) p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl relative font-sans text-xs"
            >
              
              <div className="flex items-center justify-between border-b border-var(--border) pb-3">
                <h3 className="text-sm font-black text-white flex items-center gap-1.5 uppercase tracking-wider">
                  <Users className="w-4 h-4 text-blue-500" /> Invite New Administrator Teammate
                </h3>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="p-1 hover:bg-var(--bg-elevated) text-neutral-500 hover:text-white rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleInviteSubmit} className="space-y-4 pt-1">
                
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-neutral-500 tracking-wider">Teammate Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Shreyas Dey"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="w-full bg-[#0a0a0d] border border-var(--border) p-2.5 rounded-xl text-white placeholder-neutral-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-neutral-500 tracking-wider">Workspace Login Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="teammate@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full bg-[#0a0a0d] border border-var(--border) p-2.5 rounded-xl text-white placeholder-neutral-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-neutral-500 tracking-wider">Permissions Role Assignment</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="w-full bg-[#0a0a0d] border border-var(--border) p-2.5 rounded-xl text-white cursor-pointer focus:outline-none"
                  >
                    <option value="Admin">Admin (Full Edit rights)</option>
                    <option value="Manager">Manager (Edit settings & views)</option>
                    <option value="Support Agent">Support Agent (Read and log chats)</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 py-2.5 bg-var(--bg-elevated) hover:bg-var(--bg-elevated) text-neutral-400 hover:text-white rounded-xl transition font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition font-black text-xs shadow-lg"
                  >
                    Dispatch Invite Token
                  </button>
                </div>

              </form>

            </motion.div>

          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: DANGER ZONE SEVERE CONFIRMATION */}
      <AnimatePresence>
        {dangerConfirmModal && (
          <div className="fixed inset-0 bg-[#000000]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-neutral-950 border border-red-900 p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl relative font-sans text-xs"
            >
              
              <div className="flex items-center gap-2 text-red-400 uppercase tracking-wider font-sans text-xs font-black">
                <AlertTriangle className="w-5 h-5" /> Severe Danger Confirmation Required!
              </div>

              <div>
                <p className="text-white font-extrabold text-xs">Are you absolutely sure?</p>
                <p className="text-neutral-500 leading-relaxed mt-1 text-[11px]">
                  {dangerConfirmModal === "data" && "This action purges all compiled client conversation threads, metadata, payment settlements reports files, and leads logs. There is no active backup fallback."}
                  {dangerConfirmModal === "account" && "You are about to completely terminate your Autofy subscription and erase access tokens of your teammate list. Credit card billing will stop."}
                  {dangerConfirmModal === "kb" && "You will permanently erase cognitive context rules built from custom uploaded FAQs, restoring default parameters."}
                </p>
                <div className="p-3 bg-red-950/10 border border-red-500/10 rounded-xl mt-3 text-red-400 font-bold text-[10.5px]">
                   Warning: This operation is absolutely irreversible and logged!
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                
                <button
                  onClick={() => setDangerConfirmModal(null)}
                  className="flex-1 py-2.5 bg-var(--bg-elevated) hover:bg-var(--bg-elevated) text-neutral-400 hover:text-white rounded-xl transition font-bold"
                >
                  Cancel and Abort
                </button>

                <button
                  onClick={handleExecuteDangerAction}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl transition font-black text-xs shadow-lg"
                >
                  Confirm and Authorize
                </button>

              </div>

            </motion.div>

          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
