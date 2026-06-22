"use client";

import { useEffect, useState } from "react";
import { ListingCard } from "./ListingCard";
import type { ListingWithRelations } from "@/types/listing.types";

interface SimilarListingsSectionProps {
  listingId: string;
}

export default function SimilarListingsSection({ listingId }: SimilarListingsSectionProps) {
  const [similar, setSimilar] = useState<ListingWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSimilar = async () => {
      try {
        const res = await fetch(`/api/listings/similar/${listingId}`);
        const data = await res.json();
        if (data.success && data.data) {
          setSimilar(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch similar listings", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSimilar();
  }, [listingId]);

  if (loading) {
    return (
      <div className="mt-16 pt-16 border-t border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          ❤️ You may also like
        </h2>
        <div className="flex overflow-x-auto gap-6 pb-6 hide-scrollbar animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="min-w-[280px] h-[320px] bg-slate-200 rounded-2xl shrink-0"></div>
          ))}
        </div>
      </div>
    );
  }

  if (similar.length === 0) return null;

  return (
    <div className="mt-16 pt-16 border-t border-slate-200">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        ❤️ You may also like
      </h2>
      <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-6 hide-scrollbar">
        {similar.map((listing) => (
          <div key={listing.id} className="min-w-[85vw] sm:min-w-0 snap-center sm:snap-align-none">
            <ListingCard listing={listing} />
          </div>
        ))}
      </div>
    </div>
  );
}
