"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    
    try {
      // Pass the natural language query to the smart search API
      const res = await fetch("/api/search/smart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      
      const data = await res.json();
      
      if (data.success && data.extractedParams) {
        // Construct standard search URL with extracted parameters
        const params = new URLSearchParams();
        if (data.extractedParams.city) params.set("city", data.extractedParams.city);
        if (data.extractedParams.categoryName) params.set("category", data.extractedParams.categoryName);
        if (data.extractedParams.budget) params.set("maxPrice", data.extractedParams.budget.toString());
        if (data.extractedParams.keywords) params.set("q", data.extractedParams.keywords);
        
        router.push(`/listings?${params.toString()}`);
      } else {
        // Fallback to basic text search if AI fails
        router.push(`/listings?q=${encodeURIComponent(query)}`);
      }
    } catch (error) {
      console.error("Search error:", error);
      router.push(`/listings?q=${encodeURIComponent(query)}`);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full max-w-2xl mx-auto">
      <div className="relative flex items-center">
       
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search using city, category or natural language"
          className="w-full pl-10 sm:pl-12 pr-14 sm:pr-32 py-3 sm:py-4 bg-white border border-slate-200 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 placeholder:text-slate-400 text-sm sm:text-base transition-shadow"
          disabled={isSearching}
        />
        <button
          type="submit"
          disabled={isSearching || !query.trim()}
          className="absolute right-1.5 sm:right-2 p-2 sm:px-6 sm:py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-full disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {isSearching ? (
            <div className="w-5 h-5 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span className="hidden sm:inline">Search</span>
              <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
