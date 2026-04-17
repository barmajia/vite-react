import { createContext, useContext, ReactNode } from 'react';
import { useCartStore, CartItem } from '@/hooks/useCart';

const CartContext = createContext<ReturnType<typeof useCartStore> | null>(null);

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const cart = useCartStore();
  return <CartContext.Provider value={cart}>{children}</CartContext.Provider>;
};

export const useStorefrontCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useStorefrontCart must be used inside CartProvider');
  return ctx;
};