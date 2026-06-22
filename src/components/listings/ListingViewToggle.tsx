"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ListingCard } from "@/components/listings/ListingCard";
import type { MapListing } from "@/components/maps/ListingsMap";

const ListingsMap = dynamic(() => import("@/components/maps/ListingsMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[550px] rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500">
      Loading map...
    </div>
  ),
});

interface ListingViewToggleProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listings: any[];
  mapListings: MapListing[];
  children?: React.ReactNode; // pagination
}

export default function ListingViewToggle({ listings, mapListings, children }: ListingViewToggleProps) {
  const [view, setView] = useState<"list" | "map">("list");

  return (
    <div>
      {/* Toggle Buttons */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setView("list")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            view === "list"
              ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
              : "bg-slate-50 text-slate-500 border border-slate-200 hover:text-slate-800"
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          List View
        </button>
        <button
          onClick={() => setView("map")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            view === "map"
              ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
              : "bg-slate-50 text-slate-500 border border-slate-200 hover:text-slate-800"
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Map View
        </button>
        <span className="text-xs text-slate-500 ml-2">{listings.length} result{listings.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Content */}
      {view === "list" ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
          {children}
        </>
      ) : (
        <ListingsMap listings={mapListings} />
      )}
    </div>
  );
}
