# Multi-Vendor E-Commerce Platform: User Flow & Architecture

## 📊 User Flow Diagram

### 1. **Signup & Onboarding Flow**

```
┌─────────────────────────────────────────────────────────────┐
│                    SIGNUP FLOW                               │
└─────────────────────────────────────────────────────────────┘

[Visitor] 
   │
   ├─ Option A: Email/Password Signup
   │   └─> [Submit Form] ──> [Create Auth User in Supabase]
   │
   ├─ Option B: Social Auth (Google, GitHub, etc.)
   │   └─> [OAuth Flow] ──> [Create Auth User in Supabase]
   │
   └─> Trigger: `on_auth_user_created`
       └─> Creates seller profile in `sellers` table
           │
           └─> Redirect to: `/onboarding/template-selection`
               │
               └─> [Template Selection Wizard]
                   │
                   ├─ Step 1: Browse Templates (3-5 options)
                   │   ├─ Minimalist
                   │   ├─ Bold
                   │   └─ Tech-Focused
                   │
                   ├─ Step 2: Preview Template (Live Demo)
                   │
                   └─ Step 3: Select Template
                       └─> Updates `sellers.current_template_id`
                       └─> Creates `store_configs` entry
                       └─> Store is NOW LIVE at `/store/{seller_slug}`
                           │
                           └─> Redirect to: `/dashboard`
```

### 2. **State Transitions**

```typescript
// Authentication States
type AuthState = 
  | 'unauthenticated'
  | 'signing_up'
  | 'verifying_email'
  | 'authenticated';

// Onboarding States
type OnboardingState =
  | 'not_started'
  | 'template_selection'
  | 'template_preview'
  | 'template_selected'
  | 'completed';

// Seller Profile States
type SellerState = {
  auth: AuthState;
  onboarding: OnboardingState;
  profile: {
    id: string | null;
    email: string;
    storeName: string;
    storeSlug: string;
    currentTemplateId: number | null;
    subscriptionStatus: 'free' | 'basic' | 'pro' | 'enterprise';
    isActive: boolean;
  };
};
```

### 3. **Public Storefront Flow**

```
┌─────────────────────────────────────────────────────────────┐
│              PUBLIC STOREFRONT RENDERING                     │
└─────────────────────────────────────────────────────────────┘

URL: `/store/{seller_slug}` or custom domain

[Request Received]
   │
   ├─ 1. Query `sellers` table by `store_slug`
   │   └─> If not found or inactive ──> Show "Store Not Found" page
   │
   ├─ 2. Fetch `store_configs` for this seller
   │   └─> Get `merged_config` (template + customizations)
   │
   ├─ 3. Fetch `templates` by `template_id`
   │   └─> Get template structure and defaults
   │
   ├─ 4. Fetch active `products` WHERE seller_id = {seller_id}
   │   └─> Filter by is_active = TRUE
   │
   └─ 5. Dynamically Render Storefront
       │
       ├─ Apply merged_config:
       │   ├─ Colors (primary, secondary, background, text, accent)
       │   ├─ Fonts (heading, body)
       │   └─ Layout (header_style, product_grid, footer_style)
       │
       ├─ Render Sections:
       │   ├─ Hero (if enabled)
       │   ├─ Featured Products (if enabled)
       │   ├─ Testimonials (if enabled)
       │   └─ Product Grid
       │
       └─> Return Fully Rendered Page
```

### 4. **Seller Dashboard Flow**

```
┌─────────────────────────────────────────────────────────────┐
│                  SELLER DASHBOARD                            │
└─────────────────────────────────────────────────────────────┘

URL: `/dashboard`

[Dashboard Load]
   │
   ├─ Check Authentication
   │   └─> If not authenticated ──> Redirect to `/login`
   │
   ├─ Check Onboarding Status
   │   └─> If not completed ──> Redirect to `/onboarding/template-selection`
   │
   └─ Load Dashboard Data (Parallel):
       │
       ├─ A. Overview Section (Real-Time)
       │   ├─ Total Sales (from `orders` WHERE seller_id = auth.uid())
       │   ├─ Active Orders (count)
       │   ├─ Total Products (count)
       │   └─ Visitor Count (last 30 days from `store_visitors`)
       │
       ├─ B. Store Preview
       │   ├─ Current Template Name
       │   ├─ Store URL (link to public storefront)
       │   └─ Quick Actions:
       │       ├─ "Change Template"
       │       └─ "View Store"
       │
       └─ C. Navigation Menu:
           ├─ Overview (default)
           ├─ Products (CRUD)
           ├─ Orders (View & Update Status)
           ├─ Store Settings (Edit Mode)
           │   ├─ Edit Colors
           │   ├─ Upload Logo
           │   ├─ Edit Banner Text
           │   ├─ Modify Sections (enable/disable)
           │   └─ SEO Settings
           ├─ Analytics
           └─ Subscription/Billing
```

