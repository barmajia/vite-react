import { lazy, Suspense } from "react";
import { RouteObject } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/features/services/dashboard/components/layout/DashboardLayout";

import { RouteSkeleton } from "@/components/shared/RouteSkeleton";
import { ComingSoon } from "@/components/shared/ComingSoon";

// Lazy load specialized vertical pages
const ServicesLayout = lazy(() =>
  import("@/features/services/layouts/ServicesLayout").then((m) => ({
    default: m.default,
  })),
);
const ProgrammerLanding = lazy(() =>
  import("@/features/services/pages/ProgrammerLanding").then((m) => ({
    default: m.default,
  })),
);
const TranslatorLanding = lazy(() =>
  import("@/features/services/pages/TranslatorLanding").then((m) => ({
    default: m.default,
  })),
);
const DesignerLanding = lazy(() =>
  import("@/features/services/pages/DesignerLanding").then((m) => ({
    default: m.default,
  })),
);
const HomeServicesLanding = lazy(() =>
  import("@/features/services/pages/HomeServicesLanding").then((m) => ({
    default: m.default,
  })),
);
const ServiceProviderSignup = lazy(() =>
  import("@/features/services/pages/ServiceProviderSignup").then((m) => ({
    default: m.default,
  })),
);
const ServiceProviderLogin = lazy(() =>
  import("@/features/services/pages/ServiceProviderLogin").then((m) => ({
    default: m.default,
  })),
);
const ServicesSignupLanding = lazy(() =>
  import("@/features/services/pages/ServicesSignupLanding").then((m) => ({
    default: m.ServicesSignupLanding,
  })),
);

// Existing service pages
const ServicesHome = lazy(() =>
  import("@/features/services/pages/ServicesHome").then((m) => ({
    default: m.ServicesHome,
  })),
);
const ServiceCategoryPage = lazy(() =>
  import("@/features/services/pages/ServiceCategoryPage").then((m) => ({
    default: m.ServiceCategoryPage,
  })),
);
const ServiceDetailPage = lazy(() =>
  import("@/features/services/pages/ServiceDetailPage").then((m) => ({
    default: m.ServiceDetailPage,
  })),
);
const ProviderProfilePage = lazy(() =>
  import("@/features/services/pages/ProviderProfilePage").then((m) => ({
    default: m.default,
  })),
);
const ServiceBookingPage = lazy(() =>
  import("@/features/services/bookings/pages/ServiceBookingPage").then((m) => ({
    default: m.ServiceBookingPage,
  })),
);
const CreateProviderProfile = lazy(() =>
  import("@/features/services/pages/CreateProviderProfile").then((m) => ({
    default: m.CreateProviderProfile,
  })),
);
const CreateServiceListing = lazy(() =>
  import("@/features/services/pages/CreateServiceListing").then((m) => ({
    default: m.CreateServiceListing,
  })),
);
const ServiceOnboardingWizard = lazy(() =>
  import("@/features/services/components/ServiceOnboardingWizard").then(
    (m) => ({ default: m.ServiceOnboardingWizard }),
  ),
);
const DashboardHome = lazy(() =>
  import("@/features/services/dashboard/pages/DashboardHome").then((m) => ({
    default: m.DashboardHome,
  })),
);
const BookingsPage = lazy(() =>
  import("@/features/services/dashboard/pages/BookingsPage").then((m) => ({
    default: m.BookingsPage,
  })),
);
const ProjectsPage = lazy(() =>
  import("@/features/services/dashboard/pages/Projects").then((m) => ({
    default: m.ProjectsPage,
  })),
);
const ListingsPage = lazy(() =>
  import("@/features/services/dashboard/pages/Listings").then((m) => ({
    default: m.ListingsPage,
  })),
);
const FinancePage = lazy(() =>
  import("@/features/services/dashboard/pages/Finance").then((m) => ({
    default: m.FinancePage,
  })),
);
const ClientsPage = lazy(() =>
  import("@/features/services/dashboard/pages/Clients").then((m) => ({
    default: m.ClientsPage,
  })),
);
const SettingsPage = lazy(() =>
  import("@/features/services/dashboard/pages/Settings").then((m) => ({
    default: m.SettingsPage,
  })),
);
const ProjectWorkspace = lazy(() =>
  import("../features/services/pages/ProjectWorkspace").then((m) => ({
    default: m.ProjectWorkspace,
  })),
);
const ServicesMessagesPage = lazy(() =>
  import("../features/services/pages/ServicesMessagesPage").then((m) => ({
    default: m.ServicesMessagesPage,
  })),
);

