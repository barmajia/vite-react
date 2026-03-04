import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
}

export function StarRating({ rating, maxRating = 5, size = 'md', showValue = false }: StarRatingProps) {
  const stars = [];
  const normalizedRating = Math.min(Math.max(rating, 0), maxRating);

  for (let i = 1; i <= maxRating; i++) {
    const fillPercentage = Math.min(Math.max(normalizedRating - (i - 1), 0), 1);
    
    stars.push(
      <div key={i} className="relative">
        <Star
          className={cn(
            size === 'sm' && 'h-4 w-4',
            size === 'md' && 'h-5 w-5',
            size === 'lg' && 'h-6 w-6'
          )}
          fill="none"
          stroke="#D1D5DB"
        />
        <div
          className="absolute top-0 left-0 overflow-hidden"
          style={{ width: `${fillPercentage * 100}%` }}
        >
          <Star
            className={cn(
              'text-primary',
              size === 'sm' && 'h-4 w-4',
              size === 'md' && 'h-5 w-5',
              size === 'lg' && 'h-6 w-6'
            )}
            fill="currentColor"
            stroke="currentColor"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex">{stars}</div>
      {showValue && (
        <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
      )}
    </div>
  );
}
