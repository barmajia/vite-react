import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { CartItem } from '../components/CartItem';
import { CartSummary } from '../components/CartSummary';
import { CartEmpty } from '../components/CartEmpty';

export function CartPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, removeItem, updateQuantity, total, itemCount } = useCart();

  const handleCheckout = () => {
    if (!user) {
      navigate('/login');
    } else {
      navigate('/checkout');
    }
  };

  const handleRemove = (productId: string) => {
    removeItem(productId);
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    updateQuantity(productId, quantity);
  };

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
                key={item.productId}
                item={item}
                onRemove={() => handleRemove(item.productId)}
                onQuantityChange={(qty) => handleQuantityChange(item.productId, qty)}
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
