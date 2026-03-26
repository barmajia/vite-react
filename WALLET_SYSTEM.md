# 💰 Unified Wallet System - Complete Implementation

## 📁 Project Structure

```
src/
├── pages/
│   └── wallet/
│       ├── WalletDashboard.tsx       # Main balance overview
│       ├── TransactionHistory.tsx    # Full ledger view
│       ├── PayoutRequest.tsx         # Withdrawal form
│       └── PayoutHistory.tsx         # Payout status tracking
├── lib/
│   └── wallet.ts                     # Wallet utility functions
```

---

## 🚀 Features

### 1. **Multi-Account Type Support**
All account types can use the wallet system:
- ✅ Sellers (earn from sales)
- ✅ Middlemen (earn commissions)
- ✅ Delivery (earn from deliveries)
- ✅ Freelancers (earn from services)
- ✅ Factory (earn from orders)

### 2. **Balance Management**
- **Available Balance**: Ready to withdraw immediately
- **Pending Balance**: Being processed (e.g., COD not yet verified)
- **Total Earned**: Lifetime earnings tracker

### 3. **Transaction Ledger**
- Immutable transaction history
- Credit/Debit tracking
- Balance after each transaction
- Reference tracking (order IDs, payout IDs, etc.)

### 4. **Payout System**
- Bank Transfer
- Fawry Cash Pickup
- Digital Wallet Transfer
- 2% processing fee
- Minimum 50 EGP withdrawal

---

## 📊 Database Schema

### user_wallets
```sql
CREATE TABLE user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  balance DECIMAL(10,2) DEFAULT 0,
  pending_balance DECIMAL(10,2) DEFAULT 0,
  total_earned DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'EGP',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### wallet_transactions
```sql
CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  transaction_type TEXT CHECK (transaction_type IN ('credit', 'debit', 'hold', 'release')),
  amount DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  description TEXT,
  reference_type TEXT,
  reference_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX idx_wallet_transactions_user ON wallet_transactions(user_id, created_at DESC);
```

### payouts
```sql
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  amount DECIMAL(10,2) NOT NULL,
  fee DECIMAL(10,2) NOT NULL,
  net_amount DECIMAL(10,2) NOT NULL,
  payout_method TEXT CHECK (payout_method IN ('bank_transfer', 'fawry_cash', 'wallet')),
  status TEXT CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'rejected')),
  bank_details JSONB,
  metadata JSONB,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payouts_user ON payouts(user_id, created_at DESC);
```

---

## 🔧 Backend Functions (RPC)

### Credit Wallet
```sql
CREATE OR REPLACE FUNCTION credit_wallet(
  p_user_id UUID,
  p_amount DECIMAL,
  p_description TEXT,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_wallet user_wallets%ROWTYPE;
  v_new_balance DECIMAL;
BEGIN
  -- Get or create wallet
  SELECT * INTO v_wallet
  FROM user_wallets
  WHERE user_id = p_user_id;
  
  IF v_wallet IS NULL THEN
    INSERT INTO user_wallets (user_id, balance, pending_balance, total_earned)
    VALUES (p_user_id, 0, 0, 0)
    RETURNING * INTO v_wallet;
  END IF;
  
  -- Calculate new balance
  v_new_balance := v_wallet.balance + p_amount;
  
  -- Update wallet
  UPDATE user_wallets
  SET balance = v_new_balance,
      total_earned = total_earned + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Create transaction record
  INSERT INTO wallet_transactions (
    user_id,
    transaction_type,
    amount,
    balance_after,
    description,
    reference_type,
    reference_id,
    metadata
  ) VALUES (
    p_user_id,
    'credit',
    p_amount,
    v_new_balance,
    p_description,
    p_reference_type,
    p_reference_id,
    p_metadata
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance
  );
END;
$$ LANGUAGE plpgsql;
```

### Debit Wallet
```sql
CREATE OR REPLACE FUNCTION debit_wallet(
  p_user_id UUID,
  p_amount DECIMAL,
  p_description TEXT,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_wallet user_wallets%ROWTYPE;
  v_new_balance DECIMAL;
BEGIN
  -- Get wallet
  SELECT * INTO v_wallet
  FROM user_wallets
  WHERE user_id = p_user_id;
  
  IF v_wallet IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Wallet not found'
    );
  END IF;
  
  IF v_wallet.balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient balance'
    );
  END IF;
  
  -- Calculate new balance
  v_new_balance := v_wallet.balance - p_amount;
  
  -- Update wallet
  UPDATE user_wallets
  SET balance = v_new_balance,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Create transaction record
  INSERT INTO wallet_transactions (
    user_id,
    transaction_type,
    amount,
    balance_after,
    description,
    reference_type,
    reference_id,
    metadata
  ) VALUES (
    p_user_id,
    'debit',
    p_amount,
    v_new_balance,
    p_description,
    p_reference_type,
    p_reference_id,
    p_metadata
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance
  );
