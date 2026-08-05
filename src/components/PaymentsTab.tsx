import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign, TrendingUp, Clock, CheckCircle2, AlertTriangle,
  ArrowUpRight, Search, Plus, RefreshCw, TrendingDown,
  Download, Mail, User, X, FileSpreadsheet, FileText,
  BadgeAlert, Power, Sliders, Settings, HelpCircle,
  FileDown, Sparkles, Smartphone, Check, CreditCard,
  QrCode, Link, Shield, Building, CheckCircle, ChevronRight,
  Copy, ExternalLink
} from "lucide-react";
import { getCurrentUser } from "../lib/auth";
import { sendSubscriptionEmail } from "../lib/emailService";

interface Transaction {
  id: string;
  customerName: string;
  amount: number;
  planName: string;
  paymentMethod: string;
  status: "Paid" | "Pending" | "Failed";
  date: string;
}

interface GatewayConfig {
  apiKey: string;
  secretKey: string;
  webhookSecret: string;
  merchantId: string;
  status: "Disconnected" | "Verifying" | "Connected";
}

export const PaymentsTab: React.FC<{
  onboardingData?: any;
  triggerNotification: (msg: string) => void;
}> = ({ onboardingData, triggerNotification }) => {
  const isDemoMode = typeof window !== "undefined" && window.location.search.includes("demo=true");
  const stats = isDemoMode ? {
    totalRevenue: "₹8,42,200",
    monthlyRevenue: "₹1,84,000",
    pendingPayments: "₹24,500",
    successfulPayments: "₹8,17,700"
  } : {
    totalRevenue: "₹0",
    monthlyRevenue: "₹0",
    pendingPayments: "₹0",
    successfulPayments: "₹0"
  };

  // Gateway integrations with localStorage persistence
  const [activeGateway, setActiveGateway] = useState<"Razorpay" | "PhonePe" | "Cashfree" | "Stripe">("Razorpay");
  const [gatewayConfigs, setGatewayConfigs] = useState<Record<string, GatewayConfig>>(() => {
    try {
      const saved = localStorage.getItem("autofy-gateways");
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      Razorpay: { apiKey: "", secretKey: "", webhookSecret: "", merchantId: "", status: "Disconnected" },
      PhonePe: { apiKey: "", secretKey: "", webhookSecret: "", merchantId: "", status: "Disconnected" },
      Cashfree: { apiKey: "", secretKey: "", webhookSecret: "", merchantId: "", status: "Disconnected" },
      Stripe: { apiKey: "", secretKey: "", webhookSecret: "", merchantId: "", status: "Disconnected" }
    };
  });

  const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState(false);
  const [rzpKeyId, setRzpKeyId] = useState(gatewayConfigs.Razorpay.apiKey || "");
  const [rzpKeySecret, setRzpKeySecret] = useState(gatewayConfigs.Razorpay.secretKey || "");

  // Sync state to local storage when gateway configuration changes
  useEffect(() => {
    localStorage.setItem("autofy-gateways", JSON.stringify(gatewayConfigs));
  }, [gatewayConfigs]);

  const handleSaveRazorpay = () => {
    if (!rzpKeyId || !rzpKeySecret) {
      triggerNotification(" Please enter both Razorpay Key ID and Secret Key.");
      return;
    }
    setGatewayConfigs(prev => ({
      ...prev,
      Razorpay: {
        apiKey: rzpKeyId,
        secretKey: rzpKeySecret,
        webhookSecret: "whsec_rzp_auto",
        merchantId: "MID_RZP_DEFAULT",
        status: "Connected"
      }
    }));
    setIsRazorpayModalOpen(false);
    triggerNotification(" Razorpay settings stored in local storage successfully!");
  };

  // UPI settings state
  const [upiId, setUpiId] = useState("autofy@hdfcbank");
  const [holderName, setHolderName] = useState("Autofy Tech Solutions Private Limited");
  const [bankName, setBankName] = useState("HDFC Bank Ltd");
  const [accNumber, setAccNumber] = useState("50200081293041");
  const [ifscCode, setIfscCode] = useState("HDFC0000081");
  const [selectedUpiQr, setSelectedUpiQr] = useState<string | null>(null);
  const [upiAmount, setUpiAmount] = useState(2999);
  const [upiStatus, setUpiStatus] = useState<"Pending" | "Completed" | "Failed">("Pending");

  const copyUpiId = () => {
    navigator.clipboard.writeText(upiId);
    triggerNotification(" UPI ID Copied to clipboard!");
  };

  // Pay links state
  const [payLinks, setPayLinks] = useState([
    { id: "LNK-910", name: "Sanjay Singhania", phone: "+91 81223 99881", amount: 45000, desc: "Ancillary exhaust fitments", expiry: "24 Hours" },
    { id: "LNK-812", name: "Ananya Saxena", phone: "+91 74011 22334", amount: 15600, desc: "ECU tuning downpayment", expiry: "12 Hours" }
  ]);
  const [linkName, setLinkName] = useState("");
  const [linkPhone, setLinkPhone] = useState("");
  const [linkAmount, setLinkAmount] = useState("");
  const [linkDesc, setLinkDesc] = useState("");
  const [linkExpiry, setLinkExpiry] = useState("24 Hours");

  const handleGenerateLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkName || !linkAmount) return;

    const newLink = {
      id: `LNK-${Math.floor(100 + Math.random() * 900)}`,
      name: linkName,
      phone: linkPhone || "No contact",
      amount: parseFloat(linkAmount),
      desc: linkDesc || "Autofy fast checkout",
      expiry: linkExpiry
    };

    setPayLinks([newLink, ...payLinks]);
    setLinkName("");
    setLinkPhone("");
    setLinkAmount("");
    setLinkDesc("");
    triggerNotification(` Created secure Paylink ₹${newLink.amount} for ${linkName}`);
  };

  // Invoices builder
  const [invoices, setInvoices] = useState([
    { invoiceNo: "INV-2026-001", customerName: "Vaibhav SG", company: "Vaibhav Tech", items: "Premium Consult + VIP Tuning", tax: 18, amount: 125000, status: "Paid", date: "2026-06-20" },
    { invoiceNo: "INV-2026-002", customerName: "Priya Patel", company: "Patel Gyms", items: "AC Trial Workspace Package", tax: 18, amount: 15000, status: "Pending", date: "2026-06-20" },
    { invoiceNo: "INV-2026-003", customerName: "Rohan Mehra", company: "Mehra Tuning Ltd", items: "Custom ECU Dyno Alignment", tax: 18, amount: 64000, status: "Paid", date: "2026-06-18" }
  ]);

  const [formInvoiceNo, setFormInvoiceNo] = useState("INV-2026-004");
  const [formCustomer, setFormCustomer] = useState("");
  const [formCompany, setFormCompany] = useState("");
  const [formItems, setFormItems] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formTax, setFormTax] = useState(18);
  const [formInvStatus, setFormInvStatus] = useState<"Paid" | "Pending">("Paid");
  const [invoicePreview, setInvoicePreview] = useState<any>(null);

  const handleAddInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCustomer || !formAmount) return;

    const newInv = {
      invoiceNo: formInvoiceNo,
      customerName: formCustomer,
      company: formCompany || "Individual Client",
      items: formItems || "Consultation Service",
      tax: Number(formTax),
      amount: parseFloat(formAmount),
      status: formInvStatus,
      date: new Date().toISOString().split("T")[0]
    };

    setInvoices([newInv, ...invoices]);
    setFormCustomer("");
    setFormCompany("");
    setFormItems("");
    setFormAmount("");
    setFormInvoiceNo(`INV-2026-00${invoices.length + 5}`);
    triggerNotification(` Generated Professional Invoice ${newInv.invoiceNo}`);
  };

  // Transactions ledger state
  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: "TXN-902183", customerName: "Vaibhav SG", amount: 125000, planName: "Enterprise Tier", paymentMethod: "Card (Stripe)", status: "Paid", date: "2026-06-20" },
    { id: "TXN-902184", customerName: "Priya Patel", amount: 15000, planName: "Pro Tier", paymentMethod: "UPI (PhonePe)", status: "Pending", date: "2026-06-20" },
    { id: "TXN-902185", customerName: "Ananya Saxena", amount: 15600, planName: "Pro Tier", paymentMethod: "UPI (GPay)", status: "Paid", date: "2026-06-20" },
    { id: "TXN-902186", customerName: "Kunal Verma", amount: 24500, planName: "Starter Tier", paymentMethod: "NetBanking", status: "Failed", date: "2026-06-18" },
    { id: "TXN-902187", customerName: "Sanjay Singhania", amount: 45000, planName: "Pro Tier", paymentMethod: "Stripe Escrow", status: "Paid", date: "2026-06-19" },
    { id: "TXN-902188", customerName: "Rohan Mehra", amount: 64000, planName: "Enterprise Tier", paymentMethod: "Razorpay Checkout", status: "Paid", date: "2026-06-18" }
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterState, setFilterState] = useState<"All" | "Paid" | "Pending" | "Failed">("All");

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || tx.id.includes(searchQuery);
    const matchesStatus = filterState === "All" || tx.status === filterState;
    return matchesSearch && matchesStatus;
  });

  const subscriptionPlans = [
    { name: "Starter Lite", price: "₹999", msgs: "500", responses: "AI Assistant", members: "1 User", support: "Email Support", popular: false },
    { name: "Professional Pro", price: "₹2,499", msgs: "Unlimited", responses: "Instant RAG GPT", members: "5 Users", support: "Priority Chat", popular: true },
    { name: "Enterprise Custom", price: "Custom", msgs: "Unlimited", responses: "Custom Trained Finetuned", members: "Unlimited", support: "Dedicated Account Manager", popular: false }
  ];

  const handleChoosePlan = async (selectedPlan: typeof subscriptionPlans[0]) => {
    triggerNotification(`Processing payment for ${selectedPlan.name}...`);
    try {
      const { user: currentUser } = await getCurrentUser();
      if (!currentUser) {
        triggerNotification(" Error: No logged in user found to assign plan.");
        return;
      }
      
      const getRenewalDate = (duration: string) => {
        const d = new Date();
        if (duration === "Annual") {
          d.setFullYear(d.getFullYear() + 1);
        } else {
          d.setMonth(d.getMonth() + 1);
        }
        return d.toLocaleDateString('en-IN');
      };

      const planPriceNum = selectedPlan.price.replace("₹", "");
      const duration = selectedPlan.name.includes("Enterprise") ? "Annual" : "Monthly";
      const paymentMethod = "Razorpay Checkout (UPI)";
      const paymentResponse = { transactionId: "TXN-" + Math.floor(Math.random() * 89999 + 10000) };

      const emailResponse = await sendSubscriptionEmail({
        userEmail: currentUser.email || "demo@autofy.in",
        userName: currentUser.user_metadata?.full_name || "Valued Customer",
        businessName: onboardingData?.businessName || currentUser.user_metadata?.business_name || "Your Business",
        planName: selectedPlan.name,
        planPrice: selectedPlan.price,
        planDuration: duration,
        startDate: new Date().toLocaleDateString('en-IN'),
        renewalDate: getRenewalDate(duration),
        paymentMethod: paymentMethod,
        transactionId: paymentResponse.transactionId,
      });

      if (emailResponse.success) {
        triggerNotification(` Payment Confirmed! Welcome/confirmation email sent to ${currentUser.email}.`);
      } else {
        triggerNotification(` Payment Confirmed! (Failed to send email to ${currentUser.email})`);
      }

      // Add transaction to local history
      const newTx: Transaction = {
        id: paymentResponse.transactionId,
        customerName: currentUser.user_metadata?.full_name || "Valued Customer",
        amount: selectedPlan.price === "Custom" ? 0 : parseInt(planPriceNum.replace(",", "")),
        planName: selectedPlan.name,
        paymentMethod: paymentMethod,
        status: "Paid",
        date: new Date().toISOString().split("T")[0]
      };
      setTransactions(prev => [newTx, ...prev]);

    } catch (err: any) {
      console.error(err);
      triggerNotification(" Plan checkout simulation failed.");
    }
  };

  return (
    <div id="payments-management-panel" className="space-y-6 font-sans" style={{ color: "var(--text)" }}>
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2" style={{ color: "var(--text)" }}>
          <CreditCard className="w-5 h-5" style={{ color: "var(--brand)" }} />
          Payments &amp; Billing
        </h2>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          Accept customer payments, configure checkout pipelines, verify settlements, and track subscriptions.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue Generated", val: stats.totalRevenue, icon: DollarSign, color: "var(--brand-subtle)", iconColor: "text-pink-500" },
          { label: "Current Monthly Billing", val: stats.monthlyRevenue, icon: TrendingUp, color: "rgba(34,197,94,0.12)", iconColor: "text-emerald-500" },
          { label: "Pending Escrow Invoices", val: stats.pendingPayments, icon: Clock, color: "rgba(245,158,11,0.12)", iconColor: "text-amber-500" },
          { label: "Pristine Successful Clears", val: stats.successfulPayments, icon: CheckCircle2, color: "rgba(59,130,246,0.12)", iconColor: "text-blue-500" }
        ].map((met, i) => {
          const Icon = met.icon;
          return (
            <div key={i} className="p-5 glass-card rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider font-sans" style={{ color: "var(--text-subtle)" }}>{met.label}</p>
                <h4 className="text-2xl font-black mt-1.5 font-display" style={{ color: "var(--text)" }}>{met.val}</h4>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border border-current/20 ${met.iconColor}`} style={{ background: met.color }}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* UPI QR Display Card + Razorpay Integration Setup */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* UPI QR Code card */}
        <div className="p-6 glass-card rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <QrCode className="w-4.5 h-4.5" style={{ color: "var(--brand)" }} />
                Instant UPI QR Code Checkout
              </h3>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>Simulate active customer invoice scanning screen</p>
            </div>

            {/* Status dot */}
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase" style={{
              background: upiStatus === "Completed" ? "rgba(34,197,94,0.1)" : upiStatus === "Pending" ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)",
              color: upiStatus === "Completed" ? "var(--success)" : upiStatus === "Pending" ? "var(--warning)" : "var(--danger)"
            }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{
                background: upiStatus === "Completed" ? "var(--success)" : upiStatus === "Pending" ? "var(--warning)" : "var(--danger)"
              }} />
              {upiStatus}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-5 items-center bg-[var(--bg-elevated)]/30 p-5 rounded-2xl border border-[var(--border)]">
            {/* SVG Stylized QR code */}
            <div className="w-36 h-36 bg-white p-3 rounded-2xl flex items-center justify-center relative shrink-0 shadow-lg shadow-black/40">
              <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* QR Finder patterns */}
                <rect x="0" y="0" width="28" height="28" fill="#000" rx="3" />
                <rect x="5" y="5" width="18" height="18" fill="#FFF" rx="2" />
                <rect x="9" y="9" width="10" height="10" fill="#000" rx="1" />

                <rect x="72" y="0" width="28" height="28" fill="#000" rx="3" />
                <rect x="77" y="5" width="18" height="18" fill="#FFF" rx="2" />
                <rect x="81" y="9" width="10" height="10" fill="#000" rx="1" />

                <rect x="0" y="72" width="28" height="28" fill="#000" rx="3" />
                <rect x="5" y="77" width="18" height="18" fill="#FFF" rx="2" />
                <rect x="9" y="81" width="10" height="10" fill="#000" rx="1" />

                {/* Simulated random QR grid patterns */}
                <rect x="36" y="4" width="8" height="8" fill="#000" />
                <rect x="52" y="12" width="12" height="4" fill="#000" />
                <rect x="44" y="24" width="16" height="4" fill="#000" />
                <rect x="36" y="36" width="12" height="12" fill="#000" />
                <rect x="60" y="44" width="8" height="16" fill="#000" />
                <rect x="12" y="36" width="16" height="8" fill="#000" />
                <rect x="16" y="52" width="8" height="12" fill="#000" />
                <rect x="76" y="76" width="20" height="20" fill="#000" />
                <rect x="81" y="81" width="10" height="10" fill="#FFF" />
                <rect x="85" y="85" width="2" height="2" fill="#000" />
                <rect x="40" y="72" width="16" height="16" fill="#000" />
                <rect x="60" y="80" width="8" height="8" fill="#000" />
              </svg>
              {/* Floating scanner bar if pending */}
              {upiStatus === "Pending" && (
                <div style={{
                  position: "absolute", left: 8, right: 8, height: 3,
                  background: "var(--brand)", boxShadow: "0 0 8px var(--brand)",
                  animation: "upi-scan 2s infinite ease-in-out"
                }} />
              )}
            </div>

            <div className="flex-1 space-y-3 w-full">
              <div>
                <p className="text-[9.5px] uppercase font-bold" style={{ color: "var(--text-muted)" }}>Total Due Amount</p>
                <div className="text-2xl font-extrabold" style={{ color: "var(--text)" }}>₹{upiAmount.toLocaleString()}</div>
              </div>

              <div className="space-y-1">
                <p className="text-[9.5px] uppercase font-bold" style={{ color: "var(--text-muted)" }}>UPI Address (VPA)</p>
                <div className="flex items-center gap-2 bg-[var(--bg-elevated)]/60 p-2 rounded-xl border border-[var(--border)]">
                  <span className="font-mono text-xs text-[var(--text)] select-all">{upiId}</span>
                  <button onClick={copyUpiId} className="p-1 hover:text-[var(--text)] transition cursor-pointer" style={{ color: "var(--text-muted)" }}>
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => {
                  triggerNotification(" Secure checkout payload generated & sent to WhatsApp sandbox!");
                }} className="flex-1 py-2 rounded-xl text-[10.5px] font-bold text-center flex items-center justify-center gap-1 cursor-pointer transition text-[var(--text)] hover:opacity-90"
                  style={{ background: "var(--brand)" }}>
                  <ExternalLink className="w-3 h-3" />
                  Share Payment Link
                </button>
                <button onClick={() => {
                  const nextStatus = upiStatus === "Pending" ? "Completed" : upiStatus === "Completed" ? "Failed" : "Pending";
                  setUpiStatus(nextStatus);
                  triggerNotification(`Status updated to: ${nextStatus}`);
                }} className="py-2 px-3 bg-[var(--bg-elevated)] border border-[var(--border)] hover:text-[var(--text)] rounded-xl text-[10px] font-bold uppercase transition cursor-pointer text-[var(--text-muted)]">
                  Cycle Status
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Gateway setups with Razorpay configuration */}
        <div className="p-6 bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-4.5 h-4.5" style={{ color: "var(--brand)" }} />
                Commercial Payment Gateways
              </h3>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>Configure instant legal checkouts</p>
            </div>
            {/* Show green checkmark if saved */}
            {gatewayConfigs.Razorpay.status === "Connected" && (
              <div className="flex items-center gap-1 text-[11px] font-black text-green-400 uppercase tracking-widest bg-green-500/10 border border-green-500/20 px-2.5 py-0.5 rounded-full">
                <Check className="w-3.5 h-3.5" /> Razorpay Active
              </div>
            )}
          </div>

          <div className="space-y-4">
            <p className="text-xs" style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>
              Autofy supports third-party checkout flows natively. Easily connect your Razorpay merchant key to trigger instant invoice payments.
            </p>

            <div className="p-4 bg-[var(--bg-elevated)]/30 rounded-2xl border border-[var(--border)] space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-[var(--text)]">Razorpay Checkout Handshake</h4>
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {gatewayConfigs.Razorpay.status === "Connected" ? "Key ID: " + gatewayConfigs.Razorpay.apiKey.slice(0, 10) + "..." : "Not connected"}
                  </p>
                </div>
                <button onClick={() => setIsRazorpayModalOpen(true)} className="px-4 py-2 bg-[#8B5CF6] hover:bg-[#6B51EF] text-[var(--text)] text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  Connect Razorpay
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Subscription plans table comparison */}
      <div className="p-6 bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl space-y-4">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4.5 h-4.5" style={{ color: "var(--brand)" }} />
            Subscription plans comparison table
          </h3>
          <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>Compare core operational tiers for your business</p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr style={{ background: "var(--input-bg)", borderBottom: "1px solid var(--border)" }}>
                <th className="p-4 font-bold text-[11px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Plan Name</th>
                <th className="p-4 font-bold text-[11px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Price / Month</th>
                <th className="p-4 font-bold text-[11px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>WhatsApp Messages</th>
                <th className="p-4 font-bold text-[11px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>AI Responses</th>
                <th className="p-4 font-bold text-[11px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Team Members</th>
                <th className="p-4 font-bold text-[11px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Support Level</th>
                <th className="p-4 font-bold text-[11px] uppercase tracking-wider text-right" style={{ color: "var(--text-muted)" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscriptionPlans.map((p, idx) => (
                <tr key={idx} style={{
                  borderBottom: idx < subscriptionPlans.length - 1 ? "1px solid var(--border)" : "none",
                  background: p.popular ? "rgba(139,92,246,0.03)" : "transparent",
                  borderLeft: p.popular ? "3px solid #8B5CF6" : "none"
                }} className="hover:bg-[var(--bg-elevated)]/10 transition-colors">
                  <td className="p-4 font-bold text-[var(--text)] flex items-center gap-2">
                    {p.name}
                    {p.popular && (
                      <span className="bg-[#8B5CF6] text-[var(--text)] text-[8px] font-black uppercase px-2 py-0.5 rounded-full">
                        Most Popular
                      </span>
                    )}
                  </td>
                  <td className="p-4 font-mono font-bold text-[var(--text)]">{p.price}</td>
                  <td className="p-4 text-[var(--text)]">{p.msgs}</td>
                  <td className="p-4 text-[var(--text)]">{p.responses}</td>
                  <td className="p-4 text-[var(--text)]">{p.members}</td>
                  <td className="p-4 text-[var(--text)]">{p.support}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleChoosePlan(p)}
                      className="px-3.5 py-1.5 text-[10px] font-bold rounded-lg cursor-pointer transition uppercase text-[var(--text)]"
                      style={{
                        background: p.popular ? "#8B5CF6" : "var(--input-bg)",
                        border: p.popular ? "none" : "1px solid var(--border)",
                      }}>
                      Choose Plan
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction payment history table */}
      <div className="p-6 bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs leading-normal">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider">Payment history ledger</h3>
            <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>Verify detailed transaction records</p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="w-3.5 h-3.5 text-[var(--text-subtle)] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                placeholder="Search by customer..."
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-40 bg-[#07070a] border border-[var(--border)] pl-8 pr-3 py-1.5 rounded-xl text-xs text-[var(--text)] focus:outline-none"
              />
            </div>

            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value as any)}
              className="bg-[#07070a] border border-[var(--border)] px-2.5 py-1.5 rounded-xl text-xs text-[var(--text-muted)] focus:outline-none cursor-pointer"
            >
              <option value="All">All Transactions</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr style={{ background: "var(--input-bg)", borderBottom: "1px solid var(--border)" }} className="text-[9px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
                <th className="p-3">Date</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Plan / Description</th>
                <th className="p-3 font-mono">Amount (₹)</th>
                <th className="p-3">Method</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx, idx) => (
                <tr key={tx.id} style={{
                  background: idx % 2 === 1 ? "rgba(255,255,255,0.015)" : "transparent",
                  borderBottom: "1px solid var(--border)"
                }} className="hover:bg-[rgba(255,255,255,0.025)] transition-colors">
                  <td className="p-3 text-[var(--text-muted)] font-semibold">{tx.date}</td>
                  <td className="p-3 font-bold text-[var(--text)]">{tx.customerName}</td>
                  <td className="p-3 text-[var(--text)] font-semibold">{tx.planName}</td>
                  <td className="p-3 font-mono text-[var(--text)] font-bold">₹{tx.amount.toLocaleString()}</td>
                  <td className="p-3 text-[var(--text-muted)] font-semibold">{tx.paymentMethod}</td>
                  <td className="p-3">
                    <span className="px-3.5 py-1 rounded-full text-[11px] font-bold uppercase" style={{
                      background: tx.status === "Paid" ? "rgba(34,197,94,0.12)" : tx.status === "Pending" ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.12)",
                      color: tx.status === "Paid" ? "var(--success)" : tx.status === "Pending" ? "var(--warning)" : "var(--danger)"
                    }}>{tx.status}</span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => {
                        setInvoicePreview({ invoiceNo: `INV-${tx.id.split("-")[1]}`, customerName: tx.customerName, company: "Individual Client", items: tx.planName, amount: tx.amount, tax: 18, status: tx.status, date: tx.date });
                        triggerNotification(`Loaded checkout receipt metadata for receipt preview.`);
                      }}
                      className="px-2 py-1 text-[10px] font-bold text-blue-500 hover:text-[var(--text)] hover:bg-blue-600 rounded-lg cursor-pointer border border-blue-500/20"
                    >
                      Receipt details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="block md:hidden space-y-3">
          {filteredTransactions.map(tx => (
            <div key={tx.id} className="p-4 bg-[var(--bg-elevated)]/40 border border-[var(--border)] rounded-2xl space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{tx.date}</p>
                  <h4 className="text-xs font-bold text-[var(--text)]">{tx.customerName}</h4>
                  <p className="text-[11px] text-[var(--text)] mt-0.5">{tx.planName}</p>
                </div>
                <span className="px-3.5 py-1 rounded-full text-[11px] font-bold uppercase" style={{
                  background: tx.status === "Paid" ? "rgba(34,197,94,0.12)" : tx.status === "Pending" ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.12)",
                  color: tx.status === "Paid" ? "var(--success)" : tx.status === "Pending" ? "var(--warning)" : "var(--danger)"
                }}>{tx.status}</span>
              </div>
              <div className="flex justify-between items-center pt-2.5 border-t border-[var(--border)]/60 text-xs">
                <div>
                  <span className="block text-[9.5px] uppercase font-bold" style={{ color: "var(--text-muted)" }}>Amount &amp; Method</span>
                  <span className="font-mono font-bold text-[var(--text)]">₹{tx.amount.toLocaleString()}</span>
                  <span className="text-[10px] ml-1.5" style={{ color: "var(--text-muted)" }}>({tx.paymentMethod})</span>
                </div>
                <button
                  onClick={() => {
                    setInvoicePreview({ invoiceNo: `INV-${tx.id.split("-")[1]}`, customerName: tx.customerName, company: "Individual Client", items: tx.planName, amount: tx.amount, tax: 18, status: tx.status, date: tx.date });
                  }}
                  className="px-3 py-1 bg-[var(--bg-elevated)] border border-[var(--border)] text-blue-500 rounded-lg text-[10px] font-bold uppercase transition"
                >
                  Receipt
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RAZORPAY MODAL CONFIGURATION */}
      <AnimatePresence>
        {isRazorpayModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-full max-w-md bg-[#0a0a10] border border-[var(--border)] rounded-3xl p-8 relative"
            >
              <button onClick={() => setIsRazorpayModalOpen(false)} className="absolute right-5 top-5 p-1 text-[var(--text-subtle)] hover:text-[var(--text)] rounded-xl transition">
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-500" />
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-[var(--text)]">Connect Razorpay Gateway</h3>
                </div>
                <p className="text-xs text-[var(--text-muted)]">Configure public Key ID and secret hashes to accept instant orders.</p>

                <div className="space-y-3.5 pt-2">
                  <div className="space-y-1">
                    <label className="text-[9.5px] uppercase font-bold text-[var(--text-subtle)]">Razorpay Key ID</label>
                    <input
                      type="text"
                      value={rzpKeyId}
                      onChange={e => setRzpKeyId(e.target.value)}
                      placeholder="rzp_live_xxxxxxxxxxxxxx"
                      className="w-full bg-[#07070a] border border-[var(--border)] p-2.5 rounded-xl text-xs text-[var(--text)] focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9.5px] uppercase font-bold text-[var(--text-subtle)]">Razorpay Key Secret</label>
                    <input
                      type="password"
                      value={rzpKeySecret}
                      onChange={e => setRzpKeySecret(e.target.value)}
                      placeholder="Secret Key hash..."
                      className="w-full bg-[#07070a] border border-[var(--border)] p-2.5 rounded-xl text-xs text-[var(--text)] focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3.5 pt-4">
                  <button onClick={() => setIsRazorpayModalOpen(false)} className="flex-1 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)] text-xs font-bold cursor-pointer">
                    Cancel
                  </button>
                  <button onClick={handleSaveRazorpay} className="flex-1 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#6B51EF] text-[var(--text)] text-xs font-bold cursor-pointer">
                    Save settings
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Invoice details preview Modal */}
      <AnimatePresence>
        {invoicePreview && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-full max-w-md bg-[#0a0a10] border border-[var(--border)] rounded-3xl p-8 relative font-sans text-xs"
            >
              <button
                onClick={() => setInvoicePreview(null)}
                className="absolute right-5 top-5 p-1 text-[var(--text-subtle)] hover:text-[var(--text)] rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>

              <span className="text-[9px] uppercase font-black tracking-widest text-blue-400">Autofy commercial billings</span>
              
              <div className="mt-4 p-4.5 p-4 bg-[var(--bg-elevated)]/40 border border-[var(--border)] rounded-2xl space-y-4 font-sans text-[11.5px]">
                <div className="flex justify-between items-start pb-3.5 border-b border-[var(--border)]">
                  <div>
                    <h4 className="font-extrabold text-[var(--text)] text-[13px]">{invoicePreview.company}</h4>
                    <p className="text-[10px] text-[var(--text-muted)]">Tax Registration Ledger</p>
                  </div>
                  <div className="text-right font-mono">
                    <p className="font-black text-[var(--text)]">{invoicePreview.invoiceNo}</p>
                    <p className="text-[9.5px] text-[var(--text-subtle)]">{invoicePreview.date}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[var(--text-subtle)] font-bold text-[9.5px] uppercase">Bill To Recipient:</p>
                  <p className="text-[var(--text)] font-extrabold text-[12px]">{invoicePreview.customerName}</p>
                </div>

                <div className="py-2 border-b border-[var(--border)] space-y-1.5">
                  <p className="text-[var(--text-subtle)] font-bold text-[9.5px] uppercase">Service description:</p>
                  <div className="flex justify-between font-medium">
                    <span className="text-[var(--text)] font-semibold">{invoicePreview.items}</span>
                    <span className="font-mono text-[var(--text)]">₹{invoicePreview.amount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between font-medium text-[var(--text-muted)]">
                    <span>SGST + CGST rate ({invoicePreview.tax}%)</span>
                    <span className="font-mono">₹{(invoicePreview.amount * (invoicePreview.tax / 100)).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-black text-[var(--text)] text-[13.5px] pt-1.5 border-t border-[var(--border)]/60">
                    <span>Grand Total (INR)</span>
                    <span className="font-mono text-blue-400">₹{(invoicePreview.amount * (1 + invoicePreview.tax / 100)).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 pt-4 border-t border-[var(--border)]/60 mt-4">
                <button
                  onClick={() => triggerNotification(`Receipt successfully sent to ${invoicePreview.customerName} via WhatsApp`)}
                  className="py-2.5 bg-[var(--bg-card)] border border-[var(--border)] hover:bg-[var(--bg-elevated)] rounded-xl text-[var(--text)] font-bold text-[10px] uppercase cursor-pointer"
                >
                  Send WhatsApp
                </button>
                <button
                  onClick={() => triggerNotification(`Receipt successfully sent to ${invoicePreview.customerName} via Email`)}
                  className="py-2.5 bg-[var(--bg-card)] border border-[var(--border)] hover:bg-[var(--bg-elevated)] rounded-xl text-[var(--text)] font-bold text-[10px] uppercase cursor-pointer"
                >
                  Send Email
                </button>
                <button
                  onClick={() => {
                    triggerNotification(" Simulated successful download of grand PDF invoice directly downstream.");
                    setInvoicePreview(null);
                  }}
                  className="py-2.5 bg-[#8B5CF6] hover:bg-[#6B51EF] rounded-xl text-[var(--text)] font-extrabold text-[10px] uppercase cursor-pointer flex items-center justify-center gap-1"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  PDF Down
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes upi-scan {
          0% { top: 8px; }
          50% { top: calc(100% - 11px); }
          100% { top: 8px; }
        }
      `}</style>
    </div>
  );
};
