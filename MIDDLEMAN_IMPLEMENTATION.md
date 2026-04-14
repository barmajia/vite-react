# Middleman Module Implementation Guide

## 📋 Overview

This guide explains how to set up and use the **Middleman Module** in your Aurora E-Commerce platform. The middleman role is a core feature that enables users to:

1. **Select products** from factories/sellers to market
2. **Create custom shop templates** with their branding
3. **Manage deals** between buyers and sellers
4. **Earn commissions** on successful transactions
5. **Track analytics** on their marketing performance

---

## 🚀 Quick Start

### Step 1: Run the Database Schema

Execute the SQL file in your Supabase SQL Editor:

```bash
# Copy the contents of middleman-complete-schema.sql
# Paste into Supabase Dashboard > SQL Editor > Run
```

**File:** `/workspace/middleman-complete-schema.sql`

This will create:
- ✅ Enhanced `middleman_profiles` table
- ✅ `middleman_products` table (product selection tracking)
- ✅ `middleman_templates` table (custom shop templates)
- ✅ Enhanced `deals` table (commission tracking)
- ✅ `middleman_analytics` table (performance metrics)
- ✅ 6 RPC functions for operations
- ✅ RLS policies for security
- ✅ Triggers for automation

### Step 2: Verify Installation

Run these verification queries:

```sql
-- Check tables exist
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'middleman%';

-- Check functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE 'middleman%';

-- Test signup function
SELECT public.update_middleman_profile(
  p_user_id := auth.uid(),
  p_full_name := 'Test Middleman',
  p_company_name := 'Test Corp'
);
```

---

## 📝 Middleman Signup Flow

### Frontend Integration

The signup page is located at: `/workspace/src/pages/middleman/MiddlemanSignup.tsx`

**Features:**
- Multi-step form (5 steps)
- Business license upload
- Company information collection
- Automatic profile creation via RPC

**Signup Steps:**
1. **Account** - Email & Password
2. **Personal** - Full Name & Phone
3. **Business** - Company Details & Commission Rate
4. **Verification** - Tax ID, Experience, License Upload
5. **Preferences** - Language & Theme

### How It Works

```typescript
// 1. Create Auth Account
const { data: authData } = await supabase.auth.signUp({
  email, password,
  options: { data: { account_type: "middleman" } }
});

// 2. Insert into Users Table
await supabase.from("users").insert({
  user_id: authData.user.id,
  account_type: "middleman",
  // ... other fields
});

// 3. Create/Update Middleman Profile via RPC
await supabase.rpc('update_middleman_profile', {
  p_user_id: authData.user.id,
  p_full_name: fullName,
  p_company_name: companyName,
  // ... other fields
});
```

**Fallback:** If RPC doesn't exist, it uses direct `upsert()` to `middleman_profiles` table.

---

## 🛍️ Product Selection System

### How Middlemen Select Products

Middlemen can browse the marketplace and select products to market in their custom shops.

**Database Function:**
```sql
SELECT public.middleman_select_product(
  p_product_id := 'uuid-here',
  p_custom_price := 99.99,  -- Optional markup
  p_custom_description := 'Custom marketing description',
  p_marketing_notes := 'Target audience: young professionals',
  p_target_audience := '25-35 age group'
);
```

**Frontend Usage:**
```typescript
// In product detail page
const handleSelectProduct = async (productId: string) => {
  const { data, error } = await supabase.rpc('middleman_select_product', {
    p_product_id: productId,
    p_custom_price: customPrice,
    p_custom_description: customDescription
  });
  
  if (error) throw error;
  toast.success('Product added to your shop!');
};
```

### Data Structure

```typescript
interface MiddlemanProduct {
  id: string;
  middleman_id: string;
  product_id: string;
  custom_price?: number;      // Middleman's markup
  custom_description?: string;
  custom_images?: string[];
  is_active: boolean;
  marketing_notes?: string;
  target_audience?: string;
  selected_at: string;
}
```

---

## 🎨 Shop Template System

### Creating Custom Templates

Middlemen can create branded e-commerce templates to showcase selected products.

**Database Function:**
```sql
SELECT public.middleman_create_template(
  p_template_name := 'Summer Electronics Store',
  p_theme_config := '{"primaryColor": "#3B82F6", "font": "Inter"}'::jsonb,
  p_header_config := '{"logo": "url", "navigation": ["Home", "Products"]}'::jsonb,
  p_featured_products := ARRAY['uuid-1', 'uuid-2']
);
```

**Template Configuration:**

```typescript
interface TemplateConfig {
  theme_config: {
    primaryColor: string;
    secondaryColor: string;
    font: string;
    layout: 'grid' | 'list';
  };
  header_config: {
    logo: string;
    navigation: string[];
    heroSection: {
      title: string;
      subtitle: string;
      backgroundImage: string;
    };
  };
  featured_products: string[];  // Array of product IDs
}
```

### Publishing Templates

```typescript
const publishTemplate = async (templateId: string) => {
  const { error } = await supabase
    .from('middleman_templates')
    .update({ 
      is_published: true,
      published_at: new Date().toISOString()
    })
    .eq('id', templateId);
};
```

---

## 💼 Deal Management

### Creating Deals

Middlemen connect buyers (party_a) with sellers/factories (party_b) and earn commissions.

**Database Function:**
```sql
SELECT public.middleman_create_deal(
  p_deal_title := 'Bulk Electronics Order',
  p_deal_description := '1000 units of smartphones',
  p_party_a_id := 'buyer-uuid',
  p_party_b_id := 'seller-uuid',
  p_product_id := 'product-uuid',
  p_quantity := 1000,
  p_unit_price := 500.00,
  p_commission_rate := 5.0,  -- 5% commission
  p_terms_conditions := 'Payment within 30 days',
  p_starts_at := '2024-01-01',
  p_expires_at := '2024-12-31'
);
```

