import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowLeft,
  Briefcase,
  Factory,
  User,
  Percent,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Package,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  FileText,
  ExternalLink,
  Activity,
  Lock,
  Unlock,
} from "lucide-react";

type DealRecord = {
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
  product_title: string | null;
  product_price: number | null;
  product_category: string | null;
  seller_id: string | null;
  seller_name: string | null;
  factory_id: string | null;
  factory_name: string | null;
};

type CommissionRow = {
  id: string;
  order_id: string | null;
  amount: number;
  commission_rate: number;
  status: string;
  paid_at: string | null;
  created_at: string;
  notes: string | null;
  order_status: string | null;
};

type DealStatus = "active" | "pending" | "completed" | "cancelled";

const STATUS_CONFIG: Record<
  DealStatus,
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

const COMMISSION_STATUS_BADGE: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  pending: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Pending" },
  approved: { bg: "bg-blue-500/10", text: "text-blue-400", label: "Approved" },
  paid: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Paid" },
  cancelled: {
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    label: "Cancelled",
  },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDealStatus(deal: {
  is_active: boolean;
  conversions: number;
  clicks: number;
}): DealStatus {
  if (!deal.is_active) {
    return deal.conversions > 0 ? "completed" : "cancelled";
  }
  if (deal.conversions === 0 && deal.clicks === 0) return "pending";
  return "active";
}

