-- Fix conversations table - Run this in Supabase SQL Editor
-- This adds the missing foreign key constraints

-- Add foreign key for provider_id
ALTER TABLE public.conversations
ADD CONSTRAINT conversations_provider_id_fkey
FOREIGN KEY (provider_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign key for customer_id  
ALTER TABLE public.conversations
ADD CONSTRAINT conversations_customer_id_fkey
FOREIGN KEY (customer_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add foreign key for listing_id (if column exists)
ALTER TABLE public.conversations
ADD CONSTRAINT conversations_listing_id_fkey
FOREIGN KEY (listing_id) REFERENCES public.svc_listings(id) ON DELETE SET NULL;

-- Verify constraints were added
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'conversations'
AND constraint_type = 'FOREIGN KEY';
