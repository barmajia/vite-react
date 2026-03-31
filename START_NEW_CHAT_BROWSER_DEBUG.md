# 🔍 StartNewChat Debug Guide - With Console Logs

## ✅ SQL is Working (Confirmed)
Your Supabase tests show:
- ✅ `users` table has data
- ✅ `search_users_for_chat` function exists
- ✅ Function definition is correct

## 🔍 Now Debug the React Side

### Step 1: Open Browser Console

1. Open your chat page: `http://localhost:5173/chat` (or your URL)
2. Press **F12** to open DevTools
3. Go to **Console** tab
4. Click **"Start New Chat"** button

### Step 2: Watch for These Logs

You should see this sequence:

```
Fetching current user account_type for: {user-id}
Current user account_type: {type}
```

Then when you type in search (2+ characters):

```
Starting search for: test
Calling RPC: search_users_for_chat
RPC response - data: [...] error: null
```

OR if RPC fails:

```
RPC search failed, falling back to direct query: {error}
Trying direct query to users table
Direct query - data: [...] error: null
Filtered results: [...]
```

### Step 3: Check What You See

#### Scenario A: "Search skipped" message
```
Search skipped: query=  user= {id}
```
**Problem:** Search query is empty or user is null  
**Fix:** Make sure you're logged in and type 2+ characters

---

#### Scenario B: "No user ID available"
```
No user ID available
```
**Problem:** useAuth() not returning user  
**Fix:** Check if you're logged in, verify auth is working

---

#### Scenario C: "Error fetching current user"
```
Error fetching current user: {error}
```
**Problem:** Can't find your user in `public.users`  
**Fix:** Run this to check:
```sql
SELECT * FROM public.users WHERE user_id = auth.uid();
```
If empty, your `handle_new_user` trigger isn't working.

---

#### Scenario D: RPC returns empty array
```
Calling RPC: search_users_for_chat
RPC response - data: [] error: null
```
**Problem:** RPC is working but no users match  
**Fix:** 
1. Check if there are other users in database:
```sql
SELECT user_id, email, full_name FROM public.users LIMIT 10;
```
2. Check if you're excluding yourself (correct behavior)
3. Try searching for an email you know exists

---

#### Scenario E: RPC error, fallback also fails
```
RPC search failed: function does not exist
Trying direct query to users table
Direct query - data: null error: {permission error}
```
**Problem:** RLS policy blocking access  
**Fix:** Run this in Supabase:
```sql
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view all users for chat" ON public.users
FOR SELECT TO authenticated USING (true);
```

---

#### Scenario F: Works perfectly! ✅
```
Calling RPC: search_users_for_chat
RPC response - data: [{user_id: "...", email: "...", ...}]
Search results: [{...}]
```
**Status:** Everything working! ✅

---

## 🧪 Test Checklist

### 1. Verify Current User is Loaded
Open console and type:
```javascript
// In browser console
console.log("Current user:", window.supabase?.auth?.getUser());
```

Should return your user object.

### 2. Test RPC Manually
In browser console:
```javascript
const { data, error } = await supabase.rpc('search_users_for_chat', {
  p_query: 'test',
  p_current_user_id: 'YOUR-USER-ID-HERE'
});
console.log('RPC result:', data, error);
```

Should return array of users.

### 3. Test Direct Query
In browser console:
```javascript
const { data, error } = await supabase
  .from('users')
  .select('id, user_id, email, full_name, account_type')
  .limit(5);
console.log('Direct query:', data, error);
```

Should return 5 users.

---

## 📊 Common Issues & Solutions

### Issue 1: "You need to add at least one example"
**Symptom:** Search shows "No users found"  
**Check:** 
```sql
SELECT COUNT(*) FROM public.users;
```
**Fix:** Insert test users or fix `handle_new_user` trigger

---

### Issue 2: Only see myself in results
**Symptom:** Search returns only your user  
**Check:** Console logs for "neq" filter  
**Expected:** Should exclude current user (correct behavior)  
**Test:** Search with a different user account

---

### Issue 3: RPC function not found
**Symptom:** 
```
RPC search failed: function search_users_for_chat does not exist
```
**Fix:** Run `add-chat-rpc-functions.sql` in Supabase

---

### Issue 4: Permission denied
**Symptom:**
```
Direct query error: permission denied for table users
```
**Fix:** Run RLS policy fix (see Scenario E above)

---

### Issue 5: account_type is null
**Symptom:**
```
Current user account_type: null
```
**Fix:**
```sql
-- Check your user exists
SELECT * FROM public.users WHERE user_id = auth.uid();

-- If missing, check trigger
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'handle_new_user';
```

---

## 🎯 Expected Flow

1. **Open modal** → Fetch current user's account_type
2. **Type "a"** → Nothing (need 2+ chars)
3. **Type "ad"** → Search starts
4. **Console shows:**
   ```
   Starting search for: ad
   Calling RPC: search_users_for_chat
   RPC response - data: [{...}]
   ```
5. **UI shows:** User list with avatars and badges
6. **Click user** → User gets selected (highlighted)
7. **Click "Start Chat"** → Creates conversation
8. **Navigate to:** `/Chat?conversation={id}`

---

## 📝 Copy-Paste Debug Commands

### Check if your user exists:
```sql
SELECT user_id, email, full_name, account_type 
FROM public.users 
WHERE user_id = auth.uid();
```

### Check total users:
```sql
SELECT COUNT(*) FROM public.users;
```

### Check all account types:
```sql
SELECT DISTINCT account_type FROM public.users;
```

### Check RLS policies:
```sql
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users';
```

### Test RPC function:
```sql
SELECT * FROM search_users_for_chat('test', auth.uid());
```

---

## 🚨 If Still Not Working

### 1. Enable Supabase Debug Logging
In Supabase Dashboard → Database → Logs

### 2. Check Browser Network Tab
- F12 → Network tab
- Filter by "rpc"
- Look for `search_users_for_chat` call
- Check response

### 3. Verify Supabase Client
In browser console:
```javascript
console.log("Supabase:", typeof supabase);
console.log("Auth:", typeof supabase.auth);
```

Should both be "object".

### 4. Check Component is Mounted
Add temporary alert:
```typescript
console.log("StartNewChat component mounted!");
```

---

## ✅ Success Indicators

You'll know it's working when you see:

1. ✅ "Current user account_type: {type}" in console
2. ✅ "Starting search for: {query}" when typing
3. ✅ "RPC response - data: [...]" with array of users
4. ✅ Search results displayed in modal
5. ✅ Can select a user
6. ✅ Can start conversation
7. ✅ Navigates to chat page

---

## 📞 Next Steps

After running the debug:

1. **Copy console logs** from browser
2. **Share the output** you see
3. **Tell me which scenario** matches your situation

Then I can provide the exact fix!

---

Last Updated: 2026-03-30
