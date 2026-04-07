import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import {
  Search,
  Plus,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Briefcase,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Package,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Eye,
} from "lucide-react";

type DealStatus = "all" | "active" | "pending" | "completed" | "cancelled";
type SortOption = "newest" | "oldest" | "commission-high" | "commission-low";

type MiddleManDeal = {
  id: string;
  middle_man_id: string;
  product_asin: string;
  product_id: string | null;
  commission_rate: number;
  margin_amount: number;
  unique_slug: string;
  clicks: number;
  conversions: number;
  total_revenue: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  product_title?: string;
  seller_name?: string;
  factory_name?: string;
};

const DEALS_PER_PAGE = 10;

const STATUS_BADGE_CONFIG: Record<
  Exclude<DealStatus, "all">,
  {
    label: string;
    bg: string;
    text: string;
    border: string;
    icon: React.ElementType;
  }
> = {
  active: {
    label: "Active",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
    icon: TrendingUp,
  },
  pending: {
    label: "Pending",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/20",
    icon: Clock,
  },
  completed: {
    label: "Completed",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/20",
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

function getDealStatus(deal: MiddleManDeal): Exclude<DealStatus, "all"> {
  if (!deal.is_active) {
    if (deal.conversions > 0) return "completed";
    return "cancelled";
  }
  if (deal.conversions === 0 && deal.clicks === 0) return "pending";
  return "active";
}

function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function MiddlemanDeals() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [deals, setDeals] = useState<MiddleManDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState("USD");

  const [statusFilter, setStatusFilter] = useState<DealStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const fetchDeals = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data: profile } = await supabase
        .from("middleman_profiles")
        .select("currency")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile?.currency) {
        setCurrency(profile.currency);
      }

      const { data: rawDeals, error: dealsError } = await supabase
        .from("middle_man_deals")
        .select("*")
        .eq("middle_man_id", user.id)
        .order("created_at", { ascending: false });

      if (dealsError) throw dealsError;

      if (!rawDeals || rawDeals.length === 0) {
        setDeals([]);
        setLoading(false);
        return;
      }

      const productIds = rawDeals
        .map((d) => d.product_id)
        .filter(Boolean) as string[];

      const productMap: Record<string, { title: string; seller_id?: string }> =
        {};
      if (productIds.length > 0) {
        const { data: products } = await supabase
          .from("products")
          .select("id, title, seller_id")
          .in("id", productIds);

        if (products) {
          products.forEach((p) => {
            productMap[p.id] = { title: p.title, seller_id: p.seller_id };
          });
        }
      }

      const sellerIds = [
        ...new Set(
          Object.values(productMap)
            .map((p) => p.seller_id)
            .filter(Boolean) as string[],
        ),
      ];

      const sellerNameMap: Record<string, string> = {};
      if (sellerIds.length > 0) {
        const { data: sellers } = await supabase
          .from("users")
          .select("user_id, full_name")
          .in("user_id", sellerIds);

        if (sellers) {
          sellers.forEach((s) => {
            sellerNameMap[s.user_id] = s.full_name || "Unknown Seller";
          });
        }
      }

      const enrichedDeals: MiddleManDeal[] = rawDeals.map((deal) => {
        const productInfo = deal.product_id
          ? productMap[deal.product_id]
          : null;
        return {
          ...deal,
          commission_rate: Number(deal.commission_rate) || 0,
          margin_amount: Number(deal.margin_amount) || 0,
          clicks: deal.clicks || 0,
          conversions: deal.conversions || 0,
          total_revenue: Number(deal.total_revenue) || 0,
          product_title: productInfo?.title || `ASIN: ${deal.product_asin}`,
          seller_name: productInfo?.seller_id
            ? sellerNameMap[productInfo.seller_id]
            : undefined,
        };
      });

      setDeals(enrichedDeals);
    } catch (err) {
      console.error("Error fetching middleman deals:", err);
      setError("Failed to load deals. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const filteredAndSortedDeals = useMemo(() => {
    let result = [...deals];

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((deal) => getDealStatus(deal) === statusFilter);
    }

    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (deal) =>
          deal.product_title?.toLowerCase().includes(query) ||
          deal.product_asin.toLowerCase().includes(query) ||
          deal.unique_slug?.toLowerCase().includes(query) ||
          deal.seller_name?.toLowerCase().includes(query),
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
      case "commission-high":
        result.sort((a, b) => b.commission_rate - a.commission_rate);
        break;
      case "commission-low":
        result.sort((a, b) => a.commission_rate - b.commission_rate);
        break;
    }

    return result;
  }, [deals, statusFilter, searchQuery, sortOption]);

  // Pagination
  const totalPages = Math.max(
    1,
    Math.ceil(filteredAndSortedDeals.length / DEALS_PER_PAGE),
  );
  const safePage = Math.min(currentPage, totalPages);
  const paginatedDeals = filteredAndSortedDeals.slice(
    (safePage - 1) * DEALS_PER_PAGE,
    safePage * DEALS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery, sortOption]);

  const estimatedEarnings = (deal: MiddleManDeal): number => {
    if (deal.margin_amount > 0) return deal.margin_amount * deal.conversions;
    return deal.total_revenue * (deal.commission_rate / 100);
  };

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
          <div className="h-11 w-36 bg-white/5 rounded-2xl animate-pulse" />
        </div>

        {/* Filter bar skeleton */}
        <div className="glass-card p-4 rounded-2xl border-white/5 bg-white/5 flex flex-wrap gap-3 animate-pulse">
          <div className="h-10 flex-1 min-w-[200px] bg-white/5 rounded-xl" />
          <div className="h-10 w-32 bg-white/5 rounded-xl" />
          <div className="h-10 w-40 bg-white/5 rounded-xl" />
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
          Unable to Load Deals
        </h2>
        <p className="text-sm text-muted-foreground">{error}</p>
        <button
          onClick={() => fetchDeals()}
          className="inline-flex items-center gap-2 px-6 py-3 glass-card rounded-2xl border-white/10 hover:bg-white/10 transition-all text-sm font-medium"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  // ---- Empty state ----
  if (deals.length === 0) {
    return (
      <div className="max-w-lg mx-auto py-24 px-4 text-center space-y-8">
        <div className="w-24 h-24 mx-auto glass-card rounded-[2rem] border-white/10 bg-white/5 flex items-center justify-center">
          <Briefcase className="h-12 w-12 text-muted-foreground/40" />
        </div>
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-foreground">No Deals Yet</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Create your first deal to start connecting products with buyers and
            earning commissions.
          </p>
        </div>
        <Link
          to="/middleman/deals/new"
          className="inline-flex items-center gap-2 px-8 py-3 glass-card rounded-2xl border-white/10 bg-gradient-to-r from-blue-500/20 to-cyan-500/10 hover:from-blue-500/30 hover:to-cyan-500/20 transition-all text-sm font-semibold shadow-lg"
        >
          <Plus className="h-4 w-4" />
          Create Your First Deal
        </Link>
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
            Manage
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            My Deals
          </h1>
          <p className="text-sm text-muted-foreground">
            {filteredAndSortedDeals.length} deal
            {filteredAndSortedDeals.length !== 1 ? "s" : ""}
            {statusFilter !== "all" &&
              ` \u2022 ${STATUS_BADGE_CONFIG[statusFilter as Exclude<DealStatus, "all">]?.label}`}
            {searchQuery && ` \u2022 "${searchQuery}"`}
          </p>
        </div>
        <Link
          to="/middleman/deals/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 glass-card rounded-2xl border-white/10 bg-gradient-to-r from-blue-500/20 to-cyan-500/10 hover:from-blue-500/30 hover:to-cyan-500/20 transition-all text-sm font-semibold shadow-lg shrink-0"
        >
          <Plus className="h-4 w-4" />
          New Deal
        </Link>
      </div>

      {/* ===== FILTER BAR ===== */}
      <div className="glass-card p-3 sm:p-4 rounded-2xl border-white/5 bg-white/5 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <input
              type="text"
              placeholder="Search by deal name, ASIN, or seller..."
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
              <option value="commission-high">Commission: High to Low</option>
              <option value="commission-low">Commission: Low to High</option>
            </select>
            <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
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
                "active",
                "pending",
                "completed",
                "cancelled",
              ] as DealStatus[]
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
          <div className="col-span-1">Title</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1">Seller</div>
          <div className="col-span-1">Commission</div>
          <div className="col-span-1">Created</div>
          <div className="col-span-1 text-right">Action</div>
        </div>

        {/* Table rows */}
        {paginatedDeals.length === 0 ? (
          <div className="py-16 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl glass-card border-white/10 bg-white/5 flex items-center justify-center">
              <Filter className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">
              No deals match your filters.
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
          paginatedDeals.map((deal) => {
            const status = getDealStatus(deal);
            const config = STATUS_BADGE_CONFIG[status];
            const StatusIcon = config.icon;

            return (
              <Link
                key={deal.id}
                to={`/middleman/deals/${deal.id}`}
                className="grid grid-cols-6 gap-4 px-6 py-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-all group items-center"
              >
                {/* Title */}
                <div className="col-span-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-blue-400 transition-colors">
                    {deal.product_title || `ASIN: ${deal.product_asin}`}
                  </p>
                  <p className="text-xs text-muted-foreground/50 truncate">
                    {deal.product_asin}
                  </p>
                </div>

                {/* Status */}
                <div className="col-span-1">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider ${config.bg} ${config.text} border ${config.border}`}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {config.label}
                  </span>
                </div>

                {/* Seller */}
                <div className="col-span-1 min-w-0">
                  <p className="text-sm text-muted-foreground truncate">
                    {deal.seller_name || "\u2014"}
                  </p>
                </div>

                {/* Commission */}
                <div className="col-span-1">
                  <div className="text-sm font-semibold text-foreground">
                    {deal.commission_rate}%
                  </div>
                  {deal.margin_amount > 0 && (
                    <div className="text-xs text-muted-foreground/60">
                      +{formatCurrency(deal.margin_amount)} margin
                    </div>
                  )}
                  {deal.conversions > 0 && (
                    <div className="text-xs text-emerald-400/70">
                      {formatCurrency(estimatedEarnings(deal))} earned
                    </div>
                  )}
                </div>

                {/* Created date */}
                <div className="col-span-1">
                  <p className="text-sm text-muted-foreground">
                    {formatDate(deal.created_at)}
                  </p>
                </div>

                {/* Action */}
                <div className="col-span-1 flex items-center justify-end">
                  <span className="text-xs font-medium text-muted-foreground/40 group-hover:text-blue-400 inline-flex items-center gap-1 transition-colors">
                    View
                    <ExternalLink className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* ===== MOBILE CARDS ===== */}
      <div className="lg:hidden space-y-3">
        {paginatedDeals.length === 0 ? (
          <div className="py-16 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl glass-card border-white/10 bg-white/5 flex items-center justify-center">
              <Filter className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">
              No deals match your filters.
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
          paginatedDeals.map((deal) => {
            const status = getDealStatus(deal);
            const config = STATUS_BADGE_CONFIG[status];
            const StatusIcon = config.icon;

            return (
              <Link
                key={deal.id}
                to={`/middleman/deals/${deal.id}`}
                className="glass-card p-4 rounded-2xl border-white/5 bg-white/5 hover:bg-white/10 transition-all block group"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate group-hover:text-blue-400 transition-colors">
                      {deal.product_title || `ASIN: ${deal.product_asin}`}
                    </p>
                    <p className="text-xs text-muted-foreground/50">
                      {deal.product_asin}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider shrink-0 ${config.bg} ${config.text} border ${config.border}`}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {config.label}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground/50">Seller</span>
                    <p className="text-muted-foreground truncate">
                      {deal.seller_name || "\u2014"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground/50">Commission</span>
                    <p className="text-sm font-semibold text-foreground">
                      {deal.commission_rate}%
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground/50">Created</span>
                    <p className="text-muted-foreground">
                      {formatDate(deal.created_at)}
                    </p>
                  </div>
                </div>
                {deal.conversions > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {deal.conversions} conversions
                    </span>
                    <span className="text-xs font-medium text-emerald-400">
                      {formatCurrency(estimatedEarnings(deal))} earned
                    </span>
                  </div>
                )}
              </Link>
            );
          })
        )}
      </div>

      {/* ===== PAGINATION ===== */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <p className="text-xs text-muted-foreground">
            Showing {(safePage - 1) * DEALS_PER_PAGE + 1} to{" "}
            {Math.min(safePage * DEALS_PER_PAGE, filteredAndSortedDeals.length)}{" "}
            of {filteredAndSortedDeals.length} deals
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
              // Show first, last, current, and pages around current
              const showPage =
                page === 1 ||
                page === totalPages ||
                (page >= safePage - 1 && page <= safePage + 1);

              if (!showPage) {
                // Show ellipsis
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
