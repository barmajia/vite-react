import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Settings,
  Handshake,
  BarChart3,
  LogOut,
  Menu,
  X,
  Users,
  DollarSign,
  FileText,
  ShoppingCart,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBell } from "@/components/layout/NotificationBell";

const navItems = [
  {
    to: "/middleman/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    to: "/middleman/deals",
    label: "My Deals",
    icon: Handshake,
  },
  {
    to: "/middleman/orders",
    label: "Orders",
    icon: ShoppingCart,
  },
  {
    to: "/middleman/connections",
    label: "Connections",
    icon: Users,
  },
  {
    to: "/middleman/commission",
    label: "Commission",
    icon: DollarSign,
  },
  {
    to: "/middleman/analytics",
    label: "Analytics",
    icon: BarChart3,
  },
  {
    to: "/middleman/profile",
    label: "Profile",
    icon: FileText,
  },
  {
    to: "/middleman/settings",
    label: "Settings",
    icon: Settings,
  },
];

export function MiddlemanDashboardLayout() {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [totalDeals, setTotalDeals] = useState<number>(0);
  const [pendingDeals, setPendingDeals] = useState<number>(0);

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      
      // Load profile name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        setProfileName(profile.full_name);
      }

      // Load deal stats
      const { data: deals } = await supabase
        .from("middleman_deals")
        .select("status")
        .eq("middleman_id", user.id);

      if (deals) {
        setTotalDeals(deals.length);
        setPendingDeals(deals.filter(d => d.status === 'pending').length);
      }
    }
    loadProfile();
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Sign in required</h2>
          <p className="text-gray-500 mb-4">
            Please sign in to access your middleman dashboard.
          </p>
          <Link
            to="/login"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Handshake className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Middleman Dashboard
                </h2>
                {profileName && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {profileName}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Deal Stats Summary */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border-b border-gray-200 dark:border-gray-800">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Deals</p>
              <p className="text-lg font-bold text-blue-600">{totalDeals}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Pending</p>
              <p className="text-lg font-bold text-orange-600">{pendingDeals}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => {
            const isActive =
              location.pathname === to ||
              location.pathname.startsWith(to + "/");
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-800 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
            Go to Homepage
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {navItems.find(
                (item) =>
                  location.pathname === item.to ||
                  location.pathname.startsWith(item.to + "/"),
              )?.label || "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
