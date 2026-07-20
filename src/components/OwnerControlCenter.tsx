import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield,
  Sparkles,
  Users,
  Calendar,
  DollarSign,
  Activity,
  Plus,
  QrCode,
  Upload,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Home,
  Database,
  CheckCircle,
  FileText,
  AlertTriangle,
  Smartphone,
  ChevronRight,
  Search,
  MessageSquare,
  Sparkle,
  Sliders,
  Bell,
  Trash2,
  Clock,
  Briefcase,
  HelpCircle,
  FolderOpen,
  CreditCard,
  Percent,
  Check,
  Send,
  User,
  Zap,
  BookOpen,
  Filter,
  BarChart3,
  RefreshCw,
  Award,
  SlidersHorizontal,
  ThumbsUp,
  MessageCircle,
  Play
} from "lucide-react";

export const OwnerControlCenter: React.FC<{
  triggerNotification?: (txt: string) => void;
}> = ({ triggerNotification }) => {
  // Navigation for high-level layouts
  const [activeLayout, setActiveLayout] = useState<"desktop" | "mobile">("desktop");
  
  // Mobile app simulator controls
  const [deviceModel, setDeviceModel] = useState<"iphone" | "android" | "tablet">("iphone");
  const [mobileTab, setMobileTab] = useState<"home" | "customers" | "messages" | "payments" | "settings">("home");

  // Notifications state
  const [ownerNotifications, setOwnerNotifications] = useState([
    { id: 1, type: "lead", title: "New Lead", msg: "Rohit Deshmukh registered via WhatsApp QR", time: "Just now", read: false },
    { id: 2, type: "payment", title: "New Payment", msg: "₹4,999 received via Razorpay (Super Gym Pass)", time: "12m ago", read: false },
    { id: 3, type: "appointment", title: "Appointment Set", msg: "Dr. Alisha Rao booked for Yoga Trials (June 24)", time: "1h ago", read: true },
    { id: 4, type: "ai", title: "AI Deflection Alert", msg: "Knowledge base matched high confidence discount inquiry", time: "2h ago", read: true },
    { id: 5, type: "escalation", title: "Human Escalation Needed", msg: "Complex shipping refund inquiry from Kabir Sen", time: "3h ago", read: false }
  ]);

  // Business state management for premium interactive experience
  const [services, setServices] = useState([
    { id: "svc-1", name: "Premium Crossfit Coaching", category: "Fitness", price: "₹2,500", duration: "1 Month", status: "Active" },
    { id: "svc-2", name: "Therapeutic Yoga Masterclass", category: "Wellness", price: "₹4,500", duration: "1 Month", status: "Active" },
    { id: "svc-3", name: "Body Composition Analytics", category: "Consultation", price: "₹1,200", duration: "One-Time", status: "Active" }
  ]);

  const [products, setProducts] = useState([
    { id: "p-1", name: "Autofy Smart Gym Shaker v2", category: "Merchandise", price: "₹950", stock: 124, status: "In Stock" },
    { id: "p-2", name: "Premium Whey HydroIsolate x3", category: "Supplements", price: "₹5,400", stock: 18, status: "Low Stock" },
    { id: "p-3", name: "Heavy Duty Wrist Supports", category: "Gear", price: "₹1,100", stock: 0, status: "Out of Stock" }
  ]);

  const [memberships, setMemberships] = useState([
    { id: "m-1", name: "3-Month Elite Warrior Pass", price: "₹6,499", activeMembers: 142, status: "Popular" },
    { id: "m-2", name: "Annual Platinum Syndicate", price: "₹18,999", activeMembers: 68, status: "Featured" }
  ]);

  const [faqs, setFaqs] = useState([
    { id: "faq-1", q: "What are the standard operational hours?", a: "We run 6:00 AM - 10:00 PM Monday through Saturday.", category: "General" },
    { id: "faq-2", q: "Is car parking available?", a: "Yes, free secure underground parking is available for all active card members.", category: "Facility" }
  ]);

  const [uploadedDocsList, setUploadedDocsList] = useState([
    { name: "Summer_Syllabus_2026.pdf", size: "2.4 MB", date: "June 18, 2026", status: "Ingested" },
    { name: "Refund_Merchant_Policy.docx", size: "450 KB", date: "June 20, 2026", status: "Ingested" }
  ]);

  // Payments State
  const [upiId, setUpiId] = useState("pay.autofy@icici");
  const [qrCodeFile, setQrCodeFile] = useState<string | null>(null);
  const [bankAccount, setBankAccount] = useState({ name: "Autofy Technologies Pvt Ltd", bank: "HDFC Bank", acc: "50200049281923", ifsc: "HDFC0000104" });
  const [activeGateway, setActiveGateway] = useState<"razorpay" | "phonepe" | "cashfree">("razorpay");
  const [transactionSearch, setTransactionSearch] = useState("");
  const [transactions, setTransactions] = useState([
    { id: "TXN108200", customer: "Priya Patel", date: "June 21, 2026", method: "Razorpay", amount: "₹4,999", type: "Subscription", status: "Success" },
    { id: "TXN108201", customer: "Rahul Sharma", date: "June 21, 2026", method: "UPI", amount: "₹1,200", type: "Product", status: "Success" },
    { id: "TXN108202", customer: "Rohit Deshmukh", date: "June 20, 2026", method: "Cashfree", amount: "₹2,500", type: "Service", status: "Success" },
    { id: "TXN108203", customer: "Alisha Rao", date: "June 19, 2026", method: "PhonePe", amount: "₹4,500", type: "Service", status: "Refunded" },
    { id: "TXN108204", customer: "Kabir Sen", date: "June 18, 2026", method: "Razorpay", amount: "₹18,999", type: "Subscription", status: "Pending" }
  ]);

  // Reports view variables
  const [reportTimeframe, setReportTimeframe] = useState<"daily" | "weekly" | "monthly" | "yearly">("monthly");
  const [activeReportMetric, setActiveReportMetric] = useState<"revenue" | "leads" | "appointments" | "conversion" | "ai" | "nps">("revenue");

  // AI center states
  const [aiImprovementStatus, setAiImprovementStatus] = useState<"idle" | "optimizing" | "completed">("idle");
  const [knowledgeGaps, setKnowledgeGaps] = useState([
    { query: "Is steam bath open on Sundays?", hits: 14, status: "Critical" },
    { query: "Do you have EMI options?", hits: 9, status: "Medium" }
  ]);

  // Customer state variables
  const [customerQuery, setCustomerQuery] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("c-1");
  const [customers, setCustomers] = useState([
    { id: "c-1", name: "Priya Patel", phone: "+91 98765 01234", tag: "VIP Elite", email: "priya@gmail.com", joined: "May 14, 2026", appointments: 8, payments: 12400, notes: "Prefers morning sessions, prefers quiet Yoga zones.", status: "Active" },
    { id: "c-2", name: "Rahul Sharma", phone: "+91 91234 56789", tag: "Fighter Streak", email: "rahul.s@outlook.com", joined: "April 29, 2026", appointments: 14, payments: 8700, notes: "Requires direct invoice copy on WhatsApp.", status: "Active" },
    { id: "c-3", name: "Alisha Rao", phone: "+91 88200 49301", tag: "Trial Member", email: "alisha@rao.com", joined: "June 10, 2026", appointments: 2, payments: 4500, notes: "Interpreting rehabilitation guidelines for knee alignment.", status: "Active" },
    { id: "c-4", name: "Kabir Sen", phone: "+91 71049 48102", tag: "Silent Buyer", email: "kabir.sen@gmail.com", joined: "June 18, 2026", appointments: 0, payments: 18999, notes: "Enterprise package client, needs quarterly statements.", status: "Pending" }
  ]);

  // Appointments Calendar values
  const [appointmentFilter, setAppointmentFilter] = useState<"all" | "upcoming" | "completed" | "cancelled">("all");
  const [reminderConfig, setReminderConfig] = useState({ whatsapp: true, sms: false, interval: "24h" });
  const [appointmentsList, setAppointmentsList] = useState([
    { id: "apt-1", client: "Priya Patel", date: "2026-06-21", time: "11:30 AM", service: "Premium Crossfit", status: "Completed" },
    { id: "apt-2", client: "Rahul Sharma", date: "2026-06-22", time: "04:00 PM", service: "Therapeutic Yoga", status: "Upcoming" },
    { id: "apt-3", client: "Alisha Rao", date: "2026-06-24", time: "09:00 AM", service: "Yoga Trials", status: "Upcoming" },
    { id: "apt-4", client: "Kabir Sen", date: "2026-06-19", time: "05:30 PM", service: "Personal Session", status: "Cancelled" }
  ]);

  // Chat simulator internally for mobile messages tab
  const [mobileChatInput, setMobileChatInput] = useState("");
  const [mobileChats, setMobileChats] = useState([
    { id: 1, sender: "assistant", text: "Hello Rahul! How can Autofy help you today?", time: "2:04 PM" },
    { id: 2, sender: "client", text: "Can you tell me if the 3-Month Elite plan provides lockers?", time: "2:05 PM" },
    { id: 3, sender: "assistant", text: "Yes absolutely! The Elite Warrior Pass includes direct VIP lockers, steam room access, and free fitness analytics card.", time: "2:05 PM" }
  ]);

  // Interactive forms state
  const [kbSection, setKbSection] = useState<"services" | "products" | "memberships" | "faqs" | "docs">("services");
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Interactive Service Form
  const [formSvcName, setFormSvcName] = useState("");
  const [formSvcPrice, setFormSvcPrice] = useState("");
  const [formSvcDuration, setFormSvcDuration] = useState("1 Month");
  
  // Interactive Product Form
  const [formProdName, setFormProdName] = useState("");
  const [formProdPrice, setFormProdPrice] = useState("");
  const [formProdStock, setFormProdStock] = useState(20);

  // Drag and Drop simulation
  const [dragOver, setDragOver] = useState(false);

  const localNotify = (msg: string) => {
    if (triggerNotification) {
      triggerNotification(msg);
    } else {
      alert(msg);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const newDoc = {
        name: files[0].name,
        size: (files[0].size / (1024 * 1024)).toFixed(1) + " MB",
        date: "Just now",
        status: "Ingested"
      };
      setUploadedDocsList(prev => [newDoc, ...prev]);
      localNotify(`Successfully uploaded and matched knowledge from ${files[0].name}`);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newDoc = {
        name: files[0].name,
        size: (files[0].size / (1024 * 1024)).toFixed(1) + " MB",
        date: "Just now",
        status: "Ingested"
      };
      setUploadedDocsList(prev => [newDoc, ...prev]);
      localNotify(`Ingested knowledge source: ${files[0].name}`);
    }
  };

  const addServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSvcName || !formSvcPrice) return;
    const newSvc = {
      id: "svc-" + Date.now(),
      name: formSvcName,
      category: "Bespeak",
      price: "₹" + formSvcPrice,
      duration: formSvcDuration,
      status: "Active"
    };
    setServices(prev => [...prev, newSvc]);
    setFormSvcName("");
    setFormSvcPrice("");
    setShowAddForm(false);
    localNotify(`Custom service "${formSvcName}" published successfully`);
  };

  const addProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProdName || !formProdPrice) return;
    const newProd = {
      id: "p-" + Date.now(),
      name: formProdName,
      category: "Merchandise",
      price: "₹" + formProdPrice,
      stock: Number(formProdStock),
      status: "In Stock"
    };
    setProducts(prev => [...prev, newProd]);
    setFormProdName("");
    setFormProdPrice("");
    setShowAddForm(false);
    localNotify(`Published smart product "${formProdName}" in active inventory`);
  };

  const triggerImproveAI = () => {
    setAiImprovementStatus("optimizing");
    localNotify("Analysing knowledge gaps and clustering unanswered client queries...");
    setTimeout(() => {
      setAiImprovementStatus("completed");
      setKnowledgeGaps([]);
      localNotify("Autofy core engines optimized! Confidence scores rose from 92.5% to 98.4%");
    }, 2500);
  };

  const sendBroadcastMessage = () => {
    localNotify("Marketing announcement dispatched successfully to 184 prospective leads!");
  };

  const handleMobileChatSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileChatInput.trim()) return;
    
    const userText = mobileChatInput;
    setMobileChats(prev => [...prev, { id: Date.now(), sender: "client", text: userText, time: "Just now" }]);
    setMobileChatInput("");

    setTimeout(() => {
      setMobileChats(prev => [...prev, {
        id: Date.now() + 1,
        sender: "assistant",
        text: `Autofy owner mode is currently intercepting this channel. Checking details regarding "${userText}". How else can we guide you?`,
        time: "Just now"
      }]);
    }, 1000);
  };

  // KPI Calculations
  const calculatedStats = {
    todayLeads: 42,
    todayRevenue: "₹84,500",
    appointments: 18,
    activeChats: 148,
    conversion: "14.8%",
    aiAccuracy: "98.4%"
  };

  const activeCustomer = customers.find(c => c.id === selectedCustomerId) || customers[0];

  return (
    <div id="autofy-owner-control-center-root" className="space-y-6 text-[#A0A2AD]">
      
      {/* 1. BRAND PLATINUM HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#141416]/90 border border-var(--border) rounded-[28px] p-6 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2d2d30] to-[#1a1a1c] border border-white/10 flex items-center justify-center shadow-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight font-sans">Business Command Center</h1>
            <p className="text-xs text-neutral-400 mt-1 font-sans">Manage your entire business, configure integrations, audit AI and trace mobile metrics.</p>
          </div>
        </div>

        {/* HIGH CONTRAST PORTAL CONTROLLER */}
        <div className="flex items-center gap-1.5 bg-[#0A0A0A] border border-var(--border) p-1 rounded-2xl">
          <button
            onClick={() => setActiveLayout("desktop")}
            className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 ${
              activeLayout === "desktop"
                ? "bg-white/10 text-white border border-white/5 shadow-inner"
                : "text-neutral-500 hover:text-white"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Executive Panel</span>
          </button>
          
          <button
            onClick={() => setActiveLayout("mobile")}
            className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 ${
              activeLayout === "mobile"
                ? "bg-white/10 text-white border border-white/5 shadow-inner"
                : "text-neutral-500 hover:text-white"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile Companion</span>
          </button>
        </div>
      </div>

      {/* 2. LAYOUT PORT: EXECUTIVE COMMAND CENTER */}
      {activeLayout === "desktop" && (
        <div id="desktop-executive-layout" className="space-y-8">
          
          {/* SECTION A: SIX TOP KPI CARDS + HEAT SCORE COLOURED PILLS */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            {[
              { id: "leads", label: "Today's Leads", value: calculatedStats.todayLeads, trend: "+18% today", trendUp: true, icon: Users },
              { id: "rev", label: "Today's Revenue", value: calculatedStats.todayRevenue, trend: "+24% today", trendUp: true, icon: DollarSign },
              { id: "apts", label: "Appointments", value: calculatedStats.appointments, trend: "-5% today", trendUp: false, icon: Calendar },
              { id: "conv", label: "Active Convs", value: calculatedStats.activeChats, trend: "+12.4%", trendUp: true, icon: MessageSquare },
              { id: "rate", label: "Conversion Rate", value: calculatedStats.conversion, trend: "+2.4% today", trendUp: true, icon: Percent },
              { id: "accuracy", label: "AI Accuracy", value: calculatedStats.aiAccuracy, trend: "+0.2% today", trendUp: true, icon: Sparkles }
            ].map(card => {
              const CardIcon = card.icon;
              return (
                <div key={card.id} className="p-4 bg-[#141416]/70 border border-var(--border) rounded-[22px] backdrop-blur-md relative overflow-hidden group hover:border-[#2a2a2f] transition-all duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">{card.label}</span>
                    <CardIcon className="w-3.5 h-3.5 text-neutral-400 text-neutral-400" />
                  </div>
                  <h3 className="text-xl font-black text-white font-mono">{card.value}</h3>
                  <div className="flex items-center gap-1 mt-1 text-[9px]">
                    {card.trendUp ? (
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-rose-400" />
                    )}
                    <span className={card.trendUp ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>{card.trend}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* TWO COLUMN GRID: HEALTH MATRIX & QUICK ACTIONS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* COLUMN 1: BUSINESS HEALTH SCORE */}
            <div className="p-6 bg-[#141416]/80 border border-var(--border) rounded-[24px] backdrop-blur-md">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-var(--border)">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-neutral-300" />
                  <h3 className="text-xs font-black text-white uppercase tracking-wider font-sans">Business Health</h3>
                </div>
                <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[9px] font-bold">Excellent</div>
              </div>

              <div className="space-y-4">
                {[
                  { label: "Business Completeness", score: 88, color: "bg-neutral-200" },
                  { label: "AI Readiness & Core Matched", score: 95, color: "bg-emerald-300" },
                  { label: "Customer Response Score", score: 99, color: "bg-neutral-300" },
                  { label: "Average Revenue Growth", score: 72, color: "bg-neutral-400" },
                  { label: "Target Lead Conversion Rate", score: 64, color: "bg-zinc-200" }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-sans">
                      <span className="font-semibold text-neutral-400">{item.label}</span>
                      <span className="font-black text-white font-mono">{item.score}%</span>
                    </div>
                    <div className="h-1.5 bg-neutral-950 rounded-full overflow-hidden border border-var(--border)">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* COLUMN 2: QUICK ACTIONS CONSOLE */}
            <div className="lg:col-span-2 p-6 bg-[#141416]/80 border border-var(--border) rounded-[24px] backdrop-blur-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-var(--border)">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-neutral-300" />
                    <h3 className="text-xs font-black text-white uppercase tracking-wider font-sans">Quick Executive Actions</h3>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-neutral-500">Fast Deploy</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Add Service", desc: "Define pricing cards", icon: Plus, action: () => { setKbSection("services"); localNotify("Navigated to services. Scroll down to Business Knowledge Center."); } },
                    { label: "Add Product", desc: "Load active physical stock", icon: Briefcase, action: () => { setKbSection("products"); localNotify("Navigated to products. Scroll down to Business Knowledge Center."); } },
                    { label: "Add Membership", desc: "Build subscription tiers", icon: CreditCard, action: () => { setKbSection("memberships"); localNotify("Navigated to memberships. Scroll down to Business Knowledge Center."); } },
                    { label: "Upload FAQ", desc: "Teach custom bot replies", icon: HelpCircle, action: () => { setKbSection("faqs"); localNotify("Navigated to FAQs. Scroll down to Business Knowledge Center."); } },
                    { label: "Upload UPI QR", desc: "Fast instant checkout setup", icon: QrCode, action: () => { localNotify("Opened Payments settings segment. Scroll to Payment Center."); } },
                    { label: "Create Offer", desc: "Generate custom checkout discounts", icon: Sparkles, action: () => localNotify("Discount referral code 'SUMMER50' generated and wired to active auto replies.") },
                    { label: "Send Broadcast", desc: "Dispatched direct SMS blasts", icon: Send, action: sendBroadcastMessage },
                    { label: "View Reports", desc: "Generate financial PDFs", icon: BarChart3, action: () => localNotify("Daily CSV export compiled and downloaded. Check download container.") }
                  ].map((act, idx) => {
                    const ActIcon = act.icon;
                    return (
                      <button
                        key={idx}
                        onClick={act.action}
                        className="p-3 text-left bg-[#0A0A0A]/50 border border-var(--border) hover:bg-[#1C1C1E] rounded-xl flex flex-col justify-between h-24 transition-all duration-300 cursor-pointer hover:border-[#3a3a41]"
                      >
                        <div className="w-7 h-7 rounded-lg bg-var(--bg-elevated) border border-neutral-800 flex items-center justify-center">
                          <ActIcon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white font-sans">{act.label}</p>
                          <p className="text-[9px] text-neutral-500 truncate mt-0.5">{act.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 p-3 bg-[#0A0A0A]/40 border border-var(--border) rounded-xl flex items-center justify-between text-[10px] font-sans">
                <span className="flex items-center gap-1.5"><Sparkle className="w-3.5 h-3.5 animate-spin-slow text-yellow-400" /> Automated campaign suggestions are unlocked.</span>
                <span className="font-extrabold text-[#E5E7EB] hover:underline cursor-pointer" onClick={sendBroadcastMessage}>Dispatch Now <ArrowRight size={12} className="inline" /></span>
              </div>
            </div>

          </div>

          {/* TWO COLUMN GRID: KNOWLEDGE CENTER VS PAYMENT SETUP */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* BLOCK 1: BUSINESS KNOWLEDGE CENTER */}
            <div className="p-6 bg-[#141416]/80 border border-var(--border) rounded-[28px] space-y-4">
              <div className="flex items-center justify-between border-b border-var(--border) pb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-white" />
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider font-sans">Business Knowledge Center</h3>
                    <p className="text-[9.5px] text-neutral-500 font-medium">Auto-feeds the WhatsApp assistant with verified facts</p>
                  </div>
                </div>

                <div className="flex bg-[#0A0A0A] border border-var(--border) p-0.5 rounded-lg text-[10px] font-bold">
                  {(["services", "products", "memberships", "faqs", "docs"] as const).map(section => (
                    <button
                      key={section}
                      onClick={() => { setKbSection(section); setShowAddForm(false); }}
                      className={`px-2 py-1 rounded capitalize cursor-pointer font-sans ${
                        kbSection === section ? "bg-white/10 text-white font-black" : "text-neutral-500 hover:text-white"
                      }`}
                    >
                      {section}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 min-h-[180px]">
                
                {/* 1. SERVICES */}
                {kbSection === "services" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-neutral-400">
                      <span>Service (Bespeak & Trial)</span>
                      <span>Price Structure</span>
                    </div>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {services.map(svc => (
                        <div key={svc.id} className="p-2.5 bg-[#0A0A0A]/40 border border-neutral-950 hover:bg-[#0c0c0e] rounded-xl flex items-center justify-between text-xs transition duration-200">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span className="font-bold text-white font-sans">{svc.name}</span>
                          </div>
                          <span className="font-mono font-bold text-white bg-var(--bg-elevated) border border-neutral-800 px-2 py-0.5 rounded">{svc.price} / {svc.duration}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. PRODUCTS */}
                {kbSection === "products" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-neutral-400">
                      <span>Product Unit</span>
                      <span>Pricing & Stocks</span>
                    </div>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {products.map(prod => (
                        <div key={prod.id} className="p-2.5 bg-[#0A0A0A]/40 border border-neutral-950 hover:bg-[#0c0c0e] rounded-xl flex items-center justify-between text-xs transition duration-200">
                          <div>
                            <p className="font-bold text-white font-sans">{prod.name}</p>
                            <p className="text-[9px] text-neutral-500 text-neutral-500 font-mono italic">{prod.category}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-white">{prod.price}</span>
                            <span className={`text-[9.5px] px-1.5 py-0.5 rounded font-bold font-sans ${
                              prod.stock === 0 ? "bg-rose-500/10 text-rose-400" :
                              prod.stock < 20 ? "bg-amber-500/10 text-amber-400" : "bg-[#18181b] text-neutral-400"
                            }`}>{prod.stock} left</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. MEMBERSHIPS */}
                {kbSection === "memberships" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-neutral-400">
                      <span>Card Plan Tier</span>
                      <span>Subscribers Active</span>
                    </div>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {memberships.map(memb => (
                        <div key={memb.id} className="p-2.5 bg-[#0A0A0A]/40 border border-neutral-950 hover:bg-[#0c0c0e] rounded-xl flex items-center justify-between text-xs transition duration-200">
                          <div>
                            <span className="font-bold text-white font-sans">{memb.name}</span>
                            <span className="block text-[8.5px] text-zinc-500 font-black tracking-widest uppercase mt-0.5">{memb.status}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-mono font-black text-white">{memb.price}</p>
                            <p className="text-[9.5px] text-neutral-500">{memb.activeMembers} members active</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. FAQS */}
                {kbSection === "faqs" && (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto font-sans">
                    {faqs.map(item => (
                      <div key={item.id} className="p-3 bg-[#0A0A0A]/40 border border-neutral-950 rounded-xl space-y-1">
                        <p className="text-xs font-black text-white">Q: {item.q}</p>
                        <p className="text-[11px] text-neutral-400 leading-normal">A: {item.a}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* 5. DOCUMENTS & DRAG DROP */}
                {kbSection === "docs" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 max-h-44 overflow-y-auto">
                      {uploadedDocsList.map((doc, index) => (
                        <div key={index} className="p-2.5 bg-[#0A0A0A]/40 border border-neutral-950 rounded-xl flex items-center justify-between text-xs font-sans">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-neutral-400 shrink-0" />
                            <div className="min-w-0">
                              <p className="font-bold text-white truncate">{doc.name}</p>
                              <p className="text-[9px] text-neutral-500 font-mono">{doc.size}</p>
                            </div>
                          </div>
                          <span className="text-[9.5px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 px-1.5 py-0.5 rounded">Ingested</span>
                        </div>
                      ))}
                    </div>

                    {/* DRAG DROP FRAME */}
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`p-4 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center transition-all duration-300 ${
                        dragOver ? "border-white bg-white/[0.04]" : "border-neutral-800 bg-[#0A0A0A]/20"
                      }`}
                    >
                      <Upload className="w-6 h-6 text-neutral-500 mb-1.5 animate-bounce" />
                      <p className="text-[10px] font-bold text-white font-sans">Drag syllabus, schedules or booklets here</p>
                      <p className="text-[9px] text-neutral-500 mt-0.5">Supports PDF, DOCX, XLS, Images</p>
                      
                      <label className="mt-2.5 px-3 py-1 bg-var(--bg-elevated) hover:bg-var(--bg-elevated) border border-neutral-800 text-white text-[9.5px] font-black rounded-lg cursor-pointer">
                        Select File
                        <input type="file" className="hidden" onChange={handleFileSelect} multiple />
                      </label>
                    </div>
                  </div>
                )}

              </div>

              {/* ACTION TOGGLE IN-LINE FORM TO INGEST DATA */}
              {kbSection !== "docs" && (
                <div className="pt-2 border-t border-var(--border)">
                  {showAddForm ? (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-[#0A0A0A]/80 border border-var(--border) rounded-2xl">
                      {kbSection === "services" && (
                        <form onSubmit={addServiceSubmit} className="space-y-3 font-sans">
                          <p className="text-[10px] font-black uppercase text-white tracking-wider">Publish New Bespoke Service</p>
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="text"
                              placeholder="Service Title"
                              required
                              value={formSvcName}
                              onChange={(e) => setFormSvcName(e.target.value)}
                              className="bg-[#121214] border border-neutral-800 focus:border-white/20 text-xs text-white p-2.5 rounded-lg outline-none"
                            />
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono">₹</span>
                              <input
                                type="text"
                                placeholder="Cost card"
                                required
                                value={formSvcPrice}
                                onChange={(e) => setFormSvcPrice(e.target.value)}
                                className="w-full bg-[#121214] border border-neutral-800 focus:border-white/20 text-xs text-white pl-6 pr-2.5 py-2.5 rounded-lg outline-none font-mono"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button type="button" onClick={() => setShowAddForm(false)} className="px-3 py-1.5 text-[10px] uppercase font-bold text-neutral-400 bg-var(--bg-elevated) border border-neutral-800 rounded-lg cursor-pointer">Cancel</button>
                            <button type="submit" className="px-3 py-1.5 text-[10px] uppercase font-black text-black bg-white rounded-lg cursor-pointer">Synchronize Unit</button>
                          </div>
                        </form>
                      )}

                      {kbSection === "products" && (
                        <form onSubmit={addProductSubmit} className="space-y-3 font-sans">
                          <p className="text-[10px] font-black uppercase text-white tracking-wider">Publish Smart Inventory Item</p>
                          <div className="grid grid-cols-3 gap-3">
                            <input
                              type="text"
                              placeholder="Product Name"
                              required
                              value={formProdName}
                              onChange={(e) => setFormProdName(e.target.value)}
                              className="col-span-2 bg-[#121214] border border-neutral-800 focus:border-white/20 text-xs text-white p-2.5 rounded-lg outline-none"
                            />
                            <input
                              type="text"
                              placeholder="₹ Price"
                              required
                              value={formProdPrice}
                              onChange={(e) => setFormProdPrice(e.target.value)}
                              className="bg-[#121214] border border-neutral-800 focus:border-white/20 text-xs text-white p-2.5 rounded-lg outline-none font-mono"
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button type="button" onClick={() => setShowAddForm(false)} className="px-3 py-1.5 text-[10px] uppercase font-bold text-neutral-400 bg-var(--bg-elevated) border border-neutral-800 rounded-lg cursor-pointer">Cancel</button>
                            <button type="submit" className="px-3 py-1.5 text-[10px] uppercase font-black text-black bg-white rounded-lg cursor-pointer">Save and sync</button>
                          </div>
                        </form>
                      )}

                      {kbSection === "memberships" && (
                        <div className="space-y-3">
                          <p className="text-[10px] font-black text-neutral-400 uppercase">Subscription Card Generator</p>
                          <div className="flex items-center gap-2">
                            <input type="text" placeholder="Platinum, Super VIP, Annual" className="flex-1 bg-[#121214] border border-neutral-800 text-xs text-white p-2.5 rounded-lg outline-none" />
                            <button onClick={() => { setShowAddForm(false); localNotify("Created custom membership preset card."); }} className="bg-white text-black text-xs font-bold px-3 py-2.5 rounded-lg cursor-pointer">Build Tier</button>
                          </div>
                        </div>
                      )}

                      {kbSection === "faqs" && (
                        <div className="space-y-3 font-sans">
                          <p className="text-[10px] font-black text-neutral-400 uppercase">Interactive QA Trigger</p>
                          <input type="text" placeholder="Keyword / Training inquiry..." className="w-full bg-[#121214] border border-neutral-800 text-xs text-white p-2.5 rounded-lg outline-none" />
                          <textarea rows={2} placeholder="Accurate automatic reply template..." className="w-full bg-[#121214] border border-neutral-800 text-xs text-white p-2.5 rounded-lg outline-none" />
                          <div className="flex gap-2 justify-end">
                            <button type="button" onClick={() => setShowAddForm(false)} className="px-3.5 py-1 text-xs bg-var(--bg-elevated) rounded-lg text-neutral-400 cursor-pointer">Abort</button>
                            <button onClick={() => { setShowAddForm(false); localNotify("QA preset logged successfully."); }} className="px-3.5 py-1 text-xs bg-white text-black font-black rounded-lg cursor-pointer">Publish Reply</button>
                          </div>
                        </div>
                      )}

                    </motion.div>
                  ) : (
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="w-full py-2 bg-[#0A0A0A]/60 hover:bg-[#121214] border border-var(--border) rounded-xl text-xs font-black text-white font-sans flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-neutral-400" />
                      <span>Configure bespoke {kbSection} unit</span>
                    </button>
                  )}
                </div>
              )}

            </div>

            {/* BLOCK 2: PAYMENT CENTER Setup & Transaction history */}
            <div className="p-6 bg-[#141416]/80 border border-var(--border) rounded-[28px] space-y-4">
              <div className="flex items-center justify-between border-b border-var(--border) pb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-white" />
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider font-sans">Payment Config & Sync</h3>
                    <p className="text-[9.5px] text-neutral-500 font-medium">Verify direct merchant gate routing and invoices</p>
                  </div>
                </div>

                {/* Gateway selected badges */}
                <span className="text-[9px] font-black bg-white/10 text-white border border-white/5 px-2 py-0.5 rounded-full uppercase font-mono tracking-widest">{activeGateway} Pipeline</span>
              </div>

              {/* Merchant Details Tabs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Configuration side */}
                <div className="space-y-3 font-sans">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-black text-neutral-500 tracking-wider">Direct UPI VPA ID</label>
                    <div className="flex">
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="bg-[#0A0A0A] border border-var(--border) p-2 text-xs text-white placeholder-neutral-600 rounded-l-xl w-full focus:outline-none focus:border-neutral-700 font-mono"
                      />
                      <button onClick={() => localNotify(`UPI handle updated to ${upiId}`)} className="bg-white text-black p-2 rounded-r-xl font-bold text-xs shrink-0 cursor-pointer">Save</button>
                    </div>
                  </div>

                  <div className="p-3 bg-[#0a0a0c]/60 border border-var(--border) rounded-xl space-y-1 text-[11px]">
                    <p className="text-neutral-400 font-bold flex items-center gap-1.5"><Sliders className="w-3.5 h-3.5" /> Bank Payout Card:</p>
                    <p className="text-white truncate font-extrabold">{bankAccount.name}</p>
                    <p className="text-neutral-500 font-mono text-[10px]">{bankAccount.bank} | Acc: {bankAccount.acc.substring(0,4)}...{bankAccount.acc.substring(10)}</p>
                  </div>

                  {/* Merchant Gateway Setup */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase font-bold text-neutral-500 tracking-wider">Payment Gateway Integration</label>
                    <div className="flex bg-[#0A0A0A] border border-var(--border) p-0.5 rounded-xl text-[10px] font-bold">
                      {(["razorpay", "phonepe", "cashfree"] as const).map(gateway => (
                        <button
                          key={gateway}
                          onClick={() => { setActiveGateway(gateway); localNotify(`Channel toggled to secure ${gateway} settlement.`); }}
                          className={`flex-1 py-1.5 rounded capitalize font-mono cursor-pointer ${
                            activeGateway === gateway ? "bg-white/15 text-white" : "text-neutral-500 text-neutral-500 text-neutral-500 hover:text-white"
                          }`}
                        >
                          {gateway}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Live QR visualization & Quick invoice */}
                <div className="p-4 bg-[#0A0A0A]/40 border border-var(--border) rounded-2xl flex flex-col justify-between items-center text-center">
                  <div className="w-24 h-24 bg-white p-1.5 rounded-xl flex items-center justify-center relative group">
                    <QrCode className="w-full h-full text-black" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-xl cursor-pointer">
                      <Upload className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-white mt-2 font-sans">Corporate UPI QR Frame</p>
                    <p className="text-[9px] text-neutral-500 font-mono">Linked to {upiId}</p>
                  </div>

                  <button
                    onClick={() => {
                      const randAmt = Math.floor(1000 + Math.random() * 4000);
                      localNotify(`Instant trial Checkout link for ₹${randAmt} generated. Wired to WhatsApp broadcast list.`);
                    }}
                    className="w-full mt-2.5 py-1.5 bg-var(--bg-elevated) border border-neutral-800 hover:bg-var(--bg-elevated) rounded-lg text-[9.5px] font-black text-white uppercase tracking-wider font-sans cursor-pointer"
                  >
                    Generate bill link
                  </button>
                </div>

              </div>

              {/* SUB TABLE: TRANSACTION REGISTRY SEARCH */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9.5px] uppercase font-black text-neutral-400 tracking-wider">Interactive Settlement Log</span>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search transactions..."
                      value={transactionSearch}
                      onChange={(e) => setTransactionSearch(e.target.value)}
                      className="bg-neutral-950 border border-var(--border) rounded-lg text-[9px] py-1 pl-7 pr-2.5 text-white focus:outline-none w-36 font-sans focus:border-neutral-700"
                    />
                  </div>
                </div>

                <div className="border border-var(--border) rounded-2xl overflow-hidden overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[11px] font-sans">
                    <thead>
                      <tr className="bg-[#0A0A0A] text-neutral-500 border-b border-var(--border) text-[10px] uppercase font-bold tracking-wider">
                        <th className="p-2.5">TXN ID</th>
                        <th className="p-2.5">Customer</th>
                        <th className="p-2.5 text-center">Amount</th>
                        <th className="p-2.5 text-center">Gateway</th>
                        <th className="p-2.5 text-right">State</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-900/60 font-mono">
                      {transactions
                        .filter(tx => tx.customer.toLowerCase().includes(transactionSearch.toLowerCase()) || tx.id.includes(transactionSearch))
                        .map(tx => (
                          <tr key={tx.id} className="hover:bg-white/[0.01]">
                            <td className="p-2.5 text-neutral-400 font-extrabold">{tx.id}</td>
                            <td className="p-2.5 text-white font-sans font-semibold">{tx.customer}</td>
                            <td className="p-2.5 text-center text-white font-black">{tx.amount}</td>
                            <td className="p-2.5 text-center text-neutral-400 font-sans font-medium">{tx.method}</td>
                            <td className="p-2.5 text-right font-sans">
                              <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase ${
                                tx.status === "Success" ? "bg-emerald-500/10 text-emerald-400" :
                                tx.status === "Refunded" ? "bg-rose-500/10 text-rose-400" : "bg-amber-500/10 text-amber-400"
                              }`}>{tx.status}</span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </div>

          {/* REPORTS CENTER WITH HISTORIC CHART SELECTOR */}
          <div className="p-6 bg-[#141416]/80 border border-var(--border) rounded-[28px] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-var(--border) pb-3 font-sans">
              <div className="space-y-1">
                <h3 className="text-xs font-black text-white uppercase tracking-wider">Autofy Executive Reports</h3>
                <p className="text-[10px] text-neutral-500 font-semibold">Track historical growth parameters clustered below</p>
              </div>

              {/* TIMEFRAME SELECTORS */}
              <div className="flex items-center gap-1.5 bg-[#000000] border border-var(--border) p-1 rounded-2xl text-[10px] font-bold">
                {(["daily", "weekly", "monthly", "yearly"] as const).map(time => (
                  <button
                    key={time}
                    onClick={() => { setReportTimeframe(time); localNotify(`Recalculating statistics on a ${time} scale.`); }}
                    className={`px-3 py-1.5 rounded-xl capitalize cursor-pointer transition ${
                      reportTimeframe === time ? "bg-white/10 text-white font-black" : "text-neutral-500 hover:text-white"
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            {/* SPLIT GRID: SELECT METRICS AND RENDER PREMIUM BAR GRAPH */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

              {/* Left selectors */}
              <div className="space-y-2 font-sans">
                {[
                  { id: "revenue", label: "Gross Revenue", val: "₹1,42,800", count: "+12.4% vs prev", color: "text-emerald-400" },
                  { id: "leads", label: "Captured Leads", val: "382", count: "89% qualified rate", color: "text-neutral-200" },
                  { id: "appointments", label: "Booked Slots", val: "154 slots", count: "4% cancellation risk", color: "text-neutral-300" },
                  { id: "conversion", label: "Conversion rate", val: "14.82%", count: "Matched AI optimal threshold", color: "text-neutral-400" },
                  { id: "ai", label: "AI Resolution Rate", val: "94.6%", count: "Confidence score ~98.4%", color: "text-zinc-200" },
                  { id: "nps", label: "Satisfaction NPS", val: "4.85 / 5.0", count: "Clustered from 94 surveys", color: "text-white" }
                ].map(metric => (
                  <button
                    key={metric.id}
                    onClick={() => setActiveReportMetric(metric.id as any)}
                    className={`w-full p-3 text-left border rounded-2xl flex items-center justify-between transition-all duration-300 cursor-pointer ${
                      activeReportMetric === metric.id
                        ? "bg-white/10 border-white/15 shadow-[0_4px_20px_rgba(255,255,255,0.03)]"
                        : "bg-[#0A0A0A]/30 border-var(--border)/60 hover:bg-[#0c0c0e]"
                    }`}
                  >
                    <div>
                      <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-wider">{metric.label}</p>
                      <h4 className="text-md font-black text-white mt-1">{metric.val}</h4>
                    </div>
                    <span className="text-[9px] text-neutral-400 text-neutral-400 italic text-right mt-2">{metric.count}</span>
                  </button>
                ))}
              </div>

              {/* Right Graph Rendering Area */}
              <div className="md:col-span-3 p-5 bg-[#0A0A0A]/50 border border-neutral-905 border-var(--border) rounded-[24px] flex flex-col justify-between font-sans min-h-[320px]">
                <div className="flex items-center justify-between mb-4 border-b border-var(--border)/60 pb-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-white" />
                    Interactive Histograms: {activeReportMetric.toUpperCase()} ({reportTimeframe.toUpperCase()})
                  </span>
                  <span className="text-[9.5px] font-mono text-neutral-500 bg-neutral-950 px-2 py-0.5 rounded border border-var(--border)">Live UTC Stream</span>
                </div>

                {/* HISTORICAL GRAPH CHART BODY USING HIGH CONTRAST SVGS FOR MAXIMUM PIXEL ACCURACY */}
                <div className="h-44 w-full flex items-end gap-3 sm:gap-6 px-4 border-b border-var(--border) pb-2 relative">
                  
                  {/* Grid Lines */}
                  <div className="absolute inset-x-0 top-1/4 border-t border-var(--border)/40 pointer-events-none" />
                  <div className="absolute inset-x-0 top-2/4 border-t border-var(--border)/40 pointer-events-none" />
                  <div className="absolute inset-x-0 top-3/4 border-t border-var(--border)/40 pointer-events-none" />

                  {[
                    { label: "Jan", val: 32, labelText: "₹45K" },
                    { label: "Feb", val: 54, labelText: "₹82K" },
                    { label: "Mar", val: 42, labelText: "₹61K" },
                    { label: "Apr", val: 78, labelText: "₹110K" },
                    { label: "May", val: 92, labelText: "₹142K" },
                    { label: "Jun", val: 86, labelText: "₹130K" }
                  ].map((bar, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                      <div className="absolute -top-6 bg-var(--bg-elevated) border border-var(--border) px-1.5 py-0.5 rounded text-[8.5px] font-mono text-white opacity-0 group-hover:opacity-100 transition duration-250 pointer-events-none z-10 shadow">
                        {bar.labelText}
                      </div>
                      <div
                        className={`w-full rounded-t-lg transition-all duration-700 shadow-lg ${
                          index === 5 ? "bg-white shadow-white/[0.04]" : "bg-neutral-800 hover:bg-neutral-700"
                        }`}
                        style={{ height: `${bar.val}%` }}
                      />
                    </div>
                  ))}
                </div>

                {/* X Axis Labels */}
                <div className="flex justify-between items-center px-4 mt-2 text-[10px] text-neutral-500 font-bold font-sans">
                  <span>Jan 2026</span>
                  <span>Feb 2026</span>
                  <span>Mar 2026</span>
                  <span>Apr 2026</span>
                  <span>May 2026</span>
                  <span className="text-white">June 2026 (Active)</span>
                </div>

                {/* Growth Analytics Summary Footer */}
                <div className="mt-4 p-3 bg-[#000000]/60 border border-var(--border) rounded-xl flex items-center justify-between text-xs font-medium">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>Calculated average exponential monthly compound growth rate (MoM): **+24.18%**</span>
                  </div>
                  <span className="text-neutral-500 font-mono text-[10px]">Data updated 2 minutes ago</span>
                </div>
              </div>

            </div>
          </div>

          {/* TWO COLUMN GRID: AI PERFORMANCE VS CUSTOMER MANAGEMENT */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* BLOCK 1: AI PERFORMANCE CENTER */}
            <div className="p-6 bg-[#141416]/80 border border-var(--border) rounded-[28px] flex flex-col justify-between font-sans space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-var(--border) pb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">AI Operations Center</h3>
                  </div>

                  <span className="text-[10px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-1.5 py-0.5 rounded font-black uppercase">98% Deflection</span>
                </div>

                {/* Quick grids */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 bg-[#0A0A0A]/40 border border-var(--border) rounded-xl text-center">
                    <p className="text-[9px] text-neutral-500 uppercase font-black">Questions Answered</p>
                    <h4 className="text-lg font-black text-white mt-1">1,824</h4>
                  </div>
                  <div className="p-2.5 bg-[#0A0A0A]/40 border border-var(--border) rounded-xl text-center">
                    <p className="text-[9px] text-neutral-500 uppercase font-black">Confidence Score</p>
                    <h4 className="text-lg font-black text-white mt-1">98.4%</h4>
                  </div>
                  <div className="p-2.5 bg-[#0A0A0A]/40 border border-var(--border) rounded-xl text-center">
                    <p className="text-[9px] text-rose-400 uppercase font-black">Failed Responses</p>
                    <h4 className="text-lg font-black text-rose-400 mt-1">12</h4>
                  </div>
                  <div className="p-2.5 bg-[#0A0A0A]/40 border border-var(--border) rounded-xl text-center">
                    <p className="text-[9px] text-amber-400 uppercase font-black">Human Escalations</p>
                    <h4 className="text-lg font-black text-amber-400 mt-1">4</h4>
                  </div>
                </div>

                {/* Knowledge gaps table section */}
                <div className="space-y-2">
                  <span className="text-[10.5px] uppercase font-extrabold text-neutral-400 tracking-wider">Intercepted Knowledge Gaps</span>
                  {knowledgeGaps.length > 0 ? (
                    <div className="space-y-1.5">
                      {knowledgeGaps.map((gap, index) => (
                        <div key={index} className="p-2 bg-[#0A0A0A] border border-var(--border) rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <p className="text-white font-bold">"{gap.query}"</p>
                            <p className="text-[9px] text-[#A0A2AD] text-neutral-500">{gap.hits} hits this week</p>
                          </div>
                          <span className="text-[9.5px] bg-rose-500/10 text-rose-400 border border-rose-500/15 px-1.5 py-0.5 rounded font-black">{gap.status}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-[#0A0A0A]/40 border border-var(--border) rounded-xl text-center">
                      <p className="text-xs text-neutral-500">Perfect! No pending knowledge gaps discovered.</p>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={triggerImproveAI}
                disabled={aiImprovementStatus === "optimizing"}
                className={`w-full mt-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  aiImprovementStatus === "optimizing"
                    ? "bg-var(--bg-elevated) text-neutral-500 text-neutral-500"
                    : "bg-white text-black hover:bg-neutral-200"
                }`}
              >
                {aiImprovementStatus === "optimizing" ? "Analyzing query loops..." : aiImprovementStatus === "completed" ? "Successfully AI Optimized" : "Improve AI Core Engine"}
              </button>
            </div>

            {/* BLOCK 2 & 3: CUSTOMER MANAGEMENT INTERACTIVE PROFILE SYSTEM */}
            <div className="lg:col-span-2 p-6 bg-[#141416]/80 border border-var(--border) rounded-[28px] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-var(--border) pb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-white" />
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider font-sans">Customer CRM Registry</h3>
                    <p className="text-[9.5px] text-neutral-500 font-semibold font-sans">Trace historical audit notes, VIP milestones and billing</p>
                  </div>
                </div>

                <div className="relative font-sans">
                  <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search master CRM list..."
                    value={customerQuery}
                    onChange={(e) => setCustomerQuery(e.target.value)}
                    className="bg-[#0A0A0A] border border-var(--border) focus:border-white/10 rounded-xl py-1.5 pl-9 pr-3 text-xs text-white focus:outline-none w-48 transition"
                  />
                </div>
              </div>

              {/* Master layout details with profile picker */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Left side: Client picker list */}
                <div className="sm:border-r sm:border-var(--border)/60 sm:pr-4 space-y-1 max-h-64 overflow-y-auto pr-1">
                  {customers
                    .filter(c => c.name.toLowerCase().includes(customerQuery.toLowerCase()) || c.phone.includes(customerQuery))
                    .map(cust => (
                      <button
                        key={cust.id}
                        onClick={() => setSelectedCustomerId(cust.id)}
                        className={`w-full p-2 rounded-xl text-left flex items-center justify-between transition-all duration-200 cursor-pointer ${
                          selectedCustomerId === cust.id
                            ? "bg-white/10 text-white"
                            : "hover:bg-var(--bg-elevated)/40 text-neutral-400"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate font-sans">{cust.name}</p>
                          <p className="text-[9px] text-[#A0A2AD] text-neutral-500 font-mono">{cust.phone}</p>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-neutral-300 scale-90 font-bold font-sans">{cust.tag.split(" ")[0]}</span>
                      </button>
                    ))}
                </div>

                {/* Right side: Selected Profile cards */}
                <div className="sm:col-span-2 space-y-4 font-sans">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                        {activeCustomer.name}
                        <span className="text-[9.5px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 font-black">{activeCustomer.tag}</span>
                      </h4>
                      <p className="text-[11px] text-[#A0A2AD] text-neutral-500 mt-0.5">Joined via platform: {activeCustomer.joined}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] text-neutral-500 font-semibold uppercase">Total Paid Settlement</p>
                      <p className="text-xs font-black text-emerald-400 font-mono">₹{activeCustomer.payments}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-[#0A0A0A]/40 border border-neutral-950 p-3 rounded-2xl text-[11px]">
                    <div>
                      <p className="text-neutral-500 font-bold">Contact Email:</p>
                      <p className="text-white truncate mt-0.5">{activeCustomer.email}</p>
                    </div>
                    <div>
                      <p className="text-neutral-500 font-bold">Completed Bookings:</p>
                      <p className="text-white mt-0.5">{activeCustomer.appointments} slots matched</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[10px] text-neutral-500 font-extrabold uppercase">Staff Audit Handover Notes:</p>
                    <div className="p-3 bg-[#0A0A0A] border border-var(--border) rounded-xl text-neutral-300 text-xs italic leading-relaxed">
                      "{activeCustomer.notes}"
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => localNotify(`WhatsApp direct thread ping trigger fired to ${activeCustomer.name}`)} className="flex-1 py-1.5 bg-var(--bg-elevated) border border-neutral-800 hover:bg-var(--bg-elevated) rounded-xl text-[10px] font-black text-white uppercase cursor-pointer">WhatsApp Dispatch</button>
                    <button onClick={() => localNotify(`VIP priority status of ${activeCustomer.name} escalated up`)} className="flex-1 py-1.5 bg-white text-black hover:bg-neutral-200 rounded-xl text-[10px] font-black uppercase cursor-pointer">Sync Priority VIP</button>
                  </div>
                </div>

              </div>

            </div>

          </div>

          {/* APPOINTMENT SCHEDULE MATRIX */}
          <div className="p-6 bg-[#141416]/80 border border-var(--border) rounded-[28px] space-y-4 font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-var(--border) pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-white" />
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-wider font-sans">Interactive Appoint-Sync Calendar</h3>
                  <p className="text-[9.5px] text-neutral-500 text-neutral-500">Auto-allocated real-time slots synced directly to WhatsApp bots</p>
                </div>
              </div>

              {/* Status categories */}
              <div className="flex bg-[#000000] border border-var(--border) p-0.5 rounded-xl text-[10px] font-bold">
                {(["all", "upcoming", "completed", "cancelled"] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setAppointmentFilter(tab)}
                    className={`px-3 py-1.5 rounded-lg capitalize cursor-pointer font-sans transition ${
                      appointmentFilter === tab ? "bg-white/10 text-white font-black" : "text-neutral-500 text-neutral-500 text-neutral-500 hover:text-white"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Calendar matrix frame */}
              <div className="md:col-span-2 p-4 bg-[#0A0A0A]/40 border border-var(--border) rounded-2xl">
                <span className="text-[10px] font-black text-white uppercase tracking-wider block mb-3">June 2026 Grid Overview</span>
                <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                    <span key={d} className="text-neutral-500 text-neutral-500 font-bold text-[10px]">{d}</span>
                  ))}
                  {Array.from({ length: 30 }).map((_, index) => {
                    const dayNum = index + 1;
                    const hasAppt = appointmentsList.some(apt => apt.date === `2026-06-${dayNum < 10 ? "0" + dayNum : dayNum}`);
                    return (
                      <div
                        key={index}
                        onClick={() => localNotify(`Selected Date: June ${dayNum}, 2026`)}
                        className={`p-2 rounded-lg border flex flex-col justify-between items-center h-10 select-none cursor-pointer transition ${
                          dayNum === 21
                            ? "bg-white border-white text-black font-extrabold"
                            : hasAppt
                            ? "bg-[#141416] border-[#2d2d30] hover:bg-[#18181c] text-white"
                            : "bg-transparent border-var(--border)/40 text-neutral-500 text-neutral-500 hover:bg-[#0A0A0A]"
                        }`}
                      >
                        <span className="text-[10.5px] leading-none">{dayNum}</span>
                        {hasAppt && dayNum !== 21 && <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />}
                        {hasAppt && dayNum === 21 && <span className="w-1.5 h-1.5 rounded-full bg-black" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Upcoming agenda and settings list */}
              <div className="space-y-4">
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  <span className="text-[10.5px] font-black text-neutral-400 uppercase tracking-widest block">Active Day Schedule</span>
                  
                  {appointmentsList
                    .filter(apt => appointmentFilter === "all" || apt.status.toLowerCase() === appointmentFilter)
                    .map(apt => (
                      <div key={apt.id} className="p-2.5 bg-[#0A0A0A] border border-var(--border) rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white leading-normal">{apt.client}</span>
                            <span className="text-[9.5px] font-mono text-neutral-500">({apt.time})</span>
                          </div>
                          <p className="text-[9px] text-neutral-500 mt-0.5 font-sans">{apt.service}</p>
                        </div>

                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                          apt.status === "Completed" ? "bg-[#18181b] text-neutral-400" :
                          apt.status === "Cancelled" ? "bg-rose-500/10 text-rose-400 text-rose-400" : "bg-var(--bg-elevated) text-white border border-neutral-700/50"
                        }`}>{apt.status}</span>
                      </div>
                    ))}
                </div>

                <div className="h-[1px] bg-var(--bg-elevated)" />

                {/* Reminder Management Config */}
                <div className="space-y-2 bg-[#0A0A0A]/40 p-3 rounded-2xl">
                  <span className="text-[10px] uppercase font-black tracking-wider text-neutral-400 block"><Sliders className="w-3.5 h-3.5 inline mr-1" /> Reminder Dispatch Config</span>
                  
                  <div className="space-y-1.5 text-xs font-sans">
                    <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                      <input
                        type="checkbox"
                        checked={reminderConfig.whatsapp}
                        onChange={(e) => setReminderConfig({ ...reminderConfig, whatsapp: e.target.checked })}
                        className="accent-white cursor-pointer"
                      />
                      <span>Automate WhatsApp Ping Reminders</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-neutral-500 hover:text-neutral-400">
                      <input
                        type="checkbox"
                        checked={reminderConfig.sms}
                        onChange={(e) => setReminderConfig({ ...reminderConfig, sms: e.target.checked })}
                        className="accent-white cursor-pointer"
                      />
                      <span>Enable Native SMS Backplane</span>
                    </label>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* NOTIFICATION LOGS CENTRE */}
          <div className="p-6 bg-[#141416]/80 border border-var(--border) rounded-[28px] space-y-4">
            <div className="flex items-center justify-between border-b border-var(--border) pb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-white" />
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-wider font-sans">Real-time Platform Dispatch Logs</h3>
                  <p className="text-[9.5px] text-neutral-500 font-semibold font-sans">Trace critical notifications, payment settlements and escalations</p>
                </div>
              </div>
              <button onClick={() => { setOwnerNotifications([]); localNotify("Audit notification list empty."); }} className="text-[10px] text-neutral-400 hover:text-white font-bold font-sans cursor-pointer">Clear logs</button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {ownerNotifications.map(notif => (
                <div key={notif.id} className="p-3 bg-[#0A0A0A] border border-neutral-950 hover:bg-[#0A0A0A]/80 transition rounded-xl flex items-start justify-between gap-4 font-sans text-xs">
                  <div className="flex gap-2.5">
                    <span className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                      notif.type === "escalation" ? "bg-rose-400 animate-pulse" :
                      notif.type === "payment" ? "bg-emerald-400" :
                      notif.type === "lead" ? "bg-white" : "bg-neutral-550"
                    }`} />
                    <div>
                      <p className="font-extrabold text-white">{notif.title}</p>
                      <p className="text-neutral-400 text-[11px] leading-relaxed mt-0.5">{notif.msg}</p>
                    </div>
                  </div>
                  <span className="text-[9px] text-[#A0A2AD] text-neutral-500 font-mono shrink-0">{notif.time}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* 3. LAYOUT PORT: COMPANION MOBILE APP SIMULATOR */}
      {activeLayout === "mobile" && (
        <div id="companion-mobile-simulator-port" className="flex flex-col items-center justify-center py-4">
          
          {/* DEVICE PREVIEW SELECTOR BAR */}
          <div className="flex items-center gap-3 mb-6 bg-[#141416] p-1 border border-var(--border) rounded-2xl font-sans">
            {(["iphone", "android", "tablet"] as const).map(device => (
              <button
                key={device}
                onClick={() => setDeviceModel(device)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize cursor-pointer transition ${
                  deviceModel === device ? "bg-white/10 text-white font-black animate-pulse" : "text-neutral-500 hover:text-white"
                }`}
              >
                {device} Simulation
              </button>
            ))}
          </div>

          {/* DYNAMIC SHADOW DEVICE CHASSIS (Apple Level Frame) */}
          <div
            id="mobile-phone-chassis"
            className={`border-[8px] bg-black shadow-2xl relative overflow-hidden transition-all duration-500 ${
              deviceModel === "iphone" ? "w-[360px] h-[720px] rounded-[48px] border-neutral-800 shadow-neutral-950" :
              deviceModel === "android" ? "w-[360px] h-[710px] rounded-[36px] border-neutral-800 shadow-neutral-950" :
              "w-[580px] h-[780px] rounded-[24px] border-neutral-800 shadow-neutral-950"
            }`}
          >
            {/* Status bar notches to reflect authentic OS styles */}
            <div className="absolute top-0 inset-x-0 h-6 bg-black z-40 flex items-center justify-between px-6 text-[10px] text-neutral-400 font-bold">
              {deviceModel === "iphone" ? (
                <>
                  <span className="font-sans">9:41</span>
                  <div className="w-24 h-[18px] bg-black rounded-b-xl absolute left-1/2 -translate-x-1/2 flex items-center justify-center font-mono text-[6px]">AUTOFY OS</div>
                  <span className="flex items-center gap-1">5G <span className="w-4 h-2.5 border border-neutral-400 rounded-sm inline-block" /></span>
                </>
              ) : (
                <>
                  <span>14:30</span>
                  <div className="w-3 h-3 rounded-full bg-var(--bg-elevated) border border-neutral-800 absolute left-1/2 -translate-x-1/2" />
                  <span>98% LTE</span>
                </>
              )}
            </div>

            {/* LIVE PREVIEW SCREEN WRAPPER */}
            <div className="w-full h-full pt-6 pb-12 overflow-y-auto bg-[#0a0a0c] text-white flex flex-col justify-between select-none">
              
              {/* TOP HEADER PREVIEW INFO */}
              <div className="p-4 border-b border-var(--border) flex items-center justify-between bg-[#141416]/50">
                <div className="flex items-center gap-2 font-sans">
                  <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white font-black text-xs">
                    {upiId[0].toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-black tracking-tight text-white leading-none">Autofy Mobile Command</h4>
                    <span className="text-[8.5px] text-green-400 font-mono uppercase tracking-widest block mt-1">Live Connected</span>
                  </div>
                </div>

                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>

              {/* CORE SCREEN SWITCHER BY BOTTOM BAR */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                
                {/* PREVIEW TAB 1: HOME */}
                {mobileTab === "home" && (
                  <div className="space-y-4 font-sans animate-fade-in">
                    
                    {/* Visual mini kpi cluster */}
                    <div className="p-4 bg-[#141416] border border-var(--border) rounded-2xl relative overflow-hidden">
                      <p className="text-[9px] uppercase font-bold text-neutral-405 text-neutral-400 tracking-wider">Business Health Score</p>
                      <h3 className="text-2xl font-black text-white mt-1">94% Core Match</h3>
                      <p className="text-[9.5px] text-emerald-400 mt-1 flex items-center gap-1 font-semibold"><TrendingUp className="w-2.5 h-2.5" /> High AI readiness deflection unlocked.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 min-h-[140px]">
                      {[
                        { id: 1, name: "Today's Revenue", text: "₹84,500", detail: "Settled up" },
                        { id: 2, name: "Today's Leads", text: "42 direct", detail: "WhatsApp pipeline" },
                        { id: 3, name: "Booked Slots", text: "18 slots", detail: "3 cancelled today" },
                        { id: 4, name: "AI deflection", text: "98.4%", detail: "Optimal standard" }
                      ].map(item => (
                        <div key={item.id} className="p-3 bg-[#111113] border border-neutral-950 rounded-xl">
                          <p className="text-[8.5px] text-neutral-405 text-neutral-400 uppercase font-black">{item.name}</p>
                          <h4 className="text-sm font-black text-white mt-1">{item.text}</h4>
                          <span className="block text-[8px] text-neutral-500 mt-0.5 italic">{item.detail}</span>
                        </div>
                      ))}
                    </div>

                    {/* Quick Trigger automations */}
                    <div className="space-y-1.5 p-3 bg-[#141416]/40 border border-neutral-950 rounded-2xl">
                      <span className="text-[9.5px] uppercase font-bold text-neutral-400 tracking-wider">Quick dispatch macros</span>
                      <button onClick={() => localNotify("Broadcast summary dispatches triggered from companion phone v1.2")} className="w-full text-left p-2 bg-[#0A0A0A] hover:bg-var(--bg-elevated) border border-var(--border) rounded-lg flex items-center justify-between text-xs cursor-pointer">
                        <span className="font-bold text-white leading-normal">Send Daily Summary Broadcast</span>
                        <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
                      </button>
                    </div>
                  </div>
                )}

                {/* PREVIEW TAB 2: CUSTOMERS */}
                {mobileTab === "customers" && (
                  <div className="space-y-3 font-sans animate-fade-in">
                    <span className="text-[10px] font-black text-neutral-400 uppercase block tracking-wider">CRM Master List</span>
                    
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {customers.map(c => (
                        <div key={c.id} className="p-2.5 bg-[#141416] border border-neutral-950 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-white">{c.name}</p>
                            <p className="text-[9px] text-[#A0A2AD] text-neutral-500 font-mono mt-0.5">{c.phone}</p>
                          </div>
                          
                          <div className="text-right">
                            <span className="text-[9px] font-black uppercase text-neutral-400 bg-var(--bg-elevated) border border-neutral-800 px-1 rounded block">{c.tag.split(" ")[0]}</span>
                            <span className="text-[8.5px] text-emerald-400 font-mono font-bold block mt-1">₹{c.payments}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* PREVIEW TAB 3: CHAT MESSAGES thread simulator */}
                {mobileTab === "messages" && (
                  <div className="flex flex-col h-[280px] bg-[#0A0A0A] border border-var(--border) rounded-2xl p-3 justify-between font-sans">
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {mobileChats.map(c => (
                        <div key={c.id} className={`max-w-[75%] p-2 rounded-xl text-[11px] leading-normal ${
                          c.sender === "assistant" ? "bg-neutral-800 text-white rounded-tl-none self-start" : "bg-white text-black rounded-tr-none ml-auto"
                        }`}>
                          <p>{c.text}</p>
                          <span className={`block text-[7.5px] mt-0.5 text-right font-mono ${c.sender === "assistant" ? "text-neutral-500" : "text-neutral-600"}`}>{c.time}</span>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleMobileChatSend} className="flex gap-2 border-t border-var(--border)/60 pt-2 shrink-0">
                      <input
                        type="text"
                        placeholder="Intercept chat..."
                        value={mobileChatInput}
                        onChange={(e) => setMobileChatInput(e.target.value)}
                        className="bg-[#141416]/80 p-2 text-[10.5px] border border-var(--border) rounded-lg outline-none flex-1 text-white placeholder-neutral-500"
                      />
                      <button type="submit" className="p-2 bg-white text-black font-black text-xs rounded-lg cursor-pointer"><Send className="w-3 h-3" /></button>
                    </form>
                  </div>
                )}

                {/* PREVIEW TAB 4: PAYMENTS SCANNER */}
                {mobileTab === "payments" && (
                  <div className="space-y-4 font-sans text-center items-center flex flex-col pt-4">
                    <div className="w-24 h-24 bg-white p-2 rounded-xl">
                      <QrCode className="w-full h-full text-black" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Linked VPA ID</p>
                      <p className="text-[10px] text-neutral-400 text-neutral-405 text-neutral-400 font-mono mt-0.5">{upiId}</p>
                    </div>

                    <div className="w-full space-y-2 text-left">
                      <span className="text-[10px] font-black text-neutral-400 text-neutral-400 uppercase">Recent Payment settlements</span>
                      {transactions.slice(0,3).map(tx => (
                        <div key={tx.id} className="p-2 bg-[#121214] border border-neutral-950 rounded-xl flex justify-between text-[11px]">
                          <span className="font-bold text-white">{tx.customer}</span>
                          <span className="font-mono font-black text-emerald-400">{tx.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* PREVIEW TAB 5: SYSTEM SETTINGS OVERRIDES */}
                {mobileTab === "settings" && (
                  <div className="space-y-3 font-sans animate-fade-in text-xs">
                    <span className="text-[10px] font-black text-neutral-400 uppercase block tracking-wider border-b border-zinc-900 pb-1">Mobile Overrides</span>
                    
                    <div className="space-y-3.5 py-2">
                      <div className="flex items-center justify-between">
                        <span>Background AI Auto-Reply</span>
                        <div className="w-7 h-4 bg-emerald-500 rounded-full p-0.5 relative cursor-pointer" onClick={() => localNotify("AI auto replies is persistently enabled")}>
                          <div className="w-3 h-3 rounded-full bg-white ml-auto" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span>Instant WhatsApp Webhook</span>
                        <div className="w-7 h-4 bg-emerald-500 rounded-full p-0.5 relative cursor-pointer">
                          <div className="w-3 h-3 rounded-full bg-white ml-auto" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-neutral-500">
                        <span>Sound notification triggers</span>
                        <div className="w-7 h-4 bg-neutral-800 rounded-full p-0.5 relative cursor-pointer">
                          <div className="w-3 h-3 rounded-full bg-white" />
                        </div>
                      </div>
                    </div>

                    {/* CORE PRODUCTIONS REQUIREMENTS SPECS SHEET INLINE PREVIEW */}
                    <div className="p-3 bg-[#111113] border border-neutral-950 rounded-xl space-y-2 mt-4">
                      <p className="text-[9.5px] font-black text-neutral-400 uppercase tracking-widest"><FileText className="w-3.5 h-3.5 inline mr-1" /> Dev Specifications</p>
                      <p className="text-[9px] text-[#A0A2AD] text-neutral-500 leading-normal leading-relaxed">
                        **GraphQL / REST APIs:** Autofy live endpoints matching standard schema mappings.<br/>
                        **Drizzle Orm Schema:** Master users mapped to local Firestore, clustered by business verification tokens.
                      </p>
                    </div>
                  </div>
                )}

              </div>

              {/* BOTTOM NAVIGATION SIMULATED PHONE MENU */}
              <div className="h-14 border-t border-var(--border) bg-[#111112]/95 backdrop-blur-md flex items-center justify-around px-2 z-40 shrink-0">
                {[
                  { id: "home", label: "Home", icon: Home },
                  { id: "customers", label: "Clients", icon: Users },
                  { id: "messages", label: "Inbox", icon: MessageSquare },
                  { id: "payments", label: "Pay Link", icon: QrCode },
                  { id: "settings", label: "Control", icon: Sliders }
                ].map(item => {
                  const ItemIcon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setMobileTab(item.id as any)}
                      className={`flex flex-col items-center justify-center cursor-pointer transition ${
                        mobileTab === item.id ? "text-white" : "text-neutral-500 text-neutral-500 hover:text-white"
                      }`}
                    >
                      <ItemIcon className="w-4 h-4" />
                      <span className="text-[8px] font-black uppercase mt-1 tracking-wider">{item.label}</span>
                    </button>
                  );
                })}
              </div>

            </div>

            {/* Simulated hardware items shape bar */}
            <div className="absolute bottom-1 bg-neutral-500 w-32 h-1 left-1/2 -translate-x-1/2 rounded-full z-40" />
          </div>
          
          <div className="mt-4 p-4 bg-[#141416] border border-var(--border) rounded-[22px] max-w-md text-center">
            <h4 className="text-xs font-black text-white uppercase tracking-wider mb-1">Interactive Sandbox Interceptions</h4>
            <p className="text-[11px] text-[#A0A2AD] text-neutral-500 font-sans leading-relaxed">
              Use the bottom tabs in the simulated device to trigger scanner models, check active notification channels, edit UPI VPAs or intercept ongoing client queries.
            </p>
          </div>
        </div>
      )}

      {/* 4. PRODUCTION READINESS SPECIFICATION CARD */}
      <div className="p-6 bg-[#141416]/90 border border-var(--border) rounded-[28px] shrink-0 font-sans space-y-4">
        <div className="border-b border-var(--border) pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-white" />
            <h3 className="text-xs font-black text-white uppercase tracking-wider font-sans">Full-Stack Backend & Database Blueprint Config</h3>
          </div>
          <span className="text-[9.5px] px-2 py-0.5 bg-var(--bg-elevated) text-white rounded font-mono border border-neutral-800 border-neutral-800">Production Ingestion Ready</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-neutral-400">
          <div className="space-y-2 bg-[#0A0A0A]/40 p-4 border border-var(--border) rounded-2xl">
            <h4 className="font-extrabold text-white flex items-center gap-1"><Database className="w-4 h-4" /> Relational Database Schema</h4>
            <p className="text-[11px] leading-relaxed text-[#A0A2AD] text-neutral-500">
              Structured Drizzle/SQL schema utilizing primary indexes:
            </p>
            <pre className="p-2.5 bg-black/60 border border-neutral-950 rounded-lg text-[9px] text-[#e5e5e5] font-mono leading-relaxed whitespace-pre-wrap">
{`export const leads = pgTable('autofy_leads', {
  id: uuid('id').defaultRandom().primaryKey(),
  businessId: uuid('business_id').notNull(),
  name: text('name').notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  status: varchar('status').default('New'),
  createdAt: timestamp('created_at').defaultNow()
});`}
            </pre>
          </div>

          <div className="space-y-2 bg-[#0A0A0A]/40 p-4 border border-var(--border) rounded-2xl">
            <h4 className="font-extrabold text-white flex items-center gap-1"><ServerIcon className="w-4 h-4" /> API Gateway Webhooks</h4>
            <p className="text-[11px] leading-relaxed text-[#A0A2AD] text-neutral-500">
              Webhook settlement handling using secure HTTPS:
            </p>
            <pre className="p-2.5 bg-black/60 border border-neutral-950 rounded-lg text-[9px] text-[#e5e5e5] font-mono leading-relaxed whitespace-pre-wrap">
{`app.post('/api/webhook/whatsapp', async (req, res) => {
  const { message, contact } = req.body;
  const processed = await matchKB(message.text);
  await sendWhatsAppResponse(contact.phone, processed);
  res.status(200).json({ status: 'sent' });
});`}
            </pre>
          </div>

          <div className="space-y-2 bg-[#0A0A0A]/40 p-4 border border-var(--border) rounded-2xl">
            <h4 className="font-extrabold text-white flex items-center gap-1"><Percent className="w-4 h-4" /> Analytics Engine Cluster</h4>
            <p className="text-[11px] leading-relaxed text-[#A0A2AD] text-neutral-500">
              Clustered analytics query models mapped for historical graphs:
            </p>
            <table className="w-full text-left text-[10px] mt-2 font-mono">
              <thead>
                <tr className="text-neutral-500 text-neutral-500 border-b border-var(--border)">
                  <th className="pb-1.5">Query Module</th>
                  <th className="pb-1.5 text-right">Throughput</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900/40">
                <tr>
                  <td className="py-1">Conversion Model</td>
                  <td className="py-1 text-right text-white">0.02s latency</td>
                </tr>
                <tr>
                  <td className="py-1">Sentiment Deflection</td>
                  <td className="py-1 text-right text-white">99% confidence</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};

// Custom helper in case ServerIcon is not in lucide-react standard
function ServerIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="8" x="2" y="2" rx="2" ry="2" />
      <rect width="20" height="8" x="2" y="14" rx="2" ry="2" />
      <line x1="6" x2="6.01" y1="6" y2="6" />
      <line x1="6" x2="6.01" y1="18" y2="18" />
    </svg>
  );
}
