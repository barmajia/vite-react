# 🗺️ Aurora E-commerce - Route Architecture

> **Reorganized route structure with clear vertical separation**

**Version:** 4.0.0  
**Last Updated:** March 23, 2026  
**Total Routes:** 75+

---

## 🏗️ Route Architecture Overview

```
/
├── /auth/* (Authentication - No Layout)
├── / (Main Layout)
│   ├── /products/* (E-commerce Vertical)
│   ├── /services/* (Services Vertical)
│   │   └── /health/* (Healthcare Sub-Vertical)
│   ├── /middleman/* (Middleman Vertical)
│   ├── /factory/* (Factory Vertical)
│   ├── /messages/* (Unified Chat)
│   ├── /profile/* (User Profiles)
│   └── /cart, /checkout, /orders (Shopping Flow)
```

---

## 📊 Route Distribution

| Vertical         | Route Count | Protected        | Description                      |
| ---------------- | ----------- | ---------------- | -------------------------------- |
| 🔐 Auth          | 5           | ❌ No            | Login, signup, password recovery |
| 🛒 Products      | 8           | ❌ No (browse)   | Product browsing & discovery     |
| 🛍️ Shopping Flow | 7           | ✅ Yes           | Cart, checkout, orders           |
| 🛠️ Services      | 11          | ❌ No (browse)   | Service marketplace              |
| 🏥 Healthcare    | 12          | ❌ No (mostly)   | Doctors, appointments, pharmacy  |
| 💼 Middleman     | 11          | ✅ Yes           | Deal facilitation                |
| 🏭 Factory       | 4           | ✅ Yes           | Production & quotes              |
| 💬 Messages      | 2           | ✅ Yes           | Unified chat                     |
| 👤 Profile       | 4           | ❌ No            | User profiles & social           |
| ⚙️ Settings      | 2           | ✅ Yes           | Settings & notifications         |
| ❌ Error         | 2           | ❌ No            | Error pages                      |
| **Total**        | **75**      | **22 Protected** |                                  |

---

## 🔐 Auth Routes (No Layout)

| Route               | Component         | Description            |
| ------------------- | ----------------- | ---------------------- |
| `/login`            | `Login`           | User login             |
| `/signup`           | `SignupPage`      | Main registration      |
| `/signup/middleman` | `MiddlemanSignup` | Middleman registration |
| `/forgot-password`  | `ForgotPassword`  | Password recovery      |
| `/reset-password`   | `ResetPassword`   | Set new password       |

---

## 🛒 Products Vertical (`/products`)

### Product Discovery (Public)

| Route                        | Component              | Description           |
| ---------------------------- | ---------------------- | --------------------- |
| `/products`                  | `ProductList`          | Browse all products   |
| `/products/:asin`            | `ProductDetail`        | Product details       |
| `/products/details/:asin`    | `ProductDetailsPage`   | Product details (new) |
| `/products/categories`       | `CategoriesPage`       | All categories        |
| `/products/categories/:slug` | `CategoryProductsPage` | Products by category  |
| `/products/brands`           | `Brands`               | Brands (placeholder)  |
| `/products/brands/:id`       | `BrandProducts`        | Products by brand     |

### Shopping Flow (Protected)

| Route                | Component          | Description        |
| -------------------- | ------------------ | ------------------ |
| `/cart`              | `CartPage`         | Shopping cart      |
| `/checkout`          | `CheckoutPage`     | Checkout flow      |
| `/order-success/:id` | `OrderSuccessPage` | Order confirmation |
| `/orders`            | `OrdersListPage`   | Order history      |
| `/orders/:id`        | `OrderDetailPage`  | Order details      |
| `/wishlist`          | `WishlistPage`     | Saved items        |
| `/addresses`         | `AddressesPage`    | Shipping addresses |

---

## 🛠️ Services Vertical (`/services`)

### Service Marketplace (Public)

