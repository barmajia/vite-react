-- Add preference columns to public.users
ALTER TABLE "public"."users" 
ADD COLUMN IF NOT EXISTS "preferred_language" text DEFAULT 'en',
ADD COLUMN IF NOT EXISTS "preferred_currency" text DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS "theme_preference" text DEFAULT 'system',
ADD COLUMN IF NOT EXISTS "sidebar_state" text DEFAULT 'expanded';

-- Add check constraints for valid values
ALTER TABLE "public"."users" 
ADD CONSTRAINT "check_theme_preference" CHECK ("theme_preference" IN ('light', 'dark', 'system')),
ADD CONSTRAINT "check_sidebar_state" CHECK ("sidebar_state" IN ('expanded', 'collapsed'));

-- Ensure RLS allows users to update their own preferences
CREATE POLICY "users_update_own_preferences" ON "public"."users" 
FOR UPDATE TO "authenticated" 
USING ("auth"."uid"() = "user_id") 
WITH CHECK ("auth"."uid"() = "user_id");

-- Create index for faster preference lookups
CREATE INDEX IF NOT EXISTS idx_users_preferences ON "public"."users" ("user_id", "preferred_language", "theme_preference");
