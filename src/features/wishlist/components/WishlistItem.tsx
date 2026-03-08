import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Heart, Trash2 } from 'lucide-react';
import type { WishlistItem } from '../hooks/useWishlist';

interface WishlistItemProps {
  item: WishlistItem;
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
    <div className="flex gap-4 p-4 border-b last:border-b-0">
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
        <p className="text-sm text-muted-foreground mt-1">
          ${product.price?.toFixed(2)}
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

      {/* Heart Icon */}
      <div className="flex items-center">
        <Heart className="w-6 h-6 text-accent fill-accent" />
      </div>
    </div>
  );
}
