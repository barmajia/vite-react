# 🛒 Complete COD Checkout System - Implementation Guide

## 📁 Project Structure

```
src/
├── pages/
│   ├── checkout/
│   │   ├── CheckoutPage.tsx          # Main checkout page with stepper
│   │   ├── OrderSummary.tsx          # Order summary with 8% margin calc
│   │   ├── ShippingForm.tsx          # Shipping address form
│   │   ├── PaymentMethod.tsx         # COD payment selection
│   │   └── OrderSuccess.tsx          # Order confirmation with verification code
│   ├── delivery/
│   │   ├── DeliveryDashboard.tsx     # Driver dashboard for COD deliveries
│   │   └── VerifyCODModal.tsx        # Driver verifies COD code modal
│   ├── seller/
│   │   └── CommissionReport.tsx      # Platform margin/commission reports
│   └── customer/
│       └── OrderTracking.tsx         # Track order status
├── components/
│   ├── checkout/
│   │   ├── CartItem.tsx              # Cart item display
│   │   ├── PriceBreakdown.tsx        # Price breakdown with fees
│   │   └── CODVerificationDisplay.tsx # COD code display component
│   └── shared/
│       ├── SecureRoom.tsx            # Role-based access control
│       └── LocationVerifier.tsx      # GPS location verification
├── lib/
│   ├── checkout.ts                   # Checkout logic & helpers
│   ├── cod-verification.ts           # COD verification functions
│   └── commission-calc.ts            # 8% margin calculation utils
```

---

## 🔑 Key Features

### 1. **8% Platform Margin**
- Automatically calculated on all orders
- Displayed in order summary (seller view)
- Tracked in commission reports

### 2. **COD Verification System**
- Unique 6-character verification code per order
- 48-hour expiration
- Location-based verification for drivers
- Maximum 3 attempt limit

### 3. **Checkout Flow**
```
Cart → Shipping → Payment → Confirmation
  ↓        ↓          ↓          ↓
Review  Address    COD      Success
Items   Form      Selection with Code
```

### 4. **Security Features**
- Role-based access control (SecureRoom)
- GPS location verification
- Unique verification codes
- Attempt limiting
- Activity logging

---

## 🚀 Usage

### Starting Checkout

```tsx
import { CheckoutPage } from '@/pages/checkout/CheckoutPage';

// In your routes
<Route path="/checkout" element={<CheckoutPage />} />
```

### Using Commission Calculator

```ts
import { calculateCommission, formatCurrency } from '@/lib/commission-calc';

const { subtotal, platformFee, sellerReceives } = calculateCommission(1000, 8);
// subtotal: 1000, platformFee: 80, sellerReceives: 920

formatCurrency(1000); // "1,000.00 EGP"
```

### Driver COD Verification

```tsx
import { DeliveryDashboard } from '@/pages/delivery/DeliveryDashboard';

// Driver dashboard shows all pending COD deliveries
// Click "Verify & Collect" to open verification modal
// Driver must verify location before completing
```

### Seller Commission Report

```tsx
import { CommissionReport } from '@/pages/seller/CommissionReport';

// Shows:
// - Total revenue
// - Platform fees (8%)
// - Net revenue (after fees)
// - Order breakdown table
```

---

## 📊 Database Requirements

### Required Tables

```sql
-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  seller_id UUID REFERENCES auth.users(id),
  subtotal DECIMAL(10,2),
  shipping DECIMAL(10,2),
  tax DECIMAL(10,2),
  discount DECIMAL(10,2),
  total DECIMAL(10,2),
  payment_method TEXT,
  payment_status TEXT,
  status TEXT,
  shipping_address_snapshot JSONB,
  metadata JSONB, -- Store platform_margin here
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  asin TEXT,
  product_name TEXT,
  product_image TEXT,
  quantity INTEGER,
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2),
  seller_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- COD verifications table
CREATE TABLE cod_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  verification_key TEXT UNIQUE,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  verified_by UUID,
  verification_attempts INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Required Functions

```sql
-- Generate COD verification key
CREATE OR REPLACE FUNCTION generate_cod_verification_key(
  p_order_id UUID,
  p_key_length INTEGER DEFAULT 6,
  p_expiry_hours INTEGER DEFAULT 48
)
RETURNS TEXT AS $$
DECLARE
  v_verification_key TEXT;
  v_expiry TIMESTAMPTZ;
BEGIN
  -- Generate random key
  v_verification_key := UPPER(substring(md5(random()::text) from 1 for p_key_length));
  v_expiry := NOW() + (p_expiry_hours || ' hours')::INTERVAL;
  
  -- Insert verification record
  INSERT INTO cod_verifications (
    order_id,
    verification_key,
    expires_at
  ) VALUES (
    p_order_id,
    v_verification_key,
    v_expiry
  );
  
  RETURN v_verification_key;
END;
$$ LANGUAGE plpgsql;

