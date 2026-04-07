# Aurora E-Commerce - Complete Routes Map

> **Last Updated:** April 6, 2026  
> **Router:** React Router v6  
> **Architecture:** Modular feature-based route aggregation with layout hierarchy

---

## Table of Contents

- [Route Hierarchy Overview](#route-hierarchy-overview)
- [Authentication Routes](#authentication-routes)
- [Public Pages](#public-pages)
- [Home & Landing](#home--landing)
- [Product & Shopping Routes](#product--shopping-routes)
- [Services Marketplace](#services-marketplace)
- [Services Dashboard](#services-dashboard-protected)
- [Middleman Portal](#middleman-portal-protected)
- [Wallet Management](#wallet-management-protected)
- [Web Template Marketplace](#web-template-marketplace)
- [Factory Portal](#factory-portal-protected)
- [User Profile & Settings](#user-profile--settings)
- [Health & Medical](#health--medical)
- [Admin Panel](#admin-panel)
- [Chat](#chat)
- [Storefront (Dynamic Catch-All)](#storefront-dynamic-catch-all)
- [Error Pages](#error-pages)
- [Route Protection & Guards](#route-protection--guards)
- [Layout Hierarchy](#layout-hierarchy)
- [Dynamic Route Patterns](#dynamic-route-patterns)

---

## Route Hierarchy Overview

```
src/main.tsx → <BrowserRouter>
  └── src/App.tsx → useAppRoutes()
       └── src/routes/index.tsx (Route Aggregator)
            │
            ├── AUTH ROUTES (no layout wrapper)
            │   └── src/routes/auth.routes.tsx
            │
            ├── MAIN ROUTES (wrapped in <Layout />)
            │   ├── / (index) → Home
            │   ├── src/routes/products.routes.tsx
            │   ├── src/routes/services.routes.tsx
            │   ├── src/routes/middleman.routes.tsx
            │   ├── src/routes/wallet.routes.tsx
            │   ├── src/routes/marketplace.routes.tsx
            │   ├── src/routes/factory.routes.tsx
            │   ├── src/routes/profile.routes.tsx
            │   ├── src/routes/public.routes.tsx
            │   └── src/routes/health.routes.tsx
            │
            ├── ADMIN ROUTES (wrapped in <AdminLayout />)
            │   └── src/routes/admin.routes.tsx
            │
            ├── CHAT ROUTE (standalone, no layout)
            │   └── src/chats/chat.tsx
            │
            ├── STOREFRONT ROUTES (dynamic catch-all, must be last)
            │   └── src/routes/storefront.routes.tsx
            │
            └── ERROR ROUTES
                 └── src/routes/index.tsx
```

---

## Authentication Routes

> **Layout:** None (no header/footer)  
> **File:** `src/routes/auth.routes.tsx`

| Path                | Component                               | File Location                             |
| ------------------- | --------------------------------------- | ----------------------------------------- |
| `/login`            | `Login`                                 | `src/pages/auth/Login.tsx`                |
| `/signup`           | `SignupPage` (role-based multi-step)    | `src/pages/signup/SignupPage.tsx`         |
| `/signup/middleman` | `MiddlemanSignup`                       | `src/pages/middleman/MiddlemanSignup.tsx` |
| `/auth/callback`    | `AuthCallback` (OAuth redirect handler) | `src/pages/auth/AuthCallback.tsx`         |
| `/forgot-password`  | `ForgotPassword`                        | `src/pages/auth/ForgotPassword.tsx`       |
| `/update-password`  | `UpdatePassword`                        | `src/pages/auth/UpdatePassword.tsx`       |

---

## Public Pages

> **Layout:** `<Layout />` (standard header + footer)  
> **File:** `src/routes/public.routes.tsx`

| Path       | Component  | File Location                   |
| ---------- | ---------- | ------------------------------- |
| `/about`   | `About`    | `src/pages/public/About.tsx`    |
| `/contact` | `Contact`  | `src/pages/public/Contact.tsx`  |
| `/help`    | `Help`     | `src/pages/public/Help.tsx`     |
| `/feed`    | `FeedPage` | `src/pages/public/FeedPage.tsx` |
| `/reviews` | `Reviews`  | `src/pages/public/Reviews.tsx`  |

---

## Home & Landing

> **Layout:** `<Layout />`  
> **File:** `src/routes/index.tsx`

| Path | Component            | File Location               |
| ---- | -------------------- | --------------------------- |
| `/`  | `Home` (lazy loaded) | `src/pages/public/Home.tsx` |

---

## Product & Shopping Routes

> **Layout:** `<Layout />` (standard header + footer)  
> **File:** `src/routes/products.routes.tsx`

| Path                         | Component                                 | Protected? |
| ---------------------------- | ----------------------------------------- | :--------: |
| `/products`                  | `ProductList`                             |     No     |
| `/products/:asin`            | `ProductDetail`                           |     No     |
| `/products/details/:asin`    | `ProductDetailsPage`                      |     No     |
| `/products/categories`       | `CategoriesPage`                          |     No     |
| `/products/categories/:slug` | `CategoryProductsPage`                    |     No     |
| `/products/brands`           | `Brands` (Coming Soon)                    |     No     |
| `/products/brands/:id`       | `BrandProducts` (Coming Soon)             |     No     |
| `/product/:id`               | `ProductDetailRedirect` (legacy redirect) |     No     |
| `/cart`                      | `CartPage`                                |     No     |
| `/checkout`                  | `CheckoutPage`                            |  **Yes**   |
| `/order-success/:id`         | `OrderSuccessPage`                        |  **Yes**   |
| `/orders`                    | `OrdersListPage`                          |  **Yes**   |
| `/orders/:id`                | `OrderDetailPage`                         |  **Yes**   |
| `/wishlist`                  | `WishlistPage`                            |  **Yes**   |
| `/addresses`                 | `AddressesPage`                           |  **Yes**   |

---

## Services Marketplace

> **Layout:** `<Layout />` with `<ServicesHeader />` (conditional header for `/services/*`)  
> **File:** `src/routes/services.routes.tsx`

| Path                                       | Component                         |     Protected?     |
| ------------------------------------------ | --------------------------------- | :----------------: |
| `/services`                                | `ServicesHome`                    |         No         |
| `/services/:categorySlug`                  | `ServiceCategoryPage`             |         No         |
| `/services/:categorySlug/:subcategorySlug` | `ServiceCategoryPage`             |         No         |
| `/services/listing/:listingId`             | `ServiceDetailPage`               |         No         |
| `/services/listing/:listingId/book`        | `ServiceBookingPage`              |         No         |
| `/services/provider/:providerId`           | `ProviderProfilePage`             |         No         |
| `/services/onboarding`                     | `ServiceOnboardingWizard`         |         No         |
| `/services/dashboard`                      | `DashboardLayout` (nested layout) |      **Yes**       |
| `/services/dashboard/`                     | `DashboardHome`                   | (parent protected) |
| `/services/dashboard/bookings`             | `BookingsPage`                    | (parent protected) |
| `/services/dashboard/projects`             | Coming Soon                       | (parent protected) |
| `/services/dashboard/listings`             | Coming Soon                       | (parent protected) |
| `/services/dashboard/finance`              | Coming Soon                       | (parent protected) |
| `/services/dashboard/clients`              | Coming Soon                       | (parent protected) |
| `/services/dashboard/settings`             | Coming Soon                       | (parent protected) |
| `/services/dashboard/create-profile`       | `CreateProviderProfile`           | (parent protected) |
| `/services/dashboard/create-listing`       | `CreateServiceListing`            | (parent protected) |
| `/services/dashboard/onboard`              | `ServiceOnboardingWizard`         | (parent protected) |

---

## Middleman Portal

> **Layout:** `<Layout />`  
> **File:** `src/routes/middleman.routes.tsx`

| Path                       | Component              |     Protected?     | Account Type |
| -------------------------- | ---------------------- | :----------------: | :----------: |
| `/middleman`               | `MiddlemanDashboard`   |      **Yes**       | `middleman`  |
| `/middleman/`              | `MiddlemanDashboard`   | (parent protected) | `middleman`  |
| `/middleman/deals`         | `MiddlemanDeals`       | (parent protected) | `middleman`  |
| `/middleman/deals/new`     | `MiddlemanCreateDeal`  | (parent protected) | `middleman`  |
| `/middleman/deals/:dealId` | `MiddlemanDealDetails` | (parent protected) | `middleman`  |
| `/middleman/orders`        | `MiddlemanOrders`      | (parent protected) | `middleman`  |
| `/middleman/analytics`     | `MiddlemanAnalytics`   | (parent protected) | `middleman`  |
| `/middleman/connections`   | `MiddlemanConnections` | (parent protected) | `middleman`  |
| `/middleman/commission`    | `MiddlemanCommission`  | (parent protected) | `middleman`  |
| `/middleman/profile`       | `MiddlemanProfile`     | (parent protected) | `middleman`  |
| `/middleman/settings`      | `MiddlemanSettings`    | (parent protected) | `middleman`  |

---

## Wallet Management

> **Layout:** `<Layout />`  
> **File:** `src/routes/wallet.routes.tsx`

| Path                     | Component            |     Protected?     |
| ------------------------ | -------------------- | :----------------: |
| `/wallet`                | `WalletDashboard`    |      **Yes**       |
| `/wallet/`               | `WalletDashboard`    | (parent protected) |
| `/wallet/transactions`   | `TransactionHistory` | (parent protected) |
| `/wallet/payouts`        | `PayoutRequest`      | (parent protected) |
| `/wallet/payout-history` | `PayoutHistory`      | (parent protected) |

---

## Web Template Marketplace

> **Layout:** `<Layout />`  
> **File:** `src/routes/marketplace.routes.tsx`

| Path                           | Component             | Protected? |
| ------------------------------ | --------------------- | :--------: |
| `/webmarketplace`              | `MarketplaceGrid`     |     No     |
| `/webmarketplace/:id`          | `TemplateDetails`     |     No     |
| `/webmarketplace/:id/checkout` | `MarketplaceCheckout` |  **Yes**   |

---

## Factory Portal

> **Layout:** `<Layout />`  
> **File:** `src/routes/factory.routes.tsx`

| Path                   | Component                |     Protected?     | Account Type |
| ---------------------- | ------------------------ | :----------------: | :----------: |
| `/factory`             | `FactoryDashboardPage`   |      **Yes**       |  `factory`   |
| `/factory/`            | `FactoryDashboardPage`   | (parent protected) |  `factory`   |
| `/factory/production`  | `FactoryProductionPage`  |      **Yes**       |  `factory`   |
| `/factory/quotes`      | `FactoryQuotesPage`      |      **Yes**       |  `factory`   |
| `/factory/connections` | `FactoryConnectionsPage` |      **Yes**       |  `factory`   |
| `/factory/start-chat`  | `FactoryStartChat`       |      **Yes**       |  (any auth)  |

---

## User Profile & Settings

> **Layout:** `<Layout />`  
> **File:** `src/routes/profile.routes.tsx`

| Path                        | Component              | Protected? |   Account Type    |
| --------------------------- | ---------------------- | :--------: | :---------------: |
| `/profile`                  | `ProfilePage`          |     No     |                   |
| `/profile/:userId`          | `PublicProfilePage`    |     No     |                   |
| `/profile/:userId/edit`     | `EditProfile`          |     No     |                   |
| `/profiles`                 | `ProfileDirectoryPage` |     No     |                   |
| `/settings`                 | `SettingsPage`         |  **Yes**   |    (any auth)     |
| `/notifications`            | `NotificationsPage`    |  **Yes**   |    (any auth)     |
| `/customer/orders/tracking` | `OrderTracking`        |  **Yes**   |    (any auth)     |
| `/seller/commission`        | `CommissionReport`     |  **Yes**   |     `seller`      |
| `/delivery`                 | `DeliveryDashboard`    |  **Yes**   | `delivery_driver` |

---

## Health & Medical

> **Layout:** `<Layout />` (no header for `/health/*` — `pt-0` class)  
> **File:** `src/routes/health.routes.tsx`

| Path                                     | Component               | Protected? |
| ---------------------------------------- | ----------------------- | :--------: |
| `/health`                                | `HealthLanding`         |     No     |
| `/health/doctors`                        | `DoctorList`            |     No     |
| `/health/doctor/signup`                  | `DoctorSignup`          |     No     |
| `/health/doctor/pending-approval`        | `DoctorPendingApproval` |     No     |
| `/health/patient/signup`                 | `PatientSignup`         |     No     |
| `/health/book/:id`                       | `BookingPage`           |     No     |
| `/health/patient/dashboard`              | `PatientDashboard`      |     No     |
| `/health/doctor/dashboard`               | `DoctorDashboard`       |     No     |
| `/health/admin/verify`                   | `AdminVerification`     |     No     |
| `/health/consult/:id`                    | `ConsultationRoom`      |     No     |
| `/health/pharmacies`                     | `PharmacyList`          |     No     |
| `/health/hospitals`                      | `HospitalList`          |     No     |
| `/health/patient/consent/:appointmentId` | `ConsentForm`           |     No     |
| `/health/patient/data-export`            | `DataExport`            |     No     |

> **Note:** Health routes currently lack `ProtectedRoute` wrappers in the active config, though several should be protected in production.

---

## Admin Panel

> **Layout:** `<AdminLayout />` (custom admin layout with sidebar)  
> **File:** `src/routes/admin.routes.tsx`

| Path                        | Component                   | Status              |
| --------------------------- | --------------------------- | ------------------- |
| `/admin`                    | `AdminDashboard`            | Active              |
| `/admin/users`              | `AdminUsersDashboard`       | Active              |
| `/admin/users/:userId`      | `AdminUserDetail`           | Active              |
| `/admin/users/:userId/edit` | `AdminProfileEditor`        | Active              |
| `/admin/products`           | `AdminProducts`             | Active              |
| `/admin/products/:id/edit`  | `AdminProductEdit`          | Active              |
| `/admin/products/new`       | `AdminProductNew`           | Active              |
| `/admin/orders`             | `AdminOrders`               | Active              |
| `/admin/factories`          | `AdminFactories`            | Active              |
| `/admin/middlemen`          | `AdminMiddlemen`            | Active              |
| `/admin/conversations`      | `AdminConversations`        | Active              |
| `/admin/delivery`           | `AdminDelivery`             | Active              |
| `/admin/settings`           | `AdminSettings`             | Active              |
| `/admin/marketplace`        | `AdminMarketplaceTemplates` | Active              |
| `/admin/health`             | Coming Soon                 | Health Management   |
| `/admin/pharmacy`           | Coming Soon                 | Pharmacy Management |
| `/admin/payments`           | Coming Soon                 | Payment Management  |
| `/admin/analytics`          | Coming Soon                 | Analytics           |

> **Note:** Admin routes lack `ProtectedRoute` wrappers in the active config but should be restricted to `admin` account type in production.

---

## Chat

> **Layout:** None (standalone, no header/footer)  
> **File:** `src/chats/chat.tsx` (imported directly in `src/routes/index.tsx`)

| Path    | Component | Protected? |
| ------- | --------- | :--------: |
| `/chat` | `Chat`    |  **Yes**   |

---

## Storefront (Dynamic Catch-All)

> **Layout:** `<Layout />`  
> **File:** `src/routes/storefront.routes.tsx`

| Path         | Component        | Notes                                                            |
| ------------ | ---------------- | ---------------------------------------------------------------- |
| `/:username` | `StorefrontPage` | Dynamic catch-all — must be last to avoid shadowing other routes |

This route matches any single-segment path (e.g., `/johns-store`, `/mybrand`) that isn't caught by earlier routes. It renders a user's storefront page based on the `username` parameter.

---

## Error Pages

> **File:** `src/routes/index.tsx`

| Path            | Component        | File Location                      |
| --------------- | ---------------- | ---------------------------------- |
| `/error`        | `ServerError`    | `src/pages/errors/ServerError.tsx` |
| `*` (catch-all) | `NotFound` (404) | `src/pages/errors/NotFound.tsx`    |

---

## Route Protection & Guards

### ProtectedRoute Component

**File:** `src/components/ProtectedRoute.tsx`

The `ProtectedRoute` component provides:

1. **Authentication Check** — Redirects unauthenticated users to `/login?returnTo=<encoded-path>` (preserves full path + query + hash)
2. **Account Type Restriction** — Optional `allowedAccountTypes` prop restricts access to specific roles. Shows "Access Denied" page if `user_metadata.account_type` doesn't match.
3. **Loading State** — Shows spinner while auth state is being resolved.

### Routes with Account Type Restrictions

| Route Pattern        | Allowed Account Types |
| -------------------- | --------------------- |
| `/factory/**`        | `["factory"]`         |
| `/middleman/**`      | `["middleman"]`       |
| `/seller/commission` | `["seller"]`          |
| `/delivery`          | `["delivery_driver"]` |

### Routes with Generic Authentication (No Type Restriction)

- `/checkout`, `/order-success/:id`, `/orders`, `/orders/:id`, `/wishlist`, `/addresses`
- `/webmarketplace/:id/checkout`
- `/wallet/**`
- `/settings`, `/notifications`
- `/customer/orders/tracking`
- `/services/dashboard/**` (and all nested children)
- `/chat`

---

## Layout Hierarchy

### Three Layout Levels

| Level            | Routes                                                                                             | Layout Component                                      |
| ---------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| **No Layout**    | `/login`, `/signup`, `/signup/middleman`, `/auth/callback`, `/forgot-password`, `/update-password` | None (no header/footer)                               |
| **Main Layout**  | Most app routes                                                                                    | `<Layout />` (`src/components/layout/Layout.tsx`)     |
| **Admin Layout** | `/admin/**`                                                                                        | `<AdminLayout />` (`src/pages/admin/AdminLayout.tsx`) |

### Conditional Header Logic in `<Layout />`

| Route Pattern           | Header Rendered             |
| ----------------------- | --------------------------- |
| Auth routes (no layout) | None                        |
| `/services/**`          | `<ServicesHeader />`        |
| `/health/**`            | None (`pt-0` class applied) |
| All other main routes   | `<Header />` (standard)     |

The `<Header />` component is role-aware and adapts navigation based on user role (products, services dropdown, cart, notifications, profile dropdown). It also shows a provider profile badge if `user_metadata.account_type === "svc_provider"`.

### Nested Layouts

- `<DashboardLayout />` (`src/features/services/dashboard/components/layout/DashboardLayout.tsx`) — serves as nested layout under `/services/dashboard/**`

---

## Dynamic Route Patterns

| Pattern            | Example Routes                                                             |
| ------------------ | -------------------------------------------------------------------------- |
| `:asin`            | `/products/:asin`, `/products/details/:asin`                               |
| `:id`              | `/product/:id`, `/order-success/:id`, `/orders/:id`, `/webmarketplace/:id` |
| `:userId`          | `/profile/:userId`, `/profile/:userId/edit`, `/admin/users/:userId`        |
| `:slug`            | `/products/categories/:slug`                                               |
| `:categorySlug`    | `/services/:categorySlug`                                                  |
| `:subcategorySlug` | `/services/:categorySlug/:subcategorySlug`                                 |
| `:listingId`       | `/services/listing/:listingId`, `/services/listing/:listingId/book`        |
| `:providerId`      | `/services/provider/:providerId`                                           |
| `:dealId`          | `/middleman/deals/:dealId`                                                 |
| `:appointmentId`   | `/health/patient/consent/:appointmentId`                                   |
| `:username`        | `/:username` (storefront catch-all)                                        |

---

## Key Files

| File                                | Purpose                                                       |
| ----------------------------------- | ------------------------------------------------------------- |
| `src/main.tsx`                      | Entry point, wraps App in BrowserRouter                       |
| `src/App.tsx`                       | Calls `useAppRoutes()`, provides theme/auth context providers |
| `src/routes/index.tsx`              | Main route aggregator, defines route composition order        |
| `src/routes/auth.routes.tsx`        | Authentication route definitions                              |
| `src/routes/public.routes.tsx`      | Public info pages                                             |
| `src/routes/products.routes.tsx`    | Product browsing, cart, checkout, orders                      |
| `src/routes/services.routes.tsx`    | Services marketplace + dashboard                              |
| `src/routes/middleman.routes.tsx`   | Middleman portal                                              |
| `src/routes/wallet.routes.tsx`      | Wallet management                                             |
| `src/routes/marketplace.routes.tsx` | Web templates marketplace                                     |
| `src/routes/factory.routes.tsx`     | Factory portal                                                |
| `src/routes/profile.routes.tsx`     | Profile, settings, notifications, role-specific pages         |
| `src/routes/health.routes.tsx`      | Healthcare vertical                                           |
| `src/routes/admin.routes.tsx`       | Admin dashboard                                               |
| `src/routes/storefront.routes.tsx`  | Dynamic user storefront (catch-all)                           |
| `src/components/ProtectedRoute.tsx` | Route guard component                                         |
| `src/components/layout/Layout.tsx`  | Main layout wrapper with conditional header logic             |

---

## Route Composition Order

Routes are assembled in `src/routes/index.tsx` in this specific order:

```ts
appRoutes = [
  ...authRoutes, // 1. Standalone, no layout
  mainRoutes, // 2. Wrapped in <Layout />
  adminRoute, // 3. Wrapped in <AdminLayout />
  chatRoute, // 4. Standalone
  ...storefrontRoutes, // 5. Catch-all dynamic (MUST BE LAST)
  ...errorRoutes, // 6. 404 and 500
];
```

> **Important:** Storefront routes (`/:username`) are intentionally placed last to avoid shadowing other single-segment routes like `/about`, `/feed`, etc.
