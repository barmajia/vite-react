import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Order } from '@/types/database';

interface OrderCardProps {
  order: Order & {
    items?: Array<{
      id: string;
      product_id: string;
      quantity: number;
      price: number;
      title: string;
      image_url: string | null;
    }>;
  };
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500',
  confirmed: 'bg-blue-500',
  processing: 'bg-purple-500',
  shipped: 'bg-indigo-500',
  delivered: 'bg-green-500',
  cancelled: 'bg-red-500',
  refunded: 'bg-gray-500',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

export function OrderCard({ order }: OrderCardProps) {
  const orderDate = new Date(order.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const shortId = order.id.split('-').pop()?.substring(0, 8).toUpperCase() || '';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-xs text-muted-foreground">Order</p>
            <p className="font-mono text-sm font-medium">#{shortId}</p>
          </div>
          <Badge className={statusColors[order.status] || 'bg-gray-500'}>
            {statusLabels[order.status] || order.status}
          </Badge>
        </div>

        {/* Order Items Preview */}
        <div className="flex gap-2 mb-3">
          {order.items?.slice(0, 3).map((item) => (
            <div key={item.id} className="w-12 h-12 bg-muted rounded overflow-hidden">
              <img
                src={item.image_url || '/placeholder.png'}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
          {order.items && order.items.length > 3 && (
            <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-xs font-medium">
              +{order.items.length - 3}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">
              {order.items?.length || 0} item{(order.items?.length || 0) > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-muted-foreground">{orderDate}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">${order.total.toFixed(2)}</p>
            <Link
              to={`/orders/${order.id}`}
              className="text-sm text-accent hover:underline"
            >
              View Details →
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
