-- =====================================================
-- Admin Product Management RLS Policy
-- =====================================================
-- This policy allows users in the admin_users table 
-- to manage ALL products in the system (not just their own)
-- =====================================================

-- Step 1: Drop existing admin policies if they exist
DROP POLICY IF EXISTS "admins_manage_all_products" ON "public"."products";

-- Step 2: Create admin policy
-- Admins are identified by having their user_id in the admin_users table
CREATE POLICY "admins_manage_all_products" ON "public"."products"
TO "authenticated"
USING (
  -- Check if current user is an admin
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.user_id = auth.uid()
  )
)
WITH CHECK (
  -- Same check for INSERT/UPDATE operations
  EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.user_id = auth.uid()
  )
);

-- =====================================================
-- Verification Queries
-- =====================================================

-- Check if the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'products' 
AND policyname LIKE '%admin%';

-- Check if your user is in admin_users table
-- Run this to verify:
-- SELECT * FROM admin_users WHERE user_id = auth.uid();

-- Add yourself to admin_users table (if needed):
-- INSERT INTO admin_users (user_id) 
-- VALUES ('YOUR_USER_ID_HERE');

-- =====================================================
-- Testing
-- =====================================================
-- After running this SQL:
-- 1. Refresh your browser
-- 2. Navigate to /admin/products/{id}/edit
-- 3. Check console for "👑 Is admin: true (found in admin_users)"
-- 4. Try saving changes
-- 5. Should see "✅ Admin bypass - no seller_id filter"
-- 6. Should see "✅ Update successful"
