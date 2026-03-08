import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useCheckout } from '../hooks/useCheckout';
import { CheckoutForm } from '../components/CheckoutForm';
import { OrderReview } from '../components/OrderReview';
import { CheckoutSteps } from '../components/CheckoutSteps';
import { CartEmpty } from '@/features/cart/components/CartEmpty';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { items } = useCart();
  const {
    formData,
    updateFormData,
    placeOrder,
    isPlacing,
    error,
    subtotal,
    shipping,
    tax,
    total,
  } = useCheckout();

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto py-16">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <h2 className="text-2xl font-bold mb-4">Sign in to checkout</h2>
        <p className="text-muted-foreground mb-6">
          Please sign in to complete your purchase.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-2 bg-accent text-white rounded-md hover:opacity-90"
        >
          Sign In
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <CartEmpty />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      
      <CheckoutSteps currentStep={1} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {/* Shipping Information */}
        <div className="lg:col-span-2">
          <CheckoutForm
            formData={formData}
            updateFormData={updateFormData}
          />
        </div>

        {/* Order Review */}
        <div>
          <OrderReview
            items={items}
            subtotal={subtotal}
            shipping={shipping}
            tax={tax}
            total={total}
            isPlacing={isPlacing}
            error={error}
            onPlaceOrder={placeOrder}
          />
        </div>
      </div>
    </div>
  );
}
