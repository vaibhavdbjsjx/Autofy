import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Upload,
  Phone,
  MapPin,
  Globe,
  Building2,
  DollarSign,
  AlertCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Smartphone,
  FileText,
  Trash2,
  Lock,
  ChevronDown,
  QrCode,
  CreditCard,
  MessageSquare,
  Info,
  Dumbbell,
  Stethoscope,
  Scissors,
  UtensilsCrossed,
  GraduationCap,
  Store,
  Home,
  HelpCircle,
  ImagePlus,
  ExternalLink,
  Wifi,
  WifiOff
} from "lucide-react";

// ─── E.164 phone validation & normalization ──────────────────
function validatePhone(raw: string): { ok: boolean; normalized: string; error: string } {
  if (!raw || !raw.trim()) {
    return { ok: false, normalized: "", error: "Phone number is required." };
  }

  // Check for invalid characters (letters or forbidden special symbols)
  if (/[a-zA-Z]/.test(raw) || /[^\d\s\-()+]/.test(raw)) {
    return { ok: false, normalized: "", error: "Phone number must contain only digits, spaces, +, and hyphens." };
  }

  let cleaned = raw.replace(/[\s\-()]/g, "").trim();

  // If starts with +, handle international and double-prefix (+9191...)
  if (cleaned.startsWith("+")) {
    let digits = cleaned.slice(1);
    // Fix double prefix like +91916360254763 -> +916360254763
    if (digits.startsWith("9191") && digits.length === 14) {
      digits = digits.slice(2);
    }
    if (digits.length < 7 || digits.length > 15) {
      return { ok: false, normalized: "", error: "Phone number must have 7–15 digits after country code." };
    }
    return { ok: true, normalized: "+" + digits, error: "" };
  }

  // If does not start with +, extract digits
  let digitsOnly = cleaned.replace(/\D/g, "");

  // Handle leading 0 (e.g. 06360254763 -> 6360254763)
  if (digitsOnly.startsWith("0") && digitsOnly.length === 11) {
    digitsOnly = digitsOnly.slice(1);
  }

  // If 10 digits (standard Indian mobile without prefix, e.g. 6360254763) -> default to +91
  if (digitsOnly.length === 10) {
    return { ok: true, normalized: "+91" + digitsOnly, error: "" };
  }

  // If 12 digits starting with 91 (e.g. 916360254763) -> +916360254763
  if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
    return { ok: true, normalized: "+" + digitsOnly, error: "" };
  }

  // General fallback: if 7 to 15 digits
  if (digitsOnly.length >= 7 && digitsOnly.length <= 15) {
    return { ok: true, normalized: "+91" + digitsOnly, error: "" };
  }

  return { ok: false, normalized: "", error: "Please enter a valid 10-digit phone number (e.g. 6360254763 or +91 6360254763)." };
}

// ─── Industry-aware knowledge placeholders ───────────────────
type IndustryKey = "Gym" | "Salon" | "Clinic" | "Restaurant" | "Coaching" | "Retail" | "Real Estate" | "Other";
const INDUSTRY_EXAMPLES: Record<IndustryKey, { services: string; memberships: string; faqs: string; policies: string }> = {
  Gym: {
    services: "Personal Training \u2014 \u20b92,500/month\n3-Month Gym Membership \u2014 \u20b94,500\nZumba Classes \u2014 \u20b91,200/month",
    memberships: "1 Month AC \u2014 \u20b92,000\n3 Month AC \u2014 \u20b95,000\nYearly Non-AC \u2014 \u20b910,000",
    faqs: "Q: Do you have a trial class?\nA: Yes, first class is free.\nQ: What are your timings?\nA: 5 AM \u2013 10 PM, all days.",
    policies: "No refunds after 7 days of membership start.",
  },
  Salon: {
    services: "Haircut (Ladies) \u2014 \u20b9300\u2013\u20b9800\nHair Colouring (Global) \u2014 \u20b92,000\nBridal Makeup Package \u2014 \u20b98,000",
    memberships: "Monthly Skincare Plan \u2014 \u20b91,500\nBridal Prep Package (3 months) \u2014 \u20b912,000",
    faqs: "Q: Do I need to book an appointment?\nA: Walk-ins welcome, but appointments preferred for bridal.\nQ: What brands do you use?\nA: L'Or\u00e9al Professional and Schwarzkopf.",
    policies: "Advance booking required for bridal. 50% deposit is non-refundable.",
  },
  Clinic: {
    services: "General Consultation \u2014 \u20b9500\nFollow-up \u2014 \u20b9300\nBlood Test Panel \u2014 \u20b91,200\nECG \u2014 \u20b9400",
    memberships: "Annual Health Card \u2014 \u20b93,500 (includes 4 consultations + basic tests)",
    faqs: "Q: Do you accept walk-ins?\nA: Yes, for general consultations.\nQ: What are your timings?\nA: Mon\u2013Sat, 9 AM \u2013 8 PM.",
    policies: "Prescriptions valid for 30 days. No refunds for completed consultations.",
  },
  Restaurant: {
    services: "Veg Thali \u2014 \u20b9180\nChicken Biryani \u2014 \u20b9250\nPaneer Butter Masala \u2014 \u20b9220\nParty Catering (30 pax) \u2014 \u20b99,000",
    memberships: "Lunch Subscription (20 days) \u2014 \u20b92,800\nMonthly Tiffin Service \u2014 \u20b93,200",
    faqs: "Q: Do you offer home delivery?\nA: Yes, within 5 km. Minimum order \u20b9200.\nQ: Can I pre-order for events?\nA: Yes, 48 hours in advance.",
    policies: "Catering needs 30% advance. No cancellations within 24 hours of event.",
  },
  Coaching: {
    services: "Mathematics (Std 10) \u2014 \u20b92,500/month\nScience Batch \u2014 \u20b92,000/month\nIIT-JEE Preparation \u2014 \u20b95,000/month",
    memberships: "Annual Study Plan \u2014 \u20b924,000\nCrash Course (2 months) \u2014 \u20b98,000",
    faqs: "Q: Are trial classes available?\nA: Yes, one free demo class per subject.\nQ: What are batch timings?\nA: Morning (6\u20138 AM), Evening (5\u20138 PM).",
    policies: "No refunds after 10 days of joining. Transfer to another batch allowed once per year.",
  },
  Retail: {
    services: "Product inquiry via WhatsApp\nCustom orders accepted\nBulk/wholesale pricing available on request",
    memberships: "Loyalty Card \u2014 1 point per \u20b9100 spent\nPremium Member \u2014 10% off on all purchases",
    faqs: "Q: Do you offer home delivery?\nA: Yes, within the city. COD available.\nQ: Return policy?\nA: 7-day return for unused items in original packaging.",
    policies: "Damaged goods must be reported within 24 hours of delivery.",
  },
  "Real Estate": {
    services: "Property Consultation \u2014 Free\nSite Visit Arrangement \u2014 Free\nResidential & Commercial Listings",
    memberships: "Premium Listing Package \u2014 \u20b95,000/month",
    faqs: "Q: Do you handle buying and renting?\nA: Yes, residential and commercial.\nQ: What documents are required?\nA: Aadhar, PAN, and income proof.",
    policies: "Brokerage: 1\u20132% for purchase, 1 month rent for leasing.",
  },
  Other: {
    services: "Service 1 \u2014 \u20b9XXX\nService 2 \u2014 \u20b9XXX\nConsultation \u2014 \u20b9XXX",
    memberships: "Monthly Plan \u2014 \u20b9XXX\nAnnual Plan \u2014 \u20b9XXX",
    faqs: "Q: What are your working hours?\nA: [Your hours here]\nQ: Do you offer home service?\nA: [Your answer here]",
    policies: "[Your refund or cancellation policy here]",
  },
};
function getIndustryExamples(industryType: string) {
  return INDUSTRY_EXAMPLES[(industryType as IndustryKey)] || INDUSTRY_EXAMPLES["Other"];
}
import { OnboardingData } from "../types";

