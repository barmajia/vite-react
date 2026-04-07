import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import {
  Package,
  Search,
  Filter,
  Loader2,
  AlertTriangle,
  Plus,
  Eye,
  Calendar,
  DollarSign,
  Edit3,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ChevronRight,
  TrendingUp,
  ArrowRight,
  MoreVertical,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Listing {
  id: string;
  title: string;
  category: string;
  price: number;
  status: "active" | "draft" | "inactive";
  views: number;
  bookings: number;
  revenue: number;
  created_at: string;
  description?: string;
  image_url?: string;
}

const statusConfig: Record<string, { color: string; bg: string; border: string }> = {
  active: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  draft: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  inactive: { color: "text-gray-400", bg: "bg-gray-500/10", border: "border-gray-500/20" },
};

export const ListingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: listings,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["provider-listings", user?.id, statusFilter],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from("svc_listings")
        .select("*")
        .eq("provider_id", user.id)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((listing: any) => ({
        id: listing.id,
        title: listing.title || "Untitled Listing",
        category: listing.category || "Uncategorized",
        price: listing.price || 0,
        status: listing.status || "draft",
        views: listing.views || 0,
        bookings: listing.bookings || 0,
        revenue: listing.revenue || 0,
        created_at: listing.created_at,
        description: listing.description,
        image_url: listing.image_url,
      })) as Listing[];
    },
    enabled: !!user,
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("svc_listings")
        .update({ status: isActive ? "active" : "inactive" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-listings"] });
      toast.success("Listing status updated successfully.");
    },
    onError: (err: any) => {
      toast.error(`Failed to update: ${err.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("svc_listings")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-listings"] });
      toast.success("Listing deleted permanently.");
    },
    onError: (err: any) => {
      toast.error(`Failed to delete: ${err.message}`);
    },
  });

  const filtered = listings?.filter((l) => {
    const matchesSearch =
      !searchQuery ||
      l.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const stats = {
    total: listings?.length || 0,
    active: listings?.filter((l) => l.status === "active").length || 0,
    totalViews: listings?.reduce((sum, l) => sum + l.views, 0) || 0,
    totalRevenue: listings?.reduce((sum, l) => sum + l.revenue, 0) || 0,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-6">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/40 animate-pulse italic">
            Syncing Listing Matrix...
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
          {(error as Error).message || "Failed to load listings."}
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
          <Package className="w-60 h-60 text-primary" />
        </div>
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-[100px] animate-pulse" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-px w-12 bg-primary/40" />
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary italic">
                Service Registry v3.1
              </span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase leading-[0.8] mb-4">
              Service <br />
              <span className="text-foreground/40 italic">Listings</span>
            </h1>
            <p className="text-foreground/40 text-lg font-medium italic max-w-xl leading-relaxed">
              Manage your deployed service offerings, monitor engagement metrics,
              and optimize your marketplace presence across all sectors.
            </p>
          </div>
          <Button
            onClick={() => navigate("/services/dashboard/create-listing")}
            className="h-16 px-10 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
          >
            <Plus className="h-5 w-5" />
            Create New Listing
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Listings", value: stats.total, icon: Package, gradient: "from-violet-500 to-purple-500" },
          { label: "Active", value: stats.active, icon: TrendingUp, gradient: "from-emerald-500 to-teal-500" },
          { label: "Total Views", value: stats.totalViews.toLocaleString(), icon: Eye, gradient: "from-blue-500 to-cyan-500" },
          { label: "Total Revenue", value: `$${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, gradient: "from-amber-500 to-orange-500" },
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
            placeholder="Filter by Listing Title..."
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
            {["all", "active", "draft", "inactive"].map((s) => (
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

      {/* Listings Grid */}
      <div className="space-y-8">
        {filtered?.length === 0 ? (
          <div className="p-20 glass-card rounded-[3.5rem] border-white/5 bg-white/5 text-center space-y-8">
            <Package className="h-16 w-16 text-white/5 mx-auto" />
            <h3 className="text-3xl font-black italic tracking-tighter uppercase">
              No Listings <span className="text-primary">Found</span>
            </h3>
            <p className="text-white/40 text-sm font-medium italic max-w-sm mx-auto">
              Your service grid is currently empty. Deploy your first listing to
              start attracting clients.
            </p>
            <Button
              onClick={() => navigate("/services/dashboard/create-listing")}
              className="h-14 px-8 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Listing
            </Button>
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
                        Listing
                      </th>
                      <th className="text-left p-6 text-[9px] font-black uppercase tracking-widest text-white/30 italic">
                        Category
                      </th>
                      <th className="text-left p-6 text-[9px] font-black uppercase tracking-widest text-white/30 italic">
                        Price
                      </th>
                      <th className="text-left p-6 text-[9px] font-black uppercase tracking-widest text-white/30 italic">
                        Status
                      </th>
                      <th className="text-center p-6 text-[9px] font-black uppercase tracking-widest text-white/30 italic">
                        Views
                      </th>
                      <th className="text-center p-6 text-[9px] font-black uppercase tracking-widest text-white/30 italic">
                        Bookings
                      </th>
                      <th className="text-right p-6 text-[9px] font-black uppercase tracking-widest text-white/30 italic">
                        Revenue
                      </th>
                      <th className="text-right p-6 text-[9px] font-black uppercase tracking-widest text-white/30 italic">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered?.map((listing) => {
                      const sc = statusConfig[listing.status] || statusConfig.draft;
                      return (
                        <tr
                          key={listing.id}
                          className="border-b border-white/5 hover:bg-white/[0.03] transition-colors"
                        >
                          <td className="p-6">
                            <p className="text-sm font-black italic tracking-tighter uppercase text-white truncate max-w-[250px]">
                              {listing.title}
                            </p>
                          </td>
                          <td className="p-6">
                            <span className="text-[10px] font-medium text-white/50 uppercase tracking-wider">
                              {listing.category}
                            </span>
                          </td>
                          <td className="p-6">
                            <span className="text-sm font-black italic text-white/80">
                              ${listing.price.toLocaleString()}
                            </span>
                          </td>
                          <td className="p-6">
                            <Badge
                              className={cn(
                                "border text-[8px] font-black uppercase italic tracking-widest",
                                sc.bg,
                                sc.color,
                                sc.border,
                              )}
                            >
                              {listing.status}
                            </Badge>
                          </td>
                          <td className="p-6 text-center">
                            <span className="text-sm font-medium text-white/60">
                              {listing.views.toLocaleString()}
                            </span>
                          </td>
                          <td className="p-6 text-center">
                            <span className="text-sm font-medium text-white/60">
                              {listing.bookings}
                            </span>
                          </td>
                          <td className="p-6 text-right">
                            <span className="text-sm font-black italic text-emerald-400">
                              ${listing.revenue.toLocaleString()}
                            </span>
                          </td>
                          <td className="p-6">
                            <div className="flex items-center justify-end gap-2">
                              <Switch
                                checked={listing.status === "active"}
                                onCheckedChange={(checked) =>
                                  toggleStatusMutation.mutate({
                                    id: listing.id,
                                    isActive: checked,
                                  })
                                }
                                disabled={toggleStatusMutation.isPending}
                              />
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    className="h-10 w-10 rounded-xl glass border-white/5 hover:bg-white hover:text-black transition-all p-0"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-56 glass-card rounded-[1.5rem] border-white/20 shadow-2xl backdrop-blur-3xl p-2 bg-black/80"
                                >
                                  <DropdownMenuItem
                                    onClick={() =>
                                      navigate(
                                        `/services/listing/${listing.id}`,
                                      )
                                    }
                                    className="p-3 rounded-xl focus:bg-primary focus:text-white transition-all cursor-pointer group"
                                  >
                                    <Eye className="mr-3 h-4 w-4 opacity-40 group-hover:opacity-100" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                      View Listing
                                    </span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      navigate(
                                        `/services/dashboard/create-listing?edit=${listing.id}`,
                                      )
                                    }
                                    className="p-3 rounded-xl focus:bg-primary/10 focus:text-primary transition-all cursor-pointer group"
                                  >
                                    <Edit3 className="mr-3 h-4 w-4 opacity-40 group-hover:opacity-100" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                      Edit Listing
                                    </span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      if (
                                        confirm(
                                          "Are you sure you want to delete this listing? This cannot be undone.",
                                        )
                                      ) {
                                        deleteMutation.mutate(listing.id);
                                      }
                                    }}
                                    className="p-3 rounded-xl focus:bg-rose-500/10 focus:text-rose-500 transition-all cursor-pointer group"
                                  >
                                    <Trash2 className="mr-3 h-4 w-4 opacity-40 group-hover:opacity-100" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                      Delete
                                    </span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden grid gap-6">
              {filtered?.map((listing) => {
                const sc = statusConfig[listing.status] || statusConfig.draft;
                return (
                  <div
                    key={listing.id}
                    className="glass-card rounded-[2.5rem] border-white/5 bg-white/5 p-8 space-y-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <Badge
                          className={cn(
                            "border text-[8px] font-black uppercase italic tracking-widest mb-3",
                            sc.bg,
                            sc.color,
                            sc.border,
                          )}
                        >
                          {listing.status}
                        </Badge>
                        <h3 className="text-xl font-black italic tracking-tighter uppercase text-white leading-tight truncate">
                          {listing.title}
                        </h3>
                      </div>
                      <Switch
                        checked={listing.status === "active"}
                        onCheckedChange={(checked) =>
                          toggleStatusMutation.mutate({
                            id: listing.id,
                            isActive: checked,
                          })
                        }
                        disabled={toggleStatusMutation.isPending}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase tracking-widest text-white/20">
                          Category
                        </p>
                        <p className="text-[10px] font-medium text-white/60 uppercase tracking-wider">
                          {listing.category}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase tracking-widest text-white/20">
                          Price
                        </p>
                        <p className="text-sm font-black italic text-white/80">
                          ${listing.price.toLocaleString()}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase tracking-widest text-white/20">
                          Views
                        </p>
                        <p className="text-sm font-medium text-white/60">
                          {listing.views.toLocaleString()}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase tracking-widest text-white/20">
                          Bookings
                        </p>
                        <p className="text-sm font-medium text-white/60">
                          {listing.bookings}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-white/30" />
                        <span className="text-sm font-black italic text-emerald-400">
                          ${listing.revenue.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            navigate(
                              `/services/dashboard/create-listing?edit=${listing.id}`,
                            )
                          }
                          className="text-white/40 hover:text-primary h-8 w-8 p-0"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (
                              confirm(
                                "Delete this listing? This cannot be undone.",
                              )
                            ) {
                              deleteMutation.mutate(listing.id);
                            }
                          }}
                          className="text-white/40 hover:text-rose-500 h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
