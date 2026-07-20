import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageSquare,
  DollarSign,
  Calendar,
  Layers,
  Settings,
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Webhook,
  Key,
  RefreshCw,
  Play,
  Plus,
  Trash2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Zap,
  Check,
  Search,
  Clock,
  Send,
  X,
  Database,
  ArrowRight,
  ArrowDown,
  ShieldCheck,
  HelpCircle,
  Heart,
  TrendingUp,
  Cpu,
  BarChart3
} from "lucide-react";

// Integration Item Interface
interface Integration {
  id: string;
  name: string;
  category: "communication" | "payments" | "crm" | "scheduling" | "analytics" | "automation";
  description: string;
  logoColor: string;
  connected: boolean;
  features: string[];
  setupInstructions: string[];
  apiStatus: "active" | "inactive" | "error";
  lastSync: string;
  health: number; // Percentage
  apiDocsUrl: string;
}

// API Key Interface
interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  created: string;
  expires: string;
  status: "active" | "revoked";
}

// Webhook Log Interface
interface WebhookLog {
  id: string;
  timestamp: string;
  event: string;
  url: string;
  status: 200 | 400 | 500;
  latency: string;
}

interface IntegrationsTabProps {
  onboardingData?: any;
  triggerNotification: (text: string) => void;
}

