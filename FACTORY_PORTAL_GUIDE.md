# 🏭 Factory Portal - Complete Implementation Guide

## Overview
The Factory Portal is a complete, production-ready system for manufacturers to join Aurora, manage production, and connect with global buyers.

---

## 📁 File Structure

```
src/features/factory/
├── components/
│   └── FactoryHeader.tsx          # Dynamic header with auth state
├── pages/
│   ├── FactoryWelcome.tsx         # Public welcome/landing page
│   └── FactoryDashboard.tsx       # Protected dashboard (in routes)
└── types/
    └── factory.ts                 # TypeScript interfaces

src/pages/auth/
├── FactoryLogin.tsx               # Factory-specific login
└── FactorySignup.tsx              # Factory-specific signup

src/routes/
├── auth.routes.tsx                # Public factory routes
└── factory.routes.tsx             # Protected factory routes
```

---

## 🗺️ Route Map

| Route | Component | Auth Required | Description |
|-------|-----------|---------------|-------------|
| `/factory` | FactoryWelcome | ❌ No | Public marketing/welcome page |
| `/factory/login` | FactoryLogin | ❌ No | Factory login page |
| `/factory/signup` | FactorySignup | ❌ No | Factory signup page (2-step form) |
| `/factory/dashboard` | FactoryDashboardPage | ✅ Yes | Main factory dashboard |
| `/factory/dashboard/production` | FactoryProductionPage | ✅ Yes | Production management |
| `/factory/dashboard/quotes` | FactoryQuotesPage | ✅ Yes | Quote requests |
| `/factory/dashboard/connections` | FactoryConnectionsPage | ✅ Yes | Business connections |

---

## 🗃️ Database Schema

### How Factories Are Stored

Factories are stored in the **`sellers`** table with `is_factory = true`:

```sql
-- Factory record in sellers table
{
  user_id: "uuid-from-auth",           // Primary key (factory UUID)
  email: "factory@example.com",
  full_name: "Factory Manager Name",
  company_name: "ABC Manufacturing",
  phone: "+201234567890",
  location: "Cairo, Egypt",
  currency: "USD",
  account_type: "factory",             // Critical: identifies as factory
  is_factory: true,                    // Critical: distinguishes from sellers
  is_verified: false,
  production_capacity: "10000 units/month",
  specialization: "electronics",
  factory_license_url: "https://...",
  min_order_quantity: 100,
  website_url: "https://factory.com"
}
```

### Related Tables

| Table | Foreign Key | Purpose |
|-------|-------------|---------|
| `factory_connections` | `factory_id → sellers.user_id` | Track connections with sellers/middlemen |
| `factory_quotes` | `factory_id → auth.users.id` | Quote requests from buyers |
| `factory_ratings` | `factory_id → sellers.user_id` | Ratings from partners |
| `factory_production_logs` | `created_by → auth.users.id` | Production status tracking |
| `products` | `seller_id → sellers.user_id` | Factory's product listings |
| `orders` | `seller_id → sellers.user_id` | Orders for factory production |

---

## 🔐 Authentication Flow

### 1. Factory Signup

```typescript
// src/pages/auth/FactorySignup.tsx
const { error } = await signUp(
  formData.email,
  formData.password,
  formData.factoryName,
  "factory",                    // ← Auto-assigns account_type
  {
    phone: formData.phone,
    location: formData.location,
  }
);

// This triggers handle_new_user() database trigger which:
// 1. Creates auth.users record
// 2. Inserts into sellers table with is_factory = true
// 3. Sets account_type = ['factory']
// 4. Updates user_roles boolean flags
```

### 2. Factory Login

```typescript
// src/pages/auth/FactoryLogin.tsx
const result = await signIn(formData.email, formData.password);

// Verify factory role
const { data: seller } = await supabase
  .from("sellers")
  .select("id, account_type, is_factory, status")
  .eq("user_id", user.id)
  .eq("is_factory", true)        // ← Ensures it's a factory
  .maybeSingle();

if (!seller || !seller.is_factory) {
  // Not a factory - deny access
  toast.error("Access denied: Factory account not found");
  await supabase.auth.signOut();
  return;
}

// Redirect based on status
if (seller.status === "pending_review") {
  navigate("/services/dashboard/pending");
} else {
  navigate("/factory/dashboard");
}
```

### 3. Factory Header Auth State

```typescript
// src/features/factory/components/FactoryHeader.tsx
const { user, signOut } = useAuth();

// Fetch factory profile
const { data } = await supabase
  .from("sellers")
  .select("user_id, company_name, full_name, email, is_verified, ...")
  .eq("user_id", user.id)
  .eq("is_factory", true)        // ← Only factory records
  .maybeSingle();

// Header shows:
// - If !user: Public header with Login/Signup buttons
// - If user: Authenticated header with dashboard nav & profile
```

---

## 🎨 FactoryHeader Features

### Public State (Not Logged In)
- ✅ Factory logo with "Aurora Manufacturing" subtitle
- ✅ Theme toggle (light/dark)
- ✅ Login button → `/factory/login`
- ✅ Sign Up button → `/factory/signup`
- ✅ Scroll-aware (transparent → glass morphism)

