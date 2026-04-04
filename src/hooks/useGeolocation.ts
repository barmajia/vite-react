import { useState, useEffect, useCallback } from "react";

export interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface GeolocationError {
  code: number;
  message: string;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watchPosition?: boolean;
}

interface UseGeolocationReturn {
  position: GeolocationPosition | null;
  loading: boolean;
  error: GeolocationError | null;
  getLocation: () => void;
  clearError: () => void;
  isSupported: boolean;
}

export const useGeolocation = (
  options: UseGeolocationOptions = {},
): UseGeolocationReturn => {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 60000, // 1 minute cache
    watchPosition = false,
  } = options;

  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<GeolocationError | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

  const isSupported =
    typeof navigator !== "undefined" && "geolocation" in navigator;

  const getLocation = useCallback(() => {
    if (!isSupported) {
      setError({
        code: 0,
        message: "Geolocation is not supported by your browser",
      });
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        });
        setLoading(false);
      },
      (err) => {
        let message = "Unable to get your location";

        switch (err.code) {
          case err.PERMISSION_DENIED:
            message =
              "Location permission denied. Please enable location access in your browser settings.";
            break;
          case err.POSITION_UNAVAILABLE:
            message = "Location information unavailable.";
            break;
          case err.TIMEOUT:
            message = "Location request timed out.";
            break;
        }

        setError({
          code: err.code,
          message,
        });
        setLoading(false);
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      },
    );
  }, [isSupported, enableHighAccuracy, timeout, maximumAge]);

  // Watch position for real-time updates
  useEffect(() => {
    if (watchPosition && isSupported) {
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          setPosition({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp,
          });
          setLoading(false);
        },
        (err) => {
          let message = "Unable to get your location";

          switch (err.code) {
            case err.PERMISSION_DENIED:
              message = "Location permission denied.";
              break;
            case err.POSITION_UNAVAILABLE:
              message = "Location information unavailable.";
              break;
            case err.TIMEOUT:
              message = "Location request timed out.";
              break;
          }

          setError({
            code: err.code,
            message,
          });
          setLoading(false);
        },
        {
          enableHighAccuracy,
          timeout,
          maximumAge,
        },
      );
      setWatchId(id);
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchPosition, isSupported, enableHighAccuracy, timeout, maximumAge]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    position,
    loading,
    error,
    getLocation,
    clearError,
    isSupported,
  };
};
