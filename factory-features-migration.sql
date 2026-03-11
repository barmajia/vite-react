-- =====================================================
-- FACTORY FEATURES COMPLETE MIGRATION
-- Aurora E-commerce Platform
-- =====================================================
-- This migration adds:
-- 1. Production order tracking
-- 2. Quote request system
-- 3. Factory analytics snapshots
-- 4. Factory certificationsA
-- =====================================================

-- =====================================================
-- STEP 1: Production Order Tracking
-- =====================================================

-- 1.1 Create production status ENUM type
DO $$ BEGIN
  CREATE TYPE factory_order_status AS ENUM (
    'pending',
    'in_production',
    'quality_check',
    'ready_to_ship',
    'shipped',
    'delivered',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 1.2 Extend orders table with production fields
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS production_status factory_order_status DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS production_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS production_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS quality_check_passed BOOLEAN;

-- 1.3 Create production logs table
CREATE TABLE IF NOT EXISTS factory_production_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  status factory_order_status NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 1.4 Create index for production logs
CREATE INDEX IF NOT EXISTS idx_production_logs_order_id 
ON factory_production_logs(order_id, created_at DESC);

-- 1.5 Create index on orders for production status
CREATE INDEX IF NOT EXISTS idx_orders_production_status 
ON orders(production_status, seller_id);

-- =====================================================
-- STEP 2: Quote Request System
-- =====================================================

-- 2.1 Create quote requests table
CREATE TABLE IF NOT EXISTS quote_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factory_id UUID REFERENCES sellers(user_id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  target_price NUMERIC(10,2),
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'quoted', 'accepted', 'rejected', 'expired')),
  quoted_price NUMERIC(10,2),
  quoted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2.2 Create indexes for quote requests
