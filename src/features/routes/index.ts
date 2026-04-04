/**
 * Modular Route Definitions
 * 
 * Organized by feature vertical for better maintainability
 * and code splitting.
 */

import { lazy } from "react";

// ───────────────────────────────────────────────────────────────
// Lazy Loading Helper
// ───────────────────────────────────────────────────────────────

const lazyImport = (importFn: () => Promise<any>) =>
  lazy(importFn);

// ───────────────────────────────────────────────────────────────
// Auth Routes (No Layout)
// ───────────────────────────────────────────────────────────────

export const authRoutes = [
  {
    path: "/login",
    element: lazyImport(() => import("@/pages/auth/Login")),
  },
  {
    path: "/signup",
    element: lazyImport(() => import("@/pages/signup/SignupPage")),
  },
  {
    path: "/signup/middleman",
    element: lazyImport(() => import("@/pages/middleman/MiddlemanSignup")),
  },
  {
    path: "/auth/callback",
    element: lazyImport(() => import("@/pages/auth/AuthCallback")),
  },
];

// ───────────────────────────────────────────────────────────────
// Public Routes
// ───────────────────────────────────────────────────────────────

export const publicRoutes = [
  {
    path: "/",
    element: lazyImport(() => import("@/pages/public/ServicesGateway")),
  },
  {
    path: "/about",
    element: lazyImport(() => import("@/pages/public/About")),
  },
  {
    path: "/contact",
    element: lazyImport(() => import("@/pages/public/Contact")),
  },
  {
    path: "/help",
    element: lazyImport(() => import("@/pages/public/Help")),
  },
];

// ───────────────────────────────────────────────────────────────
// Products Vertical
// ───────────────────────────────────────────────────────────────

export const productRoutes = [
  {
    path: "products",
    children: [
      {
        index: true,
        element: lazyImport(() => import("@/pages/public/ProductList")),
      },
      {
        path: ":asin",
        element: lazyImport(() => import("@/pages/public/ProductDetail")),
      },
      {
        path: "details/:asin",
        element: lazyImport(() => import("@/pages/public/ProductDetailsPage")),
      },
      {
        path: "categories",
        element: lazyImport(() => import("@/features/categories/pages/CategoriesPage")),
      },
      {
        path: "categories/:slug",
        element: lazyImport(() => import("@/features/categories/pages/CategoryProductsPage")),
      },
    ],
  },
  {
    path: "product/:id",
    element: lazyImport(() => import("@/pages/public/ProductDetailRedirect")),
  },
  {
    path: "product/:asin",
    element: lazyImport(() => import("@/pages/public/ProductDetail")),
  },
];

// ───────────────────────────────────────────────────────────────
// E-commerce Flow Routes (Protected)
// ───────────────────────────────────────────────────────────────

export const ecommerceRoutes = [
  {
    path: "cart",
    element: lazyImport(() => import("@/features/cart/pages/CartPage")),
  },
  {
    path: "checkout",
    element: lazyImport(() => import("@/features/checkout/pages/CheckoutPage")),
    protected: true,
  },
  {
    path: "order-success/:id",
    element: lazyImport(() => import("@/features/orders/pages/OrderSuccessPage")),
    protected: true,
  },
  {
    path: "orders",
    element: lazyImport(() => import("@/features/orders/pages/OrdersListPage")),
    protected: true,
  },
  {
    path: "orders/:id",
    element: lazyImport(() => import("@/features/orders/pages/OrderDetailPage")),
    protected: true,
  },
  {
    path: "wishlist",
    element: lazyImport(() => import("@/features/wishlist/pages/WishlistPage")),
    protected: true,
  },
  {
    path: "addresses",
    element: lazyImport(() => import("@/features/addresses/pages/AddressesPage")),
    protected: true,
  },
];

// ───────────────────────────────────────────────────────────────
// Services Vertical
// ───────────────────────────────────────────────────────────────

