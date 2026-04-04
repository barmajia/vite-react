import { RouteObject } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const RouteSkeleton = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// Lazy load wallet pages
const WalletDashboard = lazy(() => import('@/pages/wallet/WalletDashboard').then(m => ({ default: m.WalletDashboard })));
const TransactionHistory = lazy(() => import('@/pages/wallet/TransactionHistory').then(m => ({ default: m.TransactionHistory })));
const PayoutRequest = lazy(() => import('@/pages/wallet/PayoutRequest').then(m => ({ default: m.PayoutRequest })));
const PayoutHistory = lazy(() => import('@/pages/wallet/PayoutHistory').then(m => ({ default: m.PayoutHistory })));

export const walletRoutes: RouteObject[] = [
  {
    path: 'wallet',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<RouteSkeleton />}>
          <WalletDashboard />
        </Suspense>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <WalletDashboard />
          </Suspense>
        ),
      },
      {
        path: 'transactions',
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <TransactionHistory />
          </Suspense>
        ),
      },
      {
        path: 'payouts',
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <PayoutRequest />
          </Suspense>
        ),
      },
      {
        path: 'payout-history',
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <PayoutHistory />
          </Suspense>
        ),
      },
    ],
  },
];
