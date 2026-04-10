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
