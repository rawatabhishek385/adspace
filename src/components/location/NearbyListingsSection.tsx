"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useUserLocation } from "@/lib/useUserLocation";
import NearMeButton from "./NearMeButton";
import RadiusFilter from "./RadiusFilter";
import DistanceBadge from "./DistanceBadge";
import { FavoriteButton } from "@/components/listings/FavoriteButton";
import InfluencerCard from "@/app/outreach/browse/InfluencerCard";

const NearbyMapView = dynamic(() => import("./NearbyMapView"), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
      Loading map...
    </div>
  ),
});

interface NearbyListing {
  id: string;
  slug: string;
  title: string;
  price: number;
  pricePeriod: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  distance: number;
  distanceText: string;
  averageRating: number;
  totalRatings: number;
  isFeatured: boolean;
  category: { id: string; name: string };
  media: { id: string; url: string; type: string }[];
  owner: { id: string; name: string };
  _count?: { favorites: number };
}

export default function NearbyListingsSection() {
  const { location, loading: locationLoading, error: locationError, requestLocation } = useUserLocation();
  const [listings, setListings] = useState<NearbyListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [radius, setRadius] = useState(25);
  const [showMap, setShowMap] = useState(false);
  const [searchCenter, setSearchCenter] = useState<{ lat: number; lng: number } | null>(null);

  // Influencers state
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [influencersLoading, setInfluencersLoading] = useState(false);
  const [userCity, setUserCity] = useState("");
  const [userCountry, setUserCountry] = useState("");

  const fetchNearby = useCallback(async (lat: number, lng: number, rad: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/listings/nearby?lat=${lat}&lng=${lng}&radius=${rad}&limit=12`);
      const data = await res.json();
      if (data.success) {
        setListings(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch nearby listings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchNearbyInfluencers = useCallback(async (city: string, country: string) => {
    setInfluencersLoading(true);
    try {
      const params = new URLSearchParams();
      if (city) params.append("city", city);
      if (country) params.append("country", country);
      const res = await fetch(`/api/influencers/nearby?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setInfluencers(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch nearby influencers:", err);
    } finally {
      setInfluencersLoading(false);
    }
  }, []);

  // Fetch when location changes or radius changes
  useEffect(() => {
    const center = searchCenter || (location ? { lat: location.latitude, lng: location.longitude } : null);
    if (center) {
      fetchNearby(center.lat, center.lng, radius);
      
      // Reverse geocode if we don't have city/country yet
      if (!userCity && !userCountry && !searchCenter) {
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${center.lat}&lon=${center.lng}`)
          .then(r => r.json())
          .then(data => {
            const city = data.address?.city || data.address?.town || data.address?.village || "";
            const country = data.address?.country || "";
            setUserCity(city);
            setUserCountry(country);
            fetchNearbyInfluencers(city, country);
          })
          .catch(e => console.error("Geocoding failed", e));
      } else if (userCity || userCountry) {
        // If we already have city/country, fetch influencers
        fetchNearbyInfluencers(userCity, userCountry);
      }
    }
  }, [location, radius, searchCenter, fetchNearby, fetchNearbyInfluencers, userCity, userCountry]);

  const handleSearchArea = useCallback((lat: number, lng: number) => {
    setSearchCenter({ lat, lng });
  }, []);

  const activeLat = searchCenter?.lat ?? location?.latitude ?? 0;
  const activeLng = searchCenter?.lng ?? location?.longitude ?? 0;

  // If no location yet, show a prompt section
  if (!location && !locationLoading) {
    return (
      <section id="nearby" className="px-4 mb-20 scroll-mt-32">
        <div className="max-w-7xl mx-auto">
          <div className="relative bg-gradient-to-br from-blue-50 via-white to-blue-50 border border-blue-100 rounded-3xl p-12 text-center overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl" />
            <div className="relative">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-3">Discover Spaces Near You</h2>
              <p className="text-slate-500 mb-8 max-w-md mx-auto">
                Share your location to find advertising spaces closest to you. We'll show you the best options within your preferred radius.
              </p>
              <NearMeButton onClick={requestLocation} loading={locationLoading} />
              {locationError && (
                <p className="mt-4 text-sm text-red-500">{locationError}</p>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Loading state while getting location
  if (locationLoading) {
    return (
      <section id="nearby" className="px-4 mb-20 scroll-mt-32">
        <div className="max-w-7xl mx-auto text-center py-16">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">Getting your location...</p>
        </div>
      </section>
    );
  }

  return (
    <section id="nearby" className="px-4 mb-20 scroll-mt-32">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-6 h-0.5 bg-blue-500 rounded-full"></div>
              <h2 className="text-2xl font-bold text-slate-800">Nearby Advertising Spaces </h2>
            </div>
            <p className="text-slate-500 ml-9">Find spaces around your current location</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMap(!showMap)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                showMap
                  ? "bg-blue-50 text-blue-600 border-blue-200"
                  : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              {showMap ? "Hide Map" : "Show Map"}
            </button>
          </div>
        </div>

        {/* Radius Filter */}
        <div className="mb-6">
          <RadiusFilter selectedRadius={radius} onChange={setRadius} />
        </div>

        {/* Map View */}
        <AnimatePresence>
          {showMap && location && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-8 overflow-hidden"
            >
              <NearbyMapView
                listings={listings}
                userLat={activeLat}
                userLng={activeLng}
                radius={radius}
                onSearchArea={handleSearchArea}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading state */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl overflow-hidden animate-pulse">
                <div className="h-48 bg-slate-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                  <div className="h-3 bg-slate-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Listings Grid */}
        {!loading && listings.length > 0 && (
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-6 hide-scrollbar">
            {listings.map((listing, index) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="min-w-[85vw] sm:min-w-0 snap-center sm:snap-align-none group relative bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-blue-300 hover:scale-[1.02] transition-all duration-300"
              >
                {/* Image */}
                <Link href={`/listings/${listing.slug}`}>
                  <div className="relative h-48 bg-slate-100 overflow-hidden">
                    {listing.media?.[0]?.url ? (
                      <img
                        src={listing.media[0].url}
                        alt={listing.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}

                    {/* Distance Badge */}
                    <div className="absolute top-3 left-3 z-10">
                      <DistanceBadge distance={listing.distance} distanceText={listing.distanceText} />
                    </div>

                    {/* Category Badge */}
                    <span className="absolute bottom-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-sm text-xs font-medium text-blue-400 rounded-full">
                      {listing.category.name}
                    </span>

                    {/* Featured Badge */}
                    {listing.isFeatured && (
                      <span className="absolute top-3 right-3 px-2.5 py-1 bg-amber-500/90 text-xs font-medium text-white rounded-full z-10">
                        ⭐ Featured
                      </span>
                    )}
                  </div>
                </Link>

                {/* Favorite Button */}
                <div className={`absolute top-3 right-3 z-20 ${listing.isFeatured ? "mt-8" : ""}`}>
                  <FavoriteButton listingId={listing.id} initialIsFavorited={false} />
                </div>

                {/* Content */}
                <div className="p-4">
                  <Link href={`/listings/${listing.slug}`}>
                    <h3 className="text-slate-800 font-semibold truncate hover:text-blue-500 transition-colors">
                      {listing.title}
                    </h3>
                  </Link>

                  <div className="flex items-center gap-1.5 mt-1.5">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-3.5 h-3.5 ${star <= Math.round(listing.averageRating || 0) ? "text-amber-400" : "text-slate-300"}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-xs text-slate-500">
                      {listing.totalRatings > 0 ? `(${listing.totalRatings})` : "(No reviews)"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 mt-1.5 text-sm text-slate-500">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate">{listing.city}, {listing.country}</span>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                    <div>
                      <span className="text-lg font-bold text-blue-500">₹{listing.price.toLocaleString("en-IN")}</span>
                      <span className="text-xs text-slate-500 ml-1">/ {listing.pricePeriod}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Nearby Influencers Row */}
        {!influencersLoading && influencers.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-6 h-0.5 bg-purple-500 rounded-full"></div>
              <h2 className="text-2xl font-bold text-slate-800">Nearby Influencers & Companies</h2>
            </div>
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-6 hide-scrollbar">
              {influencers.map((influencer, index) => (
                <motion.div
                  key={influencer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="min-w-[85vw] sm:min-w-0 snap-center sm:snap-align-none"
                >
                  <InfluencerCard profile={influencer} />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* No results */}
        {!loading && listings.length === 0 && location && (
          <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No spaces found nearby</h3>
            <p className="text-sm text-slate-500 mb-6">Try increasing the radius or explore all listings.</p>
            <Link
              href="/listings"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium text-sm rounded-xl transition-colors"
            >
              Browse All Listings
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
