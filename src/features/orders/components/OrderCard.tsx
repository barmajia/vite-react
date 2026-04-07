import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import type { Order } from '@/types/database';
import { Calendar, ChevronRight, Package, Hash } from 'lucide-react';

interface OrderCardProps {
  order: Order & {
    items?: Array<{
      id: string;
      product_id: string;
      quantity: number;
      price: number;
      title: string;
      image_url: string | null;
    }>;
  };
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  confirmed: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  processing: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  shipped: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  delivered: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  cancelled: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  refunded: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

export function OrderCard({ order }: OrderCardProps) {
  const orderDate = new Date(order.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const shortId = order.id.split('-').pop()?.substring(0, 8).toUpperCase() || '';

  return (
    <div className="glass-card p-6 border-white/10 hover:border-white/20 transition-all duration-300 group relative overflow-hidden shadow-xl">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors pointer-events-none" />
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between md:justify-start gap-4">
            <div className="flex items-center gap-2 glass px-3 py-1 rounded-lg border-white/10">
              <Hash className="h-3 w-3 text-primary opacity-60" />
              <span className="font-black tracking-tighter text-sm italic">{shortId}</span>
            </div>
            <Badge variant="outline" className={`glass px-3 py-1 font-black uppercase tracking-widest text-[9px] border-none ${statusColors[order.status] || 'bg-gray-500/10 text-gray-400'}`}>
              {statusLabels[order.status] || order.status}
            </Badge>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex -space-x-4">
              {order.items?.slice(0, 3).map((item, idx) => (
                <div 
                  key={item.id} 
                  className="w-16 h-16 glass rounded-2xl p-1 border-white/20 shadow-2xl relative bg-white/5 overflow-hidden"
                  style={{ zIndex: 3 - idx }}
                >
                  <img
                    src={item.image_url || '/placeholder.png'}
                    alt={item.title}
                    className="w-full h-full object-cover rounded-xl group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
              ))}
              {order.items && order.items.length > 3 && (
                <div className="w-16 h-16 glass rounded-2xl flex items-center justify-center text-xs font-black bg-white/10 border-white/20 shadow-2xl z-0 backdrop-blur-xl">
                  +{order.items.length - 3}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Package className="h-3.5 w-3.5 opacity-60" />
                <span className="text-xs font-bold uppercase tracking-widest">{order.items?.length || 0} ITEMS</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground/60">
                <Calendar className="h-3.5 w-3.5 opacity-40" />
                <span className="text-[10px] font-black uppercase tracking-tighter">{orderDate}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-white/5 md:pl-8 lg:pl-12 md:border-l">
          <div className="text-left md:text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 mb-1">Execution Total</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black tracking-tighter italic text-foreground">${order.total.toFixed(2)}</span>
              <span className="text-[10px] font-bold text-muted-foreground opacity-40">USD</span>
            </div>
          </div>
          
          <Link
            to={`/orders/${order.id}`}
            className="flex items-center gap-2 glass bg-white/5 px-6 py-3 rounded-xl font-bold text-xs hover:bg-primary hover:text-white transition-all group/btn shadow-inner border-white/10"
          >
            VIEW DETAILS
            <ChevronRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
