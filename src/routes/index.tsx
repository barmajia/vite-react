import { RouteObject, useRoutes } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { AdminLayout } from "@/pages/admin/AdminLayout";

// Import route modules
import { authRoutes } from "./auth.routes";
import { productRoutes } from "./products.routes";
import { servicesRoutes } from "./services.routes";
import { middlemanRoutes } from "./middleman.routes";
import { walletRoutes } from "./wallet.routes";
import { factoryRoutes } from "./factory.routes";
import { profileRoutes } from "./profile.routes";
import { adminRoutes } from "./admin.routes";
import { publicRoutes } from "./public.routes";
import { marketplaceRoutes } from "./marketplace.routes";
import { storefrontRoutes } from "./storefront.routes";
import { healthRoutes } from "./health.routes";

// Lazy load error pages
import { lazy, Suspense } from "react";
const NotFound = lazy(() =>
  import("@/pages/errors/NotFound").then((m) => ({ default: m.NotFound })),
);
const ServerError = lazy(() =>
  import("@/pages/errors/ServerError").then((m) => ({
    default: m.ServerError,
  })),
);
const Chat = lazy(() =>
  import("@/chats/chat").then((m) => ({ default: m.Chat })),
);
const Home = lazy(() =>
  import("@/pages/public/Home").then((m) => ({ default: m.Home })),
);

import { RouteSkeleton } from "@/components/shared/RouteSkeleton";

// Main application routes with Layout
const mainRoutes: RouteObject = {
  path: "/",
  element: <Layout />,
  children: [
    // Home
    {
      index: true,
      element: (
        <Suspense fallback={<RouteSkeleton />}>
          <Home />
        </Suspense>
      ),
    },
    // Product routes
    ...productRoutes,
    // Services routes
    ...servicesRoutes,
    // Middleman routes
    ...middlemanRoutes,
    // Wallet routes
    ...walletRoutes,
    // Marketplace routes
    ...marketplaceRoutes,
    // Factory routes
    ...factoryRoutes,
    // Profile routes
    ...profileRoutes,
    // Public info pages
    ...publicRoutes,
    // Healthcare routes
    ...healthRoutes,
  ],
};

// Admin routes with AdminLayout
const adminRoute: RouteObject = {
  path: "/admin",
  element: <AdminLayout />,
  children: adminRoutes,
};

// Chat route (standalone)
const chatRoute: RouteObject = {
  path: "/chat",
  element: (
    <Suspense fallback={<RouteSkeleton />}>
      <Chat />
    </Suspense>
  ),
};

// Error routes
const errorRoutes: RouteObject[] = [
  {
    path: "/error",
    element: (
      <Suspense fallback={<RouteSkeleton />}>
        <ServerError />
      </Suspense>
    ),
  },
  {
    path: "*",
    element: (
      <Suspense fallback={<RouteSkeleton />}>
        <NotFound />
      </Suspense>
    ),
  },
];

// Combine all routes
export const appRoutes: RouteObject[] = [
  ...authRoutes, // Auth routes (no layout)
  mainRoutes,
  adminRoute,
  chatRoute,
  // Storefront routes (must be last to avoid catching other routes)
  ...storefrontRoutes,
  ...errorRoutes,
];

export default appRoutes;
