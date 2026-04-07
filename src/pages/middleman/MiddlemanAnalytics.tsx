import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import {
  TrendingUp,
  DollarSign,
  BarChart3,
  Users,
  AlertTriangle,
  RefreshCw,
  Target,
  MousePointerClick,
  ShoppingCart,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type TimeRange = "30" | "90";

type DailyMetric = {
  date: string;
  revenue: number;
  deals: number;
  orders: number;
  commission: number;
  clicks: number;
  conversions: number;
};

type AnalyticsStats = {
  totalRevenue: number;
  avgCommissionRate: number;
  conversionRate: number;
  activeDeals: number;
  totalClicks: number;
  totalConversions: number;
  prevTotalRevenue: number;
  prevAvgCommissionRate: number;
  prevConversionRate: number;
  prevActiveDeals: number;
};

type TopProduct = {
  product_title: string;
  product_asin: string;
  revenue: number;
  conversions: number;
  clicks: number;
  commission: number;
};

const CHART_COLORS = ["#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#ef4444"];

function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function MiddlemanAnalytics() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>("30");
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AnalyticsStats>({
    totalRevenue: 0,
    avgCommissionRate: 0,
    conversionRate: 0,
    activeDeals: 0,
    totalClicks: 0,
    totalConversions: 0,
    prevTotalRevenue: 0,
    prevAvgCommissionRate: 0,
    prevConversionRate: 0,
    prevActiveDeals: 0,
  });
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);

  const fetchAnalytics = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch profile for currency
      const { data: profile } = await supabase
        .from("middleman_profiles")
        .select("currency")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile?.currency) {
        setCurrency(profile.currency);
      }

      const days = parseInt(timeRange, 10);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const startStr = startDate.toISOString();
      const endStr = endDate.toISOString();

      // Previous period for comparison
      const prevEndDate = new Date(startDate);
      const prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - days);
      const prevStartStr = prevStartDate.toISOString();
      const prevEndStr = prevEndDate.toISOString();

      // Fetch all deals for current period
      const { data: deals, error: dealsError } = await supabase
        .from("middle_man_deals")
        .select(
          "id, product_asin, product_id, commission_rate, margin_amount, clicks, conversions, total_revenue, is_active, created_at",
        )
        .eq("middle_man_id", user.id)
        .gte("created_at", startStr)
        .lte("created_at", endStr);

      if (dealsError) throw dealsError;

      // Previous period deals
      const { data: prevDeals } = await supabase
        .from("middle_man_deals")
        .select(
          "id, product_asin, commission_rate, margin_amount, clicks, conversions, total_revenue, is_active",
        )
        .eq("middle_man_id", user.id)
        .gte("created_at", prevStartStr)
        .lte("created_at", prevEndStr);

      // Compute stats
      const totalRevenue =
        deals?.reduce((sum, d) => sum + (Number(d.total_revenue) || 0), 0) ?? 0;
      const prevTotalRevenue =
        prevDeals?.reduce(
          (sum, d) => sum + (Number(d.total_revenue) || 0),
          0,
        ) ?? 0;

      const activeDeals = deals?.filter((d) => d.is_active).length ?? 0;
      const prevActiveDeals = prevDeals?.filter((d) => d.is_active).length ?? 0;

      const totalClicks =
        deals?.reduce((sum, d) => sum + (d.clicks || 0), 0) ?? 0;
      const totalConversions =
        deals?.reduce((sum, d) => sum + (d.conversions || 0), 0) ?? 0;

      const avgCommissionRate =
        deals?.length > 0
          ? deals.reduce(
              (sum, d) => sum + (Number(d.commission_rate) || 0),
              0,
            ) / deals.length
          : 0;

      const prevAvgCommissionRate =
        prevDeals?.length > 0
          ? prevDeals.reduce(
              (sum, d) => sum + (Number(d.commission_rate) || 0),
              0,
            ) / prevDeals.length
          : 0;

      const conversionRate =
        totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
      const prevTotalClicks =
        prevDeals?.reduce((sum, d) => sum + (d.clicks || 0), 0) ?? 0;
      const prevTotalConversions =
        prevDeals?.reduce((sum, d) => sum + (d.conversions || 0), 0) ?? 0;
      const prevConversionRate =
        prevTotalClicks > 0
          ? (prevTotalConversions / prevTotalClicks) * 100
          : 0;

      setStats({
        totalRevenue,
        avgCommissionRate,
        conversionRate,
        activeDeals,
        totalClicks,
        totalConversions,
        prevTotalRevenue,
        prevAvgCommissionRate,
        prevConversionRate,
        prevActiveDeals,
      });

      // Build daily metrics
      const metricsMap = new Map<string, DailyMetric>();
      const current = new Date(startDate);
      while (current <= endDate) {
        const key = current.toISOString().split("T")[0];
        metricsMap.set(key, {
          date: key,
          revenue: 0,
          deals: 0,
          orders: 0,
          commission: 0,
          clicks: 0,
          conversions: 0,
        });
        current.setDate(current.getDate() + 1);
      }

      if (deals) {
        deals.forEach((deal) => {
          const dateKey = deal.created_at.split("T")[0];
          const metric = metricsMap.get(dateKey);
          if (metric) {
            metric.deals += 1;
            metric.clicks += deal.clicks || 0;
            metric.conversions += deal.conversions || 0;
            metric.revenue += Number(deal.total_revenue) || 0;
            const dealCommission =
              deal.margin_amount > 0
                ? deal.margin_amount * deal.conversions
                : (Number(deal.total_revenue) || 0) *
                  (Number(deal.commission_rate) / 100);
            metric.commission += dealCommission;
          }
        });
      }

      // Fetch orders for this middleman in the period
      const { data: orders } = await supabase
        .from("orders")
        .select("id, created_at, total")
        .eq("middle_man_id", user.id)
        .gte("created_at", startStr)
        .lte("created_at", endStr);

      if (orders) {
        orders.forEach((order) => {
          const dateKey = order.created_at.split("T")[0];
          const metric = metricsMap.get(dateKey);
          if (metric) {
            metric.orders += 1;
            metric.revenue += Number(order.total) || 0;
          }
        });
      }

      const sortedMetrics = Array.from(metricsMap.values()).sort((a, b) =>
        a.date.localeCompare(b.date),
      );
      setDailyMetrics(sortedMetrics);

      // Top products
      const productMap = new Map<
        string,
        {
          product_asin: string;
          revenue: number;
          conversions: number;
          clicks: number;
          commission: number;
          product_id: string | null;
        }
      >();

      if (deals) {
        deals.forEach((deal) => {
          const key = deal.product_asin;
          const existing = productMap.get(key);
          const dealCommission =
            deal.margin_amount > 0
              ? deal.margin_amount * deal.conversions
              : (Number(deal.total_revenue) || 0) *
                (Number(deal.commission_rate) / 100);

          if (existing) {
            existing.revenue += Number(deal.total_revenue) || 0;
            existing.conversions += deal.conversions || 0;
            existing.clicks += deal.clicks || 0;
            existing.commission += dealCommission;
          } else {
            productMap.set(key, {
              product_asin: deal.product_asin,
              revenue: Number(deal.total_revenue) || 0,
              conversions: deal.conversions || 0,
              clicks: deal.clicks || 0,
              commission: dealCommission,
              product_id: deal.product_id,
            });
          }
        });
      }

      const topProductsSorted = Array.from(productMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Enrich with product titles
      const productIds = topProductsSorted
        .map((p) => p.product_id)
        .filter(Boolean) as string[];

      const productTitleMap: Record<string, string> = {};
      if (productIds.length > 0) {
        const { data: products } = await supabase
          .from("products")
          .select("id, title")
          .in("id", productIds);

        if (products) {
          products.forEach((p) => {
            productTitleMap[p.id] = p.title;
          });
        }
      }

      const enrichedTopProducts = topProductsSorted.map((p) => ({
        product_title:
          p.product_id && productTitleMap[p.product_id]
            ? productTitleMap[p.product_id]
            : `ASIN: ${p.product_asin}`,
        product_asin: p.product_asin,
        revenue: p.revenue,
        conversions: p.conversions,
        clicks: p.clicks,
        commission: p.commission,
      }));

      setTopProducts(enrichedTopProducts);
    } catch (err) {
      console.error("Error fetching middleman analytics:", err);
      setError("Failed to load analytics data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user, timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const funnelData = useMemo(
    () => [
      { stage: "Impressions", value: stats.totalClicks * 10, fill: "#8b5cf6" },
      { stage: "Clicks", value: stats.totalClicks, fill: "#06b6d4" },
      {
        stage: "Conversions",
        value: stats.totalConversions,
        fill: "#10b981",
      },
    ],
    [stats.totalClicks, stats.totalConversions],
  );

  const pctChange = (current: number, prev: number): number => {
    if (prev === 0) return current > 0 ? 100 : 0;
    return ((current - prev) / prev) * 100;
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 space-y-8">
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div className="space-y-3">
            <div className="h-4 w-40 bg-white/5 rounded animate-pulse" />
            <div className="h-10 w-56 bg-white/5 rounded-xl animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-20 bg-white/5 rounded-xl animate-pulse" />
            <div className="h-10 w-20 bg-white/5 rounded-xl animate-pulse" />
          </div>
        </div>

        {/* KPI skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="glass-card p-6 rounded-[2rem] border-white/5 bg-white/5 animate-pulse"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 bg-white/5 rounded-2xl" />
                <div className="h-3 w-12 bg-white/5 rounded" />
              </div>
              <div className="h-8 w-20 bg-white/5 rounded mb-2" />
              <div className="h-3 w-24 bg-white/5 rounded" />
            </div>
          ))}
        </div>

        {/* Chart skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] border-white/5 bg-white/5 animate-pulse">
            <div className="h-6 w-36 bg-white/5 rounded mb-6" />
            <div className="h-64 bg-white/5 rounded-xl" />
          </div>
          <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] border-white/5 bg-white/5 animate-pulse">
            <div className="h-6 w-36 bg-white/5 rounded mb-6" />
            <div className="h-64 bg-white/5 rounded-xl" />
          </div>
        </div>

        {/* Funnel + table skeletons */}
        <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] border-white/5 bg-white/5 animate-pulse">
          <div className="h-6 w-40 bg-white/5 rounded mb-6" />
          <div className="h-48 bg-white/5 rounded-xl" />
        </div>
        <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] border-white/5 bg-white/5 animate-pulse">
          <div className="h-6 w-48 bg-white/5 rounded mb-6" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 bg-white/5 rounded-lg mb-2" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center space-y-6">
        <div className="w-20 h-20 mx-auto glass-card rounded-[2rem] border-rose-500/20 bg-rose-500/5 flex items-center justify-center">
          <AlertTriangle className="h-10 w-10 text-rose-400" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          Analytics Unavailable
        </h2>
        <p className="text-sm text-muted-foreground">{error}</p>
        <button
          onClick={() => fetchAnalytics()}
          className="inline-flex items-center gap-2 px-6 py-3 glass-card rounded-2xl border-white/10 hover:bg-white/10 transition-all text-sm font-medium"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 space-y-8 pb-32">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Insights
          </p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
            Analytics
          </h1>
        </div>
        <div className="flex gap-2">
          {(["30", "90"] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                timeRange === range
                  ? "bg-blue-500/15 border border-blue-500/30 text-blue-400"
                  : "glass-card border-white/10 text-muted-foreground hover:bg-white/10"
              }`}
            >
              {range}d
            </button>
          ))}
        </div>
      </div>

      {/* ===== KPI CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="glass-card p-6 rounded-[2rem] border-white/5 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl glass border bg-blue-500/10 border-blue-500/20">
                <DollarSign className="h-5 w-5 text-blue-400" />
              </div>
              {stats.prevTotalRevenue > 0 && (
                <div
                  className={`flex items-center gap-1 text-xs font-semibold ${
                    pctChange(stats.totalRevenue, stats.prevTotalRevenue) >= 0
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }`}
                >
                  {pctChange(stats.totalRevenue, stats.prevTotalRevenue) >=
                  0 ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {Math.abs(
                    pctChange(stats.totalRevenue, stats.prevTotalRevenue),
                  ).toFixed(1)}
                  %
                </div>
              )}
            </div>
            <p className="text-3xl font-bold text-foreground mb-1">
              {formatCurrency(stats.totalRevenue, currency)}
            </p>
            <p className="text-xs font-medium text-muted-foreground">
              Total Revenue
            </p>
          </div>
        </div>

        {/* Avg Commission Rate */}
        <div className="glass-card p-6 rounded-[2rem] border-white/5 bg-gradient-to-br from-violet-500/10 to-purple-500/5 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl glass border bg-violet-500/10 border-violet-500/20">
                <BarChart3 className="h-5 w-5 text-violet-400" />
              </div>
              {stats.prevAvgCommissionRate > 0 && (
                <div
                  className={`flex items-center gap-1 text-xs font-semibold ${
                    pctChange(
                      stats.avgCommissionRate,
                      stats.prevAvgCommissionRate,
                    ) >= 0
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }`}
                >
                  {pctChange(
                    stats.avgCommissionRate,
                    stats.prevAvgCommissionRate,
                  ) >= 0 ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {Math.abs(
                    pctChange(
                      stats.avgCommissionRate,
                      stats.prevAvgCommissionRate,
                    ),
                  ).toFixed(1)}
                  %
                </div>
              )}
            </div>
            <p className="text-3xl font-bold text-foreground mb-1">
              {stats.avgCommissionRate.toFixed(1)}%
            </p>
            <p className="text-xs font-medium text-muted-foreground">
              Avg Commission Rate
            </p>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="glass-card p-6 rounded-[2rem] border-white/5 bg-gradient-to-br from-emerald-500/10 to-green-500/5 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl glass border bg-emerald-500/10 border-emerald-500/20">
                <Target className="h-5 w-5 text-emerald-400" />
              </div>
              {stats.prevConversionRate > 0 && (
                <div
                  className={`flex items-center gap-1 text-xs font-semibold ${
                    pctChange(stats.conversionRate, stats.prevConversionRate) >=
                    0
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }`}
                >
                  {pctChange(stats.conversionRate, stats.prevConversionRate) >=
                  0 ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {Math.abs(
                    pctChange(stats.conversionRate, stats.prevConversionRate),
                  ).toFixed(1)}
                  %
                </div>
              )}
            </div>
            <p className="text-3xl font-bold text-foreground mb-1">
              {stats.conversionRate.toFixed(1)}%
            </p>
            <p className="text-xs font-medium text-muted-foreground">
              Conversion Rate
            </p>
          </div>
        </div>

        {/* Active Deals */}
        <div className="glass-card p-6 rounded-[2rem] border-white/5 bg-gradient-to-br from-amber-500/10 to-orange-500/5 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-2xl glass border bg-amber-500/10 border-amber-500/20">
                <TrendingUp className="h-5 w-5 text-amber-400" />
              </div>
              {stats.prevActiveDeals > 0 && (
                <div
                  className={`flex items-center gap-1 text-xs font-semibold ${
                    pctChange(stats.activeDeals, stats.prevActiveDeals) >= 0
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }`}
                >
                  {pctChange(stats.activeDeals, stats.prevActiveDeals) >= 0 ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {Math.abs(
                    pctChange(stats.activeDeals, stats.prevActiveDeals),
                  ).toFixed(1)}
                  %
                </div>
              )}
            </div>
            <p className="text-3xl font-bold text-foreground mb-1">
              {stats.activeDeals}
            </p>
            <p className="text-xs font-medium text-muted-foreground">
              Active Deals
            </p>
          </div>
        </div>
      </div>

      {/* ===== CHARTS ROW ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] border-white/5 bg-white/5">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-foreground">
              Revenue Trend
            </h2>
          </div>
          {dailyMetrics.length === 0 ||
          dailyMetrics.every((d) => d.revenue === 0) ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No revenue data for this period.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={dailyMetrics}>
                <defs>
                  <linearGradient
                    id="revenueGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDateShort}
                  tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  tickFormatter={(v: number) =>
                    v >= 1000
                      ? `$${(v / 1000).toFixed(0)}k`
                      : `$${v.toFixed(0)}`
                  }
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(15,15,30,0.9)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => [
                    formatCurrency(value, currency),
                    "Revenue",
                  ]}
                  labelFormatter={(label: string) => formatDateShort(label)}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Orders & Commissions Bar Chart */}
        <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] border-white/5 bg-white/5">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-foreground">
              Orders & Commissions
            </h2>
          </div>
          {dailyMetrics.length === 0 ||
          dailyMetrics.every((d) => d.orders === 0 && d.commission === 0) ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No order data for this period.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dailyMetrics}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDateShort}
                  tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(15,15,30,0.9)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === "commission")
                      return [formatCurrency(value, currency), "Commission"];
                    return [value, "Orders"];
                  }}
                  labelFormatter={(label: string) => formatDateShort(label)}
                />
                <Bar
                  dataKey="orders"
                  fill="#06b6d4"
                  radius={[4, 4, 0, 0]}
                  name="Orders"
                />
                <Bar
                  dataKey="commission"
                  fill="#8b5cf6"
                  radius={[4, 4, 0, 0]}
                  name="Commission"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ===== FUNNEL ===== */}
      <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] border-white/5 bg-white/5">
        <div className="flex items-center gap-2 mb-6">
          <MousePointerClick className="h-5 w-5 text-emerald-400" />
          <h2 className="text-lg font-semibold text-foreground">Deal Funnel</h2>
        </div>
        {funnelData.every((d) => d.value === 0) ? (
          <div className="py-12 text-center">
            <Eye className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No funnel data available yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {funnelData.map((item, index) => {
              const prevValue =
                index > 0 ? funnelData[index - 1].value : item.value;
              const rate =
                prevValue > 0
                  ? ((item.value / prevValue) * 100).toFixed(1)
                  : "0";

              return (
                <div key={item.stage} className="text-center space-y-3">
                  <div className="relative mx-auto">
                    <div
                      className="mx-auto rounded-2xl glass-card border-white/5 bg-white/5 flex items-center justify-center"
                      style={{
                        width: `${Math.max(60, (item.value / (funnelData[0]?.value || 1)) * 100)}%`,
                        maxWidth: "100%",
                        height: "80px",
                      }}
                    >
                      <span className="text-2xl font-bold text-foreground">
                        {item.value.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {item.stage}
                  </p>
                  {index > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {rate}% conversion
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===== TOP PRODUCTS TABLE ===== */}
      <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] border-white/5 bg-white/5">
        <div className="flex items-center gap-2 mb-6">
          <ShoppingCart className="h-5 w-5 text-amber-400" />
          <h2 className="text-lg font-semibold text-foreground">
            Top Performing Products
          </h2>
        </div>
        {topProducts.length === 0 ? (
          <div className="py-12 text-center">
            <ShoppingCart className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No product performance data yet.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 pb-3 px-4">
                      Product
                    </th>
                    <th className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 pb-3 px-4">
                      Revenue
                    </th>
                    <th className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 pb-3 px-4">
                      Conversions
                    </th>
                    <th className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 pb-3 px-4">
                      Clicks
                    </th>
                    <th className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 pb-3 px-4">
                      Commission
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((product) => (
                    <tr
                      key={product.product_asin}
                      className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <p className="text-sm font-medium text-foreground truncate max-w-[250px]">
                          {product.product_title}
                        </p>
                        <p className="text-xs text-muted-foreground/50">
                          {product.product_asin}
                        </p>
                      </td>
                      <td className="text-right py-3 px-4 text-sm font-semibold text-foreground">
                        {formatCurrency(product.revenue, currency)}
                      </td>
                      <td className="text-right py-3 px-4 text-sm text-muted-foreground">
                        {product.conversions}
                      </td>
                      <td className="text-right py-3 px-4 text-sm text-muted-foreground">
                        {product.clicks}
                      </td>
                      <td className="text-right py-3 px-4 text-sm font-medium text-emerald-400">
                        {formatCurrency(product.commission, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden space-y-3">
              {topProducts.map((product) => (
                <div
                  key={product.product_asin}
                  className="glass-card p-4 rounded-2xl border-white/5 bg-white/5"
                >
                  <p className="text-sm font-semibold text-foreground truncate mb-1">
                    {product.product_title}
                  </p>
                  <p className="text-xs text-muted-foreground/50 mb-3">
                    {product.product_asin}
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground/50">Revenue</span>
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(product.revenue, currency)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground/50">
                        Commission
                      </span>
                      <p className="text-sm font-medium text-emerald-400">
                        {formatCurrency(product.commission, currency)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground/50">
                        Conversions
                      </span>
                      <p className="text-sm text-muted-foreground">
                        {product.conversions}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground/50">Clicks</span>
                      <p className="text-sm text-muted-foreground">
                        {product.clicks}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
