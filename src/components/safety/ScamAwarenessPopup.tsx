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

    // Auto-hide after 10 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 10500); // 10s + 500ms initial delay

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
          className="absolute z-50 bottom-4 sm:bottom-10 right-4 sm:right-10 left-4 sm:left-auto sm:w-[400px] bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
          
          <div className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2 text-amber-400">
                <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="font-bold text-white tracking-wide">Stay Safe on AdSpace</h3>
              </div>
              <button 
                onClick={handleClose}
                className="text-white/60 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <ul className="space-y-2 mb-6">
              {[
                "Never send money outside the platform.",
                "Verify advertiser details before making payments.",
                "Avoid sharing OTPs, passwords, or banking information.",
                "Be cautious of deals that seem too good to be true.",
                "Report suspicious users immediately."
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                  <span className="text-amber-400 mt-1 shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-3">
              <button 
                onClick={handleClose}
                className="flex-1 py-2.5 px-4 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-xl transition-colors border border-white/10"
              >
                Got It
              </button>
              <Link 
                href="/safety"
                onClick={handleClose}
                className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-900 text-sm font-bold rounded-xl transition-colors text-center"
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
