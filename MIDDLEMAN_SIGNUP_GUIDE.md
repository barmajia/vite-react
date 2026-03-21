# Middleman Signup & Onboarding System - Complete Guide

## 📦 What Was Created

### Files Created (3 files)

1. **`src/pages/middleman/MiddlemanSignup.tsx`** - Complete multi-step signup form (600+ lines)
2. **`middleman-signup-migration.sql`** - Database migration for middleman signup
3. **`MIDDLEMAN_SIGNUP_GUIDE.md`** - This documentation file

### Files Updated (2 files)

1. **`src/App.tsx`** - Added MiddlemanSignup import and route
2. **`README.md`** - Updated with middleman routes and documentation

---

## 🎯 Features Implemented

### Multi-Step Signup Form (5 Steps)

#### Step 1: Account Information
- Email address
- Password (min 8 characters)
- Account type: middleman

#### Step 2: Personal Information
- Full name
- Phone number

#### Step 3: Business Information
- Company name
- Business location
- Currency (USD, EUR, EGP, GBP)
- Commission rate (%)
- Specialization
- Business description
- Website (optional)

#### Step 4: Verification Documents
- Tax ID / VAT number
- Years of experience
- Business license upload (PDF, JPG, PNG - max 10MB)
- ⚠️ Verification warning (1-3 business days)

#### Step 5: Preferences
- Preferred language (EN, AR, FR, ES)
- Theme preference (System, Light, Dark)

---

## 🗄️ Database Schema

### Tables Modified

#### users table
```sql
- preferred_language (text)
- preferred_currency (text)
- theme_preference (text)
- sidebar_state (text)
```

#### business_profiles table
```sql
- specialization (text)
- website_url (text)
- description (text)
- business_license_url (text)
- tax_id (text)
- commission_rate (numeric, default 5)
```

#### middleman_profiles table
```sql
- specialization (text)
- website_url (text)
- description (text)
- business_license_url (text)
- tax_id (text)
- years_of_experience (integer)
- industries_served (jsonb)
- commission_rate (numeric, default 5)
```

### Storage Bucket

```
Bucket: documents
Folder: business-licenses/
Access: Public read, Authenticated write
```

---

## 🚀 How to Use

### 1. Run Database Migration

```bash
# In Supabase SQL Editor
# Run: middleman-signup-migration.sql
```

This will:
- Add all required columns
- Set up RLS policies
- Create storage policies
- Add auto-profile creation trigger

### 2. Create Storage Bucket

In Supabase Dashboard:
1. Go to **Storage**
2. Click **New Bucket**
3. Name: `documents`
4. Public: **Yes**
5. Click **Create**

### 3. Test Signup Flow

Navigate to: `http://localhost:5173/signup/middleman`

Test the complete flow:
1. Fill in account info
2. Complete personal details
3. Enter business information
4. Upload business license
5. Set preferences
6. Submit and verify email

---

## 📊 Data Collection Summary

| Category | Fields | Table |
|----------|--------|-------|
| **Auth** | Email, Password | `auth.users` |
| **Personal** | Full Name, Phone | `users` |
| **Business** | Company Name, Location, Currency | `business_profiles`, `middleman_profiles` |
| **Financial** | Commission Rate, Tax ID | `business_profiles`, `middleman_profiles` |
| **Verification** | Business License URL | `middleman_profiles` + Storage |
| **Professional** | Specialization, Website, Description, Years of Experience | `middleman_profiles` |
| **Preferences** | Language, Theme | `users` |

---

## 🔧 Integration with Existing System

### Route Added to App.tsx

```typescript
// Auth Routes
<Route path="/signup" element={<ServicesSignup />} />
<Route path="/signup/middleman" element={<MiddlemanSignup />} />
<Route path="/login" element={<Login />} />
```

### Middleman Routes Available

```
/middleman                    → Dashboard
/middleman/dashboard          → Dashboard
/middleman/deals              → Deals List
/middleman/deals/new          → Create Deal
/middleman/deals/:dealId      → Deal Details
/middleman/orders             → Orders
/middleman/analytics          → Analytics
/middleman/connections        → Connections
/middleman/commission         → Commission Reports
/middleman/profile            → Profile
/middleman/settings           → Settings
/middleman/messages           → Messages
/signup/middleman             → Signup (NEW!)
```

---

## ✨ Key Features

### 1. Progress Tracking
- Visual progress bar
- Step indicators (1-5)
- Step names displayed

