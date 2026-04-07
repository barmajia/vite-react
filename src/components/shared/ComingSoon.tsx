// src/components/shared/ComingSoon.tsx
import React, { Suspense } from 'react';
import { RouteSkeleton } from './RouteSkeleton';

export const ComingSoon = ({ title = "Page" }: { title?: string }) => (
  <Suspense fallback={<RouteSkeleton />}>
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-12 text-center space-y-8 glass-card rounded-[3.5rem] border-white/5 bg-white/5 shadow-2xl">
      <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 animate-pulse">
         <div className="w-12 h-12 rounded-full border-t-2 border-primary animate-spin" />
      </div>
      <div className="space-y-4">
        <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none">{title} <span className="text-foreground/40 font-black">Nexus</span></h1>
        <p className="text-foreground/40 text-lg font-medium italic max-w-sm">This operational sector is currently under high-fidelity synchronization. Check transmission logs later.</p>
      </div>
    </div>
  </Suspense>
);
