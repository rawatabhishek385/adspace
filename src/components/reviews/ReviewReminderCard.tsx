"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface ReviewReminder {
  conversationId: string;
  listingId: string;
  listingTitle: string;
  listingSlug: string;
  imageUrl: string | null;
  counterpartId: string;
  isOwner: boolean;
  lastMessageAt: string;
}

export default function ReviewReminderCard() {
  const [reminders, setReminders] = useState<ReviewReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchReminders = async () => {
      try {
        const res = await fetch("/api/reviews/reminders");
        const data = await res.json();
        if (data.success) {
          setReminders(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch review reminders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReminders();
  }, []);

  const handleDismiss = (conversationId: string) => {
    setDismissed((prev) => new Set(prev).add(conversationId));
  };

  if (loading || reminders.length === 0) return null;

  const activeReminders = reminders.filter((r) => !dismissed.has(r.conversationId));

  if (activeReminders.length === 0) return null;

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {activeReminders.map((reminder) => (
          <motion.div
            key={reminder.conversationId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gradient-to-r from-amber-50 to-white border border-amber-200 shadow-sm rounded-2xl p-5 relative overflow-hidden"
          >
            {/* Background decoration */}
            <div className="absolute -right-6 -top-6 text-amber-100 opacity-50 pointer-events-none">
              <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>

            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 border border-amber-200">
                  {reminder.imageUrl ? (
                    <img src={reminder.imageUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <span className="text-amber-500 text-xl">⭐</span>
                  )}
                </div>
                <div>
                  <h3 className="text-slate-800 font-semibold flex items-center gap-2">
                    How was your experience?
                  </h3>
                  <p className="text-slate-500 text-sm mt-0.5">
                    Leave a review for <span className="font-medium text-slate-700">{reminder.listingTitle}</span> and help others.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => handleDismiss(reminder.conversationId)}
                  className="text-slate-400 hover:text-slate-600 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Dismiss
                </button>
                <Link
                  href={`/listings/${reminder.listingSlug}`}
                  className="flex-1 sm:flex-none text-center px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-xl transition-colors shadow-sm shadow-amber-500/20"
                >
                  Write Review
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
