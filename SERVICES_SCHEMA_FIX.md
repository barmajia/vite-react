# 🔧 Services Database Schema Fix

**Issue:** Code uses both `service_*` and `svc_*` tables inconsistently, causing 400/406 errors  
**Solution:** Standardize on `svc_*` tables (newer, more comprehensive)  
**Date:** March 20, 2026

---

## 🎯 Decision: Use `svc_*` Tables

We're standardizing on the **`svc_*`** table prefix because:
1. ✅ More comprehensive schema (better fields)
2. ✅ Better normalized structure
3. ✅ Supports all features (availability, reviews, escrow)
4. ✅ Consistent with recent migrations

---

## 📊 Current State

### Files Using `service_*` (Need to Fix)

| File | Table Used | Should Use |
|------|------------|------------|
| `OnboardingWizard.tsx` | `service_providers` | `svc_providers` |
| `BookingsPage.tsx` | `service_bookings`, `service_listings` | `svc_orders`, `svc_listings` |
| `useRecentBookings.ts` | `service_bookings`, `service_listings` | `svc_orders`, `svc_listings` |
| `useProviderAnalytics.ts` | `service_providers`, `service_bookings` | `svc_providers`, `svc_orders` |
| `DashboardSidebar.tsx` | `service_providers` | `svc_providers` |
| `ServicesInbox.tsx` | `service_listings` | `svc_listings` |
| `ServicesChat.tsx` | `service_listings` | `svc_listings` |
| `ServiceOnboardingWizard.tsx` | `service_providers` | `svc_providers` |
| `useAvailability.ts` | `service_bookings` | `svc_orders` |
| `supabase-messaging.ts` | `service_listings` | `svc_listings` |

### Files Already Using `svc_*` (Correct)

| File | Status |
|------|--------|
| `useServiceRole.ts` | ✅ Correct |
| `useAuth.tsx` | ✅ Correct |
| `ServicesHeader.tsx` | ✅ Correct |
| `ServiceCategoryPage.tsx` | ✅ Correct |
| `ProviderDashboardPage.tsx` | ✅ Correct |
| `CreateServiceListing.tsx` | ✅ Correct |
| `useServices.ts` | ✅ Correct |
| `ServiceBookingPage.tsx` | ✅ Correct |

---

## 🔧 Files to Update

### 1. `src/features/services/pages/OnboardingWizard.tsx`

**Change:**
```diff
- .from("service_providers")
+ .from("svc_providers")
```

### 2. `src/features/services/dashboard/pages/BookingsPage.tsx`

**Change:**
```diff
- .from("service_bookings")
+ .from("svc_orders")

- .from("service_listings")
+ .from("svc_listings")
```

### 3. `src/features/services/dashboard/hooks/useRecentBookings.ts`

**Change:**
```diff
- .from("service_bookings")
+ .from("svc_orders")

- .from("service_listings")
+ .from("svc_listings")
```

### 4. `src/features/services/dashboard/hooks/useProviderAnalytics.ts`

**Change:**
```diff
- .from("service_providers")
+ .from("svc_providers")

- .from("service_bookings")
+ .from("svc_orders")
```

### 5. `src/features/services/dashboard/components/layout/DashboardSidebar.tsx`

**Change:**
```diff
- .from("service_providers")
+ .from("svc_providers")
```

### 6. `src/features/services/components/ServicesInbox.tsx`

**Change:**
```diff
- listing:service_listings
+ listing:svc_listings
```

### 7. `src/features/services/components/ServicesChat.tsx`

**Change:**
```diff
- listing:service_listings
+ listing:svc_listings
```

### 8. `src/features/services/components/ServiceOnboardingWizard.tsx`

**Change:**
```diff
- .from("service_providers")
+ .from("svc_providers")
```

### 9. `src/features/services/bookings/hooks/useAvailability.ts`

**Change:**
```diff
- .from("service_bookings")
+ .from("svc_orders")
```

### 10. `src/features/messaging/lib/supabase-messaging.ts`

**Change:**
```diff
- listing:service_listings(id, title, price)
+ listing:svc_listings(id, title, price)
```

---

## 🗄️ Database Cleanup (Optional)

After updating all files, you can optionally drop the old tables:

```sql
-- ⚠️ WARNING: Only run this after confirming all code uses svc_* tables
-- Drop old service_* tables (if no data)

DROP TABLE IF EXISTS public.service_reviews CASCADE;
DROP TABLE IF EXISTS public.service_bookings CASCADE;
DROP TABLE IF EXISTS public.service_orders CASCADE;
DROP TABLE IF EXISTS public.service_gigs CASCADE;
DROP TABLE IF EXISTS public.service_listings CASCADE;
DROP TABLE IF EXISTS public.service_subcategories CASCADE;
DROP TABLE IF EXISTS public.service_categories CASCADE;
```

**⚠️ Important:** Only run this if:
1. All code has been updated to use `svc_*`
2. There's no important data in the old tables
3. You've tested thoroughly

---

## ✅ Testing Checklist

After making changes:

1. **Services Home** - `/services` loads without errors
2. **Service Category** - `/services/:categorySlug` shows listings
3. **Service Detail** - `/services/listing/:id` displays correctly
4. **Provider Dashboard** - `/services/dashboard` loads analytics
5. **Create Listing** - Can create service listings
6. **Booking Flow** - Can book a service
7. **Services Messages** - `/services/messages` loads conversations
8. **Chat Window** - Can send/receive messages

---

## 📝 Column Mapping

If you need to map columns between schemas:

| `service_*` Column | `svc_*` Equivalent |
|--------------------|-------------------|
| `service_listings.provider_id` | `svc_listings.provider_id` |
| `service_listings.price_numeric` | `svc_listings.price` |
| `service_bookings.*` | `svc_orders.*` |
| `service_providers.*` | `svc_providers.*` |

---

## 🚀 Implementation Order

1. ✅ Update all TypeScript files (10 files)
2. ✅ Test locally with `npm run dev`
3. ✅ Verify no 400/406 errors
4. ✅ Test all services flows
5. ⏳ Optional: Drop old `service_*` tables
6. ⏳ Update Supabase types: `supabase gen types typescript`

---

**Next Step:** Run the fixes in the files listed above, then test thoroughly.
