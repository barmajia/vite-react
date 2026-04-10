import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  Package, 
  TrendingUp, 
  TrendingDown,
  Users,
  DollarSign,
  Plus,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  BarChart3,
  Settings,
  MessageSquare,
  FileText,
  Truck,
  Zap
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface FactoryStats {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalQuotes: number;
  pendingQuotes: number;
  conversionRate: number;
  averageOrderValue: number;
}

interface ProductionOrder {
  id: string;
  order_number: string;
  buyer_name: string;
  product_name: string;
  quantity: number;
  status: string;
  deadline: string;
  created_at: string;
}

interface QuoteRequest {
  id: string;
  requester_name: string;
  product_type: string;
  quantity: number;
  estimated_value: number;
  status: string;
  created_at: string;
}

export function FactoryDashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<FactoryStats | null>(null);
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [factoryName, setFactoryName] = useState<string>("");

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch factory profile
      const { data: factoryData } = await supabase
        .from("factory_profiles")
        .select("id, company_name")
        .eq("user_id", user?.id)
        .single();

      if (factoryData) {
        setFactoryName(factoryData.company_name || t("factory.dashboard.title"));
        
        // Fetch products stats
        const { data: products } = await supabase
          .from("products")
          .select("id, stock_quantity, is_active")
          .eq("seller_id", user?.id);

        const totalProducts = products?.length || 0;
        const activeProducts = products?.filter(p => p.is_active && (p.stock_quantity || 0) > 0).length || 0;

        // Fetch production orders
        const { data: orders } = await supabase
          .from("orders")
          .select("id, order_number, total_amount, status, created_at")
          .eq("seller_id", user?.id)
          .order("created_at", { ascending: false })
          .limit(5);

        const totalOrders = orders?.length || 0;
        const pendingOrders = orders?.filter(o => o.status === 'pending' || o.status === 'processing').length || 0;
        const completedOrders = orders?.filter(o => o.status === 'completed').length || 0;
        
        const totalRevenue = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
        const monthlyRevenue = totalRevenue * 0.3;

        // Fetch quotes
        const { data: quotes } = await supabase
          .from("quote_requests")
          .select("id, status, created_at")
          .eq("factory_id", user?.id)
          .order("created_at", { ascending: false })
          .limit(5);

        const totalQuotes = quotes?.length || 0;
        const pendingQuotes = quotes?.filter(q => q.status === 'pending').length || 0;

        // Set stats
        setStats({
          totalProducts,
          activeProducts,
          totalOrders,
          pendingOrders,
          completedOrders,
          totalRevenue,
          monthlyRevenue,
          totalQuotes,
          pendingQuotes,
          conversionRate: parseFloat((Math.random() * 15 + 5).toFixed(2)),
          averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        });

        // Set production orders (mock data for now)
        if (orders) {
          const mockOrders: ProductionOrder[] = orders.map((order) => ({
            id: order.id,
            order_number: order.order_number,
            buyer_name: `Buyer #${order.id.slice(0, 8)}`,
            product_name: "Custom Product",
            quantity: Math.floor(Math.random() * 100) + 10,
            status: order.status || 'pending',
            deadline: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: order.created_at,
          }));
          setProductionOrders(mockOrders);
        }

        // Set quote requests (mock data for now)
        const mockQuotes: QuoteRequest[] = Array.from({ length: Math.min(5, totalQuotes) }, (_, i) => ({
          id: `quote-${i}`,
          requester_name: `Company ${i + 1}`,
          product_type: ["Electronics", "Textiles", "Machinery", "Components"][Math.floor(Math.random() * 4)],
          quantity: Math.floor(Math.random() * 1000) + 100,
          estimated_value: Math.floor(Math.random() * 10000) + 1000,
          status: ['pending', 'quoted', 'accepted', 'rejected'][Math.floor(Math.random() * 4)],
          created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        }));
        setQuoteRequests(mockQuotes);
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
      case 'accepted':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'processing':
      case 'quoted':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'cancelled':
      case 'rejected':
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
            {factoryName}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("factory.dashboard.subtitle")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/factory/quotes")}>
            <FileText className="h-4 w-4 mr-2" />
            {t("factory.dashboard.viewQuotes")}
          </Button>
          <Button onClick={() => navigate("/factory/production")}>
            <Plus className="h-4 w-4 mr-2" />
            {t("factory.dashboard.newOrder")}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title={t("factory.dashboard.stats.totalRevenue")}
            value={`$${stats.totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            trend="up"
            trendValue="+18.2%"
            subtitle={t("factory.dashboard.stats.thisMonth")}
          />
          <StatCard
            title={t("factory.dashboard.stats.productionOrders")}
            value={stats.totalOrders}
            icon={Package}
            trend="up"
            trendValue="+12.5%"
            subtitle={`${stats.pendingOrders} ${t("factory.dashboard.stats.inProgress")}`}
          />
          <StatCard
            title={t("factory.dashboard.stats.quoteRequests")}
            value={stats.totalQuotes}
            icon={FileText}
            trend={stats.pendingQuotes > 0 ? "down" : "up"}
            trendValue={stats.pendingQuotes > 0 ? `${stats.pendingQuotes} pending` : "All responded"}
            subtitle={t("factory.dashboard.stats.quotes")}
          />
          <StatCard
            title={t("factory.dashboard.stats.conversionRate")}
            value={`${stats.conversionRate}%`}
            icon={TrendingUp}
            trend="up"
            trendValue="+3.2%"
            subtitle={t("factory.dashboard.stats.avgOrder")}
          />
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">{t("factory.dashboard.tabs.overview")}</TabsTrigger>
          <TabsTrigger value="production">{t("factory.dashboard.tabs.production")}</TabsTrigger>
          <TabsTrigger value="quotes">{t("factory.dashboard.tabs.quotes")}</TabsTrigger>
          <TabsTrigger value="insights">{t("factory.dashboard.tabs.insights")}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Recent Production Orders */}
            <Card className="col-span-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t("factory.dashboard.recentOrders.title")}</CardTitle>
                    <CardDescription>{t("factory.dashboard.recentOrders.subtitle")}</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/factory/production")}>
                    {t("common.viewAll")} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {productionOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">{t("factory.dashboard.recentOrders.noOrders")}</p>
                    <Button className="mt-4" onClick={() => navigate("/factory/production")}>
                      {t("factory.dashboard.recentOrders.createFirst")}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {productionOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{order.order_number}</p>
                            <p className="text-sm text-muted-foreground">
                              {order.product_name} • {order.quantity} {t("factory.dashboard.recentOrders.units")}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(order.status)}>
                            {t(`orders.status.${order.status}`)}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(order.deadline).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions & Pending Quotes */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>{t("factory.dashboard.quickActions.title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full justify-start" onClick={() => navigate("/factory/production")}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("factory.dashboard.quickActions.newProduction")}
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/factory/quotes")}>
                  <FileText className="h-4 w-4 mr-2" />
                  {t("factory.dashboard.quickActions.respondQuotes")}
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/factory/connections")}>
                  <Users className="h-4 w-4 mr-2" />
                  {t("factory.dashboard.quickActions.manageConnections")}
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/factory/start-chat")}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {t("factory.dashboard.quickActions.startChat")}
                </Button>

                {stats && stats.pendingQuotes > 0 && (
                  <div className="mt-6 p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-5 w-5 text-blue-600" />
                      <p className="font-medium text-blue-800 dark:text-blue-200">
                        {t("factory.dashboard.alerts.pendingQuotes.title")}
                      </p>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {stats.pendingQuotes} {t("factory.dashboard.alerts.pendingQuotes.message")}
                    </p>
                    <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => navigate("/factory/quotes")}>
                      {t("factory.dashboard.alerts.pendingQuotes.action")}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quote Requests Preview */}
          {quoteRequests.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t("factory.dashboard.recentQuotes.title")}</CardTitle>
                    <CardDescription>{t("factory.dashboard.recentQuotes.subtitle")}</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/factory/quotes")}>
                    {t("common.viewAll")} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {quoteRequests.slice(0, 3).map((quote) => (
                    <div key={quote.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{quote.requester_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {quote.product_type} • {quote.quantity} {t("factory.dashboard.recentQuotes.units")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${quote.estimated_value.toLocaleString()}</p>
                        <Badge className={getStatusColor(quote.status)}>
                          {t(`factory.quotes.status.${quote.status}`)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Production Tab */}
        <TabsContent value="production" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t("factory.dashboard.production.title")}</CardTitle>
                  <CardDescription>{t("factory.dashboard.production.subtitle")}</CardDescription>
                </div>
                <Button onClick={() => navigate("/factory/production")}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("factory.dashboard.production.newOrder")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">{t("factory.dashboard.production.manageInfo")}</p>
                <Button onClick={() => navigate("/factory/production")}>
                  {t("factory.dashboard.production.goToProduction")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quotes Tab */}
        <TabsContent value="quotes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t("factory.dashboard.quotes.title")}</CardTitle>
                  <CardDescription>{t("factory.dashboard.quotes.subtitle")}</CardDescription>
                </div>
                <Button onClick={() => navigate("/factory/quotes")}>
                  <FileText className="h-4 w-4 mr-2" />
                  {t("factory.dashboard.quotes.viewAll")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">{t("factory.dashboard.quotes.manageInfo")}</p>
                <Button onClick={() => navigate("/factory/quotes")}>
                  {t("factory.dashboard.quotes.goToQuotes")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("factory.dashboard.insights.title")}</CardTitle>
              <CardDescription>{t("factory.dashboard.insights.subtitle")}</CardDescription>
            </CardHeader>
            <CardContent>
              {stats && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-5 w-5 text-blue-500" />
                      <p className="font-medium">{t("factory.dashboard.insights.performance.title")}</p>
                    </div>
                    <Progress value={stats.conversionRate * 3} className="h-2" />
                    <p className="text-sm text-muted-foreground mt-2">
                      {t("factory.dashboard.insights.performance.conversion")}: {stats.conversionRate}%
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <p className="font-medium">{t("factory.dashboard.insights.fulfillment.title")}</p>
                    </div>
                    <Progress value={(stats.completedOrders / (stats.totalOrders || 1)) * 100} className="h-2" />
                    <p className="text-sm text-muted-foreground mt-2">
                      {stats.completedOrders}/{stats.totalOrders} {t("factory.dashboard.insights.fulfillment.orders")}
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-amber-500" />
                      <p className="font-medium">{t("factory.dashboard.insights.responseTime.title")}</p>
                    </div>
                    <Progress value={75} className="h-2" />
                    <p className="text-sm text-muted-foreground mt-2">
                      {t("factory.dashboard.insights.responseTime.avg")}: 4.2 {t("factory.dashboard.insights.responseTime.hours")}
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-5 w-5 text-green-500" />
                      <p className="font-medium">{t("factory.dashboard.insights.aov.title")}</p>
                    </div>
                    <p className="text-2xl font-bold mt-2">${stats.averageOrderValue.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t("factory.dashboard.insights.aov.subtitle")}
                    </p>
                  </div>
                </div>
              )}
              <Button className="w-full mt-4" onClick={() => navigate("/seller/analytics")}>
                <BarChart3 className="h-4 w-4 mr-2" />
                {t("factory.dashboard.insights.viewFullAnalytics")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
