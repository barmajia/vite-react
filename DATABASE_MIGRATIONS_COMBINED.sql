-- Migration: Add onboarding_completed column to users table
-- This enables tracking which users have completed their initial onboarding flow

-- Add onboarding_completed column to users table
ALTER TABLE IF EXISTS public.users 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.users.onboarding_completed IS 'Tracks whether user has completed their role-specific onboarding flow';

-- Create index for faster queries on onboarding status
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed ON public.users(onboarding_completed);

-- Update existing users to have onboarding_completed = true (assuming they are existing users)
UPDATE public.users 
SET onboarding_completed = true 
WHERE onboarding_completed IS NULL OR onboarding_completed = false;

-- Ensure RLS policies allow users to update their own onboarding status
-- This policy should already exist, but we ensure it covers onboarding_completed
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Allow service role to update onboarding status (for backend functions)
DROP POLICY IF EXISTS "Service role can update user profiles" ON public.users;
CREATE POLICY "Service role can update user profiles" ON public.users
    FOR ALL
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');
-- Add name column to shops table for Seller Dashboard
-- This fixes the missing column error in SellerDashboard.tsx

ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS name TEXT;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_shops_owner_id ON public.shops(owner_id);

-- Update existing shops with a default name based on slug
UPDATE public.shops 
SET name = COALESCE(name, CONCAT('Shop ', slug))
WHERE name IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.shops.name IS 'Display name for the shop shown in dashboards and UI';
-- Create factory_profiles table for ImprovedFactoryDashboard
-- This table is required for factory dashboard functionality

CREATE TABLE IF NOT EXISTS public.factory_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  business_license TEXT,
  specialization TEXT[],
  production_capacity TEXT,
  min_order_quantity INTEGER DEFAULT 1,
  location TEXT,
  country TEXT,
  website_url TEXT,
  description TEXT,
  rating DECIMAL(3,2) DEFAULT 0.00,
  total_orders INTEGER DEFAULT 0,
  response_time_hours INTEGER DEFAULT 24,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_factory_profiles_company_name ON factory_profiles(company_name);
CREATE INDEX IF NOT EXISTS idx_factory_profiles_location ON factory_profiles(location);
CREATE INDEX IF NOT EXISTS idx_factory_profiles_verified ON factory_profiles(verified);

-- Enable RLS
ALTER TABLE public.factory_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for factory_profiles
DROP POLICY IF EXISTS "factory_profiles_viewable_by_all" ON public.factory_profiles;
CREATE POLICY "factory_profiles_viewable_by_all" 
  ON public.factory_profiles 
  FOR SELECT 
  TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "factory_profiles_insert_own" ON public.factory_profiles;
CREATE POLICY "factory_profiles_insert_own" 
  ON public.factory_profiles 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "factory_profiles_update_own" ON public.factory_profiles;
CREATE POLICY "factory_profiles_update_own" 
  ON public.factory_profiles 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_factory_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_factory_profile_updated_at ON public.factory_profiles;
CREATE TRIGGER update_factory_profile_updated_at
  BEFORE UPDATE ON public.factory_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_factory_profile_updated_at();

COMMENT ON TABLE public.factory_profiles IS 'Factory profile information for marketplace and dashboard';
