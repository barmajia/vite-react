import { ShoppingBag, DollarSign, Heart, TrendingUp, Package, MessageSquare } from 'lucide-react';
import type { AccountType } from '@/types/profile';

interface StatsCardsProps {
  stats: {
    orders: {
      totalOrders: number;
      pendingOrders: number;
      completedOrders: number;
      totalSpent: number;
      totalEarned: number;
    };
    notifications: {
      total: number;
      unread: number;
    };
    wishlist: {
      count: number;
    };
    conversations: {
      activeChats: number;
      unreadMessages: number;
    };
    analytics?: {
      totalRevenue: number;
      totalSales: number;
      totalCustomers: number;
      averageOrderValue: number;
    } | null;
  };
  accountType: AccountType;
}

export function StatsCards({ stats, accountType }: StatsCardsProps) {
  const isSeller = accountType === 'seller' || accountType === 'factory';

  const cards = [
    {
      title: isSeller ? 'Total Sales' : 'Total Orders',
      value: isSeller ? stats.orders.totalEarned.toFixed(2) : stats.orders.totalOrders.toString(),
      subValue: isSeller ? 'Gross revenue' : `${stats.orders.completedOrders} completed`,
      icon: isSeller ? DollarSign : Package,
      color: 'text-primary',
      glowColor: 'shadow-primary/20',
      bgColor: 'bg-primary/10',
    },
    {
      title: isSeller ? 'Orders' : 'Total Spent',
      value: isSeller ? stats.orders.totalOrders.toString() : stats.orders.totalSpent.toFixed(2),
      subValue: isSeller ? 'Total processed' : 'Lifetime spending',
      icon: ShoppingBag,
      color: 'text-emerald-500',
      glowColor: 'shadow-emerald-500/20',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Active Chats',
      value: stats.conversations.activeChats.toString(),
      subValue: stats.conversations.unreadMessages > 0 
        ? `${stats.conversations.unreadMessages} unread` 
        : 'All caught up',
      icon: MessageSquare,
      color: 'text-blue-500',
      glowColor: 'shadow-blue-500/20',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Wishlist',
      value: stats.wishlist.count.toString(),
      subValue: 'Saved items',
      icon: Heart,
      color: 'text-rose-500',
      glowColor: 'shadow-rose-500/20',
      bgColor: 'bg-rose-500/10',
    },
  ];

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div 
          key={card.title} 
          className="glass-card p-6 border-white/10 hover:border-white/20 transition-all duration-300 group hover:-translate-y-1 shadow-xl"
        >
          <div className="flex flex-col gap-4">
            <div className={`p-3 rounded-2xl w-fit ${card.bgColor} ${card.glowColor} shadow-lg transition-transform group-hover:scale-110`}>
              <card.icon className={`h-6 w-6 ${card.color}`} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">
                {card.title}
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-black tracking-tighter text-foreground italic">
                  {card.value}
                </p>
                {isSeller && card.title === 'Total Sales' && <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">EGP</span>}
              </div>
              <p className="text-xs font-bold text-muted-foreground mt-1 flex items-center gap-1 opacity-60">
                <TrendingUp className="h-3 w-3" />
                {card.subValue}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
