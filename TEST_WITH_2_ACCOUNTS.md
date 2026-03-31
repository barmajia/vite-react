# ✅ Testing with 2 Accounts

## 🎯 Your Situation

You have **2 accounts** in the project but seeing:
```
No conversations found for this user
```

This is **NORMAL** - you haven't created any conversations yet!

---

## 🧪 Step-by-Step Test

### Step 1: Find Your User IDs

**Run in Supabase SQL Editor:**

```sql
-- Get all users from auth.users
SELECT 
  id,
  email,
  raw_user_meta_data,
  created_at
FROM auth.users
ORDER BY created_at DESC;
```

**Copy the 2 user IDs:**
- User 1: `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`
- User 2: `bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb`

---

### Step 2: Create Test Conversation

**Run this SQL (replace IDs):**

```sql
-- Create conversation between your 2 users
DO $$
DECLARE
  v_conv_id UUID;
BEGIN
  -- Create conversation
  INSERT INTO conversations (id, product_id, created_at, updated_at)
  VALUES (gen_random_uuid(), NULL, NOW(), NOW())
  RETURNING id INTO v_conv_id;
  
  -- Add BOTH users as participants
  INSERT INTO conversation_participants (conversation_id, user_id, role, joined_at)
  VALUES 
    (v_conv_id, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'customer'::user_role, NOW()),
    (v_conv_id, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'seller'::user_role, NOW());
  
  RAISE NOTICE '✓ Created: %', v_conv_id;
END $$;
```

---

### Step 3: Test in Browser

1. **Refresh** chat page (logged in as User 1)
2. You should now see **1 conversation** in sidebar!
3. Click it to open chat window
4. Send a test message

---

### Step 4: Test StartNewChat

1. Click **RED button** or **Plus button**
2. Modal opens
3. **Type 2+ characters** (e.g., part of User 2's email)
4. Console logs:
   ```
   Search triggered: {query: 'test', queryLength: 4, ...}
   Calling RPC: search_auth_users
   Auth users RPC response: { data: [...], dataLength: 1 }
   ```
5. **User 2 should appear** in search results!
6. Select User 2
7. Click "Start Chat"
8. Should create/open conversation with User 2

---

## 🔍 Debug: Search Not Working?

### Check Console Logs

You should see:
```
Search triggered: {query: 'ab', queryLength: 2, hasUser: true, meetsMinLength: true}
Starting search for: ab
Calling RPC: search_auth_users
Auth users RPC response: { data: Array(1), error: null, dataLength: 1 }
Setting transformed auth results: [...]
```

### If Search Not Triggered

**Check:**
1. ✅ Typed **2+ characters** (minimum required)
2. ✅ Logged in (has user)
3. ✅ Search box is focused

### If RPC Fails

```
RPC search failed, falling back to public.users query
```

**Fix:** Run `add-search-auth-users-rpc.sql` in Supabase

### If No Results

```
Direct query result: { directData: [], dataLength: 0 }
```

**Meaning:** No other users match your search  
**Fix:** Search for the exact email of User 2

---

## 🎯 Expected Flow with 2 Accounts

```
Login as User 1
  ↓
Open Chat page
  ↓
Sidebar shows: "No conversations yet" (normal!)
  ↓
Click RED button → StartNewChat modal
  ↓
Type User 2's email (e.g., "test@example.com")
  ↓
Search finds User 2
  ↓
Select User 2 → Click "Start Chat"
  ↓
Conversation created
  ↓
Sidebar now shows: "1 conversation"
  ↓
Click conversation → Chat window opens
  ↓
Send message to User 2
```

---

## 📊 Verify in Database

After creating conversation:

```sql
-- Check conversations
SELECT 
  c.id,
  c.created_at,
  cp.user_id,
  cp.role,
  u.email
FROM conversations c
JOIN conversation_participants cp ON c.id = cp.conversation_id
LEFT JOIN public.users u ON cp.user_id = u.user_id
ORDER BY c.created_at DESC;
```

Should show:
```
conv-id | 2026-03-31 | user1-id | customer | user1@example.com
conv-id | 2026-03-31 | user2-id | seller   | user2@example.com
```

---

## ✅ Quick Test Checklist

- [ ] Run SQL to find 2 user IDs
- [ ] Run SQL to create conversation between them
- [ ] Refresh chat page (as User 1)
- [ ] See 1 conversation in sidebar
- [ ] Click conversation → Opens chat window
- [ ] Click RED button → Modal opens
- [ ] Type User 2's email → Search finds User 2
- [ ] Select User 2 → "Start Chat" creates conversation
- [ ] Send message → Appears in chat

---

## 🐛 Common Issues

### Issue: "No conversations found"
**Normal!** You haven't created any yet.  
**Fix:** Run SQL to create test conversation

### Issue: Search returns no results
**Cause:** No users match search query  
**Fix:** Type exact email of User 2

### Issue: RPC function doesn't exist
**Normal!** Uses fallback automatically  
**Fix:** Run `add-search-auth-users-rpc.sql` (optional)

### Issue: Can't see other user
**Cause:** Only 1 user in database  
**Fix:** Create second account via signup

---

## 🎯 Summary

**Your logs show:**
- ✅ Component is working
- ✅ Account type fetched successfully
- ✅ Search ready (waiting for input)
- ⚠️ No conversations yet (normal for new install)

**Next:**
1. Run SQL to create conversation between your 2 accounts
2. Refresh page → See conversation
3. Test search by typing other user's email

---

**Last Updated:** 2026-03-31  
**Status:** ✅ Component working, needs test data
