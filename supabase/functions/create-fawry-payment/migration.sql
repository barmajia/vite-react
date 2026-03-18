-- Fawry Payment Integration Migration
-- Run this in Supabase SQL Editor

-- =============================================
-- STEP 1: Add Fawry-specific columns to payment_intentions
-- =============================================

ALTER TABLE public.payment_intentions 
ADD COLUMN IF NOT EXISTS provider_reference_id TEXT, -- Fawry Reference Number
ADD COLUMN IF NOT EXISTS checkout_url TEXT,          -- Fawry Payment Link
ADD COLUMN IF NOT EXISTS provider_metadata JSONB DEFAULT '{}'; -- Store signature/timestamps

-- =============================================
-- STEP 2: Add unique constraint for idempotency
-- Prevents duplicate active payments per order
-- =============================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_intentions_order_pending 
ON public.payment_intentions (order_id) 
WHERE status = 'pending';

-- =============================================
-- STEP 3: Create index for webhook lookups
-- Fast lookup by provider reference ID
-- =============================================

CREATE INDEX IF NOT EXISTS idx_payment_intentions_provider_ref
ON public.payment_intentions (provider_reference_id)
WHERE provider_reference_id IS NOT NULL;

-- =============================================
-- STEP 4: Verify columns added
-- =============================================

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'payment_intentions'
ORDER BY ordinal_position;

-- =============================================
-- Expected columns include:
-- id, order_id, user_id, amount, currency, status,
-- payment_method, provider, provider_reference_id,
-- checkout_url, provider_metadata, created_at, updated_at
-- =============================================
