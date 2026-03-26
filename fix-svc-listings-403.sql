-- ═══════════════════════════════════════════════════════════
-- FIX: svc_listings RLS Policies
-- ═══════════════════════════════════════════════════════════
-- Run this in Supabase SQL Editor to fix 403 Forbidden errors
-- when creating service listings

-- Enable RLS
ALTER TABLE public.svc_listings ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "listings_public_view" ON public.svc_listings;
DROP POLICY IF EXISTS "listings_manage_own" ON public.svc_listings;
DROP POLICY IF EXISTS "listings_insert_own" ON public.svc_listings;
DROP POLICY IF EXISTS "listings_update_own" ON public.svc_listings;
DROP POLICY IF EXISTS "listings_delete_own" ON public.svc_listings;
DROP POLICY IF EXISTS "svc_list_owner_write" ON public.svc_listings;
DROP POLICY IF EXISTS "svc_list_public_read" ON public.svc_listings;

-- ═══════════════════════════════════════════════════════════
-- POLICY 1: Public can view active listings
-- ═══════════════════════════════════════════════════════════
CREATE POLICY "listings_public_view" ON public.svc_listings
  FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- ═══════════════════════════════════════════════════════════
-- POLICY 2: Providers can INSERT their own listings
-- This checks that the provider_id belongs to a provider owned by the user
-- ═══════════════════════════════════════════════════════════
CREATE POLICY "listings_insert_own" ON public.svc_listings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    provider_id IN (
      SELECT id FROM public.svc_providers
      WHERE user_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════
-- POLICY 3: Providers can UPDATE their own listings
-- ═══════════════════════════════════════════════════════════
CREATE POLICY "listings_update_own" ON public.svc_listings
  FOR UPDATE
  TO authenticated
  USING (
    provider_id IN (
      SELECT id FROM public.svc_providers
      WHERE user_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════
-- POLICY 4: Providers can DELETE their own listings
-- ═══════════════════════════════════════════════════════════
CREATE POLICY "listings_delete_own" ON public.svc_listings
  FOR DELETE
  TO authenticated
  USING (
    provider_id IN (
      SELECT id FROM public.svc_providers
      WHERE user_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════
-- POLICY 5: Providers can manage all operations (fallback)
-- ═══════════════════════════════════════════════════════════
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

-- ═══════════════════════════════════════════════════════════
-- Verify policies were created
-- ═══════════════════════════════════════════════════════════
SELECT
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'svc_listings'
  AND schemaname = 'public'
ORDER BY policyname;

-- ═══════════════════════════════════════════════════════════
-- Test Query: Check if current user has a provider record
-- ═══════════════════════════════════════════════════════════
-- Replace with your user ID to test
-- SELECT id, user_id, provider_name, status
-- FROM public.svc_providers
-- WHERE user_id = 'YOUR-USER-ID-HERE';
