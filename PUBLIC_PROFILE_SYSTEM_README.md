# Public Profile System - Aurora E-commerce

A universal public profile system supporting **12 account types** across Trading, Health, Service, and Logistics verticals.

---

## 🎯 Overview

The Public Profile System provides a unified, type-safe way to display user profiles based on their account type, with appropriate privacy controls and feature availability.

### Supported Account Types

| Account Type | Icon | Color | Public Access |
|-------------|------|-------|---------------|
| `user` | User | Blue | ✅ Full |
| `customer` | User | Blue | ✅ Basic |
| `seller` | Store | Green | ✅ Full |
| `factory` | Factory | Orange | ✅ Full |
| `middleman` | Handshake | Purple | ✅ Full |
| `freelancer` | Laptop | Indigo | ✅ Full |
| `service_provider` | Briefcase | Teal | ✅ Full |
| `delivery_driver` | Truck | Yellow | ✅ Basic |
| `doctor` | Stethoscope | Red | ✅ Full |
| `patient` | Heart | Pink | 🔒 Private (HIPAA) |
| `pharmacy` | Pill | Emerald | ✅ Full |
| `admin` | Shield | Gray | ✅ Basic |

---

## 📁 File Structure

```
src/
├── types/
│   └── public-profile.ts          # TypeScript types for all profile types
├── lib/
│   └── profileConfig.ts           # Configuration for each account type
├── hooks/
│   └── usePublicProfile.ts        # Data fetching hook
├── components/
│   └── profiles/
│       └── PublicProfile.tsx      # Universal profile component
└── pages/
    └── profile/
        └── PublicProfilePage.tsx  # Route page component
```

---

## 🚀 Quick Start

### 1. Run SQL Migration

Execute the RLS policies migration in your Supabase SQL Editor:

```bash
# Run in Supabase Dashboard > SQL Editor
# File: create-public-profile-rls.sql
```

This creates:
- Row Level Security policies for all profile tables
- A helper function `get_public_profile()` for unified fetching
- Performance indexes

### 2. View a Profile

Navigate to any user's profile:

```
/profile/{user-id}
```

Examples:
- `/profile/550e8400-e29b-41d4-a716-446655440000` (Seller)
- `/profile/550e8400-e29b-41d4-a716-446655440001` (Doctor)
- `/profile/550e8400-e29b-41d4-a716-446655440002` (Freelancer)

---

## 🧩 Usage Examples

### Embed in Product Page (Show Seller)

```tsx
import { PublicProfile } from '@/components/profiles/PublicProfile';

export const ProductPage = ({ product }) => {
  return (
    <div>
      <h1>{product.title}</h1>
      
      {/* Show Seller Profile */}
      <PublicProfile
        userId={product.seller_id}
        accountType="seller"
        className="mt-8"
      />
    </div>
  );
};
```

### Embed in Service Listing (Show Provider)

```tsx
import { PublicProfile } from '@/components/profiles/PublicProfile';

export const ServiceDetailPage = ({ service }) => {
  return (
    <div>
      <h1>{service.title}</h1>
      
      {/* Show Service Provider Profile */}
      <PublicProfile
        userId={service.provider_id}
        accountType="service_provider"
      />
    </div>
  );
};
```

### Use the Hook Directly

```tsx
import { usePublicProfile } from '@/hooks/usePublicProfile';

export const ProfileCard = ({ userId }) => {
  const { profile, loading, error } = usePublicProfile(userId);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!profile) return <div>Profile not found</div>;

  return (
    <div>
      <h2>{profile.full_name}</h2>
      <p>{profile.location}</p>
    </div>
  );
};
```

---

## ⚙️ Configuration

### Profile Config (`src/lib/profileConfig.ts`)

Each account type has configurable properties:

```typescript
{
  label: 'Seller',                    // Display name
  icon: 'Store',                      // Lucide icon name
  color: 'bg-green-500',             // Tailwind color class
  badgeColor: 'text-green-600',      // Badge text color
  description: 'Product merchant',   // Short description
  publicFields: ['store_name', ...], // Fields visible to public
  privateFields: ['email', ...],     // Fields hidden from public
  availableTabs: ['products', ...],  // Tabs shown in profile
  canMessage: true,                  // Can users message?
  canCall: true,                     // Can users call?
  canBookAppointment: false,         // Can book appointments?
  canPurchase: true,                 // Can purchase products?
  requiresVerification: true,        // Requires verification?
}
```

---

## 🔒 Privacy & Security

### Row Level Security (RLS)

| Table | Public Access | Owner Access |
|-------|--------------|--------------|
| `sellers` | ✅ SELECT | ✅ ALL |
| `factories` | ✅ SELECT | ✅ ALL |
| `middle_men` | ✅ SELECT | ✅ ALL |
| `svc_providers` | ✅ SELECT | ✅ ALL |
| `health_doctor_profiles` | ✅ SELECT | ✅ ALL |
| `health_pharmacy_profiles` | ✅ SELECT | ✅ ALL |
| `delivery_profiles` | ✅ SELECT | ✅ ALL |
| `users` | ✅ SELECT (basic) | ✅ ALL |
| `health_patient_profiles` | 🔒 NONE | ✅ ALL (owner only) |

