import { Link } from 'react-router-dom';
import { Star, Clock, DollarSign } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ServiceListing } from '../hooks/useServices';

interface ServiceListingCardProps {
  listing: ServiceListing & {
    svc_providers?: {
      provider_name: string;
      logo_url: string | null;
      average_rating: number | null;
    } | null;
  };
}

export function ServiceListingCard({ listing }: ServiceListingCardProps) {
  const formatPrice = () => {
    if (!listing.price) return 'Contact for pricing';
    const price = listing.price.toFixed(2);
    switch (listing.price_type) {
      case 'hourly':
        return `$${price}/hr`;
      case 'monthly':
        return `$${price}/mo`;
      default:
        return `$${price}`;
    }
  };

  const getPriceIcon = () => {
    switch (listing.price_type) {
      case 'hourly':
        return <Clock size={14} />;
      case 'monthly':
        return <Clock size={14} />;
      default:
        return <DollarSign size={14} />;
    }
  };

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg">
      <Link to={`/services/listing/${listing.slug}`} className="block">
        {/* Listing Image */}
        <div className="aspect-video bg-muted relative overflow-hidden">
          {listing.images && listing.images.length > 0 ? (
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100">
              <Clock size={48} className="text-indigo-300" />
            </div>
          )}
          {listing.is_featured && (
            <Badge className="absolute top-2 right-2" variant="default">
              Featured
            </Badge>
          )}
        </div>

        <CardContent className="p-4">
          {/* Title */}
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {listing.title}
          </h3>

          {/* Provider Info */}
          {listing.svc_providers && (
            <div className="flex items-center gap-2 mb-3">
              {listing.svc_providers.logo_url ? (
                <img
                  src={listing.svc_providers.logo_url}
                  alt={listing.svc_providers.provider_name}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-muted" />
              )}
              <span className="text-sm text-muted-foreground">
                {listing.svc_providers.provider_name}
              </span>
              {listing.svc_providers.average_rating && (
                <div className="flex items-center gap-1 ml-auto">
                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-medium">
                    {listing.svc_providers.average_rating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Price & Delivery */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-1 text-sm font-semibold text-primary">
              {getPriceIcon()}
              {formatPrice()}
            </div>
            {listing.delivery_days && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock size={12} />
                {listing.delivery_days} {listing.delivery_days === 1 ? 'day' : 'days'} delivery
              </div>
            )}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
