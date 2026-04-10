import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  DollarSign,
  Users,
  Package,
  Link as LinkIcon,
  ArrowUpRight,
  ArrowDownRight,
  Copy,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function MiddlemanDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");

  const { data: kpis, isLoading } = useQuery({
    queryKey: ["middleman-kpis", user?.id, period],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("middle_men")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      const { data: deals } = await supabase
        .from("middle_man_deals")
        .select("*, products(title, price, images)")
        .eq("middle_man_id", user?.id)
        .eq("is_active", true);

      const { data: commissions } = await supabase
        .from("commissions")
        .select("amount, status, created_at")
        .eq("middle_man_id", user?.id);

      const totalEarnings =
        commissions?.reduce(
          (sum, c) => (c.status === "paid" ? sum + c.amount : sum),
          0,
        ) || 0;
      const pendingEarnings =
        commissions?.reduce(
          (sum, c) => (c.status === "pending" ? sum + c.amount : sum),
          0,
        ) || 0;
      const totalClicks = deals?.reduce((sum, d) => sum + d.clicks, 0) || 0;
      const totalConversions =
        deals?.reduce((sum, d) => sum + d.conversions, 0) || 0;

      return {
        profile,
        deals: deals || [],
        kpis: {
          total_earnings: totalEarnings,
          pending_earnings: pendingEarnings,
          total_clicks: totalClicks,
          total_conversions: totalConversions,
          conversion_rate:
            totalClicks > 0
              ? ((totalConversions / totalClicks) * 100).toFixed(2)
              : 0,
          active_deals: deals?.length || 0,
        },
      };
    },
    enabled: !!user?.id,
  });

  const stats = [
    {
      title: "Total Earnings",
      value: `$${kpis?.kpis.total_earnings?.toLocaleString() ?? "0"}`,
      change: "+24.5%",
      trend: "up",
      icon: <DollarSign className="h-5 w-5" />,
      color: "text-emerald-500",
    },
    {
      title: "Pending Earnings",
      value: `$${kpis?.kpis.pending_earnings?.toLocaleString() ?? "0"}`,
      change: "+12%",
      trend: "up",
      icon: <TrendingUp className="h-5 w-5" />,
      color: "text-amber-500",
    },
    {
      title: "Total Clicks",
      value: kpis?.kpis.total_clicks?.toLocaleString() ?? "0",
      change: "+18.3%",
      trend: "up",
      icon: <LinkIcon className="h-5 w-5" />,
      color: "text-blue-500",
    },
    {
      title: "Conversion Rate",
      value: `${kpis?.kpis.conversion_rate}%`,
      change: "-1.2%",
      trend: "down",
      icon: <Users className="h-5 w-5" />,
      color: "text-purple-500",
    },
  ];

  const copyDealLink = (slug: string) => {
    const url = `${window.location.origin}/deal/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Deal link copied to clipboard!");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
            Welcome back,{" "}
            {user?.user_metadata?.full_name?.split(" ")[0] || "Middleman"}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage your deals and track commissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as typeof period)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <Button onClick={() => navigate("/middleman/deals/new")}>
            + Create Deal
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                    {stat.value}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    {stat.trend === "up" ? (
                      <ArrowUpRight className={`h-4 w-4 ${stat.color}`} />
                    ) : (
                      <ArrowDownRight className={`h-4 w-4 ${stat.color}`} />
                    )}
                    <span className={`text-sm ${stat.color}`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div
                  className={`p-3 rounded-xl bg-slate-100 dark:bg-slate-800 ${stat.color}`}
                >
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Active Deals</CardTitle>
            <CardDescription>Your current deal listings</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/middleman/deals")}
          >
            View All
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {kpis?.deals?.slice(0, 5).map((deal: any) => (
              <div
                key={deal.id}
                className="flex items-center gap-4 p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {deal.products?.images?.[0] && (
                  <img
                    src={deal.products.images[0]}
                    alt={deal.products.title}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white truncate">
                    {deal.products?.title}
                  </p>
                  <p className="text-sm text-slate-500">
                    {deal.margin_amount > 0
                      ? `+${deal.margin_amount}% margin`
                      : `${deal.commission_rate}% commission`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-emerald-600">
                    $
                    {(
                      (deal.products?.price || 0) *
                      (1 + (deal.margin_amount || 0) / 100)
                    ).toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {deal.conversions} sales
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyDealLink(deal.unique_slug)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" asChild>
                    <a
                      href={`/deal/${deal.unique_slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            ))}
            {kpis?.deals?.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <Package className="h-8 w-8 mx-auto mb-2" />
                <p>No active deals yet</p>
                <Button
                  variant="link"
                  onClick={() => navigate("/middleman/deals/new")}
                  className="mt-2"
                >
                  Create Your First Deal
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                label: "Browse Products",
                icon: Package,
                href: "/middleman/products",
                color: "bg-violet-500",
              },
              {
                label: "Create Deal",
                icon: LinkIcon,
                href: "/middleman/deals/new",
                color: "bg-emerald-500",
              },
              {
                label: "View Earnings",
                icon: DollarSign,
                href: "/middleman/earnings",
                color: "bg-amber-500",
              },
              {
                label: "Analytics",
                icon: TrendingUp,
                href: "/middleman/analytics",
                color: "bg-blue-500",
              },
            ].map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800"
                onClick={() => navigate(action.href)}
              >
                <div className={`p-3 rounded-xl ${action.color} text-white`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
