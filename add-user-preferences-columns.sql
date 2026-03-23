-- Add missing columns to users table for user preferences
-- Run this in Supabase SQL Editor to fix 400 Bad Request errors

-- Add missing columns to public.users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS preferred_currency TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'system',
ADD COLUMN IF NOT EXISTS sidebar_state JSONB DEFAULT '{"collapsed": false, "width": 280}';

-- Add comments for documentation
COMMENT ON COLUMN public.users.preferred_language IS 'User preferred language code (e.g., en, ar, fr)';
COMMENT ON COLUMN public.users.preferred_currency IS 'User preferred currency code (e.g., USD, EUR, EGP)';
COMMENT ON COLUMN public.users.theme_preference IS 'User theme preference (light, dark, system)';
COMMENT ON COLUMN public.users.sidebar_state IS 'Sidebar UI state as JSONB';

-- Grant proper permissions
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own preferences
DROP POLICY IF EXISTS "Users can view own preferences" ON public.users;
CREATE POLICY "Users can view own preferences" ON public.users
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy for users to update their own preferences
DROP POLICY IF EXISTS "Users can update own preferences" ON public.users;
CREATE POLICY "Users can update own preferences" ON public.users
  FOR UPDATE USING (auth.uid() = user_id);

-- Verify columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
  AND column_name IN ('preferred_language', 'preferred_currency', 'theme_preference', 'sidebar_state')
ORDER BY ordinal_position;
