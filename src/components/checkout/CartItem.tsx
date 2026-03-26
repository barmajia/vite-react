import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface CartItem {
  asin: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CartItemProps {
  item: CartItem;
  onRemove?: () => void;
  onQuantityChange?: (quantity: number) => void;
}

export default function CartItemComponent({ item, onRemove, onQuantityChange }: CartItemProps) {
  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Product Image */}
          {item.image && (
            <img
              src={item.image}
              alt={item.title}
              className="w-20 h-20 object-cover rounded-md"
            />
          )}

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate">{item.title}</h3>
            <p className="text-sm text-gray-500">ASIN: {item.asin}</p>
            
            {onQuantityChange ? (
              <div className="flex items-center gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onQuantityChange(Math.max(1, item.quantity - 1))}
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
              </div>
            ) : (
              <p className="text-sm text-gray-500 mt-2">Quantity: {item.quantity}</p>
            )}
          </div>

          {/* Price and Actions */}
          <div className="text-right">
            <p className="text-lg font-bold text-green-600">
              {(item.price * item.quantity).toFixed(2)} EGP
            </p>
            <p className="text-xs text-gray-500">{item.price.toFixed(2)} EGP each</p>
            
            {onRemove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="mt-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Remove
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
