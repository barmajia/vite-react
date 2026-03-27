/**
 * Stripe Provider Component
 *
 * Wraps the app with Stripe Elements provider
 */

import { useState, useEffect } from "react";
import { Elements } from "@stripe/react-stripe-js";
import type { StripeElementsOptions } from "@stripe/stripe-js";
import { getStripe, stripeOptions } from "@/lib/stripe";
import { createPaymentIntent } from "@/lib/payments";

interface StripeProviderProps {
  children: React.ReactNode;
  orderId: string;
  amount?: number; // Optional - will be fetched from order
  customerEmail?: string;
}

export function StripeProvider({
  children,
  orderId,
  amount,
  customerEmail,
}: StripeProviderProps) {
  const [clientSecret, setClientSecret] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Create payment intent when component mounts
    const createIntent = async () => {
      try {
        setLoading(true);

        const response = await createPaymentIntent({
          order_id: orderId,
          payment_method: "stripe",
        });

        if (response.client_secret) {
          setClientSecret(response.client_secret);
        }
      } catch (error) {
        console.error("Failed to create payment intent:", error);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      createIntent();
    }
  }, [orderId]);

  if (loading || !clientSecret) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading payment form...</p>
        </div>
      </div>
    );
  }

  const options: StripeElementsOptions = {
    clientSecret,
    ...stripeOptions,
  };

  return (
    <Elements options={options} stripe={getStripe()}>
      {children}
    </Elements>
  );
}
