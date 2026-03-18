-- Check current svc_providers table schema
-- Run this in Supabase SQL Editor to verify your current schema

-- 1. Check table columns
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'svc_providers'
ORDER BY ordinal_position;

-- 2. Check constraints (including CHECK constraints)
SELECT
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.svc_providers'::regclass;

-- 3. Check if 'pending_review' is allowed in status
SELECT
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.svc_providers'::regclass
AND contype = 'c'
AND conname LIKE '%status%';

-- 4. Test insert with pending_review status (should work if constraint is updated)
-- Uncomment to test:
-- INSERT INTO public.svc_providers (user_id, provider_name, provider_type, status, is_verified)
-- VALUES (auth.uid(), 'Test Provider', 'hospital', 'pending_review', false);
