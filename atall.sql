


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


CREATE OR REPLACE FUNCTION "public"."archive_patient_data"("p_doctor_id" "uuid", "p_patient_id" "uuid", "p_archive_type" "text" DEFAULT 'full'::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_archive_id UUID;
    v_archive_data JSONB;
    v_data_hash TEXT;
BEGIN
    -- Generate archive JSON
    v_archive_data := public.generate_patient_archive_json(p_doctor_id, p_patient_id);
    
    -- Generate hash for change detection
    v_data_hash := md5(v_archive_data::text);
    
    -- Insert archive
    INSERT INTO public.health_patient_archives (
        doctor_id,
        patient_id,
        archive_data,
        data_version,
        archive_type,
        data_hash,
        backup_date,
        is_synced,
        created_at
    ) VALUES (
        p_doctor_id,
        p_patient_id,
        v_archive_data,
        1,
        p_archive_type,
        v_data_hash,
        CURRENT_DATE,
        FALSE,
        NOW()
    )
    ON CONFLICT (doctor_id, patient_id, backup_date) 
    DO UPDATE SET
        archive_data = EXCLUDED.archive_data,
        data_version = health_patient_archives.data_version + 1,
        data_hash = EXCLUDED.data_hash,
        updated_at = NOW()
    RETURNING id INTO v_archive_id;
    
    RETURN v_archive_id;
END;
$$;


ALTER FUNCTION "public"."archive_patient_data"("p_doctor_id" "uuid", "p_patient_id" "uuid", "p_archive_type" "text") OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."bulk_upload_medicines"("p_pharmacy_id" "uuid", "p_medicines" "jsonb") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_medicine JSONB;
    v_count INTEGER := 0;
BEGIN
    FOR v_medicine IN SELECT * FROM jsonb_array_elements(p_medicines)
    LOOP
        INSERT INTO public.health_medicines (
            pharmacy_id,
            name,
            generic_name,
            brand,
            manufacturer,
            category,
            subcategory,
            description,
            dosage_form,
            strength,
            unit,
            price,
            currency,
            quantity_in_stock,
            requires_prescription,
            prescription_category,
            active_ingredients,
            side_effects,
            warnings,
            storage_instructions,
            barcode,
            sku,
            images,
            is_available
        ) VALUES (
            p_pharmacy_id,
            v_medicine->>'name',
            v_medicine->>'generic_name',
            v_medicine->>'brand',
            v_medicine->>'manufacturer',
            v_medicine->>'category',
            v_medicine->>'subcategory',
            v_medicine->>'description',
            v_medicine->>'dosage_form',
            v_medicine->>'strength',
            COALESCE(v_medicine->>'unit', 'piece'),
            (v_medicine->>'price')::NUMERIC,
            COALESCE(v_medicine->>'currency', 'EGP'),
            COALESCE((v_medicine->>'quantity_in_stock')::INTEGER, 0),
            COALESCE((v_medicine->>'requires_prescription')::BOOLEAN, FALSE),
            COALESCE(v_medicine->>'prescription_category', 'over_counter'),
            COALESCE(v_medicine->'active_ingredients', '[]'::jsonb),
            v_medicine->>'side_effects',
            v_medicine->>'warnings',
            v_medicine->>'storage_instructions',
            v_medicine->>'barcode',
            v_medicine->>'sku',
            COALESCE(v_medicine->'images', '[]'::jsonb),
            COALESCE((v_medicine->>'is_available')::BOOLEAN, TRUE)
        )
        ON CONFLICT DO NOTHING;
        v_count := v_count + 1;
    END LOOP;
    RETURN v_count;
END;
$$;


ALTER FUNCTION "public"."bulk_upload_medicines"("p_pharmacy_id" "uuid", "p_medicines" "jsonb") OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."check_product_chat_permission"("p_user_id" "uuid", "p_product_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_allow_chat boolean;
  v_seller_id uuid;
  v_user_type text;
BEGIN
  -- Get product chat permission
  SELECT allow_chat, seller_id INTO v_allow_chat, v_seller_id
  FROM products
  WHERE id = p_product_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Get user account type
  SELECT account_type INTO v_user_type
  FROM users
  WHERE user_id = p_user_id;
  
  -- Customer/user must check product permission
  IF v_user_type IN ('user', 'customer') THEN
    RETURN v_allow_chat;
  END IF;
  
  -- Seller, factory, middleman always allowed
  RETURN true;
END;
$$;


ALTER FUNCTION "public"."check_product_chat_permission"("p_user_id" "uuid", "p_product_id" "uuid") OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."create_direct_conversation"("p_target_user_id" "uuid", "p_context" "text" DEFAULT 'general'::"text", "p_product_id" "uuid" DEFAULT NULL::"uuid", "p_appointment_id" "uuid" DEFAULT NULL::"uuid", "p_listing_id" "uuid" DEFAULT NULL::"uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_conversation_id uuid;
  v_initiator_role text;
  v_receiver_role text;
BEGIN
  -- Get roles from users table
  SELECT account_type INTO v_initiator_role FROM public.users WHERE user_id = auth.uid();
  SELECT account_type INTO v_receiver_role FROM public.users WHERE user_id = p_target_user_id;
  
  v_initiator_role := COALESCE(v_initiator_role, 'user'::text);
  v_receiver_role := COALESCE(v_receiver_role, 'user'::text);

  -- Check based on context
  IF p_context = 'trading' THEN
    -- Check if trading_conversations table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trading_conversations') THEN
      SELECT id INTO v_conversation_id
      FROM public.trading_conversations
      WHERE (initiator_id = auth.uid() AND receiver_id = p_target_user_id)
         OR (initiator_id = p_target_user_id AND receiver_id = auth.uid())
      AND is_archived = false
      LIMIT 1;

      IF v_conversation_id IS NULL THEN
        INSERT INTO public.trading_conversations (
          initiator_id, receiver_id, initiator_role, receiver_role,
          product_id, conversation_type
        ) VALUES (
          auth.uid(), p_target_user_id, v_initiator_role, v_receiver_role,
          p_product_id, 'product_inquiry'
        )
        RETURNING id INTO v_conversation_id;
      END IF;
    END IF;

  ELSIF p_context = 'health' THEN
    -- Check if health_conversations table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'health_conversations') THEN
      SELECT id INTO v_conversation_id
      FROM public.health_conversations
      WHERE appointment_id = p_appointment_id
      LIMIT 1;

      IF v_conversation_id IS NULL THEN
        INSERT INTO public.health_conversations (appointment_id)
        VALUES (p_appointment_id)
        RETURNING id INTO v_conversation_id;
      END IF;
    END IF;

  ELSIF p_context = 'services' THEN
    -- Check if services_conversations table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'services_conversations') THEN
      SELECT id INTO v_conversation_id
      FROM public.services_conversations
      WHERE (provider_id = auth.uid() AND client_id = p_target_user_id)
         OR (provider_id = p_target_user_id AND client_id = auth.uid())
      AND listing_id = p_listing_id
      AND is_archived = false
      LIMIT 1;

      IF v_conversation_id IS NULL THEN
        INSERT INTO public.services_conversations (
          provider_id, client_id, listing_id
        ) VALUES (
          CASE WHEN v_initiator_role = 'service_provider' THEN auth.uid() ELSE p_target_user_id END,
          CASE WHEN v_initiator_role = 'service_provider' THEN p_target_user_id ELSE auth.uid() END,
          p_listing_id
        )
        RETURNING id INTO v_conversation_id;
      END IF;
    END IF;

  ELSE
    -- General conversations (always exists)
    SELECT c.id INTO v_conversation_id
    FROM public.conversations c
    JOIN public.conversation_participants cp1 ON c.id = cp1.conversation_id
    JOIN public.conversation_participants cp2 ON c.id = cp2.conversation_id
    WHERE cp1.user_id = auth.uid() 
      AND cp2.user_id = p_target_user_id
      AND c.is_archived = false
    LIMIT 1;

    IF v_conversation_id IS NULL THEN
      INSERT INTO public.conversations (product_id)
      VALUES (p_product_id)
      RETURNING id INTO v_conversation_id;

      INSERT INTO public.conversation_participants (conversation_id, user_id, role)
      VALUES (v_conversation_id, auth.uid(), v_initiator_role);

      INSERT INTO public.conversation_participants (conversation_id, user_id, role)
      VALUES (v_conversation_id, p_target_user_id, v_receiver_role);
    END IF;
  END IF;

  RETURN v_conversation_id;
END;
$$;


ALTER FUNCTION "public"."create_direct_conversation"("p_target_user_id" "uuid", "p_context" "text", "p_product_id" "uuid", "p_appointment_id" "uuid", "p_listing_id" "uuid") OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."find_factories"("p_search_term" "text" DEFAULT NULL::"text", "p_location" "text" DEFAULT NULL::"text", "p_is_verified" boolean DEFAULT NULL::boolean, "p_limit" integer DEFAULT 20, "p_offset" integer DEFAULT 0) RETURNS TABLE("user_id" "uuid", "email" "text", "full_name" "text", "phone" "text", "location" "text", "is_verified" boolean, "created_at" timestamp with time zone, "product_count" bigint, "total_revenue" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.user_id,
    s.email,
    s.full_name,
    s.phone,
    s.location,
    s.is_verified,
    s.created_at,
    COALESCE(pc.count, 0)::BIGINT as product_count,
    COALESCE(sr.total_revenue, 0)::NUMERIC as total_revenue
  FROM public.sellers s
  LEFT JOIN (
    SELECT seller_id, COUNT(*) as count 
    FROM public.products 
    WHERE is_deleted = false 
    GROUP BY seller_id
  ) pc ON pc.seller_id = s.user_id
  LEFT JOIN (
    SELECT seller_id, SUM(total_price) as total_revenue 
    FROM public.sales 
    GROUP BY seller_id
  ) sr ON sr.seller_id = s.user_id
  WHERE 
    (p_search_term IS NULL OR 
      s.full_name ILIKE '%' || p_search_term || '%' OR 
      s.email ILIKE '%' || p_search_term || '%' OR
      s.location ILIKE '%' || p_search_term || '%')
    AND (p_location IS NULL OR s.location ILIKE '%' || p_location || '%')
    AND (p_is_verified IS NULL OR s.is_verified = p_is_verified)
  ORDER BY s.is_verified DESC, product_count DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;


ALTER FUNCTION "public"."find_factories"("p_search_term" "text", "p_location" "text", "p_is_verified" boolean, "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."find_nearby_sellers"("p_latitude" numeric, "p_longitude" numeric, "p_radius_km" numeric DEFAULT 50, "p_limit" integer DEFAULT 20) RETURNS TABLE("user_id" "uuid", "email" "text", "full_name" "text", "phone" "text", "location" "text", "latitude" numeric, "longitude" numeric, "distance_km" numeric, "is_verified" boolean, "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  EARTH_RADIUS_KM CONSTANT NUMERIC := 6371;
  lat1_rad NUMERIC;
  lon1_rad NUMERIC;
BEGIN
  lat1_rad := p_latitude * PI() / 180;
  lon1_rad := p_longitude * PI() / 180;

  RETURN QUERY
  SELECT 
    s.user_id,
    s.email,
    s.full_name,
    s.phone,
    s.location,
    s.latitude,
    s.longitude,
    (
      EARTH_RADIUS_KM * 2 * ASIN(
        SQRT(
          POWER(SIN((lat1_rad - (s.latitude * PI() / 180)) / 2), 2) +
          COS(lat1_rad) * COS(s.latitude * PI() / 180) * 
          POWER(SIN((lon1_rad - (s.longitude * PI() / 180)) / 2), 2)
        )
      )
    )::NUMERIC(10, 2) AS distance_km,
    s.is_verified,
    s.created_at
  FROM public.sellers s
  WHERE 
    s.latitude IS NOT NULL 
    AND s.longitude IS NOT NULL
    AND s.latitude BETWEEN (p_latitude - (p_radius_km / 111)) 
                       AND (p_latitude + (p_radius_km / 111))
    AND s.longitude BETWEEN (p_longitude - (p_radius_km / (111 * COS(RADIANS(p_latitude))))) 
                        AND (p_longitude + (p_radius_km / (111 * COS(RADIANS(p_latitude)))))
    AND (
      EARTH_RADIUS_KM * 2 * ASIN(
        SQRT(
          POWER(SIN((lat1_rad - (s.latitude * PI() / 180)) / 2), 2) +
          COS(lat1_rad) * COS(s.latitude * PI() / 180) * 
          POWER(SIN((lon1_rad - (s.longitude * PI() / 180)) / 2), 2)
        )
      )
    ) <= p_radius_km
  ORDER BY distance_km ASC
  LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."find_nearby_sellers"("p_latitude" numeric, "p_longitude" numeric, "p_radius_km" numeric, "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_medicine_qr_code"("p_pharmacy_id" "uuid", "p_medicine_id" "uuid", "p_batch_number" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_qr_code TEXT;
    v_prefix TEXT;
BEGIN
    SELECT qr_code_prefix INTO v_prefix
    FROM public.pharmacy_profiles
    WHERE id = p_pharmacy_id;
    
    IF v_prefix IS NULL THEN
        v_prefix := 'PH' || SUBSTRING(p_pharmacy_id::text FROM 1 FOR 6);
        UPDATE public.pharmacy_profiles
        SET qr_code_prefix = v_prefix
        WHERE id = p_pharmacy_id;
    END IF;
    
    v_qr_code := v_prefix || '-' || 
                 SUBSTRING(p_medicine_id::text FROM 1 FOR 8) || '-' || 
                 p_batch_number || '-' || 
                 TO_CHAR(NOW(), 'YYYYMMDDHH24MISS');
    
    RETURN v_qr_code;
END;
$$;


ALTER FUNCTION "public"."generate_medicine_qr_code"("p_pharmacy_id" "uuid", "p_medicine_id" "uuid", "p_batch_number" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_patient_archive_json"("p_doctor_id" "uuid", "p_patient_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_patient_data JSONB;
    v_appointments JSONB;
    v_prescriptions JSONB;
    v_messages JSONB;
    v_conversations JSONB;
    v_medical_history JSONB;
    v_vitals JSONB;
    v_notes JSONB;
    v_archive_data JSONB;
BEGIN
    -- Patient Profile
    SELECT jsonb_build_object(
        'id', pp.id,
        'user_id', pp.user_id,
        'date_of_birth', pp.date_of_birth,
        'blood_type', pp.blood_type,
        'medical_history', pp.medical_history,
        'total_visits', pp.total_visits,
        'last_visit_date', pp.last_visit_date,
        'created_at', pp.created_at,
        'updated_at', pp.updated_at
    ) INTO v_patient_data
    FROM public.health_patient_profiles pp
    WHERE pp.id = p_patient_id;

    -- Appointments with this doctor
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', a.id,
            'scheduled_at', a.scheduled_at,
            'status', a.status,
            'slot_type', a.slot_type,
            'payment_amount', a.payment_amount,
            'notes', a.notes,
            'prescription_summary', a.prescription_summary,
            'created_at', a.created_at
        )
    ), '[]'::jsonb) INTO v_appointments
    FROM public.health_appointments a
    WHERE a.patient_id = p_patient_id
    AND a.doctor_id = p_doctor_id;

    -- Prescriptions from this doctor
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', pr.id,
            'appointment_id', pr.appointment_id,
            'medicine_name', pr.medicine_name,
            'dosage_instructions', pr.dosage_instructions,
            'duration_days', pr.duration_days,
            'is_dispensed', pr.is_dispensed,
            'created_at', pr.created_at
        )
    ), '[]'::jsonb) INTO v_prescriptions
    FROM public.health_prescriptions pr
    JOIN public.health_appointments a ON a.id = pr.appointment_id
    WHERE a.patient_id = p_patient_id
    AND a.doctor_id = p_doctor_id;

    -- Messages/Chat History
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', m.id,
            'conversation_id', m.conversation_id,
            'sender_id', m.sender_id,
            'content', m.content,
            'message_type', m.message_type,
            'created_at', m.created_at
        )
    ), '[]'::jsonb) INTO v_messages
    FROM public.health_messages m
    JOIN public.health_conversations c ON c.id = m.conversation_id
    JOIN public.health_appointments a ON a.id = c.appointment_id
    WHERE a.patient_id = p_patient_id
    AND a.doctor_id = p_doctor_id
    ORDER BY m.created_at ASC;

    -- Conversations
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', c.id,
            'appointment_id', c.appointment_id,
            'created_at', c.created_at,
            'updated_at', c.updated_at,
            'message_count', (
                SELECT COUNT(*) FROM public.health_messages 
                WHERE conversation_id = c.id
            )
        )
    ), '[]'::jsonb) INTO v_conversations
    FROM public.health_conversations c
    JOIN public.health_appointments a ON a.id = c.appointment_id
    WHERE a.patient_id = p_patient_id
    AND a.doctor_id = p_doctor_id;

    -- Build complete archive
    v_archive_data := jsonb_build_object(
        'archive_version', '1.0',
        'generated_at', NOW(),
        'doctor_id', p_doctor_id,
        'patient', v_patient_data,
        'appointments', v_appointments,
        'prescriptions', v_prescriptions,
        'messages', v_messages,
        'conversations', v_conversations,
        'summary', jsonb_build_object(
            'total_appointments', jsonb_array_length(v_appointments),
            'total_prescriptions', jsonb_array_length(v_prescriptions),
            'total_messages', jsonb_array_length(v_messages),
            'last_appointment', (
                SELECT MAX(scheduled_at) FROM public.health_appointments 
                WHERE patient_id = p_patient_id AND doctor_id = p_doctor_id
            ),
            'last_message', (
                SELECT MAX(created_at) FROM public.health_messages m
                JOIN public.health_conversations c ON c.id = m.conversation_id
                JOIN public.health_appointments a ON a.id = c.appointment_id
                WHERE a.patient_id = p_patient_id AND a.doctor_id = p_doctor_id
            )
        )
    );

    RETURN v_archive_data;
END;
$$;


