import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Sun, Moon, LayoutDashboard, X, Bot, Menu } from "lucide-react";
import { Logo } from "./Logo";
import { useTheme } from "../context/ThemeContext";
import { registerBackHandler } from "../lib/native";
import { api } from "../lib/api";
import { isAuthenticated } from "../lib/auth";
import { DEMO_DASHBOARD_DATA, DashboardSummaryResponse } from "../data/demoDashboard";
import {
  MessageSquare,
  Users,
  Calendar,
  DollarSign,
  Activity,
  Sparkles,
  Phone,
  ArrowRight,
  Shield,
  Zap,
  Settings,
  Database,
  LogOut,
  RefreshCw,
  Globe,
  MapPin,
  Check,
  Send,
  User,
  Sliders,
  AlertCircle,
  Search,
  Bell,
  CheckCircle,
  Plus,
  TrendingDown,
  TrendingUp,
  SlidersHorizontal,
  CloudLightning,
  HelpCircle,
  FileText,
  MousePointerClick,
  QrCode,
  Link,
  ChevronRight,
  Sparkle,
  CreditCard,
  Package,
  ShoppingBag,
  Brain,
  Megaphone,
  LifeBuoy,
  Smartphone,
  Power
} from "lucide-react";
import { OnboardingData } from "../types";
import { ConversationsTab } from "./ConversationsTab";
import { KnowledgeBaseTab } from "./KnowledgeBaseTab";
import { InventoryTab } from "./InventoryTab";
import { OrdersTab } from "./OrdersTab";
import { LeadsTab } from "./LeadsTab";
import { PaymentsTab } from "./PaymentsTab";
import { AnalyticsTab } from "./AnalyticsTab";
import { IntegrationsTab } from "./IntegrationsTab";
import { SettingsTab } from "./SettingsTab";
import { BusinessSetupTab } from "./BusinessSetupTab";
import { MembershipPlansTab } from "./MembershipPlansTab";
import { FaqManagementTab } from "./FaqManagementTab";
import { WhatsAppSetupTab } from "./WhatsAppSetupTab";
import { AppointmentsTab } from "./AppointmentsTab";
import { AiPlaygroundTab } from "./AiPlaygroundTab";
import { CustomerPortalTab } from "./CustomerPortalTab";
import { SuperAdminDashboardTab } from "./SuperAdminDashboardTab";
import { NotificationsCenterTab } from "./NotificationsCenterTab";
import { DeploymentSetupTab } from "./DeploymentSetupTab";
import { AITrainingCenterTab } from "./AITrainingCenterTab";
import { CRMTab } from "./CRMTab";
import { MarketingAutomationTab } from "./MarketingAutomationTab";
import { SupportTicketsTab } from "./SupportTicketsTab";
import { MobileAuditTab } from "./MobileAuditTab";
import { OwnerControlCenter } from "./OwnerControlCenter";
import { SubscriptionTab } from "./SubscriptionTab";

const TAB_TITLES: Record<string, string> = {
  overview: "Overview",
  conversations: "Inbox (Chats)",
  leads: "Leads",
  appointments: "Appointments",
  ai_training: "AI Training",
  kb: "Knowledge Base",
  whatsapp_setup: "WhatsApp Setup",
  marketing: "Automations",
  ai_playground: "AI Playground",
  crm: "CRM System",
  orders: "Sales & Orders",
  inventory: "Products & Inventory",
  payments: "Payments & Billing",
  subscription: "Subscription & Plans",
  analytics: "Analytics & Growth",
  business_setup: "Business Setup",
  owner_center: "Owner Control Center",
  settings: "Settings",
};

interface DashboardProps {
  onboardingData: OnboardingData;
  activeTab: "overview" | "leads" | "simulator";
  onLogout: () => void;
  onOpenTestSimulator: () => void;
  setActiveTab: (tab: "overview" | "leads" | "simulator") => void;
}

