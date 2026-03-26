-- ═══════════════════════════════════════════════════════════
-- CRITICAL FIX: Users Table Schema
-- ═══════════════════════════════════════════════════════════
-- Run this IMMEDIATELY in Supabase SQL Editor
-- This will fix the 406 Not Acceptable errors

-- Step 1: Check if users table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'users'
  ) THEN
    RAISE EXCEPTION 'users table does not exist! Please create it first.';
  END IF;
END $$;

-- Step 2: Add ALL missing columns at once
DO $$
BEGIN
  -- account_type
  BEGIN
    ALTER TABLE public.users ADD COLUMN account_type text DEFAULT 'user';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'account_type column already exists';
  END;

  -- preferred_language
  BEGIN
    ALTER TABLE public.users ADD COLUMN preferred_language text DEFAULT 'en';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'preferred_language column already exists';
  END;

  -- preferred_currency
  BEGIN
    ALTER TABLE public.users ADD COLUMN preferred_currency text DEFAULT 'USD';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'preferred_currency column already exists';
  END;

  -- theme_preference
  BEGIN
    ALTER TABLE public.users ADD COLUMN theme_preference text DEFAULT 'system';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'theme_preference column already exists';
  END;

  -- sidebar_state (JSONB)
  BEGIN
    ALTER TABLE public.users ADD COLUMN sidebar_state jsonb DEFAULT '{"collapsed": false, "width": 280}';
  EXCEPTION WHEN duplicate_column THEN
    RAISE NOTICE 'sidebar_state column already exists';
  END;
END $$;

-- Step 3: Add comments
COMMENT ON COLUMN public.users.account_type IS 'User account type';
COMMENT ON COLUMN public.users.preferred_language IS 'Preferred language code';
COMMENT ON COLUMN public.users.preferred_currency IS 'Preferred currency code';
COMMENT ON COLUMN public.users.theme_preference IS 'Theme preference';
COMMENT ON COLUMN public.users.sidebar_state IS 'Sidebar UI state';

-- Step 4: Drop ALL existing policies on users table
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can read other users basic info" ON public.users;
DROP POLICY IF EXISTS "Users can view own preferences" ON public.users;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can view all users" ON public.users;
DROP POLICY IF EXISTS "users_read_own_profile" ON public.users;
DROP POLICY IF EXISTS "users_read_other_users_basic" ON public.users;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.users;
DROP POLICY IF EXISTS "users_insert_own_profile" ON public.users;

-- Step 5: Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 6: Create NEW simple policies
-- Policy 1: Users can read ANY user's basic info (needed for chat, profiles, etc.)
CREATE POLICY "users_select_public" ON public.users
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy 2: Users can read their own full profile including preferences
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy 3: Users can update their own profile
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy 4: Users can insert their own profile
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Step 7: Create indexes
CREATE INDEX IF NOT EXISTS idx_users_user_id ON public.users(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_account_type ON public.users(account_type);

-- Step 8: Verify the columns exist now
SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name IN ('account_type', 'preferred_language', 'preferred_currency', 'theme_preference', 'sidebar_state')
ORDER BY 
  CASE column_name
    WHEN 'account_type' THEN 1
    WHEN 'preferred_language' THEN 2
    WHEN 'preferred_currency' THEN 3
    WHEN 'theme_preference' THEN 4
    WHEN 'sidebar_state' THEN 5
  END;

-- Step 9: Test query - this should work now
-- Replace with your actual user ID to test
-- SELECT 
--   user_id,
--   account_type,
--   preferred_language,
--   preferred_currency,
--   theme_preference,
--   sidebar_state
-- FROM public.users
-- WHERE user_id = 'c48b490f-bc55-4854-a202-98347ebd59b8'
-- LIMIT 1;

-- Step 10: Show current policies
SELECT 
  policyname,
  cmd,
  roles,
  qual
FROM pg_policies
WHERE tablename = 'users'
  AND schemaname = 'public'
ORDER BY policyname;
