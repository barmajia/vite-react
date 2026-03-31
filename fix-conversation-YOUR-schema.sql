-- =====================================================
-- Fix: Add Test Conversation (CORRECTED for YOUR schema)
-- Based on your actual conversations table structure
-- =====================================================

-- Your schema has: id, product_id, created_at, updated_at, last_message, last_message_at, is_archived
-- NO name, type, or category columns!

-- Create a test conversation
DO $$
DECLARE
  v_conv_id UUID;
BEGIN
  -- Create conversation with YOUR actual columns
  INSERT INTO conversations (id, product_id, created_at, updated_at, is_archived)
  VALUES (
    gen_random_uuid(),
    NULL,              -- product_id (NULL = direct chat)
    NOW(),             -- created_at
    NOW(),             -- updated_at
    false              -- is_archived
  )
  RETURNING id INTO v_conv_id;
  
  -- Add yourself as participant
  INSERT INTO conversation_participants (conversation_id, user_id, role, joined_at)
  VALUES (v_conv_id, auth.uid(), 'customer'::user_role, NOW());
  
  RAISE NOTICE '✓ Created test conversation: %', v_conv_id;
END $$;

-- Verify it worked
SELECT 
  c.id,
  c.product_id,
  c.created_at,
  cp.user_id,
  cp.role,
  u.email,
  u.account_type
FROM conversations c
JOIN conversation_participants cp ON c.id = cp.conversation_id
JOIN users u ON cp.user_id = u.user_id
WHERE cp.user_id = auth.uid();
