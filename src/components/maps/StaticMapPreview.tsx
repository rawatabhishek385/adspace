"use client";

import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

interface StaticMapPreviewProps {
  latitude: number;
  longitude: number;
  height?: number;
  zoom?: number;
  className?: string;
}

export default function StaticMapPreview({
  latitude,
  longitude,
  height = 250,
  zoom = 14,
  className = "",
}: StaticMapPreviewProps) {
  if (latitude === 0 && longitude === 0) {
    return (
      <div className={`w-full bg-slate-100 flex flex-col items-center justify-center overflow-hidden border border-slate-200 rounded-lg ${className}`} style={{ height }}>
        📍 No location data
      </div>
    );
  }

  return (
    <div className="relative z-0 rounded-xl overflow-hidden border border-white/10" style={{ height }}>
      <MapContainer
        center={[latitude, longitude]}
        zoom={zoom}
        scrollWheelZoom={false}
        dragging={false}
        zoomControl={false}
        className="w-full h-full"
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[latitude, longitude]} />
      </MapContainer>
    </div>
  );
}
