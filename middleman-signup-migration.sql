-- ============================================================
-- MIDDLEMAN SIGNUP & ONBOARDING MIGRATION
-- Aurora E-commerce Platform
-- ============================================================
-- This migration adds all required columns for middleman signup
-- and sets up automatic profile creation on signup.
-- ============================================================

-- STEP 1: Add preference columns to users table
-- ============================================================
ALTER TABLE "public"."users" 
ADD COLUMN IF NOT EXISTS "preferred_language" text DEFAULT 'en',
ADD COLUMN IF NOT EXISTS "preferred_currency" text DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS "theme_preference" text DEFAULT 'system',
ADD COLUMN IF NOT EXISTS "sidebar_state" text DEFAULT 'expanded';

-- Add constraints for theme preference
ALTER TABLE "public"."users" 
ADD CONSTRAINT "check_theme_preference" CHECK ("theme_preference" IN ('light', 'dark', 'system')),
ADD CONSTRAINT "check_sidebar_state" CHECK ("sidebar_state" IN ('expanded', 'collapsed'));

-- STEP 2: Add middleman-specific columns to business_profiles
-- ============================================================
ALTER TABLE "public"."business_profiles" 
ADD COLUMN IF NOT EXISTS "specialization" text,
ADD COLUMN IF NOT EXISTS "website_url" text,
ADD COLUMN IF NOT EXISTS "description" text,
ADD COLUMN IF NOT EXISTS "business_license_url" text,
ADD COLUMN IF NOT EXISTS "tax_id" text,
ADD COLUMN IF NOT EXISTS "commission_rate" numeric DEFAULT 5;

-- STEP 3: Add middleman-specific columns to middleman_profiles
-- ============================================================
ALTER TABLE "public"."middleman_profiles" 
ADD COLUMN IF NOT EXISTS "specialization" text,
ADD COLUMN IF NOT EXISTS "website_url" text,
ADD COLUMN IF NOT EXISTS "description" text,
ADD COLUMN IF NOT EXISTS "business_license_url" text,
ADD COLUMN IF NOT EXISTS "tax_id" text,
ADD COLUMN IF NOT EXISTS "years_of_experience" integer,
ADD COLUMN IF NOT EXISTS "industries_served" jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS "commission_rate" numeric DEFAULT 5;

-- STEP 4: Create storage bucket for business licenses (if not exists)
-- ============================================================
-- Run this in Supabase Dashboard > Storage
-- Or via SQL:
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('documents', 'documents', true)
-- ON CONFLICT (id) DO NOTHING;

-- STEP 5: RLS Policies for middleman profiles
-- ============================================================

-- Middlemen can manage their own profile
DROP POLICY IF EXISTS "middlemen_manage_own_profile" ON "public"."middleman_profiles";
CREATE POLICY "middlemen_manage_own_profile" ON "public"."middleman_profiles" 
FOR ALL TO "authenticated" 
USING ("user_id" = "auth"."uid"()) 
WITH CHECK ("user_id" = "auth"."uid"());

-- Middlemen can manage their business profile
DROP POLICY IF EXISTS "middlemen_manage_business_profile" ON "public"."business_profiles";
CREATE POLICY "middlemen_manage_business_profile" ON "public"."business_profiles" 
FOR ALL TO "authenticated" 
USING ("user_id" = "auth"."uid"() AND "role" = 'middleman') 
WITH CHECK ("user_id" = "auth"."uid"() AND "role" = 'middleman');

-- Users can update their own preferences
DROP POLICY IF EXISTS "users_update_own_preferences" ON "public"."users";
CREATE POLICY "users_update_own_preferences" ON "public"."users" 
FOR UPDATE TO "authenticated" 
USING ("user_id" = "auth"."uid"()) 
WITH CHECK ("user_id" = "auth"."uid"());

-- Public can view verified middleman profiles
DROP POLICY IF EXISTS "public_view_verified_middlemen" ON "public"."middleman_profiles";
CREATE POLICY "public_view_verified_middlemen" ON "public"."middleman_profiles" 
FOR SELECT TO "authenticated" 
USING ("is_verified" = true OR "user_id" = "auth"."uid"());

