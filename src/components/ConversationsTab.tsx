import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  MessageSquare,
  Sparkles,
  Phone,
  User,
  Send,
  Paperclip,
  BookOpen,
  Smile,
  Zap,
  Clock,
  Check,
  Briefcase,
  Layers,
  Heart,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  FileText,
  UserCheck,
  Calendar,
  CreditCard,
  Share2,
  DollarSign,
  Plus,
  HelpCircle,
  Activity,
  X
} from "lucide-react";
import { OnboardingData } from "../types";

interface ConversationsTabProps {
  onboardingData: OnboardingData;
  servicesList: any[];
  productsList: any[];
  membershipPlans: any[];
  faqsList: any[];
  policies: any;
  triggerNotification: (text: string) => void;
}

interface Message {
  id: string;
  sender: "customer" | "ai" | "human";
  text: string;
  time: string;
}

interface Conversation {
  id: string;
  name: string;
  phone: string;
  email: string;
  businessType: string;
  leadStatus: "Warm Lead" | "Needs Nurturing" | "Converted" | "Escalated";
  leadScore: number;
  source: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  status: "active" | "needs_review" | "escalated";
  history: Message[];
  timeline: Array<{ event: string; date: string; checked: boolean }>;
}

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: "conv-1",
    name: "Arya Sharma",
    phone: "+91 98124 55321",
    email: "arya.sharma@yahoo.com",
    businessType: "Premium Fitness Member",
    leadStatus: "Warm Lead",
    leadScore: 88,
    source: "Instagram Ad",
    lastMessage: "Do you have any AC membership or premium group training slots available?",
    time: "2 Mins Ago",
    unreadCount: 1,
    status: "active",
    history: [
      { id: "1", sender: "customer", text: "Hey! Wanted to check about joining your studio soon.", time: "4:15 PM" },
      { id: "2", sender: "ai", text: "Hello Arya! Welcome to our fitness studio. We'd love to help you reach your goals. What kind of workouts are you interested in?", time: "4:16 PM" },
      { id: "3", sender: "customer", text: "Do you have any AC membership or premium group training slots available?", time: "4:30 PM" }
    ],
    timeline: [
      { event: "First Contact via Instagram", date: "Today, 4:15 PM", checked: true },
      { event: "AI Answer Sent", date: "Today, 4:16 PM", checked: true },
      { event: "Payment Link Created", date: "Pending", checked: false },
      { event: "Appointment Booked", date: "Pending", checked: false }
    ]
  },
  {
    id: "conv-2",
    name: "Rahul Verma",
    phone: "+91 88523 00192",
    email: "rahul.v99@gmail.com",
    businessType: "Automobile Accessories",
    leadStatus: "Converted",
    leadScore: 97,
    source: "Google Search",
    lastMessage: "Thank you! I have completed the paylink check, booking confirmed.",
    time: "1 Hour Ago",
    unreadCount: 0,
    status: "active",
    history: [
      { id: "1", sender: "customer", text: "Is the AEW Exhaust in stock for GT 650?", time: "3:01 PM" },
      { id: "2", sender: "ai", text: "Yes Rahul! We have 12 units of the Premium AEW Exhaust in stock right now for ₹6,500. It is fully available.", time: "3:01 PM" },
      { id: "3", sender: "customer", text: "Can you send me a custom booking checkout link?", time: "3:02 PM" },
      { id: "4", sender: "human", text: "Certainly! I've generated a payment link for ₹6,500. You'll receive the confirmation instantly upon settlement.", time: "3:04 PM" },
      { id: "5", sender: "customer", text: "Thank you! I have completed the paylink check, booking confirmed.", time: "3:10 PM" }
    ],
    timeline: [
      { event: "First Contact", date: "Today, 3:00 PM", checked: true },
      { event: "AI Answer Sent", date: "Today, 3:01 PM", checked: true },
      { event: "Payment Made (₹6500)", date: "Today, 3:10 PM", checked: true },
      { event: "Appointment Booked", date: "Today, 3:15 PM", checked: true }
    ]
  },
  {
    id: "conv-3",
    name: "Vikram Malhotra",
    phone: "+91 91152 44321",
    email: "vikram.malhotra@rediff.com",
    businessType: "Corporate Guest",
    leadStatus: "Needs Nurturing",
    leadScore: 45,
    source: "WhatsApp Direct",
    lastMessage: "I need to discuss terms of customized corporate packages instead.",
    time: "3 Hours Ago",
    unreadCount: 0,
    status: "needs_review",
    history: [
      { id: "1", sender: "customer", text: "Do you offer corporate rates for 50 people?", time: "1:10 PM" },
      { id: "2", sender: "ai", text: "Hello Vikram! Standard membership is ₹2,500 but customized corporate package setups can be custom quoted. Let me ask our manager to contact you.", time: "1:11 PM" },
      { id: "3", sender: "customer", text: "I need to discuss terms of customized corporate packages instead.", time: "1:15 PM" }
    ],
    timeline: [
      { event: "First Contact", date: "Today, 1:10 PM", checked: true },
      { event: "AI Answer Sent", date: "Today, 1:11 PM", checked: true },
      { event: "Payment Made", date: "Pending", checked: false },
      { event: "Appointment Booked", date: "Pending", checked: false }
    ]
  },
  {
    id: "conv-4",
    name: "Dr. Ananya Sen",
    phone: "+91 75001 88231",
    email: "ananya.sen@healthplus.org",
    businessType: "Premium Consultation",
    leadStatus: "Escalated",
    leadScore: 92,
    source: "Referral Partner",
    lastMessage: "Your bot claims no slots exist, but I need immediate diagnostic support.",
    time: "5 Hours Ago",
    unreadCount: 0,
    status: "escalated",
    history: [
      { id: "1", sender: "customer", text: "Is there any urgent slot at 5:00 PM today?", time: "11:30 AM" },
      { id: "2", sender: "ai", text: "I'm sorry Ananya, our current booking schedule shows fully busy slots up to 7:00 PM today.", time: "11:31 AM" },
      { id: "3", sender: "customer", text: "Your bot claims no slots exist, but I need immediate diagnostic support.", time: "11:35 AM" }
    ],
    timeline: [
      { event: "First Contact", date: "Today, 11:30 AM", checked: true },
      { event: "AI Answer Sent", date: "Today, 11:31 AM", checked: true },
      { event: "Human Agent Assigned", date: "Today, 11:40 AM", checked: true },
      { event: "Appointment Booked", date: "Pending", checked: false }
    ]
  }
];

