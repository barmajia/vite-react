# 🐛 Service Onboarding Wizard Fixes

## Issues Fixed

### 1. **NaN Warning for hourly_rate Input**
**Problem:** The hourly rate input was receiving `NaN` when the field was empty.

**Root Cause:** `parseFloat("")` returns `NaN`, which React cannot parse as an input value.

**Fix:** Updated the onChange handler to return `0` for empty strings:
```tsx
onChange={(e) => {
  const value = e.target.value;
  updateFormData(
    "hourly_rate",
    value === "" ? 0 : parseFloat(value),
  );
}}
value={formData.hourly_rate || ""}
```

---

### 2. **400 Bad Request - svc_providers Insert**
**Problem:** The insert was failing with a 400 error because the code was sending columns that don't exist in the database.

**Root Cause:** Mismatch between the code's insert object and the actual `svc_providers` table schema.

**Schema Issues:**
| Code Was Sending | Actual Column Name | Exists? |
|-----------------|-------------------|---------|
| `business_name` | `provider_name` | ❌ Wrong name |
| `license_number` | — | ❌ Doesn't exist |
| `tax_id` | — | ❌ Doesn't exist |
| `specialization` | — | ❌ Doesn't exist |
| `city` | `location_city` | ❌ Wrong name |
| `metadata` | — | ❌ Doesn't exist |

**Fix:** Updated the insert to match the actual schema:
```tsx
await supabase.from("svc_providers").insert({
  user_id: user.id,
  provider_name: formData.business_name,  // ✅ Fixed
  provider_type: providerType,
  tagline: formData.tagline || null,
  description: formData.description,
  phone: formData.phone || null,
  website: formData.website || null,
  location_city: formData.city || null,  // ✅ Fixed
  specialties: formData.skills ? formData.skills.split(",").map((s) => s.trim()) : null,
  status: "pending_review",
  is_verified: false,
});
```

---

## Files Modified

| File | Changes |
|------|---------|
| `ServiceOnboardingWizard.tsx` | ✅ Fixed hourly_rate NaN handling<br>✅ Fixed svc_providers insert schema<br>✅ Simplified validation logic<br>✅ Removed unused metadata code |

---

## Testing

### Test the fixes:

1. **Navigate to:** `/services/onboarding`
2. **Step 1:** Select provider type (Individual/Company/etc.)
3. **Step 2:** Fill in the form:
   - Leave hourly rate empty (should not show NaN warning)
   - Enter a valid hourly rate (should save correctly)
   - Fill required fields (business name, description)
4. **Submit:** Should successfully create provider profile without 400 errors

---

## Expected Console Output

### Before Fix:
```
⚠️ Warning: Received NaN for the `value` attribute
❌ POST https://*.supabase.co/rest/v1/svc_providers 400 (Bad Request)
❌ Unknown error
```

### After Fix:
```
✅ Profile created successfully!
```

---

## Additional Notes

### Database Schema Reference
The `svc_providers` table has these main columns:
```sql
- id (UUID)
- user_id (UUID)
- provider_name (VARCHAR)
- provider_type (VARCHAR) - 'individual', 'company', 'hospital'
- tagline (VARCHAR)
- description (TEXT)
- location_city (VARCHAR)
- location_country (VARCHAR)
- phone (VARCHAR)
- email (VARCHAR)
- website (VARCHAR)
- specialties (TEXT[])
- status (VARCHAR) - 'active', 'inactive', 'suspended', 'pending_review'
- is_verified (BOOLEAN)
```

### Future Enhancements
If you need to store additional data like:
- `license_number` (for healthcare)
- `tax_id` (for companies)
- `hourly_rate` (for individuals)

You have two options:

1. **Add columns to `svc_providers`:**
   ```sql
   ALTER TABLE svc_providers 
   ADD COLUMN license_number TEXT,
   ADD COLUMN tax_id TEXT,
   ADD COLUMN hourly_rate NUMERIC;
   ```

2. **Use a metadata JSONB column:**
   ```sql
   ALTER TABLE svc_providers 
   ADD COLUMN metadata JSONB DEFAULT '{}';
   ```

---

**Fixed:** March 26, 2026  
**Priority:** HIGH  
**Impact:** Service provider onboarding flow
