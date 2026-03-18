-- ============================================================
-- Services Marketplace Evolution - Database Migration
-- Professional & Freelance Ecosystem
-- ============================================================

-- Step 1: Create Enums for Provider Categories and Engagement Models
-- ============================================================

DROP TYPE IF EXISTS public.provider_category CASCADE;
CREATE TYPE public.provider_category AS ENUM (
  'health',          -- Doctors, Hospitals, Clinics
  'freelance',       -- Developers, Designers, Translators
  'home_service',    -- Plumbers, Electricians
  'professional',    -- Lawyers, Consultants
  'education'        -- Tutors, Trainers
);

DROP TYPE IF EXISTS public.engagement_model CASCADE;
CREATE TYPE public.engagement_model AS ENUM (
  'online_only',     -- Video call/Chat (Telemedicine, Remote Work)
  'offline_only',    -- Physical location only
  'hybrid',          -- Both
  'project_based',   -- Fixed price for a deliverable (Freelance)
  'hourly'          -- Pay per hour (Freelance)
);

-- Step 2: Update service_providers table (Enhanced)
-- ============================================================

DROP TABLE IF EXISTS public.service_providers CASCADE;

CREATE TABLE public.service_providers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Core Identity
  provider_type provider_category NOT NULL,
  business_name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  
  -- Engagement Models (Array to support multiple)
  engagement_models engagement_model[] NOT NULL,
  
  -- Flexible Metadata based on provider type
  -- For Health: license_number, specialization, hospital_affiliation
  -- For Freelance: skills[], hourly_rate, portfolio_url
  metadata JSONB DEFAULT '{}'::jsonb, 
  
  -- Location (Nullable for online-only freelancers)
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  address_line1 TEXT,
  city TEXT,
  country TEXT DEFAULT 'EG',
  
  -- Verification
  is_verified BOOLEAN DEFAULT FALSE,
  verification_documents TEXT[],
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
  
  -- Metrics
  rating_avg DECIMAL(3,2) DEFAULT 0.00,
  total_jobs INTEGER DEFAULT 0,
  total_hours_worked INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_provider_user UNIQUE (user_id)
);

-- Step 3: Update service_listings for Freelance Projects
-- ============================================================

DROP TABLE IF EXISTS public.service_listings CASCADE;

CREATE TABLE public.service_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category_slug TEXT NOT NULL,
  
  -- Pricing Logic
  pricing_type TEXT NOT NULL CHECK (pricing_type IN ('fixed', 'hourly', 'consultation')),
  price NUMERIC(10,2),
  currency TEXT DEFAULT 'EGP',
  
  -- Delivery/Duration
  estimated_duration_hours INTEGER,
  delivery_days INTEGER,
  
  -- Scope
  is_remote_allowed BOOLEAN DEFAULT TRUE,
  requires_physical_presence BOOLEAN DEFAULT FALSE,
  
  images JSONB DEFAULT '[]'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Update service_bookings for Projects & Appointments
-- ============================================================

DROP TABLE IF EXISTS public.service_bookings CASCADE;

CREATE TABLE public.service_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES public.service_listings(id) ON DELETE SET NULL,
  provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Type of Booking
  booking_type TEXT NOT NULL CHECK (booking_type IN ('appointment', 'project_contract')),
  
  -- Scheduling
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  
  -- Project Specifics (Freelance)
  project_title TEXT,
  project_description TEXT,
  agreed_price NUMERIC(10,2),
  milestone_data JSONB,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'disputed')),
  
  -- Interaction Mode
  interaction_mode TEXT CHECK (interaction_mode IN ('online', 'offline')),
  meeting_link TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 5: Create Indexes for Performance
-- ============================================================

CREATE INDEX idx_service_providers_user ON public.service_providers(user_id);
CREATE INDEX idx_service_providers_type ON public.service_providers(provider_type);
CREATE INDEX idx_service_providers_status ON public.service_providers(status);
CREATE INDEX idx_service_providers_location ON public.service_providers(latitude, longitude) WHERE latitude IS NOT NULL;

CREATE INDEX idx_service_listings_provider ON public.service_listings(provider_id);
CREATE INDEX idx_service_listings_category ON public.service_listings(category_slug);
CREATE INDEX idx_service_listings_active ON public.service_listings(is_active);

CREATE INDEX idx_service_bookings_provider ON public.service_bookings(provider_id);
CREATE INDEX idx_service_bookings_client ON public.service_bookings(client_id);
CREATE INDEX idx_service_bookings_status ON public.service_bookings(status);

-- Step 6: Enable RLS
-- ============================================================

ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS Policies
-- ============================================================

-- Providers: Anyone can view active providers
DROP POLICY IF EXISTS providers_public_view ON public.service_providers;
CREATE POLICY providers_public_view ON public.service_providers
  FOR SELECT TO authenticated
  USING (status = 'active');

-- Providers: Users can update their own profile
DROP POLICY IF EXISTS providers_update_own ON public.service_providers;
CREATE POLICY providers_update_own ON public.service_providers
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Providers: Users can insert their own profile
DROP POLICY IF EXISTS providers_insert_own ON public.service_providers;
CREATE POLICY providers_insert_own ON public.service_providers
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Listings: Anyone can view active listings
DROP POLICY IF EXISTS listings_public_view ON public.service_listings;
CREATE POLICY listings_public_view ON public.service_listings
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Listings: Providers can manage their own listings
DROP POLICY IF EXISTS listings_manage_own ON public.service_listings;
CREATE POLICY listings_manage_own ON public.service_listings
  FOR ALL TO authenticated
  USING (
    provider_id IN (
      SELECT id FROM public.service_providers 
      WHERE user_id = auth.uid()
    )
  );

-- Bookings: Clients can view their own bookings
DROP POLICY IF EXISTS bookings_client_view ON public.service_bookings;
CREATE POLICY bookings_client_view ON public.service_bookings
  FOR SELECT TO authenticated
  USING (auth.uid() = client_id);

-- Bookings: Providers can view bookings related to them
DROP POLICY IF EXISTS bookings_provider_view ON public.service_bookings;
CREATE POLICY bookings_provider_view ON public.service_bookings
  FOR SELECT TO authenticated
  USING (
    provider_id IN (
      SELECT id FROM public.service_providers 
      WHERE user_id = auth.uid()
    )
  );

-- Bookings: Clients can create bookings
DROP POLICY IF EXISTS bookings_client_insert ON public.service_bookings;
CREATE POLICY bookings_client_insert ON public.service_bookings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = client_id);

-- Bookings: Providers can update their bookings
DROP POLICY IF EXISTS bookings_provider_update ON public.service_bookings;
CREATE POLICY bookings_provider_update ON public.service_bookings
  FOR UPDATE TO authenticated
  USING (
    provider_id IN (
      SELECT id FROM public.service_providers 
      WHERE user_id = auth.uid()
    )
  );

-- Step 8: Verify Tables Created
-- ============================================================

SELECT 
  table_name,
  'Created' as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('service_providers', 'service_listings', 'service_bookings')
ORDER BY table_name;

-- ============================================================
-- Migration Complete!
-- Next: Build the Onboarding Wizard in React
-- ============================================================
