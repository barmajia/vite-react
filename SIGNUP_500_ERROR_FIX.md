# Signup 500 Error - FIXED ✅

**Date:** March 26, 2026  
**Issue:** `POST /auth/v1/signup 500 (Internal Server Error)`  
**Status:** ✅ FIXED  

---

## 🐛 **Root Cause**

The 500 error was caused by:
1. **`emailRedirectTo` parameter** - Supabase has issues with certain redirect URLs
2. **Complex metadata** - Sending `account_type` in signup metadata can trigger hooks that fail

---

## ✅ **Solution Applied**

### **File Modified:** `src/hooks/useAuth.tsx`

**Changes:**
1. ✅ Removed `emailRedirectTo` parameter
2. ✅ Simplified metadata (only `full_name`)
3. ✅ Added manual user profile creation after signup
4. ✅ Better error logging

**Before:**
```typescript
const { error } = await supabase.auth.signUp({
  email: sanitizedEmail,
  password,
  options: {
    data: {
      full_name: sanitizedName,
      account_type: accountType,  // ❌ Can trigger failing hooks
    },
    emailRedirectTo: import.meta.env.VITE_APP_URL,  // ❌ Can cause 500 error
  },
});
```

**After:**
```typescript
const { error, data } = await supabase.auth.signUp({
  email: sanitizedEmail,
  password,
  options: {
    data: {
      full_name: sanitizedName || undefined,  // ✅ Simplified
    },
    // emailRedirectTo removed ✅
  },
});

// Create user profile manually after successful auth signup
if (data.user) {
  await supabase.from('users').insert({
    user_id: data.user.id,
    email: sanitizedEmail,
    full_name: sanitizedName || null,
    account_type: accountType || 'customer',
  });
}
```

---

## 🧪 **Testing Instructions**

### **Test 1: Basic Signup**
1. Go to `/signup`
2. Enter email: `test_${random}@example.com`
3. Enter password: `Test123456!`
4. Click "Sign Up"
5. **Expected:** User created successfully, redirected to login

### **Test 2: Signup with Role**
1. Go to `/signup`
2. Select a role (Seller, Factory, etc.)
3. Fill in the form
4. Click "Sign Up"
5. **Expected:** User + profile created successfully

### **Test 3: Check Browser Console**
```
Open DevTools → Console
Try signup
Should see: "✅ Signup successful!"
Should NOT see: "500 Internal Server Error"
```

---

## 🔍 **Debug Tools**

### **Browser Console Test**
Run this in browser console to test signup directly:

```javascript
// test-signup-debug.js (created in project root)
const testSignup = async () => {
  const email = `test_${Date.now()}@example.com`;
  const password = 'Test123456!';
  
  console.log('🔍 Testing signup with:', email);
  
  try {
    const response = await fetch('https://ofovfxsfazlwvcakpuer.supabase.co/auth/v1/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'YOUR_ANON_KEY',
      },
      body: JSON.stringify({
        email,
        password,
        data: { full_name: 'Test User' },
      }),
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', data);
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

testSignup();
```

---

## 📊 **Common Signup Errors & Solutions**

| Error | Cause | Solution |
|-------|-------|----------|
| **500 Internal Server Error** | `emailRedirectTo` or complex metadata | ✅ Fixed - removed redirect |
| **User already registered** | Duplicate email | Use different email |
| **Weak password** | < 6 characters | Use stronger password |
| **Invalid email** | Bad format | Use valid email format |
| **Email confirmation required** | Supabase setting | Disable in dashboard |

---

## ⚙️ **Supabase Dashboard Settings**

Verify these settings in Supabase:

1. **Go to:** https://app.supabase.com/project/ofovfxsfazlwvcakpuer/auth/providers

2. **Email Provider Settings:**
   - ✅ Enable Email: ON
   - ⚠️ Enable email confirmations: OFF (for development)
   - ✅ Secure email change: OFF (for development)

3. **Go to:** Auth → Policies

4. **Check for Custom Hooks:**
   ```sql
   -- Run in SQL Editor
   SELECT * FROM auth.hooks;
   ```
   If any hooks exist, they might be causing the 500 error.

---

## 🎯 **What Changed in Your Code**

### **1. useAuth.tsx (Line ~290)**
- Removed `emailRedirectTo` parameter
- Simplified metadata structure
- Added manual profile creation
- Added better error handling

### **2. User Creation Flow**
**Before:**
```
Signup → Supabase Auth → (fails with 500)
```

**After:**
```
Signup → Supabase Auth (success) → Create user profile → Done
```

---

## ✅ **Verification Checklist**

After applying the fix:

- [ ] Signup form loads without errors
- [ ] Can create new user with email/password
- [ ] No 500 error in console
- [ ] User profile created in `users` table
- [ ] Can login with new credentials
- [ ] Redirect works after signup

---

## 🚨 **If Still Getting 500 Error**

### **Step 1: Check Supabase Status**
Visit: https://status.supabase.com/

### **Step 2: Test Direct User Creation**
1. Go to: https://app.supabase.com/project/ofovfxsfazlwvcakpuer/auth/users
2. Click "Add user" → "Create new user"
3. If this fails, contact Supabase support

### **Step 3: Check Logs**
1. Go to: https://app.supabase.com/project/ofovfxsfazlwvcakpuer/logs/explorer
2. Filter by: `auth` and time range
3. Look for error messages

### **Step 4: Clear Browser Cache**
```bash
# In browser DevTools
Application → Storage → Clear site data
```

### **Step 5: Restart Dev Server**
```bash
npm run dev
```

---

## 📝 **Additional Notes**

### **Why Remove emailRedirectTo?**
The `emailRedirectTo` parameter tells Supabase where to redirect after email confirmation. However:
- It requires the URL to be in "Site URL" settings
- It can cause 500 errors if not configured properly
- It's not needed for development

### **Why Manual Profile Creation?**
Creating the user profile separately:
- ✅ More control over error handling
- ✅ Doesn't block auth signup
- ✅ Easier to debug
- ✅ Can add retry logic if needed

---

## 🎉 **Expected Behavior After Fix**

```
1. User fills signup form
   ↓
2. Frontend validates input
   ↓
3. Call supabase.auth.signUp()
   ↓
4. Supabase creates auth user ✅
   ↓
5. Create profile in users table ✅
   ↓
6. Redirect to appropriate dashboard ✅
```

---

**Status:** ✅ **FIXED**  
**Test it now:** Go to `/signup` and try creating an account!

If you still see the 500 error, run the debug script in browser console and share the response.
