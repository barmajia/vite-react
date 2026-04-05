// src/pages/admin/AdminLayout.tsx
// Professional Admin Layout with Sidebar Navigation

import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui";
import { Avatar } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  Users,
  Package,
  ShoppingCart,
  MessageSquare,
  Settings,
  LogOut,
  Home,
  Shield,
  Truck,
  Handshake,
  Menu,
  X,
  Factory,
  Moon,
  Sun,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MenuItem {
  icon: any;
  label: string;
  path: string;
  badge?: string;
}

function AdminLayoutContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { adminData, signOut } = useAdminAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems: MenuItem[] = [
    { icon: Home, label: "Dashboard", path: "/admin" },
    { icon: Users, label: "Users", path: "/admin/users", badge: "New" },
    { icon: Package, label: "Products", path: "/admin/products" },
    { icon: Store, label: "Marketplace", path: "/admin/marketplace" },
    { icon: ShoppingCart, label: "Orders", path: "/admin/orders" },
    { icon: Factory, label: "Factories", path: "/admin/factories" },
    { icon: Handshake, label: "Middlemen", path: "/admin/middlemen" },
    { icon: Truck, label: "Delivery", path: "/admin/delivery" },
    {
      icon: MessageSquare,
      label: "Conversations",
      path: "/admin/conversations",
    },
    { icon: Settings, label: "Settings", path: "/admin/settings" },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Mobile Sidebar Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-white dark:bg-gray-800"
        >
          {sidebarOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:relative z-40 w-64 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">
                  Admin Panel
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  v1.0.0
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-4">
            <nav className="px-3 space-y-1">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      if (window.innerWidth < 1024) setSidebarOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700",
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </ScrollArea>

          {/* User Profile & Sign Out */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Theme
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTheme}
                className="h-8 w-8 p-0"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Separator className="mb-4" />
            <div className="flex items-center gap-3 mb-4">
              <Avatar
                name={adminData?.full_name}
                size="md"
                className="h-10 w-10"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-gray-900 dark:text-white">
                  {adminData?.full_name || "Admin"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {adminData?.email}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

export function AdminLayout() {
  return (
    <ProtectedRoute allowedAccountTypes={["admin"]}>
      <AdminLayoutContent />
    </ProtectedRoute>
  );
}
