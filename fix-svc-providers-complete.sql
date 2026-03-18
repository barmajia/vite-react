-- Complete Fix for svc_providers Table
-- Run this in Supabase SQL Editor to fix all issues

-- =============================================
-- STEP 1: Add missing 'phone' column
-- =============================================
ALTER TABLE public.svc_providers
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- =============================================
-- STEP 2: Update status constraint to include 'pending_review'
-- =============================================
ALTER TABLE public.svc_providers
DROP CONSTRAINT IF EXISTS svc_providers_status_check;

ALTER TABLE public.svc_providers
ADD CONSTRAINT svc_providers_status_check
CHECK (status IN ('active', 'inactive', 'suspended', 'pending_review'));

-- =============================================
-- STEP 3: Verify all columns
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
-- Expected columns (verify these exist):
-- id, user_id, provider_name, provider_type, tagline, 
-- description, logo_url, cover_image_url, location_city, 
-- location_country, latitude, longitude, phone, email, 
-- website, specialties, average_rating, review_count, 
-- total_jobs_completed, is_verified, status, created_at, updated_at
-- =============================================
