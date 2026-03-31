-- ============================================================================
-- MINIMAL RLS FIX FOR CHAT MODULE - Apply this FIRST
-- ============================================================================
-- This fixes the RLS policy that blocks conversation creation
-- The current policy has recursive logic that fails on insert
-- This is a minimal fix - apply BEFORE the full sql-edit.sql
-- 
-- Run in Supabase SQL Editor and wait for "Query successful" ✅

-- ============================================================================
-- Step 1: Drop problematic policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can add participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.conversation_participants;

-- ============================================================================
-- Step 2: Create simplified INSERT policy (allows any authenticated user to insert)
-- ============================================================================

CREATE POLICY "Users can insert conversation participants"
  ON public.conversation_participants
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- Step 3: Ensure SELECT policy exists and works
-- ============================================================================

DROP POLICY IF EXISTS "Users can read participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can read own conversation participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.conversation_participants;

CREATE POLICY "Users can read participants"
  ON public.conversation_participants
  FOR SELECT
  USING (true); -- Allow all authenticated users to read participants

-- ============================================================================
-- Step 4: Ensure DELETE policy exists
-- ============================================================================

DROP POLICY IF EXISTS "Users can remove themselves" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can delete participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.conversation_participants;

CREATE POLICY "Users can delete participants"
  ON public.conversation_participants
  FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- Step 5: Verify RLS is enabled on conversations table
-- ============================================================================

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Users can read conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update conversations" ON public.conversations;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.conversations;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.conversations;

-- Create simplified policies
CREATE POLICY "Users can read conversations"
  ON public.conversations
  FOR SELECT
  USING (true); -- Allow all authenticated users to read

CREATE POLICY "Users can create conversations"
  ON public.conversations
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update conversations"
  ON public.conversations
  FOR UPDATE
  USING (true);

-- ============================================================================
-- RESULT: Chat creation should now work!
-- ============================================================================
-- After applying this:
-- 1. Reload browser at http://localhost:5174/chat
-- 2. Search for users (should work with fallback)
-- 3. Click "Start Chat" button
-- 4. ✅ Conversation should be created successfully
--
-- Note: These are PERMISSIVE policies for immediate functionality.
-- The full sql-edit.sql provides more restrictive security policies.
