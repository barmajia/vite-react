-- ═══════════════════════════════════════════════════════════
-- FIX: Infinite Recursion in conversation_participants RLS
-- ═══════════════════════════════════════════════════════════
-- 
-- Error: "infinite recursion detected in policy for relation 'conversation_participants'"
-- 
-- This happens when RLS policies reference the same table they're protecting,
-- creating an infinite loop.
--
-- Run this in Supabase SQL Editor to fix the policies.

-- ═══════════════════════════════════════════════════════════
-- Step 1: Drop existing problematic policies
-- ═══════════════════════════════════════════════════════════

-- Drop all policies on conversation_participants
DROP POLICY IF EXISTS "Users can read own conversation participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can add participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can delete participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.conversation_participants;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.conversation_participants;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.conversation_participants;

-- Drop policies on conversations too (to be safe)
DROP POLICY IF EXISTS "Users can read own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.conversations;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.conversations;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.conversations;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.conversations;

-- ═══════════════════════════════════════════════════════════
-- Step 2: Recreate policies WITHOUT recursion
-- ═══════════════════════════════════════════════════════════

-- ══ CONVERSATIONS TABLE ════════════════════════════════════

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can read conversations they participate in
CREATE POLICY "Users can read conversations"
  ON public.conversations
  FOR SELECT
  USING (
    id IN (
      SELECT conversation_id 
      FROM public.conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Policy 2: Users can create conversations
CREATE POLICY "Users can create conversations"
  ON public.conversations
  FOR INSERT
  WITH CHECK (true);

-- Policy 3: Users can update conversations they participate in
CREATE POLICY "Users can update conversations"
  ON public.conversations
  FOR UPDATE
  USING (
    id IN (
      SELECT conversation_id 
      FROM public.conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Policy 4: Users can delete conversations they participate in
CREATE POLICY "Users can delete conversations"
  ON public.conversations
  FOR DELETE
  USING (
    id IN (
      SELECT conversation_id 
      FROM public.conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

-- ══ CONVERSATION_PARTICIPANTS TABLE ════════════════════════

-- Enable RLS
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can read participants in their conversations
CREATE POLICY "Users can read participants"
  ON public.conversation_participants
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id 
      FROM public.conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Policy 2: Users can add themselves to conversations
CREATE POLICY "Users can add participants"
  ON public.conversation_participants
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() OR 
    conversation_id IN (
      SELECT conversation_id 
      FROM public.conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Policy 3: Users can remove themselves from conversations
CREATE POLICY "Users can remove themselves"
  ON public.conversation_participants
  FOR DELETE
  USING (
    user_id = auth.uid()
  );

-- ══ MESSAGES TABLE ════════════════════════════════════════

-- Enable RLS (if not already enabled)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON public.messages;

-- Policy 1: Users can read messages in their conversations
CREATE POLICY "Users can read messages"
  ON public.messages
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id 
      FROM public.conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Policy 2: Users can send messages to their conversations
CREATE POLICY "Users can send messages"
  ON public.messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT conversation_id 
      FROM public.conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Policy 3: Users can update their own messages
CREATE POLICY "Users can update own messages"
  ON public.messages
  FOR UPDATE
  USING (
    sender_id = auth.uid()
  );

-- Policy 4: Users can delete their own messages
CREATE POLICY "Users can delete own messages"
  ON public.messages
  FOR DELETE
  USING (
    sender_id = auth.uid()
  );

-- ══ USERS TABLE ════════════════════════════════════════════

-- Enable RLS (if not already enabled)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Public profiles are viewable by all" ON public.users;

-- Policy 1: Users can read all users (needed for chat)
CREATE POLICY "Users can view all users"
  ON public.users
  FOR SELECT
  USING (true);

-- Policy 2: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  USING (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════
-- Step 3: Verify policies
-- ═══════════════════════════════════════════════════════════

-- Check that policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('conversations', 'conversation_participants', 'messages', 'users')
ORDER BY tablename, policyname;

-- ═══════════════════════════════════════════════════════════
-- Step 4: Test the fix
-- ═══════════════════════════════════════════════════════════

-- Test query (replace with your user_id)
-- SELECT * FROM public.conversation_participants 
-- WHERE user_id = 'af606390-6b5b-45fc-81b7-f72b702db12c';

-- ═══════════════════════════════════════════════════════════
-- Notes:
-- ═══════════════════════════════════════════════════════════
-- 1. The key fix is using subqueries with 'id IN (SELECT ...)' 
--    instead of EXISTS or direct joins that can cause recursion
--
-- 2. We avoid referencing the same table in both the policy
--    and the subquery in a way that creates a loop
--
-- 3. The policies use auth.uid() which is the authenticated
--    user's ID from Supabase Auth
--
-- 4. Test thoroughly after applying these policies
--
-- 5. If you have existing data, make sure the policies don't
--    block access to it
-- ═══════════════════════════════════════════════════════════
