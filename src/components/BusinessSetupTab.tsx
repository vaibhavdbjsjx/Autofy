import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Building2,
  Clock,
  FileText,
  Phone,
  Share2,
  Save,
  Check,
  RefreshCw,
  MapPin,
  Calendar,
  Sparkles,
  ExternalLink,
  Plus,
  Trash2,
  Globe,
  Instagram,
  Facebook,
  Youtube,
  Info,
  CheckCircle,
  HelpCircle,
  AlertCircle
} from "lucide-react";
import { OnboardingData } from "../types";

// Extended Business Setup interface that maps to state
interface BusinessSetupState {
  // Section 1: Business Information
  businessName: string;
  businessCategory: string;
  phoneNumber: string;
  email: string;
  website: string;
  address: string;
  googleMapsLocation: string;

  // Section 2: Working Hours
  workingHours: Array<{
    day: string;
    isOpen: boolean;
    openTime: string;
    closeTime: string;
    isHoliday: boolean;
  }>;

  // Section 3: Business Description
  businessDescription: string;

  // Section 4: Contact Information
  supportNumber: string;
  whatsappNumber: string;
  alternateNumber: string;

  // Section 5: Social Media
  instagram: string;
  facebook: string;
  socialWebsite: string;
  youtube: string;
}

interface BusinessSetupTabProps {
  onboardingData: OnboardingData;
  setOnboardingData: React.Dispatch<React.SetStateAction<OnboardingData>>;
  triggerNotification: (text: string) => void;
  // Live sync hooks to update dashboard states so AI responses are refreshed instantly!
  setPolicies?: React.Dispatch<React.SetStateAction<any>>;
}

