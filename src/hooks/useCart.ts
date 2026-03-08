import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  quantity: number;
  // Snapshot of product data
  name: string;
  price: number;
  salePrice?: number | null;
  image_url?: string | null;
  slug?: string;
  stock_quantity?: number;
}

interface CartSummary {
  subtotal: number;
  itemCount: number;
  estimatedTotal: number;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  addItem: (product: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  setOpen: (open: boolean) => void;

  // Computed
  getSummary: () => CartSummary;
  getItemCount: () => number;
  isInCart: (productId: string) => boolean;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      isLoading: false,
      error: null,

      addItem: (product) => {
        set((state) => {
          const existing = state.items.find((i) => i.productId === product.productId);
          
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === product.productId
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            };
          }
          
          return {
            items: [...state.items, { ...product, quantity: 1 }],
          };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        if (quantity < 1) {
          return get().removeItem(productId);
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      setOpen: (open) => set({ isOpen: open }),

      getSummary: () => {
        const { items } = get();
        return items.reduce(
          (summary, item) => {
            const price = item.salePrice ?? item.price;
            summary.subtotal += price * item.quantity;
            summary.itemCount += item.quantity;
            return summary;
          },
          { subtotal: 0, itemCount: 0, estimatedTotal: 0 } as CartSummary
        );
      },

      getItemCount: () => {
        return get().items.reduce((sum, i) => sum + i.quantity, 0);
      },

      isInCart: (productId) => {
        return get().items.some((i) => i.productId === productId);
      },
    }),
    {
      name: 'aurora-cart-storage',
    }
  )
);

export const useCart = () => {
  const store = useCartStore();

  return {
    items: store.items,
    isOpen: store.isOpen,
    isLoading: store.isLoading,
    error: store.error,
    total: store.getSummary().subtotal,
    itemCount: store.getItemCount(),
    addItem: store.addItem,
    removeItem: store.removeItem,
    updateQuantity: store.updateQuantity,
    clearCart: store.clearCart,
    toggleCart: store.toggleCart,
    setOpen: store.setOpen,
    isInCart: store.isInCart,
  };
};
