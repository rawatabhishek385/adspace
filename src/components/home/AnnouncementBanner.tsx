"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { playNotificationSound } from "@/lib/audio";

export default function AnnouncementBanner() {
  const [banner, setBanner] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchBanner = async () => {
      try {
        const res = await fetch("/api/banners", { signal: abortController.signal });
        const data = await res.json();
        if (data.success && data.data && data.data.length > 0 && !abortController.signal.aborted) {
          setBanner(data.data[0]); // Show the most recent active banner
          
          // Check if user previously dismissed it
          const dismissedId = localStorage.getItem("dismissed_banner_id");
          if (dismissedId !== data.data[0].id) {
            setIsVisible(true);
            playNotificationSound();
          }
        }
      } catch (error: any) {
        if (error.name === "AbortError") return;
        console.warn("Failed to fetch announcement banner:", error);
      }
    };
    fetchBanner();

    return () => {
      abortController.abort();
    };
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    if (banner) {
      localStorage.setItem("dismissed_banner_id", banner.id);
    }
  };

  if (!banner) return null;

  const content = (
    <div className="flex items-center justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        {banner.imageUrl && (
          <div className="w-8 h-8 rounded-full overflow-hidden relative shrink-0">
            <Image src={banner.imageUrl} alt="" fill className="object-cover" />
          </div>
        )}
        <p className="text-sm font-medium text-white">
          <strong className="mr-2">{banner.title}</strong>
          <span className="opacity-90 hidden sm:inline">{banner.message}</span>
        </p>
      </div>
      
      <div className="flex items-center gap-4">
        {banner.actionUrl && (
          <span className="text-sm font-bold text-white underline underline-offset-2 hover:opacity-80 transition-opacity whitespace-nowrap">
            Explore Now
          </span>
        )}
        <button 
          onClick={(e) => { e.preventDefault(); handleDismiss(); }} 
          className="text-white/80 hover:text-white transition-colors"
          aria-label="Dismiss banner"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 w-full z-50 relative overflow-hidden shadow-sm"
        >
          {banner.actionUrl ? (
            <Link href={banner.actionUrl} className="block py-3 hover:bg-black/5 transition-colors">
              {content}
            </Link>
          ) : (
            <div className="py-3">
              {content}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
