import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Settings,
  Package,
  Palette,
  BarChart3,
  LogOut,
  Menu,
  X,
  Store,
  LayoutTemplate,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useUserAccountType } from "@/hooks/useUserAccountType";
import { NotificationBell } from "@/components/layout/NotificationBell";

const navItems = [
  {
    to: "/shops/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    roles: ["all"],
  },
  {
    to: "/shops/dashboard/settings",
    label: "Shop Settings",
    icon: Settings,
    roles: ["all"],
  },
  {
    to: "/shops/dashboard/products",
    label: "Products",
    icon: Package,
    roles: ["seller", "factory"],
  },
  {
    to: "/shops/dashboard/appearance",
    label: "Appearance",
    icon: Palette,
    roles: ["all"],
  },
  {
    to: "/shops/dashboard/analytics",
    label: "Analytics",
    icon: BarChart3,
    roles: ["seller", "factory"],
  },
  {
    to: "/shops/dashboard/marketplace",
    label: "Templates",
    icon: LayoutTemplate,
    roles: ["all"],
  },
];

export function ShopDashboardLayout() {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [shopType, setShopType] = useState<string | null>(null);
  const [shopSlug, setShopSlug] = useState<string | null>(null);

  const { accountType } = useUserAccountType(user?.id ?? null);

  useEffect(() => {
    async function loadShop() {
      if (!user) return;
      const { data: shop } = await supabase
        .from("shops")
        .select("shop_type, slug")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (shop) {
        setShopType(shop.shop_type);
        setShopSlug(shop.slug);
      }
    }
    loadShop();
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  // Filter nav items by role
  const filteredNav = navItems.filter(
    (item) =>
      item.roles.includes("all") ||
      (shopType && item.roles.includes(shopType)) ||
      (accountType && item.roles.includes(accountType)),
  );

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
            Please sign in to access your shop dashboard.
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
              <Store className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Shop Dashboard
                </h2>
                {shopType && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {shopType} Account
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

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {filteredNav.map(({ to, label, icon: Icon }) => {
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
          {shopSlug && (
            <Link
              to={`/shops/${shopSlug}`}
              target="_blank"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <Store className="w-5 h-5 flex-shrink-0" />
              View Live Shop
            </Link>
          )}
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
              {filteredNav.find(
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
