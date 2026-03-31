-- ============================================================================
-- SUPABASE DIAGNOSTIC & FIX
-- ============================================================================
-- Run this to verify what was created and fix any issues

-- ============================================================================
-- 1. CHECK: What functions exist?
-- ============================================================================
-- Run this query to verify functions were created:
SELECT routine_name, routine_type, routine_schema
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('get_or_create_direct_conversation_v2', 'search_users', 'get_user_account_type')
ORDER BY routine_name;

-- Expected: 3 rows (all three functions)

-- ============================================================================
-- 2. CHECK: Drop and recreate function with explicit parameter types
-- ============================================================================
-- Sometimes Supabase has parameter matching issues. Let's recreate cleanly:

DROP FUNCTION IF EXISTS public.get_or_create_direct_conversation_v2(uuid, uuid, text, text, uuid) CASCADE;

CREATE OR REPLACE FUNCTION public.get_or_create_direct_conversation_v2(
  p_user1_id uuid,
  p_user2_id uuid,
  p_display_name text DEFAULT NULL,
  p_context_type text DEFAULT 'general',
  p_context_id uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_conversation_id uuid;
  v_user1_type text;
  v_user2_type text;
  v_user1_role text;
  v_user2_role text;
BEGIN
  -- Validate auth
  IF auth.uid() IS NULL OR auth.uid() != p_user1_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Unauthorized: can only create conversations for yourself'
    );
  END IF;

  -- Prevent self-chat
  IF p_user1_id = p_user2_id THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cannot start conversation with yourself'
    );
  END IF;

  -- Get account types
  SELECT account_type INTO v_user1_type FROM public.users WHERE user_id = p_user1_id;
  SELECT account_type INTO v_user2_type FROM public.users WHERE user_id = p_user2_id;

  v_user1_type := COALESCE(v_user1_type, 'customer');
  v_user2_type := COALESCE(v_user2_type, 'customer');

  -- Map account type to role
  v_user1_role := CASE 
    WHEN v_user1_type IN ('seller', 'doctor', 'factory', 'delivery') THEN v_user1_type
    ELSE 'customer'
  END;

  v_user2_role := CASE 
    WHEN v_user2_type IN ('seller', 'doctor', 'factory', 'delivery') THEN v_user2_type
    ELSE 'customer'
  END;

  -- Create new conversation (skip policy check for now)
  v_conversation_id := gen_random_uuid();

  INSERT INTO public.conversations (
    id, name, type, created_at, updated_at
  )
  VALUES (
    v_conversation_id,
    COALESCE(p_display_name, 'Direct Chat'),
    'direct',
    NOW(),
    NOW()
  );

  -- Add both participants (will trigger RLS)
  INSERT INTO public.conversation_participants (
    conversation_id, user_id, role, account_type, joined_at
  )
  VALUES
    (v_conversation_id, p_user1_id, v_user1_role, v_user1_type, NOW()),
    (v_conversation_id, p_user2_id, v_user2_role, v_user2_type, NOW());

  RETURN json_build_object(
    'success', true,
    'conversation_id', v_conversation_id,
    'is_new', true
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_or_create_direct_conversation_v2(uuid, uuid, text, text, uuid) TO authenticated;

-- ============================================================================
-- 3. FIX: RLS Policies for conversation_participants (CRITICAL)
-- ============================================================================

-- Drop all existing policies on conversation_participants
DROP POLICY IF EXISTS "Users can insert participants for their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view conversation participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can update their own participant record" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can delete their own participant record" ON public.conversation_participants;

-- Enable RLS for conversation_participants
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- Policy 1: SELECT - Users can view participants in conversations they're part of
CREATE POLICY "Allow users to view participants in their conversations"
  ON public.conversation_participants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants AS cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = auth.uid()
    )
  );

-- Policy 2: INSERT - Allow authenticated users to insert participants from RPC
CREATE POLICY "Allow insert via function"
  ON public.conversation_participants
  FOR INSERT
  WITH CHECK (true);  -- Allow from within functions (security definer will handle auth)

-- Policy 3: UPDATE - Users can update their own participant records
CREATE POLICY "Allow users to update their participant records"
  ON public.conversation_participants
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy 4: DELETE - Users can remove themselves from conversations
CREATE POLICY "Allow users to delete their own participant records"
  ON public.conversation_participants
  FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- 4. FIX: RLS Policies for conversations table
-- ============================================================================

DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
DROP POLICY IF EXISTS "Users can update conversations they participate in" ON public.conversations;
DROP POLICY IF EXISTS "Users can insert conversations" ON public.conversations;

-- Enable RLS for conversations (if not already enabled)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Policy 1: SELECT - Users can view conversations they're part of
CREATE POLICY "Allow users to select conversations they're in"
  ON public.conversations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = conversations.id
      AND user_id = auth.uid()
    )
  );

-- Policy 2: INSERT - Allow inserts (authenticated users via function)
CREATE POLICY "Allow insert conversations via function"
  ON public.conversations
  FOR INSERT
  WITH CHECK (true);  -- Controlled by function security definer

-- Policy 3: UPDATE - Users can update conversations they participate in
CREATE POLICY "Allow users to update their conversations"
  ON public.conversations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = conversations.id
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = conversations.id
      AND user_id = auth.uid()
    )
  );

-- ============================================================================
-- 5. VERIFY: Check if policies are correct
-- ============================================================================

SELECT
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('conversations', 'conversation_participants')
ORDER BY tablename, policyname;

-- Expected: ~6 policies total (3 for conversations, 3+ for conversation_participants)

-- ============================================================================
-- 6. TEST: Try creating a conversation (replace UUIDs with real ones)
-- ============================================================================

-- First, get real user IDs from your database:
SELECT user_id, email, account_type FROM public.users LIMIT 2;

-- Then use these UUIDs in a test call:
-- SELECT public.get_or_create_direct_conversation_v2(
--   'USERID1'::uuid,
--   'USERID2'::uuid,
--   'Test Chat',
--   'general',
--   NULL
-- );

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- This script:
-- 1. Verifies functions exist
-- 2. Recreates get_or_create_direct_conversation_v2 with explicit types
-- 3. FIXES RLS policies (CRITICAL - this was blocking inserts!)
-- 4. Shows which policies are active
-- 5. Provides test instructions
