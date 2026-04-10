-- Add settings and customers columns to shops table (for Sellers)
ALTER TABLE shops 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{"theme": "default", "notifications": true, "currency": "USD"}'::jsonb,
ADD COLUMN IF NOT EXISTS customers JSONB DEFAULT '[]'::jsonb;

-- Add settings and customers columns to factory_profiles table
ALTER TABLE factory_profiles 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{"production_capacity": 0, "lead_time_days": 7, "notifications": true}'::jsonb,
ADD COLUMN IF NOT EXISTS customers JSONB DEFAULT '[]'::jsonb;

-- Add settings and customers columns to middleman_profiles table
ALTER TABLE middleman_profiles 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{"commission_rate": 0.05, "specialties": [], "notifications": true}'::jsonb,
ADD COLUMN IF NOT EXISTS customers JSONB DEFAULT '[]'::jsonb;

-- Create index for faster JSONB queries if needed
CREATE INDEX IF NOT EXISTS idx_shops_settings ON shops USING GIN (settings);
CREATE INDEX IF NOT EXISTS idx_shops_customers ON shops USING GIN (customers);
CREATE INDEX IF NOT EXISTS idx_factory_profiles_settings ON factory_profiles USING GIN (settings);
CREATE INDEX IF NOT EXISTS idx_factory_profiles_customers ON factory_profiles USING GIN (customers);
CREATE INDEX IF NOT EXISTS idx_middleman_profiles_settings ON middleman_profiles USING GIN (settings);
CREATE INDEX IF NOT EXISTS idx_middleman_profiles_customers ON middleman_profiles USING GIN (customers);
