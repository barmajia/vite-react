import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Package,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Clock,
  MessageCircle,
  Loader2,
  RefreshCw,
  Plus,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ShoppingCart,
  ChevronRight,
  PieChart,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Order {
  id: string;
  status: string;
  payment_status: string;
  total: number;
  created_at: string;
  order_items?: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
  }>;
}

interface Product {
  id: string;
  title: string;
  price: number;
  quantity: number;
  status: string;
  created_at: string;
}

export function SellerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch recent orders
  const {
    data: recentOrders,
    isLoading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ["seller-recent-orders", user?.id, period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(product_name, quantity, unit_price)")
        .eq("seller_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as Order[];
    },
    enabled: !!user?.id,
  });

  // Fetch products for stats and low stock alerts
  const {
    data: products,
    isLoading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ["seller-products-dashboard", user?.id, period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, title, price, quantity, status")
        .eq("seller_id", user?.id)
        .eq("is_deleted", false);
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!user?.id,
  });

  // Fetch top selling products
  const {
    data: topProducts,
    isLoading: topProductsLoading,
    refetch: refetchTopProducts,
  } = useQuery({
    queryKey: ["seller-top-products", user?.id, period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select(`
          product_id,
          products!inner(title),
          quantity,
          unit_price
        `)
        .eq("products.seller_id", user?.id)
        .order("quantity", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch order status breakdown
  const {
    data: orderStatusBreakdown,
    isLoading: statusLoading,
    refetch: refetchOrderStatusBreakdown,
  } = useQuery({
    queryKey: ["seller-order-status", user?.id, period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("status, count")
        .eq("seller_id", user?.id)
        .group("status");
      if (error) throw error;
      return data as { status: string; count: number }[];
    },
    enabled: !!user?.id,
  });

  // Calculate real stats
  const stats = {
    totalProducts: products?.length || 0,
    activeProducts: products?.filter((p) => p.status === "active").length || 0,
    lowStockCount: products?.filter((p) => p.quantity <= 10).length || 0,
    totalOrders: recentOrders?.length || 0,
    pendingOrders:
      recentOrders?.filter((o) => o.status === "pending").length || 0,
    totalRevenue:
      recentOrders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0,
    avgOrderValue: recentOrders?.length
      ? recentOrders.reduce((sum, o) => sum + (o.total || 0), 0) /
        recentOrders.length
      : 0,
  };

  // Format top products for display
  const formattedTopProducts = topProducts?.map((item: any) => ({
    id: item.product_id,
    title: item.products?.title || "Unknown Product",
    quantitySold: item.quantity,
    revenue: (item.quantity || 0) * (item.unit_price || 0),
  })) || [];

  // Format order status breakdown for pie chart
  const formattedStatusBreakdown = orderStatusBreakdown?.map((status: any) => ({
    status: status.status,
    count: status.count,
  })) || [];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      refetchOrders(),
      refetchProducts(),
      refetchTopProducts(),
      refetchOrderStatusBreakdown()
    ]);
    setIsRefreshing(false);
    toast.success("Dashboard refreshed");
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      { bg: string; text: string; icon: JSX.Element }
    > = {
      pending: {
        bg: "bg-amber-100 dark:bg-amber-900/30",
        text: "text-amber-700 dark:text-amber-400",
        icon: <Clock className="h-3 w-3" />,
      },
      confirmed: {
        bg: "bg-blue-100 dark:bg-blue-900/30",
        text: "text-blue-700 dark:text-blue-400",
        icon: <CheckCircle2 className="h-3 w-3" />,
      },
      processing: {
        bg: "bg-purple-100 dark:bg-purple-900/30",
        text: "text-purple-700 dark:text-purple-400",
        icon: <Package className="h-3 w-3" />,
      },
      shipped: {
        bg: "bg-indigo-100 dark:bg-indigo-900/30",
        text: "text-indigo-700 dark:text-indigo-400",
        icon: <TrendingUp className="h-3 w-3" />,
      },
      delivered: {
        bg: "bg-emerald-100 dark:bg-emerald-900/30",
        text: "text-emerald-700 dark:text-emerald-400",
        icon: <CheckCircle2 className="h-3 w-3" />,
      },
      cancelled: {
        bg: "bg-red-100 dark:bg-red-900/30",
        text: "text-red-700 dark:text-red-400",
        icon: <XCircle className="h-3 w-3" />,
      },
    };
    const v = variants[status] || variants.pending;
    return (
      <Badge className={`${v.bg} ${v.text} gap-1 capitalize`}>
        {v.icon}
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const isLoading = ordersLoading || productsLoading || topProductsLoading || statusLoading;
  const hasError = ordersError || productsError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-400">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">
              Failed to Load Dashboard
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              {(ordersError || productsError)?.message || "An error occurred"}
            </p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Welcome back,{" "}
            {user?.user_metadata?.full_name?.split(" ")[0] || "Seller"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as typeof period)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Low Stock Alert Banner */}
      {stats.lowStockCount > 0 && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                  Low Stock Alert
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  You have {stats.lowStockCount} product
                  {stats.lowStockCount > 1 ? "s" : ""} with low stock (≤10
                  units). Consider restocking soon.
                </p>
                <Button
                  variant="link"
                  className="p-0 h-auto mt-2 text-amber-700 dark:text-amber-300"
                  onClick={() => navigate("/seller/products")}
                >
                  View Products <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  ${stats.totalRevenue.toFixed(2)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  From {stats.totalOrders} order
                  {stats.totalOrders !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Total Orders
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {stats.totalOrders}
                </p>
                {stats.pendingOrders > 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    {stats.pendingOrders} pending
                  </p>
                )}
              </div>
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <ShoppingCart className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Products
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {stats.totalProducts}
                </p>
                <p className="text-xs text-emerald-600 mt-1">
                  {stats.activeProducts} active
                </p>
              </div>
              <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                <Package className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Avg Order Value */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Avg Order Value
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  ${stats.avgOrderValue.toFixed(2)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Your latest customer orders</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/seller/orders")}
            >
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentOrders?.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  No orders yet
                </p>
                <Button
                  variant="outline"
                  onClick={() => navigate("/seller/products/new")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Product
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders?.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">#{order.id.slice(0, 8)}</p>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-sm text-slate-500">
                        {new Date(order.created_at).toLocaleDateString()}
                        {order.order_items && order.order_items.length > 0 && (
                          <span className="ml-2">
                            • {order.order_items.length} item
                            {order.order_items.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        ${order.total?.toFixed(2)}
                      </p>
                      <Badge
                        variant="outline"
                        className="text-xs capitalize mt-1"
                      >
                        {order.payment_status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                {
                  label: "Add Product",
                  icon: Plus,
                  href: "/seller/products/new",
                  color: "bg-emerald-500",
                },
                {
                  label: "View Orders",
                  icon: Clock,
                  href: "/seller/orders",
                  color: "bg-blue-500",
                },
                {
                  label: "View Products",
                  icon: Package,
                  href: "/seller/products",
                  color: "bg-purple-500",
                },
                {
                  label: "Messages",
                  icon: MessageCircle,
                  href: "/seller/messages",
                  color: "bg-amber-500",
                },
                {
                  label: "Analytics",
                  icon: TrendingUp,
                  href: "/seller/analytics",
                  color: "bg-cyan-500",
                },
              ].map((action) => (
                <Button
                  key={action.label}
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12 hover:bg-slate-50 dark:hover:bg-slate-800"
                  onClick={() => navigate(action.href)}
                >
                  <div className={`p-2 rounded-lg ${action.color} text-white`}>
                    <action.icon className="h-4 w-4" />
                  </div>
                  <span className="font-medium">{action.label}</span>
                  <ChevronRight className="h-4 w-4 ml-auto text-slate-400" />
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
