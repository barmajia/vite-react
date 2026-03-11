import { ProductionPipelineList } from '@/features/factory/components/ProductionPipelineList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Clock, CheckCircle } from 'lucide-react';
import type { ProductionStatus } from '@/features/factory/types/factory';

export const FactoryProductionPage = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-primary rounded-lg">
          <Package className="h-8 w-8 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Production Orders</h1>
          <p className="text-muted-foreground">
            Track and manage your production pipeline
          </p>
        </div>
      </div>

      {/* Status Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="pending">
            <Clock className="h-4 w-4 mr-1" />
            Pending
          </TabsTrigger>
          <TabsTrigger value="in_production">
            <Package className="h-4 w-4 mr-1" />
            In Production
          </TabsTrigger>
          <TabsTrigger value="delivered">
            <CheckCircle className="h-4 w-4 mr-1" />
            Completed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Production Orders</CardTitle>
              <CardDescription>
                Manage all your orders across all statuses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductionPipelineList />
            </CardContent>
          </Card>
        </TabsContent>

        {(['pending', 'in_production', 'delivered'] as ProductionStatus[]).map((status) => (
          <TabsContent key={status} value={status}>
            <Card>
              <CardHeader>
                <CardTitle className="capitalize">
                  {status.replace(/_/g, ' ')} Orders
                </CardTitle>
                <CardDescription>
                  Orders currently in {status.replace(/_/g, ' ')} status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProductionOrdersByStatus />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

// Separate component for filtered orders
const ProductionOrdersByStatus = () => {
  // This would ideally use the status filter from the hook
  // For now, we'll just show the full list
  return <ProductionPipelineList />;
};
