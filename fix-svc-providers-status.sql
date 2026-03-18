-- Fix svc_providers status enum to include 'pending_review'
-- This is needed for the service provider onboarding flow
-- Run this in Supabase SQL Editor

-- Step 1: Drop the existing constraint
ALTER TABLE public.svc_providers
DROP CONSTRAINT IF EXISTS svc_providers_status_check;

-- Step 2: Add new constraint with 'pending_review' status
ALTER TABLE public.svc_providers
ADD CONSTRAINT svc_providers_status_check
CHECK (status IN ('active', 'inactive', 'suspended', 'pending_review'));

-- Step 3: Verify the change
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.svc_providers'::regclass
AND contype = 'c';

-- Step 4: Test insert (optional - remove comments to test)
-- This should work now for hospital role
-- INSERT INTO public.svc_providers (user_id, provider_name, provider_type, status, is_verified)
-- VALUES (auth.uid(), 'Test Provider', 'hospital', 'pending_review', false);
