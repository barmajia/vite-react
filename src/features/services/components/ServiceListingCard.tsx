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
    if (!listing.price) return "Contact for pricing";
    const currency = listing.currency === "EGP" ? "EGP " : "$";
    return `${currency}${listing.price.toFixed(2)}`;
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

          {/* Price Type Badge */}
          {listing.price_type && (
            <Badge variant="outline" className="mb-3 capitalize">
              {listing.price_type}
            </Badge>
          )}

          {/* Price */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-1 text-sm font-semibold text-primary">
              <DollarSign size={14} />
              {formatPrice()}
              {listing.price_type && (
                <span className="text-xs text-muted-foreground">
                  /{listing.price_type}
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              Active: {listing.is_active ? "Yes" : "No"}
            </span>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
