-- ============================================================
-- Services Marketplace - Complete Schema Migration
-- Adds: Availability, Escrow, Enhanced Bookings, Reviews
-- ============================================================

-- ============================================================
-- 1. ENHANCE service_providers TABLE
-- ============================================================

-- Add verification fields if missing
ALTER TABLE public.service_providers
ADD COLUMN IF NOT EXISTS license_number TEXT,
ADD COLUMN IF NOT EXISTS certification_urls TEXT[],
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_documents TEXT[];

-- Add availability (JSONB for weekly schedule)
ALTER TABLE public.service_providers
ADD COLUMN IF NOT EXISTS availability JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS blocked_dates DATE[];

-- Add engagement models
ALTER TABLE public.service_providers
ADD COLUMN IF NOT EXISTS engagement_models TEXT[];

-- ============================================================
-- 2. ENHANCE service_listings TABLE
-- ============================================================

-- Add service type specificity
ALTER TABLE public.service_listings
ADD COLUMN IF NOT EXISTS service_type TEXT CHECK (service_type IN ('appointment', 'hourly', 'project', 'consultation')),
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER,
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT TRUE;

-- ============================================================
-- 3. ENHANCE service_bookings TABLE
-- ============================================================

-- Add comprehensive booking fields
ALTER TABLE public.service_bookings
ADD COLUMN IF NOT EXISTS start_time TIME,
ADD COLUMN IF NOT EXISTS end_time TIME,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS customer_notes TEXT,
ADD COLUMN IF NOT EXISTS provider_notes TEXT,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- Add payment tracking
ALTER TABLE public.service_bookings
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'deposit_paid', 'paid', 'refunded', 'disputed')),
ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS escrow_status TEXT DEFAULT 'none' CHECK (escrow_status IN ('none', 'held', 'released', 'refunded'));

-- ============================================================
-- 4. CREATE service_availability TABLE (Detailed)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.service_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.service_listings(id) ON DELETE CASCADE,
  
  -- Day of week (0=Sunday, 6=Saturday)
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  
  -- Time slots
  start_time TIME NOT NULL,
  end_time NOT NULL,
  slot_duration_minutes INTEGER DEFAULT 30,
  
  -- Availability type
  is_active BOOLEAN DEFAULT TRUE,
  is_recurring BOOLEAN DEFAULT TRUE, -- If false, applies only to specific date
  
  -- Specific date (for one-off availability)
  specific_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent double booking
  UNIQUE(provider_id, day_of_week, start_time, specific_date)
);

CREATE INDEX idx_service_availability_provider ON public.service_availability(provider_id);
CREATE INDEX idx_service_availability_date ON public.service_availability(specific_date);

-- ============================================================
-- 5. CREATE service_reviews TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.service_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.service_bookings(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.service_listings(id) ON DELETE SET NULL,
  
  -- Ratings
  overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  communication_rating INTEGER CHECK (communication_rating BETWEEN 1 AND 5),
  quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
  value_rating INTEGER CHECK (value_rating BETWEEN 1 AND 5),
  
  -- Review content
  title TEXT,
  comment TEXT NOT NULL,
  
  -- Provider response
  provider_response TEXT,
  provider_responded_at TIMESTAMPTZ,
  
  -- Moderation
  is_visible BOOLEAN DEFAULT TRUE,
  is_verified_booking BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One review per booking
  UNIQUE(booking_id)
);

CREATE INDEX idx_service_reviews_provider ON public.service_reviews(provider_id);
CREATE INDEX idx_service_reviews_customer ON public.service_reviews(customer_id);
CREATE INDEX idx_service_reviews_listing ON public.service_reviews(listing_id);

-- ============================================================
-- 6. CREATE provider_wallets TABLE (For Escrow)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.provider_wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  
  -- Balance
  available_balance DECIMAL(10,2) DEFAULT 0.00,
  pending_balance DECIMAL(10,2) DEFAULT 0.00, -- Funds in escrow
  total_earnings DECIMAL(10,2) DEFAULT 0.00,
  
  -- Payout info
  payout_method TEXT, -- 'bank_transfer', 'fawry', 'stripe'
  payout_account_details JSONB,
  minimum_payout DECIMAL(10,2) DEFAULT 50.00,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(provider_id)
);

