import { RouteObject } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/features/services/dashboard/components/layout/DashboardLayout';
import HealthLayout from '@/features/health/layouts/HealthLayout';

const RouteSkeleton = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// Lazy load service pages
const ServicesHome = lazy(() => import('@/features/services/pages/ServicesHome').then(m => ({ default: m.ServicesHome })));
const ServiceCategoryPage = lazy(() => import('@/features/services/pages/ServiceCategoryPage').then(m => ({ default: m.ServiceCategoryPage })));
const ServiceDetailPage = lazy(() => import('@/features/services/pages/ServiceDetailPage').then(m => ({ default: m.ServiceDetailPage })));
const ProviderProfilePage = lazy(() => import('@/features/services/pages/ProviderProfilePage').then(m => ({ default: m.ProviderProfilePage })));
const ServiceBookingPage = lazy(() => import('@/features/services/bookings/pages/ServiceBookingPage').then(m => ({ default: m.ServiceBookingPage })));
const CreateProviderProfile = lazy(() => import('@/features/services/pages/CreateProviderProfile').then(m => ({ default: m.CreateProviderProfile })));
const CreateServiceListing = lazy(() => import('@/features/services/pages/CreateServiceListing').then(m => ({ default: m.CreateServiceListing })));
const ServiceOnboardingWizard = lazy(() => import('@/features/services/components/ServiceOnboardingWizard').then(m => ({ default: m.ServiceOnboardingWizard })));
const DashboardHome = lazy(() => import('@/features/services/dashboard/pages/DashboardHome').then(m => ({ default: m.DashboardHome })));
const BookingsPage = lazy(() => import('@/features/services/dashboard/pages/BookingsPage').then(m => ({ default: m.BookingsPage })));

// Healthcare
const HealthLanding = lazy(() => import('@/features/health/pages/HealthLanding').then(m => ({ default: m.default })));
const DoctorList = lazy(() => import('@/features/health/pages/DoctorList').then(m => ({ default: m.default })));
const DoctorSignup = lazy(() => import('@/features/health/pages/DoctorSignup').then(m => ({ default: m.default })));
const DoctorPendingApproval = lazy(() => import('@/features/health/pages/DoctorPendingApproval').then(m => ({ default: m.default })));
const BookingPage = lazy(() => import('@/features/health/pages/BookingPage').then(m => ({ default: m.default })));
const PatientDashboard = lazy(() => import('@/features/health/pages/PatientDashboard').then(m => ({ default: m.default })));
const DoctorDashboard = lazy(() => import('@/features/health/pages/DoctorDashboard').then(m => ({ default: m.default })));
const AdminVerification = lazy(() => import('@/features/health/pages/AdminVerification').then(m => ({ default: m.default })));
const ConsultationRoom = lazy(() => import('@/features/health/pages/ConsultationRoom').then(m => ({ default: m.default })));
const PharmacyList = lazy(() => import('@/features/health/pages/PharmacyList').then(m => ({ default: m.default })));
const ConsentForm = lazy(() => import('@/features/health/pages/ConsentForm').then(m => ({ default: m.ConsentForm })));
const DataExport = lazy(() => import('@/features/health/pages/DataExport').then(m => ({ default: m.DataExport })));

// Placeholder
const ComingSoon = ({ title = "Page" }: { title?: string }) => (
  <Suspense fallback={<RouteSkeleton />}>
    <div className="text-center py-12">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-muted-foreground mt-2">Coming soon</p>
    </div>
  </Suspense>
);

export const servicesRoutes: RouteObject[] = [
  {
    path: 'services',
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <ServicesHome />
          </Suspense>
        ),
      },
      {
        path: ':categorySlug',
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <ServiceCategoryPage />
          </Suspense>
        ),
      },
      {
        path: ':categorySlug/:subcategorySlug',
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <ServiceCategoryPage />
          </Suspense>
        ),
      },
      {
        path: 'listing/:listingId',
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <ServiceDetailPage />
          </Suspense>
        ),
      },
      {
        path: 'listing/:listingId/book',
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <ServiceBookingPage />
          </Suspense>
        ),
      },
      {
        path: 'provider/:providerId',
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <ProviderProfilePage />
          </Suspense>
        ),
      },
      // Services Dashboard
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<RouteSkeleton />}>
                <DashboardHome />
              </Suspense>
            ),
          },
          {
            path: 'bookings',
            element: (
              <Suspense fallback={<RouteSkeleton />}>
                <BookingsPage />
              </Suspense>
            ),
          },
          {
            path: 'projects',
            element: <ComingSoon title="Projects" />,
          },
          {
            path: 'listings',
            element: <ComingSoon title="Listings" />,
          },
          {
            path: 'finance',
            element: <ComingSoon title="Finance" />,
          },
          {
            path: 'clients',
            element: <ComingSoon title="Clients" />,
          },
          {
            path: 'settings',
            element: <ComingSoon title="Settings" />,
          },
        ],
      },
      {
        path: 'dashboard/create-profile',
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <CreateProviderProfile />
          </Suspense>
        ),
      },
      {
        path: 'dashboard/create-listing',
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <CreateServiceListing />
          </Suspense>
        ),
      },
      {
        path: 'dashboard/onboard',
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <ServiceOnboardingWizard />
          </Suspense>
        ),
      },
      {
        path: 'onboarding',
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <ServiceOnboardingWizard />
          </Suspense>
        ),
      },
      // Healthcare sub-vertical
      {
        path: 'health',
        element: <HealthLayout />,
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<RouteSkeleton />}>
                <HealthLanding />
              </Suspense>
            ),
          },
          {
            path: 'doctors',
            element: (
              <Suspense fallback={<RouteSkeleton />}>
                <DoctorList />
              </Suspense>
            ),
          },
          {
            path: 'doctor/signup',
            element: (
              <Suspense fallback={<RouteSkeleton />}>
                <DoctorSignup />
              </Suspense>
            ),
          },
          {
            path: 'doctor/pending-approval',
            element: (
              <Suspense fallback={<RouteSkeleton />}>
                <DoctorPendingApproval />
              </Suspense>
            ),
          },
          {
            path: 'book/:id',
            element: (
              <Suspense fallback={<RouteSkeleton />}>
                <BookingPage />
              </Suspense>
            ),
          },
          {
            path: 'patient/dashboard',
            element: (
              <Suspense fallback={<RouteSkeleton />}>
                <PatientDashboard />
              </Suspense>
            ),
          },
          {
            path: 'doctor/dashboard',
            element: (
              <Suspense fallback={<RouteSkeleton />}>
                <DoctorDashboard />
              </Suspense>
            ),
          },
          {
            path: 'admin/verify',
            element: (
              <Suspense fallback={<RouteSkeleton />}>
                <AdminVerification />
              </Suspense>
            ),
          },
          {
            path: 'consult/:id',
            element: (
              <Suspense fallback={<RouteSkeleton />}>
                <ConsultationRoom />
              </Suspense>
            ),
          },
          {
            path: 'pharmacies',
            element: (
              <Suspense fallback={<RouteSkeleton />}>
                <PharmacyList />
              </Suspense>
            ),
          },
          {
            path: 'patient/consent/:appointmentId',
            element: (
              <Suspense fallback={<RouteSkeleton />}>
                <ConsentForm />
              </Suspense>
            ),
          },
          {
            path: 'patient/data-export',
            element: (
              <Suspense fallback={<RouteSkeleton />}>
                <DataExport />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },
];
