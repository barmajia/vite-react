import { RouteObject } from "react-router-dom";
import { lazy, Suspense } from "react";
import { SellerLayout } from "@/features/seller/components/SellerLayout";
import { SellerWelcome } from "@/features/seller/pages/SellerWelcome";

const RouteSkeleton = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// Lazy load seller pages
const SellerDashboard = lazy(() =>
  import("@/features/seller/pages/SellerDashboard").then((m) => ({
    default: m.SellerDashboard,
  })),
);

export const sellerRoutes: RouteObject = {
  path: "/seller",
  element: <SellerWelcome />,
  children: [
    {
      index: true,
      element: (
        <Suspense fallback={<RouteSkeleton />}>
          <SellerDashboard />
        </Suspense>
      ),
    },
    {
      path: "dashboard",
      element: (
        <Suspense fallback={<RouteSkeleton />}>
          <SellerDashboard />
        </Suspense>
      ),
    },
  ],
};
