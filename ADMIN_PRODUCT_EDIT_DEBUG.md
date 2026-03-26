# Admin Product Edit - Debug Guide

## ✅ Fixed Issues

### 1. **Authentication Check**

- ✅ Now verifies user is logged in before fetching/saving
- ✅ Stores `currentUser` ID for RLS-compliant queries
- ✅ Shows user ID and admin status in UI for debugging

### 2. **Admin Bypass for RLS Policies**

- ✅ Checks if user has `role='admin'` or `account_type='admin'`
- ✅ **Admins can edit ANY product** (no seller_id filter)
- ✅ **Non-admins can only edit their own products** (seller_id filter applied)
- ✅ Returns selected data to confirm success

### 3. **Type Conversion**

- ✅ Price: `parseFloat(String(formData.price))`
- ✅ Quantity: `parseInt(String(formData.quantity))`
- ✅ Proper TypeScript types throughout

### 4. **Debug Logging**

Console logs added for:

- ✅ Authenticated user
- 👑 Admin status check
- 🔍 Fetching product
- ✅ Product loaded with seller_id
- 💾 Saving product with full data
- 👑 Admin bypass status
- 📤 Supabase update request
- ❌ Errors with error codes
- ✅ Successful updates

### 5. **Error Handling**

Specific error messages for:

- `42501` - Permission denied (RLS policy)
- `PGRST116` - Product not found
- General errors with message

---

## 🐛 How to Debug

### Step 1: Open Browser DevTools

Press `F12` or `Ctrl+Shift+I` (Windows/Linux) / `Cmd+Opt+I` (Mac)

### Step 2: Go to Console Tab

You'll see logs like:

```
✅ Authenticated user: af606390-6b5b-45fc-81b7-f72b702db12c
👑 Is admin: true
🔍 Fetching product: 9333851c-3e82-45f0-b427-75b31e82d51b
✅ Product loaded: {...}
👤 Product seller_id: xxx
👤 Current user: af606390-...
👑 Is admin: true - Skipping seller_id filter
✅ Admin bypass - no seller_id filter
📤 Sending update to Supabase... {...}
✅ Update successful: {...}
```

### Step 3: Check Network Tab

1. Click **Save Changes**
2. Find the Supabase POST request
3. Check **Response** tab for data/error

---

## 🔍 Common Issues & Solutions

### Issue 1: "👑 Is admin: false"

**Cause:** User doesn't have admin role or account_type

**Solution:**
Run this SQL to check your user:

```sql
SELECT user_id, email, role, account_type
FROM users
WHERE user_id = auth.uid();
```

Then update your user to admin:

```sql
UPDATE users
SET role = 'admin', account_type = 'admin'
WHERE user_id = 'YOUR_USER_ID';
```

Or run the SQL policy file:

```sql
-- Run: add-admin-products-policy.sql
```

---

### Issue 2: "Product not found or has been deleted"

**Cause:** Product ID doesn't exist or is_deleted = true

**Solution:**

```sql
-- Check if product exists
SELECT id, title, is_deleted, status, seller_id
FROM products
WHERE id = 'YOUR_PRODUCT_ID';
```

---

### Issue 3: "Permission denied: You can only edit your own products"

**Cause:** User is not admin AND product doesn't belong to them

**Solution:**

- Option 1: Make user an admin (see Issue 1)
- Option 2: Ensure user is the product owner
- Option 3: Run `add-admin-products-policy.sql` to grant admin access

---

### Issue 4: "Authentication required"

**Cause:** User not logged in

**Solution:**

1. Check if user is signed in
2. Check console for: `⚠️ User not authenticated, waiting...`
3. Navigate to `/login` and sign in

---

## 🧪 Manual Test in Console

Run this in browser console to test Supabase update directly:

```javascript
const testUpdate = async () => {
  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  console.log("Current user:", user?.id);

  // Test update
  const { data, error } = await supabase
    .from("products")
    .update({ title: "Test Update " + Date.now() })
    .eq("id", "YOUR_PRODUCT_ID")
    .eq("seller_id", user?.id)
    .select();

  console.log("Result:", { data, error });

  if (error) {
    console.error("❌ Update failed:", error.message);
  } else {
    console.log("✅ Update successful!");
  }
};

testUpdate();
```

---

## 📊 Debug UI Elements

The page now shows:

- **Product ID** - In loading state and header
- **User ID** - First 8 characters shown in header
- **ASIN/SKU** - Displayed as badges if available

Example:

```
Edit Product
[ASIN: ASN-123456] [SKU: SKU-789] [ID: 123e4567...]
User: c48b490f...
```

---

## ✅ Success Indicators

You'll know it's working when you see:

1. ✅ Console: `✅ Authenticated user: ...`
2. ✅ Console: `🔍 Fetching product: ...`
3. ✅ Console: `✅ Product loaded: ...`
4. ✅ Console: `📤 Sending update to Supabase...`
5. ✅ Console: `✅ Update successful: ...`
6. ✅ Toast: "Product updated successfully!"
7. ✅ Redirected to `/admin/products`

---

## 🔐 RLS Policy Reference

Your database should have this policy:

```sql
CREATE POLICY "sellers_manage_own_products" ON "public"."products"
TO "authenticated"
USING (("seller_id" = "auth"."uid"()))
WITH CHECK (("seller_id" = "auth"."uid"()));
```

This ensures:

- ✅ Sellers can SELECT their own products
- ✅ Sellers can UPDATE their own products
- ❌ Sellers CANNOT update products owned by others

---

## 📝 Next Steps

1. **Test the edit page** - Navigate to `/admin/products/{id}/edit`
2. **Check console logs** - Verify authentication and fetch
3. **Make changes** - Update product fields
4. **Click Save** - Watch console for success/error
5. **Verify update** - Check if changes persist in database

If you still see issues, **share the console logs** and I'll help debug! 🛠️