// Route Structure

export const servicesRoutes: RouteObject[] = [
  {
    path: "services",
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <ServicesHome />
          </Suspense>
        ),
      },
      // Specialized Verticals wrapped in ServicesLayout
      {
        element: <ServicesLayout />,
        children: [
          {
            path: "programmer",
            element: (
              <Suspense fallback={<RouteSkeleton />}>
                <ProgrammerLanding />
              </Suspense>
            ),
          },
          {
            path: "translator",
            element: (
              <Suspense fallback={<RouteSkeleton />}>
                <TranslatorLanding />
              </Suspense>
            ),
          },
          {
            path: "designer",
            element: (
              <Suspense fallback={<RouteSkeleton />}>
                <DesignerLanding />
              </Suspense>
            ),
          },
          {
            path: "home",
            element: (
              <Suspense fallback={<RouteSkeleton />}>
                <HomeServicesLanding />
              </Suspense>
            ),
          },
        ],
      },
      // Specialized Auth
      {
        path: "signup",
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <ServicesSignupLanding />
          </Suspense>
        ),
      },
      {
        path: "provider/signup",
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <ServiceProviderSignup />
          </Suspense>
        ),
      },
      {
        path: "provider/login",
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <ServiceProviderLogin />
          </Suspense>
        ),
      },
      {
        path: ":categorySlug",
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <ServiceCategoryPage />
          </Suspense>
        ),
      },
      {
        path: ":categorySlug/:subcategorySlug",
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <ServiceCategoryPage />
          </Suspense>
        ),
      },
      {
        path: "listing/:listingId",
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <ServiceDetailPage />
          </Suspense>
        ),
      },
      {
        path: "listing/:listingId/book",
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <ServiceBookingPage />
          </Suspense>
        ),
      },
      {
        path: "provider/:providerId",
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <ProviderProfilePage />
          </Suspense>
        ),
      },
      {
        path: "chat",
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <ServicesMessagesPage />
          </Suspense>
        ),
      },
      {
        path: "chat/:conversationId",
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <ServicesMessagesPage />
          </Suspense>
        ),
      },
      // Services Dashboard
      {
        path: "dashboard",
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
            path: "bookings",
            element: (
              <Suspense fallback={<RouteSkeleton />}>
                <BookingsPage />
              </Suspense>
            ),
          },
          {
            path: "projects",
            element: (
              <Suspense fallback={<RouteSkeleton />}>
                <ProjectsPage />
              </Suspense>
            ),
          },
          {
            path: "project/:projectId",
            element: (
              <Suspense fallback={<RouteSkeleton />}>
                <ProjectWorkspace />
              </Suspense>
            ),
          },
          {
            path: "listings",
            element: (
              <Suspense fallback={<RouteSkeleton />}>
                <ListingsPage />
              </Suspense>
            ),
          },
          {
            path: "finance",
            element: (
              <Suspense fallback={<RouteSkeleton />}>
                <FinancePage />
              </Suspense>
            ),
          },
          {
            path: "clients",
            element: (
              <Suspense fallback={<RouteSkeleton />}>
                <ClientsPage />
              </Suspense>
            ),
          },
          {
            path: "settings",
            element: (
              <Suspense fallback={<RouteSkeleton />}>
                <SettingsPage />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: "dashboard/create-profile",
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <CreateProviderProfile />
          </Suspense>
        ),
      },
      {
        path: "dashboard/create-listing",
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <CreateServiceListing />
          </Suspense>
        ),
      },
      {
        path: "dashboard/onboard",
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <ServiceOnboardingWizard />
          </Suspense>
        ),
      },
      {
        path: "onboarding",
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <ServiceOnboardingWizard />
          </Suspense>
        ),
      },
    ],
  },
];
