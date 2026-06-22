"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useUserLocation } from "@/lib/useUserLocation";
import DistanceBadge from "./DistanceBadge";
import { FavoriteButton } from "@/components/listings/FavoriteButton";

interface TrendingListing {
  id: string;
  slug: string;
  title: string;
  price: number;
  pricePeriod: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  distance: number;
  distanceText: string;
  averageRating: number;
  totalRatings: number;
  viewCount: number;
  isFeatured: boolean;
  category: { id: string; name: string };
  media: { id: string; url: string; type: string }[];
  _count?: { favorites: number };
}

export default function TrendingNearYou() {
  const { location } = useUserLocation();
  const [listings, setListings] = useState<TrendingListing[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTrending = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/listings/nearby?lat=${lat}&lng=${lng}&radius=50&sort=trending&limit=8`);
      const data = await res.json();
      if (data.success) {
        setListings(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch trending listings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (location) {
      fetchTrending(location.latitude, location.longitude);
    }
  }, [location, fetchTrending]);

  // Don't render if no location or no results
  if (!location) return null;
  if (!loading && listings.length === 0) return null;

  return (
    <section className="px-4 mb-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-6 h-0.5 bg-amber-500 rounded-full"></div>
              <h2 className="text-2xl font-bold text-slate-800">🔥 Trending Near You</h2>
            </div>
            <p className="text-slate-500 ml-9">Most viewed advertising spaces in your area</p>
          </div>
          <Link
            href="/listings"
            className="text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors flex items-center gap-1"
          >
            View all <span className="text-lg">→</span>
          </Link>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="min-w-[300px] sm:min-w-[280px] bg-white border border-slate-200 rounded-2xl overflow-hidden animate-pulse">
                <div className="h-44 bg-slate-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Horizontally Scrollable Cards */}
        {!loading && listings.length > 0 && (
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
            {listings.map((listing, index) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.06 }}
                className="min-w-[300px] sm:min-w-[280px] flex-shrink-0 snap-center group relative bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-blue-300 hover:scale-[1.02] transition-all duration-300"
              >
                {/* Image */}
                <Link href={`/listings/${listing.slug}`}>
                  <div className="relative h-44 bg-slate-100 overflow-hidden">
                    {listing.media?.[0]?.url ? (
                      <img
                        src={listing.media[0].url}
                        alt={listing.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100">
                        <svg className="w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}

                    {/* Distance Badge */}
                    <div className="absolute top-3 left-3 z-10">
                      <DistanceBadge distance={listing.distance} distanceText={listing.distanceText} />
                    </div>

                    {/* Views Badge */}
                    <div className="absolute bottom-3 right-3 z-10">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur-sm text-xs font-medium text-white rounded-full">
                        👁️ {listing.viewCount} views
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Favorite Button */}
                <div className="absolute top-3 right-3 z-20">
                  <FavoriteButton listingId={listing.id} initialIsFavorited={false} />
                </div>

                {/* Content */}
                <div className="p-4">
                  <Link href={`/listings/${listing.slug}`}>
                    <h3 className="text-slate-800 font-semibold truncate hover:text-blue-500 transition-colors">
                      {listing.title}
                    </h3>
                  </Link>

                  <div className="flex items-center gap-1 mt-1.5 text-sm text-slate-500">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate">{listing.city}, {listing.country}</span>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                    <div>
                      <span className="text-lg font-bold text-blue-500">₹{listing.price.toLocaleString("en-IN")}</span>
                      <span className="text-xs text-slate-500 ml-1">/ {listing.pricePeriod}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-slate-100 text-[11px] font-medium text-slate-500 rounded-full">
                      {listing.category.name}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
