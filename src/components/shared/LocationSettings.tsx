import { useState } from 'react';
import { useProfileLocation } from '@/hooks/useProfileLocation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Locate, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface LocationSettingsProps {
  onLocationUpdate?: (lat: number | null, lng: number | null) => void;
}

export const LocationSettings = ({ onLocationUpdate }: LocationSettingsProps) => {
  const {
    latitude,
    longitude,
    loading,
    updating,
    error,
    detectLocation,
    updateLocation,
    clearLocation,
    isSupported,
  } = useProfileLocation();

  const [manualLat, setManualLat] = useState(latitude?.toString() || '');
  const [manualLng, setManualLng] = useState(longitude?.toString() || '');

  const handleDetectLocation = async () => {
    await detectLocation();
  };

  const handleManualUpdate = async () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);

    if (isNaN(lat) || isNaN(lng)) {
      toast.error('Please enter valid coordinates');
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast.error('Invalid coordinates. Latitude: -90 to 90, Longitude: -180 to 180');
      return;
    }

    await updateLocation(lat, lng);
    onLocationUpdate?.(lat, lng);
  };

  const handleClear = async () => {
    await clearLocation();
    onLocationUpdate?.(null, null);
    setManualLat('');
    setManualLng('');
  };

  const formatCoordinates = (lat: number | null, lng: number | null) => {
    if (lat === null || lng === null) return 'Not set';
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const getMapLink = (lat: number | null, lng: number | null) => {
    if (lat === null || lng === null) return '#';
    return `https://www.google.com/maps?q=${lat},${lng}`;
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Settings
          </CardTitle>
          <CardDescription>Your geographic location for nearby features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-destructive/10 rounded-lg text-destructive">
            <p className="font-medium">Geolocation not supported</p>
            <p className="text-sm mt-1">
              Your browser doesn't support geolocation. Please update your browser or enable location services.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Location Settings
        </CardTitle>
        <CardDescription>Your geographic location for nearby sellers and products</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Location Display */}
        <div className="space-y-2">
          <Label>Current Location</Label>
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-sm">
                {formatCoordinates(latitude, longitude)}
              </span>
            </div>
            {latitude && longitude && (
              <a
                href={getMapLink(latitude, longitude)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline"
              >
                View on map
              </a>
            )}
          </div>
        </div>

        {/* Auto-detect Button */}
        <div className="space-y-2">
          <Label>Auto-Detect Location</Label>
          <div className="flex gap-2">
            <Button
              onClick={handleDetectLocation}
              disabled={loading || updating}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Detecting...
                </>
              ) : (
                <>
                  <Locate className="h-4 w-4 mr-2" />
                  Use My Location
                </>
              )}
            </Button>
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        {/* Manual Coordinates */}
        <div className="space-y-2">
          <Label>Or Enter Manually</Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="latitude" className="text-xs">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                placeholder="-90 to 90"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                disabled={updating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude" className="text-xs">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                placeholder="-180 to 180"
                value={manualLng}
                onChange={(e) => setManualLng(e.target.value)}
                disabled={updating}
              />
            </div>
          </div>
          <Button
            onClick={handleManualUpdate}
            disabled={updating || !manualLat || !manualLng}
            variant="outline"
            className="w-full"
          >
            {updating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Coordinates'
            )}
          </Button>
        </div>

        {/* Clear Location */}
        {latitude && longitude && (
          <div className="pt-2 border-t">
            <Button
              onClick={handleClear}
              variant="ghost"
              className="w-full text-destructive hover:text-destructive"
              disabled={updating}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Location
            </Button>
          </div>
        )}

        {/* Info */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <strong>Note:</strong> Your location is used to show nearby sellers, products, and calculate delivery estimates. 
            Location data is stored securely and only visible to you.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