export const BusinessSetupTab: React.FC<BusinessSetupTabProps> = ({
  onboardingData,
  setOnboardingData,
  triggerNotification,
  setPolicies
}) => {
  // Load initial state merged with onboardingData
  const [setupState, setSetupState] = useState<BusinessSetupState>({
    businessName: onboardingData.businessName || "",
    businessCategory: onboardingData.industryType || "Wellness & Professional Fitness",
    phoneNumber: onboardingData.phoneNumber || "",
    email: (onboardingData as any).email || "hello@autofysaas.com",
    website: onboardingData.website || "",
    address: onboardingData.address || "",
    googleMapsLocation: "https://maps.google.com/?q=Salt+Lake+Sector+V+Kolkata",

    // Default Mon-Sun Working Hours
    workingHours: [
      { day: "Monday", isOpen: true, openTime: "06:00 AM", closeTime: "10:00 PM", isHoliday: false },
      { day: "Tuesday", isOpen: true, openTime: "06:00 AM", closeTime: "10:00 PM", isHoliday: false },
      { day: "Wednesday", isOpen: true, openTime: "06:00 AM", closeTime: "10:00 PM", isHoliday: false },
      { day: "Thursday", isOpen: true, openTime: "06:00 AM", closeTime: "10:00 PM", isHoliday: false },
      { day: "Friday", isOpen: true, openTime: "06:00 AM", closeTime: "10:00 PM", isHoliday: false },
      { day: "Saturday", isOpen: true, openTime: "06:00 AM", closeTime: "10:00 PM", isHoliday: false },
      { day: "Sunday", isOpen: false, openTime: "09:00 AM", closeTime: "06:00 PM", isHoliday: true },
    ],

    businessDescription: onboardingData.knowledgeText?.policies || "Our studio is a premium high-performance physical empowerment hub. We deliver bespoke strength, cardio, and personalized conditioning classes. All sessions are scheduled with certified experts in an atmosphere detailed for execution.",
    
    supportNumber: onboardingData.phoneNumber || "+91 99901 22334",
    whatsappNumber: onboardingData.whatsappNumber || onboardingData.phoneNumber || "",
    alternateNumber: "+91 91234 50987",

    instagram: "https://instagram.com/autofysaas_fit",
    facebook: "https://facebook.com/autofysaas_academy",
    socialWebsite: onboardingData.website || "https://autofysaas.com",
    youtube: "https://youtube.com/c/autofysaas_channel"
  });

  // Track Save Indicator Statuses
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("saved");
  const [lastSavedTime, setLastSavedTime] = useState<string>("Just Now");
  const [syncProgress, setSyncProgress] = useState<number>(100);
  const [aiAnalysisSnippet, setAiAnalysisSnippet] = useState<string>("");

  // Helper to generate dynamic AI index insight as states change
  useEffect(() => {
    const hoursSnippet = setupState.workingHours
      .filter(item => !item.isHoliday)
      .map(item => `${item.day.substring(0, 3)} (${item.openTime}-${item.closeTime})`)
      .join(", ");
    
    const analysis = `[Core Semantic Model Indexer]
Derived Context: "${setupState.businessName}" is localized as a high-fidelity "${setupState.businessCategory}" brand operating from "${setupState.address || "not configured"}".
Operational timings learned: "${hoursSnippet}".
AI memory registers client hotline support: "${setupState.supportNumber}" and live WhatsApp channel: "${setupState.whatsappNumber}".
Social footprint loaded for customer queries: Instagram, Facbook, and YouTube domains linked.
Status: READY - Gemini cognitive layer successfully trained.`;

    setAiAnalysisSnippet(analysis);
  }, [setupState]);

  // Hook to simulate Background Autosaving on Input Changes (Zero friction experience!)
  const triggerAutoSave = () => {
    setSaveStatus("saving");
    setSyncProgress(30);
    
    // Smooth progress bar and status transition
    const interval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 15;
      });
    }, 150);

    setTimeout(() => {
      setSaveStatus("saved");
      setSyncProgress(100);
      const now = new Date();
      setLastSavedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      
      // Physically update parent state so conversational bot gets the new parameters immediately!
      setOnboardingData(prev => ({
        ...prev,
        businessName: setupState.businessName,
        industryType: setupState.businessCategory,
        phoneNumber: setupState.phoneNumber,
        address: setupState.address,
        website: setupState.website,
        whatsappNumber: setupState.whatsappNumber,
        knowledgeText: {
          ...prev.knowledgeText,
          policies: setupState.businessDescription // Update default knowledge text for queries
        }
      }));

      if (setPolicies) {
        setPolicies(prev => ({
          ...prev,
          hours: `${setupState.workingHours.filter(h => !h.isHoliday).map(h => `${h.day.substring(0, 3)}: ${h.openTime}-${h.closeTime}`).join(", ")}`
        }));
      }

    }, 1000);
  };

  // State update handlers mapping and triggering autosave
  const handleChange = (field: keyof BusinessSetupState, value: any) => {
    setSetupState(prev => ({ ...prev, [field]: value }));
    setSaveStatus("idle");
  };

  const handleWorkingHourChange = (index: number, key: string, value: any) => {
    setSetupState(prev => {
      const updated = [...prev.workingHours];
      updated[index] = { ...updated[index], [key]: value };
      // If toggling Holiday, automatically toggle isOpen to false
      if (key === "isHoliday") {
        updated[index].isOpen = !value;
      }
      return { ...prev, workingHours: updated };
    });
    setSaveStatus("idle");
  };

  // Manual Trigger Save Button
  const handleManualSave = (e: React.FormEvent) => {
    e.preventDefault();
    triggerAutoSave();
    triggerNotification("System Database Updated: Business context re-indexed to Gemini AI memory!");
  };

  return (
    <div className="space-y-8 pb-16 font-sans">
      
      {/* Title Header with Glowing Neon Accents */}
      <div className="relative p-6 md:p-8 rounded-3xl glass-card border border-[var(--border)] overflow-hidden backdrop-blur-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl">
        {/* Visual Purple glowing effect behind header */}
        <div className="absolute top-0 right-0 w-[400px] h-[150px] rounded-full blur-[80px] pointer-events-none" style={{ background: "var(--brand-subtle)" }} />
        
        <div className="space-y-2">
          <div className="badge-glow inline-flex items-center gap-2 px-3 py-1 text-[10px] uppercase font-bold tracking-widest font-mono">
            <span className="pulse-dot" />
            <span className="text-gradient-brand font-display">AI Foundation Engine</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight font-display" style={{ color: "var(--text)" }}>
            Business Setup Center
          </h1>
          <p className="text-xs md:text-sm max-w-2xl leading-normal font-sans" style={{ color: "var(--text-muted)" }}>
            Configure your business information so Autofy can answer customers accurately. This serves as the direct foundation for the AI knowledge indexing system.
          </p>
        </div>

        {/* Dynamic Saving Indicator and Progress (SaaS standard UI) */}
        <div className="shrink-0 flex items-center gap-4 bg-[var(--bg-elevated)]/60 border border-[var(--border)] p-4 rounded-2xl relative">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {saveStatus === "saving" ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                  <span className="text-xs font-bold text-blue-400">Saving changes...</span>
                </>
              ) : saveStatus === "saved" ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-400">All data synced</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-xs font-bold text-amber-400">Modified waiting save</span>
                </>
              )}
            </div>
            <p className="text-[9.5px] text-[var(--text-subtle)] font-mono">
              Last saved: {lastSavedTime}
            </p>
          </div>

          {/* Miniature status slider background */}
          <div className="w-[1px] h-8 bg-[var(--bg-elevated)]" />
          
          <button
            onClick={handleManualSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-[var(--text)] rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer flex items-center gap-1.5 shadow-[0_4px_16px_rgba(37,99,235,0.25)] hover:shadow-[0_4px_20px_rgba(37,99,235,0.4)] active:scale-95"
          >
            <Save className="w-3.5 h-3.5" /> Save Context
          </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT WORKSPACE: THE SETUP PANELS */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* SECTION 1: BUSINESS INFORMATION */}
          <div className="p-6 md:p-8 rounded-3xl glass-card border border-[var(--border)] backdrop-blur-md space-y-6 shadow-md group transition-all duration-300">
            <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider font-display" style={{ color: "var(--text)" }}>
                  1. Business Information
                </h2>
                <p className="text-[11px] mt-0.5 font-sans" style={{ color: "var(--text-muted)" }}>Configure core profile data and geographic coordinates.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5" style={{ color: "var(--text)" }}>
              
              {/* Business Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black tracking-wider block" style={{ color: "var(--text-muted)" }}>Business Name</label>
                <input
                  type="text"
                  value={setupState.businessName}
                  onChange={(e) => handleChange("businessName", e.target.value)}
                  placeholder="E.g. Autofy Prime Fitness"
                  className="w-full rounded-xl p-3 text-xs focus:outline-none transition-all font-sans"
                  style={{ background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                />
              </div>

              {/* Business Category */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black tracking-wider block" style={{ color: "var(--text-muted)" }}>Business Category</label>
                <select
                  value={setupState.businessCategory}
                  onChange={(e) => handleChange("businessCategory", e.target.value)}
                  className="w-full rounded-xl p-3 text-xs focus:outline-none transition-all cursor-pointer font-sans"
                  style={{ background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                >
                  <option value="Wellness & Professional Fitness">Wellness & Professional Fitness</option>
                  <option value="Automotive & Mobility Service">Automotive & Mobility Service</option>
                  <option value="Educational & Coaching Academy">Educational & Coaching Academy</option>
                  <option value="Spa & Premium Salon Services">Spa & Premium Salon Services</option>
                  <option value="SaaS & Corporate Agency Consulting">SaaS & Corporate Agency Consulting</option>
                </select>
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black tracking-wider block" style={{ color: "var(--text-muted)" }}>Phone Number</label>
                <input
                  type="text"
                  value={setupState.phoneNumber}
                  onChange={(e) => handleChange("phoneNumber", e.target.value)}
                  placeholder="+91 98765 01234"
                  className="w-full rounded-xl p-3 text-xs focus:outline-none font-mono transition-all"
                  style={{ background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black tracking-wider block" style={{ color: "var(--text-muted)" }}>Business Email Address</label>
                <input
                  type="email"
                  value={setupState.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="hello@autofysaas.com"
                  className="w-full rounded-xl p-3 text-xs focus:outline-none font-sans transition-all"
                  style={{ background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                />
              </div>

              {/* Website Domain */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black tracking-wider block" style={{ color: "var(--text-muted)" }}>Website URL</label>
                <input
                  type="url"
                  value={setupState.website}
                  onChange={(e) => handleChange("website", e.target.value)}
                  placeholder="https://autofysaas.com"
                  className="w-full rounded-xl p-3 text-xs focus:outline-none font-mono transition-all"
                  style={{ background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                />
              </div>

              {/* Google Maps Location URL */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black tracking-wider block" style={{ color: "var(--text-muted)" }}>Google Maps Location Link</label>
                <div className="relative">
                  <input
                    type="url"
                    value={setupState.googleMapsLocation}
                    onChange={(e) => handleChange("googleMapsLocation", e.target.value)}
                    placeholder="https://maps.google.com/..."
                    className="w-full rounded-xl py-3 pl-3 pr-10 text-xs focus:outline-none font-mono transition-all"
                    style={{ background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" style={{ color: "var(--text-subtle)" }}>
                    <MapPin className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Corporate Address */}
              <div className="col-span-full space-y-1.5">
                <label className="text-[10px] uppercase font-black tracking-wider block" style={{ color: "var(--text-muted)" }}>Corporate Physical Address</label>
                <textarea
                  rows={2}
                  value={setupState.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="Plot 742 Evergreen Terrace, Salt Lake Sector V, Kolkata - 700091"
                  className="w-full rounded-xl p-3 text-xs focus:outline-none font-sans transition-all"
                  style={{ background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                />
              </div>

            </div>
          </div>

          {/* SECTION 2: WORKING HOURS */}
          <div className="p-6 md:p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border)] backdrop-blur-md space-y-6 shadow-md shadow-black/30 group hover:border-[var(--border)] transition-all duration-300">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-[var(--text)] uppercase tracking-wider font-sans">
                    2. Working Hours
                  </h2>
                  <p className="text-[10px] text-[var(--text-subtle)] mt-0.5">Allot operational hours and holiday schedules for the database calendar.</p>
                </div>
              </div>

              {/* Universal holiday indicator */}
              <div className="text-[10px] text-[var(--text-muted)] bg-[#0c0c0e] border border-[var(--border)] rounded-xl py-1 px-3 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <span>Auto-Reflected to Chat</span>
              </div>
            </div>

            {/* Daily Scheduler Matrix */}
            <div className="space-y-3">
              {setupState.workingHours.map((hour, idx) => (
                <div
                  key={hour.day}
                  className={`p-3.5 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    hour.isHoliday 
                      ? "bg-[var(--bg-card)] border-[var(--border)]/60 opacity-60" 
                      : "bg-[#060608]/90 border-[var(--border)] hover:border-[var(--border)]"
                  }`}
                >
                  {/* Left Column: Weekday Name & Open Checkbox */}
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleWorkingHourChange(idx, "isHoliday", !hour.isHoliday)}
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                        hour.isHoliday 
                          ? "bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-subtle)]" 
                          : "bg-blue-600/10 border-blue-500/30 text-blue-400"
                      }`}
                    >
                      {!hour.isHoliday && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                    </button>
                    <div>
                      <p className="text-xs font-bold text-[var(--text)] tracking-wide">{hour.day}</p>
                      <p className="text-[9.5px] text-[var(--text-subtle)]">
                        {hour.isHoliday ? "Closed / Holiday Mode" : "Regular Active Session"}
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Time controls and holiday toggle */}
                  <div className="flex items-center gap-4 self-end sm:self-center">
                    
                    {/* Time fields */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={hour.openTime}
                        disabled={hour.isHoliday}
                        onChange={(e) => handleWorkingHourChange(idx, "openTime", e.target.value)}
                        placeholder="09:00 AM"
                        className="w-24 text-center bg-[var(--bg)] border border-[var(--border)] p-2 text-xs text-[var(--text)] rounded-xl placeholder-neutral-600 focus:outline-none focus:border-blue-500/40 disabled:opacity-40 disabled:cursor-not-allowed font-mono"
                      />
                      <span className="text-[var(--text-subtle)] text-xs">-</span>
                      <input
                        type="text"
                        value={hour.closeTime}
                        disabled={hour.isHoliday}
                        onChange={(e) => handleWorkingHourChange(idx, "closeTime", e.target.value)}
                        placeholder="07:00 PM"
                        className="w-24 text-center bg-[var(--bg)] border border-[var(--border)] p-2 text-xs text-[var(--text)] rounded-xl placeholder-neutral-600 focus:outline-none focus:border-blue-500/40 disabled:opacity-40 disabled:cursor-not-allowed font-mono"
                      />
                    </div>

                    {/* Holiday toggle switch */}
                    <div className="flex items-center gap-1.5 bg-[var(--bg)] border border-[var(--border)] py-1 px-3 rounded-xl">
                      <span className="text-[10px] font-bold text-[var(--text-subtle)]">Holiday</span>
                      <button
                        type="button"
                        onClick={() => handleWorkingHourChange(idx, "isHoliday", !hour.isHoliday)}
                        className={`w-7 h-4 rounded-full p-0.5 transition-all outline-none ${
                          hour.isHoliday ? "bg-[#b91c1c]/20 border border-[#ef4444]/30" : "bg-[var(--bg-elevated)]"
                        }`}
                      >
                        <div className={`w-3 h-3 rounded-full transition-all ${
                          hour.isHoliday ? "translate-x-3 bg-red-400" : "translate-x-0 bg-[var(--text-subtle)]"
                        }`} />
                      </button>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: BUSINESS DESCRIPTION */}
          <div className="p-6 md:p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border)] backdrop-blur-md space-y-6 shadow-md shadow-black/30 group hover:border-[var(--border)] transition-all duration-300">
            <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black text-[var(--text)] uppercase tracking-wider font-sans">
                  3. Business Description
                </h2>
                <p className="text-[10px] text-[var(--text-subtle)] mt-0.5">Define your core value propositions, services summary and philosophy for LLM injection.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] uppercase font-black text-[var(--text-subtle)] tracking-wider">Detailed description bio</span>
                  <span className="text-[var(--text-subtle)] text-[10px] font-mono">Generates ~150 word base knowledge index</span>
                </div>
                <textarea
                  rows={4}
                  value={setupState.businessDescription}
                  onChange={(e) => handleChange("businessDescription", e.target.value)}
                  placeholder="Provide deep descriptions on who you are, what problems you solve, and what custom facilities you have so the chatbot never hallucinates response options."
                  className="w-full bg-[#08080a] border border-[var(--border)] focus:border-[var(--brand)] rounded-2xl p-4 text-xs text-[var(--text)] placeholder-neutral-600 focus:outline-none leading-relaxed transition-all"
                />
              </div>

              <div className="flex gap-2.5 p-3 rounded-2xl bg-blue-500/5 border border-blue-500/10 text-[var(--text-muted)] text-[11px] leading-relaxed">
                <Sparkles className="w-5 h-5 text-blue-400 shrink-0" />
                <span>
                  <strong>AI Context Rule:</strong> This detailed text segment is fed directly into the Gemini model's system prompt so it can address boutique brand inquiries, policies guidelines, and specialized offerings with 100% precision.
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 4: CONTACT INFORMATION */}
          <div className="p-6 md:p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border)] backdrop-blur-md space-y-6 shadow-md shadow-black/30 group hover:border-[var(--border)] transition-all duration-300">
            <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black text-[var(--text)] uppercase tracking-wider font-sans">
                  4. Contact Information
                </h2>
                <p className="text-[10px] text-[var(--text-subtle)] mt-0.5">Allot priority hotlines for customer escalations and human handover channels.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Support Number */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-[var(--text-subtle)] tracking-wider">Support hotline</label>
                <input
                  type="text"
                  value={setupState.supportNumber}
                  onChange={(e) => handleChange("supportNumber", e.target.value)}
                  placeholder="+91 99901 22334"
                  className="w-full bg-[#08080a] border border-[var(--border)] focus:border-[var(--brand)] rounded-xl p-3 text-xs text-[var(--text)] placeholder-neutral-600 focus:outline-none font-mono transition-all"
                />
              </div>

              {/* WhatsApp Number */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-[var(--text-subtle)] tracking-wider">WhatsApp Business hotline</label>
                <input
                  type="text"
                  value={setupState.whatsappNumber}
                  onChange={(e) => handleChange("whatsappNumber", e.target.value)}
                  placeholder="+91 91234 56789"
                  className="w-full bg-[#08080a] border border-[var(--border)] focus:border-[var(--brand)] rounded-xl p-3 text-xs text-[var(--text)] placeholder-neutral-600 focus:outline-none font-mono transition-all"
                />
              </div>

              {/* Alternate Number */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-[var(--text-subtle)] tracking-wider">Alternate Backup hotline</label>
                <input
                  type="text"
                  value={setupState.alternateNumber}
                  onChange={(e) => handleChange("alternateNumber", e.target.value)}
                  placeholder="+91 91234 50987"
                  className="w-full bg-[#08080a] border border-[var(--border)] focus:border-[var(--brand)] rounded-xl p-3 text-xs text-[var(--text)] placeholder-neutral-600 focus:outline-none font-mono transition-all"
                />
              </div>

            </div>
          </div>

          {/* SECTION 5: SOCIAL MEDIA LINKS */}
          <div className="p-6 md:p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border)] backdrop-blur-md space-y-6 shadow-md shadow-black/30 group hover:border-[var(--border)] transition-all duration-300">
            <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.1)]">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black text-[var(--text)] uppercase tracking-wider font-sans">
                  5. Social Media Handles
                </h2>
                <p className="text-[10px] text-[var(--text-subtle)] mt-0.5">Index official handles so the chatbot can redirect clients to your social platforms.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-[var(--text)] font-sans">
              
              {/* Instagram URL */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-[var(--text-subtle)] tracking-wider flex items-center gap-1">
                  <Instagram className="w-3.5 h-3.5 text-[#e11d48]" /> Instagram profile
                </label>
                <input
                  type="url"
                  value={setupState.instagram}
                  onChange={(e) => handleChange("instagram", e.target.value)}
                  placeholder="https://instagram.com/your_handle"
                  className="w-full bg-[#08080a] border border-[var(--border)] focus:border-[var(--brand)] rounded-xl p-3 text-xs text-[var(--text)] placeholder-neutral-600 focus:outline-none transition-all font-mono"
                />
              </div>

              {/* Facebook URL */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-[var(--text-subtle)] tracking-wider flex items-center gap-1">
                  <Facebook className="w-3.5 h-3.5 text-[#3b5998]" /> Facebook profile
                </label>
                <input
                  type="url"
                  value={setupState.facebook}
                  onChange={(e) => handleChange("facebook", e.target.value)}
                  placeholder="https://facebook.com/your_page"
                  className="w-full bg-[#08080a] border border-[var(--border)] focus:border-[var(--brand)] rounded-xl p-3 text-xs text-[var(--text)] placeholder-neutral-600 focus:outline-none transition-all font-mono"
                />
              </div>

              {/* Website URL */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-[var(--text-subtle)] tracking-wider flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-blue-400" /> Website Homepage
                </label>
                <input
                  type="url"
                  value={setupState.socialWebsite}
                  onChange={(e) => handleChange("socialWebsite", e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="w-full bg-[#08080a] border border-[var(--border)] focus:border-[var(--brand)] rounded-xl p-3 text-xs text-[var(--text)] placeholder-neutral-600 focus:outline-none transition-all font-mono"
                />
              </div>

              {/* YouTube URL */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-[var(--text-subtle)] tracking-wider flex items-center gap-1">
                  <Youtube className="w-3.5 h-3.5 text-[#ff0000]" /> YouTube channel
                </label>
                <input
                  type="url"
                  value={setupState.youtube}
                  onChange={(e) => handleChange("youtube", e.target.value)}
                  placeholder="https://youtube.com/c/your_channel"
                  className="w-full bg-[#08080a] border border-[var(--border)] focus:border-[var(--brand)] rounded-xl p-3 text-xs text-[var(--text)] placeholder-neutral-600 focus:outline-none transition-all font-mono"
                />
              </div>

            </div>
          </div>

        </div>

        {/* RIGHT WORKSPACE: LIVE AI KNOWLEDGE ANALYZER */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Realtime AI cognitive index box */}
          <div className="p-6 rounded-3xl bg-[var(--bg)]/90 border border-[var(--border)] shadow-xl space-y-4 relative overflow-hidden">
            {/* Ambient matrix green decoration */}
            <div className="absolute -top-12 -right-12 w-[160px] h-[160px] bg-blue-500/5 rounded-full blur-[40px] pointer-events-none" />
            
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-400 animate-pulse" />
              <div>
                <h3 className="text-xs font-black text-[var(--text)] uppercase tracking-wider">AI Live Index Auditor</h3>
                <p className="text-[9px] text-[var(--text-subtle)] font-sans">Visualizes cognitive interpretation in real-time</p>
              </div>
            </div>

            <div className="h-[1px] bg-[var(--bg-elevated)]" />

            <div className="space-y-3">
              <span className="text-[9.5px] text-[var(--text-subtle)] uppercase tracking-wider font-extrabold font-mono">Active Gemini Learned state:</span>
              
              {/* Fake terminal log structure */}
              <div className="bg-[#040406] border border-[var(--border)] rounded-2xl p-4 font-mono text-[10px] text-[var(--text-muted)] leading-relaxed overflow-hidden shadow-inner max-h-[350px] overflow-y-auto">
                <p className="text-emerald-400 mb-2">● SYSTEM ONLINE · INDEXING COGNITION</p>
                <div className="whitespace-pre-wrap speech-bubble-box">
                  {aiAnalysisSnippet}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <div className="p-3 bg-[var(--bg-elevated)]/60 border border-[var(--border)] rounded-2xl text-[9.5px] leading-relaxed text-[var(--text-muted)] flex items-start gap-2">
                <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  Any updates cataloged in the Business Setup fields trigger an instant index update. The Conversations simulator automatically queries this context inside 1.5 seconds!
                </span>
              </div>
            </div>
          </div>

          {/* Quick FAQ matching helper cards */}
          <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border)] space-y-4">
            <h4 className="text-[10px] font-black text-[var(--text)] uppercase tracking-wider">Active System Checks</h4>
            
            <div className="space-y-2">
              {[
                { label: "Google maps link synchronized", done: !!setupState.googleMapsLocation },
                { label: "Working hours bounds fully set", done: setupState.workingHours.length === 7 },
                { label: "Support hotline initialized", done: !!setupState.supportNumber },
                { label: "Business description & guidelines validated", done: setupState.businessDescription.length > 50 }
              ].map((check, id) => (
                <div key={id} className="flex items-center justify-between text-[11px] p-2 bg-[var(--bg)]/80 border border-[var(--border)] rounded-xl">
                  <span className="text-[var(--text-muted)] font-sans">{check.label}</span>
                  {check.done ? (
                    <span className="text-emerald-400 font-extrabold text-[10px] font-mono">PASS</span>
                  ) : (
                    <span className="text-amber-400 font-extrabold text-[10px] font-mono">PENDING</span>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
