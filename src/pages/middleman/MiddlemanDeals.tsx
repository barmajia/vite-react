// Middleman Deals List Placeholder
export function MiddlemanDeals() {
  return (
    <div className="container mx-auto py-8 pt-20">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Deals</h1>
        <a href="/middleman/deals/new" className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
          Create New Deal
        </a>
      </div>
      <div className="border rounded-lg p-8 text-center">
        <p className="text-muted-foreground">No deals yet. Create your first deal to get started.</p>
      </div>
    </div>
  );
}
