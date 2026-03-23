// src/types/profile.ts
// Updated to match actual database schema

// Existing Profile Types (for backward compatibility with existing components)
// Updated to match the unified AccountType from chat.ts
export type AccountType =
  | "user"
  | "customer"
  | "seller"
  | "admin"
  | "factory"
  | "middleman"
  | "freelancer"
  | "service_provider"
  | "delivery_driver"
  | "doctor"
  | "patient"
  | "pharmacy";

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
  // Additional fields from sellers/factories tables
  location?: string | null;
  currency?: string;
  is_verified?: boolean;
  is_factory?: boolean;
  production_capacity?: string;
  min_order_quantity?: number;
  wholesale_discount?: number;
  accepts_returns?: boolean;
  factory_license_url?: string;
  verified_at?: string;
  // Delivery fields
  service_areas?: string[];
  delivery_fee?: number;
  free_delivery_threshold?: number;
  vehicle_type?: string;
  vehicle_number?: string;
  driver_license_url?: string;
  commission_rate?: number;
  rating?: number;
  total_deliveries?: number;
  completed_deliveries?: number;
  cancelled_deliveries?: number;
  is_active?: boolean;
  latitude?: number;
  longitude?: number;
}

export interface CustomerProfile {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  age_range?: string;
  email?: string;
  notes?: string;
  total_orders: number;
  total_spent: number;
  last_purchase_date?: string;
  created_at: string;
  updated_at: string;
}

export interface DeliveryProfile {
  id: string;
  user_id: string;
  service_areas?: string[];
  delivery_fee?: number;
  free_delivery_threshold?: number;
  vehicle_type?: string;
  vehicle_number?: string;
  driver_license_url?: string;
  commission_rate?: number;
  rating?: number;
  total_deliveries?: number;
  completed_deliveries?: number;
  cancelled_deliveries?: number;
  is_active?: boolean;
  is_verified?: boolean;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
}

export interface SellerProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  firstname?: string | null;
  second_name?: string | null;
  thirdname?: string | null;
  fourth_name?: string | null;
  phone: string | null;
  location: string | null;
  currency: string;
  account_type: string;
  is_verified: boolean;
  is_factory: boolean;
  factory_license_url?: string;
  min_order_quantity: number;
  wholesale_discount: number;
  accepts_returns: boolean;
  production_capacity?: string;
  verified_at?: string;
  allow_product_chats: boolean;
  allow_custom_requests: boolean;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
}

export interface FullUserProfile {
  core: UserProfile;
  seller?: SellerProfile;
  middleman?: any;
  customer?: CustomerProfile;
  delivery?: DeliveryProfile;
  business?: any;
  addresses?: any[];
  stats?: {
    orders: {
      totalOrders: number;
      pendingOrders: number;
      completedOrders: number;
      totalSpent: number;
      totalEarned: number;
    };
    notifications: {
      total: number;
      unread: number;
    };
    wishlist: {
      totalItems: number;
    };
    conversations: {
      total: number;
      unread: number;
    };
    analytics: any;
  };
}

export interface ShippingAddress {
  id: string;
  user_id: string;
  full_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// Public Profile Types (for the new public profile system)
export interface PublicProfile {
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  account_type: AccountType;
  location: string | null;
  currency: string;
  is_verified: boolean;
  created_at: string;
  product_count: number;
  total_sales: number;
  total_revenue: number;
  average_rating: number;
  review_count: number;
  store_name: string | null;
  is_factory: boolean;
  is_middle_man: boolean;
  is_seller: boolean;
}

export interface ProfileSearchResult {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  account_type: string;
  location: string | null;
  is_verified: boolean;
  product_count: number;
  total_revenue: number;
  average_rating: number;
  store_name: string | null;
}

export interface ProfileSearchParams {
  search_term?: string;
  account_type?: "user" | "seller" | "factory" | "middle_man";
  location?: string;
  limit?: number;
  offset?: number;
}