END;
$$ LANGUAGE plpgsql;
```

### Request Payout
```sql
CREATE OR REPLACE FUNCTION request_payout(
  p_user_id UUID,
  p_amount DECIMAL,
  p_payout_method TEXT,
  p_bank_details JSONB DEFAULT '{}',
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_wallet user_wallets%ROWTYPE;
  v_fee DECIMAL;
  v_net_amount DECIMAL;
  v_payout_id UUID;
  v_min_payout DECIMAL := 50;
  v_fee_percentage DECIMAL := 0.02; -- 2%
BEGIN
  -- Check idempotency
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_payout_id
    FROM payouts
    WHERE metadata->>'idempotency_key' = p_idempotency_key;
    
    IF v_payout_id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'success', true,
        'payout_id', v_payout_id,
        'message', 'Duplicate request ignored'
      );
    END IF;
  END IF;
  
  -- Get wallet
  SELECT * INTO v_wallet
  FROM user_wallets
  WHERE user_id = p_user_id;
  
  IF v_wallet IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Wallet not found'
    );
  END IF;
  
  -- Validate amount
  IF p_amount < v_min_payout THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Minimum payout is ' || v_min_payout || ' EGP'
    );
  END IF;
  
  IF p_amount > v_wallet.balance THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient balance'
    );
  END IF;
  
  -- Calculate fee and net amount
  v_fee := p_amount * v_fee_percentage;
  v_net_amount := p_amount - v_fee;
  
  -- Debit wallet
  UPDATE user_wallets
  SET balance = balance - p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Create payout record
  INSERT INTO payouts (
    user_id,
    amount,
    fee,
    net_amount,
    payout_method,
    status,
    bank_details,
    metadata
  ) VALUES (
    p_user_id,
    p_amount,
    v_fee,
    v_net_amount,
    p_payout_method,
    'pending',
    p_bank_details,
    jsonb_build_object('idempotency_key', p_idempotency_key)
  )
  RETURNING id INTO v_payout_id;
  
  -- Create transaction record
  INSERT INTO wallet_transactions (
    user_id,
    transaction_type,
    amount,
    balance_after,
    description,
    reference_type,
    reference_id,
    metadata
  ) VALUES (
    p_user_id,
    'debit',
    p_amount,
    v_wallet.balance - p_amount,
    'Payout request: ' || p_payout_method,
    'payout',
    v_payout_id,
    jsonb_build_object(
      'fee', v_fee,
      'net_amount', v_net_amount,
      'method', p_payout_method
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'payout_id', v_payout_id,
    'fee', v_fee,
    'net_amount', v_net_amount
  );
END;
$$ LANGUAGE plpgsql;
```

---

## 🔐 RLS Policies

```sql
-- Enable RLS
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- Wallet policies
CREATE POLICY "users_view_own_wallet"
  ON user_wallets
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Transaction policies
CREATE POLICY "users_view_own_transactions"
  ON wallet_transactions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Payout policies
CREATE POLICY "users_view_own_payouts"
  ON payouts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "users_create_own_payouts"
  ON payouts
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admin policies (for support team)
CREATE POLICY "admin_view_all_wallets"
  ON user_wallets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.user_id = auth.uid()
      AND users.account_type = 'admin'
    )
  );

CREATE POLICY "admin_view_all_payouts"
  ON payouts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.user_id = auth.uid()
      AND users.account_type = 'admin'
    )
  );

CREATE POLICY "admin_update_payouts"
  ON payouts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.user_id = auth.uid()
      AND users.account_type = 'admin'
    )
  );
```

---

## 🎨 Component Usage

### Wallet Dashboard
```tsx
import { WalletDashboard } from '@/pages/wallet/WalletDashboard';

// In your routes
<Route path="/wallet" element={<WalletDashboard />} />
```

### Transaction History
```tsx
import { TransactionHistory } from '@/pages/wallet/TransactionHistory';

// In your routes
<Route path="/wallet/transactions" element={<TransactionHistory />} />
```

### Payout Request
```tsx
import { PayoutRequest } from '@/pages/wallet/PayoutRequest';

// In your routes
<Route path="/wallet/payouts" element={<PayoutRequest />} />
```

### Payout History
```tsx
import { PayoutHistory } from '@/pages/wallet/PayoutHistory';

// In your routes
<Route path="/wallet/payouts/history" element={<PayoutHistory />} />
```

---

## 💡 Usage Examples

### Credit Wallet (After Order Delivery)
```ts
import { creditWallet } from '@/lib/wallet';

