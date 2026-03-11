import { ConnectionRequestsList } from '@/features/factory/components/ConnectionRequestsList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Clock, CheckCircle } from 'lucide-react';

export const FactoryConnectionsPage = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-primary rounded-lg">
          <Users className="h-8 w-8 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Factory Connections</h1>
          <p className="text-muted-foreground">
            Manage your partnerships with sellers
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            <Clock className="h-4 w-4 mr-1" />
            Pending
          </TabsTrigger>
          <TabsTrigger value="accepted">
            <CheckCircle className="h-4 w-4 mr-1" />
            Accepted
          </TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Connection Requests</CardTitle>
              <CardDescription>
                Review and respond to seller connection requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConnectionRequestsList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accepted">
          <Card>
            <CardHeader>
              <CardTitle>Accepted Connections</CardTitle>
              <CardDescription>
                Your active partnerships with sellers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AcceptedConnectionsList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Connections</CardTitle>
              <CardDescription>
                View all connection requests and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AllConnectionsList />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const AcceptedConnectionsList = () => {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
      <p>No accepted connections yet</p>
    </div>
  );
};

const AllConnectionsList = () => {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
      <p>No connections yet</p>
    </div>
  );
};
