# 🚀 SIGNUP FIX - STEP-BY-STEP INSTRUCTIONS

## What's Wrong?

Your signup is failing with: `AuthApiError: Database error saving new user`

This happens because of **Row Level Security (RLS) policies** blocking the database trigger from creating customer records.

---

## ✅ STEP 1: Go to Supabase Dashboard

1. Open **[Supabase Dashboard](https://app.supabase.com)**
2. Select your **Aurora project**
3. Click **SQL Editor** (left sidebar)

---

## ✅ STEP 2: Run the Diagnostic Queries FIRST

This helps us understand the current state. Copy and run EACH query separately:

### Query 1: Check if trigger function exists

```sql
SELECT
  routine_name,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name = 'handle_new_user';
```

**Expected Result**: Should return 1 row with `security_type = 'SECURITY DEFINER'`

### Query 2: Check RLS policies

```sql
SELECT
  policyname,
  tablename,
  cmd
FROM pg_policies
WHERE tablename IN ('customers', 'users', 'user_wallets', 'sellers')
ORDER BY tablename, policyname;
```

**Expected Result**: Should show multiple policies for each table

### Query 3: Check triggers

```sql
SELECT
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE event_object_schema = 'auth' AND event_object_table = 'users';
```

**Expected Result**: Should return `on_auth_user_created` trigger

📝 **Write down the results** - If any of these look wrong, note it.

---

## ✅ STEP 3: Apply the Fix

1. Open the file: `SIGNUP_FIX_FINAL.sql` (in your project root)
2. Copy **ALL the content** (Ctrl+A to select all)
3. Go back to **Supabase SQL Editor**
4. Click **New Query**
5. Paste the entire SQL code
6. Click **Run** button

⏳ **Wait for it to complete** - You should see `Query complete` message

---

## ✅ STEP 4: Verify the Fix Applied

After the SQL runs, you should see these success messages at the end:

```
Query complete [should be green checkmark]
```

---

## ✅ STEP 5: Test Signup in Browser

1. Open browser: **http://localhost:5173/signup/customer**
2. Fill in the signup form with **NEW email**:
   - **Full Name**: Test User
   - **Email**: `newemail123@example.com` (must be new!)
   - **Phone**: 01028551087
   - **Password**: Youssefnabil13

3. Click **Create Account** button

### Expected Success:

- ✅ Page shows "Account Created! 🎉"
- ✅ Message: "Verification sent to newemail123@example.com"

### If Still Failing:

- 🔴 Check browser console (F12 → Console tab)
- 📝 Copy the exact error message
- Follow the **Troubleshooting** section below

---

## 🔧 Troubleshooting If It Still Fails

### Error: "Table 'customers' does not exist"

```sql
-- Check if customers table exists:
SELECT tablename FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'customers';
```

**Fix**: Run migration to create customers table

---

### Error: "Column 'phone' does not exist in customers"

```sql
-- Check customers table structure:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'customers'
ORDER BY ordinal_position;
```

**Fix**: Add missing columns to customers table

---

### Error: "Permission denied for trigger"

```sql
-- Check function permissions:
SELECT grantee, privilege_type
FROM role_table_grants
WHERE table_name = 'handle_new_user';
```

**Fix**: Re-run the GRANT EXECUTE statements from SIGNUP_FIX_FINAL.sql

---

### Error: "RLS policy blocking INSERT"

This is the most common one. The RLS policies need to allow **unauthenticated trigger execution**.

**Fix**: The SIGNUP_FIX_FINAL.sql already handles this with:

```sql
CREATE POLICY "allow_trigger_insert_customers"
  ON public.customers
  FOR INSERT
  WITH CHECK (true);  -- Allow any INSERT during trigger execution
```

---

## ✅ STEP 6: Verify Customer Data Created

If signup succeeded, verify the data was created:

```sql
-- Check if new user was created
SELECT id, email, full_name, account_type
FROM public.users
WHERE email = 'newemail123@example.com';

-- Check if customer profile was created
SELECT user_id, name, email, phone
FROM public.customers
WHERE email = 'newemail123@example.com';

-- Check if wallet was created
SELECT user_id, balance, currency
FROM public.user_wallets
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'newemail123@example.com');
```

**Expected Results**: All three queries should return 1 row each

---

## 📊 Summary

| Step      | Action           | Time         |
| --------- | ---------------- | ------------ |
| 1         | Go to Supabase   | 30 sec       |
| 2         | Run diagnos tics | 2 min        |
| 3         | Apply SQL fix    | 1-2 min      |
| 4         | Verify fix       | 30 sec       |
| 5         | Test signup      | 2 min        |
| 6         | Verify data      | 1 min        |
| **Total** | **Complete fix** | **~7-8 min** |

---

## 🎯 Next Steps After Successful Signup

✅ **After signup is working:**

1. **Test login** with the new account
2. **Test chat** - Navigate to a product and try "Start Chat with Seller"
3. **Test cart** - Add product to cart
4. **Test checkout** - Begin checkout flow
5. **Test other roles** - Try seller, factory, delivery signups

---

## 📞 If You Still Have Issues

**When sharing errors, include:**

1. Exact error message from browser console
2. Results from diagnostic queries (Step 2)
3. Whether the SQL ran without errors (Step 3)
4. Full name and email used for testing

---

**Good luck! 🚀 You've got this!**
