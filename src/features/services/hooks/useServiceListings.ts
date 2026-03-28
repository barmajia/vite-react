/**
 * Hook for fetching service listings
 * Simplified version - fetches related data separately to avoid join issues
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface ServiceListing {
  id: string;
  provider_id: string;
  category_id: string;
  subcategory_id: string | null;
  title: string;
  slug: string;
  description: string | null;
  price: number | null;
  price_type: "fixed" | "hourly" | "project" | null;
  currency: string | null;
  image_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceListingWithRelations extends ServiceListing {
  provider?: {
    id: string;
    provider_name: string;
    logo_url: string | null;
    is_verified: boolean;
  } | null;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  subcategory?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface ServiceListingsFilters {
  categoryId?: string;
  subcategoryId?: string;
  searchQuery?: string;
  priceMin?: number;
  priceMax?: number;
  verifiedOnly?: boolean;
  isFeatured?: boolean;
  sortBy?: "featured" | "newest" | "price_low" | "price_high";
  page?: number;
  limit?: number;
}

/**
 * Fetch service listings with optional filters
 */
export const useServiceListings = (filters: ServiceListingsFilters = {}) => {
  const {
    categoryId,
    subcategoryId,
    searchQuery,
    priceMin,
    priceMax,
    verifiedOnly,
    isFeatured,
    sortBy = "featured",
    page = 1,
    limit = 12,
  } = filters;

  return useQuery({
    queryKey: ["service-listings", { ...filters, page }],
    queryFn: async () => {
      // Step 1: Fetch listings with basic filters
      let query = supabase
        .from("svc_listings")
        .select("*")
        .eq("is_active", true);

      // Category filter
      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      // Subcategory filter
      if (subcategoryId) {
        query = query.eq("subcategory_id", subcategoryId);
      }

      // Search filter
      if (searchQuery?.trim()) {
        const searchTrimmed = searchQuery.trim();
        query = query.or(
          `title.ilike.%${searchTrimmed}%,description.ilike.%${searchTrimmed}%`,
        );
      }

      // Price filters
      if (priceMin !== undefined && priceMin > 0) {
        query = query.gte("price", priceMin);
      }
      if (priceMax !== undefined && priceMax < Number.MAX_SAFE_INTEGER) {
        query = query.lte("price", priceMax);
      }

      // Featured only (only if column exists)
      if (isFeatured) {
        // Note: is_featured column may not exist - run fix-services-missing-columns.sql to add it
        // query = query.eq("is_featured", true);
        console.warn("is_featured filter skipped - column may not exist");
      }

      // Sorting
      switch (sortBy) {
        case "featured":
          // Note: is_featured column may not exist - fallback to newest
          // query = query.order("is_featured", { ascending: false }).order("created_at", { ascending: false });
          query = query.order("created_at", { ascending: false });
          console.warn("is_featured sort skipped - column may not exist");
          break;
        case "newest":
          query = query.order("created_at", { ascending: false });
          break;
        case "price_low":
          query = query.order("price", { ascending: true, nullsFirst: false });
          break;
        case "price_high":
          query = query.order("price", { ascending: false, nullsFirst: true });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }

      // Pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data: listings, error: listingsError } = await query;

      if (listingsError) {
        console.error("Error fetching listings:", listingsError);
        throw listingsError;
      }

      if (!listings || listings.length === 0) {
        return { listings: [], total: 0, hasMore: false };
      }

      // Step 2: Fetch related data separately
      const providerIds = [
        ...new Set(listings.map((l) => l.provider_id).filter(Boolean)),
      ];
      const categoryIds = [
        ...new Set(listings.map((l) => l.category_id).filter(Boolean)),
      ];
      const subcategoryIds = [
        ...new Set(listings.map((l) => l.subcategory_id).filter(Boolean)),
      ];

      const [providers, categories, subcategories] = await Promise.all([
        providerIds.length > 0
          ? supabase
              .from("svc_providers")
              .select("id, provider_name, logo_url, is_verified")
              .in("id", providerIds)
              .then(({ data }) => data || [])
          : Promise.resolve([]),
        categoryIds.length > 0
          ? supabase
              .from("svc_categories")
              .select("id, name, slug")
              .in("id", categoryIds)
              .then(({ data }) => data || [])
          : Promise.resolve([]),
        subcategoryIds.length > 0
          ? supabase
              .from("svc_subcategories")
              .select("id, name, slug")
              .in("id", subcategoryIds)
              .then(({ data }) => data || [])
          : Promise.resolve([]),
      ]);

      // Step 3: Combine listings with related data
      const listingsWithRelations = listings.map((listing) => ({
        ...listing,
        provider: providers.find((p) => p.id === listing.provider_id) || null,
        category: categories.find((c) => c.id === listing.category_id) || null,
        subcategory:
          subcategories.find((s) => s.id === listing.subcategory_id) || null,
      }));

      // Filter verified only if requested (client-side)
      let filteredListings = listingsWithRelations;
      if (verifiedOnly) {
        filteredListings = filteredListings.filter(
          (l) => l.provider?.is_verified,
        );
      }

      return {
        listings: filteredListings as ServiceListingWithRelations[],
        total: filteredListings.length,
        hasMore: listings.length === limit,
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });
};

/**
 * Fetch a single listing by slug
 */
export const useServiceListingBySlug = (slug: string | undefined) => {
  return useQuery({
    queryKey: ["service-listing", slug],
    queryFn: async () => {
      if (!slug) return null;

      // Step 1: Fetch listing
      const { data: listing, error: listingError } = await supabase
        .from("svc_listings")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (listingError) {
        console.error("Error fetching listing:", listingError);
        throw listingError;
      }

      if (!listing) {
        return null;
      }

      // Step 2: Fetch related data
      const [provider, category, subcategory] = await Promise.all([
        listing.provider_id
          ? supabase
              .from("svc_providers")
              .select(
                "id, provider_name, logo_url, is_verified, location_city, tagline",
              )
              .eq("id", listing.provider_id)
              .single()
              .then(({ data }) => data)
          : Promise.resolve(null),
        listing.category_id
          ? supabase
              .from("svc_categories")
              .select("id, name, slug, description")
              .eq("id", listing.category_id)
              .single()
              .then(({ data }) => data)
          : Promise.resolve(null),
        listing.subcategory_id
          ? supabase
              .from("svc_subcategories")
              .select("id, name, slug, description")
              .eq("id", listing.subcategory_id)
              .single()
              .then(({ data }) => data)
          : Promise.resolve(null),
      ]);

      return {
        ...listing,
        provider: provider || null,
        category: category || null,
        subcategory: subcategory || null,
      } as ServiceListingWithRelations;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Invalidate listings cache - call after mutations
 */
export const useInvalidateListings = () => {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["service-listings"] });
    queryClient.invalidateQueries({ queryKey: ["service-listing"] });
  };
};
