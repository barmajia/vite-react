# Database Verification & Testing Checklist

## ✅ COMPLETED TASKS

### 1. App.tsx Route Updates
- [x] Added `ImprovedFactoryDashboard` import
- [x] Added `ImprovedMiddlemanDashboard` import  
- [x] Updated Factory dashboard route to use `ImprovedFactoryDashboard`
- [x] Updated Middleman dashboard route to use `ImprovedMiddlemanDashboard`
- [x] Seller dashboard already using `SellerDashboard` component

### 2. Database Migration Files Created
- [x] `add-shop-name-column.sql` - Adds missing `name` column to shops table
- [x] `create-factory-profiles-table.sql` - Creates factory_profiles table with RLS policies
- [x] `add-onboarding-completed-column.sql` - Already exists from previous work

## 📋 DATABASE VERIFICATION STEPS

### Step 1: Run SQL Migrations in Supabase

Execute these files in order in your Supabase SQL Editor:

#### 1. Add onboarding_completed column (if not already done)
```sql
-- File: add-onboarding-completed-column.sql
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
```

#### 2. Add shop name column
```sql
-- File: add-shop-name-column.sql
-- Fixes SellerDashboard error: "column shops.name does not exist"
```

#### 3. Create factory_profiles table
```sql
-- File: create-factory-profiles-table.sql
-- Required for ImprovedFactoryDashboard queries
```

### Step 2: Verify Existing Tables

Check these tables exist in your Supabase dashboard:

**Required for Seller Dashboard:**
- [ ] `shops` - with columns: id, owner_id, slug, **name**, shop_type, status
- [ ] `products` - with columns: id, seller_id, name, price, stock_quantity, is_active, image_url
- [ ] `orders` - with columns: id, order_number, total_amount, status, created_at, seller_id
- [ ] `order_items` - with columns: id, order_id, product_id, quantity, price

**Required for Factory Dashboard:**
- [ ] `factory_profiles` - newly created with migration
- [ ] `factory_quotes` or `quote_requests` - check which table name you're using
- [ ] `factory_connections`
- [ ] `production_orders` (if used)

**Required for Middleman Dashboard:**
- [ ] `deals` - with columns: id, middleman_id, title, status, commission_rate, value
- [ ] `orders` - linked to deals
- [ ] `middleman_profiles`

## 🧪 TESTING FLOWS

### Seller Flow Test

**Prerequisites:**
- User account with `account_type = 'seller'`
- Shop record in `shops` table
- Some products in `products` table

**Test Steps:**
1. Login as seller
2. Verify redirect:
   - New user (onboarding_completed=false) → `/seller/welcome`
   - Existing user → `/seller/dashboard`
3. On welcome page, click "Get Started"
4. Verify redirect to `/seller/dashboard`
5. Check dashboard displays:
   - [ ] Revenue stats (or "No data yet")
   - [ ] Total orders count
   - [ ] Products count
   - [ ] Recent orders table
   - [ ] Top products list
6. Verify no console errors about missing columns

**Expected Issues & Fixes:**
- Error: "column shops.name does not exist" → Run `add-shop-name-column.sql`
- Empty dashboard → Add test data to products/orders tables

### Factory Flow Test

**Prerequisites:**
- User account with `account_type = 'factory'`
- Record in `factory_profiles` table

**Test Steps:**
1. Login as factory
2. Verify redirect to `/factory/welcome` (if new) or `/factory/dashboard`
3. Click "Get Started" on welcome page
4. Check dashboard displays:
   - [ ] Production revenue stats
   - [ ] Active orders count
   - [ ] Quote requests count
   - [ ] Conversion rate
   - [ ] Production pipeline
   - [ ] Pending quotes alerts
5. Verify no database query errors

**Expected Issues & Fixes:**
- Error: "relation factory_profiles does not exist" → Run `create-factory-profiles-table.sql`
- Error: "quote_requests does not exist" → Check if using `factory_quotes` instead, update component

### Middleman Flow Test

**Prerequisites:**
- User account with `account_type = 'middleman'`
- Some deals in `deals` table

**Test Steps:**
1. Login as middleman
2. Verify redirect flow
3. Check dashboard displays:
   - [ ] Commission earned
   - [ ] Active deals count
   - [ ] Orders facilitated
   - [ ] Conversion rate
   - [ ] Active deals with progress bars
   - [ ] Commission breakdown
4. Verify deal data loads correctly

**Expected Issues & Fixes:**
- Empty dashboard → Create test deals in database

## 🔍 COMMON ISSUES & SOLUTIONS

### Issue 1: "Column does not exist" errors
**Solution:** Run the appropriate migration file:
- `add-shop-name-column.sql` for shops.name
- `add-onboarding-completed-column.sql` for users.onboarding_completed

### Issue 2: "Relation does not exist" errors
**Solution:** 
- For factory_profiles: Run `create-factory-profiles-table.sql`
- For other tables: Check table names in your schema

### Issue 3: RLS Policy errors
**Solution:** Ensure RLS policies allow authenticated users to read their own data

### Issue 4: Empty dashboards
**Solution:** Add test data:
```sql
-- Test shop
INSERT INTO shops (owner_id, slug, name, shop_type, status)
VALUES ('YOUR_USER_ID', 'test-shop', 'Test Shop', 'seller', 'active');

-- Test product
INSERT INTO products (seller_id, name, price, stock_quantity, is_active)
VALUES ('YOUR_USER_ID', 'Test Product', 99.99, 100, true);
```

## 📊 VERIFICATION CHECKLIST

After running migrations and testing:

- [ ] All three SQL migration files executed successfully
- [ ] Seller dashboard loads without errors
- [ ] Factory dashboard loads without errors  
- [ ] Middleman dashboard loads without errors
- [ ] Welcome pages redirect correctly based on onboarding status
- [ ] No console errors in browser dev tools
- [ ] Database tables have correct columns
- [ ] RLS policies allow proper data access

## 🚀 NEXT STEPS AFTER VERIFICATION

1. **Add Translation Keys** - Add i18n keys for dashboard labels
2. **Populate Test Data** - Create sample shops, products, deals
3. **UI Polish** - Fine-tune responsive design on mobile
4. **Performance** - Add loading skeletons and optimize queries
5. **Error Handling** - Add user-friendly error messages

## 📝 NOTES

- All dashboard components use Supabase client for data fetching
- RLS policies must be properly configured for each table
- Welcome pages set `onboarding_completed = true` when user clicks "Get Started"
- Dashboard routes are now:
  - `/seller/dashboard` → SellerDashboard
  - `/factory/dashboard` → ImprovedFactoryDashboard
  - `/middleman/dashboard` → ImprovedMiddlemanDashboard
