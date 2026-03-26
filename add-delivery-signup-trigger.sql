-- ═══════════════════════════════════════════════════════════
-- ADD DELIVERY SIGNUP SUPPORT TO handle_new_user TRIGGER
-- ═══════════════════════════════════════════════════════════
-- Run this in Supabase SQL Editor
-- This enables automatic delivery profile creation on signup
-- ═══════════════════════════════════════════════════════════

-- Your delivery_profiles table already exists with these columns:
-- - user_id (UUID, PRIMARY KEY)
-- - vehicle_type (TEXT) - motorcycle, car, bicycle, van, truck
-- - vehicle_number (TEXT)
-- - driver_license_url (TEXT)
-- - is_verified (BOOLEAN)
-- - is_active (BOOLEAN)
-- - latitude, longitude (for tracking)
-- - rating, total_deliveries, etc.

-- ═══════════════════════════════════════════════════════════
-- 1. UPDATE handle_new_user FUNCTION
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 1. Insert into public.users (Common for all roles)
    INSERT INTO public.users (
        user_id,
        email,
        full_name,
        phone,
        account_type
    ) VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'phone',
        COALESCE(NEW.raw_user_meta_data->>'account_type', 'user')
    );

    -- 2. If Seller, create seller record
    IF NEW.raw_user_meta_data->>'account_type' = 'seller' THEN
        INSERT INTO public.sellers (
            user_id,
            email,
            full_name,
            phone,
            location,
            currency,
            account_type,
            is_verified
        ) VALUES (
            NEW.id,
            NEW.email,
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'phone',
            NEW.raw_user_meta_data->>'location',
            COALESCE(NEW.raw_user_meta_data->>'currency', 'USD'),
            'seller',
            FALSE
        );
    END IF;

    -- 3. If Delivery Driver, create delivery profile record
    IF NEW.raw_user_meta_data->>'account_type' = 'delivery' THEN
        INSERT INTO public.delivery_profiles (
            user_id,
            vehicle_type,
            vehicle_number,
            is_verified,
            is_active
        ) VALUES (
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'vehicle_type', 'motorcycle'),
            NEW.raw_user_meta_data->>'vehicle_number',
            FALSE, -- Start unverified until admin checks docs
            TRUE   -- But active and ready to receive assignments
        );
    END IF;

    RETURN NEW;
END;
$$;

-- ═══════════════════════════════════════════════════════════
-- 2. ENSURE RLS POLICIES ARE CORRECT
-- ═══════════════════════════════════════════════════════════

-- Enable RLS
ALTER TABLE public.delivery_profiles ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "delivery_view_own" ON public.delivery_profiles;
DROP POLICY IF EXISTS "delivery_update_own" ON public.delivery_profiles;
DROP POLICY IF EXISTS "delivery_update_location" ON public.delivery_profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.delivery_profiles;

-- Drivers can view their own profile
CREATE POLICY "delivery_view_own" ON public.delivery_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Drivers can update their own profile
CREATE POLICY "delivery_update_own" ON public.delivery_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Public view for active, verified drivers (for admin/customer lookup)
CREATE POLICY "delivery_public_view" ON public.delivery_profiles
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ═══════════════════════════════════════════════════════════
-- 3. ENSURE ORDERS TABLE HAS DELIVERY FIELDS
-- ═══════════════════════════════════════════════════════════

-- Add delivery_id if it doesn't exist (should already exist)
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS delivery_id uuid REFERENCES public.delivery_profiles(user_id) ON DELETE SET NULL;

-- Add delivery_status if it doesn't exist
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS delivery_status text DEFAULT 'pending' 
  CHECK (delivery_status IN ('pending', 'assigned', 'picked_up', 'delivered', 'cancelled'));

-- Add delivery tracking timestamps
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS picked_up_at timestamptz,
ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

-- ═══════════════════════════════════════════════════════════
-- 4. CREATE INDEX FOR FAST DELIVERY LOOKUPS
-- ═══════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_delivery_profiles_active_verified 
ON public.delivery_profiles(is_active, is_verified) 
WHERE is_active = true AND is_verified = true;

-- Location index for finding nearby drivers
CREATE INDEX IF NOT EXISTS idx_delivery_location 
ON public.delivery_profiles(latitude, longitude) 
WHERE is_active = true AND is_verified = true;

-- ═══════════════════════════════════════════════════════════
-- 5. VERIFICATION QUERIES
-- ═══════════════════════════════════════════════════════════

-- Check if function was updated
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'handle_new_user';

-- Check policies
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'delivery_profiles'
  AND schemaname = 'public'
ORDER BY policyname;

-- Test: Check if delivery columns exist in orders
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'orders'
  AND column_name IN ('delivery_id', 'delivery_status', 'picked_up_at', 'delivered_at')
ORDER BY column_name;

-- ═══════════════════════════════════════════════════════════
-- 6. FRONTEND SIGNUP EXAMPLE
-- ═══════════════════════════════════════════════════════════

/*
When signing up a delivery driver in React/Flutter:

const { data, error } = await supabase.auth.signUp({
  email: 'driver@example.com',
  password: 'securepassword',
  options: {
    data: {
      full_name: 'Ahmed Mohamed',
      phone: '+20123456789',
      account_type: 'delivery',  // ← Important!
      vehicle_type: 'motorcycle',
      vehicle_number: 'ABC-123'
    }
  }
});

This will automatically:
1. Create auth.user record
2. Create public.users record
3. Create public.delivery_profiles record
*/

-- ═══════════════════════════════════════════════════════════
-- MIGRATION COMPLETE
-- ═══════════════════════════════════════════════════════════

-- Delivery drivers can now sign up and will automatically get:
-- ✅ Auth user account
-- ✅ Public user profile
-- ✅ Delivery profile with vehicle info
-- ✅ Proper RLS access
