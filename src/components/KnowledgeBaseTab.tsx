import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Database,
  Plus,
  Trash2,
  Upload,
  Globe,
  FileText,
  BadgeAlert,
  Search,
  Sparkles,
  Check,
  ChevronRight,
  TrendingUp,
  Award,
  AlertCircle,
  Clock,
  Briefcase,
  HelpCircle,
  FileCheck,
  ShieldCheck,
  Zap,
  Info
} from "lucide-react";
import { OnboardingData } from "../types";

interface KnowledgeBaseTabProps {
  onboardingData: OnboardingData;
  triggerNotification: (text: string) => void;
  onUpdateKnowledge?: (updatedData: Partial<OnboardingData>) => void;
  [key: string]: any;
}

interface ServiceItem {
  id: string;
  name: string;
  price: string;
  duration: string;
  status: "Active" | "Inactive";
}

interface ProductItem {
  id: string;
  name: string;
  category: string;
  price: string;
  stockQuantity: number;
  isAvailable: boolean;
  description: string;
  imagesCount: number;
}

interface MembershipPlan {
  id: string;
  name: string;
  duration: string;
  price: string;
  benefits: string;
  isAvailable: boolean;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  priority: "High" | "Medium" | "Low";
}

interface BusinessPolicies {
  refundPolicy: string;
  cancellationPolicy: string;
  workingHours: string;
  deliveryPolicy: string;
  shippingPolicy: string;
}

interface UploadedDoc {
  id: string;
  name: string;
  uploadDate: string;
  pagesProcessed: number;
  knowledgeExtracted: string;
}

