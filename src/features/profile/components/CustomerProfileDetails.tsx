import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShoppingBag, Calendar, User, Tag } from 'lucide-react';
import type { CustomerProfile } from '@/types/profile';

interface CustomerProfileDetailsProps {
  data: CustomerProfile;
}

export function CustomerProfileDetails({ data }: CustomerProfileDetailsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Shopping Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Shopping Statistics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-surface rounded-lg">
            <span className="text-muted-foreground">Total Orders</span>
            <Badge variant="default" className="text-lg">{data.total_orders}</Badge>
          </div>
          <div className="flex justify-between items-center p-3 bg-surface rounded-lg">
            <span className="text-muted-foreground">Total Spent</span>
            <span className="font-bold text-lg">${data.total_spent?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-surface rounded-lg">
            <span className="text-muted-foreground flex items-center gap-1">
              <Calendar className="h-4 w-4" /> Last Purchase
            </span>
            <span className="font-medium">
              {data.last_purchase_date
                ? new Date(data.last_purchase_date).toLocaleDateString()
                : 'Never'
              }
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Personal Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Full Name</span>
            <span className="font-medium">{data.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Phone</span>
            <span className="font-medium">{data.phone}</span>
          </div>
          {data.age_range && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Age Range</span>
              <Badge variant="outline" className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {data.age_range}
              </Badge>
            </div>
          )}
          {data.email && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{data.email}</span>
            </div>
          )}
          {data.notes && (
            <>
              <Separator />
              <div>
                <span className="text-muted-foreground block mb-1">Notes</span>
                <p className="text-sm bg-surface p-3 rounded-lg">{data.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
