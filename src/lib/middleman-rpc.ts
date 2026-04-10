// Type-safe RPC wrappers for Middleman workflow
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

// RPC Function Types
type CreateDealArgs = Database["public"]["Functions"]["create_middle_man_deal"]["Args"];
type TrackClickArgs = Database["public"]["Functions"]["track_deal_click"]["Args"];
type ClaimPromoArgs = Database["public"]["Functions"]["claim_and_create_promo_deal"]["Args"];
type GetMarketplaceProductsArgs = Database["public"]["Functions"]["get_marketplace_products_for_middlemen"]["Args"];

/**
 * Create a middle man deal for a product
 */
export const createDeal = (args: CreateDealArgs) =>
  supabase.rpc("create_middle_man_deal", args);

/**
 * Track a click on a deal link
 */
export const trackDealClick = (slug: string) =>
  supabase.rpc("track_deal_click", { p_unique_slug: slug } as TrackClickArgs);

/**
 * Claim a product and create a promotional deal
 */
export const claimPromo = (args: ClaimPromoArgs) =>
  supabase.rpc("claim_and_create_promo_deal", args);

/**
 * Get marketplace products for middle men discovery
 */
export const getMarketplaceProducts = (args: GetMarketplaceProductsArgs = {}) =>
  supabase.rpc("get_marketplace_products_for_middlemen", {
    p_category: args.p_category || null,
    p_min_price: args.p_min_price || 0,
    p_max_price: args.p_max_price || 99999,
    p_min_stock: args.p_min_stock || 5,
    p_limit: args.p_limit || 20,
    p_offset: args.p_offset || 0,
  });

// Export all RPC functions as a single object
export const middlemanRpc = {
  createDeal,
  trackDealClick,
  claimPromo,
  getMarketplaceProducts,
};
