-- Services Messaging - Foreign Key Constraints
-- Run this in Supabase SQL Editor to fix the 400 error
-- ============================================================

-- Step 1: Ensure conversations table has the correct columns
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS user_id UUID,
ADD COLUMN IF NOT EXISTS seller_id UUID,
ADD COLUMN IF NOT EXISTS listing_id UUID;

-- Step 2: Add Foreign Key Constraints explicitly
-- This tells Supabase exactly how to join 'users' for 'seller_id'
ALTER TABLE public.conversations
DROP CONSTRAINT IF EXISTS conversations_seller_id_fkey;

ALTER TABLE public.conversations
ADD CONSTRAINT conversations_seller_id_fkey 
FOREIGN KEY (seller_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- This tells Supabase exactly how to join 'users' for 'user_id'
ALTER TABLE public.conversations
DROP CONSTRAINT IF EXISTS conversations_user_id_fkey;

ALTER TABLE public.conversations
ADD CONSTRAINT conversations_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- This tells Supabase how to join 'svc_listings' for 'listing_id'
ALTER TABLE public.conversations
DROP CONSTRAINT IF EXISTS conversations_listing_id_fkey;

ALTER TABLE public.conversations
ADD CONSTRAINT conversations_listing_id_fkey 
FOREIGN KEY (listing_id) 
REFERENCES public.svc_listings(id) 
ON DELETE SET NULL;

-- Step 3: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_seller_id ON public.conversations(seller_id);
CREATE INDEX IF NOT EXISTS idx_conversations_listing_id ON public.conversations(listing_id);

-- Step 4: Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Step 5: Add RLS policies
DROP POLICY IF EXISTS conversations_view_own ON public.conversations;
CREATE POLICY conversations_view_own ON public.conversations
  FOR SELECT TO authenticated
  USING ((user_id = auth.uid() OR seller_id = auth.uid()));

DROP POLICY IF EXISTS conversations_insert_own ON public.conversations;
CREATE POLICY conversations_insert_own ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK ((user_id = auth.uid() OR seller_id = auth.uid()));

DROP POLICY IF EXISTS conversations_update_own ON public.conversations;
CREATE POLICY conversations_update_own ON public.conversations
  FOR UPDATE TO authenticated
  USING ((user_id = auth.uid() OR seller_id = auth.uid()));

-- Step 6: Verify constraints were added
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.conversations'::regclass
AND contype = 'f';

-- ============================================================
-- After running this SQL:
-- 1. Refresh your browser (Ctrl+Shift+R)
-- 2. Navigate to /services/messages
-- 3. The 400 error should be gone!
-- ============================================================