export const serviceRoutes = [
  {
    path: "services",
    children: [
      {
        index: true,
        element: lazyImport(() => import("@/features/services/pages/ServicesHome")),
      },
      {
        path: ":categorySlug",
        element: lazyImport(() => import("@/features/services/pages/ServiceCategoryPage")),
      },
      {
        path: ":categorySlug/:subcategorySlug",
        element: lazyImport(() => import("@/features/services/pages/ServiceCategoryPage")),
      },
      {
        path: "listing/:listingId",
        element: lazyImport(() => import("@/features/services/pages/ServiceDetailPage")),
      },
      {
        path: "listing/:listingId/book",
        element: lazyImport(() => import("@/features/services/bookings/pages/ServiceBookingPage")),
      },
      {
        path: "provider/:providerId",
        element: lazyImport(() => import("@/features/services/pages/ProviderProfilePage")),
      },
      {
        path: "dashboard/create-profile",
        element: lazyImport(() => import("@/features/services/pages/CreateProviderProfile")),
      },
      {
        path: "dashboard/create-listing",
        element: lazyImport(() => import("@/features/services/pages/CreateServiceListing")),
      },
      {
        path: "dashboard/onboard",
        element: lazyImport(() => import("@/features/services/components/ServiceOnboardingWizard")),
      },
      {
        path: "onboarding",
        element: lazyImport(() => import("@/features/services/components/ServiceOnboardingWizard")),
      },
    ],
  },
];

// ───────────────────────────────────────────────────────────────
// Services Dashboard Routes (Protected - Service Providers)
// ───────────────────────────────────────────────────────────────

export const servicesDashboardRoutes = [
  {
    path: "services/dashboard",
    element: lazyImport(() => import("@/features/services/dashboard/components/layout/DashboardLayout")),
    protected: true,
    children: [
      {
        index: true,
        element: lazyImport(() => import("@/features/services/dashboard/pages/DashboardHome")),
      },
      {
        path: "bookings",
        element: lazyImport(() => import("@/features/services/dashboard/pages/BookingsPage")),
      },
    ],
  },
];

// ───────────────────────────────────────────────────────────────
// Healthcare Sub-Vertical (Protected)
// ───────────────────────────────────────────────────────────────

export const healthRoutes = [
  {
    path: "services/health",
    element: lazyImport(() => import("@/features/health/layouts/HealthLayout")),
    children: [
      {
        index: true,
        element: lazyImport(() => import("@/features/health/pages/HealthLanding")),
      },
      {
        path: "doctors",
        element: lazyImport(() => import("@/features/health/pages/DoctorList")),
      },
      {
        path: "doctor/signup",
        element: lazyImport(() => import("@/features/health/pages/DoctorSignup")),
      },
      {
        path: "doctor/pending-approval",
        element: lazyImport(() => import("@/features/health/pages/DoctorPendingApproval")),
      },
      {
        path: "book/:id",
        element: lazyImport(() => import("@/features/health/pages/BookingPage")),
      },
      {
        path: "patient/dashboard",
        element: lazyImport(() => import("@/features/health/pages/PatientDashboard")),
        protected: true,
      },
      {
        path: "doctor/dashboard",
        element: lazyImport(() => import("@/features/health/pages/DoctorDashboard")),
        protected: true,
        allowedAccountTypes: ["doctor"],
      },
      {
        path: "admin/verify",
        element: lazyImport(() => import("@/features/health/pages/AdminVerification")),
        protected: true,
        allowedAccountTypes: ["admin"],
      },
      {
        path: "consult/:id",
        element: lazyImport(() => import("@/features/health/pages/ConsultationRoom")),
        protected: true,
      },
      {
        path: "pharmacies",
        element: lazyImport(() => import("@/features/health/pages/PharmacyList")),
      },
      {
        path: "patient/consent/:appointmentId",
        element: lazyImport(() => import("@/features/health/pages/ConsentForm")),
        protected: true,
      },
      {
        path: "patient/data-export",
        element: lazyImport(() => import("@/features/health/pages/DataExport")),
        protected: true,
      },
    ],
  },
];

// ───────────────────────────────────────────────────────────────
// Middleman Vertical (Protected - Middlemen)
// ───────────────────────────────────────────────────────────────