CREATE INDEX IF NOT EXISTS idx_quotes_factory_id ON quote_requests(factory_id);
CREATE INDEX IF NOT EXISTS idx_quotes_buyer_id ON quote_requests(buyer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quote_requests(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quote_requests(created_at DESC);

-- 2.3 Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_quote_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_quote_request_updated_at ON quote_requests;
CREATE TRIGGER update_quote_request_updated_at
  BEFORE UPDATE ON quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_quote_request_updated_at();

-- =====================================================
-- STEP 3: Factory Analytics Snapshots
-- =====================================================

-- 3.1 Create analytics snapshots table
CREATE TABLE IF NOT EXISTS factory_analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES sellers(user_id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_revenue NUMERIC(12,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  completed_orders INTEGER DEFAULT 0,
  pending_orders INTEGER DEFAULT 0,
  average_rating NUMERIC(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_products INTEGER DEFAULT 0,
  active_products INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(seller_id, snapshot_date)
);

-- 3.2 Create index for analytics snapshots
CREATE INDEX IF NOT EXISTS idx_analytics_seller_date 
ON factory_analytics_snapshots(seller_id, snapshot_date DESC);

-- =====================================================
-- STEP 4: Factory Certifications
-- =====================================================

-- 4.1 Create factory certifications table
CREATE TABLE IF NOT EXISTS factory_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factory_id UUID REFERENCES sellers(user_id) ON DELETE CASCADE,
  certification_name TEXT NOT NULL,
  certification_number TEXT,
  issuing_organization TEXT NOT NULL,
  issued_date DATE NOT NULL,
  expiry_date DATE,
  certificate_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4.2 Create index for certifications
CREATE INDEX IF NOT EXISTS idx_certifications_factory_id 
ON factory_certifications(factory_id);

-- =====================================================
-- STEP 5: RLS Policies
-- =====================================================

-- Enable RLS on all new tables
ALTER TABLE factory_production_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE factory_analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE factory_certifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "factories_view_own_production_logs" ON factory_production_logs;
DROP POLICY IF EXISTS "factories_insert_own_production_logs" ON factory_production_logs;

DROP POLICY IF EXISTS "factories_view_own_quotes" ON quote_requests;
DROP POLICY IF EXISTS "buyers_view_own_quotes" ON quote_requests;
DROP POLICY IF EXISTS "buyers_create_quotes" ON quote_requests;
DROP POLICY IF EXISTS "factories_update_quotes" ON quote_requests;

DROP POLICY IF EXISTS "factories_view_own_analytics" ON factory_analytics_snapshots;
DROP POLICY IF EXISTS "system_insert_analytics" ON factory_analytics_snapshots;

DROP POLICY IF EXISTS "factories_view_own_certifications" ON factory_certifications;
DROP POLICY IF EXISTS "factories_manage_own_certifications" ON factory_certifications;
DROP POLICY IF EXISTS "admins_verify_certifications" ON factory_certifications;

-- 5.1 Production Logs Policies
CREATE POLICY "factories_view_own_production_logs" ON factory_production_logs
  FOR SELECT TO authenticated
  USING (
    order_id IN (
      SELECT id FROM orders WHERE seller_id = auth.uid()
    )
  );

CREATE POLICY "factories_insert_own_production_logs" ON factory_production_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    order_id IN (
      SELECT id FROM orders WHERE seller_id = auth.uid()
    )
  );

-- 5.2 Quote Requests Policies
CREATE POLICY "factories_view_own_quotes" ON quote_requests
  FOR SELECT TO authenticated
  USING (factory_id = auth.uid());

CREATE POLICY "buyers_view_own_quotes" ON quote_requests
  FOR SELECT TO authenticated
  USING (buyer_id = auth.uid());

CREATE POLICY "buyers_create_quotes" ON quote_requests
  FOR INSERT TO authenticated
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "factories_update_quotes" ON quote_requests
  FOR UPDATE TO authenticated
  USING (factory_id = auth.uid())
  WITH CHECK (factory_id = auth.uid());

-- 5.3 Analytics Snapshots Policies
CREATE POLICY "factories_view_own_analytics" ON factory_analytics_snapshots
  FOR SELECT TO authenticated
  USING (seller_id = auth.uid());

CREATE POLICY "system_insert_analytics" ON factory_analytics_snapshots
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5.4 Certifications Policies
CREATE POLICY "factories_view_own_certifications" ON factory_certifications
  FOR SELECT TO authenticated
  USING (factory_id = auth.uid() OR is_verified = true);

CREATE POLICY "factories_manage_own_certifications" ON factory_certifications
  FOR ALL TO authenticated
  USING (factory_id = auth.uid())
  WITH CHECK (factory_id = auth.uid());

CREATE POLICY "admins_verify_certifications" ON factory_certifications
  FOR UPDATE TO authenticated
  USING (auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  ))
  WITH CHECK (auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  ));

-- =====================================================
-- STEP 6: Helper Functions
-- =====================================================

-- 6.1 Function: Get seller KPIs (enhanced version)
CREATE OR REPLACE FUNCTION get_seller_kpis(
  p_seller_id UUID,
  p_period_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_revenue NUMERIC,
  total_orders BIGINT,
  completed_orders BIGINT,
  pending_orders BIGINT,
  average_rating NUMERIC,
  total_reviews BIGINT,
  total_products BIGINT,
  active_products BIGINT,
  revenue_growth NUMERIC,
  order_growth NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_revenue NUMERIC;
  v_previous_revenue NUMERIC;
  v_current_orders BIGINT;
  v_previous_orders BIGINT;
BEGIN
  -- Get current period revenue
  SELECT COALESCE(SUM(total), 0) INTO v_current_revenue
  FROM orders
  WHERE seller_id = p_seller_id
    AND created_at >= NOW() - (p_period_days || ' days')::INTERVAL
    AND status NOT IN ('cancelled', 'refunded');

  -- Get previous period revenue
  SELECT COALESCE(SUM(total), 0) INTO v_previous_revenue
  FROM orders
  WHERE seller_id = p_seller_id
    AND created_at >= NOW() - (2 * p_period_days || ' days')::INTERVAL
    AND created_at < NOW() - (p_period_days || ' days')::INTERVAL
    AND status NOT IN ('cancelled', 'refunded');

  -- Get current period orders
  SELECT COUNT(*) INTO v_current_orders
  FROM orders
  WHERE seller_id = p_seller_id
    AND created_at >= NOW() - (p_period_days || ' days')::INTERVAL;

  -- Get previous period orders
  SELECT COUNT(*) INTO v_previous_orders
  FROM orders
  WHERE seller_id = p_seller_id
    AND created_at >= NOW() - (2 * p_period_days || ' days')::INTERVAL
    AND created_at < NOW() - (p_period_days || ' days')::INTERVAL;

  RETURN QUERY
  SELECT
    COALESCE(v_current_revenue, 0)::NUMERIC AS total_revenue,
    COALESCE(v_current_orders, 0)::BIGINT AS total_orders,
    COALESCE((
      SELECT COUNT(*) FROM orders
      WHERE seller_id = p_seller_id AND status = 'delivered'
    ), 0)::BIGINT AS completed_orders,
    COALESCE((
      SELECT COUNT(*) FROM orders
      WHERE seller_id = p_seller_id AND status IN ('pending', 'confirmed', 'processing')
    ), 0)::BIGINT AS pending_orders,
    COALESCE((
      SELECT AVG(rating) FROM reviews r
      JOIN products p ON r.asin = p.id
      WHERE p.seller_id = p_seller_id
    ), 0)::NUMERIC AS average_rating,
    COALESCE((
      SELECT COUNT(*) FROM reviews r
      JOIN products p ON r.asin = p.id
      WHERE p.seller_id = p_seller_id
    ), 0)::BIGINT AS total_reviews,
    COALESCE((
      SELECT COUNT(*) FROM products WHERE seller_id = p_seller_id
    ), 0)::BIGINT AS total_products,
    COALESCE((
      SELECT COUNT(*) FROM products WHERE seller_id = p_seller_id AND quantity > 0
    ), 0)::BIGINT AS active_products,
    CASE
      WHEN v_previous_revenue = 0 THEN 0
      ELSE ((v_current_revenue - v_previous_revenue) / v_previous_revenue * 100)::NUMERIC
    END AS revenue_growth,
    CASE
      WHEN v_previous_orders = 0 THEN 0
      ELSE (((v_current_orders - v_previous_orders)::NUMERIC) / v_previous_orders * 100)::NUMERIC
    END AS order_growth;
END;
$$;

-- 6.2 Function: Get production orders for seller
CREATE OR REPLACE FUNCTION get_production_orders(
  p_seller_id UUID,
  p_status factory_order_status DEFAULT NULL
)
RETURNS TABLE (
  order_id UUID,
  customer_name TEXT,
  product_title TEXT,
  quantity INTEGER,
  current_status factory_order_status,
  production_started_at TIMESTAMP WITH TIME ZONE,
  production_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id AS order_id,
    (SELECT full_name FROM users WHERE id = o.user_id) AS customer_name,
    p.title AS product_title,
    oi.quantity,
    o.production_status AS current_status,
    o.production_started_at,
    o.production_completed_at,
    o.created_at
  FROM orders o
  JOIN order_items oi ON o.id = oi.order_id
  JOIN products p ON oi.product_id = p.id
  WHERE o.seller_id = p_seller_id
    AND (p_status IS NULL OR o.production_status = p_status)
  ORDER BY o.created_at DESC;
END;
$$;

-- 6.3 Function: Update production status
CREATE OR REPLACE FUNCTION update_production_status(
  p_order_id UUID,
  p_status factory_order_status,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_seller_id UUID;
BEGIN
  -- Get seller_id for this order
  SELECT seller_id INTO v_seller_id FROM orders WHERE id = p_order_id;

  -- Verify caller is the seller
  IF v_seller_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Only seller can update production status';
  END IF;

  -- Update order production status
  UPDATE orders
  SET
    production_status = p_status,
    production_started_at = CASE
      WHEN p_status = 'in_production' THEN NOW()
      ELSE production_started_at
    END,
    production_completed_at = CASE
      WHEN p_status = 'ready_to_ship' THEN NOW()
      ELSE production_completed_at
    END
  WHERE id = p_order_id;

  -- Log the status change
  INSERT INTO factory_production_logs (order_id, status, notes, created_by)
  VALUES (p_order_id, p_status, p_notes, auth.uid());

  RETURN TRUE;
END;
$$;

-- 6.4 Function: Cleanup expired quotes (for pg_cron)
CREATE OR REPLACE FUNCTION cleanup_expired_quotes()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE quote_requests
  SET status = 'expired'
  WHERE expires_at < NOW()
    AND status = 'pending';
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_seller_kpis(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_production_orders(UUID, factory_order_status) TO authenticated;
GRANT EXECUTE ON FUNCTION update_production_status(UUID, factory_order_status, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_quotes() TO authenticated;

-- =====================================================
-- STEP 7: Schedule pg_cron job for quote cleanup
-- =====================================================

-- Schedule cleanup to run every hour
SELECT cron.schedule(
  'cleanup-expired-quotes',
  '0 * * * *',  -- Every hour at minute 0
  'SELECT cleanup_expired_quotes()'
);

-- =====================================================
-- STEP 8: Verification Queries
-- =====================================================

-- Verify tables created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'factory_production_logs',
    'quote_requests',
    'factory_analytics_snapshots',
    'factory_certifications'
  )
ORDER BY table_name;

-- Verify indexes
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Verify functions
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_seller_kpis',
    'get_production_orders',
    'update_production_status',
    'cleanup_expired_quotes'
  );

-- Verify RLS policies
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'factory_production_logs',
    'quote_requests',
    'factory_analytics_snapshots',
    'factory_certifications'
  )
ORDER BY tablename, policyname;