### 2. Form Validation
- Required field checks
- Email format validation
- Password length validation
- File size validation (10MB max)

### 3. File Upload
- Drag and drop support
- File type validation (PDF, JPG, PNG)
- Upload progress indicator
- Success/error feedback

### 4. Error Handling
- Inline error messages
- Toast notifications
- Form-level error display
- Network error handling

### 5. User Experience
- Back/Next navigation
- Loading states
- Disabled buttons during submission
- Success confirmation

---

## 🔐 Security Features

### RLS Policies

```sql
-- Middlemen manage own profiles
FOR ALL USING (user_id = auth.uid())

-- Public view verified middlemen
FOR SELECT USING (is_verified = true OR user_id = auth.uid())

-- Users update own preferences
FOR UPDATE USING (user_id = auth.uid())
```

### Storage Policies

```sql
-- Upload: Authenticated users only
FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND
  folder = 'business-licenses'
)

-- View: Public access
FOR SELECT USING (
  bucket_id = 'documents' AND
  folder = 'business-licenses'
)
```

---

## 📧 Post-Signup Flow

### Immediate Actions
1. ✅ Account created in `auth.users`
2. ✅ Profile created in `users`
3. ✅ Profile created in `business_profiles`
4. ✅ Profile created in `middleman_profiles`
5. ✅ Verification email sent

### Pending State
- `is_verified` = `false`
- Can browse deals
- Cannot create deals
- Waiting for admin approval

### After Verification
- Admin reviews documents
- `is_verified` = `true`
- Full access to all features
- Can create and manage deals

---

## 🎨 UI Components Used

- **Card** - Container for each step
- **Input** - Form inputs
- **Label** - Input labels
- **Select** - Dropdown selections
- **Button** - Action buttons
- **Progress** - Progress bar
- **Toast** - Notifications (sonner)
- **Alert** - Error/warning messages

---

## 🧪 Testing Checklist

### Functional Tests
- [ ] Email validation
- [ ] Password requirements
- [ ] Required field validation
- [ ] File upload (valid file)
- [ ] File upload (invalid type)
- [ ] File upload (too large)
- [ ] Back button navigation
- [ ] Form submission
- [ ] Email verification sent

### Integration Tests
- [ ] User created in auth.users
- [ ] Profile created in users
- [ ] Profile created in business_profiles
- [ ] Profile created in middleman_profiles
- [ ] Business license uploaded to storage
- [ ] Preferences saved correctly

### UI/UX Tests
- [ ] Progress bar updates
- [ ] Step transitions smooth
- [ ] Error messages display
- [ ] Loading states work
- [ ] Mobile responsive
- [ ] Keyboard navigation

---

## 🐛 Troubleshooting

### Issue: "Profile creation failed"
**Solution:** Check that all required columns exist in database. Run migration SQL.

### Issue: "File upload fails"
**Solution:** 
1. Verify storage bucket `documents` exists
2. Check RLS policies on storage.objects
3. Verify file size < 10MB

### Issue: "Trigger not firing"
**Solution:** 
```sql
-- Check trigger exists
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created_middleman';

-- Recreate if needed
DROP TRIGGER IF EXISTS on_auth_user_created_middleman ON auth.users;
-- Run migration again
```

### Issue: "RLS permission denied"
**Solution:**
```sql
-- Verify RLS enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename IN ('users', 'business_profiles', 'middleman_profiles');

-- Enable if needed
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

---

## 📈 Next Steps

### After Signup Implementation

1. **Admin Verification Dashboard**
   - Review pending middleman applications
   - Approve/reject business licenses
   - Update verification status

2. **Middleman Dashboard**
   - Display deal statistics
   - Show commission earnings
   - Manage connections

3. **Deal Management**
   - Create deals
   - Link factories and sellers
   - Track deal progress

4. **Commission Tracking**
   - Auto-calculate on orders
   - Generate reports
   - Payment processing

---

## 📚 Related Documentation

- [README.md](./README.md) - Main project documentation
- [UNIFIED_MESSAGING_SUMMARY.md](./UNIFIED_MESSAGING_SUMMARY.md) - Messaging system
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide

---

## 🆘 Support

For issues or questions:
- 📧 Email: support@aurora.com
- 📚 Docs: See migration SQL and comments
- 🐛 Bugs: Check console errors and Supabase logs

---

**Created:** March 21, 2026  
**Version:** 1.0.0  
**Status:** ✅ Ready for Testing  
**Developer:** Youssef  
**Project:** Aurora E-commerce Platform
