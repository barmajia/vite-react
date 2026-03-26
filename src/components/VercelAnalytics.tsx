import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

interface VercelAnalyticsProps {
  disabled?: boolean;
}

export function VercelAnalytics({ disabled = false }: VercelAnalyticsProps) {
  // Don't render if explicitly disabled
  if (disabled) {
    return null;
  }

  return (
    <>
      {/* Analytics requires VITE_VERCEL_ANALYTICS_ID env variable */}
      {import.meta.env.VITE_VERCEL_ANALYTICS_ID && <Analytics />}
      {/* SpeedInsights works automatically on Vercel without env variables */}
      <SpeedInsights />
    </>
  );
}
