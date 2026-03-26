-- Middleman Profiles Table Migration
-- Run this in your Supabase SQL Editor if the table doesn't exist

-- Create middleman_profiles table if not exists
CREATE TABLE IF NOT EXISTS public.middleman_profiles (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text,
    specialization text,
    website text,
    description text,
    years_of_experience integer DEFAULT 0,
    is_verified boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.middleman_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
-- Anyone can view verified middlemen (public profiles)
DROP POLICY IF EXISTS "public_view_verified_middlemen" ON public.middleman_profiles;
CREATE POLICY "public_view_verified_middlemen" ON public.middleman_profiles
    FOR SELECT
    USING (true);

-- Middlemen can update their own profile
DROP POLICY IF EXISTS "middlemen_manage_own_profile" ON public.middleman_profiles;
CREATE POLICY "middlemen_manage_own_profile" ON public.middleman_profiles
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can insert their own profile
DROP POLICY IF EXISTS "users_insert_own_middleman_profile" ON public.middleman_profiles;
CREATE POLICY "users_insert_own_middleman_profile" ON public.middleman_profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON TABLE public.middleman_profiles TO authenticated;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_updated_at ON public.middleman_profiles;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.middleman_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
