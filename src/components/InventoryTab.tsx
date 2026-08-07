import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Package,
  Plus,
  Search,
  Trash2,
  Edit2,
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  Percent,
  TrendingUp,
  ShoppingCart,
  Tag,
  ArrowRight,
  X,
  RefreshCw,
  Image as ImageIcon,
  MessageSquare,
  HelpCircle,
  Activity,
  Check,
  Zap,
  Info,
  Layers,
  Sparkles
} from "lucide-react";
import { OnboardingData } from "../types";
import { api } from "../lib/api";

interface ProductItem {
  id: string;
  name: string;
  category: string;
  price: number;
  discount_percent: number;
  discount_price: number;
  stock: number;
  low_stock_threshold: number;
  image_url: string;
  additional_images: string;
  description: string;
  variants: string;
  is_available: boolean;
}

interface InventoryTabProps {
  productsList?: any[];
  setProductsList?: React.Dispatch<React.SetStateAction<any[]>>;
  triggerNotification: (text: string) => void;
}

export const InventoryTab: React.FC<InventoryTabProps> = ({
  productsList: initialProducts,
  setProductsList: syncBackProducts,
  triggerNotification
}) => {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  const normalizeProduct = (item: any): ProductItem => ({
    id: item.id,
    name: item.name || "",
    category: item.category || "General",
    price: Number(item.price || 0),
    discount_percent: Number(item.discount_percent || 0),
    discount_price: Number(item.discount_price || 0),
    stock: Number(item.stock || 0),
    low_stock_threshold: Number(item.low_stock_threshold || 5),
    image_url: item.image_url || "",
    additional_images: item.additional_images || "",
    description: item.description || "",
    variants: item.variants || "",
    is_available: item.is_available !== false
  });

  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const res = await api.get<{ items: any[] }>("/api/v1/products");
      handlePropagateChange((res.items || []).map(normalizeProduct));
    } catch (err) {
      triggerNotification(err instanceof Error ? err.message : "Failed to load inventory.");
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // State sync back is propagated gently
  const handlePropagateChange = (newProducts: ProductItem[]) => {
    setProducts(newProducts);
    if (syncBackProducts) {
      const basicMapping = newProducts.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price: `₹${p.price.toLocaleString("en-IN")}`,
        stockQuantity: p.stock,
        isAvailable: p.is_available,
        description: p.description,
        imagesCount: p.additional_images ? p.additional_images.split(",").length + 1 : 1
      }));
      syncBackProducts(basicMapping);
    }
  };

  // Search & Filtering States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);
  const [filterUnavailableOnly, setFilterUnavailableOnly] = useState(false);

  // Categories extraction
  const categories = ["All", ...Array.from(new Set(products.map(p => p.category)))];

  // Forms and Modals state machine
  const [managementModalOpen, setManagementModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("Exhausts");
  const [formPrice, setFormPrice] = useState("");
  const [formDiscountPercent, setFormDiscountPercent] = useState("0");
  const [formStock, setFormStock] = useState("");
  const [formLowStockThreshold, setFormLowStockThreshold] = useState("5");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formAdditionalImages, setFormAdditionalImages] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formVariants, setFormVariants] = useState("");
  const [formIsAvailable, setFormIsAvailable] = useState(true);

  // Open creation modal helper
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormName("");
    setFormCategory("Exhausts");
    setFormPrice("");
    setFormDiscountPercent("0");
    setFormStock("");
    setFormLowStockThreshold("5");
    setFormImageUrl("");
    setFormAdditionalImages("");
    setFormDescription("");
    setFormVariants("");
    setFormIsAvailable(true);
    setManagementModalOpen(true);
  };

  // Open edit modal helper
  const handleOpenEditModal = (product: ProductItem) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormCategory(product.category);
    setFormPrice(product.price.toString());
    setFormDiscountPercent(product.discount_percent.toString());
    setFormStock(product.stock.toString());
    setFormLowStockThreshold(product.low_stock_threshold.toString());
    setFormImageUrl(product.image_url);
    setFormAdditionalImages(product.additional_images || "");
    setFormDescription(product.description || "");
    setFormVariants(product.variants || "");
    setFormIsAvailable(product.is_available);
    setManagementModalOpen(true);
  };

  // Save/Edit product submission
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPrice.trim() || !formStock.trim()) {
      triggerNotification("Please fill in the required fields (Name, Price, and Stock).");
      return;
    }

    const priceNum = parseFloat(formPrice) || 0;
    const discountPctNum = parseInt(formDiscountPercent) || 0;
    const computedDiscountPrice = priceNum - (priceNum * (discountPctNum / 100));
    const payload = {
      name: formName.trim(),
      category: formCategory,
      price: priceNum,
      discount_percent: discountPctNum,
      discount_price: computedDiscountPrice,
      stock: parseInt(formStock) || 0,
      low_stock_threshold: parseInt(formLowStockThreshold) || 5,
      image_url: formImageUrl.trim() || null,
      additional_images: formAdditionalImages,
      description: formDescription,
      variants: formVariants,
      is_available: formIsAvailable
    };

    setIsSavingProduct(true);
    try {
      if (editingProduct) {
        await api.put(`/api/v1/products/${editingProduct.id}`, payload);
        triggerNotification(`Product "${formName}" updated successfully.`);
      } else {
        await api.post("/api/v1/products", payload);
        triggerNotification(`Product "${formName}" added to inventory.`);
      }
      setManagementModalOpen(false);
      await fetchProducts();
    } catch (err) {
      triggerNotification(err instanceof Error ? err.message : "Failed to save product.");
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Stock counts adjusters
  const handleQuickAdjustStock = async (pId: string, amount: number) => {
    try {
      const item = normalizeProduct(await api.post(`/api/v1/products/${pId}/stock`, { quantity: amount }));
      handlePropagateChange(products.map(p => p.id === pId ? item : p));
      if (item.stock <= item.low_stock_threshold && amount < 0) {
        triggerNotification(`Low Stock Alert: "${item.name}" has only ${item.stock} units remaining.`);
      } else {
        triggerNotification("Stock quantity updated.");
      }
    } catch (err) {
      triggerNotification(err instanceof Error ? err.message : "Failed to update stock.");
    }
  };

  // Availability swapper
  const handleToggleAvailability = async (pId: string) => {
    const current = products.find(p => p.id === pId);
    if (!current) return;
    try {
      const item = normalizeProduct(await api.put(`/api/v1/products/${pId}`, { is_available: !current.is_available }));
      handlePropagateChange(products.map(p => p.id === pId ? item : p));
      triggerNotification(`"${item.name}" is now marked ${item.is_available ? "Online" : "Offline"}.`);
    } catch (err) {
      triggerNotification(err instanceof Error ? err.message : "Failed to update availability.");
    }
  };

  // Delete product
  const handleDeleteProduct = async (pId: string, name: string) => {
    try {
      await api.del(`/api/v1/products/${pId}`);
      handlePropagateChange(products.filter(p => p.id !== pId));
      triggerNotification(`"${name}" removed from inventory.`);
    } catch (err) {
      triggerNotification(err instanceof Error ? err.message : "Failed to delete product.");
    }
  };

  // Live simulation variables & scenarios
  const [simulationStep, setSimulationStep] = useState<"idle" | "incoming" | "checking" | "finished">("idle");
  const [activeSimulationScenario, setActiveSimulationScenario] = useState<string>("");
  const [simQuestion, setSimQuestion] = useState("");
  const [simLog, setSimLog] = useState<string[]>([]);
  const [simMessages, setSimMessages] = useState<Array<{ sender: "user" | "bot"; text: string; mediaUrl?: string; mediaPrice?: string; mediaStock?: number; mediaId?: string; alternatives?: ProductItem[] }>>([]);

  // Simulation execution routing
  const startScenarioSimulation = (scenarioKey: string) => {
    setSimulationStep("incoming");
    setSimLog([]);
    setSimMessages([]);

    let userQ = "";
    if (scenarioKey === "available") {
      userQ = "Do you have AEW exhaust for Classic 350?";
      setActiveSimulationScenario("available");
    } else if (scenarioKey === "out_of_stock") {
      userQ = "Is Gursewak exhaust in stock? I need classic deep thump.";
      setActiveSimulationScenario("out_of_stock");
    } else {
      userQ = "Do you have Royal Enfield riding gloves?";
      setActiveSimulationScenario("unrelated");
    }

    setSimQuestion(userQ);
    setSimMessages([{ sender: "user", text: userQ }]);

    // Trigger sequential animation simulation log
    setTimeout(() => {
      setSimulationStep("checking");
      setSimLog(prev => [...prev, " Incoming WhatsApp Webhook received 200 OK."]);
    }, 1000);

    setTimeout(() => {
      setSimLog(prev => [...prev, ` Normalizing query & running NLP search: "${userQ}"`]);
    }, 2200);

    setTimeout(() => {
      setSimLog(prev => [...prev, " Querying SQLAlchemy inventory DB indices... matched table 'products'"]);
    }, 3200);

    setTimeout(() => {
      // Execute decisions based on scenario
      if (scenarioKey === "available") {
        const item = products.find(p => p.id === "p-1") || products[0];
        setSimLog(prev => [...prev, ` SUCCESS: AEW Exhaust identified. In Stock: ${item.stock} unit(s). IsAvailable: ${item.is_available}`]);
        
        setTimeout(() => {
          setSimulationStep("finished");
          setSimMessages(prev => [
            ...prev,
            {
              sender: "bot",
              text: `Yes! We absolutely have the *${item.name}* available. \n\nIt is fabricated from premium grade stainless steel, features a sleek finish, and generates the authentic deep rumble you want. Our package includes an integrated, removable dB killer.\n\n *Price:* ₹${item.discount_price.toLocaleString("en-IN")} (Original: ~₹${item.price.toLocaleString("en-IN")}~ - ${item.discount_percent}% off!)\n *Availability:* ${item.stock} item(s) ready to ship immediately in standard packing!`,
              mediaUrl: item.image_url,
              mediaPrice: `₹${item.discount_price}`,
              mediaStock: item.stock,
              mediaId: item.id
            }
          ]);
        }, 1200);

      } else if (scenarioKey === "out_of_stock") {
        // Recommend Alternatives
        const item = products.find(p => p.id === "p-3") || products[2]; // Gursewak, which is 0 stock
        setSimLog(prev => [
          ...prev,
          ` ALERT: Matched requested item "${item.name}" but current stock level is ${item.stock} (Out of Stock).`,
          ` Running fallback recommendation algorithm: Searching category "${item.category}" for available alternatives...`
        ]);

        const alternatives = products.filter(p => p.category === item.category && p.stock > 0 && p.is_available);

        setTimeout(() => {
          setSimulationStep("finished");
          setSimMessages(prev => [
            ...prev,
            {
              sender: "bot",
              text: `While the *${item.name}* is currently temporarily out of stock (we are restocking next week), we have these premium, in-stock alternatives that generate amazing, powerful sound profiles:`,
              alternatives: alternatives
            }
          ]);
        }, 1800);

      } else {
        // Hand gloves or accessories query
        const item = products.find(p => p.id === "p-4") || products[3];
        setSimLog(prev => [
          ...prev,
          ` Query processed: gloves. Match found: "${item.name}". Stock levels: ${item.stock} (Warning: Low Stock State).`
        ]);

        setTimeout(() => {
          setSimulationStep("finished");
          setSimMessages(prev => [
            ...prev,
            {
              sender: "bot",
              text: `We do! We have the *${item.name}* available. It is currently in heavy demand with only *${item.stock} units remaining* in our active inventory pool.\n\n *Price:* ₹${item.discount_price.toLocaleString("en-IN")}\n *Shipping:* Dispatched within 24 hours standard delivery.`,
              mediaUrl: item.image_url,
              mediaPrice: `₹${item.discount_price}`,
              mediaStock: item.stock,
              mediaId: item.id
            }
          ]);
        }, 1200);
      }
    }, 4500);
  };

  // Mock complete checkout reduce stock animation function
  const handleSimulatePurchase = (productId: string) => {
    triggerNotification("Sandbox purchase simulation is disabled in production. Create a real order from Orders to deduct stock.");
  };

  // Search filter logic applied
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (p.variants && p.variants.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    const matchesLowStock = !filterLowStockOnly || (p.stock <= p.low_stock_threshold && p.is_available);
    const matchesUnavailable = !filterUnavailableOnly || !p.is_available;

    return matchesSearch && matchesCategory && matchesLowStock && matchesUnavailable;
  });

  // KPI Calculations
  const lowStockCount = products.filter(p => p.stock <= p.low_stock_threshold && p.is_available).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;
  const activeStockValue = products.reduce((acc, current) => {
    const activePrice = current.discount_price > 0 ? current.discount_price : current.price;
    return acc + (activePrice * current.stock);
  }, 0);

  return (
    <div className="space-y-8 text-left">
      
      {/* 1. INTRO / METRICS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI: Total Unique Products */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-extrabold font-sans">
              Unique Products
            </span>
            <p className="text-2xl font-black text-[var(--text)] mt-1.5">{products.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-[var(--border)] flex items-center justify-center text-[var(--text)] shadow">
            <Package className="w-5 h-5 stroke-[1.8]" />
          </div>
        </div>

        {/* KPI: Total Cash valuation */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-extrabold font-sans">
              Inventory Value
            </span>
            <p className="text-2xl font-black text-[var(--text)] mt-1.5">
              ₹{activeStockValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-[var(--border)] flex items-center justify-center text-[var(--text)] shadow">
            <TrendingUp className="w-5 h-5 stroke-[1.8]" />
          </div>
        </div>

        {/* KPI: Warning alert ticker */}
        <div className={`p-5 rounded-2xl border transition-colors flex items-center justify-between ${
          lowStockCount > 0 
            ? "bg-amber-950/20 border-amber-500/20 text-amber-300" 
            : "bg-[var(--bg-card)] border-[var(--border)] text-[var(--text)]"
        }`}>
          <div>
            <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-extrabold font-sans">
              Low Stock Items
            </span>
            <p className="text-2xl font-black mt-1.5">{lowStockCount}</p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow ${
            lowStockCount > 0 
              ? "bg-amber-500/10 border border-amber-500/25 text-amber-400" 
              : "bg-white/[0.04] border border-[var(--border)]"
          }`}>
            <AlertTriangle className="w-5 h-5 stroke-[1.8]" />
          </div>
        </div>

        {/* KPI: Critical out-of-stock items */}
        <div className={`p-5 rounded-2xl border transition-colors flex items-center justify-between ${
          outOfStockCount > 0 
            ? "bg-red-950/20 border-red-500/20 text-red-300" 
            : "bg-[var(--bg-card)] border-[var(--border)] text-[var(--text)]"
        }`}>
          <div>
            <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-extrabold font-sans">
              Out of Stock
            </span>
            <p className="text-2xl font-black mt-1.5">{outOfStockCount}</p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow ${
            outOfStockCount > 0 
              ? "bg-red-500/10 border border-red-500/25 text-red-400" 
              : "bg-white/[0.04] border border-[var(--border)]"
          }`}>
            <X className="w-5 h-5 stroke-[1.8]" />
          </div>
        </div>

      </div>

      {/* 2. LIVE SANDBOX SIMULATOR WORKBENCH (CRITICAL CUSTOMER FLOW DEMO) */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl overflow-hidden shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-0">
        
        {/* Left panel: Trigger Console */}
        <div className="lg:col-span-5 p-6 border-b lg:border-b-0 lg:border-r border-[var(--border)] flex flex-col justify-between gap-6 bg-[#0E0E10]/50">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/[0.04] border border-[var(--border)] text-[var(--text)] font-black text-[10px] uppercase tracking-widest rounded-full font-mono">
              <Sparkles className="w-3.5 h-3.5 text-[var(--text)]" />
              Autofy AI Engine Simulator
            </div>
            <h3 className="text-lg font-black text-[var(--text)] font-sans tracking-tight">
              Instant AI WhatsApp Responses
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed font-sans">
              Test how the AI evaluates real stock data, presents photos, checks low stock alerts, recommends alternative exhausts, and automatically reduces inventory.
            </p>

            <div className="h-[1.5px] bg-white/[0.05] my-2" />

            <div className="space-y-2.5">
              <span className="text-[11px] font-extrabold tracking-wider text-[var(--text-muted)] uppercase block">Click to trigger customer scenario:</span>
              
              {/* Option A: Available */}
              <button 
                onClick={() => startScenarioSimulation("available")}
                disabled={simulationStep === "checking"}
                className={`w-full p-3.5 bg-white/[0.02] hover:bg-white/[0.05] border rounded-2xl flex items-center gap-3 transition-all text-left group ${
                  activeSimulationScenario === "available" ? "border-[var(--border)] bg-white/[0.04]" : "border-[var(--border)]"
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 flex items-center justify-center text-xs font-mono font-black group-hover:scale-105 transition-transform">
                  A
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[var(--text)] truncate">Query Available product (In Stock)</p>
                  <p className="text-[10.5px] text-[var(--text-muted)] truncate">Classic 350 AEW Exhaust query (presents specs & reduction option)</p>
                </div>
              </button>

              {/* Option B: Out of stock (Alternatives) */}
              <button 
                onClick={() => startScenarioSimulation("out_of_stock")}
                disabled={simulationStep === "checking"}
                className={`w-full p-3.5 bg-white/[0.02] hover:bg-white/[0.05] border rounded-2xl flex items-center gap-3 transition-all text-left group ${
                  activeSimulationScenario === "out_of_stock" ? "border-[var(--border)] bg-white/[0.04]" : "border-[var(--border)]"
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-xs font-mono font-black group-hover:scale-105 transition-transform">
                  B
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[var(--text)] truncate">Query Out of Stock (Alternatives)</p>
                  <p className="text-[10.5px] text-[var(--text-muted)] truncate">Gursewak exhaust query (automatically offers available alternatives)</p>
                </div>
              </button>

              {/* Option C: Warning and info */}
              <button 
                onClick={() => startScenarioSimulation("unrelated")}
                disabled={simulationStep === "checking"}
                className={`w-full p-3.5 bg-white/[0.02] hover:bg-white/[0.05] border rounded-2xl flex items-center gap-3 transition-all text-left group ${
                  activeSimulationScenario === "unrelated" ? "border-[var(--border)] bg-white/[0.04]" : "border-[var(--border)]"
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center text-xs font-mono font-black group-hover:scale-105 transition-transform">
                  C
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[var(--text)] truncate">Query Rare Item (Low Stock alert)</p>
                  <p className="text-[10.5px] text-[var(--text-muted)] truncate">Carbon Gloves query (triggers low stock urgency indicators)</p>
                </div>
              </button>
            </div>
          </div>

          {/* Trace Database Logging Feed */}
          <div className="bg-[#070709] border border-[var(--border)] rounded-2xl p-4 space-y-2 mt-4">
            <div className="flex items-center justify-between text-[10px] tracking-wide text-[var(--text-muted)] font-bold uppercase font-mono">
              <span>FastAPI Database Console Logs</span>
              <RefreshCw className={`w-3 h-3 ${simulationStep === "checking" ? "animate-spin text-[var(--text)]" : ""}`} />
            </div>
            
            <div className="h-28 overflow-y-auto space-y-1.5 font-mono text-[10px] text-left leading-normal text-[var(--text-muted)]">
              {simLog.length === 0 ? (
                <div className="text-[var(--text-subtle)] italic mt-6 text-center">Idle state. Select a scenario from above to watch real SQLite/FastAPI processing.</div>
              ) : (
                simLog.map((log, index) => (
                  <div key={index} className="border-l border-white/10 pl-2">
                    {log}
                  </div>
                ))
              )}
              {simulationStep === "checking" && (
                <div className="text-[var(--text-subtle)] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  <span>Processing logic engine...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right panel: WhatsApp interface view */}
        <div className="lg:col-span-7 bg-[var(--bg-card)]/95 min-h-[460px] flex flex-col justify-between relative">
          
          {/* Mockup Header */}
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between bg-zinc-950/20 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/[0.04] border border-[var(--border)] flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-[var(--text-muted)]" />
              </div>
              <div>
                <p className="text-xs font-black text-[var(--text)] font-sans">Autofy WA Business Link</p>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[9.5px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider font-sans">Automated AI Online</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 px-2 py-1 bg-white/[0.04] border border-[#1C1C1E] text-[var(--text-muted)] font-mono text-[9px] font-bold rounded-lg uppercase">
              Sandbox Live
            </div>
          </div>

          {/* Sandbox conversation stream viewport */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[360px] text-left">
            {simMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3.5 my-14 text-[var(--text-muted)]">
                <div className="w-11 h-11 rounded-2xl bg-white/[0.02] border border-[var(--border)] flex items-center justify-center">
                  <MessageSquare className="w-[22px] h-[22px] text-[var(--text-muted)]" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-[var(--text)]">Interactive WhatsApp Thread</p>
                  <p className="text-[10.5px] max-w-[280px]">Select any customer question scenario on the left panel to trigger the AI agent check.</p>
                </div>
              </div>
            ) : (
              simMessages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                  
                  {/* Message Bubble container */}
                  <div className={`max-w-[85%] rounded-2xl p-4.5 text-xs text-left ${
                    msg.sender === "user"
                      ? "bg-white/[0.06] border border-[var(--border)] text-[var(--text)]"
                      : "bg-[#0E0E10] border border-[var(--border)] text-[#e5e5e5]"
                  }`}>
                    {/* Render standard text with whitespace preservation */}
                    <p className="whitespace-pre-wrap leading-relaxed select-text">{msg.text}</p>

                    {/* Scenario A media block overlay: available product image card */}
                    {msg.mediaUrl && (
                      <div className="mt-4 border border-[var(--border)] bg-[var(--bg-card)] rounded-xl overflow-hidden shadow-lg">
                        <img 
                          src={msg.mediaUrl} 
                          alt="Matching Exhaust" 
                          className="w-full h-34 object-cover border-b border-[var(--border)]"
                          referrerPolicy="no-referrer"
                        />
                        <div className="p-3.5 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase font-mono">Real-time Stock Monitor</span>
                            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                              msg.mediaStock && msg.mediaStock > 0 
                                ? msg.mediaStock <= 5 
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/15" 
                                  : "bg-green-500/10 text-green-400 border border-green-500/15" 
                                : "bg-red-500/10 text-red-400 border border-red-500/15"
                            }`}>
                              {msg.mediaStock && msg.mediaStock > 0 ? `${msg.mediaStock} Units Left` : "Out of Stock"}
                            </span>
                          </div>

                          <div className="h-[1px] bg-white/[0.04]" />

                          {/* Trigger simulated client transaction button */}
                          <button
                            onClick={() => msg.mediaId && handleSimulatePurchase(msg.mediaId)}
                            disabled={!msg.mediaStock || msg.mediaStock <= 0}
                            className={`w-full py-2.5 rounded-xl font-bold font-sans text-[10.5px] transition-all flex items-center justify-center gap-2 ${
                              msg.mediaStock && msg.mediaStock > 0
                                ? "bg-white hover:bg-[var(--text)] text-black active:scale-97 cursor-pointer"
                                : "bg-[var(--bg-elevated)] text-[var(--text-subtle)] border border-[var(--border)]"
                            }`}
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>{msg.mediaStock && msg.mediaStock > 0 ? "Simulate Direct WhatsApp Purchase (-1 Stock)" : "Sold Out"}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Scenario B media block overlay: list recommendations */}
                    {msg.alternatives && msg.alternatives.length > 0 && (
                      <div className="mt-4 space-y-3">
                        <p className="text-[10.5px] uppercase tracking-widest text-[var(--text-muted)] font-bold font-mono">Suggested Exhaust Alternatives:</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
                          {msg.alternatives.map((alt) => (
                            <div key={alt.id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden p-2 flex flex-col justify-between gap-3">
                              <img 
                                src={alt.image_url} 
                                alt={alt.name} 
                                className="w-full h-20 object-cover rounded-lg"
                                referrerPolicy="no-referrer"
                              />
                              <div className="space-y-1">
                                <h4 className="text-[11px] font-bold text-[var(--text)] truncate">{alt.name}</h4>
                                <div className="flex items-center gap-1.5 text-[10.5px] font-mono">
                                  <span className="text-green-400 font-extrabold">₹{alt.discount_price}</span>
                                  <span className="text-zinc-600 line-through text-[9.5px]">₹{alt.price}</span>
                                </div>
                                <p className="text-[9.5px] text-[var(--text-subtle)] font-medium">In Stock: {alt.stock} units</p>
                              </div>
                              <button
                                onClick={() => handleSimulatePurchase(alt.id)}
                                disabled={alt.stock <= 0}
                                className="w-full py-1.5 rounded-lg bg-white hover:bg-[var(--text)] text-black font-extrabold text-[9px] tracking-wide transition-all uppercase flex items-center justify-center gap-1.5 active:scale-97 cursor-pointer"
                              >
                                <ShoppingCart className="w-3 h-3" />
                                <span>Order Alt</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>

                  <span className="text-[9px] text-[var(--text-muted)] uppercase font-bold tracking-wider mt-1 font-mono pr-2">
                    {msg.sender === "user" ? "Simulated Customer" : "Autofy Bot Engine (24/7)"}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Action trigger label helper */}
          <div className="px-5 py-3 border-t border-[#121214] flex items-center gap-2 justify-center text-[10px] text-[var(--text-subtle)] font-sans">
            <Info className="w-3.5 h-3.5 text-[var(--text)]/40 flex-shrink-0" />
            <span>Click scenarios on the left. The chat above will show customized mock layouts with direct purchase buttons.</span>
          </div>

        </div>

      </div>

      {/* 3. PRODUCT & INVENTORY CONTROLLER SECTION */}
      <div className="space-y-4">
        
        {/* Toolbelt row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-950/20 border border-[var(--border)] p-4.5 rounded-2xl backdrop-blur-sm">
          
          {/* Searching and Sub Filtering checkboxes */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            
            {/* Search Input widget */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search inventory, categories, variants..."
                className="w-full bg-[var(--bg-card)] border border-[var(--border)] focus:border-[var(--border)] rounded-xl py-2 pl-9 pr-4 text-xs text-[var(--text)] placeholder-neutral-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Category selection selector */}
            <div className="flex items-center gap-1">
              <span className="text-[10.5px] uppercase tracking-wider text-[var(--text-muted)] font-extrabold font-mono mr-1">Category:</span>
              <div className="flex flex-wrap gap-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-[10.5px] font-bold font-sans transition-colors cursor-pointer ${
                      selectedCategory === cat
                        ? "bg-white text-black"
                        : "bg-white/[0.03] hover:bg-white/[0.06] text-[var(--text-muted)] hover:text-[var(--text)]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Quick Filter toggle checkboxes */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)]">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox"
                checked={filterLowStockOnly}
                onChange={() => setFilterLowStockOnly(!filterLowStockOnly)}
                className="rounded border-zinc-700 bg-zinc-900 checked:bg-white checked:border-white checked:text-black w-[18px] h-[18px] cursor-pointer accent-white"
              />
              <span className="group-hover:text-[var(--text)] transition-colors text-[11px] font-bold"> Low Stock Alerts Only</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox"
                checked={filterUnavailableOnly}
                onChange={() => setFilterUnavailableOnly(!filterUnavailableOnly)}
                className="rounded border-zinc-700 bg-zinc-900 checked:bg-white checked:border-white checked:text-black w-[18px] h-[18px] cursor-pointer accent-white"
              />
              <span className="group-hover:text-[var(--text)] transition-colors text-[11px] font-bold"> Offline Listings Only</span>
            </label>

            <div className="h-4 w-[1px] bg-white/[0.08] hidden sm:block" />

            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-white hover:bg-[var(--text)] active:scale-95 text-black font-extrabold text-[12px] rounded-xl transition-all flex items-center gap-2 shadow cursor-pointer ml-auto md:ml-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add New Product</span>
            </button>
          </div>

        </div>

        {/* 4. MAIN INVENTORY PRODUCTS GRID */}
        {filteredProducts.length === 0 ? (
          <div className="border border-[var(--border)] rounded-3xl p-14 text-center bg-[#070709] max-w-lg mx-auto space-y-4">
            <div className="w-12 h-12 rounded-full bg-white/[0.02] border border-[var(--border)] flex items-center justify-center mx-auto text-[var(--text-muted)]">
              <Package className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-[var(--text)] text-xs font-bold">No Products Match Filters</p>
              <p className="text-[11px] text-[var(--text-muted)] leading-normal">
                Currently, your catalog query returned 0 rows matching search parameters. Try resetting your search metrics or adjusting categories filters.
              </p>
            </div>
            <button 
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
                setFilterLowStockOnly(false);
                setFilterUnavailableOnly(false);
              }}
              className="px-4 py-2 text-[10.5px] font-extrabold uppercase tracking-wide text-[var(--text)] bg-white/[0.04] border border-[var(--border)] hover:bg-white/[0.08] rounded-xl transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            
            {filteredProducts.map((p) => {
              const isLowStock = p.stock <= p.low_stock_threshold && p.is_available;
              return (
                <div 
                  key={p.id}
                  className={`bg-[var(--bg-card)] border rounded-3xl overflow-hidden backdrop-blur-md transition-all duration-300 relative flex flex-col justify-between gap-4.5 ${
                    isLowStock 
                      ? "border-amber-500/25 shadow-[0_0_30px_rgba(245,158,11,0.02)]" 
                      : p.is_available 
                        ? "border-[var(--border)]" 
                        : "border-[var(--border)] opacity-65"
                  }`}
                >
                  
                  {/* Card upper image and category tags */}
                  <div className="relative">
                    <img 
                      src={p.image_url} 
                      alt={p.name} 
                      className="w-full h-44 object-cover"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Dark gradient shadow inside card image overlay */}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-neutral-950 to-transparent pointer-events-none" />

                    {/* Stock, warning and category pills inside card header */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                      <span className="px-2.5 py-1 bg-black/85 border border-white/10 rounded-full text-[9px] font-black uppercase text-[var(--text)] font-sans tracking-wide">
                        {p.category}
                      </span>

                      {/* Low Stock Indicator Pill */}
                      {isLowStock && (
                        <span className="px-2.5 py-1 bg-amber-500 text-black rounded-full text-[9.5px] font-black uppercase font-sans tracking-widest flex items-center gap-1 shadow-lg shadow-amber-500/10">
                          <AlertTriangle className="w-3.5 h-3.5" /> Low Stock
                        </span>
                      )}

                      {/* Offline/Discontinued Listing Label */}
                      {!p.is_available && (
                        <span className="px-2.5 py-1 bg-red-600 text-[var(--text)] rounded-full text-[9.5px] font-black uppercase font-mono tracking-widest flex items-center gap-1">
                          Offline
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Content details */}
                  <div className="px-5 pb-5 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="text-xs font-black text-[var(--text)] leading-snug">{p.name}</h4>
                        
                        {/* Edit delete fast toolkit icons */}
                        <div className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 bg-[var(--bg-elevated)] border border-[var(--border)] hover:bg-[var(--bg-elevated)] rounded-lg text-[var(--text)] transition-colors pointer-events-auto"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="p-1.5 bg-[var(--bg-elevated)] border border-[var(--border)] hover:bg-red-500/10 hover:text-red-400 rounded-lg text-[var(--text-muted)] transition-colors pointer-events-auto"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <p className="text-[10.5px] text-[var(--text-muted)] leading-relaxed max-w-[280px]">
                        {p.description || "No specific details reported."}
                      </p>

                      {/* Display variants list if exist */}
                      {p.variants && (
                        <div className="flex flex-wrap gap-1 pt-1.5">
                          {p.variants.split(";").map((variantBlock, blockIdx) => (
                            <span key={blockIdx} className="px-2 py-0.5 bg-white/[0.04] border border-[var(--border)] rounded text-[9.5px] font-medium text-[var(--text)] font-mono">
                              {variantBlock.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-4 pt-1.5 border-t border-[var(--border)]">
                      {/* Pricing row with instant discount percent flag */}
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[9px] uppercase tracking-wider text-[var(--text-subtle)] font-bold">Standard Pricing</p>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-xs font-black text-[var(--text)]">₹{p.discount_price.toLocaleString("en-IN")}</span>
                            {p.discount_percent > 0 && (
                              <>
                                <span className="text-[10.5px] line-through text-[var(--text-subtle)]">₹{p.price.toLocaleString("en-IN")}</span>
                                <span className="text-[9.5px] font-black text-green-400">-{p.discount_percent}%</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Availability toggle online/offline switch */}
                        <div className="text-right">
                          <span className="text-[9px] uppercase tracking-wider text-[var(--text-subtle)] font-bold block mb-1">Availability</span>
                          <button
                            onClick={() => handleToggleAvailability(p.id)}
                            className={`p-1.5 rounded-lg border transition-all text-[10px] font-bold font-sans flex items-center gap-1 cursor-pointer ${
                              p.is_available 
                                ? "bg-white/[0.03] hover:bg-white/[0.06] border-[var(--border)] text-[var(--text)]" 
                                : "bg-red-500/10 border-red-500/15 text-red-400 hover:bg-[var(--bg-elevated)]"
                            }`}
                          >
                            {p.is_available ? (
                              <>
                                <Eye className="w-3.5 h-3.5" /> <span>Mark Offline</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3.5 h-3.5" /> <span>Launch Live</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Stock units and immediate decrement scale */}
                      <div className="p-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl flex items-center justify-between">
                        <div>
                          <span className="text-[9px] uppercase tracking-wider text-[var(--text-subtle)] font-bold font-sans block">Stock Quantity</span>
                          <span className={`text-[12px] font-black ${p.stock <= p.low_stock_threshold ? "text-amber-400" : "text-[var(--text)]"}`}>
                            {p.stock} Unit(s)
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleQuickAdjustStock(p.id, -1)}
                            disabled={p.stock <= 0}
                            className="w-7 h-7 bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)] text-[var(--text)] border border-[var(--border)] rounded flex items-center justify-center text-xs font-bold transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                          >
                            -
                          </button>
                          <button
                            onClick={() => handleQuickAdjustStock(p.id, 1)}
                            className="w-7 h-7 bg-white text-black hover:bg-[var(--text)] rounded flex items-center justify-center text-xs font-black transition-all cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>
              );
            })}

          </div>
        )}

      </div>

      {/* 5. EDIT & MANAGE PRODUCT OVERLAY MODAL FORM */}
      <AnimatePresence>
        {managementModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[999]"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[#0b0c0f] border border-[var(--border)] rounded-3xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              
              <button 
                onClick={() => setManagementModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text)] rounded-lg transition-colors border border-[var(--border)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-[var(--border)] flex items-center justify-center text-[var(--text)] shadow">
                  <Package className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-[var(--text)] font-sans tracking-tight">
                  {editingProduct ? "Modify Active Product" : "Launch New Inventory Product"}
                </h3>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-4 text-left font-sans">
                
                {/* Field: Name */}
                <div className="space-y-1.5">
                  <label className="text-[10.5px] uppercase tracking-wider text-[var(--text-muted)] font-extrabold block">Product Title <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. AEW Exhaust for Interceptor 650"
                    className="w-full bg-[var(--bg-card)] border border-[var(--border)] focus:border-[var(--border)] text-xs text-[var(--text)] p-3 rounded-xl focus:outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Field: Category */}
                  <div className="space-y-1.5">
                    <label className="text-[10.5px] uppercase tracking-wider text-[var(--text-muted)] font-extrabold block">Category</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full bg-[var(--bg-card)] border border-[var(--border)] focus:border-[var(--border)] text-xs text-[var(--text)] p-3 rounded-xl focus:outline-none transition-colors appearance-none"
                    >
                      <option value="Exhausts">Exhausts</option>
                      <option value="Accessories">Accessories</option>
                      <option value="Suits & Apparel">Suits & Apparel</option>
                      <option value="General">General</option>
                    </select>
                  </div>

                  {/* Field: Price */}
                  <div className="space-y-1.5">
                    <label className="text-[10.5px] uppercase tracking-wider text-[var(--text-muted)] font-extrabold block">Original Price (₹) <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      placeholder="6500"
                      className="w-full bg-[var(--bg-card)] border border-[var(--border)] focus:border-[var(--border)] text-xs text-[var(--text)] p-3 rounded-xl focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {/* Field: Discount Percent */}
                  <div className="space-y-1.5">
                    <label className="text-[10.5px] uppercase tracking-wider text-[var(--text-muted)] font-extrabold block">Discount %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formDiscountPercent}
                      onChange={(e) => setFormDiscountPercent(e.target.value || "0")}
                      placeholder="10"
                      className="w-full bg-[var(--bg-card)] border border-[var(--border)] focus:border-[var(--border)] text-xs text-[var(--text)] p-3 rounded-xl focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Field: Stock */}
                  <div className="space-y-1.5">
                    <label className="text-[10.5px] uppercase tracking-wider text-[var(--text-muted)] font-extrabold block">In Stock <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formStock}
                      onChange={(e) => setFormStock(e.target.value)}
                      placeholder="12"
                      className="w-full bg-[var(--bg-card)] border border-[var(--border)] focus:border-[var(--border)] text-xs text-[var(--text)] p-3 rounded-xl focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Field: Low Stock Threshold */}
                  <div className="space-y-1.5">
                    <label className="text-[10.5px] uppercase tracking-wider text-[var(--text-muted)] font-extrabold block">Alert Threshold</label>
                    <input
                      type="number"
                      min="0"
                      value={formLowStockThreshold}
                      onChange={(e) => setFormLowStockThreshold(e.target.value)}
                      placeholder="3"
                      className="w-full bg-[var(--bg-card)] border border-[var(--border)] focus:border-[var(--border)] text-xs text-[var(--text)] p-3 rounded-xl focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Field: Image URL */}
                <div className="space-y-1.5">
                  <label className="text-[10.5px] uppercase tracking-wider text-[var(--text-muted)] font-extrabold block">Primary Photo URL</label>
                  <input
                    type="url"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full bg-[var(--bg-card)] border border-[var(--border)] focus:border-[var(--border)] text-xs text-[var(--text)] p-3 rounded-xl focus:outline-none transition-colors"
                  />
                </div>

                {/* Field: Product Variants attributes */}
                <div className="space-y-1.5">
                  <label className="text-[10.5px] uppercase tracking-wider text-[var(--text-muted)] font-extrabold block">Attributes & Variants</label>
                  <input
                    type="text"
                    value={formVariants}
                    onChange={(e) => setFormVariants(e.target.value)}
                    placeholder="e.g. Color: Polished Chrome, Matte Black; Fits: Classic 350"
                    className="w-full bg-[var(--bg-card)] border border-[var(--border)] focus:border-[var(--border)] text-xs text-[var(--text)] p-3 rounded-xl focus:outline-none transition-colors"
                  />
                  <span className="text-[9px] text-[var(--text-muted)] leading-none block font-mono">Use key-value layouts separated by semicolons.</span>
                </div>

                {/* Field: Description */}
                <div className="space-y-1.5">
                  <label className="text-[10.5px] uppercase tracking-wider text-[var(--text-muted)] font-extrabold block">Usage Description</label>
                  <textarea
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Genuine polished steel rumble silencer pack..."
                    className="w-full bg-[var(--bg-card)] border border-[var(--border)] focus:border-[var(--border)] text-xs text-[var(--text)] p-3 rounded-xl focus:outline-none transition-colors resize-none"
                  />
                </div>

                {/* Field: Availability */}
                <div className="flex items-center justify-between p-3.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl">
                  <div>
                    <label className="text-[11px] font-bold text-[var(--text)] block">Publish Instant to WhatsApp Bot</label>
                    <span className="text-[9.5px] text-[var(--text-subtle)]">Allow customers to query and purchase this item in chat live.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormIsAvailable(!formIsAvailable)}
                    className={`w-10 h-6.5 rounded-full p-1 transition-all outline-none flex items-center justify-start ${
                      formIsAvailable ? "bg-[#ffffff]" : "bg-[var(--bg-elevated)]"
                    }`}
                  >
                    <div className={`w-[18px] h-[18px] rounded-full shadow transition-all ${
                      formIsAvailable ? "translate-x-3.5 bg-black" : "translate-x-0 bg-[var(--text-muted)]"
                    }`} />
                  </button>
                </div>

                {/* Actions row */}
                <div className="pt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setManagementModalOpen(false)}
                    className="flex-1 py-3 border border-[var(--border)] hover:bg-white/[0.03] text-[var(--text)] font-extrabold text-xs rounded-xl transition-colors cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-white hover:bg-[var(--text)] active:scale-97 text-black font-black text-xs rounded-xl transition-colors cursor-pointer text-center"
                  >
                    {editingProduct ? "Save Changes" : "Confirm Addition"}
                  </button>
                </div>

              </form>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
