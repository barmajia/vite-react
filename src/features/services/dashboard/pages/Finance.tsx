import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { format, subDays, startOfDay, isWithinInterval } from "date-fns";
import {
  DollarSign,
  Search,
  Filter,
  Loader2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  CreditCard,
  Calendar,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  LineChart,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  date: string;
  description: string;
  type: "earning" | "withdrawal";
  amount: number;
  status: "completed" | "pending" | "failed";
  orderId?: string;
}

interface RevenueDataPoint {
  date: string;
  revenue: number;
  label: string;
}

export const FinancePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("30");

  const daysAgo = parseInt(dateRange, 10) || 30;
  const startDate = startOfDay(subDays(new Date(), daysAgo));

  // Fetch orders for revenue calculation
  const {
    data: orders,
    isLoading: ordersLoading,
    error: ordersError,
    refetch,
  } = useQuery({
    queryKey: ["provider-finance-orders", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("svc_orders")
        .select("id, created_at, agreed_price, status, provider_id, order_type")
        .eq("provider_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Compute revenue data for chart (last N days)
  const revenueData: RevenueDataPoint[] = useMemo(() => {
    if (!orders) return [];

    const dailyMap = new Map<string, number>();
    const now = new Date();

    // Initialize all days
    for (let i = daysAgo - 1; i >= 0; i--) {
      const d = subDays(now, i);
      const key = format(d, "yyyy-MM-dd");
      dailyMap.set(key, 0);
    }

    // Aggregate completed orders
    orders
      .filter((o) => o.status === "completed" && o.agreed_price)
      .forEach((o) => {
        const d = format(new Date(o.created_at), "yyyy-MM-dd");
        if (dailyMap.has(d)) {
          dailyMap.set(d, (dailyMap.get(d) || 0) + (o.agreed_price || 0));
        }
      });

    return Array.from(dailyMap.entries()).map(([date, revenue]) => ({
      date,
      revenue,
      label: format(new Date(date), "MMM dd"),
    }));
  }, [orders, daysAgo]);

  // Compute financial stats
  const stats = useMemo(() => {
    if (!orders)
      return {
        totalRevenue: 0,
        pendingPayout: 0,
        withdrawn: 0,
        thisMonth: 0,
      };

    const completedOrders = orders.filter(
      (o) => o.status === "completed" && o.agreed_price,
    );
    const totalRevenue = completedOrders.reduce(
      (sum, o) => sum + (o.agreed_price || 0),
      0,
    );

    const pendingOrders = orders.filter(
      (o) =>
        (o.status === "confirmed" || o.status === "pending") && o.agreed_price,
    );
    const pendingPayout = pendingOrders.reduce(
      (sum, o) => sum + (o.agreed_price || 0),
      0,
    );

    const now = new Date();
    const monthStart = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
    const thisMonth = completedOrders
      .filter((o) => isWithinInterval(new Date(o.created_at), { start: monthStart, end: now }))
      .reduce((sum, o) => sum + (o.agreed_price || 0), 0);

    return {
      totalRevenue,
      pendingPayout,
      withdrawn: 0, // Would come from payout table
      thisMonth,
    };
  }, [orders]);

  // Build transactions list
  const transactions: Transaction[] = useMemo(() => {
    if (!orders) return [];

    const txs: Transaction[] = orders
      .filter((o) => o.agreed_price)
      .map((o) => ({
        id: o.id,
        date: o.created_at,
        description: `${o.order_type === "project" ? "Project" : "Booking"} - ${o.status}`,
        type: "earning" as const,
        amount: o.agreed_price || 0,
        status:
          o.status === "completed"
            ? "completed"
            : o.status === "cancelled"
              ? "failed"
              : "pending",
        orderId: o.id,
      }));

    return txs.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [orders]);

  const filteredTransactions = transactions.filter((t) => {
    const matchesType = typeFilter === "all" || t.type === typeFilter;
    const matchesDate = isWithinInterval(new Date(t.date), {
      start: startDate,
      end: new Date(),
    });
    return matchesType && matchesDate;
  });

  const handleRequestPayout = () => {
    toast.info("Payout request submitted. Processing typically takes 2-3 business days.");
  };

  if (ordersLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-6">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/40 animate-pulse italic">
            Computing Financial Matrix...
          </p>
        </div>
      </div>
    );
  }

  if (ordersError) {
    return (
      <div className="p-20 glass-card rounded-[3.5rem] border-white/5 bg-white/5 text-center space-y-8">
        <AlertTriangle className="h-16 w-16 text-rose-500 mx-auto" />
        <h3 className="text-3xl font-black italic tracking-tighter uppercase">
          Error <span className="text-rose-500">Detected</span>
        </h3>
        <p className="text-white/40 text-sm font-medium italic max-w-sm mx-auto">
          {(ordersError as Error).message || "Failed to load financial data."}
        </p>
        <Button
          onClick={() => refetch()}
          className="h-14 px-8 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
        >
          Retry Protocol
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20 font-sans">
      {/* Header Matrix */}
      <div className="relative overflow-hidden rounded-[4rem] p-16 bg-white/[0.03] border border-white/5 shadow-2xl group">
        <div className="absolute top-0 right-0 p-16 opacity-5 group-hover:opacity-10 transition-opacity duration-1000">
          <DollarSign className="w-60 h-60 text-primary" />
        </div>
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-[100px] animate-pulse" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-px w-12 bg-primary/40" />
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary italic">
                Financial Operations v2.0
              </span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase leading-[0.8] mb-4">
              Finance <br />
              <span className="text-foreground/40 italic">Command</span>
            </h1>
            <p className="text-foreground/40 text-lg font-medium italic max-w-xl leading-relaxed">
              Monitor revenue streams, manage payout allocations, and maintain
              complete financial transparency across your service ecosystem.
            </p>
          </div>
          <Button
            onClick={handleRequestPayout}
            disabled={stats.pendingPayout === 0}
            className="h-16 px-10 rounded-2xl bg-emerald-500 text-white font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowUpRight className="h-5 w-5" />
            Request Payout
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: `$${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, gradient: "from-emerald-500 to-teal-500", trend: "Lifetime earnings" },
          { label: "Pending Payout", value: `$${stats.pendingPayout.toLocaleString()}`, icon: Clock, gradient: "from-amber-500 to-orange-500", trend: "Awaiting withdrawal" },
          { label: "Withdrawn", value: `$${stats.withdrawn.toLocaleString()}`, icon: Wallet, gradient: "from-blue-500 to-cyan-500", trend: "Total withdrawn" },
          { label: "This Month", value: `$${stats.thisMonth.toLocaleString()}`, icon: Calendar, gradient: "from-violet-500 to-purple-500", trend: format(new Date(), "MMMM") },
        ].map((stat, i) => (
          <Card
            key={i}
            className="glass-card rounded-[2rem] border-white/5 bg-white/5 overflow-hidden"
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-widest text-white/40 italic">
                  {stat.label}
                </span>
                <div
                  className={cn(
                    "p-2 rounded-xl bg-gradient-to-br text-white",
                    stat.gradient,
                  )}
                >
                  <stat.icon className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black italic tracking-tighter text-white">
                {stat.value}
              </p>
              <p className="text-[9px] font-medium text-white/30 mt-1 uppercase tracking-wider">
                {stat.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Chart */}
      <Card className="glass-card rounded-[3rem] border-white/5 bg-white/5 overflow-hidden">
        <CardHeader className="pb-2 px-8 pt-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <LineChart className="h-5 w-5 text-primary" />
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] italic text-white/60">
                Revenue Trend
              </CardTitle>
            </div>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[160px] h-10 bg-white/5 border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest focus:border-primary/40">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-white/10 rounded-xl shadow-2xl">
                {[
                  { value: "7", label: "Last 7 Days" },
                  { value: "14", label: "Last 14 Days" },
                  { value: "30", label: "Last 30 Days" },
                  { value: "60", label: "Last 60 Days" },
                  { value: "90", label: "Last 90 Days" },
                ].map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="text-[9px] font-black uppercase tracking-widest focus:bg-primary/10 focus:text-primary cursor-pointer"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="label"
                  stroke="rgba(255,255,255,0.2)"
                  fontSize={10}
                  tick={{ fill: "rgba(255,255,255,0.3)" }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.2)"
                  fontSize={10}
                  tick={{ fill: "rgba(255,255,255,0.3)" }}
                  tickFormatter={(v: number) => `$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0,0,0,0.8)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    backdropFilter: "blur(20px)",
                  }}
                  labelStyle={{ color: "rgba(255,255,255,0.6)", fontSize: 10 }}
                  itemStyle={{ color: "#8b5cf6", fontSize: 12, fontWeight: 700 }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-center">
              <div className="space-y-4">
                <TrendingDown className="h-12 w-12 text-white/10 mx-auto" />
                <p className="text-[10px] font-black uppercase tracking-widest text-white/20 italic">
                  No revenue data available for this period
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout Method Management */}
      <Card className="glass-card rounded-[3rem] border-white/5 bg-white/5 overflow-hidden">
        <CardHeader className="px-8 pt-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CreditCard className="h-5 w-5 text-primary" />
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] italic text-white/60">
                Payout Method
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary/80 text-[9px] font-black uppercase tracking-widest"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Method
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-black italic uppercase text-white/80">
                  Bank Transfer
                </p>
                <p className="text-[9px] font-medium text-white/30 uppercase tracking-wider">
                  Configure your bank account for payouts
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-white/40 hover:text-primary text-[9px] font-black uppercase tracking-widest"
            >
              Configure
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card className="glass-card rounded-[3rem] border-white/5 bg-white/5 overflow-hidden">
        <CardHeader className="px-8 pt-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Download className="h-5 w-5 text-primary" />
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] italic text-white/60">
                Transaction History
              </CardTitle>
            </div>
            <div className="flex items-center gap-4">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px] h-10 bg-white/5 border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest focus:border-primary/40">
                  <div className="flex items-center gap-2">
                    <Filter className="h-3 w-3 text-primary" />
                    <SelectValue placeholder="All Types" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10 rounded-xl shadow-2xl">
                  {["all", "earning", "withdrawal"].map((s) => (
                    <SelectItem
                      key={s}
                      value={s}
                      className="text-[9px] font-black uppercase tracking-widest focus:bg-primary/10 focus:text-primary cursor-pointer"
                    >
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center space-y-4">
              <Wallet className="h-12 w-12 text-white/10 mx-auto" />
              <p className="text-[10px] font-black uppercase tracking-widest text-white/20 italic">
                No transactions found for this period
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.slice(0, 20).map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "p-3 rounded-xl",
                        tx.type === "earning"
                          ? "bg-emerald-500/10 border border-emerald-500/20"
                          : "bg-rose-500/10 border border-rose-500/20",
                      )}
                    >
                      {tx.type === "earning" ? (
                        <TrendingUp className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-rose-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-black italic uppercase text-white/80 truncate max-w-[200px] md:max-w-none">
                        {tx.description}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[8px] font-medium text-white/30 uppercase tracking-wider">
                          {format(new Date(tx.date), "MMM dd, yyyy")}
                        </span>
                        <Badge
                          className={cn(
                            "text-[7px] font-black uppercase italic tracking-widest",
                            tx.status === "completed"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : tx.status === "pending"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : "bg-rose-500/10 text-rose-400 border-rose-500/20",
                          )}
                        >
                          {tx.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "text-lg font-black italic",
                      tx.type === "earning" ? "text-emerald-400" : "text-rose-400",
                    )}
                  >
                    {tx.type === "earning" ? "+" : "-"}${tx.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
