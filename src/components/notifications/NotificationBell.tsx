"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import NotificationDropdown from "./NotificationDropdown";
import { getSocket } from "@/lib/socket";
import { initAudio, playNotificationSound } from "@/lib/audio";

export default function NotificationBell() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasFetched, setHasFetched] = useState(false);

  // Initialize audio on first user interaction
  useEffect(() => {
    const handleInteraction = () => initAudio();
    document.addEventListener("click", handleInteraction, { once: true, capture: true });
    document.addEventListener("keydown", handleInteraction, { once: true, capture: true });
    return () => {
      document.removeEventListener("click", handleInteraction, { capture: true });
      document.removeEventListener("keydown", handleInteraction, { capture: true });
    };
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;

    let currentCount = 0;

    const abortController = new AbortController();

    const fetchUnreadCount = async (isInitial = false) => {
      try {
        const res = await fetch("/api/notifications/unread-count", { signal: abortController.signal });
        let newCount = 0;
        if (res.ok) {
          const data = await res.json();
          newCount = data.count || 0;
        } else {
          // Fallback if endpoint doesn't exist yet
          const fallbackRes = await fetch("/api/notifications", { signal: abortController.signal });
          const fallbackData = await fallbackRes.json();
          if (fallbackData.success) {
            newCount = fallbackData.data.filter((n: any) => !n.isRead).length;
          }
        }
        
        if (abortController.signal.aborted) return;

        setUnreadCount((prev) => {
          if (!isInitial && newCount > prev) {
            playNotificationSound();
          }
          return newCount;
        });
        setHasFetched(true);
      } catch (error: any) {
        if (error.name === "AbortError") return;
        console.warn("Could not fetch notification count:", error);
      }
    };

    if (!hasFetched) {
      fetchUnreadCount(true);
    }

    // Since background jobs create notifications without socket events, we must poll
    const interval = setInterval(() => fetchUnreadCount(false), 15000); // 15 seconds

    const socket = getSocket();
    if (!socket) return;

    const handleNewNotification = (notification: any) => {
      setUnreadCount(prev => prev + 1);
      playNotificationSound();
    };

    const handleReadSync = () => {
      // Just re-fetch count when something is read elsewhere to keep it accurate
      fetchUnreadCount();
    };

    socket.on("newNotification", handleNewNotification);
    socket.on("notificationReadSync", handleReadSync);

    return () => {
      clearInterval(interval);
      socket.off("newNotification", handleNewNotification);
      socket.off("notificationReadSync", handleReadSync);
      abortController.abort();
    };
  }, [session?.user?.id, hasFetched]);

  if (!session) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors focus:outline-none"
        aria-label="Notifications"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.div>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-50 mt-2"
          >
            <NotificationDropdown 
              onClose={() => setIsOpen(false)} 
              onUnreadCountChange={(count) => setUnreadCount(count)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
