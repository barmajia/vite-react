import { useSettings } from '@/hooks/useSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Building2, CheckCircle, XCircle } from 'lucide-react';

interface BusinessSettingsProps {
  accountType: string;
}

export function BusinessSettings({ accountType }: BusinessSettingsProps) {
  const { roleData, updateSeller } = useSettings();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    
    await updateSeller({
      location: data.location as string,
      currency: data.currency as string,
      min_order_quantity: Number(data.min_order_quantity) || 1,
      wholesale_discount: data.wholesale_discount ? Number(data.wholesale_discount) : null,
      accepts_returns: data.accepts_returns === 'on',
      production_capacity: data.production_capacity as string,
    });
  };

  if (accountType === 'customer') {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">
            Business settings are only available for seller, factory, middleman, and delivery accounts.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Seller/Factory Settings */}
      {(accountType === 'seller' || accountType === 'factory') && roleData && (
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Store Settings
              </CardTitle>
              <CardDescription>Configure your store preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  name="location"
                  defaultValue={(roleData as any).location || ''}
                  placeholder="Cairo, Egypt"
                />
              </div>

              <div className="space-y-2">
                <Label>Currency</Label>
                <Input
                  name="currency"
                  defaultValue={(roleData as any).currency || 'USD'}
                  placeholder="USD"
                />
              </div>

              <div className="space-y-2">
                <Label>Minimum Order Quantity</Label>
                <Input
                  name="min_order_quantity"
                  type="number"
                  defaultValue={(roleData as any).min_order_quantity || 1}
                />
              </div>

              <div className="space-y-2">
                <Label>Wholesale Discount (%)</Label>
                <Input
                  name="wholesale_discount"
                  type="number"
                  defaultValue={(roleData as any).wholesale_discount || 0}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Accepts Returns</Label>
                  <p className="text-sm text-muted-foreground">Allow customers to return products</p>
                </div>
                <Switch
                  name="accepts_returns"
                  defaultChecked={(roleData as any).accepts_returns}
                />
              </div>

              {accountType === 'factory' && (
                <div className="space-y-2">
                  <Label>Production Capacity</Label>
                  <Input
                    name="production_capacity"
                    defaultValue={(roleData as any).production_capacity || ''}
                    placeholder="10,000 units/month"
                  />
                </div>
              )}

              <Button type="submit">Save Business Settings</Button>
            </CardContent>
          </Card>
        </form>
      )}

      {/* Verification Status */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {(roleData as any)?.is_verified ? (
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
            <span className="text-sm text-muted-foreground">
              {(roleData as any)?.is_verified ? 'Your account is verified' : 'Verification pending'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
