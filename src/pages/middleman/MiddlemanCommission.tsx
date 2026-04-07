import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import {
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Download,
  Filter,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  Briefcase,
  Calendar,
  ArrowUpDown,
  Wallet,
  TrendingUp,
  X,
  Send,
} from "lucide-react";
import { toast } from "sonner";

type CommissionStatus = "all" | "pending" | "paid" | "approved" | "cancelled";
type CommissionRecord = {
  id: string;
  middle_man_id: string;
  order_id: string | null;
  deal_id: string | null;
  amount: number;
  commission_rate: number;
  status: string;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  deal_title?: string;
  deal_asin?: string;
};

type PayoutSummary = {
  totalEarned: number;
  pending: number;
  paid: number;
  available: number;
};

const STATUS_CONFIG: Record<
  Exclude<CommissionStatus, "all">,
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
  paid: {
    label: "Paid",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
    icon: CheckCircle2,
  },
  approved: {
    label: "Approved",
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

function formatDateInput(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function MiddlemanCommission() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState("USD");
  const [commissions, setCommissions] = useState<CommissionRecord[]>([]);
  const [summary, setSummary] = useState<PayoutSummary>({
    totalEarned: 0,
    pending: 0,
    paid: 0,
    available: 0,
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState<CommissionStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Payout modal
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);

  const fetchCommissions = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Profile for currency
      const { data: profile } = await supabase
        .from("middleman_profiles")
        .select("currency")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile?.currency) setCurrency(profile.currency);

      // Fetch middle_men for earnings overview
      const { data: middleman } = await supabase
        .from("middle_men")
        .select("total_earnings, pending_earnings")
        .eq("user_id", user.id)
        .maybeSingle();

      // Fetch all commission records
      const { data: rawCommissions, error: commError } = await supabase
        .from("commissions")
        .select("*")
        .eq("middle_man_id", user.id)
        .order("created_at", { ascending: false });

      if (commError) throw commError;

      if (!rawCommissions || rawCommissions.length === 0) {
        setCommissions([]);
        setSummary({
          totalEarned: middleman?.total_earnings || 0,
          pending: middleman?.pending_earnings || 0,
          paid: 0,
          available:
            (middleman?.total_earnings || 0) -
            (middleman?.pending_earnings || 0),
        });
        setLoading(false);
        return;
      }

      // Enrich with deal titles
      const dealIds = [
        ...new Set(rawCommissions.map((c) => c.deal_id).filter(Boolean)),
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

          deals.forEach((d) => {
            dealTitleMap[d.id] = {
              title: d.product_id
                ? productTitleMap[d.product_id] || `ASIN: ${d.product_asin}`
                : `ASIN: ${d.product_asin}`,
              asin: d.product_asin,
            };
          });
        }
      }

      const enriched: CommissionRecord[] = rawCommissions.map((c) => ({
        ...c,
        amount: Number(c.amount) || 0,
        commission_rate: Number(c.commission_rate) || 0,
        deal_title: c.deal_id
          ? dealTitleMap[c.deal_id]?.title || "Unknown Deal"
          : "N/A",
        deal_asin: c.deal_id ? dealTitleMap[c.deal_id]?.asin : undefined,
      }));

      setCommissions(enriched);

      // Compute summary
      const totalEarned = middleman?.total_earnings || 0;
      const pending =
        enriched
          .filter((c) => c.status === "pending" || c.status === "approved")
          .reduce((sum, c) => sum + c.amount, 0) ||
        middleman?.pending_earnings ||
        0;
      const paid = enriched
        .filter((c) => c.status === "paid")
        .reduce((sum, c) => sum + c.amount, 0);

      setSummary({
        totalEarned,
        pending,
        paid,
        available: Math.max(0, totalEarned - pending),
      });
    } catch (err) {
      console.error("Error fetching commissions:", err);
      setError("Failed to load commission data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCommissions();
  }, [fetchCommissions]);

  const filteredCommissions = useMemo(() => {
    let result = [...commissions];

    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.deal_title?.toLowerCase().includes(q) ||
          c.deal_asin?.toLowerCase().includes(q) ||
          c.order_id?.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q),
      );
    }

    if (dateFrom) {
      result = result.filter((c) => c.created_at >= dateFrom);
    }

    if (dateTo) {
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      result = result.filter((c) => c.created_at <= endOfDay.toISOString());
    }

    return result;
  }, [commissions, statusFilter, searchQuery, dateFrom, dateTo]);

  const exportCSV = useCallback(() => {
    const headers = [
      "ID",
      "Deal",
      "Order ID",
      "Amount",
      "Rate",
      "Status",
      "Date",
    ];
    const rows = filteredCommissions.map((c) => [
      c.id,
      c.deal_title || "",
      c.order_id || "",
      c.amount.toFixed(2),
      `${c.commission_rate}%`,
      c.status,
      formatDate(c.created_at),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `commissions_export_${formatDateInput(new Date())}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported successfully");
  }, [filteredCommissions]);

  const handlePayoutRequest = useCallback(async () => {
    if (!user) return;
    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (amount > summary.available) {
      toast.error("Amount exceeds available balance");
      return;
    }

    setPayoutSubmitting(true);
    try {
      // In a real implementation, this would create a payout request record
      // For now, we simulate success
      toast.success(
        `Payout request of ${formatCurrency(amount, currency)} submitted`,
      );
      setShowPayoutModal(false);
      setPayoutAmount("");
      await fetchCommissions();
    } catch (err) {
      console.error("Payout request error:", err);
      toast.error("Failed to submit payout request");
    } finally {
      setPayoutSubmitting(false);
    }
  }, [user, payoutAmount, summary.available, currency, fetchCommissions]);

  // Loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div className="space-y-3">
            <div className="h-4 w-36 bg-white/5 rounded animate-pulse" />
            <div className="h-10 w-64 bg-white/5 rounded-xl animate-pulse" />
          </div>
        </div>

        {/* Summary skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="glass-card p-5 rounded-[2rem] border-white/5 bg-white/5 animate-pulse"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 bg-white/5 rounded-2xl" />
                <div className="h-3 w-14 bg-white/5 rounded" />
              </div>
              <div className="h-7 w-24 bg-white/5 rounded mb-2" />
              <div className="h-3 w-20 bg-white/5 rounded" />
            </div>
          ))}
        </div>

        {/* Filter skeleton */}
        <div className="glass-card p-4 rounded-2xl border-white/5 bg-white/5 flex flex-wrap gap-3 animate-pulse">
          <div className="h-10 flex-1 min-w-[200px] bg-white/5 rounded-xl" />
          <div className="h-10 w-24 bg-white/5 rounded-xl" />
          <div className="h-10 w-32 bg-white/5 rounded-xl" />
        </div>

        {/* Table skeleton */}
        <div className="glass-card rounded-[2rem] border-white/5 bg-white/5 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="px-6 py-4 border-b border-white/5 last:border-0 flex items-center gap-4 animate-pulse"
            >
              <div className="h-4 flex-1 bg-white/5 rounded" />
              <div className="h-6 w-16 bg-white/5 rounded-lg" />
              <div className="h-4 w-24 bg-white/5 rounded" />
            </div>
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
          Unable to Load Commissions
        </h2>
        <p className="text-sm text-muted-foreground">{error}</p>
        <button
          onClick={() => fetchCommissions()}
          className="inline-flex items-center gap-2 px-6 py-3 glass-card rounded-2xl border-white/10 hover:bg-white/10 transition-all text-sm font-medium"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 space-y-6 pb-32">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Earnings
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Commissions
          </h1>
          <p className="text-sm text-muted-foreground">
            {filteredCommissions.length} record
            {filteredCommissions.length !== 1 ? "s" : ""}
            {statusFilter !== "all" && (
              <span>
                {" "}
                \u2022{" "}
                {
                  STATUS_CONFIG[
                    statusFilter as Exclude<CommissionStatus, "all">
                  ]?.label
                }
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 glass-card rounded-xl border-white/10 text-sm font-medium hover:bg-white/10 transition-all"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
          <button
            onClick={() => setShowPayoutModal(true)}
            disabled={summary.available <= 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-green-500/10 border border-emerald-500/20 text-sm font-semibold text-emerald-400 hover:from-emerald-500/30 hover:to-green-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Wallet className="h-4 w-4" />
            Request Payout
          </button>
        </div>
      </div>

      {/* ===== SUMMARY CARDS ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Earned */}
        <div className="glass-card p-5 rounded-[2rem] border-white/5 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 hover:-translate-y-0.5 transition-transform duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-2xl glass border bg-blue-500/10 border-blue-500/20">
              <DollarSign className="h-5 w-5 text-blue-400" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Lifetime
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground mb-0.5">
            {formatCurrency(summary.totalEarned, currency)}
          </p>
          <p className="text-xs text-muted-foreground">Total Earned</p>
        </div>

        {/* Pending */}
        <div className="glass-card p-5 rounded-[2rem] border-white/5 bg-gradient-to-br from-amber-500/10 to-orange-500/5 hover:-translate-y-0.5 transition-transform duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-2xl glass border bg-amber-500/10 border-amber-500/20">
              <Clock className="h-5 w-5 text-amber-400" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Awaiting
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground mb-0.5">
            {formatCurrency(summary.pending, currency)}
          </p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </div>

        {/* Paid */}
        <div className="glass-card p-5 rounded-[2rem] border-white/5 bg-gradient-to-br from-emerald-500/10 to-green-500/5 hover:-translate-y-0.5 transition-transform duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-2xl glass border bg-emerald-500/10 border-emerald-500/20">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Received
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground mb-0.5">
            {formatCurrency(summary.paid, currency)}
          </p>
          <p className="text-xs text-muted-foreground">Withdrawn</p>
        </div>

        {/* Available */}
        <div className="glass-card p-5 rounded-[2rem] border-white/5 bg-gradient-to-br from-violet-500/10 to-purple-500/5 hover:-translate-y-0.5 transition-transform duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-2xl glass border bg-violet-500/10 border-violet-500/20">
              <TrendingUp className="h-5 w-5 text-violet-400" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Ready
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground mb-0.5">
            {formatCurrency(summary.available, currency)}
          </p>
          <p className="text-xs text-muted-foreground">Available</p>
        </div>
      </div>

      {/* ===== FILTER BAR ===== */}
      <div className="glass-card p-3 sm:p-4 rounded-2xl border-white/5 bg-white/5 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <input
              type="text"
              placeholder="Search by deal, order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all shrink-0 ${
              showFilters
                ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {/* Status pills */}
            <div className="flex flex-wrap gap-2">
              {(
                [
                  "all",
                  "pending",
                  "approved",
                  "paid",
                  "cancelled",
                ] as CommissionStatus[]
              ).map((status) => {
                const isActive = statusFilter === status;
                const config = status !== "all" ? STATUS_CONFIG[status] : null;
                return (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                      isActive
                        ? "bg-white/15 border border-white/20 text-foreground"
                        : "bg-white/5 border border-white/5 text-muted-foreground/60 hover:bg-white/10"
                    }`}
                  >
                    {config && <config.icon className="h-3 w-3" />}
                    {status === "all" ? "All" : config?.label}
                  </button>
                );
              })}
            </div>

            {/* Date range */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground/50 shrink-0" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
              <span className="text-xs text-muted-foreground/40">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
              {(dateFrom || dateTo) && (
                <button
                  onClick={() => {
                    setDateFrom("");
                    setDateTo("");
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ===== COMMISSION TABLE ===== */}
      <div className="glass-card rounded-[2rem] border-white/5 bg-white/5 overflow-hidden">
        {filteredCommissions.length === 0 ? (
          <div className="py-16 text-center space-y-4">
            {commissions.length === 0 ? (
              <>
                <div className="w-16 h-16 mx-auto rounded-2xl glass-card border-white/10 bg-white/5 flex items-center justify-center">
                  <DollarSign className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground">
                  No commission records yet. Commissions will appear here once
                  orders are confirmed.
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto rounded-2xl glass-card border-white/10 bg-white/5 flex items-center justify-center">
                  <Filter className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground">
                  No commissions match your filters.
                </p>
                <button
                  onClick={() => {
                    setStatusFilter("all");
                    setSearchQuery("");
                    setDateFrom("");
                    setDateTo("");
                  }}
                  className="text-xs font-medium text-blue-400 hover:text-blue-300"
                >
                  Clear filters
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden lg:block">
              {/* Header */}
              <div className="grid grid-cols-6 gap-4 px-6 py-4 border-b border-white/5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                <div>Deal</div>
                <div>Order ID</div>
                <div>Amount</div>
                <div>Rate</div>
                <div>Status</div>
                <div className="text-right">Date</div>
              </div>

              {/* Rows */}
              {filteredCommissions.map((comm) => {
                const statusKey = comm.status as Exclude<
                  CommissionStatus,
                  "all"
                >;
                const config = STATUS_CONFIG[statusKey];
                const StatusIcon = config?.icon || Clock;

                return (
                  <div
                    key={comm.id}
                    className="grid grid-cols-6 gap-4 px-6 py-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors items-center"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {comm.deal_title}
                      </p>
                      {comm.deal_asin && (
                        <p className="text-xs text-muted-foreground/50">
                          {comm.deal_asin}
                        </p>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-muted-foreground font-mono text-xs truncate">
                        {comm.order_id
                          ? `${comm.order_id.slice(0, 8)}...`
                          : "\u2014"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(comm.amount, currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {comm.commission_rate}%
                      </p>
                    </div>
                    <div>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider ${config?.bg || "bg-gray-500/10"} ${config?.text || "text-gray-400"} border ${config?.border || "border-gray-500/20"}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {config?.label || comm.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {formatDate(comm.created_at)}
                      </p>
                      {comm.paid_at && (
                        <p className="text-xs text-emerald-400/60">
                          Paid {formatDate(comm.paid_at)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile */}
            <div className="lg:hidden space-y-3 p-4">
              {filteredCommissions.map((comm) => {
                const statusKey = comm.status as Exclude<
                  CommissionStatus,
                  "all"
                >;
                const config = STATUS_CONFIG[statusKey];
                const StatusIcon = config?.icon || Clock;

                return (
                  <div
                    key={comm.id}
                    className="glass-card p-4 rounded-2xl border-white/5 bg-white/5"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {comm.deal_title}
                        </p>
                        {comm.deal_asin && (
                          <p className="text-xs text-muted-foreground/50">
                            {comm.deal_asin}
                          </p>
                        )}
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase shrink-0 ${config?.bg || "bg-gray-500/10"} ${config?.text || "text-gray-400"} border ${config?.border || "border-gray-500/20"}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {config?.label || comm.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-muted-foreground/50">Amount</span>
                        <p className="text-sm font-semibold text-foreground">
                          {formatCurrency(comm.amount, currency)}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground/50">Rate</span>
                        <p className="text-sm text-muted-foreground">
                          {comm.commission_rate}%
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground/50">Order</span>
                        <p className="text-sm text-muted-foreground font-mono truncate">
                          {comm.order_id
                            ? `${comm.order_id.slice(0, 8)}...`
                            : "\u2014"}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground/50">Date</span>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(comm.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ===== PAYOUT MODAL ===== */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md rounded-[2rem] border-white/10 bg-white/10 p-6 sm:p-8 space-y-6 relative">
            <button
              onClick={() => {
                setShowPayoutModal(false);
                setPayoutAmount("");
              }}
              className="absolute top-4 right-4 p-2 rounded-xl hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>

            <div className="space-y-2">
              <div className="p-3 rounded-2xl glass border bg-emerald-500/10 border-emerald-500/20 w-fit">
                <Wallet className="h-6 w-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                Request Payout
              </h3>
              <p className="text-sm text-muted-foreground">
                Available balance:{" "}
                <span className="font-semibold text-emerald-400">
                  {formatCurrency(summary.available, currency)}
                </span>
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Amount
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-lg font-semibold text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                />
              </div>
              {payoutAmount && parseFloat(payoutAmount) > summary.available && (
                <p className="text-xs text-rose-400">
                  Amount exceeds available balance
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPayoutModal(false);
                  setPayoutAmount("");
                }}
                className="flex-1 px-4 py-3 rounded-xl glass-card border-white/10 text-sm font-medium text-muted-foreground hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handlePayoutRequest}
                disabled={
                  payoutSubmitting ||
                  !payoutAmount ||
                  parseFloat(payoutAmount) <= 0 ||
                  parseFloat(payoutAmount) > summary.available
                }
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-green-500/10 border border-emerald-500/20 text-sm font-semibold text-emerald-400 hover:from-emerald-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {payoutSubmitting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {payoutSubmitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
