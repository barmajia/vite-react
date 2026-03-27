# 📡 Aurora E-commerce Platform - API Documentation

**Version:** 2.5.0  
**Last Updated:** March 27, 2026  
**Backend:** Supabase (PostgreSQL + Realtime + Auth)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Authentication API](#authentication-api)
- [Products API](#products-api)
- [Services API](#services-api)
- [Healthcare API](#healthcare-api)
- [Factory API](#factory-api)
- [Middleman API](#middleman-api)
- [Messaging API](#messaging-api)
- [Profile API](#profile-api)
- [Cart & Checkout API](#cart--checkout-api)
- [Orders API](#orders-api)
- [Wallet API](#wallet-api)
- [Admin API](#admin-api)
- [Realtime Subscriptions](#realtime-subscriptions)
- [Database RPC Functions](#database-rpc-functions)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## 🌐 Overview

### Architecture

This application uses **Supabase** as the backend-as-a-service (BaaS), providing:

- **PostgreSQL Database** with Row-Level Security (RLS)
- **Authentication** with email/password and session management
- **Real-time subscriptions** via Supabase Realtime
- **Storage** for file uploads (images, documents)
- **Edge Functions** for server-side logic

### API Client Setup

```typescript
// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      flowType: "pkce",
      storage: cookieStorage, // Secure cookie storage
    },
  }
);
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Public anon key | ✅ |
| `VITE_APP_URL` | Application base URL | ✅ |

---

## 🔐 Authentication API

### Provider: `useAuth` Hook

**Location:** `src/hooks/useAuth.tsx`

#### Sign In

```typescript
const { signIn } = useAuth();

const result = await signIn(email: string, password: string);
// Returns: { error: Error | null, data: Session | null }
```

**Security Features:**
- Email validation
- SQL injection detection
- XSS detection
- Rate limiting (5 attempts / 60s)
- PKCE flow

#### Sign Up

```typescript
const { signUp } = useAuth();

const result = await signUp(
  email,
  password,
  fullName?,
  accountType? // 'buyer' | 'seller' | 'provider' | 'factory' | 'delivery_driver'
);
```

#### Sign Up With Role (Healthcare)

```typescript
const { signUpWithRole } = useAuth();

const result = await signUpWithRole(
  email,
  password,
  fullName,
  phone,
  role // 'client' | 'individual' | 'company' | 'hospital'
);
```

#### Password Reset

```typescript
const { resetPassword } = useAuth();
await resetPassword(email: string);
```

#### Change Password

```typescript
const { changePassword } = useAuth();
await changePassword(newPassword: string, currentPassword?: string);
```

#### Change Email

```typescript
const { changeEmail } = useAuth();
await changeEmail(newEmail: string);
```

#### Sign Out

```typescript
const { signOut } = useAuth();
await signOut();
```

---

## 🛍️ Products API

### Hook: `useProducts`

**Location:** `src/hooks/useProducts.ts`

#### Get All Products

```typescript
const { data, isLoading, error } = useProducts({
  page: 1,
  limit: 20,
  search?: string,
  category?: string,
  brand?: string,
  minPrice?: number,
  maxPrice?: number,
  sortBy?: "created_at" | "price" | "title",
  sortOrder?: "asc" | "desc",
});
```

**Query Key:** `["products", { filters }]`  
**Stale Time:** 5 minutes

#### Get Product by ASIN

```typescript
const { data: product } = useProductByAsin(asin: string);
```

**Query Key:** `["product", asin]`

#### Get Featured Products

```typescript
const { data: products } = useFeaturedProducts(limit: number = 10);
```

**Query Key:** `["featured-products", limit]`

#### Get Products by Category

```typescript
const { data: products } = useProductsByCategory(
  categoryId: string,
  limit: number = 20
);
```

**Query Key:** `["products-by-category", categoryId, limit]`

#### Get Related Products

```typescript
const { data: products } = useRelatedProducts(
  categoryId: string,
  excludeAsin: string,
  limit: number = 10
);
```

**Query Key:** `["related-products", categoryId, excludeAsin, limit]`

#### Get Seller Info

```typescript
const { data: seller } = useSellerInfo(sellerId: string);
```

**Query Key:** `["seller", sellerId]`

#### Mutations

```typescript
const { deleteProduct } = useDeleteProduct();
await deleteProduct(productId: string);
// Invalidates: ["product"], ["products"]
```

---

## 🛎️ Services API

### Hook: `useServices`

**Location:** `src/hooks/useServices.ts`

#### Get All Services

```typescript
const { data, isLoading } = useServices({
  page: 1,
  limit: 20,
  categorySlug?: string,
  search?: string,
  location?: string,
  minPrice?: number,
  maxPrice?: number,
});
```

**Query Key:** `["services", filters]`

#### Get Service by ID

```typescript
const { data: service } = useServiceById(listingId: string);
```

**Query Key:** `["service", listingId]`

#### Get Provider Profile

```typescript
const { data: provider } = useProviderProfile(providerId: string);
```

**Query Key:** `["provider", providerId]`

#### Create Booking

```typescript
const { mutate: createBooking } = useCreateBooking();

await createBooking({
  listing_id: string,
  customer_name: string,
  customer_email: string,
  customer_phone: string,
  appointment_date?: string,
  notes?: string,
});
```

---

## 🏥 Healthcare API

### Service: `supabaseHealth`

**Location:** `src/features/health/api/supabaseHealth.ts`

#### Doctors

```typescript
// Get all verified doctors
const doctors = await getVerifiedDoctors();

// Get doctor by ID
const doctor = await getDoctorById(id: string);

// Get pending doctors (admin)
const pending = await getPendingDoctors();

// Verify doctor (admin)
const updated = await verifyDoctor(doctorId: string, isApproved: boolean);

// Create doctor profile
const profile = await createDoctorProfile(profile: Partial<HealthDoctorProfile>);

// Update doctor profile
const updated = await updateDoctorProfile(
  doctorId: string,
  updates: Partial<HealthDoctorProfile>
);
```

#### Patients

```typescript
// Get patient profile
const patient = await getPatientProfile(userId: string);

// Create patient profile
const profile = await createPatientProfile(profile: Partial<HealthPatientProfile>);

// Update patient profile
const updated = await updatePatientProfile(
  patientId: string,
  updates: Partial<HealthPatientProfile>
);
```

#### Appointments

```typescript
// Create appointment
const appointment = await createAppointment({
  doctor_id: string,
  patient_id: string,
  scheduled_at: string,
  duration_minutes?: number,
  slot_type?: 'regular' | 'emergency',
  notes?: string,
});

// Get patient appointments
const appointments = await getPatientAppointments(patientId: string);

// Get doctor appointments
const appointments = await getDoctorAppointments(doctorId: string);

// Update appointment status
const updated = await updateAppointmentStatus(
  appointmentId: string,
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled' | 'no_show'
);

// Cancel appointment
const cancelled = await cancelAppointment(appointmentId: string);
```

#### Health Messages

```typescript
// Create health conversation
const conversation = await createHealthConversation(appointmentId: string);

// Get conversation
const conv = await getHealthConversation(appointmentId: string);

// Send message
const message = await sendHealthMessage(
  conversationId: string,
  senderId: string,
  content: string,
  messageType?: 'text' | 'image' | 'file',
  attachmentUrl?: string
);

// Get messages
const messages = await getHealthMessages(conversationId: string);
```

#### Prescriptions

```typescript
// Create prescription
const prescription = await createPrescription({
  appointment_id: string,
  medication_name: string,
  dosage: string,
  frequency: string,
  duration_days: number,
  notes?: string,
});

// Get prescriptions by appointment
const prescriptions = await getPrescriptionsByAppointment(appointmentId: string);

// Mark as dispensed
const updated = await markPrescriptionDispensed(prescriptionId: string);
```

#### Pharmacies

```typescript
// Get verified pharmacies
const pharmacies = await getVerifiedPharmacies();
```

---

## 🏭 Factory API

### Service: `factoryService`

**Location:** `src/services/factoryService.ts`

#### Find Factories

```typescript
const factories = await factoryService.findFactories({
  search_term?: string,
  location?: string,
  is_verified?: boolean,
  limit?: number,
  offset?: number,
});
```

#### Get Factory Profile

```typescript
const profile = await factoryService.getFactoryProfile(userId: string);
```

#### Get Factory Products

```typescript
const products = await factoryService.getFactoryProducts(sellerId: string);
```

#### Get Factory Stats

```typescript
const stats = await factoryService.getFactoryStats(userId: string);
// Returns: { productCount: number, conversationCount: number }
```

---

## 🤝 Middleman API

### Database Tables

- `middleman_profiles`
- `middleman_deals`
- `middleman_connections`
- `middleman_analytics_snapshots`

### Deal Management

```typescript
// Create deal
const { data, error } = await supabase
  .from('middleman_deals')
  .insert({
    buyer_id: string,
    seller_id: string,
    middleman_id: string,
    product_details: JSON,
    commission_percentage: number,
    status: 'pending' | 'active' | 'completed' | 'cancelled',
  });

// Get deals
const { data } = await supabase
  .from('middleman_deals')
  .select('*, buyer:users(*), seller:users(*)')
  .eq('middleman_id', userId);
```

---

## 💬 Messaging API

### Product Messaging

**Tables:** `conversations`, `messages`

#### Get Conversations

```typescript
const { data } = await supabase
  .from('conversations')
  .select(`
    *,
    other_user:users!conversations_other_user_id_fkey(*),
    last_message:messages!conversations_last_message_id_fkey(*)
  `)
  .or(`seller_id.eq.${userId},other_user_id.eq.${userId}`)
  .order('updated_at', { ascending: false });
```

#### Send Message

```typescript
const { data } = await supabase
  .from('messages')
  .insert({
    conversation_id: string,
    sender_id: string,
    content: string,
    is_read: false,
  });
```

### Services Messaging

**Tables:** `svc_conversations`, `svc_messages`

```typescript
// Isolated from product messaging
// Same API structure, different tables
```

### Realtime Subscription

```typescript
// src/lib/supabase-realtime.ts
supabase.channel('messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages'
  }, (payload) => {
    // Handle new message
  })
  .subscribe();
```

---

## 👤 Profile API

### Service: `profileService`

**Location:** `src/services/profileService.ts`

#### Get Public Profile

```typescript
const profile = await profileService.getPublicProfile(userId: string);
// Uses RPC: get_public_profile(p_user_id)
```

#### Search Profiles

```typescript
const profiles = await profileService.searchProfiles({
  search_term?: string,
  account_type?: string,
  location?: string,
  limit?: number,
  offset?: number,
});
// Uses RPC: search_public_profiles(...)
```

#### Get Factories

```typescript
const factories = await profileService.getFactories({
  search_term?: string,
  location?: string,
  limit?: number,
});
```

#### Get Sellers

```typescript
const sellers = await profileService.getSellers({
  search_term?: string,
  location?: string,
  limit?: number,
});
```

#### Get User Products

```typescript
const products = await profileService.getUserProducts(
  userId: string,
  limit: number = 20
);
```

### Hook: `useFullProfile`

**Location:** `src/hooks/useFullProfile.ts`

```typescript
const { data: profile, isLoading } = useFullProfile(targetUserId?: string);
// Query Key: ["full-profile", targetUserId]
```

---

## 🛒 Cart & Checkout API

### Cart State (Zustand)

**Location:** `src/hooks/useCart.ts`

```typescript
const {
  items,
  addItem,
  removeItem,
  updateQuantity,
  clearCart,
  getCartTotal,
  getCartCount,
} = useCart();
```

### Checkout

**Location:** `src/lib/checkout.ts`

```typescript
// Create order
const { data, error } = await supabase.rpc('create_order', {
  p_customer_id: userId,
  p_address_id: addressId,
  p_payment_method: 'card' | 'fawry' | 'cod',
  p_coupon_code?: string,
});
```

### COD Verification

**Location:** `src/lib/cod-verification.ts`

```typescript
// Verify COD eligibility
const isEligible = await verifyCODEligibility(userId: string);
```

---

## 📦 Orders API

### Get Orders

```typescript
const { data } = await supabase
  .from('orders')
  .select(`
    *,
    order_items:order_items(*),
    shipping_address:shipping_addresses(*)
  `)
  .eq('customer_id', userId)
  .order('created_at', { ascending: false });
```

### Get Order Details

```typescript
const { data } = await supabase
  .from('orders')
  .select(`
    *,
    order_items:order_items(
      *,
      product:products(*)
    ),
    shipping_address:shipping_addresses(*)
  `)
  .eq('id', orderId)
  .single();
```

### Update Order Status

```typescript
const { data } = await supabase
  .from('orders')
  .update({ status: newStatus })
  .eq('id', orderId)
  .select()
  .single();
```

---

## 💰 Wallet API

### Service: `wallet`

**Location:** `src/lib/wallet.ts`

#### Get Wallet Data

```typescript
const wallet = await getWalletData(userId: string);
// Returns: WalletData { balance, pending_balance, total_earned, currency }
```

#### Get Wallet Transactions

```typescript
const transactions = await getWalletTransactions(
  userId: string,
  limit: number = 50
);
// Returns: WalletTransaction[]
```

#### Create Payout Request

```typescript
const payout = await createPayoutRequest({
  user_id: string,
  amount: number,
  payout_method: 'bank_transfer' | 'fawry_cash' | 'wallet',
  bank_details?: object,
});
```

#### Get Payout History

```typescript
const payouts = await getPayoutHistory(userId: string);
// Returns: PayoutRequest[]
```

---

## 🔧 Admin API

### Admin Users Dashboard

```typescript
// Get all users
const { data } = await supabase
  .from('users')
  .select('*')
  .order('created_at', { ascending: false });

// Update user role
const { data } = await supabase
  .from('users')
  .update({ account_type: newRole })
  .eq('id', userId);

// Delete user
const { error } = await supabase
  .from('users')
  .delete()
  .eq('id', userId);
```

### Admin Products

```typescript
// Get all products (including deleted)
const { data } = await supabase
  .from('products')
  .select('*')
  .order('created_at', { ascending: false });

// Update product
const { data } = await supabase
  .from('products')
  .update(updates)
  .eq('id', productId);

// Delete product (soft)
const { data } = await supabase
  .from('products')
  .update({ is_deleted: true, deleted_at: now })
  .eq('id', productId);
```

---

## 📡 Realtime Subscriptions

### Setup

**Location:** `src/lib/supabase-realtime.ts`

```typescript
import { supabase } from './supabase-realtime';

// Messages
supabase.channel('messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages'
  }, (payload) => {
    console.log('New message:', payload);
  })
  .subscribe();

// Orders
supabase.channel('orders')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'orders'
  }, (payload) => {
    console.log('Order change:', payload);
  })
  .subscribe();
```

### Available Channels

| Channel | Table | Events | Use Case |
|---------|-------|--------|----------|
| `messages` | `messages` | INSERT, UPDATE | New message notifications |
| `orders` | `orders` | INSERT, UPDATE, DELETE | Order status updates |
| `conversations` | `conversations` | UPDATE | Unread count updates |
| `notifications` | `notifications` | INSERT | Real-time notifications |

---

## ⚙️ Database RPC Functions

### Authentication & Profile

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `get_public_profile` | `p_user_id UUID` | Profile | Get public profile by user ID |
| `search_public_profiles` | `p_search_term, p_account_type, p_location, p_limit, p_offset` | Profile[] | Search profiles with filters |
| `create_order` | `p_customer_id, p_address_id, p_payment_method, p_coupon_code` | Order | Create order with items |

### Products

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `search_products` | `p_search_term, p_category, p_min_price, p_max_price` | Product[] | Full-text product search |
| `get_featured_products` | `p_limit` | Product[] | Get featured products |
| `get_related_products` | `p_category_id, p_exclude_asin, p_limit` | Product[] | Get related products |

---

## ❌ Error Handling

### Standard Error Response

```typescript
interface ApiError {
  message: string;
  code?: string;
  details?: any;
  hint?: string;
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `PGRST116` | Row not found |
| `23505` | Unique constraint violation |
| `23503` | Foreign key violation |
| `42501` | RLS policy violation |
| `auth/invalid-credentials` | Wrong email/password |
| `auth/user-not-found` | User doesn't exist |
| `auth/email-already-in-use` | Email registered |

### Error Handling Pattern

```typescript
try {
  const { data, error } = await supabase
    .from('table')
    .select('*');

  if (error) throw error;
  return data;
} catch (err) {
  if (err.code === 'PGRST116') {
    // Handle not found
  } else if (err.code === '42501') {
    // Handle permission denied
  } else {
    // Handle other errors
  }
}
```

---

## 🚦 Rate Limiting

### Configuration

**Location:** `src/lib/security.ts`

```typescript
export const SECURITY_CONFIG = {
  RATE_LIMIT_WINDOW: 60000, // 1 minute
  RATE_LIMIT_MAX_ATTEMPTS: 5,
  SESSION_TIMEOUT: 2592000, // 30 days
  AUTH_COOKIE_NAME: 'aurora_auth_session',
};
```

### Auth Rate Limiter

```typescript
// src/lib/security.ts
class RateLimiter {
  isAllowed(identifier: string): boolean;
  recordAttempt(identifier: string): void;
  getBlockTimeRemaining(identifier: string): number;
}

export const authRateLimiter = new RateLimiter();
```

### Usage

```typescript
if (!authRateLimiter.isAllowed(email)) {
  const waitTime = authRateLimiter.getBlockTimeRemaining(email);
  return {
    error: new Error(`Too many attempts. Try again in ${waitTime} seconds.`)
  };
}
```

---

## 📊 Query Keys Reference

### TanStack Query Keys

```typescript
// Products
["products", { filters }]
["product", asin]
["featured-products", limit]
["products-by-category", categoryId, limit]
["related-products", categoryId, excludeAsin, limit]
["seller", sellerId]

// Services
["services", filters]
["service", listingId]
["provider", providerId]
["service-bookings", providerId]

// Profile
["full-profile", userId]
["public-profile", userId]
["profile-search", filters]

// Settings
["settings", "profile", userId]
["settings", "role", accountType]
["settings", "addresses", userId]

// Orders
["orders", userId]
["order", orderId]

// Cart (Zustand - not cached)

// Healthcare
["doctors", filters]
["doctor", doctorId]
["patient", patientId]
["appointments", patientId/doctorId]
["prescriptions", appointmentId]
```

---

## 🔒 Security Best Practices

### 1. Input Validation

```typescript
import { validateEmail, detectSqlInjection, detectXss } from "@/utils/sanitize";

if (!validateEmail(email)) {
  throw new Error("Invalid email");
}

if (detectSqlInjection(input) || detectXss(input)) {
  console.warn("Malicious input detected");
  throw new Error("Invalid input");
}
```

### 2. CSRF Protection

```typescript
import { generateCSRFToken, validateCSRFToken } from "@/lib/csrf";

const token = generateCSRFToken();
// Include in mutation headers
```

### 3. Row-Level Security (RLS)

All tables have RLS policies enabled. Example:

```sql
-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
ON users
FOR UPDATE
USING (auth.uid() = id);
```

### 4. Secure Cookie Storage

```typescript
// Production: HttpOnly, Secure, SameSite=Strict
// Client-side cannot set HttpOnly (server must do this)
document.cookie = `${key}=${value}; path=/; max-age=2592000; SameSite=Strict${isHttps ? '; Secure' : ''}`;
```

---

## 📝 Code Examples

### Complete Product Fetch Example

```typescript
import { useProducts } from "@/hooks/useProducts";

function ProductList() {
  const { data, isLoading, error, fetchNextPage, hasNextPage } = useProducts({
    page: 1,
    limit: 20,
    category: "electronics",
    maxPrice: 1000,
    sortBy: "price",
    sortOrder: "asc",
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <Error message={error.message} />;

  return (
    <div>
      {data.products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
      {hasNextPage && (
        <button onClick={() => fetchNextPage()}>Load More</button>
      )}
    </div>
  );
}
```

### Complete Auth Example

```typescript
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signIn, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data, error } = await signIn(email, password);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Logged in successfully!");
      navigate("/");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit" disabled={loading}>
        {loading ? "Loading..." : "Login"}
      </button>
    </form>
  );
}
```

---

## 🆘 Support

For API issues or questions:

1. Check existing documentation in `/docs`
2. Review SQL schema in `*.sql` files
3. Check Supabase dashboard for table structure
4. Review RLS policies in `*-rls-policies.sql`

---

**End of API Documentation**
