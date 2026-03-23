# 🗺️ Aurora E-commerce - Complete Route Documentation

> **Comprehensive guide to all routes, navigation patterns, and URL structures in the Aurora platform**

**Version:** 3.0.0  
**Last Updated:** March 22, 2026  
**Total Routes:** 70+  
**Framework:** React Router DOM v7

---

## 📋 Table of Contents

- [Architecture Overview](#-architecture-overview)
- [Route Categories](#-route-categories)
- [Authentication Routes](#-authentication-routes)
- [Public Routes](#-public-routes)
- [Middleman Routes](#-middleman-routes)
- [Services Marketplace Routes](#-services-marketplace-routes)
- [Services Dashboard Routes](#-services-dashboard-routes)
- [Customer Routes](#-customer-routes)
- [Factory Routes](#-factory-routes)
- [Healthcare Routes](#-healthcare-routes)
- [Profile & Social Routes](#-profile--social-routes)
- [Error Routes](#-error-routes)
- [Route Parameters Reference](#-route-parameters-reference)
- [Query Parameters Reference](#-query-parameters-reference)
- [Navigation Patterns](#-navigation-patterns)
- [Route Protection & Guards](#-route-protection--guards)
- [TypeScript Types](#-typescript-types)

---

## 🏗️ Architecture Overview

### Route Structure

```
src/App.tsx (Main Router)
├── Auth Routes (No Layout)
├── Layout Wrapper
│   ├── Public Routes
│   ├── Middleman Routes
│   ├── Services Marketplace
│   ├── Services Dashboard
│   ├── Customer Routes
│   ├── Factory Routes
│   ├── Healthcare Routes
│   ├── Profile Routes
│   └── Error Routes
```

### Layout Hierarchy

| Route Category     | Layout           | Auth Required  |
| ------------------ | ---------------- | -------------- |
| Authentication     | None (Full Page) | ❌ No          |
| Public             | Main Layout      | ❌ No          |
| Middleman          | Main Layout      | ✅ Yes         |
| Services           | Services Layout  | ❌ No (mostly) |
| Services Dashboard | Dashboard Layout | ✅ Yes         |
| Customer           | Main Layout      | ✅ Yes         |
| Factory            | Main Layout      | ✅ Yes         |
| Healthcare         | Health Layout    | ❌ No (mostly) |
| Profile            | Main Layout      | ❌ No          |

---

## 📊 Route Categories

| Category                | Route Count | Protected        | Description                               |
| ----------------------- | ----------- | ---------------- | ----------------------------------------- |
| 🔐 Authentication       | 5           | ❌ No            | Login, signup, password recovery          |
| 🌍 Public               | 11          | ❌ No            | Home, products, categories, info pages    |
| 💼 Middleman            | 11          | ✅ Yes           | Middleman dashboard & deal management     |
| 🛠️ Services Marketplace | 4           | ❌ No            | Service browsing & provider profiles      |
| 🎯 Services Dashboard   | 8           | ✅ Yes           | Provider management tools                 |
| 🛒 Customer             | 10          | ✅ Yes           | Shopping, orders, settings                |
| 🏭 Factory              | 4           | ✅ Yes           | Factory production & quotes               |
| 🏥 Healthcare           | 15          | ❌ No (mostly)   | Doctor booking, consultations, compliance |
| 👤 Profile & Social     | 3           | ❌ No            | User profiles & feed                      |
| 💬 Messaging            | 2           | ✅ Yes           | Conversations & chat                      |
| ❌ Error                | 2           | ❌ No            | 404 & 500 pages                           |
| **Total**               | **75**      | **22 Protected** |                                           |

---

## 🔐 Authentication Routes

**No layout wrapper** - Full page components for authentication flows.

| Route               | Component         | File                                      | Description               | Params           |
| ------------------- | ----------------- | ----------------------------------------- | ------------------------- | ---------------- |
| `/signup`           | `SignupPage`      | `src/pages/signup/SignupPage.tsx`         | Main registration page    | None             |
| `/signup/middleman` | `MiddlemanSignup` | `src/pages/middleman/MiddlemanSignup.tsx` | Middleman-specific signup | None             |
| `/login`            | `Login`           | `src/pages/auth/Login.tsx`                | User login                | None             |
| `/forgot-password`  | `ForgotPassword`  | `src/pages/auth/ForgotPassword.tsx`       | Password recovery request | None             |
| `/reset-password`   | `ResetPassword`   | `src/pages/auth/ResetPassword.tsx`        | Set new password          | `?token` (query) |

### Usage Examples

```tsx
import { useNavigate, useSearchParams } from "react-router-dom";

// Navigate to login
navigate("/login");

// Navigate to middleman signup
navigate("/signup/middleman");

// Navigate to reset password with token
navigate("/reset-password?token=abc123xyz");

// Read reset token
const [searchParams] = useSearchParams();
const token = searchParams.get("token");
```

### Post-Auth Redirect Flow

```tsx
// After successful login/signup
const from = location.state?.from || "/";
navigate(from, { replace: true });
```

---

## 🌍 Public Routes

Accessible to all users (authenticated or not). Wrapped in **Main Layout**.

| Route                    | Component              | File                                                     | Description                         |
| ------------------------ | ---------------------- | -------------------------------------------------------- | ----------------------------------- |
| `/`                      | `ServicesGateway`      | `src/pages/public/ServicesGateway.tsx`                   | Homepage - Services/Product gateway |
| `/products`              | `ProductList`          | `src/pages/public/ProductList.tsx`                       | Product listing with filters        |
| `/product/:asin`         | `ProductDetail`        | `src/pages/public/ProductDetail.tsx`                     | Product details (legacy)            |
| `/product-details/:asin` | `ProductDetailsPage`   | `src/pages/public/ProductDetailsPage.tsx`                | Product details (new)               |
| `/categories`            | `CategoriesPage`       | `src/features/categories/pages/CategoriesPage.tsx`       | All categories                      |
| `/categories/:slug`      | `CategoryProductsPage` | `src/features/categories/pages/CategoryProductsPage.tsx` | Products by category                |
| `/brands`                | `Brands`               | `src/App.tsx`                                            | Brands listing (placeholder)        |
| `/brand/:id`             | `BrandProducts`        | `src/App.tsx`                                            | Products by brand (placeholder)     |
| `/about`                 | `About`                | `src/pages/public/About.tsx`                             | About page                          |
| `/contact`               | `Contact`              | `src/pages/public/Contact.tsx`                           | Contact page                        |
| `/help`                  | `Help`                 | `src/pages/public/Help.tsx`                              | Help center / FAQ                   |

### Query Parameters

#### `/products` Query Params

| Param      | Type   | Default   | Description             | Example                 |
| ---------- | ------ | --------- | ----------------------- | ----------------------- |
| `category` | string | -         | Filter by category slug | `?category=electronics` |
| `brand`    | string | -         | Filter by brand         | `?brand=apple`          |
| `minPrice` | number | -         | Minimum price           | `?minPrice=10`          |
| `maxPrice` | number | -         | Maximum price           | `?maxPrice=100`         |
| `rating`   | number | -         | Minimum rating (1-5)    | `?rating=4`             |
| `sort`     | string | `popular` | Sort order              | `?sort=price_asc`       |
| `page`     | number | `1`       | Pagination              | `?page=2`               |
| `search`   | string | -         | Search query            | `?search=laptop`        |

#### Sort Options

```typescript
type SortOption =
  | "price_asc" // Price: Low to High
  | "price_desc" // Price: High to Low
  | "name_asc" // Name: A to Z
  | "name_desc" // Name: Z to A
  | "rating" // Highest Rated
  | "newest" // Newest First
  | "popular"; // Most Popular
```

### Usage Examples

```tsx
// Navigate to products with filters
navigate(
  "/products?category=electronics&minPrice=50&maxPrice=200&sort=price_asc",
);

// Navigate to product details
navigate(`/product-details/B08N5WRWNW`);

// Navigate to category
navigate("/categories/electronics");

// Navigate to search results
navigate("/products?search=wireless+headphones&page=1");
```

---

## 💼 Middleman Routes

**Protected** - Requires authentication. For middleman deal facilitation.

| Route                      | Component              | File                                           | Description           |
| -------------------------- | ---------------------- | ---------------------------------------------- | --------------------- |
| `/middleman`               | `MiddlemanDashboard`   | `src/pages/middleman/MiddlemanDashboard.tsx`   | Dashboard overview    |
| `/middleman/dashboard`     | `MiddlemanDashboard`   | `src/pages/middleman/MiddlemanDashboard.tsx`   | Dashboard (alias)     |
| `/middleman/deals`         | `MiddlemanDeals`       | `src/pages/middleman/MiddlemanDeals.tsx`       | All deals list        |
| `/middleman/deals/new`     | `MiddlemanCreateDeal`  | `src/pages/middleman/MiddlemanCreateDeal.tsx`  | Create new deal       |
| `/middleman/deals/:dealId` | `MiddlemanDealDetails` | `src/pages/middleman/MiddlemanDealDetails.tsx` | Deal details          |
| `/middleman/orders`        | `MiddlemanOrders`      | `src/pages/middleman/MiddlemanOrders.tsx`      | Deal orders tracking  |
| `/middleman/analytics`     | `MiddlemanAnalytics`   | `src/pages/middleman/MiddlemanAnalytics.tsx`   | Performance analytics |
| `/middleman/connections`   | `MiddlemanConnections` | `src/pages/middleman/MiddlemanConnections.tsx` | Business connections  |
| `/middleman/commission`    | `MiddlemanCommission`  | `src/pages/middleman/MiddlemanCommission.tsx`  | Commission tracking   |
| `/middleman/profile`       | `MiddlemanProfile`     | `src/pages/middleman/MiddlemanProfile.tsx`     | Profile management    |
| `/middleman/settings`      | `MiddlemanSettings`    | `src/pages/middleman/MiddlemanSettings.tsx`    | Account settings      |

### Path Parameters

#### `:dealId`

Deal UUID (UUID v4 format)

**Example:** `123e4567-e89b-12d3-a456-426614174000`

### Query Parameters

#### `/middleman/deals` Query Params

| Param    | Type   | Description           | Example          |
| -------- | ------ | --------------------- | ---------------- |
| `status` | string | Filter by deal status | `?status=active` |
| `type`   | string | Filter by deal type   | `?type=bulk`     |

#### Deal Status Options

```typescript
type DealStatus =
  | "draft" // Not published
  | "active" // Live deal
  | "pending" // Awaiting approval
  | "completed" // Deal fulfilled
  | "cancelled"; // Deal cancelled
```

### Usage Examples

```tsx
// Navigate to dashboard
navigate("/middleman");

// Navigate to create deal
navigate("/middleman/deals/new");

// Navigate to deal details
navigate(`/middleman/deals/${dealId}`);

// Navigate to analytics
navigate("/middleman/analytics");
```

---

## 🛠️ Services Marketplace Routes

Public routes for browsing services (main marketplace).

| Route                               | Component             | File                                                          | Description               |
| ----------------------------------- | --------------------- | ------------------------------------------------------------- | ------------------------- |
| `/services`                         | `ServicesHome`        | `src/features/services/pages/ServicesHome.tsx`                | Services marketplace home |
| `/services/:categorySlug`           | `ServiceCategoryPage` | `src/features/services/pages/ServiceCategoryPage.tsx`         | Services by category      |
| `/services/listing/:listingId`      | `ServiceDetailPage`   | `src/features/services/pages/ServiceDetailPage.tsx`           | Service details & booking |
| `/services/listing/:listingId/book` | `ServiceBookingPage`  | `src/features/services/bookings/pages/ServiceBookingPage.tsx` | Book a service            |
| `/services/provider/:providerId`    | `ProviderProfilePage` | `src/features/services/pages/ProviderProfilePage.tsx`         | Provider profile          |

### Path Parameters

| Parameter       | Type   | Description               | Example                                |
| --------------- | ------ | ------------------------- | -------------------------------------- |
| `:categorySlug` | string | Service category URL slug | `plumbing`, `cleaning`                 |
| `:listingId`    | UUID   | Service listing UUID      | `550e8400-e29b-41d4-a716-446655440000` |
| `:providerId`   | UUID   | Service provider UUID     | `550e8400-e29b-41d4-a716-446655440000` |

### Service Categories (Examples)

```typescript
const serviceCategories = [
  "plumbing",
  "electrical",
  "cleaning",
  "tutoring",
  "photography",
  "web-development",
  "graphic-design",
  "consulting",
  "fitness",
  "beauty",
];
```

### Usage Examples

```tsx
// Navigate to services home
navigate("/services");

// Navigate to service category
navigate("/services/plumbing");

// Navigate to service details
navigate("/services/listing/550e8400-e29b-41d4-a716-446655440000");

// Book a service
navigate("/services/listing/550e8400-e29b-41d4-a716-446655440000/book");

// View provider profile
navigate(`/services/provider/${providerId}`);
```

---

## 🎯 Services Dashboard Routes

**Protected** - Requires authentication. For service providers to manage their business.

| Route                                | Component                 | File                                                           | Description             |
| ------------------------------------ | ------------------------- | -------------------------------------------------------------- | ----------------------- |
| `/services/dashboard`                | `DashboardHome`           | `src/features/services/dashboard/pages/DashboardHome.tsx`      | Provider dashboard home |
| `/services/dashboard/bookings`       | `BookingsPage`            | `src/features/services/dashboard/pages/BookingsPage.tsx`       | Manage bookings         |
| `/services/dashboard/projects`       | `Placeholder`             | Coming Soon                                                    | Projects management     |
| `/services/dashboard/listings`       | `Placeholder`             | Coming Soon                                                    | Manage service listings |
| `/services/dashboard/finance`        | `Placeholder`             | Coming Soon                                                    | Financial overview      |
| `/services/dashboard/clients`        | `Placeholder`             | Coming Soon                                                    | Client management       |
| `/services/dashboard/settings`       | `Placeholder`             | Coming Soon                                                    | Dashboard settings      |
| `/services/dashboard/create-profile` | `CreateProviderProfile`   | `src/features/services/pages/CreateProviderProfile.tsx`        | Create provider profile |
| `/services/dashboard/create-listing` | `CreateServiceListing`    | `src/features/services/pages/CreateServiceListing.tsx`         | Create service listing  |
| `/services/dashboard/onboard`        | `ServiceOnboardingWizard` | `src/features/services/components/ServiceOnboardingWizard.tsx` | Onboarding wizard       |
| `/services/onboarding`               | `ServiceOnboardingWizard` | `src/features/services/components/ServiceOnboardingWizard.tsx` | Onboarding (alias)      |

### Layout

Uses **DashboardLayout** - A specialized admin-style layout with sidebar navigation.

### Usage Examples

```tsx
// Navigate to dashboard
navigate("/services/dashboard");

// Navigate to bookings
navigate("/services/dashboard/bookings");

// Create new listing
navigate("/services/dashboard/create-listing");

// Onboarding (for new providers)
navigate("/services/onboarding");
```

---

## 🛒 Customer Routes

**Protected** - Requires authentication. For customer shopping activities.

| Route                | Component           | File                                                     | Description                   |
| -------------------- | ------------------- | -------------------------------------------------------- | ----------------------------- |
| `/cart`              | `CartPage`          | `src/features/cart/pages/CartPage.tsx`                   | Shopping cart                 |
| `/checkout`          | `CheckoutPage`      | `src/features/checkout/pages/CheckoutPage.tsx`           | Checkout flow                 |
| `/order-success/:id` | `OrderSuccessPage`  | `src/features/orders/pages/OrderSuccessPage.tsx`         | Order confirmation            |
| `/profile`           | `ProfilePage`       | `src/features/profile/pages/ProfilePage.tsx`             | User profile                  |
| `/orders`            | `OrdersListPage`    | `src/features/orders/pages/OrdersListPage.tsx`           | Order history                 |
| `/orders/:id`        | `OrderDetailPage`   | `src/features/orders/pages/OrderDetailPage.tsx`          | Order details                 |
| `/wishlist`          | `WishlistPage`      | `src/features/wishlist/pages/WishlistPage.tsx`           | Saved items                   |
| `/addresses`         | `AddressesPage`     | `src/features/addresses/pages/AddressesPage.tsx`         | Address management            |
| `/reviews`           | `Reviews`           | `src/App.tsx`                                            | Product reviews (placeholder) |
| `/notifications`     | `NotificationsPage` | `src/features/notifications/pages/NotificationsPage.tsx` | Notifications                 |
| `/settings`          | `SettingsPage`      | `src/features/settings/pages/SettingsPage.tsx`           | Account settings              |

### Path Parameters

#### `:id` (Order)

Order UUID (UUID v4 format)

**Example:** `123e4567-e89b-12d3-a456-426614174000`

### Query Parameters

#### `/orders` Query Params

| Param    | Type   | Description            | Example           |
| -------- | ------ | ---------------------- | ----------------- |
| `status` | string | Filter by order status | `?status=pending` |
| `page`   | number | Pagination             | `?page=2`         |

#### Order Status Options

```typescript
type OrderStatus =
  | "pending" // Order placed
  | "confirmed" // Confirmed by seller
  | "processing" // Being prepared
  | "shipped" // In transit
  | "delivered" // Delivered
  | "cancelled"; // Cancelled
```

### Usage Examples

```tsx
// Navigate to cart
navigate("/cart");

// Navigate to checkout
navigate("/checkout");

// Navigate to order success
navigate(`/order-success/${orderId}`);

// Navigate to order history
navigate("/orders");

// Navigate to specific order
navigate(`/orders/${orderId}`);

// Filter orders by status
navigate("/orders?status=pending");

// Navigate to profile
navigate("/profile");
```

---

## 🏭 Factory Routes

**Protected** - Requires authentication with factory role. For factory/seller operations.

| Route                  | Component                | File                                           | Description                 |
| ---------------------- | ------------------------ | ---------------------------------------------- | --------------------------- |
| `/factory`             | `FactoryDashboardPage`   | `src/pages/factory/FactoryDashboardPage.tsx`   | Factory analytics dashboard |
| `/factory/production`  | `FactoryProductionPage`  | `src/pages/factory/FactoryProductionPage.tsx`  | Production order tracking   |
| `/factory/quotes`      | `FactoryQuotesPage`      | `src/pages/factory/FactoryQuotesPage.tsx`      | Quote request management    |
| `/factory/connections` | `FactoryConnectionsPage` | `src/pages/factory/FactoryConnectionsPage.tsx` | Business connections        |

### Query Parameters

#### `/factory/production` Query Params

| Param    | Type   | Description                 | Example                 |
| -------- | ------ | --------------------------- | ----------------------- |
| `status` | string | Filter by production status | `?status=in_production` |

#### Production Status Options

```typescript
type ProductionStatus =
  | "pending" // Order received
  | "in_production" // Manufacturing
  | "quality_check" // QC inspection
  | "ready_to_ship" // Prepared for shipping
  | "shipped" // In transit
  | "delivered" // Delivered
  | "cancelled"; // Cancelled
```

#### `/factory/quotes` Query Params

| Param    | Type   | Description            | Example           |
| -------- | ------ | ---------------------- | ----------------- |
| `view`   | string | Quote perspective      | `?view=received`  |
| `status` | string | Filter by quote status | `?status=pending` |

#### Quote Status Options

```typescript
type QuoteStatus =
  | "pending" // Awaiting response
  | "quoted" // Price provided
  | "accepted" // Quote accepted
  | "rejected" // Quote declined
  | "expired"; // Past expiry date
```

#### `/factory/connections` Query Params

| Param    | Type   | Description                 | Example           |
| -------- | ------ | --------------------------- | ----------------- |
| `status` | string | Filter by connection status | `?status=pending` |

#### Connection Status Options

```typescript
type ConnectionStatus =
  | "pending" // Request sent
  | "accepted" // Partnership active
  | "rejected" // Request declined
  | "blocked"; // Partnership blocked
```

### Usage Examples

```tsx
// Navigate to factory dashboard
navigate("/factory");

// Navigate to production tracking
navigate("/factory/production");

// Filter production by status
navigate("/factory/production?status=in_production");

// Navigate to quote requests
navigate("/factory/quotes");

// View received quotes
navigate("/factory/quotes?view=received");

// Navigate to connections
navigate("/factory/connections");

// View pending connections
navigate("/factory/connections?status=pending");
```

---

## 🏥 Healthcare Routes

Specialized routes for healthcare services (doctor booking, consultations, pharmacy).

| Route                                             | Component               | File                                                  | Description                  |
| ------------------------------------------------- | ----------------------- | ----------------------------------------------------- | ---------------------------- |
| `/services/health`                                | `HealthLanding`         | `src/features/health/pages/HealthLanding.tsx`         | Healthcare landing           |
| `/services/health/doctors`                        | `DoctorList`            | `src/features/health/pages/DoctorList.tsx`            | Doctor directory             |
| `/services/health/doctor/signup`                  | `DoctorSignup`          | `src/features/health/pages/DoctorSignup.tsx`          | Doctor registration          |
| `/services/health/doctor/pending-approval`        | `DoctorPendingApproval` | `src/features/health/pages/DoctorPendingApproval.tsx` | Pending approval status      |
| `/services/health/book/:id`                       | `BookingPage`           | `src/features/health/pages/BookingPage.tsx`           | Book doctor appointment      |
| `/services/health/patient/dashboard`              | `PatientDashboard`      | `src/features/health/pages/PatientDashboard.tsx`      | Patient dashboard            |
| `/services/health/doctor/dashboard`               | `DoctorDashboard`       | `src/features/health/pages/DoctorDashboard.tsx`       | Doctor dashboard             |
| `/services/health/admin/verify`                   | `AdminVerification`     | `src/features/health/pages/AdminVerification.tsx`     | Admin verification panel     |
| `/services/health/consult/:id`                    | `ConsultationRoom`      | `src/features/health/pages/ConsultationRoom.tsx`      | Video consultation room      |
| `/services/health/pharmacies`                     | `PharmacyList`          | `src/features/health/pages/PharmacyList.tsx`          | Pharmacy directory           |
| `/services/health/patient/consent/:appointmentId` | `ConsentForm`           | `src/features/health/pages/ConsentForm.tsx`           | Medical consent form (HIPAA) |
| `/services/health/patient/data-export`            | `DataExport`            | `src/features/health/pages/DataExport.tsx`            | GDPR/HIPAA data export       |
| `/services/health/admin/audit-logs`               | `AuditLogs`             | `src/features/health/pages/AuditLogs.tsx`             | Access audit logs            |

### Path Parameters

#### `:id` (Doctor/Booking)

Doctor UUID or Booking UUID (UUID v4 format)

**Example:** `550e8400-e29b-41d4-a716-446655440000`

### Layout

Uses **HealthLayout** - Specialized healthcare-themed layout.

### Usage Examples

```tsx
// Navigate to healthcare landing
navigate("/services/health");

// View doctors list
navigate("/services/health/doctors");

// Book doctor appointment
navigate(`/services/health/book/${doctorId}`);

// Patient dashboard
navigate("/services/health/patient/dashboard");

// Doctor dashboard
navigate("/services/health/doctor/dashboard");

// Join consultation
navigate(`/services/health/consult/${consultationId}`);

// Find pharmacies
navigate("/services/health/pharmacies");
```

---

## 👤 Profile & Social Routes

Public routes for user profiles and social features.

| Route              | Component              | File                                         | Description               |
| ------------------ | ---------------------- | -------------------------------------------- | ------------------------- |
| `/profiles`        | `ProfileDirectoryPage` | `src/pages/profile/ProfileDirectoryPage.tsx` | User profile directory    |
| `/profile/:userId` | `PublicProfilePage`    | `src/pages/profile/PublicProfilePage.tsx`    | Individual public profile |
| `/feed`            | `FeedPage`             | `src/components/feed/FeedPage.tsx`           | Social feed               |

### Path Parameters

#### `:userId`

User UUID (UUID v4 format)

**Example:** `550e8400-e29b-41d4-a716-446655440000`

### Usage Examples

```tsx
// View profile directory
navigate("/profiles");

// View user profile
navigate(`/profile/${userId}`);

// View social feed
navigate("/feed");
```

---

## 💬 Messaging Routes

**Protected** - Requires authentication. For user conversations and chat.

| Route                       | Component  | File                                        | Description                       |
| --------------------------- | ---------- | ------------------------------------------- | --------------------------------- |
| `/messages`                 | `Inbox`    | `src/features/messages/pages/InboxPage.tsx` | Conversation inbox (all messages) |
| `/messages/:conversationId` | `ChatPage` | `src/features/messages/pages/ChatPage.tsx`  | Individual chat conversation      |

### Path Parameters

#### `:conversationId`

Conversation UUID (UUID v4 format)

**Example:** `550e8400-e29b-41d4-a716-446655440000`

### Query Parameters

#### `/messages` Query Params

| Param    | Type   | Description          | Example          |
| -------- | ------ | -------------------- | ---------------- |
| `filter` | string | Filter conversations | `?filter=unread` |
| `type`   | string | Conversation type    | `?type=product`  |

#### Filter Options

```typescript
type MessageFilter =
  | "all" // All conversations (default)
  | "unread" // Unread messages only
  | "archived"; // Archived conversations
```

#### Conversation Types

```typescript
type ConversationType =
  | "product" // Product inquiry
  | "service" // Service booking
  | "health" // Health consultation
  | "factory"; // Factory order
```

### Usage Examples

```tsx
// Navigate to inbox
navigate("/messages");

// Navigate to inbox with filter
navigate("/messages?filter=unread");

// Navigate to specific conversation
navigate(`/messages/${conversationId}`);

// Navigate to chat from conversation list
<Link to={`/messages/${conversationId}`}>Open Chat</Link>;
```

---

## ❌ Error Routes

Error handling routes.

| Route    | Component     | File                               | Description                    |
| -------- | ------------- | ---------------------------------- | ------------------------------ |
| `/error` | `ServerError` | `src/pages/errors/ServerError.tsx` | 500 Server error page          |
| `*`      | `NotFound`    | `src/pages/errors/NotFound.tsx`    | 404 Page not found (catch-all) |

### Usage Examples

```tsx
// Navigate to error page (for testing)
navigate("/error");

// 404 is handled automatically for unknown routes
// <Route path="*" element={<NotFound />} />
```

---

## 🔧 Route Parameters Reference

### All Dynamic Parameters

| Parameter         | Type   | Format       | Used In Routes                                                                                                 | Description            |
| ----------------- | ------ | ------------ | -------------------------------------------------------------------------------------------------------------- | ---------------------- |
| `:asin`           | string | Alphanumeric | `/product/:asin`, `/product-details/:asin`                                                                     | Product ASIN/ID        |
| `:slug`           | string | URL-friendly | `/categories/:slug`, `/services/:categorySlug`                                                                 | Category/service slug  |
| `:id`             | UUID   | UUID v4      | `/brand/:id`, `/orders/:id`, `/order-success/:id`, `/services/health/book/:id`, `/services/health/consult/:id` | Generic resource ID    |
| `:userId`         | UUID   | UUID v4      | `/profile/:userId`                                                                                             | User UUID              |
| `:dealId`         | UUID   | UUID v4      | `/middleman/deals/:dealId`                                                                                     | Deal UUID              |
| `:listingId`      | UUID   | UUID v4      | `/services/listing/:listingId`                                                                                 | Service listing UUID   |
| `:providerId`     | UUID   | UUID v4      | `/services/provider/:providerId`                                                                               | Service provider UUID  |
| `:conversationId` | UUID   | UUID v4      | `/messages/:conversationId`                                                                                    | Chat conversation UUID |

### UUID Format

All UUIDs follow the standard UUID v4 format:

```
xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
```

**Example:** `550e8400-e29b-41d4-a716-446655440000`

---

## 📋 Query Parameters Reference

### Common Query Parameters

| Parameter              | Type   | Routes                                               | Description            |
| ---------------------- | ------ | ---------------------------------------------------- | ---------------------- |
| `page`                 | number | Most list routes                                     | Pagination page number |
| `sort`                 | string | `/products`, `/orders`, `/factory/production`        | Sort order             |
| `status`               | string | `/orders`, `/factory/quotes`, `/factory/connections` | Filter by status       |
| `search`               | string | `/products`                                          | Search query           |
| `category`             | string | `/products`                                          | Category filter        |
| `minPrice`, `maxPrice` | number | `/products`                                          | Price range            |
| `rating`               | number | `/products`                                          | Minimum rating         |
| `view`                 | string | `/factory/quotes`                                    | Perspective filter     |

### Complete Query Parameter Matrix

| Route                  | Supported Query Params                                                          |
| ---------------------- | ------------------------------------------------------------------------------- |
| `/products`            | `category`, `brand`, `minPrice`, `maxPrice`, `rating`, `sort`, `page`, `search` |
| `/categories/:slug`    | `brand`, `price_min`, `price_max`, `sort`, `page`                               |
| `/orders`              | `status`, `page`, `sort`                                                        |
| `/factory/production`  | `status`, `page`                                                                |
| `/factory/quotes`      | `view`, `status`, `page`                                                        |
| `/factory/connections` | `status`, `page`                                                                |
| `/middleman/deals`     | `status`, `type`, `page`                                                        |
| `/messages`            | `filter`, `type`, `page`                                                        |
| `/reset-password`      | `token`                                                                         |

---

## 🧭 Navigation Patterns

### Programmatic Navigation

```tsx
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

function ProductCard({ product }) {
  const navigate = useNavigate();
  const { asin } = useParams();
  const [searchParams] = useSearchParams();

  // Navigate to product details
  const handleViewProduct = () => {
    navigate(`/product-details/${product.asin}`);
  };

  // Navigate with state
  const handleCheckout = () => {
    navigate("/checkout", { state: { from: "cart" } });
  };

  // Read query params
  const page = searchParams.get("page") || "1";
  const category = searchParams.get("category");

  return (
    <div>
      <h3>{product.title}</h3>
      <button onClick={handleViewProduct}>View Details</button>
    </div>
  );
}
```

### Link Navigation

```tsx
import { Link, NavLink } from 'react-router-dom';

// Basic link
<Link to="/products">Products</Link>

// Link with params
<Link to={`/product-details/${product.asin}`}>
  View Product
</Link>

// Link with query params
<Link to="/products?category=electronics&sort=price_asc">
  Electronics (Low to High)
</Link>

// Active link with styling
<NavLink
  to="/orders"
  className={({ isActive }) => isActive ? 'active-link' : 'link'}
>
  Orders
</NavLink>

// Replace navigation
<Link to="/cart" replace>
  Cart
</Link>
```

### Reading URL Parameters

```tsx
import { useParams, useSearchParams } from "react-router-dom";

function ProductDetailsPage() {
  // Path parameters
  const { asin } = useParams<{ asin: string }>();

  // Query parameters
  const [searchParams] = useSearchParams();
  const category = searchParams.get("category");
  const page = searchParams.get("page");

  return (
    <div>
      <h1>Product: {asin}</h1>
      <p>Category: {category}</p>
    </div>
  );
}
```

### Protected Route Navigation

```tsx
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useLocation } from "react-router-dom";

function ProtectedRoute({ children, requiredRole }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    // Redirect to login with return URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
```

---

## 🔒 Route Protection & Guards

### Authentication Guard

Routes that require authentication:

```typescript
const protectedRoutes = [
  // Middleman routes
  "/middleman",
  "/middleman/*",

  // Services dashboard
  "/services/dashboard",
  "/services/dashboard/*",

  // Customer routes
  "/cart",
  "/checkout",
  "/profile",
  "/orders",
  "/orders/*",
  "/wishlist",
  "/addresses",
  "/notifications",
  "/settings",

  // Factory routes
  "/factory",
  "/factory/*",

  // Healthcare (patient/doctor dashboards)
  "/services/health/patient/dashboard",
  "/services/health/doctor/dashboard",
  "/services/health/admin/verify",
];
```

### Role-Based Guards

```typescript
const roleRequired = {
  // Buyer routes
  buyer: ["/cart", "/checkout", "/orders", "/wishlist"],

  // Seller/Factory routes
  seller: ["/factory", "/factory/*"],

  // Service provider routes
  service_provider: ["/services/dashboard", "/services/dashboard/*"],

  // Middleman routes
  middleman: ["/middleman", "/middleman/*"],

  // Doctor routes
  doctor: [
    "/services/health/doctor/dashboard",
    "/services/health/doctor/signup",
  ],

  // Patient routes
  patient: ["/services/health/patient/dashboard", "/services/health/book/*"],
};
```

### Implementation Example

```tsx
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useLocation } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?:
    | "buyer"
    | "seller"
    | "factory"
    | "service_provider"
    | "middleman"
    | "doctor"
    | "patient";
}

export function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
```

---

## 📘 TypeScript Types

### Route Path Types

```typescript
// All route paths
export type RoutePath =
  // Auth
  | "/signup"
  | "/signup/middleman"
  | "/login"
  | "/forgot-password"
  | "/reset-password"

  // Public
  | "/"
  | "/products"
  | "/product/:asin"
  | "/product-details/:asin"
  | "/categories"
  | "/categories/:slug"
  | "/brands"
  | "/brand/:id"
  | "/about"
  | "/contact"
  | "/help"

  // Middleman
  | "/middleman"
  | "/middleman/dashboard"
  | "/middleman/deals"
  | "/middleman/deals/new"
  | "/middleman/deals/:dealId"
  | "/middleman/orders"
  | "/middleman/analytics"
  | "/middleman/connections"
  | "/middleman/commission"
  | "/middleman/profile"
  | "/middleman/settings"

  // Services
  | "/services"
  | "/services/:categorySlug"
  | "/services/listing/:listingId"
  | "/services/listing/:listingId/book"
  | "/services/provider/:providerId"
  | "/services/dashboard"
  | "/services/dashboard/bookings"
  | "/services/dashboard/projects"
  | "/services/dashboard/listings"
  | "/services/dashboard/finance"
  | "/services/dashboard/clients"
  | "/services/dashboard/settings"
  | "/services/dashboard/create-profile"
  | "/services/dashboard/create-listing"
  | "/services/dashboard/onboard"
  | "/services/onboarding"

  // Customer
  | "/cart"
  | "/checkout"
  | "/order-success/:id"
  | "/profile"
  | "/orders"
  | "/orders/:id"
  | "/wishlist"
  | "/addresses"
  | "/reviews"
  | "/notifications"
  | "/settings"

  // Factory
  | "/factory"
  | "/factory/production"
  | "/factory/quotes"
  | "/factory/connections"

  // Healthcare
  | "/services/health"
  | "/services/health/doctors"
  | "/services/health/doctor/signup"
  | "/services/health/doctor/pending-approval"
  | "/services/health/book/:id"
  | "/services/health/patient/dashboard"
  | "/services/health/doctor/dashboard"
  | "/services/health/admin/verify"
  | "/services/health/consult/:id"
  | "/services/health/pharmacies"

  // Profile & Social
  | "/profiles"
  | "/profile/:userId"
  | "/feed"

  // Error
  | "/error";
```

### Route Parameters Interface

```typescript
export interface RouteParamsMap {
  "/product/:asin": { asin: string };
  "/product-details/:asin": { asin: string };
  "/categories/:slug": { slug: string };
  "/brand/:id": { id: string };
  "/services/:categorySlug": { categorySlug: string };
  "/services/listing/:listingId": { listingId: string };
  "/services/provider/:providerId": { providerId: string };
  "/order-success/:id": { id: string };
  "/orders/:id": { id: string };
  "/middleman/deals/:dealId": { dealId: string };
  "/services/health/book/:id": { id: string };
  "/services/health/consult/:id": { id: string };
  "/profile/:userId": { userId: string };
}
```

### Query Parameters Interfaces

```typescript
export interface ProductQueryParams {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  sort?: SortOption;
  page?: number;
  search?: string;
}

export interface OrderQueryParams {
  status?: OrderStatus;
  page?: number;
  sort?: string;
}

export interface ProductionQueryParams {
  status?: ProductionStatus;
  page?: number;
}

export interface QuoteQueryParams {
  view?: "received" | "sent";
  status?: QuoteStatus;
  page?: number;
}

export interface ConnectionQueryParams {
  status?: ConnectionStatus;
  page?: number;
}

export interface DealQueryParams {
  status?: DealStatus;
  type?: string;
  page?: number;
}

export interface MessageQueryParams {
  filter?: MessageFilter;
  type?: "buyer" | "seller";
  page?: number;
}
```

### Navigation Helper Function

```typescript
// lib/navigation.ts

import { NavigateOptions } from "react-router-dom";

export interface NavigationOptions extends NavigateOptions {
  params?: Record<string, string | number>;
  query?: Record<string, string | number | boolean | null>;
}

/**
 * Build a path with parameters and query strings
 */
export function buildPath(
  path: string,
  params?: Record<string, string | number>,
  query?: Record<string, string | number | boolean | null>,
): string {
  let result = path;

  // Replace path parameters
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      result = result.replace(`:${key}`, String(value));
    });
  }

  // Add query parameters
  if (query && Object.keys(query).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    result += `?${searchParams.toString()}`;
  }

  return result;
}

// Usage examples
const productPath = buildPath("/product-details/:asin", { asin: "B08N5WRWNW" });
// Result: '/product-details/B08N5WRWNW'

const productsWithFilters = buildPath("/products", undefined, {
  category: "electronics",
  minPrice: 50,
  maxPrice: 200,
  page: 2,
});
// Result: '/products?category=electronics&minPrice=50&maxPrice=200&page=2'

const orderPath = buildPath(
  "/orders/:id",
  { id: orderId },
  { status: "pending" },
);
// Result: '/orders/123e4567-e89b-12d3-a456-426614174000?status=pending'
```

---

## 📊 Route Statistics

### By Category

| Category             | Routes | With Params | Protected | Public |
| -------------------- | ------ | ----------- | --------- | ------ |
| Authentication       | 5      | 0           | 0         | 5      |
| Public               | 11     | 4           | 0         | 11     |
| Middleman            | 11     | 1           | 11        | 0      |
| Services Marketplace | 4      | 3           | 0         | 4      |
| Services Dashboard   | 8      | 0           | 8         | 0      |
| Customer             | 10     | 1           | 10        | 0      |
| Factory              | 4      | 0           | 4         | 0      |
| Healthcare           | 15     | 2           | 3         | 12     |
| Profile & Social     | 3      | 1           | 0         | 3      |
| Messaging            | 2      | 1           | 2         | 0      |
| Error                | 2      | 0           | 0         | 2      |
| **Total**            | **75** | **13**      | **38**    | **37** |

### By Layout

| Layout           | Route Count |
| ---------------- | ----------- |
| None (Auth)      | 5           |
| Main Layout      | 47          |
| Services Layout  | 4           |
| Dashboard Layout | 8           |
| Health Layout    | 15          |
| **Total**        | **75**      |

---

## 🔗 Related Documentation

- [App.tsx](./src/App.tsx) - Main application routing implementation
- [README.md](./README.md) - Complete project documentation
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [ROUTE-VISUALIZATION.md](./ROUTE-VISUALIZATION.md) - Interactive route visualization

---

**Last Updated:** March 23, 2026  
**Maintained by:** Youssef  
**Version:** 3.1.0
