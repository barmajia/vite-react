import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
}

export interface ServiceListing {
  id: string;
  provider_id: string;
  title: string;
  slug: string;
  category_slug: string | null;
  price_numeric: number | null;
  description: string | null;
  created_at: string;
}

export const useServices = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all categories
  const getCategories = useCallback(async (): Promise<ServiceCategory[]> => {
    try {
      const { data, error } = await supabase
        .from("svc_categories")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      setError(err.message);
      return [];
    }
  }, []);

  // Fetch all listings
  const getListings = useCallback(async (): Promise<ServiceListing[]> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("svc_listings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch listings by category
  const getListingsByCategory = useCallback(
    async (categorySlug: string): Promise<ServiceListing[]> => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("svc_listings")
          .select("*")
          .eq("category_slug", categorySlug)
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (err: any) {
        setError(err.message);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Get listing by slug
  const getListingBySlug = useCallback(
    async (slug: string): Promise<ServiceListing | null> => {
      try {
        const { data, error } = await supabase
          .from("svc_listings")
          .select("*")
          .eq("slug", slug)
          .single();

        if (error) throw error;
        return data;
      } catch (err: any) {
        setError(err.message);
        return null;
      }
    },
    [],
  );

  // Create a service listing
  const createListing = useCallback(
    async (
      title: string,
      slug: string,
      categorySlug: string,
      price: number | null,
      description: string | null,
    ) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("You must be logged in");

        const { data, error } = await supabase
          .from("svc_listings")
          .insert({
            provider_id: user.id,
            title,
            slug,
            category_slug: categorySlug,
            price_numeric: price,
            description,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (err: any) {
        setError(err.message);
        return null;
      }
    },
    [],
  );

  // Update a service listing
  const updateListing = useCallback(
    async (
      listingId: string,
      updates: {
        title?: string;
        price_numeric?: number | null;
        description?: string | null;
      },
    ) => {
      try {
        const { data, error } = await supabase
          .from("svc_listings")
          .update(updates)
          .eq("id", listingId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (err: any) {
        setError(err.message);
        return null;
      }
    },
    [],
  );

  // Delete a service listing
  const deleteListing = useCallback(async (listingId: string) => {
    try {
      const { error } = await supabase
        .from("svc_listings")
        .delete()
        .eq("id", listingId);

      if (error) throw error;
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, []);

  return {
    // Data fetching
    getCategories,
    getListings,
    getListingsByCategory,
    getListingBySlug,
    // Actions
    createListing,
    updateListing,
    deleteListing,
    // State
    loading,
    error,
  };
};
