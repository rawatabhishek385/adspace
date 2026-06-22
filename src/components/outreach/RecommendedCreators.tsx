"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function RecommendedCreators({ category, city }: { category?: string, city?: string }) {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecs = async () => {
      try {
        const query = new URLSearchParams();
        if (category) query.append("category", category);
        if (city) query.append("city", city);
        query.append("limit", "4");

        const res = await fetch(`/api/outreach/recommendations?${query.toString()}`);
        if (!res.ok) return;
        const data = await res.json();
        setRecommendations(data.recommendations);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecs();
  }, [category, city]);

  if (loading || recommendations.length === 0) return null;

  return (
    <div className="mt-12 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-800 mb-1">✨ Recommended Creators</h2>
      <p className="text-sm text-slate-500 mb-6">Based on your campaign requirements</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {recommendations.map(r => (
          <Link key={r.id} href={`/profile/${r.id}`} className="block border border-slate-100 rounded-xl p-4 hover:border-indigo-200 hover:shadow-md transition-all group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 shrink-0 relative border border-slate-200 group-hover:border-indigo-300 transition-colors">
                {r.avatar ? (
                  <Image src={r.avatar} alt={r.name} fill className="object-cover" />
                ) : (
                  <span className="w-full h-full flex items-center justify-center font-bold text-slate-400">{r.name[0]}</span>
                )}
                {r.isAvailable && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
                )}
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-slate-800 text-sm truncate group-hover:text-indigo-600 transition-colors">{r.name}</p>
                <p className="text-xs text-slate-500 truncate">{r.category || "Creator"}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1 text-amber-500 font-medium">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                {r.rating.toFixed(1)}
              </div>
              <div>{r.totalCampaigns} Collabs</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
