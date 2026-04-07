import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useOrders } from '../hooks/useOrders';
import { OrderCard } from '../components/OrderCard';
import { Button } from '@/components/ui/button';
import { Package, ShoppingBag, Sparkles, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function OrdersListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { data: orders, isLoading } = useOrders();

  if (loading || (isLoading && !orders)) {
    return (
      <div className="min-h-screen bg-background flex flex-col p-8 lg:p-12">
        <div className="max-w-5xl mx-auto w-full space-y-8">
          <div className="h-10 w-48 bg-white/5 rounded-xl animate-pulse" />
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 glass-card border-white/5 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="glass-card p-12 text-center max-w-md border-white/10 relative overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] h-32 w-32 bg-primary/10 rounded-full blur-2xl" />
          <div className="h-20 w-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-12">
            <Sparkles className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-3xl font-black tracking-tighter mb-4 italic">RESTRICTED ACCESS</h2>
          <p className="text-muted-foreground font-medium mb-8">Please authenticate to access your secure transaction history.</p>
          <Button onClick={() => navigate("/login")} className="glass bg-primary text-white font-black px-10 h-14 rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-xs">
            Sign In Now
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col py-12 px-4 sm:px-6 lg:px-8">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto w-full space-y-10 z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-white/10">
          <div className="space-y-1">
            <div className="flex items-center gap-3 text-primary mb-2">
              <ShoppingBag className="h-5 w-5" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Procurement History</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter italic bg-gradient-to-br from-foreground to-foreground/50 bg-clip-text text-transparent">
              {t("orders.myOrders") || "MY ORDERS"}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/products")}
              className="glass bg-white/5 border-white/10 h-14 px-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/10 transition-all font-sans"
            >
              <Plus className="mr-2 h-4 w-4 text-primary" />
              New Order
            </Button>
          </div>
        </header>

        {(!orders || orders.length === 0) ? (
          <div className="glass-card p-20 text-center border-white/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="h-28 w-28 glass rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl border-white/20 rotate-6 group hover:rotate-0 transition-transform duration-500">
                <Package className="w-12 h-12 text-primary opacity-40" />
              </div>
              <h2 className="text-3xl font-black tracking-tighter mb-4 uppercase italic">Archive Empty</h2>
              <p className="text-muted-foreground font-medium mb-10 max-w-sm mx-auto">
                No transactions recorded in our encrypted database yet. Initialize your first batch today.
              </p>
              <Button onClick={() => navigate("/products")} className="glass bg-primary text-white font-black px-12 h-16 rounded-2xl shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-xs">
                Start Shopping
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-8">
            {orders.map((order, idx) => (
              <div 
                key={order.id} 
                className="animate-in fade-in slide-in-from-bottom-10 duration-700 fill-mode-both"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <OrderCard order={order} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