-- Verify COD key
CREATE OR REPLACE FUNCTION verify_cod_verification_key(
  p_verification_key TEXT,
  p_driver_id UUID,
  p_customer_signature_url TEXT DEFAULT NULL,
  p_driver_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_cod_record RECORD;
  v_order_id UUID;
BEGIN
  -- Get COD record
  SELECT * INTO v_cod_record
  FROM cod_verifications
  WHERE verification_key = p_verification_key
  AND is_verified = FALSE
  AND expires_at > NOW();
  
  -- Check if exists
  IF v_cod_record IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid or expired verification code'
    );
  END IF;
  
  -- Check attempts
  IF v_cod_record.verification_attempts >= 3 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Maximum verification attempts reached'
    );
  END IF;
  
  -- Update verification
  UPDATE cod_verifications
  SET is_verified = TRUE,
      verified_at = NOW(),
      verified_by = p_driver_id
  WHERE id = v_cod_record.id;
  
  -- Update order status
  UPDATE orders
  SET status = 'delivered',
      payment_status = 'completed'
  WHERE id = v_cod_record.order_id;
  
  -- Log activity
  INSERT INTO activity_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    metadata
  ) VALUES (
    p_driver_id,
    'cod_verified',
    'order',
    v_cod_record.order_id,
    jsonb_build_object(
      'verification_key', p_verification_key,
      'signature_url', p_customer_signature_url,
      'notes', p_driver_notes
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_cod_record.order_id,
    'verified_at', NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- Get driver COD orders
CREATE OR REPLACE FUNCTION get_driver_cod_orders(
  p_driver_id UUID
)
RETURNS TABLE (
  id UUID,
  customer_name TEXT,
  customer_phone TEXT,
  delivery_address JSONB,
  total_amount DECIMAL,
  verification_key TEXT,
  status TEXT,
  expires_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    u.full_name AS customer_name,
    u.phone AS customer_phone,
    o.shipping_address_snapshot AS delivery_address,
    o.total AS total_amount,
    cv.verification_key,
    o.status,
    cv.expires_at
  FROM orders o
  JOIN users u ON o.user_id = u.user_id
  JOIN cod_verifications cv ON o.id = cv.order_id
  WHERE o.status IN ('pending', 'shipped')
  AND cv.is_verified = FALSE
  AND cv.expires_at > NOW()
  ORDER BY o.created_at ASC;
END;
$$ LANGUAGE plpgsql;
```

---

## 🎨 Component Props

### CheckoutPage
No props required. Reads cart from Supabase.

### OrderSummary
```tsx
interface OrderSummaryProps {
  subtotal: number;
  platformMargin: number;
  shipping: number;
  total: number;
  itemCount: number;
}
```

### ShippingForm
```tsx
interface ShippingFormProps {
  onSubmit: (address: ShippingAddress) => void;
  onBack: () => void;
}
```

### PaymentMethod
```tsx
interface PaymentMethodProps {
  selectedMethod: 'cod' | 'card' | 'wallet';
  onSubmit: () => void;
  onBack: () => void;
  loading: boolean;
  total: number;
}
```

### OrderSuccess
```tsx
interface OrderSuccessProps {
  orderId: string;
  verificationCode: string;
  total: number;
}
```

### DeliveryDashboard
No props. Loads driver's pending deliveries.

### VerifyCODModal
```tsx
interface VerifyCODModalProps {
  order: {
    id: string;
    verification_key: string;
    total_amount: number;
  };
  onClose: () => void;
  onSuccess: () => void;
}
```

### CommissionReport
No props. Loads seller's order data.

---

## 🔐 Security Considerations

1. **RLS Policies**: Enable row-level security on all tables
2. **Verification Codes**: Single-use, time-limited
3. **Location Verification**: Required before COD completion
4. **Attempt Limiting**: Max 3 verification attempts
5. **Audit Trail**: All actions logged in `activity_logs`

---

## 📱 Responsive Design

All components are mobile-responsive:
- Checkout: Stacks vertically on mobile
- Dashboard: Grid adapts to screen size
- Modals: Full-screen on small devices

---

## 🧪 Testing Checklist

- [ ] Add item to cart
- [ ] Navigate to checkout
- [ ] Fill shipping form
- [ ] Select COD payment
- [ ] Create order
- [ ] Receive verification code
- [ ] Driver views delivery dashboard
- [ ] Driver verifies location
- [ ] Driver enters verification code
- [ ] Order marked as delivered
- [ ] Seller sees commission report

---

## 🐛 Troubleshooting

### "Failed to load cart"
- Check Supabase connection
- Verify cart table RLS policies
- Ensure user is authenticated

### "Invalid verification code"
- Code is case-sensitive (use uppercase)
- Check if code expired (48 hours)
- Verify max attempts not reached

### "Location verification failed"
- Browser must support geolocation
- User must grant location permission
- HTTPS required for geolocation

---

## 📄 License

Internal use only - Aurora Project
