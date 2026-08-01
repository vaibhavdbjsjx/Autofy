import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { api } from "../lib/api";
import {
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Brain,
  Plus,
  Trash2,
  BookOpen,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Search,
  Check,
  Zap,
  Info
} from "lucide-react";

interface AILog {
  id: string;
  user_query: string;
  ai_response: string;
  confidence: number;
  status: "raw" | "corrected" | "reviewed";
  corrected_response?: string;
  created_at: string;
}

interface AIKnowledgeGap {
  id: string;
  topic: string;
  unanswered_query: string;
  hit_count: number;
  suggested_faq_question: string;
  suggested_faq_answer: string;
  status: "detected" | "trained" | "dismissed";
}

interface AITrainedAnswer {
  id: string;
  trigger_phrase: string;
  trained_response: string;
  created_at: string;
}

interface AITrainingCenterTabProps {
  triggerNotification?: (msg: string) => void;
}

export const AITrainingCenterTab: React.FC<AITrainingCenterTabProps> = ({
  triggerNotification = (msg) => console.log(msg)
}) => {
  // Main Panel Tab: "review" | "training" | "gaps" | "reports"
  const [activeSubTab, setActiveSubTab] = useState<"review" | "training" | "gaps" | "reports">("review");
  const [isLoading, setIsLoading] = useState(false);

  // Core Data Lists
  const [logs, setLogs] = useState<AILog[]>([
    {
      id: "log-1",
      user_query: "Do you build custom titanium chambers for exhausts?",
      ai_response: "I'm sorry, we only stock stainless steel single-core silencers listed in our inventory.",
      confidence: 0.45,
      status: "raw",
      created_at: "2026-06-20 09:12"
    },
    {
      id: "log-2",
      user_query: "Can I return my helmet if the size is too small?",
      ai_response: "I don't have information on the refund policy of our shop. Let me check with our manager.",
      confidence: 0.52,
      status: "raw",
      created_at: "2026-06-20 08:44"
    },
    {
      id: "log-3",
      user_query: "What is the db level of Red Rooster for Meteor 350?",
      ai_response: "The Red Rooster Exhaust is designed inside standard government-approved db limits.",
      confidence: 0.88,
      status: "reviewed",
      created_at: "2026-06-19 18:20"
    },
    {
      id: "log-4",
      user_query: "Are you open on Sundays for installation?",
      ai_response: "Our support team is active from 9 AM to 6 PM Monday through Friday. I cannot confirm weekend installs.",
      confidence: 0.38,
      status: "raw",
      created_at: "2026-06-19 14:15"
    }
  ]);

  const [gaps, setGaps] = useState<AIKnowledgeGap[]>([
    {
      id: "gap-1",
      topic: "Custom Titanium Fabrication",
      unanswered_query: "Do you manufacture custom titanium pipes?",
      hit_count: 14,
      suggested_faq_question: "Do you manufacture custom titanium exhaust pipes?",
      suggested_faq_answer: "We specialize in premium stainless steel slip-ons but can arrange titanium custom works via advanced pre-orders. Contact our custom lab desk.",
      status: "detected"
    },
    {
      id: "gap-2",
      topic: "Weekend Fitting Lab Hours",
      unanswered_query: "Are you open on Sundays for installation?",
      hit_count: 9,
      suggested_faq_question: "Can I book custom exhaust fitting on weekends?",
      suggested_faq_answer: "Our mechanic workshop operates 10:00 AM to 5:00 PM on Saturdays. Sundays are closed except by exclusive club appointments.",
      status: "detected"
    },
    {
      id: "gap-3",
      topic: "International Customs Carrier Duties",
      unanswered_query: "Do you ship to UAE and handle duty clearance?",
      hit_count: 6,
      suggested_faq_question: "Do you ship to international regions?",
      suggested_faq_answer: "Yes, we support global shipping via DHL Express. Buyers are responsible for localized import customs clearances.",
      status: "detected"
    }
  ]);

  const [trainedAnswers, setTrainedAnswers] = useState<AITrainedAnswer[]>([
    {
      id: "tr-1",
      trigger_phrase: "Heavy duty engine warranty details",
      trained_response: "All standard performance exhausts carry an official 12-month manufacturer replacement warranty covering structural leaks and baffle cracks.",
      created_at: "2026-06-18 11:30"
    },
    {
      id: "tr-2",
      trigger_phrase: "Can we install baffle cores manually",
      trained_response: "Yes, all our single slip-on exhausts come with standard inner hex-bolts. You can slide in the dB-killer baffle manually using standard 4mm Allen keys.",
      created_at: "2026-06-15 15:44"
    }
  ]);

  // Analytics State
  const [stats, setStats] = useState({
    totalQueries: 1420,
    lowConfidenceCount: 14,
    correctedCount: 38,
    avgConfidence: 0.86
  });

  // Action States
  const [reviewIdToCorrect, setReviewIdToCorrect] = useState<string | null>(null);
  const [tempCorrectedText, setTempCorrectedText] = useState("");

  const [newTrigger, setNewTrigger] = useState("");
  const [newTrainedText, setNewTrainedText] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  // Sync API Data on Load
  useEffect(() => {
    fetchTrainingData();
  }, []);

  const fetchTrainingData = async () => {
    setIsLoading(true);
    try {
      const data = await api.get<any>("/api/v1/ai-training/logs");
      if (data?.logs && data.logs.length > 0) setLogs(data.logs);
    } catch (e) {
      console.log("AI Training logs fallback:", e);
    }

    try {
      const data = await api.get<any>("/api/v1/ai-training/knowledge-gaps");
      if (data?.gaps && data.gaps.length > 0) setGaps(data.gaps);
    } catch (e) {
      console.log("AI Training gaps fallback:", e);
    }

    try {
      const data = await api.get<any>("/api/v1/ai-training/trained-answers");
      if (data?.trained_answers && data.trained_answers.length > 0) setTrainedAnswers(data.trained_answers);
    } catch (e) {
      console.log("AI Training trained-answers fallback:", e);
    }

    try {
      const data = await api.get<any>("/api/v1/ai-training/analytics");
      setStats({
        totalQueries: data.total_queries || 1420,
        lowConfidenceCount: data.low_confidence_count || 14,
        correctedCount: data.corrected_count || 38,
        avgConfidence: data.average_confidence || 0.86
      });
    } catch (e) {
      console.log("AI Training analytics fallback:", e);
    }

    setIsLoading(false);
  };

  // 1. Correct and Verify a Wrong Answer
  const handleApproveLog = (id: string) => {
    const matched = logs.find(l => l.id === id);
    if (!matched) return;

    setLogs(logs.map(l => l.id === id ? { ...l, status: "reviewed" } : l));
    triggerNotification(`AI query response approved as correct.`);

    // Send API
    api.post(`/api/v1/ai-training/logs/${id}/correct`, { corrected_response: matched.ai_response })
      .catch(err => console.log("Fail to save verification logs:", err));
  };

  const handleCorrectWrongAnswerSubmit = async () => {
    if (!tempCorrectedText.trim()) {
      triggerNotification("Please type a valid correction response text first.");
      return;
    }
    if (!reviewIdToCorrect) return;

    const matchedLog = logs.find(l => l.id === reviewIdToCorrect);
    if (!matchedLog) return;

    // Update frontend
    setLogs(logs.map(l => l.id === reviewIdToCorrect ? {
      ...l,
      corrected_response: tempCorrectedText,
      status: "corrected" as const
    } : l));

    // Append to trained answers immediately to teach the AI
    const newTrained: AITrainedAnswer = {
      id: "tr-" + Math.floor(Math.random() * 900),
      trigger_phrase: matchedLog.user_query,
      trained_response: tempCorrectedText,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    setTrainedAnswers([newTrained, ...trainedAnswers]);

    triggerNotification("Correction recorded nicely! New active AI response rule trained successfully.");
    
    // Reset modal fields
    setReviewIdToCorrect(null);
    setTempCorrectedText("");

    // POST API
    try {
      await api.post(`/api/v1/ai-training/logs/${reviewIdToCorrect}/correct`, { corrected_response: tempCorrectedText });
      fetchTrainingData();
    } catch (err) {
      console.log(err);
    }
  };

  // 2. Train a brand new custom Answer
  const handleAddNewTrainedRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrigger.trim() || !newTrainedText.trim()) {
      triggerNotification("Please fill in both trigger phrase and reply text.");
      return;
    }

    const newRule: AITrainedAnswer = {
      id: "tr-" + Math.floor(Math.random() * 1000 + 1000),
      trigger_phrase: newTrigger,
      trained_response: newTrainedText,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    setTrainedAnswers([newRule, ...trainedAnswers]);
    triggerNotification(`AI successfully trained on phrase: "${newTrigger}"`);

    const prevTrigger = newTrigger;
    setNewTrigger("");
    setNewTrainedText("");

    try {
      await api.post("/api/v1/ai-training/trained-answers", { trigger_phrase: prevTrigger, trained_response: newTrainedText });
      fetchTrainingData();
    } catch (err) {
      console.log(err);
    }
  };

  // 3. Delete Trained Answer Rule
  const handleDeleteTrainedRule = async (id: string) => {
    setTrainedAnswers(trainedAnswers.filter(a => a.id !== id));
    triggerNotification("Trained Q&A rule deleted from standard routing.");

    try {
      await api.del(`/api/v1/ai-training/trained-answers/${id}`);
    } catch (err) {
      console.log(err);
    }
  };

  // 4. Save gap as approved FAQ
  const handleConvertGapToFAQ = async (gap: AIKnowledgeGap) => {
    setGaps(gaps.map(g => g.id === gap.id ? { ...g, status: "trained" } : g));
    triggerNotification(`Gap "${gap.topic}" converted and compiled directly into FAQ Management.`);

    try {
      await api.post(`/api/v1/ai-training/knowledge-gaps/${gap.id}/convert-to-faq`, {
        question: gap.suggested_faq_question,
        answer: gap.suggested_faq_answer
      });
    } catch (err) {
      console.log(err);
    }
  };

  // Filtering reviews
  const filteredLogs = logs.filter(l => {
    const q = searchQuery.toLowerCase();
    return l.user_query.toLowerCase().includes(q) || l.ai_response.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-8 text-left">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight flex items-center gap-2" style={{ color: "var(--text)" }}>
            <Brain className="w-6 h-6 text-indigo-400 stroke-[1.8]" />
            AI Performance Training Lab
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Empower your WhatsApp agent! Correct wrong answers, review logs, verify knowledge gaps, and update FAQ triggers.
          </p>
        </div>

        {/* REFRESH CAP */}
        <button
          onClick={fetchTrainingData}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)] text-[var(--text)] text-xs font-bold border border-[var(--border)] rounded-xl cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* CORE STATS KPI CARDS CARD */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-black tracking-widest text-[var(--text-muted)]">
            AI Average Confidence
          </span>
          <p className="text-2xl font-black text-[var(--text)] mt-1">
            {Math.round(stats.avgConfidence * 100)}%
          </p>
          <div className="text-[10px] text-green-400 font-bold mt-1.5 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Target threshold 90%</span>
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-black tracking-widest text-[var(--text-muted)]">
            Pending Reviews
          </span>
          <p className="text-2xl font-black mt-1 text-amber-400">
            {logs.filter(l => l.status === "raw").length} Queries
          </p>
          <p className="text-[10px] text-[var(--text-muted)] mt-1.5">Needs correction check</p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-black tracking-widest text-[var(--text-muted)]">
            Missing Knowledge Gaps
          </span>
          <p className="text-2xl font-black mt-1 text-red-400">
            {gaps.filter(g => g.status === "detected").length} Hot Gaps
          </p>
          <p className="text-[10px] text-[var(--text-muted)] mt-1.5">Customers asked but failed</p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border)] p-5 rounded-2xl">
          <span className="text-[10px] uppercase font-black tracking-widest text-[var(--text-muted)]">
            Active Rules Trained
          </span>
          <p className="text-2xl font-black text-indigo-400 mt-1">
            {trainedAnswers.length} Rules
          </p>
          <p className="text-[10px] text-[var(--text-muted)] mt-1.5">Custom triggers injected</p>
        </div>

      </div>

      {/* SUB TAB CONTROLLERS */}
      <div className="flex border-b border-[var(--border)] gap-1 pb-px">
        <button
          onClick={() => setActiveSubTab("review")}
          className={`pb-2.5 px-4 text-xs font-extrabold transition-all outline-none border-b-2 hover:text-[var(--text)] cursor-pointer ${
            activeSubTab === "review" 
              ? "border-indigo-500 text-[var(--text)]" 
              : "border-transparent text-[var(--text-muted)]"
          }`}
        >
          Response Review ({logs.length})
        </button>
        <button
          onClick={() => setActiveSubTab("gaps")}
          className={`pb-2.5 px-4 text-xs font-extrabold transition-all outline-none border-b-2 hover:text-[var(--text)] cursor-pointer relative ${
            activeSubTab === "gaps" 
              ? "border-indigo-500 text-[var(--text)]" 
              : "border-transparent text-[var(--text-muted)]"
          }`}
        >
          Knowledge Gap Detector
          {gaps.filter(g => g.status === "detected").length > 0 && (
            <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-red-500" />
          )}
        </button>
        <button
          onClick={() => setActiveSubTab("training")}
          className={`pb-2.5 px-4 text-xs font-extrabold transition-all outline-none border-b-2 hover:text-[var(--text)] cursor-pointer ${
            activeSubTab === "training" 
              ? "border-indigo-500 text-[var(--text)]" 
              : "border-transparent text-[var(--text-muted)]"
          }`}
        >
          Train AI Triggers
        </button>
        <button
          onClick={() => setActiveSubTab("reports")}
          className={`pb-2.5 px-4 text-xs font-extrabold transition-all outline-none border-b-2 hover:text-[var(--text)] cursor-pointer ${
            activeSubTab === "reports" 
              ? "border-indigo-500 text-[var(--text)]" 
              : "border-transparent text-[var(--text-muted)]"
          }`}
        >
          AI Confidence Analytics
        </button>
      </div>

      {/* RENDER CHOSEN MODULE VIEW */}
      
      {/* 1. RESPONSE REVIEW SECTION */}
      {activeSubTab === "review" && (
        <div className="space-y-6">

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search raw conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--bg-card)] border border-[var(--border)] focus:border-[var(--brand)] rounded-xl py-2 pl-9 pr-4 text-xs text-[var(--text)] focus:outline-none transition-colors"
              />
            </div>

            <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold">
              Review rating is computed using natural language logic confidence scores.
            </div>
          </div>

          <div className="space-y-4">
            {filteredLogs.map((log) => {
              const isRaw = log.status === "raw";
              const isCorrected = log.status === "corrected";
              const isLow = log.confidence < 0.60;

              return (
                <div 
                  key={log.id} 
                  className={`border rounded-2xl p-5 bg-[var(--bg-card)] overflow-hidden transition-all text-left relative ${
                    isRaw && isLow 
                      ? "border-amber-500/20 bg-amber-950/5" 
                      : log.status === "corrected" 
                        ? "border-indigo-500/25 bg-indigo-950/5" 
                        : "border-[var(--border)]"
                  }`}
                >
                  
                  {/* Badge Row */}
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded ${
                        log.status === "reviewed" ? "bg-green-500/10 text-green-400" :
                        log.status === "corrected" ? "bg-indigo-500/10 text-indigo-400" :
                        "bg-amber-500/10 text-amber-400"
                      }`}>
                        {log.status === "raw" ? "Awaiting Check" : log.status}
                      </span>

                      <div className="flex items-center gap-1">
                        <span className="text-[10.5px] text-[var(--text-muted)]">Confidence:</span>
                        <span className={`text-[10.5px] font-bold ${isLow ? "text-amber-400" : "text-green-400"}`}>
                          {Math.round(log.confidence * 100)}%
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] text-[var(--text-subtle)]">{log.created_at}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* User Asked */}
                    <div className="space-y-1 bg-white/[0.01] p-3 rounded-xl border border-[var(--border)]">
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-muted)]">
                        Incoming Customer Query
                      </p>
                      <p className="text-xs font-bold text-[var(--text)] italic">
                        "{log.user_query}"
                      </p>
                    </div>

                    {/* AI Answered */}
                    <div className="space-y-1 bg-white/[0.01] p-3 rounded-xl border border-[var(--border)]">
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-muted)]">
                        AI Agent Generated Reply
                      </p>
                      <p className="text-xs text-[var(--text)]">
                        {log.ai_response}
                      </p>
                      {log.corrected_response && (
                        <div className="mt-2.5 pt-2.5 border-t border-indigo-500/20">
                          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                            Manager Corrected & Retrained Reply
                          </p>
                          <p className="text-xs text-indigo-200 mt-1 font-bold">
                            {log.corrected_response}
                          </p>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Operational actions footer */}
                  {isRaw && (
                    <div className="mt-4 pt-4 border-t border-[var(--border)] flex justify-end gap-3">
                      <button
                        onClick={() => {
                          setReviewIdToCorrect(log.id);
                          setTempCorrectedText(log.ai_response);
                        }}
                        className="px-3.5 py-1.5 rounded-xl border border-[var(--border)] bg-white/[0.02] hover:bg-white/[0.06] text-xs font-bold text-[var(--text)] transition-all cursor-pointer"
                      >
                        Correct Wrong Answer
                      </button>
                      <button
                        onClick={() => handleApproveLog(log.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-green-600 hover:bg-green-500 text-xs font-extrabold text-[var(--text)] transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve Response
                      </button>
                    </div>
                  )}

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* 2. KNOWLEDGE GAP DETECTOR */}
      {activeSubTab === "gaps" && (
        <div className="space-y-6">
          
          <div className="p-4 bg-red-950/20 border border-red-500/20 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-[var(--text)]">Missing Knowledge Gap Detection</h4>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                The AI identified these hot topics where customer conversion was missed or queries fell short due to absent FAQ context. Click "Approve & Convert to FAQ" to automatically install structured responses within the client base.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {gaps.map((gap) => {
              const isTrained = gap.status === "trained";

              return (
                <div 
                  key={gap.id}
                  className={`bg-[var(--bg-card)] border rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-all ${
                    isTrained 
                      ? "border-green-500/20 bg-green-950/5 text-[var(--text-muted)]" 
                      : "border-[var(--border)] hover:border-white/10"
                  }`}
                >
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wider bg-white/[0.03] border border-[var(--border)] px-2.5 py-1.5 rounded-lg text-[var(--text)] font-extrabold">
                        {gap.topic}
                      </span>
                      <span className="text-xs font-mono font-bold text-[var(--text-muted)]">
                        Hit Count: <strong className="text-red-400 font-extrabold">{gap.hit_count} customers</strong>
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-red-400 tracking-wider">Example Failed Quote:</span>
                      <p className="text-xs text-[var(--text)] font-bold italic">
                        "{gap.unanswered_query}"
                      </p>
                    </div>

                    {/* SUGGESTED FAQ PREVIEW CARD */}
                    <div className="p-3.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl space-y-2 text-left">
                      <div className="flex items-center gap-1 text-xs text-yellow-400 font-black">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI Autogenerated FAQ Solution</span>
                      </div>
                      <div>
                        <p className="text-[11px] font-extrabold text-[var(--text)]">Q: {gap.suggested_faq_question}</p>
                        <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-normal">A: {gap.suggested_faq_answer}</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[var(--border)] flex justify-between items-center">
                    <span className="text-[10px] text-[var(--text-subtle)]">Status: {gap.status}</span>
                    
                    {isTrained ? (
                      <span className="text-xs text-green-400 font-bold flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> Solution Online
                      </span>
                    ) : (
                      <button
                        onClick={() => handleConvertGapToFAQ(gap)}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-black text-[var(--text)] rounded-xl transition-all cursor-pointer shadow flex items-center gap-1 active:scale-97"
                      >
                        <Zap className="w-3.5 h-3.5" /> Convert to FAQ
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* 3. TRAIN AI TRIGGERS */}
      {activeSubTab === "training" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Form left */}
          <div className="lg:col-span-5 bg-[#0c0c0e] border border-[var(--border)] rounded-3xl p-6 h-fit text-left space-y-5">
            <div>
              <h4 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider font-sans">
                Train a New Answer Trigger
              </h4>
              <p className="text-xs text-[var(--text-muted)] mt-1">Incorporate custom rules or specific engine answers directly.</p>
            </div>

            <form onSubmit={handleAddNewTrainedRule} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-[var(--text)]">Trigger phrase / Customer intent:</label>
                <input
                  type="text"
                  placeholder="e.g. shipping time to Bangalore, heavy duty warranty"
                  value={newTrigger}
                  onChange={(e) => setNewTrigger(e.target.value)}
                  className="w-full bg-black border border-[var(--border)] focus:border-[var(--brand)] rounded-xl py-2.5 px-3.5 text-xs text-[var(--text)] focus:outline-none transition-colors"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-[var(--text)]">Trained AI Response Text:</label>
                <textarea
                  rows={4}
                  placeholder="Type the exact verified answer the chatbot should send when this intent is identified."
                  value={newTrainedText}
                  onChange={(e) => setNewTrainedText(e.target.value)}
                  className="w-full bg-black border border-[var(--border)] focus:border-[var(--brand)] rounded-xl py-2.5 px-3.5 text-xs text-[var(--text)] focus:outline-none transition-colors leading-relaxed"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-white hover:bg-[var(--text)] text-black font-black text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-97 shadow"
              >
                <Plus className="w-4 h-4 stroke-[2.3]" />
                Inject Response Rule
              </button>
            </form>

            <div className="p-3.5 bg-indigo-950/20 border border-indigo-500/15 rounded-2xl flex gap-2.5">
              <Info className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
              <p className="text-[10.5px] text-indigo-300 leading-normal">
                All custom trained active answers bypass standard AI hallucinations, guaranteeing that high importance product specs or return deadlines match your written reply exactly.
              </p>
            </div>
          </div>

          {/* List right */}
          <div className="lg:col-span-7 bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 space-y-4 text-left">
            <div>
              <h4 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider font-sans">
                Active Training Catalog
              </h4>
              <p className="text-xs text-[var(--text-muted)] mt-1">Manage standard rules bypassing Gemini hallucinations.</p>
            </div>

            {trainedAnswers.length === 0 ? (
              <div className="text-center p-14 border border-[var(--border)] rounded-2xl bg-[var(--bg)]">
                <p className="text-xs text-[var(--text-muted)]">No custom triggering rules have been trained yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {trainedAnswers.map((item) => (
                  <div key={item.id} className="p-4 bg-black border border-[var(--border)] rounded-2xl justify-between flex items-start gap-4 text-left">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        <span className="text-xs font-black text-[var(--text)]">{item.trigger_phrase}</span>
                      </div>
                      <p className="text-xs text-[var(--text)] leading-relaxed pl-3.5">
                        {item.trained_response}
                      </p>
                      <span className="text-[10px] text-[var(--text-subtle)] block pl-3.5">Assigned: {item.created_at}</span>
                    </div>

                    <button
                      onClick={() => handleDeleteTrainedRule(item.id)}
                      className="p-1.5 rounded-lg border border-[var(--border)] hover:border-red-500/20 hover:text-red-400 text-[var(--text-subtle)] hover:bg-red-500/5 transition-all flex-shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* 4. AI ANALYTICS REPORT */}
      {activeSubTab === "reports" && (
        <div className="space-y-6">
          
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 text-left space-y-4">
            <div>
              <h4 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider font-sans">
                Weekly AI Confidence Report
              </h4>
              <p className="text-xs text-[var(--text-muted)]">Conversational AI answering confidence scores tracked across daily cycles.</p>
            </div>

            {/* Custom styled bento graphs bar representation */}
            <div className="space-y-4 pt-2">
              <div className="flex items-end justify-between gap-2.5 h-48 border-b border-[var(--border)] pb-1">
                {[
                  { day: "Mon", count: 180, conf: 82 },
                  { day: "Tue", count: 220, conf: 84 },
                  { day: "Wed", count: 190, conf: 81 },
                  { day: "Thu", count: 240, conf: 88 },
                  { day: "Fri", count: 310, conf: 89 },
                  { day: "Sat", count: 180, conf: 91 },
                  { day: "Sun", count: 100, conf: 92 }
                ].map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer h-full justify-end">
                    {/* Tooltip on hover */}
                    <div className="bg-white text-black text-[9.5px] font-mono py-1 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity absolute -translate-y-24 shadow font-bold z-10 text-center">
                      <p>{item.count} Chats</p>
                      <p>{item.conf}% Conf</p>
                    </div>

                    <div className="w-full flex justify-center gap-1 items-end h-full">
                      {/* Count bar */}
                      <div 
                        className="w-3 bg-white/[0.03] group-hover:bg-[#D1D5DB] rounded-t-sm transition-colors"
                        style={{ height: `${(item.count / 310) * 100}%` }}
                      />
                      {/* Confidence bar */}
                      <div 
                        className="w-3 bg-indigo-600 group-hover:bg-indigo-500 rounded-t-sm transition-colors"
                        style={{ height: `${(item.conf / 100) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-[var(--text-subtle)] font-mono">{item.day}</span>
                  </div>
                ))}
              </div>

              {/* Legend keys */}
              <div className="flex gap-4 justification-start text-[10px] font-mono text-[var(--text-muted)]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-indigo-600 rounded-xs" />
                  <span>Avg Answering Confidence (%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-white/[0.08] rounded-xs" />
                  <span>Queries Handled Count</span>
                </div>
              </div>
            </div>
          </div>

          {/* MOST FAILED QUESTIONS BENTO SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 space-y-4">
              <h5 className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-black">
                Most Failed Questions (Hits Count)
              </h5>
              
              <div className="space-y-3.5">
                {gaps.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-black p-3.5 rounded-2xl border border-[var(--border)]">
                    <div className="space-y-1">
                      <p className="text-xs text-[var(--text)] font-bold italic">"{item.unanswered_query}"</p>
                      <span className="text-[10px] text-indigo-400 font-extrabold bg-indigo-500/10 py-0.5 px-2 rounded-xs inline-block">
                        Topic: {item.topic}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-red-400 font-mono font-black">{item.hit_count} hits</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 space-y-4">
              <h5 className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-black">
                Low Confidence Warnings & Recommendations
              </h5>

              <div className="space-y-3.5 text-xs text-[var(--text)] leading-relaxed font-sans">
                <div className="p-4 bg-yellow-950/20 border border-yellow-500/20 rounded-2xl space-y-1.5">
                  <p className="font-bold text-yellow-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                    Expand Sizing Tables
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] leading-normal">
                    AI confidence scores dipped 12% during questions regarding helmet fitting guidelines. Consider adding detailed chest and head size-matrices into active knowledge bases.
                  </p>
                </div>

                <div className="p-4 bg-indigo-950/20 border border-indigo-500/20 rounded-2xl space-y-1.5">
                  <p className="font-bold text-indigo-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    Verify Sunday Logistics Info
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] leading-normal">
                    Sunday operational queries occurred heavily last week. Retrain model triggers on clear shop timings blocks to maintain standard transparency rating.
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* CORRECT LOG MODAL OVERLAY */}
      {reviewIdToCorrect && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 max-w-lg w-full space-y-5 text-left shadow-2xl">
            <div>
              <h4 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider font-sans">
                Add Correct Answer Solution
              </h4>
              <p className="text-xs text-[var(--text-muted)] mt-1">This correction auto-trains the AI trigger to always parse this response accurately.</p>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl">
                <span className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-wider">Customer Question Phrase:</span>
                <p className="text-xs text-[var(--text)] font-extrabold italic mt-1 font-sans">
                  "{logs.find(l => l.id === reviewIdToCorrect)?.user_query}"
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-[var(--text)]">Type Perfect Response text:</label>
                <textarea
                  rows={4}
                  value={tempCorrectedText}
                  onChange={(e) => setTempCorrectedText(e.target.value)}
                  className="w-full bg-black border border-[var(--border)] focus:border-[var(--brand)] rounded-xl py-2 px-3 text-xs text-[var(--text)] focus:outline-none transition-colors leading-relaxed"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3.5 pt-2">
              <button
                onClick={() => setReviewIdToCorrect(null)}
                className="px-4 py-2 text-xs bg-white/[0.02] hover:bg-white/[0.06] border border-[var(--border)] text-[var(--text-muted)] font-extrabold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCorrectWrongAnswerSubmit}
                className="px-5 py-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-[var(--text)] font-extrabold rounded-xl transition-all cursor-pointer shadow"
              >
                Confirm Train Rule
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
