import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Handshake,
  DollarSign,
  Store,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface MiddlemanSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function MiddlemanSidebar({ isOpen, onToggle }: MiddlemanSidebarProps) {
  const { signOut } = useAuth();

  const navigation = [
    { name: "Dashboard", href: "/middleman/dashboard", icon: LayoutDashboard },
    { name: "Marketplace", href: "/middleman/marketplace", icon: Users },
    { name: "Deals", href: "/middleman/deals", icon: Handshake },
    { name: "Orders", href: "/middleman/orders", icon: ShoppingCart },
    { name: "Connections", href: "/middleman/connections", icon: Users },
    { name: "Earnings", href: "/middleman/earnings", icon: DollarSign },
    { name: "Messages", href: "/middleman/messages", icon: MessageSquare },
    { name: "My Store", href: "/middleman/settings/store", icon: Store },
    { name: "Store Orders", href: "/middleman/settings/orders", icon: Package },
    { name: "Analytics", href: "/middleman/analytics", icon: BarChart3 },
    { name: "Settings", href: "/middleman/settings", icon: Settings },
  ];

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300",
        isOpen ? "w-64" : "w-20",
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 dark:border-slate-800">
        {isOpen && (
          <div className="flex items-center gap-2">
            <Handshake className="h-6 w-6 text-amber-500" />
            <span className="font-bold text-slate-900 dark:text-white">
              Aurora Middleman
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="ml-auto"
        >
          {isOpen ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>

      <nav className="p-4 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white",
              )
            }
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {isOpen && <span>{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-slate-800">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 text-slate-600 dark:text-slate-400 hover:text-red-600",
            !isOpen && "justify-center",
          )}
          onClick={() => signOut()}
        >
          <LogOut className="h-5 w-5" />
          {isOpen && <span>Sign Out</span>}
        </Button>
      </div>
    </aside>
  );
}
