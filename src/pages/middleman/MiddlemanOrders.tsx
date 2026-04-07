import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import {
  Search,
  Filter,
  ArrowUpDown,
  Package,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Truck,
  DollarSign,
  ShoppingCart,
  Calendar,
  User,
  Hash,
} from "lucide-react";

type OrderStatus =
  | "all"
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";
type SortOption = "newest" | "oldest" | "total-high" | "total-low";

type MiddlemanOrder = {
  id: string;
  user_id: string;
  seller_id: string | null;
  status: string;
  subtotal: number;
  total: number;
  payment_status: string;
  payment_method: string;
  deal_id: string | null;
  middle_man_id: string | null;
  created_at: string;
  updated_at: string;
  delivered_at: string | null;
  shipped_at: string | null;
  cancelled_at: string | null;
  customer_name: string;
  deal_title: string | null;
  deal_product_asin: string | null;
};

const ORDERS_PER_PAGE = 10;

const STATUS_BADGE_CONFIG: Record<
  Exclude<OrderStatus, "all">,
  {
    label: string;
    bg: string;
    text: string;
    border: string;
    icon: React.ElementType;
  }
> = {
  pending: {
    label: "Pending",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/20",
    icon: Clock,
  },
  confirmed: {
    label: "Confirmed",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/20",
    icon: CheckCircle2,
  },
  shipped: {
    label: "Shipped",
    bg: "bg-violet-500/10",
    text: "text-violet-400",
    border: "border-violet-500/20",
    icon: Truck,
  },
  delivered: {
    label: "Delivered",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    border: "border-rose-500/20",
    icon: XCircle,
  },
};

