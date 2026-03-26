import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Info, Percent } from 'lucide-react';

interface PriceBreakdownProps {
  subtotal: number;
  platformMargin?: number;
  platformMarginPercentage?: number;
  shipping?: number;
  tax?: number;
  discount?: number;
  total: number;
  itemCount?: number;
  showSellerBreakdown?: boolean;
}

export default function PriceBreakdown({
  subtotal,
  platformMargin,
  platformMarginPercentage = 8,
  shipping = 0,
  tax = 0,
  discount = 0,
  total,
  itemCount = 0,
  showSellerBreakdown = true
}: PriceBreakdownProps) {
  const calculatedMargin = platformMargin || (subtotal * (platformMarginPercentage / 100));
  const sellerReceives = subtotal - calculatedMargin;

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        {/* Subtotal */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal ({itemCount} items)</span>
          <span className="font-medium">{subtotal.toFixed(2)} EGP</span>
        </div>

        {/* Shipping */}
        {shipping !== undefined && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Shipping</span>
            <span className={shipping === 0 ? 'text-green-600 font-medium' : 'font-medium'}>
              {shipping === 0 ? 'FREE' : `${shipping.toFixed(2)} EGP`}
            </span>
          </div>
        )}

        {/* Tax */}
        {tax > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax</span>
            <span className="font-medium">{tax.toFixed(2)} EGP</span>
          </div>
        )}

        {/* Discount */}
        {discount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Discount</span>
            <span className="text-green-600 font-medium">-{discount.toFixed(2)} EGP</span>
          </div>
        )}

        <Separator />

        {/* Platform Fee Breakdown (for seller view) */}
        {showSellerBreakdown && (
          <div className="bg-blue-50 p-3 rounded-lg space-y-2 border border-blue-100">
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-1 text-blue-800">
                <Percent className="h-3 w-3" />
                Platform Fee ({platformMarginPercentage}%)
              </span>
              <span className="text-red-600 font-medium">
                -{calculatedMargin.toFixed(2)} EGP
              </span>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-blue-900 font-medium">Seller Receives</span>
              <span className="text-green-600 font-bold">
                {sellerReceives.toFixed(2)} EGP
              </span>
            </div>

            <div className="flex items-center gap-1 mt-2">
              <Info className="h-3 w-3 text-blue-600" />
              <p className="text-xs text-blue-700">
                The platform fee helps cover payment processing, customer support, and platform maintenance.
              </p>
            </div>
          </div>
        )}

        <Separator />

        {/* Total */}
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold">Total</span>
          <div className="text-right">
            <span className="text-2xl font-bold text-green-600">
              {total.toFixed(2)} EGP
            </span>
            <p className="text-xs text-gray-500">Includes all fees</p>
          </div>
        </div>

        {/* Free Shipping Progress */}
        {shipping > 0 && (
          <div className="bg-green-50 p-3 rounded-lg border border-green-100">
            <p className="text-sm text-green-800 font-medium mb-2">
              🎉 Add {(500 - subtotal).toFixed(2)} EGP more for FREE shipping!
            </p>
            <div className="w-full bg-green-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (subtotal / 500) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
