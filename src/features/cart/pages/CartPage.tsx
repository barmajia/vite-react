import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { CartItem } from '../components/CartItem';
import { CartSummary } from '../components/CartSummary';
import { CartEmpty } from '../components/CartEmpty';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function CartPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, isLoading, error, fetchCart, removeItem, updateQuantity, total, itemCount } = useCart();

  useEffect(() => {
    if (user) {
      fetchCart();
    }
  }, [user]);

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const handleRemove = async (id: string) => {
    await removeItem(id);
  };

  const handleQuantityChange = async (id: string, quantity: number) => {
    if (quantity < 1) return;
    await updateQuantity(id, quantity);
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <h2 className="text-2xl font-bold mb-4">Sign in to view your cart</h2>
        <p className="text-muted-foreground mb-6">
          Please sign in or create an account to access your shopping cart.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-accent text-white rounded-md hover:opacity-90"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="px-6 py-2 border border-border rounded-md hover:bg-muted"
          >
            Create Account
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto mt-8">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (isLoading && items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4 py-6 border-b">
                <Skeleton className="w-24 h-24 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-8 w-24" />
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
          <div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
        <CartEmpty />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart ({itemCount} items)</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-lg border p-6">
            {items.map((item) => (
              <CartItem
                key={item.asin}
                item={item}
                onRemove={handleRemove}
                onQuantityChange={handleQuantityChange}
              />
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <CartSummary
            subtotal={total}
            itemCount={itemCount}
            onCheckout={handleCheckout}
          />
        </div>
      </div>
    </div>
  );
}
