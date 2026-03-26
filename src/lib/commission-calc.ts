/**
 * Commission Calculator
 * Calculates platform fees and seller revenue
 */

export interface CommissionBreakdown {
  subtotal: number;
  platformFee: number;
  platformFeePercentage: number;
  sellerReceives: number;
  breakdown: {
    productRevenue: number;
    platformCommission: number;
    netToSeller: number;
  };
}

/**
 * Calculate commission for a given subtotal
 * @param subtotal - The order subtotal before fees
 * @param rate - The commission rate percentage (default: 8%)
 * @returns Commission breakdown object
 */
export function calculateCommission(subtotal: number, rate: number = 8): CommissionBreakdown {
  const platformFee = subtotal * (rate / 100);
  const sellerReceives = subtotal - platformFee;

  return {
    subtotal,
    platformFee,
    platformFeePercentage: rate,
    sellerReceives,
    breakdown: {
      productRevenue: subtotal,
      platformCommission: platformFee,
      netToSeller: sellerReceives
    }
  };
}

/**
 * Format currency amount
 * @param amount - The amount to format
 * @param currency - Currency code (default: EGP)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'EGP'): string {
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency
  }).format(amount);
}

/**
 * Calculate shipping cost based on order value
 * @param subtotal - Order subtotal
 * @param freeShippingThreshold - Threshold for free shipping (default: 500 EGP)
 * @param standardShippingCost - Standard shipping cost (default: 50 EGP)
 * @returns Shipping cost
 */
export function calculateShipping(
  subtotal: number,
  freeShippingThreshold: number = 500,
  standardShippingCost: number = 50
): number {
  return subtotal > freeShippingThreshold ? 0 : standardShippingCost;
}

/**
 * Calculate order total with all fees
 * @param subtotal - Order subtotal
 * @param commissionRate - Platform commission rate
 * @param shippingThreshold - Free shipping threshold
 * @returns Complete order breakdown
 */
export function calculateOrderTotal(
  subtotal: number,
  commissionRate: number = 8,
  shippingThreshold: number = 500
) {
  const commission = calculateCommission(subtotal, commissionRate);
  const shipping = calculateShipping(subtotal, shippingThreshold);
  const total = subtotal + shipping;

  return {
    ...commission,
    shipping,
    total,
    isFreeShipping: shipping === 0
  };
}

/**
 * Get commission rate display string
 * @param rate - Commission rate percentage
 * @returns Formatted rate string
 */
export function getCommissionRateDisplay(rate: number = 8): string {
  return `${rate}%`;
}

/**
 * Calculate seller revenue from multiple orders
 * @param orders - Array of order subtotals
 * @param commissionRate - Commission rate
 * @returns Total revenue breakdown
 */
export function calculateSellerRevenue(
  orders: number[],
  commissionRate: number = 8
) {
  const totalSubtotal = orders.reduce((sum, amount) => sum + amount, 0);
  const commission = calculateCommission(totalSubtotal, commissionRate);

  return {
    totalOrders: orders.length,
    totalSubtotal,
    totalCommission: commission.platformFee,
    netRevenue: commission.sellerReceives,
    averageOrderValue: totalSubtotal / orders.length
  };
}
