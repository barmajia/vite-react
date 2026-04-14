import { MiddlemanHeader } from "@/components/middleman/MiddlemanHeader";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { 
  Package, 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Globe, 
  Plus, 
  ArrowRight,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

interface DashboardStats {
  totalDeals: number;
  activeDeals: number;
  commissionEarned: number;
  ordersCompleted: number;
  pendingCommission: number;
  siteStatus: 'draft' | 'active' | 'suspended';
}

export function MiddlemanDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);

  useEffect(() => {
    // Check if coming from site creation
    if (location.state?.siteCreated) {
      setShowWelcomeMessage(true);
      setTimeout(() => setShowWelcomeMessage(false), 5000);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        // Fetch deals count
        const { data: deals, error: dealsError } = await supabase
          .from('middle_man_deals')
          .select('id, is_active')
          .eq('middle_man_id', user.id);

        // Fetch commissions
        const { data: commissions, error: commError } = await supabase
          .from('commissions')
          .select('amount, status')
          .eq('middle_man_id', user.id);

        // Fetch site status
        const { data: profile, error: profileError } = await supabase
          .from('middleman_profiles')
          .select('site_status')
          .eq('user_id', user.id)
          .maybeSingle();

        if (dealsError || commError || profileError) {
          console.error('Error fetching dashboard data');
        }

        const totalDeals = deals?.length || 0;
        const activeDeals = deals?.filter(d => d.is_active).length || 0;
        const commissionEarned = commissions
          ?.filter(c => c.status === 'paid')
          .reduce((sum, c) => sum + parseFloat(c.amount), 0) || 0;
        const pendingCommission = commissions
          ?.filter(c => c.status === 'pending' || c.status === 'approved')
          .reduce((sum, c) => sum + parseFloat(c.amount), 0) || 0;
        const ordersCompleted = commissions?.filter(c => c.status === 'paid').length || 0;

        setStats({
          totalDeals,
          activeDeals,
          commissionEarned,
          ordersCompleted,
          pendingCommission,
          siteStatus: profile?.site_status || 'draft'
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <MiddlemanHeader />
      
      {/* Welcome Message */}
      {showWelcomeMessage && (
        <div className="fixed top-20 right-4 z-50 bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-lg shadow-lg animate-in slide-in-from-right fade-in duration-300">
          <div className="flex items-center space-x-3">
            <Globe className="w-5 h-5" />
            <div>
              <p className="font-semibold">Store Created Successfully!</p>
              <p className="text-sm">Your e-commerce store is now live. Start creating deals!</p>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto py-8 px-4">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage your store, deals, and commissions</p>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            <Button
              onClick={() => navigate('/middleman/webmarketplace')}
              variant="outline"
            >
              <Globe className="w-4 h-4 mr-2" />
              {stats?.siteStatus === 'active' ? 'Change Template' : 'Setup Store'}
            </Button>
            <Button
              onClick={() => navigate('/middleman/deals/new')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Deal
            </Button>
          </div>
        </div>

        {/* Setup Required Banner */}
        {stats?.siteStatus !== 'active' && (
          <div className="mb-8 bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-lg">
            <div className="flex items-start">
              <AlertCircle className="w-6 h-6 text-amber-500 mr-3 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-800">Complete Your Store Setup</h3>
                <p className="text-amber-700 mt-1">
                  Choose an e-commerce template and customize your store before creating deals.
                </p>
                <Button
                  onClick={() => navigate('/middleman/webmarketplace')}
                  className="mt-3 bg-amber-600 hover:bg-amber-700"
                  size="sm"
                >
                  Go to Marketplace
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Deals</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalDeals || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600 font-medium">{stats?.activeDeals || 0} active</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Commission Earned</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ${stats?.commissionEarned.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-amber-600 font-medium">
                ${stats?.pendingCommission.toFixed(2) || '0.00'} pending
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Orders Completed</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.ordersCompleted || 0}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-500">
              Total successful transactions
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Store Status</p>
                <p className="text-3xl font-bold text-gray-900 mt-2 capitalize">
                  {stats?.siteStatus || 'Not Set'}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                stats?.siteStatus === 'active' 
                  ? 'bg-green-100' 
                  : stats?.siteStatus === 'suspended'
                  ? 'bg-red-100'
                  : 'bg-amber-100'
              }`}>
                <Globe className={`w-6 h-6 ${
                  stats?.siteStatus === 'active' 
                    ? 'text-green-600' 
                    : stats?.siteStatus === 'suspended'
                    ? 'text-red-600'
                    : 'text-amber-600'
                }`} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              {stats?.siteStatus === 'active' ? (
                <span className="text-green-600 font-medium">✓ Store is live</span>
              ) : (
                <span className="text-amber-600 font-medium">Setup required</span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Quick Actions */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-6">Quick Actions</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <button
                onClick={() => navigate('/middleman/deals/new')}
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <Plus className="w-6 h-6 text-blue-600 mb-3" />
                <h3 className="font-medium">Create New Deal</h3>
                <p className="text-sm text-gray-600 mt-1">Add products to sell</p>
              </button>

              <button
                onClick={() => navigate('/middleman/deals')}
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <Package className="w-6 h-6 text-purple-600 mb-3" />
                <h3 className="font-medium">View All Deals</h3>
                <p className="text-sm text-gray-600 mt-1">Manage your deals</p>
              </button>

              <button
                onClick={() => navigate('/middleman/connections')}
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <TrendingUp className="w-6 h-6 text-green-600 mb-3" />
                <h3 className="font-medium">Connections</h3>
                <p className="text-sm text-gray-600 mt-1">Factory & shop links</p>
              </button>

              <button
                onClick={() => navigate('/middleman/commission')}
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <DollarSign className="w-6 h-6 text-amber-600 mb-3" />
                <h3 className="font-medium">Commissions</h3>
                <p className="text-sm text-gray-600 mt-1">Track earnings</p>
              </button>

              <button
                onClick={() => navigate('/middleman/analytics')}
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <TrendingUp className="w-6 h-6 text-indigo-600 mb-3" />
                <h3 className="font-medium">Analytics</h3>
                <p className="text-sm text-gray-600 mt-1">View performance</p>
              </button>

              <button
                onClick={() => navigate('/middleman/editor')}
                disabled={stats?.siteStatus !== 'active'}
                className={`p-4 border rounded-lg transition-colors text-left ${
                  stats?.siteStatus === 'active'
                    ? 'hover:bg-gray-50 cursor-pointer'
                    : 'opacity-50 cursor-not-allowed bg-gray-50'
                }`}
              >
                <Globe className="w-6 h-6 text-pink-600 mb-3" />
                <h3 className="font-medium">Customize Store</h3>
                <p className="text-sm text-gray-600 mt-1">Edit colors & content</p>
              </button>
            </div>
          </div>

          {/* Getting Started Guide */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border p-6">
            <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
            <div className="space-y-4">
              {[
                { step: 1, title: 'Choose Template', desc: 'Select an e-commerce template', done: stats?.siteStatus !== 'draft', route: '/middleman/webmarketplace' },
                { step: 2, title: 'Customize Store', desc: 'Set colors, branding, content', done: stats?.siteStatus === 'active', route: '/middleman/editor' },
                { step: 3, title: 'Create Deals', desc: 'Add products with commission rates', done: (stats?.totalDeals || 0) > 0, route: '/middleman/deals/new' },
                { step: 4, title: 'Track Earnings', desc: 'Monitor commissions and orders', done: (stats?.commissionEarned || 0) > 0, route: '/middleman/commission' },
              ].map((item) => (
                <div
                  key={item.step}
                  className={`flex items-start space-x-3 p-3 rounded-lg ${
                    item.done ? 'bg-green-50' : 'bg-white'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    item.done 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {item.done ? '✓' : item.step}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{item.title}</h4>
                    <p className="text-xs text-gray-600">{item.desc}</p>
                  </div>
                  {!item.done && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(item.route)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