export const KnowledgeBaseTab: React.FC<KnowledgeBaseTabProps> = ({
  onboardingData,
  triggerNotification,
  onUpdateKnowledge
}) => {
  // Auto-save feedback indicators
  const [saveStatus, setSaveStatus] = useState<"Saved" | "Saving..." | "Idle">("Saved");

  // State for all sections to meet data-driven interactive goals
  const [activeSubTab, setActiveSubTab] = useState<
    "services" | "products" | "memberships" | "faqs" | "policies" | "documents"
  >("services");

  // Initial Services List
  const [services, setServices] = useState<ServiceItem[]>([
    { id: "s-1", name: "Personal Training Session", price: "₹2,500", duration: "Monthly", status: "Active" },
    { id: "s-2", name: "Elite Group Crossfit", price: "₹4,500", duration: "Quarterly", status: "Active" },
    { id: "s-3", name: "Yoga & Guided Meditation", price: "₹1,200", duration: "Monthly", status: "Active" },
    { id: "s-4", name: "Nutrition Counseling Session", price: "₹800", duration: "Per Hour", status: "Inactive" }
  ]);

  // Products Section
  const [products, setProducts] = useState<ProductItem[]>([
    {
      id: "p-1",
      name: "AEW Exhaust V3",
      category: "Motorcycle Accessories",
      price: "₹6,500",
      stockQuantity: 12,
      isAvailable: true,
      description: "Premium mild-steel sound exhaust specifically designed for Royal Enfield Meteor and GT 650.",
      imagesCount: 4
    },
    {
      id: "p-2",
      name: "Organic Whey Isolate",
      category: "Supplements",
      price: "₹3,900",
      stockQuantity: 28,
      isAvailable: true,
      description: "Ultra-pure fast absorbing protein isolate to enhance muscle protein synthesis.",
      imagesCount: 2
    },
    {
      id: "p-3",
      name: "Autofit Resistance Loop",
      category: "Gym Gear",
      price: "₹450",
      stockQuantity: 150,
      isAvailable: true,
      description: "Heavy-duty latex resistance belt for lower-body dynamic warmups.",
      imagesCount: 1
    }
  ]);

  // Membership Plans
  const [memberships, setMemberships] = useState<MembershipPlan[]>([
    {
      id: "m-1",
      name: "3 Month Premium AC Membership",
      duration: "3 Months",
      price: "₹5,000",
      benefits: "Unlimited Gym Access, Fully Air Conditioned, 3 Free Coach Reviews",
      isAvailable: true
    },
    {
      id: "m-2",
      name: "6 Month Elite Membership",
      duration: "6 Months",
      price: "₹9,000",
      benefits: "All Standard Privileges, Locker Access, Complimentary Hydration Package",
      isAvailable: true
    },
    {
      id: "m-3",
      name: "Annual VIP Pass",
      duration: "1 Year",
      price: "₹16,000",
      benefits: "Locker, Free Personal Training 10 sessions, Steam Sauna and Spa access",
      isAvailable: false
    }
  ]);

  // FAQs
  const [faqs, setFaqs] = useState<FAQItem[]>([
    {
      id: "f-1",
      question: "What are your gym timings?",
      answer: "We are open from 6:00 AM to 10:00 PM, Monday through Saturday. Sunday matches holiday hours of 8:00 AM to 1:00 PM.",
      category: "Timings",
      priority: "High"
    },
    {
      id: "f-2",
      question: "Do you offer personal training?",
      answer: "Yes, we have certified fitness professionals available for custom personal coaching starting at ₹2,500 monthly.",
      category: "Services",
      priority: "High"
    },
    {
      id: "f-3",
      question: "Do you provide parking?",
      answer: "We have dedicated basement parking space for up to 30 two-wheelers and 8 cars. Parking is free for all active members.",
      category: "Rules",
      priority: "Medium"
    }
  ]);

  // Business Policies
  const [policies, setPolicies] = useState<BusinessPolicies>({
    refundPolicy: onboardingData.knowledgeText.pricing || "Refund is offered within 7 days of subscription, subject to non-consumption of sessions.",
    cancellationPolicy: "Appointments can be cancelled or rescheduled up to 4 hours in advance with zero penalty fees.",
    workingHours: "Monday - Saturday: 6:00 AM to 10:00 PM. Sundays: 8:00 AM to 1:00 PM.",
    deliveryPolicy: "Accessories and gears are packaged and dispatched within 24 hours. Local deliveries in Bengaluru completed same-day.",
    shippingPolicy: "We ship AEW exhaust options PAN-India with free shipping. Transit takes approximately 3-5 business days."
  });

  // Uploaded Documents List
  const [documents, setDocuments] = useState<UploadedDoc[]>([
    {
      id: "doc-1",
      name: "autofit_studio_policy_2026.pdf",
      uploadDate: "Log Date: 2026-06-15",
      pagesProcessed: 14,
      knowledgeExtracted: "Extracted 32 FAQ nodes regarding locker key access, cancellation constraints, and coach allocation."
    },
    {
      id: "doc-2",
      name: "AEW_product_manual_meteor650.txt",
      uploadDate: "Log Date: 2026-06-18",
      pagesProcessed: 1,
      knowledgeExtracted: "Extracted installation procedures, sound profile levels, dB killer specs, and 1-year product warranty terms."
    }
  ]);

  // Auto-Save Trigger simulation whenever state variables are changed
  const triggerAutoSaveFeedback = () => {
    setSaveStatus("Saving...");
    setTimeout(() => {
      setSaveStatus("Saved");
    }, 800);
  };

  // AI Knowledge Tester State
  const [testQuestion, setTestQuestion] = useState("");
  const [testResult, setTestResult] = useState<{
    answer: string;
    source: string;
    confidence: string;
    time: string;
  } | null>(null);
  const [testingLoader, setTestingLoader] = useState(false);

  // Form Adding temporary states for modals
  const [isAddingSvc, setIsAddingSvc] = useState(false);
  const [newSvcName, setNewSvcName] = useState("");
  const [newSvcPrice, setNewSvcPrice] = useState("");
  const [newSvcDuration, setNewSvcDuration] = useState("Monthly");

  const [isAddingProd, setIsAddingProd] = useState(false);
  const [newProdName, setNewProdName] = useState("");
  const [newProdCategory, setNewProdCategory] = useState("Aviation/Equipments");
  const [newProdPrice, setNewProdPrice] = useState("");
  const [newProdStock, setNewProdStock] = useState<number>(10);
  const [newProdDesc, setNewProdDesc] = useState("");
  const [newProdImages, setNewProdImages] = useState(4);

  const [isAddingPlan, setIsAddingPlan] = useState(false);
  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanPrice, setNewPlanPrice] = useState("");
  const [newPlanDuration, setNewPlanDuration] = useState("Monthly");
  const [newPlanBenefits, setNewPlanBenefits] = useState("");

  const [isAddingFaq, setIsAddingFaq] = useState(false);
  const [newFaqQ, setNewFaqQ] = useState("");
  const [newFaqA, setNewFaqA] = useState("");
  const [newFaqCat, setNewFaqCat] = useState("Billing");
  const [newFaqPri, setNewFaqPri] = useState<"High" | "Medium" | "Low">("Medium");

  // Drag and drop mock
  const [dragOver, setDragOver] = useState(false);

  // Auto-save effect
  useEffect(() => {
    // Notify updates back to main App.tsx components (if handler is present)
    if (onUpdateKnowledge) {
      onUpdateKnowledge({
        knowledgeText: {
          services: services.map(s => `${s.name} (${s.price} - ${s.duration})`).join("\n"),
          pricing: memberships.map(m => `${m.name}: ${m.price}`).join("\n") + `\nRefund: ${policies.refundPolicy}`,
          faqs: faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join("\n"),
          memberships: memberships.map(m => `${m.name}: ${m.price}`).join("\n"),
          policies: `Refund: ${policies.refundPolicy}\nCancellation: ${policies.cancellationPolicy}`
        }
      });
    }
  }, [services, products, memberships, faqs, policies]);

  // Services handlers
  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSvcName || !newSvcPrice) return;
    const item: ServiceItem = {
      id: `svc-${Date.now()}`,
      name: newSvcName,
      price: newSvcPrice.startsWith("₹") ? newSvcPrice : `₹${newSvcPrice}`,
      duration: newSvcDuration,
      status: "Active"
    };
    setServices(prev => [item, ...prev]);
    setNewSvcName("");
    setNewSvcPrice("");
    setIsAddingSvc(false);
    triggerAutoSaveFeedback();
    triggerNotification(` Added Premium Service Node: ${item.name}`);
  };

  const deleteService = (id: string, name: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
    triggerAutoSaveFeedback();
    triggerNotification(` Deleted Service: ${name}`);
  };

  // Products handlers
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdPrice) return;
    const item: ProductItem = {
      id: `prod-${Date.now()}`,
      name: newProdName,
      category: newProdCategory,
      price: newProdPrice.startsWith("₹") ? newProdPrice : `₹${newProdPrice}`,
      stockQuantity: newProdStock,
      isAvailable: true,
      description: newProdDesc || "High reliability professional accessory item",
      imagesCount: newProdImages
    };
    setProducts(prev => [item, ...prev]);
    setNewProdName("");
    setNewProdPrice("");
    setNewProdDesc("");
    setIsAddingProd(false);
    triggerAutoSaveFeedback();
    triggerNotification(` Added Product Catalog: ${item.name}`);
  };

  const deleteProduct = (id: string, name: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    triggerAutoSaveFeedback();
    triggerNotification(` Removed Product: ${name}`);
  };

  // Memberships handlers
  const handleAddMembership = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanName || !newPlanPrice) return;
    const item: MembershipPlan = {
      id: `mship-${Date.now()}`,
      name: newPlanName,
      duration: newPlanDuration,
      price: newPlanPrice.startsWith("₹") ? newPlanPrice : `₹${newPlanPrice}`,
      benefits: newPlanBenefits || "All standard facilities access with quick booking checkout capabilities",
      isAvailable: true
    };
    setMemberships(prev => [item, ...prev]);
    setNewPlanName("");
    setNewPlanPrice("");
    setNewPlanBenefits("");
    setIsAddingPlan(false);
    triggerAutoSaveFeedback();
    triggerNotification(` Saved Membership Plan Model: ${item.name}`);
  };

  const deleteMembership = (id: string, name: string) => {
    setMemberships(prev => prev.filter(m => m.id !== id));
    triggerAutoSaveFeedback();
    triggerNotification(` Membership Plan Removed: ${name}`);
  };

  // FAQs handlers
  const handleAddFAQ = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaqQ || !newFaqA) return;
    const item: FAQItem = {
      id: `faq-${Date.now()}`,
      question: newFaqQ,
      answer: newFaqA,
      category: newFaqCat,
      priority: newFaqPri
    };
    setFaqs(prev => [item, ...prev]);
    setNewFaqQ("");
    setNewFaqA("");
    setIsAddingFaq(false);
    triggerAutoSaveFeedback();
    triggerNotification(` Custom FAQ Training Verified: ${newFaqQ}`);
  };

  const deleteFAQ = (id: string, q: string) => {
    setFaqs(prev => prev.filter(f => f.id !== id));
    triggerAutoSaveFeedback();
    triggerNotification(` Training FAQ deleted safely`);
  };

  // Policies change
  const updatePolicy = (key: keyof BusinessPolicies, value: string) => {
    setPolicies(prev => ({ ...prev, [key]: value }));
    triggerAutoSaveFeedback();
  };

  // File Upload mock simulation
  const handleDocUploadMock = (fileName: string) => {
    const item: UploadedDoc = {
      id: `doc-${Date.now()}`,
      name: fileName,
      uploadDate: `Log Date: ${new Date().toISOString().substring(0, 10)}`,
      pagesProcessed: Math.ceil(Math.random() * 8) + 1,
      knowledgeExtracted: `Parsed automatically into memory store. Found metadata points matched with your services directory.`
    };
    setDocuments(prev => [...prev, item]);
    triggerAutoSaveFeedback();
    triggerNotification(` Document "${fileName}" analyzed and vectorized into AI store`);
  };

  const deleteDoc = (id: string, name: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
    triggerAutoSaveFeedback();
    triggerNotification(` Document memory flushed: ${name}`);
  };

  // AI Knowledge Tester Engine
  const testAIEngine = (question: string) => {
    if (!question.trim()) return;
    setTestingLoader(true);
    setTestQuestion(question);

    setTimeout(() => {
      let ans = "";
      let src = "General Core Bio";
      let score = "96%";
      let speedText = "0.9 Secs";
      const cleaned = question.toLocaleLowerCase();

      if (cleaned.includes("gym") || cleaned.includes("timing") || cleaned.includes("hour")) {
        ans = `Our official training schedule is Monday through Saturday from 6:00 AM to 10:00 PM. On Sundays, we offer premium self-access from 8:00 AM to 1:00 PM. Dedicated parking space exists basement level.`;
        src = "Business Policies & FAQ Tab";
        score = "99%";
        speedText = "0.7 Secs";
      } else if (cleaned.includes("exhaust") || cleaned.includes("aew") || cleaned.includes("price of aew")) {
        ans = `The premium AEW Exhaust V3 is currently in stock (12 units remaining). The cost is ₹6,500. It fits Royal Enfield Twins 650 perfectly, producing a custom crisp beat. Link: https://autofy.app/checkout/aew`;
        src = "Product catalog memory segment";
        score = "98%";
        speedText = "1.1 Secs";
      } else if (cleaned.includes("membership") || cleaned.includes("ac") || cleaned.includes("membership price")) {
        ans = `We have active memberships like the '3 Month Premium AC Membership' for ₹5,000, bringing you air-conditioned cardio lounges and 3 expert feedback bookings. Autofy checkout paylink is available!`;
        src = "Membership Catalog Directory";
        score = "97%";
        speedText = "1.2 Secs";
      } else if (cleaned.includes("personal") || cleaned.includes("training")) {
        ans = `Absolutely, we provide premium personal training packages starting from ₹2,500 monthly. Each plan is handled by top certified coaches. Book custom assessments easily on WhatsApp.`;
        src = "Services Table Database";
        score = "95%";
        speedText = "0.8 Secs";
      } else {
        ans = `Based on your onboarding registration details, ${onboardingData.businessName || "Your Studio Store"} specializes in customized bookings. The current pricing starts around ${onboardingData.paymentMethod || "UPI direct invoice payouts"}. Feel free to trigger custom sessions!`;
        src = "Onboarding Onboard Sheet";
        score = "89%";
        speedText = "1.4 Secs";
      }

      setTestResult({
        answer: ans,
        source: src,
        confidence: score,
        time: speedText
      });
      setTestingLoader(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      
      {/* Page Title Info + Auto-save indicator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            Knowledge Base <span className="text-xs bg-blue-500/10 text-blue-400 font-normal px-2.5 py-0.5 rounded-full border border-blue-500/20 font-mono">Expert Core</span>
          </h2>
          <p className="text-xs text-neutral-400">Teach Autofy everything about your business in microsecond clicks.</p>
        </div>

        {/* Dynamic Interactive Auto-save pill feedback */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 bg-var(--bg-elevated) border border-var(--border) rounded-xl flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${
              saveStatus === "Saved" ? "bg-emerald-500" : saveStatus === "Saving..." ? "bg-amber-400 animate-ping" : "bg-neutral-600"
            }`} />
            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-300">
              {saveStatus === "Saved" ? "Saved" : saveStatus === "Saving..." ? "Saving..." : "Idle state"}
            </span>
          </div>

          <button 
            onClick={() => {
              triggerNotification(" Re-indexing AI Vector embeds...");
              triggerAutoSaveFeedback();
            }}
            className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-[11px] rounded-xl hover:from-blue-500 hover:to-indigo-500 transition shadow shadow-blue-500/25 cursor-pointer uppercase tracking-wider"
          >
            Re-index embeds
          </button>
        </div>
      </div>

      {/* Top statistics overview row details */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <HelpCircle className="w-5 h-5 text-blue-400" />, label: "Total FAQs Trained", val: faqs.length, desc: "Answers verified safe" },
          { icon: <Briefcase className="w-5 h-5 text-purple-400" />, label: "Services Added", val: services.length, desc: "Standard catalog items" },
          { icon: <Zap className="w-5 h-5 text-amber-400" />, label: "Products Listed", val: products.length, desc: "Stock levels synced" },
          { icon: <Award className="w-5 h-5 text-emerald-400" />, label: "Knowledge Accuracy", val: "99.2%", desc: "0.8% auto-fallback" },
        ].map((stat, idx) => (
          <div key={idx} className="bg-neutral-950/40 border border-var(--border) rounded-2xl p-4 flex items-center gap-3 hover:border-neutral-800 transition backdrop-blur-md">
            <div className="p-2.5 bg-neutral-904 bg-var(--bg-elevated) rounded-xl">{stat.icon}</div>
            <div>
              <p className="text-[9.5px] uppercase font-bold text-neutral-500 tracking-wider mb-0.5 leading-none">{stat.label}</p>
              <h4 className="text-xl font-bold font-sans text-white leading-none mt-1">{stat.val}</h4>
              <p className="text-[9px] text-neutral-500 mt-1">{stat.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main glassmorphism dynamic workspace content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left column workspace selection & panels: Spans 8 cols */}
        <div className="lg:col-span-8 bg-neutral-950/40 border border-var(--border) rounded-3xl p-6 backdrop-blur-md flex flex-col justify-between space-y-6">
          
          {/* Tabs header row */}
          <div className="border-b border-var(--border) pb-2 overflow-x-auto scrollbar-none">
            <div className="flex gap-2 min-w-[550px]">
              {[
                { id: "services", label: "Services Directory" },
                { id: "products", label: "Store Products" },
                { id: "memberships", label: "Membership Plans" },
                { id: "faqs", label: "FAQs Training" },
                { id: "policies", label: "Business Policies" },
                { id: "documents", label: "Uploaded Docs" },
              ].map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setActiveSubTab(sub.id as any)}
                  className={`text-[11px] font-black uppercase tracking-wider px-4 py-2.5 rounded-xl border transition-all cursor-pointer ${
                    activeSubTab === sub.id
                      ? "bg-blue-600/10 border-blue-500/30 text-blue-400 font-black shadow-[0_4px_15px_rgba(59,130,246,0.05)]"
                      : "bg-[#09090c] border-var(--border) text-neutral-400 hover:text-white"
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          </div>

          {/* TAB WINDOW CONTENT ANIMATIONS */}
          <div className="flex-1 min-h-[400px]">
            <AnimatePresence mode="wait">
              
              {/* SUB TAB: SERVICES */}
              {activeSubTab === "services" && (
                <motion.div 
                  key="services" 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-white font-sans uppercase tracking-wider">Business Services directory</h3>
                      <p className="text-[10.5px] text-neutral-400">Listed services coordinates that the AI suggests to prospects during chat.</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => setIsAddingSvc(p => !p)}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[10.5px] tracking-wide rounded-xl uppercase transition cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Service
                      </button>
                      <button 
                        onClick={() => {
                          triggerNotification(" Services list exported as CSV");
                        }}
                        className="px-3 py-2 bg-var(--bg-elevated) border border-var(--border) text-neutral-400 text-[10.5px] font-bold rounded-xl hover:text-white cursor-pointer"
                      >
                        Export
                      </button>
                    </div>
                  </div>

                  {/* Form to add service item */}
                  {isAddingSvc && (
                    <motion.form 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onSubmit={handleAddService}
                      className="p-4 bg-var(--bg-elevated)/60 border border-blue-500/20 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-3.5"
                    >
                      <div>
                        <label className="text-[10px] text-neutral-400 font-black uppercase">Service Name</label>
                        <input 
                          type="text" 
                          required
                          value={newSvcName}
                          onChange={(e) => setNewSvcName(e.target.value)}
                          placeholder="e.g. 1-to-1 Power Yoga" 
                          className="w-full mt-1 bg-[#09090c] border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500/40"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-neutral-400 font-black uppercase">Service Cost (₹)</label>
                        <input 
                          type="text" 
                          required
                          value={newSvcPrice}
                          onChange={(e) => setNewSvcPrice(e.target.value)}
                          placeholder="e.g. 2500" 
                          className="w-full mt-1 bg-[#09090c] border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500/40"
                        />
                      </div>
                      <div className="flex items-end gap-1.5">
                        <div className="flex-1">
                          <label className="text-[10px] text-neutral-400 font-black uppercase">Billing Cycle/Duration</label>
                          <select 
                            value={newSvcDuration}
                            onChange={(e) => setNewSvcDuration(e.target.value)}
                            className="w-full mt-1 bg-[#09090c] border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/40"
                          >
                            <option>Monthly</option>
                            <option>Quarterly</option>
                            <option>Annual Plan</option>
                            <option>Per Session</option>
                            <option>Per Hour</option>
                          </select>
                        </div>
                        <button type="submit" className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition">
                          Save
                        </button>
                      </div>
                    </motion.form>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-var(--border) text-neutral-500 text-[10.5px] uppercase font-bold">
                          <th className="pb-3 text-xs font-bold">Service Name</th>
                          <th className="pb-3 text-xs font-bold">Price Rate</th>
                          <th className="pb-3 text-xs font-bold">Duration Class</th>
                          <th className="pb-3 text-xs font-bold">System Status</th>
                          <th className="pb-3 text-xs font-bold text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-900/30 text-xs font-medium font-sans">
                        {services.map((svc) => (
                          <tr key={svc.id} className="text-neutral-300 hover:bg-var(--bg-elevated)/10 transition">
                            <td className="py-3.5 font-bold text-white">{svc.name}</td>
                            <td className="py-3.5 text-blue-400 font-mono font-bold">{svc.price}</td>
                            <td className="py-3.5 text-neutral-400">{svc.duration}</td>
                            <td className="py-3.5">
                              <span className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded ${
                                svc.status === "Active" ? "bg-emerald-500/10 text-emerald-400" : "bg-var(--bg-elevated) text-neutral-500"
                              }`}>
                                {svc.status}
                              </span>
                            </td>
                            <td className="py-3.5 text-center">
                              <button 
                                onClick={() => deleteService(svc.id, svc.name)}
                                className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-[#1a0f0f] rounded-lg transition"
                                title="Delete service fact file"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* SUB TAB: PRODUCTS */}
              {activeSubTab === "products" && (
                <motion.div 
                  key="products" 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-white font-sans uppercase tracking-wider">Store Products catalog</h3>
                      <p className="text-[10.5px] text-neutral-400">Teach Autofy how to sell accessories, exhausts, loops, or proteins with auto stock indicators.</p>
                    </div>

                    <button 
                      onClick={() => setIsAddingProd(p => !p)}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[10.5px] tracking-wide rounded-xl uppercase transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Product
                    </button>
                  </div>

                  {/* Form to add Product */}
                  {isAddingProd && (
                    <motion.form 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onSubmit={handleAddProduct}
                      className="p-4 bg-var(--bg-elevated)/60 border border-blue-500/20 rounded-2xl space-y-3.5 text-xs text-neutral-300"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                        <div>
                          <label className="text-[10px] text-neutral-400 font-bold uppercase">Product Name</label>
                          <input 
                            type="text" required value={newProdName} onChange={(e) => setNewProdName(e.target.value)}
                            placeholder="e.g. AEW Interceptor Soundpipe" 
                            className="w-full mt-1 bg-[#09090c] border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-neutral-400 font-bold uppercase">Product Price Rate</label>
                          <input 
                            type="text" required value={newProdPrice} onChange={(e) => setNewProdPrice(e.target.value)}
                            placeholder="e.g. 6500" 
                            className="w-full mt-1 bg-[#09090c] border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-neutral-400 font-bold uppercase">Category tag</label>
                          <input 
                            type="text" value={newProdCategory} onChange={(e) => setNewProdCategory(e.target.value)}
                            placeholder="e.g. Accessories" 
                            className="w-full mt-1 bg-[#09090c] border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        <div>
                          <label className="text-[10px] text-neutral-400 font-bold uppercase">Stock Quantity</label>
                          <input 
                            type="number" value={newProdStock} onChange={(e) => setNewProdStock(parseInt(e.target.value) || 0)}
                            className="w-full mt-1 bg-[#09090c] border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-neutral-400 font-bold uppercase">Simulated Images Attached</label>
                          <select 
                            value={newProdImages} onChange={(e) => setNewProdImages(parseInt(e.target.value))}
                            className="w-full mt-1 bg-[#09090c] border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white"
                          >
                            <option value={1}>1 High-res Photo</option>
                            <option value={2}>2 Swipes</option>
                            <option value={4}>4 Detailed Product Views</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-neutral-400 font-bold uppercase">Product Description (Trained directly into embeddings)</label>
                        <textarea 
                          value={newProdDesc} onChange={(e) => setNewProdDesc(e.target.value)}
                          placeholder="Features, material specs, fits, and performance sound info..."
                          className="w-full mt-1 bg-[#09090c] border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white h-20 placeholder-neutral-700"
                        />
                      </div>

                      <div className="flex justify-end gap-2 text-xs font-semibold pt-1">
                        <button type="button" onClick={() => setIsAddingProd(false)} className="px-4 py-2 bg-neutral-800 rounded-xl text-neutral-300">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white">Save Product</button>
                      </div>
                    </motion.form>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {products.map((p) => (
                      <div key={p.id} className="p-4 bg-[#0a0a0d] border border-var(--border) rounded-2xl flex flex-col justify-between space-y-3 hover:border-var(--border) transition">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[9.5px] uppercase font-bold text-blue-400 bg-blue-500/5 px-2 py-0.5 rounded">{p.category}</span>
                            <span className="text-[9px] font-mono text-neutral-500">{p.imagesCount} Images Attached</span>
                          </div>
                          
                          <div className="flex items-baseline justify-between pt-1">
                            <h4 className="text-xs sm:text-sm font-extrabold text-white">{p.name}</h4>
                            <span className="text-blue-400 font-mono font-black text-sm">{p.price}</span>
                          </div>
                          
                          <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">{p.description}</p>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-var(--border)/60">
                          <div className="flex items-center gap-4 text-xs font-sans text-neutral-400">
                            <div>
                              <span className="text-neutral-500 font-bold text-[9px]">STOCK:</span> <span className="font-bold text-white font-mono">{p.stockQuantity}</span>
                            </div>
                            
                            {/* Availability dynamic toggler */}
                            <label className="flex items-center gap-1.5 cursor-pointer text-[10px] uppercase font-black text-neutral-500 selection:bg-none">
                              <input 
                                type="checkbox"
                                checked={p.isAvailable}
                                onChange={(e) => {
                                  setProducts(prev => prev.map(pr => pr.id === p.id ? { ...pr, isAvailable: e.target.checked } : pr));
                                  triggerAutoSaveFeedback();
                                  triggerNotification(`${p.name} is now ${e.target.checked ? "Available" : "Stock Paused"}`);
                                }}
                                className="rounded border-neutral-800 text-blue-600 focus:ring-blue-500 bg-neutral-950 w-3.5 h-3.5"
                              />
                              Available: {p.isAvailable ? "ON" : "OFF"}
                            </label>
                          </div>

                          <button 
                            onClick={() => deleteProduct(p.id, p.name)}
                            className="p-1.5 text-neutral-603 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* SUB TAB: MEMBERSHIP PLANS */}
              {activeSubTab === "memberships" && (
                <motion.div 
                  key="memberships" 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-white font-sans uppercase tracking-wider">Membership plans</h3>
                      <p className="text-[10.5px] text-neutral-400">Define recurring slots or packages Autofy will pitch to seal transactions on automated paylinks.</p>
                    </div>

                    <button 
                      onClick={() => setIsAddingPlan(p => !p)}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[10.5px] tracking-wide rounded-xl uppercase transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> New Membership
                    </button>
                  </div>

                  {isAddingPlan && (
                    <motion.form 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onSubmit={handleAddMembership}
                      className="p-4 bg-var(--bg-elevated)/60 border border-blue-500/20 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs"
                    >
                      <div>
                        <label className="text-[10px] text-neutral-400 font-bold uppercase">Plan Name</label>
                        <input 
                          type="text" required value={newPlanName} onChange={(e) => setNewPlanName(e.target.value)}
                          placeholder="e.g. 3 Month AC Premium Combo" 
                          className="w-full mt-1 bg-[#09090c] border border-neutral-800 rounded-xl px-3 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-neutral-400 font-bold uppercase">Plan Rate (₹)</label>
                        <input 
                          type="text" required value={newPlanPrice} onChange={(e) => setNewPlanPrice(e.target.value)}
                          placeholder="e.g. 5000" 
                          className="w-full mt-1 bg-[#09090c] border border-neutral-800 rounded-xl px-3 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-neutral-400 font-bold uppercase">Billing Duration</label>
                        <input 
                          type="text" required value={newPlanDuration} onChange={(e) => setNewPlanDuration(e.target.value)}
                          placeholder="e.g. 3 Months" 
                          className="w-full mt-1 bg-[#09090c] border border-neutral-800 rounded-xl px-3 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-neutral-400 font-bold uppercase font-sans">Benefits (Comma separated list)</label>
                        <input 
                          type="text" value={newPlanBenefits} onChange={(e) => setNewPlanBenefits(e.target.value)}
                          placeholder="Locker space, Hydro Station access, 3 Coach trials" 
                          className="w-full mt-1 bg-[#09090c] border border-neutral-800 rounded-xl px-3 py-2 text-white"
                        />
                      </div>

                      <div className="md:col-span-2 flex justify-end gap-1.5 pt-1">
                        <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 font-bold rounded-xl text-white">Save Plan</button>
                      </div>
                    </motion.form>
                  )}

                  <div className="space-y-3">
                    {memberships.map((plan) => (
                      <div key={plan.id} className="p-4 bg-var(--bg-elevated)/30 border border-var(--border) rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1.5 flex-1 select-text">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs sm:text-sm font-extrabold text-white">{plan.name}</h4>
                            <span className="text-[9px] font-mono text-neutral-500 bg-neutral-950 px-2 py-0.5 rounded font-bold">{plan.duration}</span>
                          </div>
                          <p className="text-[11.5px] text-neutral-400 leading-snug font-sans">{plan.benefits}</p>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-var(--border) pt-2 md:pt-0">
                          <div className="text-right">
                            <span className="text-xs text-neutral-500 font-sans block mb-0.5">COST RATE:</span>
                            <span className="text-sm font-black text-blue-400 font-mono">{plan.price}</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-neutral-400">
                              <input 
                                type="checkbox"
                                checked={plan.isAvailable}
                                onChange={(e) => {
                                  setMemberships(prev => prev.map(m => m.id === plan.id ? { ...m, isAvailable: e.target.checked } : m));
                                  triggerAutoSaveFeedback();
                                }}
                                className="rounded border-neutral-800 bg-neutral-950 text-blue-600 focus:ring-blue-500"
                              />
                              {plan.isAvailable ? "Available" : "Private"}
                            </label>

                            <button 
                              onClick={() => deleteMembership(plan.id, plan.name)}
                              className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* SUB TAB: FAQS */}
              {activeSubTab === "faqs" && (
                <motion.div 
                  key="faqs" 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-white font-sans uppercase tracking-wider font-sans">Interactive Q&A Training FAQs</h3>
                      <p className="text-[10.5px] text-neutral-400">Custom queries that match customer FAQs to avoid redundant human escalations.</p>
                    </div>

                    <button 
                      onClick={() => setIsAddingFaq(p => !p)}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[10.5px] tracking-wide rounded-xl uppercase transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add FAQ Answer
                    </button>
                  </div>

                  {isAddingFaq && (
                    <motion.form 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onSubmit={handleAddFAQ}
                      className="p-4 bg-var(--bg-elevated)/60 border border-blue-500/20 rounded-2xl space-y-3.5 text-xs text-neutral-300"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                        <div className="md:col-span-2">
                          <label className="text-[10px] text-neutral-400 font-bold uppercase">Question text</label>
                          <input 
                            type="text" required value={newFaqQ} onChange={(e) => setNewFaqQ(e.target.value)}
                            placeholder="e.g. Do you have a personal trainer?" 
                            className="w-full mt-1 bg-[#09090c] border border-neutral-800 rounded-xl px-3 py-2 text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-neutral-400 font-bold uppercase">Confidence Category</label>
                          <input 
                            type="text" value={newFaqCat} onChange={(e) => setNewFaqCat(e.target.value)}
                            placeholder="e.g. Coaching" 
                            className="w-full mt-1 bg-[#09090c] border border-neutral-800 rounded-xl px-3 py-2 text-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        <div>
                          <label className="text-[10px] text-neutral-400 font-bold uppercase">Answer Body</label>
                          <textarea 
                            required value={newFaqA} onChange={(e) => setNewFaqA(e.target.value)}
                            placeholder="e.g. Yes we host 8 professional fitness coaches specialized inside bodybuilding..."
                            className="w-full mt-1 bg-[#09090c] border border-neutral-800 rounded-xl px-3 py-2 text-white h-16 placeholder-neutral-700"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-neutral-400 font-bold uppercase font-sans">Priority Status</label>
                          <select 
                            value={newFaqPri} onChange={(e) => setNewFaqPri(e.target.value as any)}
                            className="w-full mt-1 bg-[#09090c] border border-neutral-800 rounded-xl px-3 py-2 text-white"
                          >
                            <option value="High"> High Priority (Trained First)</option>
                            <option value="Medium"> Medium Priority</option>
                            <option value="Low"> Low Priority</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end gap-1.5 pt-1">
                        <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 font-bold rounded-xl text-white">Save FAQ Embed</button>
                      </div>
                    </motion.form>
                  )}

                  <div className="space-y-3">
                    {faqs.map((faq) => (
                      <div key={faq.id} className="p-4 bg-var(--bg-elevated)/25 border border-var(--border) rounded-2xl hover:border-var(--border) transition flex items-start gap-3 select-text">
                        <div className="p-1.5 bg-blue-500/10 rounded-full text-blue-400 mt-1">
                          <HelpCircle className="w-4 h-4" />
                        </div>

                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-black text-white">{faq.question}</p>
                            <span className="text-[8px] tracking-wide font-black uppercase text-neutral-400 bg-var(--bg-elevated) px-1.5 py-0.5 rounded">{faq.category}</span>
                            <span className={`text-[8.5px] font-bold uppercase px-1.5 py-0.5 rounded font-mono ${
                              faq.priority === "High" ? "bg-red-500/10 text-red-400" : faq.priority === "Medium" ? "bg-amber-500/10 text-amber-400" : "bg-neutral-800 text-neutral-500"
                            }`}>{faq.priority}</span>
                          </div>
                          
                          <p className="text-[11.5px] text-neutral-400 leading-relaxed font-sans">{faq.answer}</p>
                        </div>

                        <button 
                          onClick={() => deleteFAQ(faq.id, faq.question)}
                          className="p-1.5 text-neutral-603 text-neutral-500 hover:text-red-400 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* SUB TAB: BUSINESS POLICIES */}
              {activeSubTab === "policies" && (
                <motion.div 
                  key="policies" 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-white font-sans uppercase tracking-wider">Business Guidelines policies</h3>
                    <p className="text-[10.5px] text-neutral-400 text-neutral-500">These rules prevent booking failures and align chatbot statements with authentic policies.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 font-bold uppercase block">Refund Policy</label>
                      <textarea 
                        value={policies.refundPolicy}
                        onChange={(e) => updatePolicy("refundPolicy", e.target.value)}
                        className="w-full h-20 bg-[#09090c] border border-neutral-800 rounded-xl px-3 py-2.5 text-white placeholder-neutral-700 leading-relaxed focus:outline-none focus:border-blue-500/40"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 font-bold uppercase block">Cancellation Policy</label>
                      <textarea 
                        value={policies.cancellationPolicy}
                        onChange={(e) => updatePolicy("cancellationPolicy", e.target.value)}
                        className="w-full h-20 bg-[#09090c] border border-neutral-800 rounded-xl px-3 py-2.5 text-white placeholder-neutral-700 leading-relaxed focus:outline-none focus:border-blue-500/40"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 font-bold uppercase block">Working Hours / Calendar Slots</label>
                      <textarea 
                        value={policies.workingHours}
                        onChange={(e) => updatePolicy("workingHours", e.target.value)}
                        className="w-full h-20 bg-[#09090c] border border-neutral-800 rounded-xl px-3 py-2.5 text-white placeholder-neutral-700 leading-relaxed focus:outline-none focus:border-blue-500/40"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-neutral-400 font-bold uppercase block">Delivery and Shipping Policy</label>
                      <textarea 
                        value={policies.deliveryPolicy}
                        onChange={(e) => updatePolicy("deliveryPolicy", e.target.value)}
                        className="w-full h-20 bg-[#09090c] border border-neutral-800 rounded-xl px-3 py-2.5 text-white placeholder-neutral-700 leading-relaxed focus:outline-none focus:border-blue-500/40"
                      />
                    </div>

                  </div>
                </motion.div>
              )}

              {/* SUB TAB: DOCUMENT ARCHIVES */}
              {activeSubTab === "documents" && (
                <motion.div 
                  key="documents" 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="space-y-1">
                    <h3 className="text-xs sm:text-sm font-bold text-white font-sans uppercase tracking-wider">Indexed Documents memory</h3>
                    <p className="text-[10.5px] text-neutral-400">Upload PDF, DOCX, TXT or Excel files. Autofy reads entire chapters to build precise semantic tables.</p>
                  </div>

                  {/* Drag drop zone mock */}
                  <div 
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      const dtFiles = e.dataTransfer.files;
                      if (dtFiles && dtFiles.length > 0) {
                        handleDocUploadMock(dtFiles[0].name);
                      }
                    }}
                    className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all ${
                      dragOver 
                        ? "border-blue-500 bg-blue-500/10 text-white scale-[0.99]" 
                        : "border-neutral-800 hover:border-neutral-700 bg-var(--bg-elevated)/20 text-neutral-400"
                    }`}
                  >
                    <Upload className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                    
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-white">Drag & Drop any catalog file here</p>
                      <p className="text-[10px] text-neutral-500">Supports PDF, DOCX, TXT, Excel up to 25MB each</p>
                    </div>

                    <div className="pt-4 flex items-center justify-center gap-2">
                      <button 
                        onClick={() => handleDocUploadMock("gym_rules_coaches_v2.docx")}
                        className="px-3.5 py-1.5 bg-var(--bg-elevated) hover:bg-var(--bg-elevated) hover:text-white border border-var(--border) rounded-lg text-[10px] font-sans text-neutral-300 transition-all cursor-pointer"
                      >
                         Upload Demo Rules.docx
                      </button>
                      <button 
                        onClick={() => handleDocUploadMock("exhaust_warranty_manual_meteor.pdf")}
                        className="px-3.5 py-1.5 bg-var(--bg-elevated) hover:bg-var(--bg-elevated) hover:text-white border border-var(--border) rounded-lg text-[10px] font-sans text-neutral-300 transition-all cursor-pointer"
                      >
                         Upload Demo Catalog.pdf
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[9.5px] font-black uppercase text-neutral-500 text-neutral-500 tracking-wider">Trained document list</p>
                    
                    {documents.map((doc) => (
                      <div key={doc.id} className="p-4 bg-var(--bg-elevated)/30 border border-var(--border) rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 select-text">
                          <div className="p-2 bg-blue-600/10 text-blue-400 rounded-xl mt-0.5">
                            <FileText className="w-[18px] h-[18px]" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">{doc.name}</p>
                            <p className="text-[9px] text-[#555562] font-mono mt-0.5">{doc.uploadDate} • {doc.pagesProcessed} pages processed</p>
                            <p className="text-[11px] text-neutral-400 leading-snug mt-1.5 font-sans font-medium">{doc.knowledgeExtracted}</p>
                          </div>
                        </div>

                        <button 
                          onClick={() => deleteDoc(doc.id, doc.name)}
                          className="p-1.5 text-neutral-500 hover:text-red-400 rounded-lg self-end md:self-center transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

        </div>

        {/* Right column: Tester component & Health scoring - Spans 4 cols */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* AI KNOWLEDGE TESTER ZONE */}
          <div className="bg-neutral-950/40 border border-var(--border) rounded-3xl p-5 backdrop-blur-md relative overflow-hidden space-y-4">
            
            <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-blue-400 animate-spin" />
              <span>Test Your AI Instantly</span>
            </div>

            <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
              Type a diagnostic query to run a real-time retrieval check across the updated services, products & FAQs.
            </p>

            {/* Input tester box */}
            <div className="space-y-2">
              <div className="relative">
                <input 
                  type="text"
                  value={testQuestion}
                  onChange={(e) => setTestQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") testAIEngine(testQuestion);
                  }}
                  placeholder="Ask a Question..."
                  className="w-full bg-[#0a0a0d] border border-var(--border) rounded-xl pl-3 pr-10 py-3 text-xs text-white placeholder-neutral-700 focus:outline-none focus:border-blue-500/50"
                />
                <button 
                  onClick={() => testAIEngine(testQuestion)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Guided presets template indicators */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Do you have AC membership?",
                  "Price of AEW exhaust?",
                  "Do you offer personal training?"
                ].map((preQ, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setTestQuestion(preQ);
                      testAIEngine(preQ);
                    }}
                    className="text-[9.5px] bg-[#0c0c0f] hover:bg-[#131318] border border-var(--border) text-neutral-400 hover:text-white px-2 py-1 rounded-lg text-left"
                  >
                     {preQ}
                  </button>
                ))}
              </div>
            </div>

            {/* Results tester container with animation */}
            <AnimatePresence mode="wait">
              {testingLoader ? (
                <div className="py-8 bg-var(--bg-elevated)/20 border border-var(--border) rounded-2xl flex flex-col items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-[10px] text-blue-400 font-bold font-mono">Autofy searching vector coordinates...</p>
                </div>
              ) : testResult ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-[#0a0a0d] border border-neutral-855 border-neutral-800 rounded-2xl space-y-3 select-text text-xs"
                >
                  <p className="text-[10px] uppercase font-black text-blue-400 flex items-center gap-1 leading-none">
                    <span> AI RESPONSE OUTCOME</span>
                  </p>
                  
                  <p className="text-[11.5px] text-neutral-200 leading-relaxed font-sans">{testResult.answer}</p>
                  
                  <div className="pt-2 border-t border-var(--border)/60 grid grid-cols-2 gap-2 text-[9.5px] font-mono leading-none">
                    <div>
                      <span className="text-neutral-500 uppercase font-black block mb-0.5">SOURCE:</span>
                      <span className="text-neutral-300 font-bold">{testResult.source}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 uppercase font-black block mb-0.5">CONFIDENCE:</span>
                      <span className="text-emerald-400 font-bold">{testResult.confidence}</span>
                    </div>
                    <div className="col-span-2 pt-1">
                      <span className="text-neutral-500 uppercase font-black block mb-0.5">RESPONSE SPEED:</span>
                      <span className="text-blue-400 font-bold">{testResult.time}</span>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

          </div>

          {/* KNOWLEDGE HEALTH DIAGNOSTICS CARD */}
          <div className="bg-neutral-950/40 border border-var(--border) rounded-3xl p-5 backdrop-blur-md space-y-3.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider font-sans">
              <BadgeAlert className="w-[18px] h-[18px] text-blue-400" />
              <span>Knowledge Health Status</span>
            </div>

            <div className="space-y-2.5 text-xs text-neutral-300">
              
              {/* Missing Information row */}
              <div className="p-3 bg-[#110d0d] border border-red-500/10 rounded-2xl flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-white">Missing Crucial Information</p>
                  <p className="text-[10px] text-neutral-400 mt-0.5 leading-snug">Add more FAQs about membership rules and group training parameters to minimize gaps.</p>
                </div>
              </div>

              {/* Outdated warning row */}
              <div className="p-3 bg-[#11100d] border border-amber-500/10 rounded-2xl flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-white">Outdated Information</p>
                  <p className="text-[10px] text-neutral-400 mt-0.5 leading-snug">AEW Exhaust pricing was last indexed yesterday. Ensure available stocks match current shop manual.</p>
                </div>
              </div>

              {/* Suggestion highlights */}
              <div className="bg-blue-600/5 border border-blue-500/10 rounded-2xl p-4 space-y-2">
                <p className="text-[9.5px] uppercase font-black text-blue-400 tracking-wider">Suggested Actions</p>
                
                <ul className="space-y-1.5 text-[10.5px] text-neutral-300 font-sans list-disc list-inside leading-snug">
                  <li>Incorporate a delivery refund scenario.</li>
                  <li>Incorporate description tags inside services.</li>
                </ul>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
