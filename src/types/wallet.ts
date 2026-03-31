// src/types/wallet.ts

export interface WalletBalance {
  user_id: string;
  available_balance: number;
  pending_balance: number;
  total_earned: number;
  currency: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  transaction_type: 'credit' | 'debit' | 'payout' | 'refund' | 'adjustment';
  amount: number;
  description: string;
  reference_type: 'sale' | 'order' | 'payout' | 'refund' | 'admin' | null;
  reference_id: string | null;
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  created_at: string;
}

export interface PayoutRequest {
  id: string;
  user_id: string;
  amount: number;
  fee_amount: number;
  net_amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'rejected';
  payout_method: 'bank_transfer' | 'vodafone_cash' | 'orange_cash' | 'etisalat_cash';
  payout_details: Record<string, any>;
  created_at: string;
  processed_at: string | null;
  rejection_reason: string | null;
}

// Fallback: Sale from your existing schema
export interface Sale {
  id: string;
  seller_id: string;
  customer_id: string | null;
  product_id: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount: number;
  sale_date: string;
  status?: 'pending' | 'completed' | 'cancelled';
  products?: { title: string } | null;
}

// Fallback: Order from existing schema
export interface Order {
  id: string;
  user_id: string;
  seller_id: string | null;
  total: number;
  status: string;
  payment_status: string;
  created_at: string;
}