ALTER FUNCTION "public"."generate_patient_archive_json"("p_doctor_id" "uuid", "p_patient_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_pharmacy_daily_report"("p_pharmacy_id" "uuid", "p_report_date" "date" DEFAULT CURRENT_DATE) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_report_id UUID;
    v_total_scans INTEGER;
    v_total_sales INTEGER;
    v_total_revenue NUMERIC;
    v_medicines_added INTEGER;
    v_medicines_expired INTEGER;
    v_low_stock_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_scans
    FROM public.pharmacy_qr_scan_logs
    WHERE pharmacy_id = p_pharmacy_id
    AND DATE(created_at) = p_report_date;
    
    SELECT COUNT(*), COALESCE(SUM(quantity_change * price), 0)
    INTO v_total_sales, v_total_revenue
    FROM public.pharmacy_stock_movements sm
    JOIN public.pharmacy_medicine_inventory inv ON inv.id = sm.inventory_id
    WHERE sm.pharmacy_id = p_pharmacy_id
    AND sm.movement_type = 'sell'
    AND DATE(sm.created_at) = p_report_date;
    
    SELECT COUNT(*) INTO v_medicines_added
    FROM public.pharmacy_stock_movements
    WHERE pharmacy_id = p_pharmacy_id
    AND movement_type = 'receive'
    AND DATE(created_at) = p_report_date;
    
    SELECT COUNT(*) INTO v_medicines_expired
    FROM public.pharmacy_medicine_inventory
    WHERE pharmacy_id = p_pharmacy_id
    AND is_expired = TRUE
    AND DATE(updated_at) = p_report_date;
    
    SELECT COUNT(*) INTO v_low_stock_count
    FROM public.pharmacy_medicine_inventory
    WHERE pharmacy_id = p_pharmacy_id
    AND quantity_in_stock <= 10
    AND is_available = TRUE;
    
    INSERT INTO public.pharmacy_daily_reports (
        pharmacy_id,
        report_date,
        total_scans,
        total_sales,
        total_revenue,
        medicines_added,
        medicines_expired,
        low_stock_count,
        report_data
    ) VALUES (
        p_pharmacy_id,
        p_report_date,
        v_total_scans,
        v_total_sales,
        v_total_revenue,
        v_medicines_added,
        v_medicines_expired,
        v_low_stock_count,
        jsonb_build_object(
            'generated_at', NOW(),
            'scans', v_total_scans,
            'sales', v_total_sales,
            'revenue', v_total_revenue,
            'added', v_medicines_added,
            'expired', v_medicines_expired,
            'low_stock', v_low_stock_count
        )
    )
    ON CONFLICT (pharmacy_id, report_date)
    DO UPDATE SET
        total_scans = EXCLUDED.total_scans,
        total_sales = EXCLUDED.total_sales,
        total_revenue = EXCLUDED.total_revenue,
        medicines_added = EXCLUDED.medicines_added,
        medicines_expired = EXCLUDED.medicines_expired,
        low_stock_count = EXCLUDED.low_stock_count,
        report_data = EXCLUDED.report_data,
        generated_at = NOW()
    RETURNING id INTO v_report_id;
    
    RETURN v_report_id;
END;
$$;


ALTER FUNCTION "public"."generate_pharmacy_daily_report"("p_pharmacy_id" "uuid", "p_report_date" "date") OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."get_feed_posts"("p_limit" integer DEFAULT 20, "p_offset" integer DEFAULT 0, "p_user_id" "uuid" DEFAULT NULL::"uuid", "p_post_type" "text" DEFAULT NULL::"text") RETURNS TABLE("id" "uuid", "user_id" "uuid", "seller_id" "uuid", "product_id" "uuid", "content" "text", "media_urls" "jsonb", "post_type" "text", "likes_count" integer, "comments_count" integer, "shares_count" integer, "created_at" timestamp with time zone, "author_full_name" "text", "author_avatar_url" "text", "author_account_type" "text", "is_verified" boolean, "product_title" "text", "product_price" numeric, "product_image" "text", "is_liked_by_user" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.seller_id,
    p.product_id,
    p.content,
    p.media_urls,
    p.post_type,
    p.likes_count,
    p.comments_count,
    p.shares_count,
    p.created_at,
    u.full_name AS author_full_name,
    u.avatar_url AS author_avatar_url,
    u.account_type AS author_account_type,
    COALESCE(s.is_verified, false) AS is_verified,
    prod.title AS product_title,
    prod.price AS product_price,
    prod.images->>0 AS product_image,
    EXISTS (
      SELECT 1 FROM post_likes pl 
      WHERE pl.post_id = p.id AND pl.user_id = p_user_id
    ) AS is_liked_by_user
  FROM posts p
  LEFT JOIN users u ON u.user_id = p.user_id
  LEFT JOIN sellers s ON s.user_id = p.user_id
  LEFT JOIN products prod ON prod.id = p.product_id
  WHERE p.is_deleted = false
    AND (p_user_id IS NULL OR p.user_id = p_user_id)
    AND (p_post_type IS NULL OR p.post_type = p_post_type)
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;


ALTER FUNCTION "public"."get_feed_posts"("p_limit" integer, "p_offset" integer, "p_user_id" "uuid", "p_post_type" "text") OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."get_or_create_conversation"("p_other_user_id" "uuid", "p_product_id" "uuid" DEFAULT NULL::"uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_conversation_id uuid;
  v_current_user_id uuid := auth.uid();
BEGIN
  -- Try to find existing conversation
  SELECT c.id INTO v_conversation_id
  FROM public.conversations c
  JOIN public.conversation_participants cp1 ON cp1.conversation_id = c.id
  JOIN public.conversation_participants cp2 ON cp2.conversation_id = c.id
  WHERE cp1.user_id = v_current_user_id
    AND cp2.user_id = p_other_user_id
    AND (c.product_id IS NULL OR c.product_id = p_product_id)
  LIMIT 1;

  -- If found, return it
  IF v_conversation_id IS NOT NULL THEN
    RETURN v_conversation_id;
  END IF;

  -- Create new conversation
  INSERT INTO public.conversations (product_id)
  VALUES (p_product_id)
  RETURNING id INTO v_conversation_id;

  -- Add current user as participant
  INSERT INTO public.conversation_participants (conversation_id, user_id, role)
  VALUES (v_conversation_id, v_current_user_id, 'seller')
  ON CONFLICT (conversation_id, user_id) DO NOTHING;

  -- Add other user as participant
  INSERT INTO public.conversation_participants (conversation_id, user_id, role)
  VALUES (v_conversation_id, p_other_user_id, 'user')
  ON CONFLICT (conversation_id, user_id) DO NOTHING;

  RETURN v_conversation_id;
END;
$$;


ALTER FUNCTION "public"."get_or_create_conversation"("p_other_user_id" "uuid", "p_product_id" "uuid") OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."get_provider_user_id"("p_provider_id" "uuid") RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT user_id FROM public.svc_providers WHERE id = p_provider_id;
$$;


ALTER FUNCTION "public"."get_provider_user_id"("p_provider_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_public_profile"("p_user_id" "uuid") RETURNS TABLE("user_id" "uuid", "email" "text", "full_name" "text", "phone" "text", "avatar_url" "text", "account_type" "text", "location" "text", "currency" "text", "is_verified" boolean, "created_at" timestamp with time zone, "product_count" bigint, "total_sales" bigint, "total_revenue" numeric, "average_rating" numeric, "review_count" bigint, "store_name" "text", "is_factory" boolean, "is_middle_man" boolean, "is_seller" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.user_id,
    u.email,
    u.full_name,
    CASE 
      WHEN auth.uid() = p_user_id THEN u.phone
      ELSE NULL 
    END AS phone,
    u.avatar_url,
    u.account_type,
    COALESCE(s.location, NULL) AS location,
    COALESCE(s.currency, 'USD') AS currency,
    COALESCE(s.is_verified, false) AS is_verified,
    u.created_at,
    COALESCE(pc.product_count, 0)::BIGINT AS product_count,
    COALESCE(sc.sales_count, 0)::BIGINT AS total_sales,
    COALESCE(sr.total_revenue, 0)::NUMERIC AS total_revenue,
    COALESCE(r.avg_rating, 0)::NUMERIC AS average_rating,
    COALESCE(r.review_count, 0)::BIGINT AS review_count,
    COALESCE(sp.store_name, NULL) AS store_name,
    (u.account_type = 'factory') AS is_factory,
    (u.account_type = 'middle_man') AS is_middle_man,
    (u.account_type = 'seller') AS is_seller
  FROM public.users u
  LEFT JOIN public.sellers s ON s.user_id = u.user_id
  LEFT JOIN public.seller_profiles sp ON sp.id = u.user_id
  LEFT JOIN (
    SELECT seller_id, COUNT(*) AS product_count
    FROM public.products
    WHERE is_deleted = false
    GROUP BY seller_id
  ) pc ON pc.seller_id = u.user_id
  LEFT JOIN (
    SELECT seller_id, COUNT(*) AS sales_count
    FROM public.sales
    GROUP BY seller_id
  ) sc ON sc.seller_id = u.user_id
  LEFT JOIN (
    SELECT seller_id, SUM(total_price) AS total_revenue
    FROM public.sales
    GROUP BY seller_id
  ) sr ON sr.seller_id = u.user_id
  LEFT JOIN (
    SELECT 
      p.seller_id,
      AVG(r2.rating) AS avg_rating,
      COUNT(r2.id) AS review_count
    FROM public.products p
    LEFT JOIN public.reviews r2 ON r2.asin = p.asin
    WHERE r2.is_approved = true
    GROUP BY p.seller_id
  ) r ON r.seller_id = u.user_id
  WHERE u.user_id = p_user_id;
END;
$$;


ALTER FUNCTION "public"."get_public_profile"("p_user_id" "uuid") OWNER TO "postgres";


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
  INSERT INTO public.users (user_id, email, full_name, phone, account_type)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'user')
  );

  IF NEW.raw_user_meta_data->>'account_type' = 'seller' THEN
    INSERT INTO public.sellers (user_id, email, full_name, phone, location, currency, account_type, is_verified)
    VALUES (
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

  IF NEW.raw_user_meta_data->>'account_type' = 'factory' THEN
    INSERT INTO public.factories (user_id, email, full_name, phone, location, currency, account_type, is_verified)
    VALUES (
      NEW.id,
      NEW.email,
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'phone',
      NEW.raw_user_meta_data->>'location',
      COALESCE(NEW.raw_user_meta_data->>'currency', 'USD'),
      'factory',
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


CREATE OR REPLACE FUNCTION "public"."process_qr_scan"("p_pharmacy_id" "uuid", "p_user_id" "uuid", "p_qr_code" "text", "p_scan_type" "text", "p_device_info" "text" DEFAULT NULL::"text", "p_location_lat" double precision DEFAULT NULL::double precision, "p_location_lng" double precision DEFAULT NULL::double precision) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_inventory RECORD;
    v_medicine RECORD;
    v_scan_result TEXT;
    v_result JSONB;
BEGIN
    SELECT * INTO v_inventory
    FROM public.pharmacy_medicine_inventory
    WHERE qr_code = p_qr_code;
    
    IF v_inventory.id IS NULL THEN
        v_scan_result := 'not_found';
        v_result := jsonb_build_object(
            'success', false,
            'message', 'QR code not found in inventory',
            'qr_code', p_qr_code
        );
    ELSIF v_inventory.is_expired THEN
        v_scan_result := 'expired';
        v_result := jsonb_build_object(
            'success', false,
            'message', 'Medicine has expired',
            'expiry_date', v_inventory.expiry_date,
            'medicine_name', (SELECT title FROM public.products WHERE id = v_inventory.product_id)
        );
    ELSIF NOT v_inventory.is_available THEN
        v_scan_result := 'unavailable';
        v_result := jsonb_build_object(
            'success', false,
            'message', 'Medicine is not available',
            'quantity', v_inventory.quantity_in_stock
        );
    ELSE
        v_scan_result := 'success';
        
        SELECT * INTO v_medicine
        FROM public.products
        WHERE id = v_inventory.product_id;
        
        v_result := jsonb_build_object(
            'success', true,
            'message', 'QR code scanned successfully',
            'inventory_id', v_inventory.id,
            'medicine', jsonb_build_object(
                'id', v_medicine.id,
                'name', v_medicine.title,
                'brand', v_medicine.brand,
                'price', v_medicine.price,
                'requires_prescription', v_medicine.attributes->>'requires_prescription'
            ),
            'inventory', jsonb_build_object(
                'batch_number', v_inventory.batch_number,
                'expiry_date', v_inventory.expiry_date,
                'quantity', v_inventory.quantity_available,
                'price', v_inventory.price,
                'storage_location', v_inventory.storage_location
            )
        );
        
        UPDATE public.pharmacy_medicine_inventory
        SET last_scanned_at = NOW(),
            scanned_by = p_user_id
        WHERE id = v_inventory.id;
    END IF;
    
    INSERT INTO public.pharmacy_qr_scan_logs (
        pharmacy_id,
        user_id,
        qr_code,
        inventory_id,
        medicine_id,
        product_id,
        scan_type,
        scan_result,
        device_info,
        location_lat,
        location_lng,
        created_at
    ) VALUES (
        p_pharmacy_id,
        p_user_id,
        p_qr_code,
        v_inventory.id,
        v_inventory.medicine_id,
        v_inventory.product_id,
        p_scan_type,
        v_scan_result,
        p_device_info,
        p_location_lat,
        p_location_lng,
        NOW()
    );
    
    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."process_qr_scan"("p_pharmacy_id" "uuid", "p_user_id" "uuid", "p_qr_code" "text", "p_scan_type" "text", "p_device_info" "text", "p_location_lat" double precision, "p_location_lng" double precision) OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."run_daily_patient_backup"("p_doctor_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_backup_id UUID;
    v_patients RECORD;
    v_total_patients INTEGER;
    v_archived_count INTEGER := 0;
    v_failed_count INTEGER := 0;
    v_start_time TIMESTAMPTZ;
    v_end_time TIMESTAMPTZ;
BEGIN
    v_start_time := NOW();
    
    -- Create backup status record
    INSERT INTO public.health_daily_backup_status (
        doctor_id,
        backup_date,
        status,
        started_at
    ) VALUES (
        p_doctor_id,
        CURRENT_DATE,
        'in_progress',
        v_start_time
    )
    ON CONFLICT (doctor_id, backup_date)
    DO UPDATE SET
        status = 'in_progress',
        started_at = v_start_time
    RETURNING id INTO v_backup_id;
    
    -- Get all patients for this doctor
    SELECT COUNT(DISTINCT patient_id) INTO v_total_patients
    FROM public.health_appointments
    WHERE doctor_id = p_doctor_id;
    
    -- Archive each patient
    FOR v_patients IN (
        SELECT DISTINCT patient_id
        FROM public.health_appointments
        WHERE doctor_id = p_doctor_id
    ) LOOP
        BEGIN
            PERFORM public.archive_patient_data(p_doctor_id, v_patients.patient_id, 'daily_backup');
            v_archived_count := v_archived_count + 1;
        EXCEPTION WHEN OTHERS THEN
            v_failed_count := v_failed_count + 1;
            RAISE NOTICE 'Failed to archive patient %: %', v_patients.patient_id, SQLERRM;
        END;
    END LOOP;
    
    v_end_time := NOW();
    
    -- Update backup status
    UPDATE public.health_daily_backup_status
    SET
        total_patients = v_total_patients,
        archived_patients = v_archived_count,
        failed_patients = v_failed_count,
        backup_size_mb = (
            SELECT COALESCE(SUM(pg_column_size(archive_data)), 0) / (1024 * 1024)
            FROM public.health_patient_archives
            WHERE doctor_id = p_doctor_id AND backup_date = CURRENT_DATE
        ),
        status = CASE WHEN v_failed_count = 0 THEN 'completed' ELSE 'failed' END,
        completed_at = v_end_time,
        metadata = jsonb_build_object(
            'duration_seconds', EXTRACT(EPOCH FROM (v_end_time - v_start_time)),
            'success_rate', ROUND((v_archived_count::NUMERIC / NULLIF(v_total_patients, 0)) * 100, 2)
        )
    WHERE id = v_backup_id;
    
    RETURN jsonb_build_object(
        'backup_id', v_backup_id,
        'total_patients', v_total_patients,
        'archived', v_archived_count,
        'failed', v_failed_count,
        'duration_seconds', EXTRACT(EPOCH FROM (v_end_time - v_start_time)),
        'status', CASE WHEN v_failed_count = 0 THEN 'completed' ELSE 'failed' END
    );
END;
$$;


ALTER FUNCTION "public"."run_daily_patient_backup"("p_doctor_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_public_profiles"("p_search_term" "text" DEFAULT NULL::"text", "p_account_type" "text" DEFAULT NULL::"text", "p_location" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 20, "p_offset" integer DEFAULT 0) RETURNS TABLE("user_id" "uuid", "full_name" "text", "avatar_url" "text", "account_type" "text", "location" "text", "is_verified" boolean, "product_count" bigint, "total_revenue" numeric, "average_rating" numeric, "store_name" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.user_id,
    u.full_name,
    u.avatar_url,
    u.account_type,
    s.location,
    s.is_verified,
    COALESCE(pc.product_count, 0)::BIGINT AS product_count,
    COALESCE(sr.total_revenue, 0)::NUMERIC AS total_revenue,
    COALESCE(r.avg_rating, 0)::NUMERIC AS average_rating,
    sp.store_name
  FROM public.users u
  LEFT JOIN public.sellers s ON s.user_id = u.user_id
  LEFT JOIN public.seller_profiles sp ON sp.id = u.user_id
  LEFT JOIN (
    SELECT seller_id, COUNT(*) AS product_count
    FROM public.products
    WHERE is_deleted = false
    GROUP BY seller_id
  ) pc ON pc.seller_id = u.user_id
  LEFT JOIN (
    SELECT seller_id, SUM(total_price) AS total_revenue
    FROM public.sales
    GROUP BY seller_id
  ) sr ON sr.seller_id = u.user_id
  LEFT JOIN (
    SELECT 
      p.seller_id,
      AVG(r2.rating) AS avg_rating
    FROM public.products p
    LEFT JOIN public.reviews r2 ON r2.asin = p.asin
    WHERE r2.is_approved = true
    GROUP BY p.seller_id
  ) r ON r.seller_id = u.user_id
  WHERE 
    (p_search_term IS NULL OR 
      u.full_name ILIKE '%' || p_search_term || '%' OR 
      u.email ILIKE '%' || p_search_term || '%' OR
      s.location ILIKE '%' || p_search_term || '%' OR
      sp.store_name ILIKE '%' || p_search_term || '%')
    AND (p_account_type IS NULL OR u.account_type = p_account_type)
    AND (p_location IS NULL OR s.location ILIKE '%' || p_location || '%')
  ORDER BY s.is_verified DESC, product_count DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;


ALTER FUNCTION "public"."search_public_profiles"("p_search_term" "text", "p_account_type" "text", "p_location" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."update_conversation_on_message"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NOT NEW.is_deleted THEN
    UPDATE conversations
    SET
      last_message = CASE
        WHEN NEW.message_type = 'image' THEN '📷 Image'
        WHEN NEW.message_type = 'file' THEN '📎 Attachment'
        ELSE NEW.content
      END,
      last_message_at = NEW.created_at,
      updated_at = NOW()
    WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_conversation_on_message"() OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."update_health_pharmacy_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_health_pharmacy_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_health_timestamps"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_health_timestamps"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_medicine_expiry_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        NEW.is_expired := NEW.expiry_date < CURRENT_DATE;
        NEW.is_near_expiry := NEW.expiry_date <= CURRENT_DATE + (NEW.near_expiry_threshold_days || ' days')::INTERVAL 
                              AND NEW.expiry_date >= CURRENT_DATE;
        NEW.is_available := NOT NEW.is_expired 
                           AND NEW.quantity_in_stock > 0 
                           AND NEW.quality_check_status = 'passed';
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_medicine_expiry_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_medicine_rating"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE public.health_medicines
        SET 
            average_rating = (
                SELECT COALESCE(AVG(rating), 0)
                FROM public.health_medicine_reviews
                WHERE medicine_id = NEW.medicine_id
                AND is_approved = TRUE
            ),
            review_count = (
                SELECT COUNT(*)
                FROM public.health_medicine_reviews
                WHERE medicine_id = NEW.medicine_id
                AND is_approved = TRUE
            )
        WHERE id = NEW.medicine_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.health_medicines
        SET 
            average_rating = (
                SELECT COALESCE(AVG(rating), 0)
                FROM public.health_medicine_reviews
                WHERE medicine_id = OLD.medicine_id
                AND is_approved = TRUE
            ),
            review_count = (
                SELECT COUNT(*)
                FROM public.health_medicine_reviews
                WHERE medicine_id = OLD.medicine_id
                AND is_approved = TRUE
            )
        WHERE id = OLD.medicine_id;
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_medicine_rating"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_medicine_stock_on_order"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_pharmacy_id UUID;
    v_quantity_before INTEGER;
    v_quantity_after INTEGER;
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Get pharmacy_id and current quantity
        SELECT m.pharmacy_id, m.quantity_in_stock INTO v_pharmacy_id, v_quantity_before
        FROM public.health_medicines m
        WHERE m.id = NEW.medicine_id;
        
        -- Decrease stock
        UPDATE public.health_medicines
        SET quantity_in_stock = quantity_in_stock - NEW.quantity
        WHERE id = NEW.medicine_id;
        
        -- Get new quantity
        SELECT quantity_in_stock INTO v_quantity_after
        FROM public.health_medicines
        WHERE id = NEW.medicine_id;
        
        -- Record stock history
        INSERT INTO public.health_medicine_stock_history (
            medicine_id,
            pharmacy_id,
            change_type,
            quantity_change,
            quantity_before,
            quantity_after,
            reference_id,
            notes
        ) VALUES (
            NEW.medicine_id,
            v_pharmacy_id,
            'sale',
            -NEW.quantity,
            v_quantity_before,
            v_quantity_after,
            NEW.order_id,
            'Sold via order ' || NEW.order_id
        );
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_medicine_stock_on_order"() OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."update_patient_visit_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE public.health_patient_profiles
        SET total_visits = total_visits + 1,
            last_visit_date = NEW.scheduled_at
        WHERE id = NEW.patient_id;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_patient_visit_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_post_comments_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_post_comments_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_post_likes_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_post_likes_count"() OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_is_in_conversation"("p_conversation_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.conversation_participants 
        WHERE conversation_id = p_conversation_id 
        AND user_id = auth.uid()
    );
END;
$$;


ALTER FUNCTION "public"."user_is_in_conversation"("p_conversation_id" "uuid") OWNER TO "postgres";

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


CREATE TABLE IF NOT EXISTS "public"."booking_milestones" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "amount" numeric(10,2),
    "due_date" "date",
    "status" "text" DEFAULT 'pending'::"text",
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "booking_milestones_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'in_progress'::"text", 'completed'::"text", 'approved'::"text"])))
);


ALTER TABLE "public"."booking_milestones" OWNER TO "postgres";


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


CREATE TABLE IF NOT EXISTS "public"."conversation_participants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "last_read_message_id" "uuid",
    "is_muted" boolean DEFAULT false,
    "joined_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "conversation_participants_role_check" CHECK (("role" = ANY (ARRAY['customer'::"text", 'seller'::"text", 'factory'::"text", 'middleman'::"text", 'admin'::"text", 'freelancer'::"text", 'service_provider'::"text", 'delivery_driver'::"text", 'doctor'::"text", 'patient'::"text", 'pharmacy'::"text"])))
);


ALTER TABLE "public"."conversation_participants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_message" "text",
    "last_message_at" timestamp with time zone,
    "is_archived" boolean DEFAULT false,
    "factory_id" "uuid",
    "context" "text" DEFAULT 'general'::"text"
);


ALTER TABLE "public"."conversations" OWNER TO "postgres";


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
    "user_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text" NOT NULL,
    "company_name" "text",
    "phone" "text",
    "location" "text",
    "currency" "text" DEFAULT 'USD'::"text",
    "account_type" "text" DEFAULT 'factory'::"text",
    "is_verified" boolean DEFAULT false,
    "capacity_info" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "business_license_url" "text",
    "is_factory" boolean,
    "latitude" bigint,
    "location_text" "text",
    "longitude" bigint,
    "production_capacity" bigint,
    "specialization" "text"
);


ALTER TABLE "public"."factories" OWNER TO "postgres";


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
    "allow_custom_requests" boolean DEFAULT false,
    CONSTRAINT "sellers_latitude_check" CHECK ((("latitude" >= ('-90'::integer)::numeric) AND ("latitude" <= (90)::numeric))),
    CONSTRAINT "sellers_longitude_check" CHECK ((("longitude" >= ('-180'::integer)::numeric) AND ("longitude" <= (180)::numeric)))
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


CREATE TABLE IF NOT EXISTS "public"."factory_quotes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "factory_id" "uuid",
    "requester_id" "uuid",
    "product_id" "uuid",
    "status" "text",
    "quoted_price" numeric,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "factory_quotes_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'quoted'::"text", 'accepted'::"text", 'rejected'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."factory_quotes" OWNER TO "postgres";


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


CREATE TABLE IF NOT EXISTS "public"."health_appointments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "doctor_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "scheduled_at" timestamp with time zone NOT NULL,
    "duration_minutes" integer DEFAULT 30,
    "status" "text" DEFAULT 'pending'::"text",
    "payment_status" "text" DEFAULT 'pending'::"text",
    "payment_amount" numeric(10,2),
    "payment_intent_id" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "health_appointments_payment_status_check" CHECK (("payment_status" = ANY (ARRAY['pending'::"text", 'paid'::"text", 'refunded'::"text"]))),
    CONSTRAINT "health_appointments_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'confirmed'::"text", 'active'::"text", 'completed'::"text", 'cancelled'::"text", 'no_show'::"text"])))
);


ALTER TABLE "public"."health_appointments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."health_conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "appointment_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_message" "text",
    "last_message_at" timestamp with time zone
);


ALTER TABLE "public"."health_conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."health_daily_backup_status" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "doctor_id" "uuid" NOT NULL,
    "backup_date" "date" NOT NULL,
    "total_patients" integer DEFAULT 0,
    "archived_patients" integer DEFAULT 0,
    "failed_patients" integer DEFAULT 0,
    "backup_size_mb" numeric(10,2) DEFAULT 0,
    "status" "text" DEFAULT 'pending'::"text",
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "error_message" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "health_daily_backup_status_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'in_progress'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."health_daily_backup_status" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."health_doctor_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "specialization" "text" NOT NULL,
    "license_number" "text" NOT NULL,
    "consultation_fee" numeric(10,2) NOT NULL,
    "availability_schedule" "jsonb" DEFAULT '[]'::"jsonb",
    "is_verified" boolean DEFAULT false,
    "bio" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."health_doctor_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."health_medicine_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "parent_id" "uuid",
    "description" "text",
    "icon" "text",
    "sort_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "requires_special_license" boolean DEFAULT false
);


ALTER TABLE "public"."health_medicine_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."health_medicine_expiry_alerts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pharmacy_id" "uuid" NOT NULL,
    "inventory_id" "uuid" NOT NULL,
    "medicine_id" "uuid" NOT NULL,
    "batch_number" "text" NOT NULL,
    "expiry_date" "date" NOT NULL,
    "days_until_expiry" integer NOT NULL,
    "alert_level" "text",
    "quantity_affected" integer NOT NULL,
    "is_resolved" boolean DEFAULT false,
    "resolved_at" timestamp with time zone,
    "resolved_by" "uuid",
    "resolution_action" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "health_medicine_expiry_alerts_alert_level_check" CHECK (("alert_level" = ANY (ARRAY['info'::"text", 'warning'::"text", 'critical'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."health_medicine_expiry_alerts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."health_medicine_order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "medicine_id" "uuid" NOT NULL,
    "medicine_name" "text" NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "unit_price" numeric(10,2) NOT NULL,
    "total_price" numeric(10,2) NOT NULL,
    "prescription_required" boolean DEFAULT false,
    "prescription_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."health_medicine_order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."health_medicine_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pharmacy_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "prescription_id" "uuid",
    "status" "text" DEFAULT 'pending'::"text",
    "payment_status" "text" DEFAULT 'pending'::"text",
    "subtotal" numeric(10,2) DEFAULT 0 NOT NULL,
    "delivery_fee" numeric(10,2) DEFAULT 0,
    "discount" numeric(10,2) DEFAULT 0,
    "total" numeric(10,2) DEFAULT 0 NOT NULL,
    "payment_method" "text" DEFAULT 'cash'::"text",
    "delivery_address" "jsonb" NOT NULL,
    "delivery_phone" "text" NOT NULL,
    "delivery_notes" "text",
    "payment_intent_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "confirmed_at" timestamp with time zone,
    "ready_at" timestamp with time zone,
    "delivered_at" timestamp with time zone,
    "cancelled_at" timestamp with time zone,
    CONSTRAINT "health_medicine_orders_payment_method_check" CHECK (("payment_method" = ANY (ARRAY['cash'::"text", 'card'::"text", 'digital_wallet'::"text", 'cod'::"text"]))),
    CONSTRAINT "health_medicine_orders_payment_status_check" CHECK (("payment_status" = ANY (ARRAY['pending'::"text", 'paid'::"text", 'refunded'::"text"]))),
    CONSTRAINT "health_medicine_orders_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'confirmed'::"text", 'preparing'::"text", 'ready'::"text", 'out_for_delivery'::"text", 'delivered'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."health_medicine_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."health_medicine_recalls" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "medicine_id" "uuid" NOT NULL,
    "recall_number" "text" NOT NULL,
    "recall_type" "text",
    "recall_reason" "text" NOT NULL,
    "risk_level" "text",
    "affected_batches" "jsonb" DEFAULT '[]'::"jsonb",
    "manufacturer_notice" "text",
    "regulatory_authority" "text",
    "recall_date" "date" NOT NULL,
    "expiry_date" "date",
    "instructions" "text",
    "is_active" boolean DEFAULT true,
    "resolved_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "health_medicine_recalls_recall_type_check" CHECK (("recall_type" = ANY (ARRAY['Class I'::"text", 'Class II'::"text", 'Class III'::"text", 'Safety Alert'::"text", 'Market Withdrawal'::"text"]))),
    CONSTRAINT "health_medicine_recalls_risk_level_check" CHECK (("risk_level" = ANY (ARRAY['high'::"text", 'medium'::"text", 'low'::"text"])))
);


ALTER TABLE "public"."health_medicine_recalls" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."health_medicine_reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "medicine_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "order_id" "uuid",
    "rating" integer NOT NULL,
    "title" "text",
    "comment" "text",
    "is_verified_purchase" boolean DEFAULT false,
    "is_approved" boolean DEFAULT true,
    "helpful_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "health_medicine_reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."health_medicine_reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."health_medicine_stock_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "medicine_id" "uuid" NOT NULL,
    "pharmacy_id" "uuid" NOT NULL,
    "change_type" "text" NOT NULL,
    "quantity_change" integer NOT NULL,
    "quantity_before" integer NOT NULL,
    "quantity_after" integer NOT NULL,
    "reference_id" "uuid",
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "health_medicine_stock_history_change_type_check" CHECK (("change_type" = ANY (ARRAY['sale'::"text", 'restock'::"text", 'adjustment'::"text", 'expiry'::"text", 'return'::"text"])))
);


ALTER TABLE "public"."health_medicine_stock_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."health_medicines" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pharmacy_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "generic_name" "text",
    "brand" "text",
    "manufacturer" "text",
    "category" "text" NOT NULL,
    "subcategory" "text",
    "description" "text",
    "dosage_form" "text",
    "strength" "text",
    "unit" "text" DEFAULT 'piece'::"text",
    "price" numeric(10,2) NOT NULL,
    "currency" "text" DEFAULT 'EGP'::"text",
    "quantity_in_stock" integer DEFAULT 0,
    "requires_prescription" boolean DEFAULT false,
    "prescription_category" "text",
    "active_ingredients" "jsonb" DEFAULT '[]'::"jsonb",
    "side_effects" "text",
    "warnings" "text",
    "storage_instructions" "text",
    "expiry_date" "date",
    "batch_number" "text",
    "barcode" "text",
    "sku" "text",
    "images" "jsonb" DEFAULT '[]'::"jsonb",
    "is_available" boolean DEFAULT true,
    "is_featured" boolean DEFAULT false,
    "average_rating" numeric(3,2) DEFAULT 0,
    "review_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "health_medicines_dosage_form_check" CHECK (("dosage_form" = ANY (ARRAY['tablet'::"text", 'capsule'::"text", 'syrup'::"text", 'injection'::"text", 'cream'::"text", 'ointment'::"text", 'drops'::"text", 'inhaler'::"text", 'patch'::"text", 'other'::"text"]))),
    CONSTRAINT "health_medicines_prescription_category_check" CHECK (("prescription_category" = ANY (ARRAY['none'::"text", 'over_counter'::"text", 'prescription_required'::"text", 'controlled'::"text"])))
);


ALTER TABLE "public"."health_medicines" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."health_medicines_master" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "generic_name" "text",
    "brand" "text",
    "manufacturer" "text",
    "category" "text" NOT NULL,
    "subcategory" "text",
    "description" "text",
    "dosage_form" "text",
    "strength" "text",
    "unit" "text" DEFAULT 'piece'::"text",
    "requires_prescription" boolean DEFAULT false,
    "prescription_category" "text",
    "controlled_substance_schedule" "text",
    "active_ingredients" "jsonb" DEFAULT '[]'::"jsonb",
    "inactive_ingredients" "jsonb" DEFAULT '[]'::"jsonb",
    "indications" "text",
    "contraindications" "text",
    "side_effects" "text",
    "warnings" "text",
    "precautions" "text",
    "drug_interactions" "jsonb" DEFAULT '[]'::"jsonb",
    "pregnancy_category" "text",
    "breastfeeding_safety" "text",
    "pediatric_safety" "text",
    "geriatric_safety" "text",
    "dosage_instructions" "text",
    "administration_route" "text",
    "storage_instructions" "text",
    "shelf_life_months" integer,
    "is_hazardous" boolean DEFAULT false,
    "is_refrigerated" boolean DEFAULT false,
    "is_light_sensitive" boolean DEFAULT false,
    "who_essential_medicine" boolean DEFAULT false,
    "fda_approved" boolean DEFAULT false,
    "source_url" "text",
    "source_verified_date" "date",
    "barcode_template" "text",
    "sku_template" "text",
    "is_active" boolean DEFAULT true,
    "is_featured" boolean DEFAULT false,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "health_medicines_master_controlled_substance_schedule_check" CHECK (("controlled_substance_schedule" = ANY (ARRAY['none'::"text", 'Schedule I'::"text", 'Schedule II'::"text", 'Schedule III'::"text", 'Schedule IV'::"text", 'Schedule V'::"text"]))),
    CONSTRAINT "health_medicines_master_dosage_form_check" CHECK (("dosage_form" = ANY (ARRAY['tablet'::"text", 'capsule'::"text", 'syrup'::"text", 'injection'::"text", 'cream'::"text", 'ointment'::"text", 'drops'::"text", 'inhaler'::"text", 'patch'::"text", 'suppository'::"text", 'liquid'::"text", 'powder'::"text", 'other'::"text"]))),
    CONSTRAINT "health_medicines_master_pregnancy_category_check" CHECK (("pregnancy_category" = ANY (ARRAY['A'::"text", 'B'::"text", 'C'::"text", 'D'::"text", 'X'::"text", 'unknown'::"text"]))),
    CONSTRAINT "health_medicines_master_prescription_category_check" CHECK (("prescription_category" = ANY (ARRAY['none'::"text", 'over_counter'::"text", 'prescription_required'::"text", 'controlled'::"text", 'narcotic'::"text", 'psychotropic'::"text"])))
);


ALTER TABLE "public"."health_medicines_master" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."health_patient_access_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "doctor_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "access_type" "text" NOT NULL,
    "data_accessed" "jsonb",
    "device_info" "text",
    "ip_address" "text",
    "accessed_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "health_patient_access_log_access_type_check" CHECK (("access_type" = ANY (ARRAY['view'::"text", 'edit'::"text", 'export'::"text", 'print'::"text"])))
);


ALTER TABLE "public"."health_patient_access_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."health_patient_archives" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "doctor_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "archive_data" "jsonb" NOT NULL,
    "data_version" integer DEFAULT 1,
    "archive_type" "text" DEFAULT 'full'::"text",
    "data_hash" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "backup_date" "date" DEFAULT CURRENT_DATE,
    "is_synced" boolean DEFAULT false,
    "sync_attempts" integer DEFAULT 0,
    "last_sync_at" timestamp with time zone,
    CONSTRAINT "health_patient_archives_archive_type_check" CHECK (("archive_type" = ANY (ARRAY['full'::"text", 'incremental'::"text", 'daily_backup'::"text"])))
);


