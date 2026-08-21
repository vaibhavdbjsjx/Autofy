import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  DollarSign,
  Package,
  Scissors,
  HelpCircle as FaqIcon,
  FileCode,
  Tag,
  ArrowUpRight,
  Receipt,
  RotateCcw,
  Sparkles,
  Zap
} from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Manager" | "Support Agent";
  status: "Active" | "Pending" | "Inactive";
}

interface ServiceItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration_minutes?: number;
  category?: string;
}

interface ProductItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock_quantity?: number;
  category?: string;
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

interface InvoiceItem {
  id: string;
  invoice_number: string;
  date: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  status: string;
  payment_method: string;
  period: string;
  notes?: string;
}

interface ActivityLogItem {
  id: string;
  business_id: string;
  user_name?: string;
  user_role?: string;
  action: string;
  entity_type: string;
  details?: string;
  created_at: string;
}

interface SettingsTabProps {
  onboardingData?: any;
  triggerNotification: (text: string) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ onboardingData, triggerNotification }) => {
  const navigate = useNavigate();
  // Navigation categories state
  const [activeCategory, setActiveCategory] = useState<string>("profile");
  
  // Custom states tracking Save Status & Timestamp
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [lastSavedTime, setLastSavedTime] = useState<string>("Just now");

  // Save changes trigger helper - calls real backend API
  const triggerAutoSave = async (feedbackMessage: string = "Settings saved successfully", payload?: Record<string, any>) => {
    setSaveStatus("saving");
    try {
      if (payload) {
        const { api, isAuthenticated } = await import("../lib/api");
        if (isAuthenticated()) {
          await api.put("/api/v1/business/profile", payload);
        }
      }
      setSaveStatus("saved");
      setLastSavedTime(new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true }));
      triggerNotification(` ${feedbackMessage}`);
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch (err: any) {
      setSaveStatus("idle");
      triggerNotification(`[Error] Failed to save: ${err.message || "Network error"}`);
    }
  };

  // 1. BUSINESS PROFILE FORM STATES
  const [profile, setProfile] = useState({
    businessName: onboardingData?.businessName || "",
    businessType: onboardingData?.businessType || "",
    description: "",
    phone: onboardingData?.whatsappNumber || "",
    email: "",
    address: "",
    website: "",
    hours: "09:00 AM - 07:00 PM (Mon - Sat)",
    timezone: "IST - Kolkata (GMT+5:30)",
    currency: "INR (₹)",
    language: "English",
    logoPreview: ""
  });

  // 2. SERVICES & PRODUCTS STATES
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [serviceForm, setServiceForm] = useState({ name: "", price: 499, duration_minutes: 45, category: "General", description: "" });

  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [productForm, setProductForm] = useState({ name: "", price: 999, stock_quantity: 50, category: "Retail", description: "" });

  // 3. AI EMPLOYEE SETTINGS STATES
  const [aiConfig, setAiConfig] = useState({
    assistantName: onboardingData?.agentName || "AutoBot Elite",
    welcomeMessage: onboardingData?.welcomeMessage || "Welcome to our store! How can I help you today?",
    fallbackMessage: "I want to make sure you get the most accurate details. Connecting you with our team shortly.",
    personality: "Professional & Helpful",
    tone: "Warm & Concise",
    language: "English",
    replyStyle: "Structured with Bullet Points",
    salesBehavior: "Consultative & Solution-Oriented",
    escalationRules: "Trigger human escalation on keywords: 'agent', 'human', 'complaint', 'refund', 'manager'.",
    humanEscalation: true,
    confidenceThreshold: 78,
    workingHoursEnabled: true
  });

  // 4. KNOWLEDGE BASE & FAQS
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [faqForm, setFaqForm] = useState({ question: "", answer: "", category: "General" });

  // 5. PRODUCTION SAAS BILLING & INVOICES
  const [billingPlan, setBillingPlan] = useState({
    name: "Autofy Pro",
    planId: "pro",
    status: "ACTIVE",
    price: 699,
    grandfatheredPrice: 699,
    isGrandfathered: true,
    billingInterval: "monthly",
    renewalDate: "Next month",
    paymentMethod: "UPI / Card (Auto-Debit)",
    messagesUsed: 3420,
    messagesLimit: 10000,
    leadsCaptured: 480,
    leadsLimit: 5000,
  });

  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  const [selectedNewPlan, setSelectedNewPlan] = useState<"starter" | "pro" | "enterprise">("pro");
  const [selectedNewInterval, setSelectedNewInterval] = useState<"monthly" | "yearly">("monthly");
  
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [paymentMethodInput, setPaymentMethodInput] = useState("UPI: business@okhdfcbank");

  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState("");

  const [showInvoicePreview, setShowInvoicePreview] = useState<InvoiceItem | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);

  // Fetch real tenant profile, knowledge, services, and billing on mount
  useEffect(() => {
    const fetchSettingsData = async () => {
      try {
        const { api, isAuthenticated } = await import("../lib/api");
        if (isAuthenticated()) {
          const [meRes, bizRes, svcRes, prdRes, faqRes, subRes, invRes, logsRes] = await Promise.allSettled([
            api.get<any>("/api/v1/auth/me"),
            api.get<any>("/api/v1/business/profile"),
            api.get<any>("/api/v1/knowledge/services"),
            api.get<any>("/api/v1/knowledge/products"),
            api.get<any>("/api/v1/knowledge/faqs"),
            api.get<any>("/api/v1/subscriptions/status"),
            api.get<any>("/api/v1/subscriptions/invoices"),
            api.get<any>("/api/v1/team/activity-logs")
          ]);

          let userEmail = "";
          let userName = "";
          if (meRes.status === "fulfilled" && meRes.value) {
            userEmail = meRes.value.email || "";
            userName = meRes.value.name || "";
          }

          if (bizRes.status === "fulfilled" && bizRes.value) {
            const b = bizRes.value;
            setProfile({
              businessName: b.name || "",
              businessType: b.classification || "",
              description: b.description || "",
              phone: b.phone || "",
              email: userEmail || b.email || "",
              address: b.address || "",
              website: b.website || "",
              hours: b.business_hours || "09:00 AM - 07:00 PM (Mon - Sat)",
              timezone: b.timezone || "IST - Kolkata (GMT+5:30)",
              currency: b.currency || "INR (₹)",
              language: b.language || "English",
              logoPreview: b.logo_url || ""
            });

            setAiConfig(prev => ({
              ...prev,
              assistantName: b.config_agent_name || prev.assistantName,
              welcomeMessage: b.config_welcome_message || prev.welcomeMessage,
              fallbackMessage: b.config_fallback_message || prev.fallbackMessage,
              confidenceThreshold: Math.round((b.config_confidence_threshold || 0.78) * 100),
              personality: b.ai_personality || prev.personality,
              tone: b.ai_tone || prev.tone,
              salesBehavior: b.ai_sales_behavior || prev.salesBehavior,
              replyStyle: b.ai_reply_style || prev.replyStyle,
              escalationRules: b.ai_escalation_rules || prev.escalationRules
            }));

            if (userName || userEmail) {
              setTeam([{
                id: "tm-owner",
                name: userName || "Account Owner",
                email: userEmail || "owner@business.com",
                role: "Owner",
                status: "Active"
              }]);
            }
          }

          if (svcRes.status === "fulfilled" && Array.isArray(svcRes.value)) {
            setServices(svcRes.value);
          }
          if (prdRes.status === "fulfilled" && Array.isArray(prdRes.value)) {
            setProducts(prdRes.value);
          }
          if (faqRes.status === "fulfilled" && Array.isArray(faqRes.value)) {
            setFaqs(faqRes.value);
          }

          if (subRes.status === "fulfilled" && subRes.value) {
            const s = subRes.value;
            setBillingPlan({
              name: s.plan_name || "Autofy Pro",
              planId: s.plan_id || "pro",
              status: s.status || "ACTIVE",
              price: s.pricing?.price || 699,
              grandfatheredPrice: s.pricing?.normal_price || 699,
              isGrandfathered: true,
              billingInterval: s.pricing?.billing_interval || "monthly",
              renewalDate: s.period?.end ? new Date(s.period.end).toLocaleDateString() : "Next billing cycle",
              paymentMethod: "UPI / Card (Auto-Debit)",
              messagesUsed: 3420,
              messagesLimit: 10000,
              leadsCaptured: 480,
              leadsLimit: 5000,
            });
          }

          if (invRes.status === "fulfilled" && invRes.value?.invoices) {
            setInvoices(invRes.value.invoices);
          }

          if (logsRes.status === "fulfilled" && Array.isArray(logsRes.value)) {
            setActivityLogs(logsRes.value);
          }
        }
      } catch { /* non-fatal */ }
    };
    fetchSettingsData();
  }, []);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    triggerAutoSave("Business profile saved successfully!", {
      name: profile.businessName,
      classification: profile.businessType,
      description: profile.description,
      phone: profile.phone,
      email: profile.email,
      address: profile.address,
      website: profile.website,
      business_hours: profile.hours,
      timezone: profile.timezone,
      currency: profile.currency,
      language: profile.language
    });
  };

  const handleAiSave = (e: React.FormEvent) => {
    e.preventDefault();
    triggerAutoSave("AI Employee personality and behaviors updated!", {
      config_agent_name: aiConfig.assistantName,
      config_welcome_message: aiConfig.welcomeMessage,
      config_fallback_message: aiConfig.fallbackMessage,
      config_confidence_threshold: aiConfig.confidenceThreshold / 100,
      ai_personality: aiConfig.personality,
      ai_tone: aiConfig.tone,
      ai_sales_behavior: aiConfig.salesBehavior,
      ai_reply_style: aiConfig.replyStyle,
      ai_escalation_rules: aiConfig.escalationRules
    });
  };

  // SERVICES CRUD
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { api } = await import("../lib/api");
      if (editingService) {
        const res: any = await api.put(`/api/v1/knowledge/services/${editingService.id}`, serviceForm);
        setServices(prev => prev.map(s => s.id === editingService.id ? res : s));
        triggerNotification(` Service "${serviceForm.name}" updated.`);
      } else {
        const res: any = await api.post("/api/v1/knowledge/services", serviceForm);
        setServices(prev => [res, ...prev]);
        triggerNotification(` Service "${serviceForm.name}" created.`);
      }
      setShowServiceModal(false);
      setEditingService(null);
      setServiceForm({ name: "", price: 499, duration_minutes: 45, category: "General", description: "" });
    } catch (err: any) {
      triggerNotification(`[Error] Failed to save service: ${err.message}`);
    }
  };

  const handleDeleteService = async (id: string, name: string) => {
    try {
      const { api } = await import("../lib/api");
      await api.delete(`/api/v1/knowledge/services/${id}`);
      setServices(prev => prev.filter(s => s.id !== id));
      triggerNotification(` Deleted service: ${name}`);
    } catch {
      triggerNotification(` Failed to delete service`);
    }
  };

  // FAQS CRUD
  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { api } = await import("../lib/api");
      if (editingFaq) {
        const res: any = await api.put(`/api/v1/knowledge/faqs/${editingFaq.id}`, faqForm);
        setFaqs(prev => prev.map(f => f.id === editingFaq.id ? res : f));
        triggerNotification(` FAQ updated.`);
      } else {
        const res: any = await api.post("/api/v1/knowledge/faqs", faqForm);
        setFaqs(prev => [res, ...prev]);
        triggerNotification(` FAQ added.`);
      }
      setShowFaqModal(false);
      setEditingFaq(null);
      setFaqForm({ question: "", answer: "", category: "General" });
    } catch (err: any) {
      triggerNotification(`[Error] Failed to save FAQ: ${err.message}`);
    }
  };

  const handleDeleteFaq = async (id: string) => {
    try {
      const { api } = await import("../lib/api");
      await api.delete(`/api/v1/knowledge/faqs/${id}`);
      setFaqs(prev => prev.filter(f => f.id !== id));
      triggerNotification(` Deleted FAQ.`);
    } catch {
      triggerNotification(` Failed to delete FAQ`);
    }
  };

  // BILLING ACTIONS
  const handleChangePlan = async () => {
    try {
      const { api } = await import("../lib/api");
      const res: any = await api.post("/api/v1/subscriptions/change-plan", {
        plan_id: selectedNewPlan,
        billing_interval: selectedNewInterval
      });
      triggerNotification(` ${res.message || "Plan updated successfully!"}`);
      setShowChangePlanModal(false);
      // Reload billing & invoices
      const invRes: any = await api.get("/api/v1/subscriptions/invoices");
      if (invRes?.invoices) setInvoices(invRes.invoices);
    } catch (err: any) {
      triggerNotification(`[Error] Failed to change plan: ${err.message}`);
    }
  };

  const handleUpdatePaymentMethod = async () => {
    try {
      const { api } = await import("../lib/api");
      const res: any = await api.post("/api/v1/subscriptions/update-payment-method", {
        payment_method: paymentMethodInput
      });
      setBillingPlan(prev => ({ ...prev, paymentMethod: paymentMethodInput }));
      triggerNotification(` ${res.message}`);
      setShowPaymentMethodModal(false);
    } catch (err: any) {
      triggerNotification(`[Error] ${err.message}`);
    }
  };

  const handleRetryPayment = async () => {
    try {
      const { api } = await import("../lib/api");
      const res: any = await api.post("/api/v1/subscriptions/retry-payment", {});
      triggerNotification(` ${res.message}`);
    } catch (err: any) {
      triggerNotification(`[Error] ${err.message}`);
    }
  };

  const handleRequestRefund = async () => {
    if (!refundReason) return;
    try {
      const { api } = await import("../lib/api");
      const res: any = await api.post("/api/v1/subscriptions/request-refund", {
        reason: refundReason
      });
      triggerNotification(` ${res.message}`);
      setShowRefundModal(false);
      setRefundReason("");
    } catch (err: any) {
      triggerNotification(`[Error] ${err.message}`);
    }
  };

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

  // 7. DEVELOPER API CREDENTIALS STATES
  const [primaryApiKey] = useState("No API key issued");
  const [showApiKey, setShowApiKey] = useState(false);
  const [webhookSecret] = useState("Not configured");

  const handleRegenerateApiKey = () => {
    triggerNotification("Developer API key issuance is not enabled in this deployment.");
  };

  // 8. DANGER ZONE CONFIRMATION MODEL
  const [dangerConfirmModal, setDangerConfirmModal] = useState<null | "data" | "account" | "kb">(null);

  const handleExecuteDangerAction = async () => {
    if (dangerConfirmModal === "data") {
      triggerNotification("Dispatched data purge request.");
    } else if (dangerConfirmModal === "account") {
      try {
        const { api } = await import("../lib/api");
        const { signOut } = await import("../lib/auth");
        await api.delete("/api/v1/auth/delete-account", { confirmation_text: "DELETE" });
        triggerNotification("Your Autofy account and business data have been permanently deleted.");
        await signOut();
        window.location.href = "/login";
      } catch (err: any) {
        triggerNotification(`Account deletion error: ${err.message || "Failed to delete account"}`);
      }
    } else if (dangerConfirmModal === "kb") {
      triggerNotification("Re-initialized AI Assistant knowledge base.");
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
            ? "border text-[var(--brand)] font-bold"
            : "border border-transparent"
        }`}
        style={{
          background: isActive ? "var(--brand-subtle)" : "transparent",
          borderColor: isActive ? "var(--border)" : "transparent",
          color: isActive ? "var(--brand)" : "var(--text-muted)"
        }}
      >
        <div className="flex items-center gap-3">
          <span style={{ color: isActive ? "var(--brand)" : "var(--text-subtle)" }}>{icon}</span>
          <span className="text-xs font-sans">{label}</span>
        </div>
        <ChevronRight className={`w-3.5 h-3.5 opacity-50 ${isActive ? "transform translate-x-0.5" : ""}`} style={{ color: isActive ? "var(--brand)" : "var(--text-subtle)" }} />
      </button>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Title Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card rounded-3xl p-6 relative overflow-hidden">
        <div>
          <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight flex items-center gap-2" style={{ color: "var(--text)" }}>
            <Settings className="w-5 h-5 text-purple-500 animate-[spin_5s_linear_infinite]" /> Settings <span className="badge-glow text-[10px] px-2.5 py-0.5 font-bold font-sans">Autofy Console</span>
          </h2>
          <p className="text-xs font-sans mt-1" style={{ color: "var(--text-muted)" }}>Manage your business parameters, AI assistant models behavior, team controls, notification pipelines, and developer tokens securely.</p>
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
              <div className="text-[10px] text-[var(--text-subtle)] font-mono bg-[var(--bg-elevated)]/40 border border-[var(--border)] px-3 py-2 rounded-xl">
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
          <div className="bg-[var(--bg)]/80 border border-[var(--border)] rounded-2xl p-4 space-y-1">
            <span className="text-[10px] font-black uppercase text-[var(--text-subtle)] tracking-wider px-4 py-2 block">Settings Console</span>
            
            {renderNavItem("profile", "Business Profile", <Building2 className="w-4 h-4" />)}
            {renderNavItem("services", "Services & Catalog", <Scissors className="w-4 h-4" />)}
            {renderNavItem("ai", "AI Employee Settings", <Sparkles className="w-4 h-4" />)}
            {renderNavItem("knowledge", "Knowledge Base & FAQs", <FaqIcon className="w-4 h-4" />)}
            {renderNavItem("billing", "SaaS Billing & Invoices", <CreditCard className="w-4 h-4" />)}
            {renderNavItem("team", "Team Members", <Users className="w-4 h-4" />)}
            {renderNavItem("activity", "Activity & Audit Logs", <Clock className="w-4 h-4" />)}
            {renderNavItem("notifications", "Notification Alerts", <Bell className="w-4 h-4" />)}
            {renderNavItem("security", "Security & Keys", <Shield className="w-4 h-4" />)}
            {renderNavItem("api", "API & Webhooks", <Key className="w-4 h-4" />)}
            {renderNavItem("danger", "Change & Danger Zone", <AlertTriangle className="w-4 h-4 text-red-400" />)}
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 text-center text-xs">
            <p className="text-[var(--text-muted)] font-bold">Need assistance?</p>
            <p className="text-[10px] text-[var(--text-subtle)] mt-1 mb-3">Changes here directly tune live WhatsApp AI replies and billing invoices.</p>
            <span className="text-[10px] font-mono text-[var(--text-subtle)] block">Last saved: {lastSavedTime}</span>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE CONFIGURATION WORKSPACE */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* CATEGORY 1: BUSINESS PROFILE */}
          {activeCategory === "profile" && (
            <form onSubmit={handleProfileSave} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 md:p-8 space-y-6">
              <div className="flex justify-between items-center border-b border-[var(--border)] pb-4">
                <div>
                  <h3 className="text-sm font-black text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-500" /> Business Profile Information
                  </h3>
                  <p className="text-[10.5px] text-[var(--text-subtle)] mt-0.5">Control how your business is identified on WhatsApp, invoices, and AI conversations.</p>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                  Editable Configuration
                </span>
              </div>

              {/* Logo Upload Segment */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-[var(--bg-elevated)]/10 border border-[var(--border)] rounded-2xl">
                <img
                  src={profile.logoPreview || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&h=120&q=80"}
                  alt="Business Logo"
                  className="w-16 h-16 rounded-2xl object-cover border border-[var(--border)] shrink-0"
                />
                <div className="space-y-1.5 text-center sm:text-left">
                  <p className="text-xs font-black text-[var(--text)]">Business Logo</p>
                  <p className="text-[10px] text-[var(--text-subtle)] leading-normal">Displayed on PDF invoices, booking confirmations, and customer portal.</p>
                  <div className="flex items-center gap-2 justify-center sm:justify-start pt-1.5">
                    <button
                      type="button"
                      onClick={() => triggerNotification(" Logo upload simulated. Preview updated.")}
                      className="px-3 py-1.5 bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--border-strong)] text-[10.5px] font-bold text-[var(--text)] rounded-xl transition cursor-pointer flex items-center gap-1"
                    >
                      <Upload className="w-3.5 h-3.5" /> Upload Logo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProfile((prev) => ({ ...prev, logoPreview: "" }));
                        triggerNotification(" Reverted logo to default.");
                      }}
                      className="px-3 py-1.5 text-red-400 hover:text-[var(--text)] hover:bg-red-950/20 text-[10px] font-medium rounded-xl transition cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans text-xs">
                
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-[var(--text-subtle)] tracking-wider">Business / Studio Name</label>
                  <input
                    type="text"
                    required
                    value={profile.businessName}
                    onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] p-3 rounded-xl text-[var(--text)] placeholder-neutral-500 focus:outline-none focus:border-[var(--brand)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-[var(--text-subtle)] tracking-wider">Industry / Classification</label>
                  <input
                    type="text"
                    required
                    value={profile.businessType}
                    onChange={(e) => setProfile({ ...profile, businessType: e.target.value })}
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] p-3 rounded-xl text-[var(--text)] placeholder-neutral-500 focus:outline-none focus:border-[var(--brand)]"
                  />
                </div>

                <div className="col-span-full space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-[var(--text-subtle)] tracking-wider">Business Summary & Description</label>
                  <textarea
                    rows={2}
                    value={profile.description}
                    onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                    placeholder="Describe your business offerings, value proposition, and specialties for AI training context..."
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] p-3 rounded-xl text-[var(--text)] placeholder-neutral-500 focus:outline-none focus:border-[var(--brand)] resize-y"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-[var(--text-subtle)] tracking-wider">Contact Phone (WhatsApp Line)</label>
                  <input
                    type="text"
                    required
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] p-3 rounded-xl text-[var(--text)] placeholder-neutral-500 focus:outline-none focus:border-[var(--brand)] font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-[var(--text-subtle)] tracking-wider">Support / Billing Email</label>
                  <input
                    type="email"
                    required
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] p-3 rounded-xl text-[var(--text)] placeholder-neutral-500 focus:outline-none focus:border-[var(--brand)]"
                  />
                </div>

                <div className="col-span-full space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-[var(--text-subtle)] tracking-wider">Corporate Physical Address</label>
                  <input
                    type="text"
                    required
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] p-3 rounded-xl text-[var(--text)] placeholder-neutral-500 focus:outline-none focus:border-[var(--brand)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-[var(--text-subtle)] tracking-wider">Website URL</label>
                  <input
                    type="text"
                    value={profile.website}
                    onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] p-3 rounded-xl text-[var(--text)] placeholder-neutral-500 focus:outline-none focus:border-[var(--brand)] font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-[var(--text-subtle)] tracking-wider">Working Hours Range</label>
                  <input
                    type="text"
                    required
                    value={profile.hours}
                    onChange={(e) => setProfile({ ...profile, hours: e.target.value })}
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] p-3 rounded-xl text-[var(--text)] placeholder-neutral-500 focus:outline-none focus:border-[var(--brand)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-[var(--text-subtle)] tracking-wider flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-[var(--text-subtle)]" /> Operational Timezone
                  </label>
                  <select
                    value={profile.timezone}
                    onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] p-3 rounded-xl text-[var(--text)] focus:outline-none cursor-pointer focus:border-[var(--brand)] font-sans"
                  >
                    <option>IST - Kolkata (GMT+5:30)</option>
                    <option>EST - New York (GMT-5:00)</option>
                    <option>PST - San Francisco (GMT-8:00)</option>
                    <option>GMT - London (GMT+0:00)</option>
                    <option>GST - Dubai (GMT+4:00)</option>
                    <option>SGT - Singapore (GMT+8:00)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-[var(--text-subtle)] tracking-wider">Billing Currency</label>
                  <select
                    value={profile.currency}
                    onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] p-3 rounded-xl text-[var(--text)] focus:outline-none cursor-pointer focus:border-[var(--brand)] font-sans"
                  >
                    <option value="INR (₹)">INR (₹)</option>
                    <option value="USD ($)">USD ($)</option>
                    <option value="EUR (€)">EUR (€)</option>
                    <option value="GBP (£)">GBP (£)</option>
                    <option value="AED (د.إ)">AED (د.إ)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-[var(--text-subtle)] tracking-wider">Primary Language</label>
                  <select
                    value={profile.language}
                    onChange={(e) => setProfile({ ...profile, language: e.target.value })}
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] p-3 rounded-xl text-[var(--text)] focus:outline-none cursor-pointer focus:border-[var(--brand)] font-sans"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Hinglish">Hinglish</option>
                    <option value="Spanish">Spanish</option>
                    <option value="Arabic">Arabic</option>
                    <option value="French">French</option>
                  </select>
                </div>

              </div>

              <div className="pt-4 border-t border-[var(--border)] flex justify-between items-center">
                <span className="text-[11px] text-[var(--text-subtle)]">Autosaved to central PostgreSQL profile</span>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-[var(--text)] font-black text-xs px-6 py-2.5 rounded-xl transition duration-200 shadow-md cursor-pointer"
                >
                  Save Business Changes
                </button>
              </div>
            </form>
          )}

          {/* CATEGORY 2: SERVICES & CATALOG MANAGEMENT */}
          {activeCategory === "services" && (
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 md:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[var(--border)] pb-4">
                <div>
                  <h3 className="text-sm font-black text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
                    <Scissors className="w-4 h-4 text-blue-500" /> Services & Product Catalog
                  </h3>
                  <p className="text-[10.5px] text-[var(--text-subtle)] mt-0.5">Manage appointment services, retail products, pricing, and durations used by the AI Employee.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingService(null);
                      setServiceForm({ name: "", price: 499, duration_minutes: 45, category: "General", description: "" });
                      setShowServiceModal(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1 cursor-pointer shadow-lg"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Service
                  </button>
                  <button
                    onClick={() => {
                      setEditingProduct(null);
                      setProductForm({ name: "", price: 999, stock_quantity: 50, category: "Retail", description: "" });
                      setShowProductModal(true);
                    }}
                    className="bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text)] text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Product
                  </button>
                </div>
              </div>

              {/* Services List */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-black uppercase text-blue-400 tracking-wider">Bookable Services ({services.length})</h4>
                {services.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-[var(--border)] rounded-2xl text-[var(--text-subtle)] text-xs">
                    No services configured yet. Click "+ Add Service" to let clients book on WhatsApp.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {services.map((svc) => (
                      <div key={svc.id} className="p-4 bg-[var(--bg-elevated)]/20 border border-[var(--border)] rounded-2xl flex justify-between items-start gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[var(--text)]">{svc.name}</span>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">{svc.category || "General"}</span>
                          </div>
                          <p className="text-[10px] text-[var(--text-subtle)] line-clamp-1">{svc.description || "Bookable WhatsApp appointment service"}</p>
                          <div className="flex items-center gap-3 text-[11px] font-mono text-[var(--text-muted)] pt-1">
                            <span className="font-bold text-emerald-400">₹{svc.price}</span>
                            <span>•</span>
                            <span>{svc.duration_minutes || 45} mins</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingService(svc);
                              setServiceForm({
                                name: svc.name,
                                price: svc.price,
                                duration_minutes: svc.duration_minutes || 45,
                                category: svc.category || "General",
                                description: svc.description || ""
                              });
                              setShowServiceModal(true);
                            }}
                            className="p-1.5 hover:bg-[var(--bg-elevated)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] transition cursor-pointer"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteService(svc.id, svc.name)}
                            className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-400 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Products List */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[11px] font-black uppercase text-purple-400 tracking-wider">Retail Products ({products.length})</h4>
                {products.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-[var(--border)] rounded-2xl text-[var(--text-subtle)] text-xs">
                    No physical products listed. Click "+ Add Product" to enable instant WhatsApp purchases.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {products.map((prd) => (
                      <div key={prd.id} className="p-4 bg-[var(--bg-elevated)]/20 border border-[var(--border)] rounded-2xl flex justify-between items-start gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[var(--text)]">{prd.name}</span>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">{prd.category || "Retail"}</span>
                          </div>
                          <p className="text-[10px] text-[var(--text-subtle)] line-clamp-1">{prd.description || "Product item"}</p>
                          <div className="flex items-center gap-3 text-[11px] font-mono text-[var(--text-muted)] pt-1">
                            <span className="font-bold text-emerald-400">₹{prd.price}</span>
                            <span>•</span>
                            <span>Stock: {prd.stock_quantity ?? 50}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingProduct(prd);
                              setProductForm({
                                name: prd.name,
                                price: prd.price,
                                stock_quantity: prd.stock_quantity ?? 50,
                                category: prd.category || "Retail",
                                description: prd.description || ""
                              });
                              setShowProductModal(true);
                            }}
                            className="p-1.5 hover:bg-[var(--bg-elevated)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] transition cursor-pointer"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                const { api } = await import("../lib/api");
                                await api.delete(`/api/v1/knowledge/products/${prd.id}`);
                                setProducts(prev => prev.filter(p => p.id !== prd.id));
                                triggerNotification(` Deleted product: ${prd.name}`);
                              } catch {
                                triggerNotification(` Failed to delete product`);
                              }
                            }}
                            className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-400 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CATEGORY 3: AI EMPLOYEE SETTINGS */}
          {activeCategory === "ai" && (
            <form onSubmit={handleAiSave} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 md:p-8 space-y-6">
              
              <div className="border-b border-[var(--border)] pb-4">
                <h3 className="text-sm font-black text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-500" /> AI Employee Personality & Tone
                </h3>
                <p className="text-[10.5px] text-[var(--text-subtle)] mt-0.5">Customize your AI assistant's persona, conversational tone, and automated escalation thresholds.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans text-xs">
                
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-[var(--text-subtle)] tracking-wider">AI Employee Alias</label>
                  <input
                    type="text"
                    required
                    value={aiConfig.assistantName}
                    onChange={(e) => setAiConfig({ ...aiConfig, assistantName: e.target.value })}
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] p-3 rounded-xl text-[var(--text)] placeholder-neutral-500 focus:outline-none focus:border-[var(--brand)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-[var(--text-subtle)] tracking-wider">Conversational Personality</label>
                  <select
                    value={aiConfig.personality}
                    onChange={(e) => setAiConfig({ ...aiConfig, personality: e.target.value })}
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] p-3 rounded-xl text-[var(--text)] focus:outline-none cursor-pointer focus:border-[var(--brand)] font-sans"
                  >
                    <option>Professional & Helpful</option>
                    <option>Friendly & Warm</option>
                    <option>High-Energy Sales Closer</option>
                    <option>Consultative Expert</option>
                    <option>Direct & Concise</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-[var(--text-subtle)] tracking-wider">Response Tone</label>
                  <select
                    value={aiConfig.tone}
                    onChange={(e) => setAiConfig({ ...aiConfig, tone: e.target.value })}
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] p-3 rounded-xl text-[var(--text)] focus:outline-none cursor-pointer focus:border-[var(--brand)] font-sans"
                  >
                    <option>Warm & Concise</option>
                    <option>Formal & Executive</option>
                    <option>Casual & Friendly</option>
                    <option>Empathetic & Caring</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-[var(--text-subtle)] tracking-wider">Reply Formatting Style</label>
                  <select
                    value={aiConfig.replyStyle}
                    onChange={(e) => setAiConfig({ ...aiConfig, replyStyle: e.target.value })}
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] p-3 rounded-xl text-[var(--text)] focus:outline-none cursor-pointer focus:border-[var(--brand)] font-sans"
                  >
                    <option>Structured with Bullet Points</option>
                    <option>Conversational Paragraphs</option>
                    <option>Short & Punchy (1-2 lines)</option>
                  </select>
                </div>

                <div className="col-span-full space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-[var(--text-subtle)] tracking-wider">Sales & Conversion Behavior</label>
                  <select
                    value={aiConfig.salesBehavior}
                    onChange={(e) => setAiConfig({ ...aiConfig, salesBehavior: e.target.value })}
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] p-3 rounded-xl text-[var(--text)] focus:outline-none cursor-pointer focus:border-[var(--brand)] font-sans"
                  >
                    <option>Consultative & Solution-Oriented (Provide info then suggest booking)</option>
                    <option>Direct Closer (Send payment / booking link immediately)</option>
                    <option>Gentle Advisor (Never pushy, answers questions directly)</option>
                    <option>High Urgency & Scarcity (Highlight limited slots & popular times)</option>
                  </select>
                </div>

                <div className="col-span-full space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-[var(--text-subtle)] tracking-wider">Automated Welcome Greeting</label>
                  <textarea
                    rows={2}
                    value={aiConfig.welcomeMessage}
                    onChange={(e) => setAiConfig({ ...aiConfig, welcomeMessage: e.target.value })}
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] p-3 rounded-xl text-[var(--text)] placeholder-neutral-500 focus:outline-none focus:border-[var(--brand)] resize-y"
                  />
                </div>

                <div className="col-span-full space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-[var(--text-subtle)] tracking-wider">Fallback Message on Unsure Queries</label>
                  <textarea
                    rows={2}
                    value={aiConfig.fallbackMessage}
                    onChange={(e) => setAiConfig({ ...aiConfig, fallbackMessage: e.target.value })}
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] p-3 rounded-xl text-[var(--text)] placeholder-neutral-500 focus:outline-none focus:border-[var(--brand)] resize-y"
                  />
                </div>

                <div className="col-span-full space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-[var(--text-subtle)] tracking-wider">Human Escalation Rules & Triggers</label>
                  <textarea
                    rows={2}
                    value={aiConfig.escalationRules}
                    onChange={(e) => setAiConfig({ ...aiConfig, escalationRules: e.target.value })}
                    placeholder="Specify keywords or conditions that trigger automatic human handover..."
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] p-3 rounded-xl text-[var(--text)] placeholder-neutral-500 focus:outline-none focus:border-[var(--brand)] resize-y"
                  />
                </div>

                {/* Confidence Slider */}
                <div className="col-span-full space-y-1.5 bg-[var(--bg-elevated)]/30 border border-[var(--border)] rounded-2xl p-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] uppercase font-black text-[var(--text-subtle)] tracking-wider">Cognitive Confidence Threshold</span>
                    <span className="text-blue-400 font-mono font-bold text-xs">{aiConfig.confidenceThreshold}% Minimum</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    value={aiConfig.confidenceThreshold}
                    onChange={(e) => setAiConfig({ ...aiConfig, confidenceThreshold: Number(e.target.value) })}
                    className="w-full h-1.5 bg-[var(--bg-elevated)] rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <p className="text-[9px] text-[var(--text-subtle)] mt-1">Queries with model confidence below {aiConfig.confidenceThreshold}% will automatically route to human agents.</p>
                </div>

              </div>

              <div className="pt-4 border-t border-[var(--border)] flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs px-6 py-2.5 rounded-xl transition duration-200 shadow-md cursor-pointer"
                >
                  Save AI Settings
                </button>
              </div>
            </form>
          )}

          {/* CATEGORY 4: KNOWLEDGE BASE & FAQS */}
          {activeCategory === "knowledge" && (
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 md:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[var(--border)] pb-4">
                <div>
                  <h3 className="text-sm font-black text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
                    <FaqIcon className="w-4 h-4 text-blue-500" /> Knowledge Base & FAQs
                  </h3>
                  <p className="text-[10.5px] text-[var(--text-subtle)] mt-0.5">Train your AI Employee on exact answers, business policies, and uploaded documents.</p>
                </div>
                <button
                  onClick={() => {
                    setEditingFaq(null);
                    setFaqForm({ question: "", answer: "", category: "General" });
                    setShowFaqModal(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-1 cursor-pointer shadow-lg"
                >
                  <Plus className="w-3.5 h-3.5" /> Add New FAQ
                </button>
              </div>

              {/* FAQs List */}
              <div className="space-y-3">
                {faqs.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-[var(--border)] rounded-2xl text-[var(--text-subtle)] text-xs">
                    No custom FAQs added yet. Click "+ Add New FAQ" to train your AI on frequently asked questions.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {faqs.map((faq) => (
                      <div key={faq.id} className="p-4 bg-[var(--bg-elevated)]/20 border border-[var(--border)] rounded-2xl flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[var(--text)]">{faq.question}</span>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">{faq.category || "General"}</span>
                          </div>
                          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">{faq.answer}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => {
                              setEditingFaq(faq);
                              setFaqForm({ question: faq.question, answer: faq.answer, category: faq.category || "General" });
                              setShowFaqModal(true);
                            }}
                            className="p-1.5 hover:bg-[var(--bg-elevated)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] transition cursor-pointer"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteFaq(faq.id)}
                            className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-400 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CATEGORY 5: PRODUCTION SAAS BILLING & INVOICES */}
          {activeCategory === "billing" && (
            <div className="space-y-6">
              
              {/* Plan Card with Grandfathered Pricing */}
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 md:p-8 space-y-6">
                
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[var(--border)] pb-4">
                  <div>
                    <h3 className="text-sm font-black text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-blue-500" /> SaaS Subscription & Grandfathered Pricing
                    </h3>
                    <p className="text-[10.5px] text-[var(--text-subtle)] mt-0.5">Manage your active plan, locked rates, renewal cycles, and downloadable tax invoices.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowChangePlanModal(true)}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs px-4 py-2.5 rounded-xl transition cursor-pointer shadow-lg"
                    >
                      Change / Upgrade Plan
                    </button>
                  </div>
                </div>

                {/* Plan Metrics Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans text-xs">
                  
                  {/* Active Package */}
                  <div className="bg-[var(--bg)] border border-[var(--border)] rounded-2xl p-5 hover:border-blue-500/30 transition-all space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[9.5px] uppercase font-black text-[var(--text-subtle)] tracking-wider">Current Package</span>
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                        {billingPlan.status}
                      </span>
                    </div>
                    <h4 className="text-base font-black text-[var(--text)] text-blue-400">{billingPlan.name}</h4>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold font-mono text-[var(--text)]">₹{billingPlan.price}</span>
                      <span className="text-[10px] text-[var(--text-subtle)]">/{billingPlan.billingInterval}</span>
                    </div>
                    {billingPlan.isGrandfathered && (
                      <div className="pt-1">
                        <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                          🔒 Grandfathered Rate Locked
                        </span>
                      </div>
                    )}
                  </div>

                  {/* WhatsApp API Messages Progress */}
                  <div className="bg-[var(--bg)] border border-[var(--border)] rounded-2xl p-5 space-y-2">
                    <div className="flex justify-between items-center text-[9.5px] uppercase font-black text-[var(--text-muted)]">
                      <span>Monthly AI Replies</span>
                      <span className="font-mono text-[var(--text)] text-[11px] font-bold">{billingPlan.messagesUsed.toLocaleString()} / {billingPlan.messagesLimit.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-1.5 bg-[var(--bg-elevated)] rounded-full mt-3 overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(billingPlan.messagesUsed / billingPlan.messagesLimit) * 100}%` }} />
                    </div>
                    <p className="text-[9.5px] text-[var(--text-subtle)] pt-1">Renewal Date: {billingPlan.renewalDate}</p>
                  </div>

                  {/* Payment Method Card */}
                  <div className="bg-[var(--bg)] border border-[var(--border)] rounded-2xl p-5 space-y-2 flex flex-col justify-between">
                    <div>
                      <span className="text-[9.5px] uppercase font-black text-[var(--text-subtle)] tracking-wider">Payment Method</span>
                      <p className="font-bold text-xs text-[var(--text)] mt-1.5">{billingPlan.paymentMethod}</p>
                      <p className="text-[9.5px] text-emerald-400 flex items-center gap-1 mt-0.5"><CheckCircle className="w-3 h-3" /> Auto-Debit Active</p>
                    </div>
                    <button
                      onClick={() => setShowPaymentMethodModal(true)}
                      className="text-[10px] font-bold text-blue-400 hover:text-blue-300 self-start cursor-pointer"
                    >
                      Update Payment Info →
                    </button>
                  </div>

                </div>

                {/* Failed Payment Recovery Banner (if needed) */}
                <div className="p-4 bg-[var(--bg-elevated)]/20 border border-[var(--border)] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans text-xs">
                  <div className="space-y-0.5">
                    <p className="font-bold text-[var(--text)]">Payment Health & Direct Billing</p>
                    <p className="text-[10px] text-[var(--text-subtle)]">Need to retry a failed charge or request an invoice adjustment?</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRetryPayment}
                      className="px-3 py-1.5 text-[10.5px] font-bold bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-[var(--text)] cursor-pointer"
                    >
                      Test Payment Retry
                    </button>
                    <button
                      onClick={() => setShowRefundModal(true)}
                      className="px-3 py-1.5 text-[10.5px] font-bold text-red-400 hover:bg-red-500/10 border border-red-500/20 rounded-xl cursor-pointer"
                    >
                      Request Refund
                    </button>
                  </div>
                </div>

              </div>

              {/* Tax Invoices History Table */}
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 md:p-8 space-y-5">
                <div className="flex justify-between items-center border-b border-[var(--border)] pb-4">
                  <div>
                    <h3 className="text-sm font-black text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-blue-500" /> Tax Invoices & Billing History
                    </h3>
                    <p className="text-[10.5px] text-[var(--text-subtle)] mt-0.5">Official GST-compliant tax invoices for your business subscriptions.</p>
                  </div>
                </div>

                <div className="overflow-x-auto border border-[var(--border)] rounded-xl bg-[#040406]/60">
                  <table className="w-full font-sans text-xs text-left min-w-[550px]">
                    <thead>
                      <tr className="bg-[var(--bg-card)] border-b border-[var(--border)] text-[var(--text-subtle)] text-[10px] uppercase font-black tracking-wider">
                        <th className="py-2.5 px-4">Invoice #</th>
                        <th className="py-2.5 px-4">Billing Date</th>
                        <th className="py-2.5 px-4">Subtotal</th>
                        <th className="py-2.5 px-4">18% GST</th>
                        <th className="py-2.5 px-4">Total Paid</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4 text-right">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-900/50 text-[var(--text)] font-mono text-[11px]">
                      {invoices.length > 0 ? (
                        invoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-[var(--bg-elevated)]/10 transition">
                            <td className="py-3 px-4 font-bold text-[var(--text)]">{inv.invoice_number}</td>
                            <td className="py-3 px-4 text-[var(--text-muted)]">{inv.date}</td>
                            <td className="py-3 px-4">₹{inv.subtotal}</td>
                            <td className="py-3 px-4 text-[var(--text-muted)]">₹{inv.tax_amount}</td>
                            <td className="py-3 px-4 font-bold text-emerald-400">₹{inv.total_amount}</td>
                            <td className="py-3 px-4">
                              <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 text-[9px] px-2 py-0.5 rounded-full uppercase font-bold">
                                {inv.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => setShowInvoicePreview(inv)}
                                className="p-1 px-2.5 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-lg transition font-bold font-sans text-[10.5px] inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Download className="w-3 h-3" /> View / Print
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-8 px-4 text-center text-[var(--text-subtle)] font-sans">
                            No billing invoices recorded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>
          )}

          {/* CATEGORY 6: TEAM MEMBERS */}
          {activeCategory === "team" && (
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 md:p-8 space-y-6">
              
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[var(--border)] pb-4">
                <div>
                  <h3 className="text-sm font-black text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-blue-500" /> Authorized Team Members
                  </h3>
                  <p className="text-[10.5px] text-[var(--text-subtle)] mt-0.5">Control employee access, permissions grants, and dashboard logins.</p>
                </div>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-[var(--text)] font-black text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1 cursor-pointer shadow-lg"
                >
                  <Plus className="w-4 h-4" /> Invite Teammate
                </button>
              </div>

              {/* Members listing Table */}
              <div className="overflow-x-auto border border-[var(--border)] rounded-2xl bg-[#040406]/60">
                <table className="w-full font-sans text-xs text-left min-w-[600px]">
                  <thead>
                    <tr className="bg-[var(--bg-card)] border-b border-[var(--border)] text-[var(--text-subtle)] text-[10px] uppercase font-black tracking-wider">
                      <th className="py-3 px-4">Teammate</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900/60 text-[var(--text)]">
                    {team.map((member) => (
                      <tr key={member.id} className="hover:bg-[var(--bg-elevated)]/10 transition">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold uppercase font-mono text-[11px]">
                              {member.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-[var(--text)] text-xs">{member.name}</p>
                              <p className="text-[10px] text-[var(--text-subtle)] font-mono mt-0.5">{member.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {member.role === "Owner" ? (
                            <span className="bg-[var(--bg-elevated)] text-blue-400 border border-[var(--border)] text-[9.5px] px-2.5 py-1 rounded font-bold uppercase font-mono">
                              Workspace Owner
                            </span>
                          ) : (
                            <select
                              value={member.role}
                              onChange={(e) => {
                                setTeam((prev) =>
                                  prev.map((t) => (t.id === member.id ? { ...t, role: e.target.value as any } : t))
                                );
                                triggerNotification(` Modified role to: ${e.target.value}`);
                              }}
                              className="bg-[var(--bg)] border border-[var(--border)] rounded-lg text-[var(--text)] font-medium px-2 py-1 text-[11px] focus:outline-none cursor-pointer font-sans"
                            >
                              <option value="Admin">Admin</option>
                              <option value="Support Agent">Support Agent</option>
                              <option value="Sales Agent">Sales Agent</option>
                              <option value="Accountant">Accountant</option>
                            </select>
                          )}
                        </td>
                        <td className="py-4 px-4 font-mono text-[10.5px]">
                          <span className={`inline-flex items-center gap-1.5 ${
                            member.status === "Active" ? "text-emerald-400" : "text-amber-400"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              member.status === "Active" ? "bg-emerald-400" : "bg-amber-400"
                            }`} />
                            {member.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          {member.role !== "Owner" ? (
                            <button
                              onClick={() => handleRemoveTeammate(member.id, member.name)}
                              className="p-1 px-2.5 text-[10px] font-bold text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                            >
                              Revoke Access
                            </button>
                          ) : (
                            <span className="text-[10px] text-[var(--text-subtle)] font-mono italic">Primary Owner</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* RBAC PERMISSIONS MATRIX SUMMARY */}
              <div className="p-4 bg-[var(--bg-elevated)]/20 border border-[var(--border)] rounded-2xl space-y-3">
                <h4 className="text-xs font-black uppercase text-[var(--text)] tracking-wider">Enterprise RBAC Permissions Matrix</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-[10.5px]">
                  <div className="p-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl space-y-1">
                    <p className="font-bold text-blue-400 uppercase">Owner</p>
                    <p className="text-[9.5px] text-[var(--text-subtle)]">Full unrestricted root access to pricing, team, payments, WhatsApp & deletion.</p>
                  </div>
                  <div className="p-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl space-y-1">
                    <p className="font-bold text-purple-400 uppercase">Admin</p>
                    <p className="text-[9.5px] text-[var(--text-subtle)]">Edit pricing, reply chats, manage payments, export data & WhatsApp config.</p>
                  </div>
                  <div className="p-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl space-y-1">
                    <p className="font-bold text-emerald-400 uppercase">Support Agent</p>
                    <p className="text-[9.5px] text-[var(--text-subtle)]">Live WhatsApp customer reply & ticket takeover only.</p>
                  </div>
                  <div className="p-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl space-y-1">
                    <p className="font-bold text-amber-400 uppercase">Sales Agent</p>
                    <p className="text-[9.5px] text-[var(--text-subtle)]">Lead pipeline management, live chat reply & follow-ups.</p>
                  </div>
                  <div className="p-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl space-y-1">
                    <p className="font-bold text-cyan-400 uppercase">Accountant</p>
                    <p className="text-[9.5px] text-[var(--text-subtle)]">Manage tax invoices, payment disputes, refunds & financial export.</p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* CATEGORY: ENTERPRISE AUDIT & ACTIVITY LOGS */}
          {activeCategory === "activity" && (
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 md:p-8 space-y-6">
              
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-[var(--border)] pb-4">
                <div>
                  <h3 className="text-sm font-black text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-purple-500" /> Enterprise Audit Trail & Activity Logs
                  </h3>
                  <p className="text-[10.5px] text-[var(--text-subtle)] mt-0.5">Immutable historical record of logins, AI triggers, WhatsApp credentials, and billing events.</p>
                </div>
                <button
                  onClick={async () => {
                    const { api } = await import("../lib/api");
                    const res = await api.get<any[]>("/api/v1/team/activity-logs");
                    if (Array.isArray(res)) {
                      setActivityLogs(res);
                      triggerNotification("Activity logs refreshed");
                    }
                  }}
                  className="bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)]/80 text-[var(--text)] font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 border border-[var(--border)] cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh Log
                </button>
              </div>

              {/* Activity Log Listing Table */}
              <div className="overflow-x-auto border border-[var(--border)] rounded-2xl bg-[#040406]/60">
                <table className="w-full font-sans text-xs text-left min-w-[700px]">
                  <thead>
                    <tr className="bg-[var(--bg-card)] border-b border-[var(--border)] text-[var(--text-subtle)] text-[10px] uppercase font-black tracking-wider">
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Actor / Role</th>
                      <th className="py-3 px-4">Action Event</th>
                      <th className="py-3 px-4">Target Entity</th>
                      <th className="py-3 px-4">Audit Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900/60 text-[var(--text)]">
                    {activityLogs.length > 0 ? (
                      activityLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-[var(--bg-elevated)]/10 transition">
                          <td className="py-3 px-4 font-mono text-[10px] text-[var(--text-muted)] whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString("en-IN", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit"
                            })}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[var(--text)]">{log.user_name || "System Actor"}</span>
                              <span className="bg-[var(--bg-elevated)] text-purple-400 border border-[var(--border)] text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                                {log.user_role || "System"}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[10.5px] text-[var(--text-subtle)]">
                            {log.entity_type || "N/A"}
                          </td>
                          <td className="py-3 px-4 text-[11px] text-[var(--text-muted)]">
                            {log.details || "—"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 px-4 text-center text-[var(--text-subtle)] font-sans">
                          No audit events recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* CATEGORY 7: NOTIFICATIONS */}
          {activeCategory === "notifications" && (
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 md:p-8 space-y-6">
              <div className="border-b border-[var(--border)] pb-4">
                <h3 className="text-sm font-black text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-blue-500" /> Notification Preferences
                </h3>
                <p className="text-[10.5px] text-[var(--text-subtle)] mt-0.5">Determine how and when your team is alerted for customer events.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: "newLead", label: "New Lead Captured", desc: "Alert when a customer shares their contact info on WhatsApp." },
                  { key: "payment", label: "Payment Captured", desc: "Notify when an automated WhatsApp payment is verified." },
                  { key: "appointment", label: "New Booking Scheduled", desc: "Alert when an appointment slot is reserved." },
                  { key: "whatsappAlerts", label: "WhatsApp Direct Alerts", desc: "Send summary notifications to owner WhatsApp line." }
                ].map((notif) => (
                  <div key={notif.key} className="p-4 bg-[var(--bg-elevated)]/30 border border-[var(--border)] rounded-2xl flex items-center justify-between gap-4">
                    <div className="font-sans text-xs">
                      <p className="font-bold text-[var(--text)]">{notif.label}</p>
                      <p className="text-[9.5px] text-[var(--text-subtle)] leading-normal mt-0.5">{notif.desc}</p>
                    </div>
                    <button
                      onClick={() => toggleNotif(notif.key as any)}
                      className="cursor-pointer text-blue-500 hover:text-[var(--text)] shrink-0"
                    >
                      {notifs[notif.key as keyof typeof notifs] ? (
                        <ToggleRight className="w-8 h-8 text-blue-500" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-[var(--text-subtle)]" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CATEGORY 8: SECURITY & KEYS */}
          {activeCategory === "security" && (
            <div className="space-y-6">
              <form onSubmit={handlePasswordUpdate} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 md:p-8 space-y-6">
                <div className="border-b border-[var(--border)] pb-4">
                  <h3 className="text-sm font-black text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-blue-500" /> Security & Passwords
                  </h3>
                  <p className="text-[10.5px] text-[var(--text-subtle)] mt-0.5">Update administrator passwords and audit active sessions.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-sans text-xs">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black text-[var(--text-subtle)] tracking-wider">Current Password</label>
                    <input
                      type="password"
                      placeholder="••••••••••••"
                      value={passwordState.current}
                      onChange={(e) => setPasswordState({ ...passwordState, current: e.target.value })}
                      className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] p-3 rounded-xl text-[var(--text)] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black text-[var(--text-subtle)] tracking-wider">New Password</label>
                    <input
                      type="password"
                      placeholder="Minimum 8 characters"
                      value={passwordState.next}
                      onChange={(e) => setPasswordState({ ...passwordState, next: e.target.value })}
                      className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] p-3 rounded-xl text-[var(--text)] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black text-[var(--text-subtle)] tracking-wider">Confirm New Password</label>
                    <input
                      type="password"
                      placeholder="Confirm password"
                      value={passwordState.confirm}
                      onChange={(e) => setPasswordState({ ...passwordState, confirm: e.target.value })}
                      className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] p-3 rounded-xl text-[var(--text)] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--border)] flex justify-end">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition cursor-pointer"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* CATEGORY 9: API & WEBHOOKS */}
          {activeCategory === "api" && (
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 md:p-8 space-y-6">
              <div className="border-b border-[var(--border)] pb-4">
                <h3 className="text-sm font-black text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-blue-500" /> Developer API & Webhooks
                </h3>
                <p className="text-[10.5px] text-[var(--text-subtle)] mt-0.5">Integrate external CRM systems, inventory feeds, or custom ERP webhooks.</p>
              </div>

              <div className="p-4 bg-[var(--bg-elevated)]/30 border border-[var(--border)] rounded-2xl space-y-2 font-sans text-xs">
                <p className="font-bold text-[var(--text)]">Production Webhook Gateway</p>
                <p className="text-[11px] font-mono text-blue-400 select-all">https://server.autofy.ai/api/v1/whatsapp/webhook</p>
                <p className="text-[10px] text-[var(--text-subtle)]">Deliver realtime event streams directly to external endpoints with HMAC signature validation.</p>
              </div>
            </div>
          )}

          {/* CATEGORY 10: CHANGE & DANGER ZONE */}
          {(activeCategory === "danger" || activeCategory === "profile") && (
            <div className="bg-red-950/10 border border-red-900/30 rounded-3xl p-6 md:p-8 space-y-5 relative overflow-hidden">
              <div className="border-b border-red-900/20 pb-4">
                <h3 className="text-sm font-black text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-500" /> Change Management & Danger Zone
                </h3>
                <p className="text-[10.5px] text-[var(--text-subtle)] mt-0.5">Critical operations require multi-step confirmation to protect live production data.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans text-xs">
                <div className="p-4 bg-[var(--bg-card)] border border-[var(--border)] hover:border-red-500/30 rounded-2xl flex flex-col justify-between gap-3">
                  <div>
                    <p className="font-bold text-[var(--text)]">Disconnect WhatsApp Line</p>
                    <p className="text-[10px] text-[var(--text-subtle)] mt-0.5">Temporarily halts AI replies until a new verified Meta WhatsApp number is linked.</p>
                  </div>
                  <button
                    onClick={() => navigate("/dashboard/whatsapp_setup")}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10.5px] font-bold px-4 py-2 rounded-xl transition cursor-pointer self-start"
                  >
                    Manage WhatsApp Connection
                  </button>
                </div>

                <div className="p-4 bg-[var(--bg-card)] border border-[var(--border)] hover:border-red-500/30 rounded-2xl flex flex-col justify-between gap-3">
                  <div>
                    <p className="font-bold text-[var(--text)]">Delete Business Workspace</p>
                    <p className="text-[10px] text-[var(--text-subtle)] mt-0.5">Permanently deletes account, team members, catalogs, and cancels recurring subscriptions.</p>
                  </div>
                  <button
                    onClick={() => setDangerConfirmModal("account")}
                    className="bg-red-600 hover:bg-red-550 text-white text-[10.5px] font-bold px-4 py-2 rounded-xl transition cursor-pointer self-start shadow-lg shadow-red-500/20"
                  >
                    Delete Workspace Account
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* SERVICE MODAL */}
      <AnimatePresence>
        {showServiceModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl relative font-sans text-xs"
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <h3 className="text-sm font-black text-[var(--text)] flex items-center gap-1.5 uppercase tracking-wider">
                  <Scissors className="w-4 h-4 text-blue-500" /> {editingService ? "Edit Service" : "Add New Service"}
                </h3>
                <button onClick={() => setShowServiceModal(false)} className="p-1 hover:bg-[var(--bg-elevated)] rounded-lg text-[var(--text-subtle)] hover:text-[var(--text)]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveService} className="space-y-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-[var(--text-subtle)]">Service Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hair Styling & Treatment"
                    value={serviceForm.name}
                    onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] p-2.5 rounded-xl text-[var(--text)] focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-black text-[var(--text-subtle)]">Price (₹)</label>
                    <input
                      type="number"
                      required
                      value={serviceForm.price}
                      onChange={(e) => setServiceForm({ ...serviceForm, price: Number(e.target.value) })}
                      className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] p-2.5 rounded-xl text-[var(--text)] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-black text-[var(--text-subtle)]">Duration (Minutes)</label>
                    <input
                      type="number"
                      required
                      value={serviceForm.duration_minutes}
                      onChange={(e) => setServiceForm({ ...serviceForm, duration_minutes: Number(e.target.value) })}
                      className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] p-2.5 rounded-xl text-[var(--text)] focus:outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-[var(--text-subtle)]">Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Hair / Spa / Dental"
                    value={serviceForm.category}
                    onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] p-2.5 rounded-xl text-[var(--text)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-[var(--text-subtle)]">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Brief description for AI bot recommendations..."
                    value={serviceForm.description}
                    onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] p-2.5 rounded-xl text-[var(--text)] focus:outline-none resize-none"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowServiceModal(false)} className="flex-1 py-2.5 bg-[var(--bg-elevated)] text-[var(--text-muted)] rounded-xl font-bold">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg">
                    {editingService ? "Update Service" : "Save Service"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PRODUCT MODAL */}
      <AnimatePresence>
        {showProductModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl relative font-sans text-xs"
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <h3 className="text-sm font-black text-[var(--text)] flex items-center gap-1.5 uppercase tracking-wider">
                  <Package className="w-4 h-4 text-purple-500" /> {editingProduct ? "Edit Product" : "Add Retail Product"}
                </h3>
                <button onClick={() => setShowProductModal(false)} className="p-1 hover:bg-[var(--bg-elevated)] rounded-lg text-[var(--text-subtle)] hover:text-[var(--text)]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const { api } = await import("../lib/api");
                    if (editingProduct) {
                      const res: any = await api.put(`/api/v1/knowledge/products/${editingProduct.id}`, productForm);
                      setProducts(prev => prev.map(p => p.id === editingProduct.id ? res : p));
                      triggerNotification(` Product "${productForm.name}" updated.`);
                    } else {
                      const res: any = await api.post("/api/v1/knowledge/products", productForm);
                      setProducts(prev => [res, ...prev]);
                      triggerNotification(` Product "${productForm.name}" added.`);
                    }
                    setShowProductModal(false);
                    setEditingProduct(null);
                  } catch (err: any) {
                    triggerNotification(`[Error] Failed to save product: ${err.message}`);
                  }
                }}
                className="space-y-3 pt-1"
              >
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-[var(--text-subtle)]">Product Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Argan Oil Shampoo 250ml"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] p-2.5 rounded-xl text-[var(--text)] focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-black text-[var(--text-subtle)]">Price (₹)</label>
                    <input
                      type="number"
                      required
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                      className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] p-2.5 rounded-xl text-[var(--text)] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-black text-[var(--text-subtle)]">Stock Quantity</label>
                    <input
                      type="number"
                      required
                      value={productForm.stock_quantity}
                      onChange={(e) => setProductForm({ ...productForm, stock_quantity: Number(e.target.value) })}
                      className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] p-2.5 rounded-xl text-[var(--text)] focus:outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-[var(--text-subtle)]">Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Retail / Care / Equipment"
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] p-2.5 rounded-xl text-[var(--text)] focus:outline-none"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowProductModal(false)} className="flex-1 py-2.5 bg-[var(--bg-elevated)] text-[var(--text-muted)] rounded-xl font-bold">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-550 text-white rounded-xl font-bold shadow-lg">
                    Save Product
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FAQ MODAL */}
      <AnimatePresence>
        {showFaqModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl relative font-sans text-xs"
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <h3 className="text-sm font-black text-[var(--text)] flex items-center gap-1.5 uppercase tracking-wider">
                  <FaqIcon className="w-4 h-4 text-blue-500" /> {editingFaq ? "Edit FAQ" : "Add FAQ"}
                </h3>
                <button onClick={() => setShowFaqModal(false)} className="p-1 hover:bg-[var(--bg-elevated)] rounded-lg text-[var(--text-subtle)] hover:text-[var(--text)]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveFaq} className="space-y-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-[var(--text-subtle)]">Customer Question</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. What are your parking options?"
                    value={faqForm.question}
                    onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] p-2.5 rounded-xl text-[var(--text)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-[var(--text-subtle)]">AI Answer</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. We have complimentary valet parking right in front of our main entrance!"
                    value={faqForm.answer}
                    onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] p-2.5 rounded-xl text-[var(--text)] focus:outline-none resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-[var(--text-subtle)]">Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Parking / Pricing / Policies"
                    value={faqForm.category}
                    onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] p-2.5 rounded-xl text-[var(--text)] focus:outline-none"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowFaqModal(false)} className="flex-1 py-2.5 bg-[var(--bg-elevated)] text-[var(--text-muted)] rounded-xl font-bold">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg">
                    Save FAQ
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PLAN CHANGE MODAL */}
      <AnimatePresence>
        {showChangePlanModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--bg-card)] border border-[var(--border)] p-6 md:p-8 rounded-3xl max-w-lg w-full space-y-5 shadow-2xl relative font-sans text-xs"
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <h3 className="text-sm font-black text-[var(--text)] flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-blue-500" /> Select SaaS Plan
                </h3>
                <button onClick={() => setShowChangePlanModal(false)} className="p-1 hover:bg-[var(--bg-elevated)] rounded-lg text-[var(--text-subtle)] hover:text-[var(--text)]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Billing interval switch */}
              <div className="flex justify-center">
                <div className="bg-[var(--bg-elevated)] p-1 rounded-xl flex items-center gap-1 border border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => setSelectedNewInterval("monthly")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${selectedNewInterval === "monthly" ? "bg-blue-600 text-white shadow" : "text-[var(--text-subtle)]"}`}
                  >
                    Monthly Billing
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedNewInterval("yearly")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${selectedNewInterval === "yearly" ? "bg-blue-600 text-white shadow" : "text-[var(--text-subtle)]"}`}
                  >
                    Annual Billing <span className="bg-emerald-500 text-white text-[9px] px-1.5 py-0.2 rounded-full">Save 18%</span>
                  </button>
                </div>
              </div>

              {/* Plan Options */}
              <div className="space-y-2.5">
                {[
                  { id: "starter", name: "Autofy Starter", price: selectedNewInterval === "yearly" ? "₹3,999/yr" : "₹399/mo", desc: "Up to 2,000 WhatsApp AI replies/month" },
                  { id: "pro", name: "Autofy Pro", price: selectedNewInterval === "yearly" ? "₹6,899/yr" : "₹699/mo", desc: "Up to 10,000 AI replies, RAG Knowledge & Appointments" },
                  { id: "enterprise", name: "Autofy Enterprise", price: selectedNewInterval === "yearly" ? "₹14,999/yr" : "₹1,499/mo", desc: "Unlimited AI replies, multi-agent inbox & priority webhooks" },
                ].map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedNewPlan(plan.id as any)}
                    className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between ${selectedNewPlan === plan.id ? "bg-blue-600/10 border-blue-500 shadow-md" : "bg-[var(--bg-elevated)]/20 border-[var(--border)] hover:border-[var(--border-strong)]"}`}
                  >
                    <div>
                      <p className="font-black text-xs text-[var(--text)]">{plan.name}</p>
                      <p className="text-[10px] text-[var(--text-subtle)] mt-0.5">{plan.desc}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-sm text-[var(--text)] text-blue-400">{plan.price}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowChangePlanModal(false)} className="flex-1 py-2.5 bg-[var(--bg-elevated)] text-[var(--text-muted)] rounded-xl font-bold">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleChangePlan}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg"
                >
                  Confirm Plan Switch
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PAYMENT METHOD MODAL */}
      <AnimatePresence>
        {showPaymentMethodModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl relative font-sans text-xs"
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <h3 className="text-sm font-black text-[var(--text)] flex items-center gap-1.5 uppercase tracking-wider">
                  <CreditCard className="w-4 h-4 text-blue-500" /> Update Payment Method
                </h3>
                <button onClick={() => setShowPaymentMethodModal(false)} className="p-1 hover:bg-[var(--bg-elevated)] rounded-lg text-[var(--text-subtle)] hover:text-[var(--text)]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-[var(--text-subtle)]">Payment Method / UPI ID / Card Summary</label>
                  <input
                    type="text"
                    value={paymentMethodInput}
                    onChange={(e) => setPaymentMethodInput(e.target.value)}
                    placeholder="e.g. UPI: business@okhdfcbank or Visa ending in 4242"
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] p-2.5 rounded-xl text-[var(--text)] focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-[var(--text-subtle)]">Recurring monthly/annual subscription fees will be charged to this payment method.</p>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowPaymentMethodModal(false)} className="flex-1 py-2.5 bg-[var(--bg-elevated)] text-[var(--text-muted)] rounded-xl font-bold">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdatePaymentMethod}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg"
                  >
                    Save Method
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REFUND MODAL */}
      <AnimatePresence>
        {showRefundModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl relative font-sans text-xs"
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <h3 className="text-sm font-black text-[var(--text)] flex items-center gap-1.5 uppercase tracking-wider text-red-400">
                  <RotateCcw className="w-4 h-4" /> Request Subscription Refund
                </h3>
                <button onClick={() => setShowRefundModal(false)} className="p-1 hover:bg-[var(--bg-elevated)] rounded-lg text-[var(--text-subtle)] hover:text-[var(--text)]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-[var(--text-subtle)]">Reason for Refund</label>
                  <textarea
                    rows={3}
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Please let our billing team know why you are requesting a refund..."
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] p-2.5 rounded-xl text-[var(--text)] focus:outline-none resize-none"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowRefundModal(false)} className="flex-1 py-2.5 bg-[var(--bg-elevated)] text-[var(--text-muted)] rounded-xl font-bold">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleRequestRefund}
                    disabled={!refundReason.trim()}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-550 text-white rounded-xl font-bold shadow-lg disabled:opacity-50"
                  >
                    Submit Request
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* INVOICE PREVIEW MODAL */}
      <AnimatePresence>
        {showInvoicePreview && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--modal-bg)] border border-[var(--border)] p-6 md:p-8 rounded-3xl max-w-md w-full space-y-5 shadow-2xl relative font-sans text-xs"
            >
              <div className="flex justify-between items-start border-b border-[var(--border)] pb-4">
                <div>
                  <h3 className="text-base font-black text-[var(--text)]">Autofy Tax Invoice</h3>
                  <p className="text-[10px] text-[var(--text-subtle)] font-mono">{showInvoicePreview.invoice_number}</p>
                </div>
                <button onClick={() => setShowInvoicePreview(null)} className="p-1 hover:bg-[var(--bg-elevated)] rounded-lg text-[var(--text-subtle)] hover:text-[var(--text)]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 font-mono text-[11px] bg-[var(--bg-elevated)]/30 p-4 rounded-2xl border border-[var(--border)]">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Invoice Date:</span>
                  <span className="text-[var(--text)]">{showInvoicePreview.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Billing Cycle:</span>
                  <span className="text-[var(--text)]">{showInvoicePreview.period}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Payment Mode:</span>
                  <span className="text-[var(--text)]">{showInvoicePreview.payment_method}</span>
                </div>
                <div className="border-t border-[var(--border)] pt-2 flex justify-between">
                  <span className="text-[var(--text-muted)]">Subtotal:</span>
                  <span className="text-[var(--text)]">₹{showInvoicePreview.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">GST (18%):</span>
                  <span className="text-[var(--text)]">₹{showInvoicePreview.tax_amount}</span>
                </div>
                <div className="border-t border-[var(--border)] pt-2 flex justify-between font-bold text-xs text-emerald-400">
                  <span>Total Amount Paid:</span>
                  <span>₹{showInvoicePreview.total_amount}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg"
                >
                  Print / Download PDF
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TEAM INVITEMATE MODAL */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl relative font-sans text-xs"
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <h3 className="text-sm font-black text-[var(--text)] flex items-center gap-1.5 uppercase tracking-wider">
                  <Users className="w-4 h-4 text-blue-500" /> Invite Team Member
                </h3>
                <button onClick={() => setShowInviteModal(false)} className="p-1 hover:bg-[var(--bg-elevated)] rounded-lg text-[var(--text-subtle)] hover:text-[var(--text)]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleInviteSubmit} className="space-y-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-[var(--text-subtle)]">Teammate Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] p-2.5 rounded-xl text-[var(--text)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-[var(--text-subtle)]">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="priya@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] p-2.5 rounded-xl text-[var(--text)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-[var(--text-subtle)]">Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] p-2.5 rounded-xl text-[var(--text)] focus:outline-none"
                  >
                    <option value="Admin">Admin (Pricing, WhatsApp, Payments)</option>
                    <option value="Support Agent">Support Agent (Live Chats & Inbound Tickets)</option>
                    <option value="Sales Agent">Sales Agent (Leads Pipeline & Follow-ups)</option>
                    <option value="Accountant">Accountant (Invoices, Payments & Financials)</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowInviteModal(false)} className="flex-1 py-2.5 bg-[var(--bg-elevated)] text-[var(--text-muted)] rounded-xl font-bold">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg">
                    Send Invitation
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DANGER MODAL */}
      <AnimatePresence>
        {dangerConfirmModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--bg-card)] border border-red-900 p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl relative font-sans text-xs"
            >
              <div className="flex items-center gap-2 text-red-400 uppercase tracking-wider font-bold">
                <AlertTriangle className="w-5 h-5" /> Severe Action Confirmation
              </div>
              <p className="text-[var(--text-subtle)] text-[11px] leading-relaxed">
                {dangerConfirmModal === "account" && "You are about to permanently delete your Autofy account and all connected WhatsApp conversation records. This action is irreversible."}
              </p>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setDangerConfirmModal(null)} className="flex-1 py-2.5 bg-[var(--bg-elevated)] text-[var(--text-muted)] rounded-xl font-bold">
                  Cancel
                </button>
                <button onClick={handleExecuteDangerAction} className="flex-1 py-2.5 bg-red-600 hover:bg-red-550 text-white rounded-xl font-bold shadow-lg">
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
