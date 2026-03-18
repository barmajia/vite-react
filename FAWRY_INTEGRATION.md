# Fawry Payment Integration Guide

## Overview

Complete integration of **Fawry** payment gateway for the Egyptian market (EGP). This implementation follows security best practices with all sensitive operations handled server-side in Supabase Edge Functions.

## Features

✅ **Security**
- SHA256 signature generation server-side
- Secret key never exposed to client
- Webhook signature verification
- Order ownership verification

✅ **Idempotency**
- Prevents duplicate payments
- Unique constraint on pending payments
- Returns existing payment session if already created

✅ **Currency Enforcement**
- Hardcoded to EGP (Egyptian Pound)
- Cannot be manipulated client-side

✅ **Payment Methods**
- Online PayPage (redirect to Fawry)
- Reference Number (kiosk payment)

---

## Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────┐
│  React Frontend │────▶│  Supabase Edge Func  │────▶│  Fawry API  │
│                 │◀────│  (create-fawry-      │◀────│             │
│  - Checkout     │     │   payment)           │     │  - PayPage  │
│  - Order ID     │     │                      │     │  - Ref No   │
└─────────────────┘     └──────────────────────┘     └─────────────┘
                               │
                               ▼
                        ┌──────────────────────┐
                        │  Supabase Database   │
                        │                      │
                        │  - payment_intentions│
                        │  - orders            │
                        └──────────────────────┘
                               ▲
                               │
                        ┌──────────────────────┐
                        │  Fawry Webhook       │
                        │  (fawry-webhook)     │
                        └──────────────────────┘
```

---

## Setup Instructions

### Step 1: Run Database Migration

Open Supabase SQL Editor and run:

```sql
-- File: supabase/functions/create-fawry-payment/migration.sql

-- Add Fawry-specific columns
ALTER TABLE public.payment_intentions 
ADD COLUMN IF NOT EXISTS provider_reference_id TEXT,
ADD COLUMN IF NOT EXISTS checkout_url TEXT,
ADD COLUMN IF NOT EXISTS provider_metadata JSONB DEFAULT '{}';

-- Idempotency constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_intentions_order_pending 
ON public.payment_intentions (order_id) 
WHERE status = 'pending';

-- Webhook lookup index
CREATE INDEX IF NOT EXISTS idx_payment_intentions_provider_ref
ON public.payment_intentions (provider_reference_id);
```

### Step 2: Configure Supabase Secrets

Deploy Edge Functions and set secrets:

```bash
# Login to Supabase
npx supabase login

# Link to your project
npx supabase link --project-ref ofovfxsfazlwvcakpuer

# Set Fawry credentials (PRODUCTION)
npx supabase secrets set FAWRY_MERCHANT_CODE=YOUR_MERCHANT_CODE
npx supabase secrets set FAWRY_SECRET_KEY=YOUR_SECRET_KEY
npx supabase secrets set FAWRY_BASE_URL=https://atfawry.fawry.com/api

# For SANDBOX testing:
npx supabase secrets set FAWRY_BASE_URL=https://atfawry.fawry.com/api
```

### Step 3: Deploy Edge Functions

```bash
# Deploy Create Payment function
npx supabase functions deploy create-fawry-payment

# Deploy Webhook function
npx supabase functions deploy fawry-webhook
```

### Step 4: Configure Fawry Webhook URL

In Fawry Dashboard, set webhook URL:

```
https://ofovfxsfazlwvcakpuer.supabase.co/functions/v1/fawry-webhook
```

**Webhook Events to Subscribe:**
- Payment Success
- Payment Failed
- Payment Cancelled

---

## Usage

### In Checkout Component

```tsx
import { FawryPaymentButton } from '@/features/checkout/components/FawryPaymentButton';

// In your checkout page
<FawryPaymentButton
  orderId={order.id}
  total={order.total}
  onSuccess={() => {
    console.log('Payment initiated');
  }}
