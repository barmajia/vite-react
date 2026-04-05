import { RouteObject } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const RouteSkeleton = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// Lazy load middleman pages
const MiddlemanDashboard = lazy(() =>
  import("@/pages/middleman/MiddlemanDashboard").then((m) => ({
    default: m.MiddlemanDashboard,
  })),
);
const MiddlemanDeals = lazy(() =>
  import("@/pages/middleman/MiddlemanDeals").then((m) => ({
    default: m.MiddlemanDeals,
  })),
);
const MiddlemanCreateDeal = lazy(() =>
  import("@/pages/middleman/MiddlemanCreateDeal").then((m) => ({
    default: m.MiddlemanCreateDeal,
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

export const middlemanRoutes: RouteObject[] = [
  {
    path: "middleman",
    element: (
      <ProtectedRoute allowedAccountTypes={["middleman"]}>
        <Suspense fallback={<RouteSkeleton />}>
          <MiddlemanDashboard />
        </Suspense>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
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
    ],
  },
];
