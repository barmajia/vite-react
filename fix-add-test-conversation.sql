-- =====================================================
-- Fix: Add Test Conversation for Current User
-- Run this in Supabase SQL Editor to see a conversation
-- =====================================================

-- 1. Create a test conversation
INSERT INTO conversations (id, product_id, created_at, updated_at, last_message, is_archived)
VALUES (
  gen_random_uuid(),
  NULL,
  NOW(),
  NOW(),
  'Welcome to your first conversation!',
  false
);

-- 2. Get the conversation ID (run this separately or use the result from above)
-- Copy the UUID from the result

-- 3. Add yourself as participant (replace {CONVERSATION_ID} with actual UUID from step 2)
-- Example: '550e8400-e29b-41d4-a716-446655440000'
DO $$
DECLARE
  v_conversation_id UUID;
  v_user_id UUID;
BEGIN
  -- Get the most recent conversation without participants
  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE id NOT IN (SELECT DISTINCT conversation_id FROM conversation_participants)
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Get current user ID
  v_user_id := auth.uid();
  
  -- Add user as participant
  IF v_conversation_id IS NOT NULL AND v_user_id IS NOT NULL THEN
    INSERT INTO conversation_participants (conversation_id, user_id, role, joined_at)
    VALUES (v_conversation_id, v_user_id, 'customer'::user_role, NOW());
    
    RAISE NOTICE 'Added participant to conversation: %', v_conversation_id;
  ELSE
    RAISE NOTICE 'No conversation found or user not authenticated';
  END IF;
END $$;

-- 4. Verify it worked
SELECT 
  cp.conversation_id,
  cp.user_id,
  cp.role,
  cp.joined_at,
  u.email,
  u.full_name,
  u.account_type
FROM conversation_participants cp
JOIN users u ON cp.user_id = u.user_id
WHERE cp.user_id = auth.uid()
ORDER BY cp.joined_at DESC;

-- 5. Check total counts
SELECT 
  'conversations' as table_name, 
  COUNT(*) as count 
FROM conversations
UNION ALL
SELECT 'conversation_participants', COUNT(*) FROM conversation_participants;
