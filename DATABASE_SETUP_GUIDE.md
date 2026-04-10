# Database Migrations Setup Guide

## 📦 Migration Files Created

Three SQL migration files have been created to fix database schema issues:

### 1. `add-onboarding-completed-column.sql`
**Purpose:** Add onboarding tracking to users table  
**Required by:** Login redirect logic, Welcome pages  
**Table:** `public.users`

### 2. `add-shop-name-column.sql`
**Purpose:** Add missing `name` column to shops table  
**Required by:** SellerDashboard.tsx  
**Table:** `public.shops`  
**Fixes Error:** "column shops.name does not exist"

### 3. `create-factory-profiles-table.sql`
**Purpose:** Create factory_profiles table with RLS policies  
**Required by:** ImprovedFactoryDashboard.tsx  
**Table:** `public.factory_profiles`  
**Fixes Error:** "relation factory_profiles does not exist"

## 🚀 How to Run Migrations

### Option 1: Run Combined File (Recommended)
```sql
-- Copy entire contents of DATABASE_MIGRATIONS_COMBINED.sql
-- Paste into Supabase SQL Editor
-- Click "Run"
```

### Option 2: Run Individual Files
Execute each file in order:
1. `add-onboarding-completed-column.sql`
2. `add-shop-name-column.sql`
3. `create-factory-profiles-table.sql`

### Option 3: Via Supabase CLI
```bash
supabase db execute --file add-onboarding-completed-column.sql
supabase db execute --file add-shop-name-column.sql
supabase db execute --file create-factory-profiles-table.sql
```

## ✅ Verification Queries

After running migrations, verify they worked:

### Check onboarding_completed column
```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'onboarding_completed';
```

### Check shop name column
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'shops' 
AND column_name = 'name';
```

### Check factory_profiles table exists
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'factory_profiles';
```

### Sample data check
```sql
-- Should return at least one row with 'name' column
SELECT id, slug, name FROM shops LIMIT 1;

-- Should return table structure
SELECT * FROM factory_profiles LIMIT 0;
```

## 🔧 Troubleshooting

### Error: "relation users does not exist"
**Solution:** The migration expects a `public.users` table. If you're using `auth.users` instead, update the SQL:
```sql
-- Replace this line:
ALTER TABLE IF EXISTS public.users
-- With:
ALTER TABLE IF EXISTS auth.users
```

### Error: "permission denied for table"
**Solution:** Ensure you're running as a user with DDL permissions (typically postgres role or service_role)

### Error: "column already exists"
**Solution:** This is fine! It means the migration was already run. The scripts use `IF NOT EXISTS` to handle this.

### Error: "factory_profiles already exists"
**Solution:** Table already created. You can skip this migration or drop and recreate:
```sql
DROP TABLE IF EXISTS public.factory_profiles CASCADE;
-- Then re-run the migration
```

## 📊 Expected Results

After successful migrations:

### Users Table
- New column: `onboarding_completed BOOLEAN DEFAULT false`
- Index: `idx_users_onboarding_completed`
- Policy: Users can update their own onboarding status

### Shops Table  
- New column: `name TEXT`
- Index: `idx_shops_owner_id`
- Existing shops updated with default names

### Factory Profiles Table
- Complete table with 15 columns
- 3 indexes for performance
- RLS enabled with 3 policies
- Update trigger for `updated_at`

## 🎯 Next Steps

1. **Run migrations** in Supabase SQL Editor
2. **Verify** using the queries above
3. **Test dashboards** by logging in as each user type
4. **Check console** for any remaining errors
5. **Add test data** if dashboards show empty states

## 📝 Notes

- All migrations are idempotent (safe to run multiple times)
- RLS policies are included for security
- Indexes added for query performance
- Backwards compatible with existing data
