-- ═══════════════════════════════════════════════════════════
-- CRITICAL DATABASE INDEXES FOR AURORA E-COMMERCE
-- ═══════════════════════════════════════════════════════════
-- Purpose: Fix missing indexes identified in backend analysis
-- Date: March 25, 2026
-- Priority: HIGH - Run in production during low-traffic period
-- Note: Using CONCURRENTLY to avoid table locks
-- ═══════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════
-- 1. ORDERS TABLE INDEXES
-- ═══════════════════════════════════════════════════════════

-- Index 1: User order history (most common query pattern)
-- Used by: OrdersListPage, user dashboard
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_status_created 
ON orders(user_id, status, created_at DESC);

-- Index 2: Seller dashboard queries
-- Used by: Seller order management, analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_seller_status_date 
ON orders(seller_id, status, created_at DESC) 
WHERE status != 'cancelled';

-- Index 3: Order status filtering
-- Used by: Admin dashboard, order processing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status_created 
ON orders(status, created_at DESC);

-- Index 4: Payment status queries
-- Used by: Payment processing, reconciliation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_payment_status 
ON orders(payment_status, created_at DESC);

-- Index 5: Delivery assignments
-- Used by: Delivery tracking, driver assignment
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_delivery_status 
ON orders(delivery_status, created_at DESC) 
WHERE delivery_id IS NOT NULL;

-- Index 6: Deal-based orders
-- Used by: Middleman commission tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_deal_id 
ON orders(deal_id) WHERE deal_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════
-- 2. PRODUCTS TABLE INDEXES
-- ═══════════════════════════════════════════════════════════

-- Index 1: Seller product management
-- Used by: Factory dashboard, product management
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_seller_status_price 
ON products(seller_id, status, price) 
WHERE is_deleted = false OR is_deleted IS NULL;

-- Index 2: Product search by title (with trigram for fuzzy search)
-- Used by: Product search, autocomplete
CREATE INDEX IF NOT EXISTS idx_products_title_trgm 
ON products USING gin(title gin_trgm_ops);

-- Index 3: Product search by description
-- Used by: Full-text search
CREATE INDEX IF NOT EXISTS idx_products_description_trgm 
ON products USING gin(description gin_trgm_ops);

-- Index 4: Category-based product listing
-- Used by: Category pages, filtered browsing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_category_id 
ON products(category_id) WHERE status = 'active';

-- Index 5: Inventory management
-- Used by: Low stock alerts, inventory dashboard
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_quantity 
ON products(quantity) WHERE status = 'active';

-- Index 6: Created date for new arrivals
-- Used by: New products section
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_created_desc 
ON products(created_at DESC) WHERE status = 'active';

-- Index 7: ASIN lookups (unique product identifier)
-- Used by: Product detail pages, inventory sync
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_asin_unique 
ON products(asin) WHERE is_deleted = false OR is_deleted IS NULL;

-- ═══════════════════════════════════════════════════════════
-- 3. MESSAGES & CONVERSATIONS TABLES INDEXES
-- ═══════════════════════════════════════════════════════════

-- Index 1: Chat message loading (most recent first)
-- Used by: Chat widget, messaging inbox
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_convo_created 
ON messages(conversation_id, created_at DESC);

-- Index 2: Messages by sender
-- Used by: Message history, user activity
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_sender_id 
ON messages(sender_id, created_at DESC);

-- Index 3: Unread messages
-- Used by: Notification badges, unread count
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_unread 
ON messages(receiver_id, is_read, created_at DESC) 
WHERE is_read = false;

-- Index 4: Conversation participants
-- Used by: Inbox listing, conversation access
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversation_participants_user 
ON conversation_participants(user_id, conversation_id);

-- Index 5: Active conversations
-- Used by: Inbox with recent activity
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_last_message 
ON conversations(last_message_at DESC, updated_at DESC);

-- Index 6: Product-based conversations
-- Used by: Seller conversation filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_product_id 
ON conversations(product_id) WHERE product_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════
-- 4. SALES & ANALYTICS TABLES INDEXES
-- ═══════════════════════════════════════════════════════════

-- Index 1: Seller sales analytics
-- Used by: calculate_seller_analytics, seller dashboard
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_seller_date_customer 
ON sales(seller_id, sale_date DESC, customer_id);

-- Index 2: Customer purchase history
-- Used by: Customer analytics, recommendations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_customer_date 
ON sales(customer_id, sale_date DESC);

-- Index 3: Daily sales aggregation
-- Used by: Sales reports, revenue charts
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_date_amount 
ON sales(sale_date DESC, amount);

