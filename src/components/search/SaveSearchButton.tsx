"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function SaveSearchButton() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const city = searchParams.get("city") || "";
  const categoryId = searchParams.get("category") || "";
  const query = searchParams.get("q") || "";

  // Don't show button if there are no search filters applied
  if (!city && !categoryId && !query) return null;

  const handleSave = async () => {
    if (!session?.user) {
      alert("Please login to save searches");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/search/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query || "Custom Search",
          city: city || null,
          categoryId: categoryId || null
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSaved(true);
      } else {
        alert(data.error || "Failed to save search");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSave}
      disabled={saved || loading}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
        saved 
          ? 'bg-amber-50 text-amber-600 border border-amber-200 cursor-default' 
          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm'
      }`}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      ) : saved ? (
        <>
          <span>⭐</span>
          Saved
        </>
      ) : (
        <>
          <span className="grayscale opacity-50">⭐</span>
          Save Search Alert
        </>
      )}
    </button>
  );
}
