import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Factory, MapPin, CheckCircle, XCircle } from 'lucide-react';
import type { SellerProfile } from '@/types/profile';

interface SellerProfileDetailsProps {
  data: SellerProfile;
}

export function SellerProfileDetails({ data }: SellerProfileDetailsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Business Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Business Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Full Name</span>
            <span className="font-medium">{data.full_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Location</span>
            <span className="font-medium">{data.location || 'Not set'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Currency</span>
            <Badge variant="outline">{data.currency}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Verification</span>
            {data.is_verified ? (
              <Badge className="bg-green-500 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Verified
              </Badge>
            ) : (
              <Badge variant="secondary" className="flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                Pending
              </Badge>
            )}
          </div>
          {data.verified_at && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Verified At</span>
              <span className="font-medium">{new Date(data.verified_at).toLocaleDateString()}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Factory Info (if applicable) */}
      {data.is_factory && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Factory className="h-5 w-5" />
              Factory Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Production Capacity</span>
              <span className="font-medium">{data.production_capacity || 'Not specified'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Min Order Quantity</span>
              <span className="font-medium">{data.min_order_quantity} units</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Wholesale Discount</span>
              <span className="font-medium">{data.wholesale_discount || 0}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Accepts Returns</span>
              <Badge variant={data.accepts_returns ? 'default' : 'secondary'}>
                {data.accepts_returns ? 'Yes' : 'No'}
              </Badge>
            </div>
            {data.factory_license_url && (
              <div>
                <span className="text-muted-foreground">License</span>
                <a
                  href={data.factory_license_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline block mt-1"
                >
                  View License →
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Location & Settings */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location & Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Currency</span>
              <span className="font-medium">{data.currency}</span>
            </div>
            {data.latitude && data.longitude && (
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Coordinates
                </span>
                <span className="font-medium text-xs">
                  {data.latitude.toFixed(4)}, {data.longitude.toFixed(4)}
                </span>
              </div>
            )}
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Member Since</span>
              <span className="font-medium">
                {new Date(data.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Last Updated</span>
              <span className="font-medium">
                {new Date(data.updated_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
