import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import {
  Search,
  RefreshCw,
  Package,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  DollarSign,
  Eye,
  ChevronDown,
  ChevronUp,
  X,
  MapPin,
  Mail,
  Phone,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface StoreOrder {
  id: string;
  customer_email: string;
  customer_name: string;
  status: string;
  subtotal: number;
  total: number;
  payment_status: string;
  created_at: string;
  items: OrderItem[];
}

interface OrderItem {
  id: string;
  product_asin: string;
  product_title: string;
  quantity: number;
  unit_price: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  processing: { label: "Processing", color: "bg-blue-100 text-blue-800", icon: Clock },
  shipped: { label: "Shipped", color: "bg-purple-100 text-purple-800", icon: Truck },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800", icon: XCircle },
};

export function MiddlemanOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [store, setStore] = useState<any>(null);

  const loadStore = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("middleman_stores")
        .select("id")
        .eq("middle_man_id", user.id)
        .maybeSingle();

      if (error) throw error;
      setStore(data);
      return data?.id;
    } catch (error: any) {
      console.error("Error loading store:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadOrders = useCallback(async () => {
    if (!store) return;
    try {
      const { data, error } = await supabase.rpc("get_store_orders", {
        p_store_id: store,
      });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  }, [store]);

  useEffect(() => {
    if (user) {
      loadStore();
    }
  }, [user, loadStore]);

  useEffect(() => {
    if (store) {
      loadOrders();
    }
  }, [store, loadOrders]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase.rpc("update_order_status", {
        p_order_id: orderId,
        p_status: newStatus,
      });

      if (error) throw error;
      toast.success("Order status updated");
      loadOrders();
    } catch (error: any) {
      toast.error("Failed to update status");
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (statusFilter && order.status !== statusFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        order.customer_name?.toLowerCase().includes(query) ||
        order.customer_email?.toLowerCase().includes(query) ||
        order.id.includes(query)
      );
    }
    return true;
  });

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const pendingCount = orders.filter((o) => o.status === "pending").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="p-8 text-center">
        <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h2 className="text-xl font-semibold mb-2">No Store Yet</h2>
        <p className="text-muted-foreground mb-4">
          Create a store first to see orders
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" />
            Store Orders
          </h1>
          <p className="text-muted-foreground">
            Manage orders from your store
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground">Total Orders</p>
          <p className="text-2xl font-bold">{orders.length}</p>
        </div>
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
        </div>
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600">${totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No orders yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const StatusIcon = statusConfig.icon;
            const isExpanded = expandedOrder === order.id;

            return (
              <div key={order.id} className="border rounded-lg overflow-hidden">
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-accent"
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">{order.customer_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.customer_email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold">${order.total?.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        statusConfig?.color || "bg-gray-100"
                      }`}
                    >
                      <StatusIcon className="h-3 w-3 inline mr-1" />
                      {statusConfig?.label || order.status}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t p-4 space-y-4">
                    {/* Order Items */}
                    <div>
                      <h4 className="font-medium mb-2">Items</h4>
                      <div className="space-y-2">
                        {(order.items || []).map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-sm"
                          >
                            <div>
                              <p className="font-medium">{item.product_title}</p>
                              <p className="text-muted-foreground">
                                Qty: {item.quantity} × ${item.unit_price?.toFixed(2)}
                              </p>
                            </div>
                            <p className="font-medium">
                              ${item.quantity * item.unit_price?.toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Update Status */}
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">Update Status:</p>
                      {Object.keys(STATUS_CONFIG).map((status) => (
                        <Button
                          key={status}
                          variant={order.status === status ? "default" : "outline"}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateOrderStatus(order.id, status);
                          }}
                        >
                          {STATUS_CONFIG[status].label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}