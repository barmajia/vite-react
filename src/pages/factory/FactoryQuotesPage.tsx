import { QuoteRequestsList } from "@/features/factory/components/QuoteRequestsList";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Clock, CheckCircle } from "lucide-react";

export const FactoryQuotesPage = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-primary rounded-lg">
          <Package className="h-8 w-8 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Quote Requests</h1>
          <p className="text-muted-foreground">
            Review and respond to buyer quote requests
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="received" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="received">
            <Clock className="h-4 w-4 mr-1" />
            Received
          </TabsTrigger>
          <TabsTrigger value="quoted">
            <Package className="h-4 w-4 mr-1" />
            Quoted
          </TabsTrigger>
          <TabsTrigger value="completed">
            <CheckCircle className="h-4 w-4 mr-1" />
            Completed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received">
          <Card>
            <CardHeader>
              <CardTitle>Received Quotes</CardTitle>
              <CardDescription>
                Pending quote requests from buyers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QuoteRequestsList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quoted">
          <Card>
            <CardHeader>
              <CardTitle>Quoted Orders</CardTitle>
              <CardDescription>
                Quotes you've sent, waiting for buyer response
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QuotedOrdersList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Completed Quotes</CardTitle>
              <CardDescription>Accepted and rejected quotes</CardDescription>
            </CardHeader>
            <CardContent>
              <CompletedQuotesList />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const QuotedOrdersList = () => {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
      <p>No quoted orders yet</p>
    </div>
  );
};

const CompletedQuotesList = () => {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
      <p>No completed quotes yet</p>
    </div>
  );
};
