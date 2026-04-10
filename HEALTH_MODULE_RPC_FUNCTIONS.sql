-- =====================================================
-- HEALTH MODULE - BACKEND IMPLEMENTATION
-- =====================================================
-- Comprehensive RPC functions for healthcare system
-- Includes doctor verification, appointments, consent, auditing
-- 
-- Run this in Supabase SQL Editor to add all health operations

BEGIN;

-- =====================================================
-- 1. DOCTOR VERIFICATION RPC
-- =====================================================

CREATE OR REPLACE FUNCTION public.verify_doctor(
  p_doctor_id UUID,
  p_verified_by UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  doctor_id UUID,
  is_verified BOOLEAN,
  verified_at TIMESTAMPTZ
) AS $$
DECLARE
  v_doctor_exists BOOLEAN;
  v_admin_id UUID;
BEGIN
  -- Check if doctor exists
  SELECT EXISTS(
    SELECT 1 FROM public.health_doctor_profiles WHERE user_id = p_doctor_id
  ) INTO v_doctor_exists;

  IF NOT v_doctor_exists THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN,
      'Doctor not found'::TEXT,
      p_doctor_id,
      FALSE::BOOLEAN,
      NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  -- Update doctor verification status
  UPDATE public.health_doctor_profiles
  SET 
    is_verified = TRUE,
    verified_at = NOW(),
    verified_by = COALESCE(p_verified_by, auth.uid()),
    updated_at = NOW()
  WHERE user_id = p_doctor_id;

  -- Log the verification
  INSERT INTO public.health_patient_access_log (
    user_id,
    action,
    resource_type,
    accessed_at,
    ip_address,
    notes
  )
  VALUES (
    COALESCE(p_verified_by, auth.uid()),
    'DOCTOR_VERIFIED',
    'doctor_profile',
    NOW(),
    '0.0.0.0',
    COALESCE(p_notes, '')
  );

  RETURN QUERY SELECT 
    TRUE::BOOLEAN,
    'Doctor verified successfully'::TEXT,
    p_doctor_id,
    TRUE::BOOLEAN,
    NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public, pg_catalog;

GRANT EXECUTE ON FUNCTION public.verify_doctor(UUID, UUID, TEXT) TO authenticated, service_role;

-- =====================================================
-- 2. APPOINTMENT SCHEDULING RPC
-- =====================================================

CREATE OR REPLACE FUNCTION public.schedule_appointment(
  p_patient_id UUID,
  p_doctor_id UUID,
  p_appointment_date TIMESTAMPTZ,
  p_reason TEXT,
  p_appointment_type VARCHAR DEFAULT 'consultation'
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  appointment_id UUID,
  scheduled_at TIMESTAMPTZ
) AS $$
DECLARE
  v_appointment_id UUID;
  v_doctor_verified BOOLEAN;
  v_patient_exists BOOLEAN;
BEGIN
  -- Verify doctor is verified
  SELECT is_verified INTO v_doctor_verified
  FROM public.health_doctor_profiles
  WHERE user_id = p_doctor_id;

  IF NOT COALESCE(v_doctor_verified, FALSE) THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN,
      'Doctor is not verified'::TEXT,
      NULL::UUID,
      NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  -- Check patient exists
  SELECT EXISTS(
    SELECT 1 FROM auth.users WHERE id = p_patient_id
  ) INTO v_patient_exists;

  IF NOT v_patient_exists THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN,
      'Patient not found'::TEXT,
      NULL::UUID,
      NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  -- Create appointment
  v_appointment_id := gen_random_uuid();

  INSERT INTO public.health_appointments (
    id,
    patient_id,
    doctor_id,
    appointment_date,
    reason,
    appointment_type,
    status,
    created_at,
    updated_at
  )
  VALUES (
    v_appointment_id,
    p_patient_id,
    p_doctor_id,
    p_appointment_date,
    p_reason,
    p_appointment_type,
    'scheduled',
    NOW(),
    NOW()
  );

  -- Log the scheduling
  INSERT INTO public.health_patient_access_log (
    user_id,
    action,
    resource_type,
    accessed_at,
    notes
  )
  VALUES (
    p_patient_id,
    'APPOINTMENT_SCHEDULED',
    'appointment',
    NOW(),
    p_reason
  );

  RETURN QUERY SELECT 
    TRUE::BOOLEAN,
    'Appointment scheduled successfully'::TEXT,
    v_appointment_id,
    NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public, pg_catalog;

