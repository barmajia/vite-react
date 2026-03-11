import { FactoryDashboard } from '@/features/factory/components/FactoryDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, TrendingUp } from 'lucide-react';

export const FactoryDashboardPage = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-primary rounded-lg">
          <Building2 className="h-8 w-8 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Factory Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your production and sales performance
          </p>
        </div>
      </div>

      {/* Dashboard Content */}
      <FactoryDashboard />

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <CardHeader>
            <TrendingUp className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Production Orders</CardTitle>
            <CardDescription>
              Track and manage your production pipeline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a href="/factory/production" className="text-primary text-sm font-medium hover:underline">
              View all orders →
            </a>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <CardHeader>
            <Building2 className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Quote Requests</CardTitle>
            <CardDescription>
              Review and respond to buyer quotes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a href="/factory/quotes" className="text-primary text-sm font-medium hover:underline">
              View requests →
            </a>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <CardHeader>
            <Building2 className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Connections</CardTitle>
            <CardDescription>
              Manage your seller partnerships
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a href="/factory/connections" className="text-primary text-sm font-medium hover:underline">
              View connections →
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
