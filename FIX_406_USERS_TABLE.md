# 🔧 Fix 406 Errors - Users Table Missing Columns

## Problem
You're seeing **406 (Not Acceptable)** errors in the console because the `users` table in your Supabase database is missing required columns that the frontend code expects.

### Errors Being Fixed:
```
GET https://*.supabase.co/rest/v1/users?select=account_type&user_id=eq.* 406 (Not Acceptable)
GET https://*.supabase.co/rest/v1/users?select=preferred_language%2Cpreferred_currency... 406 (Not Acceptable)
Could not fetch database preferences, using local storage: Cannot coerce the result to a single JSON object
```

---

## ✅ Solution (2 Steps)

### **Step 1: Run SQL Migration in Supabase**

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy the contents of `fix-users-table-critical.sql`
3. Click **Run** to execute the migration

**What this does:**
- ✅ Adds missing columns: `account_type`, `preferred_language`, `preferred_currency`, `theme_preference`, `sidebar_state`
- ✅ Fixes RLS policies for proper access
- ✅ Creates performance indexes
- ✅ Verifies the schema is correct

### **Step 2: Refresh Your App**

After running the SQL:
1. Hard refresh your browser (`Ctrl+Shift+R` or `Cmd+Shift+R`)
2. The 406 errors should disappear
3. Database preferences will now work (instead of falling back to localStorage)

---

## 🗂️ Files Created

| File | Purpose |
|------|---------|
| `fix-users-table-critical.sql` | **MAIN FIX** - Run this in Supabase |
| `fix-users-table-missing-columns.sql` | Alternative migration (older version) |

---

## 🛠️ Code Changes Made

The following files were updated to handle errors more gracefully:

### `src/context/PreferencesContext.tsx`
- Changed `.single()` to `.maybeSingle()` to handle missing rows
- Added better error handling for 406 errors
- Falls back to localStorage silently

### `src/hooks/useUserAccountType.ts`
- Changed `.single()` to `.maybeSingle()`
- Removed error state (always defaults to 'user' on failure)
- Changed `console.warn` to `console.debug` to reduce noise

---

## 📋 Verification

After running the SQL migration, verify it worked:

### 1. Check columns exist:
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('account_type', 'preferred_language', 'preferred_currency', 'theme_preference', 'sidebar_state');
```

### 2. Test query your user:
```sql
SELECT 
  user_id,
  account_type,
  preferred_language,
  preferred_currency,
  theme_preference,
  sidebar_state
FROM public.users
WHERE user_id = 'c48b490f-bc55-4854-a202-98347ebd59b8'
LIMIT 1;
```

### 3. Check RLS policies:
```sql
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'users';
```

---

## 🎯 Expected Result

After the fix:
- ✅ No 406 errors in console
- ✅ No "Cannot coerce the result" warnings
- ✅ Database preferences load correctly
- ✅ Account type detection works
- ✅ App still works if columns don't exist (graceful fallback)

---

## 🔍 Why This Happened

The `users` table was created with a basic schema, but newer features added:
- User preferences (language, currency, theme, sidebar state)
- Account type detection (seller, factory, middleman, etc.)

The SQL migration adds these missing columns and fixes the RLS policies.

---

## 📞 Still Having Issues?

If you still see 406 errors after running the SQL:

1. **Check the SQL ran successfully** - Look for "Success" message in Supabase
2. **Verify columns exist** - Run the verification query above
3. **Check RLS policies** - Make sure policies were created
4. **Clear browser cache** - Hard refresh (`Ctrl+Shift+R`)
5. **Check Supabase logs** - Look for any errors in Supabase Dashboard → Logs

---

## 🚀 Next Steps

Once this is fixed, your app will:
- Load user preferences from database
- Properly detect user account types
- Show correct UI based on user role
- Sync preferences across devices

---

**Created:** March 26, 2026  
**Priority:** HIGH  
**Impact:** All authenticated users
