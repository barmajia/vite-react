-- ================================================================
-- AURORA ECOMMERCE: SERVICES & HEALTHCARE MODULE MIGRATION
-- Covers: Freelancers, Hospitals, Pharmacies, Clinics, Health Services
-- ================================================================

-- 1. FREELANCER MODULE
-- ------------------------------------------------------------

-- Freelancer Profiles
CREATE TABLE IF NOT EXISTS freelancer_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    professional_title TEXT,
    bio TEXT,
    hourly_rate DECIMAL(10, 2),
    skills TEXT[], -- Array of skills
    portfolio_url TEXT,
    availability_status TEXT DEFAULT 'available', -- available, busy, unavailable
    rating_avg DECIMAL(3, 2) DEFAULT 0,
    total_jobs INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Freelancer Services/Gigs
CREATE TABLE IF NOT EXISTS freelancer_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES freelancer_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT, -- Design, Development, Writing, etc.
    price DECIMAL(10, 2),
    delivery_days INTEGER,
    images TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Freelancer Orders
CREATE TABLE IF NOT EXISTS freelancer_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES freelancer_services(id),
    client_id UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'pending', -- pending, in_progress, completed, cancelled
    total_amount DECIMAL(10, 2),
    commission_amount DECIMAL(10, 2),
    requirements TEXT,
    delivery_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. HEALTHCARE MODULE (Hospitals, Clinics, Doctors)
-- ------------------------------------------------------------

-- Healthcare Provider Profiles (Hospitals, Clinics, Private Practices)
CREATE TABLE IF NOT EXISTS healthcare_provider_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    provider_type TEXT NOT NULL, -- hospital, clinic, private_practice, pharmacy
    name TEXT NOT NULL,
    license_number TEXT,
    address TEXT,
    city TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    description TEXT,
    operating_hours JSONB, -- { "monday": "9-5", ... }
    emergency_services BOOLEAN DEFAULT false,
    rating_avg DECIMAL(3, 2) DEFAULT 0,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Doctors/Staff associated with providers
CREATE TABLE IF NOT EXISTS medical_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES healthcare_provider_profiles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    full_name TEXT NOT NULL,
    specialization TEXT, -- Cardiology, Pediatrics, etc.
    title TEXT, -- Dr., Prof., etc.
    qualifications TEXT[],
    experience_years INTEGER,
    consultation_fee DECIMAL(10, 2),
    is_available BOOLEAN DEFAULT true,
    schedule JSONB, -- Available slots
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PHARMACY MODULE
-- ------------------------------------------------------------

-- Pharmacy Specific Details (extends healthcare_provider_profiles)
CREATE TABLE IF NOT EXISTS pharmacy_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID UNIQUE REFERENCES healthcare_provider_profiles(id) ON DELETE CASCADE,
    license_number TEXT,
    pharmacist_name TEXT,
    delivery_available BOOLEAN DEFAULT true,
    prescription_required BOOLEAN DEFAULT true,
    insurance_accepted TEXT[],
    operating_24_7 BOOLEAN DEFAULT false
);

-- Medicines/Products Inventory
CREATE TABLE IF NOT EXISTS pharmacy_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacy_id UUID REFERENCES healthcare_provider_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    generic_name TEXT,
    category TEXT, -- Prescription, OTC, Supplements
    price DECIMAL(10, 2),
    stock_quantity INTEGER,
    requires_prescription BOOLEAN DEFAULT true,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. APPOINTMENTS & BOOKINGS (Unified for Health & Freelancers)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS service_appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_type TEXT NOT NULL, -- medical_consultation, freelance_service, pharmacy_pickup
    provider_id UUID NOT NULL, -- Links to freelancer_profiles or healthcare_provider_profiles
    provider_type TEXT NOT NULL, -- freelancer, hospital, pharmacy
    client_id UUID REFERENCES auth.users(id),
    staff_id UUID REFERENCES medical_staff(id), -- Optional, for specific doctor
    service_id UUID, -- Links to freelancer_services or pharmacy_products
    scheduled_time TIMESTAMPTZ,
    duration_minutes INTEGER,
    status TEXT DEFAULT 'pending', -- pending, confirmed, completed, cancelled, no_show
    notes TEXT,
    prescription_url TEXT, -- For medical appointments
    total_price DECIMAL(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SETTINGS & CUSTOMERS (JSONB Storage)
-- ------------------------------------------------------------

-- Add settings and customers columns to new profile tables if not exists
ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';
ALTER TABLE freelancer_profiles ADD COLUMN IF NOT EXISTS customers JSONB DEFAULT '[]';

ALTER TABLE healthcare_provider_profiles ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';
ALTER TABLE healthcare_provider_profiles ADD COLUMN IF NOT EXISTS customers JSONB DEFAULT '[]';

-- 6. VIEWS FOR DASHBOARD STATS
-- ------------------------------------------------------------

-- Freelancer Stats View
CREATE OR REPLACE VIEW freelancer_stats AS
SELECT 
    fp.id,
    fp.full_name,
    COUNT(DISTINCT fo.id) as total_orders,
    COALESCE(SUM(fo.total_amount), 0) as total_revenue,
    COALESCE(AVG(fo.total_amount), 0) as avg_order_value,
    COUNT(CASE WHEN fo.status = 'completed' THEN 1 END) as completed_orders,
    COUNT(CASE WHEN fo.status = 'pending' THEN 1 END) as pending_orders
FROM freelancer_profiles fp
LEFT JOIN freelancer_services fs ON fp.id = fs.provider_id
LEFT JOIN freelancer_orders fo ON fs.id = fo.service_id
GROUP BY fp.id, fp.full_name;

-- Healthcare Provider Stats View
CREATE OR REPLACE VIEW healthcare_provider_stats AS
SELECT 
    hp.id,
    hp.name,
    hp.provider_type,
    COUNT(DISTINCT sa.id) as total_appointments,
    COALESCE(SUM(sa.total_price), 0) as total_revenue,
    COUNT(CASE WHEN sa.status = 'confirmed' THEN 1 END) as upcoming_appointments,
    COUNT(CASE WHEN sa.status = 'completed' THEN 1 END) as completed_appointments
FROM healthcare_provider_profiles hp
LEFT JOIN service_appointments sa ON hp.id = sa.provider_id
GROUP BY hp.id, hp.name, hp.provider_type;

-- 7. INDEXES FOR PERFORMANCE
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_freelancer_skills ON freelancer_profiles USING GIN(skills);
CREATE INDEX IF NOT EXISTS idx_healthcare_type ON healthcare_provider_profiles(provider_type);
CREATE INDEX IF NOT EXISTS idx_appointments_time ON service_appointments(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON service_appointments(status);

-- 8. INITIAL DATA SEEDING (Optional - Remove in production if not needed)
-- ------------------------------------------------------------
-- No seed data added to keep clean state for new users

COMMENT ON TABLE freelancer_profiles IS 'Profiles for independent contractors and gig workers';
COMMENT ON TABLE healthcare_provider_profiles IS 'Profiles for hospitals, clinics, and medical centers';
COMMENT ON TABLE pharmacy_details IS 'Extended details for pharmacy operations';
COMMENT ON TABLE service_appointments IS 'Unified booking system for all service types';
