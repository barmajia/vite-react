import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Store, ArrowLeft, CheckCircle, Star, Package, TrendingUp } from "lucide-react";

export function BecomeSellerPage() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/profile">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Become a Seller</h1>
      </div>

      {/* Hero */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-6 w-6" />
            Start Selling on Aurora
          </CardTitle>
          <CardDescription>
            Join thousands of sellers and reach customers worldwide
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Package className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="font-medium">List Products</p>
              <p className="text-sm text-muted-foreground">Easy product management</p>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="font-medium">Grow Sales</p>
              <p className="text-sm text-muted-foreground">Analytics & insights</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <Star className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <p className="font-medium">Build Reputation</p>
              <p className="text-sm text-muted-foreground">Reviews & ratings</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Seller Benefits</h3>
            <ul className="space-y-2">
              {[
                "Unlimited product listings",
                "Built-in payment processing",
                "Order management dashboard",
                "Sales analytics and reports",
                "Customer messaging tools",
                "Factory direct connections",
              ].map((benefit, i) => (
                <li key={i} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <Card>
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-bold mb-2">Ready to start selling?</h3>
          <p className="text-muted-foreground mb-4">
            Upgrade your account to unlock seller features.
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => navigate("/profile")}>
              Maybe Later
            </Button>
            <Button onClick={() => navigate("/signup?tab=products")}>
              Create Seller Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
