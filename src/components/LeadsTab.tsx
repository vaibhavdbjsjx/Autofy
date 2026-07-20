import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  Search,
  SlidersHorizontal,
  LayoutGrid,
  Table,
  Plus,
  TrendingUp,
  AlertCircle,
  Phone,
  MessageSquare,
  Calendar,
  CreditCard,
  UserCheck,
  UserPlus,
  Download,
  Flame,
  CloudSun,
  Snowflake,
  Sparkles,
  CheckCircle,
  Clock,
  MapPin,
  Briefcase,
  ChevronRight,
  User,
  X,
  FileSpreadsheet,
  FileText,
  Share2,
  Trash2,
  HelpCircle,
  Smartphone
} from "lucide-react";

// Types for Leads CRM
export interface LeadEvent {
  title: string;
  description: string;
  date: string;
  type: "first_contact" | "ai_reply" | "appointment" | "pay_received" | "converted";
  completed: boolean;
}

export interface ChatMessage {
  sender: "user" | "bot";
  text: string;
  time: string;
}

export interface LeadItem {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  source: string;
  leadScore: number; // 0 - 100
  lastActive: string;
  status: "New Lead" | "Contacted" | "Appointment Scheduled" | "Payment Received" | "Converted";
  businessType: string;
  assignedTo: string;
  createdDate: string;
  insights: string[];
  conversations: ChatMessage[];
  timeline: LeadEvent[];
}

interface LeadsTabProps {
  leads: any[];
  setLeads: React.Dispatch<React.SetStateAction<any[]>>;
  triggerNotification: (text: string) => void;
}

// Full 5 stages in Kanban board
const STAGES = [
  { id: "New Lead", label: "New Lead", icon: "NEW", color: "border-blue-500/20 text-blue-400 bg-blue-500/5 hover:bg-blue-500/10" },
  { id: "Contacted", label: "Contacted", icon: "", color: "border-purple-500/20 text-purple-400 bg-purple-500/5 hover:bg-purple-500/10" },
  { id: "Appointment Scheduled", label: "Appointment Scheduled", icon: "", color: "border-amber-500/20 text-amber-450 text-amber-400 bg-amber-500/5 hover:bg-amber-500/10" },
  { id: "Payment Received", label: "Payment Received", icon: "", color: "border-indigo-500/20 text-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/10" },
  { id: "Converted", label: "Converted", icon: "", color: "border-emerald-500/20 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10" }
] as const;

