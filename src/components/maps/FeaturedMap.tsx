"use client";

import dynamic from "next/dynamic";
import type { MapListing } from "@/components/maps/ListingsMap";

const ListingsMap = dynamic(() => import("@/components/maps/ListingsMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500">
      Loading map...
    </div>
  ),
});

interface FeaturedMapProps {
  listings: MapListing[];
}

export default function FeaturedMap({ listings }: FeaturedMapProps) {
  return <ListingsMap listings={listings} />;
}
