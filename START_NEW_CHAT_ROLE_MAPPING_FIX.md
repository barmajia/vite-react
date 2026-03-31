# ✅ StartNewChat - COMPLETE FIX (Account Type & Role Mapping)

## 🎯 Problem Identified

Your code was **hardcoding `role: "customer"`** for all users, but the database has strict constraints:

### Database Schema:
```sql
-- public.users.account_type (TEXT) - Many values
'user', 'customer', 'seller', 'factory', 'middleman', 
'delivery_driver', 'freelancer', 'doctor', 'pharmacy', 
'admin', 'service_provider', 'patient', etc.

-- conversation_participants.role (user_role ENUM) - Only 5 values
'factory', 'seller', 'middleman', 'customer', 'delivery'
```

### The Issue:
```typescript
// ❌ WRONG - Hardcoded "customer" for everyone
.insert([
  { conversation_id: convId, user_id: user.id, role: "customer" },
  { conversation_id: convId, user_id: selectedUser.user_id, role: "customer" },
])
```

This would fail or create incorrect data because:
- Sellers should have `role: 'seller'`
- Factories should have `role: 'factory'`
- Delivery drivers should have `role: 'delivery'`
- etc.

---

## ✅ Solution Implemented

### 1. Added Role Mapping Function (TypeScript)

**File:** `src/components/chat/StartNewChat.tsx`

```typescript
// Map account_type to user_role enum for conversation_participants
const mapAccountTypeToRole = (accountType: string): string => {
  const roleMap: Record<string, string> = {
    user: "customer",
    customer: "customer",
    patient: "customer",
    seller: "seller",
    factory: "factory",
    middleman: "middleman",
    broker: "middleman",
    delivery: "delivery",
    delivery_driver: "delivery",
    freelancer: "seller",
    service_provider: "seller",
    doctor: "seller",
    pharmacy: "seller",
    admin: "seller",
  };
  return roleMap[accountType.toLowerCase()] || "customer";
};
```

### 2. Fetch Current User's Account Type

```typescript
const [currentUserAccountType, setCurrentUserAccountType] = useState<string | null>(null);

useEffect(() => {
  const fetchCurrentUser = async () => {
    if (!user?.id) return;

    const { data } = await supabase
      .from("users")
      .select("account_type")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setCurrentUserAccountType(data.account_type);
    }
  };

  fetchCurrentUser();
}, [user?.id]);
```

### 3. Updated Fallback Insert with Role Mapping

```typescript
// Map account types to roles for both users
const myRole = mapAccountTypeToRole(currentUserAccountType || "user");
const theirRole = mapAccountTypeToRole(selectedUser.account_type);

// Add participants with correct roles
const { error: participantsError } = await supabase
  .from("conversation_participants")
  .insert([
    {
      conversation_id: convId,
      user_id: user.id,
      role: myRole,
    },
    {
      conversation_id: convId,
      user_id: selectedUser.user_id,
      role: theirRole,
    },
  ]);
```

### 4. Updated RPC Function with Role Mapping

**File:** `add-chat-rpc-functions.sql`

```sql
-- Helper function to map account_type to user_role
FUNCTION map_account_type_to_role(p_account_type TEXT) RETURNS TEXT AS $$
BEGIN
  CASE LOWER(p_account_type)
    WHEN 'user' THEN RETURN 'customer';
    WHEN 'customer' THEN RETURN 'customer';
    WHEN 'patient' THEN RETURN 'customer';
    WHEN 'seller' THEN RETURN 'seller';
    WHEN 'factory' THEN RETURN 'factory';
    WHEN 'middleman' THEN RETURN 'middleman';
    WHEN 'broker' THEN RETURN 'middleman';
    WHEN 'delivery' THEN RETURN 'delivery';
    WHEN 'delivery_driver' THEN RETURN 'delivery';
    WHEN 'freelancer' THEN RETURN 'seller';
    WHEN 'service_provider' THEN RETURN 'seller';
    WHEN 'doctor' THEN RETURN 'seller';
    WHEN 'pharmacy' THEN RETURN 'seller';
    WHEN 'admin' THEN RETURN 'seller';
    ELSE RETURN 'customer';
  END CASE;
END;
$$ LANGUAGE plpgsql;
```

---

## 📊 Complete Mapping Table

| account_type (users) | → | role (conversation_participants) |
|---------------------|---|----------------------------------|
| user | → | customer |
| customer | → | customer |
| patient | → | customer |
| seller | → | seller |
| factory | → | factory |
| middleman | → | middleman |
| broker | → | middleman |
| delivery | → | delivery |
| delivery_driver | → | delivery |
| freelancer | → | seller |
| service_provider | → | seller |
| doctor | → | seller |
| pharmacy | → | seller |
| admin | → | seller |

