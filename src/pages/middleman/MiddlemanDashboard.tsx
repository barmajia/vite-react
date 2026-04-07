import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import {
  Briefcase,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  Plus,
  ListChecks,
  Package,
  Users,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

type DashboardStats = {
  totalDeals: number;
  activeDeals: number;
  commissionEarned: number;
  ordersCompleted: number;
};

type RecentDeal = {
  id: string;
  product_asin: string;
  commission_rate: number;
  margin_amount: number;
  clicks: number;
  conversions: number;
  total_revenue: number;
  is_active: boolean;
  created_at: string;
  product_title?: string;
  product_price?: number;
};

export function MiddlemanDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalDeals: 0,
    activeDeals: 0,
    commissionEarned: 0,
    ordersCompleted: 0,
  });
  const [recentDeals, setRecentDeals] = useState<RecentDeal[]>([]);
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchDashboard = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch middleman profile for currency
        const { data: profile, error: profileError } = await supabase
          .from("middleman_profiles")
          .select("currency")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileError && profileError.code !== "PGRST116") {
          console.warn("Middleman profile fetch error:", profileError);
        }

        if (profile?.currency) {
          setCurrency(profile.currency);
        }

        // Fetch deals stats
        const { data: deals, error: dealsError } = await supabase
          .from("middle_man_deals")
          .select(
            "id, is_active, commission_rate, margin_amount, clicks, conversions, total_revenue, product_asin, created_at",
          )
          .eq("middle_man_id", user.id)
          .order("created_at", { ascending: false });

        if (dealsError) {
          throw dealsError;
        }

        const totalDeals = deals?.length ?? 0;
        const activeDeals = deals?.filter((d) => d.is_active).length ?? 0;
        const totalCommission =
          deals?.reduce((sum, d) => {
            if (d.margin_amount > 0)
              return sum + d.margin_amount * d.conversions;
            return sum + (d.total_revenue ?? 0) * (d.commission_rate / 100);
          }, 0) ?? 0;

        // Fetch orders completed (orders where middle_man_id = user and status = delivered)
        const { count: completedOrders, error: ordersError } = await supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("middle_man_id", user.id)
          .in("status", ["delivered", "completed"]);

        if (ordersError) {
          console.warn("Orders fetch error:", ordersError);
        }

        setStats({
          totalDeals,
          activeDeals,
          commissionEarned: totalCommission,
          ordersCompleted: completedOrders ?? 0,
        });

        // Fetch recent 5 deals with product info
        const recent = (deals ?? []).slice(0, 5);
        const dealsWithProducts: RecentDeal[] = await Promise.all(
          recent.map(async (deal) => {
            let productTitle: string | undefined;
            let productPrice: number | undefined;

            if (deal.product_id) {
              const { data: product } = await supabase
                .from("products")
                .select("title, price")
                .eq("id", deal.product_id)
                .maybeSingle();

              productTitle = product?.title;
              productPrice = product?.price;
            }

            return {
              id: deal.id,
              product_asin: deal.product_asin,
              commission_rate: deal.commission_rate,
              margin_amount: deal.margin_amount,
              clicks: deal.clicks,
              conversions: deal.conversions,
              total_revenue: deal.total_revenue,
              is_active: deal.is_active,
              created_at: deal.created_at,
              product_title: productTitle,
              product_price: productPrice,
            };
          }),
        );

        setRecentDeals(dealsWithProducts);
      } catch (err) {
        console.error("Error fetching middleman dashboard:", err);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [user]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const statCards: {
    label: string;
    value: number | string;
    icon: React.ElementType;
    gradient: string;
    iconBg: string;
    textColor: string;
  }[] = [
    {
      label: "Total Deals",
      value: stats.totalDeals,
      icon: Briefcase,
      gradient: "from-blue-500/20 to-cyan-500/10",
      iconBg: "bg-blue-500/10 border-blue-500/20",
      textColor: "text-blue-400",
    },
    {
      label: "Active Deals",
      value: stats.activeDeals,
      icon: TrendingUp,
      gradient: "from-emerald-500/20 to-green-500/10",
      iconBg: "bg-emerald-500/10 border-emerald-500/20",
      textColor: "text-emerald-400",
    },
    {
      label: "Commission Earned",
      value: formatCurrency(stats.commissionEarned),
      icon: DollarSign,
      gradient: "from-amber-500/20 to-orange-500/10",
      iconBg: "bg-amber-500/10 border-amber-500/20",
      textColor: "text-amber-400",
    },
    {
      label: "Orders Completed",
      value: stats.ordersCompleted,
      icon: CheckCircle2,
      gradient: "from-violet-500/20 to-purple-500/10",
      iconBg: "bg-violet-500/10 border-violet-500/20",
      textColor: "text-violet-400",
    },
  ];

  const quickActions = [
    {
      title: "Create New Deal",
      description: "Link a product and set your commission",
      href: "/middleman/deals/new",
      icon: Plus,
      gradient: "from-blue-500/20 to-cyan-500/10",
      iconBg: "bg-blue-500/10 border-blue-500/20",
      textColor: "text-blue-400",
    },
    {
      title: "View All Deals",
      description: "Manage your active and past deals",
      href: "/middleman/deals",
      icon: ListChecks,
      gradient: "from-emerald-500/20 to-green-500/10",
      iconBg: "bg-emerald-500/10 border-emerald-500/20",
      textColor: "text-emerald-400",
    },
    {
      title: "Track Orders",
      description: "Monitor orders linked to your deals",
      href: "/middleman/orders",
      icon: Package,
      gradient: "from-amber-500/20 to-orange-500/10",
      iconBg: "bg-amber-500/10 border-amber-500/20",
      textColor: "text-amber-400",
    },
    {
      title: "Connections",
      description: "Manage your factory and buyer network",
      href: "/middleman/connections",
      icon: Users,
      gradient: "from-violet-500/20 to-purple-500/10",
      iconBg: "bg-violet-500/10 border-violet-500/20",
      textColor: "text-violet-400",
    },
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 space-y-10">
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="h-4 w-48 bg-white/5 rounded-lg animate-pulse" />
            <div className="h-12 w-72 bg-white/5 rounded-xl animate-pulse" />
          </div>
        </div>

        {/* Stats skeletons */}
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

        {/* Recent deals skeleton */}
        <div className="glass-card p-8 rounded-[2.5rem] border-white/5 bg-white/5">
          <div className="h-6 w-40 bg-white/5 rounded mb-6 animate-pulse" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-4 border-b border-white/5 last:border-0"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-white/5 rounded-xl" />
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-white/5 rounded" />
                  <div className="h-3 w-20 bg-white/5 rounded" />
                </div>
              </div>
              <div className="h-4 w-16 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center space-y-8">
        <div className="w-20 h-20 mx-auto glass-card rounded-[2rem] border-rose-500/20 bg-rose-500/5 flex items-center justify-center">
          <AlertTriangle className="h-10 w-10 text-rose-400" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          Dashboard Unavailable
        </h2>
        <p className="text-sm text-muted-foreground">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-6 py-3 glass-card rounded-2xl border-white/10 hover:bg-white/10 transition-all text-sm font-medium"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 space-y-10 pb-32">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Welcome back
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
            Middleman Dashboard
          </h1>
        </div>
        <Link
          to="/middleman/deals/new"
          className="inline-flex items-center gap-2 px-6 py-3 glass-card rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 transition-all text-sm font-medium shadow-lg"
        >
          <Plus className="h-4 w-4" />
          New Deal
        </Link>
      </div>

      {/* ===== STAT CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className={`glass-card p-6 rounded-[2rem] border-white/5 bg-gradient-to-br ${stat.gradient} relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300`}
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl glass border ${stat.iconBg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.textColor}`} />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  {typeof stat.value === "number" ? "COUNT" : "EARNED"}
                </span>
              </div>
              <p className="text-3xl font-bold text-foreground mb-1">
                {stat.value}
              </p>
              <p className="text-xs font-medium text-muted-foreground">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ===== QUICK ACTIONS ===== */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-foreground">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.href}
              className={`glass-card p-6 rounded-[2rem] border-white/5 bg-gradient-to-br ${action.gradient} hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden`}
            >
              <div className="relative z-10 flex flex-col h-full">
                <div
                  className={`p-3 rounded-2xl glass border ${action.iconBg} w-fit mb-4`}
                >
                  <action.icon className={`h-5 w-5 ${action.textColor}`} />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  {action.title}
                </h3>
                <p className="text-xs text-muted-foreground mb-4 flex-1">
                  {action.description}
                </p>
                <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  Open
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ===== RECENT DEALS ===== */}
      <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] border-white/5 bg-white/5">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">
            Recent Deals
          </h2>
          {recentDeals.length > 0 && (
            <Link
              to="/middleman/deals"
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>

        {recentDeals.length === 0 ? (
          <div className="py-16 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl glass-card border-white/10 bg-white/5 flex items-center justify-center">
              <Briefcase className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">
              No deals yet. Create your first deal to start earning commissions.
            </p>
            <Link
              to="/middleman/deals/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium hover:bg-blue-500/20 transition-all"
            >
              <Plus className="h-4 w-4" />
              Create Deal
            </Link>
          </div>
        ) : (
          <div className="space-y-1">
            {recentDeals.map((deal) => {
              const estimatedEarnings =
                deal.margin_amount > 0
                  ? deal.margin_amount * deal.conversions
                  : deal.total_revenue * (deal.commission_rate / 100);

              return (
                <Link
                  key={deal.id}
                  to={`/middleman/deals/${deal.id}`}
                  className="flex items-center justify-between py-4 px-4 rounded-2xl hover:bg-white/5 transition-all group"
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="p-2.5 rounded-xl glass-card border-white/10 bg-white/5 shrink-0">
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {deal.product_title || `ASIN: ${deal.product_asin}`}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{deal.conversions} conversions</span>
                        <span className="text-muted-foreground/40">•</span>
                        <span>{deal.clicks} clicks</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(estimatedEarnings)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {deal.commission_rate}% rate
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider ${
                        deal.is_active
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                      }`}
                    >
                      {deal.is_active ? "Active" : "Inactive"}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
