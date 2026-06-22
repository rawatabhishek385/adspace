import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ImageMessageProps {
  url: string;
  alt?: string;
  allImages?: string[]; // Array of all image URLs in the chat for swipe navigation
}

export default function ImageMessage({ url, alt = "Image message", allImages }: ImageMessageProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scale, setScale] = useState(1);
  
  // Find current index if allImages is provided
  const safeAllImages = allImages || [url];
  const initialIndex = safeAllImages.indexOf(url) !== -1 ? safeAllImages.indexOf(url) : 0;
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const currentUrl = safeAllImages[currentIndex];

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < safeAllImages.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setScale(1);
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setScale(1);
    }
  };

  const handleZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale(scale === 1 ? 2 : 1);
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(currentUrl);
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(objectUrl);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Failed to download image", err);
    }
  };

  return (
    <>
      <div 
        className="relative w-48 h-48 sm:w-64 sm:h-64 rounded-2xl overflow-hidden cursor-pointer shadow-sm group"
        onClick={() => {
          setCurrentIndex(initialIndex);
          setIsFullscreen(true);
        }}
      >
        <Image 
          src={url} 
          alt={alt} 
          fill 
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 192px, 256px"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
      </div>

      <AnimatePresence>
        {isFullscreen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md"
            onClick={() => setIsFullscreen(false)}
          >
            {/* Top Toolbar */}
            <div className="absolute top-4 right-4 flex items-center gap-4 z-[101]">
              <button 
                onClick={handleDownload}
                className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                title="Download"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
              <button 
                onClick={handleZoom}
                className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                title="Zoom"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </button>
              <button 
                className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                onClick={() => setIsFullscreen(false)}
              >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Navigation Arrows */}
            {currentIndex > 0 && (
              <button 
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-3 rounded-full hover:bg-white/10 transition-colors z-[101]"
              >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {currentIndex < safeAllImages.length - 1 && (
              <button 
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-3 rounded-full hover:bg-white/10 transition-colors z-[101]"
              >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* Main Image */}
            <motion.div 
              className="relative w-full max-w-5xl h-full flex items-center justify-center cursor-zoom-in"
              onClick={handleZoom}
              animate={{ scale }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <Image 
                src={currentUrl} 
                alt={alt} 
                fill
                className="object-contain"
                sizes="100vw"
                unoptimized
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
