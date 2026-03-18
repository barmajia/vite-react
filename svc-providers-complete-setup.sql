-- ============================================================
-- Complete svc_providers Table Setup
-- This fixes the 406 error by creating the exact table structure
-- that your frontend (useAuth.tsx, ServicesHeader.tsx) expects
-- ============================================================

-- =============================================
-- STEP 1: Create svc_providers table
-- =============================================
CREATE TABLE IF NOT EXISTS public.svc_providers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Core fields expected by frontend
  provider_name TEXT NOT NULL,
  logo_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  
  -- Additional provider fields
  business_name TEXT,
  tagline TEXT,
  description TEXT,
  cover_image_url TEXT,
  
  -- Contact information
  phone VARCHAR(20),
  email TEXT,
  website TEXT,
  
  -- Location
  location_city TEXT,
  location_country TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Provider classification
  provider_type TEXT CHECK (provider_type IN ('individual', 'company', 'freelance', 'health_provider', 'hospital')),
  
  -- Business metrics
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  review_count INTEGER DEFAULT 0,
  total_jobs_completed INTEGER DEFAULT 0,
  
  -- Operational status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'pending_review', 'active', 'inactive', 'suspended', 'rejected')),
  
  -- Extended fields for services marketplace
  specialties TEXT[],
  license_number TEXT,
  certification_urls TEXT[],
  verification_documents TEXT[],
  availability JSONB DEFAULT '{}',
  blocked_dates DATE[],
  engagement_models TEXT[],
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_svc_provider_user UNIQUE (user_id)
);

-- =============================================
-- STEP 2: Create Indexes
-- =============================================
CREATE INDEX IF NOT EXISTS idx_svc_providers_user ON public.svc_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_svc_providers_status ON public.svc_providers(status);
CREATE INDEX IF NOT EXISTS idx_svc_providers_type ON public.svc_providers(provider_type);
CREATE INDEX IF NOT EXISTS idx_svc_providers_verified ON public.svc_providers(is_verified);
CREATE INDEX IF NOT EXISTS idx_svc_providers_rating ON public.svc_providers(average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_svc_providers_location ON public.svc_providers(location_city, location_country);

-- =============================================
-- STEP 3: Enable RLS
-- =============================================
ALTER TABLE public.svc_providers ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 4: Drop existing policies (if any)
-- =============================================
DROP POLICY IF EXISTS "users_view_own_svc_provider" ON public.svc_providers;
DROP POLICY IF EXISTS "users_insert_own_svc_provider" ON public.svc_providers;
DROP POLICY IF EXISTS "users_update_own_svc_provider" ON public.svc_providers;
DROP POLICY IF EXISTS "users_delete_own_svc_provider" ON public.svc_providers;
DROP POLICY IF EXISTS "public_view_active_svc_providers" ON public.svc_providers;

-- =============================================
-- STEP 5: Create RLS Policies
-- =============================================

-- Policy: Anyone can view active/verified providers
CREATE POLICY "public_view_active_svc_providers" ON public.svc_providers
FOR SELECT TO authenticated, anon
USING (status = 'active' OR is_verified = TRUE);

-- Policy: Users can view their own provider profile (regardless of status)
CREATE POLICY "users_view_own_svc_provider" ON public.svc_providers
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can insert their own provider profile
CREATE POLICY "users_insert_own_svc_provider" ON public.svc_providers
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own provider profile
CREATE POLICY "users_update_own_svc_provider" ON public.svc_providers
FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can delete their own provider profile
CREATE POLICY "users_delete_own_svc_provider" ON public.svc_providers
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- =============================================
-- STEP 6: Create updated_at trigger
-- =============================================
CREATE OR REPLACE FUNCTION public.update_svc_providers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_svc_providers_updated_at ON public.svc_providers;
CREATE TRIGGER update_svc_providers_updated_at
    BEFORE UPDATE ON public.svc_providers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_svc_providers_updated_at();

-- =============================================
-- STEP 7: Create provider_wallets table (for escrow)
-- =============================================
CREATE TABLE IF NOT EXISTS public.provider_wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.svc_providers(id) ON DELETE CASCADE,

  -- Balance
  available_balance DECIMAL(10,2) DEFAULT 0.00,
  pending_balance DECIMAL(10,2) DEFAULT 0.00,
  total_earnings DECIMAL(10,2) DEFAULT 0.00,

  -- Payout info
  payout_method TEXT,
  payout_account_details JSONB,
  minimum_payout DECIMAL(10,2) DEFAULT 50.00,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(provider_id)
);

CREATE INDEX IF NOT EXISTS idx_provider_wallets_provider ON public.provider_wallets(provider_id);

-- Enable RLS
ALTER TABLE public.provider_wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wallets_provider_view" ON public.provider_wallets;
CREATE POLICY "wallets_provider_view" ON public.provider_wallets
FOR SELECT TO authenticated
USING (
  provider_id IN (
    SELECT id FROM public.svc_providers WHERE user_id = auth.uid()
  )
);

