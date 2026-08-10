import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { api } from "../lib/api";
import {
  Users,
  Search,
  Filter,
  DollarSign,
  Briefcase,
  TrendingUp,
  Tag,
  Edit2,
  Check,
  Plus,
  Clock,
  ShoppingBag,
  MapPin,
  ChevronRight,
  Info,
  Calendar,
  X
} from "lucide-react";

export interface PurchaseRecord {
  order_id: string;
  date: string;
  amount: number;
  items: string;
}

export interface InteractionRecord {
  event: string;
  date: string;
  notes: string;
}

export interface CustomerProfileData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  segment: string; // "VIP", "Returning Customer", "High Value Customer", "Standard"
  lifetime_value: number;
  notes: string | null;
  tags: string; // comma separated
  purchase_history: PurchaseRecord[];
  interaction_history: InteractionRecord[];
  created_at: string;
}

interface CRMTabProps {
  triggerNotification?: (msg: string) => void;
}

export const CRMTab: React.FC<CRMTabProps> = ({
  triggerNotification = (msg) => console.log(msg)
}) => {
  const [profiles, setProfiles] = useState<CustomerProfileData[]>([]);

  const [analytics, setAnalytics] = useState({
    totalCustomers: 0,
    overallLTV: 0.0,
    avgLTV: 0.0
  });

  const [search, setSearch] = useState("");
  const [selectedSegment, setSelectedSegment] = useState("All");
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Edit Overlay modals states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editSegment, setEditSegment] = useState("Standard");
  const [editNotes, setEditNotes] = useState("");
  const [editTags, setEditTags] = useState("");

  // Log interaction modal states
  const [isLoggingEvent, setIsLoggingEvent] = useState(false);
  const [customEventTitle, setCustomEventTitle] = useState("");
  const [customEventNotes, setCustomEventNotes] = useState("");

  useEffect(() => {
    fetchCRMData();
  }, [selectedSegment, search]);

  const fetchCRMData = async () => {
    setIsLoading(true);
    let url = `/api/v1/crm/profiles?segment=${selectedSegment}`;
    if (search.trim()) {
      url += `&search=${encodeURIComponent(search)}`;
    }

    try {
      const data = await api.get<any>(url);
      if (Array.isArray(data?.profiles)) {
        setProfiles(data.profiles);
      }
    } catch (err) {
      console.log("Using initial interactive fallback states for CRM Module:", err);
    }

    try {
      const data = await api.get<any>("/api/v1/crm/analytics");
      setAnalytics({
        totalCustomers: data.total_customers || 0,
        overallLTV: data.overall_ltv || 0.0,
        avgLTV: data.avg_ltv || 0.0
      });
    } catch (err) {
      console.log("CRM analytics fallback:", err);
    }

    setIsLoading(false);
  };

  const activeProfile = profiles.find(p => p.id === selectedProfileId) || profiles[0] || null;

  // Open Edit Mode
  const handleOpenEdit = () => {
    if (!activeProfile) return;
    setEditName(activeProfile.name);
    setEditEmail(activeProfile.email || "");
    setEditPhone(activeProfile.phone || "");
    setEditSegment(activeProfile.segment);
    setEditNotes(activeProfile.notes || "");
    setEditTags(activeProfile.tags);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!activeProfile) return;
    if (!editName.trim()) {
      triggerNotification("Customer profile name is required.");
      return;
    }

    // Update locally
    setProfiles(profiles.map(p => p.id === activeProfile.id ? {
      ...p,
      name: editName,
      email: editEmail || null,
      phone: editPhone || null,
      segment: editSegment,
      notes: editNotes || null,
      tags: editTags
    } : p));

    setIsEditing(false);
    triggerNotification("Customer profile tags and properties updated successfully.");

    try {
      await api.put(`/api/v1/crm/profiles/${activeProfile.id}`, {
        name: editName,
        email: editEmail,
        phone: editPhone,
        segment: editSegment,
        notes: editNotes,
        tags: editTags
      });
      fetchCRMData();
    } catch (err) {
      console.log(err);
    }
  };

  const handleAddInteractionEvent = async () => {
    if (!activeProfile) return;
    if (!customEventTitle.trim() || !customEventNotes.trim()) {
      triggerNotification("Please fill in the event type and interaction logs text.");
      return;
    }

    const newRecord: InteractionRecord = {
      event: customEventTitle,
      date: new Date().toISOString().split("T")[0],
      notes: customEventNotes
    };

    setProfiles(profiles.map(p => p.id === activeProfile.id ? {
      ...p,
      interaction_history: [newRecord, ...p.interaction_history]
    } : p));

    setIsLoggingEvent(false);
    setCustomEventTitle("");
    setCustomEventNotes("");
    triggerNotification(`New note recorded on customer interaction thread.`);

    try {
      await api.post(`/api/v1/crm/profiles/${activeProfile.id}/history`, {
        event: newRecord.event,
        notes: newRecord.notes
      });
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="space-y-8 text-left">
      
      {/* Header section */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight" style={{ color: "var(--text)" }}>
          CRM Customer Module
        </h2>
        <p className="text-xs font-sans mt-1" style={{ color: "var(--text-muted)" }}>
          Monitor life-time customer values, tag segments, update client notes, and view unified purchase history across all channels.
        </p>
      </div>

      {/* METRIC KPI BLOCK */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="glass-card p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold tracking-widest block font-sans" style={{ color: "var(--text-subtle)" }}>
            Total Customers
          </span>
          <p className="text-2xl font-black font-display mt-1" style={{ color: "var(--text)" }}>
            {analytics.totalCustomers}
          </p>
          <p className="text-[10px] text-emerald-500 mt-1.5 font-bold flex items-center gap-1 font-sans">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Active WhatsApp responders</span>
          </p>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold tracking-widest block font-sans" style={{ color: "var(--text-subtle)" }}>
            Total Projected LTV
          </span>
          <p className="text-2xl font-black font-display text-emerald-500 mt-1">
            ₹{analytics.overallLTV.toLocaleString()}
          </p>
          <p className="text-[10px] mt-1.5 font-bold font-sans" style={{ color: "var(--text-muted)" }}>Accumulated shop orders value</p>
        </div>

        <div className="glass-card p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-bold tracking-widest block font-sans" style={{ color: "var(--text-subtle)" }}>
            Avg Value per Profile
          </span>
          <p className="text-2xl font-black font-display text-indigo-500 mt-1">
            ₹{analytics.avgLTV.toLocaleString()}
          </p>
          <p className="text-[10px] mt-1.5 font-bold font-sans" style={{ color: "var(--text-muted)" }}>Standard customer ticket sizing</p>
        </div>

      </div>

      {/* SEARCH AND FILTERS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-subtle)" }} />
          <input
            type="text"
            placeholder="Search name, phone, email, tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none transition-colors font-sans"
            style={{ background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text)" }}
          />
        </div>

        <div className="flex gap-2 pb-px select-none">
          {["All", "VIP", "Returning Customer", "High Value Customer", "Standard"].map((seg) => (
            <button
              key={seg}
              onClick={() => setSelectedSegment(seg)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                selectedSegment === seg
                  ? "bg-white text-black border-white"
                  : "bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text)] hover:bg-[var(--bg-elevated)]"
              }`}
            >
              {seg}
            </button>
          ))}
        </div>
      </div>

      {/* WORKSPACE SEGMENTS PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* CUSTOMERS DIRECTORY LEFT */}
        <div className="lg:col-span-4 bg-[#0c0c0e] border border-[var(--border)] rounded-3xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-[var(--border)] pb-3">
            <span className="text-xs uppercase font-extrabold text-[var(--text-muted)]">Customer Directory</span>
            <span className="text-[11px] text-indigo-400 font-bold font-mono">{profiles.length} Listed</span>
          </div>

          <div className="space-y-2.5 max-h-[480px] overflow-y-auto">
            {profiles.map((p) => {
              const isSelected = p.id === selectedProfileId;
              const isVIP = p.segment === "VIP";
              const isHigh = p.segment === "High Value Customer";

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProfileId(p.id)}
                  className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                    isSelected 
                      ? "bg-white/[0.05] border-indigo-500/40" 
                      : "bg-black/[0.1] border-[var(--border)] hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="text-xs font-black text-[var(--text)]">{p.name}</h4>
                      <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{p.phone}</p>
                    </div>

                    <span className={`px-2 py-0.5 text-[8.5px] font-black uppercase text-center tracking-wider rounded ${
                      isVIP ? "bg-purple-500/10 text-purple-400" :
                      isHigh ? "bg-amber-500/10 text-amber-400" :
                      p.segment === "Returning Customer" ? "bg-blue-500/10 text-blue-400" :
                      "bg-[var(--text-subtle)]/10 text-[var(--text-muted)]"
                    }`}>
                      {p.segment}
                    </span>
                  </div>

                  <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-[var(--border)]">
                    <span className="text-[10px] text-[var(--text-subtle)] font-medium">LTV:</span>
                    <span className="text-[10.5px] text-[var(--text)] font-extrabold font-mono">
                      ₹{p.lifetime_value.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PROFILE INFORMATION PANELS RIGHT */}
        <div className="lg:col-span-8 bg-[#0c0c0e] border border-[var(--border)] rounded-3xl p-6 space-y-6">
          {activeProfile ? (
            <div className="space-y-6 text-left">
              
              {/* Profile Top Row Title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-black text-[var(--text)]">{activeProfile.name}</h3>
                    <span className="text-xs uppercase font-extrabold px-2.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400">
                      {activeProfile.segment}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5 font-mono">
                    <span>{activeProfile.email || "No Email"}</span>
                    <span>•</span>
                    <span>{activeProfile.phone || "No Phone"}</span>
                  </p>
                </div>

                <button
                  onClick={handleOpenEdit}
                  className="px-3.5 py-1.5 bg-white hover:bg-[var(--text)] text-black font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit Profile Attributes
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Custom Notes Section */}
                <div className="space-y-3 bg-[#0a0a0c] border border-[var(--border)] p-5 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-wider">Internal Team Notes</span>
                  </div>
                  <p className="text-xs text-[var(--text)] leading-relaxed font-sans italic">
                    "{activeProfile.notes || "No custom workspace notes recorded on this profile yet."}"
                  </p>

                  <div className="pt-2 border-t border-[var(--border)] flex flex-wrap gap-1.5">
                    {activeProfile.tags ? activeProfile.tags.split(",").map((tag, idx) => (
                      <span key={idx} className="bg-[var(--bg-elevated)] text-[var(--text)] text-[9.5px] px-2 py-0.5 rounded-lg border border-[var(--border)]">
                        #{tag.trim()}
                      </span>
                    )) : (
                      <span className="text-[10px] text-[var(--text-subtle)]">No profile tags assigned.</span>
                    )}
                  </div>
                </div>

                {/* Purchase Lifetime Value KPI Container */}
                <div className="space-y-3 bg-[#0a0a0c] border border-[var(--border)] p-5 rounded-2xl flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-wider">LTV Indicators</span>
                    <p className="text-2xl font-black text-emerald-400 mt-1">₹{activeProfile.lifetime_value.toLocaleString()}</p>
                  </div>
                  
                  <div className="space-y-1 pt-3.5 border-t border-[var(--border)]">
                    <span className="text-[10px] text-[var(--text-muted)] block">Conversion Source:</span>
                    <span className="text-xs text-[var(--text)] font-medium">Auto-captured VIP via WhatsApp Gateway</span>
                  </div>
                </div>

              </div>

              {/* CRM SUB TIMELINE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                
                {/* 1. PURCHASE HISTORY LIST */}
                <div className="space-y-3.5 text-left">
                  <div className="flex justify-between items-center border-b border-[var(--border)] pb-2">
                    <h5 className="text-[10.5px] font-black uppercase text-[var(--text-muted)] tracking-wider flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-indigo-400" />
                      Purchase Catalog ({activeProfile.purchase_history.length})
                    </h5>
                  </div>

                  {activeProfile.purchase_history.length === 0 ? (
                    <div className="text-center p-9 border border-[var(--border)] rounded-2xl bg-black/[0.1]">
                      <p className="text-xs text-[var(--text-subtle)]">No product orders synced.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-72 overflow-y-auto">
                      {activeProfile.purchase_history.map((ord, idx) => (
                        <div key={idx} className="p-3 bg-black border border-[var(--border)] rounded-xl text-left">
                          <div className="flex justify-between">
                            <span className="text-[11px] font-black text-[var(--text)]">{ord.order_id}</span>
                            <span className="text-[10px] text-[var(--text-subtle)]">{ord.date}</span>
                          </div>
                          <p className="text-xs text-[var(--text)] mt-1 font-bold">{ord.items}</p>
                          <p className="text-xs text-emerald-400 font-bold font-mono mt-1.5">₹{ord.amount.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. INTERACTION EVENT FEED */}
                <div className="space-y-3.5 text-left">
                  <div className="flex justify-between items-center border-b border-[var(--border)] pb-2">
                    <h5 className="text-[10.5px] font-black uppercase text-[var(--text-muted)] tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      Interaction Feed
                    </h5>
                    <button
                      onClick={() => setIsLoggingEvent(true)}
                      className="px-2 py-0.5 border border-[#3E3E42] hover:bg-[var(--bg-elevated)] text-[9.5px] font-bold rounded cursor-pointer"
                    >
                      + Log Event
                    </button>
                  </div>

                  <div className="space-y-3 max-h-72 overflow-y-auto">
                    {activeProfile.interaction_history.map((log, idx) => (
                      <div key={idx} className="p-3.5 bg-black/[0.2] border border-[var(--border)] rounded-xl space-y-1 text-left relative">
                        <div className="absolute top-3.5 right-3.5 text-[9.5px] font-mono text-[var(--text-subtle)]">{log.date}</div>
                        <h6 className="text-xs font-black text-[var(--text)]">{log.event}</h6>
                        <p className="text-[11px] text-[var(--text-muted)] leading-relaxed mt-1 font-sans">{log.notes}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-xs text-[var(--text-muted)]">No customer profile fits active segment query.</p>
            </div>
          )}
        </div>

      </div>

      {/* EDIT PROFILE PROPERTIES OVERLAY */}
      {isEditing && activeProfile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 max-w-lg w-full space-y-4 text-left shadow-2xl">
            <div>
              <h4 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider font-sans">
                Adjust CRM Profile Details: {activeProfile.name}
              </h4>
              <p className="text-xs text-[var(--text-muted)] mt-1">Configure segmentation brackets, hashtags, and internal notes.</p>
            </div>

            <div className="space-y-3.5 text-xs text-[var(--text)]">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text)]">Name:</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-black border border-[var(--border)] focus:border-[var(--brand)] rounded-xl py-2 px-3 text-xs text-[var(--text)] uppercase font-black"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text)]">Segment Tier:</label>
                  <select
                    value={editSegment}
                    onChange={(e) => setEditSegment(e.target.value)}
                    className="w-full bg-black border border-[var(--border)] text-[var(--text)] focus:border-[var(--brand)] rounded-xl py-2 px-3 text-xs focus:outline-none"
                  >
                    <option value="VIP">VIP</option>
                    <option value="Returning Customer">Returning Customer</option>
                    <option value="High Value Customer">High Value Customer</option>
                    <option value="Standard">Standard</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text)]">Email Address:</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-black border border-[var(--border)] rounded-xl py-2 px-3 text-xs text-[var(--text)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text)]">Phone Contact (Intl):</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-black border border-[var(--border)] rounded-xl py-2 px-3 text-xs text-[var(--text)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text)]">Tags (comma-separated):</label>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  placeholder="bullet, premium, exhaust"
                  className="w-full bg-black border border-[var(--border)] rounded-xl py-2 px-3 text-xs text-[var(--text)] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text)]">Internal Segment Details / Notes:</label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-black border border-[var(--border)] rounded-xl py-2 px-3 text-xs text-[var(--text)] focus:outline-none leading-relaxed"
                />
              </div>

            </div>

            <div className="flex justify-end gap-3.5 pt-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-xs bg-white/[0.02] hover:bg-white/[0.06] border border-[var(--border)] text-[var(--text)] font-extrabold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-5 py-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-[var(--text)] font-extrabold rounded-xl cursor-pointer"
              >
                Save Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOG ENTIRE RECONCILIATION EVENT OVERLAY */}
      {isLoggingEvent && activeProfile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 max-w-md w-full space-y-4 text-left shadow-2xl">
            <div>
              <h4 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider font-sans">
                Log Workspace Client Event
              </h4>
              <p className="text-xs text-[var(--text-muted)] mt-1">Insert direct notes regarding offline calls, visits, or manual shipments.</p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text)]">Event name / Action title:</label>
                <input
                  type="text"
                  placeholder="e.g. Telephone Call, Showroom Visit"
                  value={customEventTitle}
                  onChange={(e) => setCustomEventTitle(e.target.value)}
                  className="w-full bg-black border border-[var(--border)] focus:border-[var(--brand)] rounded-xl py-2 px-3 text-xs text-[var(--text)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text)]">Detailed logs description:</label>
                <textarea
                  rows={3}
                  placeholder="What was discussed or concluded?"
                  value={customEventNotes}
                  onChange={(e) => setCustomEventNotes(e.target.value)}
                  className="w-full bg-black border border-[var(--border)] rounded-xl py-2 px-3 text-xs text-[var(--text)] leading-relaxed"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3.5 pt-1">
              <button
                onClick={() => setIsLoggingEvent(false)}
                className="px-4 py-2 text-xs border border-[var(--border)] bg-white/[0.02] hover:bg-white/[0.06] text-[var(--text)] font-extrabold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddInteractionEvent}
                className="px-5 py-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-[var(--text)] font-extrabold rounded-xl cursor-pointer shadow"
              >
                Add Timeline Log
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
