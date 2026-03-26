# 🔧 Fix 403 Forbidden - svc_listings Insert

## Problem
Getting **403 (Forbidden)** error when trying to insert into `svc_listings`:
```
POST https://*.supabase.co/rest/v1/svc_listings?select=* 403 (Forbidden)
```

## Root Cause

Two issues were causing the 403 error:

### 1. **Wrong provider_id in Code**
The code was using `user.id` (auth user ID) instead of the **provider's ID** from `svc_providers` table.

**Before (❌ Wrong):**
```tsx
await supabase.from("svc_listings").insert({
  provider_id: user.id,  // ❌ Wrong! This is the auth user ID
  // ...
});
```

**After (✅ Correct):**
```tsx
// First get the actual provider ID
const { data: providerData } = await supabase
  .from("svc_providers")
  .select("id")
  .eq("user_id", user.id)
  .single();

// Then use the provider ID
await supabase.from("svc_listings").insert({
  provider_id: providerData.id,  // ✅ Correct! This is the provider record ID
  // ...
});
```

### 2. **RLS Policy Blocking Insert**
The RLS policies need to verify that the `provider_id` in the insert belongs to a provider owned by the authenticated user.

---

## Solution (2 Steps)

### **Step 1: Run SQL Migration**

Run `fix-svc-listings-403.sql` in Supabase SQL Editor to ensure proper RLS policies:

```sql
-- Key policy that allows inserts:
CREATE POLICY "listings_insert_own" ON public.svc_listings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    provider_id IN (
      SELECT id FROM public.svc_providers
      WHERE user_id = auth.uid()
    )
  );
```

**What this does:**
- ✅ Allows INSERT if the `provider_id` belongs to a provider owned by the user
- ✅ Allows UPDATE/DELETE for own listings
- ✅ Allows public to view active listings

### **Step 2: Code Fix Applied**

Updated `CreateServiceListing.tsx` to:
1. First fetch the provider record
2. Use the provider's ID (not user ID)
3. Redirect to onboarding if no provider exists

---

## Files Modified

| File | Changes |
|------|---------|
| `fix-svc-listings-403.sql` | ✅ Created (Run in Supabase) |
| `CreateServiceListing.tsx` | ✅ Fixed provider_id lookup |

---

## Testing

### Test Flow:

1. **Without provider profile:**
   - Go to `/services/create-listing`
   - Should redirect to `/services/onboarding`
   - ✅ Correct behavior

2. **With provider profile:**
   - Complete onboarding first
   - Go to `/services/create-listing`
   - Fill form and submit
   - ✅ Should create listing successfully

---

## Expected Console Output

### Before Fix:
```
❌ POST https://*.supabase.co/rest/v1/svc_listings 403 (Forbidden)
```

### After Fix:
```
✅ Service listing created successfully!
```

---

## Database Schema Reference

### svc_providers table:
```sql
- id (UUID) ← This is what provider_id should be
- user_id (UUID) ← This is auth.uid()
- provider_name (VARCHAR)
- provider_type (VARCHAR)
- ...
```

### svc_listings table:
```sql
- id (UUID)
- provider_id (UUID) ← References svc_providers.id (NOT auth.users.id)
- title (VARCHAR)
- slug (VARCHAR)
- is_active (BOOLEAN)
- status (VARCHAR)
- ...
```

---

## Additional Notes

### Why the confusion?
The `svc_providers` table acts as a **bridge** between:
- `auth.users` (authentication)
- `svc_listings` (service offerings)

This allows one user to potentially have multiple provider profiles (e.g., as both freelancer and company).

### Relationship:
```
auth.users (user.id)
    ↓ (1:1 or 1:many)
svc_providers (provider.id)
    ↓ (1:many)
svc_listings (provider_id)
```

---

**Fixed:** March 26, 2026  
**Priority:** HIGH  
**Impact:** Service listing creation
