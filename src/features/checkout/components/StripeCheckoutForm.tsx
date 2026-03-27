/**
 * Stripe Checkout Form
 * 
 * Secure credit/debit card payment form using Stripe Elements
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, AlertCircle } from 'lucide-react';

interface StripeCheckoutFormProps {
  amount: number;
  orderId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function StripeCheckoutForm({
  amount,
  orderId,
  onSuccess,
  onCancel,
}: StripeCheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Confirm the payment
      const { error: stripeError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // Return URL after payment completion
          return_url: `${window.location.origin}/order-success/${orderId}`,
        },
        redirect: 'if_required',
      });

      if (stripeError) {
        throw new Error(stripeError.message || 'Payment failed');
      }

      // Payment succeeded
      toast.success('Payment successful!');
      
      if (onSuccess) {
        onSuccess();
      }

      // Navigate to order success page
      if (orderId) {
        navigate(`/order-success/${orderId}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Payment Element */}
      <div className="border rounded-lg p-4 bg-white">
        <PaymentElement
          options={{
            layout: 'tabs',
            paymentMethodOrder: ['card', 'klarna', 'afterpay_clearpay'],
          }}
        />
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Amount Display */}
      <div className="flex justify-between items-center py-4 border-t">
        <span className="text-sm text-gray-600">Total Amount</span>
        <span className="text-xl font-bold text-gray-900">
          ${amount.toFixed(2)}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={!stripe || isLoading}
          className="flex-1"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pay ${amount.toFixed(2)}
            </>
          )}
        </Button>

        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            size="lg"
          >
            Cancel
          </Button>
        )}
      </div>

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mt-4">
        <CreditCard className="h-4 w-4" />
        <span>Secure payment powered by Stripe</span>
      </div>
    </form>
  );
}
