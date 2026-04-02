-- =====================================================
-- ADD LOCATION COLUMNS TO CUSTOMERS TABLE
-- =====================================================
-- This migration adds latitude and longitude columns
-- to track customer location for better service delivery
-- Run this in your Supabase SQL Editor

-- =====================================================
-- 1. ADD LOCATION COLUMNS TO CUSTOMERS TABLE
-- =====================================================

ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS latitude numeric(10, 8),
ADD COLUMN IF NOT EXISTS longitude numeric(11, 8);

-- =====================================================
-- 2. CREATE INDEX FOR LOCATION QUERIES
-- =====================================================

CREATE INDEX IF NOT EXISTS customers_location_idx 
ON public.customers(latitude, longitude);

-- =====================================================
-- 3. UPDATE CUSTOMERS TABLE TO LINK WITH AUTH USERS
-- =====================================================

-- Add a constraint to ensure user_id references auth.users
ALTER TABLE public.customers
DROP CONSTRAINT IF EXISTS customers_user_id_fkey,
ADD CONSTRAINT customers_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- =====================================================
-- 4. CREATE TRIGGER TO AUTO-CREATE CUSTOMER RECORD
-- =====================================================
-- This trigger creates a customer record when a user signs up

CREATE OR REPLACE FUNCTION public.create_customer_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only create customer record if account_type is 'customer'
  IF NEW.raw_user_meta_data->>'account_type' = 'customer' THEN
    INSERT INTO public.customers (
      user_id,
      name,
      email,
      phone,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'Customer'),
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'phone', ''),
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created_customer ON auth.users;
CREATE TRIGGER on_auth_user_created_customer
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_customer_on_signup();

-- =====================================================
-- 5. ENABLE RLS ON CUSTOMERS TABLE
-- =====================================================

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Customers can view their own record" ON public.customers;
DROP POLICY IF EXISTS "Customers can update their own record" ON public.customers;

-- Customers can view their own record
CREATE POLICY "Customers can view their own record"
  ON public.customers
  FOR SELECT
  USING (auth.uid() = user_id);

-- Customers can update their own record
CREATE POLICY "Customers can update their own record"
  ON public.customers
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can do anything (for backend operations)
CREATE POLICY "Service role full access"
  ON public.customers
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- 6. VERIFY THE SETUP
-- =====================================================
-- Run this query to verify the customers table structure:
-- SELECT * FROM public.customers LIMIT 1;

-- Run this to check that the columns are present:
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'customers' AND column_name IN ('latitude', 'longitude');
