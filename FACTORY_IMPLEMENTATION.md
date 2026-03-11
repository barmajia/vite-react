# 🏭 Aurora Factory Features - Complete Implementation Guide

**Version:** 1.0.0  
**Status:** ✅ Complete & Ready for Deployment  
**Date:** March 10, 2026  
**Developer:** Youssef

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Features Implemented](#features-implemented)
3. [Database Migration](#database-migration)
4. [Project Structure](#project-structure)
5. [Component Reference](#component-reference)
6. [Hooks Reference](#hooks-reference)
7. [API Reference](#api-reference)
8. [Usage Examples](#usage-examples)
9. [Security & RLS Policies](#security--rls-policies)
10. [Testing Guide](#testing-guide)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

The **Factory Features** module transforms Aurora E-commerce into a comprehensive B2B2C platform, enabling factories to:

- 📊 **Monitor Performance** - Real-time analytics dashboard with KPIs
- 📦 **Track Production** - Visual pipeline for order production stages
- 💬 **Manage Quotes** - Handle buyer quote requests
- 🤝 **Build Partnerships** - Connect with sellers for distribution

---

## ✨ Features Implemented

### 1. Factory Dashboard Analytics

**Purpose:** Real-time overview of factory performance

**Features:**
- Revenue tracking with growth percentage
- Order statistics (total, completed, pending)
- Customer ratings and reviews
- Product inventory status
- Interactive charts (revenue & orders over time)
- Quick insights (completion rate, stock rate, satisfaction)

**Files:**
- `src/features/factory/hooks/useFactoryAnalytics.ts`
- `src/features/factory/components/FactoryDashboard.tsx`
- `src/features/factory/components/StatCard.tsx`
- `src/features/factory/components/SalesChart.tsx`

---

### 2. Production Order Tracking

**Purpose:** Track orders through production stages

**Production Stages:**
1. **Pending** - Order received, not yet in production
2. **In Production** - Manufacturing in progress
3. **Quality Check** - Undergoing quality inspection
4. **Ready to Ship** - Approved, prepared for shipping
5. **Shipped** - In transit to customer
6. **Delivered** - Successfully delivered
7. **Cancelled** - Order cancelled

**Features:**
- Visual pipeline progress indicator
- Status update workflow with notes
- Production timeline tracking
- Order filtering by status
- Production logs history

**Files:**
- `src/features/factory/hooks/useProductionOrders.ts`
- `src/features/factory/components/ProductionPipeline.tsx`
- `src/features/factory/components/ProductionPipelineList.tsx`
- `src/pages/factory/FactoryProductionPage.tsx`

**Database Functions:**
- `get_production_orders(seller_id, status)` - Fetch orders
- `update_production_status(order_id, status, notes)` - Update status

---

### 3. Quote Request System

**Purpose:** Enable buyers to request custom quotes from factories

**Quote Statuses:**
- **Pending** - Awaiting factory response
- **Quoted** - Price provided, waiting buyer decision
- **Accepted** - Buyer accepted the quote
- **Rejected** - Quote declined
- **Expired** - Quote past expiry date

**Features:**
- Quote request inbox
- Price quotation form
- Expiry date setting
- Accept/Reject actions
- Quote history tracking
- Auto-expiry with pg_cron

**Files:**
- `src/features/factory/hooks/useQuoteRequests.ts`
- `src/features/factory/components/QuoteRequestsList.tsx`
- `src/pages/factory/FactoryQuotesPage.tsx`

**Database Functions:**
- `cleanup_expired_quotes()` - Auto-expire old quotes (hourly cron job)

---

### 4. Factory Connections

**Purpose:** Manage partnerships between factories and sellers

**Connection Statuses:**
- **Pending** - Request sent, awaiting acceptance
- **Accepted** - Partnership active
- **Rejected** - Request declined
- **Blocked** - Partnership blocked

**Features:**
- Connection request inbox
- Accept/Reject workflow
- View connected sellers
- Partnership management

**Files:**
- `src/features/factory/hooks/useFactoryConnections.ts`
- `src/features/factory/components/ConnectionRequestsList.tsx`
- `src/pages/factory/FactoryConnectionsPage.tsx`

---

## 🗄️ Database Migration

### Step 1: Run the Migration

**File:** `factory-features-migration.sql`

Open **Supabase SQL Editor** and run:

```sql
-- Copy entire contents of factory-features-migration.sql
```

### Step 2: Verify Migration

After running, verify tables exist:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'factory_production_logs',
    'quote_requests',
    'factory_analytics_snapshots',
    'factory_certifications'
  );
```

### Step 3: Verify Functions

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_seller_kpis',
    'get_production_orders',
    'update_production_status',
    'cleanup_expired_quotes'
  );
```

### Step 4: Verify RLS Policies

```sql
SELECT tablename, policyname
FROM pg_policies
WHERE tablename IN (
  'factory_production_logs',
  'quote_requests',
  'factory_analytics_snapshots',
  'factory_certifications'
);
```

---

## 📁 Project Structure

```
src/
├── features/
│   └── factory/
│       ├── types/
│       │   └── factory.ts              # TypeScript types
│       ├── hooks/
│       │   ├── useFactoryAnalytics.ts  # Dashboard analytics
│       │   ├── useProductionOrders.ts  # Production tracking
│       │   ├── useQuoteRequests.ts     # Quote management
│       │   └── useFactoryConnections.ts # Connections
│       ├── components/
│       │   ├── StatCard.tsx            # KPI display cards
│       │   ├── SalesChart.tsx          # Revenue chart
│       │   ├── FactoryDashboard.tsx    # Main dashboard
│       │   ├── ProductionPipeline.tsx  # Status progress bar
│       │   ├── ProductionPipelineList.tsx # Orders list
│       │   ├── QuoteRequestsList.tsx   # Quote inbox
│       │   └── ConnectionRequestsList.tsx # Connections
│       └── index.ts                    # Feature exports
│
├── pages/
│   └── factory/
│       ├── FactoryDashboardPage.tsx    # /factory route
│       ├── FactoryProductionPage.tsx   # /factory/production
│       ├── FactoryQuotesPage.tsx       # /factory/quotes
│       └── FactoryConnectionsPage.tsx  # /factory/connections
│
└── App.tsx                             # Routes added
```

---

## 🧩 Component Reference

### FactoryDashboard

Main analytics dashboard component.

```tsx
import { FactoryDashboard } from '@/features/factory';

<FactoryDashboard />
```

**Props:** None (fetches data automatically)

---

### ProductionPipeline

Visual progress indicator for production status.

```tsx
import { ProductionPipeline } from '@/features/factory';

<ProductionPipeline
  status="in_production"
  onChangeStatus={(newStatus) => console.log(newStatus)}
  readOnly={false}
/>
```

**Props:**
- `status: ProductionStatus` - Current production stage
- `onChangeStatus?: (status) => void` - Callback for status change
- `readOnly?: boolean` - Disable interactions

---

### ProductionPipelineList

Complete list of production orders with pipeline visualization.

```tsx
import { ProductionPipelineList } from '@/features/factory';

<ProductionPipelineList />
```

---

### QuoteRequestsList

Inbox of quote requests from buyers.

```tsx
import { QuoteRequestsList } from '@/features/factory';

<QuoteRequestsList />
```

---

### ConnectionRequestsList

Pending connection requests from sellers.

```tsx
import { ConnectionRequestsList } from '@/features/factory';

<ConnectionRequestsList />
```

---

## ⚓ Hooks Reference

### useFactoryAnalytics

Fetch factory KPIs.

```tsx
import { useFactoryAnalytics } from '@/features/factory';

const { analytics, isLoading, error, refetch } = useFactoryAnalytics(30);

// analytics = {
//   totalRevenue: number,
//   totalOrders: number,
//   completedOrders: number,
//   pendingOrders: number,
//   averageRating: number,
//   totalReviews: number,
//   totalProducts: number,
//   activeProducts: number,
//   revenueGrowth: number,
//   orderGrowth: number,
// }
```

**Parameters:**
- `periodDays: number` (default: 30) - Analytics period

---

### useProductionOrders

Fetch production orders.

```tsx
import { useProductionOrders } from '@/features/factory';

const { orders, isLoading, error, refetch } = useProductionOrders('in_production');

// orders = [{
//   order_id, customer_name, product_title,
//   quantity, current_status,
//   production_started_at, production_completed_at, created_at
// }]
```

**Parameters:**
- `status?: ProductionStatus` - Filter by status

---

### useUpdateProductionStatus

Update order production status.

```tsx
import { useUpdateProductionStatus } from '@/features/factory';

const updateStatus = useUpdateProductionStatus();

updateStatus.mutate({
  orderId: 'uuid',
  status: 'quality_check',
  notes: 'Passed inspection',
});
```

---

### useQuoteRequests

Fetch quote requests.

```tsx
import { useQuoteRequests } from '@/features/factory';

const { quotes, isLoading, error, refetch } = useQuoteRequests('received');

// quotes = [{
//   id, factory_id, buyer_id, product_id,
//   quantity, target_price, notes, status,
//   quoted_price, quoted_at, expires_at,
//   product, buyer
// }]
```

**Parameters:**
- `view: 'received' | 'sent'` - Quote perspective

---

### useFactoryConnections

Fetch factory connections.

```tsx
import { useFactoryConnections } from '@/features/factory';

const { connections, isLoading, error, refetch } = useFactoryConnections('pending');

// connections = [{
//   id, factory_id, seller_id, status, created_at, seller
// }]
```

**Parameters:**
- `status?: 'pending' | 'accepted' | 'rejected'` - Filter

---

## 🔗 API Reference

### RPC Functions

#### get_seller_kpis

Get comprehensive seller analytics.

```typescript
const { data } = await supabase.rpc('get_seller_kpis', {
  p_seller_id: userId,
  p_period_days: 30,
});
```

**Returns:**
- `total_revenue` - Revenue in period
- `total_orders` - Order count
- `completed_orders` - Delivered orders
- `pending_orders` - Active orders
- `average_rating` - Avg review score
- `total_reviews` - Review count
- `total_products` - All products
- `active_products` - In-stock products
- `revenue_growth` - % change
- `order_growth` - % change

---

#### get_production_orders

Get production orders for seller.

```typescript
const { data } = await supabase.rpc('get_production_orders', {
  p_seller_id: userId,
  p_status: 'in_production', // optional
});
```

---

#### update_production_status

Update order production status.

```typescript
const { data } = await supabase.rpc('update_production_status', {
  p_order_id: orderId,
  p_status: 'quality_check',
  p_notes: 'Passed QC inspection', // optional
});
```

**Returns:** `boolean` success

---

#### cleanup_expired_quotes

Auto-expire old quotes (called by pg_cron hourly).

```typescript
await supabase.rpc('cleanup_expired_quotes');
```

---

## 📖 Usage Examples

### Example 1: Factory Dashboard Page

```tsx
import { FactoryDashboard } from '@/features/factory';

export const FactoryDashboardPage = () => {
  return (
    <div>
      <h1>Factory Dashboard</h1>
      <FactoryDashboard />
    </div>
  );
};
```

---

### Example 2: Custom Production Tracker

```tsx
import { useProductionOrders, useUpdateProductionStatus } from '@/features/factory';

export const ProductionTracker = () => {
  const { orders } = useProductionOrders();
  const updateStatus = useUpdateProductionStatus();

  return (
    <div>
      {orders.map((order) => (
        <div key={order.order_id}>
          <h3>{order.product_title}</h3>
          <p>Status: {order.current_status}</p>
          <button
            onClick={() => updateStatus.mutate({
              orderId: order.order_id,
              status: 'quality_check',
            })}
          >
            Mark as Quality Check
          </button>
        </div>
      ))}
    </div>
  );
};
```

---

### Example 3: Quote Response

```tsx
import { useQuoteRequests, useUpdateQuoteRequest } from '@/features/factory';

export const QuoteManager = () => {
  const { quotes } = useQuoteRequests();
  const updateQuote = useUpdateQuoteRequest();

  const handleSendQuote = (quoteId: string, price: number) => {
    updateQuote.mutate({
      quoteId,
      updates: {
        status: 'quoted',
        quoted_price: price,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
  };

  return (
    <div>
      {quotes.map((quote) => (
        <div key={quote.id}>
          <p>Buyer: {quote.buyer?.full_name}</p>
          <p>Quantity: {quote.quantity}</p>
          <button onClick={() => handleSendQuote(quote.id, 100)}>
            Send Quote $100
          </button>
        </div>
      ))}
    </div>
  );
};
```

---

## 🔐 Security & RLS Policies

### Row Level Security

All factory tables have RLS enabled:

```sql
-- Production Logs
factories_view_own_production_logs
factories_insert_own_production_logs

-- Quote Requests
factories_view_own_quotes
buyers_view_own_quotes
buyers_create_quotes
factories_update_quotes

-- Analytics Snapshots
factories_view_own_analytics
system_insert_analytics

-- Certifications
factories_view_own_certifications
factories_manage_own_certifications
admins_verify_certifications
```

### Data Isolation

- ✅ Factories can only view their own data
- ✅ Buyers can only view their own quotes
- ✅ Production updates require seller ownership
- ✅ Admin-only certification verification

---

## 🧪 Testing Guide

### Manual Testing Checklist

#### Factory Dashboard
- [ ] Navigate to `/factory`
- [ ] Verify KPI cards display correct data
- [ ] Check revenue chart renders
- [ ] Verify growth percentages calculate
- [ ] Test period selector (if implemented)

#### Production Orders
- [ ] Navigate to `/factory/production`
- [ ] View all orders tab
- [ ] Filter by status tabs
- [ ] Click to update status
- [ ] Add notes to status change
- [ ] Verify pipeline visualization
- [ ] Check production logs

#### Quote Requests
- [ ] Navigate to `/factory/quotes`
- [ ] View received quotes
- [ ] Send quote with price
- [ ] Set expiry date
- [ ] Accept/reject quote
- [ ] Verify status badges

#### Connections
- [ ] Navigate to `/factory/connections`
- [ ] View pending requests
- [ ] Accept connection
- [ ] Reject connection
- [ ] View accepted connections

---

## 🚀 Deployment

### Pre-Deployment Checklist

- [ ] Run `factory-features-migration.sql` in Supabase
- [ ] Verify all tables created
- [ ] Verify all functions created
- [ ] Verify RLS policies active
- [ ] Test locally with `npm run dev`
- [ ] Build with `npm run build`
- [ ] Deploy to Vercel

### Environment Variables

No new environment variables required. Uses existing:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Build Command

```bash
npm run build
```

### Deploy Command

```bash
git add .
git commit -m "feat: add factory features (analytics, production, quotes, connections)"
git push
```

Vercel will auto-deploy.

---

## 🐛 Troubleshooting

### Issue: "function get_seller_kpis does not exist"

**Solution:** Re-run the migration SQL in Supabase SQL Editor.

---

### Issue: "permission denied for table factory_production_logs"

**Solution:** Verify RLS policies are created:

```sql
SELECT * FROM pg_policies
WHERE tablename = 'factory_production_logs';
```

If missing, re-run migration.

---

### Issue: Analytics show 0 for all values

**Solution:** 
1. Ensure user has `seller` role in `sellers` table
2. Verify orders exist with matching `seller_id`
3. Check `get_seller_kpis` function permissions

---

### Issue: Production status update fails

**Solution:**
1. Verify user is the seller for the order
2. Check order exists: `SELECT * FROM orders WHERE id = 'order_id'`
3. Ensure RLS allows update: `update_production_status` function checks ownership

---

### Issue: Quotes not expiring automatically

**Solution:** Verify pg_cron is enabled and scheduled job exists:

```sql
SELECT * FROM cron.job;
```

If missing, re-run migration or manually schedule:

```sql
SELECT cron.schedule(
  'cleanup-expired-quotes',
  '0 * * * *',
  'SELECT cleanup_expired_quotes()'
);
```

---

## 📊 Database Schema Summary

### New Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `factory_production_logs` | Track status changes | `order_id`, `status`, `notes`, `created_by` |
| `quote_requests` | B2B quotes | `factory_id`, `buyer_id`, `quantity`, `status` |
| `factory_analytics_snapshots` | Cached KPIs | `seller_id`, `snapshot_date`, metrics |
| `factory_certifications` | Factory certs | `factory_id`, `certification_name`, `is_verified` |

### New Types

| Type | Values |
|------|--------|
| `factory_order_status` | `pending`, `in_production`, `quality_check`, `ready_to_ship`, `shipped`, `delivered`, `cancelled` |
| `quote_status` | `pending`, `quoted`, `accepted`, `rejected`, `expired` |

### New Functions

| Function | Purpose |
|----------|---------|
| `get_seller_kpis` | Comprehensive analytics |
| `get_production_orders` | Filter orders by status |
| `update_production_status` | Update with logging |
| `cleanup_expired_quotes` | Auto-expire quotes |

---

## 🎯 Next Steps (Future Enhancements)

### Phase 2 (Recommended)
1. **Factory Certifications Upload** - Upload & verify certificates
2. **Tiered Pricing UI** - Quantity-based pricing
3. **Bulk Order Management** - Handle large orders
4. **Production Capacity Planning** - Resource allocation

### Phase 3 (Advanced)
1. **Real-time Production Updates** - Live status via Supabase Realtime
2. **Multi-factory Support** - Distribute across factories
3. **Raw Material Tracking** - Inventory management
4. **Quality Control Checklists** - Standardized QC

---

## 📞 Support

**Documentation:** This file + inline code comments  
**Issues:** Check browser console + Supabase logs  
**Contact:** support@aurora.com

---

**Built with ❤️ for Aurora E-commerce Platform**

**Last Updated:** March 10, 2026  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