ALTER TABLE "public"."health_patient_archives" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."health_patient_change_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "doctor_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "change_type" "text" NOT NULL,
    "entity_id" "uuid",
    "old_data" "jsonb",
    "new_data" "jsonb",
    "changed_by" "uuid",
    "changed_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "health_patient_change_log_change_type_check" CHECK (("change_type" = ANY (ARRAY['appointment'::"text", 'prescription'::"text", 'message'::"text", 'vital'::"text", 'note'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."health_patient_change_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."health_patient_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "date_of_birth" "date",
    "blood_type" "text",
    "medical_history" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."health_patient_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."health_pharmacy_inspections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pharmacy_id" "uuid" NOT NULL,
    "inspector_id" "uuid",
    "inspector_name" "text" NOT NULL,
    "inspection_type" "text",
    "inspection_date" "date" NOT NULL,
    "next_inspection_date" "date",
    "overall_status" "text",
    "findings" "jsonb" DEFAULT '[]'::"jsonb",
    "violations" "jsonb" DEFAULT '[]'::"jsonb",
    "corrective_actions" "jsonb" DEFAULT '[]'::"jsonb",
    "corrective_action_deadline" "date",
    "notes" "text",
    "report_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "health_pharmacy_inspections_inspection_type_check" CHECK (("inspection_type" = ANY (ARRAY['routine'::"text", 'complaint'::"text", 'follow_up'::"text", 'license_renewal'::"text"]))),
    CONSTRAINT "health_pharmacy_inspections_overall_status_check" CHECK (("overall_status" = ANY (ARRAY['pass'::"text", 'pass_with_conditions'::"text", 'fail'::"text", 'suspended'::"text"])))
);


