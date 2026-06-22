"use client";

import { useEffect } from "react";

interface ListingViewTrackerProps {
  listingId: string;
}

export default function ListingViewTracker({ listingId }: ListingViewTrackerProps) {
  useEffect(() => {
    const trackView = async () => {
      try {
        const storageKey = `listing-view-${listingId}`;
        const lastViewed = localStorage.getItem(storageKey);
        const now = Date.now();

        // If viewed within the last 24 hours (86400000 ms), do not increment
        if (lastViewed && now - parseInt(lastViewed, 10) < 86400000) {
          return;
        }

        // Increment the view
        await fetch(`/api/listings/${listingId}/view`, { method: "POST" });

        // Record the view timestamp
        localStorage.setItem(storageKey, now.toString());
      } catch (error) {
        console.error("Failed to track listing view:", error);
      }
    };

    trackView();
  }, [listingId]);

  return null; // This component doesn't render anything visually
}