### HIPAA Compliance

Patient profiles are **strictly private**:
- Only the patient can view their own profile
- No public tabs or fields exposed
- Medical history encrypted at rest

---

## 🎨 Features

### Profile Tabs

Available tabs based on account type:

| Tab | Seller | Doctor | Freelancer | Pharmacy |
|-----|--------|--------|------------|----------|
| Overview | ✅ | ✅ | ✅ | ✅ |
| Products | ✅ | ❌ | ❌ | ✅ |
| Services | ❌ | ✅ | ✅ | ❌ |
| Reviews | ✅ | ✅ | ✅ | ✅ |
| Portfolio | ❌ | ❌ | ✅ | ❌ |
| Appointments | ❌ | ✅ | ✅ | ❌ |
| Medicines | ❌ | ❌ | ❌ | ✅ |
| About | ✅ | ✅ | ✅ | ✅ |
| Contact | ✅ | ✅ | ✅ | ✅ |

### Action Buttons

Automatically shown based on account type:

- **Message** - Opens chat widget
- **Call** - Initiates phone call
- **Book Appointment** - Opens booking flow
- **View Products** - Navigates to products
- **Share** - Copies profile URL

---

## 📊 Database Schema

### Core Tables

```sql
-- Base users table
users (
  user_id UUID PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  account_type TEXT,
  is_verified BOOLEAN,
  location TEXT,
  ...
)

-- Seller-specific
sellers (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(user_id),
  store_name TEXT,
  total_products INTEGER,
  total_sales INTEGER,
  average_rating DECIMAL,
  ...
)

-- Doctor-specific
health_doctor_profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  specialization TEXT,
  license_number TEXT,
  consultation_fee DECIMAL,
  total_appointments INTEGER,
  ...
)

-- ... and so on for each account type
```

---

## 🧪 Testing

### Test Profile URLs

```bash
# Seller Profile
/profile/seller-uuid-here

# Doctor Profile  
/profile/doctor-uuid-here

# Freelancer Profile
/profile/freelancer-uuid-here

# Pharmacy Profile
/profile/pharmacy-uuid-here

# Patient Profile (should show limited info)
/profile/patient-uuid-here
```

### Test Helper Function

```sql
-- Test in Supabase SQL Editor
SELECT public.get_public_profile('your-user-id-here');
```

---

## 🛠️ Customization

### Add New Account Type

1. **Add to types** (`src/types/public-profile.ts`):
```typescript
export type AccountType = 
  | 'user'
  | 'your_new_type'  // Add here
  | ...;

export interface YourNewTypeProfile extends BaseProfile {
  account_type: 'your_new_type';
  // Add specific fields
}
```

2. **Add config** (`src/lib/profileConfig.ts`):
```typescript
your_new_type: {
  label: 'Your Type',
  icon: 'IconName',
  color: 'bg-color-500',
  // ... other properties
}
```

3. **Update hook** (`src/hooks/usePublicProfile.ts`):
```typescript
case 'your_new_type': {
  const { data, error } = await supabase
    .from('your_table')
    .select('*, users!(...)')
    .eq('user_id', userId)
    .single();
  // ...
}
```

4. **Add RLS policies** (`create-public-profile-rls.sql`):
```sql
ALTER TABLE public.your_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable" ON public.your_table
  FOR SELECT TO authenticated USING (true);
```

---

## 📝 TODO / Future Enhancements

- [ ] Implement Products tab content
- [ ] Implement Services tab content
- [ ] Implement Portfolio tab content
- [ ] Implement Reviews tab content
- [ ] Implement Appointments tab content
- [ ] Implement Medicines tab content
- [ ] Add profile verification badge levels
- [ ] Add profile analytics dashboard
- [ ] Add profile editing capability
- [ ] Add profile photo upload
- [ ] Add cover photo upload
- [ ] Add social media links
- [ ] Add profile visibility settings
- [ ] Add profile QR code generation
- [ ] Add profile export (PDF/vCard)

---

## 🐛 Troubleshooting

### Profile Not Loading

1. Check RLS policies are applied
2. Verify user ID is valid
3. Check browser console for errors
4. Test helper function in SQL Editor

### "Profile Not Found" Error

- User may not have a profile in the specific table
- Account type mismatch
- RLS policy blocking access

### Permission Denied

- Ensure you're authenticated
- Check RLS policies for the table
- Verify `authenticated` role has SELECT permission

---

## 📚 Related Documentation

- [Trading Chat System](./CHAT_SYSTEM_README.md)
- [Services Marketplace](./SERVICES_MARKETPLACE_README.md)
- [Healthcare Module](./HEALTHCARE_README.md)
- [Factory Features](./FACTORY_FEATURES.md)

---

## 📄 License

Part of the Aurora E-commerce Platform.
