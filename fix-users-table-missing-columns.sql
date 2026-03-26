-- ═══════════════════════════════════════════════════════════
-- FIX USERS TABLE - ADD MISSING COLUMNS
-- ═══════════════════════════════════════════════════════════
-- Run this in Supabase SQL Editor to fix 406 errors
-- This adds all missing columns to the users table

-- 1. Add account_type if it doesn't exist
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS account_type text DEFAULT 'user'::text;

-- 2. Add user preferences columns
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'en',
ADD COLUMN IF NOT EXISTS preferred_currency text DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS theme_preference text DEFAULT 'system',
ADD COLUMN IF NOT EXISTS sidebar_state jsonb DEFAULT '{"collapsed": false, "width": 280}'::jsonb;

-- 3. Add comments for documentation
COMMENT ON COLUMN public.users.account_type IS 'User account type (user, customer, seller, factory, middleman, delivery)';
COMMENT ON COLUMN public.users.preferred_language IS 'User preferred language code (e.g., en, ar, fr)';
COMMENT ON COLUMN public.users.preferred_currency IS 'User preferred currency code (e.g., USD, EUR, EGP)';
COMMENT ON COLUMN public.users.theme_preference IS 'User theme preference (light, dark, system)';
COMMENT ON COLUMN public.users.sidebar_state IS 'Sidebar UI state as JSONB';

-- 4. Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 5. Drop old policies if they exist
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can read other users basic info" ON public.users;
DROP POLICY IF EXISTS "Users can view own preferences" ON public.users;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can view all users" ON public.users;

-- 6. Create new comprehensive policies
-- Users can read their own full profile
CREATE POLICY "users_read_own_profile" ON public.users
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can read other users' basic info (for chat, etc.)
CREATE POLICY "users_read_other_users_basic" ON public.users
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can update their own profile
CREATE POLICY "users_update_own_profile" ON public.users
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can insert their own profile (for trigger)
CREATE POLICY "users_insert_own_profile" ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS users_user_id_idx ON public.users(user_id);
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);
CREATE INDEX IF NOT EXISTS users_account_type_idx ON public.users(account_type);

-- 8. Verify columns exist
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
ORDER BY ordinal_position;

-- 9. Verify policies
SELECT 
  policyname, 
  cmd, 
  roles,
  qual
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- ═══════════════════════════════════════════════════════════
-- MIGRATE EXISTING AUTH USERS TO USERS TABLE
-- ═══════════════════════════════════════════════════════════

-- Insert any auth users that don't have a corresponding users record
INSERT INTO public.users (user_id, email, full_name, account_type, phone, avatar_url)
SELECT
    au.id,
    au.email,
    au.raw_user_meta_data->>'full_name' as full_name,
    COALESCE(au.raw_user_meta_data->>'account_type', 'user') as account_type,
    au.raw_user_meta_data->>'phone' as phone,
    au.raw_user_meta_data->>'avatar_url' as avatar_url
FROM auth.users au
LEFT JOIN public.users u ON u.user_id = au.id
WHERE u.user_id IS NULL
ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, users.full_name),
    account_type = COALESCE(EXCLUDED.account_type, users.account_type),
    phone = COALESCE(EXCLUDED.phone, users.phone),
    avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
    updated_at = now();

-- ═══════════════════════════════════════════════════════════
-- VERIFICATION QUERY
-- ═══════════════════════════════════════════════════════════

-- Check if all required columns exist
SELECT 
  'Users table columns' as check_type,
  COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name IN ('user_id', 'email', 'full_name', 'account_type', 
                      'preferred_language', 'preferred_currency', 
                      'theme_preference', 'sidebar_state');

-- Test query (should return your user with all columns)
-- SELECT 
--   user_id,
--   email,
--   full_name,
--   account_type,
--   preferred_language,
--   preferred_currency,
--   theme_preference,
--   sidebar_state
-- FROM public.users
-- WHERE user_id = auth.uid()
-- LIMIT 1;
