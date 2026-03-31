# ✅ StartNewChat Fixed - Debug Guide

## 🎯 What Was Fixed

### Problem 1: Wrong Column in Query
```typescript
// ❌ BEFORE (WRONG)
.eq("id", user.id)  // This queries the PRIMARY KEY

// ✅ AFTER (CORRECT)
.eq("user_id", user.id)  // This queries the FK to auth.users
```

**Why it failed:**
- `public.users` table has TWO UUID columns:
  - `id` = Primary key (auto-generated)
  - `user_id` = Foreign key to `auth.users` (this is what we need!)
- Query was looking for `id = auth-user-id` which doesn't exist
- Should be `user_id = auth-user-id`

### Problem 2: Missing Debug Logs
Added comprehensive logging to track:
- Current user account_type fetch
- Search trigger conditions
- RPC function calls
- Fallback query execution
- Results at each step

---

## 🔍 How to Debug Now

### Step 1: Open Browser Console
1. Open chat page: `http://localhost:5173/Chat`
2. Press **F12** (DevTools)
3. Go to **Console** tab
4. Click **"Start New Chat"** button (RED or Plus)

### Step 2: Watch for These Logs

#### Account Type Fetch (on modal open):
```
No user ID available
```
OR
```
Fetching account_type for user: af606390-...
Account type result: { data: { account_type: 'user' }, error: null }
Current user account_type: user
```

#### Search Trigger (when typing):
```
Search triggered: {
  query: "test",
  queryLength: 4,
  hasUser: true,
  meetsMinLength: true
}
Starting search for: test
Calling RPC: search_users_for_chat
RPC response: { data: [...], error: null, dataLength: 3 }
Setting RPC results: [...]
```

OR if RPC fails:
```
RPC search failed, falling back to direct query: function does not exist
Fallback query with: test
Direct query result: { directData: [...], directError: null, dataLength: 5 }
Filtering with terms: ['test']
Filtered results: [...]
```

---

## 📊 Expected Console Output

### ✅ Working Correctly:
```
Fetching account_type for user: af606390-...
Account type result: { data: { account_type: 'user' }, error: null }
Current user account_type: user

Search triggered: { query: 'ad', queryLength: 2, hasUser: true, meetsMinLength: true }
Starting search for: ad
Calling RPC: search_users_for_chat
RPC response: { data: Array(2), error: null, dataLength: 2 }
Setting RPC results: Array(2)
```

### ❌ RPC Function Missing (Normal):
```
Fetching account_type for user: af606390-...
Current user account_type: user

Search triggered: { query: 'ad', ... }
Calling RPC: search_users_for_chat
RPC response: { data: null, error: { message: 'function ... does not exist' } }
RPC search failed, falling back to direct query: function ... does not exist
Fallback query with: ad
Direct query result: { directData: Array(3), directError: null, dataLength: 3 }
Filtered results: Array(3)
```

### ❌ RLS Blocking (Need SQL Fix):
```
Calling RPC: search_users_for_chat
RPC response: { data: null, error: { message: 'permission denied' } }
Fallback query with: ad
Direct query result: { directData: null, directError: { code: 'PGRST116', message: '...' } }
Fallback query error: { code: 'PGRST116', ... }
```

---

## 🛠️ Fixes Based on Console Output

### Issue 1: "No user ID available"
**Meaning:** useAuth() not returning user  
**Fix:** Make sure you're logged in

### Issue 2: "Failed to fetch current user's account_type"
**Check:** Your user exists in `public.users`:
```sql
SELECT * FROM public.users WHERE user_id = auth.uid();
```

**If empty:** Run this to add yourself:
```sql
INSERT INTO public.users (user_id, email, account_type)
VALUES (auth.uid(), auth.email(), 'user');
```

### Issue 3: "function does not exist"
**Meaning:** RPC function not installed  
**Fix:** Run `add-chat-rpc-functions.sql` in Supabase

### Issue 4: "permission denied" or "PGRST116"
**Meaning:** RLS policy blocking access  
**Fix:** Run `fix-users-chat-rls-policy.sql`:
```sql
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view all users for chat" ON public.users
FOR SELECT TO authenticated USING (true);
```

