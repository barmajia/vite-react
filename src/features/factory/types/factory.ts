export type ProductionStatus =
  | 'pending'
  | 'in_production'
  | 'quality_check'
  | 'ready_to_ship'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type QuoteStatus =
  | 'pending'
  | 'quoted'
  | 'accepted'
  | 'rejected'
  | 'expired';

export interface FactoryAnalytics {
  totalRevenue: number;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  averageRating: number;
  totalReviews: number;
  totalProducts: number;
  activeProducts: number;
  revenueGrowth: number;
  orderGrowth: number;
}

export interface ProductionOrder {
  order_id: string;
  customer_name: string;
  product_title: string;
  quantity: number;
  current_status: ProductionStatus;
  production_started_at: string | null;
  production_completed_at: string | null;
  created_at: string;
}

export interface ProductionLog {
  id: string;
  order_id: string;
  status: ProductionStatus;
  notes: string | null;
  created_at: string;
  created_by: string | null;
}

export interface QuoteRequest {
  id: string;
  factory_id: string;
  buyer_id: string;
  product_id: string | null;
  quantity: number;
  target_price: number | null;
  notes: string | null;
  status: QuoteStatus;
  quoted_price: number | null;
  quoted_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  product?: {
    id: string;
    title: string;
    image_url?: string;
  };
  buyer?: {
    id: string;
    full_name: string | null;
    email?: string;
  };
}

export interface FactoryCertification {
  id: string;
  factory_id: string;
  certification_name: string;
  certification_number: string | null;
  issuing_organization: string;
  issued_date: string;
  expiry_date: string | null;
  certificate_url: string | null;
  is_verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
  created_at: string;
}

// Database table types
export type ProductionLogInsert = Omit<ProductionLog, 'id' | 'created_at'>;
export type QuoteRequestInsert = Omit<QuoteRequest, 'id' | 'created_at' | 'updated_at'>;
export type QuoteRequestUpdate = Partial<Omit<QuoteRequest, 'id' | 'created_at' | 'updated_at'>>;
export type FactoryCertificationInsert = Omit<FactoryCertification, 'id' | 'created_at' | 'is_verified' | 'verified_at' | 'verified_by'>;

// Re-export from database types for convenience
export type { FactoryConnection } from '@/types/database';
