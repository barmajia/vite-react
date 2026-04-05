# 🛍️ Website Marketplace Implementation Guide

## Overview
Complete Vite + React marketplace implementation with:
- ✅ Template browsing and details
- ✅ Wallet-based purchases (free & paid)
- ✅ Dynamic storefront deployment
- ✅ Auth-gated checkout flow
- ✅ Password reset & recovery

## 📁 Files Created

### Database Migrations
```
migrations/
├── website_marketplace.sql      # Marketplace tables & RLS policies
└── wallet_rpc_functions.sql     # Secure wallet operations
```

### Routes
```
src/routes/
├── marketplace.routes.tsx       # /webmarketplace routes
└── storefront.routes.tsx        # /:username dynamic routes
```

### Pages
```
src/pages/
├── marketplace/
│   ├── MarketplaceGrid.tsx      # Template listing page
│   ├── TemplateDetails.tsx      # Single template view
│   └── MarketplaceCheckout.tsx  # Auth-gated checkout
├── storefront/
│   └── StorefrontPage.tsx       # Dynamic storefront renderer
└── auth/
    ├── ForgotPassword.tsx       # Password reset request
    └── UpdatePassword.tsx       # Password update form
```

## 🗄️ Database Setup

### Step 1: Run Migrations
Execute these SQL files in your Supabase SQL Editor:

1. **website_marketplace.sql** - Creates:
   - `website_marketplace` table (template listings)
   - `marketplace_purchases` table (purchase tracking)
   - `website_pages` table (dynamic storefront content)
   - RLS policies for security

2. **wallet_rpc_functions.sql** - Creates:
   - `deduct_wallet_balance()` - Secure wallet deduction
   - `add_wallet_balance()` - Add funds to wallet
   - `get_wallet_balance()` - Fetch wallet balance

### Step 2: Verify Tables
After running migrations, verify these tables exist:
- `website_marketplace`
- `marketplace_purchases`
- `website_pages`

## 🚀 Routes Added

### Marketplace Routes
- `/webmarketplace` - Browse all published templates
- `/webmarketplace/:id` - View template details & preview
- `/webmarketplace/:id/checkout` - Purchase/claim template (auth required)

### Auth Routes
- `/forgot-password` - Request password reset email
- `/update-password` - Update password after reset

### Storefront Routes
- `/:username` - Dynamic storefront (must be last in route order)

## 💰 Wallet Integration

### How Purchases Work

#### Free Templates (price = 0)
1. User clicks "Claim Free Template & Deploy"
2. System creates website record in `websites` table
3. Logs purchase with `amount_paid = 0`
4. Redirects to live storefront at `/{username}`

#### Paid Templates (price > 0)
1. System checks user's wallet balance
2. If insufficient balance → shows error
3. If sufficient balance:
   - Calls `deduct_wallet_balance()` RPC
   - Logs transaction in `wallet_transactions`
   - Creates website record
   - Logs purchase in `marketplace_purchases`
   - Redirects to storefront

### Wallet RPC Functions
```typescript
// Deduct from wallet (secure, with balance check)
const { error } = await supabase.rpc('deduct_wallet_balance', {
  p_user_id: userId,
  p_amount: price
});

// Add to wallet (for top-ups, earnings)
const { error } = await supabase.rpc('add_wallet_balance', {
  p_user_id: userId,
  p_amount: amount,
  p_description: 'Wallet top-up via Stripe'
});
```

## 🎨 Theme Configuration

Templates use `theme_config` JSONB column. Example structure:

```json
{
  "storeName": "My Awesome Store",
  "heroText": "Welcome to our store",
  "heroSubtext": "Discover amazing products",
  "aboutText": "We're dedicated to quality...",
  "colors": {
    "primary": "#2563eb",
    "secondary": "#f3f4f6",
    "text": "#374151",
    "footer": "#111827"
  },
  "fonts": {
    "body": "Inter, system-ui, sans-serif"
  }
}
```

## 🔐 Auth Flow

### Checkout Auth Gate
The `ProtectedRoute` component wraps the checkout page:
- Unauthenticated users → redirected to `/login?returnTo=/webmarketplace/:id/checkout`
- After login → automatically redirected back to checkout
- Auth state available via `useAuth()` hook

