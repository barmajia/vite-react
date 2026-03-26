import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, MapPin, Phone, CheckCircle, Navigation } from 'lucide-react';
import VerifyCODModal from './VerifyCODModal';

interface DeliveryOrder {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: any;
  total_amount: number;
  verification_key: string;
  status: string;
  expires_at: string;
}

export function DeliveryDashboard() {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  useEffect(() => {
    loadPendingDeliveries();
  }, []);

  const loadPendingDeliveries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase.rpc('get_driver_cod_orders', {
        p_driver_id: user!.id
      });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      toast.error('Failed to load deliveries');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCOD = (order: DeliveryOrder) => {
    setSelectedOrder(order);
    setShowVerifyModal(true);
  };

  const handleVerificationSuccess = () => {
    setShowVerifyModal(false);
    loadPendingDeliveries();
    toast.success('COD payment verified! Money collected.');
  };

  const handleNavigate = (address: any) => {
    const addressString = [
      address.address_line1,
      address.address_line2,
      address.city,
      address.state,
      address.postal_code,
      address.country
    ].filter(Boolean).join(', ');
    
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressString)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Delivery Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage your COD deliveries</p>
          </div>
          <div className="text-sm text-gray-600 bg-white px-4 py-2 rounded-lg shadow-sm">
            <span className="font-semibold text-blue-600">{orders.length}</span> pending deliveries
          </div>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
              <p className="text-gray-500 mt-4">Loading deliveries...</p>
            </CardContent>
          </Card>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No pending deliveries</p>
              <p className="text-sm mt-1">Check back later for new delivery assignments</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {orders.map((order) => (
              <Card key={order.id} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex justify-between items-start">
                    <span className="text-lg">Order {order.id.slice(0, 8).toUpperCase()}</span>
                    <span className="text-sm font-normal bg-green-100 text-green-800 px-2 py-1 rounded">
                      {order.total_amount.toFixed(2)} EGP
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{order.customer_phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>{order.delivery_address?.city}, {order.delivery_address?.state}</span>
                    </div>
                  </div>

                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      <strong>Verification Code:</strong> <span className="font-mono">{order.verification_key}</span>
                    </p>
                    <p className="text-xs text-yellow-600 mt-1">
                      Expires: {new Date(order.expires_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleVerifyCOD(order)}
                      className="flex-1"
                      size="sm"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Verify & Collect
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleNavigate(order.delivery_address)}
                    >
                      <Navigation className="h-4 w-4 mr-2" />
                      Navigate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {showVerifyModal && selectedOrder && (
          <VerifyCODModal
            order={selectedOrder}
            onClose={() => setShowVerifyModal(false)}
            onSuccess={handleVerificationSuccess}
          />
        )}
      </div>
    </div>
  );
}
