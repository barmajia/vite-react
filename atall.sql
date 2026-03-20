


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "hypopg" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "index_advisor" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgmq";






CREATE EXTENSION IF NOT EXISTS "postgis" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."engagement_model" AS ENUM (
    'online_only',
    'offline_only',
    'hybrid',
    'project_based',
    'hourly'
);


ALTER TYPE "public"."engagement_model" OWNER TO "postgres";


CREATE TYPE "public"."factory_order_status" AS ENUM (
    'pending',
    'in_production',
    'quality_check',
    'ready_to_ship',
    'shipped',
    'delivered',
    'cancelled'
);


ALTER TYPE "public"."factory_order_status" OWNER TO "postgres";


CREATE TYPE "public"."provider_category" AS ENUM (
    'health',
    'freelance',
    'home_service',
    'professional',
    'education'
);


ALTER TYPE "public"."provider_category" OWNER TO "postgres";


CREATE TYPE "public"."trading_conv_type" AS ENUM (
    'product_inquiry',
    'custom_request',
    'b2b_sourcing',
    'middleman_restock'
);


ALTER TYPE "public"."trading_conv_type" OWNER TO "postgres";


CREATE TYPE "public"."trading_msg_type" AS ENUM (
    'text',
    'image',
    'file',
    'system_notification'
);


ALTER TYPE "public"."trading_msg_type" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'factory',
    'seller',
    'middleman',
    'customer',
    'delivery'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_seller_to_conversation"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_seller_id UUID;
BEGIN
  -- Get the seller ID from the products table
  SELECT seller_id INTO v_seller_id
  FROM public.products
  WHERE id = NEW.product_id;

  IF v_seller_id IS NOT NULL THEN
    INSERT INTO public.conversation_participants (conversation_id, user_id, role)
    VALUES (NEW.id, v_seller_id, 'seller')
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."add_seller_to_conversation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assign_delivery_to_driver"("p_order_id" "uuid", "p_seller_latitude" numeric, "p_seller_longitude" numeric) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_driver_id UUID;
BEGIN
  -- Find nearest available verified driver
  SELECT dp.user_id INTO v_driver_id
  FROM delivery_profiles dp
  WHERE dp.is_active = true
    AND dp.is_verified = true
    AND dp.latitude IS NOT NULL
    AND dp.longitude IS NOT NULL
  ORDER BY haversine_distance(p_seller_latitude, p_seller_longitude, dp.latitude, dp.longitude)
  LIMIT 1;
  
  IF v_driver_id IS NOT NULL THEN
    -- Update order with assigned driver
    UPDATE public.orders
    SET 
      delivery_id = v_driver_id,
      delivery_status = 'assigned',
      updated_at = NOW()
    WHERE id = p_order_id;
    
    -- Create assignment record
    INSERT INTO public.delivery_assignments (order_id, driver_id, status)
    VALUES (p_order_id, v_driver_id, 'assigned');
  END IF;
  
  RETURN v_driver_id;
END;
$$;


