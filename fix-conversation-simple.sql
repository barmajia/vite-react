-- =====================================================
-- Fix: Add Test Conversation (Simple Version)
-- Run this in Supabase SQL Editor
-- =====================================================

-- Create a test conversation (only columns that exist in your schema)
DO $$
DECLARE
  v_conv_id UUID;
BEGIN
  -- Create conversation with minimal required fields
  INSERT INTO conversations (id, name, type, category, created_at, updated_at, is_archived)
  VALUES (
    gen_random_uuid(),
    'Test Chat',        -- name (required by your schema)
    'direct',           -- type
    'general',          -- category
    NOW(),
    NOW(),
    false
  )
  RETURNING id INTO v_conv_id;
  
  -- Add yourself as participant
  INSERT INTO conversation_participants (conversation_id, user_id, role, joined_at)
  VALUES (v_conv_id, auth.uid(), 'customer'::user_role, NOW());
  
  RAISE NOTICE '✓ Created test conversation: %', v_conv_id;
END $$;

-- Verify
SELECT 
  '✓ Success! Your conversations:' as info
UNION ALL
SELECT 
  'ID: ' || c.id || ' | Name: ' || c.name || ' | Participants: ' || COUNT(cp.user_id)
FROM conversations c
JOIN conversation_participants cp ON c.id = cp.conversation_id
WHERE cp.user_id = auth.uid()
GROUP BY c.id, c.name;
