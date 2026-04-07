// src/components/shared/RouteSkeleton.tsx
import React from 'react';

export const RouteSkeleton = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="relative">
      <div className="h-16 w-16 rounded-full border-4 border-primary/20 animate-pulse"></div>
      <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-t-4 border-primary animate-spin"></div>
    </div>
  </div>
);