function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "\u2014";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function MiddlemanOrders() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<MiddlemanOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState("USD");

  const [statusFilter, setStatusFilter] = useState<OrderStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const fetchOrders = useCallback(async () => {
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

      // Fetch orders linked to this middleman
      const { data: rawOrders, error: ordersError } = await supabase
        .from("orders")
        .select(
          "id, user_id, seller_id, status, subtotal, total, payment_status, payment_method, deal_id, middle_man_id, created_at, updated_at, delivered_at, shipped_at, cancelled_at",
        )
        .eq("middle_man_id", user.id)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      if (!rawOrders || rawOrders.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      // Fetch customer names
      const userIds = [
        ...new Set(rawOrders.map((o) => o.user_id).filter(Boolean)),
      ] as string[];
      const customerNameMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from("users")
          .select("user_id, full_name")
          .in("user_id", userIds);

        if (users) {
          users.forEach((u) => {
            customerNameMap[u.user_id] = u.full_name || "Unknown Customer";
          });
        }
      }

      // Fetch deal titles
      const dealIds = [
        ...new Set(rawOrders.map((o) => o.deal_id).filter(Boolean)),
      ] as string[];
      const dealTitleMap: Record<string, { title: string; asin: string }> = {};
      if (dealIds.length > 0) {
        const { data: deals } = await supabase
          .from("middle_man_deals")
          .select("id, product_asin, product_id")
          .in("id", dealIds);

        if (deals) {
          const productIds = deals
            .map((d) => d.product_id)
            .filter(Boolean) as string[];

          const productMap: Record<string, string> = {};
          if (productIds.length > 0) {
            const { data: products } = await supabase
              .from("products")
              .select("id, title")
              .in("id", productIds);

            if (products) {
              products.forEach((p) => {
                productMap[p.id] = p.title;
              });
            }
          }

          deals.forEach((d) => {
            const title = d.product_id ? productMap[d.product_id] : null;
            dealTitleMap[d.id] = {
              title: title || `ASIN: ${d.product_asin}`,
              asin: d.product_asin,
            };
          });
        }
      }

      const enrichedOrders: MiddlemanOrder[] = rawOrders.map((order) => ({
        ...order,
        subtotal: Number(order.subtotal) || 0,
        total: Number(order.total) || 0,
        customer_name: customerNameMap[order.user_id] || "Unknown Customer",
        deal_title: order.deal_id
          ? dealTitleMap[order.deal_id]?.title || null
          : null,
        deal_product_asin: order.deal_id
          ? dealTitleMap[order.deal_id]?.asin || null
          : null,
      }));

      setOrders(enrichedOrders);
    } catch (err) {
      console.error("Error fetching middleman orders:", err);
      setError("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredAndSortedOrders = useMemo(() => {
    let result = [...orders];

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((order) => order.status === statusFilter);
    }

    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (order) =>
          order.id.toLowerCase().includes(query) ||
          order.customer_name.toLowerCase().includes(query) ||
          order.deal_title?.toLowerCase().includes(query) ||
          order.deal_product_asin?.toLowerCase().includes(query),
      );
    }

    // Sort
    switch (sortOption) {
      case "newest":
        result.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        break;
      case "oldest":
        result.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );
        break;
      case "total-high":
        result.sort((a, b) => b.total - a.total);
        break;
      case "total-low":
        result.sort((a, b) => a.total - b.total);
        break;
    }

    return result;
  }, [orders, statusFilter, searchQuery, sortOption]);

  // Pagination
  const totalPages = Math.max(
    1,
    Math.ceil(filteredAndSortedOrders.length / ORDERS_PER_PAGE),
  );
  const safePage = Math.min(currentPage, totalPages);
  const paginatedOrders = filteredAndSortedOrders.slice(
    (safePage - 1) * ORDERS_PER_PAGE,
    safePage * ORDERS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery, sortOption]);

  // Summary stats
  const summaryStats = useMemo(() => {
    const pending = orders.filter((o) => o.status === "pending").length;
    const confirmed = orders.filter((o) => o.status === "confirmed").length;
    const shipped = orders.filter((o) => o.status === "shipped").length;
    const delivered = orders.filter((o) => o.status === "delivered").length;
    const cancelled = orders.filter((o) => o.status === "cancelled").length;
    const totalValue = orders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + o.total, 0);

    return {
      total: orders.length,
      pending,
      confirmed,
      shipped,
      delivered,
      cancelled,
      totalValue,
    };
  }, [orders]);

  // Redirect if not a middleman
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { replace: true });
    }
  }, [user, loading, navigate]);

  // ---- Loading state ----
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 space-y-8">
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div className="space-y-3">
            <div className="h-4 w-36 bg-white/5 rounded animate-pulse" />
            <div className="h-10 w-56 bg-white/5 rounded-xl animate-pulse" />
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="glass-card p-5 rounded-[2rem] border-white/5 bg-white/5 animate-pulse"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 bg-white/5 rounded-2xl" />
                <div className="h-3 w-10 bg-white/5 rounded" />
              </div>
              <div className="h-7 w-16 bg-white/5 rounded mb-2" />
              <div className="h-3 w-20 bg-white/5 rounded" />
            </div>
          ))}
        </div>

        {/* Filter bar skeleton */}
        <div className="glass-card p-4 rounded-2xl border-white/5 bg-white/5 flex flex-wrap gap-3 animate-pulse">
          <div className="h-10 flex-1 min-w-[200px] bg-white/5 rounded-xl" />
          <div className="h-10 w-32 bg-white/5 rounded-xl" />
          <div className="h-10 w-24 bg-white/5 rounded-xl" />
        </div>

        {/* Table skeleton */}
        <div className="glass-card rounded-[2rem] border-white/5 bg-white/5 overflow-hidden">
          <div className="hidden lg:grid grid-cols-6 gap-4 px-6 py-4 border-b border-white/5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 bg-white/5 rounded animate-pulse" />
            ))}
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="px-6 py-4 border-b border-white/5 last:border-0 flex flex-col lg:grid lg:grid-cols-6 gap-3 animate-pulse"
            >
              <div className="h-4 bg-white/5 rounded w-3/4" />
              <div className="h-6 w-16 bg-white/5 rounded-lg hidden lg:block" />
              <div className="h-4 bg-white/5 rounded w-1/2 hidden lg:block" />
              <div className="h-4 bg-white/5 rounded w-2/3 hidden lg:block" />
              <div className="h-4 bg-white/5 rounded w-16 hidden lg:block" />
              <div className="h-4 bg-white/5 rounded w-20 hidden lg:block" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---- Error state ----
  if (error) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center space-y-6">
        <div className="w-20 h-20 mx-auto glass-card rounded-[2rem] border-rose-500/20 bg-rose-500/5 flex items-center justify-center">
          <AlertTriangle className="h-10 w-10 text-rose-400" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          Unable to Load Orders
        </h2>
        <p className="text-sm text-muted-foreground">{error}</p>
        <button
          onClick={() => fetchOrders()}
          className="inline-flex items-center gap-2 px-6 py-3 glass-card rounded-2xl border-white/10 hover:bg-white/10 transition-all text-sm font-medium"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  // ---- Empty state ----
  if (orders.length === 0) {
    return (
      <div className="max-w-lg mx-auto py-24 px-4 text-center space-y-8">
        <div className="w-24 h-24 mx-auto glass-card rounded-[2rem] border-white/10 bg-white/5 flex items-center justify-center">
          <ShoppingCart className="h-12 w-12 text-muted-foreground/40" />
        </div>
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-foreground">No Orders Yet</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Orders linked to your deals will appear here. Create deals and start
            earning commissions to see activity.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/middleman/deals"
            className="inline-flex items-center gap-2 px-8 py-3 glass-card rounded-2xl border-white/10 bg-gradient-to-r from-blue-500/20 to-cyan-500/10 hover:from-blue-500/30 hover:to-cyan-500/20 transition-all text-sm font-semibold shadow-lg"
          >
            <Package className="h-4 w-4" />
            View Deals
          </Link>
          <Link
            to="/middleman/deals/new"
            className="inline-flex items-center gap-2 px-8 py-3 glass-card rounded-2xl border-white/10 hover:bg-white/10 transition-all text-sm font-medium"
          >
            <TrendingUp className="h-4 w-4" />
            Create Deal
          </Link>
        </div>
      </div>
    );
  }

  // ---- Main content ----
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 space-y-6 pb-32">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Track
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Orders
          </h1>
          <p className="text-sm text-muted-foreground">
            {filteredAndSortedOrders.length} order
            {filteredAndSortedOrders.length !== 1 ? "s" : ""}
            {statusFilter !== "all" && (
              <span>
                {" "}
                \u2022{" "}
                {
                  STATUS_BADGE_CONFIG[
                    statusFilter as Exclude<OrderStatus, "all">
                  ]?.label
                }
              </span>
            )}
            {searchQuery && <span> \u2022 &ldquo;{searchQuery}&rdquo;</span>}
          </p>
        </div>
      </div>

      {/* ===== SUMMARY STATS ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orders */}
        <div className="glass-card p-5 rounded-[2rem] border-white/5 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 relative overflow-hidden group hover:-translate-y-0.5 transition-transform duration-300">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-2xl glass border bg-blue-500/10 border-blue-500/20">
                <ShoppingCart className="h-5 w-5 text-blue-400" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                All
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground mb-0.5">
              {summaryStats.total}
            </p>
            <p className="text-xs text-muted-foreground">Total Orders</p>
          </div>
        </div>

        {/* Pending */}
        <div className="glass-card p-5 rounded-[2rem] border-white/5 bg-gradient-to-br from-amber-500/10 to-orange-500/5 relative overflow-hidden group hover:-translate-y-0.5 transition-transform duration-300">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-2xl glass border bg-amber-500/10 border-amber-500/20">
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                Awaiting
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground mb-0.5">
              {summaryStats.pending}
            </p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
        </div>

        {/* Delivered */}
        <div className="glass-card p-5 rounded-[2rem] border-white/5 bg-gradient-to-br from-emerald-500/10 to-green-500/5 relative overflow-hidden group hover:-translate-y-0.5 transition-transform duration-300">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-2xl glass border bg-emerald-500/10 border-emerald-500/20">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                Done
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground mb-0.5">
              {summaryStats.delivered}
            </p>
            <p className="text-xs text-muted-foreground">Delivered</p>
          </div>
        </div>

        {/* Total Value */}
        <div className="glass-card p-5 rounded-[2rem] border-white/5 bg-gradient-to-br from-violet-500/10 to-purple-500/5 relative overflow-hidden group hover:-translate-y-0.5 transition-transform duration-300">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-2xl glass border bg-violet-500/10 border-violet-500/20">
                <DollarSign className="h-5 w-5 text-violet-400" />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                Revenue
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground mb-0.5">
              {formatCurrency(summaryStats.totalValue, currency)}
            </p>
            <p className="text-xs text-muted-foreground">Total Value</p>
          </div>
        </div>
      </div>

      {/* ===== FILTER BAR ===== */}
      <div className="glass-card p-3 sm:p-4 rounded-2xl border-white/5 bg-white/5 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <input
              type="text"
              placeholder="Search by order ID, customer, or deal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all"
            />
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="appearance-none w-full sm:w-44 pl-4 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="total-high">Total: High to Low</option>
              <option value="total-low">Total: Low to High</option>
            </select>
            <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all shrink-0 ${
              showFilters
                ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
            }`}
          >
            <Filter className="h-4 w-4" />
            Status
          </button>
        </div>

        {/* Status pills */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 pt-1">
            {(
              [
                "all",
                "pending",
                "confirmed",
                "shipped",
                "delivered",
                "cancelled",
              ] as OrderStatus[]
            ).map((status) => {
              const isActive = statusFilter === status;
              const config =
                status !== "all" ? STATUS_BADGE_CONFIG[status] : null;
              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                    isActive
                      ? "bg-white/15 border border-white/20 text-foreground"
                      : "bg-white/5 border border-white/5 text-muted-foreground/60 hover:bg-white/10 hover:text-muted-foreground"
                  }`}
                >
                  {config && <config.icon className="h-3 w-3" />}
                  {status === "all" ? "All" : config?.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ===== DESKTOP TABLE ===== */}
      <div className="hidden lg:block glass-card rounded-[2rem] border-white/5 bg-white/5 overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-6 gap-4 px-6 py-4 border-b border-white/5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
          <div className="col-span-1">Order</div>
          <div className="col-span-1">Deal</div>
          <div className="col-span-1">Customer</div>
          <div className="col-span-1">Total</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1 text-right">Date</div>
        </div>

        {/* Table rows */}
        {paginatedOrders.length === 0 ? (
          <div className="py-16 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl glass-card border-white/10 bg-white/5 flex items-center justify-center">
              <Filter className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">
              No orders match your filters.
            </p>
            <button
              onClick={() => {
                setStatusFilter("all");
                setSearchQuery("");
              }}
              className="text-xs font-medium text-blue-400 hover:text-blue-300"
            >
              Clear filters
            </button>
          </div>
        ) : (
          paginatedOrders.map((order) => {
            const statusKey = order.status as Exclude<OrderStatus, "all">;
            const config = STATUS_BADGE_CONFIG[statusKey];
            const StatusIcon = config?.icon || Clock;
            const orderLink = order.deal_id
              ? `/middleman/deals/${order.deal_id}`
              : `/orders/${order.id}`;

            return (
              <Link
                key={order.id}
                to={orderLink}
                className="grid grid-cols-6 gap-4 px-6 py-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-all group items-center"
              >
                {/* Order ID */}
                <div className="col-span-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Hash className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                    <p className="text-sm font-mono font-medium text-foreground truncate group-hover:text-blue-400 transition-colors">
                      {order.id.slice(0, 8)}
                    </p>
                  </div>
                </div>

                {/* Deal title */}
                <div className="col-span-1 min-w-0">
                  {order.deal_title ? (
                    <p className="text-sm text-muted-foreground truncate group-hover:text-foreground transition-colors">
                      {order.deal_title}
                    </p>
                  ) : (
                    <span className="text-xs text-muted-foreground/40 italic">
                      No deal linked
                    </span>
                  )}
                </div>

                {/* Customer */}
                <div className="col-span-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                    <p className="text-sm text-muted-foreground truncate">
                      {order.customer_name}
                    </p>
                  </div>
                </div>

                {/* Total */}
                <div className="col-span-1">
                  <p className="text-sm font-semibold text-foreground">
                    {formatCurrency(order.total, currency)}
                  </p>
                  {order.payment_status && (
                    <p
                      className={`text-xs ${
                        order.payment_status === "completed"
                          ? "text-emerald-400/70"
                          : "text-muted-foreground/50"
                      }`}
                    >
                      {order.payment_status}
                    </p>
                  )}
                </div>

                {/* Status */}
                <div className="col-span-1">
                  {config ? (
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider ${config.bg} ${config.text} border ${config.border}`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {config.label}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground/60 capitalize">
                      {order.status}
                    </span>
                  )}
                </div>

                {/* Date */}
                <div className="col-span-1 flex items-center justify-end">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {formatDate(order.created_at)}
                    </p>
                    <span className="text-xs text-muted-foreground/40 group-hover:text-blue-400 inline-flex items-center gap-1 transition-colors">
                      View
                      <ExternalLink className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* ===== MOBILE CARDS ===== */}
      <div className="lg:hidden space-y-3">
        {paginatedOrders.length === 0 ? (
          <div className="py-16 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl glass-card border-white/10 bg-white/5 flex items-center justify-center">
              <Filter className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">
              No orders match your filters.
            </p>
            <button
              onClick={() => {
                setStatusFilter("all");
                setSearchQuery("");
              }}
              className="text-xs font-medium text-blue-400 hover:text-blue-300"
            >
              Clear filters
            </button>
          </div>
        ) : (
          paginatedOrders.map((order) => {
            const statusKey = order.status as Exclude<OrderStatus, "all">;
            const config = STATUS_BADGE_CONFIG[statusKey];
            const StatusIcon = config?.icon || Clock;
            const orderLink = order.deal_id
              ? `/middleman/deals/${order.deal_id}`
              : `/orders/${order.id}`;

            return (
              <Link
                key={order.id}
                to={orderLink}
                className="glass-card p-4 rounded-2xl border-white/5 bg-white/5 hover:bg-white/10 transition-all block group"
              >
                {/* Top row: Order ID + Status */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Hash className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                      <p className="text-sm font-mono font-semibold text-foreground truncate group-hover:text-blue-400 transition-colors">
                        {order.id.slice(0, 8)}
                      </p>
                    </div>
                    {order.deal_title && (
                      <p className="text-xs text-muted-foreground/60 truncate">
                        {order.deal_title}
                      </p>
                    )}
                  </div>
                  {config && (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider shrink-0 ${config.bg} ${config.text} border ${config.border}`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {config.label}
                    </span>
                  )}
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground/50 flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Customer
                    </span>
                    <p className="text-sm text-muted-foreground truncate">
                      {order.customer_name}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground/50 flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      Total
                    </span>
                    <p className="text-sm font-semibold text-foreground">
                      {formatCurrency(order.total, currency)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground/50 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Date
                    </span>
                    <p className="text-muted-foreground">
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground/50">Payment</span>
                    <p
                      className={`text-sm font-medium ${
                        order.payment_status === "completed"
                          ? "text-emerald-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {order.payment_status}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* ===== PAGINATION ===== */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <p className="text-xs text-muted-foreground">
            Showing {(safePage - 1) * ORDERS_PER_PAGE + 1} to{" "}
            {Math.min(
              safePage * ORDERS_PER_PAGE,
              filteredAndSortedOrders.length,
            )}{" "}
            of {filteredAndSortedOrders.length} orders
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl glass-card border-white/10 text-sm font-medium text-muted-foreground hover:bg-white/10 hover:text-foreground transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              const showPage =
                page === 1 ||
                page === totalPages ||
                (page >= safePage - 1 && page <= safePage + 1);

              if (!showPage) {
                if (page === safePage - 2 || page === safePage + 2) {
                  return (
                    <span
                      key={`ellipsis-${page}`}
                      className="px-1 text-muted-foreground/40 text-sm"
                    >
                      ...
                    </span>
                  );
                }
                return null;
              }

              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${
                    page === safePage
                      ? "bg-blue-500/20 border border-blue-500/30 text-blue-400"
                      : "glass-card border-white/10 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                  }`}
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl glass-card border-white/10 text-sm font-medium text-muted-foreground hover:bg-white/10 hover:text-foreground transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