GRANT EXECUTE ON FUNCTION public.schedule_appointment(UUID, UUID, TIMESTAMPTZ, TEXT, VARCHAR) TO authenticated, service_role;

-- =====================================================
-- 3. CONSENT FORM SUBMISSION RPC
-- =====================================================

CREATE OR REPLACE FUNCTION public.submit_consent_form(
  p_patient_id UUID,
  p_consent_type VARCHAR,
  p_consent_data JSONB,
  p_signature_url TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  consent_id UUID,
  submitted_at TIMESTAMPTZ
) AS $$
DECLARE
  v_consent_id UUID;
BEGIN
  v_consent_id := gen_random_uuid();

  -- Store consent form
  INSERT INTO public.health_patient_archives (
    id,
    user_id,
    archived_data,
    archive_date,
    created_at
  )
  VALUES (
    v_consent_id,
    p_patient_id,
    jsonb_build_object(
      'type', p_consent_type,
      'data', p_consent_data,
      'signature_url', p_signature_url,
      'consent_version', '1.0',
      'accepted_terms', TRUE
    ),
    NOW(),
    NOW()
  );

  -- Log the consent submission
  INSERT INTO public.health_patient_access_log (
    user_id,
    action,
    resource_type,
    accessed_at,
    notes
  )
  VALUES (
    p_patient_id,
    'CONSENT_SUBMITTED',
    'consent_form',
    NOW(),
    p_consent_type
  );

  RETURN QUERY SELECT 
    TRUE::BOOLEAN,
    'Consent form submitted successfully'::TEXT,
    v_consent_id,
    NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public, pg_catalog;

GRANT EXECUTE ON FUNCTION public.submit_consent_form(UUID, VARCHAR, JSONB, TEXT) TO authenticated, service_role;

-- =====================================================
-- 4. HEALTH DATA EXPORT RPC
-- =====================================================

CREATE OR REPLACE FUNCTION public.export_patient_health_data(
  p_patient_id UUID,
  p_export_format VARCHAR DEFAULT 'json'
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  export_id UUID,
  export_url TEXT,
  exported_at TIMESTAMPTZ
) AS $$
DECLARE
  v_export_id UUID;
  v_export_data JSONB;
  v_export_url TEXT;
BEGIN
  v_export_id := gen_random_uuid();

  -- Verify patient owns this data
  IF auth.uid() != p_patient_id THEN
    RETURN QUERY SELECT 
      FALSE::BOOLEAN,
      'Unauthorized: Can only export own health data'::TEXT,
      NULL::UUID,
      NULL::TEXT,
      NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  -- Aggregate patient health data
  SELECT jsonb_build_object(
    'patient_id', p_patient_id,
    'export_date', NOW()::TEXT,
    'appointments', (
      SELECT jsonb_agg(jsonb_build_object(
        'id', id,
        'doctor_id', doctor_id,
        'date', appointment_date,
        'type', appointment_type,
        'reason', reason,
        'status', status
      ))
      FROM public.health_appointments
      WHERE patient_id = p_patient_id
      ORDER BY appointment_date DESC
    ),
    'medicines', (
      SELECT jsonb_agg(jsonb_build_object(
        'id', id,
        'name', medicine_name,
        'dosage', dosage,
        'frequency', frequency,
        'prescribed_date', prescribed_date
      ))
      FROM public.health_medicines
      WHERE user_id = p_patient_id
      ORDER BY prescribed_date DESC
    ),
    'medicines_purchased', (
      SELECT jsonb_agg(jsonb_build_object(
        'order_id', order_id,
        'total_amount', total_amount,
        'order_date', created_at,
        'items', (
          SELECT jsonb_agg(jsonb_build_object(
            'medicine_id', Medicine_id,
            'quantity', quantity,
            'price', price_per_unit
          ))
          FROM public.health_medicine_order_items
          WHERE order_id = health_medicine_orders.id
        )
      ))
      FROM public.health_medicine_orders
      WHERE user_id = p_patient_id
      ORDER BY created_at DESC
    )
  ) INTO v_export_data;

  -- Store export record
  INSERT INTO public.async_jobs (
    id,
    job_type,
    user_id,
    status,
    payload,
    result,
    created_at,
    updated_at
  )
  VALUES (
    v_export_id,
    'HEALTH_DATA_EXPORT',
    p_patient_id,
    'completed',
    jsonb_build_object('format', p_export_format),
    v_export_data,
    NOW(),
    NOW()
  );

  -- Generate export URL (would be S3/storage bucket in production)
  v_export_url := 'https://exports.aurora.local/health/' || v_export_id::TEXT || '.' || LOWER(p_export_format);

  -- Log the export
  INSERT INTO public.health_patient_access_log (
    user_id,
    action,
    resource_type,
    accessed_at,
    notes
  )
  VALUES (
    p_patient_id,
    'HEALTH_DATA_EXPORTED',
    'health_records',
    NOW(),
    'Format: ' || p_export_format
  );

  RETURN QUERY SELECT 
    TRUE::BOOLEAN,
    'Health data exported successfully'::TEXT,
    v_export_id,
    v_export_url,
    NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public, pg_catalog;

