# Aurora E-Commerce Platform - Study Guide

## 📖 Project Overview

**Aurora** is a comprehensive multi-vertical e-commerce and services marketplace platform built with modern web technologies. This document serves as a guide for studying and understanding the project architecture, features, and implementation patterns.

---

## 🏗️ Technology Stack

### Frontend

| Technology          | Purpose              |
| ------------------- | -------------------- |
| **React 18**        | UI Framework         |
| **TypeScript**      | Type Safety          |
| **React Router v6** | Routing & Navigation |
| **Tailwind CSS**    | Styling              |
| **shadcn/ui**       | Component Library    |
| **Lucide Icons**    | Icon System          |

### Backend & Services

| Technology      | Purpose                 |
| --------------- | ----------------------- |
| **Supabase**    | Backend-as-a-Service    |
| **PostgreSQL**  | Database                |
| **React Query** | Server State Management |
| **i18next**     | Internationalization    |

### Additional Libraries

- **date-fns** - Date formatting
- **Sonner** - Toast notifications
- **Zustand/Context** - Client state

---

## 📁 Project Structure

```
src/
├── components/          # Shared components
│   ├── layout/         # Layout components (Header, Footer, Sidebar)
│   ├── shared/         # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   └── feed/           # Social feed components
├── features/            # Feature-based modules
│   ├── auth/           # Authentication
│   ├── cart/           # Shopping cart
│   ├── checkout/       # Checkout flow
│   ├── orders/         # Order management
│   ├── services/       # Services marketplace
│   ├── health/         # Healthcare vertical
│   ├── messages/       # Messaging system
│   ├── profile/        # User profiles
│   ├── settings/       # User settings
│   └── ...
├── pages/               # Page components
│   ├── auth/           # Auth pages
│   ├── admin/          # Admin dashboard
│   ├── factory/        # Factory vertical
│   ├── middleman/      # Middleman vertical
│   └── public/         # Public pages
├── hooks/               # Custom React hooks
├── context/             # React Context providers
├── lib/                 # Utilities & configurations
├── utils/               # Helper functions
└── App.tsx              # Main application entry
```

---

## 🎯 Key Features to Study

### 1. Authentication System

**Location:** `src/hooks/useAuth.ts`, `src/components/ProtectedRoute.tsx`

**Concepts:**

- JWT-based authentication
- Session management
- Protected routes
- Role-based access control
- Supabase Auth integration

**Study Points:**

```typescript
// How auth state is managed
const { user, loading, signOut } = useAuth();

// How routes are protected
<ProtectedRoute allowedAccountTypes={["provider"]}>
  <DashboardLayout />
</ProtectedRoute>
```

---

### 2. Multi-Vertical Architecture

**Location:** `src/App.tsx`

**Verticals:**
| Vertical | Routes | Purpose |
|----------|--------|---------|
| **Products** | `/products/*` | E-commerce marketplace |
| **Services** | `/services/*` | Service bookings & freelancing |
| **Healthcare** | `/services/health/*` | Medical appointments & telemedicine |
| **Factory** | `/factory/*` | Manufacturing & production |
| **Middleman** | `/middleman/*` | Trade facilitation |
| **Admin** | `/admin/*` | Platform management |

**Study Points:**

- Route nesting patterns
- Shared vs. isolated components
- Cross-vertical features (messages, notifications)

---

### 3. Services Marketplace

**Location:** `src/features/services/`

**Key Components:**

- `ServiceOnboardingWizard.tsx` - Provider registration flow
- `DashboardHome.tsx` - Provider analytics
- `BookingsPage.tsx` - Booking management
- `ServiceBookingPage.tsx` - Customer booking flow

**Database Schema:**

```sql
-- Core Tables
svc_providers      -- Service provider profiles
svc_listings       -- Service listings
svc_orders         -- Bookings & orders
svc_categories     -- Service categories
```

**Study Points:**

- Provider onboarding flow
- Booking lifecycle (pending → confirmed → completed)
- Analytics calculations
- Provider verification system

---

### 4. Real-Time Messaging

**Location:** `src/features/messages/`, `src/components/chat/`

**Features:**

- Conversation management
- Real-time message updates
- Cross-vertical messaging
- Chat widget

**Study Points:**

```typescript
// How real-time subscriptions work
supabase
  .channel('messages')
  .on('postgres_changes', { event: 'INSERT', ... }, handleNewMessage)
```

---

### 5. E-Commerce Flow

**Location:** `src/features/cart/`, `src/features/checkout/`, `src/features/orders/`

**Flow:**

```
Product List → Product Detail → Add to Cart → Checkout → Order Success
```

**Study Points:**

- Cart state management
- Checkout process
- Order tracking
- Address management

---

### 6. Healthcare Vertical

**Location:** `src/features/health/`

**Features:**

- Doctor listings & profiles
- Appointment booking
- Patient dashboard
- Doctor dashboard
- Telemedicine (consultation room)
- Medical records (consent forms, data export)

**Compliance:**

- HIPAA-style data protection
- Audit logs
- Consent management

---

