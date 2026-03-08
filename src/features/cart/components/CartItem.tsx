import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { CartItem as CartItemType } from '@/hooks/useCart';

interface CartItemProps {
  item: CartItemType;
  onRemove: () => void;
  onQuantityChange: (quantity: number) => void;
}

export function CartItem({ item, onRemove, onQuantityChange }: CartItemProps) {
  const price = item.salePrice ?? item.price;
  const lineTotal = price * item.quantity;

  return (
    <div className="flex gap-4 py-6 border-b last:border-b-0">
      {/* Product Image */}
      <div className="flex-shrink-0 w-24 h-24 bg-muted rounded-md overflow-hidden">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No image
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <Link
          to={`/product/${item.productId}`}
          className="font-medium hover:text-accent transition-colors line-clamp-2"
        >
          {item.name}
        </Link>
        
        <div className="mt-2">
          {item.salePrice ? (
            <>
              <span className="text-lg font-bold">${item.salePrice.toFixed(2)}</span>
              <span className="text-sm text-muted-foreground line-through ml-2">
                ${item.price.toFixed(2)}
              </span>
            </>
          ) : (
            <span className="text-lg font-bold">${price.toFixed(2)}</span>
          )}
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onQuantityChange(item.quantity - 1)}
            disabled={item.quantity <= 1}
          >
            -
          </Button>
          <span className="w-8 text-center text-sm">{item.quantity}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onQuantityChange(item.quantity + 1)}
          >
            +
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-muted-foreground hover:text-destructive ml-2"
          >
            Remove
          </Button>
        </div>
      </div>

      {/* Line Total */}
      <div className="text-right">
        <p className="font-semibold text-lg">${lineTotal.toFixed(2)}</p>
      </div>
    </div>
  );
}
