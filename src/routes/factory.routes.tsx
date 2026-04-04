import { RouteObject } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const RouteSkeleton = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// Lazy load factory pages
const FactoryDashboardPage = lazy(() => import('@/pages/factory/FactoryDashboardPage').then(m => ({ default: m.FactoryDashboardPage })));
const FactoryProductionPage = lazy(() => import('@/pages/factory/FactoryProductionPage').then(m => ({ default: m.FactoryProductionPage })));
const FactoryQuotesPage = lazy(() => import('@/pages/factory/FactoryQuotesPage').then(m => ({ default: m.FactoryQuotesPage })));
const FactoryConnectionsPage = lazy(() => import('@/pages/factory/FactoryConnectionsPage').then(m => ({ default: m.FactoryConnectionsPage })));
const FactoryStartChat = lazy(() => import('@/pages/factory/FactoryStartChat').then(m => ({ default: m.FactoryStartChat })));

export const factoryRoutes: RouteObject[] = [
  {
    path: 'factory',
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <FactoryDashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'production',
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <FactoryProductionPage />
          </Suspense>
        ),
      },
      {
        path: 'quotes',
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <FactoryQuotesPage />
          </Suspense>
        ),
      },
      {
        path: 'connections',
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <FactoryConnectionsPage />
          </Suspense>
        ),
      },
      {
        path: 'start-chat',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<RouteSkeleton />}>
              <FactoryStartChat />
            </Suspense>
          </ProtectedRoute>
        ),
      },
    ],
  },
];
