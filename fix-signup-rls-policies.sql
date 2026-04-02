-- =====================================================
-- FIX: Allow signup trigger to bypass RLS restrictions
-- =====================================================
-- This fixes the "Database error saving new user" error
-- by updating RLS policies to allow service_role to insert

-- =====================================================
-- 1. FIX USERS TABLE RLS
-- =====================================================

-- Drop the restrictive insert policy
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Create a new policy that allows service_role to insert (for trigger)
CREATE POLICY "Users can insert own profile"
    ON public.users
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id 
        OR (current_user = 'postgres' OR auth.role() = 'service_role')
    );

-- Also allow anon role for initial signup (if needed)
CREATE POLICY "Allow signup insertions"
    ON public.users
    FOR INSERT
    TO anon, authenticated, service_role
    WITH CHECK (
        auth.uid() = user_id 
        OR current_user = 'postgres'
    );

-- =====================================================
-- 2. FIX SELLERS TABLE RLS
-- =====================================================

-- Drop the restrictive insert policy
DROP POLICY IF EXISTS "Users can insert own profile" ON public.sellers;

-- Create a new policy that allows service_role to insert (for trigger)
CREATE POLICY "Users can insert own profile"
    ON public.sellers
    FOR INSERT
    TO authenticated, service_role
    WITH CHECK (
        auth.uid() = user_id 
        OR current_user = 'postgres'
    );

-- Also allow the trigger to insert for seller signups
CREATE POLICY "Allow seller signup insertions"
    ON public.sellers
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id 
        OR current_user = 'postgres'
    );

-- =====================================================
-- 3. VERIFY THE POLICIES ARE WORKING
-- =====================================================
-- After running this script, test signup again
-- Users should be able to sign up as customer or seller
