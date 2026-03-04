import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/types/database';

export interface CartItem {
  id: string;
  user_id: string;
  asin: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  product?: Product | null;
}

interface CartStore {
  items: CartItem[];
  isLoading: boolean;
  error: string | null;
  
  fetchCart: () => Promise<void>;
  addItem: (product: Product, quantity?: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      error: null,

      fetchCart: async () => {
        set({ isLoading: true, error: null });
        try {
          const { data: { user } } = await supabase.auth.getUser();
          
          if (!user) {
            set({ items: [], isLoading: false });
            return;
          }

          const { data, error } = await supabase
            .from('cart')
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
            .eq('user_id', user.id);

          if (error) throw error;

          set({ items: data || [], isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch cart',
            isLoading: false 
          });
        }
      },

      addItem: async (product: Product, quantity: number = 1) => {
        set({ isLoading: true, error: null });
        try {
          const { data: { user } } = await supabase.auth.getUser();
          
          if (!user) {
            throw new Error('You must be signed in to add items to cart');
          }

          const existingItem = get().items.find(
            (item) => item.asin === product.id
          );

          if (existingItem) {
            await get().updateQuantity(
              product.id,
              Math.min(existingItem.quantity + quantity, product.quantity)
            );
            return;
          }

          const { data, error } = await supabase
            .from('cart')
            .insert({
              user_id: user.id,
              asin: product.id,
              quantity,
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

          if (error) throw error;

          set((state) => ({
            items: [...state.items, data],
            isLoading: false,
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to add item',
            isLoading: false 
          });
        }
      },

      removeItem: async (productId: string) => {
        set({ isLoading: true, error: null });
        try {
          const { data: { user } } = await supabase.auth.getUser();
          
          if (!user) {
            throw new Error('You must be signed in');
          }

          const { error } = await supabase
            .from('cart')
            .delete()
            .eq('user_id', user.id)
            .eq('asin', productId);

          if (error) throw error;

          set((state) => ({
            items: state.items.filter((item) => item.asin !== productId),
            isLoading: false,
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to remove item',
            isLoading: false 
          });
        }
      },

      updateQuantity: async (productId: string, quantity: number) => {
        if (quantity <= 0) {
          await get().removeItem(productId);
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const { data: { user } } = await supabase.auth.getUser();
          
          if (!user) {
            throw new Error('You must be signed in');
          }

          const { error } = await supabase
            .from('cart')
            .update({ quantity })
            .eq('user_id', user.id)
            .eq('asin', productId);

          if (error) throw error;

          set((state) => ({
            items: state.items.map((item) =>
              item.asin === productId ? { ...item, quantity } : item
            ),
            isLoading: false,
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update quantity',
            isLoading: false 
          });
        }
      },

      clearCart: async () => {
        set({ isLoading: true, error: null });
        try {
          const { data: { user } } = await supabase.auth.getUser();
          
          if (!user) {
            set({ items: [], isLoading: false });
            return;
          }

          const { error } = await supabase
            .from('cart')
            .delete()
            .eq('user_id', user.id);

          if (error) throw error;

          set({ items: [], isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to clear cart',
            isLoading: false 
          });
        }
      },

      getTotal: () => {
        return get().items.reduce(
          (total, item) => total + (item.product?.price ?? 0) * item.quantity,
          0
        );
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'aurora-cart-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
);

export const useCart = () => {
  const store = useCartStore();
  
  return {
    items: store.items,
    isLoading: store.isLoading,
    error: store.error,
    total: store.getTotal(),
    itemCount: store.getItemCount(),
    fetchCart: store.fetchCart,
    addItem: store.addItem,
    removeItem: store.removeItem,
    updateQuantity: store.updateQuantity,
    clearCart: store.clearCart,
  };
};
