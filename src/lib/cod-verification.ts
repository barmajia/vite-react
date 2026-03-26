import { supabase } from './supabase';

export interface CODVerificationResult {
  success: boolean;
  error?: string;
  orderId?: string;
  verifiedAt?: string;
}

/**
 * Verify a COD verification code
 * @param verificationKey - The verification code to verify
 * @param driverId - The ID of the driver verifying the code
 * @param customerSignatureUrl - Optional URL to customer signature
 * @param driverNotes - Optional notes from the driver
 * @returns Verification result
 */
export async function verifyCODCode(
  verificationKey: string,
  driverId: string,
  customerSignatureUrl?: string | null,
  driverNotes?: string
): Promise<CODVerificationResult> {
  try {
    const { data, error } = await supabase.rpc('verify_cod_verification_key', {
      p_verification_key: verificationKey.toUpperCase(),
      p_driver_id: driverId,
      p_customer_signature_url: customerSignatureUrl || null,
      p_driver_notes: driverNotes || 'Payment collected successfully'
    });

    if (error) {
      console.error('COD verification error:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: data?.success || false,
      error: data?.error,
      orderId: data?.order_id,
      verifiedAt: data?.verified_at
    };
  } catch (error) {
    console.error('COD verification exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Generate a COD verification code for an order
 * @param orderId - The order ID
 * @param keyLength - Length of the verification code (default: 6)
 * @param expiryHours - Hours until code expires (default: 48)
 * @returns Generated verification code or null
 */
export async function generateCODCode(
  orderId: string,
  keyLength: number = 6,
  expiryHours: number = 48
): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('generate_cod_verification_key', {
      p_order_id: orderId,
      p_key_length: keyLength,
      p_expiry_hours: expiryHours
    });

    if (error) {
      console.error('Error generating COD code:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('COD code generation exception:', error);
    return null;
  }
}

/**
 * Get pending COD orders for a driver
 * @param driverId - The driver's user ID
 * @returns Array of pending COD orders
 */
export async function getDriverCODOrders(driverId: string) {
  try {
    const { data, error } = await supabase.rpc('get_driver_cod_orders', {
      p_driver_id: driverId
    });

    if (error) {
      console.error('Error loading driver orders:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception loading driver orders:', error);
    return [];
  }
}

/**
 * Check if a verification code is expired
 * @param expiresAt - Expiration timestamp
 * @returns True if expired
 */
export function isCodeExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

/**
 * Format verification code expiry time
 * @param expiresAt - Expiration timestamp
 * @returns Formatted expiry string
 */
export function formatCodeExpiry(expiresAt: string): string {
  const expiry = new Date(expiresAt);
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) {
    return 'Expires soon';
  } else if (diffHours < 24) {
    return `Expires in ${diffHours}h`;
  } else {
    const diffDays = Math.floor(diffHours / 24);
    return `Expires in ${diffDays}d`;
  }
}

/**
 * Validate verification code format
 * @param code - Code to validate
 * @param expectedLength - Expected code length
 * @returns True if valid format
 */
export function isValidCodeFormat(code: string, expectedLength: number = 6): boolean {
  return /^[A-Z0-9]+$/.test(code.toUpperCase()) && code.length === expectedLength;
}

/**
 * Get remaining verification attempts
 * @param orderId - Order ID
 * @returns Number of remaining attempts
 */
export async function getRemainingAttempts(orderId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('cod_verifications')
      .select('verification_attempts')
      .eq('order_id', orderId)
      .single();

    if (error || !data) {
      return 3; // Default max attempts
    }

    const maxAttempts = 3;
    const usedAttempts = data.verification_attempts || 0;
    return Math.max(0, maxAttempts - usedAttempts);
  } catch (error) {
    console.error('Error getting remaining attempts:', error);
    return 3;
  }
}
