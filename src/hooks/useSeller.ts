/**
 * Custom Hooks for Seller & Storefront Management
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import * as storefrontService from "@/services/storefront";
import type { Template, Seller, StoreConfig, Product, DashboardStats } from "@/services/storefront";

// ── useAuth Hook (Extended) ──────────────────────────────────────────

export const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
    return data;
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return { user, loading, signUp, signIn, signOut };
};

// ── useSeller Hook ───────────────────────────────────────────────────

export const useSeller = () => {
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSeller = useCallback(async () => {
    try {
      setLoading(true);
      const profile = await storefrontService.getSellerProfile();
      setSeller(profile);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error("Error fetching seller profile:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSeller();
  }, [fetchSeller]);

  const updateProfile = async (updates: Partial<Seller>) => {
    try {
      const updated = await storefrontService.updateSellerProfile(updates);
      setSeller(updated);
      return updated;
    } catch (err) {
      console.error("Error updating seller profile:", err);
      throw err;
    }
  };

  return { seller, loading, error, refetch: fetchSeller, updateProfile };
};

// ── useTemplates Hook ────────────────────────────────────────────────

export const useTemplates = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const data = await storefrontService.getActiveTemplates();
        setTemplates(data);
        setError(null);
      } catch (err) {
        setError(err as Error);
        console.error("Error fetching templates:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  return { templates, loading, error };
};

// ── useStoreConfig Hook ──────────────────────────────────────────────

export const useStoreConfig = (sellerSlug?: string) => {
  const [storeData, setStoreData] = useState<{
    seller: Seller;
    storeConfig: StoreConfig;
    template: Template;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!sellerSlug) {
      setLoading(false);
      return;
    }

    const fetchStoreConfig = async () => {
      try {
        setLoading(true);
        const data = await storefrontService.getStoreConfigBySlug(sellerSlug);
        setStoreData(data);
        setError(null);
      } catch (err) {
        setError(err as Error);
        console.error("Error fetching store config:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStoreConfig();
  }, [sellerSlug]);

  const updateConfig = async (customConfig: any) => {
    try {
      const updated = await storefrontService.updateStoreConfig(customConfig);
      if (storeData) {
        setStoreData({
          ...storeData,
          storeConfig: updated,
        });
      }
      return updated;
    } catch (err) {
      console.error("Error updating store config:", err);
      throw err;
    }
  };

  return { storeData, loading, error, updateConfig };
};

// ── useProducts Hook ─────────────────────────────────────────────────

export const useProducts = (mode: "seller" | "store", sellerSlug?: string) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        let data: Product[];

        if (mode === "seller") {
          data = await storefrontService.getSellerProducts();
        } else if (sellerSlug) {
          data = await storefrontService.getStoreProducts(sellerSlug);
        } else {
          data = [];
        }

        setProducts(data);
        setError(null);
      } catch (err) {
        setError(err as Error);
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [mode, sellerSlug]);

  const createProduct = async (product: Omit<Product, "id">) => {
    try {
      const newProduct = await storefrontService.createProduct(product);
      setProducts([newProduct, ...products]);
      return newProduct;
    } catch (err) {
      console.error("Error creating product:", err);
      throw err;
    }
  };

  const updateProduct = async (productId: string, updates: Partial<Product>) => {
    try {
      const updated = await storefrontService.updateProduct(productId, updates);
      setProducts(products.map(p => p.id === productId ? updated : p));
      return updated;
    } catch (err) {
      console.error("Error updating product:", err);
      throw err;
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      await storefrontService.deleteProduct(productId);
      setProducts(products.filter(p => p.id !== productId));
    } catch (err) {
      console.error("Error deleting product:", err);
      throw err;
    }
  };

  return {
    products,
    loading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
  };
};

// ── useDashboardStats Hook ───────────────────────────────────────────

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats>({
    total_orders: 0,
    total_sales: 0,
    total_products: 0,
    unique_visitors_last_30_days: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await storefrontService.getDashboardStats();
        setStats(data);
        setError(null);
      } catch (err) {
        setError(err as Error);
        console.error("Error fetching dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return { stats, loading, error };
};

// ── useRealtimeOrders Hook ───────────────────────────────────────────

export const useRealtimeOrders = (sellerId: string) => {
  const [newOrders, setNewOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!sellerId) return;

    const channel = storefrontService.subscribeToOrders(sellerId, (payload) => {
      setNewOrders(prev => [payload.new, ...prev]);
    });

    return () => {
      storefrontService.unsubscribe(channel);
    };
  }, [sellerId]);

  return { newOrders };
};

// ── useTemplateSelection Hook ────────────────────────────────────────

export const useTemplateSelection = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const selectTemplate = async (templateId: number) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const result = await storefrontService.selectTemplate(templateId);
      setSelectedTemplate(templateId);

      return result;
    } catch (err) {
      setError(err as Error);
      console.error("Error selecting template:", err);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    selectedTemplate,
    isSubmitting,
    error,
    selectTemplate,
  };
};