ALTER TABLE "public"."health_pharmacy_inspections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."health_pharmacy_inventory" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pharmacy_id" "uuid" NOT NULL,
    "medicine_id" "uuid" NOT NULL,
    "batch_number" "text" NOT NULL,
    "expiry_date" "date" NOT NULL,
    "manufacturing_date" "date",
    "price" numeric(10,2) NOT NULL,
    "currency" "text" DEFAULT 'EGP'::"text",
    "quantity_in_stock" integer DEFAULT 0,
    "quantity_reserved" integer DEFAULT 0,
    "quantity_available" integer GENERATED ALWAYS AS (("quantity_in_stock" - "quantity_reserved")) STORED,
    "is_available" boolean DEFAULT true,
    "is_expired" boolean DEFAULT false,
    "is_near_expiry" boolean DEFAULT false,
    "near_expiry_threshold_days" integer DEFAULT 90,
    "purchase_price" numeric(10,2),
    "supplier_name" "text",
    "supplier_invoice_number" "text",
    "received_date" "date",
    "storage_location" "text",
    "requires_refrigeration" boolean DEFAULT false,
    "current_temperature" numeric(5,2),
    "last_temperature_check" timestamp with time zone,
    "quality_check_status" "text" DEFAULT 'pending'::"text",
    "quality_check_date" "date",
    "quality_check_by" "uuid",
    "recall_status" "text" DEFAULT 'none'::"text",
    "recall_notice" "text",
    "recall_date" "date",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "health_pharmacy_inventory_quality_check_status_check" CHECK (("quality_check_status" = ANY (ARRAY['pending'::"text", 'passed'::"text", 'failed'::"text", 'quarantine'::"text"]))),
    CONSTRAINT "health_pharmacy_inventory_recall_status_check" CHECK (("recall_status" = ANY (ARRAY['none'::"text", 'voluntary'::"text", 'mandatory'::"text", 'completed'::"text"]))),
    CONSTRAINT "valid_expiry" CHECK ((("expiry_date" > "manufacturing_date") OR ("manufacturing_date" IS NULL))),
    CONSTRAINT "valid_price" CHECK (("price" >= (0)::numeric)),
    CONSTRAINT "valid_quantity" CHECK (("quantity_in_stock" >= 0))
);


ALTER TABLE "public"."health_pharmacy_inventory" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."health_pharmacy_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "license_number" "text" NOT NULL,
    "location_address" "jsonb",
    "is_verified" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "pharmacy_name" "text",
    "license_document_url" "text",
    "phone" "text",
    "email" "text",
    "address_line1" "text",
    "address_line2" "text",
    "city" "text",
    "state" "text",
    "postal_code" "text",
    "country" "text" DEFAULT 'EG'::"text",
    "location_lat" numeric(10,8),
    "location_lng" numeric(11,8),
    "operating_hours" "jsonb" DEFAULT '{}'::"jsonb",
    "verification_status" "text" DEFAULT 'pending'::"text",
    "delivery_available" boolean DEFAULT false,
    "delivery_fee" numeric(10,2) DEFAULT 0,
    "min_order_for_delivery" numeric(10,2) DEFAULT 0,
    "bio" "text",
    "license_expiry_date" "date",
    "can_sell_prescription_medicines" boolean DEFAULT false,
    "can_sell_controlled_medicines" boolean DEFAULT false,
    "controlled_license_number" "text",
    "controlled_license_expiry" "date",
    "compliance_notes" "text",
    "last_inspection_date" "date",
    "next_inspection_date" "date"
);


ALTER TABLE "public"."health_pharmacy_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."health_prescription_medicines" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "prescription_id" "uuid" NOT NULL,
    "medicine_id" "uuid",
    "medicine_name" "text" NOT NULL,
    "dosage_instructions" "text" NOT NULL,
    "duration_days" integer,
    "quantity_prescribed" integer,
    "is_dispensed" boolean DEFAULT false,
    "dispensed_at" timestamp with time zone,
    "dispensed_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."health_prescription_medicines" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."health_prescriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "appointment_id" "uuid" NOT NULL,
    "medicine_name" "text" NOT NULL,
    "dosage_instructions" "text" NOT NULL,
    "duration_days" integer,
    "is_dispensed" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."health_prescriptions" OWNER TO "postgres";


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


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "content" "text",
    "message_type" "text" DEFAULT 'text'::"text",
    "attachment_url" "text",
    "attachment_name" "text",
    "attachment_size" bigint,
    "is_deleted" boolean DEFAULT false,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "content_tsvector" "tsvector",
    CONSTRAINT "messages_message_type_check" CHECK (("message_type" = ANY (ARRAY['text'::"text", 'image'::"text", 'file'::"text"])))
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


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


CREATE TABLE IF NOT EXISTS "public"."pharmacy_activity_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pharmacy_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "entity_type" "text",
    "entity_id" "uuid",
    "old_data" "jsonb",
    "new_data" "jsonb",
    "device_info" "text",
    "location_lat" double precision,
    "location_lng" double precision,
    "ip_address" "text",
    "is_success" boolean DEFAULT true,
    "error_message" "text",
    "duration_ms" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pharmacy_activity_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pharmacy_daily_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pharmacy_id" "uuid" NOT NULL,
    "report_date" "date" NOT NULL,
    "total_scans" integer DEFAULT 0,
    "total_sales" integer DEFAULT 0,
    "total_revenue" numeric(10,2) DEFAULT 0,
    "medicines_added" integer DEFAULT 0,
    "medicines_expired" integer DEFAULT 0,
    "low_stock_count" integer DEFAULT 0,
    "generated_at" timestamp with time zone DEFAULT "now"(),
    "report_data" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."pharmacy_daily_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pharmacy_medicine_inventory" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pharmacy_id" "uuid" NOT NULL,
    "medicine_id" "uuid",
    "product_id" "uuid",
    "qr_code" "text",
    "batch_number" "text" NOT NULL,
    "expiry_date" "date" NOT NULL,
    "manufacturing_date" "date",
    "price" numeric(10,2) NOT NULL,
    "currency" "text" DEFAULT 'EGP'::"text",
    "quantity_in_stock" integer DEFAULT 0,
    "quantity_reserved" integer DEFAULT 0,
    "quantity_available" integer GENERATED ALWAYS AS (("quantity_in_stock" - "quantity_reserved")) STORED,
    "is_available" boolean DEFAULT true,
    "is_expired" boolean DEFAULT false,
    "is_near_expiry" boolean DEFAULT false,
    "near_expiry_threshold_days" integer DEFAULT 90,
    "purchase_price" numeric(10,2),
    "supplier_name" "text",
    "supplier_invoice_number" "text",
    "received_date" "date",
    "storage_location" "text",
    "requires_refrigeration" boolean DEFAULT false,
    "current_temperature" double precision,
    "last_temperature_check" timestamp with time zone,
    "quality_check_status" "text" DEFAULT 'pending'::"text",
    "quality_check_date" "date",
    "quality_check_by" "uuid",
    "recall_status" "text" DEFAULT 'none'::"text",
    "recall_notice" "text",
    "recall_date" "date",
    "notes" "text",
    "last_scanned_at" timestamp with time zone,
    "scanned_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "pharmacy_medicine_inventory_quality_check_status_check" CHECK (("quality_check_status" = ANY (ARRAY['pending'::"text", 'passed'::"text", 'failed'::"text", 'quarantine'::"text"]))),
    CONSTRAINT "pharmacy_medicine_inventory_recall_status_check" CHECK (("recall_status" = ANY (ARRAY['none'::"text", 'voluntary'::"text", 'mandatory'::"text", 'completed'::"text"]))),
    CONSTRAINT "valid_expiry" CHECK ((("expiry_date" > "manufacturing_date") OR ("manufacturing_date" IS NULL))),
    CONSTRAINT "valid_price" CHECK (("price" >= (0)::numeric)),
    CONSTRAINT "valid_quantity" CHECK (("quantity_in_stock" >= 0))
);


ALTER TABLE "public"."pharmacy_medicine_inventory" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pharmacy_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "pharmacy_name" "text" NOT NULL,
    "license_number" "text" NOT NULL,
    "license_document_url" "text",
    "license_expiry_date" "date",
    "phone" "text" NOT NULL,
    "email" "text" NOT NULL,
    "address_line1" "text" NOT NULL,
    "address_line2" "text",
    "city" "text" NOT NULL,
    "state" "text",
    "postal_code" "text",
    "country" "text" DEFAULT 'EG'::"text",
    "location_lat" double precision,
    "location_lng" double precision,
    "operating_hours" "jsonb" DEFAULT '{}'::"jsonb",
    "is_verified" boolean DEFAULT false,
    "verification_status" "text" DEFAULT 'pending'::"text",
    "delivery_available" boolean DEFAULT false,
    "delivery_fee" numeric(10,2) DEFAULT 0,
    "min_order_for_delivery" numeric(10,2) DEFAULT 0,
    "can_sell_prescription_medicines" boolean DEFAULT false,
    "can_sell_controlled_medicines" boolean DEFAULT false,
    "controlled_license_number" "text",
    "controlled_license_expiry" "date",
    "bio" "text",
    "compliance_notes" "text",
    "last_inspection_date" "date",
    "next_inspection_date" "date",
    "qr_code_prefix" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "pharmacy_profiles_verification_status_check" CHECK (("verification_status" = ANY (ARRAY['pending'::"text", 'verified'::"text", 'rejected'::"text", 'suspended'::"text"])))
);


ALTER TABLE "public"."pharmacy_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pharmacy_qr_scan_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pharmacy_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "qr_code" "text" NOT NULL,
    "inventory_id" "uuid",
    "medicine_id" "uuid",
    "product_id" "uuid",
    "scan_type" "text",
    "scan_result" "text",
    "device_info" "text",
    "location_lat" double precision,
    "location_lng" double precision,
    "ip_address" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "pharmacy_qr_scan_logs_scan_result_check" CHECK (("scan_result" = ANY (ARRAY['success'::"text", 'not_found'::"text", 'expired'::"text", 'error'::"text"]))),
    CONSTRAINT "pharmacy_qr_scan_logs_scan_type_check" CHECK (("scan_type" = ANY (ARRAY['add'::"text", 'view'::"text", 'update'::"text", 'sell'::"text", 'return'::"text", 'audit'::"text"])))
);


ALTER TABLE "public"."pharmacy_qr_scan_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pharmacy_stock_movements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pharmacy_id" "uuid" NOT NULL,
    "inventory_id" "uuid" NOT NULL,
    "medicine_id" "uuid",
    "product_id" "uuid",
    "movement_type" "text" NOT NULL,
    "quantity_change" integer NOT NULL,
    "quantity_before" integer NOT NULL,
    "quantity_after" integer NOT NULL,
    "reference_id" "uuid",
    "reference_type" "text",
    "performed_by" "uuid",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "pharmacy_stock_movements_movement_type_check" CHECK (("movement_type" = ANY (ARRAY['receive'::"text", 'sell'::"text", 'return'::"text", 'adjustment'::"text", 'expiry'::"text", 'damage'::"text", 'recall'::"text", 'transfer'::"text"])))
);


ALTER TABLE "public"."pharmacy_stock_movements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."post_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "parent_comment_id" "uuid",
    "likes_count" integer DEFAULT 0,
    "is_deleted" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."post_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."post_likes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."post_likes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "seller_id" "uuid",
    "product_id" "uuid",
    "content" "text" NOT NULL,
    "media_urls" "jsonb" DEFAULT '[]'::"jsonb",
    "post_type" "text" DEFAULT 'announcement'::"text",
    "likes_count" integer DEFAULT 0,
    "comments_count" integer DEFAULT 0,
    "shares_count" integer DEFAULT 0,
    "is_deleted" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "posts_post_type_check" CHECK (("post_type" = ANY (ARRAY['announcement'::"text", 'product'::"text", 'update'::"text", 'promotion'::"text"])))
);


ALTER TABLE "public"."posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."provider_availability" (
    "provider_id" "uuid" NOT NULL,
    "day_of_week" smallint NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "is_available" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "provider_availability_day_of_week_check" CHECK ((("day_of_week" >= 0) AND ("day_of_week" <= 6)))
);


ALTER TABLE "public"."provider_availability" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."provider_time_off" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider_id" "uuid" NOT NULL,
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone NOT NULL,
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."provider_time_off" OWNER TO "postgres";


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
    "is_recurring" boolean DEFAULT false,
    "recurrence_pattern" "text",
    "recurrence_end_date" "date",
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
    "helpful_votes" integer DEFAULT 0,
    "is_flagged" boolean DEFAULT false,
    "provider_response" "text",
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


CREATE TABLE IF NOT EXISTS "public"."svc_listing_packages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "listing_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "price" numeric(10,2) NOT NULL,
    "delivery_days" integer,
    "revisions" integer,
    "features" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."svc_listing_packages" OWNER TO "postgres";


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
    "is_active" boolean DEFAULT true,
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
    "helpful_votes" integer DEFAULT 0,
    "is_flagged" boolean DEFAULT false,
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
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "preferred_language" "text" DEFAULT 'eg'::"text",
    "preferred_currency" "text" DEFAULT 'EGP'::"text",
    "theme_preference" "text" DEFAULT 'light'::"text",
    "sidebar_state" "jsonb" DEFAULT '{"collapsed": false}'::"jsonb"
);


ALTER TABLE "public"."users" OWNER TO "postgres";


COMMENT ON COLUMN "public"."users"."preferred_language" IS 'User preferred language code (e.g., en, ar, fr)';



COMMENT ON COLUMN "public"."users"."preferred_currency" IS 'User preferred currency code (e.g., USD, EUR, EGP)';



COMMENT ON COLUMN "public"."users"."theme_preference" IS 'User theme preference (light, dark, system)';



COMMENT ON COLUMN "public"."users"."sidebar_state" IS 'Sidebar UI state as JSONB';



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



ALTER TABLE ONLY "public"."booking_milestones"
    ADD CONSTRAINT "booking_milestones_pkey" PRIMARY KEY ("id");



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



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "conversation_participants_conversation_id_user_id_key" UNIQUE ("conversation_id", "user_id");



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");



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
    ADD CONSTRAINT "factories_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."factories"
    ADD CONSTRAINT "factories_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."factory_connections"
    ADD CONSTRAINT "factory_connections_factory_id_seller_id_key" UNIQUE ("factory_id", "seller_id");



ALTER TABLE ONLY "public"."factory_connections"
    ADD CONSTRAINT "factory_connections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."factory_production_logs"
    ADD CONSTRAINT "factory_production_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."factory_quotes"
    ADD CONSTRAINT "factory_quotes_pkey" PRIMARY KEY ("id");



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



ALTER TABLE ONLY "public"."health_appointments"
    ADD CONSTRAINT "health_appointments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."health_conversations"
    ADD CONSTRAINT "health_conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."health_daily_backup_status"
    ADD CONSTRAINT "health_daily_backup_status_doctor_id_backup_date_key" UNIQUE ("doctor_id", "backup_date");



ALTER TABLE ONLY "public"."health_daily_backup_status"
    ADD CONSTRAINT "health_daily_backup_status_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."health_doctor_profiles"
    ADD CONSTRAINT "health_doctor_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."health_medicine_categories"
    ADD CONSTRAINT "health_medicine_categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."health_medicine_categories"
    ADD CONSTRAINT "health_medicine_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."health_medicine_categories"
    ADD CONSTRAINT "health_medicine_categories_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."health_medicine_expiry_alerts"
    ADD CONSTRAINT "health_medicine_expiry_alerts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."health_medicine_order_items"
    ADD CONSTRAINT "health_medicine_order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."health_medicine_orders"
    ADD CONSTRAINT "health_medicine_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."health_medicine_recalls"
    ADD CONSTRAINT "health_medicine_recalls_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."health_medicine_recalls"
    ADD CONSTRAINT "health_medicine_recalls_recall_number_key" UNIQUE ("recall_number");



ALTER TABLE ONLY "public"."health_medicine_reviews"
    ADD CONSTRAINT "health_medicine_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."health_medicine_stock_history"
    ADD CONSTRAINT "health_medicine_stock_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."health_medicines_master"
    ADD CONSTRAINT "health_medicines_master_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."health_medicines"
    ADD CONSTRAINT "health_medicines_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."health_patient_access_log"
    ADD CONSTRAINT "health_patient_access_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."health_patient_archives"
    ADD CONSTRAINT "health_patient_archives_doctor_id_patient_id_backup_date_key" UNIQUE ("doctor_id", "patient_id", "backup_date");



ALTER TABLE ONLY "public"."health_patient_archives"
    ADD CONSTRAINT "health_patient_archives_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."health_patient_change_log"
    ADD CONSTRAINT "health_patient_change_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."health_patient_profiles"
    ADD CONSTRAINT "health_patient_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."health_pharmacy_inspections"
    ADD CONSTRAINT "health_pharmacy_inspections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."health_pharmacy_inventory"
    ADD CONSTRAINT "health_pharmacy_inventory_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."health_pharmacy_profiles"
    ADD CONSTRAINT "health_pharmacy_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."health_prescription_medicines"
    ADD CONSTRAINT "health_prescription_medicines_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."health_prescriptions"
    ADD CONSTRAINT "health_prescriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."idempotency_keys"
    ADD CONSTRAINT "idempotency_keys_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."idempotency_keys"
    ADD CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



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



ALTER TABLE ONLY "public"."pharmacy_activity_logs"
    ADD CONSTRAINT "pharmacy_activity_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pharmacy_daily_reports"
    ADD CONSTRAINT "pharmacy_daily_reports_pharmacy_id_report_date_key" UNIQUE ("pharmacy_id", "report_date");



ALTER TABLE ONLY "public"."pharmacy_daily_reports"
    ADD CONSTRAINT "pharmacy_daily_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pharmacy_medicine_inventory"
    ADD CONSTRAINT "pharmacy_medicine_inventory_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pharmacy_medicine_inventory"
    ADD CONSTRAINT "pharmacy_medicine_inventory_qr_code_key" UNIQUE ("qr_code");



ALTER TABLE ONLY "public"."pharmacy_profiles"
    ADD CONSTRAINT "pharmacy_profiles_license_number_key" UNIQUE ("license_number");



ALTER TABLE ONLY "public"."pharmacy_profiles"
    ADD CONSTRAINT "pharmacy_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pharmacy_profiles"
    ADD CONSTRAINT "pharmacy_profiles_qr_code_prefix_key" UNIQUE ("qr_code_prefix");



