import { supabase } from './supabase';

export interface WalletData {
  user_id: string;
  balance: number;
  pending_balance: number;
  total_earned: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  transaction_type: 'credit' | 'debit' | 'hold' | 'release';
  amount: number;
  balance_after: number;
  description: string;
  reference_type?: string;
  reference_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface PayoutRequest {
  id: string;
  user_id: string;
  amount: number;
  fee: number;
  net_amount: number;
  payout_method: 'bank_transfer' | 'fawry_cash' | 'wallet';
  status: 'pending' | 'processing' | 'paid' | 'failed' | 'rejected';
  bank_details?: Record<string, any>;
  metadata?: Record<string, any>;
  processed_at?: string;
  created_at: string;
}

/**
 * Get user's wallet data
 */
export async function getWalletData(userId: string): Promise<WalletData | null> {
  try {
    const { data, error } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  } catch (error) {
    console.error('Error getting wallet data:', error);
    return null;
  }
}

/**
 * Get wallet transactions with pagination
 */
export async function getWalletTransactions(
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    type?: 'credit' | 'debit' | 'all';
    fromDate?: string;
    toDate?: string;
  }
): Promise<WalletTransaction[]> {
  try {
    let query = supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    if (options?.type && options.type !== 'all') {
      query = query.eq('transaction_type', options.type);
    }

    if (options?.fromDate) {
      query = query.gte('created_at', options.fromDate);
    }

    if (options?.toDate) {
      query = query.lte('created_at', options.toDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting transactions:', error);
    return [];
  }
}

/**
 * Get payout history for a user
 */
export async function getPayoutHistory(
  userId: string,
  options?: {
    limit?: number;
    status?: 'pending' | 'processing' | 'paid' | 'failed' | 'rejected' | 'all';
  }
): Promise<PayoutRequest[]> {
  try {
    let query = supabase
      .from('payouts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.status && options.status !== 'all') {
      query = query.eq('status', options.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting payout history:', error);
    return [];
  }
}

/**
 * Request a payout
 */
export async function requestPayout(
  userId: string,
  amount: number,
  payoutMethod: 'bank_transfer' | 'fawry_cash' | 'wallet',
  bankDetails?: Record<string, any>
): Promise<{ success: boolean; error?: string; payoutId?: string }> {
  try {
    const { data, error } = await supabase.rpc('request_payout', {
      p_user_id: userId,
      p_amount: amount,
      p_payout_method: payoutMethod,
      p_bank_details: bankDetails || {},
      p_idempotency_key: `payout_${userId}_${Date.now()}`
    });

    if (error) throw error;
    return { success: true, payoutId: data?.payout_id };
  } catch (error: any) {
    console.error('Error requesting payout:', error);
    return {
      success: false,
      error: error.message || 'Failed to request payout'
    };
  }
}

/**
 * Calculate payout fee
 * @param amount - Payout amount
 * @param feePercentage - Fee percentage (default: 2%)
 * @returns Fee amount and net amount
 */
export function calculatePayoutFee(amount: number, feePercentage: number = 2) {
  const fee = amount * (feePercentage / 100);
  const netAmount = amount - fee;
  
  return {
    fee,
    netAmount,
    feePercentage
  };
}

/**
 * Check if user can request payout
 */
export function canRequestPayout(
  wallet: WalletData | null,
  amount: number,
  minPayout: number = 50
): { canWithdraw: boolean; reason?: string } {
  if (!wallet) {
    return { canWithdraw: false, reason: 'Wallet not found' };
  }

  if (amount < minPayout) {
    return { canWithdraw: false, reason: `Minimum payout is ${minPayout} EGP` };
  }

  if (amount > wallet.balance) {
    return { canWithdraw: false, reason: 'Insufficient balance' };
  }

  if (wallet.balance <= 0) {
    return { canWithdraw: false, reason: 'No available balance' };
  }

  return { canWithdraw: true };
}

/**
 * Format currency amount
 */
export function formatWalletAmount(amount: number, currency: string = 'EGP'): string {
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency
  }).format(amount);
}

/**
 * Get transaction type color
 */
export function getTransactionTypeColor(type: string): string {
  const colors: Record<string, string> = {
    credit: 'text-green-600 bg-green-100',
    debit: 'text-red-600 bg-red-100',
    hold: 'text-yellow-600 bg-yellow-100',
    release: 'text-blue-600 bg-blue-100'
  };
  return colors[type] || 'text-gray-600 bg-gray-100';
}

/**
 * Get payout status color
 */
export function getPayoutStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'text-yellow-600 bg-yellow-100',
    processing: 'text-blue-600 bg-blue-100',
    paid: 'text-green-600 bg-green-100',
    failed: 'text-red-600 bg-red-100',
    rejected: 'text-gray-600 bg-gray-100'
  };
  return colors[status] || 'text-gray-600 bg-gray-100';
}

/**
 * Initialize wallet for new user
 */
export async function initializeWallet(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('user_wallets').insert({
      user_id: userId,
      balance: 0,
      pending_balance: 0,
      total_earned: 0,
      currency: 'EGP'
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error initializing wallet:', error);
    return false;
  }
}

/**
 * Credit wallet (internal function - should be called via RPC)
 */
export async function creditWallet(
  userId: string,
  amount: number,
  description: string,
  referenceType?: string,
  referenceId?: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.rpc('credit_wallet', {
      p_user_id: userId,
      p_amount: amount,
      p_description: description,
      p_reference_type: referenceType,
      p_reference_id: referenceId,
      p_metadata: metadata
    });

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error crediting wallet:', error);
    return {
      success: false,
      error: error.message || 'Failed to credit wallet'
    };
  }
}

/**
 * Debit wallet (internal function - should be called via RPC)
 */
export async function debitWallet(
  userId: string,
  amount: number,
  description: string,
  referenceType?: string,
  referenceId?: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.rpc('debit_wallet', {
      p_user_id: userId,
      p_amount: amount,
      p_description: description,
      p_reference_type: referenceType,
      p_reference_id: referenceId,
      p_metadata: metadata
    });

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error debiting wallet:', error);
    return {
      success: false,
      error: error.message || 'Failed to debit wallet'
    };
  }
}

/**
 * Export transactions to CSV
 */
export function exportTransactionsToCSV(
  transactions: WalletTransaction[],
  filename?: string
): void {
  const headers = ['Date', 'Type', 'Description', 'Reference', 'Amount', 'Balance After'];
  const rows = transactions.map(tx => [
    new Date(tx.created_at).toLocaleDateString(),
    tx.transaction_type,
    tx.description,
    tx.reference_id || '-',
    `${tx.transaction_type === 'credit' ? '+' : '-'}${tx.amount.toFixed(2)}`,
    `${tx.balance_after.toFixed(2)}`
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `transactions-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Export payouts to CSV
 */
export function exportPayoutsToCSV(
  payouts: PayoutRequest[],
  filename?: string
): void {
  const headers = ['Date', 'Amount', 'Fee', 'Net Amount', 'Method', 'Status', 'Processed At'];
  const rows = payouts.map(payout => [
    new Date(payout.created_at).toLocaleDateString(),
    payout.amount.toFixed(2),
    payout.fee.toFixed(2),
    payout.net_amount.toFixed(2),
    payout.payout_method.replace('_', ' '),
    payout.status,
    payout.processed_at ? new Date(payout.processed_at).toLocaleDateString() : '-'
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `payouts-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}
