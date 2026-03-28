-- ============================================
-- Services Marketplace Tables Migration
-- ============================================

-- 1. Service Categories
CREATE TABLE IF NOT EXISTS public.svc_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Service Providers (extends sellers or standalone)
CREATE TABLE IF NOT EXISTS public.svc_providers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider_name TEXT NOT NULL,
  slug TEXT UNIQUE,
  bio TEXT,
  logo_url TEXT,
  location TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Service Listings
CREATE TABLE IF NOT EXISTS public.svc_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES public.svc_providers(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.svc_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price NUMERIC(10,2),
  price_type TEXT CHECK (price_type IN ('fixed', 'hourly', 'project', 'custom')),
  currency TEXT DEFAULT 'USD',
  image_url TEXT,
  gallery_urls JSONB DEFAULT '[]'::jsonb,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Service Reviews
CREATE TABLE IF NOT EXISTS public.svc_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES public.svc_listings(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(listing_id, reviewer_id)
);

-- 5. Service Bookings
CREATE TABLE IF NOT EXISTS public.svc_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES public.svc_listings(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  total_price NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_svc_listings_category ON public.svc_listings(category_id);
CREATE INDEX IF NOT EXISTS idx_svc_listings_provider ON public.svc_listings(provider_id);
CREATE INDEX IF NOT EXISTS idx_svc_listings_featured_active ON public.svc_listings(is_featured, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_svc_listings_created ON public.svc_listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_svc_providers_user ON public.svc_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_svc_reviews_listing ON public.svc_reviews(listing_id, is_approved);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================
ALTER TABLE public.svc_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.svc_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.svc_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.svc_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.svc_bookings ENABLE ROW LEVEL SECURITY;

-- Categories: Public read
CREATE POLICY IF NOT EXISTS "svc_categories_public_read" ON public.svc_categories
  FOR SELECT TO authenticated, anon USING (is_active = true);

-- Providers: Users manage own, public read verified
CREATE POLICY IF NOT EXISTS "svc_providers_self_manage" ON public.svc_providers
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "svc_providers_public_read" ON public.svc_providers
  FOR SELECT TO authenticated, anon USING (is_active = true);

-- Listings: Providers manage own, public read active
CREATE POLICY IF NOT EXISTS "svc_listings_provider_manage" ON public.svc_listings
  FOR ALL TO authenticated USING (provider_id IN (
    SELECT id FROM public.svc_providers WHERE user_id = auth.uid()
  )) WITH CHECK (provider_id IN (
    SELECT id FROM public.svc_providers WHERE user_id = auth.uid()
  ));

CREATE POLICY IF NOT EXISTS "svc_listings_public_read" ON public.svc_listings
  FOR SELECT TO authenticated, anon USING (is_active = true);

-- Reviews: Users manage own, public read approved
CREATE POLICY IF NOT EXISTS "svc_reviews_self_manage" ON public.svc_reviews
  FOR ALL TO authenticated USING (reviewer_id = auth.uid()) WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY IF NOT EXISTS "svc_reviews_public_read" ON public.svc_reviews
  FOR SELECT TO authenticated, anon USING (is_approved = true);

-- Bookings: Participants only
CREATE POLICY IF NOT EXISTS "svc_bookings_participant_access" ON public.svc_bookings
  FOR ALL TO authenticated USING (
    customer_id = auth.uid() OR 
    listing_id IN (
      SELECT id FROM public.svc_listings 
      WHERE provider_id IN (
        SELECT id FROM public.svc_providers WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================
-- Triggers for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.update_svc_timestamp() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_svc_categories_updated ON public.svc_categories;
CREATE TRIGGER trg_svc_categories_updated BEFORE UPDATE ON public.svc_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_svc_timestamp();

DROP TRIGGER IF EXISTS trg_svc_providers_updated ON public.svc_providers;
CREATE TRIGGER trg_svc_providers_updated BEFORE UPDATE ON public.svc_providers
  FOR EACH ROW EXECUTE FUNCTION public.update_svc_timestamp();

DROP TRIGGER IF EXISTS trg_svc_listings_updated ON public.svc_listings;
CREATE TRIGGER trg_svc_listings_updated BEFORE UPDATE ON public.svc_listings
  FOR EACH ROW EXECUTE FUNCTION public.update_svc_timestamp();

DROP TRIGGER IF EXISTS trg_svc_reviews_updated ON public.svc_reviews;
CREATE TRIGGER trg_svc_reviews_updated BEFORE UPDATE ON public.svc_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_svc_timestamp();

DROP TRIGGER IF EXISTS trg_svc_bookings_updated ON public.svc_bookings;
CREATE TRIGGER trg_svc_bookings_updated BEFORE UPDATE ON public.svc_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_svc_timestamp();

-- ============================================
-- Seed Sample Data
-- ============================================
INSERT INTO public.svc_categories (name, slug, description, icon, display_order) VALUES
  ('Programming & Tech', 'programming', 'Web development, mobile apps, AI & more', 'code', 1),
  ('Design & Creative', 'design', 'Logo design, UI/UX, video editing', 'palette', 2),
  ('Digital Marketing', 'marketing', 'SEO, social media, content strategy', 'sparkles', 3),
  ('Writing & Translation', 'writing', 'Copywriting, translation, proofreading', 'file-text', 4),
  ('Business & Consulting', 'business', 'Business plans, legal, financial advice', 'briefcase', 5),
  ('Health & Wellness', 'healthcare', 'Fitness coaching, nutrition, mental health', 'heart', 6)
ON CONFLICT (slug) DO NOTHING;
