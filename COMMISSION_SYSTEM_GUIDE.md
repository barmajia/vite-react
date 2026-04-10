# Commission Rate System Implementation Guide

## Overview
Complete commission management system for sellers with flexible rate configuration and earnings tracking.

## Files Created

### 1. Database Migration
**File:** `add-commission-rate-system.sql`

**What it adds:**
- `default_commission_rate` column to `users` table
- `commission_rate` column to `shops` and `products` tables  
- `commission_rates` table for advanced rate rules
- `commission_earnings` table for tracking earnings
- Enhanced `deals` table with commission fields
- `seller_commission_summary` view for stats
- `calculate_commission()` function for automatic calculation
- Row Level Security policies

### 2. Seller Commission Settings Page
**File:** `src/pages/seller/SellerCommissionSettings.tsx`

**Features:**
- Default commission rate setting
- Custom rate rules (percentage or fixed amount)
- Rules by category, product, or customer
- Min/max order value constraints
- Date ranges for promotional rates
- Priority-based rule matching
- Earnings history tracking
- Real-time statistics dashboard

## Setup Instructions

### Step 1: Run Database Migration
1. Open Supabase SQL Editor
2. Copy entire contents of `add-commission-rate-system.sql`
3. Paste and execute
4. Verify tables created successfully

### Step 2: Add Route to App.tsx
Add this route in your seller routes section:
```tsx
<Route path="commission" element={<SellerCommissionSettings />} />
```

Full path: `/seller/commission`

### Step 3: Add Navigation Link
In your seller dashboard or settings navigation, add:
```tsx
<Link to="/seller/commission">Commission Settings</Link>
```

## How It Works

### Commission Rate Hierarchy
1. **Product-specific rates** (highest priority)
2. **Category-specific rates**
3. **Customer-specific rates**
4. **Default rate** (fallback)

### Rate Types
- **Percentage**: X% of order value (e.g., 10%)
- **Fixed**: Flat amount per order (e.g., $5.00)

### Automatic Calculation
The `calculate_commission()` function automatically:
- Finds applicable rate based on priority
- Considers min/max order values
- Respects date ranges
- Returns calculated commission amount

## Usage Examples

### Example 1: Set Default 15% Commission
1. Go to Commission Settings
2. Enter "15" in Default Rate field
3. Click "Save Default Rate"

### Example 2: Premium Product 20% Commission
1. Click "Add Rule"
2. Rate Type: Percentage
3. Rate Value: 20
4. Applies To: Specific Product
5. Target ID: [product-uuid]
6. Priority: 10 (higher than default)
7. Description: "Premium products commission"
8. Click "Create"

### Example 3: Holiday Promotion Fixed $5
1. Click "Add Rule"
2. Rate Type: Fixed Amount
3. Rate Value: 5
4. Applies To: All Orders
5. Start Date: 2024-12-01
6. End Date: 2024-12-31
7. Priority: 5
8. Description: "Holiday promotion"
9. Click "Create"

## Database Schema

### commission_rates Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| seller_id | UUID | Reference to users |
| rate_type | VARCHAR | 'percentage' or 'fixed' |
| rate_value | DECIMAL | The rate value |
| applies_to | VARCHAR | 'all', 'category', 'product', 'customer' |
| target_id | UUID | ID of category/product/customer |
| min_order_value | DECIMAL | Minimum order requirement |
| max_order_value | DECIMAL | Maximum order limit |
| start_date | TIMESTAMP | When rate becomes active |
| end_date | TIMESTAMP | When rate expires |
| is_active | BOOLEAN | Enable/disable rule |
| priority | INTEGER | Higher = more important |
| description | TEXT | Rule description |

### commission_earnings Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| seller_id | UUID | Reference to seller |
| order_id | UUID | Related order |
| deal_id | UUID | Related deal |
| base_amount | DECIMAL | Order/deal amount |
| commission_rate | DECIMAL | Applied rate |
| commission_amount | DECIMAL | Earned commission |
| status | VARCHAR | pending/confirmed/paid/disputed |
| payment_date | TIMESTAMP | When paid |

## Testing Checklist

- [ ] Run SQL migration successfully
- [ ] Navigate to `/seller/commission`
- [ ] Set default commission rate
- [ ] Create custom rate rule
- [ ] Edit existing rate rule
- [ ] Delete rate rule
- [ ] View earnings history
- [ ] Verify stats dashboard updates
- [ ] Test priority-based rate selection
- [ ] Test date range restrictions
- [ ] Test min/max order value limits

## Next Steps

1. **Integrate with Checkout**: Call `calculate_commission()` during order processing
2. **Automate Earnings**: Create trigger to insert into `commission_earnings` on order completion
3. **Payment Processing**: Build payout system for commission withdrawals
4. **Reporting**: Add export functionality for earnings reports
5. **Notifications**: Alert sellers when commissions are paid

## Support

For issues or questions:
1. Check browser console for errors
2. Verify database tables exist
3. Confirm RLS policies are active
4. Test with different user roles
