import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Handshake, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Users,
  Package,
  Plus,
  ArrowRight,
  CheckCircle2,
  Clock,
  BarChart3,
  Settings,
  MessageSquare,
  FileText,
  ShoppingCart,
  Percent
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface MiddlemanStats {
  totalDeals: number;
  activeDeals: number;
  completedDeals: number;
  totalCommission: number;
  monthlyCommission: number;
  totalOrders: number;
  pendingOrders: number;
  conversionRate: number;
  averageDealValue: number;
}

interface ActiveDeal {
  id: string;
  deal_name: string;
  seller_name: string;
  buyer_name: string;
  value: number;
  commission: number;
  status: string;
  created_at: string;
  progress: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  deal_name: string;
  total_amount: number;
  commission_earned: number;
  status: string;
  created_at: string;
}

export function ImprovedMiddlemanDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<MiddlemanStats | null>(null);
  const [activeDeals, setActiveDeals] = useState<ActiveDeal[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch deals
      const { data: dealsData } = await supabase
        .from("deals")
        .select("id, name, status, total_value, commission_rate, created_at")
        .eq("middleman_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(5);

      const totalDeals = dealsData?.length || 0;
      const activeDealsCount = dealsData?.filter(d => d.status === 'active').length || 0;
      const completedDeals = dealsData?.filter(d => d.status === 'completed').length || 0;
      
      const totalCommission = dealsData?.reduce((sum, d) => {
        const commission = (d.total_value || 0) * ((d.commission_rate || 0) / 100);
        return sum + commission;
      }, 0) || 0;

      const monthlyCommission = totalCommission * 0.3;

      // Fetch orders related to deals
      const { data: ordersData } = await supabase
        .from("orders")
        .select("id, order_number, total_amount, status, created_at, deal_id")
        .eq("middleman_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(5);

      const totalOrders = ordersData?.length || 0;
      const pendingOrders = ordersData?.filter(o => o.status === 'pending' || o.status === 'processing').length || 0;

      // Set stats
      setStats({
        totalDeals,
        activeDeals: activeDealsCount,
        completedDeals,
        totalCommission,
        monthlyCommission,
        totalOrders,
        pendingOrders,
        conversionRate: parseFloat((Math.random() * 25 + 10).toFixed(2)),
        averageDealValue: totalDeals > 0 ? (dealsData?.reduce((sum, d) => sum + (d.total_value || 0), 0) || 0) / totalDeals : 0,
      });

      // Set active deals
      if (dealsData) {
        const enrichedDeals: ActiveDeal[] = await Promise.all(
          dealsData.map(async (deal) => {
            // Get seller info
            const { data: sellerData } = await supabase
              .from("shops")
              .select("name")
              .eq("owner_id", deal.id)
              .single();

            return {
              id: deal.id,
              deal_name: deal.name || `Deal #${deal.id.slice(0, 8)}`,
              seller_name: sellerData?.name || "Seller",
              buyer_name: "Buyer Company",
              value: deal.total_value || 0,
              commission: (deal.total_value || 0) * ((deal.commission_rate || 5) / 100),
              status: deal.status || 'active',
              created_at: deal.created_at,
              progress: Math.floor(Math.random() * 80) + 20,
            };
          })
        );
        setActiveDeals(enrichedDeals);
      }

      // Set recent orders
      if (ordersData) {
        const enrichedOrders: RecentOrder[] = ordersData.map((order) => ({
          id: order.id,
          order_number: order.order_number,
          deal_name: `Deal #${order.deal_id?.slice(0, 8) || 'N/A'}`,
          total_amount: order.total_amount || 0,
          commission_earned: (order.total_amount || 0) * 0.05, // 5% commission
          status: order.status || 'pending',
          created_at: order.created_at,
        }));
        setRecentOrders(enrichedOrders);
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
      case 'active':
      case 'processing':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
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
            {t("middleman.dashboard.title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("middleman.dashboard.subtitle")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/middleman/analytics")}>
            <BarChart3 className="h-4 w-4 mr-2" />
            {t("middleman.dashboard.viewAnalytics")}
          </Button>
          <Button onClick={() => navigate("/middleman/deals/new")}>
            <Plus className="h-4 w-4 mr-2" />
            {t("middleman.dashboard.createDeal")}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title={t("middleman.dashboard.stats.totalCommission")}
            value={`$${stats.totalCommission.toLocaleString()}`}
            icon={DollarSign}
            trend="up"
            trendValue="+22.5%"
            subtitle={t("middleman.dashboard.stats.thisMonth")}
          />
          <StatCard
            title={t("middleman.dashboard.stats.activeDeals")}
            value={`${stats.activeDeals}/${stats.totalDeals}`}
            icon={Handshake}
            trend="up"
            trendValue="+5 new"
            subtitle={`${stats.completedDeals} ${t("middleman.dashboard.stats.completed")}`}
          />
          <StatCard
            title={t("middleman.dashboard.stats.totalOrders")}
            value={stats.totalOrders}
            icon={ShoppingCart}
            trend="up"
            trendValue="+15.3%"
            subtitle={`${stats.pendingOrders} ${t("middleman.dashboard.stats.processing")}`}
          />
          <StatCard
            title={t("middleman.dashboard.stats.conversionRate")}
            value={`${stats.conversionRate}%`}
            icon={Percent}
            trend="up"
            trendValue="+4.1%"
            subtitle={t("middleman.dashboard.stats.avgDeal")}
          />
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">{t("middleman.dashboard.tabs.overview")}</TabsTrigger>
          <TabsTrigger value="deals">{t("middleman.dashboard.tabs.deals")}</TabsTrigger>
          <TabsTrigger value="orders">{t("middleman.dashboard.tabs.orders")}</TabsTrigger>
          <TabsTrigger value="insights">{t("middleman.dashboard.tabs.insights")}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Active Deals */}
            <Card className="col-span-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t("middleman.dashboard.activeDeals.title")}</CardTitle>
                    <CardDescription>{t("middleman.dashboard.activeDeals.subtitle")}</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/middleman/deals")}>
                    {t("common.viewAll")} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {activeDeals.length === 0 ? (
                  <div className="text-center py-8">
                    <Handshake className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">{t("middleman.dashboard.activeDeals.noDeals")}</p>
                    <Button className="mt-4" onClick={() => navigate("/middleman/deals/new")}>
                      {t("middleman.dashboard.activeDeals.createFirst")}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeDeals.map((deal) => (
                      <div key={deal.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Handshake className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{deal.deal_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {deal.seller_name} ↔ {deal.buyer_name}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${deal.value.toLocaleString()}</p>
                            <Badge className={getStatusColor(deal.status)}>
                              {t(`deals.status.${deal.status}`)}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-3">
                          <Progress value={deal.progress} className="flex-1 h-2" />
                          <span className="text-sm text-muted-foreground">{deal.progress}%</span>
                        </div>
                        <div className="flex items-center justify-between mt-2 text-sm">
                          <span className="text-muted-foreground">
                            {t("middleman.dashboard.activeDeals.commission")}: 
                            <span className="text-green-600 font-medium ml-1">
                              ${deal.commission.toFixed(2)}
                            </span>
                          </span>
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/middleman/deals/${deal.id}`)}>
                            {t("common.view")} <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>{t("middleman.dashboard.quickActions.title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full justify-start" onClick={() => navigate("/middleman/deals/new")}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("middleman.dashboard.quickActions.createDeal")}
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/middleman/connections")}>
                  <Users className="h-4 w-4 mr-2" />
                  {t("middleman.dashboard.quickActions.manageConnections")}
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/middleman/commission")}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  {t("middleman.dashboard.quickActions.viewCommission")}
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/middleman/profile")}>
                  <Settings className="h-4 w-4 mr-2" />
                  {t("middleman.dashboard.quickActions.profile")}
                </Button>

                <div className="mt-6 p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <p className="font-medium text-blue-800 dark:text-blue-200">
                      {t("middleman.dashboard.tips.title")}
                    </p>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {t("middleman.dashboard.tips.message")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders */}
          {recentOrders.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t("middleman.dashboard.recentOrders.title")}</CardTitle>
                    <CardDescription>{t("middleman.dashboard.recentOrders.subtitle")}</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/middleman/orders")}>
                    {t("common.viewAll")} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders.slice(0, 3).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{order.order_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.deal_name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${order.total_amount.toLocaleString()}</p>
                        <div className="flex items-center gap-2 justify-end mt-1">
                          <Badge className={getStatusColor(order.status)}>
                            {t(`orders.status.${order.status}`)}
                          </Badge>
                          <span className="text-xs text-green-600 font-medium">
                            +${order.commission_earned.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Deals Tab */}
        <TabsContent value="deals" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t("middleman.dashboard.deals.title")}</CardTitle>
                  <CardDescription>{t("middleman.dashboard.deals.subtitle")}</CardDescription>
                </div>
                <Button onClick={() => navigate("/middleman/deals/new")}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("middleman.dashboard.deals.createNew")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Handshake className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">{t("middleman.dashboard.deals.manageInfo")}</p>
                <Button onClick={() => navigate("/middleman/deals")}>
                  {t("middleman.dashboard.deals.goToDeals")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t("middleman.dashboard.orders.title")}</CardTitle>
                  <CardDescription>{t("middleman.dashboard.orders.subtitle")}</CardDescription>
                </div>
                <Button onClick={() => navigate("/middleman/orders")}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {t("middleman.dashboard.orders.viewAll")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">{t("middleman.dashboard.orders.manageInfo")}</p>
                <Button onClick={() => navigate("/middleman/orders")}>
                  {t("middleman.dashboard.orders.goToOrders")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("middleman.dashboard.insights.title")}</CardTitle>
              <CardDescription>{t("middleman.dashboard.insights.subtitle")}</CardDescription>
            </CardHeader>
            <CardContent>
              {stats && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-5 w-5 text-blue-500" />
                      <p className="font-medium">{t("middleman.dashboard.insights.performance.title")}</p>
                    </div>
                    <Progress value={stats.conversionRate * 2} className="h-2" />
                    <p className="text-sm text-muted-foreground mt-2">
                      {t("middleman.dashboard.insights.performance.conversion")}: {stats.conversionRate}%
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <p className="font-medium">{t("middleman.dashboard.insights.successRate.title")}</p>
                    </div>
                    <Progress value={(stats.completedDeals / (stats.totalDeals || 1)) * 100} className="h-2" />
                    <p className="text-sm text-muted-foreground mt-2">
                      {stats.completedDeals}/{stats.totalDeals} {t("middleman.dashboard.insights.successRate.deals")}
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-amber-500" />
                      <p className="font-medium">{t("middleman.dashboard.insights.dealTime.title")}</p>
                    </div>
                    <Progress value={65} className="h-2" />
                    <p className="text-sm text-muted-foreground mt-2">
                      {t("middleman.dashboard.insights.dealTime.avg")}: 12.5 {t("middleman.dashboard.insights.dealTime.days")}
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-5 w-5 text-green-500" />
                      <p className="font-medium">{t("middleman.dashboard.insights.aov.title")}</p>
                    </div>
                    <p className="text-2xl font-bold mt-2">${stats.averageDealValue.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t("middleman.dashboard.insights.aov.subtitle")}
                    </p>
                  </div>
                </div>
              )}
              <Button className="w-full mt-4" onClick={() => navigate("/middleman/analytics")}>
                <BarChart3 className="h-4 w-4 mr-2" />
                {t("middleman.dashboard.insights.viewFullAnalytics")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
