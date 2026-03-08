import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { CartItem as CartItemType } from '@/hooks/useCart';

interface CartItemProps {
  item: CartItemType;
  onRemove: (id: string) => void;
  onQuantityChange: (id: string, quantity: number) => void;
}

export function CartItem({ item, onRemove, onQuantityChange }: CartItemProps) {
  const product = item.product;
  
  if (!product) return null;

  const imageUrl = Array.isArray(product.images) && product.images.length > 0
    ? product.images[0] as string
    : '/placeholder.png';

  return (
    <div className="flex gap-4 py-6 border-b last:border-b-0">
      {/* Product Image */}
      <div className="flex-shrink-0 w-24 h-24 bg-muted rounded-md overflow-hidden">
        <img
          src={imageUrl}
          alt={product.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <Link
          to={`/product/${item.asin}`}
          className="font-medium hover:text-accent transition-colors line-clamp-2"
        >
          {product.title}
        </Link>
        
        <p className="text-sm text-muted-foreground mt-1">
          ${product.price?.toFixed(2)}
        </p>

        {/* Quantity Controls */}
        <div className="flex items-center gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onQuantityChange(item.asin, item.quantity - 1)}
            disabled={item.quantity <= 1}
          >
            -
          </Button>
          <span className="w-8 text-center text-sm">{item.quantity}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onQuantityChange(item.asin, item.quantity + 1)}
            disabled={item.quantity >= (product.quantity || 0)}
          >
            +
          </Button>
        </div>
      </div>

      {/* Price & Remove */}
      <div className="flex flex-col items-end justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(item.asin)}
          className="text-muted-foreground hover:text-destructive"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
        </Button>
        <p className="font-semibold text-lg">
          ${(product.price * item.quantity).toFixed(2)}
        </p>
      </div>
    </div>
  );
}