ALTER TABLE ONLY "public"."pharmacy_qr_scan_logs"
    ADD CONSTRAINT "pharmacy_qr_scan_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pharmacy_stock_movements"
    ADD CONSTRAINT "pharmacy_stock_movements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_comments"
    ADD CONSTRAINT "post_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_likes"
    ADD CONSTRAINT "post_likes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_likes"
    ADD CONSTRAINT "post_likes_post_id_user_id_key" UNIQUE ("post_id", "user_id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_asin_key" UNIQUE ("asin");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_asin_unique" UNIQUE ("asin");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."provider_availability"
    ADD CONSTRAINT "provider_availability_pkey" PRIMARY KEY ("provider_id", "day_of_week", "start_time");



ALTER TABLE ONLY "public"."provider_time_off"
    ADD CONSTRAINT "provider_time_off_pkey" PRIMARY KEY ("id");



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



ALTER TABLE ONLY "public"."svc_listing_packages"
    ADD CONSTRAINT "svc_listing_packages_pkey" PRIMARY KEY ("id");



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



CREATE INDEX "idx_access_log_date" ON "public"."health_patient_access_log" USING "btree" ("accessed_at");



CREATE INDEX "idx_access_log_doctor" ON "public"."health_patient_access_log" USING "btree" ("doctor_id");



CREATE INDEX "idx_access_log_patient" ON "public"."health_patient_access_log" USING "btree" ("patient_id");



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



CREATE INDEX "idx_backup_status_date" ON "public"."health_daily_backup_status" USING "btree" ("backup_date");



CREATE INDEX "idx_backup_status_doctor" ON "public"."health_daily_backup_status" USING "btree" ("doctor_id");



CREATE INDEX "idx_bookings_customer" ON "public"."service_bookings" USING "btree" ("customer_id");



CREATE INDEX "idx_bookings_provider" ON "public"."service_bookings" USING "btree" ("provider_id");



CREATE INDEX "idx_cart_asin" ON "public"."cart" USING "btree" ("asin");



CREATE INDEX "idx_cart_user_asin" ON "public"."cart" USING "btree" ("user_id", "asin");



CREATE INDEX "idx_cart_user_id" ON "public"."cart" USING "btree" ("user_id");



CREATE INDEX "idx_categories_parent" ON "public"."categories" USING "btree" ("parent_id");



CREATE INDEX "idx_categories_slug" ON "public"."categories" USING "btree" ("slug");



CREATE INDEX "idx_change_log_doctor" ON "public"."health_patient_change_log" USING "btree" ("doctor_id");



CREATE INDEX "idx_change_log_patient" ON "public"."health_patient_change_log" USING "btree" ("patient_id");



CREATE INDEX "idx_change_log_type" ON "public"."health_patient_change_log" USING "btree" ("change_type");



CREATE INDEX "idx_commissions_middle_man" ON "public"."commissions" USING "btree" ("middle_man_id");



CREATE INDEX "idx_commissions_status" ON "public"."commissions" USING "btree" ("status");



CREATE INDEX "idx_conversations_factory_id" ON "public"."conversations" USING "btree" ("factory_id");



CREATE INDEX "idx_conversations_product_id" ON "public"."conversations" USING "btree" ("product_id");



CREATE INDEX "idx_conversations_updated_at" ON "public"."conversations" USING "btree" ("updated_at" DESC);



CREATE INDEX "idx_customers_age_range" ON "public"."customers" USING "btree" ("age_range");



CREATE INDEX "idx_customers_seller_id" ON "public"."customers" USING "btree" ("seller_id");



CREATE INDEX "idx_customers_seller_total_spent" ON "public"."customers" USING "btree" ("user_id", "total_spent" DESC);



CREATE INDEX "idx_customers_user_id" ON "public"."customers" USING "btree" ("user_id");



CREATE INDEX "idx_daily_reports_pharmacy" ON "public"."pharmacy_daily_reports" USING "btree" ("pharmacy_id", "report_date" DESC);



CREATE INDEX "idx_delivery_location" ON "public"."delivery_profiles" USING "btree" ("latitude", "longitude") WHERE (("is_active" = true) AND ("is_verified" = true));



CREATE INDEX "idx_error_logs_user_id" ON "public"."error_logs" USING "btree" ("user_id");



CREATE INDEX "idx_factories_user_id" ON "public"."factories" USING "btree" ("user_id");



CREATE INDEX "idx_factory_connections_factory" ON "public"."factory_connections" USING "btree" ("factory_id");



CREATE INDEX "idx_factory_connections_seller" ON "public"."factory_connections" USING "btree" ("seller_id");



CREATE INDEX "idx_factory_connections_status" ON "public"."factory_connections" USING "btree" ("status");



CREATE INDEX "idx_factory_ratings_factory" ON "public"."factory_ratings" USING "btree" ("factory_id");



CREATE INDEX "idx_freelancer_profiles_skills" ON "public"."freelancer_profiles" USING "gin" ("skills");



CREATE INDEX "idx_freelancer_profiles_user_id" ON "public"."freelancer_profiles" USING "btree" ("user_id");



CREATE INDEX "idx_health_appt_doctor" ON "public"."health_appointments" USING "btree" ("doctor_id");



CREATE INDEX "idx_health_appt_patient" ON "public"."health_appointments" USING "btree" ("patient_id");



CREATE INDEX "idx_health_appt_status" ON "public"."health_appointments" USING "btree" ("status");



CREATE INDEX "idx_health_conversations_appointment" ON "public"."health_conversations" USING "btree" ("appointment_id");



CREATE INDEX "idx_health_expiry_alerts_pharmacy" ON "public"."health_medicine_expiry_alerts" USING "btree" ("pharmacy_id");



CREATE INDEX "idx_health_expiry_alerts_unresolved" ON "public"."health_medicine_expiry_alerts" USING "btree" ("pharmacy_id", "is_resolved") WHERE ("is_resolved" = false);



CREATE INDEX "idx_health_inventory_batch" ON "public"."health_pharmacy_inventory" USING "btree" ("pharmacy_id", "batch_number");



CREATE INDEX "idx_health_inventory_expired" ON "public"."health_pharmacy_inventory" USING "btree" ("is_expired") WHERE ("is_expired" = true);



CREATE INDEX "idx_health_inventory_expiry" ON "public"."health_pharmacy_inventory" USING "btree" ("expiry_date");



CREATE INDEX "idx_health_inventory_medicine" ON "public"."health_pharmacy_inventory" USING "btree" ("medicine_id");



CREATE INDEX "idx_health_inventory_near_expiry" ON "public"."health_pharmacy_inventory" USING "btree" ("is_near_expiry") WHERE ("is_near_expiry" = true);



CREATE INDEX "idx_health_inventory_pharmacy" ON "public"."health_pharmacy_inventory" USING "btree" ("pharmacy_id");



CREATE INDEX "idx_health_medicine_available" ON "public"."health_medicines" USING "btree" ("is_available");



CREATE INDEX "idx_health_medicine_category" ON "public"."health_medicines" USING "btree" ("category");



CREATE INDEX "idx_health_medicine_master_category" ON "public"."health_medicines_master" USING "btree" ("category");



CREATE INDEX "idx_health_medicine_master_prescription" ON "public"."health_medicines_master" USING "btree" ("requires_prescription");



CREATE INDEX "idx_health_medicine_master_search" ON "public"."health_medicines_master" USING "gin" ("to_tsvector"('"english"'::"regconfig", ((((COALESCE("name", ''::"text") || ' '::"text") || COALESCE("generic_name", ''::"text")) || ' '::"text") || COALESCE("brand", ''::"text"))));



CREATE INDEX "idx_health_medicine_order_patient" ON "public"."health_medicine_orders" USING "btree" ("patient_id");



CREATE INDEX "idx_health_medicine_order_pharmacy" ON "public"."health_medicine_orders" USING "btree" ("pharmacy_id");



CREATE INDEX "idx_health_medicine_order_prescription" ON "public"."health_medicine_orders" USING "btree" ("prescription_id");



CREATE INDEX "idx_health_medicine_order_status" ON "public"."health_medicine_orders" USING "btree" ("status");



CREATE INDEX "idx_health_medicine_pharmacy" ON "public"."health_medicines" USING "btree" ("pharmacy_id");



CREATE INDEX "idx_health_medicine_prescription" ON "public"."health_medicines" USING "btree" ("requires_prescription");



CREATE INDEX "idx_health_medicine_search" ON "public"."health_medicines" USING "gin" ("to_tsvector"('"english"'::"regconfig", ((((COALESCE("name", ''::"text") || ' '::"text") || COALESCE("generic_name", ''::"text")) || ' '::"text") || COALESCE("brand", ''::"text"))));



CREATE INDEX "idx_health_pharmacy_city" ON "public"."health_pharmacy_profiles" USING "btree" ("city");



CREATE INDEX "idx_health_pharmacy_license_expiry" ON "public"."health_pharmacy_profiles" USING "btree" ("license_expiry_date");



CREATE INDEX "idx_health_pharmacy_user" ON "public"."health_pharmacy_profiles" USING "btree" ("user_id");



CREATE INDEX "idx_health_pharmacy_verified" ON "public"."health_pharmacy_profiles" USING "btree" ("is_verified");



CREATE INDEX "idx_health_stock_history_medicine" ON "public"."health_medicine_stock_history" USING "btree" ("medicine_id");



CREATE INDEX "idx_health_stock_history_pharmacy" ON "public"."health_medicine_stock_history" USING "btree" ("pharmacy_id");



CREATE INDEX "idx_idempotency_keys_expires" ON "public"."idempotency_keys" USING "btree" ("expires_at");



CREATE INDEX "idx_idempotency_keys_key" ON "public"."idempotency_keys" USING "btree" ("key");



CREATE INDEX "idx_location_history_user_id" ON "public"."location_history" USING "btree" ("user_id");



CREATE INDEX "idx_messages_conversation_created" ON "public"."messages" USING "btree" ("conversation_id", "created_at" DESC);



CREATE INDEX "idx_messages_conversation_id" ON "public"."messages" USING "btree" ("conversation_id", "created_at" DESC);



CREATE INDEX "idx_messages_read_at" ON "public"."messages" USING "btree" ("read_at") WHERE ("read_at" IS NULL);



CREATE INDEX "idx_messages_search" ON "public"."messages" USING "gin" ("content_tsvector");



CREATE INDEX "idx_messages_sender_id" ON "public"."messages" USING "btree" ("sender_id");



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



CREATE INDEX "idx_participants_conversation_id" ON "public"."conversation_participants" USING "btree" ("conversation_id");



CREATE INDEX "idx_participants_user_id" ON "public"."conversation_participants" USING "btree" ("user_id");



CREATE INDEX "idx_patient_archives_date" ON "public"."health_patient_archives" USING "btree" ("backup_date");



CREATE INDEX "idx_patient_archives_doctor" ON "public"."health_patient_archives" USING "btree" ("doctor_id");



CREATE INDEX "idx_patient_archives_patient" ON "public"."health_patient_archives" USING "btree" ("patient_id");



CREATE INDEX "idx_patient_archives_sync" ON "public"."health_patient_archives" USING "btree" ("is_synced") WHERE ("is_synced" = false);



CREATE INDEX "idx_pharmacy_activity_action" ON "public"."pharmacy_activity_logs" USING "btree" ("action");



CREATE INDEX "idx_pharmacy_activity_created" ON "public"."pharmacy_activity_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_pharmacy_activity_pharmacy" ON "public"."pharmacy_activity_logs" USING "btree" ("pharmacy_id");



CREATE INDEX "idx_pharmacy_activity_user" ON "public"."pharmacy_activity_logs" USING "btree" ("user_id");



CREATE INDEX "idx_pharmacy_inventory_available" ON "public"."pharmacy_medicine_inventory" USING "btree" ("is_available") WHERE ("is_available" = true);



CREATE INDEX "idx_pharmacy_inventory_expiry" ON "public"."pharmacy_medicine_inventory" USING "btree" ("expiry_date");



CREATE INDEX "idx_pharmacy_inventory_pharmacy" ON "public"."pharmacy_medicine_inventory" USING "btree" ("pharmacy_id");



CREATE INDEX "idx_pharmacy_inventory_product" ON "public"."pharmacy_medicine_inventory" USING "btree" ("product_id");



CREATE INDEX "idx_pharmacy_inventory_qr" ON "public"."pharmacy_medicine_inventory" USING "btree" ("qr_code");



CREATE INDEX "idx_pharmacy_profiles_location" ON "public"."pharmacy_profiles" USING "btree" ("location_lat", "location_lng");



CREATE INDEX "idx_pharmacy_profiles_location_lat" ON "public"."pharmacy_profiles" USING "btree" ("location_lat");



CREATE INDEX "idx_pharmacy_profiles_location_lng" ON "public"."pharmacy_profiles" USING "btree" ("location_lng");



CREATE INDEX "idx_pharmacy_profiles_user" ON "public"."pharmacy_profiles" USING "btree" ("user_id");



CREATE INDEX "idx_pharmacy_profiles_verified" ON "public"."pharmacy_profiles" USING "btree" ("is_verified");



CREATE INDEX "idx_post_comments_post_id" ON "public"."post_comments" USING "btree" ("post_id");



CREATE INDEX "idx_post_likes_post_id" ON "public"."post_likes" USING "btree" ("post_id");



CREATE INDEX "idx_posts_created_at" ON "public"."posts" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_posts_product_id" ON "public"."posts" USING "btree" ("product_id");



CREATE INDEX "idx_posts_seller_id" ON "public"."posts" USING "btree" ("seller_id");



CREATE INDEX "idx_posts_user_id" ON "public"."posts" USING "btree" ("user_id");



CREATE INDEX "idx_products_attributes" ON "public"."products" USING "gin" ("attributes");



CREATE INDEX "idx_products_brand" ON "public"."products" USING "btree" ("brand");



CREATE INDEX "idx_products_category" ON "public"."products" USING "btree" ("category");



CREATE INDEX "idx_products_created_at" ON "public"."products" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_products_price" ON "public"."products" USING "btree" ("price");



CREATE INDEX "idx_products_search" ON "public"."products" USING "gin" ("title_description");



CREATE INDEX "idx_products_seller_id" ON "public"."products" USING "btree" ("seller_id");



CREATE INDEX "idx_products_status" ON "public"."products" USING "btree" ("status");



CREATE INDEX "idx_products_subcategory" ON "public"."products" USING "btree" ("subcategory");



CREATE INDEX "idx_qr_scan_logs_created" ON "public"."pharmacy_qr_scan_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_qr_scan_logs_pharmacy" ON "public"."pharmacy_qr_scan_logs" USING "btree" ("pharmacy_id");



CREATE INDEX "idx_qr_scan_logs_qr" ON "public"."pharmacy_qr_scan_logs" USING "btree" ("qr_code");



CREATE INDEX "idx_qr_scan_logs_user" ON "public"."pharmacy_qr_scan_logs" USING "btree" ("user_id");



CREATE INDEX "idx_reviews_asin" ON "public"."reviews" USING "btree" ("asin");



CREATE INDEX "idx_reviews_user_id" ON "public"."reviews" USING "btree" ("user_id");



CREATE INDEX "idx_sellers_location" ON "public"."sellers" USING "btree" ("latitude", "longitude");



CREATE INDEX "idx_service_bookings_customer_id" ON "public"."service_bookings" USING "btree" ("customer_id");



CREATE INDEX "idx_service_bookings_listing_id" ON "public"."service_bookings" USING "btree" ("listing_id");



CREATE INDEX "idx_service_bookings_provider_id" ON "public"."service_bookings" USING "btree" ("provider_id");



CREATE INDEX "idx_service_gigs_category" ON "public"."service_gigs" USING "btree" ("category_id");



CREATE INDEX "idx_service_gigs_freelancer_id" ON "public"."service_gigs" USING "btree" ("freelancer_id");



CREATE INDEX "idx_service_gigs_status" ON "public"."service_gigs" USING "btree" ("status");



CREATE INDEX "idx_service_listings_category_slug" ON "public"."service_listings" USING "btree" ("category_slug");



CREATE INDEX "idx_service_listings_provider_id" ON "public"."service_listings" USING "btree" ("provider_id");



CREATE INDEX "idx_service_orders_buyer" ON "public"."service_orders" USING "btree" ("buyer_id");



CREATE INDEX "idx_service_orders_freelancer" ON "public"."service_orders" USING "btree" ("freelancer_id");



CREATE INDEX "idx_service_orders_status" ON "public"."service_orders" USING "btree" ("status");



CREATE INDEX "idx_services_conversations_client" ON "public"."services_conversations" USING "btree" ("client_id");



CREATE INDEX "idx_services_conversations_client_id" ON "public"."services_conversations" USING "btree" ("client_id");



CREATE INDEX "idx_services_conversations_provider" ON "public"."services_conversations" USING "btree" ("provider_id");



CREATE INDEX "idx_services_conversations_provider_id" ON "public"."services_conversations" USING "btree" ("provider_id");



CREATE INDEX "idx_stock_movements_inventory" ON "public"."pharmacy_stock_movements" USING "btree" ("inventory_id");



CREATE INDEX "idx_stock_movements_pharmacy" ON "public"."pharmacy_stock_movements" USING "btree" ("pharmacy_id");



CREATE INDEX "idx_stock_movements_type" ON "public"."pharmacy_stock_movements" USING "btree" ("movement_type");



CREATE INDEX "idx_subcategories_category" ON "public"."subcategories" USING "btree" ("category_id");



CREATE INDEX "idx_svc_bookings_customer" ON "public"."service_bookings" USING "btree" ("customer_id");



CREATE INDEX "idx_svc_bookings_provider" ON "public"."service_bookings" USING "btree" ("provider_id");



CREATE INDEX "idx_svc_categories_active" ON "public"."svc_categories" USING "btree" ("is_active");



CREATE INDEX "idx_svc_conv_client" ON "public"."services_conversations" USING "btree" ("client_id");



CREATE INDEX "idx_svc_conv_listing" ON "public"."services_conversations" USING "btree" ("listing_id");



CREATE INDEX "idx_svc_conv_provider" ON "public"."services_conversations" USING "btree" ("provider_id");



CREATE INDEX "idx_svc_conv_updated" ON "public"."services_conversations" USING "btree" ("updated_at" DESC);



CREATE INDEX "idx_svc_listings_active" ON "public"."svc_listings" USING "btree" ("is_active");



CREATE INDEX "idx_svc_listings_category" ON "public"."svc_listings" USING "btree" ("category_id");



CREATE INDEX "idx_svc_listings_category_id" ON "public"."svc_listings" USING "btree" ("category_id");



CREATE INDEX "idx_svc_listings_provider" ON "public"."service_listings" USING "btree" ("provider_id");



CREATE INDEX "idx_svc_listings_provider_id" ON "public"."svc_listings" USING "btree" ("provider_id");



CREATE INDEX "idx_svc_listings_status" ON "public"."svc_listings" USING "btree" ("status");



CREATE INDEX "idx_svc_listings_type" ON "public"."svc_listings" USING "btree" ("listing_type");



CREATE INDEX "idx_svc_orders_listing_id" ON "public"."svc_orders" USING "btree" ("listing_id");



CREATE INDEX "idx_svc_orders_provider" ON "public"."svc_orders" USING "btree" ("provider_id");



CREATE INDEX "idx_svc_orders_provider_id" ON "public"."svc_orders" USING "btree" ("provider_id");



CREATE INDEX "idx_svc_orders_status" ON "public"."svc_orders" USING "btree" ("status");



CREATE INDEX "idx_svc_orders_user" ON "public"."svc_orders" USING "btree" ("user_id");



CREATE INDEX "idx_svc_orders_user_id" ON "public"."svc_orders" USING "btree" ("user_id");



CREATE INDEX "idx_svc_packages_listing_id" ON "public"."svc_listing_packages" USING "btree" ("listing_id");



CREATE INDEX "idx_svc_providers_location" ON "public"."svc_providers" USING "btree" ("location_city");



CREATE INDEX "idx_svc_providers_specialties" ON "public"."svc_providers" USING "gin" ("specialties");



CREATE INDEX "idx_svc_providers_status" ON "public"."svc_providers" USING "btree" ("status");



CREATE INDEX "idx_svc_providers_type" ON "public"."svc_providers" USING "btree" ("provider_type");



CREATE INDEX "idx_svc_providers_user" ON "public"."service_providers" USING "btree" ("user_id");



CREATE INDEX "idx_trading_conv_initiator" ON "public"."trading_conversations" USING "btree" ("initiator_id");



CREATE INDEX "idx_trading_conv_product" ON "public"."trading_conversations" USING "btree" ("product_id");



CREATE INDEX "idx_trading_conv_receiver" ON "public"."trading_conversations" USING "btree" ("receiver_id");



CREATE INDEX "idx_trading_conv_updated" ON "public"."trading_conversations" USING "btree" ("updated_at" DESC);



CREATE INDEX "idx_trading_conversations_initiator" ON "public"."trading_conversations" USING "btree" ("initiator_id");



CREATE INDEX "idx_trading_conversations_receiver" ON "public"."trading_conversations" USING "btree" ("receiver_id");



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



CREATE OR REPLACE TRIGGER "trigger_svc_rating" AFTER INSERT ON "public"."svc_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_svc_provider_rating"();



CREATE OR REPLACE TRIGGER "trigger_svc_stats" AFTER UPDATE ON "public"."svc_orders" FOR EACH ROW EXECUTE FUNCTION "public"."update_svc_provider_stats"();



CREATE OR REPLACE TRIGGER "trigger_update_factory_connections_timestamp" BEFORE UPDATE ON "public"."factory_connections" FOR EACH ROW EXECUTE FUNCTION "public"."update_factory_connections_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_update_freelancer_rating" AFTER INSERT OR UPDATE ON "public"."service_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_freelancer_rating"();



CREATE OR REPLACE TRIGGER "trigger_update_freelancer_stats_on_completion" AFTER UPDATE ON "public"."service_orders" FOR EACH ROW EXECUTE FUNCTION "public"."update_freelancer_stats_on_completion"();



CREATE OR REPLACE TRIGGER "trigger_update_patient_visits" AFTER UPDATE ON "public"."health_appointments" FOR EACH ROW EXECUTE FUNCTION "public"."update_patient_visit_count"();



CREATE OR REPLACE TRIGGER "trigger_update_post_comments" AFTER INSERT OR DELETE ON "public"."post_comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_post_comments_count"();



CREATE OR REPLACE TRIGGER "trigger_update_post_likes" AFTER INSERT OR DELETE ON "public"."post_likes" FOR EACH ROW EXECUTE FUNCTION "public"."update_post_likes_count"();



CREATE OR REPLACE TRIGGER "update_health_appt_timestamp" BEFORE UPDATE ON "public"."health_appointments" FOR EACH ROW EXECUTE FUNCTION "public"."update_health_timestamps"();



CREATE OR REPLACE TRIGGER "update_health_conv_timestamp" BEFORE UPDATE ON "public"."health_conversations" FOR EACH ROW EXECUTE FUNCTION "public"."update_health_timestamps"();



CREATE OR REPLACE TRIGGER "update_health_doctor_timestamp" BEFORE UPDATE ON "public"."health_doctor_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_health_timestamps"();



CREATE OR REPLACE TRIGGER "update_health_medicine_order_timestamp" BEFORE UPDATE ON "public"."health_medicine_orders" FOR EACH ROW EXECUTE FUNCTION "public"."update_health_pharmacy_timestamp"();



CREATE OR REPLACE TRIGGER "update_health_medicine_timestamp" BEFORE UPDATE ON "public"."health_medicines" FOR EACH ROW EXECUTE FUNCTION "public"."update_health_pharmacy_timestamp"();



CREATE OR REPLACE TRIGGER "update_health_patient_timestamp" BEFORE UPDATE ON "public"."health_patient_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_health_timestamps"();



CREATE OR REPLACE TRIGGER "update_health_pharmacy_timestamp" BEFORE UPDATE ON "public"."health_pharmacy_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_health_pharmacy_timestamp"();



CREATE OR REPLACE TRIGGER "update_medicine_expiry_status_trigger" BEFORE INSERT OR UPDATE ON "public"."pharmacy_medicine_inventory" FOR EACH ROW EXECUTE FUNCTION "public"."update_medicine_expiry_status"();



CREATE OR REPLACE TRIGGER "update_medicine_rating_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."health_medicine_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_medicine_rating"();



CREATE OR REPLACE TRIGGER "update_medicine_stock_on_order_trigger" AFTER INSERT ON "public"."health_medicine_order_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_medicine_stock_on_order"();



CREATE OR REPLACE TRIGGER "update_order_status_timestamps" BEFORE UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."update_order_status_timestamps"();



CREATE OR REPLACE TRIGGER "update_pharmacy_inventory_updated_at" BEFORE UPDATE ON "public"."pharmacy_medicine_inventory" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_pharmacy_profiles_updated_at" BEFORE UPDATE ON "public"."pharmacy_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_svc_conv_timestamp" BEFORE UPDATE ON "public"."services_conversations" FOR EACH ROW EXECUTE FUNCTION "public"."update_svc_timestamps"();



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."analytics"
    ADD CONSTRAINT "analytics_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."analytics_snapshots"
    ADD CONSTRAINT "analytics_snapshots_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."booking_milestones"
    ADD CONSTRAINT "booking_milestones_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."service_bookings"("id") ON DELETE CASCADE;



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



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "conversation_participants_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "conversation_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_factory_id_fkey" FOREIGN KEY ("factory_id") REFERENCES "public"."factories"("user_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE SET NULL;



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
    ADD CONSTRAINT "factories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."factory_connections"
    ADD CONSTRAINT "factory_connections_factory_id_fkey" FOREIGN KEY ("factory_id") REFERENCES "public"."sellers"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."factory_connections"
    ADD CONSTRAINT "factory_connections_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."factory_production_logs"
    ADD CONSTRAINT "factory_production_logs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."factory_production_logs"
    ADD CONSTRAINT "factory_production_logs_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id");



