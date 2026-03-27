/**
 * Stripe Checkout Component
 * 
 * Main checkout component with Stripe payment integration
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StripeProvider } from './StripeProvider';
import { StripeCheckoutForm } from './StripeCheckoutForm';
import { Button } from '@/components/ui/button';
import { CreditCard, Wallet } from 'lucide-react';

interface StripeCheckoutProps {
  amount: number;
  orderId?: string;
  customerEmail?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function StripeCheckout({
  amount,
  orderId,
  customerEmail,
  onSuccess,
  onCancel,
}: StripeCheckoutProps) {
  const [useStripe, setUseStripe] = useState(true);

  if (!useStripe) {
    // Fallback to other payment methods
    return (
      <Card>
        <CardHeader>
          <CardTitle>Choose Payment Method</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            className="w-full"
            variant="outline"
            onClick={() => setUseStripe(true)}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Credit/Debit Card (Stripe)
          </Button>
          <Button className="w-full" variant="outline">
            <Wallet className="mr-2 h-4 w-4" />
            Fawry (Egypt)
          </Button>
          <Button className="w-full" variant="outline">
            Cash on Delivery
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Secure Payment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <StripeProvider
          amount={amount}
          customerEmail={customerEmail}
          orderId={orderId}
        >
          <StripeCheckoutForm
            amount={amount}
            orderId={orderId}
            onSuccess={onSuccess}
            onCancel={onCancel}
          />
        </StripeProvider>
      </CardContent>
    </Card>
  );
}
