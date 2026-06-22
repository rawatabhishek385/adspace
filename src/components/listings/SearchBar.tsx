"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { getCountries } from "@/lib/locationData";

interface SearchBarProps {
  defaultCountry?: string;
}

export default function SearchBar({ defaultCountry }: SearchBarProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [city, setCity] = useState(searchParams.get("city") || "");

  const initialCountryParam = searchParams.get("country");
  const countryList = getCountries();
  const matchedCountry = initialCountryParam 
    ? countryList.find((c) => c.toLowerCase() === initialCountryParam.toLowerCase())
    : null;

  const matchedDefault = defaultCountry 
    ? countryList.find((c) => c.toLowerCase() === defaultCountry.toLowerCase())
    : null;

  const [country, setCountry] = useState(matchedCountry || matchedDefault || "");
  const [lat, setLat] = useState(searchParams.get("lat") || "");
  const [lng, setLng] = useState(searchParams.get("lng") || "");
  const [radius, setRadius] = useState(searchParams.get("radius") || "50");
  const [nearMeLoading, setNearMeLoading] = useState(false);

  const handleSearch = (e?: FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());

    if (search.trim()) params.set("search", search.trim());
    else params.delete("search");

    if (city.trim()) params.set("city", city.trim());
    else params.delete("city");

    if (country.trim()) params.set("country", country.trim());
    else params.delete("country");

    if (lat && lng) {
      params.set("lat", lat);
      params.set("lng", lng);
      params.set("radius", radius);
    } else {
      params.delete("lat");
      params.delete("lng");
      params.delete("radius");
    }

    params.set("page", "1");

    fetch("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        actionType: "SEARCH", 
        city: city.trim() || undefined,
        searchTerm: search.trim() || undefined
      }),
    }).catch(console.error);

    router.push(`/listings?${params.toString()}`);
  };

  const handleNearMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setNearMeLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const latitude = position.coords.latitude.toString();
          const longitude = position.coords.longitude.toString();
          setLat(latitude);
          setLng(longitude);
          
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          
          let foundCity = data.address?.city || data.address?.town || data.address?.village || "";
          let foundCountry = data.address?.country || "";

          setCity(foundCity);
          setCountry(foundCountry);

          // Auto-trigger search
          const params = new URLSearchParams(searchParams.toString());
          if (search.trim()) params.set("search", search.trim());
          else params.delete("search");
          if (foundCity) params.set("city", foundCity);
          if (foundCountry) params.set("country", foundCountry);
          params.set("lat", latitude);
          params.set("lng", longitude);
          params.set("radius", radius);
          params.set("page", "1");
          
          router.push(`/listings?${params.toString()}`);
        } catch (error) {
          alert("Could not determine your city from location.");
        } finally {
          setNearMeLoading(false);
        }
      },
      (err) => {
        setNearMeLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          alert("Location access denied. Please enable location in your browser settings.");
        } else {
          alert("Could not get your location. Please try again.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="w-full space-y-4">
      <form
        onSubmit={handleSearch}
        className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex flex-col md:flex-row gap-4 w-full"
      >
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ad spaces..."
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-slate-800 placeholder-slate-400"
          />
        </div>

        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <input
            type="text"
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              // Clear exact lat/lng if manual city is typed so we don't accidentally enforce old coords
              if (lat || lng) { setLat(""); setLng(""); }
            }}
            placeholder="City"
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-slate-800 placeholder-slate-400"
          />
        </div>

        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <select
            value={country}
            onChange={(e) => {
              setCountry(e.target.value);
              if (lat || lng) { setLat(""); setLng(""); }
            }}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-slate-800 placeholder-slate-400 appearance-none"
          >
            <option value="">Any Country</option>
            {countryList.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Near Me Button */}
        <button
          type="button"
          onClick={handleNearMe}
          disabled={nearMeLoading}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-xl transition-all whitespace-nowrap shadow-md shadow-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {nearMeLoading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          )}
          {nearMeLoading ? "Locating..." : "Near Me"}
        </button>

        {/* Search Button */}
        <button
          type="submit"
          className="px-8 py-3 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-xl transition-colors whitespace-nowrap"
        >
          Search
        </button>
      </form>

      {/* Distance Filter (Only visible if lat/lng present) */}
      {lat && lng && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 px-4 py-3 rounded-xl animate-in fade-in slide-in-from-top-2">
          <svg className="w-5 h-5 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <span className="text-sm font-medium text-blue-800 shrink-0">Search Radius:</span>
          <select 
            value={radius} 
            onChange={(e) => {
              setRadius(e.target.value);
              // Trigger search immediately when distance changes
              setTimeout(() => handleSearch(), 0);
            }}
            className="bg-white border border-blue-200 text-blue-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block px-3 py-1.5 outline-none font-medium"
          >
            <option value="5">Within 5 km</option>
            <option value="10">Within 10 km</option>
            <option value="25">Within 25 km</option>
            <option value="50">Within 50 km</option>
            <option value="100">Within 100 km</option>
            <option value="500">Within 500 km</option>
            <option value="5000">Anywhere</option>
          </select>
          <button 
            type="button"
            onClick={() => {
              setLat(""); setLng("");
              setTimeout(() => handleSearch(), 0);
            }}
            className="ml-auto text-xs font-semibold text-slate-500 hover:text-red-500 transition-colors"
          >
            Clear Location Focus
          </button>
        </div>
      )}
    </div>
  );
}