### Password Reset Flow
1. User clicks "Forgot Password" on login page
2. Enters email → Supabase sends reset link
3. User clicks link → redirected to `/update-password`
4. Updates password → redirected to `/login`

## 📊 Sample Data

Insert sample templates for testing:

```sql
INSERT INTO website_marketplace (
  seller_id, title, description, category, target_role,
  price, thumbnail_url, preview_url, theme_config,
  is_published, rating, total_sales
) VALUES
(
  'your-user-uuid-here',
  'Modern E-commerce Store',
  'Clean and modern template for online stores',
  'ecommerce',
  'seller',
  0,
  'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d',
  NULL,
  '{
    "storeName": "Modern Store",
    "heroText": "Welcome to Modern Store",
    "colors": {
      "primary": "#2563eb",
      "secondary": "#f3f4f6"
    }
  }'::jsonb,
  true,
  4.5,
  120
),
(
  'your-user-uuid-here',
  'Premium Portfolio',
  'Professional portfolio template with animations',
  'portfolio',
  'creator',
  29.99,
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
  NULL,
  '{
    "storeName": "Portfolio Pro",
    "heroText": "Showcase Your Work",
    "colors": {
      "primary": "#7c3aed",
      "secondary": "#f5f3ff"
    }
  }'::jsonb,
  true,
  4.8,
  85
);
```

## 🧪 Testing the Flow

### 1. Browse Templates
```
Visit: http://localhost:5173/webmarketplace
```

### 2. View Template Details
```
Click any template card
```

### 3. Checkout (Free Template)
```
Click "Claim Free Template & Deploy"
→ If not logged in → redirect to login
→ After login → complete checkout
→ Deploy website
→ Redirect to /{username}
```

### 4. Checkout (Paid Template)
```
Click "Pay $X.XX & Deploy"
→ Check wallet balance
→ If sufficient → deduct & deploy
→ If insufficient → show error
```

## 🔒 Security Features

### Row Level Security (RLS)
- ✅ Public can only view `is_published = true` templates
- ✅ Sellers can only manage their own templates
- ✅ Users can only view their own purchases
- ✅ Website owners can only manage their own pages

### Wallet Security
- ✅ RPC functions use `SECURITY DEFINER` (runs with function owner privileges)
- ✅ Row-level locking prevents race conditions (`FOR UPDATE`)
- ✅ Balance check before deduction
- ✅ All transactions logged in `wallet_transactions`

### Auth Security
- ✅ Protected routes with `ProtectedRoute` component
- ✅ Account type restrictions (if needed)
- ✅ Password validation (length, complexity)
- ✅ Password strength indicator

## 🎯 Next Steps / Enhancements

### Payment Gateway Integration
Replace wallet deduction with Stripe/Fawry:
1. Create Edge Function for payment intent
2. Add Stripe Elements to checkout
3. Handle webhooks for payment confirmation
4. Update purchase flow accordingly

### Advanced Features
- Template ratings & reviews system
- Template search & filtering
- Template categories page
- Website customization editor
- Custom domain support
- SEO metadata editor
- Analytics dashboard for template sellers

### Performance
- Add image optimization
- Implement lazy loading for previews
- Cache template data with React Query
- Add skeleton loaders

## 🐛 Troubleshooting

### "Wallet not found" Error
- Ensure `user_wallets` table exists
- Check if user has a wallet record (may need to create one on first access)

### "Template not published" Error
- Verify `is_published = true` in `website_marketplace`
- Check RLS policies allow public read access

### Route Not Matching
- Ensure marketplace routes are added BEFORE storefront routes
- Storefront routes (`/:username`) must be last to avoid catching other routes

### Checkout Not Loading
- Check user is authenticated (ProtectedRoute guards the page)
- Verify template exists and is published

## 📝 Dependencies

Already installed in your project:
- ✅ `@supabase/supabase-js`
- ✅ `react-router-dom` v7
- ✅ `lucide-react` (icons)
- ✅ `sonner` (toasts)
- ✅ `tailwindcss` (styling)

No additional dependencies required!

## 🤝 Support

For issues or questions:
1. Check RLS policies in Supabase
2. Verify migrations ran successfully
3. Check browser console for errors
4. Review Supabase logs in dashboard

---

**Built with ❤️ for the Aurora E-commerce Platform**
