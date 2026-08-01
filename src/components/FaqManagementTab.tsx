import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  HelpCircle,
  Plus,
  Trash2,
  Check,
  Sparkles,
  AlertCircle,
  Search,
  Filter,
  TrendingUp,
  Activity,
  Heart,
  ChevronRight,
  RefreshCw,
  Zap,
  CheckCircle,
  MessageCircle,
  X
} from "lucide-react";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: "Pricing" | "Memberships" | "Appointments" | "Services" | "Products" | "Payments" | "Policies" | "Custom";
  priority: "Low" | "Medium" | "High" | "Critical";
  isActive: boolean;
  queriesCount: number;
}

export const FaqManagementTab: React.FC = () => {
  // Pre-seeded FAQ database
  const [faqs, setFaqs] = useState<FAQItem[]>([
    {
      id: "faq-1",
      question: "Are there locker rooms and showers available?",
      answer: "Yes, standard AC access and premium tier memberships include unlimited access to our fully equipped steam rooms, hot showers, and key-locked secure lockers.",
      category: "Memberships",
      priority: "Medium",
      isActive: true,
      queriesCount: 164
    },
    {
      id: "faq-2",
      question: "What is your refund policy on personal coaching sessions?",
      answer: "Personal coaching packages carry a 48-hour satisfaction guarantee. If canceled after 48 hours, unused allocations can be converted to general gym credit or frozen for transfer.",
      category: "Policies",
      priority: "High",
      isActive: true,
      queriesCount: 112
    },
    {
      id: "faq-3",
      question: "What happens if I miss a scheduled training appointment?",
      answer: "We mandate a 4-hour cancellation heads up relative to your workout slot. Missed slots without 4 hours warning are counted as redeemed sessions. Exceptions are made for emergencies.",
      category: "Appointments",
      priority: "High",
      isActive: true,
      queriesCount: 89
    },
    {
      id: "faq-4",
      question: "Which digital payments do you accept at the counter?",
      answer: "We support direct UPI payments (scanning our counter QR), Credit/Debit Cards, NetBanking, and Google Pay / PhonePe merchant payouts.",
      category: "Payments",
      priority: "Low",
      isActive: true,
      queriesCount: 75
    },
    {
      id: "faq-5",
      question: "Can I transfer my 3-Month Membership to a friend?",
      answer: "Standard membership durations cannot be transferred. However, Annual Premium Passes support one-time transfers to immediate family members for a nominal re-indexing fee of ₹500.",
      category: "Pricing",
      priority: "Critical",
      isActive: true,
      queriesCount: 54
    }
  ]);

  // States
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Form Fields
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [newCategory, setNewCategory] = useState<FAQItem["category"]>("Custom");
  const [newPriority, setNewPriority] = useState<FAQItem["priority"]>("Medium");
  const [newStatus, setNewStatus] = useState(true);

  // Categories list per guidelines
  const categoriesList: Array<FAQItem["category"]> = [
    "Pricing",
    "Memberships",
    "Appointments",
    "Services",
    "Products",
    "Payments",
    "Policies",
    "Custom"
  ];

  // AI FAQ Generator State
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<Array<Omit<FAQItem, "id" | "queriesCount" | "isActive">>>([]);

  const handleGenerateAIFAQs = () => {
    setIsGenerating(true);
    // Simulate smart backend RAG parsing
    setTimeout(() => {
      setAiSuggestions([
        {
          question: "What plans include the Personal Trainer perks?",
          answer: "The 'Elite Strength Elite' Quarterly pass and 'Ultimate Annual Pass' include personalized instructor assessments, weekly body composition checks, and customized gym training routines.",
          category: "Memberships",
          priority: "High"
        },
        {
          question: "Can I cancel a locked Annual Pass membership prematurely?",
          answer: "Annual Passes are heavily discounted. You can terminate the contract early in exchange for a cancellation fee equivalent to 20% of the remaining contract value.",
          category: "Policies",
          priority: "Medium"
        },
        {
          question: "Are there joining fees on the quarterly plan?",
          answer: "The Elite Strength Quarterly plan carries a small one-time registration fee of ₹750 due on signup. Annual VIP packages carry absolutely zero joining charges.",
          category: "Pricing",
          priority: "High"
        }
      ]);
      setIsGenerating(false);
      triggerSuccess("AI successfully synthesized 3 new highly relevant FAQ drafts!");
    }, 1500);
  };

  const triggerSuccess = (text: string) => {
    setNotification(text);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleAddSuggestedFAQ = (suggested: typeof aiSuggestions[0], index: number) => {
    const newItem: FAQItem = {
      id: `faq-${Date.now()}-${index}`,
      question: suggested.question,
      answer: suggested.answer,
      category: suggested.category,
      priority: suggested.priority,
      isActive: true,
      queriesCount: 0
    };
    setFaqs([newItem, ...faqs]);
    setAiSuggestions(aiSuggestions.filter((_, i) => i !== index));
    triggerSuccess(`Successfully saved and indexed FAQ: "${suggested.question}"`);
  };

  const handleSubmitFAQ = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) return;

    const newItem: FAQItem = {
      id: `faq-${Date.now()}`,
      question: newQuestion,
      answer: newAnswer,
      category: newCategory,
      priority: newPriority,
      isActive: newStatus,
      queriesCount: 0
    };

    setFaqs([newItem, ...faqs]);
    setNewQuestion("");
    setNewAnswer("");
    setNewCategory("Custom");
    setNewPriority("Medium");
    setNewStatus(true);
    setShowAddForm(false);
    triggerSuccess("Custom question-answer pair successfully loaded into bot memory!");
  };

  const deleteFAQ = (id: string) => {
    setFaqs(faqs.filter(f => f.id !== id));
  };

  const toggleFAQStatus = (id: string) => {
    setFaqs(faqs.map(f => f.id === id ? { ...f, isActive: !f.isActive } : f));
  };

  // Analytics Helpers
  const mostAsked = faqs.length > 0 ? faqs.reduce((max, f) => f.queriesCount > max.queriesCount ? f : max, faqs[0]) : null;
  const totalInquiries = faqs.reduce((acc, f) => acc + f.queriesCount, 0);

  const missingSuggestions = [
    { text: "Do you offer parking?", count: 42, suggestedCat: "Policies" },
    { text: "Do you have student discounts?", count: 28, suggestedCat: "Pricing" }
  ];

  const lowConfidenceLogs = [
    { query: "Is there a trainer for boxing?", confScore: "54%", matchName: "Personal Trainer Session" },
    { query: "Can I bring my dog?", confScore: "42%", matchName: "Locker Facility Rules" }
  ];

  // Filtering Logic
  const filteredFAQs = faqs.filter(f => {
    const matchesCategory = activeCategory === "All" || f.category === activeCategory;
    const matchesSearch = f.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          f.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div id="faq-management-module" className="space-y-8 font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[var(--border)] pb-6 relative">
        
        {/* Dynamic Success Toast */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ y: -15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -15, opacity: 0 }}
              className="absolute top-0 right-0 bg-[var(--bg-card)] border border-blue-500/30 text-[var(--text)] px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 z-50 text-xs font-bold"
            >
              <CheckCircle className="w-4 h-4 text-green-400" />
              {notification}
            </motion.div>
          )}
        </AnimatePresence>

        <div>
          <h2 className="text-xl font-black text-[var(--text)] tracking-tight flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-500" />
            FAQ Management
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Teach Autofy how to answer common customer questions, handle RAG inquiries, and build confidence charts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleGenerateAIFAQs}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border)] hover:bg-[var(--bg-elevated)] text-[var(--text)] text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            {isGenerating ? "Synthesizing RAG..." : "Generate FAQs Using AI"}
            <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
          </button>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-550 text-[var(--text)] text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-blue-500/10"
          >
            {showAddForm ? "Show FAQ Table" : "Add FAQ"}
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* DETAILED FAQ ANALYTICS SIDE PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className="p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl backdrop-blur-md">
          <p className="text-[10px] text-[var(--text-subtle)] uppercase font-black tracking-wider mb-2">Most Asked Question</p>
          {mostAsked ? (
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-[var(--text)] truncate">{mostAsked.question}</p>
              <div className="flex items-center gap-2">
                <span className="bg-blue-600/10 text-blue-400 font-mono text-[9px] px-1.5 py-0.5 rounded font-bold">
                  {mostAsked.queriesCount} queries
                </span>
                <span className="text-[10px] text-[var(--text-subtle)]">Auto replied</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[var(--text-subtle)]">No data logged yet.</p>
          )}
        </div>

        {/* Metric 2 */}
        <div className="p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl backdrop-blur-md">
          <p className="text-[10px] text-[var(--text-subtle)] uppercase font-black tracking-wider mb-2">Confidence Run Rate</p>
          <div className="space-y-1.5">
            <p className="text-xl font-mono font-black text-green-400">92.4%</p>
            <p className="text-[9.5px] text-[var(--text-muted)]">Average NLP confidence score this period</p>
          </div>
        </div>

        {/* Metric 3: Low Confidence Queries */}
        <div className="p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl backdrop-blur-md">
          <p className="text-[10px] text-[var(--text-subtle)] uppercase font-bold tracking-wider mb-2 text-amber-500 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            Low Confidence Answers
          </p>
          <div className="space-y-1 max-h-[50px] overflow-y-auto pr-1">
            {lowConfidenceLogs.map((log, idx) => (
              <div key={idx} className="flex justify-between text-[10px] items-center text-[var(--text)]">
                <span className="truncate max-w-[80%]">"{log.query}"</span>
                <span className="font-mono text-amber-400 text-[9px]">{log.confScore}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Metric 4: Unassigned Queries */}
        <div className="p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl backdrop-blur-md">
          <p className="text-[10px] text-amber-400/80 uppercase font-black tracking-wider mb-2 flex items-center gap-1">
            <MessageCircle className="w-3.5 h-3.5 text-amber-400" />
            Missing FAQ Suggestions
          </p>
          <div className="space-y-1 max-h-[50px] overflow-y-auto pr-1">
            {missingSuggestions.map((sg, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setNewQuestion(sg.text);
                  setNewCategory(sg.suggestedCat as FAQItem["category"]);
                  setShowAddForm(true);
                }}
                className="w-full text-left flex justify-between text-[10px] items-center text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                <span className="truncate max-w-[80%] select-text">"{sg.text}"</span>
                <span className="font-bold text-blue-400 hover:underline">{sg.count}x</span>
              </button>
            ))}
          </div>
        </div>

      </div>

      <AnimatePresence mode="wait">
        
        {/* ADD FAQ FORM VIEW */}
        {showAddForm ? (
          <motion.div
            key="add-faq-form"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="p-6 bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl backdrop-blur-md"
          >
            <div className="border-b border-[var(--border)] pb-3 mb-5">
              <h3 className="text-sm font-black text-[var(--text)] uppercase tracking-wider text-blue-400">Configure Custom FAQ answer</h3>
              <p className="text-[10.5px] text-[var(--text-subtle)]">Provide high-confidence direct bot answers for matching user questions.</p>
            </div>

            <form onSubmit={handleSubmitFAQ} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black tracking-wider text-[var(--text-subtle)]">Target Customer Query (What customers ask)</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Is there designated parking near your building entrance?"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="w-full bg-[#0a0a0c] border border-[var(--border)] p-3 rounded-xl text-xs text-[var(--text)] placeholder-neutral-500 focus:outline-none focus:border-[var(--brand)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-black tracking-wider text-[var(--text-subtle)]">Automated Bot Reply Payout Text</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Yes, we provide safe underground multi-level parking completely free for the first 2 hours. Just validate your registration slip at our checkout bay."
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  className="w-full bg-[#0a0a0c] border border-[var(--border)] p-3 rounded-xl text-xs text-[var(--text)] placeholder-neutral-500 focus:outline-none focus:border-[var(--brand)]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black tracking-wider text-[var(--text-subtle)]">FAQ Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as FAQItem["category"])}
                    className="w-full bg-[#0a0a0c] border border-[var(--border)] p-2.5 rounded-xl text-xs text-[var(--text)] focus:outline-none"
                  >
                    {categoriesList.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black tracking-wider text-[var(--text-subtle)]">RAG Priority Level</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as FAQItem["priority"])}
                    className="w-full bg-[#0a0a0c] border border-[var(--border)] p-2.5 rounded-xl text-xs text-[var(--text)] focus:outline-none"
                  >
                    <option value="Low">Low (General helpful facts)</option>
                    <option value="Medium">Medium (Active services facts)</option>
                    <option value="High">High (Core policies & timing)</option>
                    <option value="Critical">Critical (Transactional terms)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setNewStatus(!newStatus)}
                  className={`w-7 h-4 rounded-full p-0.5 transition-all outline-none ${
                    newStatus ? "bg-blue-600" : "bg-[var(--bg-elevated)]"
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full bg-white transition-all ${
                    newStatus ? "translate-x-3" : "translate-x-0"
                  }`} />
                </button>
                <div>
                  <p className="text-xs font-bold text-[var(--text)]">Active Status</p>
                  <p className="text-[10px] text-[var(--text-subtle)]">Indexed for immediate matching in live chats</p>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-3 text-xs font-bold text-[var(--text-muted)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 text-xs font-bold text-[var(--text)] bg-blue-600 hover:bg-blue-550 rounded-xl cursor-pointer shadow-lg shadow-blue-500/10"
                >
                  Save and Index Pairs
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          <div key="faq-database" className="space-y-6">
            
            {/* AI SUGGESTED DRAFTS SECTION (Shows up when user clicks generate) */}
            <AnimatePresence>
              {aiSuggestions.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="p-6 bg-blue-950/15 border border-blue-500/20 rounded-3xl backdrop-blur-md space-y-4 overflow-hidden"
                >
                  <div className="flex items-center justify-between border-b border-blue-500/10 pb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-400 animate-spin" />
                      <h4 className="text-xs font-extrabold text-blue-400 uppercase tracking-wider">AI FAQ Suggestions Ready for Verification</h4>
                    </div>
                    <button
                      onClick={() => setAiSuggestions([])}
                      className="p-1 hover:bg-[var(--bg-elevated)] rounded-xl text-[var(--text-muted)]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {aiSuggestions.map((item, idx) => (
                      <div key={idx} className="p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl flex flex-col justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] bg-blue-650 bg-blue-600/15 text-blue-400 border border-blue-500/20 rounded px-1.5 py-0.5 font-bold uppercase">
                              {item.category}
                            </span>
                            <span className="text-[9px] text-amber-400 font-bold font-mono">
                              {item.priority} Priority
                            </span>
                          </div>
                          <p className="text-xs font-bold text-[var(--text)]">"{item.question}"</p>
                          <p className="text-[10.5px] text-[var(--text-muted)] leading-normal line-clamp-3">"{item.answer}"</p>
                        </div>
                        <button
                          onClick={() => handleAddSuggestedFAQ(item, idx)}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-550 text-[var(--text)] font-bold text-[10px] rounded-xl transition-all cursor-pointer"
                        >
                          Approve & Index +
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* SELECTION FILTERS BAR */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              
              {/* Category buttons list */}
              <div className="flex overflow-x-auto gap-1.5 w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
                <button
                  onClick={() => setActiveCategory("All")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
                    activeCategory === "All"
                      ? "bg-blue-600/15 border-blue-500/25 text-blue-400 font-extrabold"
                      : "bg-[var(--bg-card)] border-[var(--border)] hover:border-[var(--border)] text-[var(--text-muted)]"
                  }`}
                >
                  All Categories
                </button>
                {categoriesList.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
                      activeCategory === cat
                        ? "bg-blue-600/15 border-blue-500/25 text-blue-400 font-extrabold"
                        : "bg-[var(--bg-card)] border-[var(--border)] hover:border-[var(--border)] text-[var(--text-muted)]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Keyword Search matching box */}
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 text-[var(--text-subtle)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search questions or keyword..."
                  className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl py-2 pl-9 pr-4 text-xs text-[var(--text)] placeholder-neutral-500 focus:outline-none focus:border-blue-500/40"
                />
              </div>

            </div>

            {/* RENDER TABLE OF FAQs */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 backdrop-blur-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-[10px] text-[var(--text-subtle)] text-[var(--text-subtle)] font-bold uppercase tracking-widest">
                      <th className="py-3 px-2">Question Asked</th>
                      <th className="py-3 px-2">Automated Reply Text</th>
                      <th className="py-3 px-2">Category</th>
                      <th className="py-3 px-2">Priority</th>
                      <th className="py-3 px-2 text-center">Hits</th>
                      <th className="py-3 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900/40">
                    {filteredFAQs.map((f) => (
                      <tr key={f.id} className="hover:bg-white/2 transition-colors">
                        <td className="py-4 px-2 max-w-[200px]">
                          <p className="font-bold text-[var(--text)] leading-relaxed select-text">"{f.question}"</p>
                        </td>
                        <td className="py-4 px-2 max-w-[320px]">
                          <p className="text-[var(--text)] leading-relaxed select-text">"{f.answer}"</p>
                        </td>
                        <td className="py-4 px-2">
                          <span className="px-2 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-muted)] font-bold border border-[var(--border)]">
                            {f.category}
                          </span>
                        </td>
                        <td className="py-4 px-2">
                          <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase tracking-wider ${
                            f.priority === "Critical" 
                              ? "bg-red-550 bg-red-500/10 text-red-400 border border-red-500/25"
                              : f.priority === "High"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/25"
                              : f.priority === "Medium"
                              ? "bg-blue-600/10 text-blue-400 border border-blue-500/25"
                              : "bg-[var(--bg-elevated)] text-[var(--text-muted)]"
                          }`}>
                            {f.priority}
                          </span>
                        </td>
                        <td className="py-4 px-2 font-mono text-center font-bold text-[var(--text-subtle)]">
                          {f.queriesCount}
                        </td>
                        <td className="py-4 px-2 text-right">
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => toggleFAQStatus(f.id)}
                              className={`px-2 py-1 text-[10px] rounded hover:opacity-80 font-bold cursor-pointer ${
                                f.isActive 
                                  ? "bg-green-600/10 text-green-400 border border-green-500/20" 
                                  : "bg-[var(--bg-elevated)] text-[var(--text-subtle)] border border-[var(--border)]"
                              }`}
                            >
                              {f.isActive ? "Indexed" : "Muted"}
                            </button>
                            <button
                              onClick={() => deleteFAQ(f.id)}
                              className="p-1.5 text-[var(--text-subtle)] hover:text-red-400 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredFAQs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-[var(--text-subtle)] text-xs italic">
                          No FAQs matched these filtered parameters. Check category or click Create FAQ.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