export const LeadsTab: React.FC<LeadsTabProps> = ({ leads, setLeads, triggerNotification }) => {
  const [isCrmLoading, setIsCrmLoading] = useState(true);
  React.useEffect(() => {
    const t = setTimeout(() => setIsCrmLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  // Local active copy to keep highly detailed info without losing synchronization
  const [crmLeads, setCrmLeads] = useState<LeadItem[]>([
    {
      id: "l1",
      name: "Vaibhav SG",
      phone: "+91 91720 40420",
      email: "vaibhav.sg18@gmail.com",
      address: "Prestige Tech Park, Outer Ring Rd, Bengaluru, Karnataka 560103",
      source: "WhatsApp Inquiry",
      leadScore: 92,
      lastActive: "2 mins ago",
      status: "New Lead",
      businessType: "Motorcycle Accessories",
      assignedTo: "Self (Owner)",
      createdDate: "2026-06-20",
      insights: [
        "High chance of conversion ",
        "Requested Sound Exhaust specifications twice",
        "Immediate follow up recommended to close premium lead."
      ],
      conversations: [
        { sender: "user", text: "Hey! I'm looking for a premium sound AEW exhaust for Interceptor 650.", time: "10:11 AM" },
        { sender: "bot", text: "Hi Vaibhav! We have the polished AEW Exhaust V3 in stock (12 units). Costs ₹6,500. Sound is crisp, mild sound with optional dB killer included.", time: "10:12 AM" },
        { sender: "user", text: "Sounds superb, what's our fastest turnaround for Bengaluru distribution?", time: "10:13 AM" },
        { sender: "bot", text: "We offer immediate local dispatch inside 24 hours. PAN-India takes 3-5 days. Let me generate a direct paylink for you.", time: "10:14 AM" }
      ],
      timeline: [
        { title: "First Contact", description: "Inbound ping from WhatsApp on AEW Exhaust query", date: "June 20, 10:11 AM", type: "first_contact", completed: true },
        { title: "AI Replied", description: "Trained chatbot explained stock rates and sounds", date: "June 20, 10:12 AM", type: "ai_reply", completed: true },
        { title: "Appointment Scheduled", description: "Booked standard delivery schedule", date: "Pending", type: "appointment", completed: false },
        { title: "Payment Received", description: "Awaiting UPI verification", date: "Pending", type: "pay_received", completed: false },
        { title: "Converted Status", description: "Marked active client", date: "Pending", type: "converted", completed: false }
      ]
    },
    {
      id: "l2",
      name: "Priya Patel",
      phone: "+91 98765 01234",
      email: "priya.patel@gmail.com",
      address: "Marvel Towers, Indiranagar 100ft Rd, Bengaluru 560038",
      source: "QR Scan Fly",
      leadScore: 85,
      lastActive: "15 mins ago",
      status: "Appointment Scheduled",
      businessType: "Fitness Studio",
      assignedTo: "Coach Rohit",
      createdDate: "2026-06-20",
      insights: [
        "Customer asked membership pricing.",
        "Trial workout appointment booked for tomorrow at 4:30 PM."
      ],
      conversations: [
        { sender: "user", text: "Do you have individual trial packages?", time: "08:15 AM" },
        { sender: "bot", text: "Yes Priya! We offer a custom Trial Session workout. We can book it for you tomorrow.", time: "08:16 AM" },
        { sender: "user", text: "Please book it for 4:30 PM. I am visiting with my sibling.", time: "08:29 AM" },
        { sender: "bot", text: "Done! I have safely recorded your session with Coach Rohit at our AC cardio floor.", time: "08:30 AM" }
      ],
      timeline: [
        { title: "First Contact", description: "Connected through landing QR Scan coupon code", date: "June 20, 08:15 AM", type: "first_contact", completed: true },
        { title: "AI Replied", description: "Assistant detailed session policies and slot options", date: "June 20, 08:16 AM", type: "ai_reply", completed: true },
        { title: "Appointment Scheduled", description: "Trial Session Workout scheduled tomorrow 4:30 PM", date: "June 20, 08:30 AM", type: "appointment", completed: true },
        { title: "Payment Received", description: "Pending trial sign-fee", date: "Pending", type: "pay_received", completed: false },
        { title: "Converted Status", description: "Awaiting review", date: "Pending", type: "converted", completed: false }
      ]
    },
    {
      id: "l3",
      name: "Rahul Sharma",
      phone: "+91 91234 56789",
      email: "rahul.sharma@outlook.com",
      address: "Block A4, Koramangala 4th Block, S.T. Bed, Bengaluru 560034",
      source: "Instagram ad",
      leadScore: 98,
      lastActive: "12 mins ago",
      status: "Payment Received",
      businessType: "Fitness Studio",
      assignedTo: "Self (Owner)",
      createdDate: "2026-06-20",
      insights: [
        "Customer requested payment link.",
        "Payment completed on UPI instantly tracker. Revenue recognized."
      ],
      conversations: [
        { sender: "user", text: "How can I register for the 3 Month Premium membership?", time: "10:02 AM" },
        { sender: "bot", text: "Hi Rahul! The 3-Month Premium AC Membership costs ₹5,000. It grants full cardio access and coaching templates.", time: "10:04 AM" },
        { sender: "user", text: "Great, share the direct UPI payment link.", time: "10:10 AM" },
        { sender: "bot", text: "Awesome! Here is your secure Paylink: UPI/AutofitStudio@paytm. Touch to pay instantly.", time: "10:12 AM" },
        { sender: "user", text: "Done. Sent ₹5,000 via GPay. Confirm?", time: "10:13 AM" },
        { sender: "bot", text: "Received! Thank you, Rahul. Your invoice has been synchronized.", time: "10:14 AM" }
      ],
      timeline: [
        { title: "First Contact", description: "Discovered via Instagram Sponsor Ad Campaign", date: "June 20, 10:02 AM", type: "first_contact", completed: true },
        { title: "AI Replied", description: "Agent served pricing terms and benefits guide", date: "June 20, 10:04 AM", type: "ai_reply", completed: true },
        { title: "Appointment Scheduled", description: "First kickoff assessment set up", date: "June 20, 10:12 AM", type: "appointment", completed: true },
        { title: "Payment Received", description: "UPI Premium pay of ₹5,000 reconciled successfully", date: "June 20, 10:14 AM", type: "pay_received", completed: true },
        { title: "Converted Status", description: "Auto-promoted to customer file", date: "Pending", type: "converted", completed: false }
      ]
    },
    {
      id: "l4",
      name: "Ananya Saxena",
      phone: "+91 74011 22334",
      email: "ananya.saxena@gmail.com",
      address: "Suncity Apartments, Sarjapur Road, Outer Ring Rd, Bengaluru 560102",
      source: "WhatsApp Chat",
      leadScore: 54,
      lastActive: "Yesterday",
      status: "Contacted",
      businessType: "Boutique Shop",
      assignedTo: "Suman K.",
      createdDate: "2026-06-19",
      insights: [
        "Follow up within 48 hours.",
        "Inquired about parking availability."
      ],
      conversations: [
        { sender: "user", text: "Where can I park my vehicle?", time: "Yesterday, 11:10 AM" },
        { sender: "bot", text: "Hi Ananya! We have free basement parking for up to 30 two-wheelers and 8 cars. Just let the security know you are visiting inside.", time: "Yesterday, 11:12 AM" },
        { sender: "user", text: "Thank you, that answers all my queries!", time: "Yesterday, 11:15 AM" }
      ],
      timeline: [
        { title: "First Contact", description: "WhatsApp greeting query regarding store location", date: "June 19, 11:10 AM", type: "first_contact", completed: true },
        { title: "AI Replied", description: "Answered parking queries safely", date: "June 19, 11:12 AM", type: "ai_reply", completed: true },
        { title: "Appointment Scheduled", description: "Pending store visit date", date: "Pending", type: "appointment", completed: false },
        { title: "Payment Received", description: "Awaiting catalog browse", date: "Pending", type: "pay_received", completed: false },
        { title: "Converted Status", description: "Awaiting", date: "Pending", type: "converted", completed: false }
      ]
    },
    {
      id: "l5",
      name: "Amit K. Verma",
      phone: "+91 85544 32109",
      email: "amitverma.co@yahoo.com",
      address: "Tech Ridge, Electronic City Phase 1, Bengaluru 560100",
      source: "Google Places Search",
      leadScore: 95,
      lastActive: "1 hr ago",
      status: "Converted",
      businessType: "Motorcycle Accessories",
      assignedTo: "Alok R.",
      createdDate: "2026-06-19",
      insights: [
        "Completed enrollment payout for exhausts.",
        "High rating active client in local database."
      ],
      conversations: [
        { sender: "user", text: "I need corporate booking details for local heavy exhaust retrofits.", time: "Yesterday, 04:30 PM" },
        { sender: "bot", text: "Sure Amit! I am connecting you with our store manager Alok for custom quotation drafts. Would you like to set a meeting?", time: "Yesterday, 04:31 PM" },
        { sender: "user", text: "Yes please. Book us tomorrow 11:00 AM.", time: "Yesterday, 04:52 PM" },
        { sender: "bot", text: "Wonderful. Alok will meet you with custom wholesale pricing models.", time: "Yesterday, 04:53 PM" }
      ],
      timeline: [
        { title: "First Contact", description: "Google reviews listing outbound redirect line", date: "June 19, 04:30 PM", type: "first_contact", completed: true },
        { title: "AI Replied", description: "Routed to wholesale catalogue specs sheet", date: "June 19, 04:31 PM", type: "ai_reply", completed: true },
        { title: "Appointment Scheduled", description: "Consultation set up", date: "June 19, 04:52 PM", type: "appointment", completed: true },
        { title: "Payment Received", description: "Advance escrow invoice payment processed safely", date: "June 20, 09:30 AM", type: "pay_received", completed: true },
        { title: "Converted Status", description: "Confirmed high volume retail order", date: "June 20, 11:00 AM", type: "converted", completed: true }
      ]
    },
    {
      id: "l6",
      name: "Vikram Rathore",
      phone: "+91 94443 23412",
      email: "rathore_vikram@gmail.com",
      address: "RMZ Ecospace, Bellandur, Outer Ring Rd, Bengaluru 560103",
      source: "Instagram ad",
      leadScore: 32,
      lastActive: "Yesterday",
      status: "Contacted",
      businessType: "Boutique Shop",
      assignedTo: "Coach Rohit",
      createdDate: "2026-06-18",
      insights: [
        "Asked listing catalog prices once.",
        "Payment link viewed but not completed relative to resistance bands."
      ],
      conversations: [
        { sender: "user", text: "Show me the gym loop bands pricing.", time: "June 18, 02:22 PM" },
        { sender: "bot", text: "We have heavy-duty loop resistance bands for ₹450 available ready to ship.", time: "June 18, 02:25 PM" },
        { sender: "user", text: "Great. Can I get a WhatsApp link?", time: "June 18, 02:30 PM" }
      ],
      timeline: [
        { title: "First Contact", description: "Instagram campaign landing page product check", date: "June 18, 02:22 PM", type: "first_contact", completed: true },
        { title: "AI Replied", description: "Shared loop pricing catalog features list", date: "June 18, 02:25 PM", type: "ai_reply", completed: true },
        { title: "Appointment Scheduled", description: "Pending trial workout", date: "Pending", type: "appointment", completed: false },
        { title: "Payment Received", description: "Paylink skipped", date: "Pending", type: "pay_received", completed: false },
        { title: "Converted Status", description: "Awaiting client review", date: "Pending", type: "converted", completed: false }
      ]
    }
  ]);

  // View switch state: "kanban" vs "table"
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");

  // Search & Filter state values
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [scoreFilter, setScoreFilter] = useState("all"); // "hot", "warm", "cold", "all"
  const [assignedFilter, setAssignedFilter] = useState("all");

  // Lead Details Drawer state
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  // Manual Add Form modal toggle state
  const [isAddingLead, setIsAddingLead] = useState(false);
  const [newLeadName, setNewLeadName] = useState("");
  const [newLeadPhone, setNewLeadPhone] = useState("");
  const [newLeadEmail, setNewLeadEmail] = useState("");
  const [newLeadSource, setNewLeadSource] = useState("WhatsApp Chat");
  const [newLeadBizType, setNewLeadBizType] = useState("Fitness Studio");
  const [newLeadAddress, setNewLeadAddress] = useState("");

  // Target selected lead object
  const selectedLead = useMemo(() => {
    return crmLeads.find(l => l.id === selectedLeadId) || null;
  }, [selectedLeadId, crmLeads]);

  // Scoring mapping helper
  const getScoreClassification = (score: number) => {
    if (score >= 80) return { label: "Hot Lead ", style: "border-red-500/25 text-red-400 bg-red-500/5", icon: <Flame className="w-3 h-3 text-red-500 animate-pulse" /> };
    if (score >= 50) return { label: "Warm Lead ", style: "border-amber-500/25 text-amber-400 bg-amber-500/5", icon: <CloudSun className="w-3 h-3 text-amber-500" /> };
    return { label: "Cold Lead ", style: "border-blue-500/25 text-blue-400 bg-blue-500/5", icon: <Snowflake className="w-3 h-3 text-blue-400" /> };
  };

  // Drag and drop state indicators
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

  // Dynamic statistics calculator
  const stats = useMemo(() => {
    const total = crmLeads.length;
    const newToday = crmLeads.filter(l => l.createdDate === "2026-06-20").length;
    const convertedCount = crmLeads.filter(l => l.status === "Converted").length;
    const rate = total ? Math.round((convertedCount / total) * 100) : 0;
    
    // Revenue opportunity helper
    const potentialRevenue = crmLeads.reduce((acc, current) => {
      let val = 2500; // default estimated value
      if (current.businessType.includes("Exhaust")) val = 6500;
      if (current.status === "Payment Received" || current.status === "Converted") val = 5000;
      return acc + val;
    }, 0);

    return { total, newToday, convertedCount, rate, potentialRevenue };
  }, [crmLeads]);

  // Unique lists for filtering dropdowns
  const sourcesList = useMemo(() => {
    return Array.from(new Set(crmLeads.map(l => l.source)));
  }, [crmLeads]);

  const assignedUsersList = useMemo(() => {
    return Array.from(new Set(crmLeads.map(l => l.assignedTo)));
  }, [crmLeads]);

  // Filter and search computation
  const filteredLeads = useMemo(() => {
    return crmLeads.filter((lead) => {
      const matchesSearch =
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone.includes(searchQuery) ||
        lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
      const matchesSource = sourceFilter === "all" || lead.source === sourceFilter;
      const matchesAssigned = assignedFilter === "all" || lead.assignedTo === assignedFilter;

      let matchesScore = true;
      if (scoreFilter === "hot") matchesScore = lead.leadScore >= 80;
      else if (scoreFilter === "warm") matchesScore = lead.leadScore >= 50 && lead.leadScore < 80;
      else if (scoreFilter === "cold") matchesScore = lead.leadScore < 50;

      return matchesSearch && matchesStatus && matchesSource && matchesAssigned && matchesScore;
    });
  }, [crmLeads, searchQuery, statusFilter, sourceFilter, scoreFilter, assignedFilter]);

  // Drag and Drop Handling
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedLeadId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: LeadItem["status"]) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || draggedLeadId;
    if (!id) return;

    // Update the local state status
    setCrmLeads((prev) => {
      const matchIndex = prev.findIndex(l => l.id === id);
      if (matchIndex === -1) return prev;

      const updated = [...prev];
      const previousStatus = updated[matchIndex].status;
      
      if (previousStatus !== targetStatus) {
        updated[matchIndex] = {
          ...updated[matchIndex],
          status: targetStatus,
          // Sync appropriate timeline item completion status
          timeline: updated[matchIndex].timeline.map(evt => {
            if (targetStatus === "Appointment Scheduled" && evt.type === "appointment") {
              return { ...evt, completed: true, date: "June 20, 03:50 PM" };
            }
            if (targetStatus === "Payment Received" && evt.type === "pay_received") {
              return { ...evt, completed: true, date: "June 20, 03:50 PM" };
            }
            if (targetStatus === "Converted" && evt.type === "converted") {
              return { ...evt, completed: true, date: "June 20, 03:50 PM" };
            }
            return evt;
          })
        };

        // Propagate change message back
        triggerNotification(` Piper: Moved "${updated[matchIndex].name}" to ${targetStatus}`);
      }
      return updated;
    });

    // Sync into top-level dashboard metrics if they have a shared hook
    setDraggedLeadId(null);
  };

  // Update lead status manual selection helper
  const handleStatusChangeManual = (id: string, newStatus: LeadItem["status"]) => {
    setCrmLeads(prev => prev.map(lead => {
      if (lead.id === id) {
        return {
          ...lead,
          status: newStatus,
          timeline: lead.timeline.map(evt => {
            if (newStatus === "Appointment Scheduled" && evt.type === "appointment") return { ...evt, completed: true, date: "June 20, 03:50 PM" };
            if (newStatus === "Payment Received" && evt.type === "pay_received") return { ...evt, completed: true, date: "June 20, 03:50 PM" };
            if (newStatus === "Converted" && evt.type === "converted") return { ...evt, completed: true, date: "June 20, 03:50 PM" };
            return evt;
          })
        };
      }
      return lead;
    }));
    triggerNotification(` Updated lead status node successfully`);
  };

  // Add manually submitted lead form
  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName || !newLeadPhone) return;

    // Randomize score and insights for high fidelity realistic feeling
    const scoreVal = Math.floor(Math.random() * 40) + 60; // 60 - 100 range
    const initialId = `leads-${Date.now().toString().substring(7)}`;
    
    const item: LeadItem = {
      id: initialId,
      name: newLeadName,
      phone: newLeadPhone,
      email: newLeadEmail || `${newLeadName.toLowerCase().replace(/\s+/g, ".")}@gmail.com`,
      address: newLeadAddress || "Koramangala, Bengaluru, India",
      source: newLeadSource,
      leadScore: scoreVal,
      lastActive: "Just now",
      status: "New Lead",
      businessType: newLeadBizType,
      assignedTo: "Self (Owner)",
      createdDate: "2026-06-20",
      insights: [
        `Captured from ${newLeadSource} live sync.`,
        "Recommended pricing pitch with custom checkout link."
      ],
      conversations: [
        { sender: "user", text: `Hello, this is ${newLeadName}, looking for standard pricing.`, time: "Just now" },
        { sender: "bot", text: `Welcome to our business channel! I am the automated Autofy assistant here to help.`, time: "Just now" }
      ],
      timeline: [
        { title: "First Contact", description: `Discovered from ${newLeadSource}`, date: "Today, Just now", type: "first_contact", completed: true },
        { title: "AI Replied", description: "Fired automated core welcome template sequence", date: "Today, Just now", type: "ai_reply", completed: true },
        { title: "Appointment Scheduled", description: "Pending kickoff scheduling slot", date: "Pending", type: "appointment", completed: false },
        { title: "Payment Received", description: "Pending Paylink", date: "Pending", type: "pay_received", completed: false },
        { title: "Converted Status", description: "Reviewing", date: "Pending", type: "converted", completed: false }
      ]
    };

    setCrmLeads(prev => [item, ...prev]);

    // Cleanup form
    setNewLeadName("");
    setNewLeadPhone("");
    setNewLeadEmail("");
    setNewLeadAddress("");
    setIsAddingLead(false);

    triggerNotification(`Captured lead: ${item.name} (${item.leadScore}% score)`);
  };

  // Quick Action Utilities
  const makeCallMock = (lead: LeadItem) => {
    triggerNotification(` Simulating Call to ${lead.name} (${lead.phone})... Dialed!`);
  };

  const openWhatsAppMock = (lead: LeadItem) => {
    triggerNotification(` Redirecting to WhatsApp Chat: https://wa.me/${lead.phone.replace(/\s+/g, "")}`);
    window.open(`https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}`, "_blank");
  };

  const bookAppointmentMock = (lead: LeadItem) => {
    setCrmLeads(prev => prev.map(l => {
      if (l.id === lead.id) {
        return {
          ...l,
          status: "Appointment Scheduled",
          timeline: l.timeline.map(evt => {
            if (evt.type === "appointment") return { ...evt, completed: true, date: "Today, 03:50 PM" };
            return evt;
          })
        };
      }
      return l;
    }));
    triggerNotification(` Booked Trial appointment for ${lead.name} set up on default calendar`);
  };

  const generatePaymentLinkMock = (lead: LeadItem) => {
    const paylink = `https://autofy.app/checkout/Paylink-${lead.id}`;
    setCrmLeads(prev => prev.map(l => {
      if (l.id === lead.id) {
        return {
          ...l,
          insights: [...l.insights, `Shared custom checkouts: ${paylink}`],
          conversations: [
            ...l.conversations,
            { sender: "bot", text: `I generated a custom transaction link for you! Touch to complete payment: ${paylink}`, time: "Just now" }
          ]
        };
      }
      return l;
    }));
    triggerNotification(` Transaction generated! Shared Paylink with ${lead.name}`);
  };

  const assignToTeamMock = (lead: LeadItem, agentName: string) => {
    setCrmLeads(prev => prev.map(l => {
      if (l.id === lead.id) {
        return { ...l, assignedTo: agentName };
      }
      return l;
    }));
    triggerNotification(` Assigned Lead ${lead.name} to Agent ${agentName}`);
  };

  const archiveDeleteLead = (id: string, name: string) => {
    setCrmLeads(prev => prev.filter(l => l.id !== id));
    setSelectedLeadId(null);
    triggerNotification(` Lead "${name}" archived successfully`);
  };

  // Mock Export Functions
  const handleExport = (type: "csv" | "excel" | "pdf") => {
    if (crmLeads.length === 0) {
      triggerNotification(" No lead data matches the criteria to export.");
      return;
    }

    triggerNotification(` Commencing data packaging. Generating ${type.toUpperCase()} file structures...`);
    
    setTimeout(() => {
      const timestamp = new Date().toISOString().substring(0, 10);
      const filename = `autofy_leads_export_${timestamp}.${type === "excel" ? "xlsx" : type}`;
      triggerNotification(` Download ready: Saved "${filename}" with ${filteredLeads.length} lines`);
    }, 1500);
  };

  if (isCrmLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            Leads Management <span className="text-xs bg-blue-500/10 text-blue-400 font-normal px-2.5 py-0.5 rounded-full border border-blue-500/20 font-mono">HubSpot Mode</span>
          </h2>
          <p className="text-xs text-neutral-400 font-medium">Track, manage, and convert every customer inquiry seamlessly inside your funnel.</p>
        </div>
        <div className="bg-[#050508]/30 border border-var(--border) rounded-3xl p-6 space-y-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-14 w-full rounded-2xl shimmer bg-var(--bg-elevated)/50" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER BAR DETAILS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            Leads Management <span className="text-xs bg-blue-500/10 text-blue-400 font-normal px-2.5 py-0.5 rounded-full border border-blue-500/20 font-mono">HubSpot Mode</span>
          </h2>
          <p className="text-xs text-neutral-400 text-neutral-400 font-medium">Track, manage, and convert every customer inquiry seamlessly inside your funnel.</p>
        </div>

        {/* View Switches & Manual Insertion */}
        <div className="flex items-center gap-2.5">
          <div className="bg-var(--bg-elevated) border border-var(--border) p-1 rounded-xl flex items-center">
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-2 rounded-lg transition-all cursor-pointer ${
                viewMode === "kanban" 
                  ? "bg-blue-600 text-white shadow-sm" 
                  : "text-neutral-400 hover:text-white"
              }`}
              title="Pipeline View (Columns)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-lg transition-all cursor-pointer ${
                viewMode === "table" 
                  ? "bg-blue-600 text-white shadow-sm" 
                  : "text-neutral-400 hover:text-white"
              }`}
              title="Table Grid View"
            >
              <Table className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setIsAddingLead(true)}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-[11px] rounded-xl hover:from-blue-500 hover:to-indigo-500 transition shadow shadow-blue-500/20 cursor-pointer uppercase tracking-wider flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Create Lead
          </button>
        </div>
      </div>

      {/* TOP STATISTICS CARDS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Metric 1: Total Leads */}
        <div className="bg-neutral-950/40 border border-var(--border) rounded-2xl p-4.5 p-4 backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Total Leads</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-3.5">
            <h4 className="text-2xl font-black text-white font-sans">{stats.total}</h4>
            <p className="text-[9.5px] text-neutral-500 mt-1 leading-none">Registered database</p>
          </div>
        </div>

        {/* Metric 2: New Leads Today */}
        <div className="bg-neutral-950/40 border border-var(--border) rounded-2xl p-4.5 p-4 backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">New Leads Today</span>
            <Sparkles className="w-4 h-4 text-emerald-450 text-emerald-400" />
          </div>
          <div className="mt-3.5">
            <h4 className="text-2xl font-black text-emerald-400 font-sans">+{stats.newToday}</h4>
            <p className="text-[9.5px] text-neutral-500 mt-1 leading-none">Fresh traffic inbound</p>
          </div>
        </div>

        {/* Metric 3: Converted Leads */}
        <div className="bg-neutral-950/40 border border-var(--border) rounded-2xl p-4.5 p-4 backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Converted Leads</span>
            <CheckCircle className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-3.5">
            <h4 className="text-2xl font-black text-white font-sans">{stats.convertedCount}</h4>
            <p className="text-[9.5px] text-neutral-500 mt-1 leading-none">Closed deals successfully</p>
          </div>
        </div>

        {/* Metric 4: Conversion Rate */}
        <div className="bg-neutral-950/40 border border-var(--border) rounded-2xl p-4.5 p-4 backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider font-sans">Conversion rate</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-3.5">
            <h4 className="text-2xl font-black text-purple-400 font-sans">{stats.rate}%</h4>
            {/* Dynamic gauge indicator */}
            <div className="w-full bg-var(--bg-elevated) h-1 rounded-full mt-2.5 overflow-hidden">
              <div className="bg-purple-500 h-full rounded-full" style={{ width: `${stats.rate}%` }} />
            </div>
          </div>
        </div>

        {/* Metric 5: Revenue Opportunity potential */}
        <div className="bg-gradient-to-b from-blue-950/20 to-indigo-950/10 border border-blue-500/10 rounded-2xl p-4.5 p-4 backdrop-blur-md flex flex-col justify-between col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Revenue Opportunity</span>
            <CreditCard className="w-4 h-4 text-blue-400 animate-pulse" />
          </div>
          <div className="mt-3.5">
            <h4 className="text-xl sm:text-2xl font-black text-white font-mono">₹{stats.potentialRevenue.toLocaleString()}</h4>
            <p className="text-[9px] text-blue-450 text-blue-400 mt-1 leading-none">In funnel value estimate</p>
          </div>
        </div>

      </div>

      {/* SEARCH AND FILTERS TOOLBAR */}
      <div className="bg-neutral-950/50 border border-var(--border) rounded-2xl p-4 backdrop-blur-md space-y-3.5 font-sans">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          
          {/* Search bar inputs */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads by name, phone line, email, lead ID..."
              className="w-full bg-var(--bg-elevated) border border-var(--border) rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/40 font-semibold"
            />
          </div>

          {/* Quick Filters Toggles */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Status Selector */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-var(--bg-elevated) border border-var(--border) px-3 py-2 rounded-xl text-neutral-300 text-xs focus:outline-none cursor-pointer font-bold"
            >
              <option value="all"> All Funnel Stages</option>
              <option value="New Lead">New Lead</option>
              <option value="Contacted"> Contacted</option>
              <option value="Appointment Scheduled"> Scheduled</option>
              <option value="Payment Received"> Payment Received</option>
              <option value="Converted"> Converted</option>
            </select>

            {/* Source Selector */}
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="bg-var(--bg-elevated) border border-var(--border) px-3 py-2 rounded-xl text-neutral-300 text-xs focus:outline-none cursor-pointer font-bold"
            >
              <option value="all"> All Sources</option>
              {sourcesList.map(src => (
                <option key={src} value={src}>{src}</option>
              ))}
            </select>

            {/* Score Selector mapping Hot, Warm, Cold */}
            <select
              value={scoreFilter}
              onChange={(e) => setScoreFilter(e.target.value)}
              className="bg-var(--bg-elevated) border border-var(--border) px-3 py-2 rounded-xl text-neutral-300 text-xs focus:outline-none cursor-pointer font-bold"
            >
              <option value="all"> All Temperature Scores</option>
              <option value="hot">Hot Lead (&gt;80 score) </option>
              <option value="warm">Warm Lead (50-80 score) </option>
              <option value="cold">Cold Lead (&lt;50 score) </option>
            </select>

            {/* Assigned Agent filter */}
            <select
              value={assignedFilter}
              onChange={(e) => setAssignedFilter(e.target.value)}
              className="bg-var(--bg-elevated) border border-var(--border) px-3 py-2 rounded-xl text-neutral-300 text-xs focus:outline-none cursor-pointer font-bold"
            >
              <option value="all"> All Owners</option>
              {assignedUsersList.map(usr => (
                <option key={usr} value={usr}>{usr}</option>
              ))}
            </select>

            {/* Reset button if filter is active */}
            {(searchQuery || statusFilter !== "all" || sourceFilter !== "all" || scoreFilter !== "all" || assignedFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setSourceFilter("all");
                  setScoreFilter("all");
                  setAssignedFilter("all");
                  triggerNotification(" Cleared CRM search filters");
                }}
                className="px-3.5 py-2 bg-var(--bg-elevated) hover:bg-neutral-800 text-white rounded-xl text-xs font-black cursor-pointer transition-colors"
              >
                Clear
              </button>
            )}

          </div>

          {/* Export data triggers */}
          <div className="flex items-center gap-1.5 border-t lg:border-t-0 border-var(--border) pt-2 lg:pt-0">
            <button
              onClick={() => handleExport("csv")}
              className="px-3 py-2 bg-var(--bg-elevated)/60 border border-var(--border) text-neutral-400 text-xs font-bold rounded-xl hover:text-white cursor-pointer flex items-center justify-center gap-1.5 flex-1 lg:flex-none"
              title="Export filtered leads as CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-450" /> CSV
            </button>
            <button
              onClick={() => handleExport("excel")}
              className="px-3 py-2 bg-var(--bg-elevated)/60 border border-var(--border) text-neutral-400 text-xs font-bold rounded-xl hover:text-white cursor-pointer flex items-center justify-center gap-1.5 flex-1 lg:flex-none"
              title="Export filtered leads as XLSX"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-450" /> Excel
            </button>
            <button
              onClick={() => handleExport("pdf")}
              className="px-3 py-2 bg-var(--bg-elevated)/60 border border-var(--border) text-neutral-400 text-xs font-bold rounded-xl hover:text-white cursor-pointer flex items-center justify-center gap-1.5 flex-1 lg:flex-none"
              title="Export filtered leads as PDF report"
            >
              <FileText className="w-3.5 h-3.5 text-red-400" /> PDF
            </button>
          </div>

        </div>
      </div>

      {/* CORE VIEWPORT CANVAS: KANBAN BOARD vs TABLE VIEW */}
      <AnimatePresence mode="wait">
        
        {/* VIEW 1: PIPELINE KANBAN BOARD */}
        {viewMode === "kanban" && (
          <motion.div
            key="kanban-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start select-none"
          >
            {STAGES.map((stage) => {
              // Filters items corresponding to this column status
              const stageLeads = filteredLeads.filter((l) => l.status === stage.id);
              
              return (
                <div
                  key={stage.id}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, stage.id)}
                  className={`bg-neutral-950/40 border border-var(--border) rounded-2.5xl rounded-2xl p-3.5 min-h-[500px] flex flex-col transition-all duration-200 border-dashed ${
                    draggedLeadId ? "border-blue-500/20 bg-blue-500/[0.01]" : ""
                  }`}
                >
                  
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-var(--border)">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">{stage.icon}</span>
                      <h3 className="text-[11.5px] font-black text-white font-sans uppercase tracking-tight truncate max-w-[130px]">
                        {stage.label}
                      </h3>
                    </div>
                    <span className="bg-var(--bg-elevated)/80 border border-var(--border)/60 text-neutral-300 font-mono text-[9px] px-2 py-0.5 rounded-full font-black">
                      {stageLeads.length}
                    </span>
                  </div>

                  {/* List of cards */}
                  <div className="flex-1 space-y-3 overflow-y-auto max-h-[550px] pr-1 scrollbar-thin">
                    {stageLeads.map((item) => {
                      const scoreClass = getScoreClassification(item.leadScore);
                      return (
                        <div
                          key={item.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, item.id)}
                          onClick={() => setSelectedLeadId(item.id)}
                          className="bg-[#0b0b0d]/90 border border-var(--border) hover:border-var(--border) rounded-2xl p-4.5 p-4 space-y-3.5 cursor-grab active:cursor-grabbing hover:bg-var(--bg-elevated)/20 active:scale-[0.98] transition-all relative overflow-hidden group shadow-md"
                        >
                          {/* Top row: Name & Score classification tag */}
                          <div className="space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-xs sm:text-[13px] font-black text-white font-sans group-hover:text-blue-400 transition-colors truncate">
                                {item.name}
                              </h4>
                              <span className={`text-[8.5px] font-extrabold uppercase px-1.5 py-0.5 rounded border flex items-center gap-1 shrink-0 ${scoreClass.style}`}>
                                {scoreClass.icon}
                                {item.leadScore}%
                              </span>
                            </div>
                            <span className="text-[10px] text-neutral-500 font-mono font-medium block">ID: {item.id}</span>
                          </div>

                          {/* Contact Info lines */}
                          <div className="space-y-1 text-[11px] text-neutral-400 font-sans">
                            <p className="flex items-center gap-1.5 truncate">
                              <Phone className="w-3 h-3 text-neutral-500 shrink-0" />
                              <span>{item.phone}</span>
                            </p>
                            <p className="flex items-center gap-1.5 truncate text-neutral-500">
                              <User className="w-3 h-3 text-neutral-500 shrink-0" />
                              <span>Assigned: {item.assignedTo}</span>
                            </p>
                          </div>

                          {/* Source & Last active timing row */}
                          <div className="flex items-center justify-between pt-3 border-t border-var(--border)/60 text-[10px]">
                            <span className="text-blue-400 bg-blue-500/5 border border-blue-500/10 rounded px-1.5 py-0.5 font-bold scale-95 origin-left truncate max-w-[100px]">
                              {item.source}
                            </span>
                            <span className="text-neutral-500 flex items-center gap-1 text-[9.5px] font-medium font-sans">
                              <Clock className="w-3 h-3 text-neutral-600" />
                              {item.lastActive}
                            </span>
                          </div>

                          {/* Simulated Drag handle highlight bar */}
                          <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />
                        </div>
                      );
                    })}

                    {stageLeads.length === 0 && (
                      <div className="text-center py-12 border border-dashed border-var(--border) rounded-2xl bg-neutral-950/10">
                        <Users className="w-6 h-6 text-neutral-700 mx-auto mb-2" />
                        <p className="text-[10px] text-neutral-500 font-sans font-medium px-2">No prospects in this stage</p>
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </motion.div>
        )}

        {/* VIEW 2: COMPREHENSIVE DATA TABLE VIEW */}
        {viewMode === "table" && (
          <motion.div
            key="table-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-neutral-950/40 border border-var(--border) rounded-3xl p-5 backdrop-blur-md overflow-x-auto"
          >
            <table className="w-full text-left border-collapse min-w-[900px] font-sans">
              <thead>
                <tr className="border-b border-var(--border) text-neutral-500 text-[10px] uppercase font-black tracking-widest">
                  <th className="pb-3 text-xs font-bold text-neutral-410 pl-2">Lead / ID</th>
                  <th className="pb-3 text-xs font-bold text-neutral-410">Contact details</th>
                  <th className="pb-3 text-xs font-bold text-neutral-410 font-bold text-center">Score rating</th>
                  <th className="pb-3 text-xs font-bold text-neutral-410">Funnel Status</th>
                  <th className="pb-3 text-xs font-bold text-neutral-410">Lead Source</th>
                  <th className="pb-3 text-xs font-bold text-neutral-410">Owner</th>
                  <th className="pb-3 text-xs font-bold text-neutral-410">Created Date</th>
                  <th className="pb-3 text-xs font-bold text-neutral-410 text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900/30 text-xs font-sans text-neutral-300 font-medium select-text">
                {filteredLeads.map((item) => {
                  const scoreClass = getScoreClassification(item.leadScore);
                  return (
                    <tr 
                      key={item.id} 
                      className="hover:bg-var(--bg-elevated)/20 group transition duration-150 cursor-pointer"
                      onClick={() => setSelectedLeadId(item.id)}
                    >
                      <td className="py-4 font-bold text-white group-hover:text-blue-400 pl-2">
                        <div className="flex items-center gap-1.5">
                          <div>
                            <p className="font-extrabold text-sm">{item.name}</p>
                            <p className="text-[9.5px] text-neutral-500 font-mono font-black text-neutral-500 uppercase mt-0.5">{item.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <p className="font-mono text-[11px] text-white">{item.phone}</p>
                        <p className="text-[10px] text-neutral-500 truncate max-w-[150px]">{item.email}</p>
                      </td>
                      <td className="py-4 text-center">
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border border-var(--border) bg-var(--bg-elevated)/50">
                          {scoreClass.icon}
                          <span className="text-[10px] font-black text-white font-mono">{item.leadScore}%</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center">
                          {/* Quick selection status change */}
                          <select 
                            value={item.status}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleStatusChangeManual(item.id, e.target.value as any);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#0b0b0e] border border-var(--border) px-2 py-1 rounded text-[10px] text-neutral-300 font-bold focus:outline-none focus:border-blue-500/40 cursor-pointer"
                          >
                            <option value="New Lead">New Lead</option>
                            <option value="Contacted"> Contacted</option>
                            <option value="Appointment Scheduled"> Scheduled</option>
                            <option value="Payment Received"> Payment</option>
                            <option value="Converted"> Converted</option>
                          </select>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="text-blue-400 font-bold bg-blue-500/5 border border-blue-500/10 px-2 py-0.5 rounded text-[10px]">
                          {item.source}
                        </span>
                      </td>
                      <td className="py-4 text-neutral-400 font-bold text-[11px]">
                        {item.assignedTo}
                      </td>
                      <td className="py-4 font-mono text-[10px] text-neutral-500">
                        {item.createdDate}
                      </td>
                      <td className="py-4 text-right pr-2">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => makeCallMock(item)}
                            className="p-1.5 bg-[#101015] border border-var(--border) text-neutral-400 hover:text-white rounded-lg transition hover:border-neutral-800"
                            title="Call customer"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openWhatsAppMock(item)}
                            className="p-1.5 bg-[#101015] border border-var(--border) text-neutral-400 hover:text-emerald-400 rounded-lg transition hover:border-neutral-800"
                            title="WhatsApp client lines"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => archiveDeleteLead(item.id, item.name)}
                            className="p-1.5 bg-[#1a0c0c] border border-red-950 text-neutral-500 hover:text-red-400 rounded-lg transition"
                            title="Delete Lead node"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredLeads.length === 0 && (
              <div className="text-center py-20 font-sans">
                <Users className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
                <h4 className="text-sm font-black text-white">Your filtered list is empty</h4>
                <p className="text-xs text-neutral-500 mt-1">Try relaxing search parameters or filters to load more prospects.</p>
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>

      {/* FILTER EMPTY DATABASE STATE (IF NO LEADS REGISTERED AT ALL) */}
      {crmLeads.length === 0 && (
        <div className="bg-neutral-950/40 border border-var(--border) rounded-3xl p-12 text-center backdrop-blur-md space-y-4 font-sans max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto animate-bounce">
            <Smartphone className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-black text-white uppercase tracking-wider">Your captured leads will appear here</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto leading-relaxed">
              Connect your professional WhatsApp sandbox line to capture automated incoming chats and turn inquiries into hot sales leads instantly on Autofy CRM!
            </p>
          </div>
          <button
            onClick={() => {
              triggerNotification(" WhatsApp Live API session requested. Redirecting...");
            }}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-xs rounded-xl hover:from-blue-500 hover:to-indigo-500 shadow shadow-blue-500/20 cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
          >
            Connect WhatsApp
          </button>
        </div>
      )}

      {/* DETAILED LEAD SIDEBAR DRAWER (DETAILED GLASS PANEL ON RIGHT SIDE) */}
      <AnimatePresence>
        {selectedLeadId !== null && selectedLead && (
          <>
            {/* Dark abstract overlay click shield */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLeadId(null)}
              className="fixed inset-0 bg-black z-40 backdrop-blur-sm cursor-pointer"
            />

            {/* Sidebar Slide Sheet */}
            <motion.div
              initial={{ x: "100%", opacity: 0.95 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-[500px] bg-[#0c0c0f]/95 border-l border-var(--border) z-50 p-6 flex flex-col justify-between shadow-2xl backdrop-blur-md text-white font-sans overflow-y-auto"
            >
              <div className="space-y-6">
                
                {/* Header detail */}
                <div className="flex items-start justify-between pb-4 border-b border-var(--border)">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-blue-400 bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/10">
                      Funnel Prospect Node
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-white font-sans mt-1.5">{selectedLead.name}</h3>
                    <p className="text-xs text-neutral-500 font-mono">Database Record: {selectedLead.id}</p>
                  </div>

                  <button
                    onClick={() => setSelectedLeadId(null)}
                    className="p-1.5 bg-[#141418] border border-var(--border) hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* SCORING CLASSIFICATION HEAT STATUS */}
                <div className="bg-var(--bg-elevated)/40 border border-var(--border) p-4 rounded-2xl space-y-2 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-neutral-400">Autofy Scoring index</span>
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded border flex items-center gap-1 ${getScoreClassification(selectedLead.leadScore).style}`}>
                      {getScoreClassification(selectedLead.leadScore).icon}
                      {getScoreClassification(selectedLead.leadScore).label}
                    </span>
                  </div>
                  
                  {/* Progress bar gauge details */}
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex-1 bg-[#151519] h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-amber-500 to-red-500 h-full rounded-full" style={{ width: `${selectedLead.leadScore}%` }} />
                    </div>
                    <span className="font-mono text-xs font-black text-white">{selectedLead.leadScore}% Profile Weight</span>
                  </div>

                  <div className="pt-2 text-[10px] text-neutral-500 font-semibold leading-relaxed flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    Calculated by AI based on response rate, booking calendar attempts & payment intent checks.
                  </div>
                </div>

                {/* CUSTOMER DETAILED INFORMATION DIRECTORY */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-neutral-400 uppercase tracking-widest font-sans">Customer Profile Facts</h4>
                  
                  <div className="p-4 bg-[#0d0d10] border border-var(--border) rounded-2xl space-y-3 text-[11.5px] leading-relaxed">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] text-[#4b4c53] font-black uppercase font-mono block">Registered Phone</span>
                        <p className="font-mono font-bold text-white select-all">{selectedLead.phone}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-[#4b4c53] font-black uppercase font-mono block">Email Line</span>
                        <p className="text-neutral-300 font-semibold select-all truncate max-w-[150px]">{selectedLead.email}</p>
                      </div>
                    </div>

                    <div className="flex items-start justify-between gap-3 pt-3 border-t border-var(--border)/60">
                      <div className="space-y-1">
                        <span className="text-[10px] text-[#4b4c53] font-black uppercase font-mono block">Funnel Source</span>
                        <p className="text-blue-400 font-extrabold">{selectedLead.source}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-[#4b4c53] font-black uppercase font-mono block">Registered Segment</span>
                        <p className="text-purple-400 font-extrabold">{selectedLead.businessType}</p>
                      </div>
                    </div>

                    <div className="space-y-1 pt-3 border-t border-var(--border)/60 select-all">
                      <span className="text-[10px] text-[#4b4c53] font-black uppercase font-mono block">Physical Address / Shipping Destination</span>
                      <p className="text-neutral-300 leading-normal font-sans"><MapPin className="w-3.5 h-3.5 text-neutral-500 inline mr-1" />{selectedLead.address}</p>
                    </div>
                  </div>
                </div>

                {/* SMART INSIGHT PANEL (AI DEEP ANALYSIS COGNIZANT ENGINE) */}
                <div className="space-y-3 font-sans">
                  <h4 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" /> Smart Funnel Insights
                  </h4>
                  
                  <div className="p-4 bg-gradient-to-r from-[#030712] to-[#111827] border border-blue-500/10 rounded-2xl space-y-2">
                    {selectedLead.insights.map((insight, id) => (
                      <div key={id} className="flex items-start gap-2.5 text-neutral-300 text-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        <p className="leading-relaxed font-semibold">{insight}</p>
                      </div>
                    ))}
                    {selectedLead.insights.length === 0 && (
                      <p className="text-xs text-neutral-500">No active alerts. Client is progressing naturally inside normal pipeline tracks.</p>
                    )}
                  </div>
                </div>

                {/* INTEGRATIVE CHATBOT CONVERSATION HISTORY STREAM */}
                <div className="space-y-3 font-sans">
                  <h4 className="text-xs font-black text-neutral-400 uppercase tracking-widest">WhatsApp Chat History Interaction</h4>
                  
                  <div className="bg-[#08080a] border border-var(--border) rounded-2xl overflow-hidden">
                    <div className="px-4 py-2 bg-var(--bg-elevated)/50 border-b border-var(--border) text-[10px] font-mono text-neutral-500 flex items-center justify-between">
                      <span>Live Sandbox Log</span>
                      <span className="text-emerald-400">● Live Feed synced</span>
                    </div>

                    <div className="p-4 space-y-3.5 max-h-[220px] overflow-y-auto">
                      {selectedLead.conversations.map((msg, i) => (
                        <div key={i} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                          <div className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                            msg.sender === "user"
                              ? "bg-blue-600 text-white rounded-tr-none"
                              : "bg-var(--bg-elevated) border border-var(--border) text-neutral-250 text-neutral-200 rounded-tl-none"
                          }`}>
                            {msg.text}
                          </div>
                          <span className="text-[8.5px] text-neutral-500 mt-1 font-mono tracking-tight">{msg.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* EVENT TIMELINE CHRONICLES */}
                <div className="space-y-3.5 font-sans">
                  <h4 className="text-xs font-black text-neutral-400 uppercase tracking-widest">Activity Funnel Timeline</h4>
                  
                  <div className="p-4 bg-neutral-950/40 border border-var(--border) rounded-2xl space-y-5 relative">
                    
                    {/* Visual Connector Line */}
                    <div className="absolute left-[23px] top-6 bottom-6 w-0.5 bg-var(--bg-elevated) z-0" />

                    {selectedLead.timeline.map((evt, index) => {
                      // Check standard milestones matching layout
                      const isPast = evt.completed;
                      return (
                        <div key={index} className="flex gap-4 items-start relative z-10 text-xs">
                          
                          {/* Point indicator */}
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                            isPast 
                              ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/10" 
                              : "bg-neutral-950 border-var(--border) text-neutral-500"
                          }`}>
                            {isPast ? <CheckCircle size={12} /> : index + 1}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2.5">
                              <h5 className={`font-bold transition-colors ${isPast ? "text-white" : "text-neutral-500"}`}>
                                {evt.title}
                              </h5>
                              <span className="text-[9px] text-neutral-500 font-mono font-medium shrink-0">{evt.date}</span>
                            </div>
                            <p className={`text-[11px] leading-relaxed mt-0.5 ${isPast ? "text-neutral-400" : "text-neutral-600"}`}>
                              {evt.description}
                            </p>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* QUICK CONTROL ACTION PLATFORMS PANEL (BOTTOM OF DRAWER) */}
              <div className="pt-4 border-t border-var(--border) mt-6 grid grid-cols-2 gap-2 text-xs font-semibold">
                
                <button
                  onClick={() => makeCallMock(selectedLead)}
                  className="px-3.5 py-2.5 bg-var(--bg-elevated) border border-var(--border) hover:bg-neutral-80 & text-white rounded-xl hover:border-neutral-800 font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5 text-blue-400" /> Call Client
                </button>

                <button
                  onClick={() => openWhatsAppMock(selectedLead)}
                  className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Line
                </button>

                <button
                  onClick={() => bookAppointmentMock(selectedLead)}
                  className="px-3.5 py-2.5 bg-var(--bg-elevated) border border-var(--border) text-white rounded-xl hover:bg-neutral-800 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5 text-amber-500" /> Book Slot
                </button>

                <button
                  onClick={() => generatePaymentLinkMock(selectedLead)}
                  className="px-3.5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-550 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5 text-white" /> Pay Invoice
                </button>

                <div className="col-span-2 grid grid-cols-3 gap-2 pt-2 border-t border-neutral-950">
                  <button
                    onClick={() => handleStatusChangeManual(selectedLead.id, "Converted")}
                    className="py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 hover:bg-emerald-500/20 text-[10.5px] font-bold rounded-xl transition cursor-pointer"
                  >
                    Set Converted
                  </button>

                  <button
                    onClick={() => {
                      const list = ["Suman K.", "Alok R.", "Coach Rohit", "Self (Owner)"];
                      const currentId = list.indexOf(selectedLead.assignedTo);
                      const next = list[(currentId + 1) % list.length];
                      assignToTeamMock(selectedLead, next);
                    }}
                    className="py-2 bg-var(--bg-elevated) border border-var(--border) text-neutral-400 hover:text-white text-[10.5px] font-bold rounded-xl transition cursor-pointer"
                  >
                    Reassign Owner
                  </button>

                  <button
                    onClick={() => archiveDeleteLead(selectedLead.id, selectedLead.name)}
                    className="py-2 bg-red-950/20 text-red-400 border border-red-500/10 hover:bg-red-950/40 text-[10.5px] font-bold rounded-xl transition cursor-pointer"
                  >
                    Archive Lead
                  </button>
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MODAL WINDOW: MANUAL ADD LEAD INSERTION */}
      <AnimatePresence>
        {isAddingLead && (
          <>
            {/* Backdrop cover filter blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingLead(false)}
              className="fixed inset-0 bg-black z-50 backdrop-blur-sm cursor-pointer"
            />

            {/* Dialog Panel Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed inset-2 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md w-full bg-[#0a0a0d] border border-var(--border) rounded-3xl p-6 shadow-2xl z-[60] backdrop-blur-md text-white font-sans overflow-y-auto max-h-[90vh]"
            >
              
              <div className="flex items-center justify-between pb-3.5 border-b border-var(--border) mb-5">
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-blue-400" /> Capture Prospect Manually
                </h3>
                <button
                  onClick={() => setIsAddingLead(false)}
                  className="p-1 text-neutral-500 hover:text-white rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateLead} className="space-y-4 text-xs text-neutral-300 font-medium">
                
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-neutral-500">FullName *</label>
                  <input
                    type="text"
                    required
                    value={newLeadName}
                    onChange={(e) => setNewLeadName(e.target.value)}
                    placeholder="e.g. Sridhar Murthy"
                    className="w-full bg-[#121217] border border-var(--border) rounded-xl px-3.5 py-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500/40 font-semibold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black text-neutral-500">Phone Mobile *</label>
                    <input
                      type="text"
                      required
                      value={newLeadPhone}
                      onChange={(e) => setNewLeadPhone(e.target.value)}
                      placeholder="e.g. +91 99887 76655"
                      className="w-full bg-[#121217] border border-var(--border) rounded-xl px-3.5 py-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500/40 font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black text-neutral-500">Email Address (Optional)</label>
                    <input
                      type="email"
                      value={newLeadEmail}
                      onChange={(e) => setNewLeadEmail(e.target.value)}
                      placeholder="e.g. sridhar@gmail.com"
                      className="w-full bg-[#121217] border border-var(--border) rounded-xl px-3.5 py-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500/40"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black text-neutral-500">Traffic Source</label>
                    <select
                      value={newLeadSource}
                      onChange={(e) => setNewLeadSource(e.target.value)}
                      className="w-full bg-[#121217] border border-var(--border) rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500/40 font-semibold cursor-pointer"
                    >
                      <option value="WhatsApp Chat"> WhatsApp Chat</option>
                      <option value="Instagram ad"> Instagram Ad Campaign</option>
                      <option value="Direct Reference"> Client Referral</option>
                      <option value="Google Places Search"> Google Search Places</option>
                      <option value="QR Scan Fly"> QR Store Flyer</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black text-neutral-500">Business Unit Category</label>
                    <select
                      value={newLeadBizType}
                      onChange={(e) => setNewLeadBizType(e.target.value)}
                      className="w-full bg-[#121217] border border-var(--border) rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500/40 font-semibold cursor-pointer"
                    >
                      <option value="Fitness Studio"> Gym & Fitness Studio</option>
                      <option value="Motorcycle Accessories"> AEW Motorcycle Spares</option>
                      <option value="Boutique Shop"> Luxury Boutique items</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-neutral-500">Physical Address / Territory Location</label>
                  <textarea
                    value={newLeadAddress}
                    onChange={(e) => setNewLeadAddress(e.target.value)}
                    placeholder="e.g. Indiranagar, Bengaluru, KA"
                    className="w-full bg-[#121217] border border-var(--border) rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 h-16 placeholder-neutral-700"
                  />
                </div>

                <div className="pt-4 flex items-center justify-end gap-2 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setIsAddingLead(false)}
                    className="px-4 py-2.5 bg-[#141418] hover:bg-neutral-800 rounded-xl text-neutral-400 hover:text-white transition cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg shadow-blue-500/10 cursor-pointer hover:from-blue-500 hover:to-indigo-500 transition-all font-extrabold"
                  >
                    Register Prospect
                  </button>
                </div>

              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};
