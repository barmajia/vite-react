import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  Settings,
  User,
  Globe,
  Paintbrush,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Store,
  TrendingUp,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface SiteStatus {
  site_status: 'draft' | 'active' | 'suspended';
  site_url?: string;
  template_name?: string;
}

export function MiddlemanHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [siteStatus, setSiteStatus] = useState<SiteStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchSiteStatus = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('middleman_profiles')
          .select('site_status, site_url')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.warn('Error fetching site status:', error.message);
        } else if (data) {
          const storedConfig = localStorage.getItem('middlemanSiteConfig');
          const templateName = storedConfig ? JSON.parse(storedConfig).templateId : null;
          setSiteStatus({
            ...data,
            template_name: templateName
          });
        }
      } catch (_err) {
        console.error('Failed to fetch site status');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSiteStatus();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isSetupComplete = siteStatus?.site_status === 'active';

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/middleman/dashboard',
      icon: LayoutDashboard,
      show: true,
    },
    {
      name: 'Marketplace',
      href: '/middleman/webmarketplace',
      icon: Globe,
      show: !isSetupComplete,
      badge: !isSetupComplete ? 'Setup Required' : undefined,
    },
    {
      name: 'Site Editor',
      href: '/middleman/editor',
      icon: Paintbrush,
      show: isSetupComplete,
    },
    {
      name: 'Deals',
      href: '/middleman/deals',
      icon: Package,
      show: true,
    },
    {
      name: 'Orders',
      href: '/middleman/orders',
      icon: ShoppingCart,
      show: true,
    },
    {
      name: 'Connections',
      href: '/middleman/connections',
      icon: Users,
      show: true,
    },
    {
      name: 'Commission',
      href: '/middleman/commission',
      icon: DollarSign,
      show: true,
    },
    {
      name: 'Analytics',
      href: '/middleman/analytics',
      icon: TrendingUp,
      show: true,
    },
    {
      name: 'Profile',
      href: '/middleman/profile',
      icon: User,
      show: true,
    },
    {
      name: 'Settings',
      href: '/middleman/settings',
      icon: Settings,
      show: true,
    },
  ];

  const activeRoute = location.pathname;

  return (
    <>
      {/* Top Header */}
      <header
        className={cn(
          "sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 transition-shadow",
          isScrolled && "shadow-md"
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo & Brand */}
            <div className="flex items-center space-x-4">
              <Link to="/middleman/dashboard" className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <Store className="w-6 h-6 text-white" />
                </div>
                <div className="hidden md:block">
                  <h1 className="text-xl font-bold text-gray-900">Middleman Hub</h1>
                  <p className="text-xs text-gray-500">Build & Manage Your Store</p>
                </div>
              </Link>
            </div>

            {/* Setup Progress Banner */}
            {!isSetupComplete && !isLoading && (
              <div className="hidden lg:flex items-center space-x-2 bg-amber-50 border border-amber-200 px-4 py-2 rounded-lg">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-amber-800 font-medium">
                  {siteStatus?.site_status === 'draft' 
                    ? 'Complete your store setup to start selling!'
                    : 'Finish setting up your store'}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/middleman/webmarketplace')}
                  className="ml-2 border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  <Globe className="w-4 h-4 mr-1" />
                  Go to Marketplace
                </Button>
              </div>
            )}

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              {/* Site Status Badge */}
              {isSetupComplete && siteStatus?.site_url && (
                <a
                  href={siteStatus.site_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden md:flex items-center space-x-1 text-sm text-green-600 hover:text-green-700"
                >
                  <Globe className="w-4 h-4" />
                  <span>View Store</span>
                </a>
              )}

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500">
                  3
                </Badge>
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">Middleman Account</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/middleman/profile')}>
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/middleman/settings')}>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  {isSetupComplete && (
                    <DropdownMenuItem onClick={() => navigate('/middleman/editor')}>
                      <Paintbrush className="w-4 h-4 mr-2" />
                      Customize Store
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              >
                {isMobileNavOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="border-t bg-gray-50/50">
          <div className="container mx-auto px-4">
            <nav className="flex items-center space-x-1 overflow-x-auto py-2 scrollbar-hide">
              {navigationItems.filter(item => item.show).map((item) => {
                const Icon = item.icon;
                const isActive = activeRoute.startsWith(item.href);
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                      isActive
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                    {item.badge && (
                      <Badge variant="destructive" className="ml-1 h-5 text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileNavOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-white shadow-xl">
            <div className="flex flex-col h-full">
              {/* Mobile Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">Menu</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileNavOpen(false)}
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>

              {/* Mobile Nav Items */}
              <nav className="flex-1 overflow-y-auto p-4">
                {navigationItems.filter(item => item.show).map((item) => {
                  const Icon = item.icon;
                  const isActive = activeRoute.startsWith(item.href);
                  
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        "flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 transition-colors",
                        isActive
                          ? "bg-blue-100 text-blue-700"
                          : "text-gray-600 hover:bg-gray-100"
                      )}
                      onClick={() => setIsMobileNavOpen(false)}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                      {item.badge && (
                        <Badge variant="destructive" className="ml-auto text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Mobile Footer */}
              <div className="p-4 border-t">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
