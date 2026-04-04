import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Store, ArrowLeft, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/products">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Products
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Marketplace</h1>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products, sellers, categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-1" />
          Filters
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Browse Marketplace
          </CardTitle>
          <CardDescription>
            Discover products from sellers around the world
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Marketplace is loading</h3>
            <p className="text-muted-foreground mb-4">
              Browse our product catalog to find what you need.
            </p>
            <Link to="/products">
              <Button>View All Products</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