| Route                               | Component             | Description          |
| ----------------------------------- | --------------------- | -------------------- |
| `/services`                         | `ServicesHome`        | Services landing     |
| `/services/:categorySlug`           | `ServiceCategoryPage` | Services by category |
| `/services/listing/:listingId`      | `ServiceDetailPage`   | Service details      |
| `/services/listing/:listingId/book` | `ServiceBookingPage`  | Book a service       |
| `/services/provider/:providerId`    | `ProviderProfilePage` | Provider profile     |

### Services Dashboard (Protected)

| Route                                | Component                 | Description             |
| ------------------------------------ | ------------------------- | ----------------------- |
| `/services/dashboard`                | `DashboardHome`           | Provider dashboard      |
| `/services/dashboard/bookings`       | `BookingsPage`            | Manage bookings         |
| `/services/dashboard/create-profile` | `CreateProviderProfile`   | Create provider profile |
| `/services/dashboard/create-listing` | `CreateServiceListing`    | Create service listing  |
| `/services/dashboard/onboard`        | `ServiceOnboardingWizard` | Onboarding wizard       |
| `/services/onboarding`               | `ServiceOnboardingWizard` | Onboarding (alias)      |

---

## 🏥 Healthcare Sub-Vertical (`/services/health`)

| Route                                             | Component               | Description         |
| ------------------------------------------------- | ----------------------- | ------------------- |
| `/services/health`                                | `HealthLanding`         | Healthcare landing  |
| `/services/health/doctors`                        | `DoctorList`            | Find doctors        |
| `/services/health/doctor/signup`                  | `DoctorSignup`          | Doctor registration |
| `/services/health/doctor/pending-approval`        | `DoctorPendingApproval` | Pending approval    |
| `/services/health/book/:id`                       | `BookingPage`           | Book appointment    |
| `/services/health/patient/dashboard`              | `PatientDashboard`      | Patient dashboard   |
| `/services/health/doctor/dashboard`               | `DoctorDashboard`       | Doctor dashboard    |
| `/services/health/admin/verify`                   | `AdminVerification`     | Admin verification  |
| `/services/health/consult/:id`                    | `ConsultationRoom`      | Video consultation  |
| `/services/health/pharmacies`                     | `PharmacyList`          | Find pharmacies     |
| `/services/health/patient/consent/:appointmentId` | `ConsentForm`           | Medical consent     |
| `/services/health/patient/data-export`            | `DataExport`            | GDPR data export    |
| `/services/health/admin/audit-logs`               | `AuditLogs`             | Audit logs          |

---

## 💼 Middleman Vertical (`/middleman`)

| Route                      | Component              | Description           |
| -------------------------- | ---------------------- | --------------------- |
| `/middleman`               | `MiddlemanDashboard`   | Dashboard overview    |
| `/middleman/deals`         | `MiddlemanDeals`       | All deals             |
| `/middleman/deals/new`     | `MiddlemanCreateDeal`  | Create deal           |
| `/middleman/deals/:dealId` | `MiddlemanDealDetails` | Deal details          |
| `/middleman/orders`        | `MiddlemanOrders`      | Deal orders           |
| `/middleman/analytics`     | `MiddlemanAnalytics`   | Performance analytics |
| `/middleman/connections`   | `MiddlemanConnections` | Business connections  |
| `/middleman/commission`    | `MiddlemanCommission`  | Commission tracking   |
| `/middleman/profile`       | `MiddlemanProfile`     | Profile management    |
| `/middleman/settings`      | `MiddlemanSettings`    | Account settings      |

---

## 🏭 Factory Vertical (`/factory`)

| Route                  | Component                | Description          |
| ---------------------- | ------------------------ | -------------------- |
| `/factory`             | `FactoryDashboardPage`   | Factory analytics    |
| `/factory/production`  | `FactoryProductionPage`  | Production tracking  |
| `/factory/quotes`      | `FactoryQuotesPage`      | Quote requests       |
| `/factory/connections` | `FactoryConnectionsPage` | Business connections |

---

