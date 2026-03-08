import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { Product } from '@/types/database';

export interface WishlistItem {
  id: string;
  user_id: string;
  asin: string;
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

      // Fetch wishlist items (no join - table uses 'asin' text field)
      const { data, error } = await supabase
        .from('wishlist')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Fetch products separately using id (wishlist.asin = products.id)
      const asins = data.map((w) => w.asin);
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, title, price, images, quantity, category, seller_id')
        .in('id', asins);

      if (productsError) throw productsError;

      // Combine wishlist items with product data
      return data.map((item) => ({
        ...item,
        product: products?.find((p) => p.id === item.asin),
      })) as WishlistItem[];
    },
    enabled: !!user,
  });

  const addToWishlistMutation = useMutation({
    mutationFn: async (asin: string) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('wishlist')
        .insert({
          user_id: user.id,
          asin: asin,
        })
        .select()
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
        .from('wishlist')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });

  const toggleWishlist = async (asin: string, itemId?: string) => {
    if (itemId) {
      await removeFromWishlistMutation.mutateAsync(itemId);
      return false; // Removed
    } else {
      await addToWishlistMutation.mutateAsync(asin);
      return true; // Added
    }
  };

  const isInWishlist = (asin: string) => {
    return items?.some((item) => item.asin === asin) || false;
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
