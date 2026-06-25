"use client";

import { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import SearchThisAreaButton from "./SearchThisAreaButton";

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

// Blue pulsing user marker
const userIcon = L.divIcon({
  html: `<div style="
    width: 18px;
    height: 18px;
    background: #3b82f6;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.25), 0 2px 8px rgba(0,0,0,0.3);
  "></div>`,
  className: "",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

interface NearbyListing {
  id: string;
  slug: string;
  title: string;
  price: number;
  pricePeriod: string;
  city: string;
  latitude: number;
  longitude: number;
  distance: number;
  distanceText: string;
  category: { name: string };
  media: { url: string; type: string }[];
}

interface NearbyMapViewProps {
  listings: NearbyListing[];
  userLat: number;
  userLng: number;
  radius: number;
  onSearchArea?: (lat: number, lng: number) => void;
}

function MapMoveHandler({ onMoved }: { onMoved: (center: L.LatLng) => void }) {
  const [hasMoved, setHasMoved] = useState(false);

  useMapEvents({
    moveend: (e) => {
      if (!hasMoved) {
        setHasMoved(true);
        return; // Skip the initial load move
      }
      onMoved(e.target.getCenter());
    },
  });

  return null;
}

function FitToUser({ lat, lng, radius }: { lat: number; lng: number; radius: number }) {
  const map = useMap();
  useEffect(() => {
    // Fit map to show the radius circle
    const latDelta = radius / 111;
    const bounds = L.latLngBounds(
      [lat - latDelta, lng - latDelta],
      [lat + latDelta, lng + latDelta]
    );
    map.fitBounds(bounds, { padding: [30, 30] });
  }, [lat, lng, radius, map]);
  return null;
}

export default function NearbyMapView({
  listings,
  userLat,
  userLng,
  radius,
  onSearchArea,
}: NearbyMapViewProps) {
  const [showSearchButton, setShowSearchButton] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [newCenter, setNewCenter] = useState<L.LatLng | null>(null);

  const handleMapMoved = useCallback((center: L.LatLng) => {
    setNewCenter(center);
    setShowSearchButton(true);
  }, []);

  const handleSearchArea = useCallback(() => {
    if (!newCenter || !onSearchArea) return;
    setSearchLoading(true);
    onSearchArea(newCenter.lat, newCenter.lng);
    setShowSearchButton(false);
    setTimeout(() => setSearchLoading(false), 500);
  }, [newCenter, onSearchArea]);

  return (
    <div className="relative z-0 rounded-2xl overflow-hidden border border-slate-200 shadow-lg" style={{ height: 500 }}>
      <SearchThisAreaButton
        visible={showSearchButton}
        onClick={handleSearchArea}
        loading={searchLoading}
      />
      <MapContainer
        center={[userLat, userLng]}
        zoom={11}
        className="w-full h-full"
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitToUser lat={userLat} lng={userLng} radius={radius} />
        <MapMoveHandler onMoved={handleMapMoved} />

        {/* User location marker */}
        <Marker position={[userLat, userLng]} icon={userIcon}>
          <Popup>
            <div style={{ fontFamily: "system-ui", textAlign: "center" }}>
              <strong style={{ color: "#3b82f6" }}>📍 Your Location</strong>
            </div>
          </Popup>
        </Marker>

        {/* Radius circle */}
        <Circle
          center={[userLat, userLng]}
          radius={radius * 1000}
          pathOptions={{
            color: "#3b82f6",
            fillColor: "#3b82f6",
            fillOpacity: 0.06,
            weight: 1.5,
            dashArray: "6 4",
          }}
        />

        {/* Listing markers */}
        {listings.map((listing) => (
          <Marker key={listing.id} position={[listing.latitude, listing.longitude]}>
            <Popup>
              <div style={{ minWidth: 220, fontFamily: "system-ui" }}>
                {listing.media?.[0]?.url && (
                  <img
                    src={listing.media[0].url}
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
                <p style={{ margin: "0 0 4px", fontSize: 12, color: "#64748b" }}>
                  {listing.city} · {listing.category.name}
                </p>
                <p style={{ margin: "0 0 8px", fontSize: 11, color: "#3b82f6", fontWeight: 500 }}>
                  📍 {listing.distanceText}
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
