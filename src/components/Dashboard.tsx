import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Sun, Moon, LayoutDashboard, X, Bot, Menu } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
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
  Smartphone
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

const TAB_TITLES: Record<string, string> = {
  overview: "Dashboard",
  owner_center: "Owner Control Center",
  business_setup: "Business Setup",
  conversations: "Conversations",
  inventory: "Products & Inventory",
  orders: "Orders",
  crm: "CRM",
  ai_training: "AI Training",
  marketing: "Marketing Automation",
  support_tickets: "Support Tickets",
  mobile_audit: "Mobile Audit",
  memberships: "Membership Plans",
  faqs: "FAQ Management",
  whatsapp_setup: "WhatsApp Setup",
  leads: "Leads",
  appointments: "Appointments",
  payments: "Payments",
  ai_playground: "AI Playground",
  kb: "Knowledge Base",
  analytics: "Analytics",
  integrations: "Integrations",
  customer_portal: "Customer Portal",
  admin_super: "Super Admin",
  notifications: "Notifications",
  deployment: "Deployment",
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

  // States for shared knowledge items to sync across sub-components live
  const [servicesList, setServicesList] = useState<any[]>([
    { id: "svc-1", name: "Personal Training Session", price: "₹2,500", duration: "Monthly", status: "Active" },
    { id: "svc-2", name: "Elite Strength & Conditioning", price: "₹4,500", duration: "Bi-Monthly", status: "Active" },
    { id: "svc-3", name: "Yoga Masterclass Passes", price: "₹3,500", duration: "Quarterly", status: "Active" }
  ]);

  const [productsList, setProductsList] = useState<any[]>([
    { id: "p-1", name: "AEW Exhaust", category: "Exhausts", price: "₹6,500", stockQuantity: 12, isAvailable: true, description: "Genuine premium stainless steel free-flow exhaust with dB killer.", imagesCount: 4 },
    { id: "p-2", name: "Heavy Duty Knee Wraps", category: "Accessories", price: "₹1,200", stockQuantity: 34, isAvailable: true, description: "Professional powerlifting knee wraps approved for local lifting tournaments.", imagesCount: 2 },
    { id: "p-3", name: "Premium Whey HydroIsolate", category: "Suits & Apparel", price: "₹5,400", stockQuantity: 8, isAvailable: true, description: "Elite level muscle synthesis protein loaded with natural BCAAs.", imagesCount: 1 }
  ]);

  const [membershipPlans, setMembershipPlans] = useState<any[]>([
    { id: "plan-1", name: "3 Month AC Membership", duration: "3 Months", price: "₹5,000", benefits: "Full floor access, steam room, 4 guidance cards", availability: "Available" },
    { id: "plan-2", name: "Annual Premium Pass", duration: "12 Months", price: "₹18,000", benefits: "Locker key, personalized plans, free supplements kit", availability: "Available" }
  ]);

  const [faqsList, setFaqsList] = useState<any[]>([
    { id: "f-1", q: "What are your standard studio fitness timings?", a: "We operate 6:00 AM - 10:00 PM Monday-Saturday, Sunday Closed.", category: "Timing", priority: "High" },
    { id: "f-2", q: "Do you offer direct personal training options?", a: "Yes absolutely! Our personal trainers charge ₹2,500/month for complete guidance.", category: "Coaching", priority: "High" },
    { id: "f-3", q: "Is there vehicle parking facilities?", a: "Yes, we offer complimentary 2-wheeler and 4-wheeler parking for our active members.", category: "Facility", priority: "Medium" }
  ]);

  const [policies, setPolicies] = useState<any>({
    refund: "Standard cancellations / refunds are fully processed inside 24 hours of first session booking.",
    cancellation: "Please provide a minimum 6-hour warning notice ahead of scheduling changes to avoid seat fee locks.",
    hours: "6:00 AM - 10:00 PM Monday through Saturday.",
    delivery: "Pan-India shipping occurs inside 3 to 5 business days matching BlueDart freight guidelines.",
    shipping: "Standard freight charges calculated dynamically at checkout check. Active promotions apply."
  });

  const [uploadedDocs, setUploadedDocs] = useState<any[]>([
    { name: "Gym_Facility_Guide.pdf", size: "1.2 MB", uploadDate: "Today, 10:02 AM", pages: 4, extracted: 14 },
    { name: "Supplements_Catalog.docx", size: "380 KB", uploadDate: "Yesterday, 3:12 PM", pages: 2, extracted: 8 }
  ]);

  // Dashboard state to push alerts
  const [dashboardAlert, setDashboardAlert] = useState<string | null>(null);

  const triggerDashboardNotification = (txt: string) => {
    setDashboardAlert(txt);
    setTimeout(() => {
      setDashboardAlert(null);
    }, 4000);
  };
  
  // Mock Conversations (WhatsApp style previews)
  const [conversations, setConversations] = useState<any[]>([
    {
      id: "c1",
      name: "Priya Patel",
      phone: "+91 98765 01234",
      lastMessage: "Sounds perfect. Scheduled for tomorrow 4:00 PM",
      time: "10:14 AM",
      status: "Replied",
      unread: false,
      history: [
        { sender: "user", text: "Hey! Do you have slots open tomorrow?", time: "10:10 AM" },
        { sender: "bot", text: "Yes Priya! We have slots open at 11:30 AM and 4:00 PM. Would you like to lock tomorrow 4:00 PM?", time: "10:11 AM" },
        { sender: "user", text: "Yes please lock that slot for me.", time: "10:13 AM" },
        { sender: "bot", text: "Fantastic! Your appointment is successfully locked and synced. Looking forward to hosting you!", time: "10:14 AM" }
      ]
    },
    {
      id: "c2",
      name: "Rahul Sharma",
      phone: "+91 91234 56789",
      lastMessage: "Is there any direct UPI pay option available?",
      time: "09:42 AM",
      status: "Waiting",
      unread: true,
      history: [
        { sender: "user", text: "Hello, looking to register for the Premium Membership.", time: "09:40 AM" },
        { sender: "bot", text: "Awesome choice! We support instant enrollment. Our plan is ₹4,999 per quarter.", time: "09:41 AM" },
        { sender: "user", text: "Is there any direct UPI pay option available?", time: "09:42 AM" }
      ]
    },
    {
      id: "c3",
      name: "Amit Verma",
      phone: "+91 85544 32109",
      lastMessage: "Can a human agent escalate my request?",
      time: "Yesterday",
      status: "Escalated",
      unread: false,
      history: [
        { sender: "user", text: "I need to request a complete change structure for my corporate plan.", time: "4:30 PM" },
        { sender: "bot", text: "I can assist you with our list of custom services! What specific packages are you looking to replace?", time: "4:31 PM" },
        { sender: "user", text: "Can a human agent escalate my request?", time: "4:52 PM" },
        { sender: "bot", text: "Understood. I have flagged your chat for urgent manual review. A human manager will ping you on WhatsApp soon.", time: "4:53 PM" }
      ]
    },
    {
      id: "c4",
      name: "Ananya Saxena",
      phone: "+91 74011 22334",
      lastMessage: "Thank you, that answers all my queries!",
      time: "Yesterday",
      status: "Replied",
      unread: false,
      history: [
        { sender: "user", text: "Where can I park my vehicle?", time: "11:10 AM" },
        { sender: "bot", text: "We have dedicated, free basement parking for all our clients. Just tell the gate operator you are visiting our office!", time: "11:12 AM" },
        { sender: "user", text: "Thank you, that answers all my queries!", time: "11:15 AM" }
      ]
    }
  ]);

  // Lead Pipeline Registry
  const [leads, setLeads] = useState<any[]>([
    { id: "l1", name: "Rahul Sharma", phone: "+91 91234 56789", source: "WhatsApp Chat", status: "Interested", date: "June 20, 10:14 AM" },
    { id: "l2", name: "Priya Patel", phone: "+91 98765 01234", source: "Direct Link", status: "Converted", date: "June 20, 08:30 AM" },
    { id: "l3", name: "Amit K. Verma", phone: "+91 85544 32109", source: "Instagram DM", status: "Contacted", date: "June 19, 04:52 PM" },
    { id: "l4", name: "Ananya Saxena", phone: "+91 74011 22334", source: "WhatsApp Chat", status: "Interested", date: "June 19, 11:15 AM" }
  ]);

  // Appointments Agenda state
  const [appointments, setAppointments] = useState<any[]>([
    { id: "a1", client: "Priya Patel", phone: "+91 98765 01234", service: "Premium Consultation", time: "Today, 4:00 PM", status: "Today" },
    { id: "a2", client: "Rohit Grover", phone: "+91 90245 11122", service: "Standard Membership Kickoff", time: "June 22, 11:30 AM", status: "Upcoming" },
    { id: "a3", client: "Ananya Saxena", phone: "+91 74011 22334", service: "Trial Session", time: "Yesterday, 3:00 PM", status: "Completed" }
  ]);

  // Tab routing
  const navigate = useNavigate();
  const location = useLocation();
  const currentTab = location.pathname.split("/")[2] || "overview";
  
  // Mobile sidebar drawer state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Simulated Loading state for Skeletons
  const [isTabLoading, setIsTabLoading] = useState(true);
  useEffect(() => {
    setIsTabLoading(true);
    const t = setTimeout(() => setIsTabLoading(false), 800);
    return () => clearTimeout(t);
  }, [currentTab]);

  // Statistics counters
  const [leadsCount, setLeadsCount] = useState(0);
  const [convsCount, setConvsCount] = useState(0);
  const [apptsCount, setApptsCount] = useState(0);
  const [revCount, setRevCount] = useState(0);

  useEffect(() => {
    if (isTabLoading || currentTab !== "overview") return;
    
    // reset counts to 0
    setLeadsCount(0);
    setConvsCount(0);
    setApptsCount(0);
    setRevCount(0);

    const targetLeads = leads.length;
    const targetConvs = conversations.length;
    const targetAppts = appointments.length;
    const targetRev = 24965;

    let leadStep = 0;
    let convStep = 0;
    let apptStep = 0;
    let revStep = 0;

    const interval = setInterval(() => {
      leadStep = leadStep < targetLeads ? leadStep + 1 : targetLeads;
      convStep = convStep < targetConvs ? convStep + 1 : targetConvs;
      apptStep = apptStep < targetAppts ? apptStep + 1 : targetAppts;
      
      const rStep = Math.ceil((targetRev - revStep) / 10);
      revStep = revStep < targetRev ? revStep + rStep : targetRev;

      setLeadsCount(leadStep);
      setConvsCount(convStep);
      setApptsCount(apptStep);
      setRevCount(revStep);

      if (leadStep === targetLeads && convStep === targetConvs && apptStep === targetAppts && revStep === targetRev) {
        clearInterval(interval);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [isTabLoading, currentTab, leads.length, conversations.length, appointments.length]);

  
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

  const [selectedChatId, setSelectedChatId] = useState<string>("c1");
  const [chatInput, setChatInput] = useState("");
  const [isBotResponding, setIsBotResponding] = useState(false);

  // Active conversations state lookup
  const activeChat = conversations.find(c => c.id === selectedChatId) || conversations[0];

  // Simulated AI Feed events list
  const [activityFeed, setActivityFeed] = useState([
    { id: 1, type: "response", text: "AI answered Priya Patel on WhatsApp regarding parking space", time: "2 mins ago" },
    { id: 2, type: "payment", text: "Payment received from Rahul Sharma (₹4,999) on UPI", time: "12 mins ago" },
    { id: 3, type: "lead", text: "New lead captured: Amit Verma (+91 85544 32109)", time: "1 hr ago" },
    { id: 4, type: "appointment", text: "Appointment booked automatically for tomorrow: Priya Patel", time: "2 hrs ago" },
    { id: 5, type: "kb", text: "Knowledge source updated with 2 additional custom services", time: "4 hrs ago" }
  ]);

  // Notifications bell toggle
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: "New customer lead captured from +91 91234 56789", unread: true },
    { id: 2, text: "UPI Payment of ₹4,999 synchronized securely", unread: true },
    { id: 3, text: "CalSync auto-allotted tomorrow 4:00 PM time slot", unread: false }
  ]);

  const handleRefreshData = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      // Append a lively simulation event
      const randomNames = ["Saurabh Nair", "Meera Sen", "Vikram Rathore", "Divya Pillai"];
      const randomName = randomNames[Math.floor(Math.random() * randomNames.length)];
      const randomPhone = `+91 90055 ${Math.floor(Math.random() * 89999 + 10000)}`;
      
      const newLead = {
        id: "l-" + Date.now(),
        name: randomName,
        phone: randomPhone,
        source: "WhatsApp Live",
        status: "Interested" as const,
        date: "Just Now"
      };

      setLeads(prev => [newLead, ...prev]);

      setActivityFeed(prev => [
        {
          id: Date.now(),
          type: "lead",
          text: `New lead captured: ${randomName} (${randomPhone})`,
          time: "Just Now"
        },
        ...prev
      ]);
    }, 1000);
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

  // Left Menu Items Definition
  const menuItems = [
    { id: "overview", label: "Dashboard", icon: MessageSquare },
    { id: "owner_center", label: "Owner Control Center", icon: Shield, badge: "VIP" },
    { id: "business_setup", label: "Business Setup", icon: Sliders },
    { id: "conversations", label: "Conversations", icon: MessageSquare, badge: conversations.filter(c => c.unread).length || undefined },
    { id: "inventory", label: "Inventory & Products", icon: Package },
    { id: "orders", label: "Orders & Shipping", icon: ShoppingBag },
    { id: "crm", label: "CRM System", icon: Users },
    { id: "ai_training", label: "AI Training Center", icon: Brain },
    { id: "marketing", label: "Marketing Automation", icon: Megaphone },
    { id: "support_tickets", label: "Support Tickets", icon: LifeBuoy },
    { id: "mobile_audit", label: "Mobile Code & Audit", icon: Smartphone },
    { id: "memberships", label: "Membership Plans", icon: CreditCard },
    { id: "faqs", label: "FAQ Management", icon: HelpCircle },
    { id: "whatsapp_setup", label: "WhatsApp Setup", icon: Phone },
    { id: "leads", label: "Leads", icon: Users, badge: leads.length },
    { id: "appointments", label: "Appointments", icon: Calendar, badge: appointments.filter(a => a.status === "Today").length || undefined },
    { id: "payments", label: "Payments", icon: DollarSign },
    { id: "ai_playground", label: "AI Playground", icon: Sparkles },
    { id: "kb", label: "Knowledge Base", icon: Database },
    { id: "analytics", label: "Analytics", icon: Activity },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  function SidebarContent() {
    return (
      <div className="flex flex-col justify-between h-full">
        <div className="flex flex-col gap-6 overflow-y-auto scrollbar-none">
          {/* Logo */}
          <div className="flex items-center gap-2.5 pt-1">
            <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.1] flex items-center justify-center">
              <Bot className="w-4.5 h-4.5 animate-spin-slow" style={{ color: "var(--brand)" }} />
            </div>
            <div>
              <span className="font-extrabold text-[15px] tracking-tight bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent font-sans">
                Autofy OS
              </span>
              <span className="block text-[8px] font-bold uppercase tracking-widest text-[#EA580C]">
                Active Workspace
              </span>
            </div>
          </div>

          <div className="h-[1.5px] bg-white/[0.03]" />

          {/* Navigation items */}
          <nav className="flex flex-col gap-1 pr-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    handleTabChange(item.id);
                    setIsMobileSidebarOpen(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium tracking-tight transition-all duration-200 cursor-pointer whitespace-nowrap w-full"
                  style={isActive ? {
                    background: "rgba(234,88,12, 0.12)",
                    color: "#EA580C",
                    borderLeft: "2px solid #EA580C",
                    fontWeight: 600,
                  } : {
                    color: "var(--text-muted)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className="ml-auto px-1.5 py-0.5 text-[9px] font-extrabold rounded-full text-center"
                      style={{
                        background: isActive ? "#EA580C" : "var(--bg-card)",
                        color: "#FFF"
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom footer */}
        <div className="pt-4 border-t border-white/[0.04] flex flex-col gap-3">
          {/* Profile Capsule */}
          <div
            className="p-3 rounded-2xl flex items-center gap-3"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
              style={{
                background: "linear-gradient(135deg, #EA580C, #FB923C)",
                color: "#FFF",
              }}
            >
              {data.businessName ? data.businessName[0].toUpperCase() : "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate font-sans text-white">
                {data.businessName || "My Business"}
              </p>
              <span className="inline-block text-[8px] bg-green-500/10 text-green-400 font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider mt-0.5">
                Pro Plan
              </span>
            </div>
          </div>

          {/* Actions row: Theme + Sign out */}
          <div className="flex gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 border border-transparent"
              style={{ background: "var(--input-bg)", color: "var(--text-muted)", width: 36, height: 36 }}
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => { if (window.confirm("Sign out of Autofy?")) onLogout(); }}
              className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer border border-transparent hover:border-red-500/20 hover:bg-red-500/5 hover:text-red-400 text-neutral-400"
            >
              <LogOut className="w-4 h-4" />
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
      className="w-full min-h-screen flex flex-col md:flex-row font-sans overflow-x-hidden"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      
      {/* MOBILE DRAWER BACKDROP & SIDEBAR */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md md:hidden"
            />
            {/* Sidebar drawer */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.3 }}
              className="fixed top-0 bottom-0 left-0 z-50 w-[240px] flex flex-col justify-between p-5 md:hidden"
              style={{ background: "var(--sidebar)", borderRight: "1px solid var(--border)" }}
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* DESKTOP PERMANENT SIDEBAR */}
      <aside
        className="hidden md:flex flex-col justify-between p-5 flex-shrink-0 relative z-40"
        style={{
          width: "240px",
          background: "var(--sidebar)",
          borderRight: "1px solid var(--border)",
        }}
      >
        <SidebarContent />
      </aside>

      {/* MAIN VIEWPORT BODY */}
      <main className="flex-1 flex flex-col min-w-0 max-h-screen overflow-y-auto relative pb-20 md:pb-0">
        
        {/* Glow ambient background orbs */}
        <div className="hidden md:block absolute top-0 right-1/4 w-[400px] h-[250px] bg-white/[0.012] rounded-full blur-[100px] pointer-events-none" />

        {/* TOP STATUS HEADER BAR */}
        <header
          className="px-6 flex items-center justify-between sticky top-0 backdrop-blur-md z-30"
          style={{
            height: "60px",
            background: "var(--header-bg)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          {/* Left Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-xl border cursor-pointer hover:bg-white/5 transition"
              style={{ borderColor: "var(--border)", color: "var(--text)" }}
            >
              <Menu className="w-4 h-4" />
            </button>
            <div>
              <h1
                className="text-[17px] font-black font-sans tracking-tight"
                style={{ color: "var(--text)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {TAB_TITLES[currentTab] ?? currentTab}
              </h1>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3.5">
            {/* Search Input bar */}
            <div className="relative hidden sm:block">
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search index..."
                className="w-36 focus:w-48 rounded-xl py-1.5 pl-8.5 pr-3 text-xs focus:outline-none transition-all duration-300"
                style={{
                  background: "var(--input-bg)",
                  border: "1px solid var(--border)",
                  color: "var(--text)"
                }}
              />
            </div>

            {/* Preview switch */}
            <div
              className="flex items-center gap-2 rounded-xl px-2.5 py-1 text-xs font-sans border"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-muted)" }}
            >
              <span className="text-[9.5px] font-semibold">Preview Mode</span>
              <button
                onClick={() => setEmptyMode(!emptyMode)}
                className={`w-7 h-4 rounded-full p-0.5 transition-all outline-none ${
                  emptyMode ? "bg-[#EA580C]" : "bg-neutral-800"
                }`}
              >
                <div className={`w-3 h-3 rounded-full bg-white transition-all ${
                  emptyMode ? "translate-x-3" : "translate-x-0"
                }`} />
              </button>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="p-1.5 rounded-xl cursor-pointer hover:bg-white/5 transition flex items-center justify-center"
                style={{
                  background: "var(--input-bg)",
                  border: "1px solid var(--border)",
                  color: "var(--text-muted)",
                  width: 34, height: 34
                }}
              >
                <Bell className="w-4 h-4" />
                {notifications.some(n => n.unread) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C] absolute top-1.5 right-1.5" />
                )}
              </button>

              <AnimatePresence>
                {notificationOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-72 rounded-2xl p-4 shadow-xl z-50 space-y-3"
                    style={{
                      background: "var(--modal-bg)",
                      border: "1px solid var(--border)",
                      boxShadow: "0 20px 40px rgba(0,0,0,0.3)"
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-sans" style={{ color: "var(--text)" }}>Notifications</span>
                      <button 
                        onClick={() => setNotifications(prev => prev.map(n => ({ ...n, unread: false })))}
                        className="text-[9.5px] text-[#9CA3AF] hover:underline font-sans cursor-pointer"
                      >
                        Mark all read
                      </button>
                    </div>
                    <div className="h-[1px] bg-white/[0.05]" />
                    <div className="space-y-2.5 max-h-[220px] overflow-y-auto">
                      {notifications.map((n) => (
                        <div key={n.id} className="flex gap-2 text-[11px] leading-snug">
                          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${n.unread ? "bg-[#EA580C]" : "bg-neutral-700"}`} />
                          <span className={`${n.unread ? "text-neutral-200" : "text-neutral-500"}`}>{n.text}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Avatar circle */}
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow"
              style={{ background: "linear-gradient(135deg, #EA580C, #FB923C)" }}>
              {data.businessName ? data.businessName[0].toUpperCase() : "A"}
            </div>
          </div>
        </header>

        {/* MAIN BODY LAYOUT */}
        <div className="p-6 max-w-7xl w-full mx-auto space-y-8 relative z-10 flex-1">
          
          {/* Toast alert */}
          <AnimatePresence>
            {dashboardAlert && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="fixed top-24 right-5 md:right-10 px-5 py-4 rounded-2xl shadow-2xl z-[100] max-w-sm flex items-center gap-3.5 backdrop-blur-md"
                style={{ background: "var(--modal-bg)", border: "1px solid var(--border-strong)", color: "var(--text)", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: "rgba(34,197,94,0.12)", color: "var(--success)" }}
                ><Check size={14} /></div>
                <div>
                  <h4 className="text-[9px] font-black uppercase tracking-widest leading-none mb-1 text-neutral-400">AUTOFY INSTANT</h4>
                  <p className="text-[11px] text-neutral-200 leading-normal font-semibold">{dashboardAlert}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* EMPTY MODE PREVIEW */}
          {emptyMode ? (
            <div className="space-y-6">
              <div className="p-8 bg-neutral-950/40 border border-var(--border) rounded-3xl backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 max-w-xl text-left">
                  <div className="inline-flex px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 font-extrabold text-[10px] uppercase tracking-widest rounded-full font-mono">
                    Zero Clients Connected
                  </div>
                  <h2 className="text-2xl font-black text-white font-sans tracking-tight">
                    Establish Your First WhatsApp Connection Pipeline
                  </h2>
                  <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                    Welcome to the Autofy Suite sandbox! Currently, your server has no active customer interaction data logs in its pipeline. Follow our clean, 4-step onboarding checklist below to start receiving real-time customers.
                  </p>
                </div>
                
                <div className="p-4 bg-[#0a0a0c] border border-var(--border) rounded-2xl flex items-center gap-3">
                  <QrCode className="w-12 h-12 text-neutral-400 stroke-[1.5]" />
                  <div className="text-left">
                    <p className="text-xs font-extrabold text-white">Meta API Quick-Sync</p>
                    <p className="text-[10px] text-neutral-500 font-mono">Scan QR code to connect Sandbox</p>
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
                    className="p-5 bg-neutral-950/60 border border-neutral-950 hover:border-var(--border) rounded-3xl backdrop-blur-md flex flex-col justify-between gap-5 transition-all text-left"
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
                      <h3 className="text-xs font-black text-white font-sans tracking-tight">{item.title}</h3>
                      <p className="text-[10.5px] text-neutral-500 leading-normal font-sans">{item.desc}</p>
                    </div>

                    <button 
                      onClick={item.action}
                      disabled={item.done && item.step === "1"}
                      className={`w-full py-2 rounded-xl text-[10.5px] font-bold font-sans cursor-pointer transition-all ${
                        item.done 
                          ? "bg-var(--bg-elevated) text-neutral-400 border border-var(--border) hover:text-white" 
                          : "bg-blue-600 hover:bg-blue-500 text-white"
                      }`}
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
                    <div className="space-y-8">
                    
                    {/* SKELETON LOADER STATE */}
                    {isTabLoading ? (
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        {[1, 2, 3, 4].map(id => (
                          <div key={id} className="p-6 rounded-2xl border shimmer bg-var(--bg-elevated)/50" style={{ borderColor: "var(--border)", height: 130 }} />
                        ))}
                      </div>
                    ) : (
                      /* KPI Cards grid */
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                        {[
                          { title: "Total Conversations", value: conversations.length.toString(), trend: "+12%", trendUp: true, icon: MessageSquare },
                          { title: "Active Leads", value: leads.length.toString(), trend: "+8%", trendUp: true, icon: Users },
                          { title: "Revenue This Month", value: `₹24,965`, trend: "+20%", trendUp: true, icon: DollarSign },
                          { title: "Response Rate", value: "99.8%", trend: "+0.5%", trendUp: true, icon: Activity }
                        ].map((card, id) => {
                          const Icon = card.icon;
                          return (
                            <div
                              key={id}
                              className="p-6 rounded-2xl border relative overflow-hidden group transition-all duration-300 transform hover:-translate-y-0.5 text-left"
                              style={{ background: "var(--bg-card)", borderColor: "var(--border)", padding: "24px" }}
                            >
                              <div className="flex items-center justify-between mb-3 w-full">
                                <span className="text-[10px] font-extrabold uppercase tracking-widest font-sans" style={{ color: "var(--text-subtle)" }}>{card.title}</span>
                                <Icon className="w-5 h-5 opacity-30 shrink-0" style={{ color: "var(--text)" }} />
                              </div>

                              <p className="text-3xl font-black tracking-tight font-sans text-white" style={{ fontWeight: 800 }}>
                                {card.value}
                              </p>
                              
                              <div className="flex items-center gap-1 mt-2 text-[12px] font-bold" style={{ color: card.trendUp ? "var(--success)" : "var(--danger)" }}>
                                {card.trend}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Quick actions bar */}
                    <div className="bg-neutral-950/40 border border-var(--border) rounded-3xl p-6 backdrop-blur-md">
                      <div className="flex items-center gap-2.5 mb-4 text-left">
                        <SlidersHorizontal className="w-4 h-4" style={{ color: "var(--brand)" }} />
                        <h3 className="text-xs font-black text-white font-sans uppercase tracking-wider">Quick actions console</h3>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <button onClick={() => setActiveModal("service")} className="px-3.5 py-4 bg-var(--bg-elevated) hover:bg-var(--bg-elevated) hover:border-neutral-800 border border-var(--border) rounded-2xl text-left text-xs font-bold font-sans flex flex-col justify-between gap-4 transition-all cursor-pointer text-white">
                          <Plus className="w-5 h-5 text-blue-400" />
                          <span>Add New Service</span>
                        </button>
                        <button onClick={() => setActiveModal("faq")} className="px-3.5 py-4 bg-var(--bg-elevated) hover:bg-var(--bg-elevated) hover:border-neutral-800 border border-var(--border) rounded-2xl text-left text-xs font-bold font-sans flex flex-col justify-between gap-4 transition-all cursor-pointer text-white">
                          <Plus className="w-5 h-5 text-purple-400" />
                          <span>Add Custom FAQ</span>
                        </button>
                        <button onClick={() => setActiveModal("membership")} className="px-3.5 py-4 bg-var(--bg-elevated) hover:bg-var(--bg-elevated) hover:border-neutral-800 border border-var(--border) rounded-2xl text-left text-xs font-bold font-sans flex flex-col justify-between gap-4 transition-all cursor-pointer text-white">
                          <Plus className="w-5 h-5 text-indigo-400" />
                          <span>Add Membership</span>
                        </button>
                        <button onClick={() => setActiveModal("whatsapp")} className="px-3.5 py-4 bg-var(--bg-elevated) hover:bg-var(--bg-elevated) hover:border-neutral-800 border border-var(--border) rounded-2xl text-left text-xs font-bold font-sans flex flex-col justify-between gap-4 transition-all cursor-pointer text-white">
                          <QrCode className="w-5 h-5 text-green-400" />
                          <span>Connect WhatsApp</span>
                        </button>
                        <button onClick={() => setActiveModal("payment")} className="px-3.5 py-4 bg-var(--bg-elevated) hover:bg-var(--bg-elevated) hover:border-neutral-800 border border-var(--border) rounded-2xl text-left text-xs font-bold font-sans flex flex-col justify-between gap-4 transition-all cursor-pointer col-span-2 md:col-span-1 text-white">
                          <DollarSign className="w-5 h-5 text-amber-400" />
                          <span>Create Bill Link</span>
                        </button>
                      </div>
                    </div>

                    {/* Split Grid for Conversations & AI activity logs */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* Left: WhatsApp previews box */}
                      <div className="lg:col-span-2 bg-[#080808]/90 border border-var(--border) rounded-3xl p-6 backdrop-blur-md space-y-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-left">
                            <h3 className="text-xs font-black text-white font-sans uppercase tracking-wider">Recent Interactions (WhatsApp Feed)</h3>
                            <p className="text-[10px] text-neutral-500 font-sans mt-0.5">Click Conversations in sidebar to play live chat</p>
                          </div>
                          <button
                            onClick={() => handleTabChange("conversations")}
                            className="text-[10px] text-blue-400 hover:underline font-bold font-sans flex items-center gap-1 cursor-pointer"
                          >
                            All chats <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="divide-y divide-neutral-900/60 max-h-[300px] overflow-y-auto pr-1">
                          {conversations.map((chat) => (
                            <div
                              key={chat.id}
                              onClick={() => {
                                setSelectedChatId(chat.id);
                                handleTabChange("conversations");
                              }}
                              className="py-3 flex items-start gap-3.5 cursor-pointer hover:bg-white/5 px-2.5 rounded-2xl transition-colors text-left"
                            >
                              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-[11px] font-sans font-bold text-blue-400">
                                {chat.name[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                  <h4 className="text-xs font-black text-white truncate font-sans">{chat.name}</h4>
                                  <span className="text-[9px] text-neutral-500 font-mono font-medium">{chat.time}</span>
                                </div>
                                <p className="text-[11px] text-neutral-400 truncate leading-snug">{chat.lastMessage}</p>
                              </div>

                              <span className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider ${
                                chat.status === "Replied" ? "bg-green-500/10 text-green-400" :
                                chat.status === "Waiting" ? "bg-amber-500/10 text-amber-400 animate-pulse" :
                                "bg-red-500/10 text-red-400"
                              }`}>
                                {chat.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right: AI Activity Event feed ticker */}
                      <div className="bg-var(--bg-card) border border-var(--border) rounded-3xl p-6 flex flex-col justify-between gap-4">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black text-white font-sans uppercase tracking-wider">AI Activity Feed</h3>
                            <button
                              onClick={handleRefreshData}
                              disabled={isRefreshing}
                              className="text-[10px] font-bold text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer bg-transparent border-none"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} /> Sync
                            </button>
                          </div>

                          <div className="space-y-4 max-h-[220px] overflow-y-auto scrollbar-none pr-1">
                            {activityFeed.map((feed) => (
                              <div key={feed.id} className="flex items-start gap-3 text-left">
                                <div className="mt-1 shrink-0">
                                  <span className="w-2 h-2 rounded-full block" style={{
                                    background: feed.type === "payment" ? "var(--success)" : feed.type === "lead" ? "var(--info)" : "var(--brand)"
                                  }} />
                                </div>
                                <div className="space-y-0.5">
                                  <p className="text-[11.5px] text-neutral-300 font-sans leading-relaxed">{feed.text}</p>
                                  <span className="text-[9px] text-neutral-600 font-semibold font-sans">{feed.time}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="p-3 bg-var(--bg-elevated)/60 border border-var(--border) rounded-2xl text-[10px] text-neutral-400 font-sans flex items-center gap-2 text-left">
                          <Activity className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                          <span>Autofy background scheduler is actively running. Keep browser tab open.</span>
                        </div>
                      </div>
                    </div>
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
                    <OwnerControlCenter triggerNotification={triggerDashboardNotification} />
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
              className="bg-[#0a0a10] border border-var(--border) rounded-[20px] p-8 max-w-md w-full space-y-4 shadow-2xl relative"
            >
              {/* Close Button top-right */}
              <button
                onClick={() => setActiveModal(null)}
                className="absolute right-5 top-5 p-1 text-neutral-500 hover:text-white rounded-lg transition"
                style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border)", background: "var(--input-bg)" }}
              >
                <X className="w-4.5 h-4.5" />
              </button>

              {/* Modal 1: ADD SERVICE */}
              {activeModal === "service" && (
                <div className="space-y-4">
                  <h3 className="font-extrabold text-sm font-sans text-left" style={{ color: "var(--text)" }}>Add a service</h3>
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] uppercase font-bold font-sans tracking-wider text-neutral-500">Service Name / Title</label>
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
                      className="flex-1 py-2 text-xs font-bold rounded-xl cursor-pointer transition-all border text-neutral-400"
                      style={{
                        background: "var(--bg-card)",
                        borderColor: "var(--border)",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddServiceSubmit}
                      style={{ background: "#EA580C", color: "#FFF" }}
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
                      <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">Customer question</label>
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
                      <label className="text-[10px] uppercase tracking-wider font-bold text-neutral-500">AI answer</label>
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
                      className="flex-1 py-2 text-xs font-bold rounded-xl cursor-pointer transition-all border text-neutral-400"
                      style={{
                        background: "var(--bg-card)",
                        borderColor: "var(--border)",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddFAQSubmit}
                      style={{ background: "#EA580C", color: "#FFF" }}
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
                      <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">Plan Title</label>
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
                      <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">Price</label>
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
                      className="flex-1 py-2 text-xs font-bold rounded-xl cursor-pointer transition-all border text-neutral-400"
                      style={{
                        background: "var(--bg-card)",
                        borderColor: "var(--border)",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddPlanSubmit}
                      style={{ background: "#EA580C", color: "#FFF" }}
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
                      className="flex-1 py-2 text-xs font-bold rounded-xl cursor-pointer transition-all border text-neutral-400"
                      style={{
                        background: "var(--bg-card)",
                        borderColor: "var(--border)",
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
                      style={{ background: "#EA580C", color: "#FFF" }}
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
                      <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">Description</label>
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
                      <label className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">Amount in ₹</label>
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
                      style={{ background: "#EA580C", color: "#FFF" }}
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
              style={{ color: active ? "#EA580C" : "var(--text-subtle)", background: "transparent", border: "none" }}
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
