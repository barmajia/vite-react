import { Link } from 'react-router-dom';
import { useSettings } from '@/hooks/useSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus, Edit, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';

export function AddressSettings() {
  const { addresses } = useSettings();

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this address?')) {
      toast.success('Address deleted (implement in production)');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Shipping Addresses</h2>
          <p className="text-muted-foreground">Manage your delivery addresses</p>
        </div>
        <Button asChild>
          <Link to="/addresses">
            <Plus className="h-4 w-4 mr-2" />
            Add Address
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {addresses?.map((address) => (
          <Card key={address.id} className={address.is_default ? 'border-accent' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {address.full_name}
                {address.is_default && (
                  <Badge className="flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Default
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {address.city}, {address.country}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {address.address_line1}
                {address.address_line2 && `, ${address.address_line2}`}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {address.city}, {address.state} {address.postal_code}
              </p>
              <p className="text-sm text-muted-foreground">{address.phone}</p>

              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <Link to="/addresses">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(address.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {addresses?.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No addresses saved yet</p>
              <Button asChild className="mt-4">
                <Link to="/addresses">Add Your First Address</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
