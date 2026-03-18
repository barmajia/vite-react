-- Complete Fix for svc_providers Table - ALL MISSING COLUMNS
-- Run this in Supabase SQL Editor to add all missing columns

-- =============================================
-- STEP 1: Add ALL missing columns
-- =============================================

-- Add phone column
ALTER TABLE public.svc_providers
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Add website column
ALTER TABLE public.svc_providers
ADD COLUMN IF NOT EXISTS website VARCHAR(200);

-- Add email column
ALTER TABLE public.svc_providers
ADD COLUMN IF NOT EXISTS email VARCHAR(200);

-- Add logo_url column
ALTER TABLE public.svc_providers
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add cover_image_url column
ALTER TABLE public.svc_providers
ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- Add latitude column
ALTER TABLE public.svc_providers
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);

-- Add longitude column
ALTER TABLE public.svc_providers
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add average_rating column
ALTER TABLE public.svc_providers
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3, 2) DEFAULT 0;

-- Add review_count column
ALTER TABLE public.svc_providers
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;

-- Add total_jobs_completed column
ALTER TABLE public.svc_providers
ADD COLUMN IF NOT EXISTS total_jobs_completed INTEGER DEFAULT 0;

-- Add is_verified column
ALTER TABLE public.svc_providers
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Add specialties column (array type)
ALTER TABLE public.svc_providers
ADD COLUMN IF NOT EXISTS specialties TEXT[];

-- Add tagline column
ALTER TABLE public.svc_providers
ADD COLUMN IF NOT EXISTS tagline VARCHAR(200);

-- Add description column
ALTER TABLE public.svc_providers
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add location_city column
ALTER TABLE public.svc_providers
ADD COLUMN IF NOT EXISTS location_city VARCHAR(100);

-- Add location_country column
ALTER TABLE public.svc_providers
ADD COLUMN IF NOT EXISTS location_country VARCHAR(100);

-- =============================================
-- STEP 2: Update status constraint to include 'pending_review'
-- =============================================
ALTER TABLE public.svc_providers
DROP CONSTRAINT IF EXISTS svc_providers_status_check;

ALTER TABLE public.svc_providers
ADD CONSTRAINT svc_providers_status_check
CHECK (status IN ('active', 'inactive', 'suspended', 'pending_review'));

-- =============================================
-- STEP 3: Verify all columns exist
-- =============================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'svc_providers'
ORDER BY ordinal_position;

-- =============================================
-- STEP 4: Verify constraints
-- =============================================
SELECT
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.svc_providers'::regclass;

-- =============================================
-- You should see these columns:
-- id, user_id, provider_name, provider_type, tagline, 
-- description, logo_url, cover_image_url, location_city, 
-- location_country, latitude, longitude, phone, email, 
-- website, specialties, average_rating, review_count, 
-- total_jobs_completed, is_verified, status, created_at, updated_at
-- =============================================
