-- =====================================================
-- Fix: Add Test Conversation (Updated for name column)
-- Run this in Supabase SQL Editor
-- =====================================================

-- Create a test conversation and add yourself
DO $$
DECLARE
  v_conv_id UUID;
BEGIN
  -- Create conversation WITH REQUIRED NAME
  INSERT INTO conversations (id, name, type, category, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    'Test Conversation',  -- ✅ Required: name column
    'direct',              -- conversation type
    'general',             -- category
    NOW(),
    NOW()
  )
  RETURNING id INTO v_conv_id;
  
  -- Add yourself as participant with role
  INSERT INTO conversation_participants (conversation_id, user_id, role, joined_at)
  VALUES (v_conv_id, auth.uid(), 'customer'::user_role, NOW());
  
  RAISE NOTICE 'Created test conversation: %', v_conv_id;
END $$;

-- Verify it worked
SELECT 
  c.id,
  c.name,
  c.type,
  c.category,
  cp.user_id,
  cp.role,
  u.email,
  u.account_type
FROM conversations c
JOIN conversation_participants cp ON c.id = cp.conversation_id
JOIN users u ON cp.user_id = u.user_id
WHERE cp.user_id = auth.uid();
