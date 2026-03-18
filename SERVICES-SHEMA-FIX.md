# Services Schema Fix

## Problem

The code was using incorrect table and column names that didn't match the actual database schema:

| Code Used | Actual Schema |
|-----------|---------------|
| `service_listings` | `svc_listings` |
| `service_categories` | `svc_categories` |
| `category_slug` (in listings) | `subcategory_id` (UUID reference) |
| `price_numeric` | `price` |
| - | `price_type` (fixed/hourly/monthly) |
| - | `currency` |
| - | `is_active` |

## Files Fixed

### 1. `src/features/services/hooks/useServices.ts`
- ✅ Changed table names: `service_listings` → `svc_listings`
- ✅ Changed table names: `service_categories` → `svc_categories`
- ✅ Updated interface to match schema
- ✅ Changed `category_slug` to `subcategory_id`
- ✅ Added `price_type`, `currency`, `is_active` fields
- ✅ Updated `getListingsByCategory` → `getListingsBySubcategory`
- ✅ Updated `createListing` to use correct fields

### 2. `src/features/services/pages/ServiceCategoryPage.tsx`
- ✅ Complete rewrite to use proper schema
- ✅ Fetches categories with subcategories
- ✅ Filters listings by `subcategory_id` IN array
- ✅ Displays price with currency (EGP/$)
- ✅ Shows price type (fixed/hourly/monthly)
- ✅ Displays provider name from joined `svc_providers` table

### 3. `src/features/services/pages/ProviderDashboardPage.tsx`
- ✅ Changed table: `service_listings` → `svc_listings`

### 4. `src/features/services/pages/CreateServiceListing.tsx`
- ✅ Changed table: `service_listings` → `svc_listings`
- ✅ Changed table: `service_categories` → `svc_categories`

## Database Schema Reference

### svc_listings Table
```sql
CREATE TABLE public.svc_listings (
    id UUID PRIMARY KEY,
    provider_id UUID REFERENCES svc_providers(id),
    subcategory_id UUID REFERENCES svc_subcategories(id),
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    description TEXT,
    price_type VARCHAR(50) DEFAULT 'fixed' CHECK (price_type IN ('fixed', 'hourly', 'monthly')),
    price DECIMAL(10, 2),
    currency VARCHAR(10) DEFAULT 'USD',
    delivery_days INTEGER,
    images TEXT[],
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### svc_categories Table
```sql
CREATE TABLE public.svc_categories (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### svc_subcategories Table
```sql
CREATE TABLE public.svc_subcategories (
    id UUID PRIMARY KEY,
    category_id UUID REFERENCES svc_categories(id),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Required SQL Migration

Run this in Supabase SQL Editor to fix RLS policies:

```sql
-- File: fix-svc-listings-rls.sql

-- Enable RLS
ALTER TABLE public.svc_listings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "listings_public_view" ON public.svc_listings;
DROP POLICY IF EXISTS "listings_manage_own" ON public.svc_listings;

-- Public can view active listings
CREATE POLICY "listings_public_view" ON public.svc_listings
    FOR SELECT
    TO authenticated, anon
    USING (is_active = true);

-- Providers can manage their own listings
CREATE POLICY "listings_manage_own" ON public.svc_listings
    FOR ALL
    TO authenticated
    USING (
        provider_id IN (
            SELECT id FROM public.svc_providers 
            WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        provider_id IN (
            SELECT id FROM public.svc_providers 
            WHERE user_id = auth.uid()
        )
    );
```

## Usage Examples

### Fetch All Listings
```typescript
const { getListings } = useServices();
const listings = await getListings();
```

### Fetch Listings by Category
```typescript
const { getListingsBySubcategory } = useServices();
const listings = await getListingsBySubcategory(subcategoryId);
```

### Create Listing
```typescript
const { createListing } = useServices();
const listing = await createListing(
  "Web Development",
  "web-development",
  subcategoryId, // UUID
  1000,
  "fixed",
  "Professional web development services"
);
```

## Testing

1. **Browse Services**: Navigate to `/services`
2. **View Category**: Click on a category (e.g., Programming)
3. **Check Console**: No 400 errors should appear
4. **Create Listing**: Provider can create new listings
5. **View Listings**: Listings display with correct prices and provider info

## Related Files

- `services-marketplace-schema.sql` - Full schema definition
- `services-marketplace-migration.sql` - Migration script
- `fix-svc-listings-rls.sql` - RLS policy fix

---

**Fixed:** March 18, 2026
**Status:** ✅ Resolved
**Errors Fixed:** 400 Bad Request on svc_listings queries
