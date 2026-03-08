import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Category } from '@/types/database';

/**
 * Hook to fetch categories with optional parent filtering
 */
export function useCategories(parentId?: string | null) {
  return useQuery({
    queryKey: ['categories', { parentId }],
    queryFn: async () => {
      let query = supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });

      // Filter by parent_id only if a specific value is provided
      // Note: Requires parent_id column to exist in the database
      if (parentId !== null && parentId !== undefined) {
        query = query.eq('parent_id', parentId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Category[];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

/**
 * Hook to fetch a single category by slug
 */
export function useCategoryBySlug(slug: string) {
  return useQuery({
    queryKey: ['category', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error('Category not found');
      return data as Category;
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });
}

/**
 * Hook to fetch all categories (including inactive, for admin use)
 */
export function useAllCategories() {
  return useQuery({
    queryKey: ['all-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Category[];
    },
    staleTime: 1000 * 60 * 5,
  });
}