-- Index 4: Product sales performance
-- Used by: Best sellers, product analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_product_id 
ON sales(product_id, sale_date DESC);

-- ═══════════════════════════════════════════════════════════
-- 5. PAYMENT_INTENTIONS TABLE INDEXES
-- ═══════════════════════════════════════════════════════════

-- Index 1: Order-based payment lookup
-- Used by: Payment processing, order confirmation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_intentions_order_id 
ON payment_intentions(order_id);

-- Index 2: User payment history
-- Used by: User payment records
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_intentions_user_id 
ON payment_intentions(user_id, created_at DESC);

-- Index 3: Payment status tracking
-- Used by: Payment reconciliation, failed payment retry
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_intentions_status 
ON payment_intentions(status, created_at DESC);

-- Index 4: Provider reference lookup (for webhooks)
-- Used by: Fawry webhook, payment provider callbacks
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_intentions_provider_ref 
ON payment_intentions(provider_reference_id) 
WHERE provider_reference_id IS NOT NULL;

-- Index 5: Pending payments (for retry logic)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_intentions_pending 
ON payment_intentions(created_at) 
WHERE status = 'pending';

-- ═══════════════════════════════════════════════════════════
-- 6. NOTIFICATIONS TABLE INDEXES
-- ═══════════════════════════════════════════════════════════

-- Index 1: User notifications (most recent first)
-- Used by: Notification dropdown, notification center
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_created 
ON notifications(user_id, is_read, created_at DESC);

-- Index 2: Unread notifications count
-- Used by: Notification badge
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_unread 
ON notifications(user_id, created_at DESC) 
WHERE is_read = false;

-- Index 3: Notification type filtering
-- Used by: Filtered notification views
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_type 
ON notifications(type, user_id, created_at DESC);

-- ═══════════════════════════════════════════════════════════
-- 7. USER_WALLETS TABLE INDEXES
-- ═══════════════════════════════════════════════════════════

-- Index 1: User wallet lookup
-- Used by: Wallet display, balance checks
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_wallets_user_id 
ON user_wallets(user_id);

-- Index 2: Wallet balance queries
-- Used by: Admin analytics, low balance alerts
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_wallets_balance 
ON user_wallets(balance DESC);

-- ═══════════════════════════════════════════════════════════
-- 8. DELIVERY & LOGISTICS INDEXES
-- ═══════════════════════════════════════════════════════════

-- Index 1: Driver assignments
-- Used by: Driver dashboard, delivery tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_delivery_assignments_driver 
ON delivery_assignments(driver_id, status, created_at DESC);

-- Index 2: Order delivery status
-- Used by: Order tracking, delivery management
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_delivery_assignments_order 
ON delivery_assignments(order_id);

-- Index 3: Driver location queries (for nearby driver search)
-- Used by: assign_delivery_to_driver function
CREATE INDEX IF NOT EXISTS idx_delivery_profiles_location 
ON delivery_profiles(latitude, longitude) 
WHERE is_active = true AND is_verified = true;

-- ═══════════════════════════════════════════════════════════
-- 9. REVIEWS & RATINGS INDEXES
-- ═══════════════════════════════════════════════════════════

-- Index 1: Product reviews
-- Used by: Product detail page, review listing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_product 
ON reviews(asin, is_approved, created_at DESC);

-- Index 2: User reviews
-- Used by: User profile, review history
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_user 
ON reviews(user_id, created_at DESC);

-- Index 3: Verified purchases
-- Used by: Verified review filter
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_verified 
ON reviews(asin, is_verified_purchase, is_approved) 
WHERE is_verified_purchase = true;

-- ═══════════════════════════════════════════════════════════
-- 10. ASYNC_JOBS TABLE INDEXES
-- ═══════════════════════════════════════════════════════════

-- Index 1: Job queue processing
-- Used by: Job queue processor
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_async_jobs_queue_status 
ON async_jobs(queue_name, status, scheduled_for);

-- Index 2: Scheduled jobs
-- Used by: Job scheduler
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_async_jobs_scheduled 
ON async_jobs(scheduled_for) 
WHERE status = 'pending';

-- Index 3: Job retry tracking
-- Used by: Failed job retry logic
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_async_jobs_attempts 
ON async_jobs(attempts, status) 
WHERE status = 'pending';

-- ═══════════════════════════════════════════════════════════
-- 11. SERVICES MARKETPLACE INDEXES
-- ═══════════════════════════════════════════════════════════

-- Index 1: Service provider listings
-- Used by: Service marketplace browsing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_svc_listings_provider 
ON svc_listings(provider_id, status, created_at DESC);

