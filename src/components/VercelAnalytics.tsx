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

  // Check if running on Vercel or has analytics ID configured
  const isVercel = import.meta.env.VITE_VERCEL_ENV || import.meta.env.VERCEL_ENV;
  const hasAnalyticsId = import.meta.env.VITE_VERCEL_ANALYTICS_ID;

  return (
    <>
      {/* Analytics requires explicit configuration */}
      {hasAnalyticsId && <Analytics />}
      {/* Speed Insights works automatically on Vercel deployments */}
      {(isVercel || hasAnalyticsId) && <SpeedInsights />}
    </>
  );
}
