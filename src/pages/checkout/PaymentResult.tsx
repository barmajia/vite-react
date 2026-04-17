import { useEffect } from 'react';
import { useCartStore } from '@/hooks/useCart';
import { CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';

export default function PaymentResult() {
  const [searchParams] = useSearchParams();
  const clearCart = useCartStore.getState().clearCart;
  const success = searchParams.get('success') === 'true';
  const cancel = searchParams.get('cancel') === 'true';

  useEffect(() => {
    if (success) {
      clearCart();
    }
  }, [success, clearCart]);

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
        <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
        <p className="text-gray-600 mb-6">Thank you for your order. You will receive a confirmation email shortly.</p>
        <div className="flex gap-4">
          <Link to="/orders" className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800">
            View Orders
          </Link>
          <Link to="/" className="flex items-center gap-2 text-gray-600 hover:text-black">
            <ArrowLeft size={16} /> Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (cancel) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <XCircle className="w-16 h-16 text-yellow-500 mb-4" />
        <h1 className="text-3xl font-bold mb-2">Payment Cancelled</h1>
        <p className="text-gray-600 mb-6">Your payment was cancelled. No charges were made.</p>
        <Link to="/checkout" className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800">
          Try Again
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      <p className="mt-4 text-gray-500">Processing...</p>
    </div>
  );
}