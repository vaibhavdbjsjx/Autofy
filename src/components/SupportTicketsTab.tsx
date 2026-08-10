import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { api } from "../lib/api";
import {
  LifeBuoy,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  User,
  Clock,
  History,
  ShieldAlert,
  HelpCircle,
  X,
  ChevronRight,
  Info
} from "lucide-react";

export interface TicketData {
  id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  title: string;
  description: string;
  status: "Open" | "Pending" | "Resolved" | "Closed";
  priority: "Low" | "Medium" | "High" | "Urgent";
  assigned_agent_id: string | null;
  assigned_agent_name: string;
  sla_deadline: string | null;
  sla_status: string; // Within Limit, Breached, Met
  created_at: string;
}

export interface TicketLog {
  id: string;
  changed_by: string;
  action: string;
  notes: string;
  created_at: string;
}

export interface SupportAgent {
  id: string;
  name: string;
  role: string;
}

interface SupportTicketsTabProps {
  triggerNotification?: (msg: string) => void;
}

export const SupportTicketsTab: React.FC<SupportTicketsTabProps> = ({
  triggerNotification = (msg) => console.log(msg)
}) => {
  // Support tickets — loaded from backend API, initialized empty for fresh accounts
  const [tickets, setTickets] = useState<TicketData[]>([]);

  const [agents, setAgents] = useState<SupportAgent[]>([]);
  const [history, setHistory] = useState<TicketLog[]>([]);

  const [analytics, setAnalytics] = useState({
    totalTickets: 0,
    openTickets: 0,
    pendingTickets: 0,
    resolvedTickets: 0,
    closedTickets: 0,
    slaMetCount: 0,
    slaBreachedCount: 0
  });

  const [isLoading, setIsLoading] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string>("");
  
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [search, setSearch] = useState("");

  // New Ticket creation states
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newTicketTitle, setNewTicketTitle] = useState("");
  const [newTicketDesc, setNewTicketDesc] = useState("");
  const [newTicketPriority, setNewTicketPriority] = useState<"Low" | "Medium" | "High" | "Urgent">("Medium");

  useEffect(() => {
    fetchTicketsData();
  }, [filterStatus, filterPriority, search]);

  useEffect(() => {
    fetchTicketLogs();
  }, [selectedTicketId]);

  const fetchTicketsData = async () => {
    setIsLoading(true);
    let url = `/api/v1/tickets?status_filter=${filterStatus}&priority_filter=${filterPriority}`;
    try {
      const d = await api.get<any>(url);
      if (d?.tickets && d.tickets.length > 0) {
        setTickets(d.tickets);
      }
    } catch (e) {
      console.log("Using fallbacks for Support Tickets:", e);
    }

    try {
      const d = await api.get<any>("/api/v1/team/members");
      const teamMembers = Array.isArray(d) ? d : d?.team_members;
      if (teamMembers && teamMembers.length > 0) {
        setAgents(teamMembers.map((t: any) => ({
          id: t.id,
          name: t.name || t.role,
          role: t.role
        })));
      }
    } catch (e) {
      console.log("Team members fallback:", e);
    }

    try {
      const d = await api.get<any>("/api/v1/tickets/analytics");
      setAnalytics({
        totalTickets: d.total_tickets || 3,
        openTickets: d.open_tickets || 1,
        pendingTickets: d.pending_tickets || 1,
        resolvedTickets: d.resolved_tickets || 1,
        closedTickets: d.closed_tickets || 0,
        slaMetCount: d.sla_compliance?.met || 2,
        slaBreachedCount: d.sla_compliance?.breached || 0
      });
    } catch (e) {
      console.log("Ticket analytics fallback:", e);
    }

    setIsLoading(false);
  };

  const fetchTicketLogs = async () => {
    try {
      const d = await api.get<any>(`/api/v1/tickets/${selectedTicketId}/history`);
      if (d?.history) {
        setHistory(d.history);
      }
    } catch (e) {
      console.log(e);
    }
  };

  const activeTicket = tickets.find(t => t.id === selectedTicketId) || tickets[0] || null;

  const handleUpdateTicketStatus = async (statusVal: "Open" | "Pending" | "Resolved" | "Closed") => {
    if (!activeTicket) return;

    try {
      await api.put(`/api/v1/tickets/${activeTicket.id}`, { status: statusVal });
      setTickets(tickets.map(t => t.id === activeTicket.id ? {
        ...t,
        status: statusVal,
        sla_status: statusVal === "Resolved" || statusVal === "Closed" ? "Met" : t.sla_status
      } : t));
      await fetchTicketsData();
      await fetchTicketLogs();
      triggerNotification(`Support ticket status updated to: ${statusVal}`);
    } catch (err) {
      triggerNotification?.(err instanceof Error ? err.message : "Failed to update support ticket status.");
    }
  };

  const handleReassignAgent = async (agentId: string) => {
    if (!activeTicket) return;
    const foundAgent = agents.find(g => g.id === agentId);
    const agentName = foundAgent ? foundAgent.name : "Unassigned";

    try {
      await api.put(`/api/v1/tickets/${activeTicket.id}`, { assigned_agent_id: agentId });
      setTickets(tickets.map(t => t.id === activeTicket.id ? {
        ...t,
        assigned_agent_id: agentId,
        assigned_agent_name: agentName
      } : t));
      await fetchTicketsData();
      await fetchTicketLogs();
      triggerNotification(`Support ticket reassigned to: ${agentName}`);
    } catch (err) {
      triggerNotification?.(err instanceof Error ? err.message : "Failed to reassign support ticket.");
    }
  };

  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newTicketTitle.trim() || !newTicketDesc.trim()) {
      triggerNotification("Please fill in contact name, ticket subject, and descriptions.");
      return;
    }

    const newTkt: TicketData = {
      id: "TKT-" + Math.floor(Math.random() * 8999 + 1000),
      customer_name: newCustName,
      customer_email: newCustEmail || null,
      customer_phone: newCustPhone || null,
      title: newTicketTitle,
      description: newTicketDesc,
      status: "Open",
      priority: newTicketPriority,
      assigned_agent_id: null,
      assigned_agent_name: "Unassigned",
      sla_deadline: new Date(Date.now() + 48 * 3600 * 1000).toISOString().replace("T", " ").substring(0, 16),
      sla_status: "Within Limit",
      created_at: new Date().toISOString().replace("T", " ").substring(0, 16)
    };

    try {
      await api.post("/api/v1/tickets", {
        customer_name: newTkt.customer_name,
        customer_email: newTkt.customer_email,
        customer_phone: newTkt.customer_phone,
        title: newTkt.title,
        description: newTkt.description,
        priority: newTkt.priority
      });
      setIsCreatingTicket(false);
      setNewCustName("");
      setNewCustEmail("");
      setNewCustPhone("");
      setNewTicketTitle("");
      setNewTicketDesc("");
      await fetchTicketsData();
      triggerNotification("New customer support ticket registered.");
    } catch (err) {
      triggerNotification?.(err instanceof Error ? err.message : "Failed to register support ticket.");
    }
  };

  const filteredTickets = tickets.filter(t => {
    const q = search.toLowerCase();
    const titleMatch = t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
    const nameMatch = t.customer_name.toLowerCase().includes(q);
    
    const statusMatch = filterStatus === "All" || t.status === filterStatus;
    const priorityMatch = filterPriority === "All" || t.priority === filterPriority;

    return (titleMatch || nameMatch) && statusMatch && priorityMatch;
  });

  return (
    <div className="space-y-8 text-left">
      
      {/* HEADER SECTION ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[var(--text)] tracking-tight flex items-center gap-2">
            <LifeBuoy className="w-6 h-6 text-indigo-400 stroke-[1.8]" />
            Customer Support Tickets
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Resolve metallic rattle noises, product size swaps, and freight complaints. Tracks SLA compliance windows.
          </p>
        </div>

        <button
          onClick={() => setIsCreatingTicket(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-[var(--text)] font-extrabold text-xs rounded-xl shadow cursor-pointer flex items-center gap-1 active:scale-97"
        >
          <Plus className="w-4 h-4 stroke-[2.3]" /> Log Support Ticket
        </button>
      </div>

      {/* KPI METRIC BAR GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4 rounded-2xl">
          <span className="text-[10px] uppercase font-black tracking-widest text-[var(--text-muted)]">Total Registered</span>
          <p className="text-2xl font-black text-[var(--text)] mt-1">{analytics.totalTickets} Tickets</p>
          <span className="text-[10px] text-indigo-400 mt-1 flex items-center gap-1">
            All customer inquiries
          </span>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4 rounded-2xl">
          <span className="text-[10px] uppercase font-black tracking-widest text-[var(--text-muted)]">Open & Active</span>
          <p className="text-2xl font-black text-amber-400 mt-1">{analytics.openTickets + analytics.pendingTickets} Tickets</p>
          <span className="text-[10px] text-[#A1A1AA] mt-1 block">Awaiting immediate response</span>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4 rounded-2xl">
          <span className="text-[10px] uppercase font-black tracking-widest text-[var(--text-muted)]">Resolved Today</span>
          <p className="text-2xl font-black text-green-400 mt-1">{analytics.resolvedTickets + analytics.closedTickets} Tickets</p>
          <span className="text-[10px] text-green-400 font-bold mt-1 block">SLA guidelines met</span>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4 rounded-2xl animate-pulse">
          <span className="text-[10px] uppercase font-black tracking-widest text-red-400">SLA Breach Warnings</span>
          <p className="text-2xl font-black text-red-400 mt-1">{analytics.slaBreachedCount} Active</p>
          <span className="text-[10px] text-red-400/[0.8] mt-1 font-bold">Requires urgent assistance</span>
        </div>

      </div>

      {/* SEARCH AND COMBINED MATRIX */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tickets by title, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--bg-card)] border border-[var(--border)] focus:border-[var(--brand)] rounded-xl py-2 pl-9 pr-4 text-xs text-[var(--text)] focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--text-muted)]">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl py-1.5 px-3 text-xs text-[var(--text)]"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Pending">Pending</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--text-muted)]">Priority:</span>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl py-1.5 px-3 text-xs text-[var(--text)]"
            >
              <option value="All">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
        </div>

      </div>

      {/* CORE WORKSPACE SUB GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* TICKETS DIRECTORY LEFT */}
        <div className="lg:col-span-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-5 space-y-4 text-left">
          <div className="flex justify-between items-center border-b border-[var(--border)] pb-3">
            <span className="text-xs uppercase font-extrabold text-[var(--text-muted)]">Active Queue</span>
            <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-sm">{filteredTickets.length} Found</span>
          </div>

          <div className="space-y-2.5 max-h-[480px] overflow-y-auto">
            {filteredTickets.map((t) => {
              const isSelected = t.id === selectedTicketId;
              const isHigh = t.priority === "High" || t.priority === "Urgent";

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicketId(t.id)}
                  className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all space-y-3 ${
                    isSelected 
                      ? "bg-white/[0.05] border-indigo-500" 
                      : "bg-black/[0.1] border-[var(--border)] hover:bg-white/[0.01]"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="text-xs font-black text-[var(--text)] leading-tight">{t.customer_name}</h4>
                      <p className="text-[10px] text-[var(--text-muted)] mt-1 uppercase font-semibold">{t.id}</p>
                    </div>

                    <span className={`px-2 py-0.5 text-[8.5px] font-black uppercase tracking-wider rounded ${
                      t.status === "Open" ? "bg-red-500/10 text-red-400 border border-red-500/10" :
                      t.status === "Pending" ? "bg-amber-500/10 text-amber-400 border border-amber-500/10" :
                      "bg-green-500/10 text-green-400"
                    }`}>
                      {t.status}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--text)] font-bold leading-normal line-clamp-1">
                    {t.title}
                  </p>

                  <div className="flex justify-between items-center pt-2.5 border-t border-[var(--border)] text-[10px]">
                    <span className={`font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                      isHigh ? "bg-red-500/15 text-red-400" : "bg-[var(--bg-elevated)] text-[var(--text-muted)]"
                    }`}>
                      {t.priority} priority
                    </span>
                    <span className="text-[var(--text-subtle)]">Rep: {t.assigned_agent_name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TICKET DETAILS RIGHT PANEL */}
        <div className="lg:col-span-8 bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 space-y-6">
          {activeTicket ? (
            <div className="space-y-6 text-left">
              
              {/* Top Details Header Row */}
              <div className="border-b border-[var(--border)] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-black text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md">{activeTicket.id}</span>
                    <span className="text-xs uppercase font-extrabold text-[var(--text-muted)]">• logged by {activeTicket.customer_name}</span>
                  </div>
                  <h3 className="text-base font-black text-[var(--text)]">{activeTicket.title}</h3>
                </div>

                {/* Status selector triggers */}
                <div className="flex gap-1">
                  {(["Open", "Pending", "Resolved", "Closed"] as const).map((stat) => (
                    <button
                      key={stat}
                      onClick={() => handleUpdateTicketStatus(stat)}
                      className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                        activeTicket.status === stat
                          ? "bg-white text-black font-extrabold"
                          : "bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text)] hover:bg-[var(--bg-elevated)]"
                      }`}
                    >
                      {stat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description Body Card */}
              <div className="bg-black/40 border border-[var(--border)] p-5 rounded-2xl space-y-3">
                <span className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-wider block">Customer issue desc:</span>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed font-sans font-medium whitespace-pre-line">
                  {activeTicket.description}
                </p>

                {activeTicket.customer_phone || activeTicket.customer_email ? (
                  <div className="pt-3.5 border-t border-[var(--border)] text-[10.5px] text-[var(--text-muted)] font-mono gap-3.5 flex flex-wrap">
                    {activeTicket.customer_email && <span>Email: <strong className="text-[var(--text)]">{activeTicket.customer_email}</strong></span>}
                    {activeTicket.customer_phone && <span>Phone: <strong className="text-[var(--text)]">{activeTicket.customer_phone}</strong></span>}
                  </div>
                ) : null}
              </div>

              {/* Sla details and Representative assign matrix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                
                {/* Agent Select Picker */}
                <div className="space-y-2.5">
                  <span className="text-[10px] uppercase font-black text-[var(--text-muted)] tracking-wider block">Assign Service Representative:</span>
                  <select
                    value={activeTicket.assigned_agent_id || ""}
                    onChange={(e) => handleReassignAgent(e.target.value)}
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text)] focus:border-[var(--brand)] rounded-xl py-2.5 px-3.5 text-xs focus:outline-none"
                  >
                    <option value="">-- Unassigned --</option>
                    {agents.map((ag) => (
                      <option key={ag.id} value={ag.id}>
                        {ag.name} ({ag.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* SLA deadline display */}
                <div className="bg-[var(--bg-card)] border border-[var(--border)] p-4.5 rounded-2xl flex flex-col justify-between h-20 text-left">
                  <span className="text-[10px] text-[var(--text-muted)]">SLA Response Window Status</span>
                  <div className="flex justify-between items-baseline mt-1">
                    <p className="text-sm font-semibold text-[var(--text)]">Within 48 hours deadline</p>
                    <span className="text-xs text-green-400 font-black uppercase tracking-wider">{activeTicket.sla_status}</span>
                  </div>
                </div>

              </div>

              {/* AUDIT WORKSPACE TICKET HISTORY */}
              <div className="space-y-3 text-left">
                <span className="text-[10.5px] uppercase font-black text-[var(--text-muted)] tracking-wider flex items-center gap-1.5 border-b border-[var(--border)] pb-2">
                  <History className="w-3.5 h-3.5 text-indigo-400" />
                  Ticket Audit Trail Logs
                </span>

                <div className="space-y-2.5">
                  {history.map((h, idx) => (
                    <div key={idx} className="p-3 bg-[#08080a] border border-[var(--border)] rounded-xl flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-[var(--text)]">{h.changed_by}</span>
                          <span className="text-[9.5px] uppercase font-extrabold bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded text-[var(--text-muted)]">
                            {h.action}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-muted)] font-sans leading-normal">{h.notes}</p>
                      </div>

                      <span className="text-[10px] text-[var(--text-subtle)] font-mono mt-0.5">{h.created_at}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-xs text-[var(--text-subtle)]">No support ticket fits current filters.</p>
            </div>
          )}
        </div>

      </div>

      {/* CREATE NEW SUPPORT TICKET MODAL OVERLAY */}
      {isCreatingTicket && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateTicketSubmit} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 max-w-lg w-full space-y-4 text-left shadow-2xl">
            <div>
              <h4 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider font-sans">
                Log Customer Support Ticket
              </h4>
              <p className="text-xs text-[var(--text-muted)] mt-1">Submit technical fitting rattles or delivery exchange requests manually.</p>
            </div>

            <div className="space-y-3.5 text-xs text-[var(--text)]">
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text)]">Customer Full Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Customer Name"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full bg-black border border-[var(--border)] rounded-xl py-2 px-3 text-xs text-[var(--text)]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text)]">Customer Email:</label>
                  <input
                    type="email"
                    placeholder="name@gmail.com"
                    value={newCustEmail}
                    onChange={(e) => setNewCustEmail(e.target.value)}
                    className="w-full bg-black border border-[var(--border)] rounded-xl py-2 px-3 text-xs text-[var(--text)]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text)]">Customer Phone:</label>
                  <input
                    type="text"
                    placeholder="+91 90000 00000"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="w-full bg-black border border-[var(--border)] rounded-xl py-2 px-3 text-xs text-[var(--text)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text)] font-sans">Ticket Subject:</label>
                  <input
                    type="text"
                    placeholder="e.g. AEW silencer clearance fit rattling noise"
                    value={newTicketTitle}
                    onChange={(e) => setNewTicketTitle(e.target.value)}
                    className="w-full bg-black border border-[var(--border)] rounded-xl py-2.5 px-3 text-xs text-[var(--text)]"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-muted)]">Priority Level:</label>
                  <select
                    value={newTicketPriority}
                    onChange={(e) => setNewTicketPriority(e.target.value as any)}
                    className="w-full bg-black border border-[var(--border)] text-[var(--text)] focus:border-[var(--brand)] rounded-xl py-2.5 px-3 text-xs text-[var(--text-muted)]"
                  >
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority</option>
                    <option value="Urgent">Urgent priority</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text)]">Describe Issue / Request details:</label>
                <textarea
                  rows={4}
                  placeholder="What is the detailed grievance or request history?"
                  value={newTicketDesc}
                  onChange={(e) => setNewTicketDesc(e.target.value)}
                  className="w-full bg-black border border-[var(--border)] rounded-xl py-2 px-3 text-xs text-[var(--text)] leading-relaxed"
                  required
                />
              </div>

            </div>

            <div className="flex justify-end gap-3.5 pt-2">
              <button
                type="button"
                onClick={() => setIsCreatingTicket(false)}
                className="px-4 py-2 text-xs bg-white/[0.02] hover:bg-white/[0.06] border border-[var(--border)] text-[var(--text)] font-extrabold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-[var(--text)] font-extrabold rounded-xl cursor-pointer shadow"
              >
                Log Ticket Entry
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
