# 🚨 URGENT: Fix Services Errors

## The Problem

Your database tables are **missing columns** that the code expects:
- `svc_listings.is_featured` ❌
- `svc_subcategories.sort_order` ❌

## ✅ Solution (Do This First!)

**Run this SQL in Supabase SQL Editor:**

1. Go to: https://ofovfxsfazlwvcakpuer.supabase.co
2. Click **SQL Editor** (left sidebar)
3. Copy and paste the content of `fix-services-missing-columns.sql`
4. Click **Run**

Or run this quick version:

```sql
-- Add is_featured to svc_listings
ALTER TABLE svc_listings 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_svc_listings_featured 
ON svc_listings(is_featured) WHERE is_featured = true;

-- Add sort_order to svc_subcategories
ALTER TABLE svc_subcategories 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_svc_subcategories_sort 
ON svc_subcategories(sort_order);

-- Add status to svc_listings (if missing)
ALTER TABLE svc_listings 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
```

## Then Restart Dev Server

```bash
npm run dev
```

## Expected Result

After running the SQL and restarting:
- ✅ No more 400 errors
- ✅ No more "column does not exist" errors
- ✅ Services pages load correctly
- ✅ Featured sorting works
- ✅ Subcategories sort correctly

---

## If You Can't Run SQL Right Now

The code has been updated to **handle missing columns gracefully**. It will:
- Log warnings instead of crashing
- Skip featured sorting (fallback to newest)
- Skip sort_order (uses default order)

**But the app will work!** Just without featured/priority sorting.

---

**File to run:** `fix-services-missing-columns.sql`