ALTER TABLE ONLY "public"."factory_quotes"
    ADD CONSTRAINT "factory_quotes_factory_id_fkey" FOREIGN KEY ("factory_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."factory_quotes"
    ADD CONSTRAINT "factory_quotes_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id");



ALTER TABLE ONLY "public"."factory_quotes"
    ADD CONSTRAINT "factory_quotes_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."factory_ratings"
    ADD CONSTRAINT "factory_ratings_factory_id_fkey" FOREIGN KEY ("factory_id") REFERENCES "public"."sellers"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."factory_ratings"
    ADD CONSTRAINT "factory_ratings_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."freelancer_portfolio"
    ADD CONSTRAINT "freelancer_portfolio_freelancer_id_fkey" FOREIGN KEY ("freelancer_id") REFERENCES "public"."freelancer_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."freelancer_profiles"
    ADD CONSTRAINT "freelancer_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."health_appointments"
    ADD CONSTRAINT "health_appointments_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "public"."health_doctor_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."health_appointments"
    ADD CONSTRAINT "health_appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."health_patient_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."health_conversations"
    ADD CONSTRAINT "health_conversations_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "public"."health_appointments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."health_daily_backup_status"
    ADD CONSTRAINT "health_daily_backup_status_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "public"."health_doctor_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."health_doctor_profiles"
    ADD CONSTRAINT "health_doctor_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."health_medicine_categories"
    ADD CONSTRAINT "health_medicine_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."health_medicine_categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."health_medicine_expiry_alerts"
    ADD CONSTRAINT "health_medicine_expiry_alerts_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "public"."health_pharmacy_inventory"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."health_medicine_expiry_alerts"
    ADD CONSTRAINT "health_medicine_expiry_alerts_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "public"."health_medicines_master"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."health_medicine_expiry_alerts"
    ADD CONSTRAINT "health_medicine_expiry_alerts_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."health_pharmacy_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."health_medicine_expiry_alerts"
    ADD CONSTRAINT "health_medicine_expiry_alerts_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."health_medicine_order_items"
    ADD CONSTRAINT "health_medicine_order_items_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "public"."health_medicines"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."health_medicine_order_items"
    ADD CONSTRAINT "health_medicine_order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."health_medicine_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."health_medicine_order_items"
    ADD CONSTRAINT "health_medicine_order_items_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "public"."health_prescriptions"("id");



ALTER TABLE ONLY "public"."health_medicine_orders"
    ADD CONSTRAINT "health_medicine_orders_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."health_patient_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."health_medicine_orders"
    ADD CONSTRAINT "health_medicine_orders_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."health_pharmacy_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."health_medicine_orders"
    ADD CONSTRAINT "health_medicine_orders_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "public"."health_prescriptions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."health_medicine_recalls"
    ADD CONSTRAINT "health_medicine_recalls_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."health_medicine_recalls"
    ADD CONSTRAINT "health_medicine_recalls_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "public"."health_medicines_master"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."health_medicine_reviews"
    ADD CONSTRAINT "health_medicine_reviews_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "public"."health_medicines"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."health_medicine_reviews"
    ADD CONSTRAINT "health_medicine_reviews_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."health_medicine_orders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."health_medicine_reviews"
    ADD CONSTRAINT "health_medicine_reviews_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."health_patient_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."health_medicine_stock_history"
    ADD CONSTRAINT "health_medicine_stock_history_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."health_medicine_stock_history"
    ADD CONSTRAINT "health_medicine_stock_history_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "public"."health_medicines"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."health_medicine_stock_history"
    ADD CONSTRAINT "health_medicine_stock_history_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."health_pharmacy_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."health_medicines_master"
    ADD CONSTRAINT "health_medicines_master_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."health_medicines"
    ADD CONSTRAINT "health_medicines_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."health_pharmacy_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."health_patient_access_log"
    ADD CONSTRAINT "health_patient_access_log_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "public"."health_doctor_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."health_patient_access_log"
    ADD CONSTRAINT "health_patient_access_log_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."health_patient_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."health_patient_archives"
    ADD CONSTRAINT "health_patient_archives_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "public"."health_doctor_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."health_patient_archives"
    ADD CONSTRAINT "health_patient_archives_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."health_patient_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."health_patient_change_log"
    ADD CONSTRAINT "health_patient_change_log_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."health_patient_change_log"
    ADD CONSTRAINT "health_patient_change_log_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "public"."health_doctor_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."health_patient_change_log"
    ADD CONSTRAINT "health_patient_change_log_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."health_patient_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."health_patient_profiles"
    ADD CONSTRAINT "health_patient_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."health_pharmacy_inspections"
    ADD CONSTRAINT "health_pharmacy_inspections_inspector_id_fkey" FOREIGN KEY ("inspector_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."health_pharmacy_inspections"
    ADD CONSTRAINT "health_pharmacy_inspections_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."health_pharmacy_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."health_pharmacy_inventory"
    ADD CONSTRAINT "health_pharmacy_inventory_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "public"."health_medicines_master"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."health_pharmacy_inventory"
    ADD CONSTRAINT "health_pharmacy_inventory_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."health_pharmacy_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."health_pharmacy_inventory"
    ADD CONSTRAINT "health_pharmacy_inventory_quality_check_by_fkey" FOREIGN KEY ("quality_check_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."health_pharmacy_profiles"
    ADD CONSTRAINT "health_pharmacy_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."health_prescription_medicines"
    ADD CONSTRAINT "health_prescription_medicines_dispensed_by_fkey" FOREIGN KEY ("dispensed_by") REFERENCES "public"."health_pharmacy_profiles"("id");



ALTER TABLE ONLY "public"."health_prescription_medicines"
    ADD CONSTRAINT "health_prescription_medicines_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "public"."health_medicines"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."health_prescription_medicines"
    ADD CONSTRAINT "health_prescription_medicines_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "public"."health_prescriptions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."health_prescriptions"
    ADD CONSTRAINT "health_prescriptions_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "public"."health_appointments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



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



ALTER TABLE ONLY "public"."pharmacy_activity_logs"
    ADD CONSTRAINT "pharmacy_activity_logs_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacy_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pharmacy_activity_logs"
    ADD CONSTRAINT "pharmacy_activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pharmacy_daily_reports"
    ADD CONSTRAINT "pharmacy_daily_reports_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacy_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pharmacy_medicine_inventory"
    ADD CONSTRAINT "pharmacy_medicine_inventory_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacy_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pharmacy_medicine_inventory"
    ADD CONSTRAINT "pharmacy_medicine_inventory_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."pharmacy_medicine_inventory"
    ADD CONSTRAINT "pharmacy_medicine_inventory_quality_check_by_fkey" FOREIGN KEY ("quality_check_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."pharmacy_medicine_inventory"
    ADD CONSTRAINT "pharmacy_medicine_inventory_scanned_by_fkey" FOREIGN KEY ("scanned_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."pharmacy_profiles"
    ADD CONSTRAINT "pharmacy_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pharmacy_qr_scan_logs"
    ADD CONSTRAINT "pharmacy_qr_scan_logs_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "public"."pharmacy_medicine_inventory"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."pharmacy_qr_scan_logs"
    ADD CONSTRAINT "pharmacy_qr_scan_logs_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacy_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pharmacy_qr_scan_logs"
    ADD CONSTRAINT "pharmacy_qr_scan_logs_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."pharmacy_qr_scan_logs"
    ADD CONSTRAINT "pharmacy_qr_scan_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pharmacy_stock_movements"
    ADD CONSTRAINT "pharmacy_stock_movements_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "public"."pharmacy_medicine_inventory"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pharmacy_stock_movements"
    ADD CONSTRAINT "pharmacy_stock_movements_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."pharmacy_stock_movements"
    ADD CONSTRAINT "pharmacy_stock_movements_pharmacy_id_fkey" FOREIGN KEY ("pharmacy_id") REFERENCES "public"."pharmacy_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pharmacy_stock_movements"
    ADD CONSTRAINT "pharmacy_stock_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."post_comments"
    ADD CONSTRAINT "post_comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."post_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_comments"
    ADD CONSTRAINT "post_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_comments"
    ADD CONSTRAINT "post_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_likes"
    ADD CONSTRAINT "post_likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_likes"
    ADD CONSTRAINT "post_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."provider_availability"
    ADD CONSTRAINT "provider_availability_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."service_providers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."provider_time_off"
    ADD CONSTRAINT "provider_time_off_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."service_providers"("id") ON DELETE CASCADE;



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



ALTER TABLE ONLY "public"."shipping_addresses"
    ADD CONSTRAINT "shipping_addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subcategories"
    ADD CONSTRAINT "subcategories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."svc_listing_packages"
    ADD CONSTRAINT "svc_listing_packages_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."svc_listings"("id") ON DELETE CASCADE;



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



CREATE POLICY "Chat insert participants" ON "public"."health_conversations" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."health_appointments"
  WHERE (("health_appointments"."id" = "health_conversations"."appointment_id") AND (("health_appointments"."doctor_id" = "auth"."uid"()) OR ("health_appointments"."patient_id" = "auth"."uid"()))))));



CREATE POLICY "Chat view participants" ON "public"."health_conversations" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."health_appointments"
  WHERE (("health_appointments"."id" = "health_conversations"."appointment_id") AND (("health_appointments"."doctor_id" = "auth"."uid"()) OR ("health_appointments"."patient_id" = "auth"."uid"()))))));



