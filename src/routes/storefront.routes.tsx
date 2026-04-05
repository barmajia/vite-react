import { RouteObject } from 'react-router-dom';
import { lazy, Suspense } from 'react';

const RouteSkeleton = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// Lazy load storefront
const StorefrontPage = lazy(() => import('@/pages/storefront/StorefrontPage'));

// Dynamic storefront route - must be LAST to avoid conflicts
export const storefrontRoutes: RouteObject[] = [
  {
    path: ':username',
    element: (
      <Suspense fallback={<RouteSkeleton />}>
        <StorefrontPage />
      </Suspense>
    ),
  },
];
