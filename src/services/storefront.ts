/**
 * Seller & Storefront Services
 * Handles template selection, store configuration, and storefront data
 */

import { supabase } from "@/lib/supabase";
import type { Json } from "@/lib/database.types";

// ── Types ─────────────────────────────────────────────────────────────

export interface Template {
  id: number;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  preview_url: string | null;
  is_active: boolean;
  default_config: Json;
}

export interface StoreConfig {
  id: number;
  seller_id: string;
  template_id: number | null;
  custom_config: Json;
  merged_config: Json;
  logo_url: string | null;
  banner_image_url: string | null;
  favicon_url: string | null;
  custom_domain: string | null;
  seo_title: string | null;
  seo_description: string | null;
  social_links: Json;
}

export interface Seller {
  id: string;
  email: string;
  store_name: string;
  store_slug: string;
  display_name: string | null;
  avatar_url: string | null;
  subscription_status: string;
  current_template_id: number | null;
  is_active: boolean;
  store_status: string;
}

export interface Product {
  id: string;
  seller_id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  inventory_quantity: number;
  is_active: boolean;
  is_featured: boolean;
  category_id: number | null;
  tags: string[];
  images: Json;
  variants: Json;
}

export interface DashboardStats {
  total_orders: number;
  total_sales: number;
  total_products: number;
  unique_visitors_last_30_days: number;
}

// ── Template Services ─────────────────────────────────────────────────

/**
 * Fetch all active templates for selection
 */
export const getActiveTemplates = async (): Promise<Template[]> => {
  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .eq("is_active", true)
    .order("id");

  if (error) {
    console.error("Error fetching templates:", error);
    throw error;
  }

  return data || [];
};

/**
 * Fetch a single template by ID
 */
export const getTemplateById = async (templateId: number): Promise<Template | null> => {
  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .eq("id", templateId)
    .eq("is_active", true)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    console.error("Error fetching template:", error);
    throw error;
  }

  return data;
};

// ── Seller Profile Services ───────────────────────────────────────────

/**
 * Get current seller's profile
 */
export const getSellerProfile = async (): Promise<Seller | null> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return null;

  const { data, error } = await supabase
    .from("sellers")
    .select("*")
    .eq("id", user.user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    console.error("Error fetching seller profile:", error);
    throw error;
  }

  return data;
};

/**
 * Update seller profile
 */
export const updateSellerProfile = async (
  updates: Partial<Seller>
): Promise<Seller> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("sellers")
    .update(updates)
    .eq("id", user.user.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating seller profile:", error);
    throw error;
  }

  return data;
};

/**
 * Select template and activate store
 */
export const selectTemplate = async (
  templateId: number
): Promise<{ seller: Seller; storeConfig: StoreConfig }> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  // Start a transaction-like operation
  // 1. Update seller's current_template_id
  const { data: seller, error: sellerError } = await supabase
    .from("sellers")
    .update({ current_template_id: templateId })
    .eq("id", user.user.id)
    .select()
    .single();

  if (sellerError) {
    console.error("Error updating seller template:", sellerError);
    throw sellerError;
  }

  // 2. Create or update store config
  const { data: existingConfig } = await supabase
    .from("store_configs")
    .select("id")
    .eq("seller_id", user.user.id)
    .single();

  let storeConfig: StoreConfig;

  if (existingConfig) {
    // Update existing config
    const { data, error } = await supabase
      .from("store_configs")
      .update({ template_id: templateId })
      .eq("seller_id", user.user.id)
      .select()
      .single();

    if (error) throw error;
    storeConfig = data;
  } else {
    // Create new config
    const { data, error } = await supabase
      .from("store_configs")
      .insert({
        seller_id: user.user.id,
        template_id: templateId,
        custom_config: {},
      })
      .select()
      .single();

    if (error) throw error;
    storeConfig = data;
  }

  return { seller, storeConfig };
};

// ── Store Configuration Services ──────────────────────────────────────

/**
 * Get store configuration by seller slug (public access)
 */
