-- Fix conversations table for services messaging
-- Based on your existing schema in atall.sql
-- Run this in Supabase SQL Editor

-- Step 1: Add listing_id column for services messaging
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS listing_id uuid;

-- Step 2: Add foreign key constraints for existing columns
ALTER TABLE public.conversations
ADD CONSTRAINT conversations_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.conversations
ADD CONSTRAINT conversations_seller_id_fkey
FOREIGN KEY (seller_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign key for listing_id (services messaging)
ALTER TABLE public.conversations
ADD CONSTRAINT conversations_listing_id_fkey
FOREIGN KEY (listing_id) REFERENCES public.svc_listings(id) ON DELETE SET NULL;

-- Step 3: Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Step 4: Add RLS policies
DROP POLICY IF EXISTS conversations_view_own ON public.conversations;
CREATE POLICY conversations_view_own ON public.conversations
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() 
        OR seller_id = auth.uid()
    );

DROP POLICY IF EXISTS conversations_insert_own ON public.conversations;
CREATE POLICY conversations_insert_own ON public.conversations
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.uid() 
        OR seller_id = auth.uid()
    );

DROP POLICY IF EXISTS conversations_update_own ON public.conversations;
CREATE POLICY conversations_update_own ON public.conversations
    FOR UPDATE
    TO authenticated
    USING (
        user_id = auth.uid() 
        OR seller_id = auth.uid()
    );

-- Step 5: Verify constraints
SELECT conname as constraint_name, contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'public.conversations'::regclass
AND contype = 'f';

-- Step 6: Verify columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'conversations'
ORDER BY ordinal_position;
