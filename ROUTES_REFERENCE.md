# 🗺️ Aurora E-commerce - Complete Routes Reference

**Generated:** March 10, 2026  
**Total Routes:** 32  
**Framework:** React Router DOM v7

---

## 📋 Table of Contents

1. [Public Routes](#public-routes) (8 routes)
2. [Auth Routes](#auth-routes) (4 routes)
3. [Customer Routes (Protected)](#customer-routes-protected) (13 routes)
4. [Factory Routes (Protected)](#factory-routes-protected) (4 routes)
5. [Error Routes](#error-routes) (2 routes)
6. [Route Parameters Reference](#route-parameters-reference)
7. [Navigation Examples](#navigation-examples)

---

## 🌍 Public Routes

Accessible without authentication.

| Route | Component | File | Description |
|-------|-----------|------|-------------|
| `/` | `Home` | `src/pages/public/Home.tsx` | Homepage with featured products |
| `/products` | `ProductList` | `src/pages/public/ProductList.tsx` | All products with filters |
| `/product/:asin` | `ProductDetail` | `src/pages/public/ProductDetail.tsx` | Single product details |
| `/categories` | `CategoriesPage` | `src/features/categories/pages/CategoriesPage.tsx` | All categories |
| `/categories/:slug` | `CategoryProductsPage` | `src/features/categories/pages/CategoryProductsPage.tsx` | Products by category |
| `/brands` | `Brands` | `src/App.tsx` | All brands (placeholder) |
| `/brand/:id` | `BrandProducts` | `src/App.tsx` | Products by brand (placeholder) |
| `/about` | `About` | `src/pages/public/About.tsx` | About page |
| `/contact` | `Contact` | `src/pages/public/Contact.tsx` | Contact page |
| `/help` | `Help` | `src/pages/public/Help.tsx` | Help center / FAQ |

---

## 🔐 Auth Routes

Public routes for authentication flows.

| Route | Component | File | Description |
|-------|-----------|------|-------------|
| `/login` | `Login` | `src/pages/auth/Login.tsx` | User login |
| `/signup` | `Signup` | `src/pages/auth/Signup.tsx` | User registration |
| `/forgot-password` | `ForgotPassword` | `src/pages/auth/ForgotPassword.tsx` | Password reset request |
| `/reset-password` | `ResetPassword` | `src/pages/auth/ResetPassword.tsx` | Set new password |

---

## 🛒 Customer Routes (Protected)

Require authentication. Redirect to `/login` if not logged in.

| Route | Component | File | Description |
|-------|-----------|------|-------------|
| `/cart` | `CartPage` | `src/features/cart/pages/CartPage.tsx` | Shopping cart |
| `/checkout` | `CheckoutPage` | `src/features/checkout/pages/CheckoutPage.tsx` | Checkout flow |
| `/order-success/:id` | `OrderSuccessPage` | `src/features/orders/pages/OrderSuccessPage.tsx` | Order confirmation |
| `/profile` | `ProfilePage` | `src/features/profile/pages/ProfilePage.tsx` | User profile |
| `/orders` | `OrdersListPage` | `src/features/orders/pages/OrdersListPage.tsx` | Order history |
| `/orders/:id` | `OrderDetailPage` | `src/features/orders/pages/OrderDetailPage.tsx` | Single order details |
| `/wishlist` | `WishlistPage` | `src/features/wishlist/pages/WishlistPage.tsx` | Saved items |
| `/addresses` | `AddressesPage` | `src/features/addresses/pages/AddressesPage.tsx` | Address management |
| `/reviews` | `Reviews` | `src/App.tsx` | Product reviews (placeholder) |
| `/messages` | `Inbox` | `src/pages/messaging/Inbox.tsx` | Message inbox |
| `/messages/:conversationId` | `Chat` | `src/pages/messaging/Chat.tsx` | Chat conversation |
| `/notifications` | `NotificationsPage` | `src/features/notifications/pages/NotificationsPage.tsx` | Notifications |
| `/settings` | `SettingsPage` | `src/features/settings/pages/SettingsPage.tsx` | Account settings |

---

## 🏭 Factory Routes (Protected)

Require authentication. For factory/seller dashboard.

| Route | Component | File | Description |
|-------|-----------|------|-------------|
| `/factory` | `FactoryDashboardPage` | `src/pages/factory/FactoryDashboardPage.tsx` | Factory analytics dashboard |
| `/factory/production` | `FactoryProductionPage` | `src/pages/factory/FactoryProductionPage.tsx` | Production orders |
| `/factory/quotes` | `FactoryQuotesPage` | `src/pages/factory/FactoryQuotesPage.tsx` | Quote requests |
| `/factory/connections` | `FactoryConnectionsPage` | `src/pages/factory/FactoryConnectionsPage.tsx` | Factory connections |

---

## ❌ Error Routes

| Route | Component | File | Description |
|-------|-----------|------|-------------|
| `/error` | `ServerError` | `src/pages/errors/ServerError.tsx` | 500 server error page |
| `*` | `NotFound` | `src/pages/errors/NotFound.tsx` | 404 not found (catch-all) |

---

## 🔧 Route Parameters Reference

### Dynamic Parameters

| Parameter | Type | Used In | Description |
|-----------|------|---------|-------------|
| `:asin` | string | `/product/:asin` | Product ASIN/ID |
| `:slug` | string | `/categories/:slug` | Category URL slug |
| `:id` | UUID | `/brand/:id`, `/orders/:id`, `/order-success/:id` | Brand/Order UUID |
| `:conversationId` | UUID | `/messages/:conversationId` | Conversation UUID |

---

## 🧭 Navigation Examples

### Using React Router `useNavigate`

```tsx
import { useNavigate } from 'react-router-dom';

function MyComponent() {
  const navigate = useNavigate();

  // Navigate to product detail
  navigate('/product/B08N5WRWNW');

  // Navigate to order detail
  navigate('/orders/123e4567-e89b-12d3-a456-426614174000');

  // Navigate to chat
  navigate('/messages/123e4567-e89b-12d3-a456-426614174000');

  // Navigate with state
  navigate('/product/ABC123', { state: { from: 'cart' } });

  // Go back
  navigate(-1);
}
```

### Using React Router `Link`

```tsx
import { Link } from 'react-router-dom';

// Product link
<Link to="/product/B08N5WRWNW">View Product</Link>

// Category link
<Link to="/categories/electronics">Electronics</Link>

// Order link
<Link to={`/orders/${orderId}`}>View Order</Link>

// Message link
<Link to={`/messages/${conversationId}`}>Open Chat</Link>
```

### Using ROUTES Constant

```tsx
import { ROUTES } from '@/lib/constants';

// Navigate to home
navigate(ROUTES.HOME);

// Navigate to products
navigate(ROUTES.PRODUCTS);

// Navigate to cart
navigate(ROUTES.CART);

// Navigate to profile
navigate(ROUTES.PROFILE);
```

---

## 📊 Route Protection Logic

### Protected Routes Flow

```tsx
// In AuthProvider or Route Guard
if (!user && isProtectedRoute) {
  navigate('/login', { state: { from: location.pathname } });
}
```

### Protected Routes List

All routes except:
- Public routes (Home, Products, About, Contact, Help)
- Auth routes (Login, Signup, Forgot/Reset Password)
- Error routes

**Protected:**
- `/cart`
- `/checkout`
- `/order-success/*`
- `/profile`
- `/orders/*`
- `/wishlist`
- `/addresses`
- `/reviews`
- `/messages/*`
- `/notifications`
- `/settings`
- `/factory/*`

---

## 🎯 Common Navigation Patterns

### After Login
```tsx
// Redirect to intended page or home
const from = location.state?.from || '/';
navigate(from, { replace: true });
```

### After Order Creation
```tsx
// Navigate to order success page
navigate(`/order-success/${orderId}`, { replace: true });
```

### After Adding to Cart
```tsx
// Navigate to cart
navigate('/cart');
```

### From Product to Chat
```tsx
// Navigate to chat with seller
navigate(`/messages/${conversationId}`);
```

---

## 📱 Mobile Navigation

### Bottom Navigation (MobileNav)

Typical mobile nav items:
- Home (`/`)
- Products (`/products`)
- Cart (`/cart`)
- Messages (`/messages`)
- Profile (`/profile`)

---

## 🔍 Search & Filter Routes

### Product Search
```
/products?search=laptop&category=electronics&sort=price_asc
```

### Category Filter
```
/categories/electronics?brand=apple&price_min=500&price_max=2000
```

### Orders Filter
```
/orders?status=pending&sort=date_desc
```

---

## 🎨 Breadcrumb Examples

### Product Detail
```
Home > Products > Electronics > Product Name
/ > /products > /categories/electronics > /product/:asin
```

### Order Detail
```
Home > Profile > Orders > Order #12345
/ > /profile > /orders > /orders/:id
```

### Chat
```
Home > Messages > Conversation
/ > /messages > /messages/:conversationId
```

---

## 🚀 Code Splitting Ready

Routes are ready for lazy loading:

```tsx
import { lazy, Suspense } from 'react-router-dom';

const ProductDetail = lazy(() => import('@/pages/public/ProductDetail'));

// In routes
<Suspense fallback={<LoadingSpinner />}>
  <Route path="product/:asin" element={<ProductDetail />} />
</Suspense>
```

---

## 📋 Quick Reference Table

| Category | Count | Routes |
|----------|-------|--------|
| **Public** | 10 | `/`, `/products`, `/product/:asin`, `/categories`, `/categories/:slug`, `/brands`, `/brand/:id`, `/about`, `/contact`, `/help` |
| **Auth** | 4 | `/login`, `/signup`, `/forgot-password`, `/reset-password` |
| **Customer** | 13 | `/cart`, `/checkout`, `/order-success/:id`, `/profile`, `/orders`, `/orders/:id`, `/wishlist`, `/addresses`, `/reviews`, `/messages`, `/messages/:conversationId`, `/notifications`, `/settings` |
| **Factory** | 4 | `/factory`, `/factory/production`, `/factory/quotes`, `/factory/connections` |
| **Error** | 2 | `/error`, `*` |
| **Total** | **33** | |

---

## 🛠️ Utilities

### Get Current Route
```tsx
import { useLocation } from 'react-router-dom';

const location = useLocation();
console.log(location.pathname); // "/products"
console.log(location.search); // "?category=electronics"
console.log(location.state); // { from: 'cart' }
```

### Check if Route is Protected
```tsx
const protectedRoutes = ['/cart', '/checkout', '/profile', '/orders', '/messages', '/settings', '/factory'];
const isProtected = protectedRoutes.some(route => location.pathname.startsWith(route));
```

### Match Route Pattern
```tsx
import { matchPath } from 'react-router-dom';

const match = matchPath('/product/:asin', location.pathname);
if (match) {
  console.log(match.params.asin); // Product ID
}
```

---

**Last Updated:** March 10, 2026  
**Version:** 1.0.0  
**Total Routes:** 33
