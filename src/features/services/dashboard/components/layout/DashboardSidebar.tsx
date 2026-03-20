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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
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
    path: "/services/messages",
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

export const DashboardSidebar = () => {
  const { user, signOut } = useAuth();
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

  const filteredItems = navItems.filter(
    (item) => item.roles.includes("all") || item.roles.includes(providerType),
  );

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-white text-black pt-20">
      <div className="p-6">
        <h2 className="text-2xl font-bold tracking-tight">
          Aurora<span className="text-gray-500">Pro</span>
        </h2>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-white text-black"
                  : "text-gray-400 hover:bg-gray-900 hover:text-white",
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-800 p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-400 hover:text-white"
          onClick={() => signOut()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};