export const middlemanRoutes = [
  {
    path: "middleman",
    children: [
      {
        index: true,
        element: lazyImport(() => import("@/pages/middleman/MiddlemanDashboard")),
        protected: true,
        allowedAccountTypes: ["middleman"],
      },
      {
        path: "dashboard",
        element: lazyImport(() => import("@/pages/middleman/MiddlemanDashboard")),
        protected: true,
        allowedAccountTypes: ["middleman"],
      },
      {
        path: "deals",
        element: lazyImport(() => import("@/pages/middleman/MiddlemanDeals")),
        protected: true,
        allowedAccountTypes: ["middleman"],
      },
      {
        path: "deals/new",
        element: lazyImport(() => import("@/pages/middleman/MiddlemanCreateDeal")),
        protected: true,
        allowedAccountTypes: ["middleman"],
      },
      {
        path: "deals/:dealId",
        element: lazyImport(() => import("@/pages/middleman/MiddlemanDealDetails")),
        protected: true,
        allowedAccountTypes: ["middleman"],
      },
      {
        path: "orders",
        element: lazyImport(() => import("@/pages/middleman/MiddlemanOrders")),
        protected: true,
        allowedAccountTypes: ["middleman"],
      },
      {
        path: "analytics",
        element: lazyImport(() => import("@/pages/middleman/MiddlemanAnalytics")),
        protected: true,
        allowedAccountTypes: ["middleman"],
      },
      {
        path: "connections",
        element: lazyImport(() => import("@/pages/middleman/MiddlemanConnections")),
        protected: true,
        allowedAccountTypes: ["middleman"],
      },
      {
        path: "commission",
        element: lazyImport(() => import("@/pages/middleman/MiddlemanCommission")),
        protected: true,
        allowedAccountTypes: ["middleman"],
      },
      {
        path: "profile",
        element: lazyImport(() => import("@/pages/middleman/MiddlemanProfile")),
        protected: true,
        allowedAccountTypes: ["middleman"],
      },
      {
        path: "settings",
        element: lazyImport(() => import("@/pages/middleman/MiddlemanSettings")),
        protected: true,
        allowedAccountTypes: ["middleman"],
      },
    ],
  },
];

// ───────────────────────────────────────────────────────────────
// Factory Vertical (Protected - Factories)
// ───────────────────────────────────────────────────────────────

export const factoryRoutes = [
  {
    path: "factory",
    children: [
      {
        index: true,
        element: lazyImport(() => import("@/pages/factory/FactoryDashboardPage")),
        protected: true,
        allowedAccountTypes: ["factory"],
      },
      {
        path: "production",
        element: lazyImport(() => import("@/pages/factory/FactoryProductionPage")),
        protected: true,
        allowedAccountTypes: ["factory"],
      },
      {
        path: "quotes",
        element: lazyImport(() => import("@/pages/factory/FactoryQuotesPage")),
        protected: true,
        allowedAccountTypes: ["factory"],
      },
      {
        path: "connections",
        element: lazyImport(() => import("@/pages/factory/FactoryConnectionsPage")),
        protected: true,
        allowedAccountTypes: ["factory"],
      },
      {
        path: "start-chat",
        element: lazyImport(() => import("@/pages/factory/FactoryStartChat")),
        protected: true,
      },
    ],
  },
];

// ───────────────────────────────────────────────────────────────
// Wallet Vertical (Protected)
// ───────────────────────────────────────────────────────────────

export const walletRoutes = [
  {
    path: "wallet",
    element: lazyImport(() => import("@/pages/wallet/WalletDashboard")),
    protected: true,
    children: [
      {
        index: true,
        element: lazyImport(() => import("@/pages/wallet/WalletDashboard")),
      },
      {
        path: "transactions",
        element: lazyImport(() => import("@/pages/wallet/TransactionHistory")),
      },
      {
        path: "payouts",
        element: lazyImport(() => import("@/pages/wallet/PayoutRequest")),
      },
      {
        path: "payout-history",
        element: lazyImport(() => import("@/pages/wallet/PayoutHistory")),
      },
    ],
  },
];

// ───────────────────────────────────────────────────────────────
// Delivery Vertical (Protected - Delivery Drivers)
// ───────────────────────────────────────────────────────────────

export const deliveryRoutes = [
  {
    path: "delivery",
    children: [
      {
        index: true,
        element: lazyImport(() => import("@/pages/delivery/DeliveryDashboard")),
        protected: true,
        allowedAccountTypes: ["delivery_driver"],
      },
    ],
  },
];

// ───────────────────────────────────────────────────────────────
// Customer Vertical (Protected)
// ───────────────────────────────────────────────────────────────

export const customerRoutes = [
  {
    path: "customer",
    children: [
      {
        path: "orders/tracking",
        element: lazyImport(() => import("@/pages/customer/OrderTracking")),
        protected: true,
      },
    ],
  },
];

// ───────────────────────────────────────────────────────────────
// Seller Vertical (Protected - Sellers)
// ───────────────────────────────────────────────────────────────

export const sellerRoutes = [
  {
    path: "seller",
    children: [
      {
        path: "commission",
        element: lazyImport(() => import("@/pages/seller/CommissionReport")),
        protected: true,
        allowedAccountTypes: ["seller"],
      },
    ],
  },
];

