"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ListingCard } from "@/components/listings/ListingCard";
import type { ListingWithRelations } from "@/types/listing.types";
import { useSession } from "next-auth/react";

export default function RecommendedListingsSection() {
  const { data: session } = useSession();
  const [listings, setListings] = useState<ListingWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    const abortController = new AbortController();

    const fetchRecommendations = async () => {
      try {
        const res = await fetch("/api/recommendations", { signal: abortController.signal });
        const data = await res.json();
        if (data.success && !abortController.signal.aborted) {
          setListings(data.data);
          setIsFallback(data.isFallback);
        }
      } catch (error: any) {
        if (error.name === "AbortError") return;
        console.warn("Recommendations fetch aborted or failed");
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchRecommendations();

    return () => {
      abortController.abort();
    };
  }, [session]);

  // Don't render anything if not logged in or loading
  if (!session?.user?.id) return null;
  if (loading) {
    return (
      <section className="px-4 mb-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-6 h-0.5 bg-purple-500 rounded-full"></div>
            <h2 className="text-2xl font-bold text-slate-800"> Recommended For You</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl overflow-hidden animate-pulse">
                <div className="h-48 bg-slate-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (listings.length === 0) return null;

  return (
    <section className="px-4 mb-20">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-6 h-0.5 bg-purple-500 rounded-full"></div>
              <h2 className="text-2xl font-bold text-slate-800">
                {isFallback ? " Popular Right Now" : " Recommended For You"}
              </h2>
            </div>
            <p className="text-slate-500 ml-9">
              {isFallback
                ? "Trending advertising spaces across the platform"
                : "Discover spaces tailored to your recent activity"}
            </p>
          </div>
          <Link
            href="/listings"
            className="text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors flex items-center gap-1"
          >
            View all <span className="text-lg">→</span>
          </Link>
        </div>

        {/* Scrollable on Mobile, Grid on Desktop */}
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 hide-scrollbar">
          {listings.map((listing, index) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="min-w-[85vw] sm:min-w-0 snap-center sm:snap-align-none"
            >
              <ListingCard listing={listing} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
