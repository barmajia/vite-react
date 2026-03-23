// src/services/profileService.ts
import { supabase } from "@/lib/supabase";
import type {
  PublicProfile,
  ProfileSearchResult,
  ProfileSearchParams,
} from "@/types/public-profile";

export const profileService = {
  /**
   * Get public profile by user ID
   */
  getPublicProfile: async (userId: string): Promise<PublicProfile | null> => {
    const { data, error } = await supabase.rpc("get_public_profile", {
      p_user_id: userId,
    });

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }

    return data?.[0] || null;
  },

  /**
   * Search public profiles by type
   */
  searchProfiles: async (
    params: ProfileSearchParams,
  ): Promise<ProfileSearchResult[]> => {
    const { data, error } = await supabase.rpc("search_public_profiles", {
      p_search_term: params.search_term || null,
      p_account_type: params.account_type || null,
      p_location: params.location || null,
      p_limit: params.limit || 20,
      p_offset: params.offset || 0,
    });

    if (error) {
      console.error("Error searching profiles:", error);
      return [];
    }

    return data || [];
  },

  /**
   * Get factories only
   */
  getFactories: async (params?: {
    search_term?: string;
    location?: string;
    limit?: number;
  }): Promise<ProfileSearchResult[]> => {
    return profileService.searchProfiles({
      ...params,
      account_type: "factory",
      limit: params?.limit || 20,
    });
  },

  /**
   * Get middle men only
   */
  getMiddleMen: async (params?: {
    search_term?: string;
    location?: string;
    limit?: number;
  }): Promise<ProfileSearchResult[]> => {
    return profileService.searchProfiles({
      ...params,
      account_type: "middleman" as any,
      limit: params?.limit || 20,
    });
  },

  /**
   * Get sellers only
   */
  getSellers: async (params?: {
    search_term?: string;
    location?: string;
    limit?: number;
  }): Promise<ProfileSearchResult[]> => {
    return profileService.searchProfiles({
      ...params,
      account_type: "seller",
      limit: params?.limit || 20,
    });
  },

  /**
   * Get user's products
   */
  getUserProducts: async (
    userId: string,
    limit: number = 20,
  ): Promise<any[]> => {
    const { data, error } = await supabase
      .from("products")
      .select("id, asin, title, price, quantity, images, status, category")
      .eq("seller_id", userId)
      .or("status.eq.active,is_deleted.is.null")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching products:", error);
      return [];
    }

    return data || [];
  },
};
