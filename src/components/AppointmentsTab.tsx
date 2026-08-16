import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  FileText,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  Send,
  Bell,
  RefreshCw,
  Search,
  Filter,
  Users,
  Check,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  CalendarDays,
  Smartphone,
  Sparkles
} from "lucide-react";

interface Appointment {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  service: string;
  date: string; // YYYY-MM-DD
  time: string;  // HH:MM
  status: "Scheduled" | "Confirmed" | "Completed" | "Cancelled" | "No Show";
  notes: string;
  reminders: {
    whatsapp: boolean;
    email: boolean;
    sms: boolean;
    timing: "1 Hour Before" | "1 Day Before" | "Custom";
  };
}

export const AppointmentsTab: React.FC = () => {
  // Database of appointments loaded from backend API — starts empty for fresh accounts
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  React.useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const { api, isAuthenticated } = await import("../lib/api");
        if (isAuthenticated()) {
          const res: any = await api.get("/api/v1/appointments");
          const items = Array.isArray(res) ? res : (res?.items || []);
          if (items.length > 0) {
            const mapped: Appointment[] = items.map((a: any) => ({
              id: a.id,
              customerName: a.customer_name || a.lead_name || "Client",
              phone: a.customer_phone || a.phone || "",
              email: a.customer_email || a.email || "",
              service: a.service || "Consultation",
              date: a.appointment_date ? a.appointment_date.substring(0, 10) : new Date().toISOString().substring(0, 10),
              time: a.start_time || "10:00 AM",
              status: (a.status as any) || "Scheduled",
              notes: a.notes || "",
              reminders: {
                whatsapp: true,
                email: true,
                sms: false,
                timing: "1 Day Before"
              }
            }));
            setAppointments(mapped);
          }
        }
      } catch {
        setAppointments([]);
      }
    };
    fetchAppointments();
  }, []);

  // States
  const [calendarView, setCalendarView] = useState<"Day" | "Week" | "Month" | "Agenda">("Month");
  const [activeDate, setActiveDate] = useState<string>(() => new Date().toISOString().substring(0, 10));
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  
  // Custom Toasts Notification
  const [notification, setNotification] = useState<string | null>(null);

  // Form Fields for Create Appointment
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formService, setFormService] = useState("Consultation");
  const [formDate, setFormDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [formTime, setFormTime] = useState("10:00 AM");
  const [formNotes, setFormNotes] = useState("");
  
  // Reminder variables
  const [formWhatsapp, setFormWhatsapp] = useState(true);
  const [formEmailRem, setFormEmailRem] = useState(true);
  const [formSms, setFormSms] = useState(false);
  const [formTiming, setFormTiming] = useState<Appointment["reminders"]["timing"]>("1 Hour Before");

  // Reschedule & Cancel Modal States
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  
  // Form updates state
  const [reschedDate, setReschedDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [reschedTime, setReschedTime] = useState("11:00 AM");
  const [followUpNotes, setFollowUpNotes] = useState("Follow up regarding scheduled session.");

  const triggerToast = (text: string) => {
    setNotification(text);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) {
      triggerToast("Please provide the Customer Name and Contact Number.");
      return;
    }

    const newApt: Appointment = {
      id: `APT-${1000 + appointments.length + 1}`,
      customerName: formName,
      phone: formPhone,
      email: formEmail || "no-email@autofy.ai",
      service: formService,
      date: formDate,
      time: formTime,
      status: "Scheduled",
      notes: formNotes,
      reminders: {
        whatsapp: formWhatsapp,
        email: formEmailRem,
        sms: formSms,
        timing: formTiming
      }
    };

    setAppointments([newApt, ...appointments]);
    setIsCreateModalOpen(false);
    
    // Clear Form Fields
    setFormName("");
    setFormPhone("");
    setFormEmail("");
    setFormService("Premium Consultation");
    setFormNotes("");
    
    triggerToast(`Appointment successfully created for ${formName}! Autoreply reminders configured.`);
  };

  const handleUpdateStatus = (id: string, newStatus: Appointment["status"]) => {
    setAppointments(prev => prev.map(apt => 
      apt.id === id ? { ...apt, status: newStatus } : apt
    ));
    triggerToast(`Booking status updated to [${newStatus}] for ${id}`);
  };

  const handleReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment) return;

    setAppointments(prev => prev.map(apt => 
      apt.id === selectedAppointment.id 
        ? { ...apt, date: reschedDate, time: reschedTime, status: "Scheduled" } 
        : apt
    ));
    setIsRescheduleOpen(false);
    triggerToast(`Appointment ${selectedAppointment.id} rescheduled to ${reschedDate} at ${reschedTime}`);
    setSelectedAppointment(null);
  };

  const handleCancelAppointment = () => {
    if (!selectedAppointment) return;
    setAppointments(prev => prev.map(apt => 
      apt.id === selectedAppointment.id ? { ...apt, status: "Cancelled" } : apt
    ));
    setIsCancelOpen(false);
    triggerToast(`Appointment ${selectedAppointment.id} has been gracefully Cancelled.`);
    setSelectedAppointment(null);
  };

  const handleTriggerFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment) return;
    triggerToast(` Autofy automation queued follow-up text to ${selectedAppointment.customerName}: "${followUpNotes}"`);
    setIsFollowUpOpen(false);
    setSelectedAppointment(null);
  };

  // Filtering Logic
  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = apt.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          apt.phone.includes(searchQuery) ||
                          apt.service.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || apt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Simple Month Matrix representation (for mock calendar overview)
  const currentDaysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div id="appointments-management-module" className="space-y-6 text-[var(--text)] font-sans">
      
      {/* HEADER ROW */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-5 relative">
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-0 right-0 bg-[var(--bg-card)] border border-[var(--border-strong)]/40 text-[var(--text)] px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 z-50 text-[11px] font-bold"
            >
              <Sparkles className="w-4 h-4 text-[var(--text-muted)]" />
              {notification}
            </motion.div>
          )}
        </AnimatePresence>

        <div>
          <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight flex items-center gap-2" style={{ color: "var(--text)" }}>
            <Calendar className="w-5 h-5 text-purple-500" />
            Appointments
          </h2>
          <p className="text-xs font-sans mt-1" style={{ color: "var(--text-muted)" }}>
            Manage bookings, consultations, memberships, visits, and configure WhatsApp/SMS reminders.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-primary inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Appointment
        </button>
      </div>

      {/* METRIC CARD PANELS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Today's Visits", val: appointments.filter(a => a.date === new Date().toISOString().substring(0, 10)).length, action: "Active schedule" },
          { label: "Pending Confirmed", val: appointments.filter(a => a.status === "Confirmed" || a.status === "Scheduled").length, action: "Next 48 hrs" },
          { label: "Checkouts Completed", val: appointments.filter(a => a.status === "Completed").length, action: "Revenue generated" },
          { label: "No Shows Today", val: appointments.filter(a => a.status === "No Show").length, action: "Need follow-up" }
        ].map((met, i) => (
          <div key={i} className="p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl backdrop-blur-md">
            <p className="text-[9.5px] uppercase font-black text-[var(--text-subtle)] tracking-wider font-sans">{met.label}</p>
            <h4 className="text-2xl font-black font-mono text-[var(--text)] mt-1.5">{met.val} slots</h4>
            <p className="text-[10px] text-[var(--text-muted)] mt-1 flex items-center gap-1 font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" /> {met.action}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* CALENDAR BLOCK (LEFT 2 COLS ON DESKTOP) */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-5 backdrop-blur-md space-y-4">
            
            {/* VIEW OPTIONS BAR */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[var(--border)]/60 pb-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-[var(--text-muted)]" />
                <span className="text-sm font-black uppercase text-[var(--text)] tracking-wider">Interactive Calendar</span>
                <span className="text-[11px] font-mono text-[var(--text-subtle)] bg-[var(--bg-elevated)] border border-[var(--border)] px-2 py-0.5 rounded">June 2026</span>
              </div>

              {/* Day, Week, Month, Agenda selectors */}
              <div className="bg-[var(--input-bg)] p-1 border border-[var(--border)] rounded-xl flex items-center gap-1">
                {(["Day", "Week", "Month", "Agenda"] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => setCalendarView(v)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
                      calendarView === v 
                        ? "bg-purple-600 text-white shadow-sm font-black" 
                        : "text-[var(--text-subtle)] hover:text-[var(--text)]"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* CONDITIONAL RENDER PER VIEW */}
            {calendarView === "Month" && (
              <div className="space-y-4 font-sans">
                {/* Headers */}
                <div className="grid grid-cols-7 text-center text-[10px] tracking-wider uppercase font-black text-[var(--text-subtle)]">
                  <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
                </div>
                {/* Days matrix of June */}
                <div className="grid grid-cols-7 gap-2.5">
                  {/* Empty offsets to start June 2026 on Monday */}
                  <div className="bg-[var(--bg-elevated)]/10 border border-transparent h-14 rounded-2xl opacity-10" />
                  {currentDaysInMonth.map(day => {
                    const ym = activeDate.substring(0, 7);
                    const dateStr = `${ym}-${day < 10 ? `0${day}` : day}`;
                    const dayBookings = appointments.filter(a => a.date === dateStr);
                    const isToday = dateStr === new Date().toISOString().substring(0, 10);

                    return (
                      <div
                        key={day}
                        onClick={() => {
                          setActiveDate(dateStr);
                          triggerToast(`Selected date: ${dateStr}. Found ${dayBookings.length} bookings.`);
                        }}
                        className={`h-14 p-2 border rounded-2xl flex flex-col justify-between hover:bg-[var(--bg-elevated)]/60 transition cursor-pointer select-none ${
                          isToday 
                            ? "bg-[#F3E8FF] border-purple-500/40 text-purple-700 font-black shadow-sm" 
                            : dateStr === activeDate 
                            ? "bg-[var(--bg-elevated)] border-[var(--border-strong)] text-[var(--text)]" 
                            : "bg-[var(--bg-card)] border-[var(--border)] text-[var(--text)]"
                        }`}
                      >
                        <span className={`text-[10px] font-bold ${isToday ? "text-[var(--text)] font-black" : "text-[var(--text-muted)]"}`}>
                          {day}
                        </span>
                        
                        <div className="flex gap-1 overflow-x-auto scrollbar-none">
                          {dayBookings.map((b, idx) => (
                            <span 
                              key={idx}
                              title={`${b.customerName} - ${b.time}`}
                              className={`w-1.5 h-1.5 rounded-full ${
                                b.status === "Confirmed" 
                                  ? "bg-green-400" 
                                  : b.status === "Cancelled" 
                                  ? "bg-red-400" 
                                  : b.status === "Completed" 
                                  ? "bg-[var(--text-muted)]" 
                                  : "bg-amber-400"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {calendarView === "Day" && (
              <div className="space-y-3">
                <p className="text-xs font-black uppercase text-[var(--text)] tracking-wider font-mono">Day schedule: {activeDate}</p>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {appointments.filter(a => a.date === activeDate).map(apt => (
                    <div key={apt.id} className="p-3 bg-[var(--bg-elevated)]/50 border border-[var(--border)] rounded-2xl flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text)] rounded-xl">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[var(--text)] mb-0.5">{apt.customerName}</p>
                          <p className="text-[10px] text-[var(--text-muted)] font-semibold">{apt.service} • {apt.time}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                        apt.status === "Confirmed" ? "bg-green-500/10 text-green-400" : "bg-[var(--bg-elevated)] text-[var(--text-subtle)]"
                      }`}>{apt.status}</span>
                    </div>
                  ))}
                  {appointments.filter(a => a.date === activeDate).length === 0 && (
                    <p className="text-center py-6 text-[var(--text-subtle)] text-xs italic font-sans">No bookings scheduled on selected day.</p>
                  )}
                </div>
              </div>
            )}

            {/* DAY PREVIEW DRAWER UNDER MONTH VIEW */}
            {calendarView === "Month" && (
              <div className="p-4 bg-[var(--bg-elevated)]/30 border border-[var(--border)] rounded-2xl space-y-3">
                <p className="text-xs font-black uppercase text-[var(--text)] tracking-wider font-mono">Day schedule: {activeDate}</p>
                <div className="space-y-2">
                  {appointments.filter(a => a.date === activeDate).map(apt => (
                    <div key={apt.id} className="p-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-[var(--text)]">{apt.customerName} — {apt.service}</p>
                        <p className="text-[10px] text-[var(--text-subtle)] font-mono">{apt.time} ({apt.durationMinutes} mins) • Assigned: {apt.assignedStaff}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        apt.status === "Confirmed" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}>{apt.status}</span>
                    </div>
                  ))}
                  {appointments.filter(a => a.date === activeDate).length === 0 && (
                    <p className="text-center py-6 text-[var(--text-subtle)] text-xs italic font-sans">No bookings scheduled on selected day.</p>
                  )}
                </div>
              </div>
            )}

            {calendarView === "Week" && (
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 7 }, (_, i) => {
                  const curr = new Date();
                  const first = curr.getDate() - curr.getDay() + 1 + i;
                  const dayDate = new Date(curr.setDate(first));
                  const dStr = dayDate.toISOString().substring(0, 10);
                  const dayName = dayDate.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
                  return { name: dayName, date: dStr };
                }).map((wkDay, idx) => {
                  const bks = appointments.filter(a => a.date === wkDay.date);
                  return (
                    <div key={idx} className="p-2 bg-[var(--bg-elevated)]/35 border border-[var(--border)] rounded-xl text-center font-sans space-y-2 min-h-24">
                      <p className="text-[9px] font-black uppercase text-[var(--text-muted)]">{wkDay.name}</p>
                      <div className="space-y-1">
                        {bks.slice(0, 3).map(b => (
                          <div key={b.id} className="p-1 rounded bg-[var(--bg)] text-[8px] font-bold text-[var(--text)] truncate border border-[var(--border)]">
                            {b.time}
                          </div>
                        ))}
                        {bks.length > 3 && (
                          <p className="text-[8px] text-[var(--text-muted)] font-extrabold">+{bks.length - 3} more</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {calendarView === "Agenda" && (
              <div className="space-y-2">
                <p className="text-xs text-[var(--text-muted)] text-[var(--text-muted)] pb-2">Ongoing and upcoming schedules sorted by timeframe:</p>
                <div className="space-y-2.5 max-h-80 overflow-y-auto">
                  {appointments.map(apt => (
                    <div key={apt.id} className="p-3 bg-[var(--bg-elevated)]/40 border border-[var(--border)] rounded-2xl flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-[var(--text)]">{apt.customerName}</p>
                          <span className="text-[9px] px-1.5 py-0.5 bg-[var(--bg-card)] font-mono text-[var(--text-subtle)] border border-[var(--border)] rounded-md">{apt.id}</span>
                        </div>
                        <p className="text-[10px] text-[var(--text-muted)]">{apt.service} • {apt.date} at {apt.time}</p>
                      </div>
                      <span className={`text-[10px] font-black uppercase ${
                        apt.status === "Cancelled" ? "text-red-400" : "text-green-400"
                      }`}>{apt.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* APPOINTMENT ACTIONS LOGS TABLE */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-5 backdrop-blur-md space-y-4">
            
            {/* Search/Filter headers */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-[var(--text)] uppercase tracking-wider">Appointment Logs Ledger</h3>
                <p className="text-[10.5px] text-[var(--text-subtle)] mt-0.5">Real-time scheduling index of Autofy CRM system</p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="w-3.5 h-3.5 text-[var(--text-subtle)] absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, phone..."
                    className="w-full sm:w-44 bg-[#0a0a0c] border border-[var(--border)] pl-8 pr-3 py-1.5 rounded-xl text-xs text-[var(--text)] placeholder-neutral-500 focus:outline-none focus:border-blue-500/40"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-[#0a0a0c] border border-[var(--border)] px-2.5 py-1.5 rounded-xl text-xs text-[var(--text-muted)] focus:outline-none"
                >
                  <option value="All">All statuses</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="No Show">No Show</option>
                </select>
              </div>
            </div>

            {/* Logs Table or Clean Empty State */}
            {filteredAppointments.length === 0 ? (
              <div className="py-12 px-6 text-center bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl space-y-4 my-2">
                <div className="w-16 h-16 bg-purple-500/10 text-purple-400 rounded-2xl flex items-center justify-center mx-auto border border-purple-500/20">
                  <Calendar className="w-8 h-8" />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h3 className="text-base font-black text-[var(--text)]">No appointments yet</h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    When customers book appointments through WhatsApp or your website they will appear here automatically.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-[var(--text-subtle)] text-[10px] uppercase font-black tracking-wider">
                      <th className="py-2.5">Customer details</th>
                      <th className="py-2.5">Solution Service</th>
                      <th className="py-2.5">Schedule date/time</th>
                      <th className="py-2.5">Reminders Active</th>
                      <th className="py-2.5">Status</th>
                      <th className="py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900/40 text-[11px]">
                    {filteredAppointments.map(apt => (
                      <tr key={apt.id} className="hover:bg-[var(--bg-elevated)]/20 transition-colors">
                        <td className="py-3">
                          <p className="font-bold text-[var(--text)] text-[12px]">{apt.customerName}</p>
                          <p className="text-[10px] text-[var(--text-subtle)] font-mono mt-0.5">{apt.phone} • {apt.email}</p>
                        </td>
                        <td className="py-3 text-[var(--text)] font-semibold">{apt.service}</td>
                        <td className="py-3">
                          <p className="font-semibold text-[var(--text)]">{apt.date}</p>
                          <p className="text-[10px] text-[var(--text-subtle)] mt-0.5 font-mono">{apt.time}</p>
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-1">
                            {apt.reminders.whatsapp && (
                              <span className="text-[9px] px-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded">WA</span>
                            )}
                            {apt.reminders.email && (
                              <span className="text-[9px] px-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">Email</span>
                            )}
                            {apt.reminders.sms && (
                              <span className="text-[9px] px-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded">SMS</span>
                            )}
                            <span className="text-[9px] text-[var(--text-subtle)] font-mono font-bold">({apt.reminders.timing})</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded font-black text-[9.5px] uppercase ${
                            apt.status === "Confirmed" 
                              ? "bg-green-600/10 text-green-400 border border-green-500/20"
                              : apt.status === "Scheduled"
                              ? "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                              : apt.status === "Completed"
                              ? "bg-purple-600/10 text-purple-400 border border-purple-500/20"
                              : apt.status === "Cancelled"
                              ? "bg-red-650 bg-red-600/10 text-red-500 border border-red-500/20"
                              : "bg-[var(--bg-elevated)] text-[var(--text-subtle)] border border-[var(--border)]"
                          }`}>
                            {apt.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <div className="inline-flex gap-1.5 shrink-0">
                            <button
                              onClick={() => {
                                setSelectedAppointment(apt);
                                setReschedDate(apt.date);
                                setReschedTime(apt.time);
                                setIsRescheduleOpen(true);
                              }}
                              className="bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)] text-[var(--text)] font-bold px-2 py-1 rounded text-[9.5px] cursor-pointer"
                            >
                              Reschedule
                            </button>
                            <button
                              onClick={() => {
                                setSelectedAppointment(apt);
                                setIsCancelOpen(true);
                              }}
                              className="bg-[var(--bg-elevated)] hover:bg-red-500/10 hover:text-red-400 text-[var(--text-subtle)] font-bold px-2 py-1 rounded text-[9.5px] cursor-pointer border border-transparent hover:border-red-500/10"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => {
                                setSelectedAppointment(apt);
                                setFollowUpNotes(`Hi ${apt.customerName}, thanks for booking your slot with us. We would love to check if you have any feedback regarding your session!`);
                                setIsFollowUpOpen(true);
                              }}
                              className="bg-blue-600 hover:bg-blue-550 text-[var(--text)] font-bold px-2 py-1 rounded text-[9.5px] cursor-pointer shadow shadow-blue-500/5 whitespace-nowrap"
                            >
                              Follow-Up
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>

        </div>

        {/* AUTOMATIONS SIDE PANEL (RIGHT COL ON DESKTOP) */}
        <div className="space-y-6">
          
          {/* REMINDERS TRIGGER SWITCH PANEL */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-5 backdrop-blur-md space-y-4">
            <div>
              <h3 className="text-xs font-black text-[var(--text)] uppercase tracking-wider text-blue-400">Automatic Scheduler Dispatch</h3>
              <p className="text-[10.5px] text-[var(--text-subtle)] mt-0.5">Toggle automation bots for notifications and CRM callbacks.</p>
            </div>

            <div className="space-y-3">
              {[
                { title: "Inbound WhatsApp reminders sync", desc: "Auto-dispense 2-way checklist links inside WhatsApp chat channels", status: true },
                { title: "Direct email notification relays", desc: "Sync formal calendar requests and schedules using secure SMTP line", status: true },
                { title: "SMS transactional backups", desc: "Fallback to regional cell networks if WhatsApp data is offline", status: false },
                { title: "Escrow payment link automatic hook", desc: "Attach Razorpay / PhonePe check-up tokens with reminders", status: true }
              ].map((auto, sIdx) => {
                const [active, setActive] = useState(auto.status);
                return (
                  <div key={sIdx} className="p-3 bg-[var(--bg-elevated)]/30 border border-[var(--border)] rounded-2xl flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-[var(--text)] leading-snug">{auto.title}</p>
                      <p className="text-[9px] text-[var(--text-subtle)] leading-normal">{auto.desc}</p>
                    </div>
                    <button
                      onClick={() => {
                        setActive(!active);
                        triggerToast(`Successfully toggled: ${auto.title}`);
                      }}
                      className={`w-7 h-4 rounded-full p-0.5 transition-all outline-none shrink-0 ${
                        active ? "bg-blue-600" : "bg-[var(--bg-elevated)]"
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-full bg-white transition-all ${
                        active ? "translate-x-3" : "translate-x-0"
                      }`} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* QUEUED NOTIFICATION TIMELINE */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-5 backdrop-blur-md space-y-4">
            <h3 className="text-xs font-black text-[var(--text)] uppercase tracking-wider text-blue-400">Active Reminder Dispatch Logs</h3>
            
            <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
              {appointments.length > 0 ? (
                appointments.slice(0, 5).map((appt, lIdx) => (
                  <div key={lIdx} className="p-3 bg-[var(--bg-elevated)]/40 border border-[var(--border)] rounded-xl space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-[9.5px] px-1 bg-cyan-600/15 text-cyan-400 border border-cyan-500/20 rounded font-black uppercase font-mono">WhatsApp Active</span>
                      <span className="text-[8.5px] text-[var(--text-subtle)] font-mono">{appt.time}</span>
                    </div>
                    <p className="font-bold text-[var(--text)]">To: {appt.customerName}</p>
                    <p className="text-[10px] text-[var(--text-muted)] italic font-mono truncate">"Appointment scheduled for {appt.service} on {appt.date}."</p>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-[var(--text-subtle)] font-mono space-y-2">
                  <Bell className="w-6 h-6 mx-auto opacity-40 text-purple-400" />
                  <p className="font-bold text-[var(--text-muted)]">No reminder activity yet.</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* CREATE APPOINTMENT VIEW LAYOUT/MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg bg-[#0e0f13] border border-[var(--border)] rounded-3xl p-6 shadow-2xl relative"
          >
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute right-5 top-5 p-1 hover:bg-[var(--bg-elevated)] rounded-xl text-[var(--text-subtle)] hover:text-[var(--text)] transition"
            >
              <XCircle className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-black text-[var(--text)] uppercase tracking-wider text-blue-400 border-b border-[var(--border)] pb-2 mb-4">Manual Slot Reservation</h3>

            <form onSubmit={handleCreateAppointment} className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black tracking-wider text-[var(--text-subtle)]">FullName</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Customer Name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-[#050507] border border-[var(--border)] p-2.5 rounded-xl text-xs text-[var(--text)] placeholder-neutral-500 focus:outline-none focus:border-[var(--brand)]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black tracking-wider text-[var(--text-subtle)]">Phone</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98765 43210"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full bg-[#050507] border border-[var(--border)] p-2.5 rounded-xl text-xs text-[var(--text)] placeholder-neutral-500 focus:outline-none focus:border-[var(--brand)]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black tracking-wider text-[var(--text-subtle)]">Email Address</label>
                  <input
                    type="email"
                    placeholder="name@gmail.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full bg-[#050507] border border-[var(--border)] p-2.5 rounded-xl text-xs text-[var(--text)] placeholder-neutral-500 focus:outline-none focus:border-[var(--brand)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black tracking-wider text-[var(--text-subtle)]">Service Category</label>
                  <select
                    value={formService}
                    onChange={(e) => setFormService(e.target.value)}
                    className="w-full bg-[#050507] border border-[var(--border)] p-2.5 rounded-xl text-xs text-[var(--text)] focus:outline-none"
                  >
                    <option value="Premium Consultation">Premium Consultation</option>
                    <option value="Trial Session Workout">Trial Session Workout</option>
                    <option value="Custom Service Package">Custom Service Package</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black tracking-wider text-[var(--text-subtle)]">Required Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-[#050507] border border-[var(--border)] p-2.5 rounded-xl text-xs text-[var(--text)] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black tracking-wider text-[var(--text-subtle)]">Scheduled Time</label>
                  <input
                    type="text"
                    placeholder="10:00 AM"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full bg-[#050507] border border-[var(--border)] p-2.5 rounded-xl text-xs text-[var(--text)] focus:outline-none focus:border-[var(--brand)]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black tracking-wider text-[var(--text-subtle)]">Customer Notes</label>
                <textarea
                  rows={2}
                  placeholder="Optional specific requirements, special medical requests etc."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-[#050507] border border-[var(--border)] p-2.5 rounded-xl text-xs text-[var(--text)] focus:outline-none"
                />
              </div>

              {/* Reminders layout */}
              <div className="bg-[var(--bg-elevated)]/40 border border-[var(--border)] p-3.5 rounded-2xl space-y-3">
                <label className="text-[10px] uppercase font-black tracking-wider text-blue-400">Configure Automated Notification Reminders</label>
                
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-xs text-[var(--text)] cursor-pointer">
                    <input type="checkbox" checked={formWhatsapp} onChange={(e) => setFormWhatsapp(e.target.checked)} className="accent-blue-500" />
                    WhatsApp Alert
                  </label>
                  <label className="flex items-center gap-2 text-xs text-[var(--text)] cursor-pointer">
                    <input type="checkbox" checked={formEmailRem} onChange={(e) => setFormEmailRem(e.target.checked)} className="accent-blue-500" />
                    Email Dispatch
                  </label>
                  <label className="flex items-center gap-2 text-xs text-[var(--text)] cursor-pointer">
                    <input type="checkbox" checked={formSms} onChange={(e) => setFormSms(e.target.checked)} className="accent-blue-500" />
                    SMS Callback
                  </label>
                </div>

                <div className="space-y-1 pt-1.5 border-t border-[var(--border)]/60">
                  <label className="text-[9px] uppercase font-black tracking-wider text-[var(--text-subtle)]">Reminder Timing Offset</label>
                  <select
                    value={formTiming}
                    onChange={(e) => setFormTiming(e.target.value as Appointment["reminders"]["timing"])}
                    className="w-full bg-[#050507] border border-[var(--border)] p-2 rounded-xl text-xs text-[var(--text)] focus:outline-none"
                  >
                    <option value="1 Hour Before">1 Hour Before Scheduled Slot</option>
                    <option value="1 Day Before">1 Day Before Scheduled Slot</option>
                    <option value="Custom">Custom Automation Rules</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-3 text-xs font-bold text-[var(--text-muted)] bg-[var(--bg-card)] border border-[var(--border)] hover:bg-[var(--bg-elevated)] rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 text-xs font-bold text-[var(--text)] bg-blue-600 hover:bg-blue-550 rounded-xl transition cursor-pointer shadow-lg shadow-blue-500/10"
                >
                  Lock &amp; Schedule Slot
                </button>
              </div>

            </form>
          </motion.div>
        </div>
      )}

      {/* RESCHEDULE OVERLAY */}
      {isRescheduleOpen && selectedAppointment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-[#0e0f13] border border-[var(--border)] rounded-3xl p-5 shadow-2xl space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-blue-400">Reschedule Slot: {selectedAppointment.id}</h3>
            
            <form onSubmit={handleReschedule} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9.5px] uppercase font-black text-[var(--text-subtle)]">Move To Date</label>
                <input
                  type="date"
                  value={reschedDate}
                  onChange={(e) => setReschedDate(e.target.value)}
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] p-2.5 rounded-xl text-xs text-[var(--text)] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9.5px] uppercase font-black text-[var(--text-subtle)]">Time Interval Slot</label>
                <input
                  type="text"
                  value={reschedTime}
                  onChange={(e) => setReschedTime(e.target.value)}
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] p-2.5 rounded-xl text-xs text-[var(--text)] focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsRescheduleOpen(false)} className="flex-1 py-2.5 text-xs font-bold bg-[var(--bg-card)] hover:bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-550 rounded-xl cursor-pointer">Reschedule Slot</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL BOOKING MODAL */}
      {isCancelOpen && selectedAppointment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-xs bg-[#0e0f13] border border-[var(--border)] rounded-3xl p-5 shadow-2xl text-center space-y-4">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
            
            <div className="space-y-1">
              <p className="text-sm font-bold text-[var(--text)]">Cancel Booking?</p>
              <p className="text-[10.5px] text-[var(--text-muted)]">Are you sure you want to cancel the scheduled session of {selectedAppointment.customerName} on {selectedAppointment.date}?</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setIsCancelOpen(false)} className="flex-1 py-2 text-xs font-bold bg-[var(--bg-card)] hover:bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl cursor-pointer">No, keep</button>
              <button onClick={handleCancelAppointment} className="flex-1 py-2 text-xs font-bold bg-red-650 hover:bg-red-600 rounded-xl text-[var(--text)] cursor-pointer">Yes, Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* FOLLOW-UP SUBMIT MODAL */}
      {isFollowUpOpen && selectedAppointment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-[#0e0f13] border border-[var(--border)] rounded-3xl p-5 shadow-2xl space-y-4">
            <h3 className="text-xs font-black uppercase text-blue-400 tracking-wider">Deploy Autofy Follow-Up message</h3>
            
            <form onSubmit={handleTriggerFollowUp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black text-[var(--text-subtle)]">Interactive Follow-Up Template text</label>
                <textarea
                  rows={3}
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] p-2.5 rounded-xl text-xs text-[var(--text)] focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-1 border-t border-[var(--border)]">
                <button type="button" onClick={() => setIsFollowUpOpen(false)} className="flex-1 py-2.5 text-xs font-bold bg-[var(--bg-card)] border border-[var(--border)] rounded-xl cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-550 rounded-xl text-[var(--text)] cursor-pointer">Send WhatsApp Dispatch</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
