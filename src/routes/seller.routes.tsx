import { lazy, Suspense } from "react";
import { RouteObject } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SellerLayout } from "@/features/seller/components/SellerLayout";
import { RouteSkeleton } from "@/components/shared/RouteSkeleton";
import { SellerWelcome } from "@/features/seller/pages/SellerWelcome";
import { AddNewProduct } from "@/features/seller/pages/AddNewProduct";

const SellerDashboard = lazy(() =>
  import("@/features/seller/pages/SellerDashboard").then((m) => ({
    default: m.SellerDashboard,
  })),
);
const SellerProducts = lazy(() =>
  import("@/features/seller/pages/SellerProducts").then((m) => ({
    default: m.SellerProducts,
  })),
);
const SellerOrders = lazy(() =>
  import("@/features/seller/pages/SellerOrders").then((m) => ({
    default: m.SellerOrders,
  })),
);
const SellerAnalytics = lazy(() =>
  import("@/features/seller/pages/SellerAnalytics").then((m) => ({
    default: m.SellerAnalytics,
  })),
);
const SellerWallet = lazy(() =>
  import("@/features/seller/pages/SellerWallet").then((m) => ({
    default: m.SellerWallet,
  })),
);

const MyWebsiteBuilder = lazy(() =>
  import("@/pages/dashboard/MyWebsiteBuilder").then((m) => ({
    default: m.default,
  })),
);

export const sellerRoutes: RouteObject = {
  path: "/seller",
  children: [
    {
      index: true,
      element: (
        <Suspense fallback={<RouteSkeleton />}>
          <SellerWelcome />
        </Suspense>
      ),
    },
    {
      element: (
        <ProtectedRoute allowedAccountTypes={["seller"]}>
          <SellerLayout />
        </ProtectedRoute>
      ),
      children: [
        {
          path: "dashboard",
          element: (
            <Suspense fallback={<RouteSkeleton />}>
              <SellerDashboard />
            </Suspense>
          ),
        },
        {
          path: "products",
          element: (
            <Suspense fallback={<RouteSkeleton />}>
              <SellerProducts />
            </Suspense>
          ),
        },
        {
          path: "products/new",
          element: (
            <Suspense fallback={<RouteSkeleton />}>
              <AddNewProduct />
            </Suspense>
          ),
        },
        {
          path: "orders",
          element: (
            <Suspense fallback={<RouteSkeleton />}>
              <SellerOrders />
            </Suspense>
          ),
        },
        {
          path: "analytics",
          element: (
            <Suspense fallback={<RouteSkeleton />}>
              <SellerAnalytics />
            </Suspense>
          ),
        },
        {
          path: "wallet",
          element: (
            <Suspense fallback={<RouteSkeleton />}>
              <SellerWallet />
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