// Sub-models
interface MockConversation {
  id: string;
  name: string;
  phone: string;
  lastMessage: string;
  time: string;
  status: "Replied" | "Waiting" | "Escalated";
  unread: boolean;
  history: Array<{ sender: "user" | "bot"; text: string; time: string }>;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onboardingData,
  activeTab,
  onLogout,
  onOpenTestSimulator,
  setActiveTab
}) => {
  // Sync the onboarding state
  const [data, setData] = useState<OnboardingData>(onboardingData);
  const { theme, toggleTheme } = useTheme();

  // States for shared knowledge items — initialized empty, populated by sub-components or backend
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [membershipPlans, setMembershipPlans] = useState<any[]>([]);
  const [faqsList, setFaqsList] = useState<any[]>([]);

  const [policies, setPolicies] = useState<any>({
    refund: "",
    cancellation: "",
    hours: "",
    delivery: "",
    shipping: ""
  });

  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);

  // Dashboard state to push alerts
  const [dashboardAlert, setDashboardAlert] = useState<string | null>(null);

  // Global AI Auto-Reply state (loaded from backend)
  const [globalAiEnabled, setGlobalAiEnabled] = useState(true);
  const [aiKillConfirmOpen, setAiKillConfirmOpen] = useState(false);
  const [aiToggleLoading, setAiToggleLoading] = useState(false);

  const triggerDashboardNotification = (txt: string) => {
    setDashboardAlert(txt);
    setTimeout(() => {
      setDashboardAlert(null);
    }, 4000);
  };

  // Conversations — loaded from backend, starts empty
  const [conversations, setConversations] = useState<any[]>([]);

  // Lead Pipeline — loaded from backend, starts empty
  const [leads, setLeads] = useState<any[]>([]);

  // Appointments — loaded from backend via AppointmentsTab, starts empty
  const [appointments, setAppointments] = useState<any[]>([]);

  // Tab routing
  const navigate = useNavigate();
  const location = useLocation();
  const currentTab = location.pathname.split("/")[2] || "overview";
  
  // Mobile sidebar drawer state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Loading & Summary API State
  const [isTabLoading, setIsTabLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<DashboardSummaryResponse | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [subStatus, setSubStatus] = useState<any>(null);

  // Lock body & html scrolling so ONLY the dashboard content viewport scrolls
  useEffect(() => {
    const origHtmlOverflow = document.documentElement.style.overflow;
    const origBodyOverflow = document.body.style.overflow;
    const origHtmlHeight = document.documentElement.style.height;
    const origBodyHeight = document.body.style.height;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.documentElement.style.height = "100%";
    document.body.style.height = "100%";

    return () => {
      document.documentElement.style.overflow = origHtmlOverflow;
      document.body.style.overflow = origBodyOverflow;
      document.documentElement.style.height = origHtmlHeight;
      document.body.style.height = origBodyHeight;
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated()) {
      api.get("/api/v1/subscriptions/status")
        .then(res => setSubStatus(res))
        .catch(() => {});
      // Load AI auto-reply state
      api.get("/api/v1/business/profile")
        .then((res: any) => {
          if (res?.ai_auto_reply_enabled !== undefined) {
            setGlobalAiEnabled(res.ai_auto_reply_enabled);
          }
        })
        .catch(() => {});
    }
  }, []);

  const fetchDashboardSummary = async () => {
    setIsTabLoading(true);
    setSummaryError(null);
    try {
      if (isAuthenticated()) {
        const res = await api.get<DashboardSummaryResponse>("/api/v1/business/dashboard-summary");
        setSummaryData(res);
      } else {
        setSummaryData(DEMO_DASHBOARD_DATA);
      }
    } catch (err: any) {
      if (isAuthenticated()) {
        setSummaryError("Unable to load live business data. Please check network connection.");
      } else {
        setSummaryData(DEMO_DASHBOARD_DATA);
      }
    } finally {
      setIsTabLoading(false);
    }
  };

  useEffect(() => {
    if (currentTab === "overview") {
      fetchDashboardSummary();
    } else {
      setIsTabLoading(true);
      const t = setTimeout(() => setIsTabLoading(false), 400);
      return () => clearTimeout(t);
    }
  }, [currentTab]);

  // Handle hardware back button on mobile: close sidebar drawer if open, or return to overview tab before exiting app
  useEffect(() => {
    const unregister = registerBackHandler(() => {
      if (isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false);
        return true;
      }
      if (currentTab !== "overview") {
        navigate("/dashboard");
        return true;
      }
      return false; // Let default back handler / app exit handle it
    });
    return unregister;
  }, [isMobileSidebarOpen, currentTab, navigate]);

  // Statistics counters
  const [leadsCount, setLeadsCount] = useState(0);
  const [convsCount, setConvsCount] = useState(0);
  const [apptsCount, setApptsCount] = useState(0);
  const [revCount, setRevCount] = useState(0);

  useEffect(() => {
    if (isTabLoading || currentTab !== "overview" || !summaryData) return;
    
    // reset counts to 0
    setLeadsCount(0);
    setConvsCount(0);
    setApptsCount(0);
    setRevCount(0);

    const targetLeads = summaryData.metrics.active_leads || 0;
    const targetConvs = summaryData.metrics.whatsapp_chats || 0;
    const targetAppts = summaryData.metrics.appointments || 0;
    const targetRev = summaryData.metrics.revenue || 0;

    let leadStep = 0;
    let convStep = 0;
    let apptStep = 0;
    let revStep = 0;

    const interval = setInterval(() => {
      leadStep = leadStep < targetLeads ? leadStep + 1 : targetLeads;
      convStep = convStep < targetConvs ? convStep + 1 : targetConvs;
      apptStep = apptStep < targetAppts ? apptStep + 1 : targetAppts;
      
      const rStep = Math.max(1, Math.ceil((targetRev - revStep) / 10));
      revStep = revStep < targetRev ? Math.min(targetRev, revStep + rStep) : targetRev;

      setLeadsCount(leadStep);
      setConvsCount(convStep);
      setApptsCount(apptStep);
      setRevCount(revStep);

      if (leadStep === targetLeads && convStep === targetConvs && apptStep === targetAppts && revStep === targetRev) {
        clearInterval(interval);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [isTabLoading, currentTab, summaryData]);

  
  // Simulation Toggles: If emptyMode is true, render the Empty State Design checklist.
  const [emptyMode, setEmptyMode] = useState<boolean>(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);
  
  // Custom Dynamic Actions State (mock database uploads)
  const [extraServices, setExtraServices] = useState<string[]>([]);
  const [extraFAQs, setExtraFAQs] = useState<Array<{ q: string; a: string }>>([]);
  const [extraPlans, setExtraPlans] = useState<string[]>([]);
  const [paymentLinks, setPaymentLinks] = useState<Array<{ desc: string; amt: string; url: string }>>([]);

  // Modals Controller
  const [activeModal, setActiveModal] = useState<"service" | "faq" | "membership" | "whatsapp" | "payment" | null>(null);
  
  // Interactive Modal Fields
  const [newServiceName, setNewServiceName] = useState("");
  const [newFAQQuestion, setNewFAQQuestion] = useState("");
  const [newFAQAnswer, setNewFAQAnswer] = useState("");
  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanCost, setNewPlanCost] = useState("₹1,999/month");
  const [newPayDesc, setNewPayDesc] = useState("");
  const [newPayAmount, setNewPayAmount] = useState("");

  // Search results highlighted or generic logs refreshed
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleTabChange = (tabId: string) => {
    if (tabId === "overview") {
      navigate("/dashboard");
    } else {
      navigate(`/dashboard/${tabId}`);
    }
  };

  const [selectedChatId, setSelectedChatId] = useState<string>("");
  const [chatInput, setChatInput] = useState("");
  const [isBotResponding, setIsBotResponding] = useState(false);

  // Active conversations state lookup
  const activeChat = conversations.find(c => c.id === selectedChatId) || conversations[0] || null;

  // Activity feed — populated by real events, starts empty
  const [activityFeed, setActivityFeed] = useState<any[]>([]);

  // Notifications bell toggle
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const [userProfile, setUserProfile] = useState<{ name: string; email: string; businessName: string; role: string } | null>(null);

  useEffect(() => {
    api.get<any>("/api/v1/auth/me").then((res) => {
      if (res) {
        setUserProfile({
          name: res.name || "",
          email: res.email || "",
          businessName: res.business?.name || "",
          role: res.role || "Owner",
        });
      }
    }).catch(() => { /* fallback */ });
  }, []);

  const handleRefreshData = () => {
    setIsRefreshing(true);
    fetchDashboardSummary().finally(() => {
      setIsRefreshing(false);
    });
  };

  // BOT REPLY SCRIPTING ENGINE (Reads actual user knowledge text inputted in onboarding wizard!)
  const queryKnowledgeBase = (text: string): string => {
    const query = text.toLowerCase();
    const servicesStr = data.knowledgeText.services || "";
    const pricingStr = data.knowledgeText.pricing || "";
    const faqStr = data.knowledgeText.faqs || "";
    const membershipStr = data.knowledgeText.memberships || "";
    const policiesStr = data.knowledgeText.policies || "";

    // 1. Extra Services Check
    if (extraServices.length > 0 && (query.includes("service") || query.includes("offer") || query.includes("do you do"))) {
      return `We deliver the following solutions: ${extraServices.join(", ")}. ${servicesStr ? `Additionally, ${servicesStr}` : "Let me know what you would like to book!"}`;
    }

    // 2. Extra FAQ Check
    for (const faq of extraFAQs) {
      if (query.includes(faq.q.toLowerCase())) {
        return faq.a;
      }
    }

    // 3. Regular checks
    if (query.includes("service") || query.includes("offer") || query.includes("do you do") || query.includes("classes") || query.includes("work")) {
      return servicesStr.trim() 
        ? `We provide elite customized services: ${servicesStr}. What specific aspect can we book for you?`
        : `We offer premium ${data.industryType || "consulted"} options customized to your business goals. Connect with our supervisor for more bespoke rate cards!`;
    }

    if (query.includes("price") || query.includes("cost") || query.includes("fee") || query.includes("charge") || query.includes("how much") || query.includes("package")) {
      return pricingStr.trim()
        ? `Here is our pricing structure: ${pricingStr}`
        : `Our starting pricing plans are highly competitive and tailored around customer scale. What is your average volume?`;
    }

    if (query.includes("faq") || query.includes("parking") || query.includes("timing") || query.includes("hour") || query.includes("open") || query.includes("address")) {
      return faqStr.trim()
        ? `Answers to popular queries:\n${faqStr}`
        : `We are conveniently situated at ${data.address || "our central HQ"}. Our doors are open Monday through Saturday during corporate hours.`;
    }

    if (query.includes("membership") || query.includes("join") || query.includes("plan") || query.includes("subs")) {
      const allPlans = [...extraPlans, "Standard Quarterly Plan", "VIP Annual Pass"];
      return membershipStr.trim()
        ? `We support active plans: ${membershipStr}. ${extraPlans.length > 0 ? `Also configured: ${extraPlans.join(", ")}` : ""}`
        : `Choose from our popular plans: ${allPlans.join(" or ")}. All plans feature unlimited automated concierge support!`;
    }

    if (query.includes("policy") || query.includes("cancel") || query.includes("refund") || query.includes("return")) {
      return policiesStr.trim()
        ? `Our corporate policy states: ${policiesStr}`
        : `Flexible policies apply. Standard bookings can be easily cancelled or rescheduled up to 24 hours prior with zero fees.`;
    }

    if (query.includes("book") || query.includes("appointment") || query.includes("reserve") || query.includes("slot") || query.includes("schedule")) {
      return `Sure thing! Let me calendar that under "${data.businessName || "our system"}". Please feed me your favorite day, time and phone number to lock it in.`;
    }

    if (query.includes("pay") || query.includes("razorpay") || query.includes("upi") || query.includes("payment")) {
      if (data.paymentMethod === "upi") {
        return `We accept instantaneous UPI payments. Simply scan and transfer to our authorized UPI handle: **${data.upiId || "upi@autofy"}** to lock registration.`;
      }
      if (data.paymentMethod === "razorpay") {
        return `I am generating a hyper-secure Razorpay checkout link for you right now which processes cards, netbanking, and wallets instantly.`;
      }
      if (data.paymentMethod === "phonepe") {
        return `We utilize PhonePe Merchant gateway. An invoice link with integrated QR code is preparing for your layout.`;
      }
      return `We collect payments via secure system channels. Let me confirm with accounting to wire your invoice link!`;
    }

    return `Got it! I am running that query against our Autofy local memory block. Let me verify the details for "${data.businessName}". Is there anything more I can search regarding our services or pricing?`;
  };

  // Handle active conversation message send
  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatInput("");

    // Update active conversation history
    setConversations(prev => prev.map(chat => {
      if (chat.id === selectedChatId) {
        return {
          ...chat,
          lastMessage: userText,
          unread: false,
          history: [...chat.history, { sender: "user", text: userText, time: "Just Now" }]
        };
      }
      return chat;
    }));

    setIsBotResponding(true);

    // Simulate natural AI thinking delay
    setTimeout(() => {
      const responseText = queryKnowledgeBase(userText);
      setConversations(prev => prev.map(chat => {
        if (chat.id === selectedChatId) {
          return {
            ...chat,
            lastMessage: responseText,
            status: "Replied" as const,
            history: [...chat.history, { sender: "bot", text: responseText, time: "Just Now" }]
          };
        }
        return chat;
      }));

      // Add to running activity feed list
      setActivityFeed(prev => [
        {
          id: Date.now(),
          type: "response",
          text: `AI answered ${activeChat.name} on WhatsApp: "${responseText.substring(0, 45)}..."`,
          time: "Just Now"
        },
        ...prev
      ]);

      setIsBotResponding(false);
    }, 900);
  };

  // Modals Submit handlers
  const handleAddServiceSubmit = () => {
    if (!newServiceName.trim()) return;
    setExtraServices(prev => [...prev, newServiceName]);
    setActivityFeed(prev => [
      { id: Date.now(), type: "kb", text: `Custom service added: "${newServiceName}"`, time: "Just Now" },
      ...prev
    ]);
    setNewServiceName("");
    setActiveModal(null);
  };

  const handleAddFAQSubmit = () => {
    if (!newFAQQuestion.trim() || !newFAQAnswer.trim()) return;
    setExtraFAQs(prev => [...prev, { q: newFAQQuestion, a: newFAQAnswer }]);
    setActivityFeed(prev => [
      { id: Date.now(), type: "kb", text: `FAQ added: "${newFAQQuestion.substring(0, 30)}..."`, time: "Just Now" },
      ...prev
    ]);
    setNewFAQQuestion("");
    setNewFAQAnswer("");
    setActiveModal(null);
  };

  const handleAddPlanSubmit = () => {
    if (!newPlanName.trim()) return;
    const planText = `${newPlanName} (${newPlanCost})`;
    setExtraPlans(prev => [...prev, planText]);
    setActivityFeed(prev => [
      { id: Date.now(), type: "kb", text: `Membership added: "${planText}"`, time: "Just Now" },
      ...prev
    ]);
    setNewPlanName("");
    setActiveModal(null);
  };

  const handleCreatePaymentSubmit = () => {
    if (!newPayDesc.trim() || !newPayAmount.trim()) return;
    const itemUrl = `https://autofy.pay/link/${Math.floor(100000 + Math.random() * 900000)}`;
    setPaymentLinks(prev => [...prev, { desc: newPayDesc, amt: newPayAmount, url: itemUrl }]);
    setActivityFeed(prev => [
      { id: Date.now(), type: "payment", text: `Payment link created: ${newPayDesc} for ₹${newPayAmount}`, time: "Just Now" },
      ...prev
    ]);
    setNewPayDesc("");
    setNewPayAmount("");
    setActiveModal(null);
  };

  // Remove a lead or update lead status
  const updateLeadStatus = (leadId: string, newStatus: "New" | "Contacted" | "Converted") => {
    setLeads(prev => prev.map(lead => lead.id === leadId ? { ...lead, status: newStatus } : lead));
    
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      setActivityFeed(prev => [
        { id: Date.now(), type: "lead", text: `Lead "${lead.name}" state progressed to ${newStatus}`, time: "Just Now" },
        ...prev
      ]);
    }
  };

  // Add new lead manually
  const [manualLeadName, setManualLeadName] = useState("");
  const [manualLeadPhone, setManualLeadPhone] = useState("");
  const [manualLeadSource, setManualLeadSource] = useState("WhatsApp Live");
  const handleAddLeadManually = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualLeadName.trim() || !manualLeadPhone.trim()) return;
    
    const newRecord = {
      id: "l-" + Date.now(),
      name: manualLeadName,
      phone: manualLeadPhone,
      source: manualLeadSource,
      status: "New" as const,
      date: "Just Now"
    };

    setLeads(prev => [newRecord, ...prev]);
    setActivityFeed(prev => [
      { id: Date.now(), type: "lead", text: `Manual Lead Captured: ${manualLeadName} (${manualLeadPhone})`, time: "Just Now" },
      ...prev
    ]);

    setManualLeadName("");
    setManualLeadPhone("");
  };

  // Add booking manually
  const [manualBkName, setManualBkName] = useState("");
  const [manualBkService, setManualBkService] = useState("Premium Session");
  const [manualBkTime, setManualBkTime] = useState("");
  const handleAddAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBkName.trim() || !manualBkTime.trim()) return;

    const newBk = {
      id: "a-" + Date.now(),
      client: manualBkName,
      phone: "+91 " + Math.floor(6000000000 + Math.random() * 3999999999),
      service: manualBkService,
      time: manualBkTime,
      status: "Upcoming"
    };

    setAppointments(prev => [newBk, ...prev]);
    setActivityFeed(prev => [
      { id: Date.now(), type: "appointment", text: `Appointment set: ${manualBkName} for ${manualBkTime}`, time: "Just Now" },
      ...prev
    ]);

    setManualBkName("");
    setManualBkTime("");
  };

  // Sidebar Menu Definition matching Master Visual Reference
  const menuSections = [
    {
      category: "PRIMARY",
      items: [
        { id: "overview", label: "Overview", icon: LayoutDashboard },
        { id: "conversations", label: "Inbox (Chats)", icon: MessageSquare },
        { id: "leads", label: "Leads", icon: Users },
        { id: "appointments", label: "Appointments", icon: Calendar },
      ]
    },
    {
      category: "AI EMPLOYEE",
      items: [
        { id: "ai_training", label: "AI Training", icon: Brain },
        { id: "kb", label: "Knowledge Base", icon: Database },
        { id: "whatsapp_setup", label: "WhatsApp Setup", icon: Phone },
        { id: "marketing", label: "Automations", icon: Megaphone },
        { id: "ai_playground", label: "AI Playground", icon: Sparkles },
      ]
    },
    {
      category: "BUSINESS",
      items: [
        { id: "crm", label: "CRM System", icon: Users },
        { id: "orders", label: "Sales & Orders", icon: ShoppingBag },
        { id: "inventory", label: "Products & Inventory", icon: Package },
        { id: "payments", label: "Payments & Billing", icon: DollarSign },
        { id: "subscription", label: "Subscription & Plans", icon: CreditCard },
        { id: "analytics", label: "Analytics & Growth", icon: Activity },
        { id: "business_setup", label: "Business Setup", icon: Sliders },
      ]
    },
    {
      category: "CONTROL",
      items: [
        { id: "owner_center", label: "Owner Control Center", icon: Shield },
        { id: "settings", label: "Settings", icon: Settings },
      ]
    }
  ];

  // ─────────────────────────────────────────────────────────────
  // PRESENTATION PRIMITIVES (layout discipline: one radius scale,
  // one surface, one spacing rhythm — all driven by design tokens)
  // ─────────────────────────────────────────────────────────────
  const CARD =
    "rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] backdrop-blur-xl shadow-[0_1px_2px_var(--shadow),0_8px_24px_-16px_var(--shadow)]";

  function SectionHeader({
    icon,
    iconBg,
    title,
    subtitle,
    action,
  }: {
    icon: React.ReactNode;
    iconBg: string;
    title: string;
    subtitle: string;
    action?: React.ReactNode;
  }) {
    return (
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-[var(--border)] px-5 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-white"
            style={{ background: iconBg }}
          >
            {icon}
          </div>
          <div className="min-w-0 text-left">
            <h3 className="truncate text-[13px] font-extrabold tracking-tight font-display" style={{ color: "var(--text)" }}>
              {title}
            </h3>
            <p className="truncate text-[11px] font-sans" style={{ color: "var(--text-muted)" }}>
              {subtitle}
            </p>
          </div>
        </div>
        {action}
      </div>
    );
  }

  function SidebarContent() {
    const currentRole = userProfile?.role || "Owner";
    const roleAllowedTabs: Record<string, string[]> = {
      "Support Agent": ["overview", "conversations", "ai_playground"],
      "Sales Agent": ["overview", "conversations", "leads", "appointments", "crm", "ai_playground"],
      "Accountant": ["overview", "payments", "subscription", "analytics", "orders"],
    };
    const allowedTabs = roleAllowedTabs[currentRole] || null;

    const visibleMenuSections = menuSections
      .map((sec) => ({
        ...sec,
        items: sec.items.filter((item) => !allowedTabs || allowedTabs.includes(item.id)),
      }))
      .filter((sec) => sec.items.length > 0);

    return (
      <div className="flex h-full flex-col justify-between gap-5">
        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pr-1 scrollbar-none">
          {/* Brand */}
          <div className="flex items-center gap-3.5 px-1 py-1">
            <Logo size={46} className="shrink-0 filter drop-shadow-md transition-transform duration-200 hover:scale-105" />
            <div className="min-w-0 text-left">
              <span className="block truncate font-display text-[18px] font-black leading-tight tracking-tight text-gradient-brand">
                Autofy OS
              </span>
              <span className="mt-0.5 block text-[9px] font-extrabold uppercase tracking-widest text-[var(--brand)]">
                Enterprise AI Suite
              </span>
            </div>
          </div>

          <div className="h-px" style={{ background: "var(--border)" }} />

          {/* Navigation */}
          <nav className="flex flex-col gap-5 text-left">
            {visibleMenuSections.map((sec, secIdx) => (
              <div key={secIdx} className="flex flex-col gap-1">
                <span
                  className="px-3 pb-1 text-[9.5px] font-extrabold uppercase tracking-widest"
                  style={{ color: "var(--text-subtle)" }}
                >
                  {sec.category}
                </span>
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        handleTabChange(item.id);
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`group relative flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[13.5px] font-medium tracking-tight transition-all duration-200 ${
                        isActive ? "font-bold" : "hover:bg-[var(--input-bg)]"
                      }`}
                      style={
                        isActive
                          ? { background: "var(--bg-elevated)", color: "var(--brand)" }
                          : { color: "var(--text-muted)" }
                      }
                    >
                      {isActive && (
                        <span
                          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full"
                          style={{ background: "var(--brand)" }}
                        />
                      )}
                      <Icon
                        className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110"
                        style={{ color: isActive ? "var(--brand)" : "var(--text-subtle)" }}
                      />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {(item as any).badge !== undefined && (
                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 text-center text-[9px] font-black"
                          style={{
                            background: isActive ? "var(--brand)" : "var(--brand-subtle)",
                            color: isActive ? "#FFF" : "var(--brand)",
                          }}
                        >
                          {(item as any).badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Account footer */}
        <div className="flex shrink-0 flex-col gap-3 border-t pt-4" style={{ borderColor: "var(--border)" }}>
          <div
            onClick={() => handleTabChange("subscription")}
            className="surface-a flex items-center justify-between rounded-2xl p-3.5 cursor-pointer border border-[var(--border)] shadow-md hover:border-[var(--brand)]/50 transition duration-200 group"
            title="Manage Subscription & Plans"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-xs font-black text-white shadow-sm"
                style={{ background: "var(--brand-gradient)" }}
              >
                {userProfile?.name ? userProfile.name[0].toUpperCase() : (userProfile?.businessName ? userProfile.businessName[0].toUpperCase() : (data.businessName ? data.businessName[0].toUpperCase() : "A"))}
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-xs font-bold text-[var(--text)] group-hover:text-[var(--brand)] transition">
                  {userProfile?.businessName || data.businessName || "My Business"}
                </p>
                <span className="mt-1 inline-block rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[8.5px] font-extrabold uppercase tracking-wider text-emerald-400">
                  {subStatus?.status === "TRIAL_ACTIVE" ? `Trial (Autofy Pro) ⚡` : (subStatus?.plan_name || "Autofy Pro")}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <button
              onClick={toggleTheme}
              className="cursor-pointer rounded-xl p-2 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--input-bg)] transition duration-200"
              title="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <button
              onClick={() => {
                if (window.confirm("Sign out of Autofy?")) onLogout();
              }}
              className="flex cursor-pointer items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition duration-200"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id="autofy-main-dashboard"
      className="fixed inset-0 flex h-screen h-[100dvh] w-screen overflow-hidden font-sans select-none md:flex-row z-0"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      {/* Ambient Autofy atmosphere (pink → violet → blue) */}
      <div className="autofy-env">
        <div className="autofy-env-grid" />
        <div className="autofy-env-glow-pink" />
        <div className="autofy-env-glow-lavender" />
        <div className="autofy-env-glow-blue" />
        <div className="autofy-env-glow-violet" />
      </div>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[80vw] flex-col p-6 md:hidden"
              style={{
                background: "var(--sidebar)",
                backdropFilter: "blur(24px)",
                borderRight: "1px solid var(--border)",
              }}
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* DESKTOP FIXED SIDEBAR */}
      <aside
        id="autofy-sidebar"
        className="hidden md:flex h-screen h-[100dvh] w-[280px] lg:w-[300px] shrink-0 flex-col p-6 overflow-hidden select-none"
        style={{
          background: "var(--sidebar)",
          backdropFilter: "blur(24px)",
          borderRight: "1px solid var(--border)",
        }}
      >
        <SidebarContent />
      </aside>

      {/* RIGHT SECTION: Main Column with sticky header and independent scrollable content */}
      <main
        id="autofy-main-section"
        className="relative z-10 flex h-screen h-[100dvh] min-w-0 flex-1 flex-col overflow-hidden"
      >
        {/* TOP NAVIGATION (FIXED/STICKY AT TOP) */}
        <header
          id="autofy-dashboard-header"
          className="shrink-0 z-30 grid h-[64px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b px-4 sm:px-6 glass-nav"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="shrink-0 cursor-pointer rounded-xl border p-2 transition md:hidden"
              style={{ borderColor: "var(--border)", color: "var(--text)", background: "var(--input-bg)" }}
              aria-label="Open navigation"
            >
              <Menu className="h-4 w-4" />
            </button>

            <h1
              className="truncate font-display text-[17px] font-extrabold tracking-tight sm:text-[19px]"
              style={{ color: "var(--text)" }}
            >
              {TAB_TITLES[currentTab] ?? currentTab}
            </h1>

            <div className="badge-glow hidden shrink-0 items-center gap-2 border border-[var(--border)] px-3 py-1 text-[11px] font-bold shadow-sm lg:flex">
              <span className="pulse-dot" />
              <span className="font-display text-gradient-brand">AI Concierge 24/7 Live</span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="relative hidden sm:block">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-subtle)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search anything..."
                className="w-44 rounded-full py-2 pl-9 pr-3 text-xs transition-all duration-300 focus:w-64 focus:outline-none lg:w-56"
                style={{
                  background: "var(--input-bg)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                }}
              />
              <AnimatePresence>
                {searchQuery.trim() !== "" && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute left-0 mt-2 w-72 rounded-2xl p-3 shadow-2xl z-50 space-y-2 text-left"
                    style={{
                      background: "var(--modal-bg)",
                      border: "1px solid var(--border)",
                      boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                    }}
                  >
                    <p className="text-[10px] font-black uppercase tracking-wider text-[var(--text-subtle)] px-2 pt-1">
                      Quick Jump & Matching Modules
                    </p>
                    <div className="space-y-1 max-h-56 overflow-y-auto">
                      {Object.entries(TAB_TITLES)
                        .filter(([key, title]) =>
                          title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          key.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .slice(0, 6)
                        .map(([key, title]) => (
                          <button
                            key={key}
                            onClick={() => {
                              handleTabChange(key);
                              setSearchQuery("");
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-[var(--text)] hover:bg-[#F5F0FF] hover:text-[#8B5CF6] transition flex items-center justify-between cursor-pointer"
                          >
                            <span>{title}</span>
                            <span className="text-[9.5px] font-mono text-[var(--text-subtle)]">Open →</span>
                          </button>
                        ))}
                      {Object.entries(TAB_TITLES).filter(([key, title]) =>
                        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        key.toLowerCase().includes(searchQuery.toLowerCase())
                      ).length === 0 && (
                        <p className="text-[11px] text-[var(--text-subtle)] italic px-3 py-2 text-center">
                          No matching modules found for "{searchQuery}"
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* AI Emergency Kill Switch Indicator */}
            <button
              onClick={() => setAiKillConfirmOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                globalAiEnabled
                  ? "bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20"
                  : "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 animate-pulse"
              }`}
              title={globalAiEnabled ? "AI Auto-Reply is active — click to disable" : "AI Auto-Reply is disabled — click to enable"}
            >
              <Power className="w-3 h-3" />
              {globalAiEnabled ? "AI Active" : "AI Paused"}
            </button>

            <button
              onClick={toggleTheme}
              className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full border shadow-sm transition hover:scale-105"
              style={{
                background: "var(--input-bg)",
                borderColor: "var(--border)",
                color: "var(--brand)",
              }}
              title="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <div className="relative">
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="grid h-9 w-9 cursor-pointer place-items-center rounded-full border shadow-sm transition hover:text-[var(--text)]"
                style={{
                  background: "var(--bg-card)",
                  borderColor: "var(--border)",
                  color: "var(--text-muted)",
                }}
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {notifications.some((n) => n.unread) && (
                  <span
                    className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full"
                    style={{ background: "var(--brand)" }}
                  />
                )}
              </button>

              <AnimatePresence>
                {notificationOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 z-50 mt-2 w-[min(18rem,calc(100vw-2rem))] space-y-3 rounded-2xl p-4 shadow-xl"
                    style={{
                      background: "var(--modal-bg)",
                      border: "1px solid var(--border)",
                      boxShadow: "0 20px 40px var(--shadow)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold" style={{ color: "var(--text)" }}>
                        Notifications
                      </span>
                      <button
                        onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))}
                        className="cursor-pointer text-[9.5px] text-[var(--text-muted)] hover:underline"
                      >
                        Mark all read
                      </button>
                    </div>
                    <div className="h-px" style={{ background: "var(--border)" }} />
                    <div className="max-h-[220px] space-y-2.5 overflow-y-auto">
                      {notifications.map((n) => (
                        <div key={n.id} className="flex gap-2 text-[11px] leading-snug">
                          <div
                            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ background: n.unread ? "var(--brand)" : "var(--border-strong)" }}
                          />
                          <span style={{ color: n.unread ? "var(--text)" : "var(--text-muted)" }}>{n.text}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-black text-white shadow-sm"
              style={{ background: "var(--brand-gradient)" }}
            >
              {userProfile?.name ? userProfile.name[0].toUpperCase() : (userProfile?.businessName ? userProfile.businessName[0].toUpperCase() : (data.businessName ? data.businessName[0].toUpperCase() : "A"))}
            </div>
          </div>
        </header>

        {/* CONTENT CONTAINER: The ONLY vertical scrolling area for dashboard content */}
        <div
          id="dashboard-scroll-viewport"
          className="relative z-10 flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden scrollbar-thin"
          style={{
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
          }}
        >
          <div className="mx-auto w-full max-w-[1480px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">

          {/* Toast alert */}
          <AnimatePresence>
            {dashboardAlert && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="fixed right-4 top-20 z-[100] flex max-w-[calc(100vw-2rem)] items-center gap-3.5 rounded-2xl px-5 py-4 shadow-2xl backdrop-blur-md sm:max-w-sm md:right-8"
                style={{
                  background: "var(--modal-bg)",
                  border: "1px solid var(--border-strong)",
                  color: "var(--text)",
                  boxShadow: "0 20px 60px var(--shadow)",
                }}
              >
                <div
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold"
                  style={{ background: "rgba(34,197,94,0.12)", color: "var(--success)" }}
                >
                  <Check size={14} />
                </div>
                <div className="min-w-0">
                  <h4
                    className="mb-1 text-[9px] font-black uppercase leading-none tracking-widest"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Autofy Instant
                  </h4>
                  <p className="text-[11px] font-semibold leading-normal" style={{ color: "var(--text)" }}>
                    {dashboardAlert}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* EMPTY MODE PREVIEW */}
          {emptyMode ? (
            <div className="space-y-6">
              <div className="p-8 rounded-3xl backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <div className="space-y-2 max-w-xl text-left">
                  <div className="inline-flex px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 font-extrabold text-[10px] uppercase tracking-widest rounded-full font-mono">
                    Zero Clients Connected
                  </div>
                  <h2 className="text-2xl font-black font-sans tracking-tight" style={{ color: "var(--text)" }}>
                    Establish Your First WhatsApp Connection Pipeline
                  </h2>
                  <p className="text-xs leading-relaxed font-sans" style={{ color: "var(--text-muted)" }}>
                    Welcome to the Autofy Suite sandbox! Currently, your server has no active customer interaction data logs in its pipeline. Follow our clean, 4-step onboarding checklist below to start receiving real-time customers.
                  </p>
                </div>
                
                <div className="p-4 rounded-2xl flex items-center gap-3" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
                  <QrCode className="w-12 h-12 stroke-[1.5]" style={{ color: "var(--text-muted)" }} />
                  <div className="text-left">
                    <p className="text-xs font-extrabold" style={{ color: "var(--text)" }}>Meta API Quick-Sync</p>
                    <p className="text-[10px] font-mono" style={{ color: "var(--text-subtle)" }}>Scan QR code to connect Sandbox</p>
                  </div>
                </div>
              </div>

              {/* Step grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { step: "1", title: "Business Info Check", desc: "Review business details, local address guidelines, and target industry classification.", done: data.businessName ? true : false, actionLabel: "Completed", action: () => {} },
                  { step: "2", title: "Connect WhatsApp Sandbox", desc: "Inject Meta cloud tokens or pair our testing mobile handset QR code securely.", done: data.whatsappConnected === "connected", actionLabel: "Synchronize Line", action: () => setActiveModal("whatsapp") },
                  { step: "3", title: "Add Premium Services", desc: "Configure pricing plans, hourly session limits, memberships, and knowledge facts.", done: extraServices.length > 0, actionLabel: "Add Service", action: () => setActiveModal("service") },
                  { step: "4", title: "Simulate First Customer", desc: "Launch the AI Chat simulator and check how the assistant converts prospects into leads.", done: false, actionLabel: "Play Chat Test", action: () => handleTabChange("conversations") }
                ].map((item, id) => (
                  <div
                    key={id}
                    className="p-5 rounded-3xl backdrop-blur-md flex flex-col justify-between gap-5 transition-all text-left"
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="w-7 h-7 rounded-lg bg-blue-600/15 text-blue-400 font-extrabold flex items-center justify-center text-xs font-mono">
                          {item.step}
                        </span>
                        {item.done ? (
                          <div className="bg-green-500/10 text-green-400 font-bold text-[9.5px] border border-green-500/25 px-2 py-0.5 rounded-full flex items-center gap-1 font-sans">
                            <CheckCircle className="w-3 h-3" /> Fully Synced
                          </div>
                        ) : (
                          <div className="bg-amber-500/10 text-amber-400 font-bold text-[9.5px] border border-amber-500/25 px-2 py-0.5 rounded-full font-sans">
                            Pending Info
                          </div>
                        )}
                      </div>
                      <h3 className="text-xs font-black font-sans tracking-tight" style={{ color: "var(--text)" }}>{item.title}</h3>
                      <p className="text-[10.5px] leading-normal font-sans" style={{ color: "var(--text-muted)" }}>{item.desc}</p>
                    </div>

                    <button 
                      onClick={item.action}
                      disabled={item.done && item.step === "1"}
                      className={`w-full py-2 rounded-xl text-[10.5px] font-bold font-sans cursor-pointer transition-all ${
                        item.done 
                          ? "border" 
                          : "bg-blue-600 hover:bg-blue-500 text-white"
                      }`}
                      style={item.done ? { background: "var(--bg-elevated)", color: "var(--text-muted)", borderColor: "var(--border)" } : {}}
                    >
                      {item.actionLabel}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            
            // OTHERWISE SHOW TABS
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="space-y-8"
              >
                <Routes>
                  <Route path="/" element={
                    <div className="space-y-5 pb-10 text-left sm:space-y-6">

                    {/* Preview Mode / Demo Mode Badge Banner */}
                    {summaryData?.mode === "demo" && (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 px-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 font-sans text-xs">
                        <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400 font-semibold">
                          <Sparkles className="w-4 h-4 shrink-0 text-amber-500" />
                          <span><strong>Preview Mode</strong> — You're viewing sample data. Connect your business to see live insights.</span>
                        </div>
                        <button
                          onClick={() => navigate("/dashboard/business_setup")}
                          className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-[11px] uppercase tracking-wider shrink-0 cursor-pointer transition shadow-sm"
                        >
                          Connect Business
                        </button>
                      </div>
                    )}

                    {/* Error Banner */}
                    {summaryError && (
                      <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs flex items-center justify-between gap-3 font-sans">
                        <div className="flex items-center gap-2 text-red-500 font-semibold">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{summaryError}</span>
                        </div>
                        <button
                          onClick={fetchDashboardSummary}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[11px] font-bold uppercase cursor-pointer transition"
                        >
                          Retry
                        </button>
                      </div>
                    )}

                    {/* ══ 01 — GREETING + AI EMPLOYEE LIVE STATUS ══ */}
                    <section className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-stretch">
                      <div className={`lg:col-span-8 ${CARD} flex flex-col justify-center gap-3 p-6 sm:p-8`}>
                        <div className="badge-glow inline-flex w-fit items-center gap-2 rounded-full px-3.5 py-1 text-xs font-bold">
                          <span className="pulse-dot" />
                          <span className="font-display text-[10.5px] font-extrabold uppercase tracking-wider text-gradient-brand">
                            Autofy AI — {summaryData?.mode === "demo" ? "Preview Mode" : "Live"}
                          </span>
                          <Sparkles className="h-3.5 w-3.5" style={{ color: "var(--brand-pink)" }} />
                        </div>

                        <h2
                          className="font-display font-black leading-[1.1] tracking-tight"
                          style={{ fontSize: "clamp(26px, 3.4vw, 44px)", color: "var(--text)" }}
                        >
                          {(() => {
                            const hours = new Date().getHours();
                            if (hours >= 5 && hours < 12) return "Good morning";
                            if (hours >= 12 && hours < 17) return "Good afternoon";
                            if (hours >= 17 && hours < 21) return "Good evening";
                            return "Good night";
                          })()},{" "}
                          <span className="text-gradient-brand">
                            {userProfile?.name || userProfile?.businessName || data.businessName || "there"}.
                          </span>
                        </h2>

                        <p
                          className="max-w-2xl text-sm font-medium leading-relaxed sm:text-base"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Your AI employee handled{" "}
                          <span className="font-display font-black text-gradient-brand">
                            {summaryData?.metrics.customer_interactions ?? 0} customer interactions
                          </span>{" "}
                          while you were away.
                        </p>
                      </div>

                      <div className={`lg:col-span-4 ${CARD} flex flex-col gap-4 p-5 sm:p-6`}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <div
                              className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-white shadow-sm"
                              style={{ background: "var(--brand-gradient)" }}
                            >
                              <Bot className="h-4 w-4" />
                            </div>
                            <span
                              className="whitespace-nowrap text-xs font-black uppercase tracking-wider"
                              style={{ color: "var(--text)" }}
                            >
                              AI Employee
                            </span>
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-500">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                            Active 24/7
                          </div>
                        </div>

                        <div className="flex flex-1 flex-col justify-center divide-y" style={{ borderColor: "var(--border)" }}>
                          {[
                            { label: "Conversations handled", value: String(summaryData?.metrics.customer_interactions ?? 0) },
                            { label: "Appointments booked", value: String(apptsCount) },
                            { label: "Revenue assisted", value: `₹${revCount.toLocaleString("en-IN")}` },
                          ].map((row) => (
                            <div
                              key={row.label}
                              className="flex items-center justify-between gap-3 py-2.5 text-xs first:pt-0 last:pb-0"
                              style={{ borderColor: "var(--border)" }}
                            >
                              <span className="min-w-0 truncate" style={{ color: "var(--text-muted)" }}>
                                {row.label}
                              </span>
                              <span className="shrink-0 font-display text-sm font-black" style={{ color: "var(--text)" }}>
                                {row.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>

                    {/* ══ ONBOARDING GUIDANCE & SETUP READINESS LAUNCHPAD ══ */}
                    <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10 border border-blue-500/20 backdrop-blur-md space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-[var(--text)] uppercase tracking-wider">Quick Setup & Launch Checklist</h3>
                            <p className="text-[11px] text-[var(--text-muted)]">Complete these 3 essential steps to start automating customer chats and bookings.</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-blue-400 font-bold self-start sm:self-auto">
                          Setup Guidance
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                        {/* Step 1: WhatsApp */}
                        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] flex flex-col justify-between gap-3 text-left">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase text-blue-400 font-mono">Step 1</span>
                              {data.whatsappConnected === "connected" ? (
                                <span className="text-[9.5px] font-bold text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> Connected</span>
                              ) : (
                                <span className="text-[9.5px] font-bold text-amber-400">No WhatsApp connected</span>
                              )}
                            </div>
                            <h4 className="text-xs font-black text-[var(--text)]">WhatsApp Business Line</h4>
                            <p className="text-[10.5px] text-[var(--text-muted)] leading-relaxed">
                              {data.whatsappConnected === "connected" ? "Your phone number is active and receiving live messages." : "Connect WhatsApp to start receiving and answering customer inquiries."}
                            </p>
                          </div>
                          <button
                            onClick={() => navigate("/dashboard/whatsapp_setup")}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <Phone className="w-3.5 h-3.5" /> Connect WhatsApp
                          </button>
                        </div>

                        {/* Step 2: Knowledge Base */}
                        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] flex flex-col justify-between gap-3 text-left">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase text-purple-400 font-mono">Step 2</span>
                              <span className="text-[9.5px] font-bold text-purple-400">AI Knowledge</span>
                            </div>
                            <h4 className="text-xs font-black text-[var(--text)]">Business Knowledge Base</h4>
                            <p className="text-[10.5px] text-[var(--text-muted)] leading-relaxed">
                              Upload your service prices, timing FAQs, policy documents, and brochures to ground your AI.
                            </p>
                          </div>
                          <button
                            onClick={() => navigate("/dashboard/kb")}
                            className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <Database className="w-3.5 h-3.5" /> Add Knowledge
                          </button>
                        </div>

                        {/* Step 3: Test in Simulator */}
                        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] flex flex-col justify-between gap-3 text-left">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase text-pink-400 font-mono">Step 3</span>
                              <span className="text-[9.5px] font-bold text-pink-400">Simulator</span>
                            </div>
                            <h4 className="text-xs font-black text-[var(--text)]">Test AI Playground</h4>
                            <p className="text-[10.5px] text-[var(--text-muted)] leading-relaxed">
                              Chat with your AI employee in the sandbox to preview exactly how it answers customer questions.
                            </p>
                          </div>
                          <button
                            onClick={() => navigate("/dashboard/ai_playground")}
                            className="w-full py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <Sparkles className="w-3.5 h-3.5" /> Open Playground
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* ══ 02 — REVENUE ANALYTICS + KPI GRID ══ */}
                    <section className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-stretch">
                      {/* Revenue */}
                      <div className={`lg:col-span-7 ${CARD} flex flex-col gap-5 p-5 sm:p-6`}>
                        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                          <span className="truncate text-xs font-bold" style={{ color: "var(--text-muted)" }}>
                            Revenue This Month
                          </span>
                          <button
                            className="flex shrink-0 cursor-pointer items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold text-[var(--text-muted)] transition hover:text-[var(--text)]"
                            style={{ borderColor: "var(--border)", background: "var(--input-bg)" }}
                          >
                            This Month <ChevronRight className="h-3 w-3 rotate-90" />
                          </button>
                        </div>

                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          <span
                            className="font-display text-3xl font-black tracking-tight sm:text-4xl"
                            style={{ color: "var(--text)" }}
                          >
                            ₹{revCount.toLocaleString("en-IN")}
                          </span>
                          {summaryData?.metrics.revenue_change_percent != null ? (
                            <>
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-500">
                                <TrendingUp className="h-3 w-3" /> {summaryData.metrics.revenue_change_percent}%
                              </span>
                              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                                vs last month
                              </span>
                            </>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-500/10 px-2 py-0.5 text-xs font-bold text-zinc-400">
                              No prior period baseline
                            </span>
                          )}
                        </div>

                        {/* Chart */}
                        <div className="relative mt-auto w-full">
                          <div className="flex gap-3">
                            <div className="flex h-[168px] w-9 shrink-0 flex-col justify-between text-[9px] font-mono text-[var(--text-subtle)] select-none">
                              <span>{revCount > 30000 ? `₹${Math.round(revCount / 1000)}K` : "₹30K"}</span>
                              <span>{revCount > 20000 ? `₹${Math.round((revCount * 0.66) / 1000)}K` : "₹20K"}</span>
                              <span>{revCount > 10000 ? `₹${Math.round((revCount * 0.33) / 1000)}K` : "₹10K"}</span>
                              <span>₹0</span>
                            </div>
                            <div className="relative h-[168px] min-w-0 flex-1">
                              {revCount > 0 && summaryData?.revenue_series && summaryData.revenue_series.length > 0 ? (
                                <svg viewBox="0 0 500 160" className="h-full w-full overflow-visible" preserveAspectRatio="none">
                                  <path d="M0 130 Q125 120 250 85 T500 20 L500 160 L0 160Z" fill="url(#revMasterGrad)" opacity="0.25" />
                                  <path d="M0 130 Q125 120 250 85 T500 20" fill="none" stroke="var(--brand)" strokeWidth="3.5" strokeLinecap="round" />
                                  <circle cx="500" cy="20" r="5" fill="var(--brand)" />
                                  <circle cx="500" cy="20" r="9" fill="var(--brand)" opacity="0.3" className="animate-ping" />
                                  <defs>
                                    <linearGradient id="revMasterGrad" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="0%" stopColor="var(--brand)" />
                                      <stop offset="100%" stopColor="transparent" />
                                    </linearGradient>
                                  </defs>
                                </svg>
                              ) : (
                                <svg viewBox="0 0 500 160" className="h-full w-full overflow-visible" preserveAspectRatio="none">
                                  <line x1="0" y1="150" x2="500" y2="150" stroke="var(--border-strong)" strokeWidth="2" strokeDasharray="6 6" />
                                  <circle cx="500" cy="150" r="4" fill="var(--text-subtle)" />
                                </svg>
                              )}
                            </div>
                          </div>
                          <div className="ml-12 mt-2 flex justify-between text-[10px] font-mono text-[var(--text-subtle)]">
                            {summaryData?.revenue_series && summaryData.revenue_series.length > 0 ? (
                              summaryData.revenue_series.map((item, idx) => (
                                <span key={idx} className={idx % 2 === 1 ? "hidden sm:inline" : ""}>{item.label}</span>
                              ))
                            ) : (
                              <>
                                <span>Week 1</span>
                                <span className="hidden sm:inline">Week 2</span>
                                <span>Week 3</span>
                                <span className="hidden sm:inline">Week 4</span>
                                <span>Today</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* KPI 2x2 */}
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:col-span-5 lg:auto-rows-fr">
                        {[
                          {
                            label: "Active Leads",
                            value: String(leadsCount),
                            hint: leadsCount > 0 ? "Active pipeline" : "No active leads yet",
                            hintTone: leadsCount > 0 ? "text-emerald-500" : "",
                            icon: Users,
                            fg: "var(--brand)",
                            bg: "var(--brand-subtle)",
                          },
                          {
                            label: "AI Resolution Rate",
                            value: summaryData?.metrics.ai_resolution_rate != null ? `${summaryData.metrics.ai_resolution_rate}%` : "—",
                            hint: summaryData?.metrics.ai_resolution_rate != null ? "Automated response rate" : "No data yet",
                            hintTone: summaryData?.metrics.ai_resolution_rate != null ? "text-emerald-500" : "",
                            icon: Activity,
                            fg: "var(--accent-green)",
                            bg: "var(--accent-green-subtle)",
                          },
                          {
                            label: "WhatsApp Chats",
                            value: String(convsCount),
                            hint: convsCount > 0 ? "Meta Cloud API" : "No active chats",
                            hintTone: "",
                            icon: Phone,
                            fg: "var(--whatsapp-green)",
                            bg: "rgba(37,211,102,0.10)",
                          },
                          {
                            label: "Appointments",
                            value: String(apptsCount),
                            hint: apptsCount > 0 ? "Scheduled / booked" : "No bookings yet",
                            hintTone: "",
                            icon: Calendar,
                            fg: "var(--accent-amber)",
                            bg: "rgba(217,119,6,0.10)",
                          },
                        ].map((kpi) => {
                          const KIcon = kpi.icon;
                          return (
                            <div key={kpi.label} className={`${CARD} flex flex-col justify-between gap-4 p-5`}>
                              <div
                                className="grid h-9 w-9 place-items-center rounded-xl"
                                style={{ background: kpi.bg, color: kpi.fg }}
                              >
                                <KIcon className="h-4 w-4" />
                              </div>
                              <div className="min-w-0 space-y-1">
                                <span className="block text-xs font-semibold leading-snug" style={{ color: "var(--text-muted)" }}>
                                  {kpi.label}
                                </span>
                                <span className="block font-display text-2xl font-black" style={{ color: "var(--text)" }}>
                                  {kpi.value}
                                </span>
                                <span
                                  className={`block text-[11px] font-semibold leading-snug ${kpi.hintTone}`}
                                  style={kpi.hintTone ? undefined : { color: "var(--text-muted)" }}
                                >
                                  {kpi.hint}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>

                    {/* ══ 03 — AI EMPLOYEE PERFORMANCE / PIPELINE ══ */}
                    <section className={`${CARD} p-5 sm:p-6 lg:p-7`}>
                      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
                        {/* Identity */}
                        <div className="flex min-w-0 items-start gap-4 lg:col-span-4">
                          <div
                            className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl shadow-lg"
                            style={{ background: "var(--brand-gradient)" }}
                          >
                            <Bot className="h-7 w-7 text-white" />
                          </div>
                          <div className="min-w-0 space-y-1.5">
                            <h3 className="font-display text-base font-black tracking-tight" style={{ color: "var(--text)" }}>
                              Your AI employee is working
                            </h3>
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                              Here's what Autofy handled automatically today.
                            </p>
                            <div className="flex items-baseline gap-2 pt-1">
                              <span className="font-display text-4xl font-black text-gradient-brand">
                                {summaryData?.metrics.customer_interactions ?? 0}
                              </span>
                              <span className="text-xs font-bold" style={{ color: "var(--text-muted)" }}>
                                Customer Interactions
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                                ● 24/7 Active
                              </span>
                              <span
                                className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                                style={{
                                  background: "var(--brand-subtle)",
                                  color: "var(--brand)",
                                  border: "1px solid var(--border-strong)",
                                }}
                              >
                                ● {summaryData?.metrics.ai_resolution_rate != null ? `${summaryData.metrics.ai_resolution_rate}% Autonomous` : 'No data yet'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Pipeline */}
                        <div className="lg:col-span-5">
                          <div className="grid grid-cols-4 gap-2 sm:gap-3">
                            {[
                              { label: "Answered", sub: "Customer", icon: MessageSquare, bg: "var(--brand)" },
                              { label: "Qualified", sub: "Lead", icon: Users, bg: "var(--accent-amber)" },
                              { label: "Booked", sub: "Appointment", icon: Calendar, bg: "var(--brand-pink)" },
                              { label: "Collected", sub: "Payment", icon: DollarSign, bg: "var(--accent-green)" },
                            ].map((st, i) => {
                              const StIcon = st.icon;
                              return (
                                <div key={st.label} className="relative flex flex-col items-center gap-1.5 text-center">
                                  {i > 0 && (
                                    <span
                                      className="absolute left-[-50%] top-5 hidden h-px w-full sm:block"
                                      style={{ background: "var(--border-strong)" }}
                                    />
                                  )}
                                  <div
                                    className="relative z-10 grid h-10 w-10 place-items-center rounded-2xl text-white shadow-md"
                                    style={{ background: st.bg }}
                                  >
                                    <StIcon className="h-4 w-4" />
                                  </div>
                                  <span className="block text-[11px] font-bold sm:text-xs" style={{ color: "var(--text)" }}>
                                    {st.label}
                                  </span>
                                  <span className="block text-[10px]" style={{ color: "var(--text-muted)" }}>
                                    {st.sub}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Summary */}
                        <div
                          className="space-y-2.5 border-t pt-4 text-xs lg:col-span-3 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0"
                          style={{ borderColor: "var(--border)" }}
                        >
                          {[
                            { dot: "var(--brand)", label: "Leads Captured", value: String(summaryData?.metrics.active_leads ?? 0), tone: "var(--text)" },
                            { dot: "var(--brand-pink)", label: "Appointments Booked", value: String(summaryData?.metrics.appointments ?? 0), tone: "var(--text)" },
                            { dot: "var(--accent-green)", label: "Payments Collected", value: `₹${revCount.toLocaleString("en-IN")}`, tone: "var(--accent-green)" },
                            { dot: "var(--accent-red)", label: "Escalations Needed", value: summaryData?.metrics.escalations != null ? String(summaryData.metrics.escalations) : "0", tone: summaryData?.metrics.escalations ? "var(--accent-red)" : "var(--text)" },
                          ].map((row) => (
                            <div key={row.label} className="flex items-center justify-between gap-3">
                              <span className="flex min-w-0 items-center gap-2" style={{ color: "var(--text-muted)" }}>
                                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: row.dot }} />
                                <span className="leading-snug">{row.label}</span>
                              </span>
                              <span className="shrink-0 font-display text-sm font-black" style={{ color: row.tone }}>
                                {row.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>

                    {/* ══ 04 — QUICK ACTIONS ══ */}
                    <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
                      {[
                        { label: "Add service", hint: "Knowledge base", icon: Plus, fg: "var(--brand)", bg: "var(--brand-subtle)", onClick: () => setActiveModal("service") },
                        { label: "Add FAQ", hint: "Train the AI", icon: HelpCircle, fg: "var(--accent-blue)", bg: "rgba(37,99,235,0.10)", onClick: () => setActiveModal("faq") },
                        { label: "Payment link", hint: "Collect instantly", icon: CreditCard, fg: "var(--accent-green)", bg: "var(--accent-green-subtle)", onClick: () => setActiveModal("payment") },
                        { label: "Connect WhatsApp", hint: data.whatsappConnected === "connected" ? "Connected" : "Pair number", icon: Phone, fg: "var(--whatsapp-green)", bg: "rgba(37,211,102,0.10)", onClick: () => setActiveModal("whatsapp") },
                        { label: "Test simulator", hint: "Preview AI chat", icon: Zap, fg: "var(--accent-amber)", bg: "rgba(217,119,6,0.10)", onClick: onOpenTestSimulator },
                      ].map((qa) => {
                        const QIcon = qa.icon;
                        return (
                          <button
                            key={qa.label}
                            onClick={qa.onClick}
                            className={`${CARD} flex cursor-pointer items-center gap-3 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--border-strong)]`}
                          >
                            <span
                              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
                              style={{ background: qa.bg, color: qa.fg }}
                            >
                              <QIcon className="h-4 w-4" />
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-xs font-bold" style={{ color: "var(--text)" }}>
                                {qa.label}
                              </span>
                              <span className="block truncate text-[10.5px]" style={{ color: "var(--text-muted)" }}>
                                {qa.hint}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </section>

                    {/* ══ 05 — CONVERSATIONS + LIVE AI ACTIVITY ══ */}
                    <section className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-stretch">
                      {/* Recent conversations */}
                      <div className={`${CARD} flex flex-col`}>
                        <SectionHeader
                          icon={<Phone className="h-3.5 w-3.5" />}
                          iconBg="var(--whatsapp-green)"
                          title="Recent Conversations"
                          subtitle="Live customer conversations"
                          action={
                            <button
                              onClick={() => handleTabChange("conversations")}
                              className="flex shrink-0 cursor-pointer items-center gap-1 text-[11px] font-bold text-[var(--brand)] hover:underline"
                            >
                              Open Inbox <ArrowRight className="h-3 w-3" />
                            </button>
                          }
                        />
                        <div className="flex-1 space-y-1 p-3 sm:p-4">
                          {(summaryData?.recent_conversations && summaryData.recent_conversations.length > 0) ? (
                            summaryData.recent_conversations.slice(0, 4).map((chat) => {
                              const tone =
                                chat.status === "Replied"
                                  ? { label: "AI HANDLED", color: "var(--success)" }
                                  : chat.status === "Waiting"
                                  ? { label: "WAITING", color: "var(--warning)" }
                                  : { label: "ESCALATED", color: "var(--danger)" };
                              return (
                                <div
                                  key={chat.id}
                                  onClick={() => handleTabChange("conversations")}
                                  className="grid cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl p-3 text-left transition hover:bg-[var(--input-bg)]"
                                >
                                  <div className="flex min-w-0 items-center gap-3">
                                    <div
                                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-black text-white shadow-sm"
                                      style={{ background: "var(--brand-gradient)" }}
                                    >
                                      {chat.name[0] || "C"}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2">
                                        <h4 className="truncate text-xs font-bold" style={{ color: "var(--text)" }}>
                                          {chat.name}
                                        </h4>
                                        <span className="shrink-0 font-mono text-[10px] text-[var(--text-subtle)]">
                                          {chat.time}
                                        </span>
                                      </div>
                                      <p className="mt-0.5 truncate text-[11.5px]" style={{ color: "var(--text-muted)" }}>
                                        "{chat.lastMessage}"
                                      </p>
                                    </div>
                                  </div>
                                  <span
                                    className="shrink-0 rounded-full px-2 py-0.5 text-[8.5px] font-black uppercase tracking-wider"
                                    style={{
                                      background: `color-mix(in srgb, ${tone.color} 12%, transparent)`,
                                      color: tone.color,
                                      border: `1px solid color-mix(in srgb, ${tone.color} 28%, transparent)`,
                                    }}
                                  >
                                    {tone.label}
                                  </span>
                                </div>
                              );
                            })
                          ) : (
                            <div className="p-6 text-center text-xs space-y-2 text-[var(--text-muted)] font-sans">
                              <MessageSquare className="w-8 h-8 mx-auto text-[var(--text-subtle)] opacity-40" />
                              <p className="font-bold text-[var(--text)]">No conversations yet</p>
                              <p>Your WhatsApp conversations will appear here once customers start messaging.</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Live AI activity */}
                      <div className={`${CARD} flex flex-col`}>
                        <SectionHeader
                          icon={<Sparkles className="h-3.5 w-3.5" />}
                          iconBg="var(--brand)"
                          title="Live AI Activity"
                          subtitle="Real-time updates from your AI employee"
                          action={
                            <button
                              onClick={handleRefreshData}
                              className="flex shrink-0 cursor-pointer items-center gap-1 text-[11px] font-bold text-[var(--brand)] hover:underline"
                            >
                              <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} /> Refresh
                            </button>
                          }
                        />
                        <div className="flex-1 space-y-3.5 p-4 sm:p-5">
                          {(summaryData?.recent_activity && summaryData.recent_activity.length > 0) ? (
                            summaryData.recent_activity.slice(0, 6).map((ev) => {
                              const map: Record<string, { color: string; icon: any }> = {
                                chat: { color: "var(--brand)", icon: MessageSquare },
                                ai: { color: "var(--brand-pink)", icon: Sparkles },
                                payment: { color: "var(--accent-green)", icon: DollarSign },
                                lead: { color: "var(--accent-blue)", icon: Users },
                                appointment: { color: "var(--accent-amber)", icon: Calendar },
                              };
                              const meta = map[ev.type] ?? { color: "var(--brand)", icon: Sparkles };
                              const EvIcon = meta.icon;
                              return (
                                <div key={ev.id} className="flex items-start gap-3 text-left font-sans">
                                  <div
                                    className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-white shadow-sm"
                                    style={{ background: meta.color }}
                                  >
                                    <EvIcon className="h-3 w-3" />
                                  </div>
                                  <div className="min-w-0 flex-1 space-y-0.5">
                                    <p className="text-xs font-semibold leading-snug" style={{ color: "var(--text)" }}>
                                      {ev.title}: {ev.subtitle}
                                    </p>
                                    <span className="font-mono text-[10px] font-bold text-[var(--text-subtle)]">
                                      {ev.time}
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="p-6 text-center text-xs space-y-2 text-[var(--text-muted)] font-sans">
                              <Activity className="w-8 h-8 mx-auto text-[var(--text-subtle)] opacity-40" />
                              <p className="font-bold text-[var(--text)]">No live activity recorded yet</p>
                              <p>AI agent events and automated actions will be tracked here in real-time.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </section>

                    </div>
                  } />
                  
                  <Route path="conversations" element={
                    <ConversationsTab
                      onboardingData={data}
                      servicesList={servicesList}
                      productsList={productsList}
                      membershipPlans={membershipPlans}
                      faqsList={faqsList}
                      policies={policies}
                      triggerNotification={triggerDashboardNotification}
                    />
                  } />
                  <Route path="inventory" element={
                    <InventoryTab
                      productsList={productsList}
                      setProductsList={setProductsList}
                      triggerNotification={triggerDashboardNotification}
                    />
                  } />
                  <Route path="orders" element={
                    <OrdersTab
                      productsList={productsList}
                      setProductsList={setProductsList}
                      triggerNotification={triggerDashboardNotification}
                    />
                  } />
                  <Route path="crm" element={
                    <CRMTab triggerNotification={triggerDashboardNotification} />
                  } />
                  <Route path="ai_training" element={
                    <AITrainingCenterTab triggerNotification={triggerDashboardNotification} />
                  } />
                  <Route path="marketing" element={
                    <MarketingAutomationTab triggerNotification={triggerDashboardNotification} />
                  } />
                  <Route path="owner_center" element={
                    <OwnerControlCenter summaryData={summaryData} triggerNotification={triggerDashboardNotification} />
                  } />
                  <Route path="support_tickets" element={
                    <SupportTicketsTab triggerNotification={triggerDashboardNotification} />
                  } />
                  <Route path="mobile_audit" element={
                    <MobileAuditTab triggerNotification={triggerDashboardNotification} />
                  } />
                  <Route path="leads" element={
                    <LeadsTab
                      leads={leads}
                      setLeads={setLeads}
                      triggerNotification={triggerDashboardNotification}
                    />
                  } />
                  <Route path="appointments" element={
                    <AppointmentsTab />
                  } />
                  <Route path="payments" element={
                    <PaymentsTab
                      onboardingData={data}
                      triggerNotification={triggerDashboardNotification}
                    />
                  } />
                  <Route path="ai_playground" element={
                    <AiPlaygroundTab />
                  } />
                  <Route path="kb" element={
                    <KnowledgeBaseTab
                      onboardingData={data}
                      servicesList={servicesList}
                      setServicesList={setServicesList}
                      productsList={productsList}
                      setProductsList={setProductsList}
                      membershipPlans={membershipPlans}
                      setMembershipPlans={setMembershipPlans}
                      faqsList={faqsList}
                      setFaqsList={setFaqsList}
                      policies={policies}
                      setPolicies={setPolicies}
                      uploadedDocs={uploadedDocs}
                      setUploadedDocs={setUploadedDocs}
                      triggerNotification={triggerDashboardNotification}
                    />
                  } />
                  <Route path="analytics" element={
                    <AnalyticsTab
                      onboardingData={data}
                      summaryData={summaryData}
                      triggerNotification={triggerDashboardNotification}
                    />
                  } />
                  <Route path="integrations" element={
                    <IntegrationsTab
                      onboardingData={data}
                      triggerNotification={triggerDashboardNotification}
                    />
                  } />
                  <Route path="business_setup" element={
                    <BusinessSetupTab
                      onboardingData={data}
                      setOnboardingData={setData}
                      triggerNotification={triggerDashboardNotification}
                    />
                  } />
                  <Route path="memberships" element={
                    <MembershipPlansTab />
                  } />
                  <Route path="faqs" element={
                    <FaqManagementTab />
                  } />
                  <Route path="whatsapp_setup" element={
                    <WhatsAppSetupTab />
                  } />
                  <Route path="subscription" element={
                    <SubscriptionTab triggerNotification={triggerDashboardNotification} />
                  } />
                  <Route path="settings" element={
                    <SettingsTab
                      onboardingData={data}
                      triggerNotification={triggerDashboardNotification}
                    />
                  } />
                </Routes>


              </motion.div>
            </AnimatePresence>
          )}

          </div>
        </div>
      </main>

      {/* POPUP ACTION GLOBAL MODALS CONTROLLER */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 bg-[#000000]/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="bg-[var(--modal-bg)] border rounded-[20px] p-8 max-w-md w-full space-y-4 shadow-2xl relative"
              style={{ borderColor: "var(--border)" }}
            >
              {/* Close Button top-right */}
              <button
                onClick={() => setActiveModal(null)}
                className="absolute right-5 top-5 p-1 rounded-lg transition"
                style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--text-muted)" }}
              >
                <X className="w-4.5 h-4.5" />
              </button>

              {/* Modal 1: ADD SERVICE */}
              {activeModal === "service" && (
                <div className="space-y-4">
                  <h3 className="font-extrabold text-sm font-sans text-left" style={{ color: "var(--text)" }}>Add a service</h3>
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] uppercase font-bold font-sans tracking-wider block" style={{ color: "var(--text-muted)" }}>Service Name / Title</label>
                    <input
                      type="text"
                      placeholder="E.g. VIP Consultation, Premium Session Class"
                      value={newServiceName}
                      onChange={(e) => setNewServiceName(e.target.value)}
                      className="w-full rounded-xl p-3 text-xs focus:outline-none font-sans"
                      style={{
                        background: "var(--input-bg)",
                        border: "1px solid var(--border)",
                        color: "var(--text)"
                      }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveModal(null)}
                      className="flex-1 py-2 text-xs font-bold rounded-xl cursor-pointer transition-all border"
                      style={{
                        background: "var(--bg-card)",
                        borderColor: "var(--border)",
                        color: "var(--text-muted)",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddServiceSubmit}
                      style={{ background: "#8B5CF6", color: "#FFF" }}
                      className="flex-1 py-2 text-xs font-bold rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                    >
                      Save service
                    </button>
                  </div>
                </div>
              )}

              {/* Modal 2: ADD FAQ */}
              {activeModal === "faq" && (
                <div className="space-y-4 font-sans text-left">
                  <h3 className="font-bold text-sm" style={{ color: "var(--text)" }}>Add an FAQ</h3>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold font-sans tracking-wider block" style={{ color: "var(--text-muted)" }}>Customer question</label>
                      <input
                        type="text"
                        placeholder="E.g. timing, parking, coupon code"
                        value={newFAQQuestion}
                        onChange={(e) => setNewFAQQuestion(e.target.value)}
                        className="w-full rounded-xl p-3 text-xs focus:outline-none font-sans"
                        style={{
                          background: "var(--input-bg)",
                          border: "1px solid var(--border)",
                          color: "var(--text)"
                        }}
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold font-sans tracking-wider block" style={{ color: "var(--text-muted)" }}>AI answer</label>
                      <textarea
                        rows={3}
                        placeholder="Write direct informative answers..."
                        value={newFAQAnswer}
                        onChange={(e) => setNewFAQAnswer(e.target.value)}
                        className="w-full rounded-xl p-3 text-xs focus:outline-none font-sans resize-none"
                        style={{
                          background: "var(--input-bg)",
                          border: "1px solid var(--border)",
                          color: "var(--text)"
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveModal(null)}
                      className="flex-1 py-2 text-xs font-bold rounded-xl cursor-pointer transition-all border"
                      style={{
                        background: "var(--bg-card)",
                        borderColor: "var(--border)",
                        color: "var(--text-muted)",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddFAQSubmit}
                      style={{ background: "#8B5CF6", color: "#FFF" }}
                      className="flex-1 py-2 text-xs font-bold rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                    >
                      Save FAQ
                    </button>
                  </div>
                </div>
              )}

              {/* Modal 3: ADD MEMBERSHIP PLAN */}
              {activeModal === "membership" && (
                <div className="space-y-4">
                  <h3 className="font-bold text-sm font-sans text-left" style={{ color: "var(--text)" }}>Add membership plan</h3>
                  <div className="space-y-3 font-sans text-left">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold font-sans tracking-wider block" style={{ color: "var(--text-muted)" }}>Plan Title</label>
                      <input
                        type="text"
                        placeholder="E.g. VIP Quarterly Membership"
                        value={newPlanName}
                        onChange={(e) => setNewPlanName(e.target.value)}
                        className="w-full rounded-xl p-3 text-xs focus:outline-none font-sans"
                        style={{
                          background: "var(--input-bg)",
                          border: "1px solid var(--border)",
                          color: "var(--text)"
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold font-sans tracking-wider block" style={{ color: "var(--text-muted)" }}>Price</label>
                      <input
                        type="text"
                        placeholder="E.g. ₹4,999/quarterly"
                        value={newPlanCost}
                        onChange={(e) => setNewPlanCost(e.target.value)}
                        className="w-full rounded-xl p-3 text-xs focus:outline-none font-sans"
                        style={{
                          background: "var(--input-bg)",
                          border: "1px solid var(--border)",
                          color: "var(--text)"
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveModal(null)}
                      className="flex-1 py-2 text-xs font-bold rounded-xl cursor-pointer transition-all border"
                      style={{
                        background: "var(--bg-card)",
                        borderColor: "var(--border)",
                        color: "var(--text-muted)",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddPlanSubmit}
                      style={{ background: "#8B5CF6", color: "#FFF" }}
                      className="flex-1 py-2 text-xs font-bold rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                    >
                      Save plan
                    </button>
                  </div>
                </div>
              )}

              {/* Modal 4: CONNECT WHATSAPP */}
              {activeModal === "whatsapp" && (
                <div className="space-y-4 font-sans text-center">
                  <h3 className="font-bold text-center text-sm" style={{ color: "var(--text)" }}>Connect WhatsApp</h3>
                  <p className="text-[11px] text-left" style={{ color: "var(--text-muted)" }}>
                    Scan this QR code to register your WhatsApp number directly to the Autofy network.
                  </p>
                  
                  <div className="p-4 bg-white rounded-2xl max-w-[150px] mx-auto flex items-center justify-center">
                    <QrCode className="w-28 h-28 text-black" />
                  </div>

                  <p className="text-[10.5px] text-left" style={{ color: "var(--text-subtle)" }}>
                    After scanning, your phone will start receiving simulated customer chats instantly.
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveModal(null)}
                      className="flex-1 py-2 text-xs font-bold rounded-xl cursor-pointer transition-all border"
                      style={{
                        background: "var(--bg-card)",
                        borderColor: "var(--border)",
                        color: "var(--text-muted)",
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => {
                        setData(prev => ({ ...prev, whatsappConnected: "connected" }));
                        setActiveModal(null);
                        setActivityFeed(prev => [
                          { id: Date.now(), type: "response", text: "WhatsApp sandbox handset QR synced successfully", time: "Just Now" },
                          ...prev
                        ]);
                      }} 
                      style={{ background: "#8B5CF6", color: "#FFF" }}
                      className="flex-1 py-2 text-xs font-bold rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                    >
                      Mark as connected
                    </button>
                  </div>
                </div>
              )}

              {/* Modal 5: CREATE PAYMENT LINK */}
              {activeModal === "payment" && (
                <div className="space-y-4 font-sans text-left">
                  <h3 className="font-bold text-sm" style={{ color: "var(--text)" }}>Create payment link</h3>
                  
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold font-sans tracking-wider block" style={{ color: "var(--text-muted)" }}>Description</label>
                      <input
                        type="text"
                        placeholder="E.g. VIP Consultation Fee, Premium Service Package"
                        value={newPayDesc}
                        onChange={(e) => setNewPayDesc(e.target.value)}
                        className="w-full rounded-xl p-3 text-xs focus:outline-none font-sans"
                        style={{
                          background: "var(--input-bg)",
                          border: "1px solid var(--border)",
                          color: "var(--text)"
                        }}
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold font-sans tracking-wider block" style={{ color: "var(--text-muted)" }}>Amount in ₹</label>
                      <input
                        type="text"
                        placeholder="E.g. 4999 (Do not insert currency symbol)"
                        value={newPayAmount}
                        onChange={(e) => setNewPayAmount(e.target.value)}
                        className="w-full rounded-xl p-3 text-xs focus:outline-none font-sans"
                        style={{
                          background: "var(--input-bg)",
                          border: "1px solid var(--border)",
                          color: "var(--text)"
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveModal(null)}
                      className="flex-1 py-2 text-xs font-bold rounded-xl cursor-pointer transition-all border text-neutral-400"
                      style={{
                        background: "var(--bg-card)",
                        borderColor: "var(--border)",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreatePaymentSubmit}
                      style={{ background: "#8B5CF6", color: "#FFF" }}
                      className="flex-1 py-2 text-xs font-bold rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                    >
                      Generate link
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Emergency Kill Switch Modal */}
      <AnimatePresence>
        {aiKillConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-xl ${globalAiEnabled ? "bg-red-500/10 text-red-400" : "bg-blue-500/10 text-blue-400"}`}>
                    <Power className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-black text-[var(--text)]">
                    {globalAiEnabled ? "Disable Global AI Auto-Reply?" : "Enable Global AI Auto-Reply?"}
                  </h3>
                </div>
                <button
                  onClick={() => setAiKillConfirmOpen(false)}
                  className="p-1 text-[var(--text-subtle)] hover:text-[var(--text)] rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                {globalAiEnabled
                  ? "This will instantly pause ALL automated AI responses across all customer threads. Incoming messages will still be logged for human support representatives. Your WhatsApp connection remains active."
                  : "This will re-enable automated AI replies for incoming customer inquiries on WhatsApp."}
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setAiKillConfirmOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[var(--text-subtle)] hover:text-[var(--text)] rounded-xl border border-[var(--border)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setAiToggleLoading(true);
                    const newState = !globalAiEnabled;
                    try {
                      if (isAuthenticated()) {
                        await api.patch("/api/v1/business/ai-kill-switch", { enabled: newState });
                      }
                      setGlobalAiEnabled(newState);
                      triggerDashboardNotification(
                        newState ? "AI Auto-Reply enabled globally" : "🚨 EMERGENCY: AI Auto-Reply disabled globally"
                      );
                    } catch {
                      triggerDashboardNotification("Failed to toggle AI status");
                    } finally {
                      setAiToggleLoading(false);
                      setAiKillConfirmOpen(false);
                    }
                  }}
                  disabled={aiToggleLoading}
                  className={`px-4 py-2 text-xs font-black rounded-xl text-white shadow-lg transition-all cursor-pointer ${
                    globalAiEnabled
                      ? "bg-red-600 hover:bg-red-500 shadow-red-500/10"
                      : "bg-blue-600 hover:bg-blue-500 shadow-blue-500/10"
                  } ${aiToggleLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {aiToggleLoading ? "Updating..." : globalAiEnabled ? "Yes, Pause AI Auto-Reply" : "Yes, Enable AI Auto-Reply"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile bottom navigation drawer */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-45 flex items-center justify-around px-1 py-2 border-t"
        style={{ background: "var(--sidebar)", borderColor: "var(--border)" }}
      >
        {([
          { id: "overview",       label: "Home",     Icon: LayoutDashboard },
          { id: "conversations",  label: "Chats",    Icon: MessageSquare },
          { id: "leads",          label: "Leads",    Icon: Users },
          { id: "payments",       label: "Pay",      Icon: DollarSign },
          { id: "settings",       label: "Settings", Icon: Settings },
        ] as const).map(({ id, label, Icon }) => {
          const active = currentTab === id;
          return (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[52px]"
              style={{ color: active ? "#8B5CF6" : "var(--text-subtle)", background: "transparent", border: "none" }}
            >
              <Icon className="w-5 h-5" />
              <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.04em" }}>{label}</span>
            </button>
          );
        })}
      </nav>

    </div>
  );
};
