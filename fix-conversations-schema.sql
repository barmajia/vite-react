-- Fix Conversations Table Schema
-- Add missing user_id and seller_id columns to conversations table

-- Add user_id column (the buyer/customer)
ALTER TABLE "public"."conversations" 
ADD COLUMN IF NOT EXISTS "user_id" "uuid";

-- Add seller_id column
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

-- Update RLS policies
DROP POLICY IF EXISTS "conversations_view_own" ON "public"."conversations";
DROP POLICY IF EXISTS "conversations_insert_own" ON "public"."conversations";
DROP POLICY IF EXISTS "conversations_select_own" ON "public"."conversations";

-- Allow users to view conversations where they are either the buyer or seller
CREATE POLICY "conversations_select_own" ON "public"."conversations" 
  FOR SELECT 
  TO "authenticated" 
  USING (("user_id" = "auth"."uid"()) OR ("seller_id" = "auth"."uid"()));

-- Allow users to create conversations
CREATE POLICY "conversations_insert_own" ON "public"."conversations" 
  FOR INSERT 
  TO "authenticated" 
  WITH CHECK (("user_id" = "auth"."uid"()) OR ("seller_id" = "auth"."uid"()));

-- Update messages table policies
DROP POLICY IF EXISTS "messages_select_own" ON "public"."messages";
DROP POLICY IF EXISTS "messages_insert_own" ON "public"."messages";
DROP POLICY IF EXISTS "messages_update_own" ON "public"."messages";

CREATE POLICY "messages_select_own" ON "public"."messages" 
  FOR SELECT 
  TO "authenticated" 
  USING ((
    "conversation_id" IN (
      SELECT "id" FROM "public"."conversations" 
      WHERE ("user_id" = "auth"."uid"()) OR ("seller_id" = "auth"."uid"())
    )
  ));

CREATE POLICY "messages_insert_own" ON "public"."messages" 
  FOR INSERT 
  TO "authenticated" 
  WITH CHECK ((
    "conversation_id" IN (
      SELECT "id" FROM "public"."conversations" 
      WHERE ("user_id" = "auth"."uid"()) OR ("seller_id" = "auth"."uid"())
    )
    AND "sender_id" = "auth"."uid"()
  ));

CREATE POLICY "messages_update_own" ON "public"."messages" 
  FOR UPDATE 
  TO "authenticated" 
  USING (("sender_id" = "auth"."uid"())) 
  WITH CHECK (("sender_id" = "auth"."uid"()));

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'conversations'
ORDER BY ordinal_position;

-- Show policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('conversations', 'messages')
ORDER BY tablename, policyname;
