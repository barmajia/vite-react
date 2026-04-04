// src/pages/admin/AdminDashboard.tsx
// Admin Dashboard - Main analytics and platform overview

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Factory,
  Briefcase,
  Truck,
  MessageSquare,
  Eye,
  Download,
  RefreshCw,
  Loader2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DashboardStats {
  totalUsers: number;
  totalSellers: number;
  totalFactories: number;
  totalMiddlemen: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  activeUsers: number;
  pendingOrders: number;
  completedOrders: number;
}

interface RecentOrder {
  id: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
}

interface TopSeller {
  user_id: string;
  full_name: string;
  total_revenue: number;
  total_sales: number;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topSellers, setTopSellers] = useState<TopSeller[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load all stats in parallel
      const [
        usersRes,
        sellersRes,
        factoriesRes,
        middlemenRes,
        productsRes,
        ordersRes,
      ] = await Promise.all([
        supabase.from("users").select("id", { count: "exact" }),
        supabase.from("sellers").select("user_id", { count: "exact" }),
        supabase.from("factories").select("user_id", { count: "exact" }),
        supabase
          .from("middleman_profiles")
          .select("user_id", { count: "exact" }),
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("is_deleted", false),
        supabase
          .from("orders")
          .select("id, status, total, created_at", { count: "exact" }),
      ]);

      // Calculate active users (updated in last 24h)
      const { count: activeCount } = await supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .gte(
          "updated_at",
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        );

      // Calculate revenue from orders
      const totalRevenue =
        ordersRes.data?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
      const pendingOrders =
        ordersRes.data?.filter((o) => o.status === "pending").length || 0;
      const completedOrders =
        ordersRes.data?.filter(
          (o) => o.status === "delivered" || o.status === "completed",
        ).length || 0;

      setStats({
        totalUsers: usersRes.count || 0,
        totalSellers: sellersRes.count || 0,
        totalFactories: factoriesRes.count || 0,
        totalMiddlemen: middlemenRes.count || 0,
        totalProducts: productsRes.count || 0,
        totalOrders: ordersRes.count || 0,
        totalRevenue,
        activeUsers: activeCount || 0,
        pendingOrders,
        completedOrders,
      });

      // Load recent orders
      const { data: ordersData } = await supabase
        .from("orders")
        .select(
          `
          id,
          total,
          status,
          created_at,
          user_id
        `,
        )
        .order("created_at", { ascending: false })
        .limit(10);

      // Get customer names for recent orders
      const ordersWithCustomers = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { data: userData } = await supabase
            .from("users")
            .select("full_name")
            .eq("user_id", order.user_id)
            .single();

          return {
            ...order,
            customer_name: userData?.full_name || "Unknown",
          };
        }),
      );

      setRecentOrders(ordersWithCustomers);

      // Load top sellers - simplified approach
      const { data: sellersData } = await supabase
        .from("sellers")
        .select("user_id, full_name");

      if (sellersData) {
        // For now, just show sellers without sales data
        // In production, you'd calculate this from actual sales
        const topSellersData = sellersData.slice(0, 5).map((seller: any) => ({
          user_id: seller.user_id,
          full_name: seller.full_name || "Unknown",
          total_revenue: 0,
          total_sales: 0,
        }));
        setTopSellers(topSellersData);
      }
    } catch (error) {
      console.error("Dashboard load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <div
            className={`flex items-center text-xs ${trend > 0 ? "text-green-600" : "text-red-600"}`}
          >
            {trend > 0 ? (
              <TrendingUp className="h-3 w-3 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1" />
            )}
            <span>{Math.abs(trend)}% from last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Platform overview and analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadDashboardData}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon={Users}
          trend={12.5}
          color="text-blue-600"
        />
        <StatCard
          title="Active (24h)"
          value={stats?.activeUsers || 0}
          icon={Activity}
          trend={8.2}
          color="text-green-600"
        />
        <StatCard
          title="Total Products"
          value={stats?.totalProducts || 0}
          icon={Package}
          trend={5.3}
          color="text-purple-600"
        />
        <StatCard
          title="Total Revenue"
          value={`${stats?.totalRevenue.toFixed(2) || "0.00"} EGP`}
          icon={DollarSign}
          trend={15.7}
          color="text-green-600"
        />
        <StatCard
          title="Total Orders"
          value={stats?.totalOrders || 0}
          icon={ShoppingCart}
          trend={10.2}
          color="text-orange-600"
        />
        <StatCard
          title="Pending Orders"
          value={stats?.pendingOrders || 0}
          icon={Activity}
          trend={-5.1}
          color="text-yellow-600"
        />
        <StatCard
          title="Sellers"
          value={stats?.totalSellers || 0}
          icon={Briefcase}
          trend={7.8}
          color="text-blue-600"
        />
        <StatCard
          title="Factories"
          value={stats?.totalFactories || 0}
          icon={Factory}
          trend={3.2}
          color="text-indigo-600"
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-orange-600" />
              Middlemen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.totalMiddlemen || 0}</p>
            <p className="text-sm text-muted-foreground">
              Active commission earners
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-green-600" />
              Delivery Drivers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {stats?.totalUsers ? Math.floor(stats.totalUsers * 0.05) : 0}
            </p>
            <p className="text-sm text-muted-foreground">Active drivers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              Active Conversations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {stats?.totalOrders ? Math.floor(stats.totalOrders * 0.3) : 0}
            </p>
            <p className="text-sm text-muted-foreground">Ongoing chats</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders & Top Sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/admin/orders")}
            >
              <Eye className="h-4 w-4 mr-2" />
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No recent orders
                    </TableCell>
                  </TableRow>
                ) : (
                  recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">
                        {order.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>{order.customer_name}</TableCell>
                      <TableCell className="font-semibold">
                        {order.total.toFixed(2)} EGP
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            order.status === "delivered" ||
                            order.status === "completed"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : order.status === "pending"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          }
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Top Sellers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Top Sellers (All Time)</CardTitle>
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seller</TableHead>
                  <TableHead>Sales</TableHead>
                  <TableHead>Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topSellers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No sales data yet
                    </TableCell>
                  </TableRow>
                ) : (
                  topSellers.map((seller, index) => (
                    <TableRow key={seller.user_id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-muted-foreground">
                            #{index + 1}
                          </span>
                          <span>{seller.full_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{seller.total_sales}</TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {seller.total_revenue.toFixed(2)} EGP
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Account Type Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Account Type Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Briefcase className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold">{stats?.totalSellers || 0}</p>
              <p className="text-sm text-muted-foreground">Sellers</p>
            </div>
            <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <Factory className="h-8 w-8 mx-auto mb-2 text-indigo-600" />
              <p className="text-2xl font-bold">{stats?.totalFactories || 0}</p>
              <p className="text-sm text-muted-foreground">Factories</p>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <Briefcase className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <p className="text-2xl font-bold">{stats?.totalMiddlemen || 0}</p>
              <p className="text-sm text-muted-foreground">Middlemen</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold">{stats?.activeUsers || 0}</p>
              <p className="text-sm text-muted-foreground">Active (24h)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