// ───────────────────────────────────────────────────────────────
// Profile & Social Routes
// ───────────────────────────────────────────────────────────────

export const profileRoutes = [
  {
    path: "profile",
    children: [
      {
        index: true,
        element: lazyImport(() => import("@/features/profile/pages/ProfilePage")),
        protected: true,
      },
      {
        path: ":userId",
        element: lazyImport(() => import("@/pages/profile/PublicProfilePage")),
      },
      {
        path: ":userId/edit",
        element: lazyImport(() => import("@/pages/profile/EditProfile")),
        protected: true,
      },
    ],
  },
  {
    path: "profiles",
    element: lazyImport(() => import("@/pages/profile/ProfileDirectoryPage")),
  },
  {
    path: "feed",
    element: lazyImport(() => import("@/components/feed/FeedPage")),
  },
];

// ───────────────────────────────────────────────────────────────
// Settings & Notifications (Protected)
// ───────────────────────────────────────────────────────────────

export const settingsRoutes = [
  {
    path: "settings",
    element: lazyImport(() => import("@/features/settings/pages/SettingsPage")),
    protected: true,
  },
  {
    path: "notifications",
    element: lazyImport(() => import("@/features/notifications/pages/NotificationsPage")),
    protected: true,
  },
];

// ───────────────────────────────────────────────────────────────
// Admin Routes (Separate Layout)
// ───────────────────────────────────────────────────────────────

export const adminRoutes = [
  {
    path: "admin",
    element: lazyImport(() => import("@/pages/admin/AdminLayout")),
    protected: true,
    allowedAccountTypes: ["admin"],
    children: [
      {
        index: true,
        element: lazyImport(() => import("@/pages/admin/AdminDashboard")),
      },
      {
        path: "users",
        element: lazyImport(() => import("@/pages/admin/AdminUsersDashboard")),
      },
      {
        path: "users/:userId",
        element: lazyImport(() => import("@/pages/admin/AdminUserDetail")),
      },
      {
        path: "users/:userId/edit",
        element: lazyImport(() => import("@/pages/admin/AdminProfileEditor")),
      },
      {
        path: "products",
        element: lazyImport(() => import("@/pages/admin/AdminProducts")),
      },
      {
        path: "products/:id/edit",
        element: lazyImport(() => import("@/features/profile/components/adminproductedit")),
      },
      {
        path: "products/new",
        element: lazyImport(() => import("@/features/profile/components/AdminProductNew")),
      },
      {
        path: "orders",
        element: lazyImport(() => import("@/pages/admin/AdminOrders")),
      },
      {
        path: "factories",
        element: lazyImport(() => import("@/pages/admin/AdminFactories")),
      },
      {
        path: "middlemen",
        element: lazyImport(() => import("@/pages/admin/AdminMiddlemen")),
      },
      {
        path: "conversations",
        element: lazyImport(() => import("@/pages/admin/AdminConversations")),
      },
      {
        path: "delivery",
        element: lazyImport(() => import("@/pages/admin/AdminDelivery")),
      },
      {
        path: "settings",
        element: lazyImport(() => import("@/pages/admin/AdminSettings")),
      },
    ],
  },
];

// ───────────────────────────────────────────────────────────────
// Error Routes
// ───────────────────────────────────────────────────────────────

export const errorRoutes = [
  {
    path: "/error",
    element: lazyImport(() => import("@/pages/errors/ServerError")),
  },
  {
    path: "*",
    element: lazyImport(() => import("@/pages/errors/NotFound")),
  },
];

// ───────────────────────────────────────────────────────────────
// Chat Route (Standalone)
// ───────────────────────────────────────────────────────────────

export const chatRoutes = [
  {
    path: "/Chat",
    element: lazyImport(() => import("@/chats/chat")),
  },
];

// ───────────────────────────────────────────────────────────────
// Export All Routes Combined
// ───────────────────────────────────────────────────────────────

export const allRouteModules = {
  auth: authRoutes,
  public: publicRoutes,
  products: productRoutes,
  ecommerce: ecommerceRoutes,
  services: serviceRoutes,
  servicesDashboard: servicesDashboardRoutes,
  health: healthRoutes,
  middleman: middlemanRoutes,
  factory: factoryRoutes,
  wallet: walletRoutes,
  delivery: deliveryRoutes,
  customer: customerRoutes,
  seller: sellerRoutes,
  profile: profileRoutes,
  settings: settingsRoutes,
  admin: adminRoutes,
  error: errorRoutes,
  chat: chatRoutes,
};

export default allRouteModules;
