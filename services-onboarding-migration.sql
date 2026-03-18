-- ============================================================
-- Services Onboarding - Enhanced service_providers Schema
-- Adds support for different provider types with specific fields
-- ============================================================

-- ============================================================
-- 1. ENSURE service_providers HAS ALL REQUIRED COLUMNS
-- ============================================================

-- Add provider_type if missing
ALTER TABLE public.service_providers
ADD COLUMN IF NOT EXISTS provider_type TEXT CHECK (provider_type IN ('individual', 'company', 'health_provider', 'hospital'));

-- Add verification fields
ALTER TABLE public.service_providers
ADD COLUMN IF NOT EXISTS license_number TEXT,
ADD COLUMN IF NOT EXISTS tax_id TEXT,
ADD COLUMN IF NOT EXISTS specialization TEXT,
ADD COLUMN IF NOT EXISTS company_registration_doc TEXT,
ADD COLUMN IF NOT EXISTS medical_license_doc TEXT;

-- Add metadata for flexible storage
ALTER TABLE public.service_providers
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add engagement models (for different service types)
ALTER TABLE public.service_providers
ADD COLUMN IF NOT EXISTS engagement_models TEXT[];

-- Add hourly rate for freelancers
ALTER TABLE public.service_providers
ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2);

-- Add skills array for freelancers
ALTER TABLE public.service_providers
ADD COLUMN IF NOT EXISTS skills TEXT[];

-- ============================================================
-- 2. ADD INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_service_providers_type ON public.service_providers(provider_type);
CREATE INDEX IF NOT EXISTS idx_service_providers_status ON public.service_providers(status);
CREATE INDEX IF NOT EXISTS idx_service_providers_verified ON public.service_providers(is_verified);
CREATE INDEX IF NOT EXISTS idx_service_providers_metadata ON public.service_providers USING GIN(metadata);

-- ============================================================
-- 3. UPDATE RLS POLICIES
-- ============================================================

-- Drop existing policies
DROP POLICY IF EXISTS "users_insert_own_provider_profile" ON public.service_providers;
DROP POLICY IF EXISTS "providers_insert_own" ON public.service_providers;

-- Add new insert policy
CREATE POLICY "users_insert_own_provider_profile" ON public.service_providers
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Ensure update policy exists
DROP POLICY IF EXISTS "providers_update_own" ON public.service_providers;
CREATE POLICY "providers_update_own" ON public.service_providers
FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- ============================================================
-- 4. CREATE PROVIDER TYPES ENUM (Optional, for stricter typing)
-- ============================================================

-- If you want to use PostgreSQL enums instead of TEXT CHECK:
-- DROP TYPE IF EXISTS public.provider_type_enum CASCADE;
-- CREATE TYPE public.provider_type_enum AS ENUM ('individual', 'company', 'health_provider', 'hospital');
-- ALTER TABLE public.service_providers 
--   ALTER COLUMN provider_type TYPE public.provider_type_enum 
--   USING provider_type::public.provider_type_enum;

-- ============================================================
-- 5. SEED DATA: Update existing providers if needed
-- ============================================================

-- Set default provider_type for existing records
UPDATE public.service_providers
SET provider_type = 'individual'
WHERE provider_type IS NULL;

-- ============================================================
-- Migration Complete!
-- ============================================================

-- Verify columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'service_providers'
ORDER BY ordinal_position;
