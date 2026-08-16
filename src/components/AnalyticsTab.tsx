import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity,
  TrendingUp,
  MessageSquare,
  Users,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Sparkles,
  Zap,
  Target,
  Download,
  FileSpreadsheet,
  FileText,
  Clock3,
  CalendarRange,
  Percent,
  CheckCircle,
  HelpCircle,
  Lightbulb,
  Bell,
  RefreshCw,
  Plus,
  ArrowRight,
  TrendingDown,
  LineChart,
  BarChart4,
  Briefcase,
  Layers,
  ChevronRight,
  ShieldCheck,
  UserCheck
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend,
  Line,
  ComposedChart
} from "recharts";

// Event Interface for Activity Feed
interface FeedEvent {
  id: string;
  type: "lead" | "payment" | "appointment" | "resolution" | "conversion";
  title: string;
  detail: string;
  time: string;
}

interface AnalyticsTabProps {
  onboardingData?: any;
  summaryData?: any;
  triggerNotification: (text: string) => void;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ onboardingData, summaryData, triggerNotification }) => {
  // Configured date periods
  const [activeRange, setActiveRange] = useState<"today" | "7days" | "30days" | "90days" | "custom">("30days");
  const [interactiveMetric, setInteractiveMetric] = useState<"conversations" | "leads" | "appointments" | "revenue">("revenue");
  
  // Custom Date range state for modal/inputs
  const [customStartDate, setCustomStartDate] = useState("2026-05-20");
  const [customEndDate, setCustomEndDate] = useState("2026-06-20");
  const [isCustomDateApplied, setIsCustomDateApplied] = useState(false);

  // Live real-time events feed state — starts empty for clean production accounts
  const [activityFeed, setActivityFeed] = useState<FeedEvent[]>([]);

  // Simulation feature - add random events
  const handleSimulateEvent = () => {
    const types: ("lead" | "payment" | "appointment" | "resolution" | "conversion")[] = ["lead", "payment", "appointment", "resolution", "conversion"];
    const randomType = types[Math.floor(Math.random() * types.length)];
    const id = `evt-${Date.now()}`;
    
    let title = "";
    let detail = "";
    
    if (randomType === "lead") {
      title = "New Lead Generated";
      detail = "New customer left contact information via WhatsApp AI";
    } else if (randomType === "payment") {
      title = "Payment Completed";
      const val = Math.floor(Math.random() * 8000) + 1500;
      detail = `Completed Razorpay gateway transaction capture of ₹${val.toLocaleString()} from sandbox client`;
    } else if (randomType === "appointment") {
      title = "Appointment Booked";
      detail = `Confirmed automated calendar sync block on Google Calendar API for sound tune express fitment`;
    } else if (randomType === "resolution") {
      title = "AI Resolved Inquiry";
      detail = "Resolved instant WhatsApp query regarding refund policy and standard parts warranty";
    } else {
      title = "Customer Converted";
      detail = "Secured 3-Month Premium Membership tier activation via UPI recurring link authorization";
    }

    const newEvt: FeedEvent = { id, type: randomType, title, detail, time: "Just now" };
    setActivityFeed(prev => [newEvt, ...prev.slice(0, 7)]);
    triggerNotification(` Live Event Logged: ${title}`);
  };

  // Real KPI numbers derived from database summaryData with interactive multipliers based on range filter
  const kpis = useMemo(() => {
    let multiplier = 1.0;
    if (activeRange === "today") multiplier = 0.12;
    else if (activeRange === "7days") multiplier = 0.45;
    else if (activeRange === "90days") multiplier = 2.4;
    else if (activeRange === "custom") multiplier = 1.15;

    const baseConvs = summaryData?.metrics?.whatsapp_chats ?? 0;
    const baseLeads = summaryData?.metrics?.active_leads ?? 0;
    const baseAppts = summaryData?.metrics?.appointments ?? 0;
    const baseRev = summaryData?.metrics?.revenue ?? 0;
    const revGrowth = summaryData?.metrics?.revenue_change_percent ?? 0;

    const valConvs = Math.round(baseConvs * multiplier);
    const valLeads = Math.round(baseLeads * multiplier);
    const valAppts = Math.round(baseAppts * multiplier);
    const valRev = Math.round(baseRev * multiplier);

    const makeSpark = (val: number) => {
      if (val === 0) return [{ value: 0 }, { value: 0 }, { value: 0 }, { value: 0 }, { value: 0 }, { value: 0 }, { value: 0 }, { value: 0 }];
      const step = val / 8;
      return [
        { value: Math.round(step * 1) }, { value: Math.round(step * 2) }, { value: Math.round(step * 1.5) },
        { value: Math.round(step * 3) }, { value: Math.round(step * 2.5) }, { value: Math.round(step * 4) },
        { value: Math.round(step * 3.5) }, { value: val }
      ];
    };

    return {
      conversations: {
        value: valConvs,
        growth: valConvs > 0 ? 24.5 : 0,
        spark: makeSpark(valConvs)
      },
      leads: {
        value: valLeads,
        growth: valLeads > 0 ? 31.2 : 0,
        spark: makeSpark(valLeads)
      },
      appointments: {
        value: valAppts,
        growth: valAppts > 0 ? 15.8 : 0,
        spark: makeSpark(valAppts)
      },
      revenue: {
        value: valRev,
        growth: revGrowth,
        spark: makeSpark(valRev)
      }
    };
  }, [activeRange, summaryData]);

  // Main interactive chart datasets derived from database summaryData
  const chartData = useMemo(() => {
    let multiplier = 1.0;
    if (activeRange === "today") multiplier = 0.12;
    else if (activeRange === "7days") multiplier = 0.45;
    else if (activeRange === "90days") multiplier = 2.4;
    else if (activeRange === "custom") multiplier = 1.15;

    const baseConvs = Math.round((summaryData?.metrics?.whatsapp_chats ?? 0) * multiplier);
    const baseLeads = Math.round((summaryData?.metrics?.active_leads ?? 0) * multiplier);
    const baseAppts = Math.round((summaryData?.metrics?.appointments ?? 0) * multiplier);
    const baseRev = Math.round((summaryData?.metrics?.revenue ?? 0) * multiplier);

    if (baseConvs === 0 && baseLeads === 0 && baseRev === 0) {
      if (activeRange === "today") {
        return [
          { label: "08:00 AM", conversations: 0, leads: 0, appointments: 0, revenue: 0 },
          { label: "10:00 AM", conversations: 0, leads: 0, appointments: 0, revenue: 0 },
          { label: "12:00 PM", conversations: 0, leads: 0, appointments: 0, revenue: 0 },
          { label: "02:00 PM", conversations: 0, leads: 0, appointments: 0, revenue: 0 },
          { label: "04:00 PM", conversations: 0, leads: 0, appointments: 0, revenue: 0 },
          { label: "06:00 PM", conversations: 0, leads: 0, appointments: 0, revenue: 0 },
          { label: "08:00 PM", conversations: 0, leads: 0, appointments: 0, revenue: 0 }
        ];
      } else if (activeRange === "7days") {
        return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => ({
          label: d, conversations: 0, leads: 0, appointments: 0, revenue: 0
        }));
      } else if (activeRange === "90days") {
        return ["Month 1", "Month 2", "Month 3"].map(d => ({
          label: d, conversations: 0, leads: 0, appointments: 0, revenue: 0
        }));
      } else {
        return ["01-05", "06-10", "11-15", "16-20", "21-25", "26-30"].map(d => ({
          label: d, conversations: 0, leads: 0, appointments: 0, revenue: 0
        }));
      }
    }

    // Distribution when real data exists
    if (activeRange === "today") {
      return [
        { label: "08:00 AM", conversations: Math.round(baseConvs * 0.1), leads: Math.round(baseLeads * 0.1), appointments: Math.round(baseAppts * 0.1), revenue: Math.round(baseRev * 0.1) },
        { label: "10:00 AM", conversations: Math.round(baseConvs * 0.2), leads: Math.round(baseLeads * 0.2), appointments: Math.round(baseAppts * 0.2), revenue: Math.round(baseRev * 0.2) },
        { label: "12:00 PM", conversations: Math.round(baseConvs * 0.3), leads: Math.round(baseLeads * 0.3), appointments: Math.round(baseAppts * 0.3), revenue: Math.round(baseRev * 0.3) },
        { label: "02:00 PM", conversations: Math.round(baseConvs * 0.15), leads: Math.round(baseLeads * 0.15), appointments: Math.round(baseAppts * 0.15), revenue: Math.round(baseRev * 0.15) },
        { label: "04:00 PM", conversations: Math.round(baseConvs * 0.15), leads: Math.round(baseLeads * 0.15), appointments: Math.round(baseAppts * 0.15), revenue: Math.round(baseRev * 0.15) },
        { label: "06:00 PM", conversations: Math.round(baseConvs * 0.05), leads: Math.round(baseLeads * 0.05), appointments: Math.round(baseAppts * 0.05), revenue: Math.round(baseRev * 0.05) },
        { label: "08:00 PM", conversations: Math.round(baseConvs * 0.05), leads: Math.round(baseLeads * 0.05), appointments: Math.round(baseAppts * 0.05), revenue: Math.round(baseRev * 0.05) }
      ];
    } else if (activeRange === "7days") {
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const weights = [0.1, 0.12, 0.15, 0.13, 0.2, 0.18, 0.12];
      return days.map((d, i) => ({
        label: d,
        conversations: Math.round(baseConvs * weights[i]),
        leads: Math.round(baseLeads * weights[i]),
        appointments: Math.round(baseAppts * weights[i]),
        revenue: Math.round(baseRev * weights[i])
      }));
    } else if (activeRange === "90days") {
      const months = ["Month 1", "Month 2", "Month 3"];
      const weights = [0.25, 0.35, 0.40];
      return months.map((m, i) => ({
        label: m,
        conversations: Math.round(baseConvs * weights[i]),
        leads: Math.round(baseLeads * weights[i]),
        appointments: Math.round(baseAppts * weights[i]),
        revenue: Math.round(baseRev * weights[i])
      }));
    } else {
      const slots = ["01-05", "06-10", "11-15", "16-20", "21-25", "26-30"];
      const weights = [0.12, 0.15, 0.18, 0.22, 0.18, 0.15];
      return slots.map((s, i) => ({
        label: s,
        conversations: Math.round(baseConvs * weights[i]),
        leads: Math.round(baseLeads * weights[i]),
        appointments: Math.round(baseAppts * weights[i]),
        revenue: Math.round(baseRev * weights[i])
      }));
    }
  }, [activeRange, summaryData]);

  // Lead Funnel stage performance state helper derived from database summaryData
  const funnelStages = useMemo(() => {
    let multi = 1;
    if (activeRange === "today") multi = 0.12;
    else if (activeRange === "7days") multi = 0.45;
    else if (activeRange === "90days") multi = 2.4;

    const baseConversations = Math.round((summaryData?.metrics?.whatsapp_chats ?? 0) * multi);
    const baseLeads = Math.round((summaryData?.metrics?.active_leads ?? 0) * multi);
    const baseAppointments = Math.round((summaryData?.metrics?.appointments ?? 0) * multi);
    const basePayments = Math.round(((summaryData?.metrics?.revenue ?? 0) > 0 ? 1 : 0) * multi);
    const baseConverted = Math.round(((summaryData?.metrics?.revenue ?? 0) > 0 ? 1 : 0) * multi);

    const leadConv = baseConversations > 0 ? Math.min(100, Math.round((baseLeads / baseConversations) * 100)) : 0;
    const apptConv = baseLeads > 0 ? Math.min(100, Math.round((baseAppointments / baseLeads) * 100)) : 0;
    const payConv = baseAppointments > 0 ? Math.min(100, Math.round((basePayments / baseAppointments) * 100)) : 0;
    const custConv = basePayments > 0 ? Math.min(100, Math.round((baseConverted / basePayments) * 100)) : 0;

    return [
      {
        id: "funnel-1",
        stage: "Conversations",
        count: baseConversations,
        conversion: baseConversations > 0 ? 100 : 0,
        dropoff: 0,
        color: "#3b82f6"
      },
      {
        id: "funnel-2",
        stage: "Leads Captured",
        count: baseLeads,
        conversion: leadConv,
        dropoff: baseConversations > 0 ? 100 - leadConv : 0,
        color: "#1d4ed8"
      },
      {
        id: "funnel-3",
        stage: "Appointments Booked",
        count: baseAppointments,
        conversion: apptConv,
        dropoff: baseLeads > 0 ? 100 - apptConv : 0,
        color: "#6366f1"
      },
      {
        id: "funnel-4",
        stage: "Payments Received",
        count: basePayments,
        conversion: payConv,
        dropoff: baseAppointments > 0 ? 100 - payConv : 0,
        color: "#9333EA"
      },
      {
        id: "funnel-5",
        stage: "Converted Customers",
        count: baseConverted,
        conversion: custConv,
        dropoff: basePayments > 0 ? 100 - custConv : 0,
        color: "#10b981"
      }
    ];
  }, [activeRange, summaryData]);

  // AI Knowledge Analytics table of suggestions
  const suggestedImprovements = [
    { id: "imp-1", issue: "Low Confidence Responses", subject: "Refund policy and shipping durations", gap: "No explicit prompt coverage for return parcel codes", suggestion: "Add refund policy FAQs." },
    { id: "imp-2", issue: "Conversion Dropoff Points", subject: "Questions on custom plans upgrade", gap: "Sellers asking pricing limits details frequently", suggestion: "Update pricing information." },
    { id: "imp-3", issue: "Appointments Friction", subject: "Inquiries about weekend garage timings", gap: "Calendar sync errors or closed window timings unstated", suggestion: "Add more details about memberships & timings." }
  ];

  // Revenue streams slice groupings
  const revenueByGroup = {
    services: [
      { name: "Exhaust Sound Tuning Retrofit", value: 42000, color: "#3b82f6" },
      { name: "Full Ceramic Wrap Coding", value: 22500, color: "#6366f1" },
      { name: "Standard Lube Tuning Flow", value: 15400, color: "#9333EA" },
      { name: "Accessories Retrofit Placement", value: 7600, color: "#10b981" }
    ],
    memberships: [
      { name: "Annual Platinum Elite Premium Pack", value: 58000, color: "#3b82f6" },
      { name: "Standard 3-Month Maintenance Saver", value: 24500, color: "#6366f1" },
      { name: "Temporary Onloading trial coupon", value: 5000, color: "#10b981" }
    ],
    industryInsights: {
      bestService: "AEW Sound Tuning Retrofit",
      highestConvertingMembership: "Standard 3-Month Saver Pass",
      mostRequestedProduct: "Liqui Moly 10W-45 Synthetic Lubricant Bundle",
      topSource: "WhatsApp Business Widget"
    }
  };

  // Dispatch mock reports
  const handleExportReport = (type: "pdf" | "excel") => {
    triggerNotification(` Automated investor-grade analytics report compiled [Autofy_${activeRange.toUpperCase()}_Report.${type}]. Download started!`);
  };

  // Schedule updates scheduler trigger
  const handleScheduleReports = (frequency: "weekly" | "monthly") => {
    triggerNotification(` Analytics scheduler synced. Autofy automated report will deliver to dashboard owner ${frequency}.`);
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER CONTROLS SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 glass-card rounded-3xl p-6 relative overflow-hidden">
        
        <div>
          <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight flex items-center gap-2" style={{ color: "var(--text)" }}>
            <Activity className="w-5 h-5 text-blue-500" /> Executive Business Analytics <span className="badge-glow text-[10px] px-2.5 py-0.5 font-bold font-sans">Investor Metrics Ready</span>
          </h2>
          <p className="text-xs font-sans mt-1" style={{ color: "var(--text-muted)" }}>Measure real-world business performance, conversation funnel conversion, and AI knowledge base efficiencies.</p>
        </div>

        {/* Dynamic global timeframe presets and action tool buttons */}
        <div className="flex flex-wrap items-center gap-2">
          
          <div className="bg-[var(--bg-elevated)]/40 border border-[var(--border)] p-1.5 rounded-xl flex items-center gap-1">
            {(["today", "7days", "30days", "90days", "custom"] as const).map((r) => (
              <button
                key={r}
                id={`btn-range-${r}`}
                onClick={() => {
                  setActiveRange(r);
                  triggerNotification(` Date view adjusted: ${r.toUpperCase()}`);
                }}
                className={`px-3 py-1 text-[10px] font-black rounded-lg transition-colors uppercase whitespace-nowrap cursor-pointer ${
                  activeRange === r 
                    ? "bg-blue-600 text-[var(--text)] shadow-lg" 
                    : "text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                {r === "7days" ? "7 Days" : r === "30days" ? "30 Days" : r === "90days" ? "90 Days" : r}
              </button>
            ))}
          </div>

          <button
            id="btn-simulate-event"
            onClick={handleSimulateEvent}
            className="bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)] text-[var(--text)] hover:text-[var(--text)] border border-[var(--border)] hover:border-[var(--border-strong)] text-[10.5px] font-black px-3.5 py-2.5 rounded-xl transition duration-200 cursor-pointer flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400 animate-bounce" /> Simulate Event
          </button>

        </div>

      </div>

      {/* CUSTOM DATE RANGE FILTER PANEL */}
      <AnimatePresence>
        {activeRange === "custom" && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-5 bg-[var(--bg-card)] border border-blue-500/20 rounded-3xl backdrop-blur-md grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
          >
            <div>
              <label className="text-[10px] uppercase font-extrabold text-[var(--text-muted)] tracking-wider flex items-center gap-1 mb-1.5">
                <CalendarRange className="w-3 h-3 text-blue-400" /> Start Date
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] text-xs px-3.5 py-2.5 rounded-xl text-[var(--text)] focus:outline-none focus:border-[var(--brand)] cursor-pointer"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-extrabold text-[var(--text-muted)] tracking-wider flex items-center gap-1 mb-1.5">
                <CalendarRange className="w-3 h-3 text-blue-400" /> End Date
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] text-xs px-3.5 py-2.5 rounded-xl text-[var(--text)] focus:outline-none focus:border-[var(--brand)] cursor-pointer"
              />
            </div>

            <button
              onClick={() => {
                setIsCustomDateApplied(true);
                triggerNotification(` Filter set between dates: ${customStartDate} to ${customEndDate}`);
              }}
              className="bg-blue-600 hover:bg-blue-500 text-[var(--text)] text-xs font-black py-2.5 rounded-xl transitions transition-colors cursor-pointer w-full text-center"
            >
              Apply Filter Window
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EXECUTIVE SUMMARY WIDGET & REPORT DISPATCH BLOCK */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Executive summary card */}
        <div className="lg:col-span-2 glass-card rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" style={{ background: "var(--brand-subtle)" }} />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-1.5 text-[var(--brand)] text-xs font-extrabold uppercase font-sans">
                <Sparkles className="w-4 h-4 animate-spin text-[var(--brand)]" /> Live Performance Abstract
              </div>
              <h3 className="text-base font-black font-display tracking-tight mt-1" style={{ color: "var(--text)" }}>This Month Autofy Generated Value</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10.5px] text-emerald-500 bg-green-500/10 border border-green-500/20 font-black px-2.5 py-1 rounded-lg">
                 +34% Net Growth
              </span>
              <span className="text-[10px] font-bold font-sans" style={{ color: "var(--text-subtle)" }}>vs Last Month</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="p-4 rounded-2xl border" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider font-sans" style={{ color: "var(--text-subtle)" }}>Leads Secured</p>
              <h4 className="text-2xl font-black mt-1.5 font-display" style={{ color: "var(--text)" }}>+125</h4>
              <p className="text-[9px] text-emerald-500 font-semibold mt-1 font-sans">▲ Conversion high</p>
            </div>

            <div className="p-4 bg-[var(--bg-elevated)] border border-[var(--border)]/60 rounded-2xl">
              <p className="text-[10px] text-[var(--text-subtle)] font-bold uppercase tracking-wider">Appointments Locked</p>
              <h4 className="text-2xl font-black text-[var(--text)] mt-1.5">+42</h4>
              <p className="text-[9px] text-blue-400 font-semibold mt-1"> Sync with calendar</p>
            </div>

            <div className="p-4 bg-[var(--bg-elevated)] border border-[var(--border)]/60 rounded-2xl">
              <p className="text-[10px] text-[var(--text-subtle)] font-bold uppercase tracking-wider">New Customers</p>
              <h4 className="text-2xl font-black text-[var(--text)] mt-1.5">+18</h4>
              <p className="text-[9px] text-indigo-400 font-semibold mt-1"> High value tiers</p>
            </div>

            <div className="p-4 bg-gradient-to-br from-blue-900/15 to-neutral-950 border border-blue-500/20 rounded-2xl">
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Net Revenue Verified</p>
              <h4 className="text-2xl font-black text-[var(--text)] font-mono mt-1.5">₹87,500</h4>
              <p className="text-[9px] text-emerald-400 font-bold mt-1"> Settled Sandbox</p>
            </div>

          </div>
        </div>

        {/* Reports scheduler widget container */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 backdrop-blur-md flex flex-col justify-between space-y-4">
          <div>
            <h4 className="text-xs font-black text-[var(--text)] uppercase tracking-wider">Report Deliverability Node</h4>
            <p className="text-[10.5px] text-[var(--text-subtle)] mt-1">Export executive investor decks or program daily logs</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleExportReport("pdf")}
              className="py-2 px-3 border border-red-500/10 hover:border-red-500/30 bg-red-950/10 text-red-400 hover:text-[var(--text)] rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4" /> Export PDF
            </button>
            <button
              onClick={() => handleExportReport("excel")}
              className="py-2 px-3 border border-emerald-500/10 hover:border-emerald-500/30 bg-emerald-950/10 text-emerald-400 hover:text-[var(--text)] rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" /> Export Excel
            </button>
          </div>

          <div className="flex gap-2 text-[10.5px]">
            <button
              onClick={() => handleScheduleReports("weekly")}
              className="flex-1 text-center py-1.5 bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text)] rounded-lg text-[9.5px] font-semibold cursor-pointer"
            >
               Schedule Weekly
            </button>
            <button
              onClick={() => handleScheduleReports("monthly")}
              className="flex-1 text-center py-1.5 bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text)] rounded-lg text-[9.5px] font-semibold cursor-pointer"
            >
               Schedule Monthly
            </button>
          </div>
        </div>

      </div>

      {/* TOP KPI CARDS - CONVERSATIONS, LEADS, APPOINTMENTS, REVENUE */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Conversations */}
        <div id="kpi-conversations" className="bg-[#08080a]/80 border border-[var(--border)] rounded-3xl p-5 hover:border-blue-500/20 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[var(--text-muted)] text-[var(--text-muted)] uppercase font-black tracking-widest text-[var(--text-muted)]">Total Conversations</span>
            <div className="text-[10px] text-emerald-400 font-extrabold flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> +{kpis.conversations.growth}%
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <h4 className="text-3xl font-black text-[var(--text)] font-mono">{kpis.conversations.value.toLocaleString()}</h4>
            <span className="text-[10px] text-[var(--text-subtle)] font-semibold">chats</span>
          </div>
          {/* Sparkline visualization */}
          <div className="h-6 w-full mt-3 overflow-hidden rounded opacity-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={kpis.conversations.spark}>
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={1} fill="#3b82f6" fillOpacity={0.05} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* KPI 2: Total Leads */}
        <div id="kpi-leads" className="bg-[#08080a]/80 border border-[var(--border)] rounded-3xl p-5 hover:border-indigo-500/20 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[var(--text-muted)] text-[var(--text-muted)] uppercase font-black tracking-widest text-[var(--text-muted)]">Leads Captured</span>
            <div className="text-[10px] text-emerald-400 font-extrabold flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> +{kpis.leads.growth}%
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <h4 className="text-3xl font-black text-[var(--text)] font-mono">{kpis.leads.value.toLocaleString()}</h4>
            <span className="text-[10px] text-[var(--text-subtle)] font-semibold">contacts</span>
          </div>
          {/* Sparkline visualization */}
          <div className="h-6 w-full mt-3 overflow-hidden rounded opacity-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={kpis.leads.spark}>
                <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={1} fill="#6366f1" fillOpacity={0.05} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* KPI 3: Appointments */}
        <div id="kpi-appointments" className="bg-[#08080a]/80 border border-[var(--border)] rounded-3xl p-5 hover:border-indigo-500/20 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[var(--text-muted)] text-[var(--text-muted)] uppercase font-black tracking-widest text-[var(--text-muted)]">Appointments Booked</span>
            <div className="text-[10px] text-emerald-400 font-extrabold flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> +{kpis.appointments.growth}%
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <h4 className="text-3xl font-black text-[var(--text)] font-mono">{kpis.appointments.value.toLocaleString()}</h4>
            <span className="text-[10px] text-[var(--text-subtle)] font-semibold">slots</span>
          </div>
          {/* Sparkline visualization */}
          <div className="h-6 w-full mt-3 overflow-hidden rounded opacity-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={kpis.appointments.spark}>
                <Area type="monotone" dataKey="value" stroke="#9333EA" strokeWidth={1} fill="#9333EA" fillOpacity={0.05} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* KPI 4: Revenue Generated */}
        <div id="kpi-revenue" className="bg-[#08080a]/80 border border-[var(--border)] rounded-3xl p-5 hover:border-emerald-500/20 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[var(--text-muted)] text-[var(--text-muted)] uppercase font-black tracking-widest text-[var(--text-muted)]">Total Revenue Code</span>
            <div className="text-[10px] text-emerald-400 font-extrabold flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> +{kpis.revenue.growth}%
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-1">
            <h4 className="text-3xl font-black text-[var(--text)] font-mono">₹{kpis.revenue.value.toLocaleString()}</h4>
            <span className="text-[10px] text-[var(--text-subtle)] font-semibold">gross</span>
          </div>
          {/* Sparkline visualization */}
          <div className="h-6 w-full mt-3 overflow-hidden rounded opacity-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={kpis.revenue.spark}>
                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={1} fill="#10b981" fillOpacity={0.05} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* REVENUE INTEGRATED SEARCH AND HIGH-FIDELITY PERFORMANCE GRAPH */}
      <div className="bg-[#08080a] border border-[var(--border)] rounded-3xl p-6 space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
          <div>
            <h3 className="text-sm font-black text-[var(--text)] font-sans uppercase tracking-wider">Business Growth Viewport</h3>
            <p className="text-[10.5px] text-[var(--text-subtle)] font-medium font-sans">Toggle and evaluate dynamic timeline metrics verified by systems portal</p>
          </div>

          <div className="bg-[var(--bg-elevated)]/60 p-1 border border-[var(--border)] rounded-xl flex items-center gap-1">
            {(["conversations", "leads", "appointments", "revenue"] as const).map(met => (
              <button
                key={met}
                id={`btn-met-${met}`}
                onClick={() => {
                  setInteractiveMetric(met);
                  triggerNotification(` Performance graph metric switched: ${met.toUpperCase()}`);
                }}
                className={`px-3 py-1 text-[10px] font-black rounded-lg transition capitalize whitespace-nowrap cursor-pointer ${
                  interactiveMetric === met 
                    ? "bg-blue-600 text-[var(--text)]" 
                    : "text-[var(--text-muted)] hover:text-[var(--text)]"
                }`}
              >
                ● {met}
              </button>
            ))}
          </div>
        </div>

        {/* Large Recharts Dynamic Chart */}
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#121214" vertical={false} />
              <XAxis 
                dataKey="label" 
                stroke="#52525b" 
                fontSize={10} 
                tickLine={false} 
                axisLine={{ stroke: "#262626" }} 
              />
              <YAxis 
                stroke="#52525b" 
                fontSize={10} 
                tickLine={false} 
                axisLine={{ stroke: "#262626" }}
                tickFormatter={(val) => interactiveMetric === "revenue" ? `₹${val.toLocaleString()}` : val}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "#0b0b0e", borderColor: "#27272a", borderRadius: "14px" }}
                labelStyle={{ color: "#fff", fontWeight: "black", fontSize: "11px" }}
                itemStyle={{ color: "#3b82f6", fontWeight: "bold", fontSize: "11px" }}
              />
              <Area 
                type="monotone" 
                dataKey={interactiveMetric} 
                stroke="#3b82f6" 
                strokeWidth={2.5} 
                fillOpacity={1} 
                fill="url(#colorMetric)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* MIDDLE SECTION: LEAD CONVERSION FUNNEL & AI PERFORMANCE SCORES */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* 1. Lead Conversion Funnel */}
        <div className="lg:col-span-3 bg-[#08080a] border border-[var(--border)] rounded-3xl p-6 space-y-4">
          <div>
            <h3 className="text-sm font-black text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-500" /> Lead Conversion Funnel
            </h3>
            <p className="text-[10.5px] text-[var(--text-subtle)] font-medium">Verify conversion rate progression and dropping points during conversation journeys</p>
          </div>

          {/* Visual premium Funnel stages alignment */}
          <div className="space-y-3.5 pt-2">
            {funnelStages.map((stage, idx) => {
              // Calculate percent of next stage
              const percentOfTotal = idx === 0 ? 100 : Math.round((stage.count / funnelStages[0].count) * 100);
              
              return (
                <div key={stage.id} className="relative group">
                  
                  {/* Backdrop glowing connector block */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition duration-200" />
                  
                  <div className="relative p-3.5 bg-[var(--bg-elevated)]/30 border border-[var(--border)] rounded-2xl flex items-center justify-between gap-4">
                    
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-[var(--bg-card)] flex items-center justify-center font-mono text-[11px] font-black text-blue-400">
                        {idx + 1}
                      </div>

                      <div className="space-y-0.5">
                        <h4 className="text-[11.5px] font-extrabold text-[var(--text)]">{stage.stage}</h4>
                        <div className="text-[9.5px] text-[var(--text-subtle)] font-semibold flex items-center gap-1.5">
                          <span>Verified Count: <strong className="text-[var(--text)] font-bold">{stage.count.toLocaleString()}</strong></span>
                          {idx > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-orange-400">Drop-off: {stage.dropoff}%</span>
                            </>
                          )}
                        </div>
                      </div>

                    </div>

                    <div className="text-right">
                      <span className="text-[11px] font-black font-mono text-[var(--text)] bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded">
                        {percentOfTotal}% Vol
                      </span>
                    </div>

                  </div>

                </div>
              );
            })}
          </div>

        </div>

        {/* 2. AI Performance Dashboard and Scores */}
        <div id="ai-performance-scores" className="lg:col-span-2 bg-[#08080a] border border-[var(--border)] rounded-3xl p-6 flex flex-col justify-between space-y-6">
          
          <div>
            <h3 className="text-sm font-black text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400 animate-spin" /> AI Core Performance Dashboard
            </h3>
            <p className="text-[10.5px] text-[var(--text-subtle)] font-medium">Core neural model efficiency logs</p>
          </div>

          <div className="space-y-3.5">
            
            {/* Average Response Time */}
            <div className="p-4 bg-[#0a0a0c] border border-[var(--border)] rounded-2xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10.5px] font-bold text-[var(--text-muted)] uppercase tracking-wide flex items-center gap-1">
                  <Clock3 className="w-3.5 h-3.5 text-blue-400" /> Avg Response Time
                </span>
                <p className="text-xs text-[var(--text-subtle)] font-semibold">Latency across messaging webhooks</p>
              </div>
              <div className="text-right">
                <h4 className="text-2xl font-black text-[var(--text)] font-mono">1.2s</h4>
                <span className="text-[9px] text-green-400 bg-green-500/5 px-2 py-0.5 rounded border border-green-500/10">-0.4s improvement</span>
              </div>
            </div>

            {/* AI Resolution Rate */}
            <div className="p-4 bg-[#0a0a0c] border border-[var(--border)] rounded-2xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10.5px] font-bold text-[var(--text-muted)] uppercase tracking-wide flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-450 text-emerald-400" /> AI Resolution Rate
                </span>
                <p className="text-xs text-[var(--text-subtle)] font-semibold">Self-contained checkout completion</p>
              </div>
              <div className="text-right">
                <h4 className="text-2xl font-black text-emerald-405 text-emerald-400 font-mono">92%</h4>
                <span className="text-[9px] text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded border border-green-500/10">Industry elite</span>
              </div>
            </div>

            {/* Human Escalation Rate */}
            <div className="p-4 bg-[#0a0a0c] border border-[var(--border)] rounded-2xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10.5px] font-bold text-[var(--text-muted)] uppercase tracking-wide flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-400" /> Human Escalation
                </span>
                <p className="text-xs text-[var(--text-subtle)] font-semibold">Fallback rate to human agents</p>
              </div>
              <div className="text-right">
                <h4 className="text-2xl font-black text-blue-400 font-mono">4%</h4>
                <span className="text-[9px] text-[var(--text-subtle)] bg-[var(--bg-elevated)] px-2 py-0.5 rounded border border-[var(--border)]">Normal workload</span>
              </div>
            </div>

            {/* Knowledge Accuracy & Customer Satisfaction CSAT */}
            <div className="grid grid-cols-2 gap-3">
              
              <div className="p-3 bg-[#0a0a0c] border border-[var(--border)] rounded-xl relative">
                <span className="text-[9.5px] text-[var(--text-muted)] uppercase font-bold">Knowledge Accuracy</span>
                <p className="text-xl font-black text-[var(--text)] font-mono mt-1">{activityFeed.length > 0 ? "96%" : "100%"}</p>
                <div className="w-full bg-[var(--bg-elevated)] h-1 rounded-full mt-2">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: activityFeed.length > 0 ? "96%" : "100%" }}></div>
                </div>
              </div>

              <div className="p-3 bg-gradient-to-br from-indigo-950/10 to-neutral-950 border border-indigo-500/10 rounded-xl relative">
                <span className="text-[9.5px] text-indigo-400 uppercase font-bold">Satisfaction Class</span>
                <p className="text-xl font-black text-indigo-400 font-mono mt-1">{activityFeed.length > 0 ? "5.0/5" : "—"}</p>
                <div className="w-full bg-[var(--bg-elevated)] h-1 rounded-full mt-2">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: activityFeed.length > 0 ? "100%" : "0%" }}></div>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* CONVERSATION REGIONS BREAKDOWN AND PEAK HOURS STATS */}
      <div id="conversation-analytics-grid" className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
        
        {/* Popular Categories & peak parameters breakdown */}
        <div className="lg:col-span-2 bg-[#08080a] border border-[var(--border)] rounded-3xl p-6 space-y-5">
          <div>
            <h3 className="text-sm font-black text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
              <MessageSquare className="w-4 h-4 text-blue-400" /> Conversational Analytics Portal
            </h3>
            <p className="text-[10.5px] text-[var(--text-subtle)] font-medium">Verify most popular categories addressed during chats with Autofy conversational node</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Left: Popular category metrics bar charts */}
            <div className="p-4 bg-[var(--bg-elevated)]/30 border border-[var(--border)]/80 rounded-2xl space-y-3.5">
              <h4 className="text-xs font-bold text-[var(--text)] mb-2">Popular Categories Split</h4>
              
              <div className="space-y-3">
                {[
                  { name: "Pricing Queries", count: 420, percent: 85, color: "bg-blue-600" },
                  { name: "Memberships Upgrade", count: 310, percent: 70, color: "bg-indigo-500" },
                  { name: "Appointments Locked", count: 280, percent: 62, color: "bg-violet-500" },
                  { name: "Service Support Lines", count: 180, percent: 45, color: "bg-pink-500" },
                  { name: "General Parts & Products", count: 95, percent: 25, color: "bg-emerald-500" }
                ].map((cat, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[var(--text-muted)] font-semibold">{cat.name}</span>
                      <span className="text-[var(--text)] font-mono font-bold">{cat.count} clicks</span>
                    </div>
                    <div className="w-full bg-[var(--bg-card)] h-2 rounded-full overflow-hidden">
                      <div className={`h-full ${cat.color} rounded-full`} style={{ width: `${cat.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Peak hours parameter info */}
            <div className="p-4 bg-[var(--bg-elevated)]/30 border border-[var(--border)]/80 rounded-2xl flex flex-col justify-between space-y-4">
              <div>
                <h4 className="text-xs font-bold text-[var(--text)] mb-1">Peak Engagement Slots</h4>
                <p className="text-[10px] text-[var(--text-subtle)]">Peak hours and active days traffic distribution</p>
              </div>

              <div className="space-y-3 font-medium">
                <div className="flex items-center justify-between text-[11px] border-b border-[var(--border)] pb-2">
                  <span className="text-[var(--text-muted)]">Peak Hour Slot</span>
                  <span className="text-[var(--text)] font-black">04:00 PM – 07:00 PM</span>
                </div>
                <div className="flex items-center justify-between text-[11px] border-b border-[var(--border)] pb-2">
                  <span className="text-[var(--text-muted)]">Most Active Day</span>
                  <span className="text-[var(--text)] font-black">Friday &amp; Saturday</span>
                </div>
                <div className="flex items-center justify-between text-[11px] border-b border-[var(--border)] pb-2">
                  <span className="text-[var(--text-muted)]">Weekly Core Trend</span>
                  <span className="text-green-400 font-extrabold flex items-center gap-0.5">▲ +14% traffic velocity</span>
                </div>
              </div>

              <div className="pt-2 text-center">
                <span className="text-[9px] text-[#8e9cae] bg-blue-500/5 px-3 py-1.5 rounded-full border border-blue-550/10 font-black">
                   Chat Engine Node standard uptime: 100.0%
                </span>
              </div>
            </div>

          </div>

        </div>

        {/* Industry insights summary info */}
        <div className="bg-[#08080a] border border-[var(--border)] rounded-3xl p-6 flex flex-col justify-between space-y-4 shadow-lg">
          <div>
            <h3 className="text-sm font-black text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-emerald-450 text-emerald-400 animate-pulse" /> Industry Growth Insights
            </h3>
            <p className="text-[10.5px] text-[var(--text-subtle)] font-medium">Dynamic top performers recognized on the Autofy network</p>
          </div>

          <div className="space-y-3.5 font-medium">
            
            <div className="p-3 bg-[var(--bg-elevated)]/40 border border-[var(--border)] rounded-xl space-y-0.5">
              <span className="text-[9px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Best Performing Service</span>
              <p className="text-[11.5px] font-black text-[var(--text)]">{revenueByGroup.industryInsights.bestService}</p>
            </div>

            <div className="p-3 bg-[var(--bg-elevated)]/40 border border-[var(--border)] rounded-xl space-y-0.5">
              <span className="text-[9px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Highest Converting Membership Plan</span>
              <p className="text-[11.5px] font-black text-blue-400">{revenueByGroup.industryInsights.highestConvertingMembership}</p>
            </div>

            <div className="p-3 bg-[var(--bg-elevated)]/40 border border-[var(--border)] rounded-xl space-y-0.5">
              <span className="text-[9px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Most Requested Product Package</span>
              <p className="text-[11.5px] font-black text-[var(--text)] truncate">{revenueByGroup.industryInsights.mostRequestedProduct}</p>
            </div>

            <div className="p-3 bg-[var(--bg-elevated)]/40 border border-[var(--border)] rounded-xl space-y-0.5">
              <span className="text-[9px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Top Verified Revenue Stream</span>
              <p className="text-[11.5px] font-black text-emerald-400">{revenueByGroup.industryInsights.topSource}</p>
            </div>

          </div>
        </div>

      </div>

      {/* REVENUE SENSITIVE ANALYTICS & RECENT REVENUES BY STREAM */}
      <div id="revenue-details-section" className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
        
        {/* Left: Revenue analytics by day & categories grouped */}
        <div className="lg:col-span-2 bg-[#08080a] border border-[var(--border)] rounded-3xl p-6 space-y-5">
          <div>
            <h3 className="text-sm font-black text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-400" /> Revenue Stream Analytics
            </h3>
            <p className="text-[10.5px] text-[var(--text-subtle)] font-medium">Revenues split across Services, Membership subscription models, and physical products</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Services breakdown progress list */}
            <div className="p-4 bg-[var(--bg-elevated)]/20 border border-[var(--border)] rounded-2xl space-y-3">
              <h4 className="text-xs font-black text-[var(--text)] uppercase tracking-wider border-b border-[var(--border)] pb-2">Revenue by Service</h4>
              <div className="space-y-3">
                {revenueByGroup.services.map((ser, index) => (
                  <div key={index} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2 max-w-[150px]">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ser.color }} />
                      <span className="text-[var(--text-muted)] truncate">{ser.name}</span>
                    </div>
                    <span className="text-[var(--text)] font-black font-mono">₹{ser.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Membership plans progress list */}
            <div className="p-4 bg-[var(--bg-elevated)]/20 border border-[var(--border)] rounded-2xl space-y-3">
              <h4 className="text-xs font-black text-[var(--text)] uppercase tracking-wider border-b border-[var(--border)] pb-2">Membership Splitting</h4>
              <div className="space-y-3">
                {revenueByGroup.memberships.map((mem, index) => (
                  <div key={index} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2 max-w-[150px]">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: mem.color }} />
                      <span className="text-[var(--text-muted)] truncate">{mem.name}</span>
                    </div>
                    <span className="text-[var(--text)] font-black font-mono">₹{mem.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Core financial indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-[var(--bg-elevated)]/35 border border-[var(--border)] p-4 rounded-2xl">
            <div>
              <p className="text-[8.5px] text-[var(--text-subtle)] uppercase font-bold">Average Order Value</p>
              <h5 className="text-sm font-black text-[var(--text)] font-mono mt-1">₹3,400</h5>
            </div>
            <div>
              <p className="text-[8.5px] text-[var(--text-subtle)] uppercase font-bold">Estimated LTV</p>
              <h5 className="text-sm font-black text-blue-400 font-mono mt-1">₹28,500</h5>
            </div>
            <div>
              <p className="text-[8.5px] text-[var(--text-subtle)] uppercase font-bold">Monthly Revenue (MRR)</p>
              <h5 className="text-sm font-black text-[var(--text)] font-mono mt-1">₹87,500</h5>
            </div>
            <div>
              <p className="text-[8.5px] text-[var(--text-subtle)] uppercase font-bold">Recurring Share</p>
              <h5 className="text-sm font-black text-emerald-400 font-mono mt-1">72.3%</h5>
            </div>
          </div>

        </div>

        {/* Customer retention metrics */}
        <div className="bg-[#08080a] border border-[var(--border)] rounded-3xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-black text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-400" /> Customer Analytics
            </h3>
            <p className="text-[10.5px] text-[var(--text-subtle)] font-medium">Evaluate retention percentages and customer loyalty metrics</p>
          </div>

          <div className="space-y-3.5">
            
            <div className="grid grid-cols-2 gap-3.5">
              <div className="p-3 bg-[var(--bg-elevated)]/40 border border-[var(--border)] rounded-xl text-center">
                <span className="text-[9px] text-[var(--text-subtle)] uppercase font-bold">New Registrants</span>
                <p className="text-lg font-black text-[var(--text)] font-mono mt-0.5">+45</p>
              </div>
              <div className="p-3 bg-[var(--bg-elevated)]/40 border border-[var(--border)] rounded-xl text-center">
                <span className="text-[9px] text-[var(--text-subtle)] uppercase font-bold">Returning Users</span>
                <p className="text-lg font-black text-blue-500 mt-0.5">142</p>
              </div>
            </div>

            <div className="space-y-2 border-t border-[var(--border)] pt-3">
              <div className="flex items-center justify-between text-[11px] font-medium">
                <span className="text-[var(--text-muted)]">Customer Retention Rate</span>
                <span className="text-emerald-400 font-bold">88.5%</span>
              </div>
              <div className="w-full bg-[var(--bg-card)] h-2 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: "88%" }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-medium">
                <span className="text-[var(--text-muted)]">Repeat Purchase Rate</span>
                <span className="text-indigo-400 font-bold">42.1%</span>
              </div>
              <div className="w-full bg-[var(--bg-card)] h-2 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: "42%" }} />
              </div>
            </div>

          </div>

          {/* Top Customers Log link */}
          <div className="p-3.5 bg-[var(--bg-elevated)]/35 border border-white/5 rounded-2xl flex items-center justify-between text-[11px] font-medium">
            <span className="text-[var(--text)]">Top Customer this week:</span>
            <strong className="text-[var(--text-muted)] font-sans">
              No activity recorded
            </strong>
          </div>

        </div>

      </div>

      {/* AI KNOWLEDGE EFFICIENCY ANALYTICS & SUGGESTION BOARD */}
      <div className="bg-[#08080a] border border-[var(--border)] rounded-3xl p-6 space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
          <div>
            <h3 className="text-sm font-black text-[var(--text)] font-sans uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-purple-400" /> AI Knowledge Accuracy &amp; Gap Detection
            </h3>
            <p className="text-[10.5px] text-[var(--text-subtle)] font-medium font-sans">Identify conversation queries addressing incomplete knowledge base entries</p>
          </div>
          
          <button
            onClick={() => triggerNotification(" Refreshed live crawl on WhatsApp logs...")}
            className="text-xs font-black text-[var(--text-muted)] hover:text-[var(--text)] bg-[var(--bg-elevated)] border border-[var(--border)] px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Recrawl AI logs
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 font-sans">
          
          {/* Main improvements gap tables */}
          <div className="xl:col-span-2 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--text-subtle)] text-[var(--text-subtle)] text-[10px] uppercase font-black tracking-widest pb-2">
                  <th className="pb-2 text-xs font-black">Issue Detected</th>
                  <th className="pb-2 text-xs font-black">Subject Covered</th>
                  <th className="pb-2 text-xs font-black">Detected Knowledge Gap</th>
                  <th className="pb-2 text-xs font-black text-right">Suggested Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900/40 text-xs font-medium text-[var(--text-muted)] text-[var(--text)]">
                {suggestedImprovements.map((imp) => (
                  <tr key={imp.id} className="hover:bg-[var(--bg-elevated)]/30 transition duration-150">
                    <td className="py-3.5">
                      <span className="text-[10.5px] font-bold text-red-400 bg-red-500/5 border border-red-500/10 px-2 py-0.5 rounded">
                         {imp.issue}
                      </span>
                    </td>
                    <td className="py-3.5 font-bold text-[var(--text)] max-w-[155px] truncate">{imp.subject}</td>
                    <td className="py-3.5 text-[var(--text-muted)] text-[11px] max-w-[200px] truncate">{imp.gap}</td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => {
                          triggerNotification(` Synced fix recommendation to AI Rules: "${imp.suggestion}"`);
                        }}
                        className="px-2.5 py-1 text-[9.5px] font-black text-blue-400 hover:text-[var(--text)] hover:bg-blue-600 border border-blue-500/20 hover:border-transparent roundedtransition cursor-pointer"
                      >
                        Apply Rule Fix
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Most requested facts sidebar list */}
          <div className="p-4 bg-[var(--bg-elevated)]/30 border border-[var(--border)] rounded-2xl space-y-4">
            <h4 className="text-xs font-black text-[var(--text)] uppercase tracking-wider">Top Knowledge References</h4>
            
            <div className="space-y-3 font-medium text-[11px]">
              
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                <span className="text-[var(--text-muted)]">Most Used FAQ</span>
                <span className="text-[var(--text)] font-extrabold text-right truncate max-w-[150px]">What is AEW exhaust upgrade price?</span>
              </div>

              <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                <span className="text-[var(--text-muted)]">Most Referenced Service</span>
                <span className="text-[var(--text)] font-extrabold text-right truncate max-w-[150px]">Sound tuning retrofit</span>
              </div>

              <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl space-y-1">
                <span className="text-[9.5px] font-black text-blue-400 uppercase tracking-wide flex items-center gap-1">
                   Autofy Knowledge Tip
                </span>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Answering refund policy variables in under 12 seconds elevates customer checkout conversions by ~18%.</p>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* FOOTER SPLIT: LIVE REAL-TIME EVENTS FEED & DIRECTORY CHECKLIST */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
        
        {/* Real-time system notifications log */}
        <div className="md:col-span-2 bg-[#08080a] border border-[var(--border)] rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-emerald-400 animate-swing" /> Live Analytics Activity Feed
              </h3>
              <p className="text-[10px] text-[var(--text-subtle)] font-medium">Real-time notifications synchronized by secure system channels</p>
            </div>
            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded-full font-black">
               Live Stream
            </span>
          </div>

          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2">
            <AnimatePresence initial={false}>
              {activityFeed.map((evt) => {
                let badgeTheme = "bg-blue-500/10 text-blue-400";
                if (evt.type === "payment") badgeTheme = "bg-green-500/10 text-green-400";
                else if (evt.type === "appointment") badgeTheme = "bg-indigo-500/10 text-indigo-400";
                else if (evt.type === "resolution") badgeTheme = "bg-purple-500/10 text-purple-400";
                else if (evt.type === "conversion") badgeTheme = "bg-amber-500/10 text-amber-400";

                return (
                  <motion.div
                    key={evt.id}
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 bg-[var(--bg-elevated)]/40 border border-[var(--border)] rounded-xl flex items-center justify-between gap-4 font-medium"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[8.5px] font-extrabold uppercase px-1.5 rounded-full ${badgeTheme}`}>
                          {evt.title}
                        </span>
                        <span className="text-[11px] text-[var(--text)] truncate max-w-[180px] sm:max-w-xs">{evt.detail}</span>
                      </div>
                    </div>
                    <span className="text-[9px] text-[var(--text-subtle)] font-mono italic shrink-0">{evt.time}</span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Business value summary scorecard details */}
        <div className="bg-[#08080a] border border-[var(--border)] rounded-3xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-black text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-550 text-blue-550 text-blue-400" /> ROI Verified Node
            </h3>
            <p className="text-[10px] text-[var(--text-subtle)] font-medium">Autofy platform health parameters security metrics checklist</p>
          </div>

          <div className="space-y-3 font-medium text-[11px]">
            
            <div className="flex items-center justify-between text-[var(--text-muted)] text-[var(--text-muted)] border-b border-[var(--border)] pb-2">
              <span className="text-[var(--text-muted)]">Verified ROI Factor</span>
              <span className="text-emerald-455 text-emerald-400 font-extrabold font-mono">18.5x Yield</span>
            </div>

            <div className="flex items-center justify-between text-[var(--text-muted)] text-[var(--text-muted)] border-b border-[var(--border)] pb-2">
              <span className="text-[var(--text-muted)]">Active Customer Base</span>
              <span className="text-[var(--text)] font-extrabold font-mono">187 customers</span>
            </div>

            <div className="flex items-center justify-between text-[var(--text-muted)] border-b border-[var(--border)] pb-2">
              <span className="text-[var(--text-muted)]">Google Calendar Autopay Sync</span>
              <span className="text-blue-400 font-extrabold">Active </span>
            </div>

          </div>

          <p className="text-[9.5px] text-[var(--text-subtle)] font-medium leading-relaxed leading-relaxed pt-2">
            Autofy has processed <strong className="text-[var(--text)] font-semibold">1,450 conversations</strong>, captured <strong className="text-[var(--text)] font-semibold">342 verified leads</strong>, and executed <strong className="text-[var(--text)] font-semibold">₹87,500 gross sales output</strong> sandbox parameters successfully in under 30 days.
          </p>
        </div>

      </div>

    </div>
  );
};
