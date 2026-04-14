import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, Clock, CheckCircle, XCircle, Truck, Eye } from "lucide-react";

export function SellerOrders() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: orders, isLoading } = useQuery({
    queryKey: ["seller-orders", user?.id, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("orders")
        .select("*, order_items(product_name, quantity, unit_price)")
        .eq("seller_id", user?.id);

      if (searchTerm) {
        query = query.ilike("id", `%${searchTerm}%`);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; icon: any }> = {
      pending: { className: "bg-amber-100 text-amber-700", icon: Clock },
      confirmed: { className: "bg-blue-100 text-blue-700", icon: CheckCircle },
      shipped: { className: "bg-indigo-100 text-indigo-700", icon: Truck },
      delivered: { className: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
      cancelled: { className: "bg-red-100 text-red-700", icon: XCircle },
    };
    const variant = variants[status] || variants.pending;
    const Icon = variant.icon;
    return <Badge className={`${variant.className} gap-1`}><Icon className="h-3 w-3" />{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Orders</h1>
        <p className="text-slate-600 dark:text-slate-400">Manage your orders</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : orders?.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">No orders yet</TableCell></TableRow>
              ) : (
                orders?.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <p className="font-mono text-sm font-medium">#{order.id?.slice(0, 8)}</p>
                      <p className="text-xs text-slate-500">{order.payment_method}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{order.order_items?.length} items</p>
                    </TableCell>
                    <TableCell className="font-semibold">${order.total?.toFixed(2)}</TableCell>
                    <TableCell><Badge variant={order.payment_status === "completed" ? "default" : "secondary"}>{order.payment_status}</Badge></TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-slate-500">{new Date(order.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
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
