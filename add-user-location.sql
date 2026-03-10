-- Add geolocation fields to users table
-- Migration: Add latitude and longitude support for nearby features

-- Add location columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS latitude numeric(10, 8) NULL,
ADD COLUMN IF NOT EXISTS longitude numeric(11, 8) NULL;

-- Add index for geospatial queries (improves nearby search performance)
CREATE INDEX IF NOT EXISTS idx_users_location 
ON users (latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Add RLS policy to allow users to update their own location
-- (Assuming RLS is already enabled on users table)
DROP POLICY IF EXISTS "Users can update own location" ON users;
CREATE POLICY "Users can update own location"
ON users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow users to read their own location
DROP POLICY IF EXISTS "Users can read own location" ON users;
CREATE POLICY "Users can read own location"
ON users
FOR SELECT
USING (auth.uid() = id);

-- Optional: Create a function to calculate distance between two points
-- (Already exists as haversine_distance, but adding alias for clarity)
CREATE OR REPLACE FUNCTION calculate_user_distance(
  lat1 numeric,
  lon1 numeric,
  lat2 numeric,
  lon2 numeric
) RETURNS numeric AS $$
BEGIN
  RETURN ROUND(
    6371 * 2 * ASIN(SQRT(
      POWER(SIN((lat1 - lat2) * PI() / 360), 2) +
      COS(lat1 * PI() / 180) * COS(lat2 * PI() / 180) *
      POWER(SIN((lon1 - lon2) * PI() / 360), 2)
    ))
  , 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create a view for users with locations (for nearby searches)
CREATE OR REPLACE VIEW users_with_location AS
SELECT 
  id,
  email,
  full_name,
  avatar_url,
  phone,
  latitude,
  longitude,
  created_at,
  updated_at
FROM users
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Grant access to authenticated users
GRANT SELECT ON users_with_location TO authenticated;

COMMENT ON COLUMN users.latitude IS 'User latitude for geolocation features';
COMMENT ON COLUMN users.longitude IS 'User longitude for geolocation features';
COMMENT ON VIEW users_with_location IS 'Users who have set their location for nearby features';