CREATE INDEX idx_provider_wallets_provider ON public.provider_wallets(provider_id);

-- ============================================================
-- 7. CREATE wallet_transactions TABLE (Escrow Tracking)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES public.provider_wallets(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.service_bookings(id),
  
  -- Transaction details
  type TEXT NOT NULL CHECK (type IN ('booking_payment', 'escrow_hold', 'escrow_release', 'refund', 'payout', 'adjustment')),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'EGP',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  
  -- Escrow specific
  escrow_status TEXT DEFAULT 'none' CHECK (escrow_status IN ('none', 'held', 'released', 'refunded')),
  held_until TIMESTAMPTZ, -- When escrow will be released
  
  -- Metadata
  description TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX idx_wallet_transactions_wallet ON public.wallet_transactions(wallet_id);
CREATE INDEX idx_wallet_transactions_booking ON public.wallet_transactions(booking_id);
CREATE INDEX idx_wallet_transactions_type ON public.wallet_transactions(type);

-- ============================================================
-- 8. CREATE FUNCTIONS & TRIGGERS
-- ============================================================

-- Function: Prevent double booking
CREATE OR REPLACE FUNCTION public.check_booking_conflict()
RETURNS TRIGGER AS $$
DECLARE
  conflict_count INTEGER;
BEGIN
  -- Check for overlapping time slots
  SELECT COUNT(*) INTO conflict_count
  FROM public.service_bookings
  WHERE provider_id = NEW.provider_id
    AND status NOT IN ('cancelled', 'disputed')
    AND (
      (NEW.start_time, NEW.end_time) OVERLAPS (start_time, end_time)
      OR (start_time, end_time) OVERLAPS (NEW.start_time, NEW.end_time)
    )
    AND (NEW.specific_date IS NULL OR specific_date = NEW.specific_date OR DATE(NEW.start_time) = DATE(start_time));
  
  IF conflict_count > 0 THEN
    RAISE EXCEPTION 'Time slot conflict: Provider already has a booking at this time';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Check conflicts before booking insert
DROP TRIGGER IF EXISTS trigger_check_booking_conflict ON public.service_bookings;
CREATE CONSTRAINT TRIGGER trigger_check_booking_conflict
AFTER INSERT ON public.service_bookings
FOR EACH ROW
EXECUTE FUNCTION public.check_booking_conflict();

-- Function: Update provider rating after review
CREATE OR REPLACE FUNCTION public.update_provider_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.is_visible = TRUE) THEN
    UPDATE public.service_providers
    SET rating_avg = (
      SELECT AVG(overall_rating)
      FROM public.service_reviews
      WHERE provider_id = NEW.provider_id
      AND is_visible = TRUE
    )
    WHERE id = NEW.provider_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update rating after review
DROP TRIGGER IF EXISTS trigger_update_provider_rating ON public.service_reviews;
CREATE TRIGGER trigger_update_provider_rating
AFTER INSERT OR UPDATE ON public.service_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_provider_rating();