GRANT EXECUTE ON FUNCTION public.export_patient_health_data(UUID, VARCHAR) TO authenticated, service_role;

-- =====================================================
-- 5. AUDIT LOG RETRIEVAL RPC
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_health_audit_logs(
  p_user_id UUID,
  p_limit INT DEFAULT 100,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  action VARCHAR,
  resource_type VARCHAR,
  accessed_at TIMESTAMPTZ,
  notes TEXT,
  accessed_by UUID
) AS $$
BEGIN
  -- Only allow users to see their own logs or admins to see all
  IF auth.uid() != p_user_id AND NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT 
    hal.id,
    hal.action::VARCHAR,
    hal.resource_type::VARCHAR,
    hal.accessed_at,
    hal.notes,
    hal.user_id
  FROM public.health_patient_access_log hal
  WHERE hal.user_id = p_user_id
  ORDER BY hal.accessed_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public, pg_catalog;

GRANT EXECUTE ON FUNCTION public.get_health_audit_logs(UUID, INT, INT) TO authenticated, service_role;

-- =====================================================
-- 6. DOCTOR LIST RETRIEVAL RPC
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_verified_doctors(
  p_specialty TEXT DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  doctor_id UUID,
  user_id UUID,
  full_name TEXT,
  specialty TEXT,
  rating NUMERIC,
  experience_years INT,
  is_verified BOOLEAN,
  verified_at TIMESTAMPTZ,
  consultation_fee NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    hdp.id,
    hdp.user_id,
    hdp.full_name,
    hdp.specialty,
    COALESCE(hdp.rating, 0)::NUMERIC,
    hdp.experience_years,
    hdp.is_verified,
    hdp.verified_at,
    hdp.consultation_fee
  FROM public.health_doctor_profiles hdp
  WHERE 
    hdp.is_verified = TRUE
    AND (p_specialty IS NULL OR hdp.specialty ILIKE '%' || p_specialty || '%')
  ORDER BY hdp.rating DESC, hdp.full_name ASC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public, pg_catalog;

GRANT EXECUTE ON FUNCTION public.get_verified_doctors(TEXT, INT, INT) TO anon, authenticated, service_role;

-- =====================================================
-- 7. PHARMACY INVENTORY RPC
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_pharmacy_medicines(
  p_search TEXT DEFAULT NULL,
  p_category_id UUID DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  medicine_id UUID,
  medicine_name TEXT,
  generic_name TEXT,
  category TEXT,
  manufacturer TEXT,
  price NUMERIC,
  stock_quantity INT,
  requires_prescription BOOLEAN,
  availability_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    hm.id,
    hm.medicine_name,
    hm.generic_name,
    hmc.category_name,
    hm.manufacturer,
    hm.price,
    COALESCE(hm.stock_quantity, 0),
    hm.requires_prescription,
    CASE 
      WHEN hm.stock_quantity > 10 THEN 'in_stock'::TEXT
      WHEN hm.stock_quantity > 0 THEN 'low_stock'::TEXT
      ELSE 'out_of_stock'::TEXT
    END
  FROM public.health_medicines hm
  LEFT JOIN public.health_medicine_categories hmc ON hm.category_id = hmc.id
  WHERE 
    (p_search IS NULL OR hm.medicine_name ILIKE '%' || p_search || '%' OR hm.generic_name ILIKE '%' || p_search || '%')
    AND (p_category_id IS NULL OR hm.category_id = p_category_id)
    AND hm.is_active = TRUE
  ORDER BY hm.medicine_name ASC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public, pg_catalog;

GRANT EXECUTE ON FUNCTION public.get_pharmacy_medicines(TEXT, UUID, INT, INT) TO anon, authenticated, service_role;

-- =====================================================
-- 8. HELPER FUNCTION: CHECK IF USER IS ADMIN
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = p_user_id AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public, pg_catalog;

-- =====================================================
-- 9. MEDICINE ORDER RPC
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_medicine_order(
  p_user_id UUID,
  p_items JSONB, -- Array of {medicine_id, quantity, requires_prescription}
  p_delivery_address JSONB
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  order_id UUID,
  total_amount NUMERIC,
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  v_order_id UUID;
  v_total_amount NUMERIC := 0;
  v_item JSONB;
  v_medicine_id UUID;
  v_quantity INT;
  v_price NUMERIC;
  v_stock INT;
BEGIN
  v_order_id := gen_random_uuid();

  -- Validate and calculate total
  FOR v_item IN SELECT jsonb_array_elements(p_items)
  LOOP
    v_medicine_id := (v_item->>'medicine_id')::UUID;
    v_quantity := (v_item->>'quantity')::INT;

    -- Get medicine price and stock
    SELECT price, stock_quantity
    INTO v_price, v_stock
    FROM public.health_medicines
    WHERE id = v_medicine_id;

    IF v_price IS NULL THEN
      RETURN QUERY SELECT 
        FALSE::BOOLEAN,
        'Medicine not found: ' || v_medicine_id::TEXT,
        NULL::UUID,
        NULL::NUMERIC,
        NULL::TIMESTAMPTZ;
      RETURN;
    END IF;

    IF v_stock < v_quantity THEN
      RETURN QUERY SELECT 
        FALSE::BOOLEAN,
        'Insufficient stock for medicine: ' || v_medicine_id::TEXT,
        NULL::UUID,
        NULL::NUMERIC,
        NULL::TIMESTAMPTZ;
      RETURN;
    END IF;

    v_total_amount := v_total_amount + (v_price * v_quantity);
  END LOOP;

  -- Create order
  INSERT INTO public.health_medicine_orders (
    id,
    user_id,
    total_amount,
    order_status,
    delivery_address,
    created_at,
    updated_at
  )
  VALUES (
    v_order_id,
    p_user_id,
    v_total_amount,
    'pending',
    p_delivery_address,
    NOW(),
    NOW()
  );

  -- Add order items
  FOR v_item IN SELECT jsonb_array_elements(p_items)
  LOOP
    v_medicine_id := (v_item->>'medicine_id')::UUID;
    v_quantity := (v_item->>'quantity')::INT;

    SELECT price INTO v_price
    FROM public.health_medicines
    WHERE id = v_medicine_id;

    INSERT INTO public.health_medicine_order_items (
      id,
      order_id,
      Medicine_id,
      quantity,
      price_per_unit,
      created_at
    )
    VALUES (
      gen_random_uuid(),
      v_order_id,
      v_medicine_id,
      v_quantity,
      v_price,
      NOW()
    );

    -- Reduce stock
    UPDATE public.health_medicines
    SET stock_quantity = stock_quantity - v_quantity
    WHERE id = v_medicine_id;
  END LOOP;

  RETURN QUERY SELECT 
    TRUE::BOOLEAN,
    'Medicine order created successfully'::TEXT,
    v_order_id,
    v_total_amount,
    NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public, pg_catalog;;

GRANT EXECUTE ON FUNCTION public.create_medicine_order(UUID, JSONB, JSONB) TO authenticated, service_role;

COMMIT;

-- =====================================================
-- SUCCESS
-- =====================================================
-- All health module RPC functions created successfully!
-- 
-- Next steps:
-- 1. Frontend TypeScript types already exist
-- 2. Create backend service layer (healthService.ts)
-- 3. Update React components to use new RPC functions
-- 4. Test each endpoint
-- =====================================================
