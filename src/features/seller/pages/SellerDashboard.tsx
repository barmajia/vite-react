import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  DollarSign,
  ShoppingCart,
  Package,
  TrendingUp,
  Plus,
  Eye,
  User,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  AlertTriangle,
  Store,
  Calendar,
  Clock,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SellerStats = {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  activeProducts: number;
  conversionRate: number;
  pendingOrders: number;
  completedOrders: number;
  revenueChange: number;
  ordersChange: number;
};

type RecentOrder = {
  id: string;
  status: string;
  total: number;
  created_at: string;
  customer_name: string | null;
  payment_status: string;
  items_count: number;
};

type SellerProfile = {
  store_name: string | null;
  full_name: string;
  is_verified: boolean;
};

type DashboardData = {
  stats: SellerStats;
  recentOrders: RecentOrder[];
  profile: SellerProfile | null;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const statusBadgeClasses: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  confirmed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  processing: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  shipped: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  delivered: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  cancelled: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  refunded: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  out_for_delivery: "bg-sky-500/10 text-sky-500 border-sky-500/20",
};

const paymentBadgeClasses: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  failed: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  refunded: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function fetchDashboardData(userId: string): Promise<DashboardData> {
  // --- Stats: revenue ---
  const { data: revenueData, error: revenueError } = await supabase
    .from("orders")
    .select("total, created_at")
    .eq("seller_id", userId)
    .eq("status", "delivered");

  if (revenueError && revenueError.code !== "PGRST116") {
    console.error("Revenue fetch error:", revenueError);
  }

  const totalRevenue =
    revenueData?.reduce((sum, o) => sum + Number(o.total), 0) ?? 0;

  // Revenue change (this period vs last period - last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const { data: currentRevenue } = await supabase
    .from("orders")
    .select("total")
    .eq("seller_id", userId)
    .eq("status", "delivered")
    .gte("created_at", thirtyDaysAgo.toISOString());

  const { data: prevRevenue } = await supabase
    .from("orders")
    .select("total")
    .eq("seller_id", userId)
    .eq("status", "delivered")
    .gte("created_at", sixtyDaysAgo.toISOString())
    .lt("created_at", thirtyDaysAgo.toISOString());

  const currentRev =
    currentRevenue?.reduce((sum, o) => sum + Number(o.total), 0) ?? 0;
  const prevRev =
    prevRevenue?.reduce((sum, o) => sum + Number(o.total), 0) ?? 0;
  const revenueChange =
    prevRev > 0 ? ((currentRev - prevRev) / prevRev) * 100 : currentRev > 0 ? 100 : 0;

  // --- Stats: orders ---
  const { data: allOrders, error: ordersError } = await supabase
    .from("orders")
    .select("id, status")
    .eq("seller_id", userId);

  if (ordersError && ordersError.code !== "PGRST116") {
    console.error("Orders fetch error:", ordersError);
  }

  const totalOrders = allOrders?.length ?? 0;
  const pendingOrders =
    allOrders?.filter((o) => ["pending", "processing"].includes(o.status))
      .length ?? 0;
  const completedOrders =
    allOrders?.filter((o) => ["delivered"].includes(o.status)).length ?? 0;

  const { data: currentOrders } = await supabase
    .from("orders")
    .select("id")
    .eq("seller_id", userId)
    .gte("created_at", thirtyDaysAgo.toISOString());

  const { data: prevOrders } = await supabase
    .from("orders")
    .select("id")
    .eq("seller_id", userId)
    .gte("created_at", sixtyDaysAgo.toISOString())
    .lt("created_at", thirtyDaysAgo.toISOString());

  const currentOrdCount = currentOrders?.length ?? 0;
  const prevOrdCount = prevOrders?.length ?? 0;
  const ordersChange =
    prevOrdCount > 0
      ? ((currentOrdCount - prevOrdCount) / prevOrdCount) * 100
      : currentOrdCount > 0
        ? 100
        : 0;

  // --- Stats: products ---
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, status")
    .eq("seller_id", userId)
    .eq("is_deleted", false);

  if (productsError && productsError.code !== "PGRST116") {
    console.error("Products fetch error:", productsError);
  }

  const totalProducts = products?.length ?? 0;
  const activeProducts =
    products?.filter((p) => p.status === "active").length ?? 0;

  // Conversion rate (delivered orders / total product views proxy: products * 10)
  const conversionRate =
    totalProducts > 0
      ? Math.min((completedOrders / (totalProducts * 10)) * 100, 100)
      : 0;

  // --- Recent orders ---
  const { data: recentOrdersRaw, error: recentOrdersError } = await supabase
    .from("orders")
    .select(
      "id, status, total, created_at, payment_status",
    )
    .eq("seller_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (recentOrdersError && recentOrdersError.code !== "PGRST116") {
    console.error("Recent orders fetch error:", recentOrdersError);
  }

  // Enrich with customer name from users table
  const recentOrders: RecentOrder[] = [];
  if (recentOrdersRaw) {
    for (const order of recentOrdersRaw) {
      const { data: userData } = await supabase
        .from("users")
        .select("full_name")
        .eq("user_id", order.user_id)
        .maybeSingle();

      const { data: itemsCount } = await supabase
        .from("order_items")
        .select("id", { count: "exact", head: true })
        .eq("order_id", order.id);

      recentOrders.push({
        id: order.id,
        status: order.status,
        total: Number(order.total),
        created_at: order.created_at,
        customer_name: userData?.full_name ?? "Customer",
        payment_status: order.payment_status,
        items_count: itemsCount?.count ?? 0,
      });
    }
  }

  // --- Profile ---
  const { data: profileData } = await supabase
    .from("users")
    .select("full_name, is_verified")
    .eq("user_id", userId)
    .maybeSingle();

  const profile: SellerProfile | null = profileData
    ? {
        store_name: null,
        full_name: profileData.full_name ?? "Seller",
        is_verified: profileData.is_verified ?? false,
      }
    : null;

  return {
    stats: {
      totalRevenue,
      totalOrders,
      totalProducts,
      activeProducts,
      conversionRate,
      pendingOrders,
      completedOrders,
      revenueChange: Math.round(revenueChange * 10) / 10,
      ordersChange: Math.round(ordersChange * 10) / 10,
    },
    recentOrders,
    profile,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SellerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchDashboardData(user.id);
      setData(result);
    } catch (err) {
      console.error("Failed to load seller dashboard:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRetry = () => {
    setRetrying(true);
    loadData();
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={handleRetry} retrying={retrying} />;
  }

  if (!data) {
    return <ErrorState message="No data available." onRetry={handleRetry} retrying={retrying} />;
  }

  const { stats, recentOrders, profile } = data;
  const displayName = profile?.full_name ?? user.user_metadata?.full_name ?? "Seller";

  const quickActions = [
    {
      label: "Add Product",
      icon: Plus,
      href: "/seller/products/new",
      description: "List a new product",
      gradient: "from-emerald-500/20 to-teal-500/20",
      iconColor: "text-emerald-500",
      borderColor: "border-emerald-500/20",
      hoverBg: "hover:bg-emerald-500/10",
    },
    {
      label: "View Orders",
      icon: ShoppingCart,
      href: "/seller/orders",
      description: `${stats.pendingOrders} pending`,
      gradient: "from-violet-500/20 to-purple-500/20",
      iconColor: "text-violet-500",
      borderColor: "border-violet-500/20",
      hoverBg: "hover:bg-violet-500/10",
    },
    {
      label: "Manage Profile",
      icon: User,
      href: "/seller/profile",
      description: "Update store settings",
      gradient: "from-cyan-500/20 to-blue-500/20",
      iconColor: "text-cyan-500",
      borderColor: "border-cyan-500/20",
      hoverBg: "hover:bg-cyan-500/10",
    },
    {
      label: "Analytics",
      icon: TrendingUp,
      href: "/seller/analytics",
      description: "View detailed stats",
      gradient: "from-amber-500/20 to-orange-500/20",
      iconColor: "text-amber-500",
      borderColor: "border-amber-500/20",
      hoverBg: "hover:bg-amber-500/10",
    },
  ];

  const kpiCards = [
    {
      title: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      change: stats.revenueChange,
      gradient: "from-emerald-500 to-teal-500",
      glowColor: "shadow-emerald-500/10",
    },
    {
      title: "Total Orders",
      value: stats.totalOrders.toString(),
      icon: ShoppingCart,
      change: stats.ordersChange,
      gradient: "from-violet-500 to-purple-500",
      glowColor: "shadow-violet-500/10",
    },
    {
      title: "Active Products",
      value: `${stats.activeProducts}/${stats.totalProducts}`,
      icon: Package,
      change: null,
      gradient: "from-cyan-500 to-blue-500",
      glowColor: "shadow-cyan-500/10",
    },
    {
      title: "Conversion Rate",
      value: `${stats.conversionRate.toFixed(1)}%`,
      icon: TrendingUp,
      change: null,
      gradient: "from-amber-500 to-orange-500",
      glowColor: "shadow-amber-500/10",
    },
  ];

  return (
    <div className="space-y-8">
      {/* ---- Welcome Banner ---- */}
      <div className="relative overflow-hidden glass rounded-[2rem] border-white/10 p-8 md:p-10 shadow-2xl">
        {/* Decorative background */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="relative">
                <div className="absolute -inset-2 bg-primary/20 rounded-full blur-xl opacity-60" />
                <div className="relative w-12 h-12 rounded-2xl bg-primary/20 border-2 border-white/10 flex items-center justify-center">
                  <Store className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black italic tracking-tighter leading-none">
                  Welcome back, {displayName}
                </h1>
                {profile?.is_verified && (
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                    Verified Seller
                  </span>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground/60 max-w-lg">
              Here's what's happening with your store today. You have{" "}
              <span className="text-primary font-bold">{stats.pendingOrders}</span>{" "}
              {stats.pendingOrders === 1 ? "order" : "orders"} that need attention.
            </p>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground/40 text-xs font-mono">
            <Calendar className="h-3.5 w-3.5" />
            <span>{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
          </div>
        </div>
      </div>

      {/* ---- KPI Cards ---- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => (
          <div
            key={card.title}
            className={cn(
              "glass rounded-[1.5rem] border-white/10 p-6 shadow-xl transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl",
              card.glowColor,
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                {card.title}
              </span>
              <div
                className={cn(
                  "p-2.5 rounded-2xl bg-gradient-to-br text-white shadow-lg",
                  card.gradient,
                )}
              >
                <card.icon className="h-4 w-4" />
              </div>
            </div>

            <div className="text-2xl font-black italic tracking-tight leading-none mb-2">
              {card.value}
            </div>

            {card.change !== null && (
              <div className="flex items-center gap-1">
                {card.change >= 0 ? (
                  <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
                )}
                <span
                  className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    card.change >= 0 ? "text-emerald-500" : "text-rose-500",
                  )}
                >
                  {card.change >= 0 ? "+" : ""}
                  {card.change}% from last month
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ---- Quick Actions ---- */}
      <div>
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-4">
          Quick Actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              to={action.href}
              className={cn(
                "glass rounded-[1.5rem] border-white/10 p-5 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl group block",
                action.hoverBg,
              )}
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "p-3 rounded-2xl bg-gradient-to-br flex-shrink-0 transition-all duration-500 group-hover:scale-110",
                    action.gradient,
                  )}
                >
                  <action.icon className={cn("h-5 w-5 text-white")} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black italic tracking-tight leading-none mb-1">
                    {action.label}
                  </p>
                  <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                    {action.description}
                  </p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground/20 transition-all duration-500 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 flex-shrink-0 mt-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ---- Recent Orders ---- */}
      <div className="glass rounded-[2rem] border-white/10 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 pb-4 border-b border-white/5">
          <div>
            <h2 className="text-lg font-black italic tracking-tight">Recent Orders</h2>
            <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest mt-0.5">
              Latest activity from your store
            </p>
          </div>
          {recentOrders.length > 0 && (
            <Link
              to="/seller/orders"
              className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary/60 hover:text-primary transition-colors px-4 py-2 rounded-2xl hover:bg-primary/5"
            >
              View All
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          )}
        </div>

        {recentOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="relative mb-6">
              <div className="absolute -inset-4 bg-primary/10 rounded-full blur-xl" />
              <ShoppingCart className="h-12 w-12 text-muted-foreground/20 relative z-10" />
            </div>
            <h3 className="text-sm font-black italic tracking-tight mb-1">No orders yet</h3>
            <p className="text-xs text-muted-foreground/40 mb-6 max-w-xs">
              When customers place orders, they'll appear here.
            </p>
            <Link
              to="/seller/products"
              className="px-6 py-3 glass bg-white/5 border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all duration-500"
            >
              Manage Products
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors group cursor-pointer"
                onClick={() => navigate(`/seller/orders/${order.id}`)}
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-white/5 flex items-center justify-center flex-shrink-0">
                    <Package className="h-4 w-4 text-primary/60" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold tracking-tight truncate">
                      Order #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest">
                        {order.customer_name}
                      </span>
                      <span className="text-[10px] text-muted-foreground/20">
                        {order.items_count} {order.items_count === 1 ? "item" : "items"}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground/30">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(order.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-black italic tracking-tight">
                    {formatCurrency(order.total)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border",
                        statusBadgeClasses[order.status] ?? "bg-gray-500/10 text-gray-400 border-gray-500/20",
                      )}
                    >
                      {order.status.replace(/_/g, " ")}
                    </span>
                    <span
                      className={cn(
                        "px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border hidden sm:inline-flex",
                        paymentBadgeClasses[order.payment_status] ?? "bg-gray-500/10 text-gray-400 border-gray-500/20",
                      )}
                    >
                      {order.payment_status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Welcome banner skeleton */}
      <div className="glass rounded-[2rem] border-white/10 p-8 md:p-10 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/5" />
          <div className="flex-1 space-y-3">
            <div className="h-7 w-64 rounded-xl bg-white/5" />
            <div className="h-4 w-96 max-w-full rounded-lg bg-white/5" />
          </div>
        </div>
      </div>

      {/* KPI cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="glass rounded-[1.5rem] border-white/10 p-6 animate-pulse"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="h-3 w-24 rounded-lg bg-white/5" />
              <div className="w-10 h-10 rounded-2xl bg-white/5" />
            </div>
            <div className="h-8 w-32 rounded-xl bg-white/5 mb-3" />
            <div className="h-3 w-40 rounded-lg bg-white/5" />
          </div>
        ))}
      </div>

      {/* Quick actions skeleton */}
      <div>
        <div className="h-3 w-32 rounded-lg bg-white/5 mb-4 animate-pulse" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="glass rounded-[1.5rem] border-white/10 p-5 animate-pulse"
            >
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-white/5 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 rounded-lg bg-white/5" />
                  <div className="h-3 w-32 rounded-lg bg-white/5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent orders skeleton */}
      <div className="glass rounded-[2rem] border-white/10 overflow-hidden animate-pulse">
        <div className="p-6 pb-4 border-b border-white/5">
          <div className="h-5 w-40 rounded-lg bg-white/5 mb-2" />
          <div className="h-3 w-56 rounded-lg bg-white/5" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-5 border-b border-white/5 last:border-0">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-10 h-10 rounded-2xl bg-white/5 flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-48 rounded-lg bg-white/5" />
                <div className="h-3 w-64 max-w-full rounded-lg bg-white/5" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-4 w-20 rounded-lg bg-white/5" />
              <div className="h-5 w-16 rounded-full bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error State
// ---------------------------------------------------------------------------

function ErrorState({
  message,
  onRetry,
  retrying,
}: {
  message: string;
  onRetry: () => void;
  retrying: boolean;
}) {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center max-w-md p-8 glass rounded-[2rem] border-white/10 shadow-2xl">
        <div className="relative inline-block mb-6">
          <div className="absolute -inset-4 bg-rose-500/10 rounded-full blur-xl" />
          <AlertTriangle className="h-12 w-12 text-rose-500/60 relative z-10" />
        </div>
        <h2 className="text-lg font-black italic tracking-tight mb-2">
          Something went wrong
        </h2>
        <p className="text-xs text-muted-foreground/50 mb-6">{message}</p>
        <button
          onClick={onRetry}
          disabled={retrying}
          className={cn(
            "inline-flex items-center gap-2 px-6 py-3 glass bg-white/5 border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-500",
            retrying
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-white/10 hover:scale-105 active:scale-95 cursor-pointer",
          )}
        >
          {retrying ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              Retrying...
            </>
          ) : (
            <>
              <RefreshCw className="h-3.5 w-3.5" />
              Try Again
            </>
          )}
        </button>
      </div>
    </div>
  );
}
