import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Factory, Search, Clock, CheckCircle, AlertTriangle } from "lucide-react";

export function FactoryProduction() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: productionLogs, isLoading } = useQuery({
    queryKey: ["factory-production", user?.id, searchTerm, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("factory_production_logs")
        .select("*, orders(id, total, status)")
        .eq("created_by", user?.id);

      if (searchTerm) {
        query = query.ilike("notes", `%${searchTerm}%`);
      }
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ logId, status }: { logId: string; status: string }) => {
      const { error } = await supabase
        .from("factory_production_logs")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", logId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["factory-production"] });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; icon: any }> = {
      pending: { className: "bg-amber-100 text-amber-700", icon: Clock },
      in_production: { className: "bg-blue-100 text-blue-700", icon: Factory },
      quality_check: { className: "bg-purple-100 text-purple-700", icon: AlertTriangle },
      ready_to_ship: { className: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
    };
    const variant = variants[status] || variants.pending;
    const Icon = variant.icon;
    return <Badge className={`${variant.className} gap-1`}><Icon className="h-3 w-3" />{status.replace("_", " ")}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Production</h1>
        <p className="text-slate-600 dark:text-slate-400">Manage production pipeline</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search production..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_production">In Production</option>
              <option value="quality_check">Quality Check</option>
              <option value="ready_to_ship">Ready to Ship</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : productionLogs?.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">No production logs</TableCell></TableRow>
              ) : (
                productionLogs?.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <p className="font-mono text-sm font-medium">#{log.order_id?.slice(0, 8)}</p>
                      <p className="text-xs text-slate-500">${log.orders?.total?.toFixed(2)}</p>
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">{log.notes?.slice(0, 50)}...</TableCell>
                    <TableCell>{getStatusBadge(log.status)}</TableCell>
                    <TableCell className="text-slate-500">{new Date(log.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <select
                        value={log.status}
                        onChange={(e) => updateStatusMutation.mutate({ logId: log.id, status: e.target.value })}
                        className="px-2 py-1 text-sm rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_production">In Production</option>
                        <option value="quality_check">Quality Check</option>
                        <option value="ready_to_ship">Ready to Ship</option>
                      </select>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
