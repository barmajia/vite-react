/**
 * Hook for fetching service categories with subcategories
 * Simplified version with error handling
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface ServiceSubcategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface ServiceCategoryWithSubcategories {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
  is_active: boolean;
  sort_order: number;
  subcategories: ServiceSubcategory[];
}

/**
 * Fetch all active service categories with their subcategories
 */
export const useServiceCategories = () => {
  return useQuery({
    queryKey: ["service-categories"],
    queryFn: async () => {
      // Step 1: Fetch categories
      const { data: categories, error: catError } = await supabase
        .from("svc_categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (catError) {
        console.error("Error fetching categories:", catError);
        throw catError;
      }

      if (!categories || categories.length === 0) {
        return [];
      }

      // Step 2: Fetch subcategories separately (avoids join issues)
      const categoryIds = categories.map((c) => c.id);
      const { data: subcategories, error: subError } = await supabase
        .from("svc_subcategories")
        .select("*")
        .in("category_id", categoryIds)
        .eq("is_active", true);
      // Note: sort_order column may not exist - run fix-services-missing-columns.sql to add it
      // .order("sort_order", { ascending: true });

      if (subError) {
        console.error("Error fetching subcategories:", subError);
      }

      // Step 3: Combine categories with their subcategories
      const categoriesWithSubs = categories.map((category) => ({
        ...category,
        subcategories: (subcategories || []).filter(
          (sub) => sub.category_id === category.id,
        ) as ServiceSubcategory[],
      }));

      return categoriesWithSubs as ServiceCategoryWithSubcategories[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

/**
 * Fetch a single category by slug with its subcategories
 */
export const useServiceCategoryBySlug = (slug: string | undefined) => {
  return useQuery({
    queryKey: ["service-category", slug],
    queryFn: async () => {
      if (!slug) return null;

      // Step 1: Fetch category
      const { data: category, error: catError } = await supabase
        .from("svc_categories")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (catError) {
        console.error("Error fetching category:", catError);
        throw catError;
      }

      if (!category) {
        return null;
      }

      // Step 2: Fetch subcategories for this category
      const { data: subcategories, error: subError } = await supabase
        .from("svc_subcategories")
        .select("*")
        .eq("category_id", category.id)
        .eq("is_active", true);
      // Note: sort_order column may not exist - run fix-services-missing-columns.sql to add it
      // .order("sort_order", { ascending: true });

      if (subError) {
        console.error("Error fetching subcategories:", subError);
      }

      return {
        ...category,
        subcategories: (subcategories || []) as ServiceSubcategory[],
      } as ServiceCategoryWithSubcategories;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
};
