-- ═══════════════════════════════════════════════════════════
-- MATERIALIZED VIEWS FOR ANALYTICS
-- ═══════════════════════════════════════════════════════════
-- Purpose: Pre-computed analytics for fast dashboard loading
-- Date: March 25, 2026
-- Priority: MEDIUM - Run after indexes and triggers
-- Note: Refresh these views periodically via pg_cron
-- ═══════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════
-- 1. DAILY SALES SUMMARY
-- ═══════════════════════════════════════════════════════════

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_sales_summary AS
SELECT
    DATE(sale_date) AS sale_date,
    seller_id,
    COUNT(*) AS total_orders,
    SUM(amount) AS total_revenue,
    AVG(amount) AS average_order_value,
    COUNT(DISTINCT customer_id) AS unique_customers,
    MIN(amount) AS min_order_value,
    MAX(amount) AS max_order_value
FROM sales
GROUP BY DATE(sale_date), seller_id
ORDER BY sale_date DESC;

-- Index for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_daily_sales_date_seller
ON mv_daily_sales_summary(sale_date, seller_id);

CREATE INDEX IF NOT EXISTS idx_mv_daily_sales_seller
ON mv_daily_sales_summary(seller_id);

-- ═══════════════════════════════════════════════════════════
-- 2. MONTHLY REVENUE BY SELLER
-- ═══════════════════════════════════════════════════════════

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_monthly_revenue_by_seller AS
SELECT
    DATE_TRUNC('month', sale_date)::DATE AS month,
    seller_id,
    COUNT(*) AS total_orders,
    SUM(amount) AS total_revenue,
    AVG(amount) AS average_order_value,
    COUNT(DISTINCT customer_id) AS unique_customers
FROM sales
GROUP BY DATE_TRUNC('month', sale_date), seller_id
ORDER BY month DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_monthly_revenue_month_seller
ON mv_monthly_revenue_by_seller(month, seller_id);

-- ═══════════════════════════════════════════════════════════
-- 3. PRODUCT PERFORMANCE
-- ═══════════════════════════════════════════════════════════

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_product_performance AS
SELECT
    p.id AS product_id,
    p.asin,
    p.title,
    p.seller_id,
    p.category_id,
    p.price,
    p.quantity AS current_stock,
    COUNT(DISTINCT s.id) AS total_sales,
    COALESCE(SUM(s.amount), 0) AS total_revenue,
    COUNT(DISTINCT s.customer_id) AS unique_buyers,
    COALESCE(p.average_rating, 0) AS average_rating,
    COALESCE(p.review_count, 0) AS review_count
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'delivered'
LEFT JOIN sales s ON o.id = s.order_id
WHERE p.is_deleted = false OR p.is_deleted IS NULL
GROUP BY p.id, p.asin, p.title, p.seller_id, p.category_id, p.price, p.quantity, p.average_rating, p.review_count
ORDER BY total_revenue DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_product_performance_id
ON mv_product_performance(product_id);

CREATE INDEX IF NOT EXISTS idx_mv_product_performance_seller
ON mv_product_performance(seller_id);

CREATE INDEX IF NOT EXISTS idx_mv_product_performance_revenue
ON mv_product_performance(total_revenue DESC);

-- ═══════════════════════════════════════════════════════════
-- 4. CUSTOMER LIFETIME VALUE
-- ═══════════════════════════════════════════════════════════

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_customer_lifetime_value AS
SELECT
    u.id AS user_id,
    u.email,
    u.full_name,
    COUNT(DISTINCT s.id) AS total_purchases,
    SUM(s.amount) AS lifetime_value,
    AVG(s.amount) AS average_order_value,
    MIN(s.sale_date) AS first_purchase_date,
    MAX(s.sale_date) AS last_purchase_date,
    COUNT(DISTINCT s.seller_id) AS unique_sellers,
    -- Days since last purchase
    EXTRACT(DAY FROM (NOW() - MAX(s.sale_date))) AS days_since_last_purchase
FROM users u
LEFT JOIN sales s ON u.id = s.customer_id
WHERE u.account_type = 'customer' OR u.account_type IS NULL
GROUP BY u.id, u.email, u.full_name
HAVING COUNT(s.id) > 0
ORDER BY lifetime_value DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_customer_ltv_id
ON mv_customer_lifetime_value(user_id);

CREATE INDEX IF NOT EXISTS idx_mv_customer_ltv_value
ON mv_customer_lifetime_value(lifetime_value DESC);

-- ═══════════════════════════════════════════════════════════
-- 5. SELLER PERFORMANCE DASHBOARD
-- ═══════════════════════════════════════════════════════════

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_seller_performance AS
SELECT
    s.user_id AS seller_id,
    s.full_name,
    s.email,
    s.company_name,
    s.is_verified,
    -- Product stats
    COALESCE(pc.product_count, 0) AS total_products,
    -- Order stats (last 30 days)
    COALESCE(os.total_orders, 0) AS orders_last_30_days,
    COALESCE(os.total_revenue, 0) AS revenue_last_30_days,
    -- All-time stats
    COALESCE(s.total_orders, 0) AS all_time_orders,
    COALESCE(s.total_revenue, 0) AS all_time_revenue,
    -- Rating
    COALESCE(r.average_rating, 0) AS average_rating,
    COALESCE(r.total_reviews, 0) AS total_reviews