ALTER FUNCTION "public"."assign_delivery_to_driver"("p_order_id" "uuid", "p_seller_latitude" numeric, "p_seller_longitude" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_distance"("lat1" numeric, "lon1" numeric, "lat2" numeric, "lon2" numeric) RETURNS numeric
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
  R DECIMAL := 6371;
  dLat DECIMAL;
  dLon DECIMAL;
  a DECIMAL;
  c DECIMAL;
  distance DECIMAL;
BEGIN
  dLat := RADIANS(lat2 - lat1);
  dLon := RADIANS(lon2 - lon1);
  
  a := SIN(dLat/2) * SIN(dLat/2) +
       COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
       SIN(dLon/2) * SIN(dLon/2);
  
  c := 2 * ATAN2(SQRT(a), SQRT(1-a));
  distance := R * c;
  
  RETURN ROUND(distance::numeric, 2);
END;
$$;


ALTER FUNCTION "public"."calculate_distance"("lat1" numeric, "lon1" numeric, "lat2" numeric, "lon2" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_middle_man_commission"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_commission numeric;
  v_rate numeric;
  v_margin numeric;
  v_deal_id uuid;
  v_product_asin text;
BEGIN
  -- Only calculate if Middle Man exists and Order is Confirmed
  IF NEW.middle_man_id IS NOT NULL 
     AND NEW.status = 'confirmed' 
     AND OLD.status IS DISTINCT FROM 'confirmed' THEN
    
    -- Get product ASIN from order_items
    SELECT oi.asin INTO v_product_asin 
    FROM public.order_items oi 
    WHERE oi.order_id = NEW.id 
    LIMIT 1;
    
    -- Get deal-specific commission rate
    SELECT commission_rate, margin_amount, id 
    INTO v_rate, v_margin, v_deal_id
    FROM public.middle_man_deals 
    WHERE middle_man_id = NEW.middle_man_id 
      AND product_asin = v_product_asin
    LIMIT 1;
    
    -- Default rate if no deal found
    v_rate := COALESCE(v_rate, 5.00);
    
    -- Calculate commission: percentage OR fixed margin
    IF COALESCE(v_margin, 0) > 0 THEN
      v_commission := v_margin;
    ELSE
      v_commission := (NEW.total * (v_rate / 100));
    END IF;
    
    -- Create commission record
    INSERT INTO public.commissions (
      middle_man_id,
      order_id,
      deal_id,
      amount,
      commission_rate,
      status
    ) VALUES (
      NEW.middle_man_id,
      NEW.id,
      v_deal_id,
      v_commission,
      v_rate,
      'pending'
    );
    
    -- Update pending earnings
    UPDATE public.middle_men 
    SET pending_earnings = pending_earnings + v_commission 
    WHERE user_id = NEW.middle_man_id;
    
    -- Update deal stats
    UPDATE public.middle_man_deals
    SET conversions = conversions + 1,
        total_revenue = total_revenue + NEW.total,
        updated_at = now()
    WHERE id = v_deal_id;
    
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."calculate_middle_man_commission"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_middle_man_margin"("p_product_asin" "text", "p_commission_rate" numeric DEFAULT 5.00, "p_margin_amount" numeric DEFAULT 0) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_product_price numeric;
  v_commission numeric;
BEGIN
  -- Get product price
  SELECT price INTO v_product_price FROM public.products WHERE asin = p_product_asin LIMIT 1;
  
  IF v_product_price IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  -- Calculate logic
  IF p_margin_amount > 0 THEN
    v_commission := p_margin_amount;
  ELSE
    v_commission := v_product_price * (p_commission_rate / 100);
  END IF;

  RETURN jsonb_build_object(
    'product_price', v_product_price,
    'commission_rate', p_commission_rate,
    'margin_amount', p_margin_amount,
    'estimated_earnings', v_commission,
    'customer_final_price', v_product_price -- Assuming price doesn't change, just split
  );
END;
$$;


ALTER FUNCTION "public"."calculate_middle_man_margin"("p_product_asin" "text", "p_commission_rate" numeric, "p_margin_amount" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_order_commission"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.deal_id IS NOT NULL THEN
    -- Get commission rate from deal (or use a default)
    SELECT commission_rate INTO NEW.commission_rate
    FROM deals WHERE id = NEW.deal_id;
    
    NEW.commission_amount := NEW.subtotal * (NEW.commission_rate / 100);
  ELSE
    NEW.commission_rate := NULL;
    NEW.commission_amount := NULL;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."calculate_order_commission"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_seller_analytics"("p_seller_id" "uuid", "p_period_type" "text" DEFAULT '30d'::"text", "p_start_date" "date" DEFAULT NULL::"date", "p_end_date" "date" DEFAULT NULL::"date") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
  v_days INTEGER;
  v_result JSONB;
BEGIN
  -- Security check: ensure caller can only access their own data
  IF auth.uid() IS NOT NULL AND auth.uid() != p_seller_id THEN
    RAISE EXCEPTION 'Access denied: can only view own analytics';
  END IF;

  IF p_start_date IS NOT NULL AND p_end_date IS NOT NULL THEN
    v_start_date := p_start_date;
    v_end_date := p_end_date;
    v_days := (p_end_date - p_start_date) + 1;
  ELSE
    IF p_period_type LIKE '%y' THEN
      v_days := (SUBSTRING(p_period_type FROM '(\d+)')::INTEGER) * 365;
    ELSIF p_period_type LIKE '%d' THEN
      v_days := SUBSTRING(p_period_type FROM '(\d+)')::INTEGER;
    ELSE
      v_days := 30;
    END IF;
    v_end_date := CURRENT_DATE;
    v_start_date := v_end_date - (v_days - 1);
  END IF;

  WITH sales_data AS (
    SELECT
      COUNT(*) as total_sales,
      COALESCE(SUM(total_price), 0) as total_revenue,
      COALESCE(SUM(quantity), 0) as total_items_sold,
      COALESCE(AVG(total_price), 0) as average_order_value,
      COUNT(DISTINCT customer_id) as unique_customers
    FROM sales
    WHERE seller_id = p_seller_id
    AND sale_date >= v_start_date
    AND sale_date <= v_end_date
  ),
  customer_data AS (
    SELECT COUNT(*) as total_customers
    FROM customers
    WHERE seller_id = p_seller_id
  ),
  top_products AS (
    SELECT
      COALESCE(p.title, s.product_id::TEXT) as product_name,
      s.product_id,
      COUNT(*) as times_sold,
      SUM(s.quantity) as units_sold,
      SUM(s.total_price) as revenue
    FROM sales s
    LEFT JOIN products p ON p.id = s.product_id
    WHERE s.seller_id = p_seller_id
    AND s.sale_date >= v_start_date
    AND s.sale_date <= v_end_date
    GROUP BY s.product_id, p.title
    ORDER BY revenue DESC
    LIMIT 5
  ),
  top_customers AS (
    SELECT
      c.id, c.name, c.phone,
      COUNT(s.id) as orders_in_period,
      SUM(s.total_price) as spent_in_period
    FROM customers c
    LEFT JOIN sales s ON s.customer_id = c.id
    AND s.sale_date >= v_start_date AND s.sale_date <= v_end_date
    WHERE c.seller_id = p_seller_id
    GROUP BY c.id, c.name, c.phone
    ORDER BY spent_in_period DESC NULLS LAST
    LIMIT 5
  ),
  daily_breakdown AS (
    SELECT
      DATE(sale_date) as date,
      COUNT(*) as sales,
      SUM(total_price) as revenue
    FROM sales
    WHERE seller_id = p_seller_id
    AND sale_date >= v_start_date AND sale_date <= v_end_date
    GROUP BY DATE(sale_date)
    ORDER BY date
  )
  SELECT jsonb_build_object(
    'seller_id', p_seller_id,
    'period', p_period_type,
    'period_days', v_days,
    'start_date', v_start_date,
    'end_date', v_end_date,
    'generated_at', NOW(),
    'kpis', jsonb_build_object(
      'total_revenue', COALESCE(sd.total_revenue, 0),
      'total_sales', COALESCE(sd.total_sales, 0),
      'total_items_sold', COALESCE(sd.total_items_sold, 0),
      'total_customers', COALESCE(cd.total_customers, 0),
      'unique_customers_in_period', COALESCE(sd.unique_customers, 0),
      'average_order_value', COALESCE(sd.average_order_value, 0),
      'conversion_rate', CASE
        WHEN cd.total_customers > 0
        THEN ROUND((sd.unique_customers::NUMERIC / cd.total_customers::NUMERIC) * 100, 2)
        ELSE 0
      END
    ),
    'top_products', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'id', tp.product_id, 'name', tp.product_name,
        'times_sold', tp.times_sold, 'units_sold', tp.units_sold,
        'revenue', tp.revenue
      )) FROM top_products tp),
      '[]'::jsonb
    ),
    'top_customers', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'id', tc.id, 'name', tc.name, 'phone', tc.phone,
        'orders_in_period', tc.orders_in_period,
        'spent_in_period', tc.spent_in_period
      )) FROM top_customers tc),
      '[]'::jsonb
    ),
    'daily_breakdown', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'date', db.date, 'sales', db.sales, 'revenue', db.revenue
      )) FROM daily_breakdown db),
      '[]'::jsonb
    )
  ) INTO v_result
  FROM sales_data sd, customer_data cd;

  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."calculate_seller_analytics"("p_seller_id" "uuid", "p_period_type" "text", "p_start_date" "date", "p_end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_start_conversation"("from_user_id" "uuid", "to_user_id" "uuid", "product_id" "uuid" DEFAULT NULL::"uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
DECLARE
  from_role users.account_type%TYPE;
  to_role users.account_type%TYPE;
  product_owner_id UUID;
  product_allows BOOLEAN;
BEGIN
  -- Security check
  IF auth.uid() IS NOT NULL AND auth.uid() != from_user_id THEN
    RAISE EXCEPTION 'Access denied: can only initiate conversations as yourself';
  END IF;

  SELECT account_type INTO from_role FROM users WHERE user_id = from_user_id;
  SELECT account_type INTO to_role FROM users WHERE user_id = to_user_id;

  IF from_user_id = to_user_id THEN RETURN FALSE; END IF;
  IF from_role = 'factory' AND to_role IN ('seller', 'middleman') THEN RETURN TRUE; END IF;
  IF from_role = 'seller' THEN
    IF to_role IN ('factory', 'middleman') THEN RETURN TRUE;
    ELSIF to_role = 'customer' THEN
      IF product_id IS NULL THEN RETURN FALSE; END IF;
      SELECT seller_id, allow_chat INTO product_owner_id, product_allows
      FROM products WHERE id = product_id;
      RETURN (product_owner_id = from_user_id) AND product_allows;
    END IF;
  END IF;
  IF from_role = 'middleman' THEN RETURN TRUE; END IF;
  IF from_role = 'customer' THEN
    IF to_role = 'seller' AND product_id IS NOT NULL THEN
      SELECT seller_id, allow_chat INTO product_owner_id, product_allows
      FROM products WHERE id = product_id;
      RETURN (product_owner_id = to_user_id) AND product_allows;
    END IF;
  END IF;
  RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."can_start_conversation"("from_user_id" "uuid", "to_user_id" "uuid", "product_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_start_conversation"("from_user_id" "uuid", "to_user_id" "uuid", "product_id" "uuid" DEFAULT NULL::"uuid", "conversation_type" "text" DEFAULT 'general'::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
DECLARE
  from_role users.account_type%TYPE;
  to_role users.account_type%TYPE;
  product_owner_id UUID;
  product_allows BOOLEAN;
BEGIN
  -- Security check
  IF auth.uid() IS NOT NULL AND auth.uid() != from_user_id THEN
    RAISE EXCEPTION 'Access denied: can only initiate conversations as yourself';
  END IF;

  -- Get user roles
  SELECT account_type INTO from_role FROM users WHERE user_id = from_user_id;
  SELECT account_type INTO to_role FROM users WHERE user_id = to_user_id;

  -- Cannot chat with self
  IF from_user_id = to_user_id THEN 
    RETURN FALSE; 
  END IF;

  -- Deal negotiation conversations (factory ↔ seller/middleman)
  IF conversation_type = 'deal_negotiation' THEN
    IF from_role = 'factory' AND to_role IN ('seller', 'middleman') THEN 
      RETURN TRUE; 
    END IF;
    IF from_role = 'seller' AND to_role = 'factory' THEN 
      RETURN TRUE; 
    END IF;
    IF from_role = 'middleman' THEN 
      RETURN TRUE; 
    END IF;
  END IF;

  -- Factory can message sellers/middlemen for general chat
  IF from_role = 'factory' AND to_role IN ('seller', 'middleman') THEN 
    RETURN TRUE; 
  END IF;

  -- Seller can message factory/middleman
  IF from_role = 'seller' THEN
    IF to_role IN ('factory', 'middleman') THEN 
      RETURN TRUE;
    ELSIF to_role = 'customer' THEN
      IF product_id IS NULL THEN RETURN FALSE; END IF;
      SELECT seller_id, allow_chat INTO product_owner_id, product_allows
      FROM products WHERE id = product_id;
      RETURN (product_owner_id = from_user_id) AND product_allows;
    END IF;
  END IF;

  -- Middleman can message anyone
  IF from_role = 'middleman' THEN 
    RETURN TRUE; 
  END IF;

  -- Customer can message seller about products
  IF from_role = 'customer' OR from_role = 'user' THEN
    IF to_role = 'seller' AND product_id IS NOT NULL THEN
      SELECT seller_id, allow_chat INTO product_owner_id, product_allows
      FROM products WHERE id = product_id;
      RETURN (product_owner_id = to_user_id) AND product_allows;
    END IF;
  END IF;

  RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."can_start_conversation"("from_user_id" "uuid", "to_user_id" "uuid", "product_id" "uuid", "conversation_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_idempotency_keys"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
BEGIN
  DELETE FROM public.idempotency_keys
  WHERE expires_at < NOW();
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_idempotency_keys"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_product_images"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Delete old images that are no longer in the array
  IF TG_OP = 'UPDATE' AND OLD.images IS DISTINCT FROM NEW.images THEN
    -- Logic to delete unused images can be added here
    NULL;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."cleanup_product_images"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_analytics_snapshot"("p_seller_id" "uuid", "p_period_type" "text" DEFAULT '30d'::"text", "p_start_date" "date" DEFAULT NULL::"date", "p_end_date" "date" DEFAULT NULL::"date") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
DECLARE
  v_snapshot_id UUID;
  v_analytics_data JSONB;
  v_period_start DATE;
  v_period_end DATE;
BEGIN
  -- Security check
  IF auth.uid() IS NOT NULL AND auth.uid() != p_seller_id THEN
    RAISE EXCEPTION 'Access denied: can only create snapshots for own account';
  END IF;

  IF p_start_date IS NOT NULL AND p_end_date IS NOT NULL THEN
    v_period_start := p_start_date;
    v_period_end := p_end_date;
  ELSE
    IF p_period_type LIKE '%y' THEN
      v_period_end := CURRENT_DATE;
      v_period_start := v_period_end - ((SUBSTRING(p_period_type FROM '(\d+)')::INTEGER) * 365 - 1);
    ELSIF p_period_type LIKE '%d' THEN
      v_period_end := CURRENT_DATE;
      v_period_start := v_period_end - (SUBSTRING(p_period_type FROM '(\d+)')::INTEGER - 1);
    ELSE
      v_period_end := CURRENT_DATE;
      v_period_start := v_period_end - 29;
    END IF;
  END IF;

  v_analytics_data := calculate_seller_analytics(p_seller_id, p_period_type, p_start_date, p_end_date);

  UPDATE analytics_snapshots
  SET is_current = false
  WHERE seller_id = p_seller_id
  AND period_type = p_period_type
  AND period_start = v_period_start
  AND period_end = v_period_end;

  INSERT INTO analytics_snapshots (
    seller_id, period_type, period_start, period_end,
    analytics_data, is_current
  ) VALUES (
    p_seller_id, p_period_type, v_period_start, v_period_end,
    v_analytics_data, true
  )
  ON CONFLICT (seller_id, period_type, period_start, period_end)
  DO UPDATE SET
    analytics_data = EXCLUDED.analytics_data,
    is_current = true,
    updated_at = NOW()
  RETURNING id INTO v_snapshot_id;

  RETURN v_snapshot_id;
END;
$$;


ALTER FUNCTION "public"."create_analytics_snapshot"("p_seller_id" "uuid", "p_period_type" "text", "p_start_date" "date", "p_end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_middle_man_deal"("p_middle_man_id" "uuid", "p_product_asin" "text", "p_commission_rate" numeric DEFAULT 5.00, "p_margin_amount" numeric DEFAULT 0) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_deal_id uuid;
  v_unique_slug text;
  v_product_id uuid;
BEGIN
  -- Get product_id from asin
  SELECT id INTO v_product_id FROM public.products WHERE asin = p_product_asin;
  
  -- Generate unique slug: mm-{middle_man_uuid}-{asin}
  v_unique_slug := 'mm-' || p_middle_man_id || '-' || p_product_asin;
  
  -- Insert or update deal
  INSERT INTO public.middle_man_deals (
    middle_man_id,
    product_asin,
    product_id,
    commission_rate,
    margin_amount,
    unique_slug,
    is_active
  ) VALUES (
    p_middle_man_id,
    p_product_asin,
    v_product_id,
    p_commission_rate,
    p_margin_amount,
    v_unique_slug,
    true
  )
  ON CONFLICT (middle_man_id, product_asin)
  DO UPDATE SET
    commission_rate = EXCLUDED.commission_rate,
    margin_amount = EXCLUDED.margin_amount,
    is_active = true,
    updated_at = now()
  RETURNING id INTO v_deal_id;
  
  RETURN v_deal_id;
END;
$$;


ALTER FUNCTION "public"."create_middle_man_deal"("p_middle_man_id" "uuid", "p_product_asin" "text", "p_commission_rate" numeric, "p_margin_amount" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_or_update_middle_man_deal"("p_product_asin" "text", "p_commission_rate" numeric DEFAULT 5.00, "p_margin_amount" numeric DEFAULT 0) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_deal_id uuid;
  v_middle_man_id uuid;
  v_product_id uuid;
  v_slug text;
BEGIN
  -- Get Current User ID
  v_middle_man_id := auth.uid();
  
  -- Verify User is a Middle Man
  IF NOT EXISTS (SELECT 1 FROM public.middle_men WHERE user_id = v_middle_man_id) THEN
    RAISE EXCEPTION 'User is not registered as a Middle Man';
  END IF;

  -- Get Product ID
  SELECT id INTO v_product_id FROM public.products WHERE asin = p_product_asin LIMIT 1;
  IF v_product_id IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  -- Generate Slug
  v_slug := 'mm-' || substr(v_middle_man_id::text, 1, 8) || '-' || p_product_asin;

  -- Insert or Update
  INSERT INTO public.middle_man_deals (
    middle_man_id,
    product_asin,
    product_id,
    commission_rate,
    margin_amount,
    unique_slug,
    is_active
  ) VALUES (
    v_middle_man_id,
    p_product_asin,
    v_product_id,
    p_commission_rate,
    p_margin_amount,
    v_slug,
    true
  )
  ON CONFLICT (middle_man_id, product_asin) DO UPDATE SET
    commission_rate = EXCLUDED.commission_rate,
    margin_amount = EXCLUDED.margin_amount,
    is_active = true,
    updated_at = now()
  RETURNING id INTO v_deal_id;

  RETURN v_deal_id;
END;
$$;


ALTER FUNCTION "public"."create_or_update_middle_man_deal"("p_product_asin" "text", "p_commission_rate" numeric, "p_margin_amount" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_order_notification"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, metadata)
  VALUES (
    NEW.user_id,
    'order',
    'Order Status Updated',
    'Your order is now ' || NEW.status,
    jsonb_build_object('link', '/orders/' || NEW.id, 'order_id', NEW.id)
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_order_notification"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrement_product_inventory"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Lock the product row to prevent race conditions
    PERFORM 1 FROM public.products 
    WHERE asin = NEW.asin 
    FOR UPDATE;
    
    -- Check inventory before decrementing
    IF (SELECT quantity FROM public.products WHERE asin = NEW.asin) < NEW.quantity THEN
      RAISE EXCEPTION 'Insufficient inventory for ASIN: %. Available: %, Requested: %', 
        NEW.asin, 
        (SELECT quantity FROM public.products WHERE asin = NEW.asin),
        NEW.quantity;
    END IF;
    
    -- Safe decrement
    UPDATE public.products
    SET quantity = quantity - NEW.quantity,
        updated_at = NOW()
    WHERE asin = NEW.asin;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."decrement_product_inventory"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."dequeue_job"("p_queue_name" "text", "p_visibility_timeout_seconds" integer DEFAULT 30) RETURNS TABLE("id" "uuid", "payload" "jsonb", "attempts" integer)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  UPDATE public.async_jobs
  SET 
    status = 'processing',
    attempts = attempts + 1,
    processed_at = NOW()
  WHERE id = (
    SELECT id 
    FROM public.async_jobs 
    WHERE queue_name = p_queue_name 
      AND status = 'pending' 
      AND scheduled_for <= NOW()
    ORDER BY scheduled_for ASC, created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING id, payload, attempts;
END;
$$;


ALTER FUNCTION "public"."dequeue_job"("p_queue_name" "text", "p_visibility_timeout_seconds" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enqueue_job"("p_queue_name" "text", "p_payload" "jsonb", "p_scheduled_for" timestamp with time zone DEFAULT "now"()) RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_job_id UUID;
BEGIN
  INSERT INTO public.async_jobs (queue_name, payload, scheduled_for)
  VALUES (p_queue_name, p_payload, p_scheduled_for)
  RETURNING id INTO v_job_id;
  
  -- Notify listeners
  PERFORM pg_notify('job_queue_' || p_queue_name, v_job_id::text);
  
  RETURN v_job_id;
END;
$$;


ALTER FUNCTION "public"."enqueue_job"("p_queue_name" "text", "p_payload" "jsonb", "p_scheduled_for" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."find_nearby_drivers"("p_latitude" numeric, "p_longitude" numeric, "p_max_distance_km" numeric DEFAULT 50, "p_limit_count" integer DEFAULT 20) RETURNS TABLE("driver_id" "uuid", "full_name" "text", "vehicle_type" "text", "latitude" numeric, "longitude" numeric, "distance_km" numeric, "rating" numeric, "is_verified" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    dp.user_id AS driver_id,
    u.full_name,
    dp.vehicle_type,
    dp.latitude,
    dp.longitude,
    haversine_distance(p_latitude, p_longitude, dp.latitude, dp.longitude) AS distance_km,
    dp.rating,
    dp.is_verified
  FROM delivery_profiles dp
  JOIN users u ON u.user_id = dp.user_id
  WHERE dp.is_active = true
    AND dp.is_verified = true
    AND dp.latitude IS NOT NULL
    AND dp.longitude IS NOT NULL
    AND haversine_distance(p_latitude, p_longitude, dp.latitude, dp.longitude) <= p_max_distance_km
  ORDER BY distance_km
  LIMIT p_limit_count;
END;
$$;


ALTER FUNCTION "public"."find_nearby_drivers"("p_latitude" numeric, "p_longitude" numeric, "p_max_distance_km" numeric, "p_limit_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."find_nearby_drivers_for_middleman"("p_latitude" numeric, "p_longitude" numeric, "p_max_distance_km" numeric DEFAULT 20.0, "p_limit" integer DEFAULT 10) RETURNS TABLE("driver_id" "uuid", "full_name" "text", "vehicle_type" "text", "distance_km" numeric, "rating" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dp.user_id,
    u.full_name,
    dp.vehicle_type,
    haversine_distance(p_latitude, p_longitude, dp.latitude, dp.longitude)::numeric as distance_km,
    dp.rating
  FROM public.delivery_profiles dp
  JOIN public.users u ON u.user_id = dp.user_id
  WHERE dp.is_active = true 
    AND dp.is_verified = true
    AND dp.latitude IS NOT NULL
    AND dp.longitude IS NOT NULL
    AND haversine_distance(p_latitude, p_longitude, dp.latitude, dp.longitude) <= p_max_distance_km
  ORDER BY distance_km ASC
  LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."find_nearby_drivers_for_middleman"("p_latitude" numeric, "p_longitude" numeric, "p_max_distance_km" numeric, "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."find_nearby_factories"("p_seller_id" "uuid", "p_max_distance_km" numeric DEFAULT 100, "p_limit_count" integer DEFAULT 20) RETURNS TABLE("factory_id" "uuid", "factory_name" "text", "distance_km" numeric, "latitude" numeric, "longitude" numeric, "location" "text", "is_verified" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
DECLARE
  v_seller_lat NUMERIC;
  v_seller_lon NUMERIC;
BEGIN
  -- Security check
  IF auth.uid() IS NOT NULL AND auth.uid() != p_seller_id THEN
    RAISE EXCEPTION 'Access denied: can only search factories for your own seller account';
  END IF;

  -- Get current seller's location
  SELECT latitude, longitude 
  INTO v_seller_lat, v_seller_lon
  FROM sellers 
  WHERE user_id = p_seller_id;

  IF v_seller_lat IS NULL OR v_seller_lon IS NULL THEN
    RAISE EXCEPTION 'Seller location not set. Please update your profile location.';
  END IF;

  RETURN QUERY
  SELECT
    f.user_id AS factory_id,
    f.full_name AS factory_name,    -- ✅ Use full_name instead
    haversine_distance(v_seller_lat, v_seller_lon, f.latitude, f.longitude) AS distance_km,
    f.latitude,
    f.longitude,
    f.location,
    f.is_verified
  FROM sellers f
  WHERE f.is_factory = true
    AND f.latitude IS NOT NULL 
    AND f.longitude IS NOT NULL
    AND f.user_id != p_seller_id  -- Exclude self
    AND haversine_distance(v_seller_lat, v_seller_lon, f.latitude, f.longitude) <= p_max_distance_km
  ORDER BY distance_km
  LIMIT p_limit_count;
END;
$$;


ALTER FUNCTION "public"."find_nearby_factories"("p_seller_id" "uuid", "p_max_distance_km" numeric, "p_limit_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."find_nearby_factories"("p_seller_id" "uuid", "p_latitude" numeric, "p_longitude" numeric, "p_max_distance_km" numeric DEFAULT 100, "p_limit_count" integer DEFAULT 20) RETURNS TABLE("factory_id" "uuid", "company_name" "text", "latitude" numeric, "longitude" numeric, "distance_km" numeric, "location" "text", "is_verified" boolean, "rating" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.user_id AS factory_id,
    s.company_name,
    s.latitude,
    s.longitude,
    haversine_distance(p_latitude, p_longitude, s.latitude, s.longitude) AS distance_km,
    s.location,
    s.is_verified,
    s.rating
  FROM sellers s
  WHERE s.is_factory = true
    AND s.latitude IS NOT NULL
    AND s.longitude IS NOT NULL
    AND s.user_id != p_seller_id
    AND haversine_distance(p_latitude, p_longitude, s.latitude, s.longitude) <= p_max_distance_km
  ORDER BY distance_km
  LIMIT p_limit_count;
END;
$$;


ALTER FUNCTION "public"."find_nearby_factories"("p_seller_id" "uuid", "p_latitude" numeric, "p_longitude" numeric, "p_max_distance_km" numeric, "p_limit_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."find_nearby_products_for_middleman"("p_latitude" numeric, "p_longitude" numeric, "p_max_distance_km" numeric DEFAULT 50.0, "p_limit" integer DEFAULT 20) RETURNS TABLE("product_id" "uuid", "title" "text", "price" numeric, "images" "jsonb", "seller_name" "text", "distance_km" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.price,
    p.images,
    s.full_name as seller_name,
    haversine_distance(p_latitude, p_longitude, s.latitude, s.longitude)::numeric as distance_km
  FROM public.products p
  JOIN public.sellers s ON s.user_id = p.seller_id
  WHERE p.status = 'active'
    AND s.latitude IS NOT NULL
    AND s.longitude IS NOT NULL
    AND haversine_distance(p_latitude, p_longitude, s.latitude, s.longitude) <= p_max_distance_km
  ORDER BY distance_km ASC
  LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."find_nearby_products_for_middleman"("p_latitude" numeric, "p_longitude" numeric, "p_max_distance_km" numeric, "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_product_description"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.description IS NULL OR NEW.description = '' THEN
    NEW.description := 
      COALESCE(NEW.title, '') || ' by ' || COALESCE(NEW.brand, '') || '. ' ||
      'Condition: ' || COALESCE(NEW.status, '') || '. ' ||
      'Category: ' || COALESCE(NEW.category, '') || 
      CASE WHEN NEW.subcategory IS NOT NULL THEN ' > ' || NEW.subcategory ELSE '' END || '. ' ||
      CASE 
        WHEN NEW.category = 'Fashion & Apparel' AND NEW.attributes ? 'color' THEN
          'Color: ' || (NEW.attributes->>'color') || '. '
        ELSE ''
      END ||
      COALESCE((
        SELECT string_agg(key || ': ' || value, ', ') 
        FROM jsonb_each_text(NEW.attributes)
        WHERE key NOT IN ('color', 'color_hex')
      ), '');
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generate_product_description"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_factory_rating"("p_factory_id" "uuid") RETURNS TABLE("average_rating" numeric, "total_reviews" bigint, "delivery_rating" numeric, "quality_rating" numeric, "communication_rating" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(AVG(rating), 0) as average_rating,
    COUNT(*) as total_reviews,
    COALESCE(AVG(delivery_rating), 0) as delivery_rating,
    COALESCE(AVG(quality_rating), 0) as quality_rating,
    COALESCE(AVG(communication_rating), 0) as communication_rating
  FROM factory_ratings
  WHERE factory_id = p_factory_id;
END;
$$;


ALTER FUNCTION "public"."get_factory_rating"("p_factory_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_low_stock_products"("threshold" integer DEFAULT 10) RETURNS TABLE("id" "uuid", "asin" "text", "title" "text", "quantity" integer, "seller_id" "uuid")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.asin, p.title, p.quantity, p.seller_id
  FROM products p
  WHERE p.quantity <= threshold
  AND p.is_deleted = false
  AND p.seller_id = auth.uid();
END;
$$;


ALTER FUNCTION "public"."get_low_stock_products"("threshold" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_middle_man_ids"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_user_id uuid;
  v_profile_exists boolean;
BEGIN
  v_user_id := auth.uid();
  
  -- Check if profile exists
  SELECT EXISTS(SELECT 1 FROM public.middleman_profiles WHERE user_id = v_user_id) INTO v_profile_exists;

  RETURN jsonb_build_object(
    'user_id', v_user_id,             -- This is your Main ID (Primary Key)
    'middle_man_record_id', v_user_id, -- Same as user_id
    'profile_record_id', v_user_id,    -- Same as user_id (linked by FK)
    'profile_exists', v_profile_exists
  );
END;
$$;


ALTER FUNCTION "public"."get_middle_man_ids"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_or_create_service_conversation"("p_provider_id" "uuid", "p_listing_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_conversation_id UUID;
  v_client_id UUID := auth.uid();
BEGIN
  -- Check existing
  SELECT id INTO v_conversation_id
  FROM public.services_conversations
  WHERE provider_id = p_provider_id
    AND client_id = v_client_id
    AND listing_id = p_listing_id;

  IF v_conversation_id IS NULL THEN
    -- Create new
    INSERT INTO public.services_conversations (provider_id, client_id, listing_id)
    VALUES (p_provider_id, v_client_id, p_listing_id)
    RETURNING id INTO v_conversation_id;
  END IF;

  RETURN v_conversation_id;
END;
$$;


ALTER FUNCTION "public"."get_or_create_service_conversation"("p_provider_id" "uuid", "p_listing_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_product_image_url"("image_path" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN storage.storage_url('product-images', image_path);
END;
$$;


ALTER FUNCTION "public"."get_product_image_url"("image_path" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_provider_revenue"() RETURNS TABLE("provider_id" "uuid", "total_revenue" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Replace this with your actual logic to calculate provider revenue
    RETURN QUERY
    SELECT
        p.id AS provider_id,
        SUM(o.amount) AS total_revenue
    FROM
        providers p
    JOIN
        orders o ON p.id = o.provider_id
    GROUP BY
        p.id;
END;
$$;


ALTER FUNCTION "public"."get_provider_revenue"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_provider_revenue"("p_provider_id" "uuid") RETURNS numeric
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_revenue NUMERIC;
BEGIN
  SELECT COALESCE(SUM(total_price), 0)
  INTO v_revenue
  FROM public.service_bookings
  WHERE provider_id = p_provider_id
    AND status = 'completed'; -- Only count completed bookings as revenue
  
  RETURN v_revenue;
END;
$$;


ALTER FUNCTION "public"."get_provider_revenue"("p_provider_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_seller_kpis"("p_seller_id" "uuid", "p_period" "text" DEFAULT '30d'::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
DECLARE
  v_result JSONB;
  v_snapshot RECORD;
BEGIN
  -- Security check
  IF auth.uid() IS NOT NULL AND auth.uid() != p_seller_id THEN
    RAISE EXCEPTION 'Access denied: can only view own KPIs';
  END IF;

  SELECT * INTO v_snapshot
  FROM analytics_snapshots
  WHERE seller_id = p_seller_id
  AND period_type = p_period
  AND is_current = true
  AND created_at > NOW() - INTERVAL '1 hour'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_snapshot.id IS NOT NULL THEN
    v_result := v_snapshot.analytics_data;
  ELSE
    v_result := calculate_seller_analytics(p_seller_id, p_period);
    PERFORM create_analytics_snapshot(p_seller_id, p_period);
  END IF;
  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_seller_kpis"("p_seller_id" "uuid", "p_period" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_seller_product_count"("seller_uuid" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
BEGIN
  -- Security check
  IF auth.uid() IS NOT NULL AND auth.uid() != seller_uuid THEN
    RAISE EXCEPTION 'Access denied: can only view own product count';
  END IF;

  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM products
    WHERE seller_id = seller_uuid AND is_deleted = false
  );
END;
$$;


ALTER FUNCTION "public"."get_seller_product_count"("seller_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_seller_sales_count"("p_seller_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
BEGIN
  -- Security check
  IF auth.uid() IS NOT NULL AND auth.uid() != p_seller_id THEN
    RAISE EXCEPTION 'Access denied: can only view own sales count';
  END IF;

  RETURN COALESCE((
    SELECT COUNT(*)
    FROM sales
    WHERE seller_id = p_seller_id
    AND sale_date BETWEEN p_start_date AND p_end_date
  ), 0);
END;
$$;


ALTER FUNCTION "public"."get_seller_sales_count"("p_seller_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_seller_total_customers"("p_seller_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
BEGIN
  -- Security check
  IF auth.uid() IS NOT NULL AND auth.uid() != p_seller_id THEN
    RAISE EXCEPTION 'Access denied: can only view own customer count';
  END IF;

  RETURN COALESCE((
    SELECT COUNT(*)
    FROM customers
    WHERE seller_id = p_seller_id
  ), 0);
END;
$$;


ALTER FUNCTION "public"."get_seller_total_customers"("p_seller_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_seller_total_revenue"("p_seller_id" "uuid") RETURNS numeric
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
BEGIN
  -- Security check
  IF auth.uid() IS NOT NULL AND auth.uid() != p_seller_id THEN
    RAISE EXCEPTION 'Access denied: can only view own revenue';
  END IF;

  RETURN COALESCE((
    SELECT SUM(total_price)
    FROM sales
    WHERE seller_id = p_seller_id
  ), 0);
END;
$$;


ALTER FUNCTION "public"."get_seller_total_revenue"("p_seller_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_conversations"("p_user_id" "uuid") RETURNS TABLE("conversation_id" "uuid", "product_id" "uuid", "last_message" "text", "last_message_at" timestamp with time zone, "created_at" timestamp with time zone, "is_archived" boolean, "other_user_id" "uuid", "other_user_name" "text", "other_user_avatar" "text", "other_user_account_type" "text", "unread_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS conversation_id,
    c.product_id,
    c.last_message,
    c.last_message_at,
    c.created_at,
    c.is_archived,
    cp.user_id AS other_user_id,
    u.full_name AS other_user_name,
    u.avatar_url AS other_user_avatar,
    u.account_type AS other_user_account_type,
    (
      SELECT COUNT(*)
      FROM messages m
      WHERE m.conversation_id = c.id
        AND m.sender_id != p_user_id
        AND m.read_at IS NULL
    ) AS unread_count
  FROM conversations c
  JOIN conversation_participants cp ON cp.conversation_id = c.id
  JOIN users u ON u.user_id = cp.user_id
  WHERE c.id IN (
    SELECT conversation_id 
    FROM conversation_participants 
    WHERE user_id = p_user_id
  )
  AND cp.user_id != p_user_id
  ORDER BY c.last_message_at DESC NULLS LAST;
END;
$$;


ALTER FUNCTION "public"."get_user_conversations"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_conversations_with_products"("p_user_id" "uuid") RETURNS TABLE("conversation_id" "uuid", "product_id" "uuid", "product_title" "text", "product_price" numeric, "product_image" "text", "last_message" "text", "last_message_at" timestamp with time zone, "created_at" timestamp with time zone, "other_user_id" "uuid", "other_user_name" "text", "other_user_avatar" "text", "unread_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS conversation_id,
    c.product_id,
    p.title AS product_title,
    p.price AS product_price,
    p.images->>0 AS product_image,
    c.last_message,
    c.last_message_at,
    c.created_at,
    cp.user_id AS other_user_id,
    u.full_name AS other_user_name,
    u.avatar_url AS other_user_avatar,
    (
      SELECT COUNT(*)
      FROM messages m
      WHERE m.conversation_id = c.id
        AND m.sender_id != p_user_id
        AND m.read_at IS NULL
    ) AS unread_count
  FROM conversations c
  JOIN conversation_participants cp ON cp.conversation_id = c.id
  JOIN users u ON u.user_id = cp.user_id
  LEFT JOIN products p ON p.id = c.product_id
  WHERE c.id IN (
    SELECT conversation_id 
    FROM conversation_participants 
    WHERE user_id = p_user_id
  )
  AND cp.user_id != p_user_id
  ORDER BY c.last_message_at DESC NULLS LAST;
END;
$$;


ALTER FUNCTION "public"."get_user_conversations_with_products"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- 1. Insert into generic users table (for all roles)
  INSERT INTO public.users (
    user_id,
    email,
    full_name,
    phone,
    account_type
  ) VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'user')
  );

  -- 2. Handle Specific Roles
  
  -- If Seller
  IF NEW.raw_user_meta_data->>'account_type' = 'seller' THEN
    INSERT INTO public.sellers (
      user_id, email, full_name, phone, location, currency, account_type, is_verified
    ) VALUES (
      NEW.id,
      NEW.email,
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'phone',
      NEW.raw_user_meta_data->>'location',
      COALESCE(NEW.raw_user_meta_data->>'currency', 'USD'),
      'seller',
      FALSE
    );
  END IF;

  -- If Factory -> Create entry in public.factories
  IF NEW.raw_user_meta_data->>'account_type' = 'factory' THEN
    INSERT INTO public.factories (
      seller_id,
      company_name,
      email,
      phone,
      location,
      is_verified
    ) VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'company_name',
      NEW.email,
      NEW.raw_user_meta_data->>'phone',
      NEW.raw_user_meta_data->>'location',
      FALSE 
    );
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_service_booking_notifications"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_provider_id UUID;
  v_customer_id UUID;
  v_listing_title TEXT;
  v_notification_message TEXT;
BEGIN
  -- A. Fetch Related Data
  -- Get Provider ID from the service listing
  SELECT provider_id INTO v_provider_id 
  FROM public.service_listings 
  WHERE id = NEW.listing_id;
  
  -- Get Customer ID (assuming NEW.customer_id is the auth user ID)
  v_customer_id := NEW.customer_id;
  
  -- Get Listing Title for context
  SELECT title INTO v_listing_title 
  FROM public.service_listings 
  WHERE id = NEW.listing_id;

  -- B. Handle INSERT (New Booking Request)
  IF TG_OP = 'INSERT' THEN
    -- Notify the Provider about the new request
    INSERT INTO public.notifications (user_id, type, title, message, metadata)
    VALUES (
      v_provider_id,
      'booking_request',
      '🔔 New Service Booking Request',
      'You have a new booking request for "' || COALESCE(v_listing_title, 'Service') || '".',
      jsonb_build_object(
        'booking_id', NEW.id, 
        'listing_id', NEW.listing_id, 
        'customer_id', NEW.customer_id,
        'action_url', '/services/dashboard/bookings'
      )
    );
    
    RETURN NEW;
  END IF;

  -- C. Handle UPDATE (Status Changes)
  IF TG_OP = 'UPDATE' THEN
    
    -- Scenario 1: Status changed to 'confirmed' -> Notify Customer
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'confirmed' THEN
      INSERT INTO public.notifications (user_id, type, title, message, metadata)
      VALUES (
        v_customer_id,
        'booking_confirmed',
        '✅ Booking Confirmed!',
        'Your booking for "' || COALESCE(v_listing_title, 'Service') || '" has been confirmed by the provider.',
        jsonb_build_object(
          'booking_id', NEW.id, 
          'listing_id', NEW.listing_id,
          'action_url', '/services/dashboard/bookings'
        )
      );
    END IF;

    -- Scenario 2: Status changed to 'cancelled' -> Notify Both
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'cancelled' THEN
      -- Notify Customer
      INSERT INTO public.notifications (user_id, type, title, message, metadata)
      VALUES (
        v_customer_id,
        'booking_cancelled',
        '❌ Booking Cancelled',
        'Your booking for "' || COALESCE(v_listing_title, 'Service') || '" has been cancelled.',
        jsonb_build_object('booking_id', NEW.id)
      );
      
      -- Notify Provider
      INSERT INTO public.notifications (user_id, type, title, message, metadata)
      VALUES (
        v_provider_id,
        'booking_cancelled',
        '⚠️ Booking Cancelled by Customer',
        'A booking for "' || COALESCE(v_listing_title, 'Service') || '" was cancelled.',
        jsonb_build_object('booking_id', NEW.id)
      );
    END IF;

    -- Scenario 3: Status changed to 'completed' -> Prompt for Review (Optional Future Logic)
    -- You can add logic here to notify the customer to leave a review after completion.
    
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_service_booking_notifications"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."haversine_distance"("lat1" double precision, "lon1" double precision, "lat2" double precision, "lon2" double precision) RETURNS double precision
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
  R DOUBLE PRECISION = 6371; -- Earth radius in km
  dlat DOUBLE PRECISION;
  dlon DOUBLE PRECISION;
  a DOUBLE PRECISION;
  c DOUBLE PRECISION;
BEGIN
  IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
    RETURN NULL;
  END IF;
  
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  a := (sin(dlat/2))^2 + cos(radians(lat1)) * cos(radians(lat2)) * (sin(dlon/2))^2;
  c := 2 * asin(sqrt(a));
  RETURN R * c;
END;
$$;


ALTER FUNCTION "public"."haversine_distance"("lat1" double precision, "lon1" double precision, "lat2" double precision, "lon2" double precision) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_activity"("p_action_type" "text", "p_action_category" "text", "p_description" "text" DEFAULT NULL::"text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO public.activity_logs (
    user_id,
    action_type,
    action_category,
    description,
    metadata,
    device_info
  ) VALUES (
    auth.uid(),
    p_action_type,
    p_action_category,
    p_description,
    p_metadata,
    current_setting('app.device_info', true)
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;


ALTER FUNCTION "public"."log_activity"("p_action_type" "text", "p_action_category" "text", "p_description" "text", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_error"("p_error_type" "text", "p_error_message" "text", "p_stack_trace" "text" DEFAULT NULL::"text", "p_screen_name" "text" DEFAULT NULL::"text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO public.error_logs (
    user_id,
    error_type,
    error_message,
    stack_trace,
    screen_name,
    metadata
  ) VALUES (
    auth.uid(),
    p_error_type,
    p_error_message,
    p_stack_trace,
    p_screen_name,
    p_metadata
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;


ALTER FUNCTION "public"."log_error"("p_error_type" "text", "p_error_message" "text", "p_stack_trace" "text", "p_screen_name" "text", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."messages_tsvector_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.content_tsvector := to_tsvector('english', COALESCE(NEW.content, ''));
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."messages_tsvector_trigger"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."products_search_vector_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.brand, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.category, '')), 'D');
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."products_search_vector_trigger"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."products_tsvector_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.title_description := to_tsvector('english', 
    COALESCE(NEW.title, '') || ' ' || 
    COALESCE(NEW.description, '') || ' ' ||
    COALESCE(NEW.brand, '') || ' ' ||
    COALESCE(NEW.category, '') || ' ' ||
    COALESCE(NEW.subcategory, ''));
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."products_tsvector_trigger"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."track_deal_click"("p_unique_slug" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.middle_man_deals
  SET clicks = clicks + 1,
      updated_at = now()
  WHERE unique_slug = p_unique_slug;
END;
$$;


ALTER FUNCTION "public"."track_deal_click"("p_unique_slug" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_conversation_on_deal_proposal"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE conversations
  SET 
    deal_id = NEW.deal_id,
    conversation_type = 'deal_negotiation',
    last_message = '🤝 Deal proposal sent',
    last_message_at = NOW(),
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_conversation_on_deal_proposal"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_customer_stats_on_sale"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.customer_id IS NOT NULL THEN
    UPDATE public.customers
    SET
      total_orders = total_orders + 1,
      total_spent = total_spent + NEW.total_price,
      last_purchase_date = NEW.sale_date,
      updated_at = NOW()
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_customer_stats_on_sale"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_customers_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_customers_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_factory_connections_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_factory_connections_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_freelancer_rating"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.freelancer_profiles
    SET 
      review_count = review_count + 1,
      average_rating = (
        SELECT COALESCE(AVG(rating), 0) 
        FROM public.service_reviews 
        WHERE freelancer_id = NEW.freelancer_id AND is_visible = TRUE
      ),
      updated_at = NOW()
    WHERE id = NEW.freelancer_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.is_visible != OLD.is_visible THEN
    -- Recalculate if visibility changes
    UPDATE public.freelancer_profiles
    SET 
      review_count = (SELECT COUNT(*) FROM public.service_reviews WHERE freelancer_id = NEW.freelancer_id AND is_visible = TRUE),
      average_rating = (SELECT COALESCE(AVG(rating), 0) FROM public.service_reviews WHERE freelancer_id = NEW.freelancer_id AND is_visible = TRUE),
      updated_at = NOW()
    WHERE id = NEW.freelancer_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_freelancer_rating"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_freelancer_stats_on_completion"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE public.freelancer_profiles
    SET 
      total_jobs_completed = total_jobs_completed + 1,
      total_earnings = total_earnings + NEW.price_paid,
      updated_at = NOW()
    WHERE id = NEW.freelancer_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_freelancer_stats_on_completion"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_order_status_timestamps"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    NEW.confirmed_at = NOW();
  ELSIF NEW.status = 'shipped' AND OLD.status != 'shipped' THEN
    NEW.shipped_at = NOW();
  ELSIF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    NEW.delivered_at = NOW();
  ELSIF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    NEW.cancelled_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_order_status_timestamps"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_products_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_products_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_sales_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_sales_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_svc_conv_on_message"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NOT NEW.is_read THEN -- Assuming is_read false means new/unread logic or just update text
    UPDATE public.services_conversations
    SET
      last_message = CASE 
        WHEN NEW.message_type = 'image' THEN '📷 Image' 
        WHEN NEW.message_type = 'file' THEN '📎 Attachment'
        ELSE LEFT(NEW.content, 60) 
      END,
      last_message_at = NEW.created_at,
      updated_at = NOW(),
      -- Mark as unread for the receiver
      is_read_by_provider = CASE WHEN NEW.sender_id = provider_id THEN TRUE ELSE FALSE END,
      is_read_by_client = CASE WHEN NEW.sender_id = client_id THEN TRUE ELSE FALSE END
    WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_svc_conv_on_message"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_svc_provider_rating"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.is_visible THEN
    UPDATE public.svc_providers
    SET 
      review_count = review_count + 1,
      average_rating = (
        SELECT COALESCE(AVG(rating), 0) 
        FROM public.svc_reviews 
        WHERE provider_id = NEW.provider_id AND is_visible = TRUE
      ),
      updated_at = NOW()
    WHERE id = NEW.provider_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_svc_provider_rating"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_svc_provider_stats"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE public.svc_providers
    SET 
      total_jobs_completed = total_jobs_completed + 1,
      total_earnings = total_earnings + COALESCE(NEW.agreed_price, 0),
      updated_at = NOW()
    WHERE id = NEW.provider_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_svc_provider_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_svc_timestamps"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_svc_timestamps"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_trading_conv_on_message"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.trading_conversations
    SET
      last_message = CASE WHEN NEW.message_type = 'image' THEN '📷 Image' ELSE LEFT(NEW.content, 50) END,
      last_message_at = NEW.created_at,
      updated_at = NOW()
    WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_trading_conv_on_message"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."activity_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "action_type" "text" NOT NULL,
    "action_category" "text" NOT NULL,
    "description" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "ip_address" "text",
    "device_info" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."activity_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_users" (
    "user_id" "uuid" NOT NULL
);


ALTER TABLE "public"."admin_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."analytics" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "seller_id" "uuid",
    "metric_type" "text" NOT NULL,
    "metric_value" numeric(10,2) NOT NULL,
    "metric_date" "date" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."analytics_snapshots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "seller_id" "uuid" NOT NULL,
    "period_type" "text" NOT NULL,
    "period_start" "date" NOT NULL,
    "period_end" "date" NOT NULL,
    "analytics_data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_current" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "analytics_snapshots_period_type_check" CHECK (("period_type" = ANY (ARRAY['daily'::"text", 'weekly'::"text", 'monthly'::"text", 'yearly'::"text", 'custom'::"text"])))
);


ALTER TABLE "public"."analytics_snapshots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."async_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "queue_name" "text" NOT NULL,
    "payload" "jsonb" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "attempts" integer DEFAULT 0,
    "max_attempts" integer DEFAULT 3,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "processed_at" timestamp with time zone,
    "error_message" "text",
    "scheduled_for" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "async_jobs_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."async_jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."brands" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "category" "text",
    "logo_url" "text",
    "is_verified" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."brands" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."business_profiles" (
    "user_id" "uuid" NOT NULL,
    "role" "public"."user_role" NOT NULL,
    "company_name" "text",
    "location" "text",
    "latitude" numeric(10,8),
    "longitude" numeric(10,8),
    "currency" "text" DEFAULT 'USD'::"text",
    "is_verified" boolean DEFAULT false,
    "store_name" "text",
    "commission_rate" numeric(5,2),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."business_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cart" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "asin" "text" NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."cart" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "parent_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "slug" "text",
    "description" "text",
    "image_url" "text",
    "display_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories_backup_20260308_124506" (
    "id" "uuid",
    "name" "text",
    "parent_id" "uuid",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."categories_backup_20260308_124506" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."commissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "middle_man_id" "uuid" NOT NULL,
    "order_id" "uuid",
    "deal_id" "uuid",
    "amount" numeric(10,2) NOT NULL,
    "commission_rate" numeric(5,2) NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "paid_at" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "commissions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'paid'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."commissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "name" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "age_range" "text",
    "email" "text",
    "notes" "text",
    "total_orders" integer DEFAULT 0,
    "total_spent" numeric(10,2) DEFAULT 0,
    "last_purchase_date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "seller_id" "uuid",
    CONSTRAINT "customers_age_range_check" CHECK (("age_range" = ANY (ARRAY['teens'::"text", '20s'::"text", '30s'::"text", '40s'::"text", '50s'::"text", '60s'::"text", '70s+'::"text"])))
);


ALTER TABLE "public"."customers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deals" (
    "id" "uuid" NOT NULL,
    "middleman_id" "uuid" NOT NULL,
    "party_a_id" "uuid" NOT NULL,
    "party_b_id" "uuid" NOT NULL,
    "product_id" "uuid",
    "commission_rate" numeric(5,2),
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."deals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deals_v2" (
    "id" "uuid" NOT NULL,
    "middleman_id" "uuid" NOT NULL,
    "party_a_id" "uuid" NOT NULL,
    "party_b_id" "uuid" NOT NULL,
    "product_id" "uuid",
    "commission_rate" numeric(5,2),
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."deals_v2" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."delivery_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid",
    "driver_id" "uuid",
    "assigned_at" timestamp with time zone DEFAULT "now"(),
    "picked_up_at" timestamp with time zone,
    "delivered_at" timestamp with time zone,
    "status" "text" DEFAULT 'pending'::"text",
    "delivery_fee" numeric(10,2),
    "distance_km" numeric(10,2),
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "delivery_assignments_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'picked_up'::"text", 'delivered'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."delivery_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."delivery_profiles" (
    "user_id" "uuid" NOT NULL,
    "vehicle_type" "text",
    "vehicle_number" "text",
    "driver_license_url" "text",
    "is_verified" boolean DEFAULT false,
    "is_active" boolean DEFAULT false,
    "latitude" numeric(10,8),
    "longitude" numeric(10,8),
    "rating" numeric(3,2) DEFAULT 0,
    "total_deliveries" integer DEFAULT 0,
    "completed_deliveries" integer DEFAULT 0,
    "cancelled_deliveries" integer DEFAULT 0,
    "commission_rate" numeric(5,2) DEFAULT 10,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "delivery_profiles_vehicle_type_check" CHECK (("vehicle_type" = ANY (ARRAY['motorcycle'::"text", 'car'::"text", 'bicycle'::"text", 'van'::"text", 'truck'::"text"])))
);


ALTER TABLE "public"."delivery_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."error_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "error_type" "text" NOT NULL,
    "error_message" "text" NOT NULL,
    "stack_trace" "text",
    "screen_name" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."error_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."factories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "company_name" "text" NOT NULL,
    "location" "text",
    "phone" "text",
    "email" "text",
    "is_verified" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "business_license_url" "text",
    "latitude" numeric(9,6),
    "longitude" numeric(9,6),
    "production_capacity" "text",
    "specialization" "text",
    "website_url" "text",
    "description" "text",
    "last_login" timestamp with time zone,
    "location_text" "text",
    "currency" "text" DEFAULT 'USD'::"text",
    "min_order_quantity" integer DEFAULT 1,
    "wholesale_discount" numeric(5,2) DEFAULT 0.00,
    "accepts_returns" boolean DEFAULT true,
    "is_factory" boolean DEFAULT true,
    "user_id" "uuid" NOT NULL,
    "full_name" "text"
);


ALTER TABLE "public"."factories" OWNER TO "postgres";


COMMENT ON COLUMN "public"."factories"."is_verified" IS 'Admin approval status for business license';



COMMENT ON COLUMN "public"."factories"."latitude" IS 'Geolocation latitude for map discovery';



COMMENT ON COLUMN "public"."factories"."longitude" IS 'Geolocation longitude for map discovery';



CREATE TABLE IF NOT EXISTS "public"."factory_connections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "factory_id" "uuid",
    "seller_id" "uuid",
    "status" "text" DEFAULT 'pending'::"text",
    "requested_at" timestamp with time zone DEFAULT "now"(),
    "accepted_at" timestamp with time zone,
    "rejected_at" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "factory_connections_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'rejected'::"text", 'blocked'::"text"])))
);


ALTER TABLE "public"."factory_connections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."factory_production_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid",
    "status" "public"."factory_order_status",
    "notes" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."factory_production_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "asin" "text",
    "sku" "text",
    "seller_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "brand" "text" NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text",
    "price" numeric(10,2),
    "quantity" integer DEFAULT 0,
    "status" "text" DEFAULT 'draft'::"text",
    "brand_id" "text",
    "is_local_brand" boolean DEFAULT false,
    "attributes" "jsonb" DEFAULT '{}'::"jsonb",
    "color_hex" "text",
    "category" "text",
    "subcategory" "text",
    "images" "jsonb" DEFAULT '[]'::"jsonb",
    "average_rating" numeric(3,2) DEFAULT 0,
    "review_count" integer DEFAULT 0,
    "title_description" "tsvector",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "allow_chat" boolean DEFAULT true,
    "search_vector" "tsvector",
    "is_deleted" boolean DEFAULT false,
    CONSTRAINT "products_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'active'::"text", 'inactive'::"text"]))),
    CONSTRAINT "valid_price" CHECK ((("price" IS NULL) OR ("price" >= (0)::numeric))),
    CONSTRAINT "valid_quantity" CHECK (("quantity" >= 0))
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sellers" (
    "user_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text" NOT NULL,
    "firstname" "text",
    "second_name" "text",
    "thirdname" "text",
    "fourth_name" "text",
    "phone" "text",
    "location" "text",
    "currency" "text" DEFAULT 'USD'::"text",
    "account_type" "text" DEFAULT 'seller'::"text",
    "is_verified" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "latitude" numeric(10,8),
    "longitude" numeric(11,8),
    "is_factory" boolean DEFAULT false,
    "factory_license_url" "text",
    "min_order_quantity" integer DEFAULT 1,
    "wholesale_discount" numeric(5,2) DEFAULT 0,
    "accepts_returns" boolean DEFAULT true,
    "production_capacity" "text",
    "verified_at" timestamp with time zone,
    "allow_product_chats" boolean DEFAULT true,
    "allow_custom_requests" boolean DEFAULT false
);


ALTER TABLE "public"."sellers" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."factory_products" AS
 SELECT "p"."id",
    "p"."asin",
    "p"."sku",
    "p"."seller_id",
    "p"."title",
    "p"."description",
    "p"."brand",
    "p"."currency",
    "p"."price",
    "p"."quantity",
    "p"."status",
    "p"."brand_id",
    "p"."is_local_brand",
    "p"."attributes",
    "p"."color_hex",
    "p"."category",
    "p"."subcategory",
    "p"."images",
    "p"."average_rating",
    "p"."review_count",
    "p"."title_description",
    "p"."created_at",
    "p"."updated_at",
    "s"."full_name" AS "factory_name",
    "s"."location" AS "factory_location",
    "s"."latitude",
    "s"."longitude",
    "s"."wholesale_discount",
    "s"."min_order_quantity",
    ("p"."price" * ((1)::numeric - (COALESCE("s"."wholesale_discount", (0)::numeric) / (100)::numeric))) AS "wholesale_price"
   FROM ("public"."products" "p"
     JOIN "public"."sellers" "s" ON (("p"."seller_id" = "s"."user_id")))
  WHERE (("s"."is_factory" = true) AND ("p"."status" = 'active'::"text") AND ("p"."is_local_brand" = true));


ALTER VIEW "public"."factory_products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."factory_ratings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "factory_id" "uuid",
    "seller_id" "uuid",
    "rating" integer,
    "review" "text",
    "delivery_rating" integer,
    "quality_rating" integer,
    "communication_rating" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "factory_ratings_check" CHECK ((("quality_rating" >= 1) AND ("delivery_rating" <= 5))),
    CONSTRAINT "factory_ratings_communication_rating_check" CHECK ((("communication_rating" >= 1) AND ("communication_rating" <= 5))),
    CONSTRAINT "factory_ratings_delivery_rating_check" CHECK ((("delivery_rating" >= 1) AND ("delivery_rating" <= 5))),
    CONSTRAINT "factory_ratings_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."factory_ratings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."freelancer_portfolio" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "freelancer_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "image_url" "text" NOT NULL,
    "project_link" "text",
    "category_tag" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."freelancer_portfolio" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."freelancer_profiles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "display_name" "text" NOT NULL,
    "tagline" "text",
    "biography" "text",
    "profile_image_url" "text",
    "cover_image_url" "text",
    "hourly_rate" numeric(10,2),
    "currency" "text" DEFAULT 'USD'::"text",
    "location_country" "text",
    "languages" "text"[],
    "skills" "text"[],
    "total_jobs_completed" integer DEFAULT 0,
    "total_earnings" numeric(10,2) DEFAULT 0,
    "average_rating" numeric(3,2) DEFAULT 0,
    "review_count" integer DEFAULT 0,
    "is_verified" boolean DEFAULT false,
    "is_available" boolean DEFAULT true,
    "response_time_hours" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."freelancer_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."idempotency_keys" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "response" "jsonb" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."idempotency_keys" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."location_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "latitude" double precision NOT NULL,
    "longitude" double precision NOT NULL,
    "accuracy" double precision,
    "altitude" double precision,
    "heading" double precision,
    "speed" double precision,
    "location_type" "text" DEFAULT 'gps'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."location_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."middle_man_deals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "middle_man_id" "uuid" NOT NULL,
    "product_asin" "text" NOT NULL,
    "product_id" "uuid",
    "commission_rate" numeric(5,2) DEFAULT 5.00,
    "margin_amount" numeric(10,2) DEFAULT 0,
    "unique_slug" "text" NOT NULL,
    "clicks" integer DEFAULT 0,
    "conversions" integer DEFAULT 0,
    "total_revenue" numeric(10,2) DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."middle_man_deals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."middle_men" (
    "user_id" "uuid" NOT NULL,
    "commission_rate" numeric(5,2) DEFAULT 5.00,
    "total_earnings" numeric(10,2) DEFAULT 0,
    "pending_earnings" numeric(10,2) DEFAULT 0,
    "is_verified" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."middle_men" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."middleman_profiles" (
    "user_id" "uuid" NOT NULL,
    "company_name" "text",
    "location" "text",
    "latitude" numeric(10,8),
    "longitude" numeric(10,8),
    "currency" "text" DEFAULT 'USD'::"text",
    "commission_rate" numeric(5,2),
    "is_verified" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."middleman_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text",
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "is_read" boolean DEFAULT false,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "notifications_type_check" CHECK (("type" = ANY (ARRAY['order'::"text", 'product'::"text", 'system'::"text", 'promotion'::"text", 'message'::"text", 'booking_request'::"text", 'booking_confirmed'::"text", 'booking_cancelled'::"text", 'quote_submitted'::"text", 'review_received'::"text", 'milestone_completed'::"text"])))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "product_id" "uuid",
    "asin" "text" NOT NULL,
    "product_name" "text" NOT NULL,
    "product_image" "text",
    "brand" "text",
    "quantity" integer DEFAULT 1 NOT NULL,
    "unit_price" numeric(10,2) NOT NULL,
    "total_price" numeric(10,2) NOT NULL,
    "attributes" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_price" CHECK (("unit_price" >= (0)::numeric)),
    CONSTRAINT "valid_quantity" CHECK (("quantity" > 0))
);


ALTER TABLE "public"."order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "seller_id" "uuid",
    "status" "text" DEFAULT 'pending'::"text",
    "subtotal" numeric(10,2) DEFAULT 0 NOT NULL,
    "discount" numeric(10,2) DEFAULT 0,
    "tax" numeric(10,2) DEFAULT 0,
    "shipping" numeric(10,2) DEFAULT 0,
    "total" numeric(10,2) DEFAULT 0 NOT NULL,
    "payment_method" "text" DEFAULT 'cash'::"text",
    "payment_status" "text" DEFAULT 'pending'::"text",
    "payment_intent_id" "text",
    "shipping_address_id" "uuid",
    "shipping_address_snapshot" "jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "confirmed_at" timestamp with time zone,
    "shipped_at" timestamp with time zone,
    "delivered_at" timestamp with time zone,
    "cancelled_at" timestamp with time zone,
    "deal_id" "uuid",
    "commission_rate" numeric(5,2),
    "commission_amount" numeric(10,2),
    "delivery_id" "uuid",
    "delivery_status" "text" DEFAULT 'pending'::"text",
    "picked_up_at" timestamp with time zone,
    "delivery_notes" "text",
    "delivery_fee" numeric(10,2),
    "production_status" "public"."factory_order_status" DEFAULT 'pending'::"public"."factory_order_status",
    "production_started_at" timestamp without time zone,
    "production_completed_at" timestamp without time zone,
    "quality_check_passed" boolean,
    "middle_man_id" "uuid",
    CONSTRAINT "orders_delivery_status_check" CHECK (("delivery_status" = ANY (ARRAY['pending'::"text", 'assigned'::"text", 'picked_up'::"text", 'in_transit'::"text", 'delivered'::"text", 'failed'::"text"]))),
    CONSTRAINT "orders_payment_method_check" CHECK (("payment_method" = ANY (ARRAY['cash'::"text", 'card'::"text", 'bank_transfer'::"text", 'digital_wallet'::"text", 'cod'::"text"]))),
    CONSTRAINT "orders_payment_status_check" CHECK (("payment_status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'failed'::"text", 'refunded'::"text"]))),
    CONSTRAINT "orders_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'confirmed'::"text", 'processing'::"text", 'shipped'::"text", 'out_for_delivery'::"text", 'delivered'::"text", 'cancelled'::"text", 'refunded'::"text"]))),
    CONSTRAINT "valid_subtotal" CHECK (("subtotal" >= (0)::numeric)),
    CONSTRAINT "valid_total" CHECK (("total" >= (0)::numeric))
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_intentions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "order_id" "uuid",
    "user_id" "uuid",
    "amount" numeric(10,2) NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text",
    "status" "text",
    "payment_method" "text",
    "payment_intent_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "payment_intentions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'succeeded'::"text", 'failed'::"text", 'refunded'::"text"])))
);


ALTER TABLE "public"."payment_intentions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."push_subscriptions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "token" "text" NOT NULL,
    "platform" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "push_subscriptions_platform_check" CHECK (("platform" = ANY (ARRAY['ios'::"text", 'android'::"text", 'web'::"text"])))
);


ALTER TABLE "public"."push_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "asin" "text" NOT NULL,
    "order_id" "uuid",
    "rating" integer NOT NULL,
    "title" "text",
    "comment" "text",
    "is_verified_purchase" boolean DEFAULT false,
    "is_approved" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."reviews" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."sales" AS
 SELECT "oi"."id",
    "o"."seller_id",
    "o"."user_id" AS "customer_id",
    "oi"."product_id",
    "oi"."quantity",
    "oi"."unit_price",
    "oi"."total_price",
    0 AS "discount",
    "o"."created_at" AS "sale_date",
    "o"."created_at",
    "o"."updated_at"
   FROM ("public"."order_items" "oi"
     JOIN "public"."orders" "o" ON (("oi"."order_id" = "o"."id")))
  WHERE ("o"."payment_status" = 'completed'::"text");


ALTER VIEW "public"."sales" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."seller_profiles" (
    "id" "uuid" NOT NULL,
    "store_name" "text",
    "currency" "text" DEFAULT 'USD'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."seller_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sellers_backup" (
    "user_id" "uuid",
    "email" "text",
    "full_name" "text",
    "firstname" "text",
    "second_name" "text",
    "thirdname" "text",
    "fourth_name" "text",
    "phone" "text",
    "location" "text",
    "currency" "text",
    "account_type" "text",
    "is_verified" boolean,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "latitude" numeric(10,8),
    "longitude" numeric(11,8),
    "is_factory" boolean,
    "factory_license_url" "text",
    "min_order_quantity" integer,
    "wholesale_discount" numeric(5,2),
    "accepts_returns" boolean,
    "production_capacity" "text",
    "verified_at" timestamp with time zone
);


ALTER TABLE "public"."sellers_backup" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_bookings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "listing_id" "uuid",
    "provider_id" "uuid" NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "booking_type" "text" NOT NULL,
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone,
    "project_title" "text",
    "project_description" "text",
    "agreed_price" numeric(10,2),
    "milestone_data" "jsonb",
    "status" "text" DEFAULT 'pending'::"text",
    "interaction_mode" "text",
    "meeting_link" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "service_bookings_booking_type_check" CHECK (("booking_type" = ANY (ARRAY['appointment'::"text", 'project_contract'::"text"]))),
    CONSTRAINT "service_bookings_interaction_mode_check" CHECK (("interaction_mode" = ANY (ARRAY['online'::"text", 'offline'::"text"]))),
    CONSTRAINT "service_bookings_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'confirmed'::"text", 'in_progress'::"text", 'completed'::"text", 'cancelled'::"text", 'disputed'::"text"])))
);


ALTER TABLE "public"."service_bookings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_categories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "icon_url" "text",
    "description" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."service_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_gigs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "freelancer_id" "uuid" NOT NULL,
    "category_id" "uuid",
    "subcategory_id" "uuid",
    "title" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text" NOT NULL,
    "delivery_days" integer DEFAULT 3 NOT NULL,
    "revision_count" integer DEFAULT 1,
    "packages" "jsonb" DEFAULT '[{"name": "Basic", "price": 10.00, "revisions": 1, "description": "Basic service package", "delivery_days": 2}, {"name": "Standard", "price": 25.00, "revisions": 2, "description": "Standard service package", "delivery_days": 3}, {"name": "Premium", "price": 50.00, "revisions": 5, "description": "Premium service package", "delivery_days": 5}]'::"jsonb" NOT NULL,
    "requirements_prompt" "text",
    "gallery_images" "jsonb" DEFAULT '[]'::"jsonb",
    "video_url" "text",
    "status" "text" DEFAULT 'draft'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "service_gigs_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'active'::"text", 'paused'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."service_gigs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_listings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "category_slug" "text" NOT NULL,
    "pricing_type" "text" NOT NULL,
    "price" numeric(10,2),
    "currency" "text" DEFAULT 'EGP'::"text",
    "estimated_duration_hours" integer,
    "delivery_days" integer,
    "is_remote_allowed" boolean DEFAULT true,
    "requires_physical_presence" boolean DEFAULT false,
    "images" "jsonb" DEFAULT '[]'::"jsonb",
    "attachments" "jsonb" DEFAULT '[]'::"jsonb",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "service_listings_pricing_type_check" CHECK (("pricing_type" = ANY (ARRAY['fixed'::"text", 'hourly'::"text", 'consultation'::"text"])))
);


ALTER TABLE "public"."service_listings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_orders" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "gig_id" "uuid" NOT NULL,
    "buyer_id" "uuid" NOT NULL,
    "freelancer_id" "uuid" NOT NULL,
    "package_name" "text" NOT NULL,
    "price_paid" numeric(10,2) NOT NULL,
    "delivery_days_agreed" integer NOT NULL,
    "revisions_agreed" integer NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "buyer_requirements" "jsonb",
    "delivery_file_url" "text",
    "delivery_message" "text",
    "ordered_at" timestamp with time zone DEFAULT "now"(),
    "started_at" timestamp with time zone,
    "delivered_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "cancelled_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "service_orders_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'requirements_pending'::"text", 'in_progress'::"text", 'delivered'::"text", 'completed'::"text", 'cancelled'::"text", 'disputed'::"text"])))
);


ALTER TABLE "public"."service_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_providers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "provider_type" "public"."provider_category" NOT NULL,
    "business_name" "text" NOT NULL,
    "tagline" "text",
    "description" "text",
    "engagement_models" "public"."engagement_model"[] NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "latitude" numeric(9,6),
    "longitude" numeric(9,6),
    "address_line1" "text",
    "city" "text",
    "country" "text" DEFAULT 'EG'::"text",
    "is_verified" boolean DEFAULT false,
    "verification_documents" "text"[],
    "status" "text" DEFAULT 'pending'::"text",
    "rating_avg" numeric(3,2) DEFAULT 0.00,
    "total_jobs" integer DEFAULT 0,
    "total_hours_worked" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "service_providers_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'active'::"text", 'suspended'::"text"])))
);


ALTER TABLE "public"."service_providers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_reviews" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "gig_id" "uuid" NOT NULL,
    "freelancer_id" "uuid" NOT NULL,
    "buyer_id" "uuid" NOT NULL,
    "rating" integer NOT NULL,
    "comment" "text",
    "is_visible" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "service_reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."service_reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_subcategories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "category_id" "uuid",
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."service_subcategories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."services_conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "provider_id" "uuid" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "last_message" "text",
    "last_message_at" timestamp with time zone,
    "is_archived" boolean DEFAULT false,
    "is_read_by_provider" boolean DEFAULT true,
    "is_read_by_client" boolean DEFAULT true
);


ALTER TABLE "public"."services_conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."services_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "content" "text",
    "message_type" "text" DEFAULT 'text'::"text",
    "attachment_url" "text",
    "attachment_name" "text",
    "is_read" boolean DEFAULT false,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "content_tsvector" "tsvector" GENERATED ALWAYS AS ("to_tsvector"('"english"'::"regconfig", COALESCE("content", ''::"text"))) STORED,
    CONSTRAINT "services_messages_message_type_check" CHECK (("message_type" = ANY (ARRAY['text'::"text", 'image'::"text", 'file'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."services_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shipping_addresses" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "full_name" "text" NOT NULL,
    "address_line1" "text" NOT NULL,
    "address_line2" "text",
    "city" "text" NOT NULL,
    "state" "text" NOT NULL,
    "postal_code" "text" NOT NULL,
    "country" "text" DEFAULT 'EG'::"text" NOT NULL,
    "phone" "text" NOT NULL,
    "is_default" boolean DEFAULT false,
    "is_verified" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."shipping_addresses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subcategories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "category_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "attribute_schema" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."subcategories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."svc_categories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "icon_url" "text",
    "description" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "sort_order" integer DEFAULT 0
);


ALTER TABLE "public"."svc_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."svc_listings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "provider_id" "uuid" NOT NULL,
    "category_id" "uuid",
    "subcategory_id" "uuid",
    "title" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text" NOT NULL,
    "listing_type" "text" NOT NULL,
    "price_type" "text",
    "price_min" numeric(10,2),
    "price_max" numeric(10,2),
    "currency" "text" DEFAULT 'USD'::"text",
    "packages" "jsonb",
    "delivery_days" integer,
    "duration_minutes" integer,
    "requirements_prompt" "text",
    "images" "jsonb" DEFAULT '[]'::"jsonb",
    "video_url" "text",
    "status" "text" DEFAULT 'draft'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "svc_listings_listing_type_check" CHECK (("listing_type" = ANY (ARRAY['service_package'::"text", 'appointment'::"text", 'job_posting'::"text", 'quote_request'::"text"]))),
    CONSTRAINT "svc_listings_price_type_check" CHECK (("price_type" = ANY (ARRAY['fixed'::"text", 'hourly'::"text", 'range'::"text", 'negotiable'::"text", 'free'::"text"]))),
    CONSTRAINT "svc_listings_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'active'::"text", 'paused'::"text", 'filled'::"text", 'closed'::"text"])))
);


ALTER TABLE "public"."svc_listings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."svc_orders" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "provider_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "order_type" "text" NOT NULL,
    "agreed_price" numeric(10,2),
    "currency" "text" DEFAULT 'USD'::"text",
    "payment_status" "text" DEFAULT 'pending'::"text",
    "status" "text" DEFAULT 'pending'::"text",
    "client_message" "text",
    "client_files" "jsonb" DEFAULT '[]'::"jsonb",
    "provider_delivery_url" "text",
    "provider_message" "text",
    "ordered_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "svc_orders_order_type_check" CHECK (("order_type" = ANY (ARRAY['purchase'::"text", 'booking'::"text", 'application'::"text", 'inquiry'::"text"]))),
    CONSTRAINT "svc_orders_payment_status_check" CHECK (("payment_status" = ANY (ARRAY['pending'::"text", 'paid'::"text", 'refunded'::"text", 'failed'::"text"]))),
    CONSTRAINT "svc_orders_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'requirements_pending'::"text", 'in_progress'::"text", 'delivered'::"text", 'completed'::"text", 'cancelled'::"text", 'disputed'::"text", 'interview_scheduled'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."svc_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."svc_portfolio" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "provider_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "category_tag" "text",
    "image_url" "text" NOT NULL,
    "project_url" "text",
    "completion_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."svc_portfolio" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."svc_providers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "provider_name" "text" NOT NULL,
    "provider_type" "text" NOT NULL,
    "tagline" "text",
    "registration_number" "text",
    "tax_id" "text",
    "is_verified" boolean DEFAULT false,
    "verification_documents" "jsonb" DEFAULT '[]'::"jsonb",
    "description" "text",
    "website_url" "text",
    "phone_public" "text",
    "email_public" "text",
    "location_country" "text",
    "location_city" "text",
    "full_address" "text",
    "geo_coordinates" "jsonb",
    "specialties" "text"[],
    "languages" "text"[],
    "year_established" integer,
    "team_size_range" "text",
    "logo_url" "text",
    "cover_image_url" "text",
    "gallery_images" "jsonb" DEFAULT '[]'::"jsonb",
    "total_jobs_completed" integer DEFAULT 0,
    "total_earnings" numeric(10,2) DEFAULT 0,
    "average_rating" numeric(3,2) DEFAULT 0,
    "review_count" integer DEFAULT 0,
    "response_time_hours" integer,
    "is_available" boolean DEFAULT true,
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "phone" character varying(20),
    "website" character varying(200),
    "email" character varying(200),
    "latitude" numeric(10,8),
    "longitude" numeric(11,8),
    CONSTRAINT "svc_providers_provider_type_check" CHECK (("provider_type" = ANY (ARRAY['individual'::"text", 'company'::"text", 'hospital'::"text", 'institution'::"text", 'ngo'::"text"]))),
    CONSTRAINT "svc_providers_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'suspended'::"text", 'pending_review'::"text"])))
);


ALTER TABLE "public"."svc_providers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."svc_reviews" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "provider_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "rating" integer NOT NULL,
    "comment" "text",
    "response_from_provider" "text",
    "is_visible" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "svc_reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."svc_reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."svc_subcategories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "category_id" "uuid",
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."svc_subcategories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trading_conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "conversation_type" "public"."trading_conv_type" DEFAULT 'product_inquiry'::"public"."trading_conv_type" NOT NULL,
    "product_id" "uuid",
    "deal_id" "uuid",
    "initiator_id" "uuid" NOT NULL,
    "receiver_id" "uuid" NOT NULL,
    "initiator_role" "text" NOT NULL,
    "receiver_role" "text" NOT NULL,
    "is_custom_request" boolean DEFAULT false,
    "custom_request_details" "jsonb",
    "factory_id" "uuid",
    "middleman_id" "uuid",
    "last_message" "text",
    "last_message_at" timestamp with time zone,
    "is_archived" boolean DEFAULT false,
    "is_closed" boolean DEFAULT false,
    CONSTRAINT "trading_conversations_initiator_role_check" CHECK (("initiator_role" = ANY (ARRAY['customer'::"text", 'seller'::"text", 'factory'::"text", 'middleman'::"text"]))),
    CONSTRAINT "trading_conversations_receiver_role_check" CHECK (("receiver_role" = ANY (ARRAY['customer'::"text", 'seller'::"text", 'factory'::"text", 'middleman'::"text"])))
);


ALTER TABLE "public"."trading_conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trading_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "content" "text",
    "message_type" "public"."trading_msg_type" DEFAULT 'text'::"public"."trading_msg_type",
    "attachment_url" "text",
    "attachment_name" "text",
    "is_read" boolean DEFAULT false,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "content_tsvector" "tsvector" GENERATED ALWAYS AS ("to_tsvector"('"english"'::"regconfig", COALESCE("content", ''::"text"))) STORED
);


ALTER TABLE "public"."trading_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "event_category" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "device_info" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "phone" "text",
    "avatar_url" "text",
    "account_type" "text" DEFAULT 'user'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wishlist" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "asin" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."wishlist" OWNER TO "postgres";


ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."analytics"
    ADD CONSTRAINT "analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."analytics_snapshots"
    ADD CONSTRAINT "analytics_snapshots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."async_jobs"
    ADD CONSTRAINT "async_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."brands"
    ADD CONSTRAINT "brands_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."brands"
    ADD CONSTRAINT "brands_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."business_profiles"
    ADD CONSTRAINT "business_profiles_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."cart"
    ADD CONSTRAINT "cart_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cart"
    ADD CONSTRAINT "cart_user_id_asin_key" UNIQUE ("user_id", "asin");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."commissions"
    ADD CONSTRAINT "commissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deals"
    ADD CONSTRAINT "deals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deals_v2"
    ADD CONSTRAINT "deals_v2_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."delivery_assignments"
    ADD CONSTRAINT "delivery_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."delivery_profiles"
    ADD CONSTRAINT "delivery_profiles_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."factories"
    ADD CONSTRAINT "factories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."factory_connections"
    ADD CONSTRAINT "factory_connections_factory_id_seller_id_key" UNIQUE ("factory_id", "seller_id");



ALTER TABLE ONLY "public"."factory_connections"
    ADD CONSTRAINT "factory_connections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."factory_production_logs"
    ADD CONSTRAINT "factory_production_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."factory_ratings"
    ADD CONSTRAINT "factory_ratings_factory_id_seller_id_key" UNIQUE ("factory_id", "seller_id");



ALTER TABLE ONLY "public"."factory_ratings"
    ADD CONSTRAINT "factory_ratings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."freelancer_portfolio"
    ADD CONSTRAINT "freelancer_portfolio_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."freelancer_profiles"
    ADD CONSTRAINT "freelancer_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."freelancer_profiles"
    ADD CONSTRAINT "freelancer_profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."idempotency_keys"
    ADD CONSTRAINT "idempotency_keys_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."idempotency_keys"
    ADD CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."middle_man_deals"
    ADD CONSTRAINT "middle_man_deals_middle_man_id_product_asin_key" UNIQUE ("middle_man_id", "product_asin");



ALTER TABLE ONLY "public"."middle_man_deals"
    ADD CONSTRAINT "middle_man_deals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."middle_man_deals"
    ADD CONSTRAINT "middle_man_deals_unique_slug_key" UNIQUE ("unique_slug");



ALTER TABLE ONLY "public"."middle_men"
    ADD CONSTRAINT "middle_men_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."middleman_profiles"
    ADD CONSTRAINT "middleman_profiles_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_intentions"
    ADD CONSTRAINT "payment_intentions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_asin_key" UNIQUE ("asin");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_asin_unique" UNIQUE ("asin");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_user_id_token_key" UNIQUE ("user_id", "token");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_user_id_asin_key" UNIQUE ("user_id", "asin");



ALTER TABLE ONLY "public"."seller_profiles"
    ADD CONSTRAINT "seller_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sellers"
    ADD CONSTRAINT "sellers_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."sellers"
    ADD CONSTRAINT "sellers_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."service_bookings"
    ADD CONSTRAINT "service_bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_categories"
    ADD CONSTRAINT "service_categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."service_categories"
    ADD CONSTRAINT "service_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_categories"
    ADD CONSTRAINT "service_categories_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."service_gigs"
    ADD CONSTRAINT "service_gigs_freelancer_id_slug_key" UNIQUE ("freelancer_id", "slug");



ALTER TABLE ONLY "public"."service_gigs"
    ADD CONSTRAINT "service_gigs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_listings"
    ADD CONSTRAINT "service_listings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_orders"
    ADD CONSTRAINT "service_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_providers"
    ADD CONSTRAINT "service_providers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_reviews"
    ADD CONSTRAINT "service_reviews_order_id_key" UNIQUE ("order_id");



ALTER TABLE ONLY "public"."service_reviews"
    ADD CONSTRAINT "service_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_subcategories"
    ADD CONSTRAINT "service_subcategories_category_id_name_key" UNIQUE ("category_id", "name");



ALTER TABLE ONLY "public"."service_subcategories"
    ADD CONSTRAINT "service_subcategories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."services_conversations"
    ADD CONSTRAINT "services_conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."services_messages"
    ADD CONSTRAINT "services_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shipping_addresses"
    ADD CONSTRAINT "shipping_addresses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shipping_addresses"
    ADD CONSTRAINT "shipping_addresses_user_id_is_default_key" UNIQUE ("user_id", "is_default");



ALTER TABLE ONLY "public"."subcategories"
    ADD CONSTRAINT "subcategories_category_id_name_key" UNIQUE ("category_id", "name");



ALTER TABLE ONLY "public"."subcategories"
    ADD CONSTRAINT "subcategories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."svc_categories"
    ADD CONSTRAINT "svc_categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."svc_categories"
    ADD CONSTRAINT "svc_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."svc_categories"
    ADD CONSTRAINT "svc_categories_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."svc_listings"
    ADD CONSTRAINT "svc_listings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."svc_listings"
    ADD CONSTRAINT "svc_listings_provider_id_slug_key" UNIQUE ("provider_id", "slug");



ALTER TABLE ONLY "public"."svc_orders"
    ADD CONSTRAINT "svc_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."svc_portfolio"
    ADD CONSTRAINT "svc_portfolio_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."svc_providers"
    ADD CONSTRAINT "svc_providers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."svc_providers"
    ADD CONSTRAINT "svc_providers_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."svc_reviews"
    ADD CONSTRAINT "svc_reviews_order_id_key" UNIQUE ("order_id");



ALTER TABLE ONLY "public"."svc_reviews"
    ADD CONSTRAINT "svc_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."svc_subcategories"
    ADD CONSTRAINT "svc_subcategories_category_id_name_key" UNIQUE ("category_id", "name");



ALTER TABLE ONLY "public"."svc_subcategories"
    ADD CONSTRAINT "svc_subcategories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trading_conversations"
    ADD CONSTRAINT "trading_conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trading_messages"
    ADD CONSTRAINT "trading_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_providers"
    ADD CONSTRAINT "unique_provider_user" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."analytics_snapshots"
    ADD CONSTRAINT "unique_seller_period" UNIQUE ("seller_id", "period_type", "period_start", "period_end");



ALTER TABLE ONLY "public"."services_conversations"
    ADD CONSTRAINT "unique_service_conv" UNIQUE ("provider_id", "client_id", "listing_id");



ALTER TABLE ONLY "public"."user_events"
    ADD CONSTRAINT "user_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."wishlist"
    ADD CONSTRAINT "wishlist_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wishlist"
    ADD CONSTRAINT "wishlist_user_id_asin_key" UNIQUE ("user_id", "asin");



CREATE INDEX "idx_activity_logs_created_at" ON "public"."activity_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_activity_logs_user_id" ON "public"."activity_logs" USING "btree" ("user_id");



CREATE INDEX "idx_analytics_is_current" ON "public"."analytics_snapshots" USING "btree" ("is_current") WHERE ("is_current" = true);



CREATE INDEX "idx_analytics_period_start" ON "public"."analytics_snapshots" USING "btree" ("period_start" DESC);



CREATE INDEX "idx_analytics_period_type" ON "public"."analytics_snapshots" USING "btree" ("period_type");



CREATE INDEX "idx_analytics_seller_id" ON "public"."analytics_snapshots" USING "btree" ("seller_id");



CREATE INDEX "idx_assignments_driver" ON "public"."delivery_assignments" USING "btree" ("driver_id");



CREATE INDEX "idx_assignments_order" ON "public"."delivery_assignments" USING "btree" ("order_id");



CREATE INDEX "idx_async_jobs_queue_status" ON "public"."async_jobs" USING "btree" ("queue_name", "status", "scheduled_for");



CREATE INDEX "idx_async_jobs_scheduled" ON "public"."async_jobs" USING "btree" ("scheduled_for") WHERE ("status" = 'pending'::"text");



CREATE INDEX "idx_bookings_customer" ON "public"."service_bookings" USING "btree" ("customer_id");



CREATE INDEX "idx_bookings_provider" ON "public"."service_bookings" USING "btree" ("provider_id");



CREATE INDEX "idx_cart_asin" ON "public"."cart" USING "btree" ("asin");



CREATE INDEX "idx_cart_user_asin" ON "public"."cart" USING "btree" ("user_id", "asin");



CREATE INDEX "idx_cart_user_id" ON "public"."cart" USING "btree" ("user_id");



CREATE INDEX "idx_categories_parent" ON "public"."categories" USING "btree" ("parent_id");



CREATE INDEX "idx_categories_slug" ON "public"."categories" USING "btree" ("slug");



CREATE INDEX "idx_commissions_middle_man" ON "public"."commissions" USING "btree" ("middle_man_id");



CREATE INDEX "idx_commissions_status" ON "public"."commissions" USING "btree" ("status");



CREATE INDEX "idx_customers_age_range" ON "public"."customers" USING "btree" ("age_range");



CREATE INDEX "idx_customers_seller_id" ON "public"."customers" USING "btree" ("seller_id");



CREATE INDEX "idx_customers_seller_total_spent" ON "public"."customers" USING "btree" ("user_id", "total_spent" DESC);



CREATE INDEX "idx_customers_user_id" ON "public"."customers" USING "btree" ("user_id");



CREATE INDEX "idx_delivery_location" ON "public"."delivery_profiles" USING "btree" ("latitude", "longitude") WHERE (("is_active" = true) AND ("is_verified" = true));



CREATE INDEX "idx_error_logs_user_id" ON "public"."error_logs" USING "btree" ("user_id");



CREATE INDEX "idx_factories_company_name" ON "public"."factories" USING "btree" ("company_name");



CREATE INDEX "idx_factories_email" ON "public"."factories" USING "btree" ("email");



CREATE INDEX "idx_factories_lat" ON "public"."factories" USING "btree" ("latitude");



CREATE INDEX "idx_factories_lat_long" ON "public"."factories" USING "btree" ("latitude", "longitude");



CREATE INDEX "idx_factories_location" ON "public"."factories" USING "btree" ("latitude", "longitude");



CREATE INDEX "idx_factories_long" ON "public"."factories" USING "btree" ("longitude");



CREATE INDEX "idx_factories_user_id" ON "public"."factories" USING "btree" ("user_id");



CREATE INDEX "idx_factory_connections_factory" ON "public"."factory_connections" USING "btree" ("factory_id");



CREATE INDEX "idx_factory_connections_seller" ON "public"."factory_connections" USING "btree" ("seller_id");



CREATE INDEX "idx_factory_connections_status" ON "public"."factory_connections" USING "btree" ("status");



CREATE INDEX "idx_factory_ratings_factory" ON "public"."factory_ratings" USING "btree" ("factory_id");



CREATE INDEX "idx_freelancer_profiles_skills" ON "public"."freelancer_profiles" USING "gin" ("skills");



CREATE INDEX "idx_freelancer_profiles_user_id" ON "public"."freelancer_profiles" USING "btree" ("user_id");



CREATE INDEX "idx_idempotency_keys_expires" ON "public"."idempotency_keys" USING "btree" ("expires_at");



CREATE INDEX "idx_idempotency_keys_key" ON "public"."idempotency_keys" USING "btree" ("key");



CREATE INDEX "idx_location_history_user_id" ON "public"."location_history" USING "btree" ("user_id");



CREATE INDEX "idx_middle_man_deals_middle_man" ON "public"."middle_man_deals" USING "btree" ("middle_man_id");



CREATE INDEX "idx_middle_man_deals_slug" ON "public"."middle_man_deals" USING "btree" ("unique_slug");



CREATE INDEX "idx_notifications_created_at" ON "public"."notifications" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_notifications_user_is_read" ON "public"."notifications" USING "btree" ("user_id", "is_read") WHERE ("is_read" = false);



CREATE INDEX "idx_order_items_asin" ON "public"."order_items" USING "btree" ("asin");



CREATE INDEX "idx_order_items_order_id" ON "public"."order_items" USING "btree" ("order_id");



CREATE INDEX "idx_orders_created_at" ON "public"."orders" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_orders_middle_man" ON "public"."orders" USING "btree" ("middle_man_id");



CREATE INDEX "idx_orders_seller_id" ON "public"."orders" USING "btree" ("seller_id");



CREATE INDEX "idx_orders_status" ON "public"."orders" USING "btree" ("status");



CREATE INDEX "idx_orders_user_id" ON "public"."orders" USING "btree" ("user_id");



CREATE INDEX "idx_products_attributes" ON "public"."products" USING "gin" ("attributes");



CREATE INDEX "idx_products_brand" ON "public"."products" USING "btree" ("brand");



CREATE INDEX "idx_products_category" ON "public"."products" USING "btree" ("category");



CREATE INDEX "idx_products_created_at" ON "public"."products" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_products_price" ON "public"."products" USING "btree" ("price");



CREATE INDEX "idx_products_search" ON "public"."products" USING "gin" ("title_description");



CREATE INDEX "idx_products_seller_id" ON "public"."products" USING "btree" ("seller_id");



CREATE INDEX "idx_products_status" ON "public"."products" USING "btree" ("status");



CREATE INDEX "idx_products_subcategory" ON "public"."products" USING "btree" ("subcategory");



CREATE INDEX "idx_reviews_asin" ON "public"."reviews" USING "btree" ("asin");



CREATE INDEX "idx_reviews_user_id" ON "public"."reviews" USING "btree" ("user_id");



CREATE INDEX "idx_sellers_location" ON "public"."sellers" USING "btree" ("latitude", "longitude");



CREATE INDEX "idx_service_gigs_category" ON "public"."service_gigs" USING "btree" ("category_id");



CREATE INDEX "idx_service_gigs_freelancer_id" ON "public"."service_gigs" USING "btree" ("freelancer_id");



CREATE INDEX "idx_service_gigs_status" ON "public"."service_gigs" USING "btree" ("status");



CREATE INDEX "idx_service_orders_buyer" ON "public"."service_orders" USING "btree" ("buyer_id");



CREATE INDEX "idx_service_orders_freelancer" ON "public"."service_orders" USING "btree" ("freelancer_id");



CREATE INDEX "idx_service_orders_status" ON "public"."service_orders" USING "btree" ("status");



CREATE INDEX "idx_subcategories_category" ON "public"."subcategories" USING "btree" ("category_id");



CREATE INDEX "idx_svc_bookings_customer" ON "public"."service_bookings" USING "btree" ("customer_id");



CREATE INDEX "idx_svc_bookings_provider" ON "public"."service_bookings" USING "btree" ("provider_id");



CREATE INDEX "idx_svc_conv_client" ON "public"."services_conversations" USING "btree" ("client_id");



CREATE INDEX "idx_svc_conv_listing" ON "public"."services_conversations" USING "btree" ("listing_id");



CREATE INDEX "idx_svc_conv_provider" ON "public"."services_conversations" USING "btree" ("provider_id");



CREATE INDEX "idx_svc_conv_updated" ON "public"."services_conversations" USING "btree" ("updated_at" DESC);



CREATE INDEX "idx_svc_listings_category" ON "public"."svc_listings" USING "btree" ("category_id");



CREATE INDEX "idx_svc_listings_provider" ON "public"."service_listings" USING "btree" ("provider_id");



CREATE INDEX "idx_svc_listings_status" ON "public"."svc_listings" USING "btree" ("status");



CREATE INDEX "idx_svc_listings_type" ON "public"."svc_listings" USING "btree" ("listing_type");



CREATE INDEX "idx_svc_msg_conv" ON "public"."services_messages" USING "btree" ("conversation_id", "created_at" DESC);



CREATE INDEX "idx_svc_msg_search" ON "public"."services_messages" USING "gin" ("content_tsvector");



CREATE INDEX "idx_svc_msg_sender" ON "public"."services_messages" USING "btree" ("sender_id");



CREATE INDEX "idx_svc_orders_provider" ON "public"."svc_orders" USING "btree" ("provider_id");



CREATE INDEX "idx_svc_orders_status" ON "public"."svc_orders" USING "btree" ("status");



CREATE INDEX "idx_svc_orders_user" ON "public"."svc_orders" USING "btree" ("user_id");



CREATE INDEX "idx_svc_providers_location" ON "public"."svc_providers" USING "btree" ("location_city");



CREATE INDEX "idx_svc_providers_specialties" ON "public"."svc_providers" USING "gin" ("specialties");



CREATE INDEX "idx_svc_providers_status" ON "public"."svc_providers" USING "btree" ("status");



CREATE INDEX "idx_svc_providers_type" ON "public"."svc_providers" USING "btree" ("provider_type");



CREATE INDEX "idx_svc_providers_user" ON "public"."service_providers" USING "btree" ("user_id");



CREATE INDEX "idx_trading_conv_initiator" ON "public"."trading_conversations" USING "btree" ("initiator_id");



CREATE INDEX "idx_trading_conv_product" ON "public"."trading_conversations" USING "btree" ("product_id");



CREATE INDEX "idx_trading_conv_receiver" ON "public"."trading_conversations" USING "btree" ("receiver_id");



CREATE INDEX "idx_trading_conv_updated" ON "public"."trading_conversations" USING "btree" ("updated_at" DESC);



CREATE INDEX "idx_trading_msg_conv" ON "public"."trading_messages" USING "btree" ("conversation_id", "created_at" DESC);



CREATE INDEX "idx_trading_msg_search" ON "public"."trading_messages" USING "gin" ("content_tsvector");



CREATE INDEX "idx_user_events_created_at" ON "public"."user_events" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_user_events_type" ON "public"."user_events" USING "btree" ("event_type");



CREATE INDEX "idx_user_events_user_id" ON "public"."user_events" USING "btree" ("user_id");



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_users_user_id" ON "public"."users" USING "btree" ("user_id");



CREATE INDEX "idx_wishlist_user_id" ON "public"."wishlist" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "decrement_inventory_on_order_item" AFTER INSERT ON "public"."order_items" FOR EACH ROW EXECUTE FUNCTION "public"."decrement_product_inventory"();



CREATE OR REPLACE TRIGGER "generate_product_description_trigger" BEFORE INSERT OR UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."generate_product_description"();



CREATE OR REPLACE TRIGGER "order_notification_trigger" AFTER UPDATE OF "status" ON "public"."orders" FOR EACH ROW WHEN (("old"."status" IS DISTINCT FROM "new"."status")) EXECUTE FUNCTION "public"."create_order_notification"();



CREATE OR REPLACE TRIGGER "products_tsvector_update" BEFORE INSERT OR UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."products_tsvector_trigger"();



CREATE OR REPLACE TRIGGER "trigger_calculate_commission" BEFORE INSERT OR UPDATE OF "deal_id", "subtotal" ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."calculate_order_commission"();



CREATE OR REPLACE TRIGGER "trigger_calculate_middle_man_commission" AFTER UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."calculate_middle_man_commission"();



CREATE OR REPLACE TRIGGER "trigger_cleanup_product_images" BEFORE UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."cleanup_product_images"();



CREATE OR REPLACE TRIGGER "trigger_service_booking_notifications" AFTER INSERT OR UPDATE ON "public"."service_bookings" FOR EACH ROW EXECUTE FUNCTION "public"."handle_service_booking_notifications"();



CREATE OR REPLACE TRIGGER "trigger_svc_conv_update" AFTER INSERT ON "public"."services_messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_svc_conv_on_message"();



CREATE OR REPLACE TRIGGER "trigger_svc_rating" AFTER INSERT ON "public"."svc_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_svc_provider_rating"();



CREATE OR REPLACE TRIGGER "trigger_svc_stats" AFTER UPDATE ON "public"."svc_orders" FOR EACH ROW EXECUTE FUNCTION "public"."update_svc_provider_stats"();



CREATE OR REPLACE TRIGGER "trigger_trading_conv_update" AFTER INSERT ON "public"."trading_messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_trading_conv_on_message"();



CREATE OR REPLACE TRIGGER "trigger_update_factory_connections_timestamp" BEFORE UPDATE ON "public"."factory_connections" FOR EACH ROW EXECUTE FUNCTION "public"."update_factory_connections_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_update_freelancer_rating" AFTER INSERT OR UPDATE ON "public"."service_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_freelancer_rating"();



CREATE OR REPLACE TRIGGER "trigger_update_freelancer_stats_on_completion" AFTER UPDATE ON "public"."service_orders" FOR EACH ROW EXECUTE FUNCTION "public"."update_freelancer_stats_on_completion"();



CREATE OR REPLACE TRIGGER "update_order_status_timestamps" BEFORE UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."update_order_status_timestamps"();



CREATE OR REPLACE TRIGGER "update_svc_conv_timestamp" BEFORE UPDATE ON "public"."services_conversations" FOR EACH ROW EXECUTE FUNCTION "public"."update_svc_timestamps"();



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."analytics"
    ADD CONSTRAINT "analytics_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."analytics_snapshots"
    ADD CONSTRAINT "analytics_snapshots_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."business_profiles"
    ADD CONSTRAINT "business_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."cart"
    ADD CONSTRAINT "cart_asin_fkey" FOREIGN KEY ("asin") REFERENCES "public"."products"("asin") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cart"
    ADD CONSTRAINT "cart_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."commissions"
    ADD CONSTRAINT "commissions_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "public"."middle_man_deals"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."commissions"
    ADD CONSTRAINT "commissions_middle_man_id_fkey" FOREIGN KEY ("middle_man_id") REFERENCES "public"."middle_men"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."commissions"
    ADD CONSTRAINT "commissions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."delivery_assignments"
    ADD CONSTRAINT "delivery_assignments_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."delivery_profiles"("user_id");



ALTER TABLE ONLY "public"."delivery_assignments"
    ADD CONSTRAINT "delivery_assignments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."delivery_profiles"
    ADD CONSTRAINT "delivery_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."factories"
    ADD CONSTRAINT "factories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."factory_connections"
    ADD CONSTRAINT "factory_connections_factory_id_fkey" FOREIGN KEY ("factory_id") REFERENCES "public"."sellers"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."factory_connections"
    ADD CONSTRAINT "factory_connections_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."factory_production_logs"
    ADD CONSTRAINT "factory_production_logs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."factory_production_logs"
    ADD CONSTRAINT "factory_production_logs_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id");



ALTER TABLE ONLY "public"."factory_ratings"
    ADD CONSTRAINT "factory_ratings_factory_id_fkey" FOREIGN KEY ("factory_id") REFERENCES "public"."sellers"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."factory_ratings"
    ADD CONSTRAINT "factory_ratings_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."freelancer_portfolio"
    ADD CONSTRAINT "freelancer_portfolio_freelancer_id_fkey" FOREIGN KEY ("freelancer_id") REFERENCES "public"."freelancer_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."freelancer_profiles"
    ADD CONSTRAINT "freelancer_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."middle_man_deals"
    ADD CONSTRAINT "middle_man_deals_middle_man_id_fkey" FOREIGN KEY ("middle_man_id") REFERENCES "public"."middle_men"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."middle_man_deals"
    ADD CONSTRAINT "middle_man_deals_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."middle_men"
    ADD CONSTRAINT "middle_men_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."middleman_profiles"
    ADD CONSTRAINT "middleman_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "public"."delivery_profiles"("user_id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_middle_man_id_fkey" FOREIGN KEY ("middle_man_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_shipping_address_id_fkey" FOREIGN KEY ("shipping_address_id") REFERENCES "public"."shipping_addresses"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_intentions"
    ADD CONSTRAINT "payment_intentions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_intentions"
    ADD CONSTRAINT "payment_intentions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."seller_profiles"
    ADD CONSTRAINT "seller_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sellers"
    ADD CONSTRAINT "sellers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_bookings"
    ADD CONSTRAINT "service_bookings_client_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_bookings"
    ADD CONSTRAINT "service_bookings_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_bookings"
    ADD CONSTRAINT "service_bookings_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."service_listings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."service_bookings"
    ADD CONSTRAINT "service_bookings_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_gigs"
    ADD CONSTRAINT "service_gigs_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."service_categories"("id");



ALTER TABLE ONLY "public"."service_gigs"
    ADD CONSTRAINT "service_gigs_freelancer_id_fkey" FOREIGN KEY ("freelancer_id") REFERENCES "public"."freelancer_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_gigs"
    ADD CONSTRAINT "service_gigs_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "public"."service_subcategories"("id");



ALTER TABLE ONLY "public"."service_listings"
    ADD CONSTRAINT "service_listings_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."service_providers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_orders"
    ADD CONSTRAINT "service_orders_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."service_orders"
    ADD CONSTRAINT "service_orders_freelancer_id_fkey" FOREIGN KEY ("freelancer_id") REFERENCES "public"."freelancer_profiles"("id");



ALTER TABLE ONLY "public"."service_orders"
    ADD CONSTRAINT "service_orders_gig_id_fkey" FOREIGN KEY ("gig_id") REFERENCES "public"."service_gigs"("id");



ALTER TABLE ONLY "public"."service_providers"
    ADD CONSTRAINT "service_providers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_reviews"
    ADD CONSTRAINT "service_reviews_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."service_reviews"
    ADD CONSTRAINT "service_reviews_freelancer_id_fkey" FOREIGN KEY ("freelancer_id") REFERENCES "public"."freelancer_profiles"("id");



ALTER TABLE ONLY "public"."service_reviews"
    ADD CONSTRAINT "service_reviews_gig_id_fkey" FOREIGN KEY ("gig_id") REFERENCES "public"."service_gigs"("id");



ALTER TABLE ONLY "public"."service_reviews"
    ADD CONSTRAINT "service_reviews_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."service_orders"("id");



ALTER TABLE ONLY "public"."service_subcategories"
    ADD CONSTRAINT "service_subcategories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."service_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."services_conversations"
    ADD CONSTRAINT "services_conversations_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."services_conversations"
    ADD CONSTRAINT "services_conversations_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."service_listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."services_conversations"
    ADD CONSTRAINT "services_conversations_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."services_messages"
    ADD CONSTRAINT "services_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."services_conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."services_messages"
    ADD CONSTRAINT "services_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shipping_addresses"
    ADD CONSTRAINT "shipping_addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subcategories"
    ADD CONSTRAINT "subcategories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."svc_listings"
    ADD CONSTRAINT "svc_listings_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."svc_categories"("id");



ALTER TABLE ONLY "public"."svc_listings"
    ADD CONSTRAINT "svc_listings_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."svc_providers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."svc_listings"
    ADD CONSTRAINT "svc_listings_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "public"."svc_subcategories"("id");



ALTER TABLE ONLY "public"."svc_orders"
    ADD CONSTRAINT "svc_orders_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."svc_listings"("id");



ALTER TABLE ONLY "public"."svc_orders"
    ADD CONSTRAINT "svc_orders_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."svc_providers"("id");



ALTER TABLE ONLY "public"."svc_orders"
    ADD CONSTRAINT "svc_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."svc_portfolio"
    ADD CONSTRAINT "svc_portfolio_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."svc_providers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."svc_providers"
    ADD CONSTRAINT "svc_providers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."svc_reviews"
    ADD CONSTRAINT "svc_reviews_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."svc_orders"("id");



ALTER TABLE ONLY "public"."svc_reviews"
    ADD CONSTRAINT "svc_reviews_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."svc_providers"("id");



ALTER TABLE ONLY "public"."svc_reviews"
    ADD CONSTRAINT "svc_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."svc_subcategories"
    ADD CONSTRAINT "svc_subcategories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."svc_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trading_conversations"
    ADD CONSTRAINT "trading_conversations_factory_id_fkey" FOREIGN KEY ("factory_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trading_conversations"
    ADD CONSTRAINT "trading_conversations_initiator_id_fkey" FOREIGN KEY ("initiator_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trading_conversations"
    ADD CONSTRAINT "trading_conversations_middleman_id_fkey" FOREIGN KEY ("middleman_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trading_conversations"
    ADD CONSTRAINT "trading_conversations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trading_conversations"
    ADD CONSTRAINT "trading_conversations_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trading_messages"
    ADD CONSTRAINT "trading_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."trading_conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trading_messages"
    ADD CONSTRAINT "trading_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_events"
    ADD CONSTRAINT "user_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wishlist"
    ADD CONSTRAINT "wishlist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Buyers create reviews for completed orders" ON "public"."service_reviews" FOR INSERT TO "authenticated" WITH CHECK ((("buyer_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."service_orders"
  WHERE (("service_orders"."id" = "service_reviews"."order_id") AND ("service_orders"."status" = 'completed'::"text") AND ("service_orders"."buyer_id" = "auth"."uid"()))))));



CREATE POLICY "Buyers create service orders" ON "public"."service_orders" FOR INSERT TO "authenticated" WITH CHECK (("buyer_id" = "auth"."uid"()));



CREATE POLICY "Categories are publicly viewable" ON "public"."categories" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Factories: Users can delete own profile" ON "public"."factories" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Factories: Users can insert own profile" ON "public"."factories" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Factories: Users can update own profile" ON "public"."factories" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Factories: Users can view own profile" ON "public"."factories" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Freelancers manage own gigs" ON "public"."service_gigs" TO "authenticated" USING (("freelancer_id" = ( SELECT "freelancer_profiles"."id"
   FROM "public"."freelancer_profiles"
  WHERE ("freelancer_profiles"."user_id" = "auth"."uid"())))) WITH CHECK (("freelancer_id" = ( SELECT "freelancer_profiles"."id"
   FROM "public"."freelancer_profiles"
  WHERE ("freelancer_profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "Freelancers manage own portfolio" ON "public"."freelancer_portfolio" TO "authenticated" USING (("freelancer_id" = ( SELECT "freelancer_profiles"."id"
   FROM "public"."freelancer_profiles"
  WHERE ("freelancer_profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "Freelancers update own orders" ON "public"."service_orders" FOR UPDATE TO "authenticated" USING (("freelancer_id" = ( SELECT "freelancer_profiles"."id"
   FROM "public"."freelancer_profiles"
  WHERE ("freelancer_profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "Public view active gigs" ON "public"."service_gigs" FOR SELECT TO "authenticated", "anon" USING (("status" = 'active'::"text"));



CREATE POLICY "Public view freelancer profiles" ON "public"."freelancer_profiles" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Public view portfolio" ON "public"."freelancer_portfolio" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Public view reviews" ON "public"."service_reviews" FOR SELECT TO "authenticated", "anon" USING (("is_visible" = true));



CREATE POLICY "Public view service categories" ON "public"."service_categories" FOR SELECT TO "authenticated", "anon" USING (("is_active" = true));



CREATE POLICY "Public view verified factories" ON "public"."factories" FOR SELECT TO "authenticated", "anon" USING (("is_verified" = true));



CREATE POLICY "Users can update own profile" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own profile" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users insert own profile" ON "public"."freelancer_profiles" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users update own profile" ON "public"."freelancer_profiles" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users view own service orders" ON "public"."service_orders" FOR SELECT TO "authenticated" USING ((("buyer_id" = "auth"."uid"()) OR ("freelancer_id" = ( SELECT "freelancer_profiles"."id"
   FROM "public"."freelancer_profiles"
  WHERE ("freelancer_profiles"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."activity_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admins_view_all_commissions" ON "public"."commissions" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."admin_users"
  WHERE ("admin_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "admins_view_all_deals" ON "public"."middle_man_deals" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."admin_users"
  WHERE ("admin_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "admins_view_all_orders" ON "public"."orders" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."admin_users"
  WHERE ("admin_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "analytics_seller_own" ON "public"."analytics_snapshots" TO "authenticated" USING (("seller_id" = "auth"."uid"())) WITH CHECK (("seller_id" = "auth"."uid"()));



ALTER TABLE "public"."analytics_snapshots" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "anyone_view_factory_ratings" ON "public"."factory_ratings" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."cart" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "clients_view_own_bookings" ON "public"."service_bookings" FOR SELECT USING (("auth"."uid"() = "customer_id"));



ALTER TABLE "public"."commissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "customers_create_bookings" ON "public"."service_bookings" FOR INSERT WITH CHECK (("auth"."uid"() = "customer_id"));



CREATE POLICY "customers_view_active_products" ON "public"."products" FOR SELECT TO "authenticated" USING (("status" = 'active'::"text"));



CREATE POLICY "deals_manage_middleman" ON "public"."deals" TO "authenticated" USING (("middleman_id" = "auth"."uid"())) WITH CHECK (("middleman_id" = "auth"."uid"()));



CREATE POLICY "deals_view_participants" ON "public"."deals" FOR SELECT TO "authenticated" USING ((("party_a_id" = "auth"."uid"()) OR ("party_b_id" = "auth"."uid"()) OR ("middleman_id" = "auth"."uid"())));



CREATE POLICY "delivery_manage_own_assignments" ON "public"."delivery_assignments" TO "authenticated" USING (("driver_id" = "auth"."uid"())) WITH CHECK (("driver_id" = "auth"."uid"()));



CREATE POLICY "delivery_update_location" ON "public"."delivery_profiles" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "delivery_update_own" ON "public"."delivery_profiles" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "delivery_view_assigned_orders" ON "public"."orders" FOR SELECT TO "authenticated" USING ((("delivery_id" = "auth"."uid"()) OR ("seller_id" = "auth"."uid"()) OR ("user_id" = "auth"."uid"())));



CREATE POLICY "delivery_view_own" ON "public"."delivery_profiles" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."error_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "everyone_view_approved_reviews" ON "public"."reviews" FOR SELECT TO "authenticated" USING (("is_approved" = true));



ALTER TABLE "public"."factories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "factories_manage_own_production" ON "public"."factory_production_logs" TO "authenticated" USING (("order_id" IN ( SELECT "orders"."id"
   FROM "public"."orders"
  WHERE ("orders"."seller_id" = "auth"."uid"()))));



CREATE POLICY "factories_update_own_connections" ON "public"."factory_connections" FOR UPDATE TO "authenticated" USING (("factory_id" = "auth"."uid"())) WITH CHECK (("factory_id" = "auth"."uid"()));



ALTER TABLE "public"."factory_connections" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "factory_connections_insert_own" ON "public"."factory_connections" FOR INSERT TO "authenticated" WITH CHECK ((("factory_id" = "auth"."uid"()) OR ("seller_id" = "auth"."uid"())));



CREATE POLICY "factory_connections_update_own" ON "public"."factory_connections" FOR UPDATE TO "authenticated" USING ((("factory_id" = "auth"."uid"()) OR ("seller_id" = "auth"."uid"()))) WITH CHECK ((("factory_id" = "auth"."uid"()) OR ("seller_id" = "auth"."uid"())));



CREATE POLICY "factory_connections_view_own" ON "public"."factory_connections" FOR SELECT TO "authenticated" USING ((("factory_id" = "auth"."uid"()) OR ("seller_id" = "auth"."uid"())));



ALTER TABLE "public"."factory_ratings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."freelancer_portfolio" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."freelancer_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."idempotency_keys" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "idempotency_keys_user_own" ON "public"."idempotency_keys" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "listings_public_read" ON "public"."service_listings" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."location_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."middle_man_deals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."middle_men" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "middle_men_create_own_deals" ON "public"."middle_man_deals" FOR INSERT TO "authenticated" WITH CHECK (("middle_man_id" = "auth"."uid"()));



CREATE POLICY "middle_men_view_own" ON "public"."middle_men" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "middle_men_view_own_commissions" ON "public"."commissions" FOR SELECT TO "authenticated" USING (("middle_man_id" = "auth"."uid"()));



CREATE POLICY "middle_men_view_own_deals" ON "public"."middle_man_deals" FOR SELECT TO "authenticated" USING (("middle_man_id" = "auth"."uid"()));



CREATE POLICY "middle_men_view_own_orders" ON "public"."orders" FOR SELECT TO "authenticated" USING (("middle_man_id" = "auth"."uid"()));



ALTER TABLE "public"."middleman_profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "middlemen_create_own_deals" ON "public"."middle_man_deals" FOR INSERT TO "authenticated" WITH CHECK (("middle_man_id" = "auth"."uid"()));



CREATE POLICY "middlemen_update_own_deals" ON "public"."middle_man_deals" FOR UPDATE TO "authenticated" USING (("middle_man_id" = "auth"."uid"())) WITH CHECK (("middle_man_id" = "auth"."uid"()));



CREATE POLICY "middlemen_view_all_active_products" ON "public"."products" FOR SELECT TO "authenticated" USING ((("status" = 'active'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."user_id" = "auth"."uid"()) AND ("users"."account_type" = 'middleman'::"text"))))));



CREATE POLICY "middlemen_view_own_commissions" ON "public"."commissions" FOR SELECT TO "authenticated" USING (("middle_man_id" = "auth"."uid"()));



CREATE POLICY "middlemen_view_own_deals" ON "public"."middle_man_deals" FOR SELECT TO "authenticated" USING (("middle_man_id" = "auth"."uid"()));



CREATE POLICY "middlemen_view_own_orders" ON "public"."orders" FOR SELECT TO "authenticated" USING (("middle_man_id" = "auth"."uid"()));



ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "providers_manage_listings" ON "public"."service_listings" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."service_providers" "sp"
  WHERE (("sp"."id" = "service_listings"."provider_id") AND ("sp"."user_id" = "auth"."uid"())))));



CREATE POLICY "providers_update_bookings" ON "public"."service_bookings" FOR UPDATE USING (("auth"."uid"() = "provider_id"));



CREATE POLICY "providers_update_own" ON "public"."service_providers" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "providers_view_own_bookings" ON "public"."service_bookings" FOR SELECT USING (("auth"."uid"() = "provider_id"));



CREATE POLICY "providers_view_related_bookings" ON "public"."service_bookings" FOR SELECT USING (("auth"."uid"() = ( SELECT "service_providers"."user_id"
   FROM "public"."service_providers"
  WHERE ("service_providers"."id" = "service_bookings"."provider_id"))));



CREATE POLICY "public_view_active_products" ON "public"."products" FOR SELECT TO "anon" USING (("status" = 'active'::"text"));



CREATE POLICY "public_view_listings" ON "public"."service_listings" FOR SELECT USING (("is_active" = true));



CREATE POLICY "public_view_middleman_profiles" ON "public"."middleman_profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "public_view_providers" ON "public"."service_providers" FOR SELECT USING ((("status" = 'active'::"text") OR ("auth"."uid"() = "user_id")));



ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."seller_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sellers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sellers_create_factory_connections" ON "public"."factory_connections" FOR INSERT TO "authenticated" WITH CHECK (("seller_id" = "auth"."uid"()));



CREATE POLICY "sellers_create_factory_ratings" ON "public"."factory_ratings" FOR INSERT TO "authenticated" WITH CHECK (("seller_id" = "auth"."uid"()));



CREATE POLICY "sellers_manage_own_products" ON "public"."products" TO "authenticated" USING (("seller_id" = "auth"."uid"())) WITH CHECK (("seller_id" = "auth"."uid"()));



CREATE POLICY "sellers_view_own_customers" ON "public"."customers" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "sellers_view_own_factory_connections" ON "public"."factory_connections" FOR SELECT TO "authenticated" USING ((("seller_id" = "auth"."uid"()) OR ("factory_id" = "auth"."uid"())));



CREATE POLICY "sellers_view_own_orders" ON "public"."orders" FOR SELECT TO "authenticated" USING (("seller_id" = "auth"."uid"()));



ALTER TABLE "public"."service_bookings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."service_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."service_gigs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."service_listings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."service_orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."service_providers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."service_reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."service_subcategories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."services_conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."services_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shipping_addresses" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "svc_cat_public_read" ON "public"."svc_categories" FOR SELECT TO "authenticated", "anon" USING (("is_active" = true));



ALTER TABLE "public"."svc_categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "svc_clients_create_conversations" ON "public"."services_conversations" FOR INSERT WITH CHECK (("auth"."uid"() = "client_id"));



CREATE POLICY "svc_list_owner_write" ON "public"."svc_listings" TO "authenticated" USING (("provider_id" = ( SELECT "svc_providers"."id"
   FROM "public"."svc_providers"
  WHERE ("svc_providers"."user_id" = "auth"."uid"()))));



CREATE POLICY "svc_list_public_read" ON "public"."svc_listings" FOR SELECT TO "authenticated", "anon" USING (("status" = 'active'::"text"));



ALTER TABLE "public"."svc_listings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "svc_ord_create" ON "public"."svc_orders" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "svc_ord_provider_update" ON "public"."svc_orders" FOR UPDATE TO "authenticated" USING (("provider_id" = ( SELECT "svc_providers"."id"
   FROM "public"."svc_providers"
  WHERE ("svc_providers"."user_id" = "auth"."uid"()))));



CREATE POLICY "svc_ord_view_own" ON "public"."svc_orders" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR ("provider_id" = ( SELECT "svc_providers"."id"
   FROM "public"."svc_providers"
  WHERE ("svc_providers"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."svc_orders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "svc_port_owner_write" ON "public"."svc_portfolio" TO "authenticated" USING (("provider_id" = ( SELECT "svc_providers"."id"
   FROM "public"."svc_providers"
  WHERE ("svc_providers"."user_id" = "auth"."uid"()))));



CREATE POLICY "svc_port_public_read" ON "public"."svc_portfolio" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."svc_portfolio" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "svc_prov_owner_write" ON "public"."svc_providers" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "svc_prov_public_read" ON "public"."svc_providers" FOR SELECT TO "authenticated", "anon" USING (("status" = 'active'::"text"));



ALTER TABLE "public"."svc_providers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "svc_rev_create" ON "public"."svc_reviews" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."svc_orders"
  WHERE (("svc_orders"."id" = "svc_reviews"."order_id") AND ("svc_orders"."status" = 'completed'::"text") AND ("svc_orders"."user_id" = "auth"."uid"()))))));



CREATE POLICY "svc_rev_public_read" ON "public"."svc_reviews" FOR SELECT TO "authenticated", "anon" USING (("is_visible" = true));



ALTER TABLE "public"."svc_reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."svc_subcategories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "svc_users_send_messages" ON "public"."services_messages" FOR INSERT WITH CHECK ((("sender_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."services_conversations" "c"
  WHERE (("c"."id" = "services_messages"."conversation_id") AND (("c"."provider_id" = "auth"."uid"()) OR ("c"."client_id" = "auth"."uid"())))))));



CREATE POLICY "svc_users_update_own_conversations" ON "public"."services_conversations" FOR UPDATE USING ((("auth"."uid"() = "provider_id") OR ("auth"."uid"() = "client_id")));



CREATE POLICY "svc_users_update_own_messages" ON "public"."services_messages" FOR UPDATE USING ((("sender_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."services_conversations" "c"
  WHERE (("c"."id" = "services_messages"."conversation_id") AND (("c"."provider_id" = "auth"."uid"()) OR ("c"."client_id" = "auth"."uid"())))))));



CREATE POLICY "svc_users_view_messages" ON "public"."services_messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."services_conversations" "c"
  WHERE (("c"."id" = "services_messages"."conversation_id") AND (("c"."provider_id" = "auth"."uid"()) OR ("c"."client_id" = "auth"."uid"()))))));



CREATE POLICY "svc_users_view_own_conversations" ON "public"."services_conversations" FOR SELECT USING ((("auth"."uid"() = "provider_id") OR ("auth"."uid"() = "client_id")));



ALTER TABLE "public"."trading_conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trading_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_create_own_reviews" ON "public"."reviews" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "users_create_trading_conversations" ON "public"."trading_conversations" FOR INSERT WITH CHECK (("auth"."uid"() = "initiator_id"));



CREATE POLICY "users_delete_own_reviews" ON "public"."reviews" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "users_insert_own_activity_logs" ON "public"."activity_logs" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "users_insert_own_error_logs" ON "public"."error_logs" FOR INSERT TO "authenticated" WITH CHECK ((("user_id" = "auth"."uid"()) OR ("user_id" IS NULL)));



CREATE POLICY "users_insert_own_events" ON "public"."user_events" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "users_insert_own_location_history" ON "public"."location_history" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "users_insert_own_profile" ON "public"."seller_profiles" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "users_insert_own_provider" ON "public"."service_providers" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "users_insert_own_svc_provider" ON "public"."svc_providers" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "users_manage_own_activity_logs" ON "public"."activity_logs" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "users_manage_own_addresses" ON "public"."shipping_addresses" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "users_manage_own_cart" ON "public"."cart" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "users_manage_own_customer" ON "public"."customers" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "users_manage_own_error_logs" ON "public"."error_logs" TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR ("user_id" IS NULL))) WITH CHECK ((("user_id" = "auth"."uid"()) OR ("user_id" IS NULL)));



CREATE POLICY "users_manage_own_location_history" ON "public"."location_history" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "users_manage_own_middleman_profile" ON "public"."middleman_profiles" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "users_manage_own_notifications" ON "public"."notifications" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "users_manage_own_orders" ON "public"."orders" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "users_manage_own_seller" ON "public"."sellers" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "users_manage_own_wishlist" ON "public"."wishlist" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "users_send_trading_messages" ON "public"."trading_messages" FOR INSERT WITH CHECK ((("sender_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."trading_conversations" "c"
  WHERE (("c"."id" = "trading_messages"."conversation_id") AND (("c"."initiator_id" = "auth"."uid"()) OR ("c"."receiver_id" = "auth"."uid"())))))));



CREATE POLICY "users_update_own_profile" ON "public"."seller_profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "users_update_own_provider" ON "public"."service_providers" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "users_update_own_reviews" ON "public"."reviews" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "users_update_own_svc_provider" ON "public"."svc_providers" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "users_update_own_trading_conversations" ON "public"."trading_conversations" FOR UPDATE USING ((("auth"."uid"() = "initiator_id") OR ("auth"."uid"() = "receiver_id")));



CREATE POLICY "users_view_own_activity_logs" ON "public"."activity_logs" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "users_view_own_bookings" ON "public"."service_bookings" FOR SELECT USING ((("auth"."uid"() = "customer_id") OR ("auth"."uid"() = "provider_id")));



CREATE POLICY "users_view_own_error_logs" ON "public"."error_logs" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR ("user_id" IS NULL)));



CREATE POLICY "users_view_own_location_history" ON "public"."location_history" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "users_view_own_profile" ON "public"."seller_profiles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "users_view_own_seller" ON "public"."sellers" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "users_view_own_svc_provider" ON "public"."svc_providers" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("status" = 'active'::"text")));



CREATE POLICY "users_view_own_trading_conversations" ON "public"."trading_conversations" FOR SELECT USING ((("auth"."uid"() = "initiator_id") OR ("auth"."uid"() = "receiver_id")));



CREATE POLICY "users_view_trading_messages" ON "public"."trading_messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."trading_conversations" "c"
  WHERE (("c"."id" = "trading_messages"."conversation_id") AND (("c"."initiator_id" = "auth"."uid"()) OR ("c"."receiver_id" = "auth"."uid"()))))));



CREATE POLICY "view_order_items" ON "public"."order_items" FOR SELECT TO "authenticated" USING (("order_id" IN ( SELECT "orders"."id"
   FROM "public"."orders"
  WHERE (("orders"."user_id" = "auth"."uid"()) OR ("orders"."seller_id" = "auth"."uid"())))));



ALTER TABLE "public"."wishlist" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."factories";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."notifications";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."products";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";











































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































GRANT ALL ON FUNCTION "public"."add_seller_to_conversation"() TO "anon";
GRANT ALL ON FUNCTION "public"."add_seller_to_conversation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_seller_to_conversation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."assign_delivery_to_driver"("p_order_id" "uuid", "p_seller_latitude" numeric, "p_seller_longitude" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."assign_delivery_to_driver"("p_order_id" "uuid", "p_seller_latitude" numeric, "p_seller_longitude" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."assign_delivery_to_driver"("p_order_id" "uuid", "p_seller_latitude" numeric, "p_seller_longitude" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_distance"("lat1" numeric, "lon1" numeric, "lat2" numeric, "lon2" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_distance"("lat1" numeric, "lon1" numeric, "lat2" numeric, "lon2" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_distance"("lat1" numeric, "lon1" numeric, "lat2" numeric, "lon2" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_middle_man_commission"() TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_middle_man_commission"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_middle_man_commission"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_middle_man_margin"("p_product_asin" "text", "p_commission_rate" numeric, "p_margin_amount" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_middle_man_margin"("p_product_asin" "text", "p_commission_rate" numeric, "p_margin_amount" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_middle_man_margin"("p_product_asin" "text", "p_commission_rate" numeric, "p_margin_amount" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_order_commission"() TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_order_commission"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_order_commission"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_seller_analytics"("p_seller_id" "uuid", "p_period_type" "text", "p_start_date" "date", "p_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_seller_analytics"("p_seller_id" "uuid", "p_period_type" "text", "p_start_date" "date", "p_end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_start_conversation"("from_user_id" "uuid", "to_user_id" "uuid", "product_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_start_conversation"("from_user_id" "uuid", "to_user_id" "uuid", "product_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_start_conversation"("from_user_id" "uuid", "to_user_id" "uuid", "product_id" "uuid", "conversation_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."can_start_conversation"("from_user_id" "uuid", "to_user_id" "uuid", "product_id" "uuid", "conversation_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_start_conversation"("from_user_id" "uuid", "to_user_id" "uuid", "product_id" "uuid", "conversation_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_idempotency_keys"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_idempotency_keys"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_idempotency_keys"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_product_images"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_product_images"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_product_images"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_analytics_snapshot"("p_seller_id" "uuid", "p_period_type" "text", "p_start_date" "date", "p_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_analytics_snapshot"("p_seller_id" "uuid", "p_period_type" "text", "p_start_date" "date", "p_end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_middle_man_deal"("p_middle_man_id" "uuid", "p_product_asin" "text", "p_commission_rate" numeric, "p_margin_amount" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."create_middle_man_deal"("p_middle_man_id" "uuid", "p_product_asin" "text", "p_commission_rate" numeric, "p_margin_amount" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_middle_man_deal"("p_middle_man_id" "uuid", "p_product_asin" "text", "p_commission_rate" numeric, "p_margin_amount" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_or_update_middle_man_deal"("p_product_asin" "text", "p_commission_rate" numeric, "p_margin_amount" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."create_or_update_middle_man_deal"("p_product_asin" "text", "p_commission_rate" numeric, "p_margin_amount" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_or_update_middle_man_deal"("p_product_asin" "text", "p_commission_rate" numeric, "p_margin_amount" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_order_notification"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_order_notification"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_order_notification"() TO "service_role";



GRANT ALL ON FUNCTION "public"."decrement_product_inventory"() TO "anon";
GRANT ALL ON FUNCTION "public"."decrement_product_inventory"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrement_product_inventory"() TO "service_role";



GRANT ALL ON FUNCTION "public"."dequeue_job"("p_queue_name" "text", "p_visibility_timeout_seconds" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."dequeue_job"("p_queue_name" "text", "p_visibility_timeout_seconds" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."dequeue_job"("p_queue_name" "text", "p_visibility_timeout_seconds" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."enqueue_job"("p_queue_name" "text", "p_payload" "jsonb", "p_scheduled_for" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."enqueue_job"("p_queue_name" "text", "p_payload" "jsonb", "p_scheduled_for" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."enqueue_job"("p_queue_name" "text", "p_payload" "jsonb", "p_scheduled_for" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."find_nearby_drivers"("p_latitude" numeric, "p_longitude" numeric, "p_max_distance_km" numeric, "p_limit_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."find_nearby_drivers"("p_latitude" numeric, "p_longitude" numeric, "p_max_distance_km" numeric, "p_limit_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."find_nearby_drivers"("p_latitude" numeric, "p_longitude" numeric, "p_max_distance_km" numeric, "p_limit_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."find_nearby_drivers_for_middleman"("p_latitude" numeric, "p_longitude" numeric, "p_max_distance_km" numeric, "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."find_nearby_drivers_for_middleman"("p_latitude" numeric, "p_longitude" numeric, "p_max_distance_km" numeric, "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."find_nearby_drivers_for_middleman"("p_latitude" numeric, "p_longitude" numeric, "p_max_distance_km" numeric, "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."find_nearby_factories"("p_seller_id" "uuid", "p_max_distance_km" numeric, "p_limit_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."find_nearby_factories"("p_seller_id" "uuid", "p_max_distance_km" numeric, "p_limit_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."find_nearby_factories"("p_seller_id" "uuid", "p_max_distance_km" numeric, "p_limit_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."find_nearby_factories"("p_seller_id" "uuid", "p_latitude" numeric, "p_longitude" numeric, "p_max_distance_km" numeric, "p_limit_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."find_nearby_factories"("p_seller_id" "uuid", "p_latitude" numeric, "p_longitude" numeric, "p_max_distance_km" numeric, "p_limit_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."find_nearby_factories"("p_seller_id" "uuid", "p_latitude" numeric, "p_longitude" numeric, "p_max_distance_km" numeric, "p_limit_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."find_nearby_products_for_middleman"("p_latitude" numeric, "p_longitude" numeric, "p_max_distance_km" numeric, "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."find_nearby_products_for_middleman"("p_latitude" numeric, "p_longitude" numeric, "p_max_distance_km" numeric, "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."find_nearby_products_for_middleman"("p_latitude" numeric, "p_longitude" numeric, "p_max_distance_km" numeric, "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_product_description"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_product_description"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_product_description"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_factory_rating"("p_factory_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_factory_rating"("p_factory_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_low_stock_products"("threshold" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_low_stock_products"("threshold" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_middle_man_ids"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_middle_man_ids"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_middle_man_ids"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_or_create_service_conversation"("p_provider_id" "uuid", "p_listing_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_or_create_service_conversation"("p_provider_id" "uuid", "p_listing_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_or_create_service_conversation"("p_provider_id" "uuid", "p_listing_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_product_image_url"("image_path" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_product_image_url"("image_path" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_product_image_url"("image_path" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_provider_revenue"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_provider_revenue"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_provider_revenue"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_provider_revenue"("p_provider_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_provider_revenue"("p_provider_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_provider_revenue"("p_provider_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_seller_kpis"("p_seller_id" "uuid", "p_period" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_seller_kpis"("p_seller_id" "uuid", "p_period" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_seller_product_count"("seller_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_seller_product_count"("seller_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_seller_sales_count"("p_seller_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_seller_sales_count"("p_seller_id" "uuid", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_seller_total_customers"("p_seller_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_seller_total_customers"("p_seller_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_seller_total_revenue"("p_seller_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_seller_total_revenue"("p_seller_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_conversations"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_conversations"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_conversations"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_conversations_with_products"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_conversations_with_products"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_conversations_with_products"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_service_booking_notifications"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_service_booking_notifications"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_service_booking_notifications"() TO "service_role";



GRANT ALL ON FUNCTION "public"."haversine_distance"("lat1" double precision, "lon1" double precision, "lat2" double precision, "lon2" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."haversine_distance"("lat1" double precision, "lon1" double precision, "lat2" double precision, "lon2" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."haversine_distance"("lat1" double precision, "lon1" double precision, "lat2" double precision, "lon2" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."log_activity"("p_action_type" "text", "p_action_category" "text", "p_description" "text", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."log_activity"("p_action_type" "text", "p_action_category" "text", "p_description" "text", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_activity"("p_action_type" "text", "p_action_category" "text", "p_description" "text", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_error"("p_error_type" "text", "p_error_message" "text", "p_stack_trace" "text", "p_screen_name" "text", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."log_error"("p_error_type" "text", "p_error_message" "text", "p_stack_trace" "text", "p_screen_name" "text", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_error"("p_error_type" "text", "p_error_message" "text", "p_stack_trace" "text", "p_screen_name" "text", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."messages_tsvector_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."messages_tsvector_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."messages_tsvector_trigger"() TO "service_role";



GRANT ALL ON FUNCTION "public"."products_search_vector_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."products_search_vector_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."products_search_vector_trigger"() TO "service_role";



GRANT ALL ON FUNCTION "public"."products_tsvector_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."products_tsvector_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."products_tsvector_trigger"() TO "service_role";



GRANT ALL ON FUNCTION "public"."track_deal_click"("p_unique_slug" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."track_deal_click"("p_unique_slug" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."track_deal_click"("p_unique_slug" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_conversation_on_deal_proposal"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_conversation_on_deal_proposal"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_conversation_on_deal_proposal"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_customer_stats_on_sale"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_customer_stats_on_sale"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_customer_stats_on_sale"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_customers_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_customers_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_customers_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_factory_connections_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_factory_connections_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_factory_connections_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_freelancer_rating"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_freelancer_rating"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_freelancer_rating"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_freelancer_stats_on_completion"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_freelancer_stats_on_completion"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_freelancer_stats_on_completion"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_order_status_timestamps"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_order_status_timestamps"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_order_status_timestamps"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_products_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_products_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_products_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_sales_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_sales_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_sales_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_svc_conv_on_message"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_svc_conv_on_message"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_svc_conv_on_message"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_svc_provider_rating"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_svc_provider_rating"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_svc_provider_rating"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_svc_provider_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_svc_provider_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_svc_provider_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_svc_timestamps"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_svc_timestamps"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_svc_timestamps"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_trading_conv_on_message"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_trading_conv_on_message"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_trading_conv_on_message"() TO "service_role";





























































































GRANT ALL ON TABLE "public"."activity_logs" TO "anon";
GRANT ALL ON TABLE "public"."activity_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_logs" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."admin_users" TO "anon";
GRANT ALL ON TABLE "public"."admin_users" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_users" TO "service_role";



GRANT ALL ON TABLE "public"."analytics" TO "anon";
GRANT ALL ON TABLE "public"."analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."analytics_snapshots" TO "anon";
GRANT ALL ON TABLE "public"."analytics_snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics_snapshots" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."async_jobs" TO "anon";
GRANT ALL ON TABLE "public"."async_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."async_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."brands" TO "anon";
GRANT ALL ON TABLE "public"."brands" TO "authenticated";
GRANT ALL ON TABLE "public"."brands" TO "service_role";



GRANT ALL ON TABLE "public"."business_profiles" TO "anon";
GRANT ALL ON TABLE "public"."business_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."business_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."cart" TO "anon";
GRANT ALL ON TABLE "public"."cart" TO "authenticated";
GRANT ALL ON TABLE "public"."cart" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."categories_backup_20260308_124506" TO "anon";
GRANT ALL ON TABLE "public"."categories_backup_20260308_124506" TO "authenticated";
GRANT ALL ON TABLE "public"."categories_backup_20260308_124506" TO "service_role";



GRANT ALL ON TABLE "public"."commissions" TO "anon";
GRANT ALL ON TABLE "public"."commissions" TO "authenticated";
GRANT ALL ON TABLE "public"."commissions" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



GRANT ALL ON TABLE "public"."deals" TO "anon";
GRANT ALL ON TABLE "public"."deals" TO "authenticated";
GRANT ALL ON TABLE "public"."deals" TO "service_role";



GRANT ALL ON TABLE "public"."deals_v2" TO "anon";
GRANT ALL ON TABLE "public"."deals_v2" TO "authenticated";
GRANT ALL ON TABLE "public"."deals_v2" TO "service_role";



GRANT ALL ON TABLE "public"."delivery_assignments" TO "anon";
GRANT ALL ON TABLE "public"."delivery_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."delivery_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."delivery_profiles" TO "anon";
GRANT ALL ON TABLE "public"."delivery_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."delivery_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."error_logs" TO "anon";
GRANT ALL ON TABLE "public"."error_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."error_logs" TO "service_role";



GRANT ALL ON TABLE "public"."factories" TO "anon";
GRANT ALL ON TABLE "public"."factories" TO "authenticated";
GRANT ALL ON TABLE "public"."factories" TO "service_role";



GRANT ALL ON TABLE "public"."factory_connections" TO "anon";
GRANT ALL ON TABLE "public"."factory_connections" TO "authenticated";
GRANT ALL ON TABLE "public"."factory_connections" TO "service_role";



GRANT ALL ON TABLE "public"."factory_production_logs" TO "anon";
GRANT ALL ON TABLE "public"."factory_production_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."factory_production_logs" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."sellers" TO "anon";
GRANT ALL ON TABLE "public"."sellers" TO "authenticated";
GRANT ALL ON TABLE "public"."sellers" TO "service_role";



GRANT ALL ON TABLE "public"."factory_products" TO "anon";
GRANT ALL ON TABLE "public"."factory_products" TO "authenticated";
GRANT ALL ON TABLE "public"."factory_products" TO "service_role";



GRANT ALL ON TABLE "public"."factory_ratings" TO "anon";
GRANT ALL ON TABLE "public"."factory_ratings" TO "authenticated";
GRANT ALL ON TABLE "public"."factory_ratings" TO "service_role";



GRANT ALL ON TABLE "public"."freelancer_portfolio" TO "anon";
GRANT ALL ON TABLE "public"."freelancer_portfolio" TO "authenticated";
GRANT ALL ON TABLE "public"."freelancer_portfolio" TO "service_role";



GRANT ALL ON TABLE "public"."freelancer_profiles" TO "anon";
GRANT ALL ON TABLE "public"."freelancer_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."freelancer_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."idempotency_keys" TO "anon";
GRANT ALL ON TABLE "public"."idempotency_keys" TO "authenticated";
GRANT ALL ON TABLE "public"."idempotency_keys" TO "service_role";



GRANT ALL ON TABLE "public"."location_history" TO "anon";
GRANT ALL ON TABLE "public"."location_history" TO "authenticated";
GRANT ALL ON TABLE "public"."location_history" TO "service_role";



GRANT ALL ON TABLE "public"."middle_man_deals" TO "anon";
GRANT ALL ON TABLE "public"."middle_man_deals" TO "authenticated";
GRANT ALL ON TABLE "public"."middle_man_deals" TO "service_role";



GRANT ALL ON TABLE "public"."middle_men" TO "anon";
GRANT ALL ON TABLE "public"."middle_men" TO "authenticated";
GRANT ALL ON TABLE "public"."middle_men" TO "service_role";



GRANT ALL ON TABLE "public"."middleman_profiles" TO "anon";
GRANT ALL ON TABLE "public"."middleman_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."middleman_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."order_items" TO "anon";
GRANT ALL ON TABLE "public"."order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_items" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."payment_intentions" TO "anon";
GRANT ALL ON TABLE "public"."payment_intentions" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_intentions" TO "service_role";



GRANT ALL ON TABLE "public"."push_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."push_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."push_subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."reviews" TO "anon";
GRANT ALL ON TABLE "public"."reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews" TO "service_role";



GRANT ALL ON TABLE "public"."sales" TO "anon";
GRANT ALL ON TABLE "public"."sales" TO "authenticated";
GRANT ALL ON TABLE "public"."sales" TO "service_role";



GRANT ALL ON TABLE "public"."seller_profiles" TO "anon";
GRANT ALL ON TABLE "public"."seller_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."seller_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."sellers_backup" TO "anon";
GRANT ALL ON TABLE "public"."sellers_backup" TO "authenticated";
GRANT ALL ON TABLE "public"."sellers_backup" TO "service_role";



GRANT ALL ON TABLE "public"."service_bookings" TO "anon";
GRANT ALL ON TABLE "public"."service_bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."service_bookings" TO "service_role";



GRANT ALL ON TABLE "public"."service_categories" TO "anon";
GRANT ALL ON TABLE "public"."service_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."service_categories" TO "service_role";



GRANT ALL ON TABLE "public"."service_gigs" TO "anon";
GRANT ALL ON TABLE "public"."service_gigs" TO "authenticated";
GRANT ALL ON TABLE "public"."service_gigs" TO "service_role";



GRANT ALL ON TABLE "public"."service_listings" TO "anon";
GRANT ALL ON TABLE "public"."service_listings" TO "authenticated";
GRANT ALL ON TABLE "public"."service_listings" TO "service_role";



GRANT ALL ON TABLE "public"."service_orders" TO "anon";
GRANT ALL ON TABLE "public"."service_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."service_orders" TO "service_role";



GRANT ALL ON TABLE "public"."service_providers" TO "anon";
GRANT ALL ON TABLE "public"."service_providers" TO "authenticated";
GRANT ALL ON TABLE "public"."service_providers" TO "service_role";



GRANT ALL ON TABLE "public"."service_reviews" TO "anon";
GRANT ALL ON TABLE "public"."service_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."service_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."service_subcategories" TO "anon";
GRANT ALL ON TABLE "public"."service_subcategories" TO "authenticated";
GRANT ALL ON TABLE "public"."service_subcategories" TO "service_role";



GRANT ALL ON TABLE "public"."services_conversations" TO "anon";
GRANT ALL ON TABLE "public"."services_conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."services_conversations" TO "service_role";



GRANT ALL ON TABLE "public"."services_messages" TO "anon";
GRANT ALL ON TABLE "public"."services_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."services_messages" TO "service_role";



GRANT ALL ON TABLE "public"."shipping_addresses" TO "anon";
GRANT ALL ON TABLE "public"."shipping_addresses" TO "authenticated";
GRANT ALL ON TABLE "public"."shipping_addresses" TO "service_role";



GRANT ALL ON TABLE "public"."subcategories" TO "anon";
GRANT ALL ON TABLE "public"."subcategories" TO "authenticated";
GRANT ALL ON TABLE "public"."subcategories" TO "service_role";



GRANT ALL ON TABLE "public"."svc_categories" TO "anon";
GRANT ALL ON TABLE "public"."svc_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."svc_categories" TO "service_role";



GRANT ALL ON TABLE "public"."svc_listings" TO "anon";
GRANT ALL ON TABLE "public"."svc_listings" TO "authenticated";
GRANT ALL ON TABLE "public"."svc_listings" TO "service_role";



GRANT ALL ON TABLE "public"."svc_orders" TO "anon";
GRANT ALL ON TABLE "public"."svc_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."svc_orders" TO "service_role";



GRANT ALL ON TABLE "public"."svc_portfolio" TO "anon";
GRANT ALL ON TABLE "public"."svc_portfolio" TO "authenticated";
GRANT ALL ON TABLE "public"."svc_portfolio" TO "service_role";



GRANT ALL ON TABLE "public"."svc_providers" TO "anon";
GRANT ALL ON TABLE "public"."svc_providers" TO "authenticated";
GRANT ALL ON TABLE "public"."svc_providers" TO "service_role";



GRANT ALL ON TABLE "public"."svc_reviews" TO "anon";
GRANT ALL ON TABLE "public"."svc_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."svc_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."svc_subcategories" TO "anon";
GRANT ALL ON TABLE "public"."svc_subcategories" TO "authenticated";
GRANT ALL ON TABLE "public"."svc_subcategories" TO "service_role";



GRANT ALL ON TABLE "public"."trading_conversations" TO "anon";
GRANT ALL ON TABLE "public"."trading_conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."trading_conversations" TO "service_role";



GRANT ALL ON TABLE "public"."trading_messages" TO "anon";
GRANT ALL ON TABLE "public"."trading_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."trading_messages" TO "service_role";



GRANT ALL ON TABLE "public"."user_events" TO "anon";
GRANT ALL ON TABLE "public"."user_events" TO "authenticated";
GRANT ALL ON TABLE "public"."user_events" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."wishlist" TO "anon";
GRANT ALL ON TABLE "public"."wishlist" TO "authenticated";
GRANT ALL ON TABLE "public"."wishlist" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