CREATE POLICY "Doctors insert own access log" ON "public"."health_patient_access_log" FOR INSERT TO "authenticated" WITH CHECK (("doctor_id" IN ( SELECT "health_doctor_profiles"."id"
   FROM "public"."health_doctor_profiles"
  WHERE ("health_doctor_profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "Doctors insert own change log" ON "public"."health_patient_change_log" FOR INSERT TO "authenticated" WITH CHECK (("doctor_id" IN ( SELECT "health_doctor_profiles"."id"
   FROM "public"."health_doctor_profiles"
  WHERE ("health_doctor_profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "Doctors insert own patient archives" ON "public"."health_patient_archives" FOR INSERT TO "authenticated" WITH CHECK (("doctor_id" IN ( SELECT "health_doctor_profiles"."id"
   FROM "public"."health_doctor_profiles"
  WHERE ("health_doctor_profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "Doctors manage own profile" ON "public"."health_doctor_profiles" TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Doctors update own appointments" ON "public"."health_appointments" FOR UPDATE TO "authenticated" USING (("doctor_id" = "auth"."uid"()));



CREATE POLICY "Doctors view own access log" ON "public"."health_patient_access_log" FOR SELECT TO "authenticated" USING (("doctor_id" IN ( SELECT "health_doctor_profiles"."id"
   FROM "public"."health_doctor_profiles"
  WHERE ("health_doctor_profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "Doctors view own appointments" ON "public"."health_appointments" FOR SELECT TO "authenticated" USING (("doctor_id" = "auth"."uid"()));



CREATE POLICY "Doctors view own backup status" ON "public"."health_daily_backup_status" FOR SELECT TO "authenticated" USING (("doctor_id" IN ( SELECT "health_doctor_profiles"."id"
   FROM "public"."health_doctor_profiles"
  WHERE ("health_doctor_profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "Doctors view own change log" ON "public"."health_patient_change_log" FOR SELECT TO "authenticated" USING (("doctor_id" IN ( SELECT "health_doctor_profiles"."id"
   FROM "public"."health_doctor_profiles"
  WHERE ("health_doctor_profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "Doctors view own patient archives" ON "public"."health_patient_archives" FOR SELECT TO "authenticated" USING (("doctor_id" IN ( SELECT "health_doctor_profiles"."id"
   FROM "public"."health_doctor_profiles"
  WHERE ("health_doctor_profiles"."user_id" = "auth"."uid"()))));



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



CREATE POLICY "Patients manage own profile" ON "public"."health_patient_profiles" TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Patients view own appointments" ON "public"."health_appointments" FOR SELECT TO "authenticated" USING (("patient_id" = "auth"."uid"()));



CREATE POLICY "Pharmacies insert own activity logs" ON "public"."pharmacy_activity_logs" FOR INSERT TO "authenticated" WITH CHECK (("pharmacy_id" IN ( SELECT "pharmacy_profiles"."id"
   FROM "public"."pharmacy_profiles"
  WHERE ("pharmacy_profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "Pharmacies insert own scan logs" ON "public"."pharmacy_qr_scan_logs" FOR INSERT TO "authenticated" WITH CHECK (("pharmacy_id" IN ( SELECT "pharmacy_profiles"."id"
   FROM "public"."pharmacy_profiles"
  WHERE ("pharmacy_profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "Pharmacies insert own stock movements" ON "public"."pharmacy_stock_movements" FOR INSERT TO "authenticated" WITH CHECK (("pharmacy_id" IN ( SELECT "pharmacy_profiles"."id"
   FROM "public"."pharmacy_profiles"
  WHERE ("pharmacy_profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "Pharmacies manage own inventory" ON "public"."pharmacy_medicine_inventory" TO "authenticated" USING (("pharmacy_id" IN ( SELECT "pharmacy_profiles"."id"
   FROM "public"."pharmacy_profiles"
  WHERE ("pharmacy_profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "Pharmacies manage own medicines" ON "public"."health_medicines" TO "authenticated" USING (("pharmacy_id" IN ( SELECT "health_pharmacy_profiles"."id"
   FROM "public"."health_pharmacy_profiles"
  WHERE ("health_pharmacy_profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "Pharmacies manage own profile" ON "public"."health_pharmacy_profiles" TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Pharmacies update own medicine orders" ON "public"."health_medicine_orders" FOR UPDATE TO "authenticated" USING (("pharmacy_id" IN ( SELECT "health_pharmacy_profiles"."id"
   FROM "public"."health_pharmacy_profiles"
  WHERE ("health_pharmacy_profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "Pharmacies view own activity logs" ON "public"."pharmacy_activity_logs" FOR SELECT TO "authenticated" USING (("pharmacy_id" IN ( SELECT "pharmacy_profiles"."id"
   FROM "public"."pharmacy_profiles"
  WHERE ("pharmacy_profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "Pharmacies view own daily reports" ON "public"."pharmacy_daily_reports" FOR SELECT TO "authenticated" USING (("pharmacy_id" IN ( SELECT "pharmacy_profiles"."id"
   FROM "public"."pharmacy_profiles"
  WHERE ("pharmacy_profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "Pharmacies view own medicine orders" ON "public"."health_medicine_orders" FOR SELECT TO "authenticated" USING (("pharmacy_id" IN ( SELECT "health_pharmacy_profiles"."id"
   FROM "public"."health_pharmacy_profiles"
  WHERE ("health_pharmacy_profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "Pharmacies view own profile" ON "public"."pharmacy_profiles" TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Pharmacies view own scan logs" ON "public"."pharmacy_qr_scan_logs" FOR SELECT TO "authenticated" USING (("pharmacy_id" IN ( SELECT "pharmacy_profiles"."id"
   FROM "public"."pharmacy_profiles"
  WHERE ("pharmacy_profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "Pharmacies view own stock history" ON "public"."health_medicine_stock_history" FOR SELECT TO "authenticated" USING (("pharmacy_id" IN ( SELECT "health_pharmacy_profiles"."id"
   FROM "public"."health_pharmacy_profiles"
  WHERE ("health_pharmacy_profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "Pharmacies view own stock movements" ON "public"."pharmacy_stock_movements" FOR SELECT TO "authenticated" USING (("pharmacy_id" IN ( SELECT "pharmacy_profiles"."id"
   FROM "public"."pharmacy_profiles"
  WHERE ("pharmacy_profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "Public view active gigs" ON "public"."service_gigs" FOR SELECT TO "authenticated", "anon" USING (("status" = 'active'::"text"));



CREATE POLICY "Public view available medicines" ON "public"."health_medicines" FOR SELECT TO "authenticated" USING (("is_available" = true));



CREATE POLICY "Public view freelancer profiles" ON "public"."freelancer_profiles" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Public view portfolio" ON "public"."freelancer_portfolio" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Public view reviews" ON "public"."service_reviews" FOR SELECT TO "authenticated", "anon" USING (("is_visible" = true));



CREATE POLICY "Public view service categories" ON "public"."service_categories" FOR SELECT TO "authenticated", "anon" USING (("is_active" = true));



CREATE POLICY "Public view verified doctors" ON "public"."health_doctor_profiles" FOR SELECT TO "authenticated" USING (("is_verified" = true));



CREATE POLICY "Public view verified pharmacies" ON "public"."health_pharmacy_profiles" FOR SELECT TO "authenticated" USING (("is_verified" = true));



CREATE POLICY "Public view verified pharmacies" ON "public"."pharmacy_profiles" FOR SELECT TO "authenticated" USING (("is_verified" = true));



CREATE POLICY "Sellers can insert products" ON "public"."products" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "seller_id"));



CREATE POLICY "Sellers can update products" ON "public"."products" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "seller_id"));



CREATE POLICY "Sellers can view own products" ON "public"."products" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "seller_id"));



CREATE POLICY "Users create own medicine reviews" ON "public"."health_medicine_reviews" FOR INSERT TO "authenticated" WITH CHECK (("patient_id" IN ( SELECT "health_patient_profiles"."id"
   FROM "public"."health_patient_profiles"
  WHERE ("health_patient_profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users insert own profile" ON "public"."freelancer_profiles" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users manage own doctor profile" ON "public"."health_doctor_profiles" TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users manage own patient profile" ON "public"."health_patient_profiles" TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users update own profile" ON "public"."freelancer_profiles" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users view own appointments" ON "public"."health_appointments" FOR SELECT TO "authenticated" USING ((("doctor_id" = "auth"."uid"()) OR ("patient_id" = "auth"."uid"())));



CREATE POLICY "Users view own medicine orders" ON "public"."health_medicine_orders" FOR SELECT TO "authenticated" USING (("patient_id" IN ( SELECT "health_patient_profiles"."id"
   FROM "public"."health_patient_profiles"
  WHERE ("health_patient_profiles"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users view own medicine reviews" ON "public"."health_medicine_reviews" FOR SELECT TO "authenticated" USING (true);



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



CREATE POLICY "authenticated_can_insert_conversation" ON "public"."services_conversations" FOR INSERT TO "authenticated" WITH CHECK ((("client_id" = ( SELECT "auth"."uid"() AS "uid")) OR (( SELECT "public"."get_provider_user_id"("services_conversations"."provider_id") AS "get_provider_user_id") = ( SELECT "auth"."uid"() AS "uid"))));



ALTER TABLE "public"."cart" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "clients_can_select" ON "public"."services_conversations" FOR SELECT TO "authenticated" USING (("client_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "clients_view_own_bookings" ON "public"."service_bookings" FOR SELECT USING (("auth"."uid"() = "customer_id"));



ALTER TABLE "public"."commissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversation_participants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "conversations_insert_any" ON "public"."conversations" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "conversations_insert_own" ON "public"."conversations" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "conversations_view_own" ON "public"."conversations" FOR SELECT TO "authenticated" USING (("id" IN ( SELECT "conversation_participants"."conversation_id"
   FROM "public"."conversation_participants"
  WHERE ("conversation_participants"."user_id" = "auth"."uid"()))));



CREATE POLICY "conversations_view_participant" ON "public"."conversations" FOR SELECT TO "authenticated" USING ("public"."user_is_in_conversation"("id"));



ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "customers_create_bookings" ON "public"."service_bookings" FOR INSERT WITH CHECK (("auth"."uid"() = "customer_id"));



CREATE POLICY "customers_view_active_products" ON "public"."products" FOR SELECT TO "authenticated" USING (("status" = 'active'::"text"));



CREATE POLICY "deals_manage_middleman" ON "public"."deals" TO "authenticated" USING (("middleman_id" = "auth"."uid"())) WITH CHECK (("middleman_id" = "auth"."uid"()));



CREATE POLICY "deals_view_participants" ON "public"."deals" FOR SELECT TO "authenticated" USING ((("party_a_id" = "auth"."uid"()) OR ("party_b_id" = "auth"."uid"()) OR ("middleman_id" = "auth"."uid"())));



CREATE POLICY "delivery_manage_own_assignments" ON "public"."delivery_assignments" TO "authenticated" USING (("driver_id" = "auth"."uid"())) WITH CHECK (("driver_id" = "auth"."uid"()));



ALTER TABLE "public"."delivery_profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "delivery_update_location" ON "public"."delivery_profiles" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "delivery_update_own" ON "public"."delivery_profiles" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "delivery_view_assigned_orders" ON "public"."orders" FOR SELECT TO "authenticated" USING ((("delivery_id" = "auth"."uid"()) OR ("seller_id" = "auth"."uid"()) OR ("user_id" = "auth"."uid"())));



CREATE POLICY "delivery_view_own" ON "public"."delivery_profiles" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."error_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "everyone_view_approved_reviews" ON "public"."reviews" FOR SELECT TO "authenticated" USING (("is_approved" = true));



ALTER TABLE "public"."factories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "factories_manage_own" ON "public"."factories" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "factories_manage_own_production" ON "public"."factory_production_logs" TO "authenticated" USING (("order_id" IN ( SELECT "orders"."id"
   FROM "public"."orders"
  WHERE ("orders"."seller_id" = "auth"."uid"()))));



CREATE POLICY "factories_update_own_connections" ON "public"."factory_connections" FOR UPDATE TO "authenticated" USING (("factory_id" = "auth"."uid"())) WITH CHECK (("factory_id" = "auth"."uid"()));



CREATE POLICY "factories_view_public" ON "public"."factories" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."factory_connections" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "factory_connections_insert_own" ON "public"."factory_connections" FOR INSERT TO "authenticated" WITH CHECK ((("factory_id" = "auth"."uid"()) OR ("seller_id" = "auth"."uid"())));



CREATE POLICY "factory_connections_update_own" ON "public"."factory_connections" FOR UPDATE TO "authenticated" USING ((("factory_id" = "auth"."uid"()) OR ("seller_id" = "auth"."uid"()))) WITH CHECK ((("factory_id" = "auth"."uid"()) OR ("seller_id" = "auth"."uid"())));



CREATE POLICY "factory_connections_view_own" ON "public"."factory_connections" FOR SELECT TO "authenticated" USING ((("factory_id" = "auth"."uid"()) OR ("seller_id" = "auth"."uid"())));



ALTER TABLE "public"."factory_ratings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."freelancer_portfolio" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."freelancer_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."health_appointments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."health_conversations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "health_conversations_insert_own" ON "public"."health_conversations" FOR INSERT TO "authenticated" WITH CHECK (("appointment_id" IN ( SELECT "health_appointments"."id"
   FROM "public"."health_appointments"
  WHERE (("health_appointments"."doctor_id" = ( SELECT "health_doctor_profiles"."id"
           FROM "public"."health_doctor_profiles"
          WHERE ("health_doctor_profiles"."user_id" = "auth"."uid"()))) OR ("health_appointments"."patient_id" = ( SELECT "health_patient_profiles"."id"
           FROM "public"."health_patient_profiles"
          WHERE ("health_patient_profiles"."user_id" = "auth"."uid"())))))));



CREATE POLICY "health_conversations_view_own" ON "public"."health_conversations" FOR SELECT TO "authenticated" USING (("appointment_id" IN ( SELECT "health_appointments"."id"
   FROM "public"."health_appointments"
  WHERE (("health_appointments"."doctor_id" = ( SELECT "health_doctor_profiles"."id"
           FROM "public"."health_doctor_profiles"
          WHERE ("health_doctor_profiles"."user_id" = "auth"."uid"()))) OR ("health_appointments"."patient_id" = ( SELECT "health_patient_profiles"."id"
           FROM "public"."health_patient_profiles"
          WHERE ("health_patient_profiles"."user_id" = "auth"."uid"())))))));



ALTER TABLE "public"."health_daily_backup_status" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."health_doctor_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."health_medicine_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."health_medicine_expiry_alerts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."health_medicine_order_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."health_medicine_orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."health_medicine_recalls" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."health_medicine_reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."health_medicine_stock_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."health_medicines" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."health_medicines_master" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."health_patient_access_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."health_patient_archives" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."health_patient_change_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."health_patient_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."health_pharmacy_inspections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."health_pharmacy_inventory" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."health_pharmacy_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."health_prescription_medicines" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."health_prescriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."idempotency_keys" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "idempotency_keys_user_own" ON "public"."idempotency_keys" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "listings_public_read" ON "public"."service_listings" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."location_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "messages_delete_own" ON "public"."messages" FOR DELETE TO "authenticated" USING (("sender_id" = "auth"."uid"()));



CREATE POLICY "messages_insert_own" ON "public"."messages" FOR INSERT TO "authenticated" WITH CHECK (("sender_id" = "auth"."uid"()));



CREATE POLICY "messages_update_own" ON "public"."messages" FOR UPDATE TO "authenticated" USING (("sender_id" = "auth"."uid"())) WITH CHECK (("sender_id" = "auth"."uid"()));



CREATE POLICY "messages_view_own" ON "public"."messages" FOR SELECT TO "authenticated" USING (("conversation_id" IN ( SELECT "conversation_participants"."conversation_id"
   FROM "public"."conversation_participants"
  WHERE ("conversation_participants"."user_id" = "auth"."uid"()))));



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


CREATE POLICY "participants_insert_own" ON "public"."conversation_participants" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "participants_update_own" ON "public"."conversation_participants" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "participants_view_conversation_members" ON "public"."conversation_participants" FOR SELECT TO "authenticated" USING ("public"."user_is_in_conversation"("conversation_id"));



CREATE POLICY "participants_view_own" ON "public"."conversation_participants" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "participants_view_own_record" ON "public"."conversation_participants" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "patients_private" ON "public"."health_patient_profiles" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."pharmacy_activity_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pharmacy_daily_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pharmacy_medicine_inventory" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pharmacy_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pharmacy_qr_scan_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pharmacy_stock_movements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."post_comments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "post_comments_delete_own" ON "public"."post_comments" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "post_comments_insert_own" ON "public"."post_comments" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "post_comments_update_own" ON "public"."post_comments" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "post_comments_view_public" ON "public"."post_comments" FOR SELECT TO "authenticated" USING (("is_deleted" = false));



ALTER TABLE "public"."post_likes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "post_likes_delete_own" ON "public"."post_likes" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "post_likes_insert_own" ON "public"."post_likes" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "post_likes_view_public" ON "public"."post_likes" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "posts_delete_own" ON "public"."posts" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "posts_insert_own" ON "public"."posts" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "posts_update_own" ON "public"."posts" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "posts_view_public" ON "public"."posts" FOR SELECT TO "authenticated" USING (("is_deleted" = false));



CREATE POLICY "posts_view_public_anon" ON "public"."posts" FOR SELECT TO "anon" USING (("is_deleted" = false));



ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "products_view_active_anon" ON "public"."products" FOR SELECT TO "anon" USING ((("is_deleted" = false) AND ("status" = 'active'::"text")));



CREATE POLICY "products_view_active_public" ON "public"."products" FOR SELECT TO "authenticated" USING ((("is_deleted" = false) AND ("status" = 'active'::"text")));



CREATE POLICY "profiles_public_view" ON "public"."delivery_profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "profiles_public_view" ON "public"."factories" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "profiles_public_view" ON "public"."freelancer_profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "profiles_public_view" ON "public"."health_doctor_profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "profiles_public_view" ON "public"."health_pharmacy_profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "profiles_public_view" ON "public"."middle_men" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "profiles_public_view" ON "public"."sellers" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "profiles_public_view" ON "public"."service_providers" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "providers_can_select" ON "public"."services_conversations" FOR SELECT TO "authenticated" USING ((( SELECT "public"."get_provider_user_id"("services_conversations"."provider_id") AS "get_provider_user_id") = ( SELECT "auth"."uid"() AS "uid")));



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


CREATE POLICY "seller_profiles_view_public" ON "public"."seller_profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "seller_profiles_view_public_anon" ON "public"."seller_profiles" FOR SELECT TO "anon" USING (true);



ALTER TABLE "public"."sellers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sellers_create_factory_connections" ON "public"."factory_connections" FOR INSERT TO "authenticated" WITH CHECK (("seller_id" = "auth"."uid"()));



CREATE POLICY "sellers_create_factory_ratings" ON "public"."factory_ratings" FOR INSERT TO "authenticated" WITH CHECK (("seller_id" = "auth"."uid"()));



CREATE POLICY "sellers_manage_own" ON "public"."sellers" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "sellers_manage_own_products" ON "public"."products" TO "authenticated" USING (("seller_id" = "auth"."uid"())) WITH CHECK (("seller_id" = "auth"."uid"()));



CREATE POLICY "sellers_view_all_anon" ON "public"."sellers" FOR SELECT TO "anon" USING (true);



CREATE POLICY "sellers_view_all_authenticated" ON "public"."sellers" FOR SELECT TO "authenticated" USING (true);



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


CREATE POLICY "services_conversations_insert_own" ON "public"."services_conversations" FOR INSERT TO "authenticated" WITH CHECK ((("provider_id" = "auth"."uid"()) OR ("client_id" = "auth"."uid"())));



CREATE POLICY "services_conversations_view_own" ON "public"."services_conversations" FOR SELECT TO "authenticated" USING ((("provider_id" = "auth"."uid"()) OR ("client_id" = "auth"."uid"())));



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


CREATE POLICY "svc_users_update_own_conversations" ON "public"."services_conversations" FOR UPDATE USING ((("auth"."uid"() = "provider_id") OR ("auth"."uid"() = "client_id")));



CREATE POLICY "svc_users_view_own_conversations" ON "public"."services_conversations" FOR SELECT USING ((("auth"."uid"() = "provider_id") OR ("auth"."uid"() = "client_id")));



ALTER TABLE "public"."trading_conversations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "trading_conversations_insert_own" ON "public"."trading_conversations" FOR INSERT TO "authenticated" WITH CHECK (("initiator_id" = "auth"."uid"()));



CREATE POLICY "trading_conversations_view_own" ON "public"."trading_conversations" FOR SELECT TO "authenticated" USING ((("initiator_id" = "auth"."uid"()) OR ("receiver_id" = "auth"."uid"())));



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



CREATE POLICY "users_manage_own_wishlist" ON "public"."wishlist" TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "users_update_own_profile" ON "public"."seller_profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "users_update_own_provider" ON "public"."service_providers" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "users_update_own_reviews" ON "public"."reviews" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "users_update_own_svc_provider" ON "public"."svc_providers" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "users_update_own_trading_conversations" ON "public"."trading_conversations" FOR UPDATE USING ((("auth"."uid"() = "initiator_id") OR ("auth"."uid"() = "receiver_id")));



CREATE POLICY "users_view_all_anon" ON "public"."users" FOR SELECT TO "anon" USING (true);



CREATE POLICY "users_view_all_authenticated" ON "public"."users" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "users_view_own_activity_logs" ON "public"."activity_logs" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "users_view_own_bookings" ON "public"."service_bookings" FOR SELECT USING ((("auth"."uid"() = "customer_id") OR ("auth"."uid"() = "provider_id")));



CREATE POLICY "users_view_own_conversations" ON "public"."services_conversations" FOR SELECT USING (((( SELECT "auth"."uid"() AS "uid") = "provider_id") OR (( SELECT "auth"."uid"() AS "uid") = "client_id")));



CREATE POLICY "users_view_own_error_logs" ON "public"."error_logs" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR ("user_id" IS NULL)));



CREATE POLICY "users_view_own_location_history" ON "public"."location_history" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "users_view_own_profile" ON "public"."seller_profiles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "users_view_own_svc_provider" ON "public"."svc_providers" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("status" = 'active'::"text")));



CREATE POLICY "users_view_own_trading_conversations" ON "public"."trading_conversations" FOR SELECT USING ((("auth"."uid"() = "initiator_id") OR ("auth"."uid"() = "receiver_id")));



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



GRANT ALL ON FUNCTION "public"."archive_patient_data"("p_doctor_id" "uuid", "p_patient_id" "uuid", "p_archive_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."archive_patient_data"("p_doctor_id" "uuid", "p_patient_id" "uuid", "p_archive_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."archive_patient_data"("p_doctor_id" "uuid", "p_patient_id" "uuid", "p_archive_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."assign_delivery_to_driver"("p_order_id" "uuid", "p_seller_latitude" numeric, "p_seller_longitude" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."assign_delivery_to_driver"("p_order_id" "uuid", "p_seller_latitude" numeric, "p_seller_longitude" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."assign_delivery_to_driver"("p_order_id" "uuid", "p_seller_latitude" numeric, "p_seller_longitude" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."bulk_upload_medicines"("p_pharmacy_id" "uuid", "p_medicines" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."bulk_upload_medicines"("p_pharmacy_id" "uuid", "p_medicines" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."bulk_upload_medicines"("p_pharmacy_id" "uuid", "p_medicines" "jsonb") TO "service_role";



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



GRANT ALL ON FUNCTION "public"."check_product_chat_permission"("p_user_id" "uuid", "p_product_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_product_chat_permission"("p_user_id" "uuid", "p_product_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_product_chat_permission"("p_user_id" "uuid", "p_product_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_idempotency_keys"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_idempotency_keys"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_idempotency_keys"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_product_images"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_product_images"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_product_images"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_analytics_snapshot"("p_seller_id" "uuid", "p_period_type" "text", "p_start_date" "date", "p_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_analytics_snapshot"("p_seller_id" "uuid", "p_period_type" "text", "p_start_date" "date", "p_end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_direct_conversation"("p_target_user_id" "uuid", "p_context" "text", "p_product_id" "uuid", "p_appointment_id" "uuid", "p_listing_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_direct_conversation"("p_target_user_id" "uuid", "p_context" "text", "p_product_id" "uuid", "p_appointment_id" "uuid", "p_listing_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_direct_conversation"("p_target_user_id" "uuid", "p_context" "text", "p_product_id" "uuid", "p_appointment_id" "uuid", "p_listing_id" "uuid") TO "service_role";



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



GRANT ALL ON FUNCTION "public"."find_factories"("p_search_term" "text", "p_location" "text", "p_is_verified" boolean, "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."find_factories"("p_search_term" "text", "p_location" "text", "p_is_verified" boolean, "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."find_factories"("p_search_term" "text", "p_location" "text", "p_is_verified" boolean, "p_limit" integer, "p_offset" integer) TO "service_role";



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



GRANT ALL ON FUNCTION "public"."find_nearby_sellers"("p_latitude" numeric, "p_longitude" numeric, "p_radius_km" numeric, "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."find_nearby_sellers"("p_latitude" numeric, "p_longitude" numeric, "p_radius_km" numeric, "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."find_nearby_sellers"("p_latitude" numeric, "p_longitude" numeric, "p_radius_km" numeric, "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_medicine_qr_code"("p_pharmacy_id" "uuid", "p_medicine_id" "uuid", "p_batch_number" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_medicine_qr_code"("p_pharmacy_id" "uuid", "p_medicine_id" "uuid", "p_batch_number" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_medicine_qr_code"("p_pharmacy_id" "uuid", "p_medicine_id" "uuid", "p_batch_number" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_patient_archive_json"("p_doctor_id" "uuid", "p_patient_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_patient_archive_json"("p_doctor_id" "uuid", "p_patient_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_patient_archive_json"("p_doctor_id" "uuid", "p_patient_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_pharmacy_daily_report"("p_pharmacy_id" "uuid", "p_report_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_pharmacy_daily_report"("p_pharmacy_id" "uuid", "p_report_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_pharmacy_daily_report"("p_pharmacy_id" "uuid", "p_report_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_product_description"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_product_description"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_product_description"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_factory_rating"("p_factory_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_factory_rating"("p_factory_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_feed_posts"("p_limit" integer, "p_offset" integer, "p_user_id" "uuid", "p_post_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_feed_posts"("p_limit" integer, "p_offset" integer, "p_user_id" "uuid", "p_post_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_feed_posts"("p_limit" integer, "p_offset" integer, "p_user_id" "uuid", "p_post_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_low_stock_products"("threshold" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_low_stock_products"("threshold" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_middle_man_ids"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_middle_man_ids"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_middle_man_ids"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_or_create_conversation"("p_other_user_id" "uuid", "p_product_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_or_create_conversation"("p_other_user_id" "uuid", "p_product_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_or_create_conversation"("p_other_user_id" "uuid", "p_product_id" "uuid") TO "service_role";



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



GRANT ALL ON FUNCTION "public"."get_provider_user_id"("p_provider_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_public_profile"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_public_profile"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_public_profile"("p_user_id" "uuid") TO "service_role";



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



GRANT ALL ON FUNCTION "public"."process_qr_scan"("p_pharmacy_id" "uuid", "p_user_id" "uuid", "p_qr_code" "text", "p_scan_type" "text", "p_device_info" "text", "p_location_lat" double precision, "p_location_lng" double precision) TO "anon";
GRANT ALL ON FUNCTION "public"."process_qr_scan"("p_pharmacy_id" "uuid", "p_user_id" "uuid", "p_qr_code" "text", "p_scan_type" "text", "p_device_info" "text", "p_location_lat" double precision, "p_location_lng" double precision) TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_qr_scan"("p_pharmacy_id" "uuid", "p_user_id" "uuid", "p_qr_code" "text", "p_scan_type" "text", "p_device_info" "text", "p_location_lat" double precision, "p_location_lng" double precision) TO "service_role";



GRANT ALL ON FUNCTION "public"."products_search_vector_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."products_search_vector_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."products_search_vector_trigger"() TO "service_role";



GRANT ALL ON FUNCTION "public"."products_tsvector_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."products_tsvector_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."products_tsvector_trigger"() TO "service_role";



GRANT ALL ON FUNCTION "public"."run_daily_patient_backup"("p_doctor_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."run_daily_patient_backup"("p_doctor_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."run_daily_patient_backup"("p_doctor_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_public_profiles"("p_search_term" "text", "p_account_type" "text", "p_location" "text", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_public_profiles"("p_search_term" "text", "p_account_type" "text", "p_location" "text", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_public_profiles"("p_search_term" "text", "p_account_type" "text", "p_location" "text", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."track_deal_click"("p_unique_slug" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."track_deal_click"("p_unique_slug" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."track_deal_click"("p_unique_slug" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_conversation_on_deal_proposal"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_conversation_on_deal_proposal"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_conversation_on_deal_proposal"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_conversation_on_message"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_conversation_on_message"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_conversation_on_message"() TO "service_role";



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



GRANT ALL ON FUNCTION "public"."update_health_pharmacy_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_health_pharmacy_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_health_pharmacy_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_health_timestamps"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_health_timestamps"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_health_timestamps"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_medicine_expiry_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_medicine_expiry_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_medicine_expiry_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_medicine_rating"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_medicine_rating"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_medicine_rating"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_medicine_stock_on_order"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_medicine_stock_on_order"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_medicine_stock_on_order"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_order_status_timestamps"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_order_status_timestamps"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_order_status_timestamps"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_patient_visit_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_patient_visit_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_patient_visit_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_post_comments_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_post_comments_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_post_comments_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_post_likes_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_post_likes_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_post_likes_count"() TO "service_role";



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



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_is_in_conversation"("p_conversation_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_is_in_conversation"("p_conversation_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_is_in_conversation"("p_conversation_id" "uuid") TO "service_role";





























































































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



GRANT ALL ON TABLE "public"."booking_milestones" TO "anon";
GRANT ALL ON TABLE "public"."booking_milestones" TO "authenticated";
GRANT ALL ON TABLE "public"."booking_milestones" TO "service_role";



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



GRANT ALL ON TABLE "public"."conversation_participants" TO "anon";
GRANT ALL ON TABLE "public"."conversation_participants" TO "authenticated";
GRANT ALL ON TABLE "public"."conversation_participants" TO "service_role";



GRANT ALL ON TABLE "public"."conversations" TO "anon";
GRANT ALL ON TABLE "public"."conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."conversations" TO "service_role";



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



GRANT ALL ON TABLE "public"."factory_quotes" TO "anon";
GRANT ALL ON TABLE "public"."factory_quotes" TO "authenticated";
GRANT ALL ON TABLE "public"."factory_quotes" TO "service_role";



GRANT ALL ON TABLE "public"."factory_ratings" TO "anon";
GRANT ALL ON TABLE "public"."factory_ratings" TO "authenticated";
GRANT ALL ON TABLE "public"."factory_ratings" TO "service_role";



GRANT ALL ON TABLE "public"."freelancer_portfolio" TO "anon";
GRANT ALL ON TABLE "public"."freelancer_portfolio" TO "authenticated";
GRANT ALL ON TABLE "public"."freelancer_portfolio" TO "service_role";



GRANT ALL ON TABLE "public"."freelancer_profiles" TO "anon";
GRANT ALL ON TABLE "public"."freelancer_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."freelancer_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."health_appointments" TO "anon";
GRANT ALL ON TABLE "public"."health_appointments" TO "authenticated";
GRANT ALL ON TABLE "public"."health_appointments" TO "service_role";



GRANT ALL ON TABLE "public"."health_conversations" TO "anon";
GRANT ALL ON TABLE "public"."health_conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."health_conversations" TO "service_role";



GRANT ALL ON TABLE "public"."health_daily_backup_status" TO "anon";
GRANT ALL ON TABLE "public"."health_daily_backup_status" TO "authenticated";
GRANT ALL ON TABLE "public"."health_daily_backup_status" TO "service_role";



GRANT ALL ON TABLE "public"."health_doctor_profiles" TO "anon";
GRANT ALL ON TABLE "public"."health_doctor_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."health_doctor_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."health_medicine_categories" TO "anon";
GRANT ALL ON TABLE "public"."health_medicine_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."health_medicine_categories" TO "service_role";



GRANT ALL ON TABLE "public"."health_medicine_expiry_alerts" TO "anon";
GRANT ALL ON TABLE "public"."health_medicine_expiry_alerts" TO "authenticated";
GRANT ALL ON TABLE "public"."health_medicine_expiry_alerts" TO "service_role";



GRANT ALL ON TABLE "public"."health_medicine_order_items" TO "anon";
GRANT ALL ON TABLE "public"."health_medicine_order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."health_medicine_order_items" TO "service_role";



GRANT ALL ON TABLE "public"."health_medicine_orders" TO "anon";
GRANT ALL ON TABLE "public"."health_medicine_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."health_medicine_orders" TO "service_role";



GRANT ALL ON TABLE "public"."health_medicine_recalls" TO "anon";
GRANT ALL ON TABLE "public"."health_medicine_recalls" TO "authenticated";
GRANT ALL ON TABLE "public"."health_medicine_recalls" TO "service_role";



GRANT ALL ON TABLE "public"."health_medicine_reviews" TO "anon";
GRANT ALL ON TABLE "public"."health_medicine_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."health_medicine_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."health_medicine_stock_history" TO "anon";
GRANT ALL ON TABLE "public"."health_medicine_stock_history" TO "authenticated";
GRANT ALL ON TABLE "public"."health_medicine_stock_history" TO "service_role";



GRANT ALL ON TABLE "public"."health_medicines" TO "anon";
GRANT ALL ON TABLE "public"."health_medicines" TO "authenticated";
GRANT ALL ON TABLE "public"."health_medicines" TO "service_role";



GRANT ALL ON TABLE "public"."health_medicines_master" TO "anon";
GRANT ALL ON TABLE "public"."health_medicines_master" TO "authenticated";
GRANT ALL ON TABLE "public"."health_medicines_master" TO "service_role";



GRANT ALL ON TABLE "public"."health_patient_access_log" TO "anon";
GRANT ALL ON TABLE "public"."health_patient_access_log" TO "authenticated";
GRANT ALL ON TABLE "public"."health_patient_access_log" TO "service_role";



GRANT ALL ON TABLE "public"."health_patient_archives" TO "anon";
GRANT ALL ON TABLE "public"."health_patient_archives" TO "authenticated";
GRANT ALL ON TABLE "public"."health_patient_archives" TO "service_role";



GRANT ALL ON TABLE "public"."health_patient_change_log" TO "anon";
GRANT ALL ON TABLE "public"."health_patient_change_log" TO "authenticated";
GRANT ALL ON TABLE "public"."health_patient_change_log" TO "service_role";



GRANT ALL ON TABLE "public"."health_patient_profiles" TO "anon";
GRANT ALL ON TABLE "public"."health_patient_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."health_patient_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."health_pharmacy_inspections" TO "anon";
GRANT ALL ON TABLE "public"."health_pharmacy_inspections" TO "authenticated";
GRANT ALL ON TABLE "public"."health_pharmacy_inspections" TO "service_role";



GRANT ALL ON TABLE "public"."health_pharmacy_inventory" TO "anon";
GRANT ALL ON TABLE "public"."health_pharmacy_inventory" TO "authenticated";
GRANT ALL ON TABLE "public"."health_pharmacy_inventory" TO "service_role";



GRANT ALL ON TABLE "public"."health_pharmacy_profiles" TO "anon";
GRANT ALL ON TABLE "public"."health_pharmacy_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."health_pharmacy_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."health_prescription_medicines" TO "anon";
GRANT ALL ON TABLE "public"."health_prescription_medicines" TO "authenticated";
GRANT ALL ON TABLE "public"."health_prescription_medicines" TO "service_role";



GRANT ALL ON TABLE "public"."health_prescriptions" TO "anon";
GRANT ALL ON TABLE "public"."health_prescriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."health_prescriptions" TO "service_role";



GRANT ALL ON TABLE "public"."idempotency_keys" TO "anon";
GRANT ALL ON TABLE "public"."idempotency_keys" TO "authenticated";
GRANT ALL ON TABLE "public"."idempotency_keys" TO "service_role";



GRANT ALL ON TABLE "public"."location_history" TO "anon";
GRANT ALL ON TABLE "public"."location_history" TO "authenticated";
GRANT ALL ON TABLE "public"."location_history" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



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



GRANT ALL ON TABLE "public"."pharmacy_activity_logs" TO "anon";
GRANT ALL ON TABLE "public"."pharmacy_activity_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."pharmacy_activity_logs" TO "service_role";



GRANT ALL ON TABLE "public"."pharmacy_daily_reports" TO "anon";
GRANT ALL ON TABLE "public"."pharmacy_daily_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."pharmacy_daily_reports" TO "service_role";



GRANT ALL ON TABLE "public"."pharmacy_medicine_inventory" TO "anon";
GRANT ALL ON TABLE "public"."pharmacy_medicine_inventory" TO "authenticated";
GRANT ALL ON TABLE "public"."pharmacy_medicine_inventory" TO "service_role";



GRANT ALL ON TABLE "public"."pharmacy_profiles" TO "anon";
GRANT ALL ON TABLE "public"."pharmacy_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."pharmacy_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."pharmacy_qr_scan_logs" TO "anon";
GRANT ALL ON TABLE "public"."pharmacy_qr_scan_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."pharmacy_qr_scan_logs" TO "service_role";



GRANT ALL ON TABLE "public"."pharmacy_stock_movements" TO "anon";
GRANT ALL ON TABLE "public"."pharmacy_stock_movements" TO "authenticated";
GRANT ALL ON TABLE "public"."pharmacy_stock_movements" TO "service_role";



GRANT ALL ON TABLE "public"."post_comments" TO "anon";
GRANT ALL ON TABLE "public"."post_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."post_comments" TO "service_role";



GRANT ALL ON TABLE "public"."post_likes" TO "anon";
GRANT ALL ON TABLE "public"."post_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."post_likes" TO "service_role";



GRANT ALL ON TABLE "public"."posts" TO "anon";
GRANT ALL ON TABLE "public"."posts" TO "authenticated";
GRANT ALL ON TABLE "public"."posts" TO "service_role";



GRANT ALL ON TABLE "public"."provider_availability" TO "anon";
GRANT ALL ON TABLE "public"."provider_availability" TO "authenticated";
GRANT ALL ON TABLE "public"."provider_availability" TO "service_role";



GRANT ALL ON TABLE "public"."provider_time_off" TO "anon";
GRANT ALL ON TABLE "public"."provider_time_off" TO "authenticated";
GRANT ALL ON TABLE "public"."provider_time_off" TO "service_role";



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



GRANT ALL ON TABLE "public"."shipping_addresses" TO "anon";
GRANT ALL ON TABLE "public"."shipping_addresses" TO "authenticated";
GRANT ALL ON TABLE "public"."shipping_addresses" TO "service_role";



GRANT ALL ON TABLE "public"."subcategories" TO "anon";
GRANT ALL ON TABLE "public"."subcategories" TO "authenticated";
GRANT ALL ON TABLE "public"."subcategories" TO "service_role";



GRANT ALL ON TABLE "public"."svc_categories" TO "anon";
GRANT ALL ON TABLE "public"."svc_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."svc_categories" TO "service_role";



GRANT ALL ON TABLE "public"."svc_listing_packages" TO "anon";
GRANT ALL ON TABLE "public"."svc_listing_packages" TO "authenticated";
GRANT ALL ON TABLE "public"."svc_listing_packages" TO "service_role";



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































