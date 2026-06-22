"use client";

import { useState } from "react";

interface AIDescriptionGeneratorProps {
  title: string;
  category: string;
  city?: string;
  size?: string;
  indoorOutdoor?: string;
  digitalPhysical?: string;
  onDescriptionGenerated: (description: string) => void;
}

export default function AIDescriptionGenerator({
  title,
  category,
  city,
  size,
  indoorOutdoor,
  digitalPhysical,
  onDescriptionGenerated
}: AIDescriptionGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!title || !category) {
      setError("Please provide a Title and select a Category first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/ai/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, category, city, size, indoorOutdoor, digitalPhysical }),
      });

      const data = await res.json();

      if (data.success) {
        onDescriptionGenerated(data.description);
      } else {
        setError(data.error || "Failed to generate description");
      }
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-4 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-sm font-semibold text-indigo-900 flex items-center gap-2">
            ✨ AI Description Assistant
          </h4>
          <p className="text-xs text-indigo-700 mt-1">
            Let AI write a professional, SEO-friendly description for your space.
          </p>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-sm shadow-indigo-200"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Auto-Generate
            </>
          )}
        </button>
      </div>
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}
