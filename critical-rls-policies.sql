-- ═══════════════════════════════════════════════════════════
-- CRITICAL RLS POLICIES FOR AURORA E-COMMERCE
-- ═══════════════════════════════════════════════════════════
-- Purpose: Close security gaps identified in backend analysis
-- Date: March 25, 2026
-- Priority: CRITICAL - Run these IMMEDIATELY in production
-- ═══════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════
-- 1. PAYMENT_INTENTIONS TABLE SECURITY
-- ═══════════════════════════════════════════════════════════
-- CRITICAL GAP: No RLS policies - payment data exposed!

-- Enable RLS
ALTER TABLE payment_intentions ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own payment intentions
CREATE POLICY "users_view_own_payment_intentions"
ON payment_intentions FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = payment_intentions.order_id 
    AND orders.user_id = auth.uid()
  )
);

-- Policy 2: Prevent direct inserts - MUST use Edge Function
-- This forces all payment creation through server-side validation
CREATE POLICY "prevent_direct_payment_inserts"
ON payment_intentions FOR INSERT
TO authenticated
WITH CHECK (false);

-- Policy 3: Prevent direct updates - MUST use Edge Function/webhook
CREATE POLICY "prevent_direct_payment_updates"
ON payment_intentions FOR UPDATE
TO authenticated
WITH CHECK (false);

-- Policy 4: Service role can manage (for webhooks and Edge Functions)
CREATE POLICY "service_role_manage_payment_intentions"
ON payment_intentions FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 5: Allow Edge Functions (authenticated with service role) to update status
CREATE POLICY "edge_function_update_payment_status"
ON payment_intentions FOR UPDATE
TO authenticated
USING (
  -- Only allow updating status field, not amount or user_id
  user_id = auth.uid() AND
  OLD.amount = NEW.amount AND
  OLD.user_id = NEW.user_id AND
  OLD.order_id = NEW.order_id
)
WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════
-- 2. ASYNC_JOBS TABLE SECURITY
-- ═══════════════════════════════════════════════════════════
-- CRITICAL GAP: Job queue exposed - could be abused for DoS

ALTER TABLE async_jobs ENABLE ROW LEVEL SECURITY;

-- Policy 1: Only service_role can access (job processor)
CREATE POLICY "async_jobs_service_only"
ON async_jobs FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 2: Prevent authenticated users from accessing
CREATE POLICY "async_jobs_no_user_access"
ON async_jobs FOR SELECT
TO authenticated
USING (false);

CREATE POLICY "async_jobs_no_user_insert"
ON async_jobs FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "async_jobs_no_user_update"
ON async_jobs FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "async_jobs_no_user_delete"
ON async_jobs FOR DELETE
TO authenticated
USING (false);

-- ═══════════════════════════════════════════════════════════
-- 3. NOTIFICATIONS TABLE SECURITY
-- ═══════════════════════════════════════════════════════════
-- GAP: Missing delete policies

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own notifications
CREATE POLICY "users_view_own_notifications"
ON notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy 2: Users can create their own notifications (for system-generated)
CREATE POLICY "users_insert_own_notifications"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Policy 3: Users can update their own notifications (mark as read)
CREATE POLICY "users_update_own_notifications"
ON notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy 4: Users can delete their own notifications
CREATE POLICY "users_delete_own_notifications"
ON notifications FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Policy 5: Service role can manage all (for system notifications)
CREATE POLICY "service_role_manage_notifications"
ON notifications FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════
-- 4. ANALYTICS_SNAPSHOTS TABLE SECURITY
-- ═══════════════════════════════════════════════════════════
-- GAP: Analytics data could be accessed by unauthorized users

ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;

-- Policy 1: Sellers can view only their own analytics
CREATE POLICY "sellers_view_own_analytics"
ON analytics_snapshots FOR SELECT
TO authenticated
USING (seller_id = auth.uid());

-- Policy 2: Prevent direct inserts - use functions/triggers
CREATE POLICY "prevent_direct_analytics_inserts"
ON analytics_snapshots FOR INSERT
TO authenticated
WITH CHECK (false);

-- Policy 3: Prevent direct updates
CREATE POLICY "prevent_direct_analytics_updates"
ON analytics_snapshots FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

-- Policy 4: Service role can manage
CREATE POLICY "service_role_manage_analytics"
ON analytics_snapshots FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════
-- 5. SALES TABLE SECURITY
-- ═══════════════════════════════════════════════════════════
-- GAP: Sales data needs proper access control

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Policy 1: Sellers can view their own sales
CREATE POLICY "sellers_view_own_sales"
ON sales FOR SELECT
TO authenticated
USING (seller_id = auth.uid());

-- Policy 2: Buyers can view their own purchases
CREATE POLICY "buyers_view_own_purchases"
ON sales FOR SELECT
TO authenticated
USING (customer_id = auth.uid());

