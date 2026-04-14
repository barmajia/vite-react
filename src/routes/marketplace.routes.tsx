import { RouteObject } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const RouteSkeleton = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// Lazy load marketplace pages
const MarketplaceGrid = lazy(() => import('@/pages/marketplace/MarketplaceGrid'));
const TemplateDetails = lazy(() => import('@/pages/marketplace/TemplateDetails'));
const MarketplaceCheckout = lazy(() => import('@/pages/marketplace/MarketplaceCheckout'));
const StoreTemplateMarketplace = lazy(() => import('@/pages/marketplace/StoreTemplateMarketplace'));

export const marketplaceRoutes: RouteObject[] = [
  {
    path: 'webmarketplace',
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <MarketplaceGrid />
          </Suspense>
        ),
      },
      {
        path: ':id',
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <TemplateDetails />
          </Suspense>
        ),
      },
{
    path: ':id/checkout',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<RouteSkeleton />}>
          <MarketplaceCheckout />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: 'templates',
    element: (
      <Suspense fallback={<RouteSkeleton />}>
        <StoreTemplateMarketplace />
      </Suspense>
    ),
  },
],
  },
];
