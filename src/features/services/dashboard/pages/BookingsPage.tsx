// src/features/services/dashboard/pages/BookingsPage.tsx
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  MoreVertical,
  Eye,
  MessageSquare,
  DollarSign,
  Briefcase,
  Zap,
  Activity,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  GripVertical,
  Users,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Milestone {
  id: string;
  title: string;
  description: string;
  amount: number;
  dueDate: string;
  status?: "pending" | "submitted" | "approved";
}

interface Order {
  id: string;
  created_at: string;
  ordered_at: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "disputed";
  agreed_price: number;
  order_type: "booking" | "project";
  currency: string;
  metadata?: {
    milestones?: Milestone[];
    selectedDate?: string;
    selectedTime?: string;
  };
  listing?: {
    title: string;
    id: string;
  };
  user_id: string;
}

export const BookingsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: orders,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["provider-orders", user?.id, statusFilter],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from("svc_orders")
        .select(
          `
          *,
          listing:svc_listings (id, title)
        `,
        )
        .eq("provider_id", user.id)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Order[];
    },
    enabled: !!user,
  });

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      if (!user) throw new Error("Unauthorized");
      const { error } = await supabase
        .from("svc_orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;
      toast.success(`Protocol ${newStatus.toUpperCase()} executed.`);
      refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Operational Error";
      toast.error(`Override Error: ${message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-6">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/40 animate-pulse italic">
            Scanning Operational Grid...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20 font-sans">
      {/* Header Matrix */}
      <div className="relative overflow-hidden rounded-[4rem] p-16 bg-white/[0.03] border border-white/5 shadow-2xl group">
        <div className="absolute top-0 right-0 p-16 opacity-5 group-hover:opacity-10 transition-opacity duration-1000">
          <Activity className="w-60 h-60 text-primary" />
        </div>
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-[100px] animate-pulse" />

        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-px w-12 bg-primary/40" />
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary italic">
              Operational Registry v2.4
            </span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase leading-[0.8] mb-4">
            Mission <br />
            <span className="text-foreground/40 italic">
              {t("common.control", "Control")}
            </span>
          </h1>
          <p className="text-foreground/40 text-lg font-medium italic max-w-xl leading-relaxed">
            Orchestrate high-stakes deployments, monitor node health, and
            maintain secure client synchronization across the global Aurora
            Services matrix.
          </p>
        </div>
      </div>

      {/* Control Matrix */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Filter by Node ID or Sector Title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-14 pl-14 pr-6 bg-white/5 border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest placeholder:text-white/10 focus:border-primary/40 focus:ring-primary/10 transition-all font-sans"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px] h-14 bg-white/5 border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:border-primary/40">
            <div className="flex items-center gap-3">
              <Filter className="h-4 w-4 text-primary" />
              <SelectValue placeholder="All Status" />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-white/10 rounded-2xl shadow-2xl">
            {[
              "all",
              "pending",
              "confirmed",
              "completed",
              "cancelled",
              "disputed",
            ].map((s) => (
              <SelectItem
                key={s}
                value={s}
                className="text-[10px] font-black uppercase tracking-widest focus:bg-primary/10 focus:text-primary cursor-pointer"
              >
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders Matrix Feed */}
      <div className="space-y-8">
        {orders?.length === 0 ? (
          <div className="p-20 glass-card rounded-[3.5rem] border-white/5 bg-white/5 text-center space-y-8">
            <Briefcase className="h-16 w-16 text-white/5 mx-auto" />
            <h3 className="text-3xl font-black italic tracking-tighter uppercase">
              No Entries <span className="text-primary">Found</span>
            </h3>
            <p className="text-white/40 text-sm font-medium italic max-w-sm mx-auto">
              The operational grid is currently clear of pending deployments.
            </p>
          </div>
        ) : (
          orders?.map((order) => (
            <div
              key={order.id}
              className="group glass-card rounded-[3rem] border-white/5 bg-white/5 hover:bg-white/[0.07] transition-all duration-700 overflow-hidden shadow-xl"
            >
              {/* Header Row */}
              <div className="p-8 flex flex-col md:flex-row justify-between items-center gap-8 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-8">
                  <div className="w-16 h-16 rounded-3xl glass bg-black/20 flex items-center justify-center border border-white/10 relative">
                    {order.order_type === "project" ? (
                      <Zap className="h-6 w-6 text-primary" />
                    ) : (
                      <Clock className="h-6 w-6 text-emerald-500" />
                    )}
                    <div
                      className={cn(
                        "absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-black",
                        order.status === "pending"
                          ? "bg-amber-500"
                          : order.status === "confirmed"
                            ? "bg-emerald-500"
                            : "bg-primary",
                      )}
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <Badge
                        className={cn(
                          "bg-white/5 border-white/10 text-[9px] font-black uppercase italic tracking-widest",
                          order.order_type === "project"
                            ? "text-primary"
                            : "text-emerald-500",
                        )}
                      >
                        {order.order_type.toUpperCase()}_DEPLOYMENT
                      </Badge>
                      <span className="text-[10px] font-black text-white/20 uppercase tracking-tighter italic">
                        ID: {order.id.slice(0, 12)}
                      </span>
                    </div>
                    <h3 className="text-3xl font-black italic tracking-tighter uppercase leading-none">
                      {order.listing?.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-center md:text-right">
                    <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">
                      Total Allocation
                    </p>
                    <p className="text-4xl font-black italic tracking-tighter text-foreground leading-none">
                      {order.currency} {order.agreed_price.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <Button
                      onClick={() =>
                        navigate(
                          `/services/chat?conversationId=mock-${order.id}`,
                        )
                      }
                      className="h-16 px-8 rounded-2xl glass border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-white font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/10 transition-all flex items-center gap-3 group"
                    >
                      <MessageSquare className="h-4 w-4 group-hover:rotate-12 transition-all" />
                      {t("servicesNexus.programmer.secureLink", "Secure Link")}
                    </Button>
                    {order.status === "pending" && (
                      <Button
                        onClick={() => updateOrderStatus(order.id, "confirmed")}
                        className="h-16 px-8 rounded-2xl bg-emerald-500 text-white font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
                      >
                        Accept Deployment
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-16 w-16 rounded-2xl glass border-white/5 hover:bg-white hover:text-black transition-all"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-64 glass-card rounded-[2rem] border-white/20 shadow-2xl backdrop-blur-3xl p-2 bg-black/80"
                      >
                        <DropdownMenuItem
                          onClick={() => navigate(`/services/chat`)}
                          className="p-4 rounded-xl focus:bg-primary focus:text-white transition-all cursor-pointer group"
                        >
                          <MessageSquare className="mr-3 h-4 w-4 opacity-40 group-hover:opacity-100" />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest">
                              Archive Thread
                            </span>
                            <span className="text-[8px] font-medium opacity-40 uppercase tracking-tighter">
                              Sync Log Persistence
                            </span>
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="p-4 rounded-xl focus:bg-rose-500/10 focus:text-rose-500 transition-all cursor-pointer group">
                          <XCircle className="mr-3 h-4 w-4 opacity-40 group-hover:opacity-100" />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest">
                              Abort Protocol
                            </span>
                            <span className="text-[8px] font-medium opacity-40 uppercase tracking-tighter">
                              Emergency Termination
                            </span>
                          </div>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              {/* Body Content: Milestones or Sync Data */}
              <CardContent className="p-10">
                {order.order_type === "project" &&
                order.metadata?.milestones ? (
                  <div className="space-y-12">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] italic">
                          Deployment Roadmap Progress
                        </h4>
                      </div>
                      <span className="text-[10px] font-black text-white/40 italic uppercase tracking-widest">
                        {
                          order.metadata.milestones.filter(
                            (m) => m.status === "approved",
                          ).length
                        }{" "}
                        / {order.metadata.milestones.length} PHASES CLEARED
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {order.metadata.milestones.map((milestone, idx) => (
                        <div
                          key={milestone.id}
                          className="relative glass-card p-6 rounded-[2rem] border-white/5 bg-white/[0.03] space-y-4 group/ms"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl glass bg-white/5 border-white/5 flex items-center justify-center text-[10px] font-black italic">
                                {idx + 1}
                              </div>
                              <h5 className="text-sm font-black italic tracking-tighter uppercase leading-tight line-clamp-1 group-hover/ms:text-primary transition-colors">
                                {milestone.title}
                              </h5>
                            </div>
                            {milestone.status === "approved" ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            ) : (
                              <div className="h-5 w-5 rounded-full border-2 border-white/10" />
                            )}
                          </div>
                          <p className="text-[10px] font-medium text-white/30 italic line-clamp-2 leading-relaxed">
                            "{milestone.description}"
                          </p>
                          <div className="flex justify-between items-end pt-4 border-t border-white/5">
                            <div className="space-y-1">
                              <p className="text-[7px] font-black text-white/20 uppercase tracking-widest">
                                Allocation
                              </p>
                              <p className="text-xl font-black italic tracking-tighter">
                                {order.currency}{" "}
                                {milestone.amount.toLocaleString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[7px] font-black text-white/20 uppercase tracking-widest">
                                Deadline
                              </p>
                              <p className="text-[9px] font-black italic text-white/60">
                                {milestone.dueDate || "TBD"}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row items-center gap-12 bg-white/[0.02] p-8 rounded-[2.5rem] border border-white/5 shadow-inner">
                    <div className="flex items-center gap-6">
                      <div className="p-4 rounded-2xl glass bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                        <Calendar className="h-8 w-8" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/20 italic mb-1">
                          Synchronization Launch
                        </p>
                        <h4 className="text-3xl font-black italic tracking-tighter uppercase">
                          {order.metadata?.selectedDate
                            ? format(
                                new Date(order.metadata.selectedDate),
                                "MMM dd, yyyy",
                              )
                            : "DATE_PENDING"}
                        </h4>
                      </div>
                    </div>
                    <div className="h-12 w-px bg-white/5 hidden md:block" />
                    <div className="flex items-center gap-6">
                      <div className="p-4 rounded-2xl glass bg-amber-500/10 border border-amber-500/20 text-amber-500">
                        <Clock className="h-8 w-8" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/20 italic mb-1">
                          Time Alignment
                        </p>
                        <h4 className="text-3xl font-black italic tracking-tighter uppercase">
                          {order.metadata?.selectedTime || "TIME_PENDING"}{" "}
                          <span className="text-sm italic opacity-40">UTC</span>
                        </h4>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>

              {/* Footer Row: Details & Quick Actions */}
              <div className="px-10 py-6 border-t border-white/5 flex items-center justify-between bg-white/[0.01]">
                <div className="flex items-center gap-4">
                  <Users className="h-4 w-4 text-white/20" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/20 italic">
                    Personnel Node:{" "}
                    <span className="text-white/60">
                      CLIENT_{order.user_id.slice(0, 8)}
                    </span>
                  </p>
                </div>
                <Link
                  to={`/services/listing/${order.listing?.id}`}
                  className="group/lnk flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-primary transition-colors italic"
                >
                  View Detailed Sector Specs{" "}
                  <ChevronRight className="h-3 w-3 group-hover/lnk:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
