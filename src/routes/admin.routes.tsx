import { RouteObject } from "react-router-dom";
import { lazy, Suspense } from "react";

const RouteSkeleton = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// Lazy load admin pages with admin auth check
const AdminDashboard = lazy(() =>
  import("@/pages/admin/AdminDashboard").then((m) => ({
    default: m.AdminDashboard,
  })),
);
const AdminUsersDashboard = lazy(() =>
  import("@/pages/admin/AdminUsersDashboard").then((m) => ({
    default: m.AdminUsersDashboard,
  })),
);
const AdminUserDetail = lazy(() =>
  import("@/pages/admin/AdminUserDetail").then((m) => ({
    default: m.AdminUserDetail,
  })),
);
const AdminProfileEditor = lazy(() =>
  import("@/pages/admin/AdminProfileEditor").then((m) => ({
    default: m.AdminProfileEditor,
  })),
);
const AdminProducts = lazy(() =>
  import("@/pages/admin/AdminProducts").then((m) => ({
    default: m.AdminProducts,
  })),
);
const AdminProductEdit = lazy(() =>
  import("@/features/profile/components/adminproductedit").then((m) => ({
    default: m.AdminProductEdit,
  })),
);
const AdminProductNew = lazy(() =>
  import("@/features/profile/components/AdminProductNew").then((m) => ({
    default: m.AdminProductNew,
  })),
);
const AdminOrders = lazy(() =>
  import("@/pages/admin/AdminOrders").then((m) => ({ default: m.AdminOrders })),
);
const AdminFactories = lazy(() =>
  import("@/pages/admin/AdminFactories").then((m) => ({
    default: m.AdminFactories,
  })),
);
const AdminMiddlemen = lazy(() =>
  import("@/pages/admin/AdminMiddlemen").then((m) => ({
    default: m.AdminMiddlemen,
  })),
);
const AdminConversations = lazy(() =>
  import("@/pages/admin/AdminConversations").then((m) => ({
    default: m.AdminConversations,
  })),
);
const AdminDelivery = lazy(() =>
  import("@/pages/admin/AdminDelivery").then((m) => ({
    default: m.AdminDelivery,
  })),
);
const AdminSettings = lazy(() =>
  import("@/pages/admin/AdminSettings").then((m) => ({
    default: m.AdminSettings,
  })),
);
const AdminMarketplaceTemplates = lazy(() =>
  import("@/pages/admin/AdminMarketplaceTemplates").then((m) => ({
    default: m.AdminMarketplaceTemplates,
  })),
);

// Placeholder
const ComingSoon = ({ title = "Page" }: { title?: string }) => (
  <Suspense fallback={<RouteSkeleton />}>
    <div className="text-center py-12">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-muted-foreground mt-2">Coming soon</p>
    </div>
  </Suspense>
);

export const adminRoutes: RouteObject[] = [
  {
    index: true,
    element: (
      <Suspense fallback={<RouteSkeleton />}>
        <AdminDashboard />
      </Suspense>
    ),
  },
  {
    path: "users",
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <AdminUsersDashboard />
          </Suspense>
        ),
      },
      {
        path: ":userId",
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <AdminUserDetail />
          </Suspense>
        ),
      },
      {
        path: ":userId/edit",
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <AdminProfileEditor />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: "products",
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <AdminProducts />
          </Suspense>
        ),
      },
      {
        path: ":id/edit",
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <AdminProductEdit />
          </Suspense>
        ),
      },
      {
        path: "new",
        element: (
          <Suspense fallback={<RouteSkeleton />}>
            <AdminProductNew />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: "orders",
    element: (
      <Suspense fallback={<RouteSkeleton />}>
        <AdminOrders />
      </Suspense>
    ),
  },
  {
    path: "factories",
    element: (
      <Suspense fallback={<RouteSkeleton />}>
        <AdminFactories />
      </Suspense>
    ),
  },
  {
    path: "middlemen",
    element: (
      <Suspense fallback={<RouteSkeleton />}>
        <AdminMiddlemen />
      </Suspense>
    ),
  },
  {
    path: "conversations",
    element: (
      <Suspense fallback={<RouteSkeleton />}>
        <AdminConversations />
      </Suspense>
    ),
  },
  {
    path: "delivery",
    element: (
      <Suspense fallback={<RouteSkeleton />}>
        <AdminDelivery />
      </Suspense>
    ),
  },
  {
    path: "settings",
    element: (
      <Suspense fallback={<RouteSkeleton />}>
        <AdminSettings />
      </Suspense>
    ),
  },
  {
    path: "marketplace",
    element: (
      <Suspense fallback={<RouteSkeleton />}>
        <AdminMarketplaceTemplates />
      </Suspense>
    ),
  },
  {
    path: "health",
    element: <ComingSoon title="Health Management" />,
  },
  {
    path: "pharmacy",
    element: <ComingSoon title="Pharmacy Management" />,
  },
  {
    path: "payments",
    element: <ComingSoon title="Payment Management" />,
  },
  {
    path: "analytics",
    element: <ComingSoon title="Analytics" />,
  },
];
