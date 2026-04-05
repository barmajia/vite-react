# Marketplace Quick Start Guide

## 🚀 Setup Steps

### 1. Run Database Migrations
Open your Supabase SQL Editor and run these files in order:

```bash
# File 1: Creates marketplace tables
migrations/website_marketplace.sql

# File 2: Creates wallet RPC functions  
migrations/wallet_rpc_functions.sql
```

### 2. Insert Sample Data
Run this SQL to add test templates:

```sql
-- Add sample marketplace templates
INSERT INTO website_marketplace (
  seller_id, title, description, category, target_role,
  price, thumbnail_url, preview_url, theme_config,
  is_published, rating, total_sales
) 
SELECT 
  auth.uid(), -- Replace with your user ID if needed
  'Modern E-commerce Store',
  'Clean and modern template perfect for online stores. Features product grids, cart integration ready, and mobile-first design.',
  'ecommerce',
  'seller',
  0, -- Free template
  'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?w=800&h=600&fit=crop',
  NULL,
  '{
    "storeName": "Modern Store",
    "heroText": "Welcome to Our Modern Store",
    "heroSubtext": "Discover amazing products with fast shipping",
    "aboutText": "We are dedicated to providing the best shopping experience.",
    "colors": {
      "primary": "#2563eb",
      "secondary": "#f3f4f6",
      "text": "#374151",
      "footer": "#111827"
    },
    "fonts": {
      "body": "Inter, system-ui, sans-serif"
    }
  }'::jsonb,
  true,
  4.5,
  120
WHERE NOT EXISTS (SELECT 1 FROM website_marketplace LIMIT 1);

-- Add a paid template
INSERT INTO website_marketplace (
  seller_id, title, description, category, target_role,
  price, thumbnail_url, preview_url, theme_config,
  is_published, rating, total_sales
)
SELECT
  auth.uid(),
  'Premium Portfolio Template',
  'Professional portfolio template with smooth animations, gallery sections, and contact forms. Perfect for creatives.',
  'portfolio',
  'creator',
  29.99, -- Paid template
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop',
  NULL,
  '{
    "storeName": "Portfolio Pro",
    "heroText": "Showcase Your Creative Work",
    "heroSubtext": "Beautiful portfolio template for designers and artists",
    "aboutText": "Professional portfolio to display your projects.",
    "colors": {
      "primary": "#7c3aed",
      "secondary": "#f5f3ff",
      "text": "#1f2937",
      "footer": "#0f172a"
    },
    "fonts": {
      "body": "Poppins, system-ui, sans-serif"
    }
  }'::jsonb,
  true,
  4.8,
  85
WHERE NOT EXISTS (SELECT 1 FROM website_marketplace WHERE title = 'Premium Portfolio Template');
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Test the Marketplace

#### Browse Templates
Visit: `http://localhost:5173/webmarketplace`

#### View Details
Click any template card to see details

#### Test Checkout
1. Click "Claim Free Template & Deploy" (for free templates)
2. If not logged in → will redirect to login
3. After login → complete checkout
4. Website gets deployed to `/{your-username}`

#### Test Paid Purchase
1. Ensure your wallet has sufficient balance
2. Click a paid template
3. Click "Pay $29.99 & Deploy"
4. System will deduct from wallet and deploy

## 🧪 Testing Checklist

- [ ] Can browse templates at `/webmarketplace`
- [ ] Can view template details
- [ ] Free template checkout works
- [ ] Auth gate redirects to login properly
- [ ] After login, redirects back to checkout
- [ ] Website gets created in `websites` table
- [ ] Purchase gets logged in `marketplace_purchases` table
- [ ] Redirects to `/{username}` after deployment
- [ ] Storefront renders with correct theme colors
- [ ] Password reset flow works

## 🐛 Common Issues

### "Relation website_marketplace does not exist"
→ Run the migration SQL file in Supabase

### "Insufficient wallet balance"
→ Add balance to your wallet:
```sql
UPDATE user_wallets 
SET available_balance = 100.00
WHERE user_id = 'your-user-id';
```

### Templates not showing
→ Check `is_published = true` in database
→ Verify RLS policies allow SELECT

### Route not found
→ Ensure routes are added in `src/routes/index.tsx`
→ Restart dev server

## 📝 Next Steps

1. Customize templates in database
2. Add more templates
3. Upload real preview images
4. Integrate payment gateway (Stripe/Fawry)
5. Add template reviews system

---

Need help? Check `MARKETPLACE_IMPLEMENTATION.md` for full documentation
