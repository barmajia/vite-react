import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { ShoppingCart, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui';
import { ROUTES } from '@/lib/constants';
import { CartItem } from '../components/CartItem';
import { CartSummary } from '../components/CartSummary';

export function CartPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, removeItem, updateQuantity, total, itemCount } = useCart();

  const handleCheckout = () => {
    if (!user) {
      navigate(ROUTES.LOGIN, { state: { from: { pathname: '/cart' } } });
    } else {
      navigate(ROUTES.CHECKOUT);
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
      <div className="container mx-auto px-4 py-32 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
        <div className="glass-card p-12 text-center max-w-lg rounded-3xl shadow-2xl shadow-primary/5">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-8 border border-primary/20">
            <ShoppingCart className="h-10 w-10 text-primary animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold mb-4">{t('cart.emptyTitle')}</h1>
          <p className="text-muted-foreground mb-8 text-lg">
            {t('cart.emptyDescription')}
          </p>
          <Button 
            size="lg"
            className="glass bg-primary hover:bg-primary/90 text-white rounded-2xl px-10 h-14 text-lg font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
            onClick={() => navigate(ROUTES.PRODUCTS)}
          >
            <ShoppingBag className="mr-3 h-5 w-5" />
            {t('cart.startShopping')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-32 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 animate-in fade-in slide-in-from-left duration-500">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            {t('cart.title')}
          </h1>
          <p className="text-muted-foreground text-lg font-medium flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            {itemCount} {itemCount === 1 ? t('cart.item') : t('cart.items')} {t('cart.inBag')}
          </p>
        </div>
        
        <Button 
          variant="ghost" 
          onClick={() => navigate(ROUTES.PRODUCTS)}
          className="text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all self-start md:self-auto -ml-3 md:ml-0 rounded-xl"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('cart.continueShopping')}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="glass-card rounded-[2rem] overflow-hidden border-white/10 shadow-2xl shadow-primary/5">
            <div className="p-8 space-y-8">
              {items.map((item, idx) => (
                <div key={item.productId} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                  <CartItem
                    item={item}
                    onRemove={() => handleRemove(item.productId)}
                    onQuantityChange={(qty) => handleQuantityChange(item.productId, qty)}
                  />
                  {idx < items.length - 1 && (
                    <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mt-8" />
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-4 p-6 glass rounded-2xl border-primary/10">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
              <ShoppingBag className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              {t('cart.freeShippingBadge')}
            </p>
          </div>
        </div>

        {/* Order Summary */}
        <div className="animate-in fade-in slide-in-from-right-8 duration-700">
          <div className="sticky top-28">
            <div className="glass-card rounded-[2rem] overflow-hidden border-primary/20 shadow-2xl shadow-primary/10 transition-transform duration-300 hover:scale-[1.02]">
              <div className="p-8">
                <CartSummary
                  subtotal={total}
                  itemCount={itemCount}
                  onCheckout={handleCheckout}
                />
              </div>
            </div>
            
            <div className="mt-6 flex flex-col gap-4 text-center">
              <p className="text-xs text-muted-foreground px-8 leading-relaxed">
                {t('cart.termsNotice')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
