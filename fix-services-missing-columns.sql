-- =====================================================
-- Add Missing Columns to Services Tables
-- =====================================================
-- Run this in Supabase SQL Editor to fix schema issues
-- =====================================================

-- 1. Add is_featured column to svc_listings if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'svc_listings' 
        AND column_name = 'is_featured'
    ) THEN
        ALTER TABLE svc_listings 
        ADD COLUMN is_featured BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added is_featured column to svc_listings';
        
        -- Add index for featured listings
        CREATE INDEX IF NOT EXISTS idx_svc_listings_is_featured 
        ON svc_listings(is_featured) WHERE is_featured = true;
        RAISE NOTICE 'Created index on is_featured';
    ELSE
        RAISE NOTICE 'is_featured column already exists on svc_listings';
    END IF;
END $$;

-- 2. Add sort_order column to svc_subcategories if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'svc_subcategories' 
        AND column_name = 'sort_order'
    ) THEN
        ALTER TABLE svc_subcategories 
        ADD COLUMN sort_order INTEGER DEFAULT 0;
        RAISE NOTICE 'Added sort_order column to svc_subcategories';
        
        -- Add index for sorting
        CREATE INDEX IF NOT EXISTS idx_svc_subcategories_sort_order 
        ON svc_subcategories(sort_order);
        RAISE NOTICE 'Created index on sort_order';
    ELSE
        RAISE NOTICE 'sort_order column already exists on svc_subcategories';
    END IF;
END $$;

-- 3. Add status column to svc_listings if it doesn't exist (for consistency)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'svc_listings' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE svc_listings 
        ADD COLUMN status TEXT DEFAULT 'active' 
        CHECK (status IN ('draft', 'active', 'paused', 'filled', 'closed'));
        RAISE NOTICE 'Added status column to svc_listings';
        
        -- Add index for status filtering
        CREATE INDEX IF NOT EXISTS idx_svc_listings_status 
        ON svc_listings(status) WHERE status = 'active';
        RAISE NOTICE 'Created index on status';
    ELSE
        RAISE NOTICE 'status column already exists on svc_listings';
    END IF;
END $$;

-- 4. Verify all columns exist
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('svc_listings', 'svc_subcategories')
AND column_name IN ('is_featured', 'sort_order', 'status')
ORDER BY table_name, column_name;

-- 5. Update existing listings to be featured (optional - for testing)
UPDATE svc_listings 
SET is_featured = true 
WHERE created_at > NOW() - INTERVAL '7 days'
AND is_featured = false;

-- 6. Set default sort_order for subcategories
UPDATE svc_subcategories 
SET sort_order = id::text::integer % 100  -- Simple pseudo-sort based on ID
WHERE sort_order = 0;

-- 7. Test queries that were failing
-- This should work now without errors
SELECT 'Testing svc_listings query' as test;
SELECT id, title, is_featured, is_active 
FROM svc_listings 
WHERE is_active = true 
ORDER BY is_featured DESC, created_at DESC 
LIMIT 5;

SELECT 'Testing svc_subcategories query' as test;
SELECT id, name, category_id, sort_order, is_active 
FROM svc_subcategories 
WHERE is_active = true 
ORDER BY sort_order ASC 
LIMIT 5;