export const ConversationsTab: React.FC<ConversationsTabProps> = ({
  onboardingData,
  servicesList,
  productsList,
  membershipPlans,
  faqsList,
  policies,
  triggerNotification
}) => {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    return INITIAL_CONVERSATIONS;
  });

  const [activeId, setActiveId] = useState<string>("conv-1");
  const [filter, setFilter] = useState<"all" | "unread" | "ai" | "human" | "converted">("all");
  const [search, setSearch] = useState<string>("");
  const [typedMessage, setTypedMessage] = useState<string>("");
  const [isResponding, setIsResponding] = useState<boolean>(false);
  const [emptyState, setEmptyState] = useState<boolean>(false);

  // AI response tracking state for current response insights
  const [aiInsight, setAiInsight] = useState({
    source: "Membership Plans",
    confidence: "98%",
    responseTime: "1.2 Seconds",
    faqMatched: "AC Membership Enquiry"
  });

  // Local alert logs that trigger dynamically in the floating ticker
  const [alerts, setAlerts] = useState<Array<{ id: string; text: string; time: string }>>([
    { id: "alt-1", text: " New Lead captured: Priya Patel via FB Ads", time: "Just Now" },
    { id: "alt-2", text: " AI Answer Sent automatically to Vikram Malhotra", time: "1 min ago" },
    { id: "alt-3", text: " Payment Received: ₹2,500 from Rahul Verma for Personal Training", time: "10 mins ago" }
  ]);

  const activeChat = conversations.find((c) => c.id === activeId) || conversations[0];
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.history, isResponding]);

  // Simulate an AI responding automatically to a customer message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim()) return;

    const userMsgText = typedMessage;
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Append user message
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: "customer",
      text: userMsgText,
      time: currentTime
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeId) {
          return {
            ...c,
            lastMessage: userMsgText,
            time: "Just Now",
            history: [...c.history, userMsg]
          };
        }
        return c;
      })
    );

    setTypedMessage("");
    setIsResponding(true);

    // AI Logic Simulator matching business text
    setTimeout(() => {
      let botAnswer = "";
      let matchedSource = "General Knowledge Base";
      let matchedFAQ = "Default Fallback Handler";
      let confidenceNum = 90 + Math.floor(Math.random() * 9);
      let responseSec = (0.6 + Math.random() * 0.9).toFixed(1);

      const cleanedInput = userMsgText.toLowerCase();

      // Look up inside interactive servicesList
      const matchedService = servicesList.find((s) => cleanedInput.includes(s.name.toLowerCase()));
      // Look up inside productsList
      const matchedProduct = productsList.find((p) => cleanedInput.includes(p.name.toLowerCase()));
      // Look up inside faqsList
      const matchedFaqItem = faqsList.find((f) => cleanedInput.includes(f.q.toLowerCase()) || cleanedInput.includes("timing") || cleanedInput.includes("pricing") || cleanedInput.includes("hour"));

      if (matchedService) {
        botAnswer = `Hi! Yes, our service of ${matchedService.name} is available for ${matchedService.price}. The active duration is ${matchedService.duration}. Would you like me to book this for you?`;
        matchedSource = "Services Catalog";
        matchedFAQ = matchedService.name;
      } else if (matchedProduct) {
        botAnswer = `We have the ${matchedProduct.name} available in our Catalog. Price is ${matchedProduct.price}, with around ${matchedProduct.stockQuantity || 10} units in stock. Let me generate a payment link dynamically.`;
        matchedSource = "Products Inventory";
        matchedFAQ = matchedProduct.name;
      } else if (cleanedInput.includes("membership") || cleanedInput.includes("plan") || cleanedInput.includes("duration")) {
        botAnswer = `Autofy offers a premium 3-Month Membership plan for ₹5,000, including full AC layout benefits and daily trainer guidance! Let me know if you would like automated quick checkout.`;
        matchedSource = "Membership Information";
        matchedFAQ = "Gym/Store Membership Slots";
      } else if (cleanedInput.includes("refund") || cleanedInput.includes("cancel") || cleanedInput.includes("policy")) {
        botAnswer = policies.refund || `Our refund policy states: Returns/Refunds are accepted within 7 days. Can I trigger a refund processing review link for you?`;
        matchedSource = "Business Policies Guidelines";
        matchedFAQ = "Refund / Cancellation Policy";
      } else if (cleanedInput.includes("timing") || cleanedInput.includes("hours") || cleanedInput.includes("open")) {
        botAnswer = `We are open 6:00 AM - 10:00 PM Monday through Saturday. Closed on Sundays. Let me know if you need any slot booked!`;
        matchedSource = "Working Hours Sheet";
        matchedFAQ = "Hours of Operation";
      } else {
        botAnswer = `That is an excellent query. Based on ${onboardingData.businessName || "Autofy AI"}, we provide customized packages. Let me look up options or prepare a secure scheduling session for you.`;
        matchedSource = "Business Pitch / Description File";
        matchedFAQ = "General Information FAQ";
      }

      const botMsg: Message = {
        id: `msg-bot-${Date.now()}`,
        sender: "ai",
        text: botAnswer,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeId) {
            return {
              ...c,
              lastMessage: botAnswer,
              unreadCount: 0,
              history: [...c.history, botMsg]
            };
          }
          return c;
        })
      );

      setAiInsight({
        source: matchedSource,
        confidence: `${confidenceNum}%`,
        responseTime: `${responseSec} Seconds`,
        faqMatched: matchedFAQ
      });

      setIsResponding(false);
      triggerNotification(` AI Auto-responded to ${activeChat.name}`);

      // Inject temporary fresh float alert
      setAlerts((prev) => [
        {
          id: `alt-${Date.now()}`,
          text: ` AI answered Priya Patel: "${botAnswer.substring(0, 42)}..."`,
          time: "Just Now"
        },
        ...prev
      ]);
    }, 1500);
  };

  // Human intervention override
  const handleHumanSend = (overrideText: string) => {
    if (!overrideText.trim()) return;
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const humanMsg: Message = {
      id: `msg-human-${Date.now()}`,
      sender: "human",
      text: overrideText,
      time: currentTime
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeId) {
          return {
            ...c,
            lastMessage: overrideText,
            unreadCount: 0,
            history: [...c.history, humanMsg]
          };
        }
        return c;
      })
    );

    triggerNotification(`‍ Override message sent manually by owner`);
  };

  // Actions
  const markAsConverted = () => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeId) {
          const updatedTimeline = [...c.timeline];
          updatedTimeline[2] = { ...updatedTimeline[2], checked: true, date: "Marked Converted" };
          return { ...c, leadStatus: "Converted", timeline: updatedTimeline };
        }
        return c;
      })
    );
    triggerNotification(` Converted: ${activeChat.name} marked as Success Lead!`);
  };

  const assignHuman = () => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeId) {
          return { ...c, status: "needs_review", leadStatus: "Escalated" };
        }
        return c;
      })
    );
    triggerNotification(`‍ Assigned Human Intervention ticket to Admin`);
  };

  const createPaymentLink = () => {
    const payText = `Sure! I have generated your premium instant checkout invoice checkout for payment. Click here to finalize your purchase: https://autofy.pay/bill/${activeChat.id}`;
    handleHumanSend(payText);
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeId) {
          const updatedTimeline = [...c.timeline];
          updatedTimeline[2] = { ...updatedTimeline[2], checked: true, date: "Paylink Created" };
          return { ...c, timeline: updatedTimeline };
        }
        return c;
      })
    );
  };

  const bookQuickAppointment = () => {
    const bookText = `Awesome! I've scheduled you in for your upcoming business appointment. Confirmed timings are set in Autofy Scheduler. View: https://autofy.app/slots/${activeChat.id}`;
    handleHumanSend(bookText);
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeId) {
          const updatedTimeline = [...c.timeline];
          updatedTimeline[3] = { ...updatedTimeline[3], checked: true, date: "Appointment Confirmed" };
          return { ...c, timeline: updatedTimeline };
        }
        return c;
      })
    );
  };

  const exportLeadData = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Name,Phone,Email,Source,Lead Score,Lead Status", 
         `"${activeChat.name}","${activeChat.phone}","${activeChat.email}","${activeChat.source}",${activeChat.leadScore},"${activeChat.leadStatus}"`
        ].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Autofy-Lead-${activeChat.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerNotification(` Customer metrics exported successfully`);
  };

  // Filters calculation
  const filteredChatList = emptyState ? [] : conversations.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                          c.phone.includes(search) || 
                          c.lastMessage.toLowerCase().includes(search.toLowerCase());
    
    if (!matchesSearch) return false;

    if (filter === "unread") return c.unreadCount > 0;
    if (filter === "ai") return c.status === "active";
    if (filter === "human") return c.status === "needs_review";
    if (filter === "converted") return c.leadStatus === "Converted";
    return true;
  });

  // Analytics counts
  const totalConversationsToday = conversations.length;
  const aiResolutionRate = 88; // %
  const humanEscalationsCount = conversations.filter(c => c.status === "escalated" || c.status === "needs_review").length;
  const satisfactionScore = "4.8/5";

  return (
    <div className="space-y-6">
      
      {/* Upper control layout showing Page Title, Subtitle, and Empty State Switches */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight flex items-center gap-2" style={{ color: "var(--text)" }}>
            Conversations <span className="badge-glow text-[11px] px-2.5 py-0.5 font-bold font-sans">Real-Time Sync</span>
          </h2>
          <p className="text-xs font-sans" style={{ color: "var(--text-muted)" }}>Manage all customer interactions from one place.</p>
        </div>

        {/* Simulator mode controller & Empty State toggler */}
        <div className="flex items-center gap-3">
          <label className="text-[11px] font-semibold text-[var(--text-muted)] flex items-center gap-1.5 bg-[var(--bg-elevated)] px-3/5 py-1.5 rounded-xl border border-[var(--border)]">
            <input 
              type="checkbox"
              checked={emptyState}
              onChange={(e) => setEmptyState(e.target.checked)}
              className="rounded border-[var(--border-strong)] text-blue-600 focus:ring-blue-500 bg-[var(--bg-card)] w-3.5 h-3.5"
            />
            Simulate Empty Inbox
          </label>

          <button 
            onClick={() => {
              setConversations(INITIAL_CONVERSATIONS);
              setEmptyState(false);
              triggerNotification(" Conversation records reset to demo values");
            }} 
            className="px-3 py-1.5 bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text)] hover:text-[var(--text)] rounded-xl text-xs font-semibold hover:bg-[var(--bg-elevated)] transition cursor-pointer"
          >
            Reset Chats list
          </button>
        </div>
      </div>

      {/* Analytics counter widget bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <MessageSquare className="w-5 h-5 text-pink-500" />, label: "Today's Conversations", val: totalConversationsToday, sub: "+2 new minutes ago" },
          { icon: <Sparkles className="w-5 h-5 text-purple-500" />, label: "AI Resolution Rate", val: `${aiResolutionRate}%`, sub: "Auto-pilot active" },
          { icon: <AlertCircle className="w-5 h-5 text-amber-500" />, label: "Human Escalations", val: humanEscalationsCount, sub: "Requires attention" },
          { icon: <CheckCircle className="w-5 h-5 text-emerald-500" />, label: "Customer Satisfaction", val: satisfactionScore, sub: "Outstanding reviews" },
        ].map((item, idx) => (
          <div key={idx} className="glass-card p-4 rounded-2xl flex items-center gap-3.5 backdrop-blur-md">
            <div className="p-2.5 rounded-xl border border-[var(--border)]" style={{ background: "var(--bg-elevated)" }}>{item.icon}</div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider leading-none mb-1 font-sans" style={{ color: "var(--text-subtle)" }}>{item.label}</p>
              <h4 className="text-xl font-black font-display leading-none" style={{ color: "var(--text)" }}>{item.val}</h4>
              <p className="text-[9.5px] mt-1 leading-none font-sans" style={{ color: "var(--text-muted)" }}>{item.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {emptyState || filteredChatList.length === 0 ? (
          /* EMPTY STATE SCREEN */
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-[var(--bg-card)] border border-[var(--border)] p-12 text-center rounded-3xl backdrop-blur-md max-w-2xl mx-auto space-y-4"
          >
            <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mx-auto border border-blue-500/20">
              <MessageSquare className="w-8 h-8" />
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-[var(--text)]">Your customer conversations will appear here.</h3>
              <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
                Once you connect your WhatsApp Business line via the API integration gateway, you can instruct Autofy to auto-respond to leads and close appointments instantly.
              </p>
            </div>

            <div className="pt-2">
              <button 
                onClick={() => {
                  setEmptyState(false);
                  setConversations(INITIAL_CONVERSATIONS);
                  triggerNotification(" Sync link active: Demo WhatsApp initialized");
                }}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-[var(--text)] font-extrabold text-xs tracking-wide rounded-xl uppercase transition cursor-pointer shadow-lg shadow-blue-500/20"
              >
                Connect WhatsApp Business Line
              </button>
            </div>
          </motion.div>
        ) : (
          /* TRIPLE COLUMN WhatsApp Business/Intercom Workspace Interface */
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch"
          >
            
            {/* COLUMN 1: LEFT SIDEBAR (CONVERSATION DIRECTORY LIST) - SPANS 3 COLS */}
            <div className="xl:col-span-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-4 backdrop-blur-md flex flex-col h-[650px] relative">
              
              <div className="space-y-3 mb-4">
                <div className="relative">
                  <Search className="w-4 h-4 text-[var(--text-subtle)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search conversations..."
                    className="w-full bg-[#0a0a0c] border border-[var(--border)] rounded-xl pl-9 pr-4 py-2.5 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--brand)]"
                  />
                  {search && (
                    <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)] hover:text-[var(--text)]">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Filter chip pills row scrollable */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {(["all", "unread", "ai", "human", "converted"] as const).map((tabId) => (
                    <button
                      key={tabId}
                      onClick={() => setFilter(tabId)}
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg border transition whitespace-nowrap cursor-pointer ${
                        filter === tabId
                          ? "bg-blue-600/10 border-blue-500/30 text-blue-400"
                          : "bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]"
                      }`}
                    >
                      {tabId === "all" ? "All" : tabId === "ai" ? "AI Active" : tabId === "human" ? "Human" : tabId}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable list container */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[500px]">
                {filteredChatList.map((chat) => {
                  const isActive = chat.id === activeId;
                  const lastHistoryText = chat.history[chat.history.length - 1]?.text || chat.lastMessage;
                  
                  return (
                    <button
                      key={chat.id}
                      onClick={() => {
                        setActiveId(chat.id);
                        // Zero out unread count upon click
                        setConversations(prev => prev.map(c => c.id === chat.id ? { ...c, unreadCount: 0 } : c));
                      }}
                      className={`w-full text-left p-3 rounded-2xl border transition flex items-start gap-2.5 cursor-pointer ${
                        isActive
                          ? "bg-blue-600/10 border-blue-500/30 text-[var(--text)]"
                          : "bg-[var(--bg-elevated)]/40 border-[var(--border)] hover:border-[var(--border)] hover:bg-[var(--bg-elevated)] text-[var(--text-muted)]"
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-9 h-9 rounded-full bg-[var(--bg-elevated)] text-sm font-black text-[var(--text)] flex items-center justify-center border border-[var(--border-strong)]">
                          {chat.name[0]}
                        </div>
                        {chat.unreadCount > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-blue-500 text-[9px] font-black font-sans text-[var(--text)] rounded-full flex items-center justify-center">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <h4 className="text-xs font-bold text-[var(--text)] truncate max-w-[100px]">{chat.name}</h4>
                          <span className="text-[8.5px] text-[var(--text-subtle)] font-medium font-mono">{chat.time}</span>
                        </div>
                        
                        <p className="text-[11px] truncate leading-snug mb-1">{lastHistoryText}</p>
                        
                        {/* Status badges inside list */}
                        <div className="flex items-center gap-1.5">
                          {chat.status === "active" && (
                            <span className="text-[8.5px] font-bold text-green-400 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> AI Active
                            </span>
                          )}
                          {chat.status === "needs_review" && (
                            <span className="text-[8.5px] font-bold text-yellow-400 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" /> Needs Review
                            </span>
                          )}
                          {chat.status === "escalated" && (
                            <span className="text-[8.5px] font-bold text-red-400 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Escalated
                            </span>
                          )}
                          <span className="text-[8.5px] font-mono text-[var(--text-subtle)] bg-[var(--bg-card)] px-1.5 py-0.5 rounded">
                            {chat.leadStatus}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Mini Help Indicator */}
              <div className="absolute bottom-3 left-4 right-4 pt-2.5 border-t border-[var(--border)] bg-[#0a0a0c]/80 flex items-center justify-between text-[9px] text-[var(--text-subtle)]">
                <span>Active Channels: WhatsApp API</span>
                <span className="animate-pulse w-2 h-2 rounded-full bg-green-500" />
              </div>
            </div>

            {/* COLUMN 2: CENTER ACTIVE CONVERSATION PANEL - SPANS 6 COLS */}
            <div className="xl:col-span-6 bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl overflow-hidden flex flex-col h-[650px]">
              
              {/* Active Chat Header */}
              <div className="bg-[var(--bg-elevated)]/60 border-b border-[var(--border)] px-5 py-3 flex items-center justify-between gap-3 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-black relative">
                    {activeChat.name[0]}
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-[var(--border)] animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-[13px] font-black text-[var(--text)]">{activeChat.name}</h3>
                    <p className="text-[9.5px] text-[var(--text-muted)] font-mono flex items-center gap-1">
                      {activeChat.phone} • {activeChat.businessType} <span className="text-[var(--text-subtle)]">|</span> 
                      <span className="text-blue-400 font-bold">{activeChat.leadStatus}</span>
                    </p>
                  </div>
                </div>

                {/* Automation mode tag */}
                <div className="bg-blue-600/10 border border-blue-500/20 px-3 py-1 rounded-full flex items-center gap-1.5 text-blue-400 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  <span>Autofy Engine Live</span>
                </div>
              </div>

              {/* Chat Stream Window */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[430px] bg-gradient-to-b from-neutral-950/20 to-black/60 scrollbar-thin">
                
                {/* Greeting banner info */}
                <div className="text-center py-2">
                  <span className="text-[9.5px] font-semibold text-[var(--text-subtle)] bg-[var(--bg-elevated)] px-3 py-1 rounded-full">
                    Chat started via {activeChat.source} • Transmissions encrypted
                  </span>
                </div>

                {activeChat.history.map((msg) => {
                  const isUser = msg.sender === "customer";
                  const isAi = msg.sender === "ai";
                  
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 max-w-[85%] ${isUser ? "mr-auto" : "ml-auto flex-row-reverse"}`}
                    >
                      {/* Mini Avatar */}
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                        isUser 
                          ? "bg-[var(--bg-elevated)] text-[var(--text)]" 
                          : isAi 
                            ? "bg-blue-600/20 text-blue-400 border border-blue-500/20" 
                            : "bg-purple-600/20 text-purple-400 border border-purple-500/20"
                      }`}>
                        {isUser ? "U" : isAi ? "AI" : "ME"}
                      </div>

                      {/* Content block */}
                      <div className="space-y-1">
                        <div className={`p-3.5 rounded-2xl text-[11.5px] leading-relaxed whitespace-pre-wrap select-text ${
                          isUser
                            ? "bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text)] rounded-tl-none"
                            : isAi
                              ? "bg-blue-600 text-[var(--text)] rounded-tr-none shadow shadow-blue-500/10"
                              : "bg-purple-600 text-[var(--text)] rounded-tr-none shadow shadow-purple-500/10"
                        }`}>
                          {msg.text}
                        </div>
                        <p className={`text-[8.5px] text-[var(--text-subtle)] font-mono tracking-tight ${isUser ? "text-left" : "text-right"}`}>
                          {msg.sender === "ai" ? "Autofy Agent" : msg.sender === "human" ? "Human Agent Override" : "Customer"} • {msg.time}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {/* Submitting/Typing status indicator */}
                {isResponding && (
                  <div className="flex gap-2.5 max-w-[80%] ml-auto flex-row-reverse">
                    <div className="w-7 h-7 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/10 flex items-center justify-center text-[10px] font-bold">
                      AI
                    </div>
                    <div className="space-y-1">
                      <div className="bg-blue-600/10 border border-blue-500/10 rounded-2xl rounded-tr-none p-3 px-4 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
                        <span className="text-[10px] text-blue-400 font-bold ml-1 font-mono">Autofy is responding...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Preset Templates tag line */}
              <div className="px-4 py-2 border-t border-[var(--border)] bg-[var(--bg-card)] flex items-center gap-2 overflow-x-auto scrollbar-none">
                <span className="text-[8.5px] font-black uppercase text-[var(--text-subtle)] text-[var(--text-subtle)] tracking-wider flex-shrink-0">Presets:</span>
                <button 
                  onClick={() => setTypedMessage("What is the cost of our membership options?")}
                  className="px-2.5 py-1 text-[9.5px] text-blue-400 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 rounded-full whitespace-nowrap cursor-pointer"
                >
                   Ask Pricing
                </button>
                <button 
                  onClick={() => setTypedMessage("What hours are you open today?")}
                  className="px-2.5 py-1 text-[9.5px] text-blue-400 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 rounded-full whitespace-nowrap cursor-pointer"
                >
                  <Clock size={11} className="inline mr-1" />Ask Timings
                </button>
                <button 
                  onClick={() => setTypedMessage("Is there slot booking availability?")}
                  className="px-2.5 py-1 text-[9.5px] text-blue-400 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 rounded-full whitespace-nowrap cursor-pointer"
                >
                   Test Appointments
                </button>
              </div>

              {/* Message input bar */}
              <form onSubmit={handleSendMessage} className="p-3 bg-[#0a0a0c] border-t border-[var(--border)] flex items-center gap-2">
                
                {/* Accessory icons placeholders */}
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => triggerNotification(" File attachment clicked (PNG, PDF support enabled)")} className="p-2 text-[var(--text-subtle)] hover:text-[var(--text)] hover:bg-[var(--bg-elevated)] rounded-xl" title="Attach file">
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => triggerNotification(" Templates tray open")} className="p-2 text-[var(--text-subtle)] hover:text-[var(--text)] hover:bg-[var(--bg-elevated)] rounded-xl" title="Templates list">
                    <BookOpen className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => { setTypedMessage(p => p + " "); }} className="p-2 text-[var(--text-subtle)] hover:text-[var(--text)] hover:bg-[var(--bg-elevated)] rounded-xl" title="Emoji select">
                    <Smile className="w-4 h-4" />
                  </button>
                </div>

                <input
                  type="text"
                  value={typedMessage}
                  onChange={(e) => setTypedMessage(e.target.value)}
                  placeholder="Type Message..."
                  className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--brand)]"
                />

                <div className="flex gap-1.5">
                  <button
                    type="submit"
                    className="p-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-[var(--text)] transition cursor-pointer"
                    title="Send to trigger AI engine auto-response"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!typedMessage.trim()) return;
                      handleHumanSend(typedMessage);
                      setTypedMessage("");
                    }}
                    className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-[var(--text)] rounded-xl text-[10px] font-bold cursor-pointer transition whitespace-nowrap"
                    title="Manual team answer (bypasses robot)"
                  >
                    Override
                  </button>
                </div>
              </form>

            </div>

            {/* COLUMN 3: RIGHT PANEL (CUSTOMER INSTANT PROFILE DATASHEET & TIMELINE) - SPANS 3 COLS */}
            <div className="xl:col-span-3 space-y-6">
              
              {/* Profile card */}
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-5 backdrop-blur-md space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] uppercase font-black text-[var(--text-subtle)] tracking-wider">Customer Profile</h4>
                  <span className="text-[10px] bg-emerald-600/10 text-emerald-400 font-black font-mono border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    Score: {activeChat.leadScore}
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <h3 className="text-sm font-black text-[var(--text)]">{activeChat.name}</h3>
                    <p className="text-[10.5px] text-[var(--text-muted)]">{activeChat.phone}</p>
                    <p className="text-[10.5px] text-[var(--text-muted)]">{activeChat.email}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5 pt-3 border-t border-[var(--border)]/60 text-xs">
                    <div>
                      <p className="text-[9px] text-[var(--text-subtle)] font-bold uppercase">Lead Source</p>
                      <p className="text-[var(--text)] font-medium">{activeChat.source}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-[var(--text-subtle)] font-bold uppercase">Current Class</p>
                      <p className="text-[var(--text)] font-medium">{activeChat.leadStatus}</p>
                    </div>
                  </div>
                </div>

                {/* Timeline activity flow */}
                <div className="pt-4 border-t border-[var(--border)]/60 space-y-3">
                  <p className="text-[9.5px] font-black tracking-widest text-[#5d5d6b] uppercase">Interaction Timeline</p>
                  
                  <div className="space-y-3.5">
                    {activeChat.timeline.map((tl, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs">
                        <div className="mt-0.5">
                          {tl.checked ? (
                            <div className="w-4 h-4 rounded-full bg-blue-500 text-[var(--text)] flex items-center justify-center text-[10px]"><Check size={10} /></div>
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-[var(--border-strong)] bg-[#0a0a0c]" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 leading-tight">
                          <p className={`font-semibold ${tl.checked ? "text-[var(--text)]" : "text-[var(--text-subtle)] text-[var(--text-subtle)]"}`}>{tl.event}</p>
                          <p className="text-[9.5px] text-[var(--text-subtle)] font-mono mt-0.5">{tl.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions Panel */}
                <div className="pt-4 border-t border-[var(--border)]/60 space-y-2">
                  <p className="text-[9.5px] font-black tracking-widest text-[var(--text-subtle)] uppercase">Immediate Team Actions</p>
                  
                  <div className="grid grid-cols-1 gap-2">
                    <button 
                      onClick={bookQuickAppointment}
                      className="w-full py-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text)] border border-[var(--border)] rounded-xl text-[10.5px] text-[var(--text)] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5 text-blue-400" /> Book Appointment
                    </button>
                    
                    <button 
                      onClick={createPaymentLink}
                      className="w-full py-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text)] border border-[var(--border)] rounded-xl text-[10.5px] text-[var(--text)] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-purple-400" /> Create Payment Link
                    </button>

                    <button 
                      onClick={assignHuman}
                      className="w-full py-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text)] border border-[var(--border)] rounded-xl text-[10.5px] text-[var(--text)] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-yellow-400" /> Assign Human Agent
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={markAsConverted}
                        className="py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-xl text-[10px] font-black uppercase cursor-pointer text-center"
                      >
                        Convert Lead
                      </button>
                      <button 
                        onClick={exportLeadData}
                        className="py-2 bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] rounded-xl text-[10px] font-bold uppercase cursor-pointer text-center"
                      >
                         Export
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* Bot response parameters card */}
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-5 backdrop-blur-md space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text)] uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span>AI Response Insights</span>
                </div>
                
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-subtle)]">Knowledge Source:</span>
                    <span className="text-[var(--text)] font-mono bg-[var(--bg-elevated)] px-2 py-0.5 rounded font-bold">{aiInsight.source}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-subtle)]">Confidence Score:</span>
                    <span className="text-emerald-400 font-mono font-bold bg-[var(--bg-elevated)] px-2 py-0.5 rounded">{aiInsight.confidence}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-subtle)]">Response Speed:</span>
                    <span className="text-blue-400 font-mono font-bold bg-[var(--bg-elevated)] px-2 py-0.5 rounded">{aiInsight.responseTime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-subtle)]">FAQ ID Key Matched:</span>
                    <span className="text-[var(--text)] font-bold truncate max-w-[120px]">{aiInsight.faqMatched}</span>
                  </div>
                </div>
              </div>

              {/* Floating notification activity feed banner */}
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-4 backdrop-blur-md space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] uppercase font-black text-[var(--text-subtle)] tracking-wider">Real-Time Event Feed</h4>
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                </div>
                
                <div className="space-y-2 overflow-y-auto max-h-[140px] pr-1">
                  {alerts.map((alt) => (
                    <div key={alt.id} className="p-2 bg-[var(--bg)]/80 border border-[var(--border)] rounded-xl text-[10px] relative font-sans leading-relaxed text-[var(--text)] group">
                      <button 
                        onClick={() => setAlerts(p => p.filter(a => a.id !== alt.id))} 
                        className="absolute right-1 top-1 text-[var(--text-subtle)] hover:text-[var(--text)] transition cursor-pointer"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                      <p className="pr-3 font-semibold">{alt.text}</p>
                      <p className="text-[8px] text-[var(--text-subtle)] text-[var(--text-subtle)] font-mono text-right mt-1">{alt.time}</p>
                    </div>
                  ))}
                  
                  {alerts.length === 0 && (
                    <p className="text-[9.5px] text-center text-[var(--text-subtle)] py-4 font-sans">No recent telemetry events</p>
                  )}
                </div>
              </div>

            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
