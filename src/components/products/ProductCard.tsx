import { Link } from 'react-router-dom';
import { ShoppingCart, Star, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Product } from '@/types/database';
import { formatPrice, getProductImage } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { useState } from 'react';

interface ProductCardProps {
  product: Product & {
    average_rating?: number;
    review_count?: number;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const imageUrl = getProductImage(product.images);

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Link to={`${ROUTES.PRODUCT_DETAIL.replace(':asin', product.id)}`}>
          <img
            src={imageUrl}
            alt={product.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        </Link>
        
        {/* Wishlist Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.preventDefault();
            setIsWishlisted(!isWishlisted);
          }}
        >
          <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
        </Button>

        {/* Out of Stock Badge */}
        {product.quantity === 0 && (
          <Badge className="absolute top-2 left-2" variant="destructive">
            Out of Stock
          </Badge>
        )}
      </div>

      <CardContent className="p-4 space-y-2">
        <Link to={`${ROUTES.PRODUCT_DETAIL.replace(':asin', product.id)}`}>
          <h3 className="font-medium line-clamp-2 hover:text-primary transition-colors">
            {product.title}
          </h3>
        </Link>

        {/* Rating */}
        {product.average_rating && (
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-primary text-primary" />
            <span className="text-sm font-medium">
              {product.average_rating.toFixed(1)}
            </span>
            {product.review_count && (
              <span className="text-sm text-muted-foreground">
                ({product.review_count})
              </span>
            )}
          </div>
        )}

        {/* Price and Add to Cart */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold">
            {formatPrice(product.price)}
          </span>
          <Button
            size="icon"
            className="h-8 w-8 rounded-full"
            disabled={product.quantity === 0}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
