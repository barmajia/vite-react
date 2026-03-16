# Aurora E-commerce - Complete Routes Reference

> Comprehensive documentation of all routes, parameters, and navigation patterns in the Aurora E-commerce platform.

**Version:** 2.0.0  
**Last Updated:** March 16, 2026  
**Total Routes:** 45+

---

## 📋 Table of Contents

- [Route Overview](#route-overview)
- [Auth Routes](#-auth-routes)
- [Public Routes](#-public-routes)
- [Services Routes](#-services-routes)
- [Customer Routes](#-customer-routes)
- [Messaging Routes](#-messaging-routes)
- [Factory Routes](#-factory-routes)
- [Error Routes](#-error-routes)
- [Navigation Examples](#-navigation-examples)
- [Route Guards](#-route-guards)
- [TypeScript Types](#-typescript-types)

---

## 🗺️ Route Overview

| Category | Count | Auth Required | Layout |
|----------|-------|---------------|--------|
| Auth Routes | 5 | ❌ No | ❌ No |
| Public Routes | 9 | ❌ No | ✅ Yes |
| Services Routes | 7 | ❌ No (mostly) | ✅ Yes |
| Customer Routes | 13 | ✅ Yes | ✅ Yes |
| Messaging Routes | 2 | ✅ Yes | ✅ Yes |
| Factory Routes | 4 | ✅ Yes | ✅ Yes |
| Error Routes | 2 | ❌ No | ✅ Yes |
| **Total** | **42** | - | - |

---

## 🔐 Auth Routes

Full-page routes without the main layout wrapper.

| Route | Component | Params | Description |
|-------|-----------|--------|-------------|
| `/signup` | `ServicesSignup` | None | User registration page |
| `/login` | `Login` | None | User login page |
| `/services/onboarding` | `OnboardingWizard` | None | New user onboarding wizard |
| `/forgot-password` | `ForgotPassword` | None | Password recovery request |
| `/reset-password` | `ResetPassword` | `?token` (query) | Password reset with token |

### Usage Examples

```tsx
// Navigate to login
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
navigate('/login');

// Navigate to reset password with token
navigate('/reset-password?token=abc123xyz');

// Navigate to signup
navigate('/signup');
```

---

## 🌍 Public Routes

Accessible to all users (authenticated or not).

| Route | Component | Params | Description |
|-------|-----------|--------|-------------|
| `/` | `ServicesGateway` | None | Homepage - Services/Product gateway |
| `/products` | `ProductList` | Query params | Product listing with filters |
| `/product/:asin` | `ProductDetail` | `asin` (string) | Product details (legacy route) |
| `/product-details/:asin` | `ProductDetailsPage` | `asin` (string) | Product details page |
| `/categories` | `CategoriesPage` | None | All categories listing |
| `/categories/:slug` | `CategoryProductsPage` | `slug` (string) | Products by category |
| `/brands` | `Brands` | None | Brands listing (placeholder) |
| `/brand/:id` | `BrandProducts` | `id` (string) | Products by brand (placeholder) |
| `/about` | `About` | None | About page |
| `/contact` | `Contact` | None | Contact page |
| `/help` | `Help` | None | Help center |

### Query Parameters

#### `/products` Query Params

| Param | Type | Description | Example |
|-------|------|-------------|---------|
| `category` | string | Filter by category slug | `?category=electronics` |
| `brand` | string | Filter by brand | `?brand=apple` |
| `minPrice` | number | Minimum price filter | `?minPrice=10` |
| `maxPrice` | number | Maximum price filter | `?maxPrice=100` |
| `rating` | number | Minimum rating | `?rating=4` |
| `sort` | string | Sort order | `?sort=price_asc` |
| `page` | number | Pagination | `?page=2` |
| `search` | string | Search query | `?search=laptop` |

#### Sort Options

```typescript
type SortOption = 
  | 'price_asc'    // Price: Low to High
  | 'price_desc'   // Price: High to Low
  | 'name_asc'     // Name: A to Z
  | 'name_desc'    // Name: Z to A
  | 'rating'       // Highest Rated
  | 'newest'       // Newest First
  | 'popular';     // Most Popular
```

### Usage Examples

```tsx
// Navigate to products with filters
navigate('/products?category=electronics&minPrice=50&maxPrice=200&sort=price_asc');

// Navigate to product details
navigate(`/product-details/B08N5WRWNW`);

// Navigate to category
navigate('/categories/electronics');

// Navigate to search results
navigate('/products?search=wireless+headphones&page=1');
```

---

## 🧰 Services Routes

Services marketplace routes (main focus of the platform).

| Route | Component | Params | Auth | Description |
|-------|-----------|--------|------|-------------|
| `/services` | `ServicesHome` | None | ❌ | Services marketplace home |
| `/services/:categorySlug` | `ServiceCategoryPage` | `categorySlug` (string) | ❌ | Services by category |
| `/services/listing/:listingSlug` | `ServiceDetailPage` | `listingSlug` (string) | ❌ | Service details & booking |
| `/services/provider/:providerId` | `ProviderProfilePage` | `providerId` (string) | ❌ | Service provider profile |
| `/services/dashboard` | `ProviderDashboardPage` | None | ✅ | Provider dashboard |
| `/services/dashboard/create-profile` | `CreateProviderProfile` | None | ✅ | Create provider profile |
| `/services/dashboard/create-listing` | `CreateServiceListing` | None | ✅ | Create service listing |

### Path Parameters

#### `categorySlug`
Service category identifier (URL-friendly string)

**Examples:**
- `plumbing`
- `electrical`
- `cleaning`
- `tutoring`
- `photography`

#### `listingSlug`
Service listing identifier (URL-friendly string)

**Examples:**
- `emergency-plumber-nyc`
- `professional-headshot-session`
- `deep-cleaning-service`

#### `providerId`
Service provider UUID

**Format:** UUID v4  
**Example:** `550e8400-e29b-41d4-a716-446655440000`

### Usage Examples

```tsx
// Navigate to services home
navigate('/services');

// Navigate to service category
navigate('/services/plumbing');

// Navigate to service details
navigate('/services/listing/emergency-plumber-nyc');

// Navigate to provider profile
navigate(`/services/provider/${providerId}`);

// Navigate to provider dashboard (protected)
navigate('/services/dashboard');

// Create new listing (protected)
navigate('/services/dashboard/create-listing');
```

---

## 🛒 Customer Routes

Protected routes for customer actions (requires authentication).

| Route | Component | Params | Description |
|-------|-----------|--------|-------------|
| `/cart` | `CartPage` | None | Shopping cart |
| `/checkout` | `CheckoutPage` | None | Checkout flow |
| `/order-success/:id` | `OrderSuccessPage` | `id` (string) | Order confirmation |
| `/profile` | `ProfilePage` | None | User profile |
| `/orders` | `OrdersListPage` | None | Order history |
| `/orders/:id` | `OrderDetailPage` | `id` (string) | Order details |
| `/wishlist` | `WishlistPage` | None | Wishlist |
| `/addresses` | `AddressesPage` | None | Address management |
| `/reviews` | `Reviews` | None | Reviews (placeholder) |
| `/notifications` | `NotificationsPage` | None | Notifications |
| `/settings` | `SettingsPage` | None | User settings |

### Path Parameters

#### `id` (Order)
Order UUID

**Format:** UUID v4  
**Example:** `123e4567-e89b-12d3-a456-426614174000`

### Query Parameters

#### `/orders` Query Params

| Param | Type | Description | Example |
|-------|------|-------------|---------|
| `status` | string | Filter by order status | `?status=pending` |
| `page` | number | Pagination | `?page=2` |

#### Order Status Options

```typescript
type OrderStatus = 
  | 'pending'      // Order placed, awaiting confirmation
  | 'confirmed'    // Order confirmed by seller
  | 'processing'   // Being prepared
  | 'shipped'      // In transit
  | 'delivered'    // Successfully delivered
  | 'cancelled';   // Order cancelled
```

### Usage Examples

```tsx
// Navigate to cart
navigate('/cart');

// Navigate to checkout
navigate('/checkout');

// Navigate to order success
navigate(`/order-success/${orderId}`);

// Navigate to order history
navigate('/orders');

// Navigate to specific order
navigate(`/orders/${orderId}`);

// Navigate to order history with filter
navigate('/orders?status=pending');

// Navigate to profile
navigate('/profile');

// Navigate to settings
navigate('/settings');
```

---

## 💬 Messaging Routes

Protected routes for buyer-seller communication.

| Route | Component | Params | Description |
|-------|-----------|--------|-------------|
| `/messages` | `Inbox` | None | Message inbox (all conversations) |
| `/messages/:conversationId` | `Chat` | `conversationId` (string) | Individual chat conversation |

### Path Parameters

#### `conversationId`
Conversation UUID

**Format:** UUID v4  
**Example:** `c56a4180-65aa-42ec-a945-5fd21dec0538`

### Query Parameters

#### `/messages` Query Params

| Param | Type | Description | Example |
|-------|------|-------------|---------|
| `filter` | string | Filter conversations | `?filter=unread` |
| `type` | string | Conversation type | `?filter=buyer` |

#### Filter Options

```typescript
type MessageFilter = 
  | 'all'       // All conversations (default)
  | 'unread'    // Unread messages only
  | 'archived'; // Archived conversations
```

### Usage Examples

```tsx
// Navigate to inbox
navigate('/messages');

// Navigate to inbox with filter
navigate('/messages?filter=unread');

// Navigate to specific conversation
navigate(`/messages/${conversationId}`);

// Navigate to chat from conversation list
<Link to={`/messages/${conversation.id}`}>
  Open Chat
</Link>
```

---

## 🏭 Factory Routes

Protected routes for factory/seller dashboard (requires factory role).

| Route | Component | Params | Description |
|-------|-----------|--------|-------------|
| `/factory` | `FactoryDashboardPage` | None | Factory analytics dashboard |
| `/factory/production` | `FactoryProductionPage` | None | Production order tracking |
| `/factory/quotes` | `FactoryQuotesPage` | None | Quote request management |
| `/factory/connections` | `FactoryConnectionsPage` | None | Seller connections |

### Query Parameters

#### `/factory/production` Query Params

| Param | Type | Description | Example |
|-------|------|-------------|---------|
| `status` | string | Filter by production status | `?status=in_production` |

#### Production Status Options

```typescript
type ProductionStatus = 
  | 'pending'         // Order received
  | 'in_production'   // Manufacturing
  | 'quality_check'   // QC inspection
  | 'ready_to_ship'   // Prepared for shipping
  | 'shipped'         // In transit
  | 'delivered'       // Delivered
  | 'cancelled';      // Cancelled
```

#### `/factory/quotes` Query Params

| Param | Type | Description | Example |
|-------|------|-------------|---------|
| `view` | string | Quote perspective | `?view=received` |
| `status` | string | Filter by quote status | `?status=pending` |

#### Quote Status Options

```typescript
type QuoteStatus = 
  | 'pending'    // Awaiting response
  | 'quoted'     // Price provided
  | 'accepted'   // Quote accepted
  | 'rejected'   // Quote declined
  | 'expired';   // Past expiry date
```

#### `/factory/connections` Query Params

| Param | Type | Description | Example |
|-------|------|-------------|---------|
| `status` | string | Filter by connection status | `?status=pending` |

#### Connection Status Options

```typescript
type ConnectionStatus = 
  | 'pending'    // Request sent
  | 'accepted'   // Partnership active
  | 'rejected'   // Request declined
  | 'blocked';   // Partnership blocked
```

### Usage Examples

```tsx
// Navigate to factory dashboard
navigate('/factory');

// Navigate to production tracking
navigate('/factory/production');

// Navigate to production with filter
navigate('/factory/production?status=in_production');

// Navigate to quote requests
navigate('/factory/quotes');

// Navigate to received quotes
navigate('/factory/quotes?view=received');

// Navigate to connections
navigate('/factory/connections');

// Navigate to pending connections
navigate('/factory/connections?status=pending');
```

---

## ❌ Error Routes

Error handling routes.

| Route | Component | Params | Description |
|-------|-----------|--------|-------------|
| `/error` | `ServerError` | None | Server error page (500) |
| `*` | `NotFound` | None | 404 - Page not found |

### Usage Examples

```tsx
// Navigate to error page
navigate('/error');

// Redirect to 404 for unknown routes
// (handled automatically by Route path="*")
```

---

## 🧭 Navigation Examples

### Programmatic Navigation

```tsx
import { useNavigate, useParams } from 'react-router-dom';

function ProductCard({ product }) {
  const navigate = useNavigate();
  
  const handleViewProduct = () => {
    navigate(`/product-details/${product.asin}`);
  };
  
  const handleAddToCart = () => {
    // Add to cart logic
    navigate('/cart');
  };
  
  return (
    <div>
      <h3>{product.title}</h3>
      <button onClick={handleViewProduct}>View Details</button>
      <button onClick={handleAddToCart}>Add to Cart</button>
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
```

### Reading URL Parameters

```tsx
import { useParams, useSearchParams } from 'react-router-dom';

function ProductDetailsPage() {
  // Path parameters
  const { asin } = useParams<{ asin: string }>();
  
  // Query parameters
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category');
  const page = searchParams.get('page');
  
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
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useLocation } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (!user) {
    // Redirect to login with return URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return children;
}
```

---

## 🔒 Route Guards

### Authentication Guard

Routes that require authentication:

```typescript
const protectedRoutes = [
  // Customer routes
  '/cart',
  '/checkout',
  '/profile',
  '/orders',
  '/orders/*',
  '/wishlist',
  '/addresses',
  '/messages',
  '/messages/*',
  '/notifications',
  '/settings',
  
  // Services dashboard
  '/services/dashboard',
  '/services/dashboard/*',
  
  // Factory routes
  '/factory',
  '/factory/*',
];
```

### Role-Based Guards

```typescript
const roleRequired = {
  // Buyer routes
  buyer: [
    '/cart',
    '/checkout',
    '/orders',
    '/wishlist',
  ],
  
  // Seller routes
  seller: [
    '/factory',
    '/factory/*',
  ],
  
  // Service provider routes
  service_provider: [
    '/services/dashboard',
    '/services/dashboard/*',
  ],
};
```

### Implementation Example

```tsx
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'buyer' | 'seller' | 'factory' | 'service_provider';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}
```

---

## 📘 TypeScript Types

### Route Types

```typescript
// All route paths
export type RoutePath = 
  // Auth
  | '/signup'
  | '/login'
  | '/services/onboarding'
  | '/forgot-password'
  | '/reset-password'
  
  // Public
  | '/'
  | '/products'
  | '/product/:asin'
  | '/product-details/:asin'
  | '/categories'
  | '/categories/:slug'
  | '/brands'
  | '/brand/:id'
  | '/about'
  | '/contact'
  | '/help'
  
  // Services
  | '/services'
  | '/services/:categorySlug'
  | '/services/listing/:listingSlug'
  | '/services/provider/:providerId'
  | '/services/dashboard'
  | '/services/dashboard/create-profile'
  | '/services/dashboard/create-listing'
  
  // Customer
  | '/cart'
  | '/checkout'
  | '/order-success/:id'
  | '/profile'
  | '/orders'
  | '/orders/:id'
  | '/wishlist'
  | '/addresses'
  | '/reviews'
  | '/messages'
  | '/messages/:conversationId'
  | '/notifications'
  | '/settings'
  
  // Factory
  | '/factory'
  | '/factory/production'
  | '/factory/quotes'
  | '/factory/connections'
  
  // Error
  | '/error';

// Route parameters
export interface RouteParams {
  '/product/:asin': { asin: string };
  '/product-details/:asin': { asin: string };
  '/categories/:slug': { slug: string };
  '/brand/:id': { id: string };
  '/services/:categorySlug': { categorySlug: string };
  '/services/listing/:listingSlug': { listingSlug: string };
  '/services/provider/:providerId': { providerId: string };
  '/order-success/:id': { id: string };
  '/orders/:id': { id: string };
  '/messages/:conversationId': { conversationId: string };
}

// Query parameters
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
}

export interface ProductionQueryParams {
  status?: ProductionStatus;
}

export interface QuoteQueryParams {
  view?: 'received' | 'sent';
  status?: QuoteStatus;
}

export interface ConnectionQueryParams {
  status?: ConnectionStatus;
}

export interface MessageQueryParams {
  filter?: MessageFilter;
  type?: 'buyer' | 'seller';
}
```

### Navigation Helper

```typescript
// types/navigation.ts

import { NavigateOptions } from 'react-router-dom';

export interface NavigationOptions extends NavigateOptions {
  params?: Record<string, string | number>;
  query?: Record<string, string | number | boolean | null>;
}

export function buildPath(
  path: string,
  params?: Record<string, string | number>,
  query?: Record<string, string | number | boolean | null>
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
const productPath = buildPath('/product-details/:asin', { asin: 'B08N5WRWNW' });
// Result: '/product-details/B08N5WRWNW'

const productsWithFilters = buildPath(
  '/products',
  undefined,
  { category: 'electronics', minPrice: 50, maxPrice: 200, page: 2 }
);
// Result: '/products?category=electronics&minPrice=50&maxPrice=200&page=2'
```

---

## 📊 Route Statistics

| Category | Routes | With Params | Protected |
|----------|--------|-------------|-----------|
| Auth | 5 | 0 | 0 |
| Public | 11 | 4 | 0 |
| Services | 7 | 3 | 3 |
| Customer | 11 | 2 | 11 |
| Messaging | 2 | 1 | 2 |
| Factory | 4 | 0 | 4 |
| Error | 2 | 0 | 0 |
| **Total** | **42** | **10** | **20** |

---

## 🔗 Related Documentation

- [App.tsx](./src/App.tsx) - Main application routing
- [README.md](./README.md) - Complete project documentation
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide

---

**Last Updated:** March 16, 2026  
**Maintained by:** Youssef
