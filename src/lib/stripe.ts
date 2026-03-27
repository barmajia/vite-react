/**
 * Stripe Configuration
 *
 * Initialize Stripe with publishable key from environment variables
 */

import { loadStripe, Stripe } from "@stripe/stripe-js";

// Get publishable key from environment
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.warn(
    "⚠️ Missing Stripe publishable key. Set VITE_STRIPE_PUBLISHABLE_KEY in your .env file.",
  );
}

// Initialize Stripe
let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(stripePublishableKey || "");
  }
  return stripePromise;
};

// Stripe options
export const stripeOptions = {
  locale: "en",
  appearance: {
    theme: "stripe" as const,
    variables: {
      colorPrimary: "#0570de",
      colorBackground: "#ffffff",
      colorText: "#30313d",
      colorDanger: "#df1b41",
      fontFamily: "Inter, system-ui, sans-serif",
      spacingUnit: "4px",
      borderRadius: "8px",
    },
  },
} as const;
