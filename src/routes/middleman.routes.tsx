import { lazy, Suspense } from "react";
import { RouteObject } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MiddlemanLayout } from "@/features/middleman/components/MiddlemanLayout";
import { RouteSkeleton } from "@/components/shared/RouteSkeleton";
import { MiddlemanWelcome } from "@/features/middleman/pages/MiddlemanWelcome";

const MiddlemanDashboard = lazy(() =>
  import("@/features/middleman/pages/MiddlemanDashboard").then((m) => ({
    default: m.MiddlemanDashboard,
  })),
);
const MiddlemanDeals = lazy(() =>
  import("@/pages/middleman/MiddlemanDeals").then((m) => ({
    default: m.MiddlemanDeals,
  })),
);
const MiddlemanCreateDeal = lazy(() =>
  import("@/features/middleman/pages/MiddlemanDealNew").then((m) => ({
    default: m.MiddlemanDealNew,
  })),
);
const MiddlemanDealDetails = lazy(() =>
  import("@/pages/middleman/MiddlemanDealDetails").then((m) => ({
    default: m.MiddlemanDealDetails,
  })),
);
const MiddlemanOrders = lazy(() =>
  import("@/pages/middleman/MiddlemanOrders").then((m) => ({
    default: m.MiddlemanOrders,
  })),
);
const MiddlemanAnalytics = lazy(() =>
  import("@/pages/middleman/MiddlemanAnalytics").then((m) => ({
    default: m.MiddlemanAnalytics,
  })),
);
const MiddlemanConnections = lazy(() =>
  import("@/pages/middleman/MiddlemanConnections").then((m) => ({
    default: m.MiddlemanConnections,
  })),
);
const MiddlemanCommission = lazy(() =>
  import("@/pages/middleman/MiddlemanCommission").then((m) => ({
    default: m.MiddlemanCommission,
  })),
);
const MiddlemanProfile = lazy(() =>
  import("@/pages/middleman/MiddlemanProfile").then((m) => ({
    default: m.MiddlemanProfile,
  })),
);
const MiddlemanSettings = lazy(() =>
  import("@/pages/middleman/MiddlemanSettings").then((m) => ({
    default: m.MiddlemanSettings,
  })),
);
const MiddlemanStoreSettings = lazy(() =>
  import("@/pages/middleman/MiddlemanStoreSettings").then((m) => ({
    default: m.MiddlemanStoreSettings,
  })),
);
const MiddlemanStoreOrders = lazy(() =>
  import("@/pages/middleman/MiddlemanStoreOrders").then((m) => ({
    default: m.MiddlemanStoreOrders,
  })),
);
const ProductDiscovery = lazy(() =>
  import("@/features/middleman/pages/ProductDiscovery").then((m) => ({
    default: m.ProductDiscovery,
  })),
);
const TemplateSelection = lazy(() =>
  import("@/features/middleman/pages/TemplateSelection").then((m) => ({
    default: m.TemplateSelection,
  })),
);
const StoreSetup = lazy(() =>
  import("@/features/middleman/pages/StoreSetup").then((m) => ({
    default: m.StoreSetup,
  })),
);
const PublicStorePage = lazy(() =>
  import("@/features/middleman/pages/PublicStorePage").then((m) => ({
    default: m.PublicStorePage,
  })),
);

const MyWebsiteBuilder = lazy(() =>
  import("@/pages/dashboard/MyWebsiteBuilder").then((m) => ({
    default: m.default,
  })),
);

export const middlemanRoutes: RouteObject = {
  path: "/middleman",
  children: [
    {
      index: true,
      element: (
        <Suspense fallback={<RouteSkeleton />}>
          <MiddlemanWelcome />
        </Suspense>
      ),
    },
    // TESTING MODE - All routes unprotected
    {
      element: <MiddlemanLayout />,
      children: [
        {
          path: "dashboard",
          element: (
            <Suspense fallback={<RouteSkeleton />}>
              <MiddlemanDashboard />
            </Suspense>
          ),
        },
        {
          path: "deals",
          element: (
            <Suspense fallback={<RouteSkeleton />}>
              <MiddlemanDeals />
            </Suspense>
          ),
        },
        {
          path: "deals/new",
          element: (
            <Suspense fallback={<RouteSkeleton />}>
              <MiddlemanCreateDeal />
            </Suspense>
          ),
        },
        {
          path: "deals/:dealId",
          element: (
            <Suspense fallback={<RouteSkeleton />}>
              <MiddlemanDealDetails />
            </Suspense>
          ),
        },
        {
          path: "orders",
          element: (
            <Suspense fallback={<RouteSkeleton />}>
              <MiddlemanOrders />
            </Suspense>
          ),
        },
        {
          path: "analytics",
          element: (
            <Suspense fallback={<RouteSkeleton />}>
              <MiddlemanAnalytics />
            </Suspense>
          ),
        },
        {
          path: "connections",
          element: (
            <Suspense fallback={<RouteSkeleton />}>
              <MiddlemanConnections />
            </Suspense>
          ),
        },
        {
          path: "commission",
          element: (
            <Suspense fallback={<RouteSkeleton />}>
              <MiddlemanCommission />
            </Suspense>
          ),
        },
        {
          path: "profile",
          element: (
            <Suspense fallback={<RouteSkeleton />}>
              <MiddlemanProfile />
            </Suspense>
          ),
        },
        {
          path: "settings",
          element: (
            <Suspense fallback={<RouteSkeleton />}>
              <MiddlemanSettings />
            </Suspense>
          ),
        },
        {
          path: "settings/store",
          element: (
            <Suspense fallback={<RouteSkeleton />}>
              <MiddlemanStoreSettings />
            </Suspense>
          ),
        },
        {
          path: "settings/orders",
          element: (
            <Suspense fallback={<RouteSkeleton />}>
              <MiddlemanStoreOrders />
            </Suspense>
          ),
        },
        {
          path: "marketplace",
          element: (
            <Suspense fallback={<RouteSkeleton />}>
              <ProductDiscovery />
            </Suspense>
          ),
        },
        {
          path: "template-selection",
          element: (
            <Suspense fallback={<RouteSkeleton />}>
              <TemplateSelection />
            </Suspense>
          ),
        },
        {
          path: "store-setup",
          element: (
            <Suspense fallback={<RouteSkeleton />}>
              <StoreSetup />
            </Suspense>
          ),
        },
        {
          path: "store/:slug",
          element: (
            <Suspense fallback={<RouteSkeleton />}>
              <PublicStorePage />
            </Suspense>
          ),
        },
        {
          path: "website",
          element: (
            <Suspense fallback={<RouteSkeleton />}>
              <MyWebsiteBuilder />
            </Suspense>
          ),
        },
      ],
    },
  ],
};
