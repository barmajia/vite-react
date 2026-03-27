# 💳 Stripe Integration Guide

**Status:** ✅ Complete (Frontend)  
**Date:** March 27, 2026  
**Version:** 1.0.0

---

## 📋 Overview

This guide covers the complete Stripe payment integration for the Aurora E-commerce Platform, enabling secure credit/debit card payments.

### What's Included

- ✅ Stripe Elements integration
- ✅ Secure payment form
- ✅ Edge Function for payment intent creation
- ✅ Fawry integration (Egypt)
- ✅ Cash on Delivery (COD)
- ✅ Security best practices

---

## 🏗️ Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Checkout  │─────>│   Stripe     │─────>│   Stripe    │
│   Component │      │  Provider    │      │   Elements  │
└─────────────┘      └──────────────┘      └─────────────┘
                            │
                            v
                     ┌──────────────┐
                     │ Edge Function│
                     │ (Supabase)   │
                     └──────────────┘
                            │
                            v
                     ┌──────────────┐
                     │  Stripe API  │
                     └──────────────┘
```

---

## 📦 Installation

### 1. Install Dependencies

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### 2. Configure Environment Variables

Add to your `.env` file:

```env
# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

⚠️ **SECURITY WARNING:** NEVER add `STRIPE_SECRET_KEY` to `.env`! 

Server-side operations use the Edge Function with secrets stored in Supabase.

---

## 🚀 Setup Steps

### Step 1: Get Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Copy your **Publishable Key**
3. Add to `.env`:
   ```env
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51Q...
   ```

### Step 2: Configure Supabase Edge Function

Deploy the payment intent function:

```bash
# Navigate to supabase directory
cd supabase

# Deploy the function
supabase functions deploy create-payment-intent \
  --env-file .env.local
```

Set environment variables for the Edge Function:

```bash
# Stripe Secret Key (server-side only)
supabase secrets set STRIPE_SECRET_KEY=sk_test_...

# Stripe Webhook Secret (for handling events)
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

### Step 3: Test Integration

```bash
# Start development server
npm run dev

# Navigate to checkout page
http://localhost:5173/checkout
```

---

## 📁 File Structure

```
src/
├── lib/
│   ├── stripe.ts              # Stripe initialization
│   └── payments.ts            # Payment service functions
│
└── features/checkout/
    └── components/
        ├── StripeCheckout.tsx           # Main checkout component
        ├── StripeCheckoutForm.tsx       # Payment form
        └── StripeProvider.tsx           # Elements provider
```

---

## 💻 Usage Examples

### Basic Usage

```tsx
import { StripeCheckout } from '@/features/checkout/components/StripeCheckout';

function CheckoutPage() {
  return (
    <StripeCheckout
      amount={99.99}
      orderId="order_123"
      customerEmail="customer@example.com"
      onSuccess={() => console.log('Payment successful!')}
      onCancel={() => console.log('Payment cancelled')}
    />
  );
}
```

### With StripeProvider

```tsx
import { StripeProvider } from '@/features/checkout/components/StripeProvider';
import { StripeCheckoutForm } from '@/features/checkout/components/StripeCheckoutForm';

function PaymentPage() {
  return (
    <StripeProvider
      orderId="order_123"
      amount={99.99}
    >
      <StripeCheckoutForm
        amount={99.99}
        orderId="order_123"
        onSuccess={() => {
          // Handle success
        }}
      />
    </StripeProvider>
  );
}
```

### Manual Payment Intent Creation

```tsx
import { createPaymentIntent } from '@/lib/payments';

async function handlePayment() {
  try {
    const response = await createPaymentIntent({
      order_id: 'order_123',
      payment_method: 'stripe',
      save_card: true,
    });

    console.log('Payment Intent:', response);
    // Use response.client_secret with Stripe Elements
  } catch (error) {
    console.error('Payment failed:', error);
  }
}
```

---

## 🔧 Components

### StripeCheckout

Main checkout component with payment method selection.

**Props:**
```typescript
interface StripeCheckoutProps {
  amount: number;
  orderId?: string;
  customerEmail?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}
```

**Example:**
```tsx
<StripeCheckout
  amount={99.99}
  orderId="order_123"
  onSuccess={() => navigate('/order-success')}
/>
```

---

### StripeProvider

Wraps components with Stripe Elements context.

**Props:**
```typescript
interface StripeProviderProps {
  children: React.ReactNode;
  orderId: string;
  amount?: number;
}
```

**Example:**
```tsx
<StripeProvider orderId="order_123">
  <StripeCheckoutForm amount={99.99} />
