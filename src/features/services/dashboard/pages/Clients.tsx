import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { format, subDays, isAfter } from "date-fns";
import {
  Users,
  Search,
  Filter,
  Loader2,
  AlertTriangle,
  Star,
  Mail,
  Calendar,
  DollarSign,
  Briefcase,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  UserCheck,
  Repeat,
  ChevronRight,
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
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Client {
  user_id: string;
  name: string;
  email: string;
  totalBookings: number;
  totalSpent: number;
  lastBookingDate: string;
  rating: number;
  isActive: boolean;
}

type SortOption = "most_bookings" | "most_spent" | "recent";

export const ClientsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("most_bookings");
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const {
    data: orders,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["provider-clients", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("svc_orders")
        .select(
          `
          id,
          user_id,
          created_at,
          agreed_price,
          status,
          provider_id
        `,
        )
        .eq("provider_id", user.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch user details for client names/emails
  const userIds = useMemo(
    () => [...new Set(orders?.map((o) => o.user_id) || [])],
    [orders],
  );

  const { data: users } = useQuery({
    queryKey: ["client-users", userIds],
    queryFn: async () => {
      if (userIds.length === 0) return [];
      const { data, error } = await supabase
        .from("users")
        .select("user_id, full_name, email")
        .in("user_id", userIds);
      if (error) throw error;
      return data || [];
    },
    enabled: userIds.length > 0,
  });

  // Aggregate client data
  const clients: Client[] = useMemo(() => {
    if (!orders) return [];

    const userMap = new Map(
      (users || []).map((u: any) => [u.user_id, u]),
    );

    const clientMap = new Map<
      string,
      { bookings: number; spent: number; lastDate: string }
    >();

    orders.forEach((order) => {
      const existing = clientMap.get(order.user_id) || {
        bookings: 0,
        spent: 0,
        lastDate: "",
      };
      clientMap.set(order.user_id, {
        bookings: existing.bookings + 1,
        spent: existing.spent + (order.agreed_price || 0),
        lastDate:
          !existing.lastDate ||
          new Date(order.created_at) > new Date(existing.lastDate)
            ? order.created_at
            : existing.lastDate,
      });
    });

    const now = new Date();
    const ninetyDaysAgo = subDays(now, 90);

    return Array.from(clientMap.entries()).map(([userId, data]) => {
      const userInfo = userMap.get(userId) as any;
      const isActive = isAfter(new Date(data.lastDate), ninetyDaysAgo);

      return {
        user_id: userId,
        name: userInfo?.full_name || `Client_${userId.slice(0, 8)}`,
        email: userInfo?.email || "No email available",
        totalBookings: data.bookings,
        totalSpent: data.spent,
        lastBookingDate: data.lastDate,
        rating: 0, // Would come from reviews table
        isActive,
      };
    });
  }, [orders, users]);

  const filtered = clients
    .filter((c) => {
      const matchesSearch =
        !searchQuery ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesActive =
        activeFilter === "all" ||
        (activeFilter === "active" && c.isActive) ||
        (activeFilter === "inactive" && !c.isActive);
      return matchesSearch && matchesActive;
    })
    .sort((a, b) => {
      switch (sortOption) {
        case "most_bookings":
          return b.totalBookings - a.totalBookings;
        case "most_spent":
          return b.totalSpent - a.totalSpent;
        case "recent":
          return (
            new Date(b.lastBookingDate).getTime() -
            new Date(a.lastBookingDate).getTime()
          );
        default:
          return 0;
      }
    });

  const stats = {
    total: clients.length,
    active: clients.filter((c) => c.isActive).length,
    repeatClients: clients.filter((c) => c.totalBookings > 1).length,
    avgBookingValue:
      clients.length > 0
        ? Math.round(
            clients.reduce((sum, c) => sum + c.totalSpent, 0) /
              clients.reduce((sum, c) => sum + c.totalBookings, 0) || 0,
          )
        : 0,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-6">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/40 animate-pulse italic">
            Syncing Client Network...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-20 glass-card rounded-[3.5rem] border-white/5 bg-white/5 text-center space-y-8">
        <AlertTriangle className="h-16 w-16 text-rose-500 mx-auto" />
        <h3 className="text-3xl font-black italic tracking-tighter uppercase">
          Error <span className="text-rose-500">Detected</span>
        </h3>
        <p className="text-white/40 text-sm font-medium italic max-w-sm mx-auto">
          {(error as Error).message || "Failed to load client data."}
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
          <Users className="w-60 h-60 text-primary" />
        </div>
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-[100px] animate-pulse" />

        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-px w-12 bg-primary/40" />
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary italic">
              Client Relations Matrix v1.0
            </span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase leading-[0.8] mb-4">
            Client <br />
            <span className="text-foreground/40 italic">Network</span>
          </h1>
          <p className="text-foreground/40 text-lg font-medium italic max-w-xl leading-relaxed">
            Monitor your client portfolio, track engagement patterns, and
            nurture long-term professional relationships across the Aurora
            ecosystem.
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Clients", value: stats.total, icon: Users, gradient: "from-violet-500 to-purple-500" },
          { label: "Active (90d)", value: stats.active, icon: UserCheck, gradient: "from-emerald-500 to-teal-500" },
          { label: "Repeat Clients", value: stats.repeatClients, icon: Repeat, gradient: "from-blue-500 to-cyan-500" },
          { label: "Avg Booking", value: `$${stats.avgBookingValue}`, icon: TrendingUp, gradient: "from-amber-500 to-orange-500" },
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
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Control Matrix */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Filter by Client Name or Email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-14 pl-14 pr-6 bg-white/5 border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest placeholder:text-white/10 focus:border-primary/40 focus:ring-primary/10 transition-all font-sans"
          />
        </div>
        <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
          <SelectTrigger className="w-[200px] h-14 bg-white/5 border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:border-primary/40">
            <div className="flex items-center gap-3">
              <Filter className="h-4 w-4 text-primary" />
              <SelectValue placeholder="Sort By" />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-white/10 rounded-2xl shadow-2xl">
            {[
              { value: "most_bookings", label: "Most Bookings" },
              { value: "most_spent", label: "Most Spent" },
              { value: "recent", label: "Most Recent" },
            ].map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                className="text-[10px] font-black uppercase tracking-widest focus:bg-primary/10 focus:text-primary cursor-pointer"
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={activeFilter} onValueChange={setActiveFilter}>
          <SelectTrigger className="w-[180px] h-14 bg-white/5 border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:border-primary/40">
            <div className="flex items-center gap-3">
              <UserCheck className="h-4 w-4 text-primary" />
              <SelectValue placeholder="All Clients" />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-white/10 rounded-2xl shadow-2xl">
            {[
              { value: "all", label: "All Clients" },
              { value: "active", label: "Active (90d)" },
              { value: "inactive", label: "Inactive" },
            ].map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                className="text-[10px] font-black uppercase tracking-widest focus:bg-primary/10 focus:text-primary cursor-pointer"
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Client List */}
      <div className="space-y-8">
        {filtered.length === 0 ? (
          <div className="p-20 glass-card rounded-[3.5rem] border-white/5 bg-white/5 text-center space-y-8">
            <Users className="h-16 w-16 text-white/5 mx-auto" />
            <h3 className="text-3xl font-black italic tracking-tighter uppercase">
              No Clients <span className="text-primary">Found</span>
            </h3>
            <p className="text-white/40 text-sm font-medium italic max-w-sm mx-auto">
              Your client network is currently empty. Clients will appear here
              after they book your services.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block glass-card rounded-[3rem] border-white/5 bg-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left p-6 text-[9px] font-black uppercase tracking-widest text-white/30 italic">
                        Client
                      </th>
                      <th className="text-left p-6 text-[9px] font-black uppercase tracking-widest text-white/30 italic">
                        Email
                      </th>
                      <th className="text-center p-6 text-[9px] font-black uppercase tracking-widest text-white/30 italic">
                        Bookings
                      </th>
                      <th className="text-right p-6 text-[9px] font-black uppercase tracking-widest text-white/30 italic">
                        Total Spent
                      </th>
                      <th className="text-left p-6 text-[9px] font-black uppercase tracking-widest text-white/30 italic">
                        Last Booking
                      </th>
                      <th className="text-center p-6 text-[9px] font-black uppercase tracking-widest text-white/30 italic">
                        Rating
                      </th>
                      <th className="text-center p-6 text-[9px] font-black uppercase tracking-widest text-white/30 italic">
                        Status
                      </th>
                      <th className="text-right p-6 text-[9px] font-black uppercase tracking-widest text-white/30 italic">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((client) => (
                      <tr
                        key={client.user_id}
                        className="border-b border-white/5 hover:bg-white/[0.03] transition-colors cursor-pointer"
                        onClick={() =>
                          navigate(
                            `/services/dashboard/clients/${client.user_id}`,
                          )
                        }
                      >
                        <td className="p-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white font-black text-sm italic">
                              {client.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-black italic tracking-tighter uppercase text-white">
                              {client.name}
                            </span>
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-white/20" />
                            <span className="text-[10px] font-medium text-white/50 truncate max-w-[180px]">
                              {client.email}
                            </span>
                          </div>
                        </td>
                        <td className="p-6 text-center">
                          <span className="text-sm font-black text-white/70">
                            {client.totalBookings}
                          </span>
                        </td>
                        <td className="p-6 text-right">
                          <span className="text-sm font-black italic text-emerald-400">
                            ${client.totalSpent.toLocaleString()}
                          </span>
                        </td>
                        <td className="p-6">
                          <span className="text-[10px] font-medium text-white/40">
                            {format(new Date(client.lastBookingDate), "MMM dd, yyyy")}
                          </span>
                        </td>
                        <td className="p-6 text-center">
                          {client.rating > 0 ? (
                            <div className="flex items-center justify-center gap-1">
                              <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                              <span className="text-sm font-black text-white/70">
                                {client.rating.toFixed(1)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[9px] font-medium text-white/20 uppercase">
                              N/A
                            </span>
                          )}
                        </td>
                        <td className="p-6 text-center">
                          <Badge
                            className={cn(
                              "text-[8px] font-black uppercase italic tracking-widest",
                              client.isActive
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-gray-500/10 text-gray-400 border-gray-500/20",
                            )}
                          >
                            {client.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="p-6 text-right">
                          <ChevronRight className="h-4 w-4 text-white/20 inline-block" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden grid gap-4">
              {filtered.map((client) => (
                <div
                  key={client.user_id}
                  onClick={() =>
                    navigate(`/services/dashboard/clients/${client.user_id}`)
                  }
                  className="glass-card rounded-[2.5rem] border-white/5 bg-white/5 p-6 space-y-4 cursor-pointer hover:bg-white/[0.07] transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white font-black text-lg italic">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-black italic tracking-tighter uppercase text-white">
                          {client.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Mail className="h-3 w-3 text-white/20" />
                          <span className="text-[9px] font-medium text-white/40 truncate max-w-[180px]">
                            {client.email}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge
                      className={cn(
                        "text-[8px] font-black uppercase italic tracking-widest",
                        client.isActive
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-gray-500/10 text-gray-400 border-gray-500/20",
                      )}
                    >
                      {client.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
                    <div className="text-center space-y-1">
                      <Briefcase className="h-4 w-4 text-white/20 mx-auto" />
                      <p className="text-[8px] font-black uppercase tracking-widest text-white/20">
                        Bookings
                      </p>
                      <p className="text-lg font-black text-white/70">
                        {client.totalBookings}
                      </p>
                    </div>
                    <div className="text-center space-y-1">
                      <DollarSign className="h-4 w-4 text-white/20 mx-auto" />
                      <p className="text-[8px] font-black uppercase tracking-widest text-white/20">
                        Spent
                      </p>
                      <p className="text-lg font-black italic text-emerald-400">
                        ${client.totalSpent.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center space-y-1">
                      <Calendar className="h-4 w-4 text-white/20 mx-auto" />
                      <p className="text-[8px] font-black uppercase tracking-widest text-white/20">
                        Last
                      </p>
                      <p className="text-[9px] font-medium text-white/50">
                        {format(new Date(client.lastBookingDate), "MMM dd")}
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
};
