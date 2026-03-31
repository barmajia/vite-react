-- =====================================================
-- Create Conversation (MINIMAL - Only ID column)
-- This should work with ANY conversations table schema
-- =====================================================

DO $$
DECLARE
  v_conversation_id uuid;
BEGIN
  -- Create conversation (ONLY id column - rest are auto-generated)
  INSERT INTO "public"."conversations" ("id")
  VALUES (gen_random_uuid())
  RETURNING "id" INTO v_conversation_id;

  -- Add BOTH users (role is required based on your error)
  INSERT INTO "public"."conversation_participants" 
    ("conversation_id", "user_id", "role")
  VALUES
    (v_conversation_id, 'eeb5c554-69c9-4dd0-b650-b59d4b1c9e56', 'customer'::user_role),
    (v_conversation_id, '29f93cc5-4df6-45c0-8d73-dedc5e0daead', 'seller'::user_role);

  RAISE NOTICE '✓ Created conversation: %', v_conversation_id;
END $$;

-- Verify it worked
SELECT 
  c.id,
  c.created_at,
  cp.user_id,
  cp.role,
  u.email
FROM conversations c
JOIN conversation_participants cp ON c.id = cp.conversation_id
LEFT JOIN public.users u ON cp.user_id = u.user_id
WHERE c.id = (SELECT id FROM conversations ORDER BY created_at DESC LIMIT 1);
