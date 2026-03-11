import { useFactoryAnalytics } from '../hooks/useFactoryAnalytics';
import { FactoryDashboardStats } from './StatCard';
import { SalesChart } from './SalesChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Generate mock chart data based on analytics
const generateChartData = (totalRevenue: number, totalOrders: number) => {
  const days = 30;
  const avgRevenue = totalRevenue / days;
  const avgOrders = totalOrders / days;

  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));

    // Add some randomness
    const revenue = avgRevenue * (0.5 + Math.random());
    const orders = Math.floor(avgOrders * (0.5 + Math.random()));

    return {
      date: date.toISOString(),
      revenue: Math.round(revenue),
      orders,
    };
  });
};

export const FactoryDashboard = () => {
  const period = 30;
  const { analytics, isLoading } = useFactoryAnalytics(period);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  const chartData = generateChartData(analytics.totalRevenue, analytics.totalOrders);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <FactoryDashboardStats analytics={analytics} />

      {/* Charts */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue Trend</TabsTrigger>
          <TabsTrigger value="orders">Orders Trend</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Over Time (Last {period} Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <SalesChart
                data={chartData.map((d) => ({
                  date: d.date,
                  revenue: d.revenue,
                  orders: d.orders,
                }))}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Orders Over Time (Last {period} Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <SalesChart
                data={chartData.map((d) => ({
                  date: d.date,
                  revenue: d.orders,
                  orders: d.orders,
                }))}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Order Completion Rate</p>
              <p className="text-2xl font-bold">
                {analytics.totalOrders > 0
                  ? ((analytics.completedOrders / analytics.totalOrders) * 100).toFixed(1)
                  : 0}%
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Products in Stock</p>
              <p className="text-2xl font-bold">
                {analytics.totalProducts > 0
                  ? ((analytics.activeProducts / analytics.totalProducts) * 100).toFixed(1)
                  : 0}%
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Customer Satisfaction</p>
              <p className="text-2xl font-bold">
                {analytics.averageRating > 0
                  ? ((analytics.averageRating / 5) * 100).toFixed(0)
                  : 0}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
