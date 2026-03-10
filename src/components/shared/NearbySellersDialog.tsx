import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MapPin, Search, Loader2, Locate } from 'lucide-react';
import { useConversationCreate } from '@/features/messaging';

interface NearbySeller {
  user_id: string;
  company_name: string;
  full_name: string;
  avatar_url: string | null;
  distance_km: number;
  latitude: number;
  longitude: number;
  is_factory: boolean;
}

interface NearbySellersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConversationCreated?: (conversationId: string) => void;
}

export const NearbySellersDialog = ({
  open,
  onOpenChange,
  onConversationCreated,
}: NearbySellersDialogProps) => {
  const [sellers, setSellers] = useState<NearbySeller[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [maxDistance, setMaxDistance] = useState(50); // km
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const { createConversation } = useConversationCreate();

  // Load user's location from profile on mount
  useEffect(() => {
    if (open) {
      loadUserLocation();
    }
  }, [open]);

  // Fetch nearby sellers when location is available
  useEffect(() => {
    if (open && userLocation) {
      fetchNearbySellers();
    }
  }, [open, userLocation, maxDistance]);

  const loadUserLocation = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('users')
        .select('latitude, longitude')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data?.latitude && data?.longitude) {
        setUserLocation({
          latitude: data.latitude,
          longitude: data.longitude,
        });
      }
    } catch (error) {
      console.error('Error loading location:', error);
    }
  };

  const detectBrowserLocation = () => {
    if (!('geolocation' in navigator)) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setDetectingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Save to user profile
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase
              .from('users')
              .update({ latitude, longitude })
              .eq('id', user.id);

            toast.success('Location detected and saved!');
          }
        } catch (error) {
          console.error('Error saving location:', error);
        }

        setUserLocation({ latitude, longitude });
        setDetectingLocation(false);
      },
      (error) => {
        setDetectingLocation(false);
        
        let message = 'Unable to get your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location permission denied. Please allow location access when prompted by your browser.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out. Please try again.';
            break;
        }
        toast.error(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const fetchNearbySellers = async () => {
    if (!userLocation) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Try to use the RPC function first
      const { data, error } = await supabase.rpc('find_nearby_factories', {
        seller_id: user?.id || '',
        max_distance_km: maxDistance,
        limit_count: 20,
      });

      let combined: NearbySeller[] = [];

      if (data && !error) {
        combined = data as NearbySeller[];
      }

      // Also fetch users with location
      const { data: usersWithLocation } = await supabase
        .from('users')
        .select('id, full_name, avatar_url, latitude, longitude')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (usersWithLocation) {
        for (const seller of usersWithLocation) {
          if (seller.id === user?.id) continue; // Skip self

          const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            seller.latitude!,
            seller.longitude!
          );
          
          if (distance <= maxDistance) {
            combined.push({
              user_id: seller.id,
              company_name: seller.full_name || 'User',
              full_name: seller.full_name || 'User',
              avatar_url: seller.avatar_url,
              distance_km: distance,
              latitude: seller.latitude,
              longitude: seller.longitude,
              is_factory: false,
            });
          }
        }
      }

      // Sort by distance
      const sorted = combined.sort((a, b) => a.distance_km - b.distance_km);
      setSellers(sorted);
    } catch (error: any) {
      console.error('Error fetching nearby sellers:', error);
      // Don't show error toast for RPC failures, just show empty state
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 100) / 100;
  };

  const handleStartConversation = async (sellerId: string, sellerName: string) => {
    try {
      const conversationId = await createConversation(sellerId);
      if (conversationId) {
        onConversationCreated?.(conversationId);
        onOpenChange(false);
        toast.success(`Conversation started with ${sellerName}`);
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const filteredSellers = sellers.filter((seller) =>
    seller.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    seller.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Start Conversation - Nearby Sellers</DialogTitle>
          <DialogDescription>
            Find and message sellers near your location.
          </DialogDescription>
        </DialogHeader>

        {/* Location & Search */}
        <div className="space-y-3">
          {!userLocation ? (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-sm text-blue-900 dark:text-blue-100">
                    Location Required
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Set your location to find sellers near you. Your browser will ask for permission.
                  </p>
                </div>
                <Button
                  onClick={detectBrowserLocation}
                  disabled={detectingLocation}
                  size="sm"
                  className="shrink-0"
                >
                  {detectingLocation ? (
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
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <MapPin className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-900 dark:text-green-100">
                Your location: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUserLocation(null)}
                className="ml-auto h-6 text-xs"
              >
                Change
              </Button>
            </div>
          )}

          {/* Search & Distance Filter */}
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sellers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div>
              <Label className="text-xs">Max Distance: {maxDistance} km</Label>
              <Input
                type="number"
                value={maxDistance}
                onChange={(e) => setMaxDistance(Number(e.target.value))}
                min="1"
                max="500"
              />
            </div>
          </div>
        </div>

        {/* Sellers List */}
        <ScrollArea className="flex-1 max-h-96">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredSellers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">
                {userLocation ? 'No nearby sellers found' : 'Set your location to see sellers'}
              </p>
              <p className="text-sm mt-1">
                {userLocation
                  ? `Try increasing the search radius or search for a specific seller`
                  : 'Click "Use My Location" to get started'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSellers.map((seller) => (
                <div
                  key={seller.user_id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <img
                      src={seller.avatar_url || '/default-avatar.png'}
                      alt={seller.full_name}
                    />
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm truncate">
                        {seller.company_name || seller.full_name}
                      </h4>
                      {seller.is_factory && (
                        <Badge variant="secondary" className="text-xs">
                          Factory
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {seller.distance_km.toFixed(1)} km away
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() =>
                      handleStartConversation(seller.user_id, seller.full_name)
                    }
                  >
                    Message
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="border-t pt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
