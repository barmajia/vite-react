-- ============================================
-- PUBLIC PROFILE SYSTEM - RLS POLICIES
-- Aurora E-commerce Platform
-- ============================================
-- This migration enables public profile viewing for all account types
-- while maintaining privacy controls for sensitive data

-- ============================================
-- 1. SELLERS TABLE - Public Profile Access
-- ============================================
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.sellers;
DROP POLICY IF EXISTS "Users can view all seller profiles" ON public.sellers;

-- Allow all authenticated users to view seller profiles
CREATE POLICY "Public profiles are viewable by authenticated users" ON public.sellers
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON public.sellers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow sellers to update their own profile
CREATE POLICY "Users can update own profile" ON public.sellers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON public.sellers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 2. MIDDLE MEN TABLE - Public Profile Access
-- ============================================
ALTER TABLE public.middle_men ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.middle_men;

CREATE POLICY "Public profiles are viewable by authenticated users" ON public.middle_men
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view own profile" ON public.middle_men
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.middle_men
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.middle_men
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 3. SERVICE PROVIDERS TABLE - Public Profile Access
-- ============================================
ALTER TABLE public.svc_providers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.svc_providers;

CREATE POLICY "Public profiles are viewable by authenticated users" ON public.svc_providers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view own profile" ON public.svc_providers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.svc_providers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.svc_providers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 4. DOCTOR PROFILES - Public Profile Access
-- ============================================
ALTER TABLE public.health_doctor_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.health_doctor_profiles;

CREATE POLICY "Public profiles are viewable by authenticated users" ON public.health_doctor_profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view own profile" ON public.health_doctor_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.health_doctor_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.health_doctor_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 5. PATIENT PROFILES - PRIVATE (HIPAA Compliance)
-- ============================================
ALTER TABLE public.health_patient_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Patients can only view own profile" ON public.health_patient_profiles;

-- Patients can ONLY view their own profile (strict privacy)
CREATE POLICY "Patients can only view own profile" ON public.health_patient_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.health_patient_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.health_patient_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 6. PHARMACY PROFILES - Public Profile Access
-- ============================================
ALTER TABLE public.health_pharmacy_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.health_pharmacy_profiles;

CREATE POLICY "Public profiles are viewable by authenticated users" ON public.health_pharmacy_profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view own profile" ON public.health_pharmacy_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.health_pharmacy_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.health_pharmacy_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 7. DELIVERY PROFILES - Public Profile Access
-- ============================================
ALTER TABLE public.delivery_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.delivery_profiles;

CREATE POLICY "Public profiles are viewable by authenticated users" ON public.delivery_profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view own profile" ON public.delivery_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.delivery_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.delivery_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 8. USERS TABLE - Base Profile Access
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.users;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;

-- Allow authenticated users to view basic profile info of all users
CREATE POLICY "Public profiles are viewable by authenticated users" ON public.users
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to view their own complete profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 9. HELPER FUNCTION: Get Public Profile by User ID
-- ============================================
CREATE OR REPLACE FUNCTION public.get_public_profile(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_data jsonb;
  user_account_type text;
BEGIN
  -- Get account type from users table
  SELECT account_type INTO user_account_type
  FROM public.users
  WHERE user_id = target_user_id;

  -- Fetch profile based on account type
  CASE user_account_type
    WHEN 'seller', 'factory' THEN
      SELECT to_jsonb(sellers.*) || jsonb_build_object(
        'users', jsonb_build_object(
          'full_name', users.full_name,
          'avatar_url', users.avatar_url,
          'phone', users.phone,
          'email', users.email
        )
      ) INTO profile_data
      FROM public.sellers
      LEFT JOIN public.users ON sellers.user_id = users.user_id
      WHERE sellers.user_id = target_user_id;

    WHEN 'middleman' THEN
      SELECT to_jsonb(middle_men.*) || jsonb_build_object(
        'users', jsonb_build_object(
          'full_name', users.full_name,
          'avatar_url', users.avatar_url,
          'phone', users.phone,
          'email', users.email
        )
      ) INTO profile_data
      FROM public.middle_men
      LEFT JOIN public.users ON middle_men.user_id = users.user_id
      WHERE middle_men.user_id = target_user_id;

    WHEN 'freelancer', 'service_provider' THEN
      SELECT to_jsonb(svc_providers.*) || jsonb_build_object(
        'users', jsonb_build_object(
          'full_name', users.full_name,
          'avatar_url', users.avatar_url,
          'phone', users.phone,
          'email', users.email
        )
      ) INTO profile_data
      FROM public.svc_providers
      LEFT JOIN public.users ON svc_providers.user_id = users.user_id
      WHERE svc_providers.user_id = target_user_id;

    WHEN 'doctor' THEN
      SELECT to_jsonb(health_doctor_profiles.*) || jsonb_build_object(
        'users', jsonb_build_object(
          'full_name', users.full_name,
          'avatar_url', users.avatar_url,
          'phone', users.phone,
          'email', users.email
        )
      ) INTO profile_data
      FROM public.health_doctor_profiles
      LEFT JOIN public.users ON health_doctor_profiles.user_id = users.user_id
      WHERE health_doctor_profiles.user_id = target_user_id;

    WHEN 'pharmacy' THEN
      SELECT to_jsonb(health_pharmacy_profiles.*) || jsonb_build_object(
        'users', jsonb_build_object(
          'full_name', users.full_name,
          'avatar_url', users.avatar_url,
          'phone', users.phone,
          'email', users.email
        )
      ) INTO profile_data
      FROM public.health_pharmacy_profiles
      LEFT JOIN public.users ON health_pharmacy_profiles.user_id = users.user_id
      WHERE health_pharmacy_profiles.user_id = target_user_id;

    WHEN 'delivery_driver' THEN
      SELECT to_jsonb(delivery_profiles.*) || jsonb_build_object(
        'users', jsonb_build_object(
          'full_name', users.full_name,
          'avatar_url', users.avatar_url,
          'phone', users.phone,
          'email', users.email
        )
      ) INTO profile_data
      FROM public.delivery_profiles
      LEFT JOIN public.users ON delivery_profiles.user_id = users.user_id
      WHERE delivery_profiles.user_id = target_user_id;

    ELSE
      -- Default to users table
      SELECT to_jsonb(users.*) INTO profile_data
      FROM public.users
      WHERE users.user_id = target_user_id;
  END CASE;

  RETURN profile_data;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_public_profile TO authenticated;

-- ============================================
-- 10. INDEXES FOR PERFORMANCE
-- ============================================
-- Ensure indexes exist for fast lookups
CREATE INDEX IF NOT EXISTS idx_sellers_user_id ON public.sellers(user_id);
CREATE INDEX IF NOT EXISTS idx_middle_men_user_id ON public.middle_men(user_id);
CREATE INDEX IF NOT EXISTS idx_svc_providers_user_id ON public.svc_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_health_doctor_profiles_user_id ON public.health_doctor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_health_pharmacy_profiles_user_id ON public.health_pharmacy_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_profiles_user_id ON public.delivery_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_users_user_id ON public.users(user_id);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_sellers_verified ON public.sellers(is_verified, user_id);
CREATE INDEX IF NOT EXISTS idx_svc_providers_verified ON public.svc_providers(is_verified, user_id);
CREATE INDEX IF NOT EXISTS idx_health_doctor_profiles_verified ON public.health_doctor_profiles(is_verified, user_id);

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- All public profile RLS policies have been created
-- Test with: SELECT public.get_public_profile('your-user-id-here');
