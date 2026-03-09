// src/types/profile.ts

export type AccountType = 'factory' | 'seller' | 'middleman' | 'customer' | 'delivery';

export type VehicleType = 'motorcycle' | 'car' | 'bicycle' | 'van' | 'truck';

export type AgeRange = 'teens' | '20s' | '30s' | '40s' | '50s' | '60s' | '70s+';

// Core user profile
export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  account_type: AccountType;
  created_at: string;
  updated_at: string;
}

// Seller/Factory profile
export interface SellerProfile {
  user_id: string;
  email: string;
  full_name: string;
  firstname: string | null;
  second_name: string | null;
  thirdname: string | null;
  fourth_name: string | null;
  phone: string | null;
  location: string | null;
  currency: string;
  account_type: string;
  is_verified: boolean;
  latitude: number | null;
  longitude: number | null;
  is_factory: boolean;
  factory_license_url: string | null;
  min_order_quantity: number;
  wholesale_discount: number | null;
  accepts_returns: boolean;
  production_capacity: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

// Middleman profile
export interface MiddlemanProfile {
  user_id: string;
  company_name: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  currency: string;
  commission_rate: number | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

// Customer profile
export interface CustomerProfile {
  id: string;
  user_id: string | null;
  name: string;
  phone: string;
  age_range: AgeRange | null;
  email: string | null;
  notes: string | null;
  total_orders: number;
  total_spent: number;
  last_purchase_date: string | null;
  created_at: string;
  updated_at: string;
}

// Delivery profile
export interface DeliveryProfile {
  user_id: string;
  vehicle_type: VehicleType | null;
  vehicle_number: string | null;
  driver_license_url: string | null;
  is_verified: boolean;
  is_active: boolean;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  total_deliveries: number;
  completed_deliveries: number;
  cancelled_deliveries: number;
  commission_rate: number | null;
  created_at: string;
  updated_at: string;
}

// Business profile (generic)
export interface BusinessProfile {
  user_id: string;
  role: AccountType;
  company_name: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  currency: string;
  is_verified: boolean;
  store_name: string | null;
  commission_rate: number | null;
  created_at: string;
  updated_at: string;
}

// Shipping address
export interface ShippingAddress {
  id: string;
  user_id: string;
  full_name: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  is_default: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

// Order summary
export interface OrderSummary {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalSpent: number;
  totalEarned: number;
}

// Notification summary
export interface NotificationSummary {
  total: number;
  unread: number;
}

// Wishlist summary
export interface WishlistSummary {
  count: number;
}

// Conversation summary
export interface ConversationSummary {
  activeChats: number;
  unreadMessages: number;
}

// Analytics summary (for sellers)
export interface AnalyticsSummary {
  totalRevenue: number;
  totalSales: number;
  totalCustomers: number;
  averageOrderValue: number;
}

// Unified profile type
export interface FullUserProfile {
  core: UserProfile;
  seller?: SellerProfile | null;
  middleman?: MiddlemanProfile | null;
  customer?: CustomerProfile | null;
  delivery?: DeliveryProfile | null;
  business?: BusinessProfile | null;
  addresses: ShippingAddress[];
  stats: {
    orders: OrderSummary;
    notifications: NotificationSummary;
    wishlist: WishlistSummary;
    conversations: ConversationSummary;
    analytics?: AnalyticsSummary | null;
  };
}
