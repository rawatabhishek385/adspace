"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

export default function FavoriteInfluencerButton({ influencerId, initialFavorited }: { influencerId: string, initialFavorited: boolean }) {
  const { data: session } = useSession();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  if (!session?.user) return null;

  const toggleFavorite = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/influencer/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ influencerId })
      });
      const data = await res.json();
      if (data.success) {
        setFavorited(data.favorited);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={toggleFavorite}
      disabled={loading}
      className={`p-2 rounded-full shadow-sm border transition-colors ${
        favorited 
          ? "bg-red-50 border-red-200 text-red-500" 
          : "bg-white border-slate-200 text-slate-400 hover:text-red-500 hover:bg-slate-50"
      }`}
      aria-label="Favorite Creator"
    >
      <svg className="w-5 h-5" fill={favorited ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    </button>
  );
}
