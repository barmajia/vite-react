import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Trash2 } from 'lucide-react';
import type { WishlistItem as WishlistItemType } from '../hooks/useWishlist';

interface WishlistItemProps {
  item: WishlistItemType;
  onRemove: (id: string) => void;
  isRemoving: boolean;
}

export function WishlistItem({ item, onRemove, isRemoving }: WishlistItemProps) {
  const product = item.product;

  if (!product) return null;

  const imageUrl = Array.isArray(product.images) && product.images.length > 0
    ? (product.images[0] as string)
    : '/placeholder.png';

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Product Image */}
          <Link
            to={`/product/${product.id}`}
            className="w-24 h-24 bg-muted rounded overflow-hidden flex-shrink-0"
          >
            <img
              src={imageUrl}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          </Link>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <Link
              to={`/product/${product.id}`}
              className="font-medium hover:text-accent line-clamp-2"
            >
              {product.title}
            </Link>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {product.price ? `$${product.price.toFixed(2)}` : 'Price unavailable'}
            </p>

            <div className="flex gap-2 mt-3">
              <Button size="sm" asChild>
                <Link to={`/product/${product.id}`}>View Details</Link>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onRemove(item.id)}
                disabled={isRemoving}
                className="text-destructive hover:text-destructive"
              >
                {isRemoving ? (
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-1" />
                    Remove
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Remove Button (Icon) */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(item.id)}
            disabled={isRemoving}
            className="text-muted-foreground hover:text-destructive"
          >
            <Heart className="w-5 h-5 fill-current" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
