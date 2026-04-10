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