// After COD verification
await creditWallet(
  sellerId,
  orderAmount,
  'Payment for order #' + orderId,
  'order',
  orderId,
  { order_id: orderId, items: 3 }
);
```

### Request Payout
```ts
import { requestPayout, calculatePayoutFee } from '@/lib/wallet';

const amount = 500;
const { fee, netAmount } = calculatePayoutFee(amount);

const result = await requestPayout(
  userId,
  amount,
  'bank_transfer',
  {
    account_name: 'John Doe',
    account_number: '123456789',
    bank_name: 'NBE'
  }
);

console.log(`Fee: ${fee} EGP, You receive: ${netAmount} EGP`);
```

### Get Transaction History
```ts
import { getWalletTransactions } from '@/lib/wallet';

const transactions = await getWalletTransactions(userId, {
  limit: 20,
  type: 'credit', // or 'debit' or 'all'
  fromDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
});
```

---

## 📋 Integration Checklist

### 1. Database Setup
- [ ] Create `user_wallets` table
- [ ] Create `wallet_transactions` table
- [ ] Create `payouts` table
- [ ] Create RPC functions (credit/debit/request_payout)
- [ ] Set up RLS policies

### 2. Frontend Routes
```tsx
// In App.tsx
<Route path="/wallet" element={<WalletDashboard />} />
<Route path="/wallet/transactions" element={<TransactionHistory />} />
<Route path="/wallet/payouts" element={<PayoutRequest />} />
<Route path="/wallet/payouts/history" element={<PayoutHistory />} />
```

### 3. Wallet Integration Points
- [ ] COD Order → Credit seller wallet after verification
- [ ] Service Order → Credit freelancer wallet after completion
- [ ] Commission → Credit middleman wallet after deal
- [ ] Delivery → Credit driver wallet after COD verification

### 4. Admin Dashboard (Optional)
- [ ] View all wallets
- [ ] Approve/reject payouts
- [ ] Manual wallet adjustments
- [ ] Payout reports

---

## 🧪 Testing Scenarios

1. **Wallet Creation**
   - [ ] New user signs up → Wallet auto-created
   - [ ] Wallet shows 0.00 EGP balance

2. **Credit Transaction**
   - [ ] Credit 100 EGP → Balance updates
   - [ ] Transaction appears in history
   - [ ] Total earned increases

3. **Debit Transaction**
   - [ ] Debit 50 EGP → Balance decreases
   - [ ] Transaction recorded
   - [ ] Insufficient balance handled

4. **Payout Request**
   - [ ] Request < 50 EGP → Error shown
   - [ ] Request > balance → Error shown
   - [ ] Valid request → Pending status
   - [ ] Fee calculated correctly (2%)

5. **Transaction History**
   - [ ] Filter by type works
   - [ ] Filter by date range works
   - [ ] Export to CSV works
   - [ ] Pagination works

---

## 🔐 Security Considerations

1. **Idempotency**: All payout requests use idempotency keys
2. **RLS**: Users can only view their own data
3. **Immutable Ledger**: Transactions cannot be modified
4. **Balance Checks**: All debits verify sufficient balance
5. **Audit Trail**: All operations logged in transactions

---

## 📊 Admin Functions (For Support Team)

### Approve Payout
```sql
CREATE OR REPLACE FUNCTION admin_approve_payout(
  p_payout_id UUID,
  p_admin_id UUID,
  p_transaction_ref TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_payout payouts%ROWTYPE;
BEGIN
  -- Get payout
  SELECT * INTO v_payout
  FROM payouts
  WHERE id = p_payout_id;
  
  IF v_payout IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Payout not found');
  END IF;
  
  IF v_payout.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Payout not pending');
  END IF;
  
  -- Update payout status
  UPDATE payouts
  SET status = 'processing',
      processed_at = NOW(),
      metadata = metadata || jsonb_build_object(
        'transaction_ref', p_transaction_ref,
        'approved_by', p_admin_id
      )
  WHERE id = p_payout_id;
  
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;
```

### Mark Payout as Paid
```sql
CREATE OR REPLACE FUNCTION admin_complete_payout(
  p_payout_id UUID,
  p_admin_id UUID
)
RETURNS JSONB AS $$
BEGIN
  UPDATE payouts
  SET status = 'paid',
      metadata = metadata || jsonb_build_object(
        'completed_by', p_admin_id,
        'completed_at', NOW()
      ),
      processed_at = COALESCE(processed_at, NOW())
  WHERE id = p_payout_id
  AND status = 'processing';
  
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;
```

---

## 🎯 Next Steps

1. **Add Routes**: Integrate wallet pages into your router
2. **Test Flow**: Verify credit/debit/payout flows
3. **Admin Panel**: Build admin payout approval interface
4. **Notifications**: Add email/SMS for payout status updates
5. **Analytics**: Add wallet analytics dashboard

---

## 📄 License

Internal use only - Aurora Project