/>
```

### Payment Flow

1. **User clicks "Pay with Fawry"**
   - Frontend calls `create-fawry-payment` Edge Function
   - Passes `order_id` and user auth token

2. **Edge Function validates:**
   - User is authenticated
   - Order belongs to user
   - Order is pending
   - No existing pending payment (idempotency)

3. **Edge Function calls Fawry:**
   - Generates SHA256 signature
   - Forces currency to EGP
   - Creates PayPage charge

4. **User redirected to Fawry:**
   - Completes payment on Fawry's secure page
   - Or gets reference number for kiosk payment

5. **Fawry sends webhook:**
   - `fawry-webhook` receives notification
   - Verifies signature
   - Updates `payment_intentions` status
   - Updates `orders` to `confirmed`

---

## API Reference

### Edge Function: `create-fawry-payment`

**Request:**
```typescript
POST /functions/v1/create-fawry-payment
Headers: {
  Authorization: "Bearer <access_token>",
  Content-Type: "application/json"
}
Body: {
  order_id: "uuid"
}
```

**Response (Success):**
```json
{
  "success": true,
  "checkoutUrl": "https://atfawry.fawry.com/...",
  "referenceNumber": "REF123456",
  "amount": "100.00",
  "currency": "EGP",
  "message": "Payment session created successfully"
}
```

**Response (Already Exists):**
```json
{
  "success": true,
  "checkoutUrl": "https://atfawry.fawry.com/...",
  "referenceNumber": "REF123456",
  "existing": true,
  "message": "Payment session already created"
}
```

### Edge Function: `fawry-webhook`

**Request (from Fawry):**
```typescript
POST /functions/v1/fawry-webhook
Content-Type: application/json
Body: {
  merchantCode: "MERCHANT123",
  merchantRefNo: "ORD-uuid-123",
  referenceNumber: "REF123456",
  amount: "100.00",
  currency: "EGP",
  status: "SUCCESS",
  signature: "abc123..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "order_id": "uuid",
  "payment_status": "succeeded"
}
```

---

## Testing

### Sandbox Mode

1. Use Fawry sandbox credentials
2. Test cards provided by Fawry
3. Verify webhook with ngrok for local testing:

```bash
ngrok http 54321
# Update webhook URL in Fawry dashboard to ngrok URL
```

### Test Scenarios

| Scenario | Expected Result |
|----------|----------------|
| First payment | Creates new payment session |
| Duplicate payment | Returns existing session |
| Invalid order | Returns 404 error |
| Unauthorized user | Returns 401 error |
| Webhook with invalid signature | Rejects webhook |
| Successful payment webhook | Updates order to confirmed |

---

## Troubleshooting

### Issue: "Fawry credentials not configured"

**Solution:**
```bash
npx supabase secrets set FAWRY_MERCHANT_CODE=your_code
npx supabase secrets set FAWRY_SECRET_KEY=your_secret
# Redeploy function
npx supabase functions deploy create-fawry-payment
```

### Issue: "Invalid webhook signature"

**Solution:**
- Verify signature format matches Fawry documentation
- Check secret key is correct
- Ensure no whitespace in secret

### Issue: "Payment already processed"

**Solution:**
- This is expected behavior (idempotency)
- Check existing payment intention status
- Webhook already processed, no action needed

### Issue: "Order not found or unauthorized"

**Solution:**
- Verify order exists
- Check user is authenticated
- Ensure order belongs to user

---

## Security Checklist

- [x] Secret key stored in Supabase Secrets (not in code)
- [x] Signature generated server-side only
- [x] User authentication verified in Edge Function
- [x] Order ownership verified
- [x] Webhook signature verified
- [x] Currency hardcoded to EGP
- [x] Idempotency checks at logic and DB level
- [x] HTTPS enforced for all endpoints

---

## Database Schema

### payment_intentions Table

```sql
CREATE TABLE payment_intentions (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  user_id UUID REFERENCES auth.users(id),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EGP',
  status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50),
  provider VARCHAR(50),
  provider_reference_id TEXT, -- Fawry Reference
  checkout_url TEXT,          -- Fawry PayPage URL
  provider_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Files Created

| File | Purpose |
|------|---------|
| `supabase/functions/create-fawry-payment/index.ts` | Create payment Edge Function |
| `supabase/functions/fawry-webhook/index.ts` | Webhook handler Edge Function |
| `src/features/checkout/components/FawryPaymentButton.tsx` | React component |
| `supabase/functions/create-fawry-payment/migration.sql` | Database migration |
| `FAWRY_INTEGRATION.md` | This documentation |

---

## Next Steps

1. ✅ Run database migration
2. ✅ Set Supabase secrets
3. ✅ Deploy Edge Functions
4. ✅ Add FawryPaymentButton to checkout
5. ⏳ Configure Fawry webhook URL
6. ⏳ Test in sandbox mode
7. ⏳ Go live with production credentials

---

**Created:** March 18, 2026
**Status:** ✅ Ready for Deployment
**Developer:** Youssef
