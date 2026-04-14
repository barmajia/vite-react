/**
 * SellerDashboardHeader
 * Specialized header for middleman/seller dashboard routes
 * Replaces the main Header when on /dashboard or /onboarding routes
 */

import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Store,
  LayoutDashboard,
  ShoppingBag,
  Package,
  Settings,
  BarChart3,
  LogOut,
  ChevronDown,
  Bell,
  Search,
  Moon,
  Sun,
  Zap,
  ExternalLink,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { useSeller } from "@/hooks/useSeller";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export function SellerDashboardHeader() {
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { seller } = useSeller();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadNotifications, setUnreadNotifications] = useState(3); // Placeholder

  // Detect scroll for header styling
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle sign out
  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Search products in dashboard
      console.log("Searching:", searchQuery);
    }
  };

  // Dashboard navigation items
  const navItems = [
    {
      label: "Overview",
      path: "/dashboard",
      icon: LayoutDashboard,
      active: location.pathname === "/dashboard",
    },
    {
      label: "Products",
      path: "/dashboard/products",
      icon: Package,
      active: location.pathname.startsWith("/dashboard/products"),
    },
    {
      label: "Orders",
      path: "/dashboard/orders",
      icon: ShoppingBag,
      active: location.pathname.startsWith("/dashboard/orders"),
    },
    {
      label: "Analytics",
      path: "/dashboard/analytics",
      icon: BarChart3,
      active: location.pathname.startsWith("/dashboard/analytics"),
    },
    {
      label: "Settings",
      path: "/dashboard/settings",
      icon: Settings,
      active: location.pathname.startsWith("/dashboard/settings"),
    },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-md border-b border-gray-200"
          : "bg-white border-b border-gray-200"
      )}
    >
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo & Store Name */}
          <div className="flex items-center gap-4">
            {/* Dashboard Logo */}
            <Link
              to="/dashboard"
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-gray-900 leading-tight">
                  {seller?.store_name || "Seller Dashboard"}
                </h1>
                {seller?.store_slug && (
                  <p className="text-xs text-gray-500">
                    {seller.store_slug}
                  </p>
                )}
              </div>
            </Link>

            {/* Divider */}
            <div className="h-8 w-px bg-gray-200 hidden sm:block" />

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                      item.active
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Center: Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products, orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </form>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {/* View Store Link */}
            {seller?.store_slug && (
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex gap-2"
                onClick={() =>
                  window.open(`/store/${seller.store_slug}`, "_blank")
                }
              >
                <ExternalLink className="w-4 h-4" />
                View Store
              </Button>
            )}

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <Moon className="w-5 h-5 text-gray-600" />
              ) : (
                <Sun className="w-5 h-5 text-gray-600" />
              )}
            </button>

            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadNotifications > 9 ? "9+" : unreadNotifications}
                </span>
              )}
            </button>

            {/* User Menu */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                    <Avatar
                      name={user.user_metadata?.full_name || user.email}
                      src={user.user_metadata?.avatar_url}
                      className="w-8 h-8"
                    />
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  {/* User Info */}
                  <DropdownMenuLabel className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={user.user_metadata?.full_name || user.email}
                        src={user.user_metadata?.avatar_url}
                        className="w-12 h-12"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {user.user_metadata?.full_name || "Seller"}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator />

                  {/* Store Status */}
                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">
                        Store Status
                      </span>
                      <Badge
                        variant={seller?.is_active ? "success" : "secondary"}
                        className="text-xs"
                      >
                        {seller?.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    {seller?.subscription_status && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-600">
                          Plan
                        </span>
                        <Badge variant="outline" className="text-xs capitalize">
                          {seller.subscription_status}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <DropdownMenuSeparator />

                  {/* Quick Actions */}
                  <div className="p-2">
                    <DropdownMenuItem
                      onClick={() => navigate("/dashboard")}
                      className="gap-2"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate("/dashboard/settings")}
                      className="gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      Store Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        seller?.store_slug &&
                        window.open(`/store/${seller.store_slug}`, "_blank")
                      }
                      className="gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Public Store
                    </DropdownMenuItem>
                  </div>

                  <DropdownMenuSeparator />

                  {/* Sign Out */}
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="gap-2 text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation (Bottom Bar) */}
      <div className="lg:hidden border-t border-gray-200 bg-white">
        <div className="flex overflow-x-auto gap-1 px-4 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                  item.active
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}

export default SellerDashboardHeader;
