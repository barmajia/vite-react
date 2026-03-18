import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Briefcase, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

export function ProviderDashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      setLoading(true);

      // Get user's listings
      const { data } = await supabase
        .from("svc_listings")
        .select("*")
        .eq("provider_id", user.id)
        .order("created_at", { ascending: false });

      setListings(data || []);
      setLoading(false);
    };

    fetchData();
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Please sign in</h2>
          <p className="text-muted-foreground mb-6">
            You need to be signed in to access the provider dashboard
          </p>
          <Button asChild>
            <Link to="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Provider Dashboard</h1>
          <p className="text-muted-foreground">Manage your service listings</p>
        </div>
        <Button asChild>
          <Link to="/services/dashboard/create-listing">
            <Plus size={18} className="mr-2" />
            Create New Service
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Briefcase size={24} className="text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Listings</p>
                <p className="text-2xl font-bold">{listings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-full">
                <DollarSign size={24} className="text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Listings</p>
                <p className="text-2xl font-bold">
                  {listings.filter((l) => l.price_numeric).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Listings */}
      {listings.length > 0 ? (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4">
              Your Service Listings
            </h3>
            <div className="space-y-4">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  className="flex items-center justify-between p-4 bg-muted rounded-lg"
                >
                  <div>
                    <h4 className="font-semibold">{listing.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {listing.category_slug
                        ? `Category: ${listing.category_slug}`
                        : "No category"}
                      {listing.price_numeric &&
                        ` • $${listing.price_numeric.toFixed(2)}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/services/listing/${listing.slug}`}>View</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-semibold mb-2">No listings yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first service listing to start attracting clients
            </p>
            <Button asChild>
              <Link to="/services/dashboard/create-listing">
                Create Your First Service
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
