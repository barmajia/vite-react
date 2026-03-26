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
  subcategory_id: string | null;
  price: number | null;
  price_type: string | null;
  currency: string | null;
  description: string | null;
  is_active: boolean;
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch listings by subcategory
  const getListingsBySubcategory = useCallback(
    async (subcategoryId: string): Promise<ServiceListing[]> => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("svc_listings")
          .select("*")
          .eq("subcategory_id", subcategoryId)
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
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
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
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
      subcategoryId: string,
      price: number | null,
      price_type: string,
      description: string | null,
    ) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("You must be logged in");

        // Get provider_id for this user
        const { data: provider } = await supabase
          .from("svc_providers")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (!provider)
          throw new Error(
            "You must have a provider profile to create listings",
          );

        const { data, error } = await supabase
          .from("svc_listings")
          .insert({
            provider_id: provider.id,
            title,
            slug,
            subcategory_id: subcategoryId,
            price,
            price_type,
            description,
            is_active: true,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
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
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      return false;
    }
  }, []);

  return {
    // Data fetching
    getCategories,
    getListings,
    getListingsBySubcategory,
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
