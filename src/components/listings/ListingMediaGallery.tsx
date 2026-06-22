"use client";

import { useState } from "react";
import Image from "next/image";

interface MediaItem {
  id: string;
  url: string;
  type: "IMAGE" | "VIDEO";
}

export default function ListingMediaGallery({ media }: { media: MediaItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!media || media.length === 0) {
    return (
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden h-80 flex items-center justify-center">
        <svg className="w-16 h-16 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  const activeMedia = media[activeIndex];

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden p-4 space-y-4">
      {/* Main Display Area */}
      <div className="relative w-full h-80 sm:h-96 md:h-[400px] bg-white rounded-xl overflow-hidden flex items-center justify-center">
        {activeMedia.type === "IMAGE" ? (
          <Image
            src={activeMedia.url}
            alt="Listing Media"
            fill
            className="object-contain"
            priority
          />
        ) : (
          <video
            src={activeMedia.url}
            controls
            autoPlay
            className="w-full h-full object-contain"
          />
        )}
      </div>

      {/* Thumbnails */}
      {media.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {media.map((item, index) => (
            <button
              key={item.id}
              onClick={() => setActiveIndex(index)}
              className={`relative shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                activeIndex === index
                  ? "border-blue-500 ring-2 ring-blue-500/30"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              {item.type === "IMAGE" ? (
                <Image
                  src={item.url}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-white flex items-center justify-center relative">
                  <video src={item.url} className="w-full h-full object-cover opacity-50" />
                  <svg className="absolute w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
