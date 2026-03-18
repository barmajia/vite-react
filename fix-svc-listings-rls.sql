-- Fix svc_listings RLS policies
-- Run this in Supabase SQL Editor to allow public viewing of active listings

-- Enable RLS if not already enabled
ALTER TABLE public.svc_listings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to recreate)
DROP POLICY IF EXISTS "listings_public_view" ON public.svc_listings;
DROP POLICY IF EXISTS "listings_manage_own" ON public.svc_listings;
DROP POLICY IF EXISTS "listings_insert_own" ON public.svc_listings;
DROP POLICY IF EXISTS "listings_update_own" ON public.svc_listings;
DROP POLICY IF EXISTS "listings_delete_own" ON public.svc_listings;

-- =============================================
-- POLICY 1: Public can view active listings
-- This allows anyone to browse services
-- =============================================
CREATE POLICY "listings_public_view" ON public.svc_listings
    FOR SELECT
    TO authenticated, anon
    USING (is_active = true);

-- =============================================
-- POLICY 2: Providers can manage their own listings
-- Allows CRUD operations on own listings
-- =============================================
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

-- =============================================
-- POLICY 3: Providers can insert their own listings
-- =============================================
CREATE POLICY "listings_insert_own" ON public.svc_listings
    FOR INSERT
    TO authenticated
    WITH CHECK (
        provider_id IN (
            SELECT id FROM public.svc_providers 
            WHERE user_id = auth.uid()
        )
    );

-- =============================================
-- POLICY 4: Providers can update their own listings
-- =============================================
CREATE POLICY "listings_update_own" ON public.svc_listings
    FOR UPDATE
    TO authenticated
    USING (
        provider_id IN (
            SELECT id FROM public.svc_providers 
            WHERE user_id = auth.uid()
        )
    );

-- =============================================
-- POLICY 5: Providers can delete their own listings
-- =============================================
CREATE POLICY "listings_delete_own" ON public.svc_listings
    FOR DELETE
    TO authenticated
    USING (
        provider_id IN (
            SELECT id FROM public.svc_providers 
            WHERE user_id = auth.uid()
        )
    );

-- =============================================
-- Verify policies
-- =============================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'svc_listings'
ORDER BY policyname;