-- STEP 6: Storage Policies for document uploads
-- ============================================================

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to upload business licenses
DROP POLICY IF EXISTS "upload_business_licenses" ON storage.objects;
CREATE POLICY "upload_business_licenses" ON storage.objects 
FOR INSERT TO "authenticated" 
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = 'business-licenses' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Allow public to view business licenses
DROP POLICY IF EXISTS "view_business_licenses" ON storage.objects;
CREATE POLICY "view_business_licenses" ON storage.objects 
FOR SELECT TO "public" 
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = 'business-licenses'
);

-- STEP 7: Function to auto-create profiles on middleman signup
-- ============================================================
CREATE OR REPLACE FUNCTION "public"."handle_middleman_signup"() 
RETURNS "trigger" 
LANGUAGE "plpgsql" 
SECURITY DEFINER 
  SET search_path TO public, pg_catalog;
AS $$
BEGIN
  -- Check if account_type is middleman
  IF NEW.raw_user_meta_data->>'account_type' = 'middleman' THEN
    -- Insert into business_profiles
    INSERT INTO public.business_profiles (
      user_id,
      role,
      company_name,
      location,
      currency,
      commission_rate,
      is_verified,
      business_license_url,
      tax_id
    ) VALUES (
      NEW.id,
      'middleman',
      COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'location', ''),
      COALESCE(NEW.raw_user_meta_data->>'currency', 'USD'),
      COALESCE((NEW.raw_user_meta_data->>'commission_rate')::numeric, 5),
      false,
      NEW.raw_user_meta_data->>'business_license_url',
      NEW.raw_user_meta_data->>'tax_id'
    );
    
    -- Insert into middleman_profiles
    INSERT INTO public.middleman_profiles (
      user_id,
      company_name,
      location,
      currency,
      commission_rate,
      is_verified,
      business_license_url,
      tax_id,
      years_of_experience,
      industries_served
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'location', ''),
      COALESCE(NEW.raw_user_meta_data->>'currency', 'USD'),
      COALESCE((NEW.raw_user_meta_data->>'commission_rate')::numeric, 5),
      false,
      NEW.raw_user_meta_data->>'business_license_url',
      NEW.raw_user_meta_data->>'tax_id',
      CASE 
        WHEN NEW.raw_user_meta_data->>'years_of_experience' IS NOT NULL 
        THEN (NEW.raw_user_meta_data->>'years_of_experience')::integer 
        ELSE NULL 
      END,
      '[]'::jsonb
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS "on_auth_user_created_middleman" ON "auth"."users";
CREATE TRIGGER "on_auth_user_created_middleman"
  AFTER INSERT ON "auth"."users"
  FOR EACH ROW 
  EXECUTE FUNCTION "public"."handle_middleman_signup"();

-- STEP 8: Grant permissions
-- ============================================================
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."business_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."middleman_profiles" TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."handle_middleman_signup"() TO "authenticated";

-- STEP 9: Verification queries
-- ============================================================

-- Verify columns exist
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('users', 'business_profiles', 'middleman_profiles')
  AND column_name IN (
    'preferred_language', 'preferred_currency', 'theme_preference', 'sidebar_state',
    'specialization', 'website_url', 'description', 'business_license_url', 'tax_id',
    'years_of_experience', 'industries_served', 'commission_rate'
  )
ORDER BY table_name, ordinal_position;

-- Verify RLS policies
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('users', 'business_profiles', 'middleman_profiles', 'objects')
ORDER BY tablename, policyname;

-- Verify trigger
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name = 'on_auth_user_created_middleman';

-- ============================================================
-- MIGRATION COMPLETE!
-- ============================================================
-- Next steps:
-- 1. Create storage bucket 'documents' in Supabase Dashboard
-- 2. Test middleman signup flow
-- 3. Verify profiles are created automatically
-- ============================================================
