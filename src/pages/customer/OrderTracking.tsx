import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Truck, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface Order {
  id: string;
  status: string;
  payment_status: string;
  total: number;
  created_at: string;
  shipping_address_snapshot: any;
  verification_code?: string;
}

const statusIcons: Record<string, any> = {
  pending: Clock,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: AlertCircle,
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export function OrderTracking() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStep = (status: string) => {
    const steps = ["pending", "processing", "shipped", "delivered"];
    return steps.indexOf(status);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Order Tracking</h1>
          <p className="text-gray-600 mt-1">Track your orders in real-time</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No orders yet</p>
              <p className="text-sm mt-1">
                Start shopping to see your orders here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {orders.map((order) => {
              const currentStep = getStatusStep(order.status);

              return (
                <Card
                  key={order.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          Order {order.id.slice(0, 8).toUpperCase()}
                        </CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || "bg-gray-100 text-gray-800"}`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Order Total */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Total Amount
                      </span>
                      <span className="text-lg font-bold text-green-600">
                        {order.total.toFixed(2)} EGP
                      </span>
                    </div>

                    {/* Payment Status */}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">Payment:</span>
                      <span
                        className={`font-medium ${
                          order.payment_status === "completed"
                            ? "text-green-600"
                            : "text-yellow-600"
                        }`}
                      >
                        {order.payment_status}
                      </span>
                    </div>

                    {/* Progress Steps */}
                    <div className="relative">
                      <div className="flex justify-between items-center">
                        {["pending", "processing", "shipped", "delivered"].map(
                          (step, index) => {
                            const StepIcon = statusIcons[step];
                            const isActive = index <= currentStep;
                            const isCurrent = index === currentStep;

                            return (
                              <div
                                key={step}
                                className="flex flex-col items-center flex-1"
                              >
                                <div
                                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    isActive
                                      ? "bg-blue-600 text-white"
                                      : "bg-gray-200 text-gray-400"
                                  } ${isCurrent ? "ring-2 ring-blue-300 ring-offset-2" : ""}`}
                                >
                                  <StepIcon className="h-5 w-5" />
                                </div>
                                <span className="text-xs text-gray-600 mt-1 capitalize">
                                  {step}
                                </span>
                              </div>
                            );
                          },
                        )}
                      </div>
                      {/* Progress Line */}
                      <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-10">
                        <div
                          className="h-full bg-blue-600 transition-all duration-300"
                          style={{ width: `${(currentStep / 3) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Shipping Address */}
                    {order.shipping_address_snapshot && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 font-medium mb-1">
                          Shipping Address
                        </p>
                        <p className="text-sm">
                          {order.shipping_address_snapshot.address_line1}
                          {order.shipping_address_snapshot.city &&
                            `, ${order.shipping_address_snapshot.city}`}
                          {order.shipping_address_snapshot.state &&
                            `, ${order.shipping_address_snapshot.state}`}
                        </p>
                      </div>
                    )}

                    {/* Verification Code (if COD and not delivered) */}
                    {order.verification_code &&
                      order.status !== "delivered" && (
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                          <p className="text-xs text-blue-700 font-medium mb-1">
                            ⚠️ Your Verification Code
                          </p>
                          <p className="text-lg font-mono font-bold text-blue-600">
                            {order.verification_code}
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            Share this code with the delivery driver after
                            payment
                          </p>
                        </div>
                      )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
