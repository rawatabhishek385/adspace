"use client";

import { motion } from "framer-motion";

interface RadiusFilterProps {
  selectedRadius: number;
  onChange: (radius: number) => void;
}

const RADIUS_OPTIONS = [5, 10, 25, 50, 100];

export default function RadiusFilter({ selectedRadius, onChange }: RadiusFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-slate-500 mr-1">Radius:</span>
      {RADIUS_OPTIONS.map((radius) => {
        const isSelected = radius === selectedRadius;
        return (
          <motion.button
            key={radius}
            onClick={() => onChange(radius)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`relative px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border ${
              isSelected
                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20"
                : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600"
            }`}
          >
            {radius} km
          </motion.button>
        );
      })}
    </div>
  );
}
