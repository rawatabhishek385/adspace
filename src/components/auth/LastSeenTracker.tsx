"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

export default function LastSeenTracker() {
  const { data: session } = useSession();
  const pathname = usePathname();

  useEffect(() => {
    if (!session?.user?.id) return;

    const updateLastSeen = async () => {
      try {
        const lastUpdatedStr = localStorage.getItem("lastSeenAt");
        const now = Date.now();

        // Throttle updates to once every 15 minutes (900000 ms)
        if (lastUpdatedStr && now - parseInt(lastUpdatedStr, 10) < 900000) {
          return;
        }

        const res = await fetch("/api/user/last-seen", { method: "POST" });
        if (res.ok) {
          localStorage.setItem("lastSeenAt", now.toString());
        }
      } catch (error) {
        console.error("Failed to update last seen:", error);
      }
    };

    // Update on initial mount and route changes, throttled
    updateLastSeen();

    // Set an interval to update while they stay on the same page
    const interval = setInterval(() => {
      updateLastSeen();
    }, 60000); // Check every minute, but throttle handles the 15m limit

    return () => clearInterval(interval);
  }, [session, pathname]);

  return null;
}
