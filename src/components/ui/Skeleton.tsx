import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width = '100%',
  height = '1rem',
  borderRadius = '0.375rem',
  animation = 'pulse',
}) => {
  const animationClass = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  }[animation];

  return (
    <div
      className={`bg-gray-200 ${animationClass} ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius,
      }}
      aria-hidden="true"
    />
  );
};

export const CardSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
    <Skeleton height="1.5rem" width="60%" />
    <Skeleton height="1rem" width="90%" />
    <Skeleton height="1rem" width="80%" />
    <div className="flex gap-2 pt-4">
      <Skeleton height="2.5rem" width="50%" />
      <Skeleton height="2.5rem" width="50%" />
    </div>
  </div>
);

export const ProductCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl shadow-md overflow-hidden">
    <Skeleton height="200px" width="100%" />
    <div className="p-4 space-y-3">
      <Skeleton height="1.25rem" width="80%" />
      <Skeleton height="1rem" width="60%" />
      <div className="flex justify-between items-center">
        <Skeleton height="1.5rem" width="40%" />
        <Skeleton height="2rem" width="2rem" borderRadius="50%" />
      </div>
    </div>
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4,
}) => (
  <div className="bg-white rounded-xl shadow-md overflow-hidden">
    <div className="p-4 border-b border-gray-100">
      <Skeleton height="1.5rem" width="30%" />
    </div>
    <div className="divide-y divide-gray-100">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} height="1rem" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const ProfileSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
    <div className="flex items-center gap-4">
      <Skeleton height="4rem" width="4rem" borderRadius="50%" />
      <div className="flex-1 space-y-2">
        <Skeleton height="1.5rem" width="60%" />
        <Skeleton height="1rem" width="40%" />
      </div>
    </div>
    <div className="space-y-3">
      <Skeleton height="1rem" />
      <Skeleton height="1rem" />
      <Skeleton height="1rem" width="80%" />
    </div>
  </div>
);

export const ChatMessageSkeleton: React.FC = () => (
  <div className="flex gap-3">
    <Skeleton height="2.5rem" width="2.5rem" borderRadius="50%" />
    <div className="flex-1 space-y-2">
      <Skeleton height="1rem" width="30%" />
      <Skeleton height="1rem" width="90%" />
      <Skeleton height="1rem" width="70%" />
    </div>
  </div>
);

export default Skeleton;
