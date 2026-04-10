-- Commission Rate System Migration
-- Adds commission rate management for sellers

-- 1. Add commission_rate column to users table (default rate for seller)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS default_commission_rate DECIMAL(5,2) DEFAULT 10.00;

-- 2. Add commission_rate to shops table (shop-specific override)
ALTER TABLE shops 
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT NULL;

-- 3. Add commission_rate to products table (product-specific override)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT NULL;

-- 4. Create commission_rates table for advanced rate management
CREATE TABLE IF NOT EXISTS commission_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rate_type VARCHAR(50) NOT NULL DEFAULT 'percentage', -- 'percentage' or 'fixed'
  rate_value DECIMAL(10,2) NOT NULL,
  applies_to VARCHAR(50) NOT NULL DEFAULT 'all', -- 'all', 'category', 'product', 'customer'
  target_id UUID, -- category_id, product_id, or customer_id
  min_order_value DECIMAL(10,2) DEFAULT 0,
  max_order_value DECIMAL(10,2) DEFAULT NULL,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0, -- Higher priority rates take precedence
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create commission_earnings table to track earned commissions
CREATE TABLE IF NOT EXISTS commission_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  customer_id UUID,
  base_amount DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  rate_type VARCHAR(50) DEFAULT 'percentage',
  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, paid, disputed
  payment_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create index for performance
CREATE INDEX IF NOT EXISTS idx_commission_rates_seller ON commission_rates(seller_id);
CREATE INDEX IF NOT EXISTS idx_commission_rates_active ON commission_rates(is_active);
CREATE INDEX IF NOT EXISTS idx_commission_earnings_seller ON commission_earnings(seller_id);
CREATE INDEX IF NOT EXISTS idx_commission_earnings_status ON commission_earnings(status);
CREATE INDEX IF NOT EXISTS idx_commission_earnings_order ON commission_earnings(order_id);

-- 7. Add commission-related fields to deals table
ALTER TABLE deals 
ADD COLUMN IF NOT EXISTS agreed_commission_rate DECIMAL(5,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS commission_status VARCHAR(50) DEFAULT 'pending';

-- 8. Insert default commission rate settings for existing sellers
INSERT INTO commission_rates (seller_id, rate_type, rate_value, applies_to, description, priority)
SELECT 
  id,
  'percentage',
  COALESCE(default_commission_rate, 10.00),
  'all',
  'Default commission rate',
  0
FROM users
WHERE role = 'seller'
ON CONFLICT DO NOTHING;

-- 9. Create view for seller commission summary
CREATE OR REPLACE VIEW seller_commission_summary AS
SELECT 
  u.id as seller_id,
  u.email,
  COUNT(DISTINCT ce.id) as total_earnings_count,
  COALESCE(SUM(ce.commission_amount), 0) as total_commission_earned,
  COALESCE(SUM(CASE WHEN ce.status = 'paid' THEN ce.commission_amount ELSE 0 END), 0) as total_paid,
  COALESCE(SUM(CASE WHEN ce.status = 'pending' THEN ce.commission_amount ELSE 0 END), 0) as pending_commission,
  COALESCE(SUM(CASE WHEN ce.status = 'confirmed' THEN ce.commission_amount ELSE 0 END), 0) as confirmed_unpaid,
  AVG(ce.commission_rate) as average_commission_rate
FROM users u
LEFT JOIN commission_earnings ce ON u.id = ce.seller_id
WHERE u.role = 'seller'
GROUP BY u.id, u.email;

-- 10. Add RLS policies for commission_rates
ALTER TABLE commission_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view their own commission rates"
ON commission_rates FOR SELECT
USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can insert their own commission rates"
ON commission_rates FOR INSERT
WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own commission rates"
ON commission_rates FOR UPDATE
USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete their own commission rates"
ON commission_rates FOR DELETE
USING (auth.uid() = seller_id);

-- 11. Add RLS policies for commission_earnings
ALTER TABLE commission_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view their own commission earnings"
ON commission_earnings FOR SELECT
USING (auth.uid() = seller_id);

-- Admins can view all commission earnings
CREATE POLICY "Admins can view all commission earnings"
ON commission_earnings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 12. Create function to calculate commission for an order
CREATE OR REPLACE FUNCTION calculate_commission(
  p_seller_id UUID,
  p_order_amount DECIMAL,
  p_product_id UUID DEFAULT NULL,
  p_category_id UUID DEFAULT NULL
)
RETURNS TABLE (
  applicable_rate DECIMAL(5,2),
  rate_type VARCHAR(50),
  commission_amount DECIMAL(10,2),
  rate_source TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH matched_rates AS (
    SELECT 
      cr.rate_type,
      cr.rate_value,
      cr.priority,
      CASE 
        WHEN cr.applies_to = 'product' AND cr.target_id = p_product_id THEN 'product'
        WHEN cr.applies_to = 'category' AND cr.target_id = p_category_id THEN 'category'
        WHEN cr.applies_to = 'all' THEN 'default'
        ELSE 'other'
      END as match_type
    FROM commission_rates cr
    WHERE cr.seller_id = p_seller_id
      AND cr.is_active = true
      AND (cr.start_date IS NULL OR cr.start_date <= NOW())
      AND (cr.end_date IS NULL OR cr.end_date >= NOW())
      AND (cr.min_order_value IS NULL OR p_order_amount >= cr.min_order_value)
      AND (cr.max_order_value IS NULL OR p_order_amount <= cr.max_order_value)
      AND (
        cr.applies_to = 'all'
        OR (cr.applies_to = 'product' AND cr.target_id = p_product_id)
        OR (cr.applies_to = 'category' AND cr.target_id = p_category_id)
      )
    ORDER BY cr.priority DESC, cr.created_at DESC
    LIMIT 1
  )
  SELECT 
    COALESCE(mr.rate_value, (SELECT default_commission_rate FROM users WHERE id = p_seller_id), 10.00) as applicable_rate,
    COALESCE(mr.rate_type, 'percentage') as rate_type,
    CASE 
      WHEN COALESCE(mr.rate_type, 'percentage') = 'percentage' THEN
        p_order_amount * COALESCE(mr.rate_value, (SELECT default_commission_rate FROM users WHERE id = p_seller_id), 10.00) / 100
      ELSE
        LEAST(COALESCE(mr.rate_value, 0), p_order_amount)
    END as commission_amount,
    COALESCE(mr.match_type, 'default') as rate_source
  FROM matched_rates mr;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_commission IS 'Calculates applicable commission rate and amount for a given order';
