// ============================================
// COMPLETE TYPE SYSTEM FOR ROLE-BASED SIGNUP
// ============================================

import type { Database, Json } from "@/lib/database.types";

// ───────────────────────────────────────────
// 1. ENUMS & UNION TYPES
// ───────────────────────────────────────────

/** All possible account types in the system */
export type AccountType =
  | "customer"
  | "seller"
  | "factory"
  | "middleman"
  | "delivery"
  | "admin";

/** Account types stored as array in users table */
export type AccountTypeArray = (AccountType | "user")[];

/** Role display names for UI */
export type RoleDisplayName =
  | "Customer"
  | "Seller"
  | "Factory"
  | "Middleman"
  | "Delivery Driver"
  | "Administrator";

/** Margin type for middleman deals */
export type MarginType = "percentage" | "fixed";

/** Commission status */
export type CommissionStatus = "pending" | "approved" | "paid" | "cancelled";

/** Approval status for deals */
export type ApprovalStatus =
  | "auto_approved"
  | "pending_approval"
  | "rejected"
  | "archived";

/** Order status */
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "refunded";

/** Production status */
export type ProductionStatus =
  | "pending"
  | "in_production"
  | "quality_check"
  | "quality_check_failed"
  | "production_issue"
  | "ready_to_ship"
  | "shipped"
  | "delivered"
  | "cancelled";

// ───────────────────────────────────────────
// 2. BASE USER TYPES
// ───────────────────────────────────────────

/** Supabase Auth User with enhanced metadata */
export interface AuthUserMetadata {
  full_name?: string;
  phone?: string;
  location?: string;
  currency?: string;
  account_type?: AccountType;
  company_name?: string;
  specialization?: string;
  production_capacity?: number;
  commission_rate?: number;
  vehicle_type?: string;
  vehicle_number?: string;
  avatar_url?: string;
  email_verified?: boolean;
  phone_verified?: boolean;
}

