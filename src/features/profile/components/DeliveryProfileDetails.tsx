import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Truck, Star, MapPin, CheckCircle, XCircle } from 'lucide-react';
import type { DeliveryProfile } from '@/types/profile';

interface DeliveryProfileDetailsProps {
  data: DeliveryProfile;
}

export function DeliveryProfileDetails({ data }: DeliveryProfileDetailsProps) {
  const completionRate = data.total_deliveries > 0
    ? Math.round((data.completed_deliveries / data.total_deliveries) * 100)
    : 0;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Vehicle Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Vehicle Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Vehicle Type</span>
            <Badge variant="outline" className="capitalize">
              {data.vehicle_type || 'Not specified'}
            </Badge>
          </div>
          {data.vehicle_number && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">License Plate</span>
              <span className="font-mono font-medium">{data.vehicle_number}</span>
            </div>
          )}
          {data.driver_license_url && (
            <div>
              <span className="text-muted-foreground">Driver License</span>
              <a
                href={data.driver_license_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline block mt-1"
              >
                View License →
              </a>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Commission Rate</span>
            <Badge>{data.commission_rate || 10}%</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Performance Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Rating</span>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-bold">{data.rating?.toFixed(1) || '0.0'}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Completion Rate</span>
              <span className="font-medium">{completionRate}%</span>
            </div>
            <Progress value={completionRate} className="h-2" />
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 bg-surface rounded-lg">
              <div className="text-2xl font-bold text-green-600">{data.completed_deliveries}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div className="p-3 bg-surface rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {data.total_deliveries - data.completed_deliveries - data.cancelled_deliveries}
              </div>
              <div className="text-xs text-muted-foreground">In Progress</div>
            </div>
            <div className="p-3 bg-surface rounded-lg">
              <div className="text-2xl font-bold text-red-600">{data.cancelled_deliveries}</div>
              <div className="text-xs text-muted-foreground">Cancelled</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Account Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              {data.is_verified ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-yellow-500" />
              )}
              <span className={data.is_verified ? 'text-green-600' : 'text-yellow-600'}>
                {data.is_verified ? 'Verified Driver' : 'Pending Verification'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {data.is_active ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-gray-400" />
              )}
              <span className={data.is_active ? 'text-green-600' : 'text-gray-500'}>
                {data.is_active ? 'Active & Available' : 'Inactive'}
              </span>
            </div>
            {data.latitude && data.longitude && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {data.latitude.toFixed(4)}, {data.longitude.toFixed(4)}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