### 7. Admin Dashboard

**Location:** `src/pages/admin/`

**Features:**

- User management
- Product oversight
- Order monitoring
- Factory & middleman tracking
- Delivery management
- Analytics

---

## 🗄️ Database Schema Study

### Core Tables

#### `svc_providers`

```sql
CREATE TABLE svc_providers (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  provider_name TEXT,
  provider_type TEXT, -- individual, company, hospital, etc.
  description TEXT,
  average_rating DECIMAL,
  total_jobs_completed INTEGER,
  is_verified BOOLEAN,
  status TEXT -- active, pending_review, suspended
);
```

#### `svc_orders`

```sql
CREATE TABLE svc_orders (
  id UUID PRIMARY KEY,
  listing_id UUID REFERENCES svc_listings,
  provider_id UUID REFERENCES svc_providers,
  user_id UUID REFERENCES auth.users,
  order_type TEXT, -- purchase, booking, application
  status TEXT, -- pending, confirmed, completed, cancelled
  agreed_price DECIMAL,
  ordered_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
```

#### `svc_listings`

```sql
CREATE TABLE svc_listings (
  id UUID PRIMARY KEY,
  provider_id UUID REFERENCES svc_providers,
  title TEXT,
  description TEXT,
  category_id UUID,
  price_min DECIMAL,
  price_max DECIMAL,
  currency TEXT
);
```

---

## 🔧 Key Implementation Patterns

### 1. Custom Hooks Pattern

```typescript
// src/hooks/useProviderAnalytics.ts
export const useProviderAnalytics = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["provider-analytics", user?.id],
    queryFn: async () => {
      // Fetch data from Supabase
      const { data } = await supabase
        .from("svc_providers")
        .select("*")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });
};
```

### 2. Protected Routes Pattern

```typescript
// src/components/ProtectedRoute.tsx
export const ProtectedRoute = ({
  children,
  allowedAccountTypes
}) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" />;

  // Check account type if specified
  if (allowedAccountTypes && !allowedAccountTypes.includes(user.account_type)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};
```

### 3. Feature-Based Organization

```
features/
└── services/
    ├── components/      # Feature-specific components
    ├── pages/          # Feature pages
    ├── hooks/          # Feature-specific hooks
    ├── types/          # TypeScript types
    └── utils/          # Feature utilities
```

---

## 📚 Learning Exercises

### Beginner

1. **Add a new route** - Create a simple "FAQ" page
2. **Modify a component** - Change the dashboard welcome message
3. **Add a field** - Add a new column to provider profile

### Intermediate

1. **Build a feature** - Add reviews/ratings system
2. **Implement search** - Add search functionality to bookings
3. **Create a hook** - Build a custom hook for fetching orders

### Advanced

1. **Add payment** - Integrate Stripe/PayPal
2. **Real-time feature** - Add live order notifications
3. **Optimization** - Implement code splitting & lazy loading
4. **Testing** - Write unit & integration tests

---

## 🐛 Common Issues & Fixes

### 1. Database Column Mismatch

**Problem:** Query fails with 400 Bad Request
**Solution:** Verify column names match database schema

```typescript
// ❌ Wrong
.select("rating_avg, total_jobs")

// ✅ Correct
.select("average_rating, total_jobs_completed")
```

### 2. Duplicate Key Errors

**Problem:** 409 Conflict on insert
**Solution:** Check for existing record before insert

```typescript
// Check first
const { data: existing } = await supabase
  .from("table")
  .select("id")
  .eq("user_id", userId)
  .single();

if (existing) {
  // Update instead
} else {
  // Insert new
}
```

### 3. Route Not Working

**Problem:** Navigation doesn't work
**Solution:** Check route nesting in App.tsx

```typescript
// Ensure parent route has Outlet
<Route path="/services" element={<Layout />}>
  <Route path="dashboard" element={<Dashboard />} />
</Route>
```

---

## 🚀 Performance Optimization Topics

1. **Code Splitting** - Lazy load routes
2. **Query Optimization** - Proper indexes, selective queries
3. **Caching Strategy** - React Query cache configuration
4. **Image Optimization** - Lazy loading, responsive images
5. **Bundle Size** - Tree shaking, dynamic imports

---

## 🔒 Security Best Practices

1. **Row Level Security (RLS)** - Database-level access control
2. **Input Validation** - Sanitize user inputs
3. **XSS Prevention** - Escape user-generated content
4. **CSRF Protection** - Supabase handles tokens
5. **Rate Limiting** - API call throttling

---

## 📈 Next Steps

1. **Read the code** - Start with `App.tsx` and trace routes
2. **Run the project** - Set up local development
3. **Make small changes** - Get familiar with the codebase
4. **Build new features** - Apply what you've learned
5. **Optimize** - Improve performance & code quality

---

## 📞 Resources

- [React Documentation](https://react.dev)
- [React Router v6](https://reactrouter.com)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [React Query](https://tanstack.com/query)

---

**Created:** 2026-03-26  
**Version:** 1.0  
**Project:** Aurora E-Commerce Platform