-- Function: Release escrow funds
CREATE OR REPLACE FUNCTION public.release_escrow_funds(p_booking_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_booking RECORD;
  v_wallet_id UUID;
BEGIN
  -- Get booking details
  SELECT * INTO v_booking
  FROM public.service_bookings
  WHERE id = p_booking_id;
  
  IF v_booking IS NULL THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;
  
  IF v_booking.escrow_status != 'held' THEN
    RAISE EXCEPTION 'No escrow funds held for this booking';
  END IF;
  
  -- Get provider wallet
  SELECT id INTO v_wallet_id
  FROM public.provider_wallets
  WHERE provider_id = v_booking.provider_id;
  
  IF v_wallet_id IS NULL THEN
    -- Create wallet if doesn't exist
    INSERT INTO public.provider_wallets (provider_id)
    VALUES (v_booking.provider_id)
    RETURNING id INTO v_wallet_id;
  END IF;
  
  -- Update wallet balances
  UPDATE public.provider_wallets
  SET 
    available_balance = available_balance + v_booking.total_price,
    pending_balance = pending_balance - v_booking.total_price
  WHERE id = v_wallet_id;
  
  -- Update booking
  UPDATE public.service_bookings
  SET escrow_status = 'released'
  WHERE id = p_booking_id;
  
  -- Record transaction
  INSERT INTO public.wallet_transactions (
    wallet_id, booking_id, type, amount, status, escrow_status, description
  ) VALUES (
    v_wallet_id, p_booking_id, 'escrow_release', v_booking.total_price, 'completed', 'released', 'Escrow released for booking'
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Hold escrow funds
CREATE OR REPLACE FUNCTION public.hold_escrow_funds(p_booking_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_booking RECORD;
  v_wallet_id UUID;
BEGIN
  -- Get booking details
  SELECT * INTO v_booking
  FROM public.service_bookings
  WHERE id = p_booking_id;
  
  IF v_booking IS NULL THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;
  
  -- Get provider wallet
  SELECT id INTO v_wallet_id
  FROM public.provider_wallets
  WHERE provider_id = v_booking.provider_id;
  
  IF v_wallet_id IS NULL THEN
    INSERT INTO public.provider_wallets (provider_id)
    VALUES (v_booking.provider_id)
    RETURNING id INTO v_wallet_id;
  END IF;
  
  -- Update wallet balances
  UPDATE public.provider_wallets
  SET 
    pending_balance = pending_balance + v_booking.total_price
  WHERE id = v_wallet_id;
  
  -- Update booking
  UPDATE public.service_bookings
  SET escrow_status = 'held', payment_status = 'paid'
  WHERE id = p_booking_id;
  
  -- Record transaction
  INSERT INTO public.wallet_transactions (
    wallet_id, booking_id, type, amount, status, escrow_status, held_until, description
  ) VALUES (
    v_wallet_id, p_booking_id, 'escrow_hold', v_booking.total_price, 'completed', 'held', 
    NOW() + INTERVAL '7 days', 'Escrow held for booking'
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 9. RLS POLICIES
-- ============================================================

-- Enable RLS
ALTER TABLE public.service_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Service Availability Policies
CREATE POLICY "availability_public_view" ON public.service_availability
  FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY "availability_provider_manage" ON public.service_availability
  FOR ALL TO authenticated
  USING (
    provider_id IN (
      SELECT id FROM public.service_providers WHERE user_id = auth.uid()
    )
  );

-- Service Reviews Policies
CREATE POLICY "reviews_public_view" ON public.service_reviews
  FOR SELECT TO authenticated
  USING (is_visible = TRUE);

CREATE POLICY "reviews_customer_insert" ON public.service_reviews
  FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "reviews_provider_respond" ON public.service_reviews
  FOR UPDATE TO authenticated
  USING (
    provider_id IN (
      SELECT id FROM public.service_providers WHERE user_id = auth.uid()
    )
  );

-- Provider Wallets Policies
CREATE POLICY "wallets_provider_view" ON public.provider_wallets
  FOR SELECT TO authenticated
  USING (
    provider_id IN (
      SELECT id FROM public.service_providers WHERE user_id = auth.uid()
    )
  );

-- Wallet Transactions Policies
CREATE POLICY "transactions_provider_view" ON public.wallet_transactions
  FOR SELECT TO authenticated
  USING (
    wallet_id IN (
      SELECT id FROM public.provider_wallets WHERE provider_id IN (
        SELECT id FROM public.service_providers WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================
-- 10. SEED DATA: Create default wallet for existing providers
-- ============================================================

INSERT INTO public.provider_wallets (provider_id, available_balance, pending_balance)
SELECT id, 0, 0
FROM public.service_providers
ON CONFLICT (provider_id) DO NOTHING;

-- ============================================================
-- Migration Complete!
-- ============================================================
