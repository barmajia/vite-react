-- ============================================================
-- Fix service_bookings Foreign Key Relationship
-- This ensures the PostgREST relationship syntax works correctly
-- ============================================================

-- 1. Check if the foreign key constraint exists
DO $$
BEGIN
    -- Add foreign key constraint for listing_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'service_bookings_listing_id_fkey'
        AND table_name = 'service_bookings'
    ) THEN
        ALTER TABLE public.service_bookings
        ADD CONSTRAINT service_bookings_listing_id_fkey 
        FOREIGN KEY (listing_id) REFERENCES public.service_listings(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Added foreign key constraint: service_bookings_listing_id_fkey';
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists: service_bookings_listing_id_fkey';
    END IF;
END $$;

-- 2. Verify the constraint was created
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
WHERE tc.table_name = 'service_bookings'
AND tc.constraint_type = 'FOREIGN KEY';

-- 3. Add RLS policy for service_listings (if needed)
-- This ensures users can read listing data when querying bookings
DROP POLICY IF EXISTS "listings_public_read" ON public.service_listings;
CREATE POLICY "listings_public_read" ON public.service_listings
FOR SELECT TO authenticated
USING (true);

-- 4. Verify the relationship works with a test query
-- Run this in Supabase to test:
-- SELECT * FROM service_bookings 
-- JOIN service_listings ON service_bookings.listing_id = service_listings.id
-- LIMIT 1;
