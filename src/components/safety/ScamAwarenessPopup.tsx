"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const STORAGE_KEY = "adspace_scam_warning_seen";

export default function ScamAwarenessPopup() {
  const { status } = useSession();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    if (status !== "authenticated") return;

    // Delay slightly for smoother experience
    const initialDelay = setTimeout(() => {
      setIsVisible(true);
    }, 500);

    // Auto-hide after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 5500); // 5s + 500ms initial delay

    return () => {
      clearTimeout(initialDelay);
      clearTimeout(timer);
    };
  }, [status]);

  const handleClose = () => {
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed z-50 bottom-4 sm:bottom-8 right-4 sm:right-8 left-4 sm:left-auto sm:w-[420px] bg-[#0f172a]/95 backdrop-blur-2xl border border-slate-700/50 shadow-2xl rounded-3xl overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 opacity-90" />
          
          <div className="p-6 sm:p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-[inset_0_0_20px_rgba(245,158,11,0.05)]">
                  <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg tracking-tight leading-tight">Stay Safe on AdSpace</h3>
                  <p className="text-xs text-slate-400 mt-1 font-medium">Protect yourself from fraud</p>
                </div>
              </div>
              <button 
                onClick={handleClose}
                className="text-slate-500 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors bg-slate-800/50"
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <ul className="space-y-4 mb-8">
              {[
                "Never send money outside the platform",
                "Verify advertiser details before payments",
                "Avoid sharing OTPs or banking info",
                "Report suspicious users immediately"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)] shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-3">
              <button 
                onClick={handleClose}
                className="flex-1 py-3 px-4 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-semibold rounded-xl transition-all border border-slate-700/50"
              >
                Got it
              </button>
              <Link 
                href="/safety"
                onClick={handleClose}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-sm font-bold rounded-xl transition-all text-center shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] border border-amber-400/20"
              >
                Learn More
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
