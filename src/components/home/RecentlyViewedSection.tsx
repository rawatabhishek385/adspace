"use client";

import { useEffect, useState } from "react";
import { ListingCard } from "../listings/ListingCard";
import type { ListingWithRelations } from "@/types/listing.types";

export default function RecentlyViewedSection() {
  const [recentlyViewed, setRecentlyViewed] = useState<ListingWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentlyViewed = async () => {
      try {
        const res = await fetch("/api/recently-viewed");
        const data = await res.json();
        if (data.success && data.data) {
          // Extra safeguard: Deduplicate on the frontend based on ID
          const uniqueListings = Array.from(new Map(data.data.map((item: any) => [item.id, item])).values()) as ListingWithRelations[];
          setRecentlyViewed(uniqueListings);
        }
      } catch (error) {
        console.error("Failed to fetch recently viewed", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentlyViewed();
  }, []);

  if (loading || recentlyViewed.length === 0) {
    return null; // Don't show loading state on homepage to avoid jumping
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Continue Exploring</h2>
          <p className="mt-1 text-slate-500">Pick up right where you left off</p>
        </div>
      </div>
      <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-6 hide-scrollbar">
        {recentlyViewed.map((listing) => (
          <div key={listing.id} className="min-w-[85vw] sm:min-w-0 snap-center sm:snap-align-none">
            <ListingCard listing={listing} />
          </div>
        ))}
      </div>
    </section>
  );
}
