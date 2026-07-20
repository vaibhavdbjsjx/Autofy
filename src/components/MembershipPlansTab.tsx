import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Check, 
  VolumeX, 
  AlertCircle, 
  DollarSign, 
  Users, 
  Sliders, 
  CreditCard, 
  TrendingUp, 
  ToggleLeft, 
  ToggleRight, 
  Clock, 
  ChevronRight,
  PlusCircle,
  HelpCircle
} from "lucide-react";

interface MembershipPlan {
  id: string;
  name: string;
  description: string;
  duration: "Daily" | "Weekly" | "Monthly" | "Quarterly" | "Half Yearly" | "Yearly";
  price: number;
  discountPrice?: number;
  joiningFee: number;
  benefits: string[];
  terms: string;
  isActive: boolean;
  subscribersCount: number;
}

export const MembershipPlansTab: React.FC = () => {
  // Pre-seeded Plans
  const [plans, setPlans] = useState<MembershipPlan[]>([
    {
      id: "plan-1",
      name: "Standard AC Access",
      description: "Get unlimited access to the standard fitness floor and locker facility during regular hours.",
      duration: "Monthly",
      price: 2500,
      discountPrice: 1999,
      joiningFee: 500,
      benefits: ["Gym Access", "AC Facility", "Locker Facility"],
      terms: "Valid for 30 days from purchase. No transfer allowed.",
      isActive: true,
      subscribersCount: 78
    },
    {
      id: "plan-2",
      name: "Elite Strength Elite",
      description: "Premium holistic workout membership including personalized trainer sessions and health audits.",
      duration: "Quarterly",
      price: 7500,
      discountPrice: 5999,
      joiningFee: 750,
      benefits: ["Gym Access", "AC Facility", "Personal Trainer", "Diet Plan", "Steam Bath", "Locker Facility"],
      terms: "Allows up to 2 freeze requests of 7 days each.",
      isActive: true,
      subscribersCount: 42
    },
    {
      id: "plan-3",
      name: "Ultimate Annual Pass",
      description: "Our signature, high-tier membership pack with premium perks, custom diets, and steam baths.",
      duration: "Yearly",
      price: 24000,
      discountPrice: 18000,
      joiningFee: 0,
      benefits: ["Gym Access", "AC Facility", "Personal Trainer", "Diet Plan", "Steam Bath", "Locker Facility", "Free Supplementary Shakes", "VIP Towel Service"],
      terms: "Full access. Includes 3 free guest entry passes.",
      isActive: true,
      subscribersCount: 15
    }
  ]);

  // Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [planName, setPlanName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState<MembershipPlan["duration"]>("Monthly");
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [joiningFee, setJoiningFee] = useState("");
  const [terms, setTerms] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Benefit Tool Helper
  const defaultBenefitSuggestions = [
    "Gym Access",
    "AC Facility",
    "Personal Trainer",
    "Diet Plan",
    "Steam Bath",
    "Locker Facility"
  ];
  const [customBenefits, setCustomBenefits] = useState<string[]>(["Gym Access", "AC Facility"]);
  const [newBenefitInput, setNewBenefitInput] = useState("");

  const handleAddBenefit = () => {
    if (newBenefitInput.trim() && !customBenefits.includes(newBenefitInput.trim())) {
      setCustomBenefits([...customBenefits, newBenefitInput.trim()]);
      setNewBenefitInput("");
    }
  };

  const handleToggleDefaultBenefit = (benefitName: string) => {
    if (customBenefits.includes(benefitName)) {
      setCustomBenefits(customBenefits.filter(b => b !== benefitName));
    } else {
      setCustomBenefits([...customBenefits, benefitName]);
    }
  };

  const handleRemoveBenefit = (benefitName: string) => {
    setCustomBenefits(customBenefits.filter(b => b !== benefitName));
  };

  // Create Membership Plan Handler
  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim() || !price) return;

    const newPlan: MembershipPlan = {
      id: `plan-${Date.now()}`,
      name: planName,
      description: description,
      duration: duration,
      price: Math.abs(parseFloat(price) || 0),
      discountPrice: discountPrice ? Math.abs(parseFloat(discountPrice) || 0) : undefined,
      joiningFee: joiningFee ? Math.abs(parseFloat(joiningFee) || 0) : 0,
      benefits: [...customBenefits],
      terms: terms || "Standard business onboarding terms and conditions apply.",
      isActive: isActive,
      subscribersCount: Math.floor(Math.random() * 10) + 1 // Start with some simulated signups
    };

    setPlans([newPlan, ...plans]);
    
    // Reset Form
    setPlanName("");
    setDescription("");
    setDuration("Monthly");
    setPrice("");
    setDiscountPrice("");
    setJoiningFee("");
    setTerms("");
    setIsActive(true);
    setCustomBenefits(["Gym Access", "AC Facility"]);
    setShowAddForm(false);
  };

  // Toggle active / inactive status
  const togglePlanActive = (planId: string) => {
    setPlans(plans.map(p => p.id === planId ? { ...p, isActive: !p.isActive } : p));
  };

  // Delete plan handler
  const handleDeletePlan = (planId: string) => {
    setPlans(plans.filter(p => p.id !== planId));
  };

  // Compute stats dynamically
  const totalPlansCount = plans.length;
  const activePlansCount = plans.filter(p => p.isActive).length;
  const totalSubscribersCount = plans.reduce((acc, p) => acc + (p.isActive ? p.subscribersCount : 0), 0);
  const monthlyRevenueSimulation = plans.reduce((acc, p) => {
    if (!p.isActive) return acc;
    // Normalize to monthly pricing standard
    let scale = 1;
    if (p.duration === "Daily") scale = 30;
    else if (p.duration === "Weekly") scale = 4.3;
    else if (p.duration === "Monthly") scale = 1;
    else if (p.duration === "Quarterly") scale = 1 / 3;
    else if (p.duration === "Half Yearly") scale = 1 / 6;
    else if (p.duration === "Yearly") scale = 1 / 12;

    const activePrice = p.discountPrice || p.price;
    return acc + (activePrice * p.subscribersCount * scale);
  }, 0);

  // Generate simulated AI chat response representation
  const activeOnlinePlans = plans.filter(p => p.isActive);
  const simulatedAIResponse = activeOnlinePlans.length > 0
    ? `Hello! Happy to share our operational membership plans:

${activeOnlinePlans.map(p => {
  const priceDisplay = p.discountPrice 
    ? `₹${p.discountPrice.toLocaleString()} (Regular rate: ₹${p.price.toLocaleString()})`
    : `₹${p.price.toLocaleString()}`;
  const benefitsText = p.benefits.map(b => `  • ${b}`).join("\n");
  
  return ` *${p.name}* [${p.duration}]
 Price: ${priceDisplay}${p.joiningFee > 0 ? ` + ₹${p.joiningFee} joining fee` : ""}
 Perks included:
${benefitsText}`;
}).join("\n\n")}

Let me know which package works best for your schedule, and I can send you a secure digital checkout link right away! `
    : "No membership plans are set up on this profile yet.";

  return (
    <div id="membership-plans-module" className="space-y-8 font-sans">
      
      {/* HEADER ROW */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-var(--border) pb-6">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-500" />
            Membership Plans
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Create and manage memberships, subscriptions, and recurring subscription plans.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-550 text-white text-xs font-bold rounded-xl transition-all self-start shadow-lg shadow-blue-500/10 cursor-pointer"
        >
          {showAddForm ? "View Active Plan List" : "Add Membership Plan"}
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* TOP STATISTICS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: "Total Plans",
            value: totalPlansCount.toString(),
            detail: "Configured plans",
            color: "text-blue-400",
            icon: Sliders
          },
          {
            title: "Active Plans",
            value: activePlansCount.toString(),
            detail: "Live on WhatsApp",
            color: "text-green-400",
            icon: Check
          },
          {
            title: "Monthly Revenue",
            value: `₹${Math.round(monthlyRevenueSimulation).toLocaleString()}`,
            detail: "Simulated run-rate",
            color: "text-cyan-400",
            icon: DollarSign
          },
          {
            title: "Active Subscribers",
            value: totalSubscribersCount.toString(),
            detail: "Total premium users",
            color: "text-indigo-400",
            icon: Users
          }
        ].map((stat, idx) => {
          const IconComp = stat.icon;
          return (
            <div key={idx} className="p-5 bg-neutral-950/40 border border-var(--border) rounded-3xl backdrop-blur-md flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] text-neutral-500 font-extrabold uppercase tracking-widest">{stat.title}</p>
                <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
                <p className="text-[9.5px] text-neutral-400 font-medium">{stat.detail}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-var(--bg-elevated) flex items-center justify-center border border-var(--border)">
                <IconComp className="w-5 h-5 text-neutral-400" />
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {showAddForm ? (
          <motion.div
            key="add-form"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="p-6 bg-neutral-950/40 border border-var(--border) rounded-3xl backdrop-blur-md space-y-6"
          >
            <div className="border-b border-var(--border) pb-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider text-blue-400">Launch New Membership Plan</h3>
              <p className="text-[10.5px] text-neutral-500">Configure subscription intervals, discounts, joining fees, and benefits.</p>
            </div>

            <form onSubmit={handleCreatePlan} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: Basic Info */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black tracking-wider text-neutral-500">Plan Title</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. VIP Quarterly Conditioning"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-var(--border) px-3.5 py-2.5 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black tracking-wider text-neutral-500">Duration Interval</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value as MembershipPlan["duration"])}
                    className="w-full bg-[#0a0a0c] border border-var(--border) p-2.5 rounded-xl text-xs text-neutral-300 focus:outline-none focus:border-blue-500/50"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Half Yearly">Half Yearly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black tracking-wider text-neutral-500">Price (₹)</label>
                    <input
                      type="number"
                      required
                      placeholder="E.g. 5000"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full bg-[#0a0a0c] border border-var(--border) p-2.5 rounded-xl text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black tracking-wider text-neutral-500">Discounted (₹)</label>
                    <input
                      type="number"
                      placeholder="E.g. 3999"
                      value={discountPrice}
                      onChange={(e) => setDiscountPrice(e.target.value)}
                      className="w-full bg-[#0a0a0c] border border-var(--border) p-2.5 rounded-xl text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black tracking-wider text-neutral-500">Joining Fee (₹)</label>
                    <input
                      type="number"
                      placeholder="Free (0)"
                      value={joiningFee}
                      onChange={(e) => setJoiningFee(e.target.value)}
                      className="w-full bg-[#0a0a0c] border border-var(--border) p-2.5 rounded-xl text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black tracking-wider text-neutral-500">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Describe what subscribers get under this tier..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-var(--border) p-3 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black tracking-wider text-neutral-500">Terms & Conditions</label>
                  <textarea
                    rows={2}
                    placeholder="Refund, freeze requests rules, cancellation bounds..."
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-var(--border) p-3 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-3 py-2">
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className="text-neutral-400 focus:outline-none"
                  >
                    {isActive ? (
                      <ToggleRight className="w-10 h-6 text-green-400 stroke-[1.5]" />
                    ) : (
                      <ToggleLeft className="w-10 h-6 text-neutral-600 stroke-[1.5]" />
                    )}
                  </button>
                  <div>
                    <p className="text-xs font-bold text-white">Plan Availability Status</p>
                    <p className="text-[10px] text-neutral-500">Currently active and searchable by customers on WhatsApp bot</p>
                  </div>
                </div>
              </div>

              {/* Right Column: Benefits Builder */}
              <div className="space-y-4 bg-var(--bg-elevated)/10 p-5 border border-var(--border) rounded-3xl">
                <div>
                  <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    Interactive Benefits Builder
                  </h4>
                  <p className="text-[10px] text-neutral-500 mt-0.5">Toggle default suggestions or craft raw unlimited packages.</p>
                </div>

                {/* Suggestions badges */}
                <div className="flex flex-wrap gap-2">
                  {defaultBenefitSuggestions.map((bf) => {
                    const isSelected = customBenefits.includes(bf);
                    return (
                      <button
                        key={bf}
                        type="button"
                        onClick={() => handleToggleDefaultBenefit(bf)}
                        className={`px-3 py-1.5 text-[10.5px] font-bold rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-blue-600/15 border-blue-500/30 text-blue-400"
                            : "bg-neutral-950 border-var(--border) hover:border-neutral-800 text-neutral-400"
                        }`}
                      >
                        {isSelected ? <Check size={13} className="inline mr-1" /> : <Plus size={13} className="inline mr-1" />}
                        {bf}
                      </button>
                    );
                  })}
                </div>

                {/* Custom input builder row */}
                <div className="pt-2">
                  <label className="text-[10px] uppercase font-black tracking-wider text-neutral-500 block mb-1">Add Custom Benefit</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="E.g. VIP Steam Sauna access"
                      value={newBenefitInput}
                      onChange={(e) => setNewBenefitInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddBenefit();
                        }
                      }}
                      className="flex-1 bg-[#0a0a0c] border border-var(--border) px-3.5 py-2.5 rounded-xl text-xs text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddBenefit}
                      className="px-3.5 bg-var(--bg-elevated) hover:bg-var(--bg-elevated) border border-var(--border) rounded-xl text-xs text-white font-bold cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Active draft benefits list */}
                <div className="space-y-1.5 pt-2">
                  <p className="text-[10px] uppercase font-black tracking-wider text-neutral-500">Draft Benefit Pack ({customBenefits.length})</p>
                  <div className="max-h-[140px] overflow-y-auto space-y-2 pr-1">
                    {customBenefits.map((bf, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 bg-neutral-950 border border-var(--border) rounded-xl">
                        <span className="text-xs text-neutral-300 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          {bf}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveBenefit(bf)}
                          className="p-1 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {customBenefits.length === 0 && (
                      <p className="text-center text-[10.5px] text-neutral-500 py-3 italic">No benefits attached yet. Please attach at least 1 benefit.</p>
                    )}
                  </div>
                </div>

                {/* Submit buttons */}
                <div className="pt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 py-3 text-xs font-bold text-neutral-400 bg-var(--bg-elevated) border border-var(--border) hover:bg-neutral-800 rounded-xl transition-all cursor-pointer"
                  >
                    Discard Changes
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-550 rounded-xl transition-all shadow-lg shadow-blue-500/10 cursor-pointer"
                  >
                    Authorize and Launch
                  </button>
                </div>

              </div>
            </form>
          </motion.div>
        ) : (
          <div key="plans-list" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Membership Table (2 spans) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* TABLE ENCLOSURE */}
              <div className="bg-neutral-950/40 border border-var(--border) rounded-3xl p-6 backdrop-blur-md">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-var(--border)/60">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">Active Operational Plans</h3>
                  <span className="text-[10px] font-bold text-blue-400 font-mono uppercase bg-blue-600/10 px-2 py-0.5 rounded">
                    {plans.length} items catalogued
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-sans">
                    <thead>
                      <tr className="border-b border-var(--border) text-[10px] text-neutral-500 font-black uppercase tracking-widest">
                        <th className="py-3 px-2">Plan Name</th>
                        <th className="py-3 px-2">Duration</th>
                        <th className="py-3 px-2">Price</th>
                        <th className="py-3 px-2">Status</th>
                        <th className="py-3 px-2 text-center">Subscribers</th>
                        <th className="py-3 px-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-900/40">
                      {plans.map((p) => (
                        <tr key={p.id} className="hover:bg-white/2 transition-colors">
                          <td className="py-3.5 px-2">
                            <p className="font-bold text-white leading-snug">{p.name}</p>
                            <p className="text-[10px] text-neutral-500 truncate max-w-[140px]">{p.description}</p>
                          </td>
                          <td className="py-3.5 px-2 font-semibold text-neutral-300">
                            {p.duration}
                          </td>
                          <td className="py-3.5 px-2 font-mono">
                            {p.discountPrice ? (
                              <div className="space-y-0.5">
                                <span className="block text-blue-400 font-extrabold">₹{p.discountPrice}</span>
                                <span className="block text-[9px] text-neutral-500 line-through">₹{p.price}</span>
                              </div>
                            ) : (
                              <span className="text-neutral-300 font-extrabold">₹{p.price}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-2">
                            <button
                              onClick={() => togglePlanActive(p.id)}
                              className={`inline-flex px-2 py-0.5 rounded text-[9.5px] font-black uppercase tracking-wider ${
                                p.isActive
                                  ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                  : "bg-red-500/10 text-red-400 border border-red-500/20"
                              }`}
                            >
                              {p.isActive ? "Active" : "Inactive"}
                            </button>
                          </td>
                          <td className="py-3.5 px-2 text-center font-mono font-bold text-neutral-400">
                            {p.isActive ? p.subscribersCount : "—"}
                          </td>
                          <td className="py-3.5 px-2 text-right">
                            <div className="inline-flex gap-2">
                              <button
                                onClick={() => togglePlanActive(p.id)}
                                title={p.isActive ? "Deactivate plan" : "Activate plan"}
                                className="p-1 px-2 text-[10px] bg-var(--bg-elevated) hover:bg-neutral-800 border border-var(--border) hover:border-neutral-800 text-neutral-400 rounded-lg transition-colors cursor-pointer"
                              >
                                Toggle
                              </button>
                              <button
                                onClick={() => handleDeletePlan(p.id)}
                                title="Delete Plan"
                                className="p-1.5 text-neutral-500 hover:text-red-400 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {plans.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-neutral-500 text-xs italic">
                            No plans created. Click Add Membership Plan to configure one.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* BENEFITS DISPLAY CARD */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plans.map((p) => {
                  if (!p.isActive) return null;
                  return (
                    <div key={`benefits-grid-${p.id}`} className="bg-neutral-950/20 border border-var(--border) rounded-3xl p-5 space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-white">{p.name} Benefits</span>
                        <span className="text-[10px] text-neutral-500 font-mono">{p.benefits.length} perks</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 h-24 overflow-y-auto content-start pr-1">
                        {p.benefits.map((bf, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10.5px] font-semibold bg-neutral-950 border border-var(--border) rounded-xl text-neutral-300"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            {bf}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Right Column: AI Response Preview */}
            <div className="space-y-6">
              
              {/* GLOWING AI PREVIEW CARD */}
              <div className="bg-[#0b0c10] border border-blue-500/20 rounded-3xl p-6 relative overflow-hidden space-y-4 shadow-xl">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-[18px] h-[18px] text-blue-400 animate-pulse" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">AI Response Preview</h3>
                  </div>
                  <span className="text-[8.5px] font-black uppercase tracking-wider text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full font-sans">
                    Live Simulator
                  </span>
                </div>

                <p className="text-[11px] text-neutral-400 leading-normal">
                  How Autofy answers prospective queries automatically on WhatsApp based on your actual active plans listed:
                </p>

                {/* Simulated Conversation Box */}
                <div className="space-y-3.5 pt-2">
                  
                  {/* Incoming Client message */}
                  <div className="flex items-end gap-2.5 max-w-[85%]">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-red-500 text-[9px] font-black font-sans text-center text-white flex items-center justify-center shadow-lg">
                      C
                    </div>
                    <div className="p-3 bg-var(--bg-elevated) border border-var(--border) rounded-2xl rounded-bl-none">
                      <p className="text-[10px] text-neutral-500 font-extrabold uppercase font-sans tracking-wide leading-none mb-1">Customer</p>
                      <p className="text-xs text-white leading-snug">"What membership plans do you have?"</p>
                    </div>
                  </div>

                  {/* Outgoing AI Bot message */}
                  <div className="flex items-end gap-2.5 max-w-[95%] ml-auto flex-row-reverse">
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shadow-md">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="p-4 bg-blue-950/20 border border-blue-500/15 rounded-2xl rounded-br-none space-y-1.5">
                      <p className="text-[10px] text-blue-400 font-black uppercase font-sans tracking-widest leading-none mb-1">Autofy Assistant</p>
                      <pre className="text-[10.5px] text-neutral-200 leading-relaxed font-sans whitespace-pre-wrap select-text">
                        {simulatedAIResponse}
                      </pre>
                    </div>
                  </div>

                </div>

              </div>

              {/* ADVICE CAPSULE */}
              <div className="p-5 bg-neutral-950/40 border border-var(--border) rounded-3xl flex gap-3.5">
                <AlertCircle className="w-5 h-5 text-neutral-500 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-white">Dynamic Catalogue Integration</p>
                  <p className="text-[10.5px] text-neutral-400 leading-relaxed">
                    Whenever you launch, toggle, or edit a membership tier here, your Autofy RAG model instantly re-indexes its answers. No manual training, reload, or code pushes are ever required.
                  </p>
                </div>
              </div>

            </div>

          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
