// Middleman Deals & Commissions Types
import type { Database } from '@/lib/database.types'

// Table Types
export type MiddleManDeal = Database['public']['Tables']['middle_man_deals']['Row']
export type MiddleManDealInsert = Database['public']['Tables']['middle_man_deals']['Insert']
export type MiddleManDealUpdate = Database['public']['Tables']['middle_man_deals']['Update']

export type MiddleManProfile = Database['public']['Tables']['middle_men']['Row']
export type MiddleManProfileInsert = Database['public']['Tables']['middle_men']['Insert']

export type Commission = Database['public']['Tables']['commissions']['Row']
export type CommissionInsert = Database['public']['Tables']['commissions']['Insert']
export type CommissionStatus = Commission['status']

// RPC Function Return Types
export type MarketplaceProduct = Database['public']['Functions']['get_marketplace_products_for_middlemen']['Returns'][number]

export interface DealCreationResponse {
  success: boolean
  deal_id: string
  promo_slug: string
  share_url: string
  product_title: string
  original_price: number
  estimated_earnings: number
}

// UI Types
export type MarginType = 'percentage' | 'fixed'
export type ApprovalStatus = MiddleManDeal['approval_status']
export type DealFilter = 'all' | 'active' | 'expired' | 'archived'

// Analytics Types
export interface DealAnalytics {
  dealId: string
  slug: string
  clicks: number
  conversions: number
  conversionRate: number
  totalRevenue: number
  earnings: number
  createdAt: string
  expiresAt: string | null
}

export interface MiddlemanDashboardKPIs {
  totalEarnings: number
  pendingEarnings: number
  totalClicks: number
  totalConversions: number
  conversionRate: number
  activeDeals: number
}

// Deal Creation Form State
export interface DealCreationForm {
  productAsin: string
  marginType: MarginType
  marginValue: number
  expiresDays: number
  promoTags: string[]
}

// Proposal Types for B2B Chat
export interface DealProposalPayload {
  commission_rate: number
  min_order_quantity: number
  expires_at: string
  product_asin?: string
  margin_type: MarginType
  margin_value: number
  notes?: string
}
