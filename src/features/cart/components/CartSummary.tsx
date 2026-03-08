import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface CartSummaryProps {
  subtotal: number;
  itemCount: number;
  onCheckout: () => void;
}

export function CartSummary({ subtotal, itemCount, onCheckout }: CartSummaryProps) {
  const shipping = subtotal > 50 ? 0 : 5.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  return (
    <Card className="sticky top-4">
      <CardContent className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">Order Summary</h2>
        <Separator />
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal ({itemCount} items)</span>
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

        <Button
          className="w-full"
          size="lg"
          onClick={onCheckout}
          disabled={itemCount === 0}
        >
          Proceed to Checkout
        </Button>

        <div className="text-xs text-muted-foreground text-center">
          <Link to="/products" className="hover:text-accent">
            Continue Shopping
          </Link>
        </div>

        {shipping === 0 && subtotal > 0 && (
          <p className="text-xs text-green-600 text-center">
            ✓ You've qualified for FREE shipping!
          </p>
        )}

        {subtotal > 0 && shipping > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            Add ${(50 - subtotal).toFixed(2)} more for FREE shipping
          </p>
        )}
      </CardContent>
    </Card>
  );
}
