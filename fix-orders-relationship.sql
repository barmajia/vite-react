-- Fix Orders Table Relationships
-- Run this in Supabase SQL Editor

-- 1. Check if order_items table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'order_items';

-- 2. Check if orders table has user_id column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'orders' 
ORDER BY ordinal_position;

-- 3. Check if order_items has order_id foreign key
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'order_items';

-- 4. Add foreign key constraint if missing
ALTER TABLE order_items 
DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;

ALTER TABLE order_items 
ADD CONSTRAINT order_items_order_id_fkey 
FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

-- 5. Add foreign key for product if missing
ALTER TABLE order_items 
DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;

ALTER TABLE order_items 
ADD CONSTRAINT order_items_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;

-- 6. Verify the structure
SELECT 'Orders table structure:' AS info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

SELECT 'Order Items table structure:' AS info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'order_items' 
ORDER BY ordinal_position;

-- 7. Test the join query
SELECT o.id, o.total, o.status, oi.title, oi.quantity 
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
WHERE o.user_id = auth.uid()
LIMIT 5;
