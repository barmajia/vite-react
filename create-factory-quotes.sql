-- ============================================================================
-- Factory Quotes Table Migration
-- ============================================================================
-- Purpose: Add missing factory_quotes table to support quote request feature
-- Related Route: /factory/quotes
-- Report Reference: ROUTES_COMPLETE.md - Critical Issue #2
-- Date: March 23, 2026
-- ============================================================================

-- Drop existing table if it exists (for clean migration)
DROP TABLE IF EXISTS public.factory_quotes CASCADE;

-- Create factory_quotes table
CREATE TABLE public.factory_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationship IDs
  factory_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  
  -- Quote Details
  product_name text NOT NULL,
  product_description text,
  quantity integer NOT NULL DEFAULT 1,
  unit text DEFAULT 'piece',
  
  -- Pricing
  quoted_price numeric(12, 2),
  currency text DEFAULT 'USD',
  valid_until date,
  
  -- Status Tracking
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'quoted', 'accepted', 'rejected', 'expired', 'cancelled')),
  
  -- Communication
  factory_notes text,
  requester_notes text,
  
  -- Timestamps
  quoted_at timestamptz,
  responded_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Index for factory to view their quotes
CREATE INDEX idx_factory_quotes_factory_id ON public.factory_quotes(factory_id);

-- Index for requester to view their quote requests
CREATE INDEX idx_factory_quotes_requester_id ON public.factory_quotes(requester_id);

-- Index for status filtering
CREATE INDEX idx_factory_quotes_status ON public.factory_quotes(status);

-- Index for product lookups
CREATE INDEX idx_factory_quotes_product_id ON public.factory_quotes(product_id);

-- Composite index for common query pattern
CREATE INDEX idx_factory_quotes_factory_status ON public.factory_quotes(factory_id, status);

-- Index for expiry tracking
CREATE INDEX idx_factory_quotes_expires_at ON public.factory_quotes(expires_at) WHERE status = 'quoted';

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE public.factory_quotes IS 'Factory quote requests for bulk/custom product orders';
COMMENT ON COLUMN public.factory_quotes.id IS 'Unique quote identifier';
COMMENT ON COLUMN public.factory_quotes.factory_id IS 'Factory/seller user ID providing the quote';
COMMENT ON COLUMN public.factory_quotes.requester_id IS 'User requesting the quote (buyer/middleman)';
COMMENT ON COLUMN public.factory_quotes.product_id IS 'Optional reference to existing product';
COMMENT ON COLUMN public.factory_quotes.status IS 'Quote lifecycle status: pending, quoted, accepted, rejected, expired, cancelled';
COMMENT ON COLUMN public.factory_quotes.quoted_price IS 'Price quoted by factory';
COMMENT ON COLUMN public.factory_quotes.valid_until IS 'Date until which quote is valid';

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE public.factory_quotes ENABLE ROW LEVEL SECURITY;

-- Policy: Factory can view quotes sent to them
CREATE POLICY factory_quotes_factory_view
  ON public.factory_quotes
  FOR SELECT
  TO authenticated
  USING (factory_id = auth.uid());

-- Policy: Factory can update quotes they own (add price, change status)
CREATE POLICY factory_quotes_factory_update
  ON public.factory_quotes
  FOR UPDATE
  TO authenticated
  USING (factory_id = auth.uid())
  WITH CHECK (factory_id = auth.uid());

-- Policy: Requester can view their own quote requests
CREATE POLICY factory_quotes_requester_view
  ON public.factory_quotes
  FOR SELECT
  TO authenticated
  USING (requester_id = auth.uid());

-- Policy: Requester can create quote requests
CREATE POLICY factory_quotes_requester_insert
  ON public.factory_quotes
  FOR INSERT
  TO authenticated
  WITH CHECK (requester_id = auth.uid());

-- Policy: Requester can update their quote requests (before factory responds)
CREATE POLICY factory_quotes_requester_update
  ON public.factory_quotes
  FOR UPDATE
  TO authenticated
  USING (
    requester_id = auth.uid() 
    AND status IN ('pending', 'cancelled')
  );

-- Policy: Admin/service role can view all quotes
CREATE POLICY factory_quotes_admin_view
  ON public.factory_quotes
  FOR SELECT
  TO service_role
  USING (true);

-- ============================================================================
-- Trigger for Auto-Expiry
-- ============================================================================

-- Function to auto-expire quotes
CREATE OR REPLACE FUNCTION public.factory_quotes_auto_expire()
RETURNS trigger AS $$
BEGIN
  IF NEW.valid_until IS NOT NULL AND NEW.valid_until < CURRENT_DATE THEN
    NEW.status := 'expired';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to check expiry on update
CREATE TRIGGER trg_factory_quotes_auto_expire
  BEFORE UPDATE ON public.factory_quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.factory_quotes_auto_expire();

-- ============================================================================
-- Trigger for Updated Timestamp
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER trg_factory_quotes_updated_at
  BEFORE UPDATE ON public.factory_quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Verify table creation
DO $$
DECLARE
  table_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'factory_quotes'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
    RAISE EXCEPTION 'factory_quotes table was not created!';
  END IF;
  
  RAISE NOTICE 'factory_quotes table created successfully!';
END $$;

-- Verify indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'factory_quotes' 
ORDER BY indexname;

-- Verify RLS policies
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies 
WHERE tablename = 'factory_quotes'
ORDER BY policyname;

-- ============================================================================
-- Sample Data (for testing - remove in production)
-- ============================================================================

-- Uncomment to insert test data
/*
INSERT INTO public.factory_quotes (
  factory_id, 
  requester_id, 
  product_name, 
  product_description,
  quantity, 
  unit,
  quoted_price,
  valid_until,
  status,
  factory_notes,
  requester_notes
) VALUES 
(
  '00000000-0000-0000-0000-000000000001', -- Replace with actual factory user ID
  '00000000-0000-0000-0000-000000000002', -- Replace with actual requester user ID
  'Custom Product Order',
  'Bulk order of custom manufactured product with specific requirements',
  1000,
  'pieces',
  5000.00,
  CURRENT_DATE + INTERVAL '30 days',
  'pending',
  'Please provide detailed specifications',
  'Urgent order needed within 2 weeks'
);
*/

-- ============================================================================
-- Migration Complete
-- ============================================================================
