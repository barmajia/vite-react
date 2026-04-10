-- Add name column to shops table for Seller Dashboard
-- This fixes the missing column error in SellerDashboard.tsx

ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS name TEXT;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_shops_owner_id ON public.shops(owner_id);

-- Update existing shops with a default name based on slug
UPDATE public.shops 
SET name = COALESCE(name, CONCAT('Shop ', slug))
WHERE name IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.shops.name IS 'Display name for the shop shown in dashboards and UI';
