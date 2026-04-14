# Multi-Vendor E-Commerce Platform: Complete Implementation Guide

## 🎯 Project Overview

This guide provides complete documentation for implementing a **Middleman/Seller Onboarding System** with instant storefront generation, template selection, and a comprehensive seller dashboard.

**Tech Stack**: React (Vite), TypeScript, Supabase, TailwindCSS  
**Architecture**: Multi-tenant SaaS with Row Level Security (RLS)

---

## 📁 File Structure

```
vite-react/
├── database/
│   └── schema.sql                          # Complete database schema with RLS
├── architecture/
│   └── USER_FLOW.md                        # User flow diagrams & state transitions
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   └── Button.tsx                  # Existing reusable Button component
│   │   ├── onboarding/
│   │   │   └── TemplateSelectionWizard.tsx # Template selection during signup
│   │   ├── dashboard/
│   │   │   └── SellerDashboard.tsx         # Complete seller dashboard
│   │   └── storefront/
│   │       └── Storefront.tsx              # Dynamic storefront renderer
│   ├── services/
│   │   └── storefront.ts                   # API services for storefront
│   ├── hooks/
│   │   └── useSeller.ts                    # Custom React hooks for seller management
│   ├── pages/
│   │   └── Auth.tsx                        # Signup, Login, Auth Callback pages
│   └── lib/
│       └── supabase.ts                     # Existing Supabase client configuration
├── testing/
│   └── VALIDATION_CHECKLIST.md             # Complete testing & validation guide
└── SELLER_ONBOARDING_GUIDE.md              # This file
```

---

## 🚀 Quick Start Guide

### 1. Database Setup

Run the SQL schema in your Supabase project:

```bash
# 1. Go to your Supabase project dashboard
# 2. Navigate to SQL Editor
# 3. Paste and execute database/schema.sql
```

**What this creates:**
- ✅ `sellers` table - Seller profiles
- ✅ `templates` table - Storefront templates (3 pre-seeded)
- ✅ `store_configs` table - Seller customizations
- ✅ `products` table - Product catalog
- ✅ `orders` & `order_items` tables - Order management
- ✅ `store_visitors` table - Analytics tracking
- ✅ **Row Level Security (RLS)** policies on all tables
- ✅ **Triggers** for automatic seller profile creation
- ✅ **Functions** for config merging, order number generation

### 2. Environment Variables

Ensure your `.env` file contains:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Storage Bucket Setup

Create a Supabase Storage bucket for store assets:

```sql
-- Run in Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-assets', 'store-assets', true);

-- Allow authenticated users to upload
CREATE POLICY "Sellers can upload store assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'store-assets');

-- Allow public access to view assets
CREATE POLICY "Anyone can view store assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'store-assets');
```

### 4. Install Dependencies

```bash
npm install @supabase/supabase-js react-router-dom
npm install -D @types/react-router-dom
```

### 5. Add Routes to Your App