export const IntegrationsTab: React.FC<IntegrationsTabProps> = ({ onboardingData, triggerNotification }) => {
  // Category tabs state
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);

  // Core Master integrations list in active React state to allow live Connect / Disconnect syncs
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: "whatsapp",
      name: "WhatsApp Business API",
      category: "communication",
      description: "Connect your official WhatsApp Business profile to automate lead discovery and customer service lines.",
      logoColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      connected: true,
      features: ["Interactive CTA automation", "Template broadcast dispatching", "Secure automated scheduling catalog flows"],
      setupInstructions: [
        "Create developer profile in Meta Cloud Suite console.",
        "Generate a custom Permanent System User Access Token.",
        "Link target Verified WhatsApp account ID inside settings."
      ],
      apiStatus: "active",
      lastSync: "2 mins ago",
      health: 100,
      apiDocsUrl: "https://developers.facebook.com/docs/whatsapp"
    },
    {
      id: "razorpay",
      name: "Razorpay Checkout Gateway",
      category: "payments",
      description: "Native link settlements allowing instant payments, automated receipts, subscription status checks.",
      logoColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      connected: true,
      features: ["UPI Intent link automation", "Standard card authorization capture", "Instant webhook payment settling"],
      setupInstructions: [
        "Go to Razorpay Account Dashboard, then API Keys.",
        "Generate live or test mode key ID and Key Secret pair.",
        "Verify standard TLS webhook URL is registered in checkout panel."
      ],
      apiStatus: "active",
      lastSync: "15 mins ago",
      health: 99,
      apiDocsUrl: "https://razorpay.com/docs"
    },
    {
      id: "phonepe",
      name: "PhonePe Merchant Gateway",
      category: "payments",
      description: "Allow direct QR scan code checkout, callback settlements, sandbox automated validations.",
      logoColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      connected: false,
      features: ["Direct QR intent trigger", "Dynamic checkout generator", "Instant status verification query"],
      setupInstructions: [
        "Retrieve your standard Merchant ID (MID) and Salt Key index from PhonePe portal.",
        "Configure redirect target response callback handler.",
        "Validate API merchant credentials in checkout settings."
      ],
      apiStatus: "inactive",
      lastSync: "Never synced",
      health: 0,
      apiDocsUrl: "https://developer.phonepe.com"
    },
    {
      id: "cashfree",
      name: "Cashfree Settlements SDK",
      category: "payments",
      description: "Process instant recurring sandbox test checkouts, direct bank wire payout automation.",
      logoColor: "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20",
      connected: false,
      features: ["Easy recurring bank mandates", "Split payment settlements", "Customer sandbox verification"],
      setupInstructions: [
        "Acquire production App ID and Secret Key from Cashfree developer panel.",
        "Configure custom checkout UI theme colors.",
        "Inject webhook signature verification keys code."
      ],
      apiStatus: "inactive",
      lastSync: "Never synced",
      health: 0,
      apiDocsUrl: "https://docs.cashfree.com"
    },
    {
      id: "stripe",
      name: "Stripe Connect Portal",
      category: "payments",
      description: "Global credit card processing, instant checkout pipelines, and international multicurrency conversions.",
      logoColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      connected: true,
      features: ["Multicurrency localized payment options", "Secure automated Stripe Billing models", "SCA compliant customer portal"],
      setupInstructions: [
        "Copy Stripe key (sk_test_...) from developer settings panel.",
        "Update webhook registration to listen for checkout.session.completed events.",
        "Configure target success URLs for callbacks."
      ],
      apiStatus: "active",
      lastSync: "5 mins ago",
      health: 100,
      apiDocsUrl: "https://stripe.com/docs"
    },
    {
      id: "hubspot",
      name: "HubSpot CRM",
      category: "crm",
      description: "Automatically log leads captured from WhatsApp as new contacts and pipeline deals inside HubSpot.",
      logoColor: "bg-orange-500/10 text-orange-400 border-orange-500/20",
      connected: true,
      features: ["Dynamic lead synchronization on query", "Automatically log notes, chat logs to timelines", "Sync custom client properties"],
      setupInstructions: [
        "Create Private App within HubSpot account settings.",
        "Grant read/write scopes of contacts, companies, and deals namespaces.",
        "Copy and paste generated OAuth API token string."
      ],
      apiStatus: "active",
      lastSync: "1 hour ago",
      health: 98,
      apiDocsUrl: "https://developers.hubspot.com"
    },
    {
      id: "zoho",
      name: "Zoho CRM Core Suite",
      category: "crm",
      description: "Enterprise grade pipeline tracking, automated client assignments, custom module syncing.",
      logoColor: "bg-blue-400/10 text-blue-400 border-blue-400/20",
      connected: false,
      features: ["Bulk list lead dispatcher interface", "Custom module fields mappings", "Sync business contact notes"],
      setupInstructions: [
        "Generate Client credentials ID within Zoho APIs console.",
        "Complete standard Zoho OAuth redirect loop validation.",
        "Establish matching leads data fields layout."
      ],
      apiStatus: "inactive",
      lastSync: "Never synced",
      health: 0,
      apiDocsUrl: "https://www.zoho.com/crm/developer"
    },
    {
      id: "salesforce",
      name: "Salesforce CRM Platform",
      category: "crm",
      description: "Perform real-time customer deal transformations, enterprise support cases creation, and sales pipeline logs.",
      logoColor: "bg-sky-500/10 text-sky-400 border-sky-500/20",
      connected: false,
      features: ["Sync contacts database with Salesforce Objects", "Manage lead pipeline stages automatically", "Real-time ticket logging for customer claims"],
      setupInstructions: [
        "Configure Salesforce Connected App profile.",
        "Acquire client key parameters index settings.",
        "Authorize OAuth secure login loop sync."
      ],
      apiStatus: "inactive",
      lastSync: "Never synced",
      health: 0,
      apiDocsUrl: "https://developer.salesforce.com"
    },
    {
      id: "pipedrive",
      name: "Pipedrive Sales Pipeline",
      category: "crm",
      description: "Visual sales workflow manager, automatic deal updates, activity log tracking.",
      logoColor: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
      connected: false,
      features: ["Auto-create deals when customer books appointment", "Log conversations directly to deal context logs", "Visualize active pipeline stages"],
      setupInstructions: [
        "Retrieve API Token index from Pipedrive Developer Portal settings.",
        "Map standard fields layout configurations to Pipedrive stage targets.",
        "Sync live event listeners to webhook URL."
      ],
      apiStatus: "inactive",
      lastSync: "Never synced",
      health: 0,
      apiDocsUrl: "https://developers.pipedrive.com"
    },
    {
      id: "google-calendar",
      name: "Google Calendar API",
      category: "scheduling",
      description: "Automate calendar reservation bookings directly syncing target specialist schedules seamlessly.",
      logoColor: "bg-red-400/10 text-red-400 border-red-400/20",
      connected: true,
      features: ["Fully integrated appointment booking checks", "Avoid overlapping reservation slot locks", "Automatic reminders creation in calendar events"],
      setupInstructions: [
        "Complete rapid Google Workspace OAuth verification inside developer credentials UI.",
        "Choose target calendar folder ID in the synchronizer settings dashboard.",
        "Test sync slot allocation blocks."
      ],
      apiStatus: "active",
      lastSync: "Just now",
      health: 100,
      apiDocsUrl: "https://developers.google.com/calendar"
    },
    {
      id: "calendly",
      name: "Calendly Widget Sync",
      category: "scheduling",
      description: "Embed custom scheduling links in WhatsApp triggers, track successful scheduler confirmations.",
      logoColor: "bg-[#2563eb]/10 text-blue-500 border-blue-550/20",
      connected: false,
      features: ["Redirect clients to premium scheduling layouts", "Acknowledge scheduling events instantly via callbacks", "Custom lead capturing within calendar slot request"],
      setupInstructions: [
        "Generate Personal Access Token inside Calendly developer area.",
        "Establish webhooks to trigger on invitee.created events.",
        "Configure WhatsApp automatic answers matching."
      ],
      apiStatus: "inactive",
      lastSync: "Never synced",
      health: 0,
      apiDocsUrl: "https://developer.calendly.com"
    },
    {
      id: "microsoft-calendar",
      name: "Microsoft Outlook Calendar",
      category: "scheduling",
      description: "Enterprise calendar scheduling sync, Microsoft Teams video invites automation.",
      logoColor: "bg-[#0078d4]/10 text-[#0078d4] border-[#0078d4]/20",
      connected: false,
      features: ["Full dynamic scheduling alignment with Outlook", "Create MSTeams join buttons dynamically for service sessions", "Keep bookings in sync on cloud devices"],
      setupInstructions: [
        "Configure application registry on Microsoft Azure Portal Console.",
        "Generate Client Secret parameter keys.",
        "Approve Calendar.ReadWrite scopes grant authentication."
      ],
      apiStatus: "inactive",
      lastSync: "Never synced",
      health: 0,
      apiDocsUrl: "https://learn.microsoft.com/en-us/graph"
    },
    {
      id: "google-analytics",
      name: "Google Analytics 4",
      category: "analytics",
      description: "Record checkout page traffic hits, custom funnel stage duration metrics, user attributes.",
      logoColor: "bg-red-500/10 text-red-500 border-red-500/20",
      connected: true,
      features: ["Capture transaction volume events metadata", "Log unique customer session origins", "Verify checkout dropoff stages inside dashboard stats"],
      setupInstructions: [
        "Locate your target Measurement ID (G-XXXXXXXXXX) inside Google Analytics setup page.",
        "Configure custom customer conversation events tags.",
        "Validate real-time logs ingestion loop."
      ],
      apiStatus: "active",
      lastSync: "25 mins ago",
      health: 98,
      apiDocsUrl: "https://developers.google.com/analytics"
    },
    {
      id: "meta-pixel",
      name: "Meta Pixel Tracker",
      category: "analytics",
      description: "Evaluate user conversions from Instagram or FB ads campaigns directly tracking lead form captures status.",
      logoColor: "bg-sky-400/10 text-sky-450 border-sky-455/20 text-sky-400 border-sky-400/20",
      connected: false,
      features: ["Direct ads measurement attribution", "Configure custom checkout started events conversion target", "Create accurate lookalike customer audiences"],
      setupInstructions: [
        "Locate target Meta Pixel ID in FB Business Manager panel.",
        "Inject pixel loader script key elements.",
        "Add Conversion API Token details for secure server tracking."
      ],
      apiStatus: "inactive",
      lastSync: "Never synced",
      health: 0,
      apiDocsUrl: "https://developers.facebook.com/docs/meta-pixel"
    },
    {
      id: "looker",
      name: "Looker Studio Data Hub",
      category: "analytics",
      description: "Expose secure database values metrics directly into comprehensive executive investor reports layout.",
      logoColor: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      connected: false,
      features: ["Build modular charts utilizing custom SQL views", "Automatically schedule daily snapshot files alerts", "Share clean performance summaries with teammates"],
      setupInstructions: [
        "Generate secure read-only SQL pipeline credentials key index.",
        "Link target dataset connector endpoint inside Looker dashboard.",
        "Establish dynamic database views maps."
      ],
      apiStatus: "inactive",
      lastSync: "Never synced",
      health: 0,
      apiDocsUrl: "https://cloud.google.com/looker"
    },
    {
      id: "zapier",
      name: "Zapier Platform Integration",
      category: "automation",
      description: "Connect Autofy leads alerts directly with thousands of daily business applications without writing custom code.",
      logoColor: "bg-orange-600/10 text-orange-500 border-orange-600/20",
      connected: true,
      features: ["Instantly trigger zaps when new leads submit info", "Execute subsequent third-party actions automatically", "No-code workflow variables layout mappings"],
      setupInstructions: [
        "Locate Autofy integration tag in public Zapier Integration Library panel.",
        "Authenticate using your generated Autofy Workspace API key.",
        "Verify standard lead.created trigger test is passing successfully."
      ],
      apiStatus: "active",
      lastSync: "4 mins ago",
      health: 100,
      apiDocsUrl: "https://platform.zapier.com"
    },
    {
      id: "make-integromat",
      name: "Make.com (Integromat)",
      category: "automation",
      description: "Establish highly visual complex loops with multi-step data filters, branch splits, error-handling.",
      logoColor: "bg-purple-600/10 text-purple-500 border-purple-650/20",
      connected: false,
      features: ["Detailed visual designer panel matching custom rules", "Support array-iterating data maps parsing", "Integrate powerful background error-catch fallbacks"],
      setupInstructions: [
        "Generate visual webhook token link inside Make Scenario panel.",
        "Paste Webhook address target url into Autofy configuration portal.",
        "Simulate trigger event payload to verify scenario start loop."
      ],
      apiStatus: "inactive",
      lastSync: "Never synced",
      health: 0,
      apiDocsUrl: "https://www.make.org/developer"
    },
    {
      id: "n8n",
      name: "n8n Self-hosted workflows",
      category: "automation",
      description: "Configure self-hosted automation actions, utilize advanced script parsing blocks, protect private data.",
      logoColor: "bg-red-600/10 text-red-500 border-red-600/20",
      connected: false,
      features: ["Script complex logic blocks utilizing JavaScript code snippets", "Zero host limits self-managed executions counts", "High level data compliance privacy constraints"],
      setupInstructions: [
        "Establish target authn webhook endpoint address in n8n system panel.",
        "Inject webhook URL link to Autofy setup logs.",
        "Verify test execution triggers are recording successfully."
      ],
      apiStatus: "inactive",
      lastSync: "Never synced",
      health: 0,
      apiDocsUrl: "https://docs.n8n.io"
    },
    {
      id: "webhook-api",
      name: "Webhook Custom API Node",
      category: "automation",
      description: "Developer friendly instant callback integration notifying custom database servers on triggers.",
      logoColor: "bg-[#10b981]/10 text-emerald-400 border-emerald-500/20",
      connected: true,
      features: ["Zero delay event callback notifications", "Secured SHA256 webhook payload verify signatures key", "Adjustable retry parameters on server delays"],
      setupInstructions: [
        "Provide your private web service URL receiving webhook JSON packages.",
        "Examine webhook headers containing validation signatures.",
        "Check historical delivery status in developer console logs dashboard."
      ],
      apiStatus: "active",
      lastSync: "5 mins ago",
      health: 98,
      apiDocsUrl: "/docs/api-reference"
    }
  ]);

  // Api keys state
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    { id: "key-1", name: "WhatsApp Chatbot Production Client", keyPrefix: "af_live_9fae1...", created: "2026-05-12", expires: "2027-05-12", status: "active" },
    { id: "key-2", name: "Looker Studio Sandbox Node Token", keyPrefix: "af_sandbox_37bf2...", created: "2026-05-24", expires: "2026-11-24", status: "active" },
    { id: "key-3", name: "Deprecated Zapier Webhook sync", keyPrefix: "af_live_211b5...", created: "2026-03-01", expires: "2026-09-01", status: "revoked" }
  ]);

  // Webhook management state
  const [webhookUrl, setWebhookUrl] = useState("https://api.yourcommerceserver.com/webhooks/autofy");
  const [selectedEvents, setSelectedEvents] = useState<string[]>(["lead.captured", "payment.completed"]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([
    { id: "log-1", timestamp: "2026-06-20 11:15:32", event: "payment.completed", url: "https://api.yourcommerceserver.com/webhooks/autofy", status: 200, latency: "142ms" },
    { id: "log-2", timestamp: "2026-06-20 11:12:04", event: "lead.captured", url: "https://api.yourcommerceserver.com/webhooks/autofy", status: 200, latency: "98ms" },
    { id: "log-3", timestamp: "2026-06-20 10:45:11", event: "appointment.booked", url: "https://api.yourcommerceserver.com/webhooks/autofy", status: 200, latency: "115ms" },
    { id: "log-4", timestamp: "2026-06-20 09:30:18", event: "payment.completed", url: "https://api.yourcommerceserver.com/webhooks/autofy", status: 500, latency: "2100ms" }
  ]);

  // Live Workflow builder visual interactive state representation
  const [workflowNodes, setWorkflowNodes] = useState([
    { id: "node-1", type: "trigger", title: "New Lead Captured", desc: "WhatsApp AI secures phone of prospect", icon: MessageSquare, color: "border-blue-500/40 text-blue-400 bg-blue-500/5" },
    { id: "node-2", type: "action", title: "Send WhatsApp Message", desc: "Automated thank-you confirmation with pricing sheet", icon: Send, color: "border-emerald-500/40 text-emerald-400 bg-emerald-500/5" },
    { id: "node-3", type: "action", title: "Create CRM Record", desc: "Log prospect into HubSpot deals pipeline", icon: Database, color: "border-orange-500/40 text-orange-400 bg-orange-500/5" },
    { id: "node-4", type: "action", title: "Send Email Notification", desc: "Investor, manager alert copy via Outlook SMTP Node", icon: Zap, color: "border-purple-500/40 text-purple-400 bg-purple-500/5" }
  ]);
  const [workflowRunIndex, setWorkflowRunIndex] = useState<number | null>(null);
  const [isAddingNode, setIsAddingNode] = useState(false);
  const [newNodeTitle, setNewNodeTitle] = useState("");
  const [newNodeDesc, setNewNodeDesc] = useState("");
  const [newNodeType, setNewNodeType] = useState<"trigger" | "action">("action");

  // Filtered integrations based on selected Category and Search query input
  const filteredIntegrations = useMemo(() => {
    return integrations.filter((item) => {
      const matchesCategory = activeCategory === "all" || item.category === activeCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [integrations, activeCategory, searchQuery]);

  // Statistics summaries derived from active integrations state dynamically
  const stats = useMemo(() => {
    const connectedCount = integrations.filter((item) => item.connected).length;
    const activeWorkflowCount = workflowNodes.length * 2; // Derived indicator representing active flows
    return {
      connected: connectedCount,
      available: integrations.length,
      messages: "14,250",
      workflows: activeWorkflowCount
    };
  }, [integrations, workflowNodes]);

  // Core Connection trigger toggler handler
  const handleToggleConnection = (id: string) => {
    setIntegrations((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newConnected = !item.connected;
          const updatedStatus = newConnected ? "active" : "inactive";
          const updatedHealth = newConnected ? 100 : 0;
          const targetText = newConnected ? `Connected Integration successfully: ${item.name}` : `Disconnected Integration: ${item.name}`;
          
          triggerNotification(`[System] ${targetText}`);
          
          // Sync changes in open detail view if active too
          if (selectedIntegration && selectedIntegration.id === id) {
            setSelectedIntegration({
              ...item,
              connected: newConnected,
              apiStatus: updatedStatus as any,
              health: updatedHealth
            });
          }

          return {
            ...item,
            connected: newConnected,
            apiStatus: updatedStatus as any,
            health: updatedHealth,
            lastSync: newConnected ? "Just now" : "Never synced"
          };
        }
        return item;
      })
    );
  };

  // Rotate client key index flow handler
  const handleRotateKey = (keyId: string) => {
    setApiKeys((prev) =>
      prev.map((key) => {
        if (key.id === keyId) {
          const randHex = Math.random().toString(16).substring(2, 7);
          triggerNotification(`[Security] Secure token rotated! Autofy backend compiled updated hash key client: af_live_${randHex}...`);
          return {
            ...key,
            keyPrefix: `af_live_${randHex}...`,
            created: new Date().toISOString().split("T")[0]
          };
        }
        return key;
      })
    );
  };

  // Revoke client key index flow handler
  const handleRevokeKey = (keyId: string) => {
    setApiKeys((prev) =>
      prev.map((key) => {
        if (key.id === keyId) {
          const isRevoked = key.status === "revoked";
          const nextStatus = isRevoked ? "active" : "revoked";
          triggerNotification(isRevoked ? `[Success] API Key Reactivated!` : `[Warning] API Key Revoked! Integrations utilizing this token will stop syncing.`);
          return {
            ...key,
            status: nextStatus as any
          };
        }
        return key;
      })
    );
  };

  // Create new key
  const handleGenerateKey = () => {
    const newId = `key-${Date.now()}`;
    const randHex = Math.random().toString(16).substring(2, 7);
    const newK: ApiKey = {
      id: newId,
      name: `External Client App - Token ${apiKeys.length + 1}`,
      keyPrefix: `af_live_${randHex}...`,
      created: new Date().toISOString().split("T")[0],
      expires: "2027-06-20",
      status: "active"
    };
    setApiKeys((prev) => [...prev, newK]);
    triggerNotification("[Success] Created new secure API access key!");
  };

  // Toggle checklist webhook event
  const toggleWebhookEvent = (ev: string) => {
    setSelectedEvents((prev) =>
      prev.includes(ev) ? prev.filter((item) => item !== ev) : [...prev, ev]
    );
  };

  // Test current Webhook configuration triggers
  const handleTestWebhook = () => {
    if (!webhookUrl) {
      triggerNotification("[Error] Webhook destination URL cannot be empty.");
      return;
    }
    triggerNotification("[Status] Outbound notification webhook simulated. Delivering sample logs JSON paket...");
    
    // Simulate latency & random result status code
    const mockLatency = `${Math.floor(Math.random() * 150) + 70}ms`;
    const statuses = [200, 200, 200, 400, 500] as const;
    const mockStatus = statuses[Math.floor(Math.random() * statuses.length)];
    const randomEvent = selectedEvents[Math.floor(Math.random() * selectedEvents.length)] || "lead.captured";

    const log: WebhookLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      event: randomEvent,
      url: webhookUrl,
      status: mockStatus as any,
      latency: mockLatency
    };

    setWebhookLogs((prev) => [log, ...prev.slice(0, 10)]);
    if (mockStatus === 200) {
      triggerNotification(`[Success] Live test complete! Response returned Status Code 200 (Success) in ${mockLatency}`);
    } else {
      triggerNotification(`[Error] Live test completed with errors! Target Server returned Status ${mockStatus} in ${mockLatency}`);
    }
  };

  // Live simulation animations runner flow representing the Visual Builder pipeline triggers
  const handleRunWorkflowSimulation = () => {
    triggerNotification("Syncing pipeline... Launching live transaction workflow check!");
    
    // Stagger highlight transitions for steps
    let currentIdx = 0;
    setWorkflowRunIndex(0);

    const interval = setInterval(() => {
      currentIdx++;
      if (currentIdx < workflowNodes.length) {
        setWorkflowRunIndex(currentIdx);
      } else {
        clearInterval(interval);
        setWorkflowRunIndex(null);
        triggerNotification("Pipeline flow successfully completed! Verified WhatsApp message was delivered, HubSpot CRM records created, and owner received Email.");
      }
    }, 1500);
  };

  // Create custom workflow node
  const handleAddCustomNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeTitle || !newNodeDesc) {
      triggerNotification("Please fill in all Node parameters.");
      return;
    }
    const id = `node-${Date.now()}`;
    const randIcons = [Zap, Send, Database, MessageSquare, Key, ShieldCheck];
    const chosenIcon = randIcons[Math.floor(Math.random() * randIcons.length)];

    const colors = {
      trigger: "border-blue-500/40 text-blue-400 bg-blue-500/5",
      action: "border-purple-500/40 text-purple-400 bg-purple-500/5"
    };

    const node = {
      id,
      type: newNodeType,
      title: newNodeTitle,
      desc: newNodeDesc,
      icon: chosenIcon,
      color: colors[newNodeType]
    };

    setWorkflowNodes((prev) => [...prev, node]);
    setNewNodeTitle("");
    setNewNodeDesc("");
    setIsAddingNode(false);
    triggerNotification(`Successfully added customized pipeline workflow Node standard node: "${newNodeTitle}"`);
  };

  // Delete customized workflow node
  const handleDeleteNode = (nodeId: string) => {
    if (workflowNodes.length <= 2) {
      triggerNotification("Automation flow requires a minimum of 2 connected nodes to operate.");
      return;
    }
    const target = workflowNodes.find((n) => n.id === nodeId);
    setWorkflowNodes((prev) => prev.filter((node) => node.id !== nodeId));
    triggerNotification(`Removed workflow block: "${target?.title}"`);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. TOP TITLE VIEWPORT PANEL */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-neutral-950/40 to-[#0e0e12]/60 border border-var(--border) rounded-3xl p-6 backdrop-blur-md">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-550 text-blue-500" /> Integrations <span className="bg-blue-500/10 text-blue-400 font-mono text-[9px] px-2 py-0.5 rounded-full border border-blue-500/10 font-bold">Vite Core Marketplace</span>
          </h2>
          <p className="text-xs text-neutral-400 font-medium mt-0.5 mt-1">Connect Autofy with your favorite business tools to drive automated messaging and payment settlements.</p>
        </div>

        {/* Live system health pulse badge */}
        <div className="flex items-center gap-3 bg-[#0a0a0d] border border-var(--border) px-4 py-2.5 rounded-2xl">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
          <div className="font-sans">
            <p className="text-[10px] text-neutral-400 uppercase font-black text-neutral-400 tracking-wider">Ecosystem Status</p>
            <p className="text-[11px] text-white font-bold flex items-center gap-1 mt-0.5">
              All Systems Operational <span className="text-[9.5px] text-emerald-400 font-mono">(100.0% Uptime)</span>
            </p>
          </div>
        </div>
      </div>

      {/* 2. TOP OVERVIEW CARDS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Connected Integrations */}
        <div className="bg-[#09090b]/80 border border-var(--border) rounded-2xl p-5 hover:border-blue-500/20 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[9.5px] font-black uppercase text-neutral-400 tracking-wider">Connected Apps</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <h4 className="text-3xl font-black text-white font-mono mt-3">{stats.connected}</h4>
          <p className="text-[9px] text-neutral-500 mt-1">active pipeline channels</p>
        </div>

        {/* Card 2: Available marketplace catalog */}
        <div className="bg-[#09090b]/80 border border-var(--border) rounded-2xl p-5 hover:border-blue-500/20 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[9.5px] font-black uppercase text-neutral-400 tracking-wider">Available Apps</span>
            <Cpu className="w-4 h-4 text-blue-500" />
          </div>
          <h4 className="text-3xl font-black text-white font-mono mt-3">{stats.available}</h4>
          <p className="text-[9px] text-neutral-500 mt-1">supported ecosystem nodes</p>
        </div>

        {/* Card 3: Messages processed */}
        <div className="bg-[#09090b]/80 border border-var(--border) rounded-2xl p-5 hover:border-blue-500/20 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[9.5px] font-black uppercase text-neutral-400 tracking-wider">Messages Routed</span>
            <MessageSquare className="w-4 h-4 text-purple-500" />
          </div>
          <h4 className="text-3xl font-black text-white font-mono mt-3">{stats.messages}</h4>
          <p className="text-[9px] text-emerald-405 text-emerald-400 mt-1">▲ 100% verified webhook</p>
        </div>

        {/* Card 4: Automation steps */}
        <div className="bg-[#09090b]/80 border border-var(--border) rounded-2xl p-5 hover:border-blue-500/20 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[9.5px] font-black uppercase text-neutral-400 tracking-wider">Workflow Nodes</span>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <h4 className="text-3xl font-black text-white font-mono mt-3">{stats.workflows}</h4>
          <p className="text-[9px] text-neutral-500 mt-1">active automation steps</p>
        </div>

      </div>

      {/* 3. CLASSIFIED INTEGRATIONS CATALOG & FILTER TABS */}
      <div className="bg-[#08080a] border border-var(--border) rounded-3xl p-6 space-y-6">
        
        {/* Filter Toolbar controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-var(--border) pb-5">
          
          {/* Categories Tab selectors */}
          <div className="flex flex-wrap items-center gap-1">
            {[
              { id: "all", label: "All Catalog" },
              { id: "communication", label: "Communication" },
              { id: "payments", label: "Payments" },
              { id: "crm", label: "CRM" },
              { id: "scheduling", label: "Scheduling" },
              { id: "analytics", label: "Analytics" },
              { id: "automation", label: "Automation" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveCategory(tab.id);
                  triggerNotification(` Switched marketplace catalog to: ${tab.label}`);
                }}
                className={`px-3 py-1.5 text-[10.5px] font-bold rounded-xl transition cursor-pointer font-sans whitespace-nowrap ${
                  activeCategory === tab.id
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-var(--bg-elevated)/40 text-neutral-400 text-neutral-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search box index */}
          <div className="relative w-full md:w-64 max-w-sm">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              placeholder="Query integrations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#121215] border border-var(--border) pl-9 pr-4 py-2 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500/60 placeholder:text-neutral-500"
            />
          </div>

        </div>

        {/* Catalog grid listings */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredIntegrations.length > 0 ? (
            filteredIntegrations.map((item) => (
              <div
                key={item.id}
                className={`bg-neutral-950/40 border ${
                  item.connected ? "border-blue-900/40 shadow-[0_0_20px_rgba(59,130,246,0.02)]" : "border-var(--border)"
                } rounded-3xl p-5 hover:border-neutral-800 transition-all flex flex-col justify-between gap-5 relative group`}
              >
                <div className="space-y-4">
                  
                  {/* Top card parameters */}
                  <div className="flex items-center justify-between">
                    <span className={`p-2.5 rounded-xl border font-black ${item.logoColor}`}>
                      {item.category === "communication" ? <MessageSquare className="w-5 h-5" /> :
                       item.category === "payments" ? <DollarSign className="w-5 h-5" /> :
                       item.category === "crm" ? <Database className="w-5 h-5" /> :
                       item.category === "scheduling" ? <Calendar className="w-5 h-5" /> :
                       item.category === "analytics" ? <Activity className="w-5 h-5" /> :
                       <Zap className="w-5 h-5" />}
                    </span>

                    {/* Connection status pills */}
                    <span
                      onClick={() => handleToggleConnection(item.id)}
                      className={`text-[9.5px] font-black uppercase tracking-wider font-mono cursor-pointer px-2.5 py-1 rounded bg-neutral-950 border transition duration-200 ${
                        item.connected 
                          ? "text-emerald-400 border-emerald-500/20 hover:bg-var(--bg-elevated)" 
                          : "text-neutral-500 border-var(--border) hover:text-white hover:bg-var(--bg-elevated)"
                      }`}
                    >
                      ● {item.connected ? "Connected" : "Inactive"}
                    </span>
                  </div>

                  {/* Body textual notes */}
                  <div className="space-y-1.5 cursor-pointer" onClick={() => setSelectedIntegration(item)}>
                    <h4 className="text-sm font-black text-white font-sans group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                      {item.name} <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h4>
                    <p className="text-[11px] text-neutral-400 text-neutral-400 font-sans leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  {/* Feature bubbles indicators block */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {item.features.slice(0, 2).map((feat, idx) => (
                      <span key={idx} className="bg-[#0b0b0e] border border-var(--border) text-[9px] text-neutral-500 font-semibold px-2 py-0.5 rounded-full font-mono">{feat}
                      </span>
                    ))}
                  </div>

                </div>

                {/* Footer action buttons layout */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-var(--border)/60 font-sans text-[10.5px]">
                  
                  <button
                    onClick={() => setSelectedIntegration(item)}
                    className="py-2 px-3 bg-var(--bg-elevated) hover:bg-var(--bg-elevated) text-neutral-300 font-bold rounded-xl transition text-center cursor-pointer"
                  >
                    Manage
                  </button>

                  <button
                    onClick={() => handleToggleConnection(item.id)}
                    className={`py-2 px-3 font-semibold rounded-xl tracking-wide duration-200 transition text-center cursor-pointer ${
                      item.connected
                        ? "bg-red-950/10 hover:bg-red-950/30 text-red-400 hover:text-white border border-red-500/10"
                        : "bg-blue-600 hover:bg-blue-500 text-white font-black"
                    }`}
                  >
                    {item.connected ? "Disconnect" : "Connect"}
                  </button>

                </div>

              </div>
            ))
          ) : (
            <div className="col-span-full bg-[#0a0a0d] border border-var(--border) rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-4">
              <span className="p-3 bg-neutral-950 border border-var(--border) text-neutral-500 rounded-2xl">
                <AlertCircle className="w-6 h-6 text-neutral-500" />
              </span>
              <div>
                <p className="text-xs font-black text-white">No integrations found</p>
                <p className="text-[10px] text-neutral-500 mt-1">Try refining search parameters or choose a different catalog category.</p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* 4. DETAILS SIDE DRAWER / DETAIL PANEL (ACTIVE SELECTION) */}
      <AnimatePresence>
        {selectedIntegration && (
          <div className="fixed inset-0 bg-[#000000]/80 backdrop-blur-sm z-50 flex justify-end">
            
            <motion.div
              initial={{ x: "100%", opacity: 0.9 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.9 }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
              className="w-full max-w-lg bg-neutral-950 border-l border-var(--border) h-full overflow-y-auto p-6 md:p-8 flex flex-col justify-between space-y-6 shadow-2xl relative font-sans text-xs"
            >
              
              {/* Top drawer sticky controller panel */}
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-var(--border) pb-4">
                  <div className="flex items-center gap-3">
                    <span className={`p-2.5 rounded-xl border ${selectedIntegration.logoColor}`}>
                      <Zap className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="text-base font-black text-white">{selectedIntegration.name}</h3>
                      <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-extrabold">Ecosystem Namespace Component</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedIntegration(null)}
                    className="p-2 hover:bg-var(--bg-elevated) text-neutral-400 hover:text-white rounded-lg transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Connection details summary indicators */}
                <div className="grid grid-cols-2 gap-3 bg-[#0a0a0d] border border-var(--border) p-4 rounded-2xl">
                  
                  <div>
                    <span className="text-[9px] text-neutral-500 uppercase font-black">Sync Status Log</span>
                    <p className="text-white font-extrabold mt-0.5 flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${selectedIntegration.connected ? "bg-green-500 animate-pulse" : "bg-neutral-700"}`} />
                      {selectedIntegration.connected ? "Active Stream Integration" : "Disconnected Portal"}
                    </p>
                  </div>

                  <div>
                    <span className="text-[9px] text-neutral-500 uppercase font-black">Connection Health</span>
                    <p className="text-blue-400 font-extrabold mt-0.5 font-mono">{selectedIntegration.health}% Accuracy Rate</p>
                  </div>

                  <div className="pt-2 border-t border-var(--border)/60">
                    <span className="text-[9px] text-neutral-500 uppercase font-black">Latest Sync Capture</span>
                    <p className="text-neutral-300 font-medium mt-0.5 font-mono">{selectedIntegration.lastSync}</p>
                  </div>

                  <div className="pt-2 border-t border-var(--border)/60">
                    <span className="text-[9px] text-neutral-500 uppercase font-black">API Status</span>
                    <p className="text-neutral-300 font-medium mt-0.5 capitalize font-mono text-emerald-450 text-emerald-400">{selectedIntegration.apiStatus}</p>
                  </div>

                </div>

                {/* Features mapping block */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider text-blue-400">Supported Features</h4>
                  <ul className="space-y-2">
                    {selectedIntegration.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-neutral-300">
                        <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Setup Manual Instructions */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider text-purple-400">Setup Instructions manual</h4>
                  <div className="p-4 bg-var(--bg-elevated)/30 border border-var(--border) rounded-2xl space-y-3">
                    {selectedIntegration.setupInstructions.map((inst, index) => (
                      <div key={index} className="flex gap-3">
                        <span className="w-5 h-5 shrink-0 rounded-full bg-neutral-950 border border-var(--border) flex items-center justify-center font-mono text-[9.5px] font-black text-blue-400">
                          {index + 1}
                        </span>
                        <p className="text-neutral-400 leading-normal text-[11px] font-sans pt-0.5">{inst}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Bottom drawer static action controls */}
              <div className="space-y-3 pt-4 border-t border-var(--border)">
                <div className="flex gap-3">
                  
                  <button
                    onClick={() => handleToggleConnection(selectedIntegration.id)}
                    className={`flex-1 py-3 text-center rounded-xl font-bold transition text-xs cursor-pointer ${
                      selectedIntegration.connected
                        ? "bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-500/10"
                        : "bg-blue-600 hover:bg-blue-500 text-white font-black shadow-lg"
                    }`}
                  >
                    {selectedIntegration.connected ? "Disconnect Integration" : "Establish Live Sync"}
                  </button>

                  <a
                    href={selectedIntegration.apiDocsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="py-3 px-4 bg-var(--bg-elevated) hover:bg-var(--bg-elevated) border border-neutral-800 rounded-xl transition text-center text-neutral-300 flex items-center justify-center"
                    title="API Docs External Portal"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>

                </div>
                <p className="text-[10px] text-neutral-500 text-center">
                  Sync operations run via continuous verified TLS pipeline logs. Read our privacy documentation.
                </p>
              </div>

            </motion.div>

          </div>
        )}
      </AnimatePresence>

      {/* 5. VISUAL AUTOMATION WORKFLOW BUILDER WORKSPACE */}
      <div className="bg-[#08080a] border border-var(--border) rounded-3xl p-6 space-y-6 font-sans">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-var(--border) pb-4">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-blue-500 animate-pulse" /> Automation Workflow Builder
            </h3>
            <p className="text-[10.5px] text-neutral-500 font-medium">Design and test multi-step custom WhatsApp message triggers and automated API workflows.</p>
          </div>

          <div className="flex items-center gap-2">
            
            <button
              onClick={() => {
                setIsAddingNode(true);
                triggerNotification(" Configured visual editor parameters block.");
              }}
              className="bg-var(--bg-elevated) hover:bg-var(--bg-elevated) text-neutral-300 hover:text-white border border-neutral-800 hover:border-neutral-700 text-xs font-black px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add Node step
            </button>

            <button
              onClick={handleRunWorkflowSimulation}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-black px-4 py-2 rounded-xl shadow-lg transition duration-200 cursor-pointer flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 text-white fill-white" /> Test flow
            </button>

          </div>
        </div>

        {/* WORKFLOW PIPELINE CANVAS MAP */}
        <div className="p-6 bg-[#040406]/85 border border-dashed border-var(--border) rounded-2xl relative overflow-x-auto min-h-[160px] flex flex-col md:flex-row items-center justify-center gap-4">
          
          {/* Loop over nodes */}
          {workflowNodes.map((node, idx) => {
            const isHighlighted = workflowRunIndex === idx;
            
            return (
              <React.Fragment key={node.id}>
                
                {/* Node Box card items */}
                <motion.div
                  animate={{
                    borderColor: isHighlighted ? "#3b82f6" : "#262626",
                    scale: isHighlighted ? 1.05 : 1,
                    backgroundColor: isHighlighted ? "rgba(59,130,246,0.1)" : "rgba(10,10,10,0.4)"
                  }}
                  className={`w-52 shrink-0 border rounded-2xl p-4 text-left relative group duration-200 transition-all ${node.color}`}
                >
                  
                  {/* Delete button layout */}
                  <button
                    onClick={() => handleDeleteNode(node.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 bg-var(--bg-elevated) hover:bg-var(--bg-elevated) text-neutral-400 hover:text-white rounded transition"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>

                  <div className="flex items-center gap-2.5">
                    <span className="p-1.5 rounded-lg bg-neutral-950 border border-var(--border)">
                      <node.icon className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <span className="text-[8.5px] uppercase font-bold text-neutral-500 tracking-wider font-mono">
                        {node.type}
                      </span>
                      <h5 className="text-[11.5px] font-black text-white truncate">{node.title}</h5>
                    </div>
                  </div>

                  <p className="text-[10px] text-neutral-405 text-neutral-400 font-medium leading-relaxed mt-2.5 line-clamp-2">
                    {node.desc}
                  </p>

                  {/* Indicator showing current active flow run */}
                  {isHighlighted && (
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white font-mono text-[8.5px] px-2 py-0.5 rounded-full font-black animate-pulse">
                      Processing...
                    </div>
                  )}

                </motion.div>

                {/* Chevron connector between nodes */}
                {idx < workflowNodes.length - 1 && (
                  <div className="flex items-center justify-center shrink-0">
                    <ArrowRight className="w-4 h-4 text-neutral-700 animate-pulse font-bold hidden md:block" />
                    <span className="text-neutral-700 font-extrabold md:hidden text-lg"><ArrowDown className="w-4 h-4" /></span>
                  </div>
                )}

              </React.Fragment>
            );
          })}

        </div>

        {/* CUSTOM NODE ADDITION MODAL EMBED */}
        <AnimatePresence>
          {isAddingNode && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="p-5 bg-neutral-950/40 border border-var(--border) rounded-2xl space-y-4"
            >
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1 text-blue-400">
                Configure Workflow Trigger / Action params
              </h4>
              <form onSubmit={handleAddCustomNode} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                
                <div>
                  <label className="text-[9.5px] font-black uppercase text-neutral-400 tracking-wider">Node Category Type</label>
                  <select
                    value={newNodeType}
                    onChange={(e) => setNewNodeType(e.target.value as any)}
                    className="w-full bg-var(--bg-elevated) border border-var(--border) text-white px-3.5 py-2 rounded-xl mt-1 focus:outline-none"
                  >
                    <option value="action">Action Pipeline Code</option>
                    <option value="trigger">Trigger Event Listener</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9.5px] font-black uppercase text-neutral-400 tracking-wider">Node Name / Type Label</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Create Ticket Zoho"
                    value={newNodeTitle}
                    onChange={(e) => setNewNodeTitle(e.target.value)}
                    className="w-full bg-neutral-950 border border-var(--border) text-white px-3.5 py-2 rounded-xl mt-1 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[9.5px] font-black uppercase text-neutral-400 tracking-wider">Action Description parameter</label>
                  <input
                    type="text"
                    required
                    placeholder="Briefly state transaction role"
                    value={newNodeDesc}
                    onChange={(e) => setNewNodeDesc(e.target.value)}
                    className="w-full bg-neutral-950 border border-var(--border) text-white px-3.5 py-2 rounded-xl mt-1 focus:outline-none"
                  />
                </div>

                <div className="flex gap-2 text-xs">
                  <button
                    type="submit"
                    className="flex-1 py-15 bg-blue-600 hover:bg-blue-500 py-2 font-black text-white rounded-xl transition cursor-pointer"
                  >
                    Sync Node
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingNode(false)}
                    className="px-4 py-2 bg-var(--bg-elevated) hover:bg-var(--bg-elevated) text-neutral-400 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

              </form>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* 6. WEBHOOKS & API KEYS INTERACTIVE ADMINISTRATION PORTAL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Column A: API Keys Storage Management */}
        <div id="integrations-api-keys-manager" className="bg-[#08080a] border border-var(--border) rounded-3xl p-6 flex flex-col justify-between space-y-5 font-sans">
          
          <div className="space-y-4">
            
            <div className="flex items-center justify-between border-b border-var(--border) pb-3">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-blue-500" /> Secure API Keys Storage
                </h3>
                <p className="text-[10.5px] text-neutral-500 font-medium font-sans">Establish secure program access secrets, manage expirations, and rotate tokens.</p>
              </div>

              <button
                onClick={handleGenerateKey}
                className="p-2 border border-blue-500/10 hover:border-blue-500/30 bg-blue-950/15 text-blue-400 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Generate Key
              </button>
            </div>

            {/* List api keys */}
            <div className="space-y-3">
              {apiKeys.map((key) => {
                const isRevoked = key.status === "revoked";
                return (
                  <div key={key.id} className="p-3.5 bg-neutral-950/40 border border-var(--border) rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="text-[11.5px] font-extrabold text-white">{key.name}</h4>
                        <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${isRevoked ? "bg-red-950/20 text-red-400" : "bg-emerald-950/20 text-emerald-400"}`}>
                          {key.status}
                        </span>
                      </div>
                      
                      <div className="text-[9.5px] text-neutral-400 text-neutral-400 flex items-center gap-2 mt-0.5">
                        <span className="font-mono bg-[#0b0b0d] px-1.5 py-0.5 rounded font-black text-blue-400">{key.keyPrefix}</span>
                        <span>•</span>
                        <span>Expiry: {key.expires}</span>
                      </div>
                    </div>

                    {/* Manage actions buttons */}
                    <div className="flex items-center gap-1.5 self-end sm:self-auto text-[9.5px]">
                      
                      <button
                        onClick={() => handleRotateKey(key.id)}
                        disabled={isRevoked}
                        className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1 transition ${
                          isRevoked 
                            ? "border-var(--border) text-neutral-600 cursor-not-allowed" 
                            : "border-var(--border) bg-var(--bg-elevated)/60 text-neutral-400 hover:text-white"
                        }`}
                        title="Rotate Secret Token"
                      >
                        <RefreshCw className="w-3 h-3" /> Rotate
                      </button>

                      <button
                        onClick={() => handleRevokeKey(key.id)}
                        className={`px-2.5 py-1.5 rounded-lg border transition ${
                          isRevoked 
                            ? "bg-emerald-950/20 text-emerald-400 border-emerald-500/10" 
                            : "bg-red-950/10 text-red-400 border-red-500/10 hover:text-white"
                        }`}
                      >
                        {isRevoked ? "Reactivate" : "Revoke"}
                      </button>

                    </div>

                  </div>
                );
              })}
            </div>

          </div>

          <div className="bg-var(--bg-elevated)/20 p-3 rounded-xl border border-var(--border)">
            <p className="text-[10px] text-neutral-500 italic max-w-sm">
               Encryption: API keys are securely tokenized and hashed server-side utilizing robust security standards.
            </p>
          </div>

        </div>

        {/* Column B: Interactive Webhook Management Console */}
        <div id="webhook-management-console" className="bg-[#08080a] border border-var(--border) rounded-3xl p-6 flex flex-col justify-between space-y-5 font-sans text-xs">
          
          <div className="space-y-4">
            
            <div className="flex items-center justify-between border-b border-var(--border) pb-3">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Webhook className="w-4 h-4 text-blue-500" /> Webhook Management Console
                </h3>
                <p className="text-[10.5px] text-neutral-500 font-medium">Capture dynamic checkout settlements or lead generation transactions on foreign endpoints.</p>
              </div>
            </div>

            {/* Input target URL */}
            <div className="space-y-1.5">
              <label className="text-[9.5px] font-black uppercase text-neutral-400 tracking-wider">Destination Callback Endpoint URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="E.g. https://api.yoursite.com/webhook"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full bg-[#121215] border border-var(--border) text-white px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-blue-500/60"
                />
                <button
                  type="button"
                  onClick={handleTestWebhook}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black px-4 py-2.5 rounded-xl transition flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Send className="w-3 h-3" /> Test Webhook
                </button>
              </div>
            </div>

            {/* Multiselect Event Types check boxes */}
            <div className="space-y-2">
              <label className="text-[9.5px] font-black uppercase text-neutral-400 tracking-wider">Select Webhook Events To Trigger</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "lead.captured", label: " lead.captured" },
                  { id: "payment.completed", label: " payment.completed" },
                  { id: "appointment.booked", label: " appointment.booked" },
                  { id: "message.failed", label: " message.failed" }
                ].map((item) => {
                  const isChecked = selectedEvents.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleWebhookEvent(item.id)}
                      className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                        isChecked 
                          ? "bg-blue-950/10 border-blue-500/30 text-blue-400" 
                          : "bg-neutral-950/40 border-var(--border) text-neutral-500 hover:text-neutral-300"
                      }`}
                    >
                      <span className="font-mono text-[10.5px] font-semibold">{item.label}</span>
                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                        isChecked ? "bg-blue-600 border-blue-500 text-white" : "border-neutral-800"
                      }`}>
                        {isChecked && <Check className="w-2.5 h-2.5 stroke-[4.5]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Webhook logs console feed */}
            <div className="space-y-2">
              <span className="text-[9.5px] font-black uppercase text-neutral-400 tracking-wider flex items-center justify-between">
                <span>Outbound Callback Logs console</span>
                <span className="text-neutral-600 text-[8px] font-mono">Real-time deliveries</span>
              </span>
              
              <div className="bg-neutral-950/80 border border-var(--border) rounded-xl p-3 max-h-36 overflow-y-auto font-mono text-[9.5px] space-y-2 divider-neutral-900/60">
                {webhookLogs.length > 0 ? (
                  webhookLogs.map((log) => (
                    <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1 border-b border-var(--border)/60 last:border-0">
                      
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${log.status === 200 ? "bg-green-500" : "bg-red-500"}`} />
                        <span className="text-neutral-500">[{log.timestamp}]</span>
                        <span className="text-blue-400">{log.event}</span>
                      </div>

                      <div className="flex items-center gap-2 text-right self-end sm:self-auto">
                        <span className="text-neutral-600 truncate max-w-[120px]">{log.url}</span>
                        <span className={`font-black ${log.status === 200 ? "text-emerald-450" : "text-red-500"}`}>{log.status}</span>
                        <span className="text-neutral-500">({log.latency})</span>
                      </div>

                    </div>
                  ))
                ) : (
                  <p className="text-center text-neutral-600 py-3 italic">API webhook transaction backlog empty.</p>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* 7. INTEGRATIONS HEALTH MONITOR DIAGNOSTICS */}
      <div id="integrations-health-monitor" className="bg-[#08080a] border border-var(--border) rounded-3xl p-6 space-y-5 font-sans">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-950 pb-4">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-400" /> Continuous Integrations Health Monitor
            </h3>
            <p className="text-[10.5px] text-neutral-500 font-medium">Track connection latency, sync errors, and live message routing health diagnostics.</p>
          </div>

          <button
            onClick={() => {
              triggerNotification(" Re-verified all active integration API channels... Connection index is completely clean!");
            }}
            className="py-2 px-3.5 bg-var(--bg-elevated) hover:bg-var(--bg-elevated) hover:text-white border border-var(--border) rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer text-neutral-300"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Re-verify connections
          </button>
        </div>

        {/* Health status grids metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          
          <div className="p-4 bg-neutral-950/40 border border-var(--border) rounded-2xl">
            <span className="text-[8.5px] text-neutral-500 uppercase font-black">Connection status</span>
            <p className="text-xs font-black text-emerald-405 text-emerald-400 mt-1 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              6 Modules Connected
            </p>
          </div>

          <div className="p-4 bg-neutral-950/40 border border-var(--border) rounded-2xl">
            <span className="text-[8.5px] text-neutral-500 uppercase font-black">Failed Syncs (24h)</span>
            <p className="text-xs font-black text-white mt-1">1 captured</p>
            <p className="text-[9px] text-[#eab308] mt-0.5">Recovered by retry task</p>
          </div>

          <div className="p-4 bg-neutral-950/40 border border-var(--border) rounded-2xl">
            <span className="text-[8.5px] text-neutral-500 uppercase font-black">System Latency</span>
            <p className="text-xs font-black text-white mt-1">112ms avg</p>
            <p className="text-[9px] text-neutral-500 mt-0.5 font-mono">100% cloud response</p>
          </div>

          <div className="p-4 bg-neutral-950/40 border border-var(--border) rounded-2xl">
            <span className="text-[8.5px] text-neutral-500 uppercase font-black">Last Successful Sync</span>
            <p className="text-xs font-black text-blue-400 mt-1">Just now</p>
            <p className="text-[9px] text-neutral-500 mt-0.5">Automated cron verified</p>
          </div>

        </div>

        {/* Live Errors log board */}
        <div className="space-y-2">
          <h4 className="text-[10px] uppercase font-black text-neutral-400 tracking-wider">System Connection Warnings / Logs</h4>
          <div className="p-4 bg-neutral-950/50 border border-var(--border) rounded-xl space-y-3 font-mono text-[10px]">
            <div className="flex items-start gap-2.5 pb-2.5 border-b border-var(--border)/40">
              <span className="p-1 rounded bg-var(--bg-elevated) text-emerald-400 shrink-0"> RES</span>
              <div>
                <p className="text-neutral-300">Successfully locked scheduling slot for प्रिया पटेल (Priya Patel) on Google Calendar API.</p>
                <span className="text-neutral-600 text-[8.5px] mt-0.5 block">2026-06-20 11:15:02 UTC | Module: google-calendar | Latency: 120ms</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 pb-2.5 border-b border-var(--border)/40">
              <span className="p-1 rounded bg-var(--bg-elevated) text-emerald-400 shrink-0"> RES</span>
              <div>
                <p className="text-neutral-300">Successfully synced lead.captured event package with HubSpot Private CRM Deals pipeline.</p>
                <span className="text-neutral-600 text-[8.5px] mt-0.5 block">2026-06-20 11:12:05 UTC | Module: hubspot | Latency: 160ms</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="p-1 rounded bg-var(--bg-elevated) text-yellow-500 shrink-0"> ERR</span>
              <div>
                <p className="text-neutral-300">Target server failed callback validation for event payment.completed. Status code: 500 (Internal Server Error).</p>
                <span className="text-neutral-602 text-yellow-500/80 text-[8.5px] mt-0.5 block">2026-06-20 09:30:18 UTC | Module: webhook-api | Retry Queue: Attempt 1 Complete (Waiting next cycle)</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