export const getStoreConfigBySlug = async (
  sellerSlug: string
): Promise<{ seller: Seller; storeConfig: StoreConfig; template: Template } | null> => {
  // Fetch seller
  const { data: seller, error: sellerError } = await supabase
    .from("sellers")
    .select("*")
    .eq("store_slug", sellerSlug)
    .eq("is_active", true)
    .single();

  if (sellerError || !seller) return null;

  // Fetch store config
  const { data: storeConfig, error: configError } = await supabase
    .from("store_configs")
    .select("*")
    .eq("seller_id", seller.id)
    .single();

  if (configError || !storeConfig) return null;

  // Fetch template
  const { data: template, error: templateError } = await supabase
    .from("templates")
    .select("*")
    .eq("id", storeConfig.template_id)
    .single();

  if (templateError || !template) return null;

  return { seller, storeConfig, template };
};

/**
 * Update store custom configuration
 */
export const updateStoreConfig = async (
  customConfig: Json
): Promise<StoreConfig> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("store_configs")
    .update({ custom_config: customConfig })
    .eq("seller_id", user.user.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating store config:", error);
    throw error;
  }

  return data;
};

/**
 * Upload store logo
 */
export const uploadStoreLogo = async (
  file: File
): Promise<string> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const fileExt = file.name.split(".").pop();
  const fileName = `${user.user.id}/logo_${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("store-assets")
    .upload(fileName, file);

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from("store-assets")
    .getPublicUrl(fileName);

  // Update store config with logo URL
  await updateStoreLogoUrl(urlData.publicUrl);

  return urlData.publicUrl;
};

/**
 * Update store logo URL
 */
export const updateStoreLogoUrl = async (
  logoUrl: string
): Promise<StoreConfig> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("store_configs")
    .update({ logo_url: logoUrl })
    .eq("seller_id", user.user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ── Product Services ──────────────────────────────────────────────────

/**
 * Get products for current seller (dashboard view)
 */
export const getSellerProducts = async (): Promise<Product[]> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("seller_id", user.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching seller products:", error);
    throw error;
  }

  return data || [];
};

/**
 * Get active products for a seller's storefront (public view)
 */
export const getStoreProducts = async (
  sellerSlug: string
): Promise<Product[]> => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .eq(
      "seller_id",
      supabase
        .from("sellers")
        .select("id")
        .eq("store_slug", sellerSlug)
        .eq("is_active", true)
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching store products:", error);
    throw error;
  }

  return data || [];
};

/**
 * Create a new product
 */
export const createProduct = async (
  product: Omit<Product, "id" | "created_at" | "updated_at">
): Promise<Product> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("products")
    .insert({ ...product, seller_id: user.user.id })
    .select()
    .single();

  if (error) {
    console.error("Error creating product:", error);
    throw error;
  }

  return data;
};

/**
 * Update a product (seller can only update their own)
 */
export const updateProduct = async (
  productId: string,
  updates: Partial<Product>
): Promise<Product> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", productId)
    .eq("seller_id", user.user.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating product:", error);
    throw error;
  }

  return data;
};

/**
 * Delete a product (seller can only delete their own)
 */
export const deleteProduct = async (productId: string): Promise<void> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId)
    .eq("seller_id", user.user.id);

  if (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
};

// ── Dashboard Analytics Services ──────────────────────────────────────

/**
 * Get dashboard statistics for current seller
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("seller_dashboard_stats")
    .select("*")
    .eq("seller_id", user.user.id)
    .single();

  if (error) {
    console.error("Error fetching dashboard stats:", error);
    throw error;
  }

  return {
    total_orders: data?.total_orders || 0,
    total_sales: data?.total_sales || 0,
    total_products: data?.total_products || 0,
    unique_visitors_last_30_days: data?.unique_visitors_last_30_days || 0,
  };
};

// ── Realtime Subscriptions ────────────────────────────────────────────

/**
 * Subscribe to new orders for real-time dashboard updates
 */
export const subscribeToOrders = (
  sellerId: string,
  callback: (payload: any) => void
) => {
  const channel = supabase
    .channel(`orders:${sellerId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "orders",
        filter: `seller_id=eq.${sellerId}`,
      },
      callback
    )
    .subscribe();

  return channel;
};

/**
 * Subscribe to store config changes
 */
export const subscribeToStoreConfig = (
  sellerId: string,
  callback: (payload: any) => void
) => {
  const channel = supabase
    .channel(`store_config:${sellerId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "store_configs",
        filter: `seller_id=eq.${sellerId}`,
      },
      callback
    )
    .subscribe();

  return channel;
};

/**
 * Unsubscribe from a channel
 */
export const unsubscribe = async (channel: any) => {
  await supabase.removeChannel(channel);
};