</StripeProvider>
```

---

### StripeCheckoutForm

Secure payment form with Stripe Elements.

**Props:**
```typescript
interface StripeCheckoutFormProps {
  amount: number;
  orderId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}
```

**Features:**
- ✅ Card number validation
- ✅ Expiry date validation
- ✅ CVC verification
- ✅ 3D Secure support
- ✅ Auto-formatted inputs

---

## 🔒 Security Features

### 1. Server-Side Validation

The Edge Function validates:
- ✅ Order ownership
- ✅ Order status (not cancelled/paid)
- ✅ Order total (prevents client manipulation)
- ✅ User authentication

### 2. Idempotency

Prevents duplicate payments:
```typescript
// Checks for existing pending payment intent
const existingIntent = await supabase
  .from("payment_intentions")
  .select("*")
  .eq("order_id", order_id)
  .eq("status", "pending")
  .single();
```

### 3. Audit Logging

All payment operations are logged:
```typescript
await supabase.from("audit_logs").insert({
  event: "PAYMENT_INITIATED",
  severity: "low",
  description: "Stripe payment intent created",
  metadata: { order_id, amount },
  user_id: user.id,
});
```

### 4. RLS Policies

Database tables have Row-Level Security:
```sql
-- Users can only access their own payment intentions
CREATE POLICY "Users can view own payment intentions"
ON payment_intentions
FOR SELECT
USING (auth.uid() = user_id);
```

---

## 🧪 Testing

### Test Card Numbers

Use these Stripe test cards:

| Card Number | Description |
|-------------|-------------|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 9995` | Declined |
| `4000 0025 0000 3155` | Requires 3D Secure |
| `4000 0000 0000 3220` | Requires authentication |

### Test Flow

1. Add item to cart
2. Navigate to checkout
3. Select "Credit/Debit Card"
4. Enter test card: `4242 4242 4242 4242`
5. Enter any future expiry date
6. Enter any 3-digit CVC
7. Enter any ZIP code
8. Click "Pay"
9. Verify success redirect

---

## 🇪🇬 Fawry Integration (Egypt)

For Egyptian customers, Fawry payment is available.

### Usage

```tsx
import { processFawryPayment } from '@/lib/payments';

async function handleFawryPayment() {
  try {
    const { paymentUrl } = await processFawryPayment(
      'order_123',
      '+201234567890'
    );

    // Redirect to Fawry payment page
    window.open(paymentUrl, '_blank');
  } catch (error) {
    console.error('Fawry payment failed:', error);
  }
}
```

### Fawry Kiosk Payment

Customers can pay at Fawry kiosks using a reference number.

---

## 📊 Database Schema

### payment_intentions

```sql
CREATE TABLE payment_intentions (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  user_id UUID REFERENCES auth.users(id),
  amount NUMERIC(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50),
  provider VARCHAR(50),
  provider_reference_id VARCHAR(255),
  provider_metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Indexes

```sql
CREATE INDEX idx_payment_intentions_order ON payment_intentions(order_id);
CREATE INDEX idx_payment_intentions_user ON payment_intentions(user_id);
CREATE INDEX idx_payment_intentions_status ON payment_intentions(status);
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "Missing Stripe publishable key"

**Solution:** Add to `.env`:
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

#### 2. "Failed to create payment intent"

**Check:**
- Edge Function is deployed
- `STRIPE_SECRET_KEY` is set in Supabase secrets
- Order exists and belongs to user

#### 3. "Payment form not loading"

**Check:**
- Stripe SDK is installed
- Network connection
- Browser console for errors

#### 4. "Card declined"

**Test Mode:** Use test card numbers  
**Live Mode:** Check with customer's bank

---

## 📈 Next Steps

### Phase 1 (Complete ✅)
- [x] Stripe Elements integration
- [x] Payment intent creation
- [x] Payment form component

### Phase 2 (Recommended)
- [ ] Save cards for future payments
- [ ] Subscription/recurring payments
- [ ] Refund functionality
- [ ] Payment analytics dashboard

### Phase 3 (Future)
- [ ] Apple Pay / Google Pay
- [ ] Multiple currency support
- [ ] Fraud detection (Stripe Radar)
- [ ] Payment method optimization

---

## 🔗 Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Elements](https://stripe.com/docs/stripe-js)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Stripe Test Cards](https://stripe.com/docs/testing#cards)

---

## 📞 Support

For issues or questions:
1. Check Stripe Dashboard logs
2. Review Supabase Function logs
3. Check browser console errors
4. Review audit_logs table

---

**Status:** ✅ Production Ready  
**Last Updated:** March 27, 2026
