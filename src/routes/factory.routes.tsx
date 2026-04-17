import { lazy, Suspense } from "react";
import { RouteObject } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { FactoryLayout } from "@/features/factory/components/FactoryLayout";
import { RouteSkeleton } from "@/components/shared/RouteSkeleton";
import { FactoryWelcome } from "@/features/factory/pages/FactoryWelcome";

const FactoryDashboard = lazy(() =>
  import("@/features/factory/pages/FactoryDashboard").then((m) => ({
    default: m.FactoryDashboard,
  })),
);
const FactoryProduction = lazy(() =>
  import("@/features/factory/pages/FactoryProduction").then((m) => ({
    default: m.FactoryProduction,
  })),
);
const FactoryConnections = lazy(() =>
  import("@/features/factory/pages/FactoryConnections").then((m) => ({
    default: m.FactoryConnections,
  })),
);

const MyWebsiteBuilder = lazy(() =>
  import("@/pages/dashboard/MyWebsiteBuilder").then((m) => ({
    default: m.default,
  })),
);

export const factoryRoutes: RouteObject = {
  path: "/factory",
  children: [
    {
      index: true,
      element: (
        <Suspense fallback={<RouteSkeleton />}>
          <FactoryWelcome />
        </Suspense>
      ),
    },
    {
      element: (
        <ProtectedRoute allowedAccountTypes={["factory"]}>
          <FactoryLayout />
        </ProtectedRoute>
      ),
      children: [
        {
          path: "dashboard",
          element: (
            <Suspense fallback={<RouteSkeleton />}>
              <FactoryDashboard />
            </Suspense>
          ),
        },
    {
      path: "production",
      element: (
        <Suspense fallback={<RouteSkeleton />}>
          <FactoryProduction />
        </Suspense>
      ),
    },
    {
      path: "connections",
      element: (
        <Suspense fallback={<RouteSkeleton />}>
          <FactoryConnections />
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
