-- ═══════════════════════════════════════════════════════════
-- DATABASE TRIGGERS FOR DATA INTEGRITY
-- ═══════════════════════════════════════════════════════════
-- Purpose: Maintain data consistency and automate business logic
-- Date: March 25, 2026
-- Priority: HIGH - Run after RLS policies and indexes
-- ═══════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════
-- 1. ORDER STATUS CHANGE TRIGGERS
-- ═══════════════════════════════════════════════════════════

-- Trigger 1: Update seller stats when order is delivered
CREATE OR REPLACE FUNCTION update_seller_stats_on_order_delivered()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger on status change to 'delivered'
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'delivered' THEN
    -- Update seller's total revenue
    UPDATE sellers
    SET total_revenue = COALESCE(total_revenue, 0) + NEW.total,
        updated_at = NOW()
    WHERE user_id = NEW.seller_id;
    
    -- Update seller's total orders
    UPDATE sellers
    SET total_orders = COALESCE(total_orders, 0) + 1
    WHERE user_id = NEW.seller_id;
    
    -- Create sales record for analytics
    INSERT INTO sales (seller_id, customer_id, amount, sale_date, order_id)
    VALUES (NEW.seller_id, NEW.user_id, NEW.total, NOW(), NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_seller_stats_on_order_delivered ON orders;
CREATE TRIGGER trg_update_seller_stats_on_order_delivered
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_seller_stats_on_order_delivered();

-- Trigger 2: Update product inventory when order is confirmed
CREATE OR REPLACE FUNCTION decrement_product_inventory_on_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when order moves to confirmed status
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'confirmed' THEN
    -- Decrement product quantity
    UPDATE products
    SET quantity = quantity - COALESCE(NEW.subtotal / NULLIF(NEW.total - NEW.shipping - NEW.tax, 0), 1),
        updated_at = NOW()
    WHERE id IN (
      SELECT product_id FROM order_items WHERE order_id = NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_decrement_inventory_on_order_confirmed ON orders;
CREATE TRIGGER trg_decrement_inventory_on_order_confirmed
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION decrement_product_inventory_on_order();

-- Trigger 3: Restore inventory if order is cancelled
CREATE OR REPLACE FUNCTION restore_product_inventory_on_cancel()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when order is cancelled
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'cancelled' THEN
    -- Restore product quantity
    UPDATE products
    SET quantity = quantity + COALESCE(OLD.subtotal / NULLIF(OLD.total - OLD.shipping - OLD.tax, 0), 1),
        updated_at = NOW()
    WHERE id IN (
      SELECT product_id FROM order_items WHERE order_id = OLD.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_restore_inventory_on_order_cancelled ON orders;
CREATE TRIGGER trg_restore_inventory_on_order_cancelled
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION restore_product_inventory_on_cancel();

-- ═══════════════════════════════════════════════════════════
-- 2. PRODUCT TRIGGERS
-- ═══════════════════════════════════════════════════════════

-- Trigger 4: Update seller product count
CREATE OR REPLACE FUNCTION update_seller_product_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    UPDATE sellers
    SET product_count = COALESCE(product_count, 0) + 1
    WHERE user_id = NEW.seller_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
    UPDATE sellers
    SET product_count = GREATEST(product_count - 1, 0)
    WHERE user_id = OLD.seller_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle status change
    IF OLD.status != NEW.status THEN
      IF NEW.status = 'active' THEN
        UPDATE sellers
        SET product_count = COALESCE(product_count, 0) + 1
        WHERE user_id = NEW.seller_id;
      ELSIF OLD.status = 'active' THEN
        UPDATE sellers
        SET product_count = GREATEST(product_count - 1, 0)
        WHERE user_id = NEW.seller_id;
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_seller_product_count ON products;
CREATE TRIGGER trg_update_seller_product_count
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_seller_product_count();

-- Trigger 5: Auto-generate product description from title (if empty)
CREATE OR REPLACE FUNCTION auto_generate_product_description()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.description IS NULL OR NEW.description = '' THEN
    NEW.description := 'High-quality ' || NEW.title || '. Available now.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_generate_description ON products;
CREATE TRIGGER trg_auto_generate_description
  BEFORE INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_product_description();

-- Trigger 6: Prevent price decrease below cost (if cost tracking enabled)
CREATE OR REPLACE FUNCTION validate_product_price()
RETURNS TRIGGER AS $$
BEGIN
  -- If cost field exists, prevent selling below cost
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'cost') THEN
    IF NEW.price < NEW.cost THEN
      RAISE EXCEPTION 'Product price cannot be below cost (Price: %, Cost: %)', NEW.price, NEW.cost;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_product_price ON products;
CREATE TRIGGER trg_validate_product_price
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION validate_product_price();

-- ═══════════════════════════════════════════════════════════
-- 3. USER & PROFILE TRIGGERS
-- ═══════════════════════════════════════════════════════════

-- Trigger 7: Auto-create wallet for new users
CREATE OR REPLACE FUNCTION auto_create_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_wallets (user_id, balance, currency)
  VALUES (NEW.id, 0, 'USD')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only create trigger if wallet table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_wallets') THEN
    DROP TRIGGER IF EXISTS trg_auto_create_wallet ON users;
    CREATE TRIGGER trg_auto_create_wallet
      AFTER INSERT ON users
      FOR EACH ROW
      EXECUTE FUNCTION auto_create_user_wallet();
  END IF;
END $$;

-- Trigger 8: Update user last_seen timestamp
CREATE OR REPLACE FUNCTION update_user_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_seen = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_user_last_seen ON users;
CREATE TRIGGER trg_update_user_last_seen
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_user_last_seen();

-- ═══════════════════════════════════════════════════════════
-- 4. MESSAGING TRIGGERS
-- ═══════════════════════════════════════════════════════════

-- Trigger 9: Auto-archive old messages (scheduled via pg_cron)
CREATE OR REPLACE FUNCTION archive_old_messages()
RETURNS void AS $$
BEGIN
  -- Archive messages older than 2 years
  INSERT INTO message_archives (conversation_id, message_data, archived_at)
  SELECT 
    conversation_id,
    jsonb_agg(to_jsonb(messages)),
    NOW()
  FROM messages
  WHERE created_at < NOW() - INTERVAL '2 years'
  AND id NOT IN (SELECT message_id FROM message_archives)
  GROUP BY conversation_id;
  
  -- Delete archived messages
  DELETE FROM messages
  WHERE created_at < NOW() - INTERVAL '2 years'
  AND id IN (SELECT message_id FROM message_archives);
END;
$$ LANGUAGE plpgsql;

-- Schedule with pg_cron (run daily at 3 AM)
SELECT cron.schedule(
  'archive-old-messages',
  '0 3 * * *',
  $$SELECT archive_old_messages()$$
);

-- Trigger 10: Update conversation unread count
CREATE OR REPLACE FUNCTION update_conversation_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE conversations
    SET unread_count = COALESCE(unread_count, 0) + 1,
        last_message_at = NOW()
    WHERE id = NEW.conversation_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.is_read = false AND NEW.is_read = true THEN
    UPDATE conversations
    SET unread_count = GREATEST(COALESCE(unread_count, 1) - 1, 0)
    WHERE id = NEW.conversation_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_conversation_unread ON messages;
CREATE TRIGGER trg_update_conversation_unread
  AFTER INSERT OR UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_unread_count();

-- ═══════════════════════════════════════════════════════════
-- 5. PAYMENT TRIGGERS
-- ═══════════════════════════════════════════════════════════

-- Trigger 11: Log payment status changes
CREATE OR REPLACE FUNCTION log_payment_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO audit_logs (event, severity, description, metadata, user_id)
    VALUES (
      'PAYMENT_STATUS_CHANGE',
      CASE 
        WHEN NEW.status = 'failed' THEN 'high'
        WHEN NEW.status = 'succeeded' THEN 'low'
        ELSE 'medium'
      END,
      'Payment status changed from ' || COALESCE(OLD.status, 'NULL') || ' to ' || NEW.status,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'amount', NEW.amount,
        'order_id', NEW.order_id
      ),
      NEW.user_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_payment_status_change ON payment_intentions;
CREATE TRIGGER trg_log_payment_status_change
  AFTER UPDATE ON payment_intentions
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION log_payment_status_change();

-- Trigger 12: Auto-update order payment status
CREATE OR REPLACE FUNCTION update_order_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'succeeded' THEN
    UPDATE orders
    SET payment_status = 'paid',
        updated_at = NOW()
    WHERE id = NEW.order_id;
  ELSIF NEW.status = 'failed' THEN
    UPDATE orders
    SET payment_status = 'failed',
        updated_at = NOW()
    WHERE id = NEW.order_id;
  ELSIF NEW.status = 'refunded' THEN
    UPDATE orders
    SET payment_status = 'refunded',
        updated_at = NOW()
    WHERE id = NEW.order_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_order_payment_status ON payment_intentions;
CREATE TRIGGER trg_update_order_payment_status
  AFTER UPDATE ON payment_intentions
  FOR EACH ROW
  EXECUTE FUNCTION update_order_payment_status();

-- ═══════════════════════════════════════════════════════════
-- 6. REVIEW & RATING TRIGGERS
-- ═══════════════════════════════════════════════════════════

-- Trigger 13: Update product average rating
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating NUMERIC;
BEGIN
  IF TG_OP = 'DELETE' THEN
    OLD.asin := OLD.asin;
  END IF;
  
  SELECT AVG(rating) INTO avg_rating
  FROM reviews
  WHERE asin = COALESCE(NEW.asin, OLD.asin)
  AND is_approved = true;
  
  UPDATE products
  SET average_rating = COALESCE(avg_rating, 0),
      updated_at = NOW()
  WHERE asin = COALESCE(NEW.asin, OLD.asin);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_product_rating ON reviews;
CREATE TRIGGER trg_update_product_rating
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_product_rating();

-- Trigger 14: Verify purchase before allowing review
CREATE OR REPLACE FUNCTION verify_purchase_before_review()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user actually purchased the product
  IF NOT EXISTS (
    SELECT 1 FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    WHERE o.user_id = NEW.user_id
    AND oi.asin = NEW.asin
    AND o.status = 'delivered'
  ) THEN
    NEW.is_verified_purchase := false;
    -- Optionally: RAISE EXCEPTION 'Cannot review products you have not purchased';
  ELSE
    NEW.is_verified_purchase := true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_verify_purchase_review ON reviews;
CREATE TRIGGER trg_verify_purchase_review
  BEFORE INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION verify_purchase_before_review();

-- ═══════════════════════════════════════════════════════════
-- 7. INVENTORY TRIGGERS
-- ═══════════════════════════════════════════════════════════

-- Trigger 15: Low stock alert notification
CREATE OR REPLACE FUNCTION check_low_stock_and_notify()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if quantity is low and wasn't low before (or is new)
  IF NEW.quantity <= 10 AND (TG_OP = 'INSERT' OR OLD.quantity > 10) THEN
    -- Notify seller
    INSERT INTO notifications (user_id, type, title, message, metadata)
    SELECT 
      seller_id,
      'inventory_alert',
      'Low Stock Alert: ' || LEFT(title, 50),
      'Product "' || LEFT(title, 50) || '" has only ' || NEW.quantity || ' items left in stock.',
      jsonb_build_object(
        'product_id', NEW.id,
        'current_quantity', NEW.quantity,
        'threshold', 10
      )
    FROM products
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_low_stock_alert ON products;
CREATE TRIGGER trg_low_stock_alert
  AFTER INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION check_low_stock_and_notify();

-- ═══════════════════════════════════════════════════════════
-- 8. WALLET TRANSACTION TRIGGERS
-- ═══════════════════════════════════════════════════════════

-- Trigger 16: Log wallet balance changes
CREATE OR REPLACE FUNCTION log_wallet_transaction()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.balance IS DISTINCT FROM NEW.balance THEN
    INSERT INTO wallet_transactions (user_id, amount, balance_after, transaction_type, description)
    VALUES (
      NEW.user_id,
      NEW.balance - OLD.balance,
      NEW.balance,
      CASE 
        WHEN NEW.balance > OLD.balance THEN 'credit'
        ELSE 'debit'
      END,
      'Balance change: ' || (NEW.balance - OLD.balance)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only create if wallet_transactions table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'wallet_transactions') 
     AND EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_wallets') THEN
    DROP TRIGGER IF EXISTS trg_log_wallet_transaction ON user_wallets;
    CREATE TRIGGER trg_log_wallet_transaction
      AFTER UPDATE ON user_wallets
      FOR EACH ROW
      WHEN (OLD.balance IS DISTINCT FROM NEW.balance)
      EXECUTE FUNCTION log_wallet_transaction();
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════
-- 9. DATA CLEANUP TRIGGERS (Scheduled via pg_cron)
-- ═══════════════════════════════════════════════════════════

-- Trigger 17: Clean up expired sessions/tokens
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  -- Delete expired refresh tokens (handled by Supabase auth)
  -- Delete expired password reset tokens
  DELETE FROM password_reset_tokens
  WHERE expires_at < NOW();
  
  -- Delete expired verification codes
  DELETE FROM verification_codes
  WHERE expires_at < NOW();
  
  -- Clean up abandoned carts (older than 30 days)
  DELETE FROM cart_items
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule daily cleanup
SELECT cron.schedule(
  'cleanup-expired-data',
  '0 4 * * *',
  $$SELECT cleanup_expired_sessions()$$
);

-- Trigger 18: Archive old notifications
CREATE OR REPLACE FUNCTION archive_old_notifications()
RETURNS void AS $$
BEGIN
  -- Delete read notifications older than 90 days
  DELETE FROM notifications
  WHERE is_read = true
  AND created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

SELECT cron.schedule(
  'archive-old-notifications',
  '0 5 * * *',
  $$SELECT archive_old_notifications()$$
);

-- ═══════════════════════════════════════════════════════════
-- 10. AUDIT LOG TRIGGERS
-- ═══════════════════════════════════════════════════════════

-- Trigger 19: Auto-log sensitive data changes
CREATE OR REPLACE FUNCTION audit_sensitive_data_changes()
RETURNS TRIGGER AS $$
DECLARE
  changes JSONB;
BEGIN
  changes := jsonb_build_object();
  
  -- Track specific sensitive field changes
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    changes := jsonb_set(changes, '{email}', jsonb_build_object('old', OLD.email, 'new', NEW.email));
  END IF;
  
  IF OLD.phone IS DISTINCT FROM NEW.phone THEN
    changes := jsonb_set(changes, '{phone}', jsonb_build_object('old', OLD.phone, 'new', NEW.phone));
  END IF;
  
  IF jsonb_typeof(changes) = 'object' AND jsonb_array_length(changes) > 0 THEN
    INSERT INTO audit_logs (event, severity, description, metadata, user_id)
    VALUES (
      'SENSITIVE_DATA_CHANGE',
      'medium',
      'User sensitive data was modified',
      jsonb_build_object('changes', changes),
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_sensitive_user_changes ON users;
CREATE TRIGGER trg_audit_sensitive_user_changes
  AFTER UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION audit_sensitive_data_changes();

-- ═══════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════

-- List all triggers:
-- SELECT 
--   trigger_name,
--   event_manipulation,
--   event_object_table,
--   action_statement
-- FROM information_schema.triggers
-- WHERE trigger_schema = 'public'
-- ORDER BY event_object_table, trigger_name;

-- List all scheduled jobs:
-- SELECT * FROM cron.job;

-- ═══════════════════════════════════════════════════════════
-- END OF DATABASE TRIGGERS
-- ═══════════════════════════════════════════════════════════
