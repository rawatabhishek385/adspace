"use client";

import Link from "next/link";
import React from "react";

interface CategoryData {
  id: string;
  name: string;
  imageUrl: string | null;
  _count: { listings: number };
}

interface CategoryMarqueeProps {
  categories: CategoryData[];
}

function getCategoryIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("digital") || lower.includes("signage")) {
    return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
  }
  if (lower.includes("led") || lower.includes("display") || lower.includes("screen")) {
    return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
  }
  if (lower.includes("billboard")) {
    return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
  }
  if (lower.includes("wall") || lower.includes("building") || lower.includes("residential")) {
    return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
  }
  if (lower.includes("mall") || lower.includes("commercial")) {
    return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>;
  }
  if (lower.includes("transit") || lower.includes("bus") || lower.includes("transport")) {
    return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>;
  }
  if (lower.includes("cinema") || lower.includes("movie") || lower.includes("theater")) {
    return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" /></svg>;
  }
  if (lower.includes("outdoor")) {
    return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
  }
  return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}

const fallbackImages = [
  "https://images.unsplash.com/photo-1542204165-65bf26472b9b?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1559291001-693fb9faa084?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1519999482648-25049ddd37b1?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1494522855154-9297ac14b55f?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&q=80&w=800",
];

function CategoryCard({ cat, idx }: { cat: CategoryData; idx: number }) {
  const bgImage = cat.imageUrl || fallbackImages[idx % fallbackImages.length];

  return (
    <Link
      href={`/listings?categoryId=${cat.id}`}
      className="relative w-[340px] h-[240px] sm:w-[460px] sm:h-[300px] shrink-0 group rounded-[2rem] overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border border-slate-200/50"
    >
      <img
        src={bgImage}
        alt={cat.name}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
      />
      
      {/* Glassy dark gradient starting from middle */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent top-[30%]"></div>

      <div className="absolute bottom-0 left-0 p-6 w-full flex flex-col sm:flex-row sm:items-end justify-between z-10 gap-4">
        <div>
          <h3 className="text-white font-bold text-2xl tracking-tight mb-3 drop-shadow-md line-clamp-1">
            {cat.name}
          </h3>
          
          <div className="flex items-center gap-2">
             <div className="px-3.5 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-white text-[13px] font-medium border border-white/10 flex items-center gap-1.5">
               <span className="text-white opacity-90">★</span> 4.9
             </div>
             <div className="px-3.5 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-white text-[13px] font-medium border border-white/10 whitespace-nowrap">
               {cat._count.listings}+ Spaces
             </div>
          </div>
        </div>
        
        <div className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-900/80 to-blue-700/80 hover:from-blue-800/90 hover:to-blue-600/90 backdrop-blur-md border border-white/20 text-white text-center font-bold text-sm rounded-full transition-all active:scale-95 shadow-lg whitespace-nowrap shrink-0">
          Browse now
        </div>
      </div>
    </Link>
  );
}

export default function CategoryMarquee({ categories }: CategoryMarqueeProps) {
  if (categories.length === 0) return null;

  // Duplicate items enough to fill the screen and create seamless loop
  const items = [...categories, ...categories];

  return (
    <div className="relative w-full overflow-hidden">
      {/* Left fade */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none" />
      {/* Right fade */}
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none" />

      <div
        className="flex gap-5 py-2 animate-marquee hover:[animation-play-state:paused]"
        style={{
          width: "max-content",
        }}
      >
        {items.map((cat, idx) => (
          <CategoryCard key={`${cat.id}-${idx}`} cat={cat} idx={idx % categories.length} />
        ))}
      </div>
    </div>
  );
}