export function MiddlemanDealDetails() {
  const { dealId } = useParams<{ dealId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [deal, setDeal] = useState<DealRecord | null>(null);
  const [commissions, setCommissions] = useState<CommissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchDeal = useCallback(async () => {
    if (!user || !dealId) return;

    setLoading(true);
    setError(null);
    setNotFound(false);

    try {
      // Fetch deal
      const { data: rawDeal, error: dealError } = await supabase
        .from("middle_man_deals")
        .select("*")
        .eq("id", dealId)
        .eq("middle_man_id", user.id)
        .maybeSingle();

      if (dealError) throw dealError;
      if (!rawDeal) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Enrich with product + seller + factory info
      let productTitle: string | null = null;
      let productPrice: number | null = null;
      let productCategory: string | null = null;
      let sellerId: string | null = null;
      let sellerName: string | null = null;
      let factoryId: string | null = null;
      let factoryName: string | null = null;

      if (rawDeal.product_id) {
        const { data: product } = await supabase
          .from("products")
          .select("id, title, price, category, seller_id, factory_id")
          .eq("id", rawDeal.product_id)
          .maybeSingle();

        if (product) {
          productTitle = product.title || null;
          productPrice = product.price !== null ? Number(product.price) : null;
          productCategory = product.category || null;
          sellerId = product.seller_id || null;
          factoryId = product.factory_id || null;

          if (sellerId) {
            const { data: seller } = await supabase
              .from("users")
              .select("full_name")
              .eq("user_id", sellerId)
              .maybeSingle();
            sellerName = seller?.full_name || null;
          }

          if (factoryId) {
            const { data: factory } = await supabase
              .from("factory_profiles")
              .select("company_name")
              .eq("user_id", factoryId)
              .maybeSingle();
            factoryName = factory?.company_name || null;
          }
        }
      }

      const enriched: DealRecord = {
        ...rawDeal,
        commission_rate: Number(rawDeal.commission_rate) || 0,
        margin_amount: Number(rawDeal.margin_amount) || 0,
        clicks: rawDeal.clicks || 0,
        conversions: rawDeal.conversions || 0,
        total_revenue: Number(rawDeal.total_revenue) || 0,
        product_title: productTitle,
        product_price: productPrice,
        product_category: productCategory,
        seller_id: sellerId,
        seller_name: sellerName,
        factory_id: factoryId,
        factory_name: factoryName,
      };

      setDeal(enriched);

      // Fetch linked commissions (orders)
      const { data: commData } = await supabase
        .from("commissions")
        .select("*")
        .eq("deal_id", dealId)
        .order("created_at", { ascending: false });

      if (commData && commData.length > 0) {
        const orderIds = commData
          .map((c) => c.order_id)
          .filter(Boolean) as string[];

        const orderStatusMap: Record<string, string> = {};
        if (orderIds.length > 0) {
          const { data: orders } = await supabase
            .from("orders")
            .select("id, status")
            .in("id", orderIds);
          if (orders) {
            orders.forEach((o) => {
              orderStatusMap[o.id] = o.status;
            });
          }
        }

        const enrichedCommissions: CommissionRow[] = commData.map((c) => ({
          ...c,
          amount: Number(c.amount) || 0,
          commission_rate: Number(c.commission_rate) || 0,
          order_status: c.order_id ? orderStatusMap[c.order_id] || null : null,
        }));
        setCommissions(enrichedCommissions);
      } else {
        setCommissions([]);
      }
    } catch (err) {
      console.error("Error fetching deal details:", err);
      setError("Failed to load deal details. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user, dealId]);

  useEffect(() => {
    fetchDeal();
  }, [fetchDeal]);

  const handleToggleActive = async () => {
    if (!deal || !dealId) return;
    setActing(true);
    setActionError(null);

    try {
      const { error: updateError } = await supabase
        .from("middle_man_deals")
        .update({
          is_active: !deal.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq("id", dealId)
        .eq("middle_man_id", user!.id);

      if (updateError) throw updateError;
      await fetchDeal();
    } catch (err) {
      console.error("Error updating deal:", err);
      setActionError("Failed to update deal. Please try again.");
    } finally {
      setActing(false);
    }
  };

  const handleCompleteDeal = async () => {
    if (!dealId) return;
    setActing(true);
    setActionError(null);

    try {
      const { error: updateError } = await supabase
        .from("middle_man_deals")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", dealId)
        .eq("middle_man_id", user!.id);

      if (updateError) throw updateError;
      await fetchDeal();
    } catch (err) {
      console.error("Error completing deal:", err);
      setActionError("Failed to complete deal. Please try again.");
    } finally {
      setActing(false);
    }
  };

  const handleCancelDeal = async () => {
    if (!dealId) return;
    setActing(true);
    setActionError(null);

    try {
      const { error: updateError } = await supabase
        .from("middle_man_deals")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", dealId)
        .eq("middle_man_id", user!.id);

      if (updateError) throw updateError;
      await fetchDeal();
    } catch (err) {
      console.error("Error cancelling deal:", err);
      setActionError("Failed to cancel deal. Please try again.");
    } finally {
      setActing(false);
    }
  };

  // ---- Loading state ----
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 space-y-6">
        {/* Back button skeleton */}
        <div className="h-10 w-32 bg-white/5 rounded-xl animate-pulse" />

        {/* Header skeleton */}
        <div className="glass-card rounded-[2rem] border-white/5 bg-white/5 p-6 sm:p-8 animate-pulse">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3 flex-1">
              <div className="h-4 w-24 bg-white/5 rounded" />
              <div className="h-8 w-3/4 bg-white/5 rounded-xl" />
              <div className="h-4 w-1/2 bg-white/5 rounded" />
            </div>
            <div className="h-8 w-20 bg-white/5 rounded-lg" />
          </div>
        </div>

        {/* Info card skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-card rounded-2xl border-white/5 bg-white/5 p-6 animate-pulse">
            <div className="h-4 w-20 bg-white/5 rounded mb-3" />
            <div className="h-5 w-32 bg-white/5 rounded" />
          </div>
          <div className="glass-card rounded-2xl border-white/5 bg-white/5 p-6 animate-pulse">
            <div className="h-4 w-20 bg-white/5 rounded mb-3" />
            <div className="h-5 w-32 bg-white/5 rounded" />
          </div>
        </div>

        {/* Timeline skeleton */}
        <div className="glass-card rounded-2xl border-white/5 bg-white/5 p-6 animate-pulse">
          <div className="h-5 w-32 bg-white/5 rounded mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-8 w-8 bg-white/5 rounded-full" />
                <div className="h-4 w-40 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ---- Not found state ----
  if (notFound || !deal) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center space-y-8">
        <div className="w-24 h-24 mx-auto glass-card rounded-[2rem] border-white/10 bg-white/5 flex items-center justify-center">
          <Briefcase className="h-12 w-12 text-muted-foreground/40" />
        </div>
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-foreground">Deal Not Found</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            The deal you're looking for doesn't exist or you don't have access
            to it.
          </p>
        </div>
        <Link
          to="/middleman/deals"
          className="inline-flex items-center gap-2 px-8 py-3 glass-card rounded-2xl border-white/10 bg-gradient-to-r from-blue-500/20 to-cyan-500/10 hover:from-blue-500/30 hover:to-cyan-500/20 transition-all text-sm font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Deals
        </Link>
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
          Unable to Load Deal
        </h2>
        <p className="text-sm text-muted-foreground">{error}</p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => fetchDeal()}
            className="inline-flex items-center gap-2 px-6 py-3 glass-card rounded-2xl border-white/10 hover:bg-white/10 transition-all text-sm font-medium"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
          <Link
            to="/middleman/deals"
            className="inline-flex items-center gap-2 px-6 py-3 glass-card rounded-2xl border-white/10 hover:bg-white/10 transition-all text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Deals
          </Link>
        </div>
      </div>
    );
  }

  const status = getDealStatus(deal);
  const statusConfig = STATUS_CONFIG[status];
  const StatusIcon = statusConfig.icon;
  const estimatedEarnings =
    deal.margin_amount > 0
      ? deal.margin_amount * deal.conversions
      : deal.total_revenue * (deal.commission_rate / 100);
  const totalCommissionEarned = commissions.reduce(
    (sum, c) =>
      sum + (c.status === "paid" || c.status === "approved" ? c.amount : 0),
    0,
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 space-y-6 pb-32">
      {/* ===== BACK BUTTON ===== */}
      <Link
        to="/middleman/deals"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-blue-400 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Deals
      </Link>

      {/* ===== HEADER CARD ===== */}
      <div className="glass-card rounded-[2rem] border-white/5 bg-white/5 overflow-hidden">
        {/* Gradient top bar */}
        <div className="h-1.5 bg-gradient-to-r from-blue-500/50 via-cyan-500/40 to-purple-500/50" />

        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2 min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                Deal
              </p>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground break-words">
                {deal.product_title || `ASIN: ${deal.product_asin}`}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(deal.created_at)}
                </span>
                {deal.product_category && (
                  <span className="inline-flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    {deal.product_category}
                  </span>
                )}
              </div>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider shrink-0 ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}`}
            >
              <StatusIcon className="h-3.5 w-3.5" />
              {statusConfig.label}
            </span>
          </div>

          {/* Deal slug / description */}
          {deal.unique_slug && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <p className="text-sm text-muted-foreground/70">
                <span className="font-medium text-muted-foreground">
                  Slug:{" "}
                </span>
                {deal.unique_slug}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ===== ACTION BUTTONS ===== */}
      {actionError && (
        <div className="glass-card rounded-2xl border-rose-500/20 bg-rose-500/5 p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
          <p className="text-sm text-rose-400">{actionError}</p>
        </div>
      )}

      {(status === "active" || status === "pending") && (
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleCompleteDeal}
            disabled={acting}
            className="inline-flex items-center gap-2 px-5 py-2.5 glass-card rounded-2xl border-white/10 bg-gradient-to-r from-emerald-500/20 to-green-500/10 hover:from-emerald-500/30 hover:to-green-500/20 transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="h-4 w-4" />
            {acting ? "Processing..." : "Complete Deal"}
          </button>
          <button
            onClick={handleCancelDeal}
            disabled={acting}
            className="inline-flex items-center gap-2 px-5 py-2.5 glass-card rounded-2xl border-white/10 bg-gradient-to-r from-rose-500/20 to-red-500/10 hover:from-rose-500/30 hover:to-red-500/20 transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <XCircle className="h-4 w-4" />
            {acting ? "Processing..." : "Cancel Deal"}
          </button>
          <button
            onClick={handleToggleActive}
            disabled={acting}
            className="inline-flex items-center gap-2 px-5 py-2.5 glass-card rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deal.is_active ? (
              <>
                <Lock className="h-4 w-4" />
                {acting ? "Processing..." : "Pause Deal"}
              </>
            ) : (
              <>
                <Unlock className="h-4 w-4" />
                {acting ? "Processing..." : "Reactivate Deal"}
              </>
            )}
          </button>
        </div>
      )}

      {/* ===== KEY METRICS ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            icon: Percent,
            label: "Commission",
            value: `${deal.commission_rate}%`,
            sub:
              deal.margin_amount > 0
                ? `+${formatCurrency(deal.margin_amount)} margin`
                : null,
          },
          {
            icon: Activity,
            label: "Clicks",
            value: String(deal.clicks),
            sub: null,
          },
          {
            icon: TrendingUp,
            label: "Conversions",
            value: String(deal.conversions),
            sub: null,
          },
          {
            icon: DollarSign,
            label: "Revenue",
            value: formatCurrency(deal.total_revenue),
            sub:
              estimatedEarnings > 0
                ? `~${formatCurrency(estimatedEarnings)} est.`
                : null,
          },
        ].map((metric) => (
          <div
            key={metric.label}
            className="glass-card rounded-2xl border-white/5 bg-white/5 p-4 sm:p-5"
          >
            <div className="flex items-center gap-2 text-muted-foreground/60 mb-2">
              <metric.icon className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                {metric.label}
              </span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-foreground">
              {metric.value}
            </p>
            {metric.sub && (
              <p className="text-xs text-muted-foreground/60 mt-1">
                {metric.sub}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* ===== INVOLVED PARTIES ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Seller info */}
        <div className="glass-card rounded-2xl border-white/5 bg-white/5 p-6">
          <div className="flex items-center gap-2 text-muted-foreground/60 mb-4">
            <User className="h-4 w-4" />
            <h2 className="text-sm font-semibold uppercase tracking-wider">
              Seller
            </h2>
          </div>
          {deal.seller_name ? (
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground">
                {deal.seller_name}
              </p>
              <p className="text-xs text-muted-foreground/50">
                ID: {deal.seller_id?.slice(0, 8)}...
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground/40">
              No seller information available
            </p>
          )}
        </div>

        {/* Factory info */}
        <div className="glass-card rounded-2xl border-white/5 bg-white/5 p-6">
          <div className="flex items-center gap-2 text-muted-foreground/60 mb-4">
            <Factory className="h-4 w-4" />
            <h2 className="text-sm font-semibold uppercase tracking-wider">
              Factory
            </h2>
          </div>
          {deal.factory_name ? (
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground">
                {deal.factory_name}
              </p>
              <p className="text-xs text-muted-foreground/50">
                ID: {deal.factory_id?.slice(0, 8)}...
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground/40">
              No factory information available
            </p>
          )}
        </div>
      </div>

      {/* ===== COMMISSION BREAKDOWN ===== */}
      <div className="glass-card rounded-2xl border-white/5 bg-white/5 p-6">
        <div className="flex items-center gap-2 text-muted-foreground/60 mb-4">
          <DollarSign className="h-4 w-4" />
          <h2 className="text-sm font-semibold uppercase tracking-wider">
            Commission Breakdown
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
            <p className="text-xs text-muted-foreground/50 mb-1">Rate</p>
            <p className="text-xl font-bold text-foreground">
              {deal.commission_rate}%
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
            <p className="text-xs text-muted-foreground/50 mb-1">
              Margin per unit
            </p>
            <p className="text-xl font-bold text-foreground">
              {deal.margin_amount > 0
                ? formatCurrency(deal.margin_amount)
                : "\u2014"}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
            <p className="text-xs text-muted-foreground/50 mb-1">
              Total earned
            </p>
            <p className="text-xl font-bold text-emerald-400">
              {formatCurrency(totalCommissionEarned)}
            </p>
          </div>
        </div>

        {/* Terms */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Deal Terms
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground/50">Product ASIN</span>
              <span className="text-foreground font-mono text-xs">
                {deal.product_asin}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground/50">Product Price</span>
              <span className="text-foreground">
                {deal.product_price !== null
                  ? formatCurrency(deal.product_price)
                  : "\u2014"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground/50">Deal Type</span>
              <span className="text-foreground">
                {deal.margin_amount > 0 ? "Fixed Margin" : "Percentage"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground/50">Status</span>
              <span className="text-foreground">
                {deal.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== STATUS TIMELINE ===== */}
      <div className="glass-card rounded-2xl border-white/5 bg-white/5 p-6">
        <div className="flex items-center gap-2 text-muted-foreground/60 mb-6">
          <Activity className="h-4 w-4" />
          <h2 className="text-sm font-semibold uppercase tracking-wider">
            Status Timeline
          </h2>
        </div>

        <div className="relative space-y-0">
          {/* Created event */}
          <TimelineEvent
            icon={Calendar}
            label="Deal Created"
            date={deal.created_at}
            color="text-blue-400"
            isLast={status === "pending" && deal.updated_at === deal.created_at}
          />

          {/* Activated event (if different from created) */}
          {status !== "pending" && (
            <TimelineEvent
              icon={TrendingUp}
              label="Deal Activated"
              date={deal.updated_at}
              color="text-emerald-400"
            />
          )}

          {/* Completed / Cancelled event */}
          {status === "completed" && (
            <TimelineEvent
              icon={CheckCircle2}
              label="Deal Completed"
              date={deal.updated_at}
              color="text-blue-400"
              isLast
            />
          )}
          {status === "cancelled" && (
            <TimelineEvent
              icon={XCircle}
              label="Deal Cancelled"
              date={deal.updated_at}
              color="text-rose-400"
              isLast
            />
          )}
        </div>
      </div>

      {/* ===== LINKED ORDERS / COMMISSIONS ===== */}
      {commissions.length > 0 && (
        <div className="glass-card rounded-2xl border-white/5 bg-white/5 overflow-hidden">
          <div className="p-6 pb-4 flex items-center gap-2 text-muted-foreground/60 border-b border-white/5">
            <Package className="h-4 w-4" />
            <h2 className="text-sm font-semibold uppercase tracking-wider">
              Linked Orders ({commissions.length})
            </h2>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block">
            <div className="grid grid-cols-6 gap-4 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/40 border-b border-white/5">
              <div>Order ID</div>
              <div>Commission</div>
              <div>Rate</div>
              <div>Commission Status</div>
              <div>Order Status</div>
              <div>Date</div>
            </div>
            {commissions.map((comm) => {
              const commBadge = COMMISSION_STATUS_BADGE[comm.status] || {
                bg: "bg-gray-500/10",
                text: "text-gray-400",
                label: comm.status,
              };
              return (
                <div
                  key={comm.id}
                  className="grid grid-cols-6 gap-4 px-6 py-3 border-b border-white/5 last:border-0 text-sm hover:bg-white/5 transition-colors items-center"
                >
                  <div className="font-mono text-xs text-muted-foreground truncate">
                    {comm.order_id
                      ? `${comm.order_id.slice(0, 8)}...`
                      : "\u2014"}
                  </div>
                  <div className="font-semibold text-foreground">
                    {formatCurrency(comm.amount)}
                  </div>
                  <div className="text-muted-foreground">
                    {comm.commission_rate}%
                  </div>
                  <div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${commBadge.bg} ${commBadge.text}`}
                    >
                      {commBadge.label}
                    </span>
                  </div>
                  <div className="text-muted-foreground capitalize">
                    {comm.order_status || "\u2014"}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {formatDate(comm.created_at)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-white/5">
            {commissions.map((comm) => {
              const commBadge = COMMISSION_STATUS_BADGE[comm.status] || {
                bg: "bg-gray-500/10",
                text: "text-gray-400",
                label: comm.status,
              };
              return (
                <div
                  key={comm.id}
                  className="p-4 space-y-2 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-muted-foreground">
                      {comm.order_id
                        ? `${comm.order_id.slice(0, 8)}...`
                        : "No order"}
                    </span>
                    <span className="font-bold text-foreground">
                      {formatCurrency(comm.amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground/50">
                      Rate: {comm.commission_rate}%
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${commBadge.bg} ${commBadge.text}`}
                    >
                      {commBadge.label}
                    </span>
                  </div>
                  {comm.order_status && (
                    <div className="text-xs text-muted-foreground capitalize">
                      Order: {comm.order_status}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground/40">
                    {formatDate(comm.created_at)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== BOTTOM CTA ===== */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Link
          to="/middleman/deals"
          className="inline-flex items-center gap-2 px-6 py-3 glass-card rounded-2xl border-white/10 hover:bg-white/10 transition-all text-sm font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Deals
        </Link>
        {deal.product_id && (
          <Link
            to={`/products/${deal.product_id}`}
            className="inline-flex items-center gap-2 px-6 py-3 glass-card rounded-2xl border-white/10 bg-gradient-to-r from-blue-500/10 to-cyan-500/5 hover:from-blue-500/20 hover:to-cyan-500/10 transition-all text-sm font-medium"
          >
            <ExternalLink className="h-4 w-4" />
            View Product
          </Link>
        )}
      </div>
    </div>
  );
}

// ===== TIMELINE EVENT SUBCOMPONENT =====
function TimelineEvent({
  icon: Icon,
  label,
  date,
  color,
  isLast = false,
}: {
  icon: React.ElementType;
  label: string;
  date: string;
  color: string;
  isLast?: boolean;
}) {
  return (
    <div className="flex gap-4">
      {/* Line + dot */}
      <div className="flex flex-col items-center">
        <div
          className={`w-9 h-9 rounded-full glass-card border-white/10 bg-white/5 flex items-center justify-center shrink-0`}
        >
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        {!isLast && (
          <div className="w-px h-8 bg-gradient-to-b from-white/10 to-transparent" />
        )}
      </div>

      {/* Text */}
      <div className="pb-6">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground/50">{formatDate(date)}</p>
      </div>
    </div>
  );
}

export default MiddlemanDealDetails;
