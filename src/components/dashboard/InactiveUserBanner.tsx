"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function InactiveUserBanner() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkActivity = async () => {
      try {
        const res = await fetch("/api/user/activity-status");
        const data = await res.json();
        if (data.success && data.isInactive) {
          setShow(true);
        }
      } catch (error) {
        console.error("Failed to check activity status:", error);
      } finally {
        setLoading(false);
      }
    };

    checkActivity();
  }, []);

  if (loading || !show) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -20, height: 0 }}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg rounded-2xl mb-6 relative overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute right-0 top-0 bottom-0 w-64 opacity-20 pointer-events-none">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full fill-current">
              <polygon points="0,100 100,0 100,100" />
            </svg>
          </div>

          <div className="px-6 py-4 relative flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                <span className="text-2xl">👋</span>
              </div>
              <div>
                <h3 className="font-bold text-lg">Welcome back! It's been a while.</h3>
                <p className="text-blue-100 text-sm mt-0.5">
                  A lot has changed since you were last here. Check out the newest advertising spaces.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setShow(false)}
                className="px-4 py-2 text-blue-100 hover:text-white text-sm font-medium transition-colors"
              >
                Dismiss
              </button>
              <Link
                href="/listings"
                className="px-5 py-2.5 bg-white text-blue-600 hover:bg-blue-50 font-medium text-sm rounded-xl transition-colors shadow-sm"
              >
                Explore Now
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
