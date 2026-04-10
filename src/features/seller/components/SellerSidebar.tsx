import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  MessageSquare,
  BarChart3,
  Settings,
  Wallet,
  Handshake,
  Factory,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface SellerSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function SellerSidebar({ isOpen, onToggle }: SellerSidebarProps) {
  const { t } = useTranslation();
  const { signOut } = useAuth();

  const navigation = [
    { name: "Dashboard", href: "/seller/dashboard", icon: LayoutDashboard },
    { name: "Products", href: "/seller/products", icon: Package },
    { name: "Orders", href: "/seller/orders", icon: ShoppingCart },
    { name: "Customers", href: "/seller/customers", icon: Users },
    { name: "Messages", href: "/seller/messages", icon: MessageSquare },
    { name: "Analytics", href: "/seller/analytics", icon: BarChart3 },
    { name: "Deals", href: "/seller/deals", icon: Handshake },
    { name: "Factories", href: "/seller/factories", icon: Factory },
    { name: "Wallet", href: "/seller/wallet", icon: Wallet },
    { name: "Settings", href: "/seller/settings", icon: Settings },
  ];

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300",
        isOpen ? "w-64" : "w-20"
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 dark:border-slate-800">
        {isOpen && (
          <div className="flex items-center gap-2">
            <Store className="h-6 w-6 text-emerald-500" />
            <span className="font-bold text-slate-900 dark:text-white">Aurora Seller</span>
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
                  ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
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
            !isOpen && "justify-center"
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
