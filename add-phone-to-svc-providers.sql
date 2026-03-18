-- Fix: Add missing 'phone' column to svc_providers table
-- The code is trying to insert 'phone' but the column doesn't exist

-- Add the phone column
ALTER TABLE public.svc_providers
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Verify the column was added
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'svc_providers'
AND column_name = 'phone';
