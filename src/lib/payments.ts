/**
 * Payment Service
 *
 * Handles payment intent creation and payment processing
 */

import { supabase } from "./supabase";

export interface PaymentIntentRequest {
  order_id: string;
  payment_method?: "stripe" | "fawry" | "cod";
  save_card?: boolean;
}

export interface PaymentIntentResponse {
  success: boolean;
  payment_intent_id: string;
  client_secret: string;
  amount: number;
  currency: string;
  order_id: string;
  checkout_url?: string;
  redirect_to?: string;
}

/**
 * Create a payment intent via Supabase Edge Function
 */
export async function createPaymentIntent(
  request: PaymentIntentRequest,
): Promise<PaymentIntentResponse> {
  try {
    // Call Supabase Edge Function to create payment intent
    const { data, error } = await supabase.functions.invoke(
      "create-payment-intent",
      {
        body: request,
      },
    );

    if (error) {
      console.error("Error creating payment intent:", error);
      throw new Error(error.message || "Failed to create payment intent");
    }

    return data;
  } catch (error) {
    console.error("Payment intent creation failed:", error);
    throw error;
  }
}

/**
 * Confirm payment and update order status
 */
export async function confirmPayment(
  paymentIntentId: string,
  orderId: string,
): Promise<boolean> {
  try {
    const { error } = await supabase.functions.invoke("confirm-payment", {
      body: {
        paymentIntentId,
        orderId,
      },
    });

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Payment confirmation failed:", error);
    return false;
  }
}

/**
 * Process Fawry payment (Egypt)
 */
export async function processFawryPayment(
  orderId: string,
  customerMobile: string,
): Promise<{ paymentUrl: string }> {
  try {
    const { data, error } = await supabase.functions.invoke(
      "create-fawry-payment",
      {
        body: {
          orderId,
          customerMobile,
        },
      },
    );

    if (error) {
      throw error;
    }

    return {
      paymentUrl: data.paymentUrl,
    };
  } catch (error) {
    console.error("Fawry payment failed:", error);
    throw error;
  }
}

/**
 * Validate card amount
 */
export function validateCardAmount(amount: number): {
  valid: boolean;
  error?: string;
} {
  if (amount <= 0) {
    return { valid: false, error: "Amount must be greater than 0" };
  }

  if (amount > 999999) {
    return { valid: false, error: "Amount exceeds maximum limit" };
  }

  return { valid: true };
}
