# 🛒 CheckoutPage Consolidation Plan

## Problem Statement
Two separate CheckoutPage implementations exist:
1. **`src/features/checkout/pages/CheckoutPage.tsx`** (ACTIVE - 108 lines)
   - ✅ Uses `useCheckout` hook with price security
   - ✅ Modern glassmorphic UI
   - ❌ Single step only (no step transitions)
   - ❌ No Stripe Elements integration
   - ❌ No COD payment option
   - ❌ No address selection from saved addresses

2. **`src/pages/checkout/CheckoutPage.tsx`** (ORPHANED - 432 lines)
   - ✅ Multi-step flow (cart → shipping → payment → confirmation)
   - ✅ Stripe, Fawry, COD payment methods
   - ✅ Order creation with Supabase
   - ❌ Old UI (Card-based, not glassmorphic)
   - ❌ No price security validation
   - ❌ Not in routes (dead code)

## Consolidation Strategy

### Approach: Enhance Active Version
Instead of creating a third implementation, we'll **enhance the active features version** with missing features from the orphaned version.

### Features to Add to Active CheckoutPage

#### 1. Multi-Step Flow
- Add step state management (`currentStep`)
- Step transitions (cart → shipping → payment → confirmation)
- Step indicator component (already exists: `CheckoutSteps`)
- Back/Next navigation

#### 2. Payment Methods
- Stripe Elements integration (already has `StripeCheckout` component)
- Fawry payment (edge function)
- Cash on Delivery (COD)
- Payment method selection UI

#### 3. Order Creation
- Order insertion with price security
- Order items creation
- Verification code for COD
- Redirect to order success page

#### 4. Saved Address Selection
- Load user's saved addresses
- Select existing address or add new
- Set as default option

### Implementation Priority

#### Phase 1: Multi-Step Flow (30 min)
- Add step state to `useCheckout` hook
- Wire up `CheckoutSteps` component
- Add back/next buttons
- Test step transitions

#### Phase 2: Payment Methods (45 min)
- Add payment method selection UI
- Integrate Stripe Elements
- Add COD option
- Add Fawry placeholder

#### Phase 3: Order Creation (45 min)
- Wire up `placeOrder` to create order in DB
- Add price security validation
- Create order items
- Handle COD verification code
- Redirect to success page

#### Phase 4: Address Selection (30 min)
- Load saved addresses
- Add address selection UI
- Allow new address creation
- Set default address option

### Files to Modify

1. **`src/features/checkout/hooks/useCheckout.ts`** - Add multi-step state
2. **`src/features/checkout/pages/CheckoutPage.tsx`** - Add step transitions
3. **`src/features/checkout/components/CheckoutForm.tsx`** - Add payment selection
4. **`src/features/checkout/components/OrderReview.tsx`** - Add place order logic
5. **`src/features/orders/hooks/useOrders.ts`** - Add createOrder mutation

### Files to Delete/Deprecate

1. **`src/pages/checkout/CheckoutPage.tsx`** - Add deprecation notice, then delete after testing
2. **`src/pages/checkout/OrderSuccess.tsx`** - Use `src/features/orders/pages/OrderSuccessPage.tsx` instead
3. **`src/pages/checkout/ShippingForm.tsx`** - Use `src/features/checkout/components/CheckoutForm.tsx` instead

### Testing Plan

1. **Unit Tests**
   - Multi-step state management
   - Payment method selection
   - Price security validation
   - Order creation

2. **Integration Tests**
   - Full checkout flow (cart → success)
   - Stripe payment (test mode)
   - COD order creation
   - Address selection

3. **E2E Tests**
   - Complete checkout with Stripe
   - Complete checkout with COD
   - Cart empty state
   - Auth redirect

### Rollback Plan

If consolidation breaks checkout:
1. Revert to active features version (git commit point)
2. Document what broke
3. Fix incrementally
4. Re-test

### Success Criteria

✅ Single CheckoutPage implementation in routes
✅ Multi-step flow working (cart → shipping → payment → confirmation)
✅ Stripe Elements integrated
✅ COD payment working
✅ Price security validation active
✅ Saved address selection
✅ Order creation with verification code (COD)
✅ All tests passing
✅ Old orphaned file deleted

---

## Recommended Timeline

| Phase | Estimated Time | Dependencies |
|-------|---------------|--------------|
| Phase 1: Multi-Step | 30 min | `useCheckout` hook enhancement |
| Phase 2: Payment Methods | 45 min | Stripe Elements component |
| Phase 3: Order Creation | 45 min | Database RPC functions |
| Phase 4: Address Selection | 30 min | Addresses page integration |
| Testing | 60 min | All phases complete |
| **Total** | **~3.5 hours** | |

---

*Created: April 6, 2026*
*Status: Planning Phase*
*Priority: Critical (4th critical fix)*
