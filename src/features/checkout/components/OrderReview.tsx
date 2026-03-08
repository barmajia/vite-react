import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { CartItem as CartItemType } from '@/hooks/useCart';

interface OrderReviewProps {
  items: CartItemType[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  isPlacing: boolean;
  error: Error | null;
  onPlaceOrder: () => void;
}

export function OrderReview({
  items,
  subtotal,
  shipping,
  tax,
  total,
  isPlacing,
  error,
  onPlaceOrder,
}: OrderReviewProps) {
  return (
    <Card className="sticky top-4">
      <CardContent className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">Order Review</h2>
        <Separator />

        {/* Items List */}
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {items.map((item) => (
            <div key={item.productId} className="flex gap-3">
              <div className="w-16 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                    No image
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  to={`/product/${item.productId}`}
                  className="text-sm font-medium hover:text-accent line-clamp-2"
                >
                  {item.name}
                </Link>
                <p className="text-xs text-muted-foreground mt-1">
                  Qty: {item.quantity}
                </p>
                <p className="text-sm font-medium mt-1">
                  ${((item.salePrice ?? item.price) * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Price Summary */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span className="font-medium">
              {shipping === 0 ? (
                <span className="text-green-600">FREE</span>
              ) : (
                `$${shipping.toFixed(2)}`
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Estimated Tax</span>
            <span className="font-medium">${tax.toFixed(2)}</span>
          </div>
        </div>

        <Separator />

        <div className="flex justify-between text-base font-semibold">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
            {error.message}
          </div>
        )}

        <Button
          className="w-full"
          size="lg"
          onClick={onPlaceOrder}
          disabled={isPlacing}
        >
          {isPlacing ? 'Placing Order...' : `Place Order - $${total.toFixed(2)}`}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          By placing this order, you agree to our{' '}
          <Link to="/help" className="hover:text-accent">
            Terms of Service
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