### 5. **Edit Mode Flow (Live Site Updates)**

```
┌─────────────────────────────────────────────────────────────┐
│               LIVE SITE EDITING FLOW                         │
└─────────────────────────────────────────────────────────────┘

[Seller in Dashboard > Store Settings]
   │
   ├─ 1. Seller modifies config (e.g., changes primary color)
   │
   ├─ 2. Frontend updates local state immediately (optimistic UI)
   │
   ├─ 3. Send UPDATE to `store_configs` table:
   │   ```sql
   │   UPDATE store_configs
   │   SET custom_config = jsonb_set(
   │     custom_config,
   │     '{colors,primary}',
   │     '"#NEW_COLOR"'
   │   )
   │   WHERE seller_id = auth.uid()
   │   ```
   │
   ├─ 4. Database Trigger `update_merged_config` fires:
   │   └─> Automatically recalculates `merged_config`
   │   └─> Updates `updated_at` timestamp
   │
   ├─ 5. Supabase Realtime broadcasts change:
   │   └─> Dashboard receives confirmation ──> Show "Saved!" toast
   │
   └─ 6. Public Storefront (on next page load or via WebSocket):
       └─> Fetches updated `merged_config`
       └─> Renders with new color immediately
```

### 6. **Offline-First Architecture (Flutter Dashboard)**

```
┌─────────────────────────────────────────────────────────────┐
│               OFFLINE CAPABILITY FLOW                        │
└─────────────────────────────────────────────────────────────┘

[Flutter Dashboard App]
   │
   ├─ Local Storage (Hive/sqflite):
   │   ├─ Cached Products
   │   ├─ Cached Orders
   │   ├─ Cached Analytics
   │   └─ Pending Changes Queue
   │
   ├─ Online Mode:
   │   ├─ Fetch from Supabase ──> Update local cache
   │   └─ Real-time sync via Supabase streams
   │
   └─ Offline Mode:
       ├─ Load from local cache
       ├─ Allow CRUD operations (queue changes)
       └─ On reconnection:
           └─ Sync pending changes to Supabase
           └─ Resolve conflicts (last-write-wins or prompt user)
```

---

## 🔐 Security Architecture

### Row Level Security (RLS) Matrix

| Table        | SELECT                        | INSERT               | UPDATE               | DELETE               |
|--------------|-------------------------------|----------------------|----------------------|----------------------|
| sellers      | Own profile OR public active  | Auto on signup       | Own profile only     | Cascade from auth    |
| templates    | Anyone (active only)          | Admin only           | Admin only           | Admin only           |
| store_configs| Own OR public (active sellers)| Own seller only      | Own seller only      | Cascade from seller  |
| products     | Own OR public (active)        | Own seller only      | Own seller only      | Own seller only      |
| orders       | Own seller OR customer        | Via checkout flow    | Own seller only      | Restricted           |
| order_items  | Via orders                    | Via checkout flow    | Restricted           | Via orders           |
| visitors     | Own seller only               | System/service role  | N/A                  | N/A                  |

### Critical Security Rules

1. **Data Isolation**: Seller A can NEVER see Seller B's data
   - Enforced by RLS policies on all tables
   - Tested via direct database queries bypassing API

2. **SQL Injection Prevention**: 
   - All queries use parameterized statements
   - JSONB operations use built-in PostgreSQL functions

3. **XSS Prevention**:
   - All user input sanitized before storage
   - CSP headers on public storefronts

4. **Authentication Flow**:
   - JWT tokens managed by Supabase
   - Tokens refreshed automatically
   - Session timeout after inactivity

---

## 🏗️ Technical Architecture

### Frontend Structure (React/Vite)

