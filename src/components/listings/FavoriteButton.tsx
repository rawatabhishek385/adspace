"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface FavoriteButtonProps {
  listingId: string;
  initialIsFavorited?: boolean;
}

export function FavoriteButton({ listingId, initialIsFavorited = false }: FavoriteButtonProps) {
  const router = useRouter();
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [loading, setLoading] = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (loading) return;
    setLoading(true);
    
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      
      const data = await res.json();
      if (data.success) {
        setIsFavorited(data.isFavorited);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleToggle}
      disabled={loading}
      className={`p-2 rounded-full backdrop-blur-md transition-all ${
        isFavorited 
          ? "bg-red-500/20 text-red-500 hover:bg-red-500/30" 
          : "bg-black/40 text-white hover:bg-black/60"
      }`}
      title={isFavorited ? "Remove from saved" : "Save Listing"}
    >
      <svg className="w-5 h-5" fill={isFavorited ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isFavorited ? 0 : 2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    </button>
  );
}
