-- ============================================================
-- Complete Fix for service_bookings Table
-- Adds customer contact columns AND fixes foreign key relationship
-- ============================================================

-- ============================================================
-- PART 1: Add Customer Contact Columns to service_bookings
-- ============================================================
-- These columns store customer contact info at the time of booking
-- (snapshot - won't change if user updates their profile later)

ALTER TABLE public.service_bookings
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS customer_email TEXT,
ADD COLUMN IF NOT EXISTS customer_phone TEXT,
ADD COLUMN IF NOT EXISTS customer_notes TEXT,
ADD COLUMN IF NOT EXISTS provider_notes TEXT;

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.service_bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON public.service_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_provider ON public.service_bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON public.service_bookings(customer_id);

-- Add comments for documentation
COMMENT ON COLUMN public.service_bookings.customer_name IS 'Customer name at time of booking (snapshot)';
COMMENT ON COLUMN public.service_bookings.customer_email IS 'Customer email at time of booking (snapshot)';
COMMENT ON COLUMN public.service_bookings.customer_phone IS 'Customer phone at time of booking (snapshot)';
COMMENT ON COLUMN public.service_bookings.customer_notes IS 'Notes from customer to provider';
COMMENT ON COLUMN public.service_bookings.provider_notes IS 'Internal notes from provider';

-- ============================================================
-- PART 2: Fix Foreign Key Relationship for listing_id
-- ============================================================

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

-- ============================================================
-- PART 3: Verify Foreign Keys
-- ============================================================
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

-- ============================================================
-- PART 4: Add RLS Policies
-- ============================================================

-- Enable RLS
ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "users_view_own_bookings" ON public.service_bookings;
DROP POLICY IF EXISTS "users_insert_own_bookings" ON public.service_bookings;
DROP POLICY IF EXISTS "users_update_own_bookings" ON public.service_bookings;

-- Policy: Users can view bookings where they are customer OR provider
CREATE POLICY "users_view_own_bookings" ON public.service_bookings
FOR SELECT TO authenticated
USING (
  auth.uid() = customer_id OR auth.uid() = provider_id
);

-- Policy: Users can insert bookings as customer
CREATE POLICY "users_insert_own_bookings" ON public.service_bookings
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = customer_id);

-- Policy: Users can update their own bookings
CREATE POLICY "users_update_own_bookings" ON public.service_bookings
FOR UPDATE TO authenticated
USING (
  auth.uid() = customer_id OR auth.uid() = provider_id
);

-- ============================================================
-- PART 5: Add RLS for service_listings (for relationship queries)
-- ============================================================

DROP POLICY IF EXISTS "listings_public_read" ON public.service_listings;
CREATE POLICY "listings_public_read" ON public.service_listings
FOR SELECT TO authenticated
USING (true);

-- ============================================================
-- PART 6: Verify Columns
-- ============================================================
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'service_bookings'
ORDER BY ordinal_position;

-- ============================================================
-- PART 7: Test Query (Uncomment to test)
-- ============================================================
-- This should work after running this migration:
-- SELECT 
--   id,
--   customer_name,
--   customer_email,
--   customer_phone,
--   listing_id
-- FROM service_bookings
-- LIMIT 1;

-- ============================================================
-- Migration Complete!
-- ============================================================
SELECT 'service_bookings table fix complete' as status;
