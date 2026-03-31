-- =====================================================
-- Fix: Allow users to view other users for chat
-- This fixes the "can't see any users" issue in StartNewChat
-- =====================================================

-- Drop the overly restrictive policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;

-- Create new policy that allows viewing ALL users (needed for chat search)
CREATE POLICY "Users can view all users for chat" ON public.users
FOR SELECT
TO authenticated
USING (true);

-- Alternative: More restrictive - only allow viewing other users (not self)
-- CREATE POLICY "Users can view other users" ON public.users
-- FOR SELECT
-- TO authenticated
-- USING (user_id != auth.uid());

-- Verify the policy exists
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'users' AND cmd = 'SELECT';

-- Test query (run this in Supabase to verify it works)
-- SELECT id, user_id, email, full_name, account_type 
-- FROM public.users 
-- LIMIT 10;