## 💬 Messages (Cross-Vertical)

| Route                       | Component  | Description        |
| --------------------------- | ---------- | ------------------ |
| `/messages`                 | `Inbox`    | Conversation inbox |
| `/messages/:conversationId` | `ChatPage` | Active chat        |

---

## 👤 Profile & Social (Cross-Vertical)

| Route              | Component              | Description           |
| ------------------ | ---------------------- | --------------------- |
| `/profile`         | `ProfilePage`          | My profile            |
| `/profile/:userId` | `PublicProfilePage`    | User's public profile |
| `/profiles`        | `ProfileDirectoryPage` | User directory        |
| `/feed`            | `FeedPage`             | Social feed           |
| `/reviews`         | `Reviews`              | Reviews (placeholder) |

---

## ⚙️ Settings & Notifications

| Route            | Component           | Description      |
| ---------------- | ------------------- | ---------------- |
| `/settings`      | `SettingsPage`      | Account settings |
| `/notifications` | `NotificationsPage` | Notifications    |

---

## ℹ️ Info Pages

| Route      | Component | Description  |
| ---------- | --------- | ------------ |
| `/about`   | `About`   | About page   |
| `/contact` | `Contact` | Contact page |
| `/help`    | `Help`    | Help center  |

---

## ❌ Error Pages

| Route    | Component     | Description   |
| -------- | ------------- | ------------- |
| `/error` | `ServerError` | 500 error     |
| `*`      | `NotFound`    | 404 not found |

---

## 📁 File Structure

```
src/
├── App.tsx (Main Router)
├── pages/
│   ├── auth/
│   ├── public/
│   ├── factory/
│   ├── middleman/
│   ├── profile/
│   └── errors/
├── features/
│   ├── cart/
│   ├── checkout/
│   ├── orders/
│   ├── categories/
│   ├── addresses/
│   ├── wishlist/
│   ├── profile/
│   ├── settings/
│   ├── notifications/
│   ├── messages/
│   ├── services/
│   │   ├── pages/
│   │   ├── bookings/
│   │   └── dashboard/
│   └── health/
│       ├── pages/
│       └── layouts/
├── components/
│   ├── layout/
│   ├── feed/
│   ├── chat/
│   └── ui/
└── hooks/
```

---

## 🔐 Route Protection

All routes under the main layout are accessible without authentication **except**:

- `/cart`, `/checkout`, `/orders/*` - Shopping flow
- `/wishlist`, `/addresses` - Customer features
- `/messages/*` - Chat system
- `/profile` (without userId) - User's own profile
- `/settings`, `/notifications` - User settings
- `/services/dashboard/*` - Service provider dashboard
- `/middleman/*` - Middleman features
- `/factory/*` - Factory features
- `/services/health/patient/*` - Patient features
- `/services/health/doctor/dashboard` - Doctor dashboard
- `/services/health/admin/*` - Admin features

**Note:** Route-level protection is handled by components checking `useAuth()` hook.

---

## 🚀 Navigation Examples

```tsx
import { useNavigate, Link } from "react-router-dom";

// Products
navigate("/products");
navigate("/products/:asin");
navigate("/products/categories/electronics");

// Shopping
navigate("/cart");
navigate("/checkout");
navigate(`/orders/${orderId}`);

// Services
navigate("/services");
navigate("/services/plumbing");
navigate("/services/listing/:listingId");
navigate("/services/dashboard");

// Healthcare
navigate("/services/health");
navigate("/services/health/doctors");
navigate(`/services/health/book/${doctorId}`);

// Middleman
navigate("/middleman");
navigate("/middleman/deals/new");
navigate(`/middleman/deals/${dealId}`);

// Factory
navigate("/factory");
navigate("/factory/quotes");

// Messages
navigate("/messages");
navigate(`/messages/${conversationId}`);

// Profile
navigate("/profile");
navigate(`/profile/${userId}`);
```

---

**Last Updated:** March 23, 2026  
**Version:** 4.0.0
