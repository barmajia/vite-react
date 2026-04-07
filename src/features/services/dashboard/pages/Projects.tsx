import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { format, isPast } from "date-fns";
import {
  Briefcase,
  Search,
  Filter,
  Loader2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Eye,
  ChevronRight,
  Users,
  TrendingUp,
  Calendar,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate, Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  title: string;
  client_name: string;
  status: "not_started" | "in_progress" | "review" | "completed";
  progress: number;
  deadline: string;
  value: number;
  created_at: string;
  listing_id?: string;
  order_id?: string;
}

const statusPipeline = [
  {
    key: "not_started",
    label: "Not Started",
    icon: Clock,
    color: "text-gray-400",
    bg: "bg-gray-500/10",
    border: "border-gray-500/20",
  },
  {
    key: "in_progress",
    label: "In Progress",
    icon: Play,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  {
    key: "review",
    label: "Review",
    icon: Eye,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  {
    key: "completed",
    label: "Completed",
    icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
];

export const ProjectsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: projects,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["provider-projects", user?.id, statusFilter],
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
        .eq("order_type", "project")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Map svc_orders to Project shape
      return (data || []).map((order: any) => {
        const meta = order.metadata || {};
        const deadline = meta.deadline || order.created_at;
        const progress = meta.progress || 0;
        const statusMap: Record<string, Project["status"]> = {
          pending: "not_started",
          confirmed: "in_progress",
          completed: "completed",
          cancelled: "not_started",
          disputed: "review",
        };
        return {
          id: order.id,
          title: order.listing?.title || "Project",
          client_name: meta.client_name || "Unknown Client",
          status: statusMap[order.status] || "not_started",
          progress: Math.min(100, Math.max(0, progress)),
          deadline,
          value: order.agreed_price || 0,
          created_at: order.created_at,
          listing_id: order.listing_id,
          order_id: order.id,
        } as Project;
      });
    },
    enabled: !!user,
  });

  const filtered = (projects || []).filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.client_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const stats = {
    total: filtered.length,
    inProgress: filtered.filter((p) => p.status === "in_progress").length,
    completed: filtered.filter((p) => p.status === "completed").length,
    overdue: filtered.filter(
      (p) => p.status !== "completed" && isPast(new Date(p.deadline)),
    ).length,
  };

  const pipelineCounts = statusPipeline.map((s) => ({
    ...s,
    count: allProjects.filter((p) => p.status === s.key).length,
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-6">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/40 animate-pulse italic">
            Scanning Project Matrix...
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
          {(error as Error).message || "Failed to load projects."}
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
          <Briefcase className="w-60 h-60 text-primary" />
        </div>
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-[100px] animate-pulse" />

        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-px w-12 bg-primary/40" />
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary italic">
              Project Operations v1.0
            </span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase leading-[0.8] mb-4">
            Project <br />
            <span className="text-foreground/40 italic">Command Center</span>
          </h1>
          <p className="text-foreground/40 text-lg font-medium italic max-w-xl leading-relaxed">
            Track deployment pipelines, monitor milestone progress, and maintain
            operational superiority across all active project vectors.
          </p>
        </div>
      </div>

      {/* Summary Stats Pipeline */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {pipelineCounts.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.key}
              className={cn(
                "glass-card rounded-[2rem] border bg-white/5 p-6 text-center space-y-3 transition-all hover:bg-white/[0.07]",
                item.border,
              )}
            >
              <Icon className={cn("h-6 w-6 mx-auto", item.color)} />
              <p className="text-[9px] font-black uppercase tracking-widest text-white/40 italic">
                {item.label}
              </p>
              <p className="text-3xl font-black italic tracking-tighter text-white">
                {item.count}
              </p>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Projects",
            value: stats.total,
            icon: Briefcase,
            gradient: "from-violet-500 to-purple-500",
          },
          {
            label: "In Progress",
            value: stats.inProgress,
            icon: Play,
            gradient: "from-blue-500 to-cyan-500",
          },
          {
            label: "Completed",
            value: stats.completed,
            icon: CheckCircle2,
            gradient: "from-emerald-500 to-teal-500",
          },
          {
            label: "Overdue",
            value: stats.overdue,
            icon: AlertTriangle,
            gradient: "from-rose-500 to-orange-500",
          },
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
            placeholder="Filter by Project Title or Client..."
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
            <SelectItem
              value="all"
              className="text-[10px] font-black uppercase tracking-widest focus:bg-primary/10 focus:text-primary cursor-pointer"
            >
              All Status
            </SelectItem>
            {statusPipeline.map((s) => (
              <SelectItem
                key={s.key}
                value={s.key}
                className="text-[10px] font-black uppercase tracking-widest focus:bg-primary/10 focus:text-primary cursor-pointer"
              >
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Project Cards */}
      <div className="space-y-8">
        {filtered.length === 0 ? (
          <div className="p-20 glass-card rounded-[3.5rem] border-white/5 bg-white/5 text-center space-y-8">
            <Briefcase className="h-16 w-16 text-white/5 mx-auto" />
            <h3 className="text-3xl font-black italic tracking-tighter uppercase">
              No Projects <span className="text-primary">Found</span>
            </h3>
            <p className="text-white/40 text-sm font-medium italic max-w-sm mx-auto">
              The project grid is currently empty. Projects will appear here
              once clients book your services.
            </p>
            <Button
              onClick={() => navigate("/services/dashboard/listings")}
              className="h-14 px-8 rounded-2xl bg-primary text-white font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
            >
              Manage Listings
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((project) => {
              const isOverdue =
                project.status !== "completed" &&
                isPast(new Date(project.deadline));
              const statusConfig =
                statusPipeline.find((s) => s.key === project.status) ||
                statusPipeline[0];
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={project.id}
                  onClick={() =>
                    navigate(`/services/dashboard/project/${project.id}`)
                  }
                  className="group glass-card rounded-[2.5rem] border-white/5 bg-white/5 hover:bg-white/[0.07] transition-all duration-500 overflow-hidden shadow-xl cursor-pointer hover:shadow-2xl hover:shadow-primary/5"
                >
                  <div className="p-8 space-y-6">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <Badge
                            className={cn(
                              "border text-[8px] font-black uppercase italic tracking-widest",
                              statusConfig.bg,
                              statusConfig.color,
                              statusConfig.border,
                            )}
                          >
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                          {isOverdue && (
                            <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 text-[8px] font-black uppercase italic tracking-widest">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Overdue
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-xl font-black italic tracking-tighter uppercase text-white leading-tight truncate">
                          {project.title}
                        </h3>
                      </div>
                      <ChevronRight className="h-5 w-5 text-white/20 group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 mt-2" />
                    </div>

                    {/* Client */}
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-white/30" />
                      <span className="text-[10px] font-medium text-white/50 uppercase tracking-wider">
                        {project.client_name}
                      </span>
                    </div>

                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/30 italic">
                          Progress
                        </span>
                        <span className="text-[10px] font-black italic text-primary">
                          {project.progress}%
                        </span>
                      </div>
                      <Progress
                        value={project.progress}
                        className="h-2 bg-white/5"
                      />
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-white/30" />
                        <span className="text-[9px] font-medium text-white/40">
                          {format(new Date(project.deadline), "MMM dd, yyyy")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-white/30" />
                        <span className="text-[10px] font-black italic text-white/70">
                          ${project.value.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
