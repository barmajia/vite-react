-- =====================================================
-- COMPLETE MESSAGING SCHEMA MIGRATION
-- Run this in Supabase SQL Editor to fix messaging
-- =====================================================

-- Step 1: Add missing columns to conversations table
-- =====================================================

-- Add user_id column (the buyer/customer initiating conversation)
ALTER TABLE "public"."conversations" 
ADD COLUMN IF NOT EXISTS "user_id" "uuid";

-- Add seller_id column (the seller being contacted)
ALTER TABLE "public"."conversations" 
ADD COLUMN IF NOT EXISTS "seller_id" "uuid";

-- Add foreign key constraints
ALTER TABLE "public"."conversations"
ADD CONSTRAINT "conversations_user_id_fkey" 
FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE "public"."conversations"
ADD CONSTRAINT "conversations_seller_id_fkey" 
FOREIGN KEY ("seller_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS "idx_conversations_user_seller" 
ON "public"."conversations" ("user_id", "seller_id");

-- Step 2: Ensure messages table has correct structure
-- =====================================================

-- Make sure messages table exists with correct columns
CREATE TABLE IF NOT EXISTS "public"."messages" (
  "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
  "conversation_id" "uuid" NOT NULL,
  "sender_id" "uuid" NOT NULL,
  "content" "text" NOT NULL,
  "is_read" "boolean" DEFAULT false,
  "created_at" "timestamp with time zone" DEFAULT "now"(),
  CONSTRAINT "messages_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "messages_conversation_id_fkey" 
    FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE,
  CONSTRAINT "messages_sender_id_fkey" 
    FOREIGN KEY ("sender_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE
);

-- Create index on messages for faster lookups
CREATE INDEX IF NOT EXISTS "idx_messages_conversation" 
ON "public"."messages" ("conversation_id", "created_at");

-- Step 3: Update RLS policies
-- =====================================================

-- Enable RLS on both tables
ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "conversations_view_own" ON "public"."conversations";
DROP POLICY IF EXISTS "conversations_insert_own" ON "public"."conversations";
DROP POLICY IF EXISTS "conversations_select_own" ON "public"."conversations";
DROP POLICY IF EXISTS "conversations_update_own" ON "public"."conversations";
DROP POLICY IF EXISTS "messages_view_own" ON "public"."messages";
DROP POLICY IF EXISTS "messages_insert_own" ON "public"."messages";
DROP POLICY IF EXISTS "messages_update_own" ON "public"."messages";
DROP POLICY IF EXISTS "messages_select_own" ON "public"."messages";

-- Conversations: Users can view if they are either buyer or seller
CREATE POLICY "conversations_select_own" ON "public"."conversations" 
  FOR SELECT 
  TO "authenticated" 
  USING (
    ("user_id" = "auth"."uid"()) OR 
    ("seller_id" = "auth"."uid"())
  );

-- Conversations: Users can create conversations
CREATE POLICY "conversations_insert_own" ON "public"."conversations" 
  FOR INSERT 
  TO "authenticated" 
  WITH CHECK (
    ("user_id" = "auth"."uid"()) OR 
    ("seller_id" = "auth"."uid"())
  );

-- Conversations: Allow updates (for last_message, last_message_at)
CREATE POLICY "conversations_update_own" ON "public"."conversations" 
  FOR UPDATE 
  TO "authenticated" 
  USING (
    ("user_id" = "auth"."uid"()) OR 
    ("seller_id" = "auth"."uid"())
  )
  WITH CHECK (
    ("user_id" = "auth"."uid"()) OR 
    ("seller_id" = "auth"."uid"())
  );

-- Messages: Users can view messages in their conversations
CREATE POLICY "messages_select_own" ON "public"."messages" 
  FOR SELECT 
  TO "authenticated" 
  USING (
    "conversation_id" IN (
      SELECT "id" FROM "public"."conversations" 
      WHERE ("user_id" = "auth"."uid"()) OR ("seller_id" = "auth"."uid"())
    )
  );

-- Messages: Users can send messages (sender_id must match auth user)
CREATE POLICY "messages_insert_own" ON "public"."messages" 
  FOR INSERT 
  TO "authenticated" 
  WITH CHECK (
    "conversation_id" IN (
      SELECT "id" FROM "public"."conversations" 
      WHERE ("user_id" = "auth"."uid"()) OR ("seller_id" = "auth"."uid"())
    )
    AND "sender_id" = "auth"."uid"()
  );

-- Messages: Users can update their own messages (mark as read)
CREATE POLICY "messages_update_own" ON "public"."messages" 
  FOR UPDATE 
  TO "authenticated" 
  USING (
    "conversation_id" IN (
      SELECT "id" FROM "public"."conversations" 
      WHERE ("user_id" = "auth"."uid"()) OR ("seller_id" = "auth"."uid"())
    )
  )
  WITH CHECK (
    "conversation_id" IN (
      SELECT "id" FROM "public"."conversations" 
      WHERE ("user_id" = "auth"."uid"()) OR ("seller_id" = "auth"."uid"())
    )
  );

-- Step 4: Create helper function to get conversation for product
-- =====================================================

CREATE OR REPLACE FUNCTION "public"."get_or_create_conversation"(
  "p_seller_id" "uuid",
  "p_product_id" "uuid" DEFAULT NULL::"uuid"
) RETURNS "uuid"
LANGUAGE "plpgsql"
SECURITY DEFINER
AS $$
DECLARE
  v_conversation_id "uuid";
  v_user_id "uuid";
BEGIN
  -- Get current user ID
  v_user_id := "auth"."uid"();
  
  -- Check if conversation already exists
  SELECT "id" INTO v_conversation_id
  FROM "public"."conversations"
  WHERE "user_id" = v_user_id 
    AND "seller_id" = p_seller_id
    AND ("product_id" = p_product_id OR "product_id" IS NULL)
  LIMIT 1;
  
  -- If no conversation exists, create one
  IF v_conversation_id IS NULL THEN
    INSERT INTO "public"."conversations" ("user_id", "seller_id", "product_id")
    VALUES (v_user_id, p_seller_id, p_product_id)
    RETURNING "id" INTO v_conversation_id;
  END IF;
  
  RETURN v_conversation_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION "public"."get_or_create_conversation"("uuid", "uuid") 
TO "authenticated";

-- Step 5: Verify the migration
-- =====================================================

-- Show conversations table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'conversations'
ORDER BY ordinal_position;

-- Show messages table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'messages'
ORDER BY ordinal_position;

-- Show all policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('conversations', 'messages')
ORDER BY tablename, policyname;

-- Show function exists
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'get_or_create_conversation';
