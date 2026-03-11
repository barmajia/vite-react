-- Fix Conversations RLS Policies
-- This fixes the 400 error by updating RLS policies to match the actual schema

-- Drop the old policies that reference non-existent conversation_participants table
DROP POLICY IF EXISTS "conversations_view_own" ON "public"."conversations";
DROP POLICY IF EXISTS "conversations_insert_own" ON "public"."conversations";

-- Create new policies that work with user_id and seller_id columns
CREATE POLICY "conversations_select_own" ON "public"."conversations" 
  FOR SELECT 
  TO "authenticated" 
  USING (("user_id" = "auth"."uid"()) OR ("seller_id" = "auth"."uid"()));

CREATE POLICY "conversations_insert_own" ON "public"."conversations" 
  FOR INSERT 
  TO "authenticated" 
  WITH CHECK (("user_id" = "auth"."uid"()) OR ("seller_id" = "auth"."uid"()));

-- Also ensure messages table has correct policies
DROP POLICY IF EXISTS "messages_view_own" ON "public"."messages";
DROP POLICY IF EXISTS "messages_insert_own" ON "public"."messages";
DROP POLICY IF EXISTS "messages_update_own" ON "public"."messages";

-- Messages can be viewed by anyone in the conversation
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

-- Verify policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('conversations', 'messages')
ORDER BY tablename, policyname;
