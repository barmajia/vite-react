# Onboarding System Implementation Guide

## Overview
This guide explains the complete onboarding system implementation for Seller, Factory, and Middleman user types in Aurora E-commerce.

## Database Changes

### Migration File
**File:** `add-onboarding-completed-column.sql`

This migration adds the `onboarding_completed` column to track which users have completed their initial onboarding flow.

#### What it does:
1. Adds `onboarding_completed` BOOLEAN column to `users` table (default: false)
2. Creates index for faster queries on onboarding status
3. Updates existing users to `onboarding_completed = true` (assumes they're already set up)
4. Ensures RLS policies allow users to update their own onboarding status
5. Allows service role to update onboarding status for backend functions

#### How to run:
```bash
# In Supabase SQL Editor or via CLI
# Copy and paste the contents of add-onboarding-completed-column.sql
```

## Code Changes

### 1. Login Redirect Logic
**File:** `src/pages/auth/Login.tsx`

**Changed:** Query now fetches from `users` table instead of `user_profiles`

```typescript
const { data: userProfile } = await supabase
  .from("users")  // Changed from "user_profiles"
  .select("account_type, onboarding_completed")
  .eq("user_id", data.user.id)
  .single();
```

**Redirect Logic:**
- **New Sellers** → `/seller/welcome`
- **Existing Sellers** → `/seller/analytics`
- **New Factories** → `/factory/welcome`
- **Existing Factories** → `/factory/dashboard`
- **New Middlemen** → `/middleman/welcome`
- **Existing Middlemen** → `/middleman/dashboard`

### 2. Welcome Pages Updated
Three welcome pages have been updated to save onboarding completion to the `users` table:

#### Files Modified:
1. `src/pages/seller/SellerWelcomePage.tsx`
2. `src/pages/factory/FactoryWelcomePage.tsx`
3. `src/pages/middleman/MiddlemanWelcomePage.tsx`

#### Key Change in Each Page:
```typescript
// Mark onboarding as complete in users table
const { error: updateError } = await supabase
  .from("users")  // Changed from "user_profiles"
  .update({ 
    onboarding_completed: true
  })
  .eq("user_id", user?.id);
```

## User Flow

### For New Users:

1. **User Signs Up** → Account created with `onboarding_completed = false`
2. **User Logs In** → Redirected to role-specific welcome page
3. **Welcome Page** → Shows features, benefits, and onboarding steps
4. **User Clicks "Get Started"** → 
   - `onboarding_completed` set to `true`
   - Redirected to appropriate next step:
     - No shop/products → Setup page
     - Has shop, no products → Create product page
     - Fully set up → Dashboard

### For Existing Users:

1. **User Logs In** → Check shows `onboarding_completed = true`
2. **Direct Redirect** → Sent straight to dashboard/analytics

## Testing Checklist

### Before Testing:
- [ ] Run database migration (`add-onboarding-completed-column.sql`)
- [ ] Verify column exists: `SELECT onboarding_completed FROM users LIMIT 1;`
- [ ] Check RLS policies are active

### Test Scenarios:

#### 1. New Seller Flow
- [ ] Create new seller account
- [ ] Verify `onboarding_completed = false` in database
- [ ] Login should redirect to `/seller/welcome`
- [ ] Click "Get Started" button
- [ ] Verify `onboarding_completed = true` in database
- [ ] Should redirect to shop setup or analytics

#### 2. New Factory Flow
- [ ] Create new factory account
- [ ] Login should redirect to `/factory/welcome`
- [ ] Click "Get Started" button
- [ ] Should redirect to factory dashboard or setup

#### 3. New Middleman Flow
- [ ] Create new middleman account
- [ ] Login should redirect to `/middleman/welcome`
- [ ] Click "Get Started" button
- [ ] Should redirect to middleman dashboard or setup

#### 4. Existing User Flow
- [ ] Login with existing account (migration sets `onboarding_completed = true`)
- [ ] Should bypass welcome page
- [ ] Direct redirect to appropriate dashboard

## Routes Summary

### Welcome Pages:
- `/seller/welcome` - Seller onboarding
- `/factory/welcome` - Factory onboarding
- `/middleman/welcome` - Middleman onboarding

### Dashboards:
- `/seller/analytics` - Seller dashboard
- `/factory/dashboard` - Factory dashboard
- `/middleman/dashboard` - Middleman dashboard

### Setup Pages (if needed):
- `/shops/dashboard` - Shop setup
- `/products/seller/create` - Product creation
- `/factory/profile/setup` - Factory profile setup
- `/factory/quotes` - Factory quotes
- `/middleman/profile/setup` - Middleman profile setup
- `/middleman/deals/new` - Create first deal

## Translation Keys Needed

Add these to your i18n files (e.g., `public/locales/en/translation.json`):

```json
{
  "seller": {
    "welcome": {
      "onboardingComplete": "Welcome aboard! Let's get your shop set up."
    }
  },
  "factory": {
    "welcome": {
      "onboardingComplete": "Welcome! Let's start your factory journey."
    }
  },
  "middleman": {
    "welcome": {
      "onboardingComplete": "Welcome! Let's create your first deal."
    }
  }
}
```

## Troubleshooting

### Issue: Login still redirects to /services
**Solution:** Check that `account_type` is properly set in the `users` table during signup

### Issue: Welcome page doesn't update onboarding status
**Solution:** 
1. Verify RLS policy allows UPDATE on `users` table
2. Check browser console for errors
3. Ensure user is authenticated

### Issue: Column doesn't exist error
**Solution:** Run the migration SQL file in Supabase SQL Editor

### Issue: All users redirected to welcome page
**Solution:** The migration sets existing users to `onboarding_completed = true`. If not run, manually update:
```sql
UPDATE users SET onboarding_completed = true WHERE created_at < NOW() - INTERVAL '1 day';
```

## Next Steps

After implementing this onboarding system:

1. ✅ Complete dashboards for each user type
2. ✅ Add proper navigation between pages
3. ✅ Implement analytics and reporting
4. ✅ Add email notifications for onboarding steps
5. ✅ Create tutorial/guides for each role
6. ✅ Add progress tracking for multi-step onboarding

## Files Modified Summary

| File | Change Type | Purpose |
|------|-------------|---------|
| `add-onboarding-completed-column.sql` | Created | Database migration |
| `src/pages/auth/Login.tsx` | Modified | Redirect logic |
| `src/pages/seller/SellerWelcomePage.tsx` | Modified | Save onboarding status |
| `src/pages/factory/FactoryWelcomePage.tsx` | Modified | Save onboarding status |
| `src/pages/middleman/MiddlemanWelcomePage.tsx` | Modified | Save onboarding status |

---

**Status:** ✅ Ready for deployment
**Priority:** HIGH - Required for proper user onboarding flow
**Estimated Testing Time:** 30 minutes
