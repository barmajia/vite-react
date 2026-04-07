import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Briefcase,
  Package,
  MessageSquare,
  DollarSign,
  Users,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const navItems = [
  {
    label: "Overview",
    icon: LayoutDashboard,
    path: "/services/dashboard",
    roles: ["all"],
  },
  {
    label: "Bookings",
    icon: Calendar,
    path: "/services/dashboard/bookings",
    roles: ["all"],
  },
  {
    label: "Projects",
    icon: Briefcase,
    path: "/services/dashboard/projects",
    roles: ["freelance", "professional"],
  },
  {
    label: "Listings",
    icon: Package,
    path: "/services/dashboard/listings",
    roles: ["all"],
  },
  {
    label: "Messages",
    icon: MessageSquare,
    path: "/services/chat",
    roles: ["all"],
  },
  {
    label: "Finance",
    icon: DollarSign,
    path: "/services/dashboard/finance",
    roles: ["all"],
  },
  {
    label: "Clients",
    icon: Users,
    path: "/services/dashboard/clients",
    roles: ["all"],
  },
  {
    label: "Settings",
    icon: Settings,
    path: "/services/dashboard/settings",
    roles: ["all"],
  },
];

interface DashboardSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const DashboardSidebar = ({
  isOpen = true,
  onClose,
}: DashboardSidebarProps) => {
  const { user, signOut } = useAuth();
  const { isRTL } = useLanguage();
  const [providerType, setProviderType] = useState<string>("all");

  useEffect(() => {
    if (user) {
      supabase
        .from("svc_providers")
        .select("provider_type")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          if (data) setProviderType(data.provider_type);
        });
    }
  }, [user]);

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [isOpen]);

  const filteredItems = navItems.filter(
    (item) => item.roles.includes("all") || item.roles.includes(providerType),
  );

  return (
    <>
      {/* Desktop Sidebar - Always Visible */}
      <div className="hidden lg:flex h-screen w-64 flex-col border-r bg-white dark:bg-gray-900 text-gray-900 dark:text-white fixed left-0 top-0 pt-20">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Aurora<span className="text-gray-500 dark:text-gray-400">Pro</span>
          </h2>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {filteredItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white",
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
            onClick={signOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Mobile Drawer - Slide from right (LTR) or left (RTL) */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer - Slides from right for LTR (English), left for RTL (Arabic) */}
          <div
            className={cn(
              "lg:hidden fixed inset-y-0 z-50 w-64 bg-white dark:bg-gray-900 shadow-2xl",
              isRTL
                ? "left-0 animate-slide-in-left"
                : "right-0 animate-slide-in-right",
            )}
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                  Aurora
                  <span className="text-gray-500 dark:text-gray-400">Pro</span>
                </h2>
                <button
                  className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                  onClick={onClose}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
                {filteredItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white",
                      )
                    }
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                  onClick={() => {
                    signOut();
                    onClose?.();
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};
