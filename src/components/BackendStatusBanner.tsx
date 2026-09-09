import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, AlertCircle, RefreshCw, WifiOff } from "lucide-react";
import { BackendHealthState, getBackendState, onBackendStateChange, checkBackendReadiness } from "../lib/api";

export const BackendStatusBanner: React.FC = () => {
  const [state, setState] = useState<BackendHealthState>(getBackendState);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const unsub = onBackendStateChange((newState) => {
      setState(newState);
      if (newState === "online") {
        setIsRetrying(false);
      }
    });

    // Check backend readiness once on app load
    checkBackendReadiness(45000).catch(() => {});

    return () => unsub();
  }, []);

  const handleManualRetry = async () => {
    setIsRetrying(true);
    await checkBackendReadiness(45000);
    setIsRetrying(false);
  };

  if (state === "online") {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -40 }}
        transition={{ duration: 0.3 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] max-w-[92vw] w-auto pointer-events-auto"
      >
        {state === "waking" && (
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-[#12131F]/90 text-white border border-purple-500/30 shadow-2xl backdrop-blur-md text-xs font-medium font-sans">
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
            <Loader2 className="w-4 h-4 text-purple-400 animate-spin shrink-0" />
            <span className="text-gray-200">
              <strong className="text-purple-300">Starting Autofy services…</strong> The server is waking up. This may take up to a minute.
            </span>
          </div>
        )}

        {state === "timeout" && (
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-red-950/90 text-white border border-red-500/30 shadow-2xl backdrop-blur-md text-xs font-medium font-sans">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="text-red-200">
              Autofy server is taking longer than expected.
            </span>
            <button
              onClick={handleManualRetry}
              disabled={isRetrying}
              className="ml-2 px-3 py-1 rounded-full bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              {isRetrying ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              {isRetrying ? "Retrying..." : "Retry"}
            </button>
          </div>
        )}

        {state === "offline" && (
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-amber-950/90 text-white border border-amber-500/30 shadow-2xl backdrop-blur-md text-xs font-medium font-sans">
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-amber-200">
              You are currently offline. Please check your internet connection.
            </span>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
