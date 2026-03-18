-- Fix conversations table relationships
-- Run this in Supabase SQL Editor

-- =============================================
-- STEP 1: Check if conversations table exists
-- =============================================
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'conversations'
) as table_exists;

-- =============================================
-- STEP 2: Add foreign key constraints if missing
-- =============================================

-- Add foreign key for provider_id
ALTER TABLE public.conversations
ADD CONSTRAINT IF NOT EXISTS conversations_provider_id_fkey
FOREIGN KEY (provider_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign key for customer_id
ALTER TABLE public.conversations
ADD CONSTRAINT IF NOT EXISTS conversations_customer_id_fkey
FOREIGN KEY (customer_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign key for listing_id (if it exists)
ALTER TABLE public.conversations
ADD CONSTRAINT IF NOT EXISTS conversations_listing_id_fkey
FOREIGN KEY (listing_id) REFERENCES public.svc_listings(id) ON DELETE SET NULL;

-- =============================================
-- STEP 3: Verify constraints
-- =============================================
SELECT
    conname as constraint_name,
    conrelid::regclass as table_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.conversations'::regclass
AND contype = 'f';

-- =============================================
-- STEP 4: Enable RLS if not already enabled
-- =============================================
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 5: Create RLS policies
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "conversations_view_own" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert_own" ON public.conversations;
DROP POLICY IF EXISTS "conversations_update_own" ON public.conversations;

-- Users can view conversations where they are provider or customer
CREATE POLICY "conversations_view_own" ON public.conversations
    FOR SELECT
    TO authenticated
    USING (
        provider_id = auth.uid() OR customer_id = auth.uid()
    );

-- Users can create conversations
CREATE POLICY "conversations_insert_own" ON public.conversations
    FOR INSERT
    TO authenticated
    WITH CHECK (
        provider_id = auth.uid() OR customer_id = auth.uid()
    );

-- Users can update conversations where they are provider or customer
CREATE POLICY "conversations_update_own" ON public.conversations
    FOR UPDATE
    TO authenticated
    USING (
        provider_id = auth.uid() OR customer_id = auth.uid()
    );

-- =============================================
-- STEP 6: Verify RLS policies
-- =============================================
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'conversations'
ORDER BY policyname;

-- =============================================
-- STEP 7: Test query (should work now)
-- =============================================
-- This query should now work without errors:
-- SELECT 
--   id,
--   provider_id,
--   customer_id,
--   listing_id,
--   last_message,
--   updated_at
-- FROM public.conversations
-- WHERE provider_id = auth.uid() OR customer_id = auth.uid()
-- ORDER BY updated_at DESC;
