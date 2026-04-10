import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";

export function SellerAnalytics() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");

  const { data: analytics } = useQuery({
    queryKey: ["seller-analytics", user?.id, period],
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

  const revenueData = analytics?.daily_breakdown?.map((d: any) => ({
    date: new Date(d.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    revenue: d.revenue,
  })) || [];

  const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics</h1>
          <p className="text-slate-600 dark:text-slate-400">Track your performance</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as typeof period)}
          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
        >
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Revenue Trend</CardTitle></CardHeader>
            <CardContent>
              {revenueData.length === 0 ? (
                <p className="text-center text-slate-500 py-12">No data available</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `$${v}`} />
                    <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]} />
                    <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardContent className="p-8 text-center text-slate-500">
              Product analytics coming soon
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
