-- =====================================================
-- Check Existing Users & Create Test Conversation
-- =====================================================

-- 1. Check all users in auth.users
SELECT 
  id,
  email,
  raw_user_meta_data,
  created_at
FROM auth.users
ORDER BY created_at DESC;

-- 2. Check if users exist in public.users
SELECT 
  u.id,
  u.user_id,
  u.email,
  u.account_type,
  au.email as auth_email
FROM public.users u
LEFT JOIN auth.users au ON u.user_id = au.id
ORDER BY u.created_at DESC;

-- 3. Create a conversation between two users
-- Replace these with your actual user IDs from step 1
DO $$
DECLARE
  v_conv_id UUID;
  v_user1_id UUID := 'FIRST-USER-ID-HERE';   -- Replace with first user ID
  v_user2_id UUID := 'SECOND-USER-ID-HERE';  -- Replace with second user ID
BEGIN
  -- Check if conversation already exists
  SELECT c.id INTO v_conv_id
  FROM conversations c
  JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
  JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
  WHERE cp1.user_id = v_user1_id
    AND cp2.user_id = v_user2_id;
  
  IF v_conv_id IS NULL THEN
    -- Create new conversation
    INSERT INTO conversations (id, product_id, created_at, updated_at, is_archived)
    VALUES (gen_random_uuid(), NULL, NOW(), NOW(), false)
    RETURNING id INTO v_conv_id;
    
    -- Add both users as participants
    INSERT INTO conversation_participants (conversation_id, user_id, role, joined_at)
    VALUES 
      (v_conv_id, v_user1_id, 'customer'::user_role, NOW()),
      (v_conv_id, v_user2_id, 'seller'::user_role, NOW());
    
    RAISE NOTICE '✓ Created conversation: %', v_conv_id;
  ELSE
    RAISE NOTICE '✓ Conversation already exists: %', v_conv_id;
  END IF;
END $$;

-- 4. Verify conversations
SELECT 
  c.id,
  c.created_at,
  cp.user_id,
  cp.role,
  u.email,
  u.account_type
FROM conversations c
JOIN conversation_participants cp ON c.id = cp.conversation_id
LEFT JOIN public.users u ON cp.user_id = u.user_id
ORDER BY c.created_at DESC;
