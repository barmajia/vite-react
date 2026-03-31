-- =====================================================
-- Check Your Actual Conversations Table Schema
-- Run this FIRST to see what columns you actually have
-- =====================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'conversations'
ORDER BY ordinal_position;

-- Check constraints (NOT NULL columns)
SELECT 
  column_name,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'conversations'
  AND is_nullable = 'NO';
