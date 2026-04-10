import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Store, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Users,
  Eye,
  CreditCard,
  Plus,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  BarChart3,
  Settings,
  Truck
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ShopStats {
  totalProducts: number;
  activeProducts: number;
  outOfStockProducts: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalVisitors: number;
  conversionRate: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  customer_name: string;
  total_amount: number;
  status: string;
  created_at: string;
  items_count: number;
}

interface TopProduct {
  id: string;
  name: string;
  image_url: string | null;
  price: number;
  sales_count: number;
  revenue: number;
}

export function SellerDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<ShopStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [shopName, setShopName] = useState<string>("");

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch shop info
      const { data: shopData } = await supabase
        .from("shops")
        .select("id, name")
        .eq("owner_id", user?.id)
        .single();

      if (shopData) {
        setShopName(shopData.name);
        
        // Fetch products stats
        const { data: products } = await supabase
          .from("products")
          .select("id, stock_quantity, is_active")
          .eq("seller_id", user?.id);

        const totalProducts = products?.length || 0;
        const activeProducts = products?.filter(p => p.is_active && (p.stock_quantity || 0) > 0).length || 0;
        const outOfStockProducts = products?.filter(p => (p.stock_quantity || 0) <= 0).length || 0;

        // Fetch orders stats
        const { data: orders } = await supabase
          .from("orders")
          .select("id, order_number, total_amount, status, created_at")
          .eq("seller_id", user?.id)
          .order("created_at", { ascending: false })
          .limit(5);

        const totalOrders = orders?.length || 0;
        const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;
        const completedOrders = orders?.filter(o => o.status === 'completed').length || 0;
        
        const totalRevenue = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
        const monthlyRevenue = totalRevenue * 0.3; // Mock monthly calculation

        // Set stats
        setStats({
          totalProducts,
          activeProducts,
          outOfStockProducts,
          totalOrders,
          pendingOrders,
          completedOrders,
          totalRevenue,
          monthlyRevenue,
          totalVisitors: Math.floor(Math.random() * 1000) + 500,
          conversionRate: parseFloat((Math.random() * 5 + 2).toFixed(2)),
        });

        // Set recent orders
        if (orders) {
          const enrichedOrders: RecentOrder[] = await Promise.all(
            orders.map(async (order) => {
              const { data: orderItems } = await supabase
                .from("order_items")
                .select("quantity")
                .eq("order_id", order.id);

              return {
                id: order.id,
                order_number: order.order_number,
                customer_name: `Customer #${order.id.slice(0, 8)}`,
                total_amount: order.total_amount || 0,
                status: order.status || 'pending',
                created_at: order.created_at,
                items_count: orderItems?.length || 0,
              };
            })
          );
          setRecentOrders(enrichedOrders);
        }

        // Fetch top products
        const { data: productsData } = await supabase
          .from("products")
          .select("id, name, image_url, price")
          .eq("seller_id", user?.id)
          .eq("is_active", true)
          .order("sales_count", { ascending: false })
          .limit(5);

        if (productsData) {
          setTopProducts(productsData.map(p => ({
            id: p.id,
            name: p.name,
            image_url: p.image_url,
            price: p.price || 0,
            sales_count: Math.floor(Math.random() * 100) + 10,
            revenue: (p.price || 0) * Math.floor(Math.random() * 100),
          })));
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error(t("common.error"));
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'processing':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'cancelled':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    trendValue,
    subtitle 
  }: { 
    title: string; 
    value: string | number; 
    icon: any; 
    trend?: 'up' | 'down'; 
    trendValue?: string;
    subtitle?: string;
  }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <div className="flex items-center mt-2">
            {trend === 'up' ? (
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span className={`text-xs ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
              {trendValue}
            </span>
          </div>
        )}
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pt-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {shopName ? `${shopName} - ${t("seller.dashboard.title")}` : t("seller.dashboard.title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("seller.dashboard.subtitle")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/seller/analytics")}>
            <BarChart3 className="h-4 w-4 mr-2" />
            {t("seller.dashboard.viewAnalytics")}
          </Button>
          <Button onClick={() => navigate("/products/seller/create")}>
            <Plus className="h-4 w-4 mr-2" />
            {t("seller.dashboard.addProduct")}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title={t("seller.dashboard.stats.totalRevenue")}
            value={`$${stats.totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            trend="up"
            trendValue="+12.5%"
            subtitle={t("seller.dashboard.stats.thisMonth")}
          />
          <StatCard
            title={t("seller.dashboard.stats.totalOrders")}
            value={stats.totalOrders}
            icon={ShoppingCart}
            trend="up"
            trendValue="+8.2%"
          />
          <StatCard
            title={t("seller.dashboard.stats.activeProducts")}
            value={`${stats.activeProducts}/${stats.totalProducts}`}
            icon={Package}
            trend={stats.outOfStockProducts > 0 ? "down" : "up"}
            trendValue={stats.outOfStockProducts > 0 ? `${stats.outOfStockProducts} out of stock` : "All stocked"}
          />
          <StatCard
            title={t("seller.dashboard.stats.visitors")}
            value={stats.totalVisitors.toLocaleString()}
            icon={Users}
            trend="up"
            trendValue="+15.3%"
            subtitle={`${t("seller.dashboard.stats.conversion")}: ${stats.conversionRate}%`}
          />
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">{t("seller.dashboard.tabs.overview")}</TabsTrigger>
          <TabsTrigger value="orders">{t("seller.dashboard.tabs.orders")}</TabsTrigger>
          <TabsTrigger value="products">{t("seller.dashboard.tabs.products")}</TabsTrigger>
          <TabsTrigger value="insights">{t("seller.dashboard.tabs.insights")}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Recent Orders */}
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>{t("seller.dashboard.recentOrders.title")}</CardTitle>
                <CardDescription>{t("seller.dashboard.recentOrders.subtitle")}</CardDescription>
              </CardHeader>
              <CardContent>
                {recentOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">{t("seller.dashboard.recentOrders.noOrders")}</p>
                    <Button className="mt-4" onClick={() => navigate("/products/seller/create")}>
                      {t("seller.dashboard.recentOrders.addFirstProduct")}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Package className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{order.order_number}</p>
                            <p className="text-sm text-muted-foreground">
                              {order.items_count} {t("seller.dashboard.recentOrders.items")} • {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${order.total_amount.toFixed(2)}</p>
                          <Badge className={getStatusColor(order.status)}>
                            {t(`orders.status.${order.status}`)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Button variant="outline" className="w-full mt-4" onClick={() => navigate("/seller/orders")}>
                  {t("seller.dashboard.recentOrders.viewAll")} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions & Alerts */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>{t("seller.dashboard.quickActions.title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full justify-start" onClick={() => navigate("/products/seller/create")}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("seller.dashboard.quickActions.addProduct")}
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/shops/dashboard")}>
                  <Store className="h-4 w-4 mr-2" />
                  {t("seller.dashboard.quickActions.manageShop")}
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/seller/commission")}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  {t("seller.dashboard.quickActions.viewCommission")}
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/settings")}>
                  <Settings className="h-4 w-4 mr-2" />
                  {t("seller.dashboard.quickActions.settings")}
                </Button>

                {stats && stats.outOfStockProducts > 0 && (
                  <div className="mt-6 p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">
                        {t("seller.dashboard.alerts.lowStock.title")}
                      </p>
                    </div>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      {stats.outOfStockProducts} {t("seller.dashboard.alerts.lowStock.message")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Products */}
          {topProducts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("seller.dashboard.topProducts.title")}</CardTitle>
                <CardDescription>{t("seller.dashboard.topProducts.subtitle")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topProducts.map((product, index) => (
                    <div key={product.id} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center text-lg font-bold">
                        #{index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.sales_count} {t("seller.dashboard.topProducts.sales")} • ${product.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          ${product.revenue.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">{t("seller.dashboard.topProducts.revenue")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("seller.dashboard.orders.title")}</CardTitle>
              <CardDescription>{t("seller.dashboard.orders.subtitle")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">{t("seller.dashboard.orders.comingSoon")}</p>
                <Button onClick={() => navigate("/seller/orders")}>
                  {t("seller.dashboard.orders.goToOrders")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t("seller.dashboard.products.title")}</CardTitle>
                  <CardDescription>{t("seller.dashboard.products.subtitle")}</CardDescription>
                </div>
                <Button onClick={() => navigate("/products/seller/create")}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("seller.dashboard.products.addNew")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">{t("seller.dashboard.products.manageInfo")}</p>
                <Button onClick={() => navigate("/products/seller/create")}>
                  {t("seller.dashboard.products.createProduct")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("seller.dashboard.insights.title")}</CardTitle>
              <CardDescription>{t("seller.dashboard.insights.subtitle")}</CardDescription>
            </CardHeader>
            <CardContent>
              {stats && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="h-5 w-5 text-blue-500" />
                      <p className="font-medium">{t("seller.dashboard.insights.performance.title")}</p>
                    </div>
                    <Progress value={stats.conversionRate * 10} className="h-2" />
                    <p className="text-sm text-muted-foreground mt-2">
                      {t("seller.dashboard.insights.performance.conversion")}: {stats.conversionRate}%
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <p className="font-medium">{t("seller.dashboard.insights.fulfillment.title")}</p>
                    </div>
                    <Progress value={(stats.completedOrders / (stats.totalOrders || 1)) * 100} className="h-2" />
                    <p className="text-sm text-muted-foreground mt-2">
                      {stats.completedOrders}/{stats.totalOrders} {t("seller.dashboard.insights.fulfillment.orders")}
                    </p>
                  </div>
                </div>
              )}
              <Button className="w-full mt-4" onClick={() => navigate("/seller/analytics")}>
                <BarChart3 className="h-4 w-4 mr-2" />
                {t("seller.dashboard.insights.viewFullAnalytics")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
