import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface ServiceSubcategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface ServiceProvider {
  id: string;
  user_id: string;
  provider_name: string;
  provider_type: "individual" | "company" | "hospital";
  tagline: string | null;
  description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  location_city: string | null;
  location_country: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  specialties: string[] | null;
  average_rating: number | null;
  review_count: number;
  total_jobs_completed: number;
  is_verified: boolean;
  status: string;
}

export interface ServiceListing {
  id: string;
  provider_id: string;
  subcategory_id: string | null;
  title: string;
  slug: string;
  description: string | null;
  price_type: string;
  price: number | null;
  currency: string;
  delivery_days: number | null;
  images: string[] | null;
  is_featured: boolean;
  is_active: boolean;
}

export interface ServicePortfolio {
  id: string;
  provider_id: string;
  title: string;
  description: string | null;
  images: string[] | null;
  project_url: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface ServiceReview {
  id: string;
  provider_id: string;
  listing_id: string | null;
  reviewer_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  is_verified_purchase: boolean;
  is_approved: boolean;
  created_at: string;
}

export const useServices = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all active categories
  const getCategories = useCallback(async (): Promise<ServiceCategory[]> => {
    try {
      const { data, error } = await supabase
        .from("svc_categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      setError(err.message);
      return [];
    }
  }, []);

  // Fetch all active subcategories
  const getSubcategories = useCallback(async (): Promise<
    ServiceSubcategory[]
  > => {
    try {
      const { data, error } = await supabase
        .from("svc_subcategories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      setError(err.message);
      return [];
    }
  }, []);

  // Fetch providers by category slug
  const getProvidersByCategory = useCallback(
    async (categorySlug: string): Promise<ServiceProvider[]> => {
      setLoading(true);
      try {
        // Join through listings and subcategories to filter by category
        const { data, error } = await supabase
          .from("svc_providers")
          .select(
            `
          *,
          svc_listings!inner (
            svc_subcategories (
              svc_categories (slug)
            )
          )
        `,
          )
          .eq("status", "active")
          .contains("svc_listings.svc_subcategories.svc_categories", [
            { slug: categorySlug },
          ]);

        if (error) throw error;

        // Deduplicate providers if they have multiple listings in the same category
        const uniqueProviders = Array.from(
          new Map(data?.map((item) => [item.id, item]) || []).values(),
        );

        return uniqueProviders;
      } catch (err: any) {
        setError(err.message);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Get provider by ID with full details
  const getProviderById = useCallback(
    async (id: string): Promise<ServiceProvider | null> => {
      try {
        const { data, error } = await supabase
          .from("svc_providers")
          .select(
            `
          *,
          svc_listings (*),
          svc_portfolio (*)
        `,
          )
          .eq("id", id)
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

  // Get listing by slug
  const getListingBySlug = useCallback(
    async (slug: string): Promise<ServiceListing | null> => {
      try {
        const { data, error } = await supabase
          .from("svc_listings")
          .select(
            `
          *,
          svc_providers (
            id,
            provider_name,
            logo_url,
            average_rating,
            review_count
          ),
          svc_subcategories (
            name,
            svc_categories (name)
          )
        `,
          )
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

  // Get featured providers
  const getFeaturedProviders = useCallback(
    async (limit: number = 6): Promise<ServiceProvider[]> => {
      try {
        const { data, error } = await supabase
          .from("svc_providers")
          .select("*")
          .eq("status", "active")
          .eq("is_verified", true)
          .order("average_rating", { ascending: false })
          .limit(limit);

        if (error) throw error;
        return data || [];
      } catch (err: any) {
        setError(err.message);
        return [];
      }
    },
    [],
  );

  // Search providers by query
  const searchProviders = useCallback(
    async (query: string): Promise<ServiceProvider[]> => {
      try {
        const { data, error } = await supabase
          .from("svc_providers")
          .select("*")
          .eq("status", "active")
          .or(
            `provider_name.ilike.%${query}%,tagline.ilike.%${query}%,specialties.cs.{${query}}`,
          )
          .limit(20);

        if (error) throw error;
        return data || [];
      } catch (err: any) {
        setError(err.message);
        return [];
      }
    },
    [],
  );

  // Create a service order (booking)
  const createOrder = useCallback(
    async (listingId: string, providerId: string, requirements: string) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("You must be logged in to book a service");

        const { data, error } = await supabase
          .from("svc_orders")
          .insert({
            listing_id: listingId,
            provider_id: providerId,
            customer_id: user.id,
            requirements: requirements,
            status: "pending",
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

  // Submit a review for a provider
  const submitReview = useCallback(
    async (
      providerId: string,
      listingId: string | null,
      rating: number,
      comment: string,
      title?: string,
    ) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("You must be logged in to submit a review");

        const { data, error } = await supabase
          .from("svc_reviews")
          .insert({
            provider_id: providerId,
            listing_id: listingId,
            reviewer_id: user.id,
            rating,
            comment,
            title: title || null,
            is_verified_purchase: true,
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

  return {
    // Data fetching
    getCategories,
    getSubcategories,
    getProvidersByCategory,
    getProviderById,
    getListingBySlug,
    getFeaturedProviders,
    searchProviders,
    // Actions
    createOrder,
    submitReview,
    // State
    loading,
    error,
  };
};
