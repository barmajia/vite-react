import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Package, Truck, Home, CheckCircle2 } from 'lucide-react';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500',
  confirmed: 'bg-blue-500',
  processing: 'bg-purple-500',
  shipped: 'bg-indigo-500',
  delivered: 'bg-green-500',
  cancelled: 'bg-red-500',
  refunded: 'bg-gray-500',
};

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order-detail', id],
    queryFn: async () => {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items (
            id,
            product_id,
            quantity,
            price,
            title,
            image_url
          )
        `)
        .eq('id', id)
        .single();

      if (orderError) throw orderError;
      return orderData;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <Skeleton className="h-8 w-32 mb-8" />
        <Skeleton className="h-64 w-full mb-4" />
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
          <Link to="/orders">Back to Orders</Link>
        </Button>
      </div>
    );
  }

  const shortId = order.id.split('-').pop()?.substring(0, 8).toUpperCase() || '';
  const orderDate = new Date(order.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const address = order.shipping_address_snapshot as Record<string, string>;

  const statusSteps = [
    { icon: CheckCircle2, label: 'Order Placed', date: order.created_at, completed: true },
    { icon: Package, label: 'Processing', completed: ['confirmed', 'processing', 'shipped', 'delivered'].includes(order.status) },
    { icon: Truck, label: 'Shipped', completed: ['shipped', 'delivered'].includes(order.status) },
    { icon: Home, label: 'Delivered', completed: order.status === 'delivered' },
  ];

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/orders">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Order #{shortId}</h1>
          <p className="text-sm text-muted-foreground">{orderDate}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.items?.map((item: { id: string; product_id: string; quantity: number; price: number; title: string; image_url: string | null }) => (
                  <div key={item.id} className="flex gap-4 pb-4 border-b last:border-b-0 last:pb-0">
                    <div className="w-20 h-20 bg-muted rounded overflow-hidden flex-shrink-0">
                      <img
                        src={item.image_url || '/placeholder.png'}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <Link
                        to={`/product/${item.product_id}`}
                        className="font-medium hover:text-accent line-clamp-2"
                      >
                        {item.title}
                      </Link>
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                        <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-green-600">FREE</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Status Timeline */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">Order Status</h2>
              <div className="flex items-center">
                {statusSteps.map((step, index) => (
                  <div key={step.label} className="flex flex-col items-center flex-1 relative">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-2 z-10 ${
                        step.completed
                          ? 'bg-accent border-accent text-white'
                          : 'border-border text-muted-foreground bg-background'
                      }`}
                    >
                      <step.icon className="w-6 h-6" />
                    </div>
                    <p className="text-xs mt-2 text-center font-medium">{step.label}</p>
                    {index < statusSteps.length - 1 && (
                      <div
                        className={`absolute h-0.5 w-full top-6 ${
                          step.completed ? 'bg-accent' : 'bg-border'
                        }`}
                        style={{ left: '50%' }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Shipping Info */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">Shipping Address</h2>
              <address className="not-italic text-sm space-y-1">
                <p className="font-medium text-foreground">{address?.full_name}</p>
                <p>{address?.address_line1}</p>
                {address?.address_line2 && <p>{address.address_line2}</p>}
                <p>{address?.city}, {address?.state} {address?.postal_code}</p>
                <p>{address?.country}</p>
                <p className="pt-2">{address?.phone}</p>
              </address>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">Order Details</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Number</span>
                  <span className="font-mono">#{shortId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Date</span>
                  <span>{orderDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className={statusColors[order.status] || 'bg-gray-500'}>
                    {order.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment</span>
                  <Badge variant="outline">{order.payment_status}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button asChild className="w-full" variant="outline">
            <Link to="/orders">Back to All Orders</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
