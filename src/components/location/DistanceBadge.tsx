"use client";

interface DistanceBadgeProps {
  distance: number;
  distanceText: string;
  className?: string;
}

export default function DistanceBadge({ distanceText, className = "" }: DistanceBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 bg-white/90 backdrop-blur-md text-xs font-semibold text-blue-600 rounded-full shadow-sm border border-blue-100/50 ${className}`}
    >
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
          clipRule="evenodd"
        />
      </svg>
      {distanceText}
    </span>
  );
}
