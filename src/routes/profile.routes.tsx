import { RouteObject } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const RouteSkeleton = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// Lazy load profile pages
const ProfilePage = lazy(() => import('@/features/profile/pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const PublicProfilePage = lazy(() => import('@/pages/profile/PublicProfilePage').then(m => ({ default: m.PublicProfilePage })));
const EditProfile = lazy(() => import('@/pages/profile/EditProfile').then(m => ({ default: m.EditProfile })));
const ProfileDirectoryPage = lazy(() => import('@/pages/profile/ProfileDirectoryPage').then(m => ({ default: m.ProfileDirectoryPage })));
const SettingsPage = lazy(() => import('@/features/settings/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const NotificationsPage = lazy(() => import('@/features/notifications/pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })));

// Customer & Seller routes
const OrderTracking = lazy(() => import('@/pages/customer/OrderTracking').then(m => ({ default: m.OrderTracking })));
const CommissionReport = lazy(() => import('@/pages/seller/CommissionReport').then(m => ({ default: m.CommissionReport })));

// Delivery
const DeliveryDashboard = lazy(() => import('@/pages/delivery/DeliveryDashboard').then(m => ({ default: m.DeliveryDashboard })));

export const profileRoutes: RouteObject[] = [
  {
    path: 'profile',
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <ProfilePage />
          </Suspense>
        ),
      },
      {
        path: ':userId',
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <PublicProfilePage />
          </Suspense>
        ),
      },
      {
        path: ':userId/edit',
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <EditProfile />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: 'profiles',
    element: (
      <Suspense fallback={<RouteSkeleton />}>
        <ProfileDirectoryPage />
      </Suspense>
    ),
  },
  {
    path: 'settings',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<RouteSkeleton />}>
          <SettingsPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: 'notifications',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<RouteSkeleton />}>
          <NotificationsPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  // Customer routes
  {
    path: 'customer',
    children: [
      {
        path: 'orders/tracking',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<RouteSkeleton />}>
              <OrderTracking />
            </Suspense>
          </ProtectedRoute>
        ),
      },
    ],
  },
  // Seller routes
  {
    path: 'seller',
    children: [
      {
        path: 'commission',
        element: (
          <ProtectedRoute allowedAccountTypes={['seller']}>
            <Suspense fallback={<RouteSkeleton />}>
              <CommissionReport />
            </Suspense>
          </ProtectedRoute>
        ),
      },
    ],
  },
  // Delivery routes
  {
    path: 'delivery',
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute allowedAccountTypes={['delivery_driver']}>
            <Suspense fallback={<RouteSkeleton />}>
              <DeliveryDashboard />
            </Suspense>
          </ProtectedRoute>
        ),
      },
    ],
  },
];
