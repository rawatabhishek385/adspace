"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

interface Category {
  id: string;
  name: string;
}

interface HeroSearchBarProps {
  categories: Category[];
}

export default function HeroSearchBar({ categories }: HeroSearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [categoryId, setCategoryId] = useState(searchParams.get("categoryId") || "");
  // We can use minPrice and maxPrice based on price range dropdown if we wanted, 
  // but for simplicity, let's keep it as a generic "price" visual for now, or implement basic range mapping.
  const [priceRange, setPriceRange] = useState("");

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());

    if (search.trim()) params.set("search", search.trim());
    else params.delete("search");

    if (city.trim()) params.set("city", city.trim());
    else params.delete("city");

    if (categoryId) params.set("categoryId", categoryId);
    else params.delete("categoryId");

    if (priceRange) {
      const [min, max] = priceRange.split("-");
      if (min) params.set("minPrice", min);
      if (max) params.set("maxPrice", max);
    } else {
      params.delete("minPrice");
      params.delete("maxPrice");
    }

    params.set("page", "1");
    router.push(`/listings?${params.toString()}`);
  };

  const trendingTags = ["LED Screens", "Billboards", "Mall Advertising", "Transit Ads", "Wall Paintings", "Hoardings"];

  return (
    <div className="w-full relative z-20 mt-8">
      <form
        onSubmit={handleSearch}
        className="bg-white border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-3 flex flex-col lg:flex-row items-center gap-3 w-full"
      >
        {/* Search Input */}
        <div className="flex-1 w-full relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ad spaces..."
            className="w-full pl-11 pr-4 py-3 bg-transparent text-sm focus:outline-none text-slate-800 placeholder-slate-400"
          />
        </div>

        <div className="hidden lg:block w-px h-8 bg-slate-200"></div>

        {/* City Input */}
        <div className="flex-1 w-full relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City / Location"
            className="w-full pl-11 pr-4 py-3 bg-transparent text-sm focus:outline-none text-slate-800 placeholder-slate-400"
          />
        </div>

        <div className="hidden lg:block w-px h-8 bg-slate-200"></div>

        {/* Categories Select */}
        <div className="flex-1 w-full relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </div>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full pl-11 pr-8 py-3 bg-transparent text-sm focus:outline-none text-slate-800 appearance-none cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <div className="hidden lg:block w-px h-8 bg-slate-200"></div>

        {/* Price Range Select */}
        <div className="flex-1 w-full relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className="text-slate-400 font-medium">₹</span>
          </div>
          <select
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
            className="w-full pl-9 pr-8 py-3 bg-transparent text-sm focus:outline-none text-slate-800 appearance-none cursor-pointer"
          >
            <option value="">Price Range</option>
            <option value="0-5000">Under ₹5,000</option>
            <option value="5000-20000">₹5,000 - ₹20,000</option>
            <option value="20000-50000">₹20,000 - ₹50,000</option>
            <option value="50000-">Above ₹50,000</option>
          </select>
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Search Button */}
        <button
          type="submit"
          className="w-full lg:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors whitespace-nowrap shadow-md shadow-blue-500/20"
        >
          Search
        </button>
      </form>

      {/* Trending Tags */}
      <div className="mt-4 flex flex-wrap items-center gap-3 px-2">
        <span className="text-sm font-medium text-blue-600">Trending:</span>
        <div className="flex flex-wrap gap-2">
          {trendingTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                setSearch(tag);
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-lg transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