/** Public users table record */
export interface PublicUser {
  user_id: string; // UUID, references auth.users(id)
  email: string;
  full_name: string | null;
  phone: string | null;
  account_type: AccountTypeArray; // text[] column: ['user', 'seller']
  location: Json | null; // JSONB object with address details
  currency: string; // ISO currency code (USD, EGP, etc.)
  is_verified: boolean;
  is_factory: boolean;
  is_seller: boolean;
  is_middleman: boolean;
  is_delivery: boolean;
  is_customer: boolean;
  preferred_language: string; // 'en', 'ar', etc.
  theme_preference: string; // 'light', 'dark', 'system'
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

// ───────────────────────────────────────────
// 3. SELLER TYPES
// ───────────────────────────────────────────

/** Seller profile in sellers table */
export interface SellerProfile {
  user_id: string; // UUID, PK
  email: string;
  full_name: string | null;
  firstname: string | null;
  second_name: string | null;
  thirdname: string | null;
  fourth_name: string | null;
  phone: string | null;
  location: string | null;
  currency: string; // Default: 'USD'
  account_type: string; // 'seller' (single string)
  is_verified: boolean;
  latitude: number | null;
  longitude: number | null;
  is_factory: boolean; // FALSE for sellers
  is_middleman: boolean; // FALSE for pure sellers
  factory_license_url: string | null;
  min_order_quantity: number; // Default: 1
  wholesale_discount: number; // Default: 0
  accepts_returns: boolean; // Default: true
  production_capacity: string | null;
  verified_at: string | null;
  allow_product_chats: boolean;
  allow_custom_requests: boolean;
  avatar_url: string | null;
  bio: string | null;
  response_rate: number | null;
  website_url: string | null;
  created_at: string;
  updated_at: string;
}

/** Seller signup form data */
export interface SellerSignupFormData {
  businessName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  location: string;
  currency?: string; // Optional currency selection
}

/** Seller signup response from RPC */
export interface SellerSignupResponse {
  success: boolean;
  user_id?: string;
  account_type?: AccountTypeArray; // ['user', 'seller']
  message?: string;
  error?: string;
}

/** Seller dashboard KPIs */
export interface SellerDashboardKPIs {
  totalRevenue: number;
  totalOrders: number;
  totalItemsSold: number;
  totalCustomers: number;
  uniqueCustomersInPeriod: number;
  averageOrderValue: number;
  conversionRate: number;
  topProducts: Array<{
    id: string;
    name: string;
    timesSold: number;
    unitsSold: number;
    revenue: number;
  }>;
  topCustomers: Array<{
    id: string;
    name: string;
    phone: string;
    ordersInPeriod: number;
    spentInPeriod: number;
  }>;
  dailyBreakdown: Array<{
    date: string;
    sales: number;
    revenue: number;
  }>;
}

// ───────────────────────────────────────────
// 4. FACTORY TYPES
// ───────────────────────────────────────────

/** Factory profile in sellers table (is_factory = true) */
export interface FactoryProfile {
  user_id: string; // UUID, PK
  email: string;
  full_name: string | null;
  phone: string | null;
  location: string | null;
  currency: string;
  account_type: string; // 'factory'
  is_verified: boolean;
  is_factory: boolean; // TRUE for factories
  production_capacity: number | null; // Units per month
  specialization: string | null; // e.g., 'textiles', 'electronics'
  min_order_quantity: number;
  wholesale_discount: number;
  company_name: string | null;
  website_url: string | null;
  bio: string | null;
  avatar_url: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Factory signup form data */
export interface FactorySignupFormData {
  companyName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  location: string;
  specialization: string;
  productionCapacity: string;
}

/** Factory signup response from RPC */
export interface FactorySignupResponse {
  success: boolean;
  user_id?: string;
  account_type?: AccountTypeArray; // ['user', 'factory']
  message?: string;
  error?: string;
}

/** Factory production log */
export interface ProductionLog {
  id: string; // UUID, PK
  order_id: string | null; // FK to orders(id)
  status: ProductionStatus;
  notes: string | null;
  created_at: string;
  created_by: string | null; // FK to auth.users(id)
  updated_at: string | null;
  production_started_at: string | null;
  quality_check_at: string | null;
  production_completed_at: string | null;
}

/** Factory connection status */
export type FactoryConnectionStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "blocked";

/** Factory connection record */
export interface FactoryConnection {
  id: string; // UUID, PK
  factory_id: string; // FK to sellers(user_id)
  seller_id: string; // FK to sellers(user_id)
  status: FactoryConnectionStatus;
  requested_at: string;
  accepted_at: string | null;
  rejected_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ───────────────────────────────────────────
// 5. MIDDLEMAN TYPES
// ───────────────────────────────────────────

/** Middleman profile in middle_men table */
export interface MiddlemanProfile {
  id: string; // UUID, PK
  user_id: string; // FK to auth.users(id)
  commission_rate: number; // Default: 5 (percent)
  total_earnings: number; // Default: 0
  pending_earnings: number; // Default: 0
  is_verified: boolean;
  specialization: string | null; // e.g., 'electronics', 'fashion'
  created_at: string;
  updated_at: string;
}

/** Middleman signup form data */
export interface MiddlemanSignupFormData {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  company_name: string;
  location: string;
  currency: string;
  commission_rate: number;
  specialization: string;
  website_url: string;
  description: string;
  tax_id: string;
  years_of_experience: string;
  preferred_language: string;
  theme_preference: string;
}

/** Middleman signup response from RPC */
export interface MiddlemanSignupResponse {
  success: boolean;
  user_id?: string;
  account_type?: AccountTypeArray; // ['user', 'middleman']
  message?: string;
  error?: string;
}

/** Middleman deal record */
export interface MiddlemanDeal {
  id: string; // UUID, PK
  middle_man_id: string; // FK to auth.users(id)
  product_asin: string; // Product ASIN
  product_id: string | null; // FK to products(id)
  seller_id: string | null; // FK to auth.users(id)
  commission_rate: number; // Percentage commission
  margin_amount: number; // Fixed margin amount
  unique_slug: string; // e.g., 'mm-abc123-prod456'
  clicks: number; // Default: 0
  conversions: number; // Default: 0
  total_revenue: number; // Default: 0
  is_active: boolean; // Default: true
  approval_status: ApprovalStatus; // Default: 'auto_approved'
  expires_at: string | null;
  promo_tags: string[]; // Default: []
  last_price_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Commission record */
export interface Commission {
  id: string; // UUID, PK
  middle_man_id: string; // FK to auth.users(id)
  order_id: string | null; // FK to orders(id)
  deal_id: string | null; // FK to middle_man_deals(id)
  amount: number;
  commission_rate: number;
  status: CommissionStatus;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** Marketplace product for middleman discovery */
export interface MarketplaceProduct {
  asin: string;
  title: string;
  description: string | null;
  price: number;
  images: Json | null;
  seller_id: string;
  seller_name: string | null;
  seller_rating: number;
  stock_quantity: number;
  category: string | null;
  is_local_brand: boolean | null;
}

/** Deal creation response from RPC */
export interface DealCreationResponse {
  success: boolean;
  deal_id: string;
  promo_slug: string;
  share_url: string;
  product_title: string;
  original_price: number;
  estimated_earnings: number;
  error?: string;
}

// ───────────────────────────────────────────
// 6. CUSTOMER TYPES
// ───────────────────────────────────────────

/** Customer signup form data */
export interface CustomerSignupFormData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}

/** Customer profile */
export interface CustomerProfile {
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  account_type: AccountTypeArray; // ['user', 'customer']
  created_at: string;
  updated_at: string;
}

// ───────────────────────────────────────────
// 7. DELIVERY TYPES
// ───────────────────────────────────────────

/** Delivery driver profile */
export interface DeliveryProfile {
  id: string; // UUID, PK
  user_id: string; // FK to auth.users(id)
  vehicle_type: string; // 'motorcycle', 'car', 'van', 'truck'
  vehicle_number: string | null;
  license_url: string | null;
  license_verified: boolean;
  status: string; // 'pending_verification', 'active', 'suspended'
  total_deliveries: number; // Default: 0
  rating: number | null;
  created_at: string;
  updated_at: string;
}

/** Delivery signup form data */
export interface DeliverySignupFormData {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  vehicle_type: string;
  vehicle_number: string;
}

// ───────────────────────────────────────────
// 8. GENERIC SIGNUP TYPES
// ───────────────────────────────────────────

/** Generic role signup response */
export interface RoleSignupResponse {
  success: boolean;
  user_id?: string;
  account_type?: AccountTypeArray;
  message?: string;
  error?: string;
}

/** Signup metadata for Supabase auth */
export interface SignupMetadata {
  phone?: string;
  location?: string;
  currency?: string;
  vehicle_type?: string;
  vehicle_number?: string;
  production_capacity?: string;
  min_order_quantity?: number;
  commission_rate?: number;
}

// ───────────────────────────────────────────
// 9. RPC FUNCTION ARGUMENT TYPES
// ───────────────────────────────────────────

/** Arguments for seller_signup RPC */
export type SellerSignupRPCArgs = {
  p_email: string;
  p_password: string;
  p_full_name: string;
  p_phone: string | null;
  p_location: string | null;
  p_currency: string;
};

/** Arguments for factory_signup RPC */
export type FactorySignupRPCArgs = {
  p_email: string;
  p_password: string;
  p_full_name: string;
  p_phone: string | null;
  p_location: string | null;
  p_currency: string;
  p_company_name: string | null;
  p_specialization: string | null;
  p_production_capacity: number | null;
};

/** Arguments for middleman_signup RPC */
export type MiddlemanSignupRPCArgs = {
  p_email: string;
  p_password: string;
  p_full_name: string;
  p_phone: string | null;
  p_location: string | null;
  p_currency: string;
  p_commission_rate: number;
  p_specialization: string | null;
};

/** Arguments for get_marketplace_products_for_middlemen RPC */
export type GetMarketplaceProductsArgs = {
  p_category: string | null;
  p_min_price: number;
  p_max_price: number;
  p_min_stock: number;
  p_limit: number;
  p_offset: number;
};

/** Arguments for claim_and_create_promo_deal RPC */
export type ClaimAndCreatePromoDealArgs = {
  p_product_asin: string;
  p_margin_type: string; // 'percentage' or 'fixed'
  p_margin_value: number;
  p_expires_days: number;
  p_promo_tags: string[];
};

// ───────────────────────────────────────────
// 10. WALLET TYPES
// ───────────────────────────────────────────

/** User wallet record */
export interface UserWallet {
  user_id: string; // UUID, PK
  balance: number; // Default: 0
  pending_balance: number; // Default: 0
  total_earned: number; // Default: 0
  total_spent: number; // Default: 0
  currency: string;
  last_transaction_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Wallet transaction */
export interface WalletTransaction {
  id: string; // UUID, PK
  user_id: string; // FK to auth.users(id)
  transaction_type:
    | "credit"
    | "debit"
    | "payment"
    | "commission"
    | "payout"
    | "fee";
  amount: number;
  description: string | null;
  balance_after: number;
  order_id: string | null;
  commission_id: string | null;
  created_at: string;
}

// ───────────────────────────────────────────
// 11. DATABASE TABLE MAPPINGS
// ───────────────────────────────────────────

/** Map account types to their primary tables */
export const ROLE_TABLE_MAPPING: Record<AccountType, string[]> = {
  customer: ["users", "customers"],
  seller: ["users", "sellers"],
  factory: ["users", "sellers"], // sellers.is_factory = true
  middleman: ["users", "sellers", "middle_men"],
  delivery: ["users", "delivery_profiles"],
  admin: ["users"],
};

/** Account type values stored in users.account_type array */
export const USER_ACCOUNT_TYPE_VALUES: Record<AccountType, AccountTypeArray> = {
  customer: ["user", "customer"],
  seller: ["user", "seller"],
  factory: ["user", "factory"],
  middleman: ["user", "middleman"],
  delivery: ["user", "delivery"],
  admin: ["user", "admin"],
};

/** Account type string stored in sellers.account_type */
export const SELLER_ACCOUNT_TYPE_VALUES: Record<AccountType, string> = {
  seller: "seller",
  factory: "factory",
  middleman: "middleman",
  customer: "customer",
  delivery: "delivery",
  admin: "admin",
};

// ───────────────────────────────────────────
// 12. VALIDATION TYPES
// ───────────────────────────────────────────

/** Form validation errors */
export type FormErrors<T extends string> = {
  [K in T]?: string;
};

/** Password validation result */
export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
  strength: "weak" | "fair" | "strong" | "very_strong";
}

/** Email validation result */
export interface EmailValidation {
  isValid: boolean;
  error?: string;
}

// ───────────────────────────────────────────
// 13. EXPORT ALL FROM DATABASE TYPES
// ───────────────────────────────────────────

// Re-export base Database type for convenience
export type { Database, Json };

// Export all table row types from Database
export type UserRow = Database["public"]["Tables"]["users"]["Row"];
export type SellerRow = Database["public"]["Tables"]["sellers"]["Row"];
export type MiddleManDealRow =
  Database["public"]["Tables"]["middle_man_deals"]["Row"];
export type CommissionRow = Database["public"]["Tables"]["commissions"]["Row"];
export type MessageRow = Database["public"]["Tables"]["messages"]["Row"];
