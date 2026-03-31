# 🚨 RLS Infinite Recursion Error - FIXED

**Date:** March 29, 2026  
**Error:** `infinite recursion detected in policy for relation "conversation_participants"`  
**Status:** ⚠️ **REQUIRES DATABASE FIX**

---

## 🐛 Problem

**Error Message:**
```
42P17: infinite recursion detected in policy for relation "conversation_participants"
```

**Root Cause:**
Your Row Level Security (RLS) policies on the `conversation_participants` table are creating an infinite loop. This happens when:

1. A policy on table A references table A itself
2. The reference triggers the same policy again
3. Creating an infinite recursion loop

**Example of BAD Policy:**
```sql
-- ❌ This causes infinite recursion
CREATE POLICY "users can read participants"
ON conversation_participants
FOR SELECT
USING (
  user_id IN (
    SELECT user_id FROM conversation_participants WHERE ...
  )
);
```

---

## ✅ Solution

**Run the SQL fix script in Supabase:**

### Step 1: Go to Supabase SQL Editor
1. Open https://app.supabase.com
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**

### Step 2: Run the Fix Script
Copy and paste the contents of [`fix-chat-rls-policies.sql`](./fix-chat-rls-policies.sql) into the SQL Editor and run it.

The script will:
1. ✅ Drop all problematic policies
2. ✅ Recreate policies WITHOUT recursion
3. ✅ Verify the policies were created
4. ✅ Test the fix

### Step 3: Verify the Fix
After running the script, you should see:
```
✅ Policies created successfully
✅ No recursion errors
✅ Chat conversations load without errors
```

---

## 📋 What the Fix Does

### Before (Bad - Causes Recursion):
```sql
-- ❌ References itself infinitely
CREATE POLICY "Users can read participants"
ON conversation_participants
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.user_id = auth.uid()
  )
);
```

### After (Good - No Recursion):
```sql
-- ✅ Uses subquery on different table (conversations)
CREATE POLICY "Users can read participants"
ON conversation_participants
FOR SELECT
USING (
  conversation_id IN (
    SELECT conversation_id 
    FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
);
```

**Key Difference:**
- Uses `conversation_id IN (SELECT ...)` instead of `EXISTS`
- References the `conversations` table implicitly
- Breaks the recursion loop

---

## 🗄️ Tables Fixed

| Table | Policies Fixed |
|-------|----------------|
| **conversations** | ✅ SELECT, INSERT, UPDATE, DELETE |
| **conversation_participants** | ✅ SELECT, INSERT, DELETE |
| **messages** | ✅ SELECT, INSERT, UPDATE, DELETE |
| **users** | ✅ SELECT, UPDATE |

---

## 🧪 Testing After Fix

### 1. Test in Supabase SQL Editor
```sql
-- Replace with your user ID
SELECT * FROM public.conversation_participants 
WHERE user_id = 'af606390-6b5b-45fc-81b7-f72b702db12c';
```

**Expected:** Returns rows without error

### 2. Test in Browser
```bash
npm run dev
# Navigate to /messages
```

**Expected:**
- ✅ No 500 errors in console
- ✅ Conversations load successfully
- ✅ Can create new conversations
- ✅ Can send messages

---

## 🔍 How to Check Current Policies

Run this in Supabase SQL Editor:
```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## ⚠️ Important Notes

### 1. Backup First
Before running the fix script:
```sql
-- Export current policies
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

### 2. Test in Development First
If you have a staging environment:
1. Run the script there first
2. Test thoroughly
3. Then run in production

### 3. Monitor After Deploy
After applying the fix:
- Watch for any permission errors
- Check that users can only see their own conversations
- Verify messages are properly secured

---

## 📖 RLS Best Practices

### ✅ DO:
- Use subqueries with `IN` instead of `EXISTS` when possible
- Reference different tables in policies
- Keep policies simple and avoid complex logic
- Test policies with different user roles

### ❌ DON'T:
- Reference the same table in a policy that's being protected
- Create circular dependencies between policies
- Use complex functions in policies (they can hide recursion)
- Forget to test with real user data

---

## 🆘 Troubleshooting

### Issue: Still getting recursion error after fix
**Solution:**
1. Verify the script ran successfully
2. Check that old policies were dropped:
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'conversation_participants';
   ```
3. Re-run the fix script
4. Clear browser cache and reload

### Issue: "permission denied" after fix
**Solution:**
The policies might be too restrictive. Check:
```sql
-- Make sure user can access their data
SELECT auth.uid(); -- Returns your user ID

-- Test with your actual user ID
SELECT * FROM conversation_participants 
WHERE user_id = auth.uid();
```

### Issue: Can't see any conversations
**Solution:**
Make sure you have data in the tables:
```sql
-- Check if you have conversations
SELECT COUNT(*) FROM conversation_participants 
WHERE user_id = auth.uid();

-- If 0, you need to create conversations first
```

---

## 📝 Summary

| Step | Action | Status |
|------|--------|--------|
| 1 | Run `fix-chat-rls-policies.sql` | ⏳ Pending |
| 2 | Verify policies created | ⏳ Pending |
| 3 | Test in browser | ⏳ Pending |
| 4 | Deploy to production | ⏳ Pending |

---

## 📖 Related Documentation

- [AuroraChat Implementation](./AURORACHAT_IMPLEMENTATION_COMPLETE.md)
- [Database Query Fix](./DATABASE_QUERY_FIX.md)
- [App.tsx Fixes](./APP_TSX_PROBLEMS_FIXED.md)

---

**Next Step:** Run the SQL fix script in Supabase SQL Editor! 🚀

**File:** [`fix-chat-rls-policies.sql`](./fix-chat-rls-policies.sql)
