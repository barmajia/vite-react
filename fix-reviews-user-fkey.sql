-- Fix reviews table to reference public.users instead of auth.users
-- This allows proper joining in Supabase queries

-- Drop the old foreign key constraint
ALTER TABLE "public"."reviews" 
DROP CONSTRAINT IF EXISTS "reviews_user_id_fkey";

-- Add new foreign key to public.users(user_id)
ALTER TABLE "public"."reviews"
ADD CONSTRAINT "reviews_user_id_fkey" 
FOREIGN KEY ("user_id") 
REFERENCES "public"."users"("user_id") 
ON DELETE CASCADE;
