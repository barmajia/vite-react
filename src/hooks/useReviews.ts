/**
 * Reviews Hook
 * 
 * Fetch and manage product reviews
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  content: string;
  is_verified_purchase: boolean;
  helpful_count: number;
  images: string[] | null;
  created_at: string;
  user_name: string;
  user_avatar: string | null;
}

export interface ReviewStats {
  average_rating: number;
  review_count: number;
  rating_breakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

interface UseReviewsOptions {
  productId: string;
  limit?: number;
  offset?: number;
  sortBy?: "created_at" | "rating" | "helpful";
  sortOrder?: "ASC" | "DESC";
}

/**
 * Get product reviews
 */
export function useReviews({
  productId,
  limit = 10,
  offset = 0,
  sortBy = "created_at",
  sortOrder = "DESC",
}: UseReviewsOptions) {
  return useQuery({
    queryKey: ["reviews", productId, { limit, offset, sortBy, sortOrder }],
    queryFn: async () => {
      if (!productId) return { reviews: [], stats: null };

      // Fetch reviews using RPC function
      const { data: reviews, error: reviewsError } = await supabase.rpc(
        "get_product_reviews",
        {
          p_product_id: productId,
          p_limit: limit,
          p_offset: offset,
          p_sort_by: sortBy,
          p_sort_order: sortOrder,
        }
      );

      if (reviewsError) throw reviewsError;

      // Fetch review stats
      const { data: stats } = await supabase
        .from("product_reviews")
        .select("rating")
        .eq("product_id", productId)
        .eq("is_approved", true);

      const statsData: ReviewStats = {
        average_rating: 0,
        review_count: 0,
        rating_breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      };

      if (stats && stats.length > 0) {
        const sum = stats.reduce((acc, r) => acc + r.rating, 0);
        statsData.average_rating = parseFloat((sum / stats.length).toFixed(2));
        statsData.review_count = stats.length;
        
        stats.forEach((r) => {
          statsData.rating_breakdown[r.rating as keyof typeof statsData.rating_breakdown]++;
        });
      }

      return {
        reviews: (reviews || []) as Review[],
        stats: statsData,
      };
    },
    enabled: !!productId,
  });
}

/**
 * Submit a new review
 */
export function useSubmitReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      rating,
      title,
      content,
      images,
    }: {
      productId: string;
      rating: number;
      title?: string;
      content: string;
      images?: string[];
    }) => {
      const { data, error } = await supabase.rpc("submit_product_review", {
        p_product_id: productId,
        p_rating: rating,
        p_title: title || null,
        p_content: content,
        p_images: images || [],
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate reviews query to refetch
      queryClient.invalidateQueries({
        queryKey: ["reviews", variables.productId],
      });
      
      toast.success("Review submitted successfully!");
    },
    onError: (error) => {
      console.error("Failed to submit review:", error);
      toast.error("Failed to submit review. Please try again.");
    },
  });
}

/**
 * Mark review as helpful
 */
export function useMarkHelpful() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await supabase.rpc("mark_review_helpful", {
        p_review_id: reviewId,
      });

      if (error) throw error;
    },
    onSuccess: (_, reviewId) => {
      // Update helpful count optimistically
      queryClient.setQueryData(["reviews"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          reviews: old.reviews.map((r: Review) =>
            r.id === reviewId
              ? { ...r, helpful_count: r.helpful_count + 1 }
              : r
          ),
        };
      });
      
      toast.success("Thanks for your feedback!");
    },
    onError: (error) => {
      console.error("Failed to mark helpful:", error);
      toast.error("Failed to mark review as helpful.");
    },
  });
}

/**
 * Check if user can review a product
 */
export function useCanReview(productId: string) {
  return useQuery({
    queryKey: ["can-review", productId],
    queryFn: async () => {
      if (!productId) return false;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Check if user already reviewed this product
      const { data: existingReview } = await supabase
        .from("product_reviews")
        .select("id")
        .eq("product_id", productId)
        .eq("user_id", user.id)
        .maybeSingle();

      return !existingReview;
    },
    enabled: !!productId,
  });
}
