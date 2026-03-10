import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useGeolocation } from './useGeolocation';

interface UseProfileLocationReturn {
  latitude: number | null;
  longitude: number | null;
  loading: boolean;
  updating: boolean;
  error: string | null;
  detectLocation: () => Promise<void>;
  updateLocation: (lat: number, lng: number) => Promise<void>;
  clearLocation: () => Promise<void>;
  isSupported: boolean;
}

export const useProfileLocation = (): UseProfileLocationReturn => {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    position,
    loading,
    error: geoError,
    getLocation,
    clearError: clearGeoError,
    isSupported,
  } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 15000,
  });

  // Load user's current location from profile on mount
  const loadUserLocation = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('users')
        .select('latitude, longitude')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setLatitude(data.latitude);
        setLongitude(data.longitude);
      }
    } catch (err) {
      console.error('Error loading location:', err);
    }
  }, []);

  // Update location in database
  const updateLocationInDb = useCallback(async (lat: number, lng: number) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw authError;

      const { error } = await supabase
        .from('users')
        .update({
          latitude: lat,
          longitude: lng,
        })
        .eq('id', user.id);

      if (error) throw error;

      setLatitude(lat);
      setLongitude(lng);
      toast.success('Location updated successfully');
    } catch (err: any) {
      console.error('Error updating location:', err);
      toast.error(err.message || 'Failed to update location');
      throw err;
    }
  }, []);

  // Detect and save location
  const detectLocation = useCallback(async () => {
    clearGeoError();
    setError(null);

    // First load existing location if not loaded
    if (latitude === null && longitude === null) {
      await loadUserLocation();
    }

    // Get current position
    getLocation();
  }, [clearGeoError, getLocation, loadUserLocation, latitude, longitude]);

  // Update location manually
  const updateLocation = useCallback(async (lat: number, lng: number) => {
    setUpdating(true);
    try {
      await updateLocationInDb(lat, lng);
    } finally {
      setUpdating(false);
    }
  }, [updateLocationInDb]);

  // Clear location from profile
  const clearLocation = useCallback(async () => {
    setUpdating(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw authError;

      const { error } = await supabase
        .from('users')
        .update({
          latitude: null,
          longitude: null,
        })
        .eq('id', user.id);

      if (error) throw error;

      setLatitude(null);
      setLongitude(null);
      toast.success('Location cleared');
    } catch (err: any) {
      console.error('Error clearing location:', err);
      toast.error(err.message || 'Failed to clear location');
    } finally {
      setUpdating(false);
    }
  }, []);

  // Auto-save when position is detected
  useEffect(() => {
    if (position && !loading) {
      updateLocationInDb(position.latitude, position.longitude);
    }
  }, [position, loading, updateLocationInDb]);

  // Handle geolocation errors
  useEffect(() => {
    if (geoError) {
      setError(geoError.message);
      toast.error(geoError.message);
    }
  }, [geoError]);

  return {
    latitude,
    longitude,
    loading,
    updating,
    error,
    detectLocation,
    updateLocation,
    clearLocation,
    isSupported,
  };
};
