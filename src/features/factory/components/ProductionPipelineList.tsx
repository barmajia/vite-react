import { useState } from 'react';
import { useProductionOrders, useUpdateProductionStatus } from '../hooks/useProductionOrders';
import { ProductionPipeline } from './ProductionPipeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import type { ProductionStatus } from '../types/factory';

export const ProductionPipelineList = () => {
  const { orders, isLoading } = useProductionOrders();
  const updateStatus = useUpdateProductionStatus();
  const [selectedOrder, setSelectedOrder] = useState<typeof orders[0] | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [notes, setNotes] = useState('');

  const handleStatusChange = (order: typeof orders[0]) => {
    setSelectedOrder(order);
    setShowDialog(true);
    setNotes('');
  };

  const confirmStatusChange = (newStatus: ProductionStatus) => {
    if (selectedOrder) {
      updateStatus.mutate({
        orderId: selectedOrder.order_id,
        status: newStatus,
        notes: notes || undefined,
      });
      setShowDialog(false);
      setSelectedOrder(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground">No production orders yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Card key={order.order_id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{order.product_title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Order #{order.order_id.slice(0, 8)} • {order.customer_name}
                </p>
              </div>
              <Badge variant={order.current_status === 'delivered' ? 'default' : 'secondary'}>
                {order.current_status.replace(/_/g, ' ').toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ProductionPipeline
                status={order.current_status}
                onChangeStatus={() => handleStatusChange(order)}
              />
              
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Quantity: {order.quantity}</span>
                <span>Created: {new Date(order.created_at).toLocaleDateString()}</span>
              </div>

              {order.production_started_at && (
                <div className="text-sm text-muted-foreground">
                  Production started: {new Date(order.production_started_at).toLocaleString()}
                </div>
              )}

              {order.production_completed_at && (
                <div className="text-sm text-muted-foreground">
                  Production completed: {new Date(order.production_completed_at).toLocaleString()}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Status Change Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Production Status</DialogTitle>
            <DialogDescription>
              Are you sure you want to update the status for "{selectedOrder?.product_title}"?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm font-medium mb-2">Current Status:</p>
            <Badge variant="secondary">{selectedOrder?.current_status.replace(/_/g, ' ')}</Badge>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Notes (optional)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this status change..."
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => confirmStatusChange(selectedOrder?.current_status || 'pending')}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
