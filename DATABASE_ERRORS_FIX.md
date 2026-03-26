# 🔧 Database Errors Fix - March 25, 2026

## ❌ Problems Fixed

### 1. **400 Bad Request - Conversations Table**
**Error:**
```
GET /rest/v1/conversations?select=id&user_id=eq.xxx 400 (Bad Request)
Error: column conversations.user_id does not exist
```

**Root Cause:** The `conversations` table doesn't have a `user_id` column. User participation is tracked via the `conversation_participants` table.

**Solution:** 
- ✅ Fixed in `src/hooks/useFullProfile.ts` - Line 136
- Changed from querying `conversations` to `conversation_participants`

```typescript
// Before (WRONG)
supabase
  .from("conversations")
  .select("id", { count: "exact" })
  .eq("user_id", targetUserId)

// After (CORRECT)
supabase
  .from("conversation_participants")
  .select("conversation_id", { count: "exact" })
  .eq("user_id", targetUserId)
```

---

### 2. **406 Not Acceptable - User Wallets Table**
**Error:**
```
GET /rest/v1/user_wallets?select=balance,pending_balance... 406 (Not Acceptable)
```

**Root Cause:** The `user_wallets` table doesn't exist in your Supabase database.

**Solution:** 
1. ✅ Run the SQL migration: `create-user-wallets-table.sql`
2. ✅ Updated code to handle missing table gracefully:
   - `src/features/profile/pages/ProfilePage.tsx`
   - `src/pages/wallet/WalletDashboard.tsx`

---

### 3. **406 Not Acceptable - Middleman Profiles Table**
**Error:**
```
GET /rest/v1/middleman_profiles?select=is_verified... 406 (Not Acceptable)
```

**Root Cause:** The `middleman_profiles` table might not exist or lacks proper RLS policies.

**Solution:**
1. ✅ Run the SQL migration: `create-middleman-profiles-table.sql`
2. ✅ Updated code to handle missing table gracefully in `ProfilePage.tsx`

---

## 📋 Files Changed

### Code Files
1. **`src/hooks/useFullProfile.ts`** (Line 131-135)
   - Fixed conversations query to use `conversation_participants`

2. **`src/features/profile/pages/ProfilePage.tsx`** (Lines 64-108)
   - Added error handling for missing `user_wallets` table
   - Added error handling for missing `middleman_profiles` table
   - Changed from `.single()` to `.maybeSingle()` to handle not found
   - Changed `console.error` to `console.warn` for non-critical errors

3. **`src/pages/wallet/WalletDashboard.tsx`** (Lines 24-46)
   - Added error handling for missing wallet tables
   - Gracefully handles PGRST116 (not found) errors

### SQL Migration Files
1. **`create-user-wallets-table.sql`** ✨ NEW
   - Creates `user_wallets` table
   - Creates `wallet_transactions` table
   - Sets up RLS policies
   - Creates automatic wallet creation trigger
   - Creates transaction recording function

2. **`create-middleman-profiles-table.sql`** ✨ NEW
   - Creates `middleman_profiles` table
   - Sets up RLS policies
   - Creates updated_at trigger

---

## 🚀 How to Fix

### Step 1: Run SQL Migrations
Go to your Supabase Dashboard → SQL Editor and run these files in order:

1. **`create-user-wallets-table.sql`**
2. **`create-middleman-profiles-table.sql`**

### Step 2: Clear Browser Cache
```
Ctrl + Shift + Delete → Clear cache
```

### Step 3: Restart Dev Server
```bash
npm run dev
```

---

## ✅ Verification

After running the migrations, check:

1. **Console Errors:**
   - ❌ Before: Multiple 400 and 406 errors
   - ✅ After: No database errors

2. **Profile Page:**
   - Should load without errors
   - Wallet section shows "0.00 EGP" if no balance

3. **Wallet Dashboard:**
   - Should display balance cards
   - No error toasts

---

## 📊 Database Schema Created

### user_wallets
```sql
- id (uuid, PK)
- user_id (uuid, FK → auth.users)
- balance (numeric)
- pending_balance (numeric)
- total_earned (numeric)
- total_withdrawn (numeric)
- created_at (timestamp)
- updated_at (timestamp)
```

### wallet_transactions
```sql
- id (uuid, PK)
- user_id (uuid, FK → auth.users)
- amount (numeric)
- transaction_type (text: 'credit' | 'debit')
- description (text)
- reference_type (text)
- reference_id (uuid)
- balance_after (numeric)
- metadata (jsonb)
- created_at (timestamp)
```

### middleman_profiles
```sql
- user_id (uuid, PK, FK → auth.users)
- full_name (text)
- specialization (text)
- website (text)
- description (text)
- years_of_experience (integer)
- is_verified (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

---

## 🛡️ RLS Policies

All tables have proper Row Level Security:

- **Users can view** their own data
- **Users can update** their own data
- **Service role** can manage all data (for backend operations)
- **Public can view** verified middleman profiles

---

## 🔄 Automatic Features

### New User Wallet Creation
When a new user signs up, a wallet is automatically created with:
- Balance: 0.00 EGP
- Pending Balance: 0.00 EGP
- Total Earned: 0.00 EGP
- Total Withdrawn: 0.00 EGP

### Transaction Recording
Use the `record_wallet_transaction()` function to:
- Automatically update wallet balance
- Record transaction history
- Validate sufficient balance
- Return transaction ID

Example:
```typescript
const { data, error } = await supabase.rpc('record_wallet_transaction', {
  p_user_id: userId,
  p_amount: 100.00,
  p_transaction_type: 'credit',
  p_description: 'Order payment',
  p_reference_type: 'order',
  p_reference_id: orderId
});
```

---

## 📝 Notes

- All errors are now handled gracefully
- App will work even if tables don't exist (shows 0.00 balances)
- Console warnings (not errors) will appear if tables are missing
- Run migrations to enable full wallet functionality

---

**Status:** ✅ Fixed
**Date:** March 25, 2026
**Developer:** Youssef
