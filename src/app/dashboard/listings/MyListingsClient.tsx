"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ListingCard } from "@/components/listings/ListingCard";
import type { ListingWithRelations } from "@/types/listing.types";
import Link from "next/link";

interface MyListingsClientProps {
  initialListings: ListingWithRelations[];
}

export function MyListingsClient({ initialListings }: MyListingsClientProps) {
  const router = useRouter();
  const [listings, setListings] = useState(initialListings);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;

    try {
      const res = await fetch(`/api/listings/${id}`, { method: "DELETE" });
      if (res.ok) {
        setListings((prev) => prev.filter((l) => l.id !== id));
        router.refresh();
      }
    } catch {
      alert("Failed to delete listing");
    }
  };

  if (listings.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-16 text-center">
        <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No Listings Yet</h3>
        <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">Create your first advertising space listing to start connecting with advertisers.</p>
        <Link href="/dashboard/listings/create" className="inline-block px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors">
          Create Your First Listing
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} showActions onDelete={handleDelete} />
      ))}
    </div>
  );
}
