# 🚀 AURORA CRITICAL FIXES - IMPLEMENTATION GUIDE

## Priority 1: Fix Customer Signup (CRITICAL) ⚠️

### Problem
Customer signup is failing with "Database error saving new user" due to RLS policies blocking trigger execution on `customers` or `user_wallets` tables.

### Solution
**File:** `FIX_ALL_SIGNUP_ISSUES.sql`

**Steps:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy entire content from `FIX_ALL_SIGNUP_ISSUES.sql`
3. Paste into New Query
4. Click Run
5. Verify success messages appear

**What it fixes:**
- ✅ Drops conflicting RLS policies
- ✅ Creates proper trigger-insert policies for all tables
- ✅ Recreates `handle_new_user()` function with SECURITY DEFINER
- ✅ Auto-creates wallets for all users
- ✅ Supports all account types: customer, seller, factory, delivery, middleman

**Test After Fix:**
```
Email: testcustomer@example.com
Password: Test@1234
Full Name: Test Customer
Account Type: Customer
```

---

## Priority 2: Complete Health Module Backend (HIGH) 🏥

### Problem
Health module has 7 TODO items for patient data, consent forms, audit logs, doctor verification, appointments, WebRTC, and pharmacy management.

### Solution
**File:** `HEALTH_MODULE_RPC_FUNCTIONS.sql` (already exists)

**Prerequisites:**
- First run `healthcare-schema.sql` to create tables

**Steps:**
1. Run `healthcare-schema.sql` in Supabase SQL Editor
2. Run `HEALTH_MODULE_RPC_FUNCTIONS.sql` 
3. Verify all 8 RPC functions are created

**Functions Implemented:**
- ✅ `verify_doctor()` - Admin doctor verification
- ✅ `schedule_appointment()` - Book medical appointments
- ✅ `submit_consent_form()` - Patient consent submission
- ✅ `export_patient_health_data()` - Data export (GDPR compliance)
- ✅ `get_health_audit_logs()` - Audit trail
- ✅ `get_verified_doctors()` - Doctor discovery
- ✅ `get_pharmacy_medicines()` - Medicine catalog
- ✅ `create_medicine_order()` - Pharmacy orders

**WebRTC Consultation:**
- Already implemented in `healthService.ts` (lines 572-630)
- Uses STUN servers for peer-to-peer video calls
- Integration point ready for frontend

---

## Priority 3: Payment Integration Fixes (HIGH) 💳

### Current Status
- ❌ Fawry only shows toast (no real integration)
- ❌ Stripe partially implemented (missing webhooks, refunds)
- ✅ COD working with verification

### Action Plan

#### 3.1 Stripe Webhook Implementation
**Create:** `supabase/functions/stripe-webhook/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

serve(async (req) => {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') || '';
  
  try {
    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
    );
    
    // Handle events
    switch (event.type) {
      case 'payment_intent.succeeded':
        // Update order status
        break;
      case 'charge.refunded':
        // Process refund
        break;
    }
    
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
});
```

#### 3.2 Refund System
**Update:** `src/lib/payments.ts`

Add refund functionality:
```typescript
export async function processRefund(orderId: string, amount?: number) {
  // Call Edge Function to process refund via Stripe
}
```

#### 3.3 Fawry Real Integration
Replace toast with actual API call to Fawry payment gateway.

---

## Priority 4: Add Basic Test Coverage (MEDIUM) 🧪

### Goal: Get from 0% to 60% coverage

#### 4.1 Setup Testing Infrastructure
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

**Create:** `vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

#### 4.2 Critical Tests to Write

**Test 1: Auth Hook**
```typescript
// src/hooks/__tests__/useAuth.test.tsx
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../useAuth';

describe('useAuth', () => {
  it('should sign up with valid credentials', async () => {
    const { result } = renderHook(() => useAuth());
    await act(async () => {
      const response = await result.current.signUp(
        'test@example.com',
        'Test@1234',
        'Test User'
      );
      expect(response.error).toBeNull();
    });
  });
});
```

**Test 2: Cart Functions**
```typescript
// src/lib/__tests__/checkout.test.ts
import { calculateTotal, applyDiscount } from '../checkout';

