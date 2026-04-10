import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Factory,
  Package,
  TrendingUp,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function FactoryDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");

  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ["factory-kpis", user?.id, period],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_seller_kpis", {
        p_seller_id: user?.id,
        p_period: period,
      });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: pendingOrders } = useQuery({
    queryKey: ["factory-pending-orders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(product_name, quantity, unit_price)")
        .eq("seller_id", user?.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const stats = [
    {
      title: "Production Value",
      value: `$${kpis?.kpis?.total_revenue?.toLocaleString() ?? "0"}`,
      change: "+18.2%",
      trend: "up",
      icon: <Factory className="h-5 w-5" />,
      color: "text-indigo-500",
    },
    {
      title: "Total Orders",
      value: kpis?.kpis?.total_sales?.toLocaleString() ?? "0",
      change: "+12.5%",
      trend: "up",
      icon: <Package className="h-5 w-5" />,
      color: "text-blue-500",
    },
    {
      title: "Units Produced",
      value: kpis?.kpis?.total_items_sold?.toLocaleString() ?? "0",
      change: "+24.1%",
      trend: "up",
      icon: <TrendingUp className="h-5 w-5" />,
      color: "text-emerald-500",
    },
    {
      title: "On-Time Delivery",
      value: "95.2%",
      change: "-1.3%",
      trend: "down",
      icon: <Clock className="h-5 w-5" />,
      color: "text-amber-500",
    },
  ];

  if (kpisLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
            Welcome back, {user?.user_metadata?.full_name?.split(" ")[0] || "Factory"}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Monitor your production and manage orders
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
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                    {stat.value}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    {stat.trend === "up" ? (
                      <ArrowUpRight className={`h-4 w-4 ${stat.color}`} />
                    ) : (
                      <ArrowDownRight className={`h-4 w-4 ${stat.color}`} />
                    )}
                    <span className={`text-sm ${stat.color}`}>{stat.change}</span>
                    <span className="text-sm text-slate-500">vs last period</span>
                  </div>
                </div>
                <div className={`p-3 rounded-xl bg-slate-100 dark:bg-slate-800 ${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Pending Orders</CardTitle>
              <CardDescription>Orders awaiting production</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/factory/orders")}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {pendingOrders?.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No pending orders</p>
            ) : (
              <div className="space-y-4">
                {pendingOrders?.slice(0, 5).map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
                    <div>
                      <p className="font-medium">#{order.id?.slice(0, 8)}</p>
                      <p className="text-sm text-slate-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${order.total?.toFixed(2)}</p>
                      <p className="text-sm text-slate-500">{order.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "View Orders", icon: Clock, href: "/factory/orders", color: "bg-blue-500" },
                { label: "Production", icon: Factory, href: "/factory/production", color: "bg-indigo-500" },
                { label: "Quality Control", icon: AlertTriangle, href: "/factory/quality", color: "bg-emerald-500" },
                { label: "Connections", icon: TrendingUp, href: "/factory/connections", color: "bg-purple-500" },
              ].map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800"
                  onClick={() => navigate(action.href)}
                >
                  <div className={`p-3 rounded-xl ${action.color} text-white`}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium">{action.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
