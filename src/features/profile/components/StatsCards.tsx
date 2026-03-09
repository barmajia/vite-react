import { Card, CardContent } from '@/components/ui/card';
import { ShoppingBag, DollarSign, Bell, Heart, TrendingUp } from 'lucide-react';
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
      icon: ShoppingBag,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: isSeller ? 'Revenue' : 'Total Spent',
      value: (isSeller ? stats.orders.totalEarned : stats.orders.totalSpent).toFixed(2),
      icon: DollarSign,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Notifications',
      value: stats.notifications.unread > 0 
        ? `${stats.notifications.unread} new` 
        : stats.notifications.total.toString(),
      icon: Bell,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Wishlist',
      value: stats.wishlist.count.toString(),
      icon: Heart,
      color: 'text-pink-500',
      bgColor: 'bg-pink-50',
    },
  ];

  // Add analytics cards for sellers
  if (isSeller && stats.analytics) {
    cards.push(
      {
        title: 'Customers',
        value: stats.analytics.totalCustomers.toString(),
        icon: TrendingUp,
        color: 'text-purple-500',
        bgColor: 'bg-purple-50',
      },
      {
        title: 'Avg Order',
        value: `$${stats.analytics.averageOrderValue.toFixed(2)}`,
        icon: DollarSign,
        color: 'text-indigo-500',
        bgColor: 'bg-indigo-50',
      }
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="text-2xl font-bold">{card.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