**Deal Statuses:**
- `draft` - Not yet sent to parties
- `pending` - Awaiting acceptance
- `active` - Deal is active
- `completed` - Successfully closed
- `cancelled` - Cancelled by any party
- `rejected` - Rejected by a party

### Commission Calculation

```typescript
// Automatic calculation in RPC function
const totalValue = unitPrice * quantity;  // 500 * 1000 = 500,000
const commissionAmount = totalValue * (commissionRate / 100);  // 500,000 * 0.05 = 25,000
```

---

## 📊 Analytics & Dashboard

### Dashboard Stats

**Get Stats Function:**
```sql
SELECT * FROM public.get_middleman_dashboard_stats();
```

**Returns:**
```typescript
interface DashboardStats {
  total_deals: number;
  active_deals: number;
  completed_deals: number;
  total_commission: number;      // Paid commissions
  pending_commission: number;    // Awaiting payment
  total_products: number;        // Selected products
  active_templates: number;      // Published templates
  total_views: number;           // Template views
  conversion_rate: number;       // Views to purchases
}
```

### Tracking Events

```typescript
// Track when someone views a template
await supabase.rpc('track_middleman_analytics', {
  p_event_type: 'view',
  p_template_id: templateId,
  p_metadata: { source: 'google_ads' }
});

// Track purchase
await supabase.rpc('track_middleman_analytics', {
  p_event_type: 'purchase',
  p_product_id: productId,
  p_template_id: templateId,
  p_deal_id: dealId
});
```

---

## 🔐 Security & RLS Policies

### Row Level Security

All tables have RLS enabled with these policies:

**Middleman Profiles:**
- ✅ Public can view all profiles
- ✅ Users can only update their own profile
- ✅ Only authenticated users can insert

**Middleman Products:**
- ✅ Authenticated users can view active products
- ✅ Middlemen can only manage their own products

**Templates:**
- ✅ Public can view published templates
- ✅ Middlemen can manage their own templates

**Deals:**
- ✅ Only involved parties (middleman, buyer, seller) can view
- ✅ Middlemen can manage their own deals

---

## 📁 File Structure

```
/workspace/
├── middleman-complete-schema.sql    # Database schema & functions
├── MIDDLEMAN_IMPLEMENTATION.md      # This guide
└── src/
    ├── pages/
    │   └── middleman/
    │       ├── MiddlemanSignup.tsx     # Signup form
    │       ├── MiddlemanDashboard.tsx  # Main dashboard
    │       ├── MiddlemanDeals.tsx      # Deals list
    │       ├── MiddlemanCreateDeal.tsx # Create deal form
    │       ├── MiddlemanConnections.tsx # Network management
    │       ├── MiddlemanAnalytics.tsx  # Analytics view
    │       └── ... (other pages)
    └── components/
        └── middleman-dashboard/
            ├── MiddlemanDashboardPage.tsx
            └── MiddlemanDashboardLayout.tsx
```

---

## 🧪 Testing Checklist

### Signup Flow
- [ ] Create new middleman account via signup form
- [ ] Verify email confirmation received
- [ ] Check `users` table has correct `account_type`
- [ ] Check `middleman_profiles` table has all fields
- [ ] Verify business license uploaded to storage

### Product Selection
- [ ] Browse products as middleman
- [ ] Select a product with custom price
- [ ] Verify entry in `middleman_products` table
- [ ] Update product customization
- [ ] Deactivate product selection

### Template Creation
- [ ] Create new template with theme config
- [ ] Add featured products
- [ ] Publish template
- [ ] Access public template URL
- [ ] View analytics for template

### Deal Management
- [ ] Create new deal with buyer & seller
- [ ] Verify commission calculation
- [ ] Change deal status (draft → pending → active)
- [ ] Complete deal
- [ ] Verify commission marked as paid

### Analytics
- [ ] Trigger view event on template
- [ ] Trigger purchase event
- [ ] Check dashboard stats update
- [ ] Verify conversion rate calculation

---

## 🐛 Troubleshooting

### Issue: "User does not have a middleman profile"

**Solution:** Run the signup flow again or manually create profile:
```sql
INSERT INTO public.middleman_profiles (user_id, full_name)
VALUES ('user-uuid', 'Name')
ON CONFLICT (user_id) DO UPDATE SET updated_at = now();
```

### Issue: RLS policy blocking insert

**Solution:** Ensure user is authenticated and policies are correct:
```sql
-- Check current policies
SELECT * FROM pg_policies WHERE tablename = 'middleman_profiles';

-- Re-create if needed (see schema file)
```

### Issue: RPC function not found

**Solution:** Re-run the SQL schema file or check function name:
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public';
```

---

## 📈 Next Steps

1. **Implement Product Browser** - Create UI for middlemen to browse and select products
2. **Build Template Editor** - Drag-and-drop template customization interface
3. **Add Deal Notifications** - Email/push notifications for deal updates
4. **Create Analytics Dashboard** - Charts and graphs for performance metrics
5. **Integrate Payment Split** - Automatic commission distribution on deal completion

---

## 📞 Support

For issues or questions:
- Check the SQL schema file for detailed comments
- Review RLS policies in Supabase Dashboard
- Test RPC functions in SQL Editor before frontend integration
- Enable Supabase logs for debugging

---

**Version:** 1.0  
**Last Updated:** 2024  
**Author:** Aurora Development Team