-- =============================================
-- STEP 8: Create wallet_transactions table
-- =============================================
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES public.provider_wallets(id) ON DELETE CASCADE,
  booking_id UUID,

  type TEXT NOT NULL CHECK (type IN ('booking_payment', 'escrow_hold', 'escrow_release', 'refund', 'payout', 'adjustment')),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'EGP',

  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  escrow_status TEXT DEFAULT 'none' CHECK (escrow_status IN ('none', 'held', 'released', 'refunded')),
  held_until TIMESTAMPTZ,

  description TEXT,
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet ON public.wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_booking ON public.wallet_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON public.wallet_transactions(type);

-- Enable RLS
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transactions_provider_view" ON public.wallet_transactions;
CREATE POLICY "transactions_provider_view" ON public.wallet_transactions
FOR SELECT TO authenticated
USING (
  wallet_id IN (
    SELECT id FROM public.provider_wallets WHERE provider_id IN (
      SELECT id FROM public.svc_providers WHERE user_id = auth.uid()
    )
  )
);

-- =============================================
-- STEP 9: Create service_reviews table
-- =============================================
CREATE TABLE IF NOT EXISTS public.service_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL,
  provider_id UUID NOT NULL REFERENCES public.svc_providers(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID,

  overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  communication_rating INTEGER CHECK (communication_rating BETWEEN 1 AND 5),
  quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
  value_rating INTEGER CHECK (value_rating BETWEEN 1 AND 5),

  title TEXT,
  comment TEXT NOT NULL,

  provider_response TEXT,
  provider_responded_at TIMESTAMPTZ,

  is_visible BOOLEAN DEFAULT TRUE,
  is_verified_booking BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(booking_id)
);

CREATE INDEX IF NOT EXISTS idx_service_reviews_provider ON public.service_reviews(provider_id);
CREATE INDEX IF NOT EXISTS idx_service_reviews_customer ON public.service_reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_reviews_listing ON public.service_reviews(listing_id);

-- Enable RLS
ALTER TABLE public.service_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_public_view" ON public.service_reviews;
CREATE POLICY "reviews_public_view" ON public.service_reviews
FOR SELECT TO authenticated, anon
USING (is_visible = TRUE);

DROP POLICY IF EXISTS "reviews_customer_insert" ON public.service_reviews;
CREATE POLICY "reviews_customer_insert" ON public.service_reviews
FOR INSERT TO authenticated
WITH CHECK (customer_id = auth.uid());

DROP POLICY IF EXISTS "reviews_provider_respond" ON public.service_reviews;
CREATE POLICY "reviews_provider_respond" ON public.service_reviews
FOR UPDATE TO authenticated
USING (
  provider_id IN (
    SELECT id FROM public.svc_providers WHERE user_id = auth.uid()
  )
);

-- =============================================
-- STEP 10: Create function to update provider rating
-- =============================================
CREATE OR REPLACE FUNCTION public.update_provider_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.is_visible = TRUE THEN
    UPDATE public.svc_providers
    SET
      average_rating = COALESCE((
        SELECT AVG(overall_rating)
        FROM public.service_reviews
        WHERE provider_id = NEW.provider_id
        AND is_visible = TRUE
      ), 0),
      review_count = (
        SELECT COUNT(*)
        FROM public.service_reviews
        WHERE provider_id = NEW.provider_id
        AND is_visible = TRUE
      )
    WHERE id = NEW.provider_id;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.svc_providers
    SET
      average_rating = COALESCE((
        SELECT AVG(overall_rating)
        FROM public.service_reviews
        WHERE provider_id = NEW.provider_id
        AND is_visible = TRUE
      ), 0),
      review_count = (
        SELECT COUNT(*)
        FROM public.service_reviews
        WHERE provider_id = NEW.provider_id
        AND is_visible = TRUE
      )
    WHERE id = NEW.provider_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_provider_rating ON public.service_reviews;
CREATE TRIGGER trigger_update_provider_rating
AFTER INSERT OR UPDATE ON public.service_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_provider_rating();

-- =============================================
-- STEP 11: Create default wallets for existing providers
-- =============================================
INSERT INTO public.provider_wallets (provider_id, available_balance, pending_balance)
SELECT id, 0, 0
FROM public.svc_providers
ON CONFLICT (provider_id) DO NOTHING;

-- =============================================
-- STEP 12: Verification queries
-- =============================================
SELECT
    'svc_providers table setup complete' as status,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'svc_providers') as columns_count,
    (SELECT COUNT(*) FROM svc_providers) as providers_count;

-- Show all columns
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'svc_providers'
ORDER BY ordinal_position;

-- Show all policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'svc_providers';

-- ============================================================
-- Migration Complete!
-- The 406 error should now be resolved.
-- ============================================================
