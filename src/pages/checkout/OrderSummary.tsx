import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Info } from 'lucide-react';

interface OrderSummaryProps {
  subtotal: number;
  platformMargin: number;
  shipping: number;
  total: number;
  itemCount: number;
}

export function OrderSummary({
  subtotal,
  platformMargin,
  shipping,
  total,
  itemCount
}: OrderSummaryProps) {
  const sellerReceives = subtotal - platformMargin;

  return (
    <Card className="sticky top-8">
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between text-sm">
          <span>Subtotal ({itemCount} items)</span>
          <span>{subtotal.toFixed(2)} EGP</span>
        </div>

        <div className="flex justify-between text-sm">
          <span>Shipping</span>
          <span>{shipping === 0 ? 'FREE' : `${shipping.toFixed(2)} EGP`}</span>
        </div>

        <Separator />

        {/* Platform Margin (Visible to Seller, Hidden from Customer) */}
        <div className="bg-blue-50 p-3 rounded-lg space-y-2">
          <div className="flex justify-between text-sm text-blue-800">
            <span className="flex items-center gap-1">
              Platform Fee (8%)
              <Info className="h-3 w-3" />
            </span>
            <span>-{platformMargin.toFixed(2)} EGP</span>
          </div>
          <div className="flex justify-between text-sm font-semibold text-blue-900">
            <span>Seller Receives</span>
            <span>{sellerReceives.toFixed(2)} EGP</span>
          </div>
        </div>

        <Separator />

        <div className="flex justify-between text-lg font-bold">
          <span>Total (COD)</span>
          <span>{total.toFixed(2)} EGP</span>
        </div>

        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
          <p>💡 Cash on Delivery</p>
          <p>• Pay when you receive your order</p>
          <p>• You'll receive a verification code</p>
          <p>• Share code with delivery driver</p>
        </div>
      </CardContent>
    </Card>
  );
}
