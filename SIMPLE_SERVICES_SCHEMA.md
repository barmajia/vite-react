# Simple Services Marketplace Schema

> A simplified services marketplace implementation for Aurora E-commerce

**Version:** 1.0.0  
**Last Updated:** March 16, 2026

---

## 📋 Overview

This is a **simplified** services marketplace schema that requires minimal database setup. It's designed for quick deployment and easy understanding.

### Key Differences from Full Schema

| Feature | Simple Schema | Full Schema |
|---------|--------------|-------------|
| Tables | 2 | 7 |
| Provider Profiles | ❌ No (uses user.id) | ✅ Yes (svc_providers) |
| Subcategories | ❌ No | ✅ Yes |
| Portfolio | ❌ No | ✅ Yes |
| Reviews | ❌ No | ✅ Yes |
| Orders/Bookings | ❌ No | ✅ Yes |
| Complexity | Low | High |

---

## 🗄️ Database Schema

### Tables

#### 1. `service_categories`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `slug` | TEXT | Unique URL-friendly identifier |
| `name` | TEXT | Category name |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

#### 2. `service_listings`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `provider_id` | UUID | References `auth.users(id)` |
| `title` | TEXT | Listing title |
| `slug` | TEXT | Unique URL-friendly identifier |
| `category_slug` | TEXT | References `service_categories(slug)` |
| `price_numeric` | NUMERIC(10,2) | Price amount |
| `description` | TEXT | Listing description |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

---

## 🚀 Setup Instructions

### Step 1: Run the Migration

Open **Supabase SQL Editor** and run:

```sql
-- Copy entire contents of simple-services-schema.sql
```

### Step 2: Verify Installation

```sql
SELECT 
    'Setup Complete' as status,
    (SELECT COUNT(*) FROM service_categories) as categories_count,
    (SELECT COUNT(*) FROM service_listings) as listings_count;
```

Expected output:
```
status: "Setup Complete"
categories_count: 10
listings_count: 0
```

---

## 📁 Updated Files

### TypeScript/Hooks

- ✅ `src/features/services/hooks/useServices.ts` - Updated for simple schema
- ✅ `src/features/services/pages/*.tsx` - All pages updated
- ✅ `src/features/services/components/*.tsx` - Components updated

### Database

- ✅ `simple-services-schema.sql` - Migration file
- ✅ `fix-services-schema.sql` - Fix for missing columns (if needed)

---

## 🔧 API Reference

### useServices Hook

```typescript
const {
  // Data fetching
  getCategories,           // Get all categories
  getListings,             // Get all listings
  getListingsByCategory,   // Get listings by category slug
  getListingBySlug,        // Get single listing by slug
  
  // Actions
  createListing,           // Create new listing
  updateListing,           // Update existing listing
  deleteListing,           // Delete listing
  
  // State
  loading,
  error,
} = useServices();
```

### Example Usage

```typescript
import { useServices } from '@/features/services/hooks/useServices';

function MyComponent() {
  const { getCategories, getListingsByCategory } = useServices();
  
  useEffect(() => {
    const fetchData = async () => {
      const categories = await getCategories();
      const listings = await getListingsByCategory('programming');
    };
    
    fetchData();
  }, []);
  
  return <div>...</div>;
}
```

---

## 📊 Seed Data

### Default Categories (10)

1. **programming** - Programming & Tech
2. **design** - Graphic Design
3. **writing** - Writing & Translation
4. **video** - Video & Animation
5. **business** - Business & Consulting
6. **lifestyle** - Lifestyle & Wellness
7. **marketing** - Digital Marketing
8. **music** - Music & Audio
9. **photography** - Photography
10. **education** - Education & Tutoring

---

## 🔐 RLS Policies

### service_categories

- ✅ **Public read**: Anyone can view categories

### service_listings

- ✅ **Public read**: Anyone can view listings
- ✅ **Insert**: Only listing owner (`provider_id = auth.uid()`)
- ✅ **Update**: Only listing owner
- ✅ **Delete**: Only listing owner

---

## 🛠️ Future Enhancements

To add more features later, you can:

1. **Add Provider Profiles**: Create `service_providers` table
2. **Add Reviews**: Create `service_reviews` table
3. **Add Bookings/Orders**: Create `service_orders` table
4. **Add Portfolio**: Create `service_portfolio` table
5. **Add Subcategories**: Create `service_subcategories` table

---

## 📝 Migration Path

### From Simple → Full Schema

If you need to upgrade to the full schema later:

1. Keep existing `service_listings` data
2. Create new `svc_providers`, `svc_categories`, `svc_subcategories` tables
3. Migrate data from simple to full schema
4. Update application code to use full schema hooks

---

## 🆘 Troubleshooting

### Issue: "relation service_categories does not exist"

**Solution:** Run the migration SQL in Supabase SQL Editor.

### Issue: "permission denied for table service_listings"

**Solution:** Verify RLS policies are created. Re-run migration if needed.

### Issue: Categories not showing

**Solution:** Check if seed data was inserted:
```sql
SELECT * FROM service_categories;
```

---

## 📞 Support

- **Documentation:** This file + inline code comments
- **Issues:** Check browser console + Supabase logs

---

**Built for Aurora E-commerce Platform**