interface OnboardingWizardProps {
  initialData: OnboardingData;
  onComplete: (data: OnboardingData) => void;
  onOpenDashboard: (data: OnboardingData) => void;
  onTestAssistant: (data: OnboardingData) => void;
  onBackToHome: () => void;
}

const paymentLabels: Record<string, string> = {
  upi: "UPI / QR Code",
  razorpay: "Razorpay",
  phonepe: "PhonePe Business",
};

const EASE = [0.22, 1, 0.36, 1] as const;

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  initialData,
  onOpenDashboard,
  onTestAssistant
}) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(initialData);
  const [autoSavePulse, setAutoSavePulse] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Custom dropdown state
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);
  
  // Errors state
  const [stepError, setStepError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrCodeInputRef = useRef<HTMLInputElement>(null);

  const stepsList = [
    { num: 1, name: "Business Info" },
    { num: 2, name: "Knowledge Base" },
    { num: 3, name: "WhatsApp Setup" },
    { num: 4, name: "Payment Setup" },
    { num: 5, name: "Go Live" }
  ];

  const triggerAutoSave = () => {
    setAutoSavePulse(true);
    setTimeout(() => setAutoSavePulse(false), 1500);
  };

  const updateField = (field: keyof OnboardingData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
    triggerAutoSave();
  };

  const updateKnowledgeField = (field: keyof OnboardingData["knowledgeText"], value: string) => {
    setData((prev) => ({
      ...prev,
      knowledgeText: {
        ...prev.knowledgeText,
        [field]: value
      }
    }));
    triggerAutoSave();
  };

  const handleNext = () => {
    setStepError("");
    
    if (currentStep === 1) {
      if (!data.businessName.trim()) {
        setStepError("Please enter your business name.");
        return;
      }
      if (!data.industryType) {
        setStepError("Please select your industry type.");
        return;
      }
      if (!data.phoneNumber.trim()) {
        setStepError("Please enter your business phone number.");
        return;
      }
      const phoneValidation = validatePhone(data.phoneNumber);
      if (!phoneValidation.ok) {
        setStepError(phoneValidation.error);
        return;
      }
      // Store the E.164-normalized phone
      updateField("phoneNumber", phoneValidation.normalized);
    } else if (currentStep === 2) {
      if (!data.knowledgeText.services.trim() && data.uploadedFiles.length === 0) {
        setStepError("Please enter your services or upload a document so Autofy can learn about your business.");
        return;
      }
    } else if (currentStep === 3) {
      // WhatsApp step is OPTIONAL — validate format if provided, but never block
      if (data.whatsappNumber.trim()) {
        const waValidation = validatePhone(data.whatsappNumber);
        if (!waValidation.ok) {
          setStepError(waValidation.error);
          return;
        }
        // Normalize if valid
        updateField("whatsappNumber", waValidation.normalized);
      }
      // Always allow advancing — WhatsApp Cloud API is configured later in Dashboard
    } else if (currentStep === 4) {
      if (!data.paymentMethod) {
        setStepError("Please select a payment method.");
        return;
      }
      if (data.paymentMethod === "upi" && !data.upiId?.trim()) {
        setStepError("Please enter your UPI ID.");
        return;
      }
      if (data.paymentMethod === "razorpay" && !data.razorpayKey?.trim()) {
        setStepError("Please enter your Razorpay API key.");
        return;
      }
      if (data.paymentMethod === "phonepe" && !data.phonepeMerchantId?.trim()) {
        setStepError("Please enter your PhonePe Merchant ID.");
        return;
      }
    }

    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setStepError("");
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Save the WhatsApp number locally — truthful: does NOT connect Cloud API.
  // "Connected" state only comes from the Dashboard WhatsApp Setup with real Meta credentials.
  const handleSaveWhatsappNumber = () => {
    if (!data.whatsappNumber.trim()) {
      setStepError("Please enter a WhatsApp Business number first.");
      return;
    }
    const validation = validatePhone(data.whatsappNumber);
    if (!validation.ok) {
      setStepError(validation.error);
      return;
    }
    setStepError("");
    updateField("whatsappNumber", validation.normalized);
    updateField("whatsappConnected", "number_saved");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      uploadSimulatedFile(file);
    }
  };

  const uploadSimulatedFile = (file: File) => {
    setIsUploading(true);
    setTimeout(() => {
      const newFile = {
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
        type: file.type || "application/pdf"
      };
      updateField("uploadedFiles", [...data.uploadedFiles, newFile]);
      setIsUploading(false);
    }, 1500);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.includes("pdf") || file.name.endsWith(".docx") || file.name.endsWith(".doc")) {
        uploadSimulatedFile(file);
      } else {
        setStepError("Please upload PDF or Word files only.");
      }
    }
  };

  const removeFile = (idxToRemove: number) => {
    const filtered = data.uploadedFiles.filter((_, i) => i !== idxToRemove);
    updateField("uploadedFiles", filtered);
  };

  const industryOptions = [
    { label: "Gym", icon: <Dumbbell className="w-5 h-5" /> },
    { label: "Clinic", icon: <Stethoscope className="w-5 h-5" /> },
    { label: "Salon", icon: <Scissors className="w-5 h-5" /> },
    { label: "Restaurant", icon: <UtensilsCrossed className="w-5 h-5" /> },
    { label: "Coaching", icon: <GraduationCap className="w-5 h-5" /> },
    { label: "Retail", icon: <Store className="w-5 h-5" /> },
    { label: "Real Estate", icon: <Home className="w-5 h-5" /> },
    { label: "Other", icon: <HelpCircle className="w-5 h-5" /> },
  ];

  // Derived: industry examples for Step 2 placeholders
  const industryExamples = getIndustryExamples(data.industryType);

  // Derived: WhatsApp state
  // number_saved = user typed a number and validated it during onboarding
  // connected = real Meta Cloud API connection (only set by Dashboard/backend)
  const whatsappNumberSaved = data.whatsappConnected === "number_saved" || data.whatsappConnected === "connected";
  const whatsappGenuinelyConnected = data.whatsappConnected === "connected";

  // Knowledge is ready if at least services text or a file exists
  const knowledgeReady = data.knowledgeText.services.trim().length > 0 || data.uploadedFiles.length > 0;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col lg:grid lg:grid-cols-[320px_1fr] relative transition-colors duration-300 overflow-hidden">
      
      {/* ONE GLOBAL FIXED BACKGROUND — continuous across entire onboarding */}
      <div className="autofy-env">
        <div className="autofy-env-grid" />
        <div className="autofy-env-glow-pink" />
        <div className="autofy-env-glow-blue" />
        <div className="autofy-env-glow-purple" />
      </div>

      {/* Top thin progress bar */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "3px", background: "var(--border)", zIndex: 100 }}>
        <div style={{ width: `${(currentStep / 5) * 100}%`, height: "100%", background: "var(--brand-gradient)", transition: "width 0.4s ease" }} />
      </div>

      {/* LEFT PANEL: Fixed Step Sidebar */}
      <aside className="hidden lg:flex flex-col border-r border-[var(--border)] p-8 w-[320px] min-h-screen shrink-0 text-left select-none justify-between relative z-10" style={{ background: "var(--header-bg)", backdropFilter: "blur(20px)" }}>
        <div>
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--brand-gradient)" }}>
              <MessageSquare className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-[var(--text)] font-display">Autofy</span>
              <span className="block text-[9px] font-extrabold uppercase tracking-widest text-[var(--brand)]">Setup Wizard</span>
            </div>
          </div>

          {/* Progress percentage */}
          <div className="mt-8 mb-10">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xs font-bold text-[var(--text-muted)] font-sans">Setup Progress</span>
              <span className="text-lg font-black font-display text-[var(--brand)]">{Math.round(((currentStep - 1) / 5) * 100)}%</span>
            </div>
            <div style={{ height: 4, borderRadius: 4, background: "var(--border)", overflow: "hidden" }}>
              <div style={{ width: `${((currentStep - 1) / 5) * 100}%`, height: "100%", background: "var(--brand-gradient)", borderRadius: 4, transition: "width 0.4s ease" }} />
            </div>
          </div>
 
          {/* Steps List */}
          <nav className="space-y-2 relative">
            {stepsList.map((step, idx) => {
              const isCompleted = step.num < currentStep;
              const isActive = step.num === currentStep;
 
              return (
                <div key={step.num} className="relative z-10">
                  <div className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-200 ${isActive ? '' : ''}`}
                    style={isActive ? { background: "var(--brand-subtle)", border: "1px solid rgba(139,92,246,0.15)" } : { border: "1px solid transparent" }}
                  >
                    {/* Number Circle */}
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        fontWeight: 700,
                        transition: "all 0.3s ease",
                        flexShrink: 0,
                        background: isCompleted ? "var(--brand)" : "transparent",
                        border: isActive ? "2px solid var(--brand)" : isCompleted ? "none" : "2px solid var(--border-strong)",
                        color: isCompleted ? "#ffffff" : isActive ? "var(--brand)" : "var(--text-subtle)",
                      }}
                    >
                      {isCompleted ? <Check className="w-4 h-4 stroke-[3] text-[var(--text)]" /> : step.num}
                    </div>
 
                    {/* Step Label */}
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? "var(--text)" : "var(--text-muted)",
                        textDecoration: isCompleted ? "line-through" : "none",
                        opacity: isCompleted ? 0.6 : 1,
                      }}
                    >
                      {step.name}
                    </span>
                  </div>

                  {/* Vertical Connector Line */}
                  {idx < stepsList.length - 1 && (
                    <div
                      style={{
                        marginLeft: 31,
                        height: 8,
                        borderLeft: isCompleted
                          ? "2px solid var(--brand)"
                          : "2px dashed var(--border-strong)",
                        opacity: 0.4,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </nav>
        </div>
 
        {/* Sidebar Help */}
        <div className="text-[11px] text-[var(--text-muted)] font-sans">
          Need help? <a href="mailto:hello@autofy.io" className="hover:underline text-[var(--brand)] font-semibold">hello@autofy.io</a>
        </div>
      </aside>
 
      {/* Mobile Top Header (Temporary placeholder layout) */}
      <header className="lg:hidden bg-[var(--bg-2)] border-b border-[var(--border)] px-5 py-4 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--brand-subtle)] flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-[var(--brand)]" />
          </div>
          <span className="text-[16px] font-black tracking-tight text-[var(--text)] font-display">Autofy</span>
        </div>
        <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
          Step {currentStep} of 5
        </span>
      </header>
 
      {/* RIGHT PANEL: Step Content Container */}
      <main className="flex-grow flex flex-col justify-between relative z-10 overflow-y-auto min-h-[calc(100vh-68px)] lg:min-h-screen">
        
        {/* Top bar indicators inside panel */}
        <div className="w-full px-6 sm:px-10 lg:px-16 py-6 flex items-center justify-end h-14 shrink-0 select-none">
          <AnimatePresence>
            {autoSavePulse && (
              <motion.span
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-[11px] font-semibold flex items-center gap-1.5 px-3 py-1 rounded-full border border-[var(--border)]"
                style={{ background: "var(--bg-card)", color: "var(--text-muted)" }}
              >
                <Check className="w-3 h-3 text-[var(--success)]" /> Saved
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Centered Step Form Container (Form Starts ~80-120px below top nav) */}
        <div className="flex-grow flex items-start justify-center px-4 sm:px-8 lg:px-12 py-4 lg:py-8">
          <div className="w-full max-w-[800px] text-left p-6 sm:p-10 lg:p-12 rounded-3xl surface-a relative">
            
            {/* Error notifications */}
            {stepError && (
              <div className="mb-6 p-4 bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/20 rounded-2xl flex gap-3 items-start">
                <AlertCircle className="w-4 h-4 text-[var(--accent-red)] shrink-0 mt-0.5" />
                <span className="text-[13px] text-[var(--text)] font-sans leading-relaxed">{stepError}</span>
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35, ease: EASE }}
                className="w-full"
              >
                {/* STEP 1: BUSINESS PROFILE INFO */}
                {currentStep === 1 && (
                  <div className="space-y-8">
                    <div>
                      <span className="text-[11px] font-extrabold uppercase tracking-widest font-sans block mb-3" style={{ color: "var(--brand)" }}>STEP 1 OF 5</span>
                      <h2 className="font-display" style={{ fontSize: "clamp(26px, 3vw, 36px)", fontWeight: 800, color: "var(--text)", lineHeight: 1.15 }}>
                        Tell us about your business
                      </h2>
                      <p style={{ fontSize: 15, color: "var(--text-muted)", marginTop: 8 }}>
                        This helps Autofy understand who you are and how to represent you.
                      </p>
                    </div>
 
                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }} className="pt-2">
                      
                      {/* Row 1: Business Name */}
                      <div style={{ gridColumn: "1 / -1" }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>
                          Business Name *
                        </label>
                        <div className="flex items-center rounded-2xl px-4 h-[50px] transition-all border" style={{ background: "var(--input-bg)", borderColor: "var(--border)" }}>
                          <Building2 className="w-[18px] h-[18px] mr-3 flex-shrink-0" style={{ color: "var(--text-subtle)" }} />
                          <input
                            type="text"
                            value={data.businessName}
                            onChange={(e) => updateField("businessName", e.target.value)}
                            placeholder="e.g. Flex Gym, Dr. Mehta's Clinic"
                            className="w-full bg-transparent text-[14px] focus:outline-none font-sans"
                            style={{ color: "var(--text)" }}
                            required
                          />
                        </div>
                      </div>
 
                      {/* Row 2: Industry Type Dropdown */}
                      <div style={{ gridColumn: "1 / -1", position: "relative" }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>
                          Industry Type *
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowIndustryDropdown(!showIndustryDropdown)}
                          className="w-full flex items-center justify-between text-left rounded-2xl px-4 h-[50px] transition-all cursor-pointer border"
                          style={{ background: "var(--input-bg)", borderColor: "var(--border)" }}
                        >
                          <span className="text-[14px] font-sans flex items-center gap-2" style={{ color: data.industryType ? "var(--text)" : "var(--text-subtle)" }}>
                            {(() => {
                              const found = industryOptions.find(o => o.label === data.industryType);
                              return found ? (
                                <>
                                  <span style={{ color: "var(--brand)" }}>{found.icon}</span>
                                  <span className="font-semibold">{found.label}</span>
                                </>
                              ) : (
                                "Select industry..."
                              );
                            })()}
                          </span>
                          <ChevronDown className="w-[18px] h-[18px]" style={{ color: "var(--text-subtle)" }} />
                        </button>
 
                        {showIndustryDropdown && (
                          <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, 1fr)",
                            gap: "10px",
                            padding: "14px",
                            background: "var(--modal-bg)",
                            border: "1px solid var(--border-strong)",
                            borderRadius: "18px",
                            boxShadow: "0 20px 40px var(--shadow)",
                            marginTop: "8px",
                            position: "absolute",
                            left: 0,
                            right: 0,
                            zIndex: 50
                          }}>
                            {industryOptions.map((opt) => {
                              const isSelected = data.industryType === opt.label;
                              return (
                                <button
                                  key={opt.label}
                                  type="button"
                                  onClick={() => {
                                    updateField("industryType", opt.label);
                                    setShowIndustryDropdown(false);
                                  }}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    padding: "12px",
                                    borderRadius: "12px",
                                    border: isSelected ? "1px solid var(--brand)" : "1px solid var(--border)",
                                    background: isSelected ? "var(--brand-subtle)" : "var(--bg-elevated)",
                                    color: isSelected ? "var(--brand)" : "var(--text)",
                                    cursor: "pointer",
                                    textAlign: "left",
                                    transition: "all 0.2s ease"
                                  }}
                                >
                                  <span style={{ color: isSelected ? "var(--brand)" : "var(--text-subtle)" }}>
                                    {opt.icon}
                                  </span>
                                  <span style={{ fontSize: "13px", fontWeight: 600 }}>{opt.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
 
                      {/* Row 3: Phone & Website */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5" style={{ gridColumn: "1 / -1" }}>
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>
                            Phone Number *
                          </label>
                          <div className="flex items-center rounded-2xl px-4 h-[50px] transition-all border" style={{ background: "var(--input-bg)", borderColor: "var(--border)" }}>
                            <Phone className="w-[18px] h-[18px] mr-2 flex-shrink-0" style={{ color: "var(--text-subtle)" }} />
                            <span className="text-[13px] font-bold text-[var(--brand)] mr-2 select-none flex items-center gap-1 border-r border-[var(--border)] pr-2 font-mono">
                              🇮🇳 +91
                            </span>
                            <input
                              type="tel"
                              value={data.phoneNumber}
                              onChange={(e) => updateField("phoneNumber", e.target.value)}
                              placeholder="63602 54763"
                              className="w-full bg-transparent text-[14px] focus:outline-none font-sans"
                              style={{ color: "var(--text)" }}
                              required
                            />
                          </div>
                          <p className="text-[10px] text-[var(--text-subtle)] mt-1 font-sans">Enter 10-digit mobile number or full international number (+1...)</p>
                        </div>
 
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>
                            Website
                          </label>
                          <div className="flex items-center rounded-2xl px-4 h-[50px] transition-all border" style={{ background: "var(--input-bg)", borderColor: "var(--border)" }}>
                            <Globe className="w-[18px] h-[18px] mr-3 flex-shrink-0" style={{ color: "var(--text-subtle)" }} />
                            <input
                              type="url"
                              value={data.website}
                              onChange={(e) => updateField("website", e.target.value)}
                              placeholder="www.yourbusiness.com"
                              className="w-full bg-transparent text-[14px] focus:outline-none font-sans"
                              style={{ color: "var(--text)" }}
                            />
                          </div>
                        </div>
                      </div>
 
                      {/* Row 4: Address */}
                      <div style={{ gridColumn: "1 / -1" }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>
                          Address
                        </label>
                        <div className="flex items-center rounded-2xl px-4 h-[50px] transition-all border" style={{ background: "var(--input-bg)", borderColor: "var(--border)" }}>
                          <MapPin className="w-[18px] h-[18px] mr-3 flex-shrink-0" style={{ color: "var(--text-subtle)" }} />
                          <input
                            type="text"
                            value={data.address}
                            onChange={(e) => updateField("address", e.target.value)}
                            placeholder="City, State"
                            className="w-full bg-transparent text-[14px] focus:outline-none font-sans"
                            style={{ color: "var(--text)" }}
                          />
                        </div>
                      </div>
 
                    </div>
                  </div>
                )}

                {/* STEP 2: TEACH KNOWLEDGE BASE */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <div className="section-tag mb-4 inline-flex">
                        <span className="dot" />
                        <span>Step 2 of 5</span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)] font-display leading-tight">
                        Teach Autofy about your business
                      </h2>
                      <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1 font-sans">
                        The more you share, the smarter your AI becomes. You can always add more later.
                        {data.industryType && (
                          <span className="ml-1 text-[var(--brand)] font-semibold">
                            Showing examples for {data.industryType}.
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="space-y-5 pt-2 max-h-[420px] overflow-y-auto pr-2">
                      {/* Services */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 font-sans">
                          What do you offer? Include prices.
                        </label>
                        <textarea
                          value={data.knowledgeText.services}
                          onChange={(e) => updateKnowledgeField("services", e.target.value)}
                          placeholder={industryExamples.services}
                          rows={4}
                          className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-[14px] px-4 py-3 text-[14px] text-[var(--text)] focus:outline-none focus:border-[var(--border-strong)] placeholder-[var(--text-subtle)] font-sans resize-none"
                        />
                      </div>

                      {/* Memberships */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 font-sans">
                          Any subscription or membership plans?
                        </label>
                        <textarea
                          value={data.knowledgeText.memberships}
                          onChange={(e) => updateKnowledgeField("memberships", e.target.value)}
                          placeholder="e.g.&#10;1 Month AC — ₹2,000&#10;3 Month AC — ₹5,000&#10;Yearly Non-AC — ₹10,000"
                          rows={3}
                          className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-[14px] px-4 py-3 text-[14px] text-[var(--text)] focus:outline-none focus:border-[var(--border-strong)] placeholder-[var(--text-subtle)] font-sans resize-none"
                        />
                      </div>

                      {/* FAQs */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 font-sans">
                          Common questions customers ask you
                        </label>
                        <textarea
                          value={data.knowledgeText.faqs}
                          onChange={(e) => updateKnowledgeField("faqs", e.target.value)}
                          placeholder={industryExamples.faqs}
                          rows={4}
                          className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-[14px] px-4 py-3 text-[14px] text-[var(--text)] focus:outline-none focus:border-[var(--border-strong)] placeholder-[var(--text-subtle)] font-sans resize-none"
                        />
                      </div>

                      {/* Policies */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 font-sans">
                          Refund, cancellation, or other policies
                        </label>
                        <textarea
                          value={data.knowledgeText.policies}
                          onChange={(e) => updateKnowledgeField("policies", e.target.value)}
                          placeholder={industryExamples.policies}
                          rows={2}
                          className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-[14px] px-4 py-3 text-[14px] text-[var(--text)] focus:outline-none focus:border-[var(--border-strong)] placeholder-[var(--text-subtle)] font-sans resize-none"
                        />
                      </div>

                      {/* File Zone */}
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 font-sans">
                          Upload Documents (Menu, Price list, Brochure)
                        </label>
                        <div
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-[var(--border)] hover:border-[var(--border)] rounded-[18px] p-6 text-center cursor-pointer bg-[var(--input-bg)] hover:bg-[var(--input-bg)] transition-all flex flex-col items-center justify-center gap-2 group relative"
                        >
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".pdf,.docx,.doc"
                            className="hidden"
                          />
                          <Upload className="w-7 h-7 text-[var(--text-subtle)] group-hover:text-[var(--text-muted)] transition-colors" />
                          <p className="text-xs text-[var(--text-muted)] font-sans">
                            <span className="font-bold text-[var(--text)]">Click to upload</span> or drag files here
                          </p>
                          <p className="text-[10px] text-[var(--text-subtle)]">Supports PDF, DOCX, Excel — up to 10MB</p>

                          {isUploading && (
                            <div className="absolute inset-0 bg-black/80 rounded-[18px] flex items-center justify-center gap-3">
                              <span className="w-5 h-5 border-2 border-[var(--border)] border-t-white rounded-full animate-spin" />
                              <span className="text-xs text-[var(--text-muted)] font-medium">Processing file…</span>
                            </div>
                          )}
                        </div>

                        {/* File Lists */}
                        {data.uploadedFiles.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {data.uploadedFiles.map((file, i) => (
                              <div
                                key={i}
                                className="bg-[var(--input-bg)] border border-[var(--border)] rounded-[12px] p-3 flex items-center justify-between select-none"
                              >
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-[var(--text-muted)]" />
                                  <span className="text-xs text-[var(--text)] font-semibold truncate max-w-[200px] sm:max-w-xs">{file.name}</span>
                                  <span className="text-[10px] text-[var(--text-subtle)]">({file.size})</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeFile(i);
                                  }}
                                  className="p-1 rounded hover:bg-[var(--input-bg)] text-[var(--text-subtle)] hover:text-[var(--text)] transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: WHATSAPP SETUP — TRUTHFUL: number save only, Cloud API in Dashboard */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <div className="section-tag mb-4 inline-flex">
                        <span className="dot" />
                        <span>Step 3 of 5</span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)] font-display leading-tight">
                        Save your WhatsApp number
                      </h2>
                      <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1 font-sans">
                        This step is optional. Full WhatsApp Cloud API setup happens in the Dashboard after signup.
                      </p>
                    </div>

                    <div className="space-y-5 pt-2">
                      {/* Truthful info banner */}
                      <div className="bg-[var(--input-bg)] border border-[var(--border)] rounded-[18px] p-5 flex gap-4 text-left">
                        <Info className="w-6 h-6 text-[var(--brand)] shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-[13px] font-bold text-[var(--text)] uppercase tracking-wider font-display">WhatsApp Cloud API requires additional setup</h4>
                          <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed font-sans">
                            To enable AI responses via WhatsApp, you'll need a verified Meta Business account, WhatsApp Business Phone Number ID, and permanent access token. Configure these in Dashboard → WhatsApp Setup.
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2 font-sans">
                          WhatsApp Business Number (Optional)
                        </label>
                        <div className="relative flex items-center bg-[var(--input-bg)] border border-[var(--border)] rounded-[14px] px-4 py-3.5 focus-within:border-[var(--border-strong)] transition-all">
                          <Phone className="w-[18px] h-[18px] text-[var(--text-subtle)] mr-2 flex-shrink-0" />
                          <span className="text-[13px] font-bold text-[var(--brand)] mr-2 select-none flex items-center gap-1 border-r border-[var(--border)] pr-2 font-mono">
                            🇮🇳 +91
                          </span>
                          <input
                            type="tel"
                            disabled={whatsappNumberSaved}
                            value={data.whatsappNumber}
                            onChange={(e) => {
                              updateField("whatsappNumber", e.target.value);
                              if (data.whatsappConnected === "number_saved") {
                                updateField("whatsappConnected", "");
                              }
                            }}
                            placeholder="63602 54763"
                            className="w-full bg-transparent text-[14px] text-[var(--text)] focus:outline-none placeholder-[var(--text-subtle)] font-sans disabled:opacity-50"
                          />
                        </div>
                        <p className="text-[10px] text-[var(--text-subtle)] mt-1 font-sans">Enter 10-digit mobile number or full international number (+1...)</p>
                      </div>

                      <div className="flex justify-end pt-2">
                        {whatsappGenuinelyConnected ? (
                          <div className="w-full bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl p-3 flex items-center justify-center gap-2 text-xs font-semibold select-none">
                            <Check className="w-4 h-4" />
                            <span>Connected via WhatsApp Cloud API: {data.whatsappNumber}</span>
                          </div>
                        ) : whatsappNumberSaved ? (
                          <div className="w-full bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl p-3 flex items-start gap-3 text-xs font-semibold select-none">
                            <Wifi className="w-4 h-4 shrink-0 mt-0.5" />
                            <div>
                              <div>Number saved: {data.whatsappNumber}</div>
                              <div className="text-[11px] font-normal mt-1 text-blue-300/80">
                                Complete WhatsApp Cloud API configuration in Dashboard → WhatsApp Setup to activate AI responses.
                              </div>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={handleSaveWhatsappNumber}
                            className="w-full py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all duration-200 active:scale-[0.98] cursor-pointer btn-primary"
                          >
                            Save Number <ArrowRight size={14} className="inline" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: BILLING / PAYMENTS */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div>
                      <div className="section-tag mb-4 inline-flex">
                        <span className="dot" />
                        <span>Step 4 of 5</span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)] font-display leading-tight">
                        Set up payments
                      </h2>
                      <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1 font-sans">
                        Autofy can send payment links and verify payments automatically.
                      </p>
                    </div>

                    <div className="space-y-3.5 pt-2">
                      {/* Option 1: UPI */}
                      <div
                        onClick={() => updateField("paymentMethod", "upi")}
                        className={`p-5 rounded-[18px] border cursor-pointer text-left transition-all ${
                          data.paymentMethod === "upi"
                            ? "bg-[var(--input-bg)] border-[var(--border-strong)]"
                            : "border-[var(--border)] hover:border-[var(--border-strong)]"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <QrCode className="w-5 h-5 text-[var(--text-muted)] shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-bold text-[var(--text)] font-display">UPI / QR Code</h4>
                            <p className="text-xs text-[var(--text-muted)] mt-1 font-sans">Google Pay, PhonePe, Paytm — simplest setup</p>
                          </div>
                        </div>
                        {data.paymentMethod === "upi" && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="mt-4 border-t border-[var(--border)] pt-3 text-left space-y-4"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5 font-sans">
                                Your UPI ID
                              </label>
                              <input
                                type="text"
                                value={data.upiId || ""}
                                onChange={(e) => updateField("upiId", e.target.value)}
                                placeholder="yourbusiness@okicici"
                                className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--border-strong)] placeholder-[var(--text-subtle)] font-sans"
                              />
                            </div>

                            {/* QR Code Image Upload */}
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5 font-sans">
                                Upload QR Code Image (Optional)
                              </label>
                              <input
                                ref={qrCodeInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    const file = e.target.files[0];
                                    updateField("qrCodeImage", file.name);
                                  }
                                }}
                              />
                              {data.qrCodeImage ? (
                                <div className="flex items-center gap-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-4 py-3">
                                  <QrCode className="w-5 h-5 text-[var(--brand)] shrink-0" />
                                  <span className="text-xs font-semibold text-[var(--text)] truncate flex-1 font-sans">{data.qrCodeImage}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      updateField("qrCodeImage", undefined);
                                      if (qrCodeInputRef.current) qrCodeInputRef.current.value = "";
                                    }}
                                    className="text-[var(--accent-red)] hover:text-red-400 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => qrCodeInputRef.current?.click()}
                                  className="w-full flex items-center justify-center gap-2.5 bg-[var(--input-bg)] border-2 border-dashed border-[var(--border-strong)] rounded-xl px-4 py-4 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--brand)] transition-all cursor-pointer font-sans"
                                >
                                  <ImagePlus className="w-4 h-4" />
                                  <span>Upload your payment QR code from gallery</span>
                                </button>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </div>

                      {/* Option 2: Razorpay */}
                      <div
                        onClick={() => updateField("paymentMethod", "razorpay")}
                        className={`p-5 rounded-[18px] border cursor-pointer text-left transition-all ${
                          data.paymentMethod === "razorpay"
                            ? "bg-[var(--input-bg)] border-[var(--border-strong)]"
                            : "border-[var(--border)] hover:border-[var(--border-strong)]"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <CreditCard className="w-5 h-5 text-[var(--text-muted)] shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-bold text-[var(--text)] font-display">Razorpay</h4>
                            <p className="text-xs text-[var(--text-muted)] mt-1 font-sans">Accept cards, UPI, netbanking, and wallets</p>
                          </div>
                        </div>
                        {data.paymentMethod === "razorpay" && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="mt-4 border-t border-[var(--border)] pt-3 text-left"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5 font-sans flex items-center justify-between">
                              <span>Razorpay API Key</span>
                              <Lock className="w-3.5 h-3.5 text-[var(--text-subtle)]" />
                            </label>
                            <input
                              type="password"
                              value={data.razorpayKey || ""}
                              onChange={(e) => updateField("razorpayKey", e.target.value)}
                              placeholder="rzp_live_xxxxxxxxxxxx"
                              className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--border-strong)] placeholder-[var(--text-subtle)] font-sans"
                            />
                          </motion.div>
                        )}
                      </div>

                      {/* Option 3: PhonePe */}
                      <div
                        onClick={() => updateField("paymentMethod", "phonepe")}
                        className={`p-5 rounded-[18px] border cursor-pointer text-left transition-all ${
                          data.paymentMethod === "phonepe"
                            ? "bg-[var(--input-bg)] border-[var(--border-strong)]"
                            : "border-[var(--border)] hover:border-[var(--border-strong)]"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <Smartphone className="w-5 h-5 text-[var(--text-muted)] shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-bold text-[var(--text)] font-display">PhonePe Business</h4>
                            <p className="text-xs text-[var(--text-muted)] mt-1 font-sans">For businesses already using PhonePe merchant</p>
                          </div>
                        </div>
                        {data.paymentMethod === "phonepe" && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="mt-4 border-t border-[var(--border)] pt-3 text-left"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5 font-sans">
                              PhonePe Merchant ID
                            </label>
                            <input
                              type="text"
                              value={data.phonepeMerchantId || ""}
                              onChange={(e) => updateField("phonepeMerchantId", e.target.value)}
                              placeholder="MERCHANTID_XXXX"
                              className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--border-strong)] placeholder-[var(--text-subtle)] font-sans"
                            />
                          </motion.div>
                        )}
                      </div>

                      {/* Skip button */}
                      <div className="text-center pt-4 select-none">
                        <button
                          type="button"
                          onClick={() => {
                            setStepError("");
                            setCurrentStep(5);
                          }}
                          className="text-[12px] text-[var(--text-subtle)] hover:text-[var(--text-muted)] transition-colors font-semibold cursor-pointer py-1.5"
                        >
                          Skip for now — set up later in dashboard
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 5: SUMMARY & GO LIVE — TRUTHFUL */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <div>
                      <div className="section-tag mb-4 inline-flex">
                        <span className="dot" />
                        <span>Step 5 of 5</span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)] font-display leading-tight">
                        {knowledgeReady ? "Your AI knowledge base is ready." : "Almost there!"}
                      </h2>
                      <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1 font-sans">
                        Here's a summary of what's been set up for your Autofy account.
                      </p>
                    </div>

                    <div className="space-y-5 pt-2">
                      <div className="bg-[var(--input-bg)] border border-[var(--border)] rounded-[22px] p-6 space-y-4 text-left">
                        {/* Business */}
                        <div className="flex items-start gap-3 text-sm">
                          <Building2 className="w-4 h-4 text-[var(--text-subtle)] mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[12px] text-[var(--text-muted)] leading-none mb-1 font-sans">Business</p>
                            <p className="text-[14px] text-[var(--text)] font-semibold">{data.businessName || "—"}</p>
                          </div>
                        </div>

                        {/* WhatsApp — truthful */}
                        <div className="flex items-start gap-3 text-sm">
                          <MessageSquare className="w-4 h-4 text-[var(--text-subtle)] mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[12px] text-[var(--text-muted)] leading-none mb-1 font-sans">WhatsApp Channel</p>
                            <p className="text-[14px] font-semibold" style={{
                              color: whatsappGenuinelyConnected ? "var(--success, #10b981)" : "var(--text-muted)"
                            }}>
                              {whatsappGenuinelyConnected
                                ? `Connected — ${data.whatsappNumber}`
                                : whatsappNumberSaved
                                  ? `Number saved (${data.whatsappNumber}) — Cloud API setup required in Dashboard`
                                  : "Not configured — setup in Dashboard → WhatsApp Setup"}
                            </p>
                          </div>
                        </div>

                        {/* Payments */}
                        <div className="flex items-start gap-3 text-sm">
                          <DollarSign className="w-4 h-4 text-[var(--text-subtle)] mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[12px] text-[var(--text-muted)] leading-none mb-1 font-sans">Payments</p>
                            <p className="text-[14px] text-[var(--text)] font-semibold">
                              {data.paymentMethod ? paymentLabels[data.paymentMethod] : "Not set up"}
                            </p>
                          </div>
                        </div>

                        {/* Knowledge */}
                        <div className="flex items-start gap-3 text-sm">
                          <FileText className="w-4 h-4 text-[var(--text-subtle)] mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[12px] text-[var(--text-muted)] leading-none mb-1 font-sans">AI Knowledge Base</p>
                            <p className="text-[14px] text-[var(--text)] font-semibold">
                              {knowledgeReady
                                ? `${data.uploadedFiles.length} file(s) + text entries`
                                : "Not configured yet"}
                            </p>
                          </div>
                        </div>

                        {/* Truthful readiness indicators */}
                        <div className="border-t border-[var(--border)] pt-4 space-y-2">
                          {knowledgeReady && (
                            <div className="flex items-center gap-2.5 select-none">
                              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                              <span className="text-[12px] text-[var(--text-muted)] font-semibold font-sans">AI knowledge base is ready</span>
                            </div>
                          )}
                          {!whatsappGenuinelyConnected && (
                            <div className="flex items-center gap-2.5 select-none">
                              <WifiOff className="w-3.5 h-3.5 text-amber-500" />
                              <span className="text-[12px] text-amber-500 font-semibold font-sans">
                                WhatsApp Cloud API not yet connected — customer replies not active
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* CTA Buttons */}
                      <div className="flex flex-col gap-3 pt-2">
                        {/* PRIMARY: complete onboarding + go to dashboard */}
                        <button
                          onClick={() => onOpenDashboard(data)}
                          className="btn-primary w-full justify-center h-12 rounded-[14px] text-[13px] font-bold cursor-pointer"
                        >
                          Open my dashboard <ArrowRight size={14} className="inline" />
                        </button>
                        {/* SECONDARY: complete onboarding then navigate to WhatsApp setup in dashboard */}
                        {/* Uses sessionStorage intent instead of navigate() to avoid routing before is_onboarded=true */}
                        <button
                          onClick={() => {
                            try { sessionStorage.setItem("autofy-dashboard-tab", "whatsapp_setup"); } catch { /* ignore */ }
                            onOpenDashboard(data);
                          }}
                          className="btn-secondary w-full justify-center h-12 rounded-[14px] text-[13px] font-bold cursor-pointer flex items-center gap-2 hover:border-blue-500 hover:text-blue-500"
                        >
                          <Phone className="w-4 h-4 text-blue-500" />
                          <span>Configure WhatsApp Cloud API in Dashboard</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {!whatsappGenuinelyConnected && (
                        <p className="text-[11px] text-[var(--text-subtle)] text-center font-sans">
                          WhatsApp Cloud API setup takes ~10 minutes and requires a Meta Business account.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
            {/* ACTION BUTTONS (Form-Bound, NOT viewport-wide!) */}
            <div className="pt-8 mt-8 border-t border-[var(--border)] flex items-center justify-between select-none">
              {/* Back btn */}
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="btn-ghost flex items-center gap-2 text-[14px] font-semibold cursor-pointer px-4 py-2 rounded-full text-[var(--text-muted)] hover:text-[var(--text)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              {/* Step indicator mobile */}
              <span className="lg:hidden text-xs font-mono text-[var(--text-subtle)] font-bold">
                Step {currentStep} of 5
              </span>

              {currentStep < 5 && (
                <button
                  type="button"
                  onClick={handleNext}
                  className="btn-primary px-8 py-3.5 rounded-full text-xs sm:text-sm font-extrabold font-display uppercase tracking-wider cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