### Issue 5: "Direct query result: { directData: [], ... }"
**Meaning:** No other users in database  
**Fix:** Add test users:
```sql
-- Add test user
INSERT INTO public.users (user_id, email, full_name, account_type)
VALUES (
  '00000000-0000-0000-0000-000000000000', -- Replace with real UUID
  'test@example.com',
  'Test User',
  'seller'
);
```

---

## 🧪 Test Checklist

### Test 1: Modal Opens
- [ ] Click RED button or Plus button
- [ ] Modal appears with "Start New Chat" title
- [ ] Search box is visible and focused
- [ ] Console shows account_type fetch logs

### Test 2: Search Works
- [ ] Type 2 characters (e.g., "ad", "te", "us")
- [ ] Console shows "Search triggered" log
- [ ] Console shows "Calling RPC" or "Fallback query"
- [ ] Console shows results with dataLength > 0
- [ ] UI shows user list with avatars and badges

### Test 3: Select User
- [ ] Click on a user in results
- [ ] User gets highlighted (blue border + checkmark)
- [ ] "Start Chat" button becomes enabled

### Test 4: Create Conversation
- [ ] Click "Start Chat" button
- [ ] Console shows conversation creation logs
- [ ] Modal closes
- [ ] Navigates to `/Chat?conversation={id}`
- [ ] Chat window opens

---

## 📋 Quick SQL Fixes

### Fix All Chat Issues (Run in Order):

```sql
-- 1. Fix RLS policy (allow viewing users)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view all users for chat" ON public.users
FOR SELECT TO authenticated USING (true);

-- 2. Add RPC functions (copy from add-chat-rpc-functions.sql)
-- Search function
CREATE OR REPLACE FUNCTION public.search_users_for_chat(
  p_query TEXT,
  p_current_user_id UUID
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  account_type TEXT
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO public, pg_catalog
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_current_user_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT u.id, u.user_id, u.email, u.full_name, u.avatar_url, u.account_type
  FROM public.users u
  WHERE u.user_id != p_current_user_id
    AND (u.full_name ILIKE '%' || p_query || '%' 
         OR u.email ILIKE '%' || p_query || '%')
  ORDER BY CASE WHEN u.full_name ILIKE p_query || '%' THEN 0 ELSE 1 END, u.full_name
  LIMIT 50;
END;
$$;

-- 3. Add test conversation
DO $$
DECLARE
  v_conv_id UUID;
BEGIN
  INSERT INTO conversations (id, created_at, updated_at)
  VALUES (gen_random_uuid(), NOW(), NOW())
  RETURNING id INTO v_conv_id;
  
  INSERT INTO conversation_participants (conversation_id, user_id, role, joined_at)
  VALUES (v_conv_id, auth.uid(), 'customer'::user_role, NOW());
  
  RAISE NOTICE 'Created test conversation: %', v_conv_id;
END $$;
```

---

## ✅ Success Indicators

You'll know it's working when you see:

1. ✅ Modal opens on button click
2. ✅ Console shows account_type fetched successfully
3. ✅ Typing 2+ chars triggers search
4. ✅ Console shows results with dataLength > 0
5. ✅ UI displays users with avatars and badges
6. ✅ Can select user (highlighted)
7. ✅ Can start conversation
8. ✅ Navigates to chat window

---

## 🐛 Common Issues

### "No users found"
**Cause:** No other users in database  
**Solution:** Add test users or check RLS policy

### "Function does not exist"
**Cause:** RPC not installed  
**Solution:** Run add-chat-rpc-functions.sql (uses fallback automatically)

### "Permission denied"
**Cause:** RLS blocking  
**Solution:** Run RLS policy fix

### Modal doesn't open
**Cause:** Button not connected  
**Solution:** Check ChatHeader or ChatLayout has StartNewChat component

---

## 📞 Next Steps

After fixing:
1. ✅ Test search with different queries
2. ✅ Verify users show with correct badges
3. ✅ Create a test conversation
4. ✅ Send a message
5. ✅ Check conversation appears in sidebar

---

**Last Updated:** 2026-03-30  
**Build Status:** ✅ Successful  
**Fixed Issues:** user_id query, added debug logs