FROM sellers s
LEFT JOIN (
    SELECT seller_id, COUNT(*) AS product_count
    FROM products
    WHERE status = 'active' AND (is_deleted = false OR is_deleted IS NULL)
    GROUP BY seller_id
) pc ON s.user_id = pc.seller_id
LEFT JOIN (
    SELECT seller_id, COUNT(*) AS total_orders, SUM(total) AS total_revenue
    FROM orders
    WHERE created_at >= NOW() - INTERVAL '30 days'
    AND status != 'cancelled'
    GROUP BY seller_id
) os ON s.user_id = os.seller_id
LEFT JOIN (
    SELECT 
        seller_id,
        AVG(average_rating) AS average_rating,
        COUNT(*) AS total_reviews
    FROM mv_product_performance pp
    WHERE review_count > 0
    GROUP BY seller_id
) r ON s.user_id = r.seller_id
ORDER BY revenue_last_30_days DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_seller_performance_id
ON mv_seller_performance(seller_id);

CREATE INDEX IF NOT EXISTS idx_mv_seller_performance_revenue
ON mv_seller_performance(revenue_last_30_days DESC);

CREATE INDEX IF NOT EXISTS idx_mv_seller_performance_verified
ON mv_seller_performance(is_verified);

-- ═══════════════════════════════════════════════════════════
-- 6. ORDER STATUS DISTRIBUTION
-- ═══════════════════════════════════════════════════════════

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_order_status_distribution AS
SELECT
    status,
    payment_status,
    COUNT(*) AS order_count,
    SUM(total) AS total_value,
    AVG(total) AS average_order_value
FROM orders
GROUP BY status, payment_status
ORDER BY order_count DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_order_status_dist
ON mv_order_status_distribution(status, payment_status);

-- ═══════════════════════════════════════════════════════════
-- 7. CATEGORY PERFORMANCE
-- ═══════════════════════════════════════════════════════════

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_category_performance AS
SELECT
    c.id AS category_id,
    c.name AS category_name,
    c.parent_id,
    COUNT(DISTINCT p.id) AS total_products,
    COUNT(DISTINCT oi.order_id) AS total_orders,
    COALESCE(SUM(oi.total_price), 0) AS total_revenue,
    AVG(p.price) AS average_price,
    AVG(p.average_rating) AS average_rating
FROM categories c
LEFT JOIN products p ON c.id = p.category_id AND (p.is_deleted = false OR p.is_deleted IS NULL)
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'delivered'
GROUP BY c.id, c.name, c.parent_id
ORDER BY total_revenue DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_category_performance_id
ON mv_category_performance(category_id);

CREATE INDEX IF NOT EXISTS idx_mv_category_performance_revenue
ON mv_category_performance(total_revenue DESC);

-- ═══════════════════════════════════════════════════════════
-- 8. INVENTORY ALERTS
-- ═══════════════════════════════════════════════════════════

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_inventory_alerts AS
SELECT
    p.id AS product_id,
    p.asin,
    p.title,
    p.seller_id,
    p.quantity AS current_stock,
    p.price,
    -- Sales velocity (average sales per day last 30 days)
    COALESCE(
        (SELECT COUNT(*) * 1.0 / 30.0
         FROM order_items oi
         JOIN orders o ON oi.order_id = o.id
         WHERE oi.product_id = p.id
         AND o.created_at >= NOW() - INTERVAL '30 days'
         AND o.status = 'delivered'),
        0
    ) AS daily_sales_velocity,
    -- Days until stockout
    CASE 
        WHEN p.quantity = 0 THEN 0
        WHEN COALESCE(
            (SELECT COUNT(*) * 1.0 / 30.0
             FROM order_items oi
             JOIN orders o ON oi.order_id = o.id
             WHERE oi.product_id = p.id
             AND o.created_at >= NOW() - INTERVAL '30 days'
             AND o.status = 'delivered'),
            0
        ) = 0 THEN NULL
        ELSE p.quantity / (
            SELECT COUNT(*) * 1.0 / 30.0
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE oi.product_id = p.id
            AND o.created_at >= NOW() - INTERVAL '30 days'
            AND o.status = 'delivered'
        )
    END AS days_until_stockout,
    -- Alert level
    CASE
        WHEN p.quantity = 0 THEN 'out_of_stock'
        WHEN p.quantity <= 5 THEN 'critical_low'
        WHEN p.quantity <= 10 THEN 'low_stock'
        ELSE 'ok'
    END AS stock_status
FROM products p
WHERE (p.is_deleted = false OR p.is_deleted IS NULL)
AND p.status = 'active'
ORDER BY 
    CASE 
        WHEN p.quantity = 0 THEN 1
        WHEN p.quantity <= 5 THEN 2
        WHEN p.quantity <= 10 THEN 3
        ELSE 4
    END;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_inventory_alerts_id
