import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import {
  TrendingUp,
  Users,
  Package,
  DollarSign,
  Loader2,
} from "lucide-react";

export function AnalyticsPanel() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<any>(null);
  const [period, setPeriod] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!user) return;
      setLoading(true);
      setError(null);

      try {
        const { data, error: rpcError } = await supabase.rpc(
          "get_seller_kpis",
          {
            p_seller_id: user.id,
            p_period: period,
          }
        );

        if (rpcError) {
          setError(rpcError.message);
          return;
        }

        setKpis(data);
      } catch (err: any) {
        setError(err.message ?? "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user, period]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl border">
        <p className="text-red-500 mb-2">Failed to load analytics</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
      </div>
    );
  }

  if (!kpis) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl border">
        <p className="text-gray-500 dark:text-gray-400">
          No analytics data available yet.
        </p>
      </div>
    );
  }

  const kpiData = kpis?.kpis ?? {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Performance Analytics</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track your shop's performance over time.
          </p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="p-2.5 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
        >
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<DollarSign className="w-5 h-5" />}
          label="Revenue"
          value={`$${kpiData.total_revenue ?? "0.00"}`}
          color="green"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Sales"
          value={kpiData.total_sales ?? 0}
          color="blue"
        />
        <StatCard
          icon={<Package className="w-5 h-5" />}
          label="Items Sold"
          value={kpiData.total_items_sold ?? 0}
          color="purple"
        />
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Customers"
          value={kpiData.unique_customers_in_period ?? 0}
          color="orange"
        />
      </div>

      {/* Daily Breakdown Table (if available) */}
      {kpis.daily_breakdown && kpis.daily_breakdown.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Daily Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-right p-3 font-medium">Revenue</th>
                  <th className="text-right p-3 font-medium">Sales</th>
                  <th className="text-right p-3 font-medium">Items</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {kpis.daily_breakdown
                  .slice(0, 10)
                  .map((row: any, idx: number) => (
                    <tr
                      key={idx}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="p-3">{row.date ?? "—"}</td>
                      <td className="p-3 text-right">
                        ${row.revenue ?? "0.00"}
                      </td>
                      <td className="p-3 text-right">{row.sales ?? 0}</td>
                      <td className="p-3 text-right">{row.items ?? 0}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    green:
      "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400",
    blue: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400",
    purple:
      "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400",
    orange:
      "bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400",
  };

  return (
    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border flex items-center gap-4">
      <div className={`p-2.5 rounded-lg ${colorMap[color] ?? "bg-gray-50 text-gray-600"}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}
