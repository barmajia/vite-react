import { TrendingUp, TrendingDown, Package, ShoppingCart, Star, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  description?: string;
}

export const StatCard = ({ title, value, change, icon, description }: StatCardProps) => {
  const isPositive = change && change >= 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className="flex items-center gap-1 text-xs mt-1">
            {isPositive ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
              {isPositive ? '+' : ''}{change.toFixed(1)}%
            </span>
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

interface FactoryDashboardStatsProps {
  analytics: {
    totalRevenue: number;
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    averageRating: number;
    totalReviews: number;
    totalProducts: number;
    activeProducts: number;
    revenueGrowth: number;
    orderGrowth: number;
  };
}

export const FactoryDashboardStats = ({ analytics }: FactoryDashboardStatsProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Revenue"
        value={`$${analytics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        change={analytics.revenueGrowth}
        icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        description="Last 30 days"
      />
      <StatCard
        title="Total Orders"
        value={analytics.totalOrders}
        change={analytics.orderGrowth}
        icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
        description={`${analytics.completedOrders} completed, ${analytics.pendingOrders} pending`}
      />
      <StatCard
        title="Average Rating"
        value={`${analytics.averageRating.toFixed(1)} / 5.0`}
        icon={<Star className="h-4 w-4 text-muted-foreground" />}
        description={`${analytics.totalReviews} reviews`}
      />
      <StatCard
        title="Products"
        value={`${analytics.activeProducts} / ${analytics.totalProducts}`}
        icon={<Package className="h-4 w-4 text-muted-foreground" />}
        description="Active products"
      />
    </div>
  );
};
