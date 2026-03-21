// Middleman Dashboard Placeholder
export function MiddlemanDashboard() {
  return (
    <div className="container mx-auto py-8 pt-20">
      <h1 className="text-2xl font-bold mb-6">Middleman Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 border rounded-lg">
          <h3 className="text-sm font-medium text-muted-foreground">Total Deals</h3>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="p-6 border rounded-lg">
          <h3 className="text-sm font-medium text-muted-foreground">Active Deals</h3>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="p-6 border rounded-lg">
          <h3 className="text-sm font-medium text-muted-foreground">Commission Earned</h3>
          <p className="text-2xl font-bold">$0.00</p>
        </div>
        <div className="p-6 border rounded-lg">
          <h3 className="text-sm font-medium text-muted-foreground">Orders Completed</h3>
          <p className="text-2xl font-bold">0</p>
        </div>
      </div>
      <div className="mt-8 p-6 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex gap-4">
          <a href="/middleman/deals/new" className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
            Create New Deal
          </a>
          <a href="/middleman/deals" className="px-4 py-2 border rounded hover:bg-muted">
            View All Deals
          </a>
          <a href="/middleman/connections" className="px-4 py-2 border rounded hover:bg-muted">
            Connections
          </a>
        </div>
      </div>
    </div>
  );
}
