-- =====================================================
-- QUICK FIX: Add Missing Service Columns
-- =====================================================
-- Copy this ENTIRE file and paste in Supabase SQL Editor
-- Then click "Run"
-- =====================================================

-- 1. Add is_featured column to svc_listings
ALTER TABLE svc_listings 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- 2. Add sort_order column to svc_subcategories
ALTER TABLE svc_subcategories 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 3. Add status column to svc_listings (if missing)
ALTER TABLE svc_listings 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_svc_listings_featured 
ON svc_listings(is_featured) WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS idx_svc_subcategories_sort 
ON svc_subcategories(sort_order);

CREATE INDEX IF NOT EXISTS idx_svc_listings_status 
ON svc_listings(status) WHERE status = 'active';

-- =====================================================
-- ✅ Done! The services pages should now work.
-- Refresh your browser to see the changes.
-- =====================================================
