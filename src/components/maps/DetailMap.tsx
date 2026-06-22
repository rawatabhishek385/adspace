"use client";

import dynamic from "next/dynamic";

const StaticMapPreview = dynamic(() => import("@/components/maps/StaticMapPreview"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center rounded-xl border border-slate-200">
      Loading map...
    </div>
  ),
});

interface DetailMapProps {
  latitude: number;
  longitude: number;
  height?: number;
}

export default function DetailMap({ latitude, longitude, height = 280 }: DetailMapProps) {
  return <StaticMapPreview latitude={latitude} longitude={longitude} height={height} />;
}
