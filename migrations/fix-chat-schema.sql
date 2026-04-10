-- ═══════════════════════════════════════════════════════════════════════
-- MIGRATION: Chat System Schema Updates
-- Fixes for StartNewChat component compatibility
-- ═══════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────
-- 1. Extend conversations table for direct/group messaging
-- ───────────────────────────────────────────────────────────────────────

-- Add columns for conversation types (direct, group, product)
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS conversation_type text DEFAULT 'product' 
  CHECK (conversation_type IN ('product', 'direct', 'group')),
ADD COLUMN IF NOT EXISTS display_name text,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Add indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_conversations_type ON public.conversations(conversation_type);
CREATE INDEX IF NOT EXISTS idx_conversations_display_name ON public.conversations(display_name);

-- Add comment for documentation
COMMENT ON COLUMN public.conversations.conversation_type IS 'Type of conversation: product (legacy), direct (1-on-1), group';
COMMENT ON COLUMN public.conversations.display_name IS 'Display name for direct/group chats';
COMMENT ON COLUMN public.conversations.metadata IS 'Flexible metadata storage (e.g., {last_message_preview: "...", participant_count: 2})';


-- ───────────────────────────────────────────────────────────────────────
-- 2. Expand conversation_participants role options
-- ───────────────────────────────────────────────────────────────────────

-- Drop old constraint
ALTER TABLE public.conversation_participants 
DROP CONSTRAINT IF EXISTS conversation_participants_role_check;

-- Add new constraint with all account types
ALTER TABLE public.conversation_participants 
ADD CONSTRAINT conversation_participants_role_check 
CHECK (role IN (
  'customer', 
  'seller', 
  'factory', 
  'middleman', 
  'delivery', 
  'freelancer', 
  'doctor', 
  'pharmacy', 
  'admin',
  'patient',
  'service_provider',
  'delivery_driver'
));

-- Add index for role-based queries
CREATE INDEX IF NOT EXISTS idx_participants_role ON public.conversation_participants(role);


-- ───────────────────────────────────────────────────────────────────────
-- 3. Create RPC function: Search users for chat (RLS-safe)
-- ───────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.search_users_for_chat(
  p_query text, 
  p_current_user_id uuid
)
RETURNS TABLE(
  id uuid,
  user_id uuid, 
  email text, 
  full_name text, 
  avatar_url text, 
  account_type text
)
LANGUAGE plpgsql SECURITY DEFINER
  SET search_path TO public, pg_catalog;
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.user_id,
    u.email,
    u.full_name,
    u.avatar_url,
    u.account_type
  FROM public.users u
  WHERE u.user_id != p_current_user_id
  AND (
    u.full_name ILIKE '%' || p_query || '%' 
    OR u.email ILIKE '%' || p_query || '%'
  )
  LIMIT 10;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.search_users_for_chat TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.search_users_for_chat IS 'Search users by name/email for chat (excludes current user, RLS-safe)';


-- ───────────────────────────────────────────────────────────────────────
-- 4. Create RPC function: Get or create direct conversation (atomic)
-- ───────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_or_create_direct_conversation(
  p_user1_id uuid, 
  p_user2_id uuid,
  p_display_name text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
  SET search_path TO public, pg_catalog;
AS $$
DECLARE
  v_conversation_id uuid;
  v_user1_role text;
  v_user2_role text;
BEGIN
  -- Try to find existing direct conversation
  SELECT c.id INTO v_conversation_id
  FROM conversations c
  JOIN conversation_participants cp1 ON cp1.conversation_id = c.id AND cp1.user_id = p_user1_id
  JOIN conversation_participants cp2 ON cp2.conversation_id = c.id AND cp2.user_id = p_user2_id
  WHERE c.conversation_type = 'direct'
  LIMIT 1;
  
  -- Create new if not found
  IF v_conversation_id IS NULL THEN
    -- Determine roles based on account types
    SELECT 
      CASE 
        WHEN account_type IN ('seller', 'factory', 'middleman', 'delivery', 'freelancer', 'doctor', 'pharmacy', 'admin', 'service_provider', 'delivery_driver') 
        THEN 'seller' 
        ELSE 'customer' 
      END
    INTO v_user1_role
    FROM users
    WHERE user_id = p_user1_id;
    
    SELECT 
      CASE 
        WHEN account_type IN ('seller', 'factory', 'middleman', 'delivery', 'freelancer', 'doctor', 'pharmacy', 'admin', 'service_provider', 'delivery_driver') 
        THEN 'seller' 
        ELSE 'customer' 
      END
    INTO v_user2_role
    FROM users
    WHERE user_id = p_user2_id;
    
    -- Default to 'customer' if not found
    v_user1_role := COALESCE(v_user1_role, 'customer');
    v_user2_role := COALESCE(v_user2_role, 'customer');
    
    -- Create conversation
    INSERT INTO conversations (conversation_type, display_name)
    VALUES ('direct', COALESCE(p_display_name, 'Direct Message'))
    RETURNING id INTO v_conversation_id;
    
    -- Add participants
    INSERT INTO conversation_participants (conversation_id, user_id, role)
    VALUES 
      (v_conversation_id, p_user1_id, v_user1_role),
      (v_conversation_id, p_user2_id, v_user2_role);
  END IF;
  
  RETURN v_conversation_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_or_create_direct_conversation TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.get_or_create_direct_conversation IS 'Atomically get existing or create new direct conversation between two users';


-- ───────────────────────────────────────────────────────────────────────
-- 5. Add RLS policies for new columns
-- ───────────────────────────────────────────────────────────────────────

-- Allow users to view conversations they participate in
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
CREATE POLICY "Users can view own conversations"
  ON public.conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversations.id
      AND cp.user_id = auth.uid()
    )
  );

-- Allow users to insert conversations they create
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
CREATE POLICY "Users can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to update their own conversations
DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;
CREATE POLICY "Users can update own conversations"
  ON public.conversations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversations.id
      AND cp.user_id = auth.uid()
    )
  );


-- ───────────────────────────────────────────────────────────────────────
-- 6. Verification queries
-- ───────────────────────────────────────────────────────────────────────

-- Check new columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'conversations'
AND column_name IN ('conversation_type', 'display_name', 'metadata')
ORDER BY ordinal_position;

-- Check new policies exist
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'conversations'
ORDER BY policyname;

-- Check functions exist
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('search_users_for_chat', 'get_or_create_direct_conversation');

-- ═══════════════════════════════════════════════════════════════════════
-- END OF MIGRATION
-- ═══════════════════════════════════════════════════════════════════════
