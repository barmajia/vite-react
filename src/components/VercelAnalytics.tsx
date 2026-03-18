import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

interface VercelAnalyticsProps {
  disabled?: boolean;
}

export function VercelAnalytics({ disabled = false }: VercelAnalyticsProps) {
  // Don't render analytics if disabled or no Vercel environment
  if (disabled || !import.meta.env.VITE_VERCEL_ANALYTICS_ID) {
    return null;
  }

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
