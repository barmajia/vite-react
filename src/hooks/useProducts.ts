import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { sanitizeSearchQuery } from "@/utils/sanitize";
import type { Product, ProductWithDetails } from "@/types/database";

interface UseProductsOptions {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "created_at" | "price" | "title";
  sortOrder?: "asc" | "desc";
}

/**
 * Hook to fetch products with filtering, sorting, and pagination
 */
export function useProducts(options: UseProductsOptions = {}) {
  const {
    page = 1,
    limit = 20,
    search,
    category,
    brand,
    minPrice,
    maxPrice,
    sortBy = "created_at",
    sortOrder = "desc",
  } = options;

  return useQuery({
    queryKey: [
      "products",
      {
        page,
        limit,
        search,
        category,
        brand,
        minPrice,
        maxPrice,
        sortBy,
        sortOrder,
      },
    ],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select(
          `
          id,
          asin,
          title,
          description,
          price,
          quantity,
          images,
          category,
          currency,
          seller_id,
          created_at,
          average_rating,
          review_count
        `,
          { count: "exact" },
        )
        .eq("status", "active");

      // Apply filters
      if (search) {
        const safeSearch = sanitizeSearchQuery(search);
        query = query.or(
          `title.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%`,
        );
      }

      if (category) {
        query = query.eq("category", category);
      }

      if (brand) {
        query = query.eq("brand_id", brand);
      }

      if (minPrice !== undefined) {
        query = query.gte("price", minPrice);
      }

      if (maxPrice !== undefined) {
        query = query.lte("price", maxPrice);
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === "asc" });

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        products: data as unknown as ProductWithDetails[],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        currentPage: page,
      };
    },
  });
}

/**
 * Hook to fetch a single product by ASIN
 */
export function useProduct(asin: string) {
  return useQuery({
    queryKey: ["product", asin],
    queryFn: async () => {
      if (!asin) return null;

      // First fetch the product by ASIN using filter syntax
      const { data: product, error: productError } = await supabase
        .from("products")
        .select(
          `
          id,
          asin,
          title,
          description,
          price,
          quantity,
          images,
          category,
          currency,
          seller_id,
          created_at,
          average_rating,
          review_count
        `,
        )
        .filter("asin", "eq", asin)
        .maybeSingle();

      if (productError) {
        console.error("Error fetching product:", productError);
        throw productError;
      }
      if (!product) return null;

      // Then fetch reviews separately
      const { data: reviews, error: reviewsError } = await supabase
        .from("reviews")
        .select(
          `
          id,
          rating,
          comment,
          created_at,
          user_id
        `,
        )
        .filter("asin", "eq", asin)
        .order("created_at", { ascending: false });

      if (reviewsError) throw reviewsError;

      // Fetch user profiles for reviews
      let reviewsWithProfiles = reviews || [];
      if (reviewsWithProfiles.length > 0) {
        const userIds = reviewsWithProfiles.map((r) => r.user_id);
        const { data: users, error: usersError } = await supabase
          .from("users")
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds);

        if (usersError) throw usersError;

        const userMap = new Map((users || []).map((u) => [u.user_id, u]));
        reviewsWithProfiles = reviewsWithProfiles.map((review) => ({
          ...review,
          user_profile: userMap.get(review.user_id) || null,
        }));
      }

      return {
        ...product,
        reviews: reviewsWithProfiles,
      } as any;
    },
    enabled: !!asin,
  });
}

/**
 * Hook to fetch featured products
 */
export function useFeaturedProducts(limit: number = 8) {
  return useQuery({
    queryKey: ["featured-products", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as unknown as Product[];
    },
  });
}

/**
 * Hook to fetch products by category
 */
export function useProductsByCategory(categoryId: string, limit: number = 8) {
  return useQuery({
    queryKey: ["products-by-category", categoryId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("category", categoryId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as unknown as Product[];
    },
    enabled: !!categoryId,
  });
}

/**
 * Hook to fetch related products (same category, excluding current product)
 */
export function useRelatedProducts(
  categoryId: string | null,
  excludeAsin: string,
  limit: number = 4,
) {
  return useQuery({
    queryKey: ["related-products", categoryId, excludeAsin, limit],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*")
        .neq("asin", excludeAsin)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (categoryId) {
        query = query.eq("category", categoryId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as unknown as Product[];
    },
    enabled: !!excludeAsin,
  });
}

/**
 * Hook to fetch seller info by user ID
 */
export function useSeller(sellerId: string | undefined) {
  return useQuery({
    queryKey: ["seller", sellerId],
    queryFn: async () => {
      if (!sellerId) return null;

      const { data, error } = await supabase
        .from("users")
        .select("user_id, full_name, avatar_url")
        .eq("user_id", sellerId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!sellerId,
  });
}

/**
 * Hook to add a review
 */
export function useAddReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      asin,
      rating,
      comment,
    }: {
      asin: string;
      rating: number;
      comment?: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be signed in to write a review");
      }

      const { data, error } = await supabase
        .from("reviews")
        .insert({
          asin,
          user_id: user.id,
          rating,
          comment,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },
  });
}
