import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, Search, Check, X, Mail, MapPin, Factory as FactoryIcon } from "lucide-react";
import { toast } from "sonner";

export function FactoryConnections() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: connections, isLoading } = useQuery({
    queryKey: ["factory-connections", user?.id, searchTerm, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("factory_connections")
        .select("*, sellers!factory_connections_factory_id_fkey(user_id, full_name, email, location, is_verified)")
        .eq("factory_id", user?.id);

      if (searchTerm) {
        query = query.or(`sellers.full_name.ilike.%${searchTerm}%,sellers.email.ilike.%${searchTerm}%`);
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

  const updateConnectionMutation = useMutation({
    mutationFn: async ({ connectionId, status }: { connectionId: string; status: string }) => {
      const updates: Record<string, any> = { status, updated_at: new Date().toISOString() };
      if (status === "accepted") updates.accepted_at = new Date().toISOString();
      if (status === "rejected") updates.rejected_at = new Date().toISOString();

      const { error } = await supabase
        .from("factory_connections")
        .update(updates)
        .eq("id", connectionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["factory-connections"] });
      toast.success("Connection updated");
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Connections</h1>
        <p className="text-slate-600 dark:text-slate-400">Manage your business connections</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search connections..."
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
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-8 text-slate-500">Loading...</div>
        ) : connections?.length === 0 ? (
          <div className="col-span-full text-center py-8 text-slate-500">
            <Users className="h-8 w-8 mx-auto mb-2" />
            <p>No connections yet</p>
          </div>
        ) : (
          connections?.map((connection: any) => (
            <Card key={connection.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                      <FactoryIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {connection.sellers?.full_name}
                      </p>
                      <p className="text-sm text-slate-500">{connection.sellers?.email}</p>
                    </div>
                  </div>
                  {connection.sellers?.is_verified && (
                    <Badge className="bg-emerald-100 text-emerald-700">Verified</Badge>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <MapPin className="h-4 w-4" />
                    <span>{connection.sellers?.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Mail className="h-4 w-4" />
                    <span>Requested: {new Date(connection.requested_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Badge className={
                    connection.status === "accepted" ? "bg-emerald-100 text-emerald-700" :
                    connection.status === "rejected" ? "bg-red-100 text-red-700" :
                    "bg-amber-100 text-amber-700"
                  }>
                    {connection.status}
                  </Badge>

                  {connection.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-3"
                        onClick={() => updateConnectionMutation.mutate({ connectionId: connection.id, status: "rejected" })}
                      >
                        <X className="h-4 w-4 mr-1" />Decline
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 px-3 bg-indigo-600 hover:bg-indigo-700"
                        onClick={() => updateConnectionMutation.mutate({ connectionId: connection.id, status: "accepted" })}
                      >
                        <Check className="h-4 w-4 mr-1" />Accept
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
