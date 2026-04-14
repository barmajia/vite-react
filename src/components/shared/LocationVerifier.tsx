import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface LocationVerifierProps {
  onLocationVerified?: (location: LocationData) => void;
  requiredAccuracy?: number; // in meters
  showCoordinates?: boolean;
  autoVerify?: boolean;
}

export default function LocationVerifier({
  onLocationVerified,
  requiredAccuracy = 100,
  showCoordinates = true,
  autoVerify = false
}: LocationVerifierProps) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');

  const checkPermission = useCallback(async () => {
    if ('permissions' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        setPermission(result.state as 'granted' | 'denied' | 'prompt');
        
        result.onchange = () => {
          setPermission(result.state as 'granted' | 'denied' | 'prompt');
        };
      } catch (err) {
        console.error('Permission check failed:', err);
      }
    }
  }, []);

  const verifyLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };

        setLocation(locationData);
        setLoading(false);

        if (position.coords.accuracy <= requiredAccuracy) {
          onLocationVerified?.(locationData);
        } else {
          setError(`Location accuracy too low (${Math.round(position.coords.accuracy)}m). Required: ${requiredAccuracy}m`);
        }
      },
      (err) => {
        setLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Location access denied. Please enable location permissions.');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Location information unavailable.');
            break;
          case err.TIMEOUT:
            setError('Location request timed out.');
            break;
          default:
            setError('An unknown error occurred while getting location.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, [requiredAccuracy, onLocationVerified]);

  useEffect(() => {
    checkPermission();
    if (autoVerify) {
      verifyLocation();
    }
  }, [autoVerify, checkPermission, verifyLocation]);

  const getAccuracyStatus = () => {
    if (!location) return 'unknown';
    if (location.accuracy <= requiredAccuracy) return 'good';
    if (location.accuracy <= requiredAccuracy * 2) return 'fair';
    return 'poor';
  };

  const accuracyStatus = getAccuracyStatus();

  return (
    <Card className="w-full">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold">Location Verification</h3>
          </div>
          {location && (
            <Badge variant={accuracyStatus === 'good' ? 'default' : 'secondary'}>
              {accuracyStatus === 'good' ? (
                <CheckCircle className="h-3 w-3 mr-1" />
              ) : (
                <AlertCircle className="h-3 w-3 mr-1" />
              )}
              {Math.round(location.accuracy)}m accuracy
            </Badge>
          )}
        </div>

        {/* Location Status */}
        {location && showCoordinates && (
          <div className="bg-gray-50 p-3 rounded-lg space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Latitude</span>
                <p className="font-mono">{location.latitude.toFixed(6)}</p>
              </div>
              <div>
                <span className="text-gray-500">Longitude</span>
                <p className="font-mono">{location.longitude.toFixed(6)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Navigation className="h-3 w-3" />
              <span>Verified at {new Date(location.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Permission Warning */}
        {permission === 'denied' && (
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
            <p className="text-sm text-yellow-800 font-medium mb-1">
              Location Permission Denied
            </p>
            <p className="text-xs text-yellow-700">
              Please enable location permissions in your browser settings to use this feature.
            </p>
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={verifyLocation}
          disabled={loading || permission === 'denied'}
          className="w-full"
          variant={location && accuracyStatus === 'good' ? 'default' : 'outline'}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Verifying Location...
            </>
          ) : location && accuracyStatus === 'good' ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Location Verified
            </>
          ) : (
            <>
              <MapPin className="h-4 w-4 mr-2" />
              Verify My Location
            </>
          )}
        </Button>

        {/* Help Text */}
        <p className="text-xs text-gray-500 text-center">
          We use your location to verify delivery completion and ensure security.
        </p>
      </CardContent>
    </Card>
  );
}
