# 🔒 Row Level Security (RLS) Policy Documentation

> **Complete mapping of database-level RLS policies to frontend routes for the Aurora E-commerce platform**

**Version:** 1.0.0  
**Last Updated:** March 23, 2026  
**Database:** PostgreSQL (Supabase)  
**Total Policies:** 150+

---

## 📋 Table of Contents

- [Overview](#-overview)
- [RLS Architecture](#-rls-architecture)
- [Policies by Table](#-policies-by-table)
  - [Authentication & Users](#authentication--users)
  - [Products & Trading](#products--trading)
  - [Services](#services)
  - [Healthcare](#healthcare)
  - [Orders & Cart](#orders--cart)
  - [Factory & Middleman](#factory--middleman)
  - [Messaging & Social](#messaging--social)
- [Route-to-Policy Mapping](#-route-to-policy-mapping)
- [Security Testing](#-security-testing)
- [Audit Checklist](#-audit-checklist)

---

## 🎯 Overview

This document provides **critical security documentation** linking frontend routes to their corresponding database-level RLS policies. This ensures:

1. ✅ **Defense in Depth** - Frontend guards + database policies
2. ✅ **Data Isolation** - Users can only access their own data
3. ✅ **Role Enforcement** - Database validates user roles
4. ✅ **Audit Trail** - Clear mapping for security reviews

### Why RLS Matters

| Layer | Protection | Can Be Bypassed? |
|-------|-----------|------------------|
| Frontend Route Guards | UI/UX only | ✅ Yes (DevTools) |
| API/Edge Functions | Business logic | ⚠️ Partially |
| **Database RLS** | **Data access** | ❌ **No** |

---

## 🏗️ RLS Architecture

### Policy Structure

```sql
CREATE POLICY policy_name ON table_name
  FOR operation -- SELECT | INSERT | UPDATE | DELETE
  TO role -- authenticated | anon | service_role
  USING (boolean_expression) -- FOR SELECT/UPDATE/DELETE
  WITH CHECK (boolean_expression); -- FOR INSERT/UPDATE
```

### Roles Hierarchy

```
anon (public) → authenticated (any logged-in user) → service_role (admin)
```

### Custom User Roles (stored in `users.role`)

```typescript
type UserRole = 
  | 'customer'
  | 'seller'
  | 'factory'
  | 'middleman'
  | 'service_provider'
  | 'doctor'
  | 'patient'
  | 'admin';
```

---

## 📊 Policies by Table

### Authentication & Users

#### `auth.users` (Supabase Managed)

| Policy | Operation | Expression | Purpose |
|--------|-----------|------------|---------|
| (Built-in) | ALL | Supabase manages | Authentication |

#### `public.users`

| Policy Name | Operation | Role | Expression | Purpose |
|-------------|-----------|------|------------|---------|
| `users_select_own` | SELECT | authenticated | `user_id = auth.uid()` | View own profile |
| `users_select_public` | SELECT | authenticated | `is_public = true` | View public profiles |
| `users_insert_own` | INSERT | authenticated | `user_id = auth.uid()` | Create own profile |
| `users_update_own` | UPDATE | authenticated | `user_id = auth.uid()` | Update own profile |
| `users_delete_own` | DELETE | authenticated | `user_id = auth.uid()` | Delete own account |

**Related Routes:**
- `/profile` → `users_select_own`, `users_update_own`
- `/profile/:userId` → `users_select_public`
- `/settings` → `users_update_own`

---

### Products & Trading

#### `public.products`

| Policy Name | Operation | Role | Expression | Purpose |
|-------------|-----------|------|------------|---------|
| `products_public_read` | SELECT | public | `status = 'active'` | View active products |
| `products_owner_read` | SELECT | authenticated | `seller_id = auth.uid()` | View own products (including drafts) |
| `products_seller_insert` | INSERT | authenticated | `seller_id = auth.uid()` | Create products |
| `products_seller_update` | UPDATE | authenticated | `seller_id = auth.uid()` | Edit own products |
| `products_seller_delete` | DELETE | authenticated | `seller_id = auth.uid()` | Remove own products |

**Related Routes:**
- `/products` → `products_public_read`
- `/product/:asin` → `products_public_read`
- `/factory` → `products_owner_read` (dashboard analytics)

#### `public.categories`

| Policy Name | Operation | Role | Expression | Purpose |
|-------------|-----------|------|------------|---------|
| `categories_public_read` | SELECT | public | `true` | Browse categories |
| `categories_admin_write` | ALL | service_role | `true` | Admin management |

**Related Routes:**
- `/categories` → `categories_public_read`
- `/categories/:slug` → `categories_public_read`

---

### Services

#### ⚠️ **DUPLICATE TABLE WARNING**

Your schema has **two parallel service systems**:

| System | Provider Table | Listing Table | Order Table | Status |
|--------|---------------|---------------|-------------|--------|
| **System A** | `service_providers` | `service_listings` | `service_orders` | Legacy |
| **System B** | `svc_providers` | `svc_listings` | `svc_orders` | **Active** |

**🔧 Recommendation:** Use **System B** (`svc_*` tables) for all new development. Migrate System A data and deprecate.

#### `public.svc_providers` (Active System)

| Policy Name | Operation | Role | Expression | Purpose |
|-------------|-----------|------|------------|---------|
| `svc_prov_public_read` | SELECT | authenticated | `status = 'active'` | View active providers |
| `svc_prov_owner_write` | INSERT/UPDATE | authenticated | `user_id = auth.uid()` | Manage own provider profile |
| `svc_prov_admin_all` | ALL | service_role | `true` | Admin override |

**Related Routes:**
- `/services/provider/:providerId` → `svc_prov_public_read`
- `/services/dashboard/create-profile` → `svc_prov_owner_write`

#### `public.svc_listings`

| Policy Name | Operation | Role | Expression | Purpose |
|-------------|-----------|------|------------|---------|
| `svc_list_public_read` | SELECT | public | `status = 'active'` | View active listings |
| `svc_list_owner_write` | INSERT/UPDATE/DELETE | authenticated | `provider_id IN (SELECT id FROM svc_providers WHERE user_id = auth.uid())` | Manage own listings |
| `svc_list_admin_all` | ALL | service_role | `true` | Admin override |

**Related Routes:**
- `/services/listing/:listingId` → `svc_list_public_read`
- `/services/dashboard/create-listing` → `svc_list_owner_write`

#### `public.svc_orders`

| Policy Name | Operation | Role | Expression | Purpose |
|-------------|-----------|------|------------|---------|
| `svc_ord_view_own` | SELECT | authenticated | `user_id = auth.uid() OR provider_id IN (SELECT id FROM svc_providers WHERE user_id = auth.uid())` | View own orders (customer or provider) |
| `svc_ord_provider_update` | UPDATE | authenticated | `provider_id IN (SELECT id FROM svc_providers WHERE user_id = auth.uid())` | Provider updates order status |
| `svc_ord_customer_insert` | INSERT | authenticated | `user_id = auth.uid()` | Customer creates booking |

**Related Routes:**
- `/services/dashboard/bookings` → `svc_ord_view_own`

#### `public.service_bookings`

| Policy Name | Operation | Role | Expression | Purpose |
|-------------|-----------|------|------------|---------|
| `bookings_view_own` | SELECT | authenticated | `customer_id = auth.uid() OR provider_id IN (SELECT id FROM service_providers WHERE user_id = auth.uid())` | View own bookings |
| `bookings_customer_insert` | INSERT | authenticated | `customer_id = auth.uid()` | Create booking |
| `bookings_provider_update` | UPDATE | authenticated | `provider_id IN (SELECT id FROM service_providers WHERE user_id = auth.uid())` | Provider manages booking |

**Related Routes:**
- `/services/listing/:listingId/book` → `bookings_customer_insert`

---

### Healthcare

#### `public.health_doctor_profiles`

| Policy Name | Operation | Role | Expression | Purpose |
|-------------|-----------|------|------------|---------|
| `health_doctor_public_read` | SELECT | public | `is_verified = true` | View verified doctors |
| `health_doctor_own_write` | INSERT/UPDATE | authenticated | `user_id = auth.uid()` | Doctor manages own profile |
| `health_doctor_admin_verify` | UPDATE | service_role | `true` | Admin verification |

**Related Routes:**
- `/services/health/doctors` → `health_doctor_public_read`
- `/services/health/doctor/signup` → `health_doctor_own_write`
- `/services/health/admin/verify` → `health_doctor_admin_verify`

#### `public.health_appointments`

| Policy Name | Operation | Role | Expression | Purpose |
|-------------|-----------|------|------------|---------|
| `health_appt_view_own` | SELECT | authenticated | `patient_id = auth.uid() OR doctor_id IN (SELECT id FROM health_doctor_profiles WHERE user_id = auth.uid())` | View own appointments |
| `health_appt_patient_insert` | INSERT | authenticated | `patient_id = auth.uid()` | Patient books appointment |
| `health_appt_doctor_update` | UPDATE | authenticated | `doctor_id IN (SELECT id FROM health_doctor_profiles WHERE user_id = auth.uid())` | Doctor manages appointment |

**Related Routes:**
- `/services/health/book/:id` → `health_appt_patient_insert`
- `/services/health/doctor/dashboard` → `health_appt_view_own`

#### `public.health_conversations` (Telemedicine)

| Policy Name | Operation | Role | Expression | Purpose |
|-------------|-----------|------|------------|---------|
| `health_conv_view_own` | SELECT | authenticated | `patient_id = auth.uid() OR doctor_id IN (SELECT id FROM health_doctor_profiles WHERE user_id = auth.uid())` | View own consultations |
| `health_conv_insert` | INSERT | authenticated | `true` | Create consultation (doctor or patient) |
| `health_conv_update` | UPDATE | authenticated | `(patient_id = auth.uid() OR doctor_id IN (SELECT id FROM health_doctor_profiles WHERE user_id = auth.uid()))` | Update own consultation |

**Related Routes:**
- `/services/health/consult/:id` → `health_conv_view_own`

#### `public.health_prescriptions`

| Policy Name | Operation | Role | Expression | Purpose |
|-------------|-----------|------|------------|---------|
| `health_rx_patient_view` | SELECT | authenticated | `patient_id = auth.uid()` | Patient views own prescriptions |
| `health_rx_doctor_write` | INSERT/UPDATE | authenticated | `doctor_id IN (SELECT id FROM health_doctor_profiles WHERE user_id = auth.uid())` | Doctor creates prescriptions |
| `health_rx_pharmacist_view` | SELECT | authenticated | `role = 'pharmacist'` | Pharmacist verification |

**Related Routes:**
- `/services/health/patient/dashboard` → `health_rx_patient_view`

#### `public.health_pharmacies`

| Policy Name | Operation | Role | Expression | Purpose |
|-------------|-----------|------|------------|---------|
| `health_pharm_public_read` | SELECT | public | `is_verified = true` | View verified pharmacies |
| `health_pharm_owner_write` | INSERT/UPDATE | authenticated | `user_id = auth.uid()` | Manage own pharmacy |

**Related Routes:**
- `/services/health/pharmacies` → `health_pharm_public_read`

---

### Orders & Cart

#### `public.orders`

| Policy Name | Operation | Role | Expression | Purpose |
|-------------|-----------|------|------------|---------|
| `orders_view_own` | SELECT | authenticated | `buyer_id = auth.uid() OR seller_id = auth.uid()` | View own orders (buyer or seller) |
| `orders_buyer_insert` | INSERT | authenticated | `buyer_id = auth.uid()` | Customer places order |
| `orders_seller_update` | UPDATE | authenticated | `seller_id = auth.uid()` | Seller updates order status |
| `orders_admin_view` | SELECT | service_role | `true` | Admin oversight |

**Related Routes:**
- `/orders` → `orders_view_own`
- `/orders/:id` → `orders_view_own`
- `/checkout` → `orders_buyer_insert`

#### `public.cart`

| Policy Name | Operation | Role | Expression | Purpose |
|-------------|-----------|------|------------|---------|
| `cart_user_own` | ALL | authenticated | `user_id = auth.uid()` | Full access to own cart |

**Related Routes:**
- `/cart` → `cart_user_own`

#### `public.order_items`

| Policy Name | Operation | Role | Expression | Purpose |
|-------------|-----------|------|------------|---------|
| `order_items_view_own` | SELECT | authenticated | `order_id IN (SELECT id FROM orders WHERE buyer_id = auth.uid() OR seller_id = auth.uid())` | View items in own orders |

---

### Factory & Middleman

#### `public.factory_connections`

| Policy Name | Operation | Role | Expression | Purpose |
|-------------|-----------|------|------------|---------|
| `factory_conn_view_own` | SELECT | authenticated | `factory_id = auth.uid() OR requester_id = auth.uid()` | View own connections |
| `factory_conn_insert` | INSERT | authenticated | `requester_id = auth.uid()` | Request connection |
| `factory_conn_update` | UPDATE | authenticated | `factory_id = auth.uid() OR requester_id = auth.uid()` | Accept/reject connection |

**Related Routes:**
- `/factory/connections` → `factory_conn_view_own`

#### `public.middle_man_deals`

| Policy Name | Operation | Role | Expression | Purpose |
|-------------|-----------|------|------------|---------|
| `mm_deals_view_own` | SELECT | authenticated | `middle_man_id = auth.uid() OR buyer_id = auth.uid() OR seller_id = auth.uid()` | View deals involving user |
| `mm_deals_insert` | INSERT | authenticated | `middle_man_id = auth.uid()` | Middleman creates deal |
| `mm_deals_update` | UPDATE | authenticated | `middle_man_id = auth.uid()` | Middleman manages deal |

**Related Routes:**
- `/middleman/deals` → `mm_deals_view_own`
- `/middleman/deals/new` → `mm_deals_insert`
- `/middleman/deals/:dealId` → `mm_deals_view_own`

#### `public.factory_quotes` (NEW)

| Policy Name | Operation | Role | Expression | Purpose |
|-------------|-----------|------|------------|---------|
| `factory_quotes_factory_view` | SELECT | authenticated | `factory_id = auth.uid()` | Factory views quotes sent to them |
| `factory_quotes_factory_update` | UPDATE | authenticated | `factory_id = auth.uid()` | Factory responds to quotes |
| `factory_quotes_requester_view` | SELECT | authenticated | `requester_id = auth.uid()` | Requester views their quotes |
| `factory_quotes_requester_insert` | INSERT | authenticated | `requester_id = auth.uid()` | Requester creates quote request |
| `factory_quotes_requester_update` | UPDATE | authenticated | `requester_id = auth.uid() AND status IN ('pending', 'cancelled')` | Requester modifies pending quotes |

**Related Routes:**
- `/factory/quotes` → `factory_quotes_factory_view`, `factory_quotes_requester_view`

---

### Messaging & Social

#### `public.conversations`

| Policy Name | Operation | Role | Expression | Purpose |
|-------------|-----------|------|------------|---------|
| `conv_view_own` | SELECT | authenticated | `id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid())` | View conversations user is part of |
| `conv_insert` | INSERT | authenticated | `true` | Create new conversation |

**Related Routes:**
- `/messages` → `conv_view_own`

#### `public.messages`

| Policy Name | Operation | Role | Expression | Purpose |
|-------------|-----------|------|------------|---------|
| `msg_view_own` | SELECT | authenticated | `conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid())` | View messages in own conversations |
| `msg_insert` | INSERT | authenticated | `sender_id = auth.uid()` | Send messages |

**Related Routes:**
- `/messages/:conversationId` → `msg_view_own`, `msg_insert`

#### `public.posts` (Social Feed)

| Policy Name | Operation | Role | Expression | Purpose |
|-------------|-----------|------|------------|---------|
| `posts_public_read` | SELECT | public | `visibility = 'public'` | View public posts |
| `posts_followers_read` | SELECT | authenticated | `visibility = 'followers' AND author_id IN (SELECT follower_id FROM followers WHERE followed_id = auth.uid())` | Followers-only posts |
| `posts_own_write` | INSERT/UPDATE/DELETE | authenticated | `author_id = auth.uid()` | Manage own posts |

**Related Routes:**
- `/feed` → `posts_public_read`, `posts_followers_read`

---

## 🗺️ Route-to-Policy Mapping

### Critical Routes Security Matrix

| Route | Required Tables | RLS Policies | Frontend Guard | Risk Level |
|-------|----------------|--------------|----------------|------------|
| `/factory/quotes` | `factory_quotes` | `factory_quotes_*` | `ProtectedRoute(role='factory')` | 🟡 Medium |
| `/middleman/deals/:dealId` | `middle_man_deals` | `mm_deals_view_own` | `ProtectedRoute(role='middleman')` | 🟡 Medium |
| `/services/health/consult/:id` | `health_conversations` | `health_conv_view_own` | `AuthenticatedRoute` | 🔴 High (HIPAA) |
| `/orders/:id` | `orders`, `order_items` | `orders_view_own`, `order_items_view_own` | `AuthenticatedRoute` | 🟡 Medium |
| `/messages/:conversationId` | `conversations`, `messages` | `conv_view_own`, `msg_view_own` | `AuthenticatedRoute` | 🟢 Low |
| `/profile/:userId` | `users`, `svc_providers` | `users_select_public`, `svc_prov_public_read` | None (public) | 🟢 Low |
| `/services/dashboard/bookings` | `svc_orders` OR `service_bookings` | `svc_ord_view_own` OR `bookings_view_own` | `ProtectedRoute(role='service_provider')` | 🟡 Medium |

### Healthcare HIPAA-Critical Routes

| Route | Data Sensitivity | RLS Policy | Additional Controls Required |
|-------|-----------------|------------|-----------------------------|
| `/services/health/consult/:id` | 🔴 Protected Health Info (PHI) | `health_conv_view_own` | ✅ Encryption, ✅ Audit logs, ✅ Access logging |
| `/services/health/patient/dashboard` | 🔴 PHI + Medical History | `health_appt_view_own`, `health_rx_patient_view` | ✅ Session timeout, ✅ 2FA recommended |
| `/services/health/doctor/dashboard` | 🔴 PHI (multiple patients) | `health_appt_view_own` | ✅ Role verification, ✅ Audit trail |
| `/services/health/admin/verify` | 🔴 Doctor credentials | `health_doctor_admin_verify` | ✅ IP allowlist, ✅ Admin role only |

---

## 🧪 Security Testing

### RLS Policy Test Suite

```sql
-- Test 1: User cannot view another user's cart
BEGIN;
  SET LOCAL request.jwt.claims.sub = 'user-id-1';
  SELECT * FROM cart WHERE user_id = 'user-id-2'; -- Should return 0 rows
ROLLBACK;

-- Test 2: Factory can only view their own quotes
BEGIN;
  SET LOCAL request.jwt.claims.sub = 'factory-id-1';
  SELECT * FROM factory_quotes WHERE factory_id = 'factory-id-2'; -- Should return 0 rows
ROLLBACK;

-- Test 3: Patient cannot view other patients' appointments
BEGIN;
  SET LOCAL request.jwt.claims.sub = 'patient-id-1';
  SELECT * FROM health_appointments WHERE patient_id = 'patient-id-2'; -- Should return 0 rows
ROLLBACK;

-- Test 4: Middleman can view their own deals
BEGIN;
  SET LOCAL request.jwt.claims.sub = 'middleman-id-1';
  SELECT * FROM middle_man_deals WHERE middle_man_id = 'middleman-id-1'; -- Should return rows
ROLLBACK;
```

### Automated RLS Testing Function

```sql
CREATE OR REPLACE FUNCTION test_rls_policy(
  p_table_name text,
  p_user_id uuid,
  p_expected_rows integer
) RETURNS boolean AS $$
DECLARE
  v_row_count integer;
BEGIN
  EXECUTE format(
    'SET LOCAL request.jwt.claims.sub = %L',
    p_user_id
  );
  
  EXECUTE format(
    'SELECT COUNT(*) FROM %I',
    p_table_name
  ) INTO v_row_count;
  
  RETURN v_row_count = p_expected_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Usage:
-- SELECT test_rls_policy('cart', 'user-id-1', 1); -- Should return true
-- SELECT test_rls_policy('cart', 'user-id-2', 0); -- Should return true (cannot view other's cart)
```

---

## ✅ Audit Checklist

### Pre-Launch Security Audit

- [ ] **All protected routes have corresponding RLS policies**
- [ ] **RLS enabled on all sensitive tables** (check `pg_tables.rowsecurity`)
- [ ] **No policies with `TO public`** for sensitive data
- [ ] **Healthcare tables have audit logging triggers**
- [ ] **Service role policies documented and restricted**
- [ ] **Test suite covers all RLS policies**
- [ ] **Penetration testing performed on critical routes**

### RLS Enablement Verification

```sql
-- Check which tables have RLS enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check for tables missing RLS (potential security gap)
SELECT 
  t.tablename
FROM pg_tables t
LEFT JOIN pg_policy p ON p.tablerelid = (t.schemaname || '.' || t.tablename)::regclass
WHERE t.schemaname = 'public'
  AND p.tablerelid IS NULL
  AND t.tablename NOT LIKE 'pg_%'
  AND t.tablename NOT IN ('migrations', 'schema_migrations');
```

### Policy Coverage Report

```sql
-- Generate policy coverage report
SELECT 
  tablename,
  policyname,
  cmd AS operation,
  roles,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING defined'
    WHEN with_check IS NOT NULL THEN 'WITH CHECK defined'
    ELSE 'No expression'
  END AS expression_status
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## 🔗 Related Documentation

- [ROUTES_COMPLETE.md](./ROUTES_COMPLETE.md) - Frontend route documentation
- [create-factory-quotes.sql](./create-factory-quotes.sql) - Factory quotes table + RLS
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

**Last Updated:** March 23, 2026  
**Maintained by:** Youssef  
**Security Review Date:** Pending  
**Next Audit:** Before production launch
