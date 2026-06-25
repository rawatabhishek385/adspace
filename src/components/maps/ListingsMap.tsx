"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon
if (typeof window !== "undefined") {
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
}

export interface MapListing {
  id: string;
  slug: string;
  title: string;
  price: number;
  pricePeriod: string;
  city: string;
  latitude: number;
  longitude: number;
  category: string;
  imageUrl?: string;
}

interface ListingsMapProps {
  listings: MapListing[];
}

function FitBounds({ listings }: { listings: MapListing[] }) {
  const map = useMap();
  useEffect(() => {
    if (listings.length === 0) return;
    const bounds = L.latLngBounds(
      listings.map((l) => [l.latitude, l.longitude] as [number, number])
    );
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
  }, [listings, map]);
  return null;
}

export default function ListingsMap({ listings }: ListingsMapProps) {
  const validListings = listings.filter(
    (l) => l.latitude !== 0 || l.longitude !== 0
  );

  if (validListings.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-16 text-center">
        <div className="text-4xl mb-4">🗺️</div>
        <h3 className="text-lg font-semibold text-white mb-2">No Map Data</h3>
        <p className="text-slate-400 text-sm">No listings with location data found.</p>
      </div>
    );
  }

  const center: [number, number] = [validListings[0].latitude, validListings[0].longitude];

  return (
    <div className="relative z-0 rounded-2xl overflow-hidden border border-white/10" style={{ height: 550 }}>
      <MapContainer
        center={center}
        zoom={5}
        className="w-full h-full"
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds listings={validListings} />
        {validListings.map((listing) => (
          <Marker key={listing.id} position={[listing.latitude, listing.longitude]}>
            <Popup>
              <div style={{ minWidth: 200, fontFamily: "system-ui" }}>
                {listing.imageUrl && (
                  <img
                    src={listing.imageUrl}
                    alt={listing.title}
                    style={{ width: "100%", height: 100, objectFit: "cover", borderRadius: 8, marginBottom: 8 }}
                  />
                )}
                <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600, color: "#1e293b" }}>
                  {listing.title}
                </h3>
                <p style={{ margin: "0 0 4px", fontSize: 13, color: "#3b82f6", fontWeight: 600 }}>
                  ₹{listing.price.toLocaleString("en-IN")} / {listing.pricePeriod}
                </p>
                <p style={{ margin: "0 0 8px", fontSize: 12, color: "#64748b" }}>
                  {listing.city} · {listing.category}
                </p>
                <a
                  href={`/listings/${listing.slug}`}
                  style={{
                    display: "block",
                    textAlign: "center",
                    padding: "6px 12px",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#fff",
                    backgroundColor: "#3b82f6",
                    borderRadius: 8,
                    textDecoration: "none",
                  }}
                >
                  View Details →
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
