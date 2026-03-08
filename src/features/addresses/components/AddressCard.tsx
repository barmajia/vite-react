import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { ShippingAddress } from '@/types/database';
import { MapPin, Pencil, Trash2, Star } from 'lucide-react';

interface AddressCardProps {
  address: ShippingAddress;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}

export function AddressCard({ address, onEdit, onDelete, onSetDefault }: AddressCardProps) {
  return (
    <Card className={`relative ${address.is_default ? 'border-accent' : ''}`}>
      <CardContent className="p-4">
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
            <p>{address.city}, {address.state} {address.postal_code}</p>
            <p>{address.country}</p>
            <p className="text-muted-foreground">{address.phone}</p>
          </address>
        </div>

        <div className="flex gap-2 pt-3 border-t">
          {!address.is_default && (
            <Button variant="outline" size="sm" onClick={onSetDefault}>
              <Star className="w-4 h-4 mr-1" />
              Set Default
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="w-4 h-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
