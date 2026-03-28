-- =====================================================
-- Fix Service Listings Foreign Keys
-- =====================================================
-- This script ensures proper foreign key constraints 
-- exist for svc_listings relationships
-- =====================================================

-- 1. Check existing foreign keys on svc_listings
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'svc_listings'
AND tc.constraint_type = 'FOREIGN KEY';

-- 2. Add missing foreign key constraints if needed

-- provider_id FK
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'svc_listings'
        AND constraint_name = 'svc_listings_provider_id_fkey'
    ) THEN
        ALTER TABLE svc_listings
        ADD CONSTRAINT svc_listings_provider_id_fkey
        FOREIGN KEY (provider_id) REFERENCES svc_providers(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added provider_id foreign key';
    ELSE
        RAISE NOTICE 'provider_id foreign key already exists';
    END IF;
END $$;

-- category_id FK
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'svc_listings'
        AND constraint_name = 'svc_listings_category_id_fkey'
    ) THEN
        ALTER TABLE svc_listings
        ADD CONSTRAINT svc_listings_category_id_fkey
        FOREIGN KEY (category_id) REFERENCES svc_categories(id);
        RAISE NOTICE 'Added category_id foreign key';
    ELSE
        RAISE NOTICE 'category_id foreign key already exists';
    END IF;
END $$;

-- subcategory_id FK
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'svc_listings'
        AND constraint_name = 'svc_listings_subcategory_id_fkey'
    ) THEN
        ALTER TABLE svc_listings
        ADD CONSTRAINT svc_listings_subcategory_id_fkey
        FOREIGN KEY (subcategory_id) REFERENCES svc_subcategories(id);
        RAISE NOTICE 'Added subcategory_id foreign key';
    ELSE
        RAISE NOTICE 'subcategory_id foreign key already exists';
    END IF;
END $$;

-- 3. Check svc_subcategories foreign key to svc_categories
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'svc_subcategories'
        AND constraint_name = 'svc_subcategories_category_id_fkey'
    ) THEN
        ALTER TABLE svc_subcategories
        ADD CONSTRAINT svc_subcategories_category_id_fkey
        FOREIGN KEY (category_id) REFERENCES svc_categories(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added subcategories category_id foreign key';
    ELSE
        RAISE NOTICE 'subcategories category_id foreign key already exists';
    END IF;
END $$;

-- 4. Verify all foreign keys are in place
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name IN ('svc_listings', 'svc_subcategories')
AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, kcu.column_name;

-- 5. Check for orphaned records (listings with invalid FKs)
-- These would cause INNER JOIN to fail
SELECT 'Orphaned listings (invalid provider_id)' as issue, COUNT(*) as count
FROM svc_listings l
WHERE NOT EXISTS (SELECT 1 FROM svc_providers p WHERE p.id = l.provider_id)
UNION ALL
SELECT 'Orphaned listings (invalid category_id)', COUNT(*)
FROM svc_listings l
WHERE NOT EXISTS (SELECT 1 FROM svc_categories c WHERE c.id = l.category_id)
UNION ALL
SELECT 'Orphaned listings (invalid subcategory_id)', COUNT(*)
FROM svc_listings l
WHERE l.subcategory_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM svc_subcategories s WHERE s.id = l.subcategory_id);

-- 6. Fix orphaned records by setting them to inactive
UPDATE svc_listings
SET is_active = false
WHERE NOT EXISTS (SELECT 1 FROM svc_providers p WHERE p.id = svc_listings.provider_id)
   OR NOT EXISTS (SELECT 1 FROM svc_categories c WHERE c.id = svc_listings.category_id)
   OR (subcategory_id IS NOT NULL 
       AND NOT EXISTS (SELECT 1 FROM svc_subcategories s WHERE s.id = svc_listings.subcategory_id));

-- 7. Test the relationship query directly
-- This should work without 400 error after FKs are fixed
SELECT 
    l.id,
    l.title,
    l.slug,
    p.provider_name,
    c.name as category_name,
    s.name as subcategory_name
FROM svc_listings l
LEFT JOIN svc_providers p ON l.provider_id = p.id
LEFT JOIN svc_categories c ON l.category_id = c.id
LEFT JOIN svc_subcategories s ON l.subcategory_id = s.id
WHERE l.is_active = true
LIMIT 5;
