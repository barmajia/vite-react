-- Add services messaging columns to conversations table
-- Run this in Supabase SQL Editor

-- Step 1: Add missing columns for services messaging
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS provider_id uuid,
ADD COLUMN IF NOT EXISTS customer_id uuid,
ADD COLUMN IF NOT EXISTS listing_id uuid;

-- Step 2: Add foreign key constraints
ALTER TABLE public.conversations
ADD CONSTRAINT conversations_provider_id_fkey
FOREIGN KEY (provider_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.conversations
ADD CONSTRAINT conversations_customer_id_fkey
FOREIGN KEY (customer_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.conversations
ADD CONSTRAINT conversations_listing_id_fkey
FOREIGN KEY (listing_id) REFERENCES public.svc_listings(id) ON DELETE SET NULL;

-- Step 3: Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Step 4: Add RLS policies for services messaging
DROP POLICY IF EXISTS conversations_services_view ON public.conversations;
CREATE POLICY conversations_services_view ON public.conversations
    FOR SELECT
    TO authenticated
    USING (
        provider_id = auth.uid() 
        OR customer_id = auth.uid()
    );

DROP POLICY IF EXISTS conversations_services_insert ON public.conversations;
CREATE POLICY conversations_services_insert ON public.conversations
    FOR INSERT
    TO authenticated
    WITH CHECK (
        provider_id = auth.uid() 
        OR customer_id = auth.uid()
    );

DROP POLICY IF EXISTS conversations_services_update ON public.conversations;
CREATE POLICY conversations_services_update ON public.conversations
    FOR UPDATE
    TO authenticated
    USING (
        provider_id = auth.uid() 
        OR customer_id = auth.uid()
    );

-- Step 5: Verify columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'conversations'
ORDER BY ordinal_position;

-- Step 6: Verify constraints
SELECT conname as constraint_name, contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'public.conversations'::regclass
AND contype = 'f';