### Authenticated State (Logged In)
- ✅ Factory name/logo (shows company name if set)
- ✅ "Verified Manufacturer" badge if `is_verified = true`
- ✅ Desktop navigation:
  - Dashboard (`/factory/dashboard`)
  - Production (`/factory/dashboard/production`)
  - Quotes (`/factory/dashboard/quotes`)
  - Connections (`/factory/dashboard/connections`)
- ✅ Profile dropdown with:
  - User avatar (initial letter)
  - Full name & email
  - Verified badge
  - Quick links
  - Sign out button
- ✅ Mobile responsive menu
- ✅ Active route highlighting (blue for factory)

---

## 🔗 How UUID Works Throughout

The factory's UUID comes from Supabase Auth (`auth.users.id`) and is used as:

1. **Authentication**: `user.id` from `useAuth()`
2. **Sellers table**: `sellers.user_id = user.id`
3. **Factory products**: `products.seller_id = user.id`
4. **Factory orders**: `orders.seller_id = user.id`
5. **Factory connections**: `factory_connections.factory_id = user.id`
6. **Factory quotes**: `factory_quotes.factory_id = user.id`
7. **Factory ratings**: `factory_ratings.factory_id = user.id`
8. **Production logs**: `factory_production_logs.created_by = user.id`

**No separate factory ID needed** - everything uses the auth user ID.

---

## 🛡️ Role Protection

### ProtectedRoute Component
```typescript
// src/components/ProtectedRoute.tsx
<ProtectedRoute allowedAccountTypes={["factory"]}>
  <FactoryDashboardPage />
</ProtectedRoute>

// Checks:
// user.user_metadata.account_type === "factory"
```

### Database RLS Policies
```sql
-- Factories can only see/edit their own data
CREATE POLICY "Factories manage own profile"
  ON sellers FOR ALL
  USING (
    user_id = auth.uid() 
    AND is_factory = true
  );

-- Factory connections
CREATE POLICY "Factories view own connections"
  ON factory_connections FOR SELECT
  USING (factory_id = auth.uid());
```

---

## 📊 Database Functions

### Used by Factory Dashboard

| Function | Purpose | Parameters |
|----------|---------|------------|
| `get_seller_kpis` | Get factory analytics | `p_seller_id` (uuid), `p_period` (text) |
| `find_nearby_factories` | Location-based search | Uses `sellers` where `is_factory = true` |
| `get_factory_rating` | Get factory ratings | `factory_id` (uuid) |
| `get_public_profile` | Get factory public profile | Includes `is_factory` boolean |

### ⚠️ Missing Functions (Need to Create)

These are called by frontend hooks but **don't exist in database**:

1. **`get_production_orders`** - Called by `useProductionOrders.ts`
2. **`update_production_status`** - Called by `useUpdateProductionStatus.ts`

---

## 🚀 Quick Start Guide

### 1. Create Factory Account
```
Visit: http://localhost:5173/factory/signup
Fill: Factory Name, Email, Password, Phone, Location
→ Creates auth.users + sellers (is_factory=true)
```

### 2. Login to Factory
```
Visit: http://localhost:5173/factory/login
Enter: Email + Password
→ Redirects to /factory/dashboard
```

### 3. Dashboard Access
```
Header shows:
- Factory name/logo
- Navigation links
- Profile dropdown
- All data filtered by user.id
```

---

## 🎯 Key Integration Points

### Frontend → Database

```typescript
// Get factory profile
const { data: factory } = await supabase
  .from("sellers")
  .select("*")
  .eq("user_id", user.id)
  .eq("is_factory", true)
  .maybeSingle();

// Get factory products
const { data: products } = await supabase
  .from("products")
  .select("*")
  .eq("seller_id", user.id);

// Get factory connections
const { data: connections } = await supabase
  .from("factory_connections")
  .select("*")
  .eq("factory_id", user.id);

// Get factory analytics
const { data: kpis } = await supabase
  .rpc("get_seller_kpis", {
    p_seller_id: user.id,
    p_period: "30d"
  });
```

---

## 📝 Checklist for Production

- [x] FactoryHeader component created
- [x] FactoryWelcome page with header
- [x] FactoryLogin with role verification
- [x] FactorySignup with auto account_type
- [x] Routes configured (public + protected)
- [x] Database schema verified (sellers + is_factory)
- [x] UUID integration mapped
- [ ] Create `get_production_orders` SQL function
- [ ] Create `update_production_status` SQL function
- [ ] Create `quote_requests` table (or rename `factory_quotes`)
- [ ] Add missing RPC functions to database
- [ ] Test RLS policies for factory isolation
- [ ] Add factory profile completion page
- [ ] Add factory verification workflow

---

## 🔍 Troubleshooting

### "Factory account not found" on login
**Cause**: User exists but `sellers.is_factory = false`
**Fix**: Update database: `UPDATE sellers SET is_factory = true WHERE user_id = 'uuid';`

### Dashboard shows no data
**Cause**: Factory profile not created yet
**Fix**: Check `handle_new_user()` trigger fired correctly

### Can't access /factory/dashboard
**Cause**: `user.user_metadata.account_type` doesn't include "factory"
**Fix**: Re-signup with correct account_type or update user metadata

---

*Last Updated: 2026-04-08*
