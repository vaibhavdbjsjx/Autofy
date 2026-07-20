import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShoppingBag,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  XCircle,
  RotateCcw,
  AlertTriangle,
  MapPin,
  Mail,
  Phone,
  DollarSign,
  TrendingUp,
  Tag,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  User,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles,
  Info,
  Sliders,
  Check
} from "lucide-react";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  items: OrderItem[];
  total_price: number;
  discount_amount: number;
  status: "Pending" | "Confirmed" | "Packed" | "Shipped" | "Delivered" | "Cancelled" | "Refunded";
  shipping_carrier?: string;
  tracking_number?: string;
  estimated_delivery?: string;
  cancellation_reason?: string;
  refund_reason?: string;
  refund_amount?: number;
  notes?: string;
  created_at: string;
}

interface OrdersTabProps {
  productsList?: any[]; // For syncing product catalog and stock adjustments
  setProductsList?: React.Dispatch<React.SetStateAction<any[]>>;
  triggerNotification: (msg: string) => void;
}

export const OrdersTab: React.FC<OrdersTabProps> = ({
  productsList = [],
  setProductsList,
  triggerNotification
}) => {
  // Pre-populated realistic initial orders
  const [orders, setOrders] = useState<Order[]>([
    {
      id: "ORD-9382",
      customer_name: "Rahul Sharma",
      customer_email: "rahul.sharma@gmail.com",
      customer_phone: "+91 98765 43210",
      shipping_address: "Plot 42, Sector 17, Vashi, Navi Mumbai, MH - 400703",
      items: [
        { id: "p-1", name: "AEW Exhaust for Classic 350", quantity: 1, price: 5850 }
      ],
      total_price: 5850,
      discount_amount: 650,
      status: "Shipped",
      shipping_carrier: "Delhivery Air",
      tracking_number: "DEL-93820120",
      estimated_delivery: "2026-06-25",
      notes: "Please deliver after 5:00 PM.",
      created_at: "2026-06-18 10:30"
    },
    {
      id: "ORD-8441",
      customer_name: "John Doe",
      customer_email: "john.doe@example.com",
      customer_phone: "+1 (555) 019-2834",
      shipping_address: "128 West Ivy Street, San Diego, CA - 92101",
      items: [
        { id: "p-4", name: "Carbon Dual-Ring Riding Gloves", quantity: 2, price: 2400 }
      ],
      total_price: 4800,
      discount_amount: 0,
      status: "Delivered",
      shipping_carrier: "DHL Express",
      tracking_number: "DHL-844183",
      estimated_delivery: "2026-06-19",
      notes: "Leave package at the front porch.",
      created_at: "2026-06-15 14:15"
    },
    {
      id: "ORD-7128",
      customer_name: "Amit Patel",
      customer_email: "amit.patel@yahoo.com",
      customer_phone: "+91 99112 23344",
      shipping_address: "Block B-4, Green Glen Layout, Bellandur, Bangalore, KA - 560103",
      items: [
        { id: "p-5", name: "Stealth Knight Full Face Helmet", quantity: 1, price: 3600 }
      ],
      total_price: 3600,
      discount_amount: 900,
      status: "Pending",
      notes: "Ring bell twice.",
      created_at: "2026-06-20 08:00"
    },
    {
      id: "ORD-1102",
      customer_name: "Vikram Singh",
      customer_email: "vikram.singh@outlook.com",
      customer_phone: "+91 98888 77777",
      shipping_address: "C-12, Malviya Nagar, Jaipur, RJ - 302017",
      items: [
        { id: "p-2", name: "Red Rooster Performance Exhaust", quantity: 1, price: 6120 }
      ],
      total_price: 6120,
      discount_amount: 1080,
      status: "Confirmed",
      created_at: "2026-06-19 18:45"
    }
  ]);

  // View States
  const [activeTab, setActiveTab] = useState<"dashboard" | "admin" | "customer" | "create">("dashboard");
  
  // Admin Filter States
  const [adminSearch, setAdminSearch] = useState("");
  const [adminStatusFilter, setAdminStatusFilter] = useState<string>("All");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Admin Action States (Carrier inputs, refund amount)
  const [tempCarrier, setTempCarrier] = useState("");
  const [tempTracking, setTempTracking] = useState("");
  const [tempRefundAmount, setTempRefundAmount] = useState("");
  const [tempAdminActionNotes, setTempAdminActionNotes] = useState("");

  // Customer Tracking ID Search
  const [customerSearchId, setCustomerSearchId] = useState("ORD-9382");
  const [selectedTrackOrder, setSelectedTrackOrder] = useState<Order | null>(null);
  const [showCancelRequestModal, setShowCancelRequestModal] = useState(false);
  const [showRefundRequestModal, setShowRefundRequestModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [refundReason, setRefundReason] = useState("");

  // Create Order state
  const [billingName, setBillingName] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [billingPhone, setBillingPhone] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [selectedItems, setSelectedItems] = useState<Array<{ id: string; name: string; price: number; quantity: number }>>([]);
  const [newItemId, setNewItemId] = useState("");
  const [newItemQty, setNewItemIdQty] = useState(1);

  // Pre-configured fallback products list in case dynamic React Context lists are empty
  const defaultProducts = [
    { id: "p-1", name: "AEW Exhaust for Classic 350", price: 5850, stock: 12 },
    { id: "p-2", name: "Red Rooster Performance Exhaust", price: 6120, stock: 8 },
    { id: "p-3", name: "Gursewak Custom Exhaust Core", price: 4800, stock: 0 },
    { id: "p-4", name: "Carbon Dual-Ring Riding Gloves", price: 2400, stock: 3 },
    { id: "p-5", name: "Stealth Knight Full Face Helmet", price: 3600, stock: 14 }
  ];

  // Resolve inventory items
  const activeCatalog = productsList && productsList.length > 0 
    ? productsList.map(p => ({
        id: p.id,
        name: p.name,
        price: typeof p.price === 'string' ? parseFloat(p.price.replace(/[^\d.]/g, '')) || 500 : p.price || 500,
        stock: p.stockQuantity !== undefined ? p.stockQuantity : 10
      }))
    : defaultProducts;

  // Auto-fill tracking on customer tab load or change
  useEffect(() => {
    const matched = orders.find(o => o.id === customerSearchId);
    if (matched) {
      setSelectedTrackOrder(matched);
    } else if (orders.length > 0) {
      setSelectedTrackOrder(orders[0]);
      setCustomerSearchId(orders[0].id);
    }
  }, [customerSearchId, orders]);

  // Handle Order Status transitions
  const handleUpdateStatus = (orderId: string, nextStatus: Order["status"]) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (!targetOrder) return;

    const updated = orders.map(o => {
      if (o.id === orderId) {
        let updateObj: Partial<Order> = { status: nextStatus };
        if (nextStatus === "Shipped") {
          updateObj.shipping_carrier = tempCarrier || "Standard Mail Service";
          updateObj.tracking_number = tempTracking || "TRK-" + Math.floor(Math.random() * 9000000);
          updateObj.estimated_delivery = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        }
        return { ...o, ...updateObj };
      }
      return o;
    });

    setOrders(updated);
    triggerNotification(`Order #${orderId} status code progressed safely to ${nextStatus}.`);

    // Reset inputs
    setTempCarrier("");
    setTempTracking("");
  };

  // Submit cancellation (Customer flow)
  const handleCustomerCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      triggerNotification("Please provide a reason to cancel this shipment.");
      return;
    }
    if (!selectedTrackOrder) return;

    // Direct automated cancel with stock recovery
    const updated = orders.map(o => {
      if (o.id === selectedTrackOrder.id) {
        return {
          ...o,
          status: "Cancelled" as const,
          cancellation_reason: cancelReason
        };
      }
      return o;
    });

    setOrders(updated);
    
    // Automatically revert stocks of the products
    if (setProductsList && productsList && productsList.length > 0) {
      // Revert product counts
      const updatedProducts = productsList.map(p => {
        const orderedItem = selectedTrackOrder.items.find(item => item.id === p.id);
        if (orderedItem) {
          return {
            ...p,
            stockQuantity: (p.stockQuantity || 0) + orderedItem.quantity
          };
        }
        return p;
      });
      setProductsList(updatedProducts);
    }

    triggerNotification(`Order successfully cancelled. In-stock levels auto-restored inside catalog inventory pool.`);
    setShowCancelRequestModal(false);
    setCancelReason("");
  };

  // Submit refund request (Customer flow)
  const handleCustomerRefund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundReason.trim()) {
      triggerNotification("Please fill in why you are claiming a refund.");
      return;
    }
    if (!selectedTrackOrder) return;

    const updated = orders.map(o => {
      if (o.id === selectedTrackOrder.id) {
        return {
          ...o,
          status: "Refunded" as const,
          refund_reason: refundReason,
          refund_amount: o.total_price // Full refund default
        };
      }
      return o;
    });

    setOrders(updated);
    triggerNotification(`Order refund claim for ₹${selectedTrackOrder.total_price.toLocaleString("en-IN")} submitted and approved.`);
    setShowRefundRequestModal(false);
    setRefundReason("");
  };

  // Fast manual add item selection to order builder
  const handleAddProductToOrderBuilder = () => {
    if (!newItemId) {
      triggerNotification("Please choose a valid product from the active catalog.");
      return;
    }

    const matched = activeCatalog.find(p => p.id === newItemId);
    if (!matched) return;

    // Check if limits exceeded
    if (matched.stock < newItemQty) {
      triggerNotification(`Warning: Only ${matched.stock} units are currently present in your inventory cache.`);
    }

    // Check if item already exists in builder line
    const exists = selectedItems.find(item => item.id === newItemId);
    if (exists) {
      setSelectedItems(selectedItems.map(item => 
        item.id === newItemId ? { ...item, quantity: item.quantity + newItemQty } : item
      ));
    } else {
      setSelectedItems([...selectedItems, {
        id: matched.id,
        name: matched.name,
        price: matched.price,
        quantity: newItemQty
      }]);
    }

    triggerNotification(`Added "${matched.name}" x ${newItemQty} units to order invoice.`);
    setNewItemId("");
    setNewItemIdQty(1);
  };

  // Remove lines from billing invoice
  const handleRemoveItemFromBuilder = (itemId: string) => {
    setSelectedItems(selectedItems.filter(item => item.id !== itemId));
  };

  // Execute full client order generation
  const handleCompileOrderCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!billingName.trim() || !billingAddress.trim()) {
      triggerNotification("Please define both standard recipient name and delivery address.");
      return;
    }
    if (selectedItems.length === 0) {
      triggerNotification("Please load at least one product line in your invoice before placing orders.");
      return;
    }

    // Calc financial totals
    const totalWithDiscounts = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const mockDiscount = Math.floor(totalWithDiscounts * 0.1); // default 10% promo mock value
    const finalBillValue = totalWithDiscounts - mockDiscount;

    const invoiceOrder: Order = {
      id: "ORD-" + Math.floor(1000 + Math.random() * 9000),
      customer_name: billingName,
      customer_email: billingEmail || "retail.buyer@outlook.com",
      customer_phone: billingPhone || "+91 91100 22003",
      shipping_address: billingAddress,
      items: selectedItems,
      total_price: finalBillValue,
      discount_amount: mockDiscount,
      status: "Pending",
      notes: orderNotes,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    setOrders([invoiceOrder, ...orders]);

    // ----------------------------------------------------
    // CRITICAL: Reduce stock quantities automatically in React Product management context!
    // ----------------------------------------------------
    if (setProductsList && productsList && productsList.length > 0) {
      const updatedCatalog = productsList.map(p => {
        const itemLine = selectedItems.find(line => line.id === p.id);
        if (itemLine) {
          const rem = Math.max(0, (p.stockQuantity || 10) - itemLine.quantity);
          // Alert prompt if hitting low stock boundaries
          if (rem <= (p.lowStockThreshold || 4)) {
            triggerNotification(`System Alert: "${p.name}" stock level fell below safety margin (${rem} in stock).`);
          }
          return {
            ...p,
            stockQuantity: rem
          };
        }
        return p;
      });
      setProductsList(updatedCatalog);
    }

    // Success outcomes
    triggerNotification(`Success! Verified Order #${invoiceOrder.id} compiled. Stock values adjusted down.`);
    
    // Clear form
    setBillingName("");
    setBillingEmail("");
    setBillingPhone("");
    setBillingAddress("");
    setOrderNotes("");
    setSelectedItems([]);
    setActiveTab("admin");
  };

  // Calculation helpers for overall dashboard analysis Tab
  const totalRevenue = orders
    .filter(o => o.status !== "Cancelled" && o.status !== "Refunded")
    .reduce((acu, index) => acu + index.total_price, 0);

  const pendingCount = orders.filter(o => o.status === "Pending").length;
  const confirmedCount = orders.filter(o => o.status === "Confirmed").length;
  const packedCount = orders.filter(o => o.status === "Packed").length;
  const shippedCount = orders.filter(o => o.status === "Shipped").length;
  const deliveredCount = orders.filter(o => o.status === "Delivered").length;
  const cancelRefundCount = orders.filter(o => o.status === "Cancelled" || o.status === "Refunded").length;

  // Render collapsible order logic
  const toggleRowExpansion = (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(orderId);
      // Pre-fill fields for actions
      const ord = orders.find(o => o.id === orderId);
      if (ord) {
        setTempCarrier(ord.shipping_carrier || "");
        setTempTracking(ord.tracking_number || "");
        setTempRefundAmount(ord.refund_amount?.toString() || ord.total_price.toString());
      }
    }
  };

  // Filter listings inside admin table
  const filteredOrders = orders.filter(o => {
    const query = adminSearch.toLowerCase();
    const matchSearch = 
      o.customer_name.toLowerCase().includes(query) || 
      o.id.toLowerCase().includes(query) ||
      o.customer_email.toLowerCase().includes(query) ||
      (o.tracking_number && o.tracking_number.toLowerCase().includes(query));

    const matchStatus = adminStatusFilter === "All" || o.status === adminStatusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-8 text-left">
      
      {/* SECTION TITLE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-neutral-300 stroke-[1.8]" />
            Order & Shipping Control Center
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Configure order stages, trace courier partners, fulfill pending invoices, and adjust real stocks instantly.
          </p>
        </div>

        {/* CONTROLS SWITCH TABS */}
        <div className="flex flex-wrap gap-1 bg-[#0b0c10] border border-white/[0.06] p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "dashboard" ? "bg-white text-black font-black" : "text-neutral-400 hover:text-white"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("admin")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all relative ${
              activeTab === "admin" ? "bg-white text-black font-black" : "text-neutral-400 hover:text-white"
            }`}
          >
            Admin Panel
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("customer")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "customer" ? "bg-white text-black font-black" : "text-neutral-400 hover:text-white"
            }`}
          >
            Customer Tracker View
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 bg-var(--bg-elevated) border border-white/[0.08] ${
              activeTab === "create" ? "bg-white text-black font-black" : "text-neutral-300 hover:text-white"
            }`}
          >
            <Plus className="w-3 h-3" />
            Compile New Order
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE TABS */}
      
      {/* 1. DASHBOARD OVERVIEW */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          
          {/* STATS DECK */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* KPI: Net earnings */}
            <div className="bg-[#0e0e11] border border-white/[0.06] p-5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#9CA3AF] font-extrabold font-sans">
                  Completed Revenue
                </span>
                <p className="text-2xl font-black text-white mt-1.5">
                  ₹{totalRevenue.toLocaleString("en-IN")}
                </p>
                <div className="text-[10px] mt-1 text-green-400 font-bold flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Gross margins standard</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-neutral-300 shadow">
                <DollarSign className="w-5 h-5 stroke-[1.8]" />
              </div>
            </div>

            {/* KPI: Shipped volume */}
            <div className="bg-[#0e0e11] border border-white/[0.06] p-5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#9CA3AF] font-extrabold font-sans">
                  Active Shipments
                </span>
                <p className="text-2xl font-black text-white mt-1.5">{shippedCount}</p>
                <div className="text-[10px] mt-1 text-neutral-400 font-bold">
                  In transit via courier partners
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-neutral-300 shadow">
                <Truck className="w-5 h-5 stroke-[1.8]" />
              </div>
            </div>

            {/* KPI: Unprocessed queues */}
            <div className={`p-5 rounded-2xl border transition-colors flex items-center justify-between ${
              pendingCount > 0 
                ? "bg-amber-950/20 border-amber-500/20 text-amber-300" 
                : "bg-[#0e0e11] border-white/[0.06] text-white"
            }`}>
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#9CA3AF] font-extrabold font-sans">
                  Pending Approvals
                </span>
                <p className="text-2xl font-black mt-1.5">{pendingCount}</p>
                <div className="text-[10px] mt-1 text-[#D1D5DB] font-medium">
                  Needs instant confirmation
                </div>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow ${
                pendingCount > 0 
                  ? "bg-amber-500/10 border border-amber-500/25 text-amber-400" 
                  : "bg-white/[0.04] border border-white/[0.08]"
              }`}>
                <Clock className="w-5 h-5 stroke-[1.8]" />
              </div>
            </div>

            {/* KPI: Delivered orders */}
            <div className="bg-[#0e0e11] border border-white/[0.06] p-5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#9CA3AF] font-extrabold font-sans">
                  Delivered Total
                </span>
                <p className="text-2xl font-black text-white mt-1.5">{deliveredCount}</p>
                <div className="text-[10px] mt-1 text-green-400 font-medium">
                  100% CSAT feedback rate
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-neutral-300 shadow">
                <CheckCircle2 className="w-5 h-5 stroke-[1.8]" />
              </div>
            </div>

          </div>

          {/* TWO PANEL ANALYTICS bento info */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Visual breakdown progress indicators */}
            <div className="lg:col-span-8 bg-[#0b0c10] border border-white/[0.08] rounded-3xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider font-sans">
                    Logistics Flow Stat Distribution
                  </h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">Summary of parcels logged by status categories.</p>
                </div>
                <div className="text-[9px] text-neutral-500 font-mono font-bold uppercase py-0.5 px-2 bg-var(--bg-elevated) border border-var(--border) rounded">
                  System Live Feed
                </div>
              </div>

              {/* Status bar meter stacks */}
              <div className="space-y-4">
                
                {/* 1. Pending meter */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-mono text-neutral-400">
                    <span className="flex items-center gap-1 text-amber-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Pending Verification
                    </span>
                    <span className="font-bold text-white">{pendingCount} orders ({Math.round(pendingCount / orders.length * 100) || 0}%)</span>
                  </div>
                  <div className="h-2 w-full bg-var(--bg-elevated) rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full" 
                      style={{ width: `${Math.max(4, (pendingCount / orders.length) * 100)}%` }} 
                    />
                  </div>
                </div>

                {/* 2. Shipped / Delivered meter */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-mono text-neutral-400">
                    <span className="flex items-center gap-1 text-green-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Active Delivery / Shipped
                    </span>
                    <span className="font-bold text-white">{shippedCount + deliveredCount} parcels ({Math.round((shippedCount + deliveredCount) / orders.length * 100) || 0}%)</span>
                  </div>
                  <div className="h-2 w-full bg-var(--bg-elevated) rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full" 
                      style={{ width: `${Math.max(4, ((shippedCount + deliveredCount) / orders.length) * 100)}%` }} 
                    />
                  </div>
                </div>

                {/* 3. Confirmed & Packed meter */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-mono text-neutral-400">
                    <span className="flex items-center gap-1 text-blue-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Confirmed / Packing Core
                    </span>
                    <span className="font-bold text-white">{confirmedCount + packedCount} parcels ({Math.round((confirmedCount + packedCount) / orders.length * 100) || 0}%)</span>
                  </div>
                  <div className="h-2 w-full bg-var(--bg-elevated) rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full" 
                      style={{ width: `${Math.max(4, ((confirmedCount + packedCount) / orders.length) * 100)}%` }} 
                    />
                  </div>
                </div>

                {/* 4. Refunds & cancelled claims */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-mono text-neutral-400">
                    <span className="flex items-center gap-1 text-red-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Cancelled or Refunded
                    </span>
                    <span className="font-bold text-white">{cancelRefundCount} claims ({Math.round(cancelRefundCount / orders.length * 100) || 0}%)</span>
                  </div>
                  <div className="h-2 w-full bg-var(--bg-elevated) rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500 rounded-full" 
                      style={{ width: `${Math.max(4, (cancelRefundCount / orders.length) * 100)}%` }} 
                    />
                  </div>
                </div>

              </div>

              {/* Extra advisory prompt */}
              <div className="p-4 bg-white/[0.02] border border-white/[0.04] rounded-2xl flex items-start gap-3">
                <Info className="w-4 h-4 text-neutral-300 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <h5 className="text-xs font-bold text-neutral-200">Continuous Stock Reduction Integration</h5>
                  <p className="text-[10.5px] text-neutral-400 leading-relaxed font-sans">
                    Upon successfully compiled customer checkouts, relevant exhaust inventories are checked and depleted instantly. In case of cancellation claims, quantities are securely re-allocated automatically with trace indicators.
                  </p>
                </div>
              </div>

            </div>

            {/* Quick logistics activities log */}
            <div className="lg:col-span-4 bg-[#0b0c10] border border-white/[0.08] rounded-3xl p-6 flex flex-col justify-between gap-5 text-left">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-[18px] h-[18px] text-neutral-400" />
                  <h4 className="text-xs uppercase tracking-wider text-neutral-200 font-extrabold">Active System Logs</h4>
                </div>

                <div className="space-y-4">
                  {orders.slice(0, 4).map((o, index) => (
                    <div key={index} className="flex gap-3 text-xs border-l border-white/10 pl-3 relative">
                      <span className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-zinc-300 pointer-events-none" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{o.id}</span>
                          <span className={`text-[9.5px] font-black uppercase ${
                            o.status === "Delivered" ? "text-green-400" : o.status === "Pending" ? "text-amber-400" : "text-neutral-400"
                          }`}>{o.status}</span>
                        </div>
                        <p className="text-[10.5px] text-neutral-400 truncate max-w-[200px]">{o.customer_name} placed checkout of ₹{o.total_price}</p>
                        <span className="text-[9.5px] text-neutral-500 font-medium">{o.created_at}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => setActiveTab("admin")}
                className="w-full py-2.5 bg-white hover:bg-neutral-200 text-black font-extrabold text-[11px] rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-97"
              >
                <span>Navigate to Admin Board</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>
      )}

      {/* 2. ADMIN PORTAL (CRUD SECTIONS & DISPATCH STATUS TOGGLES) */}
      {activeTab === "admin" && (
        <div className="space-y-6">
          
          {/* Admin filters & Search bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4.5 bg-zinc-950/20 border border-white/[0.04] rounded-2xl backdrop-blur-sm">
            
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                placeholder="Search Order ID, customers, email, courier..."
                className="w-full bg-[#111113] border border-white/[0.08] focus:border-white/[0.18] rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-neutral-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Quick status checkboxes */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10.5px] font-extrabold text-neutral-400 uppercase tracking-widest mr-2">Filter Phase:</span>
              {["All", "Pending", "Confirmed", "Packed", "Shipped", "Delivered", "Cancelled", "Refunded"].map((phase) => (
                <button
                  key={phase}
                  onClick={() => setAdminStatusFilter(phase)}
                  className={`px-3 py-1.5 rounded-lg text-[10.5px] font-bold transition-colors cursor-pointer ${
                    adminStatusFilter === phase
                      ? "bg-white text-black"
                      : "bg-white/[0.03] hover:bg-white/[0.06] text-neutral-400"
                  }`}
                >
                  {phase}
                </button>
              ))}
            </div>

          </div>

          {/* ADMIN LIST OF ORDERS */}
          {filteredOrders.length === 0 ? (
            <div className="text-center p-14 border border-white/[0.06] rounded-3xl bg-[#0e0e11] max-w-md mx-auto space-y-4">
              <div className="w-11 h-11 bg-white/[0.02] border border-white/[0.06] rounded-xl flex items-center justify-center mx-auto text-neutral-400">
                <Search className="w-[22px] h-[22px]" />
              </div>
              <div className="space-y-1">
                <p className="text-white text-xs font-bold">No Shipments Match Query</p>
                <p className="text-[10.5px] text-neutral-400 leading-normal">
                  Try clearing searches or picking alternative phase status logs above.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredOrders.map((o) => {
                const isExpanded = expandedOrderId === o.id;
                
                return (
                  <div
                    key={o.id}
                    className={`bg-[#0C0C0E] border rounded-2xl overflow-hidden transition-all duration-300 text-left ${
                      isExpanded 
                        ? "border-neutral-700 bg-neutral-950/40" 
                        : "border-white/[0.05] hover:border-white/10"
                    }`}
                  >
                    
                    {/* Collapsible Header row */}
                    <div 
                      onClick={() => toggleRowExpansion(o.id)}
                      className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-white font-mono text-[10.5px] font-extrabold">
                          #
                        </div>
                        <div>
                          <p className="text-xs font-black text-white">{o.id}</p>
                          <p className="text-[10px] text-neutral-400 font-sans mt-0.5">{o.created_at} • {o.items.length} product lines</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4.5 justify-between sm:justify-end">
                        
                        <div className="space-y-0.5 text-left sm:text-right">
                          <p className="text-xs font-black text-white">₹{o.total_price.toLocaleString("en-IN")}</p>
                          <p className="text-[9.5px] text-neutral-400 font-sans">
                            {o.customer_name}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Colored status pills */}
                          <span className={`px-2.5 py-1 text-[9.5px] font-black uppercase rounded-full ${
                            o.status === "Pending" ? "bg-amber-500/10 text-amber-400 border border-amber-500/15" :
                            o.status === "Confirmed" ? "bg-blue-500/10 text-blue-400 border border-blue-500/15" :
                            o.status === "Packed" ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/15" :
                            o.status === "Shipped" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/15" :
                            o.status === "Delivered" ? "bg-green-500/10 text-green-400 border border-green-500/15" :
                            o.status === "Cancelled" ? "bg-red-500/10 text-red-400 border border-red-500/15" :
                            "bg-purple-500/10 text-purple-400 border border-purple-500/15"
                          }`}>
                            {o.status}
                          </span>

                          <div>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-neutral-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-neutral-400" />
                            )}
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Expandable internal contents details and actions form */}
                    {isExpanded && (
                      <div className="px-5 pb-6 border-t border-white/[0.04] pt-5 bg-[#08080a]/60 space-y-5">
                        
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                          
                          {/* Shipping Recipient descriptors */}
                          <div className="lg:col-span-5 space-y-3">
                            <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-300">Recipient shipping address</h5>
                            
                            <div className="space-y-2 text-xs text-neutral-400">
                              <p className="font-bold text-white text-[12px]">{o.customer_name}</p>
                              
                              <div className="space-y-1.5 font-sans justify-start leading-relaxed text-[10.5px]">
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-3.5 h-3.5 text-white/50 flex-shrink-0" />
                                  <span>{o.shipping_address}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Mail className="w-3.5 h-3.5 text-white/50 flex-shrink-0" />
                                  <span>{o.customer_email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Phone className="w-3.5 h-3.5 text-white/50 flex-shrink-0" />
                                  <span>{o.customer_phone}</span>
                                </div>
                              </div>
                            </div>

                            {o.notes && (
                              <div className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl">
                                <p className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Customer Notes:</p>
                                <p className="text-[11px] text-zinc-300 mt-1">{o.notes}</p>
                              </div>
                            )}

                            {/* Show details for cancellation request or refunds */}
                            {o.cancellation_reason && (
                              <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl space-y-1">
                                <p className="text-[10px] uppercase font-black text-red-400 tracking-wider">Cancellation Reason Provided:</p>
                                <p className="text-[11px] text-zinc-300">{o.cancellation_reason}</p>
                              </div>
                            )}

                            {o.refund_reason && (
                              <div className="p-3 bg-purple-950/20 border border-purple-500/20 rounded-xl space-y-1">
                                <p className="text-[10px] uppercase font-black text-purple-400 tracking-wider">Refund Reason Claimed:</p>
                                <p className="text-[11px] text-zinc-300">{o.refund_reason}</p>
                                {o.refund_amount && (
                                  <p className="text-[10.5px] text-purple-300 font-bold">Approved Refund Value: ₹{o.refund_amount.toLocaleString("en-IN")}</p>
                                )}
                              </div>
                            )}

                          </div>

                          {/* Ordered item rows listed */}
                          <div className="lg:col-span-4 space-y-3 border-t lg:border-t-0 lg:border-x border-white/[0.04] lg:px-5">
                            <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-[#9CA3AF]">Ordered Product specifications</h5>
                            
                            <div className="space-y-2">
                              {o.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-[#0d0d11] p-2.5 rounded-xl border border-white/[0.04]">
                                  <div>
                                    <p className="text-xs font-bold text-white truncate max-w-[150px]">{item.name}</p>
                                    <p className="text-[9.5px] text-neutral-500 mt-0.5">₹{item.price.toLocaleString("en-IN")} each</p>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-xs text-neutral-300 font-mono font-bold">Qty: {item.quantity}</span>
                                    <p className="text-[10.5px] text-white font-bold mt-0.5">₹{(item.price * item.quantity).toLocaleString("en-IN")}</p>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="pt-2 border-t border-white/[0.04] flex justify-between text-xs text-neutral-300">
                              <span>Invoice Itemized:</span>
                              <span className="text-white font-extrabold">₹{(o.total_price + o.discount_amount).toLocaleString("en-IN")}</span>
                            </div>
                            {o.discount_amount > 0 && (
                              <div className="flex justify-between text-xs text-neutral-400 font-medium">
                                <span>Applied Promo Discount:</span>
                                <span className="text-green-400 font-medium">-₹{o.discount_amount.toLocaleString("en-IN")}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-xs font-bold text-white">
                              <span>Final paid Total:</span>
                              <span className="font-mono text-white text-[13px]">₹{o.total_price.toLocaleString("en-IN")}</span>
                            </div>

                          </div>

                          {/* Admin Execution Action Board */}
                          <div className="lg:col-span-3 space-y-3">
                            <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-300">Dispatch Logistics Controller</h5>
                            
                            <div className="space-y-2">
                              
                              {/* Step-by-step progress operations */}
                              {o.status === "Pending" && (
                                <button
                                  onClick={() => handleUpdateStatus(o.id, "Confirmed")}
                                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[10.5px] rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" /> Approve & Confirm Order
                                </button>
                              )}

                              {o.status === "Confirmed" && (
                                <button
                                  onClick={() => handleUpdateStatus(o.id, "Packed")}
                                  className="w-full py-2 bg-yellow-600 hover:bg-yellow-500 text-white font-extrabold text-[10.5px] rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <Package className="w-3.5 h-3.5" /> Mark Packed & Ready
                                </button>
                              )}

                              {o.status === "Packed" && (
                                <div className="space-y-2.5 bg-var(--bg-elevated)/50 p-3 rounded-xl border border-white/[0.04]">
                                  <p className="text-[9px] uppercase font-extrabold text-neutral-400">Configure Shipping Codes:</p>
                                  
                                  <input 
                                    type="text"
                                    placeholder="Courier Partner (e.g. Delhivery)"
                                    value={tempCarrier}
                                    onChange={(e) => setTempCarrier(e.target.value)}
                                    className="w-full bg-black border border-white/[0.08] rounded-lg py-1 px-2.5 text-[10.5px] text-white focus:outline-none"
                                  />

                                  <input 
                                    type="text"
                                    placeholder="Tracking ID (e.g. DEL-9321)"
                                    value={tempTracking}
                                    onChange={(e) => setTempTracking(e.target.value)}
                                    className="w-full bg-black border border-white/[0.08] rounded-lg py-1 px-2.5 text-[10.5px] text-white focus:outline-none"
                                  />

                                  <button
                                    onClick={() => handleUpdateStatus(o.id, "Shipped")}
                                    className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-[10.5px] rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    <Truck className="w-3.5 h-3.5" /> Dispatch Shipment (Shipped)
                                  </button>
                                </div>
                              )}

                              {o.status === "Shipped" && (
                                <button
                                  onClick={() => handleUpdateStatus(o.id, "Delivered")}
                                  className="w-full py-2 bg-green-600 hover:bg-green-500 text-white font-extrabold text-[10.5px] rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Safe Delivery
                                </button>
                              )}

                              {o.status === "Delivered" && (
                                <div className="p-3 bg-green-950/10 border border-green-500/10 rounded-xl text-center space-y-1">
                                  <Check className="w-5 h-5 text-green-400 mx-auto" />
                                  <p className="text-[10.5px] text-green-400 font-extrabold">Parcels Delivered Safe</p>
                                  <p className="text-[9.5px] text-neutral-400 leading-normal">Courier transit finished successfully.</p>
                                </div>
                              )}

                              {/* Manual direct cancellation fallback override */}
                              {o.status !== "Cancelled" && o.status !== "Refunded" && o.status !== "Delivered" && (
                                <button
                                  onClick={() => {
                                    const reason = prompt("Enter manual cancellation reason tag:");
                                    if (reason) {
                                      const updated = orders.map(ord => {
                                        if (ord.id === o.id) {
                                          return { ...ord, status: "Cancelled" as const, cancellation_reason: reason };
                                        }
                                        return ord;
                                      });
                                      setOrders(updated);
                                      triggerNotification(`Order #${o.id} successfully cancelled by administrator.`);
                                    }
                                  }}
                                  className="w-full py-1.5 bg-var(--bg-elevated) border border-white/[0.06] hover:bg-red-500/10 hover:text-red-400 text-neutral-300 font-extrabold text-[10.5px] rounded-xl transition-all cursor-pointer"
                                >
                                  Force Cancel Order
                                </button>
                              )}

                              {/* Manual refundClaim for delivered fallback */}
                              {o.status === "Delivered" && (
                                <button
                                  onClick={() => {
                                    const reason = prompt("Describe refund claim reason:");
                                    if (reason) {
                                      const updated = orders.map(ord => {
                                        if (ord.id === o.id) {
                                          return { ...ord, status: "Refunded" as const, refund_reason: reason, refund_amount: ord.total_price };
                                        }
                                        return ord;
                                      });
                                      setOrders(updated);
                                      triggerNotification(`Order #${o.id} successfully processed for full refund.`);
                                    }
                                  }}
                                  className="w-full py-1.5 bg-var(--bg-elevated) border border-white/[0.06] hover:bg-purple-500/10 hover:text-purple-400 text-neutral-300 font-extrabold text-[10.5px] rounded-xl transition-all cursor-pointer"
                                >
                                  Process Safe Refund
                                </button>
                              )}

                              {o.status === "Cancelled" && (
                                <div className="p-3 bg-red-950/10 border border-red-500/10 rounded-xl text-center">
                                  <p className="text-[10.5px] text-red-400 font-extrabold">Parcels Cancelled</p>
                                  <p className="text-[9.5px] text-neutral-400 mt-1 leading-normal">In-stock lines auto-restored inside catalog inventory pool.</p>
                                </div>
                              )}

                              {o.status === "Refunded" && (
                                <div className="p-3 bg-purple-950/10 border border-purple-500/10 rounded-xl text-center">
                                  <p className="text-[10.5px] text-purple-400 font-extrabold">Parcels Refunded</p>
                                  <p className="text-[9.5px] text-neutral-400 mt-1 leading-normal">Approved Refund amount of ₹{o.refund_amount} returned.</p>
                                </div>
                              )}

                            </div>

                          </div>

                        </div>

                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* 3. CUSTOMER ORDER VIEW TIMELINE SHIPPERS TRACERS */}
      {activeTab === "customer" && (
        <div className="space-y-6">
          
          <div className="bg-[#0b0b0d] border border-white/[0.08] rounded-3xl p-6 space-y-6 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/[0.04] border border-white/[0.08] text-white font-black text-[10px] uppercase tracking-widest rounded-full font-mono">
                  Buyer Shipment Tracker
                </div>
                <h3 className="text-base font-black text-white">Track Your Royal Enfield Shipments</h3>
              </div>

              {/* Enter Tracking Query ID */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider font-mono">Enter ID:</span>
                <select
                  value={customerSearchId}
                  onChange={(e) => setCustomerSearchId(e.target.value)}
                  className="bg-var(--bg-elevated) border border-white/[0.08] focus:border-white/15 px-3 py-1.5 text-xs text-white rounded-lg focus:outline-none"
                >
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>{o.id} ({o.customer_name})</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedTrackOrder ? (
              <div className="space-y-8 bg-zinc-950/20 rounded-2xl p-5 border border-white/[0.03]">
                
                {/* Visual horizontal/vertical dispatch timeline stepper */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs text-neutral-400">
                    <span className="font-mono">Order Tracking ID: <strong className="text-white font-extrabold">{selectedTrackOrder.id}</strong></span>
                    <span className="font-mono">Current Status: <strong className="text-white font-extrabold uppercase">{selectedTrackOrder.status}</strong></span>
                  </div>

                  {/* Stepper Pipeline */}
                  <div className="grid grid-cols-5 gap-1.5 text-center sm:relative pt-4">
                    
                    {/* Step 1: Pending */}
                    <div className="space-y-2 relative flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-black z-10 ${
                        ["Pending", "Confirmed", "Packed", "Shipped", "Delivered"].includes(selectedTrackOrder.status)
                          ? "bg-white text-black border-white"
                          : "bg-var(--bg-elevated) text-neutral-500 border-neutral-800"
                      }`}>
                        1
                      </div>
                      <span className="text-[9.5px] font-extrabold text-[#D1D5DB] uppercase tracking-wide">Ordered</span>
                    </div>

                    {/* Step 2: Confirmed */}
                    <div className="space-y-2 relative flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-black z-10 ${
                        ["Confirmed", "Packed", "Shipped", "Delivered"].includes(selectedTrackOrder.status)
                          ? "bg-white text-black border-white"
                          : "bg-var(--bg-elevated) text-neutral-500 border-neutral-800"
                      }`}>
                        2
                      </div>
                      <span className="text-[9.5px] font-extrabold text-[#D1D5DB] uppercase tracking-wide">Confirmed</span>
                    </div>

                    {/* Step 3: Packed */}
                    <div className="space-y-2 relative flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-black z-10 ${
                        ["Packed", "Shipped", "Delivered"].includes(selectedTrackOrder.status)
                          ? "bg-white text-black border-white"
                          : "bg-var(--bg-elevated) text-neutral-500 border-neutral-800"
                      }`}>
                        3
                      </div>
                      <span className="text-[9.5px] font-extrabold text-[#D1D5DB] uppercase tracking-wide">Ready</span>
                    </div>

                    {/* Step 4: Shipped */}
                    <div className="space-y-2 relative flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-black z-10 ${
                        ["Shipped", "Delivered"].includes(selectedTrackOrder.status)
                          ? "bg-white text-black border-white"
                          : "bg-var(--bg-elevated) text-neutral-500 border-neutral-800"
                      }`}>
                        4
                      </div>
                      <span className="text-[9.5px] font-extrabold text-[#D1D5DB] uppercase tracking-wide">In Transit</span>
                    </div>

                    {/* Step 5: Delivered */}
                    <div className="space-y-2 relative flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-black z-10 ${
                        selectedTrackOrder.status === "Delivered"
                          ? "bg-white text-black border-white"
                          : "bg-var(--bg-elevated) text-neutral-500 border-neutral-800"
                      }`}>
                        5
                      </div>
                      <span className="text-[9.5px] font-extrabold text-[#D1D5DB] uppercase tracking-wide">Delivered</span>
                    </div>

                  </div>
                </div>

                <div className="h-[1px] bg-white/[0.04] my-2" />

                {/* Sub details card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3">
                  
                  {/* Courier Partner detail */}
                  <div className="bg-var(--bg-elevated)/40 p-4 rounded-xl border border-white/[0.04] space-y-3">
                    <h4 className="text-[10px] font-extrabold text-[#9CA3AF] uppercase tracking-widest flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5" /> Delivery Logistics
                    </h4>

                    {selectedTrackOrder.shipping_carrier ? (
                      <div className="space-y-2 text-xs font-sans text-neutral-300">
                        <p>Courier Partner: <strong className="text-white font-bold">{selectedTrackOrder.shipping_carrier}</strong></p>
                        <p>AWB Tracking Code: <strong className="text-white font-mono">{selectedTrackOrder.tracking_number}</strong></p>
                        {selectedTrackOrder.estimated_delivery && (
                          <p>Estimated Safe Delivery: <strong className="text-white font-bold">{selectedTrackOrder.estimated_delivery}</strong></p>
                        )}
                        <span className="inline-flex items-center gap-1 text-[10.5px] text-green-400 mt-1 cursor-pointer hover:underline font-bold">
                          <ExternalLink className="w-3" /> Trace on carrier portal
                        </span>
                      </div>
                    ) : (
                      <div className="text-xs text-neutral-500 py-3 italic">
                        Processing shipment carrier details. We dispatch orders within 24 hours of package packaging!
                      </div>
                    )}
                  </div>

                  {/* Summary of ordered invoice items */}
                  <div className="bg-var(--bg-elevated)/40 p-4 rounded-xl border border-white/[0.04] space-y-2.5">
                    <h4 className="text-[10px] font-extrabold text-[#9CA3AF] uppercase tracking-widest flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5" /> Order items spec sheet
                    </h4>
                    
                    <div className="space-y-2 max-h-24 overflow-y-auto">
                      {selectedTrackOrder.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <span className="text-neutral-400 truncate max-w-[180px]">{item.name} <strong className="text-[#9CA3AF]">x{item.quantity}</strong></span>
                          <span className="text-white font-mono">₹{(item.price * item.quantity).toLocaleString("en-IN")}</span>
                        </div>
                      ))}
                    </div>

                    <div className="h-[1px] bg-white/[0.04] my-1" />
                    <div className="flex justify-between items-center text-xs font-bold text-white">
                      <span>Total Paid:</span>
                      <span className="font-mono text-white">₹{selectedTrackOrder.total_price.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                </div>

                {/* Cancellation & Refund buttons for clients */}
                <div className="flex flex-wrap items-center gap-3 justify-end pt-3">
                  
                  {/* Cancel shipment trigger (only available if Pending, Confirmed or Packed) */}
                  {["Pending", "Confirmed", "Packed"].includes(selectedTrackOrder.status) && (
                    <button
                      onClick={() => setShowCancelRequestModal(true)}
                      className="px-4.5 py-2.5 bg-var(--bg-elevated) hover:bg-neutral-800 border border-white/10 text-white font-extrabold text-[11px] rounded-xl transition-all cursor-pointer"
                    >
                      Cancel Order Shipment
                    </button>
                  )}

                  {/* Refund trigger (only available if Delivered or Refunded) */}
                  {selectedTrackOrder.status === "Delivered" && (
                    <button
                      onClick={() => setShowRefundRequestModal(true)}
                      className="px-4.5 py-2.5 bg-var(--bg-elevated) hover:bg-neutral-800 border border-white/10 text-white font-extrabold text-[11px] rounded-xl transition-all cursor-pointer"
                    >
                      File Return & Refund Request
                    </button>
                  )}

                  {selectedTrackOrder.status === "Cancelled" && (
                    <div className="text-xs text-red-400 font-bold bg-red-950/20 border border-red-500/20 px-3 py-1.5 rounded-lg">
                      Parcels Cancelled: "{selectedTrackOrder.cancellation_reason || 'Custom requested cancellation'}"
                    </div>
                  )}

                  {selectedTrackOrder.status === "Refunded" && (
                    <div className="text-xs text-purple-400 font-bold bg-purple-950/20 border border-purple-500/20 px-3 py-1.5 rounded-lg">
                      Processed Refund Claim: "{selectedTrackOrder.refund_reason || 'Defective packaging'}"
                    </div>
                  )}

                </div>

              </div>
            ) : (
              <div className="p-8 text-center text-sm text-neutral-500">
                Pick a valid order tracking reference on the top right dropdown.
              </div>
            )}
          </div>

          {/* CUSTOM MODAL FOR CANCELLATION */}
          <AnimatePresence>
            {showCancelRequestModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-[#0e0e11] border border-white/10 p-6 rounded-3xl max-w-sm w-full space-y-4"
                >
                  <h4 className="text-sm font-black text-white">Provide Cancellation Reason</h4>
                  <p className="text-[10.5px] text-neutral-400 leading-relaxed font-sans">
                    Cancelling early stages automatically reverses your paid billing and immediately restores exhaust products to standard inventory counts.
                  </p>

                  <form onSubmit={handleCustomerCancel} className="space-y-3.5">
                    <textarea 
                      required
                      placeholder="e.g. Incompatible engine mount variant, ordered by accident..."
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="w-full bg-black border border-white/[0.08] rounded-xl p-3 text-xs text-white placeholder-neutral-600 focus:outline-none min-h-[80px]"
                    />

                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setShowCancelRequestModal(false)}
                        className="px-3.5 py-2 bg-var(--bg-elevated) border border-neutral-800 rounded-xl text-neutral-400 text-xs font-bold"
                      >
                        Abort
                      </button>
                      <button
                        type="submit"
                        className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-extrabold"
                      >
                        Confirm Cancellation
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* CUSTOM MODAL FOR REFUND REQUEST */}
          <AnimatePresence>
            {showRefundRequestModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-[#0e0e11] border border-white/10 p-6 rounded-3xl max-w-sm w-full space-y-4"
                >
                  <h4 className="text-sm font-black text-white">File Return & Refund Request</h4>
                  <p className="text-[10.5px] text-neutral-400 leading-relaxed">
                    Please describe the defect or reason for claiming refunds. Our staff verifies requests within 12 hours.
                  </p>

                  <form onSubmit={handleCustomerRefund} className="space-y-3.5">
                    <textarea 
                      required
                      placeholder="e.g. Scratched chrome polish on arrival, missing dB killer accessory..."
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      className="w-full bg-black border border-white/[0.08] rounded-xl p-3 text-xs text-white placeholder-neutral-600 focus:outline-none min-h-[80px]"
                    />

                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setShowRefundRequestModal(false)}
                        className="px-3.5 py-2 bg-var(--bg-elevated) border border-neutral-800 rounded-xl text-neutral-400 text-xs font-bold"
                      >
                        Close
                      </button>
                      <button
                        type="submit"
                        className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-extrabold"
                      >
                        Submit Refund Claim
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </div>
      )}

      {/* 4. PLACING NEW CHECKOUTS (COMPILES INVOICE, CHECKS REAL PRODUCTS, DEDUCTS STOCK) */}
      {activeTab === "create" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
          
          {/* Order Compiler Left: Recipient details & items selection */}
          <div className="lg:col-span-7 bg-[#0b0c10] border border-white/[0.08] rounded-3xl p-6 space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-black text-white">Compile Cash Invoice</h3>
              <p className="text-[11px] text-neutral-400">Complete recipient parameters, include exhaust models, calculate discounts and tax.</p>
            </div>

            <form onSubmit={handleCompileOrderCheckout} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10.5px] uppercase font-mono tracking-wider text-neutral-400">Recipient Full Name*</label>
                  <input
                    type="text"
                    required
                    placeholder="Rahul Sharma"
                    value={billingName}
                    onChange={(e) => setBillingName(e.target.value)}
                    className="w-full bg-black border border-white/[0.08] rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10.5px] uppercase font-mono tracking-wider text-neutral-400">Email Address</label>
                  <input
                    type="email"
                    placeholder="sharma.rahul@gmail.com"
                    value={billingEmail}
                    onChange={(e) => setBillingEmail(e.target.value)}
                    className="w-full bg-black border border-white/[0.08] rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10.5px] uppercase font-mono tracking-wider text-neutral-400">Phone Contact</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={billingPhone}
                    onChange={(e) => setBillingPhone(e.target.value)}
                    className="w-full bg-black border border-white/[0.08] rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10.5px] uppercase font-mono tracking-wider text-neutral-400">Delivery Address*</label>
                  <input
                    type="text"
                    required
                    placeholder="Plot 42, Sector 17, Vashi, Navi Mumbai, MH - 400703"
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    className="w-full bg-black border border-white/[0.08] rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10.5px] uppercase font-mono tracking-wider text-neutral-400">Custom Dispatch Notes</label>
                <textarea
                  placeholder="Fragile, wrap exhaust pipes securely in foam sheets..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full bg-black border border-white/[0.08] rounded-xl py-2 px-3 text-xs text-white focus:outline-none min-h-[50px]"
                />
              </div>

              <div className="h-[1px] bg-white/[0.04]" />

              {/* CHOOSE SYSTEM STOCK PRODUCTS */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-[#9CA3AF]">Invoice Line Item Editor:</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end bg-[#0c0d12] p-4 rounded-2xl border border-white/[0.04]">
                  
                  {/* Dropdown inventory list selector */}
                  <div className="sm:col-span-7 space-y-1">
                    <span className="text-[9.5px] uppercase tracking-wider text-zinc-500 font-bold block">Select Product from Database</span>
                    <select
                      value={newItemId}
                      onChange={(e) => setNewItemId(e.target.value)}
                      className="w-full bg-black border border-white/[0.08] rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none"
                    >
                      <option value="">-- Choose In-Stock Product --</option>
                      {activeCatalog.map(p => (
                        <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                          {p.name} (Price: ₹{p.price} • Stock: {p.stock} remaining) {p.stock <= 0 ? " [SOLD OUT]" : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity slider counter */}
                  <div className="sm:col-span-3 space-y-1">
                    <span className="text-[9.5px] uppercase tracking-wider text-zinc-500 font-bold block">Units Qty</span>
                    <input 
                      type="number"
                      min={1}
                      max={20}
                      value={newItemQty}
                      onChange={(e) => setNewItemIdQty(parseInt(e.target.value) || 1)}
                      className="w-full bg-black border border-[#1d1d22] rounded-lg py-1 px-2.5 text-xs text-white focus:outline-none text-center"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddProductToOrderBuilder}
                    className="sm:col-span-2 py-1.5 bg-var(--bg-elevated) border border-white/10 hover:bg-white hover:text-black font-extrabold text-[10.5px] rounded-lg transition-colors cursor-pointer text-center"
                  >
                    Include
                  </button>

                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={selectedItems.length === 0}
                className={`w-full py-3 rounded-2xl font-black text-xs transition-all uppercase flex items-center justify-center gap-2 ${
                  selectedItems.length > 0
                    ? "bg-white hover:bg-zinc-200 text-black cursor-pointer active:scale-98"
                    : "bg-var(--bg-elevated) border border-var(--border) text-neutral-500"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Place Order & Reduce Catalog Stock</span>
              </button>

            </form>
          </div>

          {/* Compiler Right: List items invoice previews */}
          <div className="lg:col-span-5 bg-[#0b0c10] border border-white/[0.08] rounded-3xl p-6 flex flex-col justify-between gap-5">
            <div className="space-y-4 text-left">
              <div className="flex items-center justify-between">
                <h4 className="text-xs uppercase tracking-wider text-neutral-200 font-extrabold">Bill Invoice summary</h4>
                <div className="text-[9px] text-[#A1A1AA] uppercase font-mono font-bold bg-white/[0.02] border border-white/[0.06] rounded px-1.5 py-0.5">
                  Pre-Calc Review
                </div>
              </div>

              {/* Items loaded */}
              {selectedItems.length === 0 ? (
                <div className="h-44 flex flex-col items-center justify-center text-center space-y-2 text-neutral-500 border border-dashed border-white/5 rounded-2xl bg-black/10">
                  <p className="text-xs">Invoice empty</p>
                  <p className="text-[10px] max-w-[200px]">Add products using the selector drop-downs on the left.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto">
                  {selectedItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-center bg-black/40 border border-white/[0.04] p-3 rounded-xl">
                      <div>
                        <p className="text-xs font-bold text-white truncate max-w-[170px]">{item.name}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">₹{item.price.toLocaleString("en-IN")} • {item.quantity} Unit(s)</p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-white">₹{(item.price * item.quantity).toLocaleString("en-IN")}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItemFromBuilder(item.id)}
                          className="text-neutral-500 hover:text-red-400 transition-colors p-1"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Calculations panels */}
            {selectedItems.length > 0 && (
              <div className="space-y-3 bg-neutral-950/40 p-4.5 rounded-2xl border border-white/[0.03] text-xs">
                
                <div className="flex justify-between text-neutral-400">
                  <span>Gross Item Total:</span>
                  <span className="font-mono text-white">
                    ₹{selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex justify-between text-neutral-400">
                  <span>Applied Promo (10% Off):</span>
                  <span className="font-mono text-green-400">
                    -₹{Math.floor(selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 0.1).toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex justify-between text-neutral-400">
                  <span>Standard Shipping Cargo:</span>
                  <span className="text-green-400 uppercase font-black tracking-wide text-[9.5px]">FREE SHIPPED</span>
                </div>

                <div className="h-[1px] bg-white/[0.04]" />

                <div className="flex justify-between text-white font-black text-sm">
                  <span>Payable Total:</span>
                  <span className="font-mono text-white text-[15px]">
                    ₹{(
                      selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) -
                      Math.floor(selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 0.1)
                    ).toLocaleString("en-IN")}
                  </span>
                </div>

              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
};
