import { AlertTriangle, CheckCircle } from 'lucide-react';

interface LimitProgressBarProps {
  current: number;
  limit: number;
  pct: number;
  tier?: string;
}

export function LimitProgressBar({ current, limit, pct, tier = 'tier_75k' }: LimitProgressBarProps) {
  const isCritical = pct >= 90;
  const isDanger = pct >= 100;
  
  const tierLabel = tier.replace('tier_', '').toUpperCase().replace(/(\d+)K/, '$1K').replace(/(\d+)M/, '$1M');

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium flex items-center gap-1">
          {isDanger ? (
            <AlertTriangle size={14} className="text-red-500" />
          ) : isCritical ? (
            <AlertTriangle size={14} className="text-orange-500" />
          ) : (
            <CheckCircle size={14} className="text-green-500" />
          )}
          {tierLabel} Tier Limit
        </span>
        <span className="text-gray-600">
          {current.toLocaleString()} / {limit.toLocaleString()} EGP ({Math.round(pct)}%)
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${
            isDanger ? 'bg-red-500' : isCritical ? 'bg-orange-500' : 'bg-green-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {isDanger && (
        <p className="text-xs text-red-600 font-medium">
          ⚠️ Limit reached. Remove items to add more.
        </p>
      )}
    </div>
  );
}