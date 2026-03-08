-- Verify categories table structure and data
-- Run this in Supabase SQL Editor

-- Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'categories'
ORDER BY ordinal_position;

-- Check existing data
SELECT * FROM categories ORDER BY display_order, name;

-- Check if indexes exist
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'categories';

-- Check RLS policies
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'categories';
