-- ============================================
-- Phase 0: Emergency Patches
-- Run on STAGING first, then production
-- ============================================

BEGIN;

-- 1. Fix orders.seller_id: ON DELETE CASCADE → ON DELETE SET NULL
--    Prevents order history loss when a seller deletes their account
--    Note: This requires dropping and recreating the FK constraint
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_seller_id_fkey;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_seller_id_fkey
  FOREIGN KEY (seller_id) REFERENCES auth.users(id)
  ON DELETE SET NULL;

-- 2. Fix user_wallets: Add missing columns referenced by functions
--    Functions credit_wallet/debit_wallet expect these columns but they don't exist
ALTER TABLE public.user_wallets
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_transaction_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS total_spent NUMERIC(12,2) DEFAULT 0;

-- 3. Add missing FK: sales.customer_id → customers.id
ALTER TABLE public.sales
  ADD CONSTRAINT sales_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES public.customers(id)
  ON DELETE SET NULL;

-- 4. Add missing FK: sales.product_id → products.id
ALTER TABLE public.sales
  ADD CONSTRAINT sales_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES public.products(id)
  ON DELETE SET NULL;

-- 5. Drop leftover backup tables
DROP TABLE IF EXISTS public.categories_backup_20260308_124506;
DROP TABLE IF EXISTS public.sellers_backup;

-- 6. Fix users.account_type: Add CHECK constraint
--    First remove any invalid values
UPDATE public.users
SET account_type = 'user'
WHERE account_type NOT IN ('user', 'seller', 'factory', 'middleman', 'doctor', 'delivery_driver', 'admin');

-- Then add the constraint
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_account_type_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_account_type_check
  CHECK (account_type IN ('user', 'seller', 'factory', 'middleman', 'doctor', 'delivery_driver', 'admin'));

-- 7. Enable RLS on tables that are missing it
ALTER TABLE IF EXISTS public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payment_intentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.business_profiles ENABLE ROW LEVEL SECURITY;

-- 8. Add missing updated_at triggers
CREATE OR REPLACE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_payment_intentions_updated_at
  BEFORE UPDATE ON public.payment_intentions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_middleman_profiles_updated_at
  BEFORE UPDATE ON public.middleman_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_business_profiles_updated_at
  BEFORE UPDATE ON public.business_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Add missing performance indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_payment_intentions_user_id ON public.payment_intentions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_intentions_intent_id ON public.payment_intentions(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_asin ON public.wishlist(asin);
CREATE INDEX IF NOT EXISTS idx_shop_products_position ON public.shop_products(shop_id, position);
CREATE INDEX IF NOT EXISTS idx_template_requests_user_id ON public.template_requests(user_id);

-- 10. Fix shop_templates.created_by: Add ON DELETE SET NULL
ALTER TABLE public.shop_templates
  DROP CONSTRAINT IF EXISTS shop_templates_created_by_fkey;

ALTER TABLE public.shop_templates
  ADD CONSTRAINT shop_templates_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES auth.users(id)
  ON DELETE SET NULL;

COMMIT;
