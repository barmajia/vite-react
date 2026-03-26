-- =====================================================
-- ⚠️ CRITICAL: Admin Product Edit Fix
-- =====================================================
-- This adds an admin bypass policy so admins can edit 
-- ALL products, not just their own
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
-- ✅ Verify the policy was created
-- =====================================================
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

-- Expected result: Should show "admins_manage_all_products" with cmd = "WITH CHECK"

-- =====================================================
-- 🔧 Add Yourself to admin_users Table (If Needed)
-- =====================================================
-- Find your user ID first:
-- SELECT auth.uid() as my_user_id;

-- Then add yourself:
-- INSERT INTO admin_users (user_id)
-- VALUES ('YOUR_USER_ID_HERE');

-- =====================================================
-- ✅ Testing After Running This SQL
-- =====================================================
-- 1. Refresh your browser
-- 2. Navigate to /admin/products/{id}/edit
-- 3. Open DevTools Console (F12)
-- 4. You should see:
--    "👑 Is admin: true (found in admin_users)"
--    "👑 Admin: bypassing seller_id filter"
-- 5. Click "Save Changes"
-- 6. You should see:
--    "✅ Update successful: {id: ...}"
-- 7. Product should be updated in database

-- =====================================================
-- 📋 Policy Order Matters!
-- =====================================================
-- PostgreSQL evaluates policies in this order:
-- 1. USING policies (for SELECT)
-- 2. WITH CHECK policies (for INSERT/UPDATE)
-- 
-- If ANY policy returns false, the operation is blocked.
-- Our admin policy is PERMISSIVE (OR logic), so if you're
-- an admin OR the seller, you can edit the product.

-- =====================================================
-- 🐛 Troubleshooting
-- =====================================================
-- If you still get "Permission denied":
-- 
-- 1. Check if you're in admin_users:
--    SELECT * FROM admin_users WHERE user_id = auth.uid();
--
-- 2. Check all policies on products:
--    SELECT * FROM pg_policies WHERE tablename = 'products';
--
-- 3. Check if policy is active:
--    SELECT polname, polcmd, polroles, polqual 
--    FROM pg_policy 
--    WHERE polrelid = 'products'::regclass;
