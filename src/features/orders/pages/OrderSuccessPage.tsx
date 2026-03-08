import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, Package, Truck, Home } from 'lucide-react';

export function OrderSuccessPage() {
  const { id } = useParams<{ id: string }>();
  const [orderNumber, setOrderNumber] = useState('');

  useEffect(() => {
    // Generate a readable order number from the ID
    if (id) {
      const shortId = id.split('-').pop()?.substring(0, 8).toUpperCase() || '';
      setOrderNumber(`ORD-${shortId}`);
    }
  }, [id]);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      // Fetch order first
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      if (orderError) throw orderError;

      // Fetch order items
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', id);

      if (itemsError) throw itemsError;

      return {
        ...orderData,
        items: items || [],
      };
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-16">
        <Skeleton className="h-12 w-12 mx-auto mb-4 rounded-full" />
        <Skeleton className="h-8 w-64 mx-auto mb-2" />
        <Skeleton className="h-4 w-96 mx-auto mb-8" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <h2 className="text-2xl font-bold mb-4">Order not found</h2>
        <p className="text-muted-foreground mb-6">
          We couldn't find the order you're looking for.
        </p>
        <Button asChild>
          <Link to="/orders">View All Orders</Link>
        </Button>
      </div>
    );
  }

  const statusSteps = [
    { icon: CheckCircle2, label: 'Order Placed', completed: true },
    { icon: Package, label: 'Processing', completed: ['confirmed', 'processing', 'shipped', 'delivered'].includes(order.status) },
    { icon: Truck, label: 'Shipped', completed: ['shipped', 'delivered'].includes(order.status) },
    { icon: Home, label: 'Delivered', completed: order.status === 'delivered' },
  ];

  const address = order.shipping_address_snapshot as Record<string, string>;

  return (
    <div className="max-w-2xl mx-auto py-8">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
        <p className="text-muted-foreground mb-1">
          Order Number: <span className="font-mono font-medium">{orderNumber}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Confirmation email sent to your registered email address
        </p>
      </div>

      {/* Order Summary */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
          
          {/* Order Items */}
          <div className="space-y-3 mb-4">
            {order.items?.map((item: { id: string; title: string; quantity: number; price: number; image_url: string | null }) => (
              <div key={item.id} className="flex gap-3">
                <div className="w-16 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
                  <img
                    src={item.image_url || '/placeholder.png'}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium line-clamp-2">{item.title}</p>
                  <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                  <p className="text-sm font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          {/* Total */}
          <div className="flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>${order.total.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Shipping Address */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Shipping Address</h2>
          <address className="not-italic text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{address?.full_name}</p>
            <p>{address?.address_line1}</p>
            {address?.address_line2 && <p>{address.address_line2}</p>}
            <p>{address?.city}, {address?.state} {address?.postal_code}</p>
            <p>{address?.country}</p>
            <p className="mt-2">{address?.phone}</p>
          </address>
        </CardContent>
      </Card>

      {/* Order Status Timeline */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Order Status</h2>
          <div className="flex items-center justify-between">
            {statusSteps.map((step, index) => (
              <div key={step.label} className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    step.completed
                      ? 'bg-accent border-accent text-white'
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  <step.icon className="w-5 h-5" />
                </div>
                <p className="text-xs mt-2 text-center font-medium">{step.label}</p>
                {index < statusSteps.length - 1 && (
                  <div
                    className={`absolute h-0.5 w-1/2 mt-14 ${
                      step.completed ? 'bg-accent' : 'bg-border'
                    }`}
                    style={{ marginLeft: '50%' }}
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button asChild className="flex-1">
          <Link to="/orders">View All Orders</Link>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <Link to="/products">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  );
}
