-- ============================================================
-- Add Customer Details Columns to service_bookings
-- ============================================================
-- These columns store customer contact info at the time of booking
-- (in case customer updates their profile later)

ALTER TABLE public.service_bookings
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS customer_email TEXT,
ADD COLUMN IF NOT EXISTS customer_phone TEXT,
ADD COLUMN IF NOT EXISTS customer_notes TEXT,
ADD COLUMN IF NOT EXISTS provider_notes TEXT;

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.service_bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON public.service_bookings(booking_date);

-- Add comments for documentation
COMMENT ON COLUMN public.service_bookings.customer_name IS 'Customer name at time of booking';
COMMENT ON COLUMN public.service_bookings.customer_email IS 'Customer email at time of booking';
COMMENT ON COLUMN public.service_bookings.customer_phone IS 'Customer phone at time of booking';
COMMENT ON COLUMN public.service_bookings.customer_notes IS 'Notes from customer to provider';
COMMENT ON COLUMN public.service_bookings.provider_notes IS 'Internal notes from provider';

-- Verify columns
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'service_bookings'
ORDER BY ordinal_position;
