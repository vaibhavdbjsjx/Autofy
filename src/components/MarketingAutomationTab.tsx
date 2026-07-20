import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { api } from "../lib/api";
import {
  Megaphone,
  Plus,
  TrendingUp,
  Target,
  DollarSign,
  Layers,
  Send,
  Clock,
  CheckCircle,
  Eye,
  MousePointerClick,
  Sparkles,
  ArrowUpRight,
  Info,
  Calendar,
  X
} from "lucide-react";

export interface CampaignData {
  id: string;
  name: string;
  channel: string;
  status: "Draft" | "Scheduled" | "Completed" | "Cancelled";
  scheduled_at: string | null;
  target_segment: string;
  content: string;
  sent_count: number;
  open_rate: number;
  click_rate: number;
  conversion_rate: number;
  revenue_generated: number;
  created_at: string;
}

export interface BroadcastMessageLog {
  id: string;
  recipient_name: string | null;
  recipient_phone: string;
  status: string; // Sent, Delivered, Clicked, Converted, Failed
  sent_at: string;
}

interface MarketingAutomationTabProps {
  triggerNotification?: (msg: string) => void;
}

export const MarketingAutomationTab: React.FC<MarketingAutomationTabProps> = ({
  triggerNotification = (msg) => console.log(msg)
}) => {
  const [campaigns, setCampaigns] = useState<CampaignData[]>([
    {
      id: "camp-1",
      name: "AEW Exhaust Summer Blockloader Promo",
      channel: "WhatsApp",
      status: "Completed",
      scheduled_at: "2026-06-15 10:00",
      target_segment: "VIP",
      content: "Hey Royal Riding Champion! Get an exclusive flat ₹1,200 discount on our lightweight AEW exhausts for Classic 350. Valid until this Friday! Order now at local shop.",
      sent_count: 180,
      open_rate: 0.92,
      click_rate: 0.48,
      conversion_rate: 0.15,
      revenue_generated: 32400.0,
      created_at: "2026-06-14"
    },
    {
      id: "camp-2",
      name: "Stealth Helmet clearance, clearance clearance",
      channel: "WhatsApp",
      status: "Completed",
      scheduled_at: "2026-06-18 11:30",
      target_segment: "Returning Customer",
      content: "Exclusive Deal: Get up to 25% off on our brand new Stealth Knight Full Face Helmets. Direct premium protection at low price.",
      sent_count: 320,
      open_rate: 0.88,
      click_rate: 0.35,
      conversion_rate: 0.08,
      revenue_generated: 18400.0,
      created_at: "2026-06-17"
    },
    {
      id: "camp-3",
      name: "Weekend Fitting Workshop Launch",
      channel: "WhatsApp",
      status: "Scheduled",
      scheduled_at: "2026-06-25 09:00",
      target_segment: "All",
      content: "Exciting updates! Our brand new exhaust fitting lab at Sector 17 Vashi, Navi Mumbai is now official. Book a weekend slot for high custom exhaust sound tests.",
      sent_count: 0,
      open_rate: 0.0,
      click_rate: 0.0,
      conversion_rate: 0.0,
      revenue_generated: 0.0,
      created_at: "2026-06-20"
    }
  ]);

  const [broadcasts, setBroadcasts] = useState<BroadcastMessageLog[]>([
    { id: "b1", recipient_name: "Rahul Sharma", recipient_phone: "+91 98765 43210", status: "Converted", sent_at: "2026-06-20 10:00" },
    { id: "b2", recipient_name: "John Doe", recipient_phone: "+1 (555) 019-2834", status: "Clicked", sent_at: "2026-06-20 10:02" },
    { id: "b3", recipient_name: "Amit Patel", recipient_phone: "+91 99112 23344", status: "Delivered", sent_at: "2026-06-20 10:05" }
  ]);

  const [analytics, setAnalytics] = useState({
    completedCampaignsCount: 2,
    totalRevenueMarketing: 50800.0,
    overallOpenRate: 0.90,
    overallClickRate: 0.41,
    overallConversionRate: 0.11
  });

  const [isLoading, setIsLoading] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("camp-1");

  // New campaign modal states
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  const [newCampName, setNewCampName] = useState("");
  const [newCampSegment, setNewCampSegment] = useState("All");
  const [newCampContent, setNewCampContent] = useState("");
  const [newCampSchedule, setNewCampSchedule] = useState("");

  useEffect(() => {
    fetchMarketingData();
  }, []);

  const fetchMarketingData = async () => {
    setIsLoading(true);
    try {
      const d = await api.get<any>("/api/v1/marketing/campaigns");
      if (d?.campaigns && d.campaigns.length > 0) {
        setCampaigns(d.campaigns);
      }
    } catch (e) {
      console.log("Marketing campaigns fallback:", e);
    }

    // Fetch broadcasts logs for currently highlighted campaign if any
    try {
      const d = await api.get<any>(`/api/v1/marketing/campaigns/${selectedCampaignId}/broadcasts`);
      if (d?.broadcasts && d.broadcasts.length > 0) {
        setBroadcasts(d.broadcasts);
      }
    } catch (e) {
      console.log("Marketing broadcasts fallback:", e);
    }

    try {
      const d = await api.get<any>("/api/v1/marketing/analytics");
      setAnalytics({
        completedCampaignsCount: d.completed_campaigns_count || 2,
        totalRevenueMarketing: d.total_revenue_marketing || 50800.0,
        overallOpenRate: d.overall_open_rate || 0.90,
        overallClickRate: d.overall_click_rate || 0.41,
        overallConversionRate: d.overall_conversion_rate || 0.11
      });
    } catch (e) {
      console.log("Marketing analytics fallback:", e);
    }

    setIsLoading(false);
  };

  const activeCamp = campaigns.find(c => c.id === selectedCampaignId) || campaigns[0] || null;

  const handleCreateCampaignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampName.trim() || !newCampContent.trim()) {
      triggerNotification("Please fill in campaign title and broadcast text.");
      return;
    }

    const newCamp: CampaignData = {
      id: "camp-" + Math.floor(Math.random() * 800 + 100),
      name: newCampName,
      channel: "WhatsApp",
      status: newCampSchedule ? "Scheduled" : "Draft",
      scheduled_at: newCampSchedule ? newCampSchedule.replace("T", " ") : null,
      target_segment: newCampSegment,
      content: newCampContent,
      sent_count: 0,
      open_rate: 0.0,
      click_rate: 0.0,
      conversion_rate: 0.0,
      revenue_generated: 0.0,
      created_at: new Date().toISOString().split("T")[0]
    };

    setCampaigns([newCamp, ...campaigns]);
    setIsCreatingCampaign(false);
    
    const prevName = newCampName;
    setNewCampName("");
    setNewCampContent("");
    setNewCampSchedule("");

    triggerNotification(`WhatsApp Promotion Campaign "${prevName}" created successfully.`);

    try {
      await api.post("/api/v1/marketing/campaigns", {
        name: newCamp.name,
        content: newCamp.content,
        target_segment: newCamp.target_segment,
        scheduled_at: newCampSchedule || null
      });
      fetchMarketingData();
    } catch (err) {
      console.log(err);
    }
  };

  const handleInstantDispatchCampaign = async (id: string) => {
    // Modify campaign status on frontend locally
    setCampaigns(campaigns.map(c => c.id === id ? {
      ...c,
      status: "Completed",
      sent_count: 154,
      open_rate: 0.91,
      click_rate: 0.44,
      conversion_rate: 0.12,
      revenue_generated: 16800.0,
      scheduled_at: new Date().toISOString().replace('T', ' ').substring(0, 16)
    } : c));

    triggerNotification("Broadcasting campaign instantly to target WhatsApp recipients!");

    try {
      await api.post(`/api/v1/marketing/campaigns/${id}/send`);
      fetchMarketingData();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="space-y-8 text-left">
      
      {/* HEADER ROW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-indigo-400 stroke-[1.8]" />
            Marketing Automation Center
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Build broadcasts, design WhatsApp discount templates, target custom user cohorts, and track conversion conversions.
          </p>
        </div>

        <button
          onClick={() => setIsCreatingCampaign(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow transition-all cursor-pointer flex items-center gap-1"
        >
          <Plus className="w-4 h-4 stroke-[2.3]" /> Create Campaign
        </button>
      </div>

      {/* SEGMENT ROI METRIC CARD GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        <div className="bg-[#0e0e11] border border-white/[0.06] p-4 rounded-2xl">
          <span className="text-[10px] uppercase font-black tracking-widest text-[#9CA3AF]">
            Revenue Generated
          </span>
          <p className="text-xl font-black text-emerald-400 mt-1">
            ₹{analytics.totalRevenueMarketing.toLocaleString()}
          </p>
          <span className="text-[9px] text-[#A1A1AA]">Direct marketing attribution</span>
        </div>

        <div className="bg-[#0e0e11] border border-white/[0.06] p-4 rounded-2xl">
          <span className="text-[10px] uppercase font-black tracking-widest text-[#9CA3AF]">
            WhatsApp Open Rate
          </span>
          <p className="text-xl font-black text-white mt-1">
            {Math.round(analytics.overallOpenRate * 100)}%
          </p>
          <span className="text-[9px] text-green-400">Industry leading benchmark</span>
        </div>

        <div className="bg-[#0e0e11] border border-white/[0.06] p-4 rounded-2xl">
          <span className="text-[10px] uppercase font-black tracking-widest text-[#9CA3AF]">
            Avg Click Through
          </span>
          <p className="text-xl font-black text-white mt-1">
            {Math.round(analytics.overallClickRate * 100)}%
          </p>
          <span className="text-[9px] text-neutral-400">Call-to-Action button clickers</span>
        </div>

        <div className="bg-[#0e0e11] border border-white/[0.06] p-4 rounded-2xl">
          <span className="text-[10px] uppercase font-black tracking-widest text-[#9CA3AF]">
            Conversion Ratio
          </span>
          <p className="text-xl font-black text-indigo-400 mt-1">
            {Math.round(analytics.overallConversionRate * 100)}%
          </p>
          <span className="text-[9px] text-green-400 mt-0.5">Checked out orders</span>
        </div>

        <div className="bg-[#0e0e11] border border-white/[0.06] p-4 rounded-2xl col-span-2 lg:col-span-1">
          <span className="text-[10px] uppercase font-black tracking-widest text-[#9CA3AF]">
            Total Campaigns
          </span>
          <p className="text-xl font-black text-white mt-1">
            {campaigns.length} Active
          </p>
          <span className="text-[9px] text-neutral-400">Executed & Scheduled</span>
        </div>

      </div>

      {/* CAMPAIGNS MONITOR SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* DIRECTORY LISTING LEFT */}
        <div className="lg:col-span-5 bg-[#0C0C0E] border border-white/[0.08] rounded-3xl p-5 space-y-4">
          <span className="text-[10px] uppercase font-black text-neutral-400 tracking-wider block border-b border-white/[0.08] pb-2">
            Promotion Campaigns
          </span>

          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {campaigns.map((c) => {
              const isSelected = c.id === selectedCampaignId;
              const isComp = c.status === "Completed";
              const isSched = c.status === "Scheduled";

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCampaignId(c.id)}
                  className={`p-4 rounded-2xl border text-left cursor-pointer transition-all space-y-3 ${
                    isSelected 
                      ? "bg-white/[0.05] border-indigo-500" 
                      : "bg-black/[0.1] border-white/[0.04] hover:bg-white/[0.01]"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="text-xs font-black text-white leading-tight">{c.name}</h4>
                      <p className="text-[10.5px] text-neutral-400 mt-1">Cohort: {c.target_segment}</p>
                    </div>

                    <span className={`px-2 py-0.5 text-[8.5px] font-black uppercase text-center tracking-wider rounded ${
                      isComp ? "bg-green-500/10 text-green-400" :
                      isSched ? "bg-blue-500/10 text-blue-400" :
                      "bg-neutral-500/10 text-neutral-400"
                    }`}>
                      {c.status}
                    </span>
                  </div>

                  {isComp ? (
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.04] text-center text-xs">
                      <div>
                        <span className="text-[10px] text-neutral-500 block">Sent</span>
                        <strong className="text-white font-mono">{c.sent_count}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-500 block">Open%</span>
                        <strong className="text-indigo-400 font-mono">{Math.round(c.open_rate * 100)}%</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-500 block">Revenue</span>
                        <strong className="text-emerald-400 font-mono">₹{c.revenue_generated.toLocaleString()}</strong>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2 text-[10px] text-indigo-400 font-bold flex items-center gap-1 border-t border-white/[0.04]">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{c.scheduled_at ? `Scheduled for ${c.scheduled_at}` : "Draft Campaign"}</span>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>

        {/* CAMPAIGN METRICS DETAILS RIGHT */}
        <div className="lg:col-span-7 bg-[#0C0C0E] border border-white/[0.08] rounded-3xl p-6 space-y-6">
          {activeCamp ? (
            <div className="space-y-6 text-left">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
                <div className="space-y-1">
                  <span className="text-[9.5px] uppercase font-black tracking-widest text-[#9CA3AF]">Selected Campaign details</span>
                  <h3 className="text-base font-black text-white">{activeCamp.name}</h3>
                </div>

                {activeCamp.status !== "Completed" && (
                  <button
                    onClick={() => handleInstantDispatchCampaign(activeCamp.id)}
                    className="px-4 py-1.5 bg-white hover:bg-neutral-200 text-black font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow active:scale-97"
                  >
                    <Send className="w-3.5 h-3.5" /> Send Instantly Now
                  </button>
                )}
              </div>

              {/* Message content display bubble */}
              <div className="space-y-2 bg-[#09090b] border border-white/[0.04] p-5 rounded-2xl relative overflow-hidden">
                <span className="text-[9.5px] uppercase font-black text-indigo-400 tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> WhatsApp Message Copy Template
                </span>
                <p className="text-xs text-neutral-200 leading-relaxed font-sans max-w-xl">
                  {activeCamp.content}
                </p>
                <div className="text-[10px] text-[#A1A1AA] pt-2 border-t border-white/[0.04]">
                  Target Audience Segment: <strong className="text-white uppercase">{activeCamp.target_segment}</strong> Recipients list.
                </div>
              </div>

              {activeCamp.status === "Completed" ? (
                <div className="space-y-6">
                  
                  {/* Performance charts representation */}
                  <div className="space-y-3">
                    <span className="text-[10px] uppercase font-black text-neutral-400 tracking-wider">Campaign Conversion rates</span>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      {/* Open Rate Meter */}
                      <div className="p-4 bg-black border border-white/[0.04] rounded-2xl flex flex-col justify-between h-24">
                        <span className="text-[10px] text-neutral-400">Open Rate</span>
                        <div className="flex justify-between items-end mt-1">
                          <p className="text-2xl font-black text-indigo-400">{Math.round(activeCamp.open_rate * 100)}%</p>
                          <span className="text-[10px] text-indigo-400/80 font-mono">Industry benchmarks: 86%</span>
                        </div>
                      </div>

                      {/* Click rate */}
                      <div className="p-4 bg-black border border-white/[0.04] rounded-2xl flex flex-col justify-between h-24">
                        <span className="text-[10px] text-neutral-400">Call-To-Action Click Rate</span>
                        <div className="flex justify-between items-end mt-1">
                          <p className="text-2xl font-black text-indigo-400">{Math.round(activeCamp.click_rate * 100)}%</p>
                          <span className="text-[10px] text-[#A1A1AA] font-mono">Total CTAs clicked</span>
                        </div>
                      </div>

                      {/* Conversion rate */}
                      <div className="p-4 bg-black border border-white/[0.04] rounded-2xl flex flex-col justify-between h-24">
                        <span className="text-[10px] text-neutral-400">Checkout Conversion Rate</span>
                        <div className="flex justify-between items-end mt-1">
                          <p className="text-2xl font-black text-emerald-400">{Math.round(activeCamp.conversion_rate * 100)}%</p>
                          <span className="text-[10px] text-emerald-400/70 font-mono">Revenue generated</span>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* BROADCAST LOGS DIALOG LIST */}
                  <div className="space-y-3">
                    <span className="text-[10px] uppercase font-black text-neutral-400 tracking-wider block">
                      Broadcast Dispatch Status logs
                    </span>

                    <div className="border border-white/[0.05] rounded-2xl bg-black/[0.2] overflow-hidden">
                      <table className="w-full text-xs text-left text-neutral-200">
                        <thead className="bg-[#111113] text-[10px] font-black uppercase text-neutral-400 border-b border-white/[0.04]">
                          <tr>
                            <th className="px-4 py-3">Recipient Name</th>
                            <th className="px-4 py-3">Phone</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Dispatched Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                          {broadcasts.map((b, idx) => (
                            <tr key={idx} className="hover:bg-white/[0.01]">
                              <td className="px-4 py-3 font-bold text-white">{b.recipient_name || "New Lead"}</td>
                              <td className="px-4 py-3 font-mono text-neutral-400">{b.recipient_phone}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded ${
                                  b.status === "Converted" ? "bg-green-500/10 text-green-400" :
                                  b.status === "Clicked" ? "bg-indigo-500/10 text-indigo-400" :
                                  "bg-blue-500/10 text-blue-400"
                                }`}>
                                  {b.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-mono text-neutral-500">{b.sent_at}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="p-10 border border-white/[0.05] rounded-2xl bg-[#09090b] text-center space-y-2">
                  <p className="text-xs text-[#9CA3AF]">
                    This campaign is scheduled for broadcast and is waiting to trigger automatically.
                  </p>
                  <p className="text-[10.5px] text-neutral-500">
                    You can broadcast this promotion list immediately to customer segments by clicking "Send Instantly Now".
                  </p>
                </div>
              )}

            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-xs text-[#9CA3AF]">No campaign found.</p>
            </div>
          )}
        </div>

      </div>

      {/* CREATE NEW PROMO CAMPAIGN MODAL OVERLAY */}
      {isCreatingCampaign && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateCampaignSubmit} className="bg-[#0C0C0E] border border-neutral-800 rounded-3xl p-6 max-w-lg w-full space-y-4 text-left shadow-2xl">
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider font-sans">
                Create WhatsApp Broadcast Promotion
              </h4>
              <p className="text-xs text-neutral-400 mt-1">Design message drafts to send directly to your filtered customer cohorts.</p>
            </div>

            <div className="space-y-3.5 text-xs text-neutral-300">
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300">Campaign Title:</label>
                <input
                  type="text"
                  placeholder="e.g. Festival Biker Jacket Launch Promo"
                  value={newCampName}
                  onChange={(e) => setNewCampName(e.target.value)}
                  className="w-full bg-black border border-white/[0.08] focus:border-indigo-500/50 rounded-xl py-2 px-3 text-xs text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#D1D5DB]">Target Customer Cohort:</label>
                  <select
                    value={newCampSegment}
                    onChange={(e) => setNewCampSegment(e.target.value)}
                    className="w-full bg-black border border-white/[0.08] text-white focus:border-indigo-500/50 rounded-xl py-2.5 px-3 focus:outline-none text-xs"
                  >
                    <option value="All">All Registered Contacts</option>
                    <option value="VIP">VIP Tier Customers</option>
                    <option value="Returning Customer">Returning Customers</option>
                    <option value="High Value Customer">High Value Customers</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#D1D5DB]">Delayed dispatch (optional):</label>
                  <input
                    type="datetime-local"
                    value={newCampSchedule}
                    onChange={(e) => setNewCampSchedule(e.target.value)}
                    className="w-full bg-black border border-white/[0.08] rounded-xl py-1.5 px-3 text-xs text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300">WhatsApp Template Message Body:</label>
                <textarea
                  rows={4}
                  placeholder="Type promotion copy here. You can include links or checkout URLs."
                  value={newCampContent}
                  onChange={(e) => setNewCampContent(e.target.value)}
                  className="w-full bg-black border border-white/[0.08] rounded-xl py-2 px-3 text-xs text-white leading-relaxed"
                  required
                />
              </div>

            </div>

            <div className="flex justify-end gap-3.5 pt-2">
              <button
                type="button"
                onClick={() => setIsCreatingCampaign(false)}
                className="px-4 py-2 text-xs bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.08] text-neutral-300 font-extrabold rounded-xl cursor-pointer"
              >
                Cancel Draft
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl cursor-pointer"
              >
                Save Draft
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
