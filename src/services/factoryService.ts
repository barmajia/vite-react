// src/services/factoryService.ts
import { supabase } from "@/lib/supabase";

export interface FactorySeller {
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  location: string | null;
  is_verified: boolean;
  company_name?: string | null;
  product_count?: number;
  total_revenue?: number;
}

export interface SellerProfile {
  user_id: string;
  email: string;
  full_name: string;
  firstname: string | null;
  secoundname: string | null;
  thirdname: string | null;
  forthname: string | null;
  phone: string | null;
  location: string | null;
  currency: string;
  account_type: string;
  is_verified: boolean;
}

export const factoryService = {
  /**
   * Find factories (sellers) with search filters
   */
  findFactories: async (params: {
    search_term?: string;
    location?: string;
    is_verified?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<FactorySeller[]> => {
    let query = supabase.from("sellers").select(`
        user_id,
        email,
        full_name,
        phone,
        location,
        is_verified
      `);

    if (params.search_term) {
      query = query.or(
        `full_name.ilike.%${params.search_term}%,email.ilike.%${params.search_term}%`,
      );
    }

    if (params.location) {
      query = query.eq("location", params.location);
    }

    if (params.is_verified !== undefined) {
      query = query.eq("is_verified", params.is_verified);
    }

    if (params.limit) {
      query = query.limit(params.limit);
    }

    if (params.offset) {
      query = query.range(
        params.offset,
        params.offset + (params.limit || 20) - 1,
      );
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  /**
   * Get single factory profile
   */
  getFactoryProfile: async (userId: string): Promise<SellerProfile | null> => {
    const { data, error } = await supabase
      .from("sellers")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get factory's products
   */
  getFactoryProducts: async (sellerId: string): Promise<any[]> => {
    const { data, error } = await supabase
      .from("products")
      .select("id, asin, title, price, quantity, images, status")
      .eq("seller_id", sellerId)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get factory statistics
   */
  getFactoryStats: async (userId: string) => {
    const [productsRes, conversationsRes] = await Promise.all([
      supabase
        .from("products")
        .select("id", { count: "exact" })
        .eq("seller_id", userId),
      supabase
        .from("conversations")
        .select("id", { count: "exact" })
        .eq("seller_id", userId),
    ]);

    return {
      productCount: productsRes.count || 0,
      conversationCount: conversationsRes.count || 0,
    };
  },
};
