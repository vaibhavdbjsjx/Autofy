import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Shield,
  Activity,
  Users,
  Database,
  Terminal,
  Server,
  Cpu,
  AlertOctagon,
  RefreshCw,
  Trash2,
  Lock,
  DollarSign,
  Briefcase,
  Layers,
  FileCheck,
  CheckCircle,
  HelpCircle
} from "lucide-react";

export const SuperAdminDashboardTab: React.FC = () => {
  // Platform Businesses State — starts empty for clean production view
  const [businesses, setBusinesses] = useState<Array<{ id: string; name: string; owner: string; plan: string; status: string; usage: string; rev: string; created: string }>>([]);

  // System Monitor Status Toggles
  const [dbStatus, setDbStatus] = useState<"Healthy" | "Degraded">("Healthy");
  const [apiStatus, setApiStatus] = useState<"Online" | "Maintenance">("Online");
  const [whatsappStatus, setWhatsappStatus] = useState<"Connected" | "Error">("Connected");
  const [geminiStatus, setGeminiStatus] = useState<"Active" | "Delayed">("Active");
  const [gatewayStatus, setGatewayStatus] = useState<"Active" | "Offline">("Active");

  // Admin Logs — starts empty
  const [logs, setLogs] = useState<Array<{ time: string; type: string; text: string }>>([]);

  // Active Admin Actions Tabs & Modals
  const [selectedSubTab, setSelectedSubTab] = useState<"businesses" | "monitoring" | "revenue" | "logs">("businesses");

  const toggleBusinessStatus = (id: string) => {
    setBusinesses(prev => prev.map(biz => {
      if (biz.id === id) {
        const nextStatus = biz.status === "Active" ? "Suspended" : "Active";
        // log change
        const newLog = {
          time: new Date().toTimeString().split(" ")[0],
          type: "Action",
          text: `Business '${biz.name}' status toggled to '${nextStatus}'`
        };
        setLogs([newLog, ...logs]);
        return { ...biz, status: nextStatus };
      }
      return biz;
    }));
  };

  const deleteBusiness = (id: string, name: string) => {
    if (!window.confirm(`Are you absolutely sure you want to permanently delete platform client ${name}?`)) return;
    setBusinesses(prev => prev.filter(b => b.id !== id));
    setLogs([
      {
        time: new Date().toTimeString().split(" ")[0],
        type: "Destructive",
        text: `Permanently deleted business '${name}' (#${id}) from database cluster.`
      },
      ...logs
    ]);
  };

  const forceUpgradePlan = (id: string, plan: string) => {
    setBusinesses(prev => prev.map(b => b.id === id ? { ...b, plan } : b));
    alert(`Successfully modified billing plan mapping to ${plan}`);
  };

  return (
    <div id="super-admin-view" className="space-y-8 animate-fade-in text-[var(--text)]">
      
      {/* Header section with luxury dark/grey styling */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[var(--border)] pb-6 gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-subtle)] font-sans">Platform Central Console</span>
          <h1 className="text-3xl font-extrabold text-[var(--text)] tracking-tight mt-1">Super Admin Dashboard</h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">Master operational, data, telemetry, billing, and system metrics across all registered clients.</p>
        </div>

        {/* Top Control Options */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              alert("Telemetry cache cleared. Re-pinging all Cloud clusters...");
              setLogs([
                { time: new Date().toTimeString().split(" ")[0], type: "Ping", text: "Successfully issued diagnostic cluster ping." },
                ...logs
              ]);
            }}
            className="px-4 py-2 bg-white/[0.04] hover:bg-white/[0.1] border border-[var(--border)] rounded-xl text-xs font-bold text-[var(--text)] flex items-center gap-2 transition-all"
          >
            <RefreshCw className="w-4 h-4" /> Hard Refresh Cluster
          </button>
        </div>
      </div>

      {/* Primary Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white/[0.03] border border-[var(--border)] space-y-2">
          <div className="flex justify-between items-center text-[var(--text-muted)]">
            <span className="text-[10.5px] font-bold uppercase tracking-wider">Total Businesses</span>
            <Briefcase className="w-4 h-4 text-[var(--text-subtle)]" />
          </div>
          <p className="text-2xl font-black text-[var(--text)]">{businesses.length + 8}</p>
          <span className="text-[10px] text-green-400 font-bold">+12% growth rate</span>
        </div>

        <div className="p-5 rounded-2xl bg-white/[0.03] border border-[var(--border)] space-y-2">
          <div className="flex justify-between items-center text-[var(--text-muted)]">
            <span className="text-[10.5px] font-bold uppercase tracking-wider">Active Tenants</span>
            <CheckCircle className="w-4 h-4 text-[var(--text-subtle)]" />
          </div>
          <p className="text-2xl font-black text-[var(--text)]">{businesses.filter(b => b.status === "Active").length + 7}</p>
          <span className="text-[10px] text-[var(--text-subtle)] font-mono">1 Suspended Client</span>
        </div>

        <div className="p-5 rounded-2xl bg-white/[0.03] border border-[var(--border)] space-y-2">
          <div className="flex justify-between items-center text-[var(--text-muted)]">
            <span className="text-[10.5px] font-bold uppercase tracking-wider">Monthly Revenue</span>
            <DollarSign className="w-4 h-4 text-[var(--text-subtle)]" />
          </div>
          <p className="text-2xl font-black text-[var(--text)]">₹2,84,000</p>
          <span className="text-[10px] text-green-400 font-bold">+24% MRR Expansion</span>
        </div>

        <div className="p-5 rounded-2xl bg-white/[0.03] border border-[var(--border)] space-y-2">
          <div className="flex justify-between items-center text-[var(--text-muted)]">
            <span className="text-[10.5px] font-bold uppercase tracking-wider">Gemini Prompt Usage</span>
            <Activity className="w-4 h-4 text-[var(--text-subtle)]" />
          </div>
          <p className="text-2xl font-black text-[var(--text)]">1,42,850</p>
          <span className="text-[10px] text-[var(--text-subtle)] font-mono">Success rate 99.82%</span>
        </div>
      </div>

      {/* Platform Health and Quick System Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl bg-white/[0.02]/80 border border-[var(--border)] flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="block text-[9.5px] text-[var(--text-subtle)] uppercase font-black">Database Cluster</span>
            <div className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${dbStatus === "Healthy" ? "bg-green-500" : "bg-yellow-500"}`} />
              {dbStatus}
            </div>
          </div>
          <button onClick={() => setDbStatus(d => d === "Healthy" ? "Degraded" : "Healthy")} className="text-[9px] text-[var(--text-subtle)] hover:text-[var(--text)] uppercase font-bold">Toggle</button>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.02]/80 border border-[var(--border)] flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="block text-[9.5px] text-[var(--text-subtle)] uppercase font-black">API Router Gateway</span>
            <div className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${apiStatus === "Online" ? "bg-green-500" : "bg-red-500"}`} />
              {apiStatus}
            </div>
          </div>
          <button onClick={() => setApiStatus(a => a === "Online" ? "Maintenance" : "Online")} className="text-[9px] text-[var(--text-subtle)] hover:text-[var(--text)] uppercase font-bold">Toggle</button>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.02]/80 border border-[var(--border)] flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="block text-[9.5px] text-[var(--text-subtle)] uppercase font-black">WhatsApp Webhook</span>
            <div className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${whatsappStatus === "Connected" ? "bg-green-500" : "bg-red-500"}`} />
              {whatsappStatus}
            </div>
          </div>
          <button onClick={() => setWhatsappStatus(w => w === "Connected" ? "Error" : "Connected")} className="text-[9px] text-[var(--text-subtle)] hover:text-[var(--text)] uppercase font-bold">Toggle</button>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.02]/80 border border-[var(--border)] flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="block text-[9.5px] text-[var(--text-subtle)] uppercase font-black">Gemini 3.5 Engine</span>
            <div className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${geminiStatus === "Active" ? "bg-green-500" : "bg-yellow-500"}`} />
              {geminiStatus}
            </div>
          </div>
          <button onClick={() => setGeminiStatus(g => g === "Active" ? "Delayed" : "Active")} className="text-[9px] text-[var(--text-subtle)] hover:text-[var(--text)] uppercase font-bold">Toggle</button>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.02]/80 border border-[var(--border)] flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="block text-[9.5px] text-[var(--text-subtle)] uppercase font-black">Razorpay Linker</span>
            <div className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${gatewayStatus === "Active" ? "bg-green-500" : "bg-red-500"}`} />
              {gatewayStatus}
            </div>
          </div>
          <button onClick={() => setGatewayStatus(gw => gw === "Active" ? "Offline" : "Active")} className="text-[9px] text-[var(--text-subtle)] hover:text-[var(--text)] uppercase font-bold">Toggle</button>
        </div>
      </div>

      {/* Tab Switching Menu */}
      <div className="flex gap-2 border-b border-[var(--border)] pb-1">
        {[
          { id: "businesses", label: "Registered Businesses", count: businesses.length },
          { id: "logs", label: "Operational Logs Feed", count: logs.length },
          { id: "monitoring", label: "Server Metrics", count: null },
          { id: "revenue", label: "Revenue Diagnostics", count: null }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedSubTab(tab.id as any)}
            className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
              selectedSubTab === tab.id 
                ? "border-white text-[var(--text)]" 
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            {tab.label} {tab.count !== null && <span className="ml-1.5 bg-white/[0.08] px-1.5 py-0.5 rounded text-[10px]">{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* Main Tab Rendering Block */}
      <div className="space-y-6">

        {selectedSubTab === "businesses" && (
          <div className="p-6 rounded-2xl bg-white/[0.04] border border-[var(--border)] backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider">Multi-Tenant Business Registry</h3>
              <p className="text-xs text-[var(--text-subtle)] font-mono">Viewing 1-4 of {businesses.length} database entries</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--text-subtle)] uppercase tracking-widest text-[9.5px]">
                    <th className="py-3 px-2">Business Name & Owner</th>
                    <th className="py-3 px-2">Billing Plan</th>
                    <th className="py-3 px-2">Created On</th>
                    <th className="py-3 px-2">Vite API Status</th>
                    <th className="py-3 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {businesses.map((biz) => (
                    <tr key={biz.id} className="hover:bg-white/[0.02] transition-all">
                      <td className="py-4 px-2">
                        <p className="font-extrabold text-[var(--text)] text-xs">{biz.name}</p>
                        <p className="text-[10px] text-[var(--text-subtle)] font-sans">Owner: {biz.owner} • ID: {biz.id}</p>
                      </td>
                      <td className="py-4 px-2 space-y-1">
                        <span className="px-2 py-0.5 bg-white/[0.06] border border-[var(--border)] rounded text-[9.5px] font-bold text-[var(--text)]">{biz.plan}</span>
                        <div className="flex gap-1.5 pt-1">
                          <button onClick={() => forceUpgradePlan(biz.id, "Enterprise")} className="text-[9px] text-[#A3A3A3] hover:underline">Enterprise</button>
                          <span className="text-[9px] text-[var(--text-subtle)]">|</span>
                          <button onClick={() => forceUpgradePlan(biz.id, "Professional")} className="text-[9px] text-[#A3A3A3] hover:underline">Professional</button>
                        </div>
                      </td>
                      <td className="py-4 px-2 font-mono text-[var(--text-muted)]">{biz.created}</td>
                      <td className="py-4 px-2">
                        <span className={`inline-block w-2.5 h-2.5 rounded-full mr-1 ${biz.status === "Active" ? "bg-green-500" : "bg-red-500"}`} />
                        <span className="text-[var(--text)] font-semibold">{biz.status}</span>
                      </td>
                      <td className="py-4 px-2 text-right space-x-1">
                        <button 
                          onClick={() => toggleBusinessStatus(biz.id)} 
                          className="px-2 rounded py-1 text-[10px] font-bold bg-white/[0.06] hover:bg-white/[0.1] text-[var(--text)] border border-[var(--border)]"
                        >
                          {biz.status === "Active" ? "Suspend" : "Activate"}
                        </button>
                        <button 
                          onClick={() => deleteBusiness(biz.id, biz.name)}
                          className="p-1 px-2.5 rounded bg-transparent hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400 border border-transparent hover:border-red-500/20"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedSubTab === "logs" && (
          <div className="p-6 rounded-2xl bg-white/[0.04] border border-[var(--border)] backdrop-blur-md space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[var(--text-muted)]" />
                <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider">Superuser System Logs</h3>
              </div>
              <button 
                onClick={() => setLogs([])}
                className="text-[10px] font-bold text-[var(--text-muted)] hover:text-[var(--text)] uppercase tracking-wider"
              >
                Clear Log List
              </button>
            </div>

            <div className="bg-[#050505] p-4 rounded-xl border border-[var(--border)] font-mono text-[11px] leading-relaxed space-y-2 p-4 h-[300px] overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="flex gap-4">
                  <span className="text-[var(--text-subtle)] shrink-0">[{log.time}]</span>
                  <span className={`font-bold shrink-0 ${
                    log.type === "Security" ? "text-red-400" :
                    log.type === "Billing" ? "text-green-400" :
                    log.type === "Destructive" ? "text-yellow-500" : "text-blue-400"
                  }`}>
                    {log.type.toUpperCase()}:
                  </span>
                  <span className="text-[var(--text)]">{log.text}</span>
                </div>
              ))}
              {logs.length === 0 && <p className="text-[var(--text-subtle)] text-center py-12">No event listings detected currently.</p>}
            </div>
          </div>
        )}

        {selectedSubTab === "monitoring" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="p-6 rounded-2xl bg-white/[0.04] border border-[var(--border)] backdrop-blur-md space-y-4">
              <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider">Storage & Hardware Telemetry</h3>
              <div className="space-y-4 font-sans text-xs">
                
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[var(--text-muted)]">Memory Core Allocation</span>
                    <span className="font-mono text-[var(--text)]">4.12 GB / 8.00 GB (51.5%)</span>
                  </div>
                  <div className="w-full bg-white/[0.08] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[var(--text-muted)] h-full w-[51.5%]" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[var(--text-muted)]">Database Block-Level Access Volume</span>
                    <span className="font-mono text-[var(--text)]">480 IOPs (Normal)</span>
                  </div>
                  <div className="w-full bg-white/[0.08] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[var(--text-subtle)] h-full w-[35%]" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[var(--text-muted)]">Docker Node CPU Throttle</span>
                    <span className="font-mono text-[var(--text)]">12% Peak Hold</span>
                  </div>
                  <div className="w-full bg-white/[0.08] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[var(--text)] h-full w-[12%]" />
                  </div>
                </div>

              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.04] border border-[var(--border)] backdrop-blur-md space-y-4">
              <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider">Platform Operations Control</h3>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => alert("Cluster backup manual snapshot initiated.")} className="py-3 bg-white/[0.04] hover:bg-white/[0.1] border border-[var(--border)] rounded-xl text-xs font-bold text-[var(--text)] text-center">
                  Backup Storage Nodes
                </button>
                <button onClick={() => alert("Rebooting nginx routing reverse proxies...")} className="py-3 bg-white/[0.04] hover:bg-white/[0.1] border border-[var(--border)] rounded-xl text-xs font-bold text-[var(--text)] text-center">
                  Reboot Proxy Layer
                </button>
                <button onClick={() => alert("Purged CDN cache globally.")} className="py-3 bg-white/[0.04] hover:bg-white/[0.1] border border-[var(--border)] rounded-xl text-xs font-bold text-[var(--text)] text-center">
                  Purge Cloud CDN
                </button>
                <button onClick={() => alert("Triggered SSL handshake re-negotiation of domains")} className="py-3 bg-white/[0.04] hover:bg-white/[0.1] border border-[var(--border)] rounded-xl text-xs font-bold text-[var(--text)] text-center">
                  Renew SSL Bindings
                </button>
              </div>
            </div>

          </div>
        )}

        {selectedSubTab === "revenue" && (
          <div className="p-6 rounded-2xl bg-white/[0.04] border border-[var(--border)] backdrop-blur-md space-y-4">
            <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider">Historical Subscriptions Stream</h3>
            <div className="space-y-3 text-xs">
              {[
                { date: "Today 10:48 AM", tenant: "Supreme Athletics Team", event: "Standard Subscription Renew", amount: "+₹18,000" },
                { date: "Yesterday, 3:14 PM", tenant: "AEW Motors India", event: "Professional Plan Upgrade", amount: "+₹12,000" },
                { date: "June 11, 2026", tenant: "Aparna Yoga Shala", event: "Starter Plan Signup Setup", amount: "+₹5,000" }
              ].map((billingEvent, idx) => (
                <div key={idx} className="p-4 bg-white/[0.01] border border-[var(--border)] rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-extrabold text-[var(--text)] text-xs">{billingEvent.tenant}</p>
                    <p className="text-[10px] text-[var(--text-subtle)] text-[var(--text-subtle)]">{billingEvent.event} • {billingEvent.date}</p>
                  </div>
                  <span className="font-mono text-sm font-black text-[var(--text)]">{billingEvent.amount}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
