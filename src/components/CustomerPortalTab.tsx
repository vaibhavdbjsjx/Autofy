import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar,
  CreditCard,
  User,
  MessageSquare,
  FileText,
  Download,
  AlertCircle,
  Plus,
  ArrowRight,
  Shield,
  Clock,
  Sparkles,
  CheckCircle,
  Send,
  LifeBuoy
} from "lucide-react";

export const CustomerPortalTab: React.FC = () => {
  // Member States — initialized dynamically for logged-in user
  const [tier, setTier] = useState<"Silver" | "Gold" | "Platinum">("Gold");
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  
  // Appointments state — starts empty
  const [appointments, setAppointments] = useState<Array<{ id: string; date: string; time: string; service: string; status: string; trainer: string }>>([]);
  
  // Interactive Book form state
  const [showBookModal, setShowBookModal] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("4:00 PM");
  const [newService, setNewService] = useState("Consultation Session");

  // Invoices list state — starts empty
  const [invoices, setInvoices] = useState<Array<{ id: string; date: string; amount: string; status: string; method: string }>>([]);

  React.useEffect(() => {
    const loadProfile = async () => {
      try {
        const { getCurrentUser } = await import("../lib/auth");
        const { user } = await getCurrentUser();
        if (user) {
          setProfileName((user as any).name || (user as any).full_name || user.email || "");
          setProfileEmail(user.email || "");
          setProfilePhone((user as any).phone || "");
        }
      } catch { /* ignore */ }
    };
    loadProfile();
  }, []);

  // Support list
  const [tickets, setTickets] = useState<Array<{ id: string; subject: string; status: string; date: string }>>([]);
  const [newTicketSubject, setNewTicketSubject] = useState("");

  // Chat conversation
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: "bot", text: "Hello! Welcome to the Customer Portal. How can we assist you today?", time: "Now" }
  ]);
  const [typedMessage, setTypedMessage] = useState("");

  const handleBookAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate) return;
    const item = {
      id: "a-" + Date.now(),
      date: newDate,
      time: newTime,
      service: newService,
      status: "Confirmed",
      trainer: "Primary Team Expert"
    };
    setAppointments([item, ...appointments]);
    setShowBookModal(false);
    setNewDate("");
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketSubject.trim()) return;
    const tick = {
      id: "T-" + Math.floor(100 + Math.random() * 900),
      subject: newTicketSubject,
      status: "Under Review",
      date: "Just Now"
    };
    setTickets([tick, ...tickets]);
    setNewTicketSubject("");
  };

  const sendMessage = () => {
    if (!typedMessage.trim()) return;
    const userMsg = { id: Date.now(), sender: "client", text: typedMessage, time: "Just Now" };
    setChatMessages(prev => [...prev, userMsg]);
    
    const textQuery = typedMessage;
    setTypedMessage("");

    // Simple automated response trigger
    setTimeout(() => {
      let replyText = "Understood. Our luxury support concierge has logged your query and will reply within 5 minutes.";
      if (textQuery.toLowerCase().includes("membership") || textQuery.toLowerCase().includes("renew")) {
        replyText = "To renew or manage plans and get 15% VIP discounts, navigate to the plan module below or upgrade securely.";
      } else if (textQuery.toLowerCase().includes("appointment") || textQuery.toLowerCase().includes("book")) {
        replyText = "You can schedule sessions automatically using the interactive schedule modal on top!";
      }
      setChatMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: "bot",
        text: replyText,
        time: "Just Now"
      }]);
    }, 1200);
  };

  return (
    <div id="customer-portal-view" className="space-y-8 animate-fade-in text-[var(--text)]">
      
      {/* Header with Luxury Grey Styling */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[var(--border)] pb-6 gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-subtle)] font-sans">For Active Customers</span>
          <h1 className="text-3xl font-extrabold text-[var(--text)] tracking-tight mt-1">Customer Portal</h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">Manage private memberships, direct billing, scheduling slots, and secure interactions.</p>
        </div>
        
        {/* Tier Indicator Card */}
        <div className="px-5 py-3 rounded-2xl bg-white/[0.04] border border-[var(--border)] flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-[var(--border)] flex items-center justify-center">
            <Shield className="w-5 h-5 text-[var(--text)]" />
          </div>
          <div>
            <span className="block text-[10px] text-[var(--text-subtle)] uppercase font-black">Plan Tier</span>
            <span className="text-sm font-bold text-[var(--text)] font-sans">{tier} Premium</span>
          </div>
          <div className="flex gap-1">
            <button 
              onClick={() => { setTier("Platinum"); }} 
              className="px-2 py-1 text-[9px] font-black uppercase text-[var(--text)] bg-white/[0.08] hover:bg-white/[0.15] border border-[var(--border)] rounded transition-all"
            >
              VIP Upgrade
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Column (Activity & Scheduling) / Right Column (Financials & Chat) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Column 1: Core Dashboard & Scheduling */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Dashboard Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-[var(--border)] space-y-2">
              <span className="block text-[10.5px] font-bold text-[var(--text-subtle)] uppercase tracking-widest">Active Credits</span>
              <p className="text-2xl font-black text-[var(--text)]">12 Sessions</p>
              <p className="text-[10px] text-[var(--text-muted)]">Valid until Aug 2026</p>
            </div>
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-[var(--border)] space-y-2">
              <span className="block text-[10.5px] font-bold text-[var(--text-subtle)] uppercase tracking-widest">Next Booking</span>
              <p className="text-2xl font-black text-[var(--text)]">Tomorrow</p>
              <p className="text-[10px] text-[var(--text-muted)]">At 4:00 PM slot</p>
            </div>
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-[var(--border)] space-y-2">
              <span className="block text-[10.5px] font-bold text-[var(--text-subtle)] uppercase tracking-widest">Status Level</span>
              <p className="text-2xl font-black text-[var(--text-muted)]">Verified ID</p>
              <p className="text-[10px] text-[var(--text-muted)]">Autoflow Certified</p>
            </div>
          </div>

          {/* Upcoming Appointments */}
          <div className="p-6 rounded-2xl bg-white/[0.04] border border-[var(--border)] backdrop-blur-md">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
                <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider">Upcoming Bookings</h3>
              </div>
              <button 
                onClick={() => setShowBookModal(true)}
                className="px-3 py-1.5 bg-white/[0.06] hover:bg-white/[0.12] border border-[var(--border)] text-xs font-bold text-[var(--text)] rounded-xl transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Book Appointment
              </button>
            </div>

            <div className="space-y-3">
              {appointments.length > 0 ? (
                appointments.map((appt) => (
                  <div key={appt.id} className="p-4 rounded-xl bg-white/[0.02] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[var(--border)] transition-colors">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-[var(--text)] font-sans">{appt.service}</p>
                      <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {appt.date} at {appt.time}</span>
                        <span className="text-[var(--text-subtle)]">•</span>
                        <span>Assigned: {appt.trainer}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#A3A3A3] bg-white/[0.1] rounded">
                        {appt.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-6 text-xs text-[var(--text-subtle)] italic font-sans border border-dashed border-[var(--border)] rounded-xl">
                  No upcoming appointments scheduled yet.
                </p>
              )}
            </div>
          </div>

          {/* Membership Details */}
          <div className="p-6 rounded-2xl bg-white/[0.04] border border-[var(--border)] backdrop-blur-md">
            <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider mb-4">Membership Package Status</h3>
            <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] flex flex-col md:flex-row justify-between gap-6">
              <div className="space-y-2">
                <h4 className="text-md font-bold text-[var(--text)]">Annual Premium Pass ({tier})</h4>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-md">Enjoy full-featured luxury support, premium towels access, private locker arrangements, and complimentary workouts with dedicated trainers.</p>
                <div className="flex gap-4 text-[11px] text-[var(--text-muted)] pt-2 font-mono">
                  <div><span className="text-[var(--text-subtle)]">MEMBER ID:</span> #AUT-991204</div>
                  <div><span className="text-[var(--text-subtle)]">RENEWS ON:</span> March 01, 2027</div>
                </div>
              </div>
              <div className="flex flex-col justify-end gap-2 shrink-0">
                <button 
                  onClick={() => alert("Membership renewed successfully for an additional year!")} 
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-[var(--border)] text-xs font-bold text-[var(--text)] rounded-xl transition-all text-center"
                >
                  Renew Membership
                </button>
                <button 
                  onClick={() => alert("Downgrade request lodged with administrative desk.")}
                  className="px-4 py-2 bg-transparent hover:bg-white/[0.04] text-xs font-semibold text-[var(--text-muted)] rounded-xl transition-all text-center"
                >
                  Change Term Settings
                </button>
              </div>
            </div>
          </div>

          {/* Profile Details & Payment Verification Info */}
          <div className="p-6 rounded-2xl bg-white/[0.04] border border-[var(--border)] backdrop-blur-md">
            <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider mb-4">Personal Settings</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-[var(--text-subtle)] uppercase font-black">Authorized Full Name</label>
                <input 
                  type="text" 
                  value={profileName} 
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full bg-[#101012] border border-[var(--border)] p-2.5 rounded-xl text-xs text-[var(--text)] focus:outline-none focus:border-[var(--border)]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-[var(--text-subtle)] uppercase font-black">Email Address</label>
                <input 
                  type="email" 
                  value={profileEmail} 
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full bg-[#101012] border border-[var(--border)] p-2.5 rounded-xl text-xs text-[var(--text)] focus:outline-none focus:border-[var(--border)]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-[var(--text-subtle)] uppercase font-black">Contact Number</label>
                <input 
                  type="text" 
                  value={profilePhone} 
                  onChange={(e) => setProfilePhone(e.target.value)}
                  className="w-full bg-[#101012] border border-[var(--border)] p-2.5 rounded-xl text-xs text-[var(--text)] focus:outline-none focus:border-[var(--border)]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-[var(--text-subtle)] uppercase font-black">Authorized Signature ID</label>
                <div className="bg-[var(--bg-card)] border border-[var(--border)] p-2.5 rounded-xl text-xs font-mono text-[var(--text-muted)] flex items-center justify-between">
                  <span>91a0c44-auth-vaibhav</span>
                  <span className="text-[9px] uppercase bg-white/[0.08] px-1.5 py-0.5 rounded text-[var(--text)]">Signed</span>
                </div>
              </div>
            </div>
            
            <div className="mt-5 pt-4 border-t border-[var(--border)] flex items-center justify-between">
              <p className="text-[11px] text-[var(--text-subtle)]">Your customer dashboard is protected by industry standard SSL and JWT encryption keys.</p>
              <button 
                onClick={() => alert("Personal profile settings synchronized!")} 
                className="px-4 py-2 bg-white text-black font-extrabold text-xs rounded-xl hover:bg-[var(--text)] transition-colors"
              >
                Save Details
              </button>
            </div>
          </div>

        </div>

        {/* Column 2: Financial logs & interactions */}
        <div className="space-y-6">
          
          {/* Saved Payment Methods */}
          <div className="p-6 rounded-2xl bg-white/[0.04] border border-[var(--border)] backdrop-blur-md">
            <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider mb-3">Saved Gateways</h3>
            <div className="space-y-2">
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-[var(--border)] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-4 h-4 text-[var(--text-muted)]" />
                  <div>
                    <p className="text-xs font-bold text-[var(--text)]">HDFC Visa Credit Card</p>
                    <p className="text-[10px] text-[var(--text-subtle)]">Exp. 12/2029 • Primary Lock</p>
                  </div>
                </div>
                <span className="text-[9px] uppercase px-2 py-0.5 bg-white/[0.06] text-[var(--text-muted)] rounded-md">Default</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-[var(--border)] flex items-center justify-between opacity-60">
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-4 h-4 text-[var(--text-muted)]" />
                  <div>
                    <p className="text-xs font-bold text-[var(--text)]">ICICI Debit Card</p>
                    <p className="text-[10px] text-[var(--text-subtle)]">Exp. 04/2031</p>
                  </div>
                </div>
                <button className="text-[9px] hover:underline text-[var(--text)]" onClick={() => alert("Set as default gateway placeholder")}>Set Default</button>
              </div>
            </div>
          </div>

          {/* Interactive Live Chat Sim */}
          <div className="p-6 rounded-2xl bg-white/[0.04] border border-[var(--border)] backdrop-blur-md flex flex-col h-[340px]">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)] mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                <h3 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">Live Concierge Support</h3>
              </div>
              <span className="text-[9px] font-mono text-[var(--text-muted)]">Response 2 min</span>
            </div>

            {/* Chat Messages Roll */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 font-sans text-xs">
              {chatMessages.map(msg => (
                <div key={msg.id} className={`flex flex-col ${msg.sender === "client" ? "items-end" : "items-start"}`}>
                  <div className={`p-2.5 rounded-2xl max-w-[85%] leading-relaxed ${
                    msg.sender === "client" 
                      ? "bg-white/[0.08] border border-[var(--border)] text-[var(--text)] rounded-tr-none" 
                      : "bg-[#111112] border border-[var(--border)] text-[var(--text)] rounded-tl-none"
                  }`}>
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-[var(--text-subtle)] mt-1 px-1">{msg.time}</span>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div className="mt-3 flex gap-2 pt-2 border-t border-[var(--border)]">
              <input 
                type="text" 
                placeholder="Type query (e.g. membership)..."
                value={typedMessage}
                onChange={(e) => setTypedMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                className="flex-1 bg-[#101012] border border-[var(--border)] px-3 py-2 rounded-xl text-xs text-[var(--text)] focus:outline-none"
              />
              <button 
                onClick={sendMessage}
                className="p-2 bg-white hover:bg-[var(--text)] text-black rounded-xl transition-all"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Invoices List */}
          <div className="p-6 rounded-2xl bg-white/[0.04] border border-[var(--border)] backdrop-blur-md">
            <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider mb-3">Recent Receipts</h3>
            <div className="space-y-3">
              {invoices.length > 0 ? (
                invoices.map((inv) => (
                  <div key={inv.id} className="p-3 bg-[#111112]/50 border border-[var(--border)] rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[var(--text)]">{inv.id}</h4>
                      <p className="text-[10px] text-[var(--text-subtle)]">{inv.date} via {inv.method}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-[var(--text)]">{inv.amount}</span>
                      <button 
                        onClick={() => alert(`Initiating receipt download for ${inv.id}`)}
                        className="p-1.5 bg-white/[0.05] hover:bg-white/[0.12] border border-[var(--border)] rounded-lg text-[var(--text)] transition-all"
                        title="Download Invoice"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-4 text-xs text-[var(--text-subtle)] italic font-sans border border-dashed border-[var(--border)] rounded-xl">
                  No payment receipts recorded yet.
                </p>
              )}
            </div>
          </div>

          {/* Support Ticket Filing */}
          <div className="p-6 rounded-2xl bg-white/[0.04] border border-[var(--border)] backdrop-blur-md">
            <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider mb-3">Lodge Support Ticket</h3>
            <form onSubmit={handleCreateTicket} className="space-y-3">
              <input 
                type="text" 
                placeholder="Briefly describe issue..."
                value={newTicketSubject}
                onChange={(e) => setNewTicketSubject(e.target.value)}
                required
                className="w-full bg-[#101012] border border-[var(--border)] p-2.5 rounded-xl text-xs text-[var(--text)] focus:outline-none"
              />
              <button 
                type="submit"
                className="w-full py-2 bg-white/[0.08] hover:bg-white/[0.15] border border-[var(--border)] text-xs font-bold text-[var(--text)] rounded-xl transition-colors"
              >
                Submit Ticket
              </button>
            </form>

            <div className="mt-4 pt-3 border-t border-[var(--border)] space-y-2">
              <span className="text-[10px] text-[var(--text-subtle)] uppercase font-black block">Active Support Tickets</span>
              {tickets.map(ticket => (
                <div key={ticket.id} className="flex justify-between items-center text-xs p-2 rounded bg-white/[0.01]">
                  <div>
                    <p className="font-semibold text-[var(--text)]">{ticket.subject}</p>
                    <p className="text-[9px] text-[var(--text-subtle)]">{ticket.date}</p>
                  </div>
                  <span className={`text-[8.5px] px-1.5 py-0.5 rounded font-bold uppercase ${
                    ticket.status === "Resolved" ? "bg-green-500/10 text-green-400" : "bg-[var(--text-subtle)]/10 text-[var(--text-muted)]"
                  }`}>{ticket.status}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Book Appointment Modal */}
      <AnimatePresence>
        {showBookModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md p-6 bg-[#0E0E0F] border border-[var(--border)] rounded-3xl space-y-4"
            >
              <div>
                <h3 className="text-md font-bold text-[var(--text)]">Book Appointment Slot</h3>
                <p className="text-xs text-[var(--text-muted)]">Allot premium session workouts directly on client portal.</p>
              </div>

              <form onSubmit={handleBookAppointment} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-[var(--text-subtle)]">Service Category</label>
                  <select 
                    value={newService} 
                    onChange={(e) => setNewService(e.target.value)}
                    className="w-full bg-[#101012] border border-[var(--border)] p-2.5 rounded-xl text-xs text-[var(--text)] focus:outline-none"
                  >
                    <option value="Elite Strength & Conditioning">Elite Strength & Conditioning</option>
                    <option value="Yoga Masterclass Passes">Yoga Masterclass Passes</option>
                    <option value="Premium Personal Training Workout">Premium Personal Training Workout</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black text-[var(--text-subtle)]">Date</label>
                    <input 
                      type="text" 
                      placeholder="June 23, 2026"
                      value={newDate} 
                      onChange={(e) => setNewDate(e.target.value)}
                      required
                      className="w-full bg-[#101012] border border-[var(--border)] p-2.5 rounded-xl text-xs text-[var(--text)] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black text-[var(--text-subtle)]">Desired Time Slot</label>
                    <input 
                      type="text" 
                      placeholder="4:0 PM"
                      value={newTime} 
                      onChange={(e) => setNewTime(e.target.value)}
                      required
                      className="w-full bg-[#101012] border border-[var(--border)] p-2.5 rounded-xl text-xs text-[var(--text)] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowBookModal(false)}
                    className="flex-1 py-3 border border-[var(--border)] hover:bg-white/[0.04] text-xs font-bold text-[var(--text-muted)] rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-white hover:bg-[var(--text)] text-black font-extrabold text-xs rounded-xl transition-all"
                  >
                    Confirm Booking
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
