import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star, Pencil, Trash2 } from 'lucide-react';
import type { ShippingAddress } from '@/types/profile';

interface AddressesSectionProps {
  addresses: ShippingAddress[];
  editable?: boolean;
  showViewAll?: boolean;
  onEdit?: (address: ShippingAddress) => void;
  onDelete?: (id: string) => void;
}

export function AddressesSection({
  addresses,
  editable = false,
  showViewAll = false,
  onEdit,
  onDelete,
}: AddressesSectionProps) {
  if (addresses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Shipping Addresses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No addresses saved yet.
          </p>
          {editable && (
            <div className="text-center mt-4">
              <Button asChild>
                <Link to="/addresses">Add Your First Address</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Shipping Addresses
          </CardTitle>
          {editable && showViewAll && addresses.length > 2 && (
            <Button variant="outline" size="sm" asChild>
              <Link to="/addresses">View All ({addresses.length})</Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="p-4 border rounded-lg bg-surface relative"
            >
              {address.is_default && (
                <Badge className="absolute top-2 right-2 bg-accent">
                  <Star className="w-3 h-3 mr-1" />
                  Default
                </Badge>
              )}

              <div className="flex items-start gap-3 mb-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <address className="not-italic text-sm space-y-1 flex-1">
                  <p className="font-medium">{address.full_name}</p>
                  <p>{address.address_line1}</p>
                  {address.address_line2 && <p>{address.address_line2}</p>}
                  <p>
                    {address.city}, {address.state} {address.postal_code}
                  </p>
                  <p>{address.country}</p>
                  <p className="text-muted-foreground">{address.phone}</p>
                </address>
              </div>

              {editable && (
                <div className="flex gap-2 pt-3 border-t">
                  {onEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(address)}
                    >
                      <Pencil className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  )}
                  {onDelete && !address.is_default && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(address.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {editable && !showViewAll && (
          <div className="mt-4 text-center">
            <Button asChild>
              <Link to="/addresses">Manage Addresses</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