Update your `App.tsx` or routing configuration:

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SignupPage, LoginPage, AuthCallbackPage, ProtectedRoute } from '@/pages/Auth';
import { TemplateSelectionWizard } from '@/components/onboarding/TemplateSelectionWizard';
import { SellerDashboard } from '@/components/dashboard/SellerDashboard';
import { Storefront } from '@/components/storefront/Storefront';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        
        {/* Storefront (Public) */}
        <Route path="/store/:slug" element={<Storefront />} />
        
        {/* Protected Routes */}
        <Route
          path="/onboarding/template-selection"
          element={
            <ProtectedRoute requireOnboarding={true}>
              <TemplateSelectionWizard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <SellerDashboard />
            </ProtectedRoute>
          }
        />
        
        {/* Add your other routes here */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

---

## 📊 User Flow Summary

### Complete Journey (5 Minutes to Live Store)

```
1. Visitor arrives at /signup
   ↓
2. Fills out form (Store Name, Email, Password)
   ↓ (3 seconds)
3. Account created → Database trigger creates seller profile
   ↓
4. Auto-redirect to /onboarding/template-selection
   ↓
5. Browse 3-5 templates → Preview → Select one
   ↓ (2 seconds)
6. Click "Create My Store" → Template saved to profile
   ↓
7. Auto-redirect to /dashboard
   ↓
8. Store is LIVE at /store/{seller_slug}
   ↓
9. Add products from dashboard
   ↓
10. Store now displays products publicly
```

**Total Time**: ~5 minutes from signup to live storefront

---

## 🏗️ Component Details

### 1. TemplateSelectionWizard

**Location**: `src/components/onboarding/TemplateSelectionWizard.tsx`

**Purpose**: Allow sellers to choose a storefront template during onboarding.

**Features**:
- Grid display of active templates
- Visual thumbnails and descriptions
- Live preview modal for each template
- Selection confirmation with loading states
- Error handling and retry

**Usage**:
```tsx
import { TemplateSelectionWizard } from '@/components/onboarding/TemplateSelectionWizard';

// Protected route - only accessible if seller hasn't selected template yet
<Route path="/onboarding/template-selection" element={<TemplateSelectionWizard />} />
```

**Props**: None (self-contained)

---

### 2. Storefront (Dynamic Renderer)

**Location**: `src/components/storefront/Storefront.tsx`

**Purpose**: Render a seller's public storefront based on their template and config.

**Features**:
- Dynamic rendering from JSON config
- Template-based theming (colors, fonts, layout)
- Product grid display
- Hero section with customizable content
- Responsive design (mobile-first)
- "Store Not Found" fallback for inactive sellers

**Usage**:
```tsx
import { Storefront } from '@/components/storefront/Storefront';

// Public route - accessible to anyone
<Route path="/store/:slug" element={<Storefront />} />
```

**How It Works**:
1. Fetches seller by `store_slug`
2. Retrieves `store_configs` with merged template + custom config
3. Fetches active products for that seller
4. Renders storefront using template's layout structure
5. Applies colors, fonts, and sections from config

**Customization Points**:
- Edit `default_config` in `templates` table to change template defaults
- Sellers can override via `store_configs.custom_config` (JSONB)

---

### 3. SellerDashboard

**Location**: `src/components/dashboard/SellerDashboard.tsx`

**Purpose**: Complete seller management interface with products, orders, and settings.

**Tabs**:
1. **Overview**: Key metrics (sales, orders, products, visitors)
2. **Products**: CRUD interface for product management
3. **Orders**: Order management (placeholder - extend as needed)
4. **Store Settings**: Edit colors, upload logo, modify sections
5. **Analytics**: Visitor and sales analytics (placeholder)

**Features**:
- Real-time stats updates (Supabase Realtime)
- Product add/edit/delete with modal forms
- Color picker for store customization
- Logo upload to Supabase Storage
- Quick actions for common tasks

**Usage**:
```tsx
import { SellerDashboard } from '@/components/dashboard/SellerDashboard';

// Protected route - only accessible to authenticated sellers
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <SellerDashboard />
    </ProtectedRoute>
  }
/>
```

---

### 4. Auth Pages (Signup/Login)

**Location**: `src/pages/Auth.tsx`

**Purpose**: Authentication flows with seamless transition to onboarding.

**Components**:
- `SignupPage`: Email/password + social signup
- `LoginPage`: Email/password + social login
- `AuthCallbackPage`: OAuth callback handler
- `ProtectedRoute`: Route guard for authenticated users

**Features**:
- Form validation (password strength, match confirmation)
- Loading states during auth operations
- Automatic redirect based on onboarding status
- Social auth support (Google, GitHub)
- Error handling and display

**Flow**:
```
Signup → Create auth.user → Trigger creates seller profile →
Redirect to /onboarding/template-selection (if no template) OR
Redirect to /dashboard (if template already selected)
```

---

## 🔧 Services & Hooks

### Services (`src/services/storefront.ts`)

**Template Services**:
- `getActiveTemplates()`: Fetch all available templates
- `getTemplateById(id)`: Fetch single template

**Seller Services**:
- `getSellerProfile()`: Get current seller's profile
- `updateSellerProfile(updates)`: Update seller data
- `selectTemplate(templateId)`: Choose template and activate store

**Store Config Services**:
- `getStoreConfigBySlug(slug)`: Get public store config (for storefront)
- `updateStoreConfig(customConfig)`: Update seller's custom config
- `uploadStoreLogo(file)`: Upload logo to Supabase Storage

**Product Services**:
- `getSellerProducts()`: Get current seller's products (dashboard)
- `getStoreProducts(slug)`: Get active products for storefront
- `createProduct(product)`: Add new product
- `updateProduct(id, updates)`: Update existing product
- `deleteProduct(id)`: Delete product

**Analytics Services**:
- `getDashboardStats()`: Get aggregated dashboard metrics

**Realtime Services**:
- `subscribeToOrders(sellerId, callback)`: Real-time order updates
- `subscribeToStoreConfig(sellerId, callback)`: Real-time config updates
- `unsubscribe(channel)`: Clean up subscriptions

---

### Custom Hooks (`src/hooks/useSeller.ts`)

- `useAuth()`: Authentication state and methods (signUp, signIn, signOut)
- `useSeller()`: Seller profile state and updates
- `useTemplates()`: Fetch available templates
- `useStoreConfig(slug)`: Fetch and update store configuration
- `useProducts(mode, slug)`: Product management (seller or storefront mode)
- `useDashboardStats()`: Dashboard statistics with auto-refresh
- `useRealtimeOrders(sellerId)`: Real-time order subscription
- `useTemplateSelection()`: Template selection state and submission

**Usage Example**:
```tsx
import { useSeller, useTemplates } from '@/hooks/useSeller';

function MyComponent() {
  const { seller, loading: sellerLoading } = useSeller();
  const { templates, loading: templatesLoading } = useTemplates();

  if (sellerLoading || templatesLoading) return <LoadingSpinner />;

  return (
    <div>
      <h1>Welcome, {seller?.store_name}</h1>
      <p>Available templates: {templates.length}</p>
    </div>
  );
}
```

---

## 🔐 Security Architecture

### Row Level Security (RLS)

**Critical Security Rule**: Sellers can NEVER see other sellers' data.

**How It Works**:
```sql
-- Example RLS policy on products table
CREATE POLICY "Sellers can view own products"
  ON products FOR SELECT
  USING (auth.uid() = seller_id);

-- Public can view active products
CREATE POLICY "Public can view active products"
  ON products FOR SELECT
  USING (
    is_active = TRUE AND
    EXISTS (
      SELECT 1 FROM sellers
      WHERE sellers.id = products.seller_id
      AND sellers.is_active = TRUE
    )
  );
```

**RLS Matrix**:

| Table | Seller Access | Public Access |
|-------|--------------|---------------|
| `sellers` | Own profile only | Active sellers (limited fields) |
| `templates` | View all | View active only |
| `store_configs` | Own config only | Active sellers' merged config |
| `products` | Own products only | Active products from active sellers |
| `orders` | Own orders only | None (private) |
| `order_items` | Via orders only | None (private) |

**Testing RLS**:
```sql
-- Test as Seller A
SET LOCAL ROLE authenticated;
SET LOCAL "request.jwt.claims" = '{"sub": "seller-a-id"}';

-- Should return 0 rows (blocked by RLS)
SELECT * FROM products WHERE seller_id = 'seller-b-id';
```

---

## 📈 Performance Optimizations

### 1. Database Indexes
All foreign keys and frequently queried columns are indexed:
```sql
CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_store_configs_seller ON store_configs(seller_id);
```

### 2. Supabase Realtime
Use Realtime subscriptions for live updates instead of polling:
```typescript
supabase
  .channel('orders')
  .on('postgres_changes', { event: 'INSERT', table: 'orders' }, callback)
  .subscribe();
```

### 3. Image Optimization
- Store images in Supabase Storage
- Use CDN for fast delivery
- Implement lazy loading for product images

### 4. Client-Side Caching
React Query or SWR for automatic caching and refetching:
```typescript
import { useQuery } from '@tanstack/react-query';

const { data: templates } = useQuery({
  queryKey: ['templates'],
  queryFn: getActiveTemplates,
  staleTime: 1000 * 60 * 5, // Cache for 5 minutes
});
```

---

## 🧪 Testing Strategy

See `testing/VALIDATION_CHECKLIST.md` for complete testing guide.

**Quick Tests**:
1. **Signup Flow**: Sign up → Verify redirect to template selection
2. **Template Selection**: Select template → Verify store created at `/store/{slug}`
3. **Product Management**: Add product → Verify appears on storefront
4. **RLS Security**: Try to access another seller's data → Verify blocked
5. **Mobile Responsiveness**: Open storefront on mobile → Verify layout adjusts

---

## 🎨 Customization Guide

### Adding a New Template

1. **Insert into database**:
```sql
INSERT INTO templates (name, description, thumbnail_url, default_config)
VALUES (
  'Luxury',
  'Premium design for high-end products',
  '/templates/luxury.png',
  '{
    "colors": {
      "primary": "#1a1a1a",
      "secondary": "#d4af37",
      "background": "#ffffff",
      "text": "#1a1a1a",
      "accent": "#d4af37"
    },
    "fonts": {
      "heading": "Playfair Display",
      "body": "Lato"
    },
    "layout": {
      "header_style": "luxury",
      "product_grid": "2-column",
      "footer_style": "luxury"
    },
    "sections": {
      "hero": {
        "enabled": true,
        "title": "Luxury Collection",
        "subtitle": "Exclusive premium products",
        "cta_text": "Discover",
        "background_image": null
      },
      "featured_products": {
        "enabled": true,
        "title": "Featured",
        "max_items": 6
      }
    }
  }'::jsonb
);
```

2. **Template automatically appears** in selection wizard (no code changes needed)

### Changing Store Colors (Seller Side)

Sellers can update colors from dashboard → Store Settings, or via API:

```typescript
import { updateStoreConfig } from '@/services/storefront';

await updateStoreConfig({
  colors: {
    primary: '#FF0000', // New primary color
    secondary: '#00FF00',
  },
});
```

### Adding New Sections to Storefront

1. **Update template default_config**:
```sql
UPDATE templates
SET default_config = jsonb_set(
  default_config,
  '{sections,testimonials}',
  '{
    "enabled": true,
    "title": "Customer Reviews",
    "max_items": 5
  }'::jsonb
)
WHERE name = 'Minimalist';
```

2. **Add component to Storefront.tsx**:
```tsx
// Add TestimonialsSection component
<TestimonialsSection
  config={templateConfig.sections.testimonials}
  colors={templateConfig.colors}
/>
```

---

## 🚀 Deployment Checklist

### Pre-Launch
- [ ] Database schema deployed to Supabase
- [ ] RLS policies tested and verified
- [ ] Storage bucket created with correct policies
- [ ] Environment variables configured
- [ ] All templates seeded in database
- [ ] Routes configured in App.tsx
- [ ] Error boundaries added to React app
- [ ] Loading states implemented
- [ ] Mobile responsiveness tested

### Security
- [ ] RLS penetration testing passed
- [ ] Input sanitization implemented
- [ ] CSP headers configured
- [ ] CSRF protection enabled
- [ ] Rate limiting configured (if needed)

### Performance
- [ ] Database indexes created
- [ ] Images optimized (WebP format)
- [ ] CDN configured for static assets
- [ ] Lighthouse score > 90 (desktop), > 70 (mobile)

### Testing
- [ ] Unit tests pass (100% coverage on critical paths)
- [ ] Integration tests pass
- [ ] E2E tests pass for complete user journeys
- [ ] Load tests pass (100 concurrent users)

### Monitoring
- [ ] Error tracking configured (Sentry)
- [ ] Analytics implemented
- [ ] Database query monitoring enabled
- [ ] Uptime monitoring configured

---

## 🐛 Troubleshooting

### Issue: Signup doesn't redirect to template selection

**Cause**: Database trigger not firing or session not available  
**Fix**:
1. Check Supabase logs for trigger errors
2. Verify `handle_new_seller()` function exists
3. Check `sellers` table for new row after signup
4. Verify `useSeller()` hook detects seller profile

### Issue: Storefront shows "Store Not Found"

**Cause**: Seller inactive or slug incorrect  
**Fix**:
1. Verify `sellers.is_active = TRUE` in database
2. Check `store_slug` matches URL exactly
3. Verify RLS policy allows public access to active sellers

### Issue: Products don't appear on storefront

**Cause**: RLS blocking or `is_active = FALSE`  
**Fix**:
1. Check `products.is_active = TRUE`
2. Verify `sellers.is_active = TRUE`
3. Test query as anonymous user (should return products)
4. Check browser console for RLS errors

### Issue: Template selection doesn't save

**Cause**: Auth session expired or RLS policy blocking  
**Fix**:
1. Verify user is authenticated (check `supabase.auth.getUser()`)
2. Check `store_configs` INSERT policy allows authenticated users
3. Check Supabase logs for constraint violations

---

## 📞 Support & Resources

### Documentation
- **Supabase Docs**: https://supabase.com/docs
- **React Router Docs**: https://reactrouter.com/
- **TailwindCSS Docs**: https://tailwindcss.com/

### Key Files in This Project
- `database/schema.sql` - Complete database schema
- `architecture/USER_FLOW.md` - User flow diagrams
- `testing/VALIDATION_CHECKLIST.md` - Testing guide
- `src/services/storefront.ts` - API services
- `src/hooks/useSeller.ts` - Custom hooks

### Common Questions

**Q: How do I add more templates?**  
A: Insert into `templates` table with `default_config` JSONB. No code changes needed.

**Q: Can sellers use custom domains?**  
A: Yes, `store_configs.custom_domain` field exists. Implement DNS verification and routing in your hosting setup.

**Q: How do I handle payments?**  
A: Integrate Stripe or similar payment processor. Add payment fields to `orders` table and implement webhook handling.

**Q: Can I use this with Flutter?**  
A: Yes, the database and API are framework-agnostic. Flutter can use the same Supabase client for seller dashboard.

---

## 🎯 Next Steps

1. ✅ Database schema complete
2. ✅ Services and hooks implemented
3. ✅ Components built (Auth, Templates, Dashboard, Storefront)
4. ✅ Testing guide created
5. ⏳ Add payment integration (Stripe)
6. ⏳ Implement email notifications
7. ⏳ Add advanced analytics dashboard
8. ⏳ Build Flutter mobile app for seller management
9. ⏳ Add product reviews/ratings
10. ⏳ Implement inventory management alerts

---

**Document Version**: 1.0  
**Last Updated**: 2026-04-14  
**Status**: ✅ Production Ready (pending testing)  
**Maintained By**: Development Team
