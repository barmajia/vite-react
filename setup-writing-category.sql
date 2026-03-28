-- =====================================================
-- Writing & Translation Category Setup
-- =====================================================
-- This script ensures the Writing & Translation category 
-- exists with its subcategories for the services marketplace
-- =====================================================

-- 1. First, check if the writing category exists
DO $$
DECLARE
  writing_cat_id UUID;
BEGIN
  -- Try to get the existing writing category
  SELECT id INTO writing_cat_id 
  FROM svc_categories 
  WHERE slug = 'writing';
  
  -- If it doesn't exist, create it
  IF writing_cat_id IS NULL THEN
    INSERT INTO svc_categories (
      id, 
      name, 
      slug, 
      description, 
      icon_url, 
      is_active, 
      sort_order
    ) VALUES (
      '4be486d9-8d2a-4f01-9aef-993d21656372',
      'Writing & Translation',
      'writing',
      'Professional writing, editing, and translation services for all your content needs',
      'file-text',
      true,
      10
    ) RETURNING id INTO writing_cat_id;
    
    RAISE NOTICE 'Created Writing & Translation category';
  ELSE
    RAISE NOTICE 'Writing & Translation category already exists with id: %', writing_cat_id;
  END IF;
END $$;

-- 2. Add subcategories for Writing & Translation
INSERT INTO svc_subcategories (
  category_id, 
  name, 
  slug, 
  description, 
  is_active, 
  sort_order
) VALUES 
  (
    '4be486d9-8d2a-4f01-9aef-993d21656372',
    'Translation',
    'translation',
    'Professional translation services for documents, websites, and content',
    true,
    1
  ),
  (
    '4be486d9-8d2a-4f01-9aef-993d21656372',
    'Copywriting',
    'copywriting',
    'Creative copywriting for marketing, advertising, and sales content',
    true,
    2
  ),
  (
    '4be486d9-8d2a-4f01-9aef-993d21656372',
    'Technical Writing',
    'technical-writing',
    'Clear and concise technical documentation, manuals, and guides',
    true,
    3
  ),
  (
    '4be486d9-8d2a-4f01-9aef-993d21656372',
    'Content Writing',
    'content-writing',
    'Engaging blog posts, articles, and web content',
    true,
    4
  ),
  (
    '4be486d9-8d2a-4f01-9aef-993d21656372',
    'Editing & Proofreading',
    'editing-proofreading',
    'Professional editing and proofreading to polish your content',
    true,
    5
  ),
  (
    '4be486d9-8d2a-4f01-9aef-993d21656372',
    'Resume Writing',
    'resume-writing',
    'Professional resume and CV writing services',
    true,
    6
  )
ON CONFLICT (category_id, slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;

-- 3. Verify the setup
SELECT 
  c.name AS category_name,
  c.slug AS category_slug,
  COUNT(s.id) AS subcategories_count
FROM svc_categories c
LEFT JOIN svc_subcategories s ON c.id = s.category_id
WHERE c.slug = 'writing'
GROUP BY c.id, c.name, c.slug;

-- 4. Show all subcategories
SELECT 
  c.name AS category,
  s.name AS subcategory,
  s.slug,
  s.description,
  s.is_active,
  s.sort_order
FROM svc_subcategories s
JOIN svc_categories c ON s.category_id = c.id
WHERE c.slug = 'writing'
ORDER BY s.sort_order;
