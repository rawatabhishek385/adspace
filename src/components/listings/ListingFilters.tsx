"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

interface Category {
  id: string;
  name: string;
}

interface ListingFiltersProps {
  categories: Category[];
  countries: string[];
  defaultCountry?: string;
}

export default function ListingFilters({ categories, countries, defaultCountry }: ListingFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialCountryParam = searchParams.get("country");
  const matchedCountry = initialCountryParam 
    ? countries.find((c) => c.toLowerCase() === initialCountryParam.toLowerCase())
    : null;

  const matchedDefault = defaultCountry 
    ? countries.find((c) => c.toLowerCase() === defaultCountry.toLowerCase())
    : null;
    
  const [country, setCountry] = useState(matchedCountry || matchedDefault || "");
  const [categoryId, setCategoryId] = useState(searchParams.get("categoryId") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  const [favoritesOnly, setFavoritesOnly] = useState(searchParams.get("favoritesOnly") === "true");

  const applyFilters = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());

    if (country) params.set("country", country);
    else params.delete("country");

    if (categoryId) params.set("categoryId", categoryId);
    else params.delete("categoryId");

    if (minPrice) params.set("minPrice", minPrice);
    else params.delete("minPrice");

    if (maxPrice) params.set("maxPrice", maxPrice);
    else params.delete("maxPrice");

    if (sort) params.set("sort", sort);
    else params.delete("sort");

    if (favoritesOnly) params.set("favoritesOnly", "true");
    else params.delete("favoritesOnly");

    params.set("page", "1");

    router.push(`/listings?${params.toString()}`);
  };

  const clearFilters = () => {
    setCountry("");
    setCategoryId("");
    setMinPrice("");
    setMaxPrice("");
    setSort("newest");
    setFavoritesOnly(false);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("country");
    params.delete("categoryId");
    params.delete("minPrice");
    params.delete("maxPrice");
    params.delete("sort");
    params.delete("favoritesOnly");
    params.set("page", "1");
    router.push(`/listings?${params.toString()}`);
  };

  return (
    <form onSubmit={applyFilters} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Filters</h3>
        <button
          type="button"
          onClick={clearFilters}
          className="text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          Clear all
        </button>
      </div>

      {/* Country Filter */}
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-2">Country / Region</label>
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all [&>option]:bg-white"
        >
          <option value="">All Countries</option>
          {countries.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Category Filter */}
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-2">Category</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all [&>option]:bg-white"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-2">Price Range</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all placeholder-slate-400"
          />
          <span className="text-slate-500">-</span>
          <input
            type="number"
            min="0"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all placeholder-slate-400"
          />
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-2">Sort By</label>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all [&>option]:bg-white"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="rating">Highest Rated</option>
          <option value="views">Most Viewed</option>
        </select>
      </div>

      {/* Favorites Filter */}
      <div className="flex items-center gap-3">
        <div className="flex items-center h-5">
          <input
            id="favoritesOnly"
            type="checkbox"
            checked={favoritesOnly}
            onChange={(e) => setFavoritesOnly(e.target.checked)}
            className="w-4 h-4 text-blue-500 bg-slate-50 border-slate-300 rounded focus:ring-blue-500 focus:ring-2"
          />
        </div>
        <label htmlFor="favoritesOnly" className="text-sm font-medium text-slate-600 cursor-pointer select-none">
          Show my favorites only
        </label>
      </div>

      <button
        type="submit"
        className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors"
      >
        Apply Filters
      </button>
    </form>
  );
}