**Logic:**
- **Customers/Patients** → `customer` role (they're buying/receiving services)
- **Sellers/Factories/Middlemen** → Keep their professional role
- **Service Providers** (freelancer, doctor, pharmacy, etc.) → `seller` role (they're providing services)
- **Delivery** → `delivery` role (logistics)

---

## 🚀 How to Deploy

### Step 1: Fix RLS Policy (Required for Search)

Run in Supabase SQL Editor:

```sql
-- Allow users to view other users (needed for chat search)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;

CREATE POLICY "Users can view all users for chat" ON public.users
FOR SELECT
TO authenticated
USING (true);
```

### Step 2: Add RPC Functions (Recommended)

Run the file: `add-chat-rpc-functions.sql`

This adds:
- `search_users_for_chat()` - Fast user search
- `get_or_create_direct_conversation()` - Atomic conversation creation with role mapping

### Step 3: Test

1. Open chat page
2. Click "Start New Chat"
3. Search for a user
4. Select and start conversation
5. Check browser console - should see no errors
6. Verify in database:

```sql
SELECT 
  cp.conversation_id,
  cp.user_id,
  cp.role,
  u.account_type,
  u.email
FROM conversation_participants cp
JOIN users u ON cp.user_id = u.user_id
ORDER BY cp.joined_at DESC
LIMIT 10;
```

Expected output:
```
conversation_id | user_id | role       | account_type    | email
----------------|---------|------------|-----------------|------------------
uuid            | uuid    | seller     | doctor          | doctor@example.com
uuid            | uuid    | customer   | user            | patient@example.com
```

---

## 🔍 Debug Checklist

### Issue: "Can't see any users in search"
✅ **Fix:** Run RLS policy fix (Step 1 above)

### Issue: "Insert fails with role error"
✅ **Check:** Role mapping is being used
✅ **Verify:** `conversation_participants.role` column accepts the value

### Issue: "Current user account_type is null"
✅ **Check:** User exists in `public.users` table
✅ **Query:** `SELECT * FROM users WHERE user_id = auth.uid();`
✅ **Fix:** If missing, check `handle_new_user` trigger

---

## 📝 Files Changed

### TypeScript/React:
- ✅ `src/components/chat/StartNewChat.tsx`
  - Added `mapAccountTypeToRole()` function
  - Added `currentUserAccountType` state
  - Added `fetchCurrentUser()` effect
  - Updated fallback insert to use mapped roles

### SQL:
- ✅ `add-chat-rpc-functions.sql`
  - Added `map_account_type_to_role()` helper function
  - Updated `get_or_create_direct_conversation()` to use mapping
- ✅ `fix-users-chat-rls-policy.sql`
  - Fixed RLS policy for viewing other users

---

## 🎯 What Happens Now

### When User A starts a chat with User B:

1. **Fetch User A's account_type** from `public.users`
2. **Map to role** using `mapAccountTypeToRole()`
3. **Get User B's account_type** from search results
4. **Map to role** using same function
5. **Insert participants** with correct roles:
   ```sql
   INSERT INTO conversation_participants (conversation_id, user_id, role)
   VALUES 
     (uuid, user-a-id, 'seller'),      -- Doctor maps to seller
     (uuid, user-b-id, 'customer');    -- User maps to customer
   ```

### Example Scenarios:

| User A (account_type) | User B (account_type) | → | Roles Inserted |
|----------------------|----------------------|---|----------------|
| doctor | user | → | seller, customer |
| factory | middleman | → | factory, middleman |
| seller | customer | → | seller, customer |
| delivery_driver | seller | → | delivery, seller |
| pharmacy | patient | → | seller, customer |

---

## ✅ Build Status

**Build:** ✅ Successful  
**TypeScript:** ✅ No errors  
**Role Mapping:** ✅ Implemented  
**RLS Policy:** ⚠️ Requires manual fix (see Step 1)

---

## 📋 Summary

**Before:**
- ❌ Hardcoded `role: "customer"` for everyone
- ❌ Didn't fetch current user's account_type
- ❌ Would fail on insert or create wrong data

**After:**
- ✅ Maps `account_type` → `role` correctly
- ✅ Fetches current user's account_type
- ✅ Inserts correct roles for both participants
- ✅ Works with RPC or fallback
- ✅ Handles all account types properly

---

Last Updated: 2026-03-30