ON mv_inventory_alerts(product_id);

CREATE INDEX IF NOT EXISTS idx_mv_inventory_alerts_status
ON mv_inventory_alerts(stock_status);

CREATE INDEX IF NOT EXISTS idx_mv_inventory_alerts_seller
ON mv_inventory_alerts(seller_id);

-- ═══════════════════════════════════════════════════════════
-- 9. PAYMENT ANALYTICS
-- ═══════════════════════════════════════════════════════════

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_payment_analytics AS
SELECT
    payment_method,
    payment_status,
    COUNT(*) AS transaction_count,
    SUM(amount) AS total_amount,
    AVG(amount) AS average_transaction,
    -- Success rate
    ROUND(
        COUNT(*) FILTER (WHERE payment_status = 'paid') * 100.0 / COUNT(*),
        2
    ) AS success_rate
FROM orders
GROUP BY payment_method, payment_status
ORDER BY transaction_count DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_payment_analytics
ON mv_payment_analytics(payment_method, payment_status);

-- ═══════════════════════════════════════════════════════════
-- 10. GEOGRAPHIC DISTRIBUTION
-- ═══════════════════════════════════════════════════════════

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_geographic_distribution AS
SELECT
    COALESCE(u.location, 'Unknown') AS location,
    COUNT(DISTINCT u.id) AS total_users,
    COUNT(DISTINCT CASE WHEN u.account_type = 'customer' THEN u.id END) AS total_customers,
    COUNT(DISTINCT CASE WHEN u.account_type = 'seller' OR u.account_type = 'factory' THEN u.id END) AS total_sellers,
    COALESCE(SUM(s.amount), 0) AS total_revenue,
    COUNT(DISTINCT s.customer_id) AS paying_customers
FROM users u
LEFT JOIN sales s ON u.id = s.customer_id
GROUP BY COALESCE(u.location, 'Unknown')
ORDER BY total_revenue DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_geographic_distribution_location
ON mv_geographic_distribution(location);

-- ═══════════════════════════════════════════════════════════
-- REFRESH FUNCTIONS (Call via pg_cron)
-- ═══════════════════════════════════════════════════════════

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_all_analytics_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_sales_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_revenue_by_seller;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_performance;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_customer_lifetime_value;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_seller_performance;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_order_status_distribution;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_category_performance;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_inventory_alerts;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_payment_analytics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_geographic_distribution;
  
  -- Log refresh completion
  INSERT INTO audit_logs (event, severity, description, metadata)
  VALUES (
    'SYSTEM_EVENT',
    'low',
    'Analytics materialized views refreshed',
    jsonb_build_object('refreshed_at', NOW())
  );
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh every hour
SELECT cron.schedule(
  'refresh-analytics-views',
  '0 * * * *',  -- Every hour at minute 0
  $$SELECT refresh_all_analytics_views()$$
);

-- Schedule heavy views less frequently (daily at 3 AM)
SELECT cron.schedule(
  'refresh-heavy-analytics',
  '0 3 * * *',
  $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_customer_lifetime_value;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_seller_performance;
  $$
);

-- ═══════════════════════════════════════════════════════════
-- VERIFICATION QUERIES
-- ═══════════════════════════════════════════════════════════

-- List all materialized views:
-- SELECT matviewname, ispopulated
-- FROM pg_matviews
-- WHERE schemaname = 'public'
-- ORDER BY matviewname;

-- Check materialized view size:
-- SELECT 
--   matviewname,
--   pg_size_pretty(pg_total_relation_size(matviewname::text)) as size
-- FROM pg_matviews
-- WHERE schemaname = 'public'
-- ORDER BY pg_total_relation_size(matviewname::text) DESC;

-- Check last refresh time (requires pg_stat_user_tables):
-- SELECT 
--   relname AS view_name,
--   last_vacuum,
--   last_analyze
-- FROM pg_stat_user_tables
-- WHERE relkind = 'm'  -- Materialized views
-- ORDER BY relname;

-- ═══════════════════════════════════════════════════════════
-- USAGE EXAMPLES
-- ═══════════════════════════════════════════════════════════

-- Get seller dashboard data (fast!):
-- SELECT * FROM mv_seller_performance WHERE seller_id = 'uuid-here';

-- Get daily revenue trend:
-- SELECT sale_date, total_revenue FROM mv_daily_sales_summary 
-- WHERE seller_id = 'uuid-here' 
-- ORDER BY sale_date DESC LIMIT 30;

-- Get low stock alerts:
-- SELECT * FROM mv_inventory_alerts 
-- WHERE stock_status IN ('out_of_stock', 'critical_low', 'low_stock');

-- Get top products:
-- SELECT * FROM mv_product_performance 
-- ORDER BY total_revenue DESC LIMIT 20;

-- ═══════════════════════════════════════════════════════════
-- END OF MATERIALIZED VIEWS
-- ═══════════════════════════════════════════════════════════
