import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Terminal,
  Activity,
  Layers,
  Database,
  CloudLightning,
  RefreshCw,
  Plus,
  Trash2,
  Lock,
  Globe,
  Settings,
  Shield,
  FileCheck,
  Server,
  Play,
  ArrowRight,
  Clipboard,
  Cpu
} from "lucide-react";

interface EnvVar {
  key: string;
  value: string;
  category: "API" | "Database" | "Storage" | "Third-Party";
}

interface Backup {
  id: string;
  name: string;
  date: string;
  size: string;
  status: "Stored" | "Restoring" | "Reverted";
}

export const DeploymentSetupTab: React.FC = () => {
  // Env States
  const [activeEnv, setActiveEnv] = useState<"Development" | "Staging" | "Production">("Production");
  
  // Environment variables state
  const [envVars, setEnvVars] = useState<EnvVar[]>([
    { key: "GEMINI_API_KEY", value: "AIzaSyAz************33dfad", category: "API" },
    { key: "WHATSAPP_PHONE_REVERBERATOR", value: "+91 90022 34125", category: "Third-Party" },
    { key: "DB_WRITE_ENDPOINT", value: "postgresql://postgres:root-prod-cluster-99@102.22.42.11/db", category: "Database" },
    { key: "STORAGE_BUCKET_ID", value: "autoflow-prod-bucket-772a", category: "Storage" },
    { key: "RAZORPAY_SECRET_ID", value: "rzp_live_xxxxxxxxxxxxx", category: "Third-Party" }
  ]);
  
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newCat, setNewCat] = useState<"API" | "Database" | "Storage" | "Third-Party">("API");

  // Server metrics states
  const [appHealth, setAppHealth] = useState("Optimal");
  const [serverCpu, setServerCpu] = useState(24);
  const [serverRam, setServerRam] = useState(4.2);
  const [errorCount, setErrorCount] = useState(0);

  // Backup files states
  const [backups, setBackups] = useState<Backup[]>([
    { id: "b-1", name: "autoflow_prod_db_daily_snapshot_2026_06_19.sql", date: "Yesterday, 11:59 PM", size: "42.5 MB", status: "Stored" },
    { id: "b-2", name: "autoflow_prod_db_milestone_backup_v1.0.sql", date: "June 12, 2026", size: "38.2 MB", status: "Stored" }
  ]);
  const [autoBackups, setAutoBackups] = useState(true);

  // Live Terminal Logs state
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "[SYSTEM] Starting compilation engine under NODE_ENV=production...",
    "[BUNDLER] Compiled index.html and main.tsx to static 'dist/' output (2.4 MB total)",
    "[ESBUILD] Bundled server.ts to dist/server.cjs (native ESM-CJS conversion)",
    "[DOCKER] Building container layers - utilizing cached Alpine Node.js 18 parent node...",
    "[SERVER] Listening on port 3000, binding to global host '0.0.0.0' for ingress proxies.",
    "[DB] Connected to PostgreSQL cloud-sql-instance (latency: 3ms, active connections: 24)",
    "[TELEMETRY] SSL certificate verification handshake successful (expiring in 89 days).",
    "[WEBHOOK] Listening on endpoint /api/whatsapp-webhook..."
  ]);

  // DNS records CNAME settings
  const [domainPointer, setDomainPointer] = useState("app.autofy.in");
  const [sslConnected, setSslConnected] = useState(true);

  // Markdown Doc generation selections
  const [targetCloud, setTargetCloud] = useState<"Vercel" | "AWS" | "GCP">("GCP");
  
  const addEnvVar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;
    setEnvVars([...envVars, { key: newKey.toUpperCase().trim(), value: newValue.trim(), category: newCat }]);
    
    // Append to logs
    setTerminalLogs(prev => [
      ...prev,
      `[CONFIG] Added environment variable key '${newKey.toUpperCase()}' under category '${newCat}'`
    ]);

    setNewKey("");
    setNewValue("");
  };

  const deleteEnvVar = (keyword: string) => {
    setEnvVars(envVars.filter(ev => ev.key !== keyword));
    setTerminalLogs(prev => [
      ...prev,
      `[CONFIG] Purged environment variable key '${keyword}' permanently from config memory.`
    ]);
  };

  const triggerManualBackup = () => {
    const bId = "b-" + Date.now();
    const mockBackupName = `autoflow_${activeEnv.toLowerCase()}_db_manual_${new Date().toISOString().slice(0,10).replace(/-/g, '_')}_${Date.now().toString().slice(-4)}.sql`;
    const newBak: Backup = {
      id: bId,
      name: mockBackupName,
      date: "Just Now",
      size: "41.2 MB",
      status: "Stored"
    };
    setBackups([newBak, ...backups]);
    setTerminalLogs(prev => [
      ...prev,
      `[BACKUP] Initiated cold snapshot replication on metadata cluster. Written: ${mockBackupName}`
    ]);
    alert("Manual SQL Database backup snapshot stored in vault.");
  };

  const triggerRestore = (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to restore metadata to state: ${name}? Active connections will temporarily decouple for 1s.`)) return;
    
    setBackups(prev => prev.map(b => b.id === id ? { ...b, status: "Restoring" } : b));
    setTerminalLogs(prev => [
      ...prev,
      `[DB-RESTORE] Initializing partition decoupling for restore snapshot '${name}'`,
      `[DB-RESTORE] Reconnecting cluster sockets... Success`
    ]);

    setTimeout(() => {
      setBackups(prev => prev.map(b => b.id === id ? { ...b, status: "Reverted" } : b));
      alert(`Database successfully restored to backup checkpoint: ${name}`);
    }, 1200);
  };

  const handleTriggerRebuild = () => {
    setTerminalLogs(prev => [
      ...prev,
      `[BUILD] Manual trigger caught. Pulling master repository HEAD...`,
      `[BUILD] Vite production compiling... Completed static assets bundling successfully.`,
      `[SERVER] Server hot-reloaded to revision commit hash: autoflow-v1.0.${Math.floor(100 + Math.random() * 900)}`
    ]);
    alert("Production application container rebuild pipeline triggered.");
  };

  // Generate guide MD helper
  const renderDocsCode = () => {
    if (targetCloud === "GCP") {
      return `# GCP Cloud Run & Kubernetes Deployment Script
# Generated automatically for Active Env: ${activeEnv}

# Step 1: Push built assets to Artifact Registry
gcloud auth configure-docker asia-east1-docker.pkg.dev
docker build -t asia-east1-docker.pkg.dev/autoflow/prod/applet:latest .
docker push asia-east1-docker.pkg.dev/autoflow/prod/applet:latest

# Step 2: Deploy to Google Cloud Run
gcloud run deploy autoflow-service \\
  --image=asia-east1-docker.pkg.dev/autoflow/prod/applet:latest \\
  --platform=managed \\
  --region=asia-east1 \\
  --allow-unauthenticated \\
  --port=3000 \\
  --set-env-vars="NODE_ENV=production,GEMINI_API_KEY=${envVars.find(e => e.key === "GEMINI_API_KEY")?.value || "INSERT_HE_"}"`;
    } else if (targetCloud === "AWS") {
      return `# AWS ECS & Fargate Deployment Commands
# Generated automatically for Active Env: ${activeEnv}

# Step 1: Authenticate to ECR and Deploy
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 91720404.ecr.aws
docker tag autoflow-app:latest 91720404.ecr.aws/autoflow:prod-latest
docker push 91720404.ecr.aws/autoflow:prod-latest

# Step 2: Force New Deployment in ECS Task Definition
aws ecs update-service --cluster autoflow-production --service autoflow-web-service --force-new-deployment`;
    } else {
      return `# Vercel Serverless Configurations
# Generated automatically for Active Env: ${activeEnv}

# vercel.json file setup
{
  "version": 2,
  "builds": [
    { "src": "server.ts", "use": "@vercel/node" },
    { "src": "dist/**", "use": "@vercel/static" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "server.ts" },
    { "src": "/(.*)", "dest": "dist/index.html" }
  ]
}`;
    }
  };

  return (
    <div id="deployment-setup-view" className="space-y-8 animate-fade-in text-[var(--text)]">
      
      {/* Header section with luxury dark/grey styling */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[var(--border)] pb-6 gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-subtle)] font-sans">SaaS Engineering Console</span>
          <h1 className="text-3xl font-extrabold text-[var(--text)] tracking-tight mt-1">Deployment & Environment Management</h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">Configure container environments, balance environment keys, trigger continuous builds, and verify security handshakes.</p>
        </div>

        {/* Environment Switcher buttons */}
        <div className="flex bg-white/[0.04] border border-[var(--border)] p-1 rounded-xl">
          {(["Development", "Staging", "Production"] as const).map(env => (
            <button
              key={env}
              onClick={() => {
                setActiveEnv(env);
                setTerminalLogs(p => [...p, `[ENV-ROUTER] Active client scope converted to '${env}' runtime environment profile.`]);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeEnv === env 
                  ? "bg-white text-black font-extrabold" 
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              {env}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid structure */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Primary Controls (Column 1 & 2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Environment Variables Management Block */}
          <div className="p-6 rounded-2xl bg-white/[0.04] border border-[var(--border)] backdrop-blur-md space-y-4">
            <div className="flex justify-between items-center mb-1">
              <div>
                <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[var(--text-muted)]" /> Environment Configuration Variables
                </h3>
                <p className="text-[10.5px] text-[var(--text-subtle)]">Access tokens and service variables scoped under '{activeEnv}'</p>
              </div>

              <span className="text-[9.5px] uppercase font-bold text-[#E5E7EB] bg-white/[0.08] border border-[var(--border)] px-2 py-0.5 rounded">
                Strict Secrets Lock
              </span>
            </div>

            {/* Configs List */}
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {envVars.map((ev, idx) => (
                <div key={idx} className="p-3 bg-white/[0.02] border border-[var(--border)] rounded-xl flex items-center justify-between hover:border-[var(--border)] transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-[var(--text)]">{ev.key}</span>
                      <span className="text-[9px] uppercase bg-white/[0.06] px-1.5 py-0.2 rounded text-[var(--text-muted)]">{ev.category}</span>
                    </div>
                    <p className="font-mono text-[10.5px] text-[var(--text-muted)] select-all">{ev.value}</p>
                  </div>
                  <button 
                    onClick={() => deleteEnvVar(ev.key)}
                    className="p-1 px-2 hover:bg-red-500/10 text-[var(--text-subtle)] hover:text-red-400 border border-transparent hover:border-red-500/20 rounded transition-all"
                    title="Purge Variable"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Config Form */}
            <form onSubmit={addEnvVar} className="p-4 bg-white/[0.01] border border-[var(--border)] rounded-xl space-y-3">
              <span className="block text-[10px] text-[var(--text-subtle)] uppercase font-black">Register New Token</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input 
                  type="text" 
                  placeholder="MY_SECRET_API_KEY"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  required
                  className="bg-[#101012] border border-[var(--border)] p-2 rounded-lg text-xs text-[var(--text)] focus:outline-none focus:border-[var(--border)]"
                />
                <input 
                  type="text" 
                  placeholder="a1s-773dfaad..."
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  required
                  className="bg-[#101012] border border-[var(--border)] p-2 rounded-lg text-xs text-[var(--text)] focus:outline-none focus:border-[var(--border)]"
                />
                <select
                  value={newCat}
                  onChange={(e: any) => setNewCat(e.target.value)}
                  className="bg-[#101012] border border-[var(--border)] p-2 rounded-lg text-xs text-[var(--text)] focus:outline-none"
                >
                  <option value="API">API Secret Key</option>
                  <option value="Database">Database Endpoint</option>
                  <option value="Storage">Storage Container</option>
                  <option value="Third-Party">Third-Party Gateway</option>
                </select>
              </div>
              <button 
                type="submit"
                className="w-full py-2 bg-white text-black font-extrabold text-xs rounded-xl hover:bg-[var(--text)] transition-colors"
              >
                Register Variable Endpoint
              </button>
            </form>
          </div>

          {/* Continuous Integration & Terminal Output Roll */}
          <div className="p-6 rounded-2xl bg-white/[0.04] border border-[var(--border)] backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[var(--text-muted)]" />
                <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider">Server Production Telemetry Logs</h3>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => setTerminalLogs([])}
                  className="text-[10px] uppercase font-bold text-[var(--text-subtle)] hover:text-[var(--text)]"
                >
                  Clear Console
                </button>
                <span className="text-[var(--text-subtle)]">•</span>
                <button 
                  onClick={handleTriggerRebuild}
                  className="text-[10px] uppercase font-extrabold text-[var(--text)] hover:underline"
                >
                  Trigger Hot-Rebuild
                </button>
              </div>
            </div>

            {/* Live Terminal Output */}
            <div className="bg-[#050505] p-4 rounded-xl border border-[var(--border)] h-[220px] overflow-y-auto font-mono text-[11px] leading-relaxed text-[var(--text-muted)] space-y-1.5 select-text p-4">
              {terminalLogs.map((logStr, idx) => (
                <div key={idx} className="flex gap-4">
                  <span className="text-[#6B7280] select-none">{(idx+1).toString().padStart(2, "0")}</span>
                  <span className="text-[var(--text)]">{logStr}</span>
                </div>
              ))}
              {terminalLogs.length === 0 && (
                <p className="text-center py-20 text-[var(--text-subtle)]">Administrative console is empty. Issue a diagnostic reboot.</p>
              )}
            </div>

            <p className="text-[10.5px] text-[var(--text-subtle)] leading-relaxed">Reverse proxy mappings route external URL traffic to port 3000 inside the isolated workspace Docker nodes.</p>
          </div>

          {/* Deployment Markdown Guidance Tool */}
          <div className="p-6 rounded-2xl bg-white/[0.04] border border-[var(--border)] backdrop-blur-md space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-[var(--border)]">
              <h3 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider">Manual Build Guides Generator</h3>
              <div className="flex gap-1 bg-white/[0.02] border border-[var(--border)] p-1 rounded-lg">
                {(["GCP", "AWS", "Vercel"] as const).map(cloud => (
                  <button 
                    key={cloud} 
                    onClick={() => setTargetCloud(cloud)}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded ${
                      targetCloud === cloud ? "bg-white text-black" : "text-[var(--text-muted)] hover:text-[var(--text)]"
                    }`}
                  >
                    {cloud}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#070708] border border-[var(--border)] p-4 rounded-xl relative select-all scrollbar-thin">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(renderDocsCode());
                  alert("Copied custom deployment bash instructions to clipboard!");
                }}
                className="absolute top-2 right-2 p-1.5 bg-white/[0.06] hover:bg-white/[0.15] border border-[var(--border)] rounded-md text-[10px] text-[var(--text)] transition-all flex items-center gap-1.5"
              >
                <Clipboard className="w-3.5 h-3.5" /> Copy Bash Instructions
              </button>
              <pre className="font-mono text-[10.5px] text-[var(--text)] leading-relaxed overflow-x-auto whitespace-pre">
                {renderDocsCode()}
              </pre>
            </div>
          </div>

        </div>

        {/* Sidebar Diagnostics Column (Column 3) */}
        <div className="space-y-6">

          {/* Container System Allocation Metrics */}
          <div className="p-6 rounded-2xl bg-white/[0.04] border border-[var(--border)] backdrop-blur-md space-y-4">
            <h3 className="text-xs font-black uppercase text-[var(--text)] tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4 text-[var(--text-muted)]" /> Live Container Metrics
            </h3>

            <div className="p-4 bg-white/[0.02] border border-[var(--border)] rounded-xl flex items-center gap-3.5 justify-between">
              <div className="space-y-0.5">
                <p className="text-[10px] text-[var(--text-subtle)] text-[var(--text-subtle)] uppercase font-black">Memory Allocation</p>
                <p className="text-md font-bold text-[var(--text)]">{serverRam} GB / 8 GB</p>
              </div>
              <button onClick={() => {
                const step = (Math.random() * 0.4 - 0.2);
                setServerRam(r => parseFloat((r + step).toFixed(1)));
              }} className="text-[9px] font-bold text-[var(--text-subtle)] hover:text-[var(--text)] uppercase font-mono">Simulate GC</button>
            </div>

            <div className="p-4 bg-white/[0.02] border border-[var(--border)] rounded-xl flex items-center gap-3.5 justify-between">
              <div className="space-y-0.5">
                <p className="text-[10px] text-[var(--text-subtle)] text-[var(--text-subtle)] uppercase font-black">CPU Processing Wait</p>
                <p className="text-md font-bold text-[var(--text)]">{serverCpu}% Usage</p>
              </div>
              <button onClick={() => {
                const target = Math.floor(10 + Math.random() * 50);
                setServerCpu(target);
              }} className="text-[9px] font-bold text-[var(--text-subtle)] hover:text-[var(--text)] uppercase font-mono">Alter Load</button>
            </div>

            <div className="p-4 bg-white/[0.02] border border-[var(--border)] rounded-xl flex items-center gap-3.5 justify-between">
              <div className="space-y-0.5">
                <p className="text-[10px] text-[var(--text-subtle)] text-[var(--text-subtle)] uppercase font-black">Docker Container Health</p>
                <p className="text-md font-bold text-green-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                  {appHealth}
                </p>
              </div>
              <button onClick={() => setAppHealth(h => h === "Optimal" ? "Degraded" : "Optimal")} className="text-[9px] font-bold text-[var(--text-subtle)] hover:text-[var(--text)] uppercase font-mono text-[var(--text-subtle)]">Alter State</button>
            </div>
          </div>

          {/* DNS Pointers & Integration Links status */}
          <div className="p-6 rounded-2xl bg-white/[0.04] border border-[var(--border)] backdrop-blur-md space-y-3.5">
            <h3 className="text-xs font-black uppercase text-[var(--text)] tracking-widest flex items-center gap-2">
              <Globe className="w-4 h-4 text-[var(--text-muted)]" /> DNS Domain Handshake
            </h3>

            <div className="space-y-1">
              <label className="text-[10px] text-[var(--text-subtle)] uppercase font-black">Domain Endpoint</label>
              <input 
                type="text" 
                value={domainPointer}
                onChange={(e) => setDomainPointer(e.target.value)}
                className="w-full bg-[#101012] border border-[var(--border)] px-3 py-2.5 rounded-xl text-xs text-[var(--text)] focus:outline-none"
              />
            </div>

            <div className="p-3.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl space-y-2 text-xs">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[var(--text-subtle)] uppercase font-black text-[9.5px]">CNAME Target:</span>
                <span className="font-mono text-[var(--text)]">cname.ingress-routing.autoflow.in</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[var(--text-subtle)] uppercase font-black text-[9.5px]">SSL Certification:</span>
                <span className="text-green-400 font-bold">SHA-256 Valid TLS 1.3</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[var(--text-subtle)] uppercase font-black text-[9.5px]">Propagation State:</span>
                <span className="text-[var(--text)] font-bold">100% propagated</span>
              </div>
            </div>

            <button 
              onClick={() => {
                alert("Initiated full DNS pointer verification query.");
              }}
              className="w-full text-center py-2.5 bg-white/[0.06] hover:bg-white/[0.12] border border-[var(--border)] text-xs font-bold text-[var(--text)] rounded-xl transition-all"
            >
              Verify Connection Pointers
            </button>
          </div>

          {/* Cold storage Backup System */}
          <div className="p-6 rounded-2xl bg-white/[0.04] border border-[var(--border)] backdrop-blur-md space-y-4">
            <div className="flex justify-between items-center pb-1 border-b border-[var(--border)]">
              <h3 className="text-xs font-black uppercase text-[var(--text)] tracking-widest flex items-center gap-2">
                <Database className="w-4 h-4 text-[var(--text-muted)]" /> Database Vault Backups
              </h3>
            </div>

            {/* Toggle auto backups */}
            <div className="flex justify-between items-center text-xs">
              <div className="space-y-0.5">
                <p className="font-extrabold text-[var(--text)] text-[11px]">Scheduled Daily Snapshots</p>
                <p className="text-[10px] text-[var(--text-subtle)]">Backs up full schemas at 11:59 PM</p>
              </div>
              <input 
                type="checkbox" 
                checked={autoBackups} 
                onChange={(e) => setAutoBackups(e.target.checked)}
                className="w-4 h-4 rounded accent-neutral-200"
              />
            </div>

            <button 
              onClick={triggerManualBackup}
              className="w-full text-center py-2 bg-white text-black font-extrabold text-xs rounded-xl"
            >
              Issue Cold SQL Snapshot Backup
            </button>

            {/* Backups List */}
            <div className="space-y-2.5 pt-2 border-t border-[var(--border)]">
              <span className="block text-[10px] text-[var(--text-subtle)] uppercase font-black">Available Snapshots</span>
              {backups.map(bak => (
                <div key={bak.id} className="p-3 bg-white/[0.01] border border-[var(--border)] rounded-xl flex items-center justify-between text-xs hover:border-[var(--border)] transition-colors">
                  <div className="space-y-0.5 truncate max-w-[70%]">
                    <p className="text-[var(--text)] font-semibold truncate text-[11.5px]" title={bak.name}>{bak.name}</p>
                    <p className="text-[10px] text-[var(--text-subtle)] font-mono">{bak.date} • {bak.size}</p>
                  </div>
                  <button 
                    onClick={() => triggerRestore(bak.id, bak.name)}
                    className="px-2.5 py-1 bg-white/[0.05] border border-[var(--border)] text-[var(--text)] font-bold hover:bg-white/[0.12] rounded-lg transition-all text-[10px] tracking-wider"
                  >
                    {bak.status === "Restoring" ? "Restoring..." : bak.status === "Reverted" ? "Reverted" : "Restore"}
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
