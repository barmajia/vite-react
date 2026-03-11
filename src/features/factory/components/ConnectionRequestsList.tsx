import { useFactoryConnections, useUpdateConnectionStatus } from '../hooks/useFactoryConnections';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar } from '@/components/ui/avatar';
import type { FactoryConnection } from '../types/factory';

const statusColors: Record<FactoryConnection['status'], string> = {
  pending: 'bg-yellow-500',
  accepted: 'bg-green-500',
  rejected: 'bg-red-500',
  blocked: 'bg-gray-500',
};

export const ConnectionRequestsList = () => {
  const { connections, isLoading } = useFactoryConnections('pending');
  const updateConnection = useUpdateConnectionStatus();

  const handleResponse = (connectionId: string, status: 'accepted' | 'rejected') => {
    updateConnection.mutate({ connectionId, status });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-6 w-3/4" />
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (connections.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground">No pending connection requests</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {connections.map((connection) => (
        <Card key={connection.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  {connection.seller?.avatar_url ? (
                    <img
                      src={connection.seller.avatar_url}
                      alt={connection.seller.full_name || 'Seller'}
                    />
                  ) : (
                    <div className="h-full w-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                      {connection.seller?.full_name?.charAt(0) || 'S'}
                    </div>
                  )}
                </Avatar>
                <div>
                  <CardTitle className="text-lg">
                    {connection.seller?.full_name || 'Seller'}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Requested on {new Date(connection.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Badge className={statusColors[connection.status]}>
                {connection.status.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleResponse(connection.id, 'accepted')}
                className="flex-1"
              >
                Accept
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleResponse(connection.id, 'rejected')}
                className="flex-1"
              >
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