-- Index 2: Service category filtering
-- Used by: Service category pages
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_svc_listings_category 
ON svc_listings(category_id, status);

-- Index 3: Service bookings
-- Used by: Provider booking management
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_bookings_provider 
ON service_bookings(provider_id, status, booking_date DESC);

-- Index 4: Customer bookings
-- Used by: Customer booking history
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_bookings_customer 
ON service_bookings(customer_id, status, booking_date DESC);

-- ═══════════════════════════════════════════════════════════
-- 12. HEALTHCARE MODULE INDEXES
-- ═══════════════════════════════════════════════════════════

-- Index 1: Doctor appointments
-- Used by: Doctor schedule, appointment management
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_health_appointments_doctor 
ON health_appointments(doctor_id, scheduled_at DESC);

-- Index 2: Patient appointments
-- Used by: Patient appointment history
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_health_appointments_patient 
ON health_appointments(patient_id, scheduled_at DESC);

-- Index 3: Doctor profile lookup
-- Used by: Doctor search, verification
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_health_doctors_verified 
ON health_doctor_profiles(is_verified, specialty) 
WHERE is_active = true;

-- ═══════════════════════════════════════════════════════════
-- 13. FACTORY & B2B INDEXES
-- ═══════════════════════════════════════════════════════════

-- Index 1: Factory quote requests
-- Used by: Factory quote dashboard
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_factory_quotes_seller 
ON factory_quotes(seller_id, status, created_at DESC);

-- Index 2: Quote requests by buyer
-- Used by: Buyer quote tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_factory_quotes_buyer 
ON factory_quotes(buyer_id, status, created_at DESC);

-- Index 3: Production orders
-- Used by: Production tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_production_orders_seller 
ON production_orders(seller_id, status, created_at DESC);

-- ═══════════════════════════════════════════════════════════
-- 14. COMPOSITE INDEXES FOR COMPLEX QUERIES
-- ═══════════════════════════════════════════════════════════

-- Index 1: Order analytics (revenue by status)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_analytics 
ON orders(seller_id, status, total) 
WHERE status IN ('confirmed', 'processing', 'delivered');

-- Index 2: Active users with orders
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active_orders 
ON orders(user_id, created_at DESC, total) 
WHERE status != 'cancelled';

-- Index 3: Product inventory alerts
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_low_stock 
ON products(quantity, seller_id) 
WHERE quantity <= 10 AND status = 'active';

-- ═══════════════════════════════════════════════════════════
-- 15. FULL-TEXT SEARCH INDEXES
-- ═══════════════════════════════════════════════════════════

-- Index 1: Products full-text search
CREATE INDEX IF NOT EXISTS idx_products_search_vector 
ON products USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Index 2: Users search by name/email
CREATE INDEX IF NOT EXISTS idx_users_search_vector 
ON users USING gin(to_tsvector('english', COALESCE(full_name, '') || ' ' || email));

-- ═══════════════════════════════════════════════════════════
-- VERIFICATION QUERIES
-- ═══════════════════════════════════════════════════════════
-- Run these to verify indexes were created:

-- Check all indexes on a table:
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'orders' 
-- ORDER BY indexname;

-- Check index size:
-- SELECT 
--   indexname,
--   pg_size_pretty(pg_relation_size(indexname::text)) as size
-- FROM pg_indexes 
-- WHERE schemaname = 'public'
-- ORDER BY pg_relation_size(indexname::text) DESC;

-- Check missing indexes (tables with seq scans):
-- SELECT 
--   schemaname || '.' || relname AS table,
--   seq_scan,
--   seq_tup_read,
--   idx_scan,
--   idx_tup_fetch
-- FROM pg_stat_user_tables
-- WHERE seq_scan > idx_scan
-- ORDER BY seq_scan DESC;

-- ═══════════════════════════════════════════════════════════
-- PERFORMANCE NOTES
-- ═══════════════════════════════════════════════════════════
-- 1. CONCURRENTLY prevents table locks but takes longer
-- 2. Monitor index creation progress in pg_stat_progress_create_index
-- 3. Run ANALYZE after creating indexes to update statistics
-- 4. Consider running during low-traffic periods
-- 5. Test on staging first with production-like data volume

-- Update statistics after index creation
ANALYZE orders;
ANALYZE products;
ANALYZE messages;
ANALYZE sales;
ANALYZE payment_intentions;
ANALYZE notifications;

-- ═══════════════════════════════════════════════════════════
-- END OF CRITICAL DATABASE INDEXES
-- ═══════════════════════════════════════════════════════════
