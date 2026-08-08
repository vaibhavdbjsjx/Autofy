import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  Sliders,
  Mail,
  Smartphone,
  PhoneCall,
  UserPlus,
  Calendar,
  CreditCard,
  Settings,
  Archive,
  Trash2,
  ListFilter,
  CheckCheck,
  Zap,
  Plus
} from "lucide-react";

export const NotificationsCenterTab: React.FC = () => {
  // Notifications List State — initialized empty for fresh accounts
  const [notifications, setNotifications] = useState<any[]>([]);

  // Filters State
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [activePriority, setActivePriority] = useState<string>("All");
  const [showPreferences, setShowPreferences] = useState(false);

  // Preference Settings States
  const [prefEmail, setPrefEmail] = useState(true);
  const [prefPush, setPrefPush] = useState(true);
  const [prefWhatsapp, setPrefWhatsapp] = useState(false);
  const [prefDigest, setPrefDigest] = useState(true);
  const [prefWeekly, setPrefWeekly] = useState(false);

  // Simulation Ticker (Real-Time Notification Feed)
  const simulateLiveNotification = () => {
    const types = ["lead", "appointment", "payment", "whatsapp", "system", "ai", "support"];
    const type = types[Math.floor(Math.random() * types.length)];
    const titles: Record<string, string> = {
      lead: "New Lead Form Submitted",
      appointment: "Booking Slot Confirmation",
      payment: "Invoice Generation Direct Alert",
      whatsapp: "Customer Consultation Query",
      system: "Vte Deployment Sync Hooked",
      ai: "Knowledge Base AI Ingest Finished",
      support: "Support Concord Request"
    };
    const bodies: Record<string, string> = {
      lead: "A potential partner inquired about premium service pack hours.",
      appointment: "Karan Johar altered schedule slot to tomorrow 5:00 PM.",
      payment: "Payment link clicked for ₹1,200 (Heavy Knee Wraps).",
      whatsapp: "WhatsApp chatbot successfully handled refund policy query.",
      system: "Production server updated to latest commit revision 8a1df8.",
      ai: "Ingested FAQ document: 'Gym_Timings.pdf'. Extracted 5 items.",
      support: "Support ticket #T-999 closed: 'Refund double hold cleared'."
    };
    const priorities = ["High", "Medium", "Low"];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];

    const item = {
      id: Date.now().toString(),
      type,
      title: titles[type] || "Server Sync Warning",
      body: bodies[type] || "Operational system event detected.",
      time: "Just Now",
      priority,
      read: false,
      category: type.charAt(0).toUpperCase() + type.slice(1)
    };

    setNotifications(prev => [item, ...prev]);
  };

  // Bulk Handlers
  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAllNotifications = () => {
    if (window.confirm("Permanently wipe your central notification feed?")) {
      setNotifications([]);
    }
  };

  const archiveRead = () => {
    setNotifications(prev => prev.filter(n => !n.read));
    alert("Archived read system notifications.");
  };

  const toggleReadStatus = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: !n.read } : n));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Count helper
  const unreadCount = notifications.filter(n => !n.read).length;

  // Filter computation
  const filteredNotifications = notifications.filter(n => {
    const matchesCat = activeCategory === "All" || n.category.toLowerCase() === activeCategory.toLowerCase();
    const matchesPriority = activePriority === "All" || n.priority.toLowerCase() === activePriority.toLowerCase();
    return matchesCat && matchesPriority;
  });

  return (
    <div id="notifications-center-view" className="space-y-8 animate-fade-in text-[var(--text)]">
      
      {/* Header section with luxury dark styling */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[var(--border)] pb-6 gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-subtle)] font-sans">SaaS Communications Routing</span>
          <h1 className="text-3xl font-extrabold text-[var(--text)] tracking-tight mt-1">Notifications Center</h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">Direct alert dispatcher capturing WhatsApp hooks, payments, onboarding status, and system logs.</p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={simulateLiveNotification}
            className="px-4 py-2 bg-white hover:bg-[var(--text)] text-black rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Simulate Dispatch
          </button>
        </div>
      </div>

      {/* Main Grid: Control panel (left) / Live event stack (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Filters and preferences block (Column 1) */}
        <div className="space-y-6">
          
          {/* Quick Unread counter panel */}
          <div className="p-6 rounded-2xl bg-white/[0.04] border border-[var(--border)] backdrop-blur-md space-y-3">
            <span className="block text-[10px] uppercase text-[var(--text-subtle)] font-black">Active Workspace</span>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-[var(--border)] flex items-center justify-center relative">
                <Bell className="w-6 h-6 text-[var(--text)]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-black font-mono text-[9px] font-black flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div>
                <p className="text-xl font-black text-[var(--text)]">{unreadCount} Unread</p>
                <p className="text-xs text-[var(--text-muted)]">Captured live from Autofy</p>
              </div>
            </div>

            {/* Quick Bulk actions */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button 
                onClick={markAllRead}
                className="py-2.5 bg-[#121213] hover:bg-white/[0.04] rounded-xl text-[10.5px] font-bold text-[var(--text)] border border-[var(--border)]"
              >
                Mark All Read
              </button>
              <button 
                onClick={archiveRead}
                className="py-2.5 bg-[#121213] hover:bg-white/[0.04] rounded-xl text-[10.5px] font-bold text-[var(--text)] border border-[var(--border)]"
              >
                Archive Reads
              </button>
            </div>
            
            <button 
              onClick={clearAllNotifications}
              className="w-full text-center py-2 bg-transparent hover:bg-red-500/10 hover:text-red-400 text-[var(--text-subtle)] rounded-xl text-[10.5px] font-semibold transition-all block"
            >
              Wipe Notification Feed
            </button>
          </div>

          {/* Filtering Controller */}
          <div className="p-6 rounded-2xl bg-white/[0.04] border border-[var(--border)] backdrop-blur-md space-y-4">
            <h3 className="text-xs font-black uppercase text-[var(--text)] tracking-widest flex items-center gap-2">
              <ListFilter className="w-3.5 h-3.5" /> Filtering Directives
            </h3>

            {/* Category Selector */}
            <div className="space-y-1">
              <label className="text-[10px] text-[var(--text-subtle)] uppercase font-black">Categories</label>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {["All", "Lead", "Appointment", "Payment", "WhatsApp", "System", "AI", "Support"].map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 text-[10.5px] font-bold rounded-lg transition-colors border ${
                      activeCategory === cat 
                        ? "bg-white text-black border-white" 
                        : "bg-white/[0.02] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority Selector */}
            <div className="space-y-1.5 pt-2">
              <label className="text-[10px] text-[var(--text-subtle)] uppercase font-black">Hold Priority</label>
              <div className="flex gap-1.5">
                {["All", "High", "Medium", "Low"].map(pri => (
                  <button 
                    key={pri}
                    onClick={() => setActivePriority(pri)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors border ${
                      activePriority === pri 
                        ? "bg-white text-black border-white" 
                        : "bg-white/[0.02] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]"
                    }`}
                  >
                    {pri}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preferences forms Block */}
          <div className="p-6 rounded-2xl bg-white/[0.04] border border-[var(--border)] backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-[var(--border)]">
              <h3 className="text-xs font-black uppercase text-[var(--text)] tracking-widest flex items-center gap-2">
                <Settings className="w-3.5 h-3.5" /> Direct Delivery Channels
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-extrabold text-[var(--text)] text-[11px]">Email Alerts Dispatch</p>
                  <p className="text-[10px] text-[var(--text-subtle)]">Send direct invoice duplicates & schedules</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={prefEmail} 
                  onChange={(e) => setPrefEmail(e.target.checked)}
                  className="w-4 h-4 rounded accent-neutral-200"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-extrabold text-[var(--text)] text-[11px]">Push Browser Notification</p>
                  <p className="text-[10px] text-[var(--text-subtle)]">Active real-time sound chiming on browsers</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={prefPush} 
                  onChange={(e) => setPrefPush(e.target.checked)}
                  className="w-4 h-4 rounded accent-neutral-200"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-extrabold text-[var(--text)] text-[11px]">WhatsApp SMS Push</p>
                  <p className="text-[10px] text-[var(--text-subtle)]">Send WhatsApp reminders to administrative numbers</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={prefWhatsapp} 
                  onChange={(e) => setPrefWhatsapp(e.target.checked)}
                  className="w-4 h-4 rounded accent-neutral-200"
                />
              </div>

              <div className="flex items-center justify-between border-t border-[var(--border)] pt-3">
                <div className="space-y-0.5">
                  <p className="font-extrabold text-[var(--text)] text-[11px]">Email Daily Digest</p>
                  <p className="text-[10px] text-[var(--text-subtle)]">Consolidated analytics report summary daily</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={prefDigest} 
                  onChange={(e) => setPrefDigest(e.target.checked)}
                  className="w-4 h-4 rounded accent-neutral-200"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-extrabold text-[var(--text)] text-[11px]">Weekly Growth Report</p>
                  <p className="text-[10px] text-[var(--text-subtle)]">Complete SaaS subscription metrics analysis</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={prefWeekly} 
                  onChange={(e) => setPrefWeekly(e.target.checked)}
                  className="w-4 h-4 rounded accent-neutral-200"
                />
              </div>
            </div>

            <button 
              onClick={() => {
                alert("Communication routing preferences synchronized!");
              }}
              className="w-full text-center py-2 bg-white text-black font-extrabold text-xs rounded-xl"
            >
              Save Delivery Preferences
            </button>
          </div>

        </div>

        {/* Real-time event stack (Column 2 & 3) */}
        <div className="lg:col-span-2 space-y-4">
          
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] uppercase font-black tracking-widest text-[var(--text-subtle)]">Real-Time Alerts Log</span>
            <span className="text-xs font-bold text-[var(--text-muted)]">{filteredNotifications.length} items parsed</span>
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {filteredNotifications.map((notif) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className={`p-4 rounded-2xl bg-white/[0.04] border hover:border-[var(--border)] transition-all flex gap-4 ${
                    notif.read ? "border-[var(--border)] opacity-75" : "border-[var(--border)] bg-white/[0.05]"
                  }`}
                >
                  {/* Category Icons */}
                  <div className="shrink-0 pt-0.5">
                    {notif.priority === "High" ? (
                      <div className="w-10 h-10 rounded-xl bg-white/[0.08] border border-[var(--border)] flex items-center justify-center text-[var(--text)]" title="High Priority Urgent alert">
                        <AlertTriangle className="w-5 h-5 text-[var(--text)]" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)]">
                        {notif.type === "lead" && <UserPlus className="w-4 h-4" />}
                        {notif.type === "appointment" && <Calendar className="w-4 h-4" />}
                        {notif.type === "payment" && <CreditCard className="w-4 h-4" />}
                        {notif.type === "whatsapp" && <PhoneCall className="w-4 h-4" />}
                        {notif.type === "system" && <Settings className="w-4 h-4" />}
                        {notif.type === "ai" && <Zap className="w-4 h-4" />}
                        {notif.type === "support" && <Info className="w-4 h-4" />}
                      </div>
                    )}
                  </div>

                  {/* Main Alerts Body info */}
                  <div className="flex-1 space-y-1 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={`font-bold text-[var(--text)] ${notif.read ? "font-normal text-[var(--text)]" : ""}`}>{notif.title}</h4>
                        <span className="text-[9.5px] uppercase bg-white/[0.06] border border-[var(--border)] px-1.5 py-0.2 rounded text-[var(--text-muted)]">{notif.category}</span>
                      </div>
                      <span className="text-[10px] text-[var(--text-subtle)] font-mono shrink-0">{notif.time}</span>
                    </div>
                    <p className="text-[var(--text-muted)] leading-relaxed text-[11.5px]">{notif.body}</p>
                    
                    {/* Inner controls */}
                    <div className="flex items-center justify-between pt-1 font-mono text-[9.5px] text-[var(--text-subtle)]">
                      <div>
                        Priority: <span className={notif.priority === "High" ? "text-[var(--text)] font-bold" : "text-[var(--text-muted)]"}>{notif.priority}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => toggleReadStatus(notif.id)}
                          className="hover:text-[var(--text)] uppercase transition-colors"
                        >
                          {notif.read ? "Mark Unread" : "Mark Read"}
                        </button>
                        <span>•</span>
                        <button 
                          onClick={() => deleteNotification(notif.id)}
                          className="hover:text-red-400 uppercase transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {filteredNotifications.length === 0 && (
                <div className="text-center py-20 p-6 rounded-2xl bg-white/[0.02] border border-[var(--border)]">
                  <Bell className="w-8 h-8 text-[var(--text-subtle)] mx-auto mb-3" />
                  <p className="text-[var(--text)] font-bold">Clear Alert Feed</p>
                  <p className="text-xs text-[var(--text-subtle)] max-w-sm mx-auto mt-1">No pending notifications discovered matching active filter categories. Simulate a new dispatch to populate live data.</p>
                </div>
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>

    </div>
  );
};
