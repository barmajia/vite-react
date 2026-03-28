-- =====================================================
-- Sample Writing & Translation Provider and Listing
-- =====================================================
-- This script creates a sample provider and listing 
-- for testing the Writing & Translation category
-- =====================================================

-- IMPORTANT: Replace 'YOUR-AUTH-USER-ID' with a real auth.users id
-- You can get this by running: SELECT id FROM auth.users LIMIT 1;

DO $$
DECLARE
  v_user_id UUID := '00000000-0000-0000-0000-000000000001'; -- REPLACE THIS
  v_provider_id UUID;
  v_writing_cat_id UUID := '4be486d9-8d2a-4f01-9aef-993d21656372';
  v_translation_sub_id UUID;
BEGIN
  -- Get the translation subcategory ID
  SELECT id INTO v_translation_sub_id 
  FROM svc_subcategories 
  WHERE slug = 'translation' AND category_id = v_writing_cat_id;
  
  -- Check if provider already exists for this user
  SELECT id INTO v_provider_id 
  FROM svc_providers 
  WHERE user_id = v_user_id;
  
  -- Create provider if doesn't exist
  IF v_provider_id IS NULL THEN
    INSERT INTO svc_providers (
      user_id,
      provider_name,
      provider_type,
      tagline,
      location_city,
      location_country,
      status,
      is_verified,
      bio
    ) VALUES (
      v_user_id,
      'Arabic Translation Experts',
      'company',
      'Professional Arabic/English translation services',
      'Cairo',
      'Egypt',
      'active',
      true,
      'We are a team of professional translators with over 10 years of experience in Arabic-English translation. We specialize in business documents, legal papers, websites, and marketing content.'
    ) RETURNING id INTO v_provider_id;
    
    RAISE NOTICE 'Created new provider: %', v_provider_id;
  ELSE
    RAISE NOTICE 'Provider already exists: %', v_provider_id;
  END IF;
  
  -- Create a sample listing
  INSERT INTO svc_listings (
    provider_id,
    category_id,
    subcategory_id,
    title,
    slug,
    description,
    listing_type,
    price_type,
    price_min,
    currency,
    is_active,
    status,
    delivery_time
  ) VALUES (
    v_provider_id,
    v_writing_cat_id,
    v_translation_sub_id,
    'Document Translation (Arabic ↔ English)',
    'document-translation-arabic-english',
    'Professional translation of business documents, websites, and legal papers. Native Arabic and English speakers with subject matter expertise.',
    'service_package',
    'fixed',
    250.00,
    'EGP',
    true,
    'active',
    '3 days'
  )
  ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    price_min = EXCLUDED.price_min,
    currency = EXCLUDED.currency,
    is_active = EXCLUDED.is_active,
    status = EXCLUDED.status,
    updated_at = NOW();
  
  RAISE NOTICE 'Created sample translation listing';
END $$;

-- Verify the listing was created
SELECT 
  l.title,
  l.slug,
  l.price_min,
  l.currency,
  p.provider_name,
  c.name AS category,
  s.name AS subcategory
FROM svc_listings l
JOIN svc_providers p ON l.provider_id = p.id
JOIN svc_categories c ON l.category_id = c.id
JOIN svc_subcategories s ON l.subcategory_id = s.id
WHERE c.slug = 'writing';