-- Policy 3: Prevent direct modifications
CREATE POLICY "prevent_direct_sales_modifications"
ON sales FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- Policy 4: Service role can manage
CREATE POLICY "service_role_manage_sales"
ON sales FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════
-- 6. PUSH_SUBSCRIPTIONS TABLE SECURITY
-- ═══════════════════════════════════════════════════════════
-- GAP: Push subscriptions could be hijacked

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own subscriptions
CREATE POLICY "users_view_own_push_subscriptions"
ON push_subscriptions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy 2: Users can create their own subscriptions
CREATE POLICY "users_insert_own_push_subscriptions"
ON push_subscriptions FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Policy 3: Users can delete their own subscriptions
CREATE POLICY "users_delete_own_push_subscriptions"
ON push_subscriptions FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Policy 4: Users can update their own subscriptions (token refresh)
CREATE POLICY "users_update_own_push_subscriptions"
ON push_subscriptions FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════
-- 7. DELIVERY_ASSIGNMENTS TABLE SECURITY
-- ═══════════════════════════════════════════════════════════
-- GAP: Delivery assignments need access control

ALTER TABLE delivery_assignments ENABLE ROW LEVEL SECURITY;

-- Policy 1: Drivers can view their own assignments
CREATE POLICY "drivers_view_own_assignments"
ON delivery_assignments FOR SELECT
TO authenticated
USING (driver_id = auth.uid());

-- Policy 2: Sellers can view assignments for their orders
CREATE POLICY "sellers_view_order_assignments"
ON delivery_assignments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = delivery_assignments.order_id 
    AND orders.seller_id = auth.uid()
  )
);

-- Policy 3: Buyers can view assignments for their orders
CREATE POLICY "buyers_view_order_assignments"
ON delivery_assignments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = delivery_assignments.order_id 
    AND orders.user_id = auth.uid()
  )
);

-- Policy 4: Service role can manage
CREATE POLICY "service_role_manage_delivery_assignments"
ON delivery_assignments FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════
-- 8. DEALS TABLE SECURITY (if exists)
-- ═══════════════════════════════════════════════════════════
-- GAP: Deal data needs proper access control

-- Only enable if table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'deals') THEN
    ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Policy 1: Participants can view deals
CREATE POLICY "deal_participants_view_deals"
ON deals FOR SELECT
TO authenticated
USING (
  seller_id = auth.uid() OR 
  buyer_id = auth.uid() OR
  middleman_id = auth.uid()
);

-- Policy 2: Prevent direct modifications after creation
CREATE POLICY "prevent_deal_updates_after_creation"
ON deals FOR UPDATE
TO authenticated
USING (
  (seller_id = auth.uid() OR buyer_id = auth.uid() OR middleman_id = auth.uid()) AND
  OLD.status = 'pending'
)
WITH CHECK (true);

-- Policy 3: Service role can manage
CREATE POLICY "service_role_manage_deals"
ON deals FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════
-- 9. COMMISSION_TRACKING TABLE SECURITY (if exists)
-- ═══════════════════════════════════════════════════════════
-- GAP: Commission data is sensitive

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'commission_tracking') THEN
    ALTER TABLE commission_tracking ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Policy 1: Users can view their own commissions
CREATE POLICY "users_view_own_commissions"
ON commission_tracking FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy 2: Prevent direct modifications
CREATE POLICY "prevent_direct_commission_modifications"
ON commission_tracking FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- Policy 3: Service role can manage
CREATE POLICY "service_role_manage_commissions"
ON commission_tracking FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════
-- 10. USER_WALLETS TABLE SECURITY
-- ═══════════════════════════════════════════════════════════
-- CRITICAL: Wallet data must be locked down

ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own wallet
CREATE POLICY "users_view_own_wallet"
ON user_wallets FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy 2: Prevent direct updates to balance (must use transactions)
CREATE POLICY "prevent_direct_wallet_balance_updates"
ON user_wallets FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() AND
  OLD.balance = NEW.balance -- Balance can only be changed via Edge Function
)
WITH CHECK (true);

-- Policy 3: Users can update other fields (e.g., default payment method)
CREATE POLICY "users_update_own_wallet_metadata"
ON user_wallets FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid() AND
  OLD.balance = NEW.balance -- Cannot change balance directly
);

-- Policy 4: Service role can manage
CREATE POLICY "service_role_manage_wallets"
ON user_wallets FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════
-- VERIFICATION QUERIES
-- ═══════════════════════════════════════════════════════════
-- Run these to verify policies are in place:

-- Check all RLS-enabled tables
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename;

-- Check policies for specific tables
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies 
-- WHERE tablename IN ('payment_intentions', 'async_jobs', 'notifications')
-- ORDER BY tablename, policyname;

-- ═══════════════════════════════════════════════════════════
-- SECURITY NOTES
-- ═══════════════════════════════════════════════════════════
-- 1. These policies assume you have proper authentication
-- 2. Service role should ONLY be used in Edge Functions
-- 3. Never expose service_role key to client applications
-- 4. Test these policies thoroughly in staging before production
-- 5. Monitor pg_logs for policy violations

-- ═══════════════════════════════════════════════════════════
-- END OF CRITICAL RLS POLICIES
-- ═══════════════════════════════════════════════════════════
