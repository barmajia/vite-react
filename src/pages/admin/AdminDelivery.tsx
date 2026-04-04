// src/pages/admin/AdminDelivery.tsx
// Admin Delivery Management - Fixed for Aurora E-commerce Schema
// Handles foreign key relationships correctly and gracefully degrades if delivery tables don't exist

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, Search, Truck, Package, MapPin, User } from "lucide-react";

// Types matching the actual schema
interface Order {
  id: string;
  user_id: string;
  seller_id: string;
  status:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";
  total: number;
  shipping_address_snapshot?: Record<string, any>;
  created_at: string;
  // Enriched fields (fetched separately)
  customer_name?: string;
  customer_email?: string;
  seller_name?: string;
  delivery_status?:
    | "pending"
    | "assigned"
    | "in_transit"
    | "delivered"
    | "failed";
  driver_name?: string;
  driver_phone?: string;
}

interface Driver {
  id: string;
  user_id: string;
  full_name: string;
  phone?: string;
  vehicle_type?: string;
  is_active: boolean;
  is_verified: boolean;
  is_available: boolean;
}

export function AdminDelivery() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Fetch orders WITHOUT complex joins (FK points to auth.users)
  const fetchOrders = async () => {
    try {
      setLoading(true);

      // Step 1: Fetch orders (no joins to users)
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(
          `
          id,
          user_id,
          seller_id,
          status,
          total,
          shipping_address_snapshot,
          created_at,
          metadata
        `,
        )
        .in("status", ["confirmed", "processing", "shipped", "delivered"])
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      // Step 2: Fetch user details from public.users table
      const userIds = [
        ...new Set(ordersData?.map((o) => o.user_id).filter(Boolean)),
      ];
      const sellerIds = [
        ...new Set(ordersData?.map((o) => o.seller_id).filter(Boolean)),
      ];

      let customers: Record<string, { full_name?: string; email?: string }> =
        {};
      let sellers: Record<string, { full_name?: string; email?: string }> = {};

      if (userIds.length > 0) {
        const { data: userData } = await supabase
          .from("users") // public.users table
          .select("user_id, full_name, email")
          .in("user_id", userIds);
        customers = Object.fromEntries(
          (userData || []).map((u) => [
            u.user_id,
            {
              full_name: u.full_name,
              email: u.email,
            },
          ]),
        );
      }

      if (sellerIds.length > 0) {
        const { data: sellerData } = await supabase
          .from("sellers") // Use sellers table for seller info
          .select("user_id, full_name, email")
          .in("user_id", sellerIds);
        sellers = Object.fromEntries(
          (sellerData || []).map((s) => [
            s.user_id,
            {
              full_name: s.full_name,
              email: s.email,
            },
          ]),
        );
      }

      // Step 3: Try to fetch delivery assignments (if tables exist)
      let assignments: Record<
        string,
        { driver_id?: string; status?: string; driver?: any }
      > = {};
      try {
        const { data: assignmentsData } = await supabase.from(
          "delivery_assignments",
        ).select(`
            order_id,
            driver_id,
            status,
            driver:delivery_profiles(full_name, phone)
          `);

        if (assignmentsData) {
          assignments = Object.fromEntries(
            assignmentsData.map((a) => [
              a.order_id,
              {
                driver_id: a.driver_id,
                status: a.status,
                driver: a.driver,
              },
            ]),
          );
        }
      } catch (_e) {
        // Tables don't exist yet - that's OK, we'll use metadata fallback
        console.log("Delivery tables not ready, using metadata fallback");
      }

      // Step 4: Enrich orders with all data
      const enrichedOrders = (ordersData || []).map((order) => ({
        ...order,
        customer_name: customers[order.user_id]?.full_name || "Unknown",
        customer_email: customers[order.user_id]?.email || "",
        seller_name: sellers[order.seller_id]?.full_name || "Unknown",
        delivery_status:
          assignments[order.id]?.status ||
          (order.metadata as any)?.delivery_status ||
          "pending",
        driver_name: assignments[order.id]?.driver?.full_name,
        driver_phone: assignments[order.id]?.driver?.phone,
      }));

      setOrders(enrichedOrders);
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch available drivers
  const fetchDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from("delivery_profiles")
        .select(
          "id, user_id, full_name, phone, vehicle_type, is_active, is_verified, is_available",
        )
        .eq("is_active", true)
        .eq("is_verified", true)
        .eq("is_available", true);

      if (!error && data) {
        setDrivers(data);
      }
    } catch (_error) {
      // Table might not exist yet
      console.log("delivery_profiles not ready");
    }
  };

  // Assign driver to order
  const assignDriver = async (orderId: string, driverId: string) => {
    try {
      // Try delivery_assignments table first
      const { error: assignError } = await supabase
        .from("delivery_assignments")
        .upsert({
          order_id: orderId,
          driver_id: driverId,
          status: "assigned",
          assigned_at: new Date().toISOString(),
        });

      if (!assignError) {
        toast.success("Driver assigned");
        fetchOrders();
        return;
      }

      // Fallback: store in order metadata
      const order = orders.find((o) => o.id === orderId);
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          metadata: {
            ...((order?.metadata as any) || {}),
            delivery_status: "assigned",
            driver_id: driverId,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (updateError) throw updateError;
      toast.success("Driver assigned (fallback mode)");
      fetchOrders();
    } catch (error: any) {
      console.error("Error assigning driver:", error);
      toast.error("Failed: " + error.message);
    }
  };

  // Update delivery status
  const updateDeliveryStatus = async (orderId: string, newStatus: string) => {
    try {
      // Try delivery_assignments first
      const { error: assignmentError } = await supabase
        .from("delivery_assignments")
        .update({ status: newStatus })
        .eq("order_id", orderId);

      if (!assignmentError) {
        toast.success("Status updated");
        fetchOrders();
        return;
      }

      // Fallback: update order metadata
      const order = orders.find((o) => o.id === orderId);
      const { error: orderError } = await supabase
        .from("orders")
        .update({
          metadata: {
            ...((order?.metadata as any) || {}),
            delivery_status: newStatus,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (orderError) throw orderError;
      toast.success("Status updated (fallback)");
      fetchOrders();
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error("Failed: " + error.message);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchDrivers();

    // Real-time subscription
    const channel = supabase
      .channel("admin-delivery-orders")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        () => fetchOrders(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      filterStatus === "all" || order.delivery_status === filterStatus;
    const matchesSearch =
      searchQuery === "" ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.seller_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      assigned: "bg-blue-100 text-blue-800",
      in_transit: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Delivery Management</h1>
          <p className="text-muted-foreground">
            Track and manage order deliveries
          </p>
        </div>
        <Button onClick={fetchOrders} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders, customers, or sellers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <Package className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-xl font-bold">
                {orders.filter((o) => o.delivery_status === "pending").length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <User className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Assigned</p>
              <p className="text-xl font-bold">
                {orders.filter((o) => o.delivery_status === "assigned").length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <Truck className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-sm text-muted-foreground">In Transit</p>
              <p className="text-xl font-bold">
                {
                  orders.filter((o) => o.delivery_status === "in_transit")
                    .length
                }
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <MapPin className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Delivered</p>
              <p className="text-xl font-bold">
                {orders.filter((o) => o.delivery_status === "delivered").length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Delivery</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs">
                      {order.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{order.customer_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {order.customer_email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {order.seller_name}
                    </TableCell>
                    <TableCell className="font-medium">
                      ${order.total?.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          order.status === "delivered" ? "default" : "secondary"
                        }
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={getStatusColor(
                          order.delivery_status || "pending",
                        )}
                      >
                        {order.delivery_status || "pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {order.driver_name ? (
                        <div>
                          <div className="font-medium">{order.driver_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {order.driver_phone}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Unassigned
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Driver Assignment */}
                        <Select
                          value={order.driver_name ? "assigned" : "none"}
                          onValueChange={(value) => {
                            if (value !== "none") {
                              const driver = drivers.find(
                                (d) => d.id === value,
                              );
                              if (driver) assignDriver(order.id, driver.id);
                            }
                          }}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Assign" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Unassigned</SelectItem>
                            {drivers.map((driver) => (
                              <SelectItem key={driver.id} value={driver.id}>
                                {driver.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Status Update */}
                        <Select
                          value={order.delivery_status || "pending"}
                          onValueChange={(value) =>
                            updateDeliveryStatus(order.id, value)
                          }
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="assigned">Assigned</SelectItem>
                            <SelectItem value="in_transit">
                              In Transit
                            </SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Map Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Live Delivery Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Map integration ready for Mapbox/Google Maps</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