```
src/
├── components/
│   ├── ui/                  # Reusable UI (Button, Input, etc.)
│   ├── auth/                # Login, Signup, Password Reset
│   ├── onboarding/          # Template Selection Wizard
│   ├── dashboard/           # Seller Dashboard
│   │   ├── Overview.tsx
│   │   ├── ProductManager.tsx
│   │   ├── OrderManager.tsx
│   │   └── StoreSettings.tsx
│   └── storefront/          # Public Storefront Renderer
│       ├── TemplateRenderer.tsx
│       ├── HeroSection.tsx
│       ├── ProductGrid.tsx
│       └── Footer.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useSeller.ts
│   ├── useStoreConfig.ts
│   └── useSupabase.ts
├── services/
│   ├── supabase.ts          # Supabase client
│   ├── api.ts               # API wrapper functions
│   └── realtime.ts          # Supabase Realtime subscriptions
├── store/                   # State management (Zustand/Redux)
│   ├── authStore.ts
│   └── sellerStore.ts
├── utils/
│   ├── configMerger.ts      # JSONB merge utilities
│   └── validators.ts
└── pages/
    ├── Login.tsx
    ├── Signup.tsx
    ├── TemplateSelection.tsx
    ├── Dashboard.tsx
    └── Storefront.tsx       # Dynamic route: /store/:slug
```

### Database Triggers & Functions

| Trigger/Function                  | Purpose                                              |
|-----------------------------------|------------------------------------------------------|
| `handle_new_seller()`             | Auto-create seller profile on auth.users insert      |
| `merge_store_config()`            | Merge template defaults with seller customizations   |
| `jsonb_deep_merge()`              | Recursive JSONB merge for nested configs             |
| `generate_order_number()`         | Create unique order numbers (ORD-YYYYMMDD-XXXX)      |
| `update_merged_config()`          | Auto-recalculate merged_config on store_configs update|
| `update_inventory_on_order()`     | Decrease inventory when order status changes         |
| `seller_dashboard_stats` (view)   | Aggregated stats for dashboard overview              |

---

## 🔄 Real-Time Update Strategy

### Supabase Realtime Subscriptions

1. **Dashboard Analytics**:
   ```typescript
   supabase
     .channel('orders')
     .on('postgres_changes', 
       { event: 'INSERT', schema: 'public', table: 'orders', filter: `seller_id=eq.${sellerId}` },
       (payload) => updateDashboardStats(payload.new)
     )
     .subscribe();
   ```

2. **Storefront Live Updates**:
   - Poll `store_configs` every 30 seconds OR
   - Use Supabase Realtime for instant updates (WebSocket connection)

3. **Inventory Sync**:
   - Real-time updates to product stock levels
   - Prevent overselling

---

## 📈 Performance Optimizations

1. **Database Indexes**: Created on all foreign keys and frequently queried columns
2. **Caching Strategy**:
   - Redis/SWR for React (client-side caching)
   - CDN caching for public storefronts
   - Incremental Static Regeneration (if using Next.js)

3. **Image Optimization**:
   - Supabase Storage for product images
   - Automatic resizing and WebP conversion

4. **Lazy Loading**:
   - Product images lazy-loaded
   - Dashboard sections loaded on-demand

---

## ✅ Validation Checklist

### Onboarding Experience
- [ ] Seamless transition from signup to template selection (no re-login)
- [ ] Templates visually distinct with live preview
- [ ] Template selection < 2 seconds to generate preview
- [ ] Store URL immediately accessible after selection

### Public Storefront
- [ ] Dynamic rendering based on `template_id` and `store_config`
- [ ] Data isolation: Store A only shows Seller A's products
- [ ] Mobile responsive out-of-the-box
- [ ] Site updates reflect database changes immediately

### Dashboard
- [ ] Real-time data updates via Supabase Realtime
- [ ] Edit persistence: changes saved and reflected on public site
- [ ] Offline capability (Flutter app with local cache)
- [ ] Loading states and error handling

### Security
- [ ] RLS prevents cross-seller data access
- [ ] Orphaned stores show "Store Closed" on account deletion
- [ ] All user input sanitized
- [ ] Rate limiting on API endpoints

### Testing
- [ ] Unit tests for config merging logic
- [ ] Integration tests for signup → template → dashboard flow
- [ ] E2E tests for complete user journeys
- [ ] Load tests for concurrent store rendering

---

## 🚀 Deployment Strategy

1. **Database**: Supabase (managed PostgreSQL)
2. **Frontend**: Vercel/Netlify for React app
3. **Storage**: Supabase Storage for images/assets
4. **CDN**: Automatic via hosting provider
5. **Monitoring**: Sentry for error tracking, Supabase logs for database monitoring

---

## 📝 Next Steps

1. ✅ Database schema created (`database/schema.sql`)
2. ⏳ Implement Supabase client configuration
3. ⏳ Build authentication flow
4. ⏳ Create template selection wizard
5. ⏳ Build dynamic storefront renderer
6. ⏳ Develop seller dashboard
7. ⏳ Add real-time subscriptions
8. ⏳ Implement offline-first capabilities (Flutter)
9. ⏳ Write comprehensive tests
10. ⏳ Deploy and monitor