describe('checkout utilities', () => {
  it('calculates total correctly', () => {
    const items = [
      { price: 100, quantity: 2 },
      { price: 50, quantity: 1 }
    ];
    expect(calculateTotal(items)).toBe(250);
  });
});
```

**Test 3: Security Utils**
```typescript
// src/lib/__tests__/security.test.ts
import { validatePassword, detectSqlInjection } from '../security-utils';

describe('security utilities', () => {
  it('validates strong passwords', () => {
    expect(validatePassword('Test@1234').isValid).toBe(true);
    expect(validatePassword('weak').isValid).toBe(false);
  });
  
  it('detects SQL injection', () => {
    expect(detectSqlInjection("'; DROP TABLE users;--")).toBe(true);
  });
});
```

#### 4.3 Run Tests
```bash
npm run test
npm run test:coverage
```

---

## Priority 5: Admin Dashboard Enhancements (MEDIUM) 👨‍💼

### Missing Features

#### 5.1 Payment Management
**Create:** `src/pages/admin/Payments.tsx`
- View all transactions
- Process refunds
- Export financial reports

#### 5.2 KYC Workflow
**Create:** `src/pages/admin/KYCReview.tsx`
- Review seller/factory documents
- Approve/reject verification requests
- Track verification status

#### 5.3 Analytics Dashboard
**Update:** `src/pages/admin/Dashboard.tsx`
- Sales charts (revenue, orders, conversion)
- User growth metrics
- Top products/sellers
- Geographic distribution

---

## Priority 6: Performance Optimization (MEDIUM) ⚡

### Current: 1,427 KB → Target: <500 KB

#### 6.1 Code Splitting
```typescript
// Lazy load heavy components
const AdminDashboard = lazy(() => import('@/pages/admin/Dashboard'));
const HealthModule = lazy(() => import('@/pages/health/Dashboard'));
```

#### 6.2 Tree Shaking
- Replace `import { ... } from 'lucide-react'` with individual imports
- Use `import { Icon } from 'lucide-react'` only for used icons

#### 6.3 Image Optimization
- Convert PNG/JPG to WebP
- Implement responsive images with `srcset`
- Add lazy loading for below-fold images

#### 6.4 Bundle Analysis
```bash
npm install rollup-plugin-visualizer
```

Add to `vite.config.ts`:
```typescript
import { visualizer } from 'rollup-plugin-visualizer';

plugins: [
  react(),
  visualizer({ open: true })
]
```

---

## Priority 7: Security Hardening (HIGH) 🔒

### 7.1 Add 2FA
**Create:** `src/pages/auth/TwoFactorSetup.tsx`
- TOTP-based 2FA using speakeasy
- QR code generation
- Backup codes

### 7.2 Rate Limiting Edge Functions
Already implemented in `src/lib/security.ts`, move to Edge Functions for server-side enforcement.

### 7.3 CSRF Protection
Already in `src/lib/csrf.ts`, ensure all forms use tokens.

---

## Verification Checklist

After applying fixes:

- [ ] Customer signup works (test with new email)
- [ ] Seller signup creates proper profile
- [ ] Factory signup sets is_factory=true
- [ ] Delivery signup creates delivery_profile
- [ ] Wallet auto-created for all users
- [ ] Health module RPC functions work
- [ ] Can book appointment in health module
- [ ] Admin can verify doctors
- [ ] Stripe webhook receives events
- [ ] Tests pass (60%+ coverage)
- [ ] Bundle size <500 KB

---

## Next Steps After Critical Fixes

1. **Phase 2:** Complete payment integration, admin dashboard, service provider features
2. **Phase 3:** Return/refund system, 2FA, product variants
3. **Phase 4:** Performance optimization, accessibility (WCAG), SEO
4. **Phase 5:** Error monitoring (Sentry), analytics, advanced testing

---

## Support & Troubleshooting

### Signup Still Failing?
1. Check browser console for errors
2. Check Supabase logs (Dashboard → Logs)
3. Verify RLS policies: 
```sql
SELECT * FROM pg_policies WHERE tablename IN ('users', 'customers', 'user_wallets');
```

### Health Module Not Working?
1. Ensure `healthcare-schema.sql` ran first
2. Verify RPC functions exist:
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name LIKE '%health%';
```

### Need Help?
- Check README.md for detailed documentation
- Review existing SQL migrations for patterns
- Inspect browser console and Supabase logs

---

**Last Updated:** April 14, 2026
**Author:** Development Team
**Status:** Ready for Implementation
