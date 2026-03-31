-- =====================================================
-- Chat System RPC Functions Migration
-- Adds missing RPC functions for StartNewChat component
-- =====================================================

-- 1. Search users for chat (RLS-safe)
CREATE OR REPLACE FUNCTION public.search_users_for_chat(
  p_query TEXT,
  p_current_user_id UUID
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  account_type TEXT
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO public, pg_catalog
AS $$
BEGIN
  -- Security check: ensure user is authenticated
  IF auth.uid() IS NULL OR auth.uid() != p_current_user_id THEN
    RAISE EXCEPTION 'Access denied: authentication required';
  END IF;

  RETURN QUERY
  SELECT 
    u.id,
    u.user_id,
    u.email,
    u.full_name,
    u.avatar_url,
    u.account_type
  FROM public.users u
  WHERE 
    u.user_id != p_current_user_id  -- Exclude current user
    AND (
      u.full_name ILIKE '%' || p_query || '%' 
      OR u.email ILIKE '%' || p_query || '%'
    )
  ORDER BY 
    CASE WHEN u.full_name ILIKE p_query || '%' THEN 0 ELSE 1 END,
    u.full_name
  LIMIT 50;
END;
$$;

COMMENT ON FUNCTION public.search_users_for_chat IS 'Search users by name or email for starting new chats. Excludes current user.';

-- 2. Get or create direct conversation (atomic operation)
CREATE OR REPLACE FUNCTION public.get_or_create_direct_conversation(
  p_user1_id UUID,
  p_user2_id UUID,
  p_display_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO public, pg_catalog
AS $$
DECLARE
  v_conversation_id UUID;
  v_user1_role public.user_role;
  v_user2_role public.user_role;
  v_user1_account_type TEXT;
  v_user2_account_type TEXT;
  
BEGIN
  -- Security check
  IF auth.uid() IS NULL OR auth.uid() != p_user1_id THEN
    RAISE EXCEPTION 'Access denied: can only create conversations for yourself';
  END IF;

  -- Prevent self-chat
  IF p_user1_id = p_user2_id THEN
    RAISE EXCEPTION 'Cannot start conversation with yourself';
  END IF;

  -- Get user account types
  SELECT u.account_type
    INTO v_user1_account_type
    FROM public.users u
   WHERE u.user_id = p_user1_id;

  SELECT u.account_type
    INTO v_user2_account_type
    FROM public.users u
   WHERE u.user_id = p_user2_id;

  -- Map account types to user roles
  v_user1_role := (
    CASE LOWER(v_user1_account_type)
      WHEN 'user' THEN 'customer'
      WHEN 'customer' THEN 'customer'
      WHEN 'patient' THEN 'customer'
      WHEN 'seller' THEN 'seller'
      WHEN 'factory' THEN 'factory'
      WHEN 'middleman' THEN 'middleman'
      WHEN 'broker' THEN 'middleman'
      WHEN 'delivery' THEN 'delivery'
      WHEN 'delivery_driver' THEN 'delivery'
      WHEN 'freelancer' THEN 'seller'
      WHEN 'service_provider' THEN 'seller'
      WHEN 'doctor' THEN 'seller'
      WHEN 'pharmacy' THEN 'seller'
      WHEN 'admin' THEN 'seller'
      ELSE 'customer'
    END
  )::public.user_role;

  v_user2_role := (
    CASE LOWER(v_user2_account_type)
      WHEN 'user' THEN 'customer'
      WHEN 'customer' THEN 'customer'
      WHEN 'patient' THEN 'customer'
      WHEN 'seller' THEN 'seller'
      WHEN 'factory' THEN 'factory'
      WHEN 'middleman' THEN 'middleman'
      WHEN 'broker' THEN 'middleman'
      WHEN 'delivery' THEN 'delivery'
      WHEN 'delivery_driver' THEN 'delivery'
      WHEN 'freelancer' THEN 'seller'
      WHEN 'service_provider' THEN 'seller'
      WHEN 'doctor' THEN 'seller'
      WHEN 'pharmacy' THEN 'seller'
      WHEN 'admin' THEN 'seller'
      ELSE 'customer'
    END
  )::public.user_role;

  -- Validate conversation is allowed based on roles
  IF NOT public.can_start_conversation(p_user1_id, p_user2_id, NULL) THEN
    RAISE EXCEPTION 'Conversation not allowed between these user types';
  END IF;

  -- Try to find existing direct conversation (no product_id)
  SELECT c.id
    INTO v_conversation_id
    FROM public.conversations c
    JOIN public.conversation_participants cp1 ON c.id = cp1.conversation_id
    JOIN public.conversation_participants cp2 ON c.id = cp2.conversation_id
   WHERE
    c.product_id IS NULL  -- Direct conversation (not product-related)
    AND cp1.user_id = p_user1_id
    AND cp2.user_id = p_user2_id
   ORDER BY c.created_at ASC
   LIMIT 1;

  IF v_conversation_id IS NOT NULL THEN
    RETURN v_conversation_id;
  END IF;

  -- Create new conversation
  v_conversation_id := gen_random_uuid();

  INSERT INTO public.conversations (id, product_id, created_at, updated_at)
  VALUES (v_conversation_id, NULL, NOW(), NOW());

  INSERT INTO public.conversation_participants (conversation_id, user_id, role, joined_at)
  VALUES
    (v_conversation_id, p_user1_id, v_user1_role, NOW()),
    (v_conversation_id, p_user2_id, v_user2_role, NOW());

  RETURN v_conversation_id;
END;
$$;

COMMENT ON FUNCTION public.get_or_create_direct_conversation IS 'Get existing or create new direct conversation between two users. Validates user roles and permissions.';

-- 3. Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.search_users_for_chat TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_direct_conversation TO authenticated;

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_search 
ON public.users USING gin (full_name gin_trgm_ops, email gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_user 
ON public.conversation_participants(user_id);

CREATE INDEX IF NOT EXISTS idx_conversations_product_null 
ON public.conversations(created_at DESC) 
WHERE product_id IS NULL;

COMMENT ON INDEX idx_users_search IS 'Trigram index for fast user search by name/email';
COMMENT ON INDEX idx_conversation_participants_user IS 'Index for finding user conversations';
COMMENT ON INDEX idx_conversations_product_null IS 'Partial index for direct conversations';
