import { Link } from "react-router-dom";
import { DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ServiceListing } from "../hooks/useServices";

interface ServiceListingCardProps {
  listing: ServiceListing;
}

export function ServiceListingCard({ listing }: ServiceListingCardProps) {
  const formatPrice = () => {
    if (!listing.price_numeric) return "Contact for pricing";
    return `$${listing.price_numeric.toFixed(2)}`;
  };

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg">
      <Link to={`/services/listing/${listing.slug}`} className="block">
        <CardContent className="p-4">
          {/* Title */}
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {listing.title}
          </h3>

          {/* Description */}
          {listing.description && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {listing.description}
            </p>
          )}

          {/* Category */}
          {listing.category_slug && (
            <Badge variant="outline" className="mb-3">
              {listing.category_slug}
            </Badge>
          )}

          {/* Price */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-1 text-sm font-semibold text-primary">
              <DollarSign size={14} />
              {formatPrice()}
            </div>
            <span className="text-xs text-muted-foreground">
              Provider: {listing.provider_id.slice(0, 6)}...
            </span>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
