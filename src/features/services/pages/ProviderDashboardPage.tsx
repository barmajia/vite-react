import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Briefcase, Star, DollarSign, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

export function ProviderDashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<any>(null);
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    averageRating: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      setLoading(true);

      // Get provider profile
      const { data: providerData } = await supabase
        .from('svc_providers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (providerData) {
        setProvider(providerData);

        // Get stats
        const [listingsRes, ordersRes, reviewsRes] = await Promise.all([
          supabase.from('svc_listings').select('id, is_active').eq('provider_id', providerData.id),
          supabase.from('svc_orders').select('id, status, total_amount').eq('provider_id', providerData.id),
          supabase.from('svc_reviews').select('rating').eq('provider_id', providerData.id),
        ]);

        const listings = listingsRes.data || [];
        const orders = ordersRes.data || [];
        const reviews = reviewsRes.data || [];

        setStats({
          totalListings: listings.length,
          activeListings: listings.filter((l) => l.is_active).length,
          totalOrders: orders.length,
          pendingOrders: orders.filter((o) => o.status === 'pending' || o.status === 'in_progress').length,
          totalRevenue: orders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
          averageRating: reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0,
        });
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Please sign in</h2>
          <p className="text-muted-foreground mb-6">You need to be signed in to access the provider dashboard</p>
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
          <p className="text-muted-foreground">
            Manage your services, orders, and profile
          </p>
        </div>
        <Button asChild>
          <Link to="/services/dashboard/create-listing">
            <Plus size={18} className="mr-2" />
            Create New Service
          </Link>
        </Button>
      </div>

      {/* Create Profile CTA */}
      {!provider && (
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold mb-2">Create Your Provider Profile</h2>
                <p className="text-muted-foreground">
                  Set up your profile to start offering services and connecting with clients
                </p>
              </div>
              <Button asChild>
                <Link to="/services/dashboard/create-profile">Get Started</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      {provider && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Briefcase size={24} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Services</p>
                    <p className="text-2xl font-bold">{stats.activeListings}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-full">
                    <TrendingUp size={24} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Orders</p>
                    <p className="text-2xl font-bold">{stats.totalOrders}</p>
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
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-500/10 rounded-full">
                    <Star size={24} className="text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Average Rating</p>
                    <p className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">Manage Services</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/services/dashboard/listings">View All Services</Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/services/dashboard/create-listing">Create New Service</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">Orders</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/services/dashboard/orders">View All Orders</Link>
                  </Button>
                  <Badge variant={stats.pendingOrders > 0 ? 'default' : 'secondary'}>
                    {stats.pendingOrders} Pending Orders
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">Profile</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to={`/services/provider/${provider.id}`}>View Public Profile</Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/services/dashboard/edit-profile">Edit Profile</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
