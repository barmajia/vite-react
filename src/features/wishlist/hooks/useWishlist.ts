import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { Product } from '@/types/database';

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: Product;
}

export function useWishlist() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: items, isLoading } = useQuery({
    queryKey: ['wishlist', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('wishlists')
        .select(`
          *,
          product:products (
            id,
            title,
            price,
            images,
            quantity,
            category,
            seller_id
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as WishlistItem[];
    },
    enabled: !!user,
  });

  const addToWishlistMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('wishlists')
        .insert({
          user_id: user.id,
          product_id: productId,
        })
        .select(`
          *,
          product:products (
            id,
            title,
            price,
            images,
            quantity
          )
        `)
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Item already in wishlist');
        }
        throw error;
      }
      return data as WishlistItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });

  const removeFromWishlistMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });

  const toggleWishlist = async (productId: string, itemId?: string) => {
    if (itemId) {
      await removeFromWishlistMutation.mutateAsync(itemId);
      return false; // Removed
    } else {
      await addToWishlistMutation.mutateAsync(productId);
      return true; // Added
    }
  };

  const isInWishlist = (productId: string) => {
    return items?.some((item) => item.product_id === productId) || false;
  };

  return {
    items: items || [],
    isLoading,
    addToWishlist: addToWishlistMutation.mutateAsync,
    removeFromWishlist: removeFromWishlistMutation.mutateAsync,
    toggleWishlist,
    isInWishlist,
    isAdding: addToWishlistMutation.isPending,
    isRemoving: removeFromWishlistMutation.isPending,
  };
}
