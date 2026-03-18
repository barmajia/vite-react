# Fix: svc_providers 400 Bad Request Error

## Problem

The application was throwing a 400 Bad Request error when trying to insert into the `svc_providers` table:

```
POST https://ofovfxsfazlwvcakpuer.supabase.co/rest/v1/svc_providers?select=* 400 (Bad Request)
```

## Root Causes

1. **Invalid field in INSERT**: The code was trying to insert `registration_number` which doesn't exist in the table schema
2. **Invalid status value**: The code was using `status = 'pending_review'` but the schema only allowed `('active', 'inactive', 'suspended')`

## Fixes Applied

### 1. Code Fix (OnboardingWizard.tsx)

**File**: `src/pages/auth/OnboardingWizard.tsx`

**Changes**:
- Removed `registration_number` from the INSERT statement
- Kept `status = 'pending_review'` for hospital onboarding flow (requires SQL schema update)

### 2. Database Schema Fix

**File**: `fix-svc-providers-status.sql`

Run this SQL in your Supabase SQL Editor to add the `pending_review` status:

```sql
-- Fix svc_providers status enum to include 'pending_review'
-- This is needed for the service provider onboarding flow

-- Drop the existing constraint
ALTER TABLE public.svc_providers
DROP CONSTRAINT IF EXISTS svc_providers_status_check;

-- Add new constraint with 'pending_review' status
ALTER TABLE public.svc_providers
ADD CONSTRAINT svc_providers_status_check
CHECK (status IN ('active', 'inactive', 'suspended', 'pending_review'));

-- Verify the change
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.svc_providers'::regclass
AND contype = 'c';
```

## Verification

After applying the fixes:

1. Run the SQL migration in Supabase SQL Editor
2. Restart the development server
3. Try creating a service provider profile (especially for hospitals)
4. Verify no 400 errors in the browser console

## Schema Reference

The `svc_providers` table has these columns:

```sql
CREATE TABLE public.svc_providers (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    provider_name VARCHAR(200) NOT NULL,
    provider_type VARCHAR(50) CHECK (provider_type IN ('individual', 'company', 'hospital')),
    tagline VARCHAR(200),
    description TEXT,
    logo_url TEXT,
    cover_image_url TEXT,
    location_city VARCHAR(100),
    location_country VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    phone VARCHAR(20),
    email VARCHAR(200),
    website VARCHAR(200),
    specialties TEXT[],
    average_rating DECIMAL(3, 2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    total_jobs_completed INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    status VARCHAR(50) CHECK (status IN ('active', 'inactive', 'suspended', 'pending_review')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Related Files

- `src/pages/auth/OnboardingWizard.tsx` - Provider profile creation
- `src/pages/auth/Login.tsx` - Login with provider status check
- `src/hooks/useAuth.tsx` - Auth hooks with provider profile check
- `services-marketplace-schema.sql` - Original schema definition
- `fix-svc-providers-status.sql` - Schema fix migration

---

**Date**: March 18, 2026
**Status**: ✅ Fixed
