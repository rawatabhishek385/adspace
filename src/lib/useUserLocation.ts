"use client";

import { useState, useCallback, useEffect } from "react";

interface UserLocation {
  latitude: number;
  longitude: number;
}

interface UseUserLocationReturn {
  location: UserLocation | null;
  loading: boolean;
  error: string | null;
  requestLocation: () => void;
  hasPermission: boolean;
}

/**
 * Hook to get the user's current geolocation.
 * Caches the position in state to avoid repeated prompts.
 */
export function useUserLocation(): UseUserLocationReturn {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  // Check if we have a cached location in sessionStorage
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem("user_location");
      if (cached) {
        const parsed = JSON.parse(cached) as UserLocation;
        setLocation(parsed);
        setHasPermission(true);
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc: UserLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setLocation(loc);
        setLoading(false);
        setHasPermission(true);

        // Cache in sessionStorage
        try {
          sessionStorage.setItem("user_location", JSON.stringify(loc));
        } catch {
          // Ignore storage errors
        }
      },
      (err) => {
        setLoading(false);
        setHasPermission(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("Location access denied. Please enable location in your browser settings.");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("Location information is unavailable.");
            break;
          case err.TIMEOUT:
            setError("Location request timed out. Please try again.");
            break;
          default:
            setError("An unknown error occurred while getting location.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  }, []);

  return { location, loading, error, requestLocation, hasPermission };
}
