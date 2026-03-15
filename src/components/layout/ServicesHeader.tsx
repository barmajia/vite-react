import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  MessageSquare,
  Menu,
  X,
  Briefcase,
  ChevronDown,
  LogOut,
  ShoppingBag,
  Bell,
  Settings,
  UserCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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

export function ServicesHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [providerProfile, setProviderProfile] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Handle Scroll Effect
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch Provider Profile
  useEffect(() => {
    const getProviderProfile = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from("svc_providers")
        .select("id, provider_name, logo_url, is_verified")
        .eq("user_id", user.id)
        .single();

      setProviderProfile(profile);
    };

    getProviderProfile();
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/services?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <header
      className={cn(
        "fixed top-0 w-full z-50 transition-all duration-500",
        isScrolled
          ? "bg-white/98 backdrop-blur-xl shadow-lg shadow-black/5 py-2.5 border-b border-gray-100"
          : "bg-transparent py-4",
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* 1. Logo & Branding - Enhanced */}
          <Link
            to="/services"
            className="flex items-center gap-2.5 group hover:opacity-80 transition-opacity"
          >
            <div className="relative">
              <div className="bg-gradient-to-br from-primary-600 to-primary-700 text-white p-2.5 rounded-xl shadow-lg shadow-primary-500/30 group-hover:shadow-primary-500/50 transition-all duration-300 group-hover:scale-105">
                <Briefcase size={22} strokeWidth={2.5} />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent leading-none">
                Aurora
              </span>
              <span className="text-[10px] font-semibold text-primary-600 tracking-widest uppercase">
                Services
              </span>
            </div>
          </Link>

          {/* 2. Desktop Navigation - Enhanced */}
          <nav className="hidden lg:flex items-center space-x-1">
            {[
              {
                label: "Find Talent",
                href: "/services/programming",
                icon: "💻",
              },
              {
                label: "Healthcare",
                href: "/services/healthcare",
                icon: "🏥",
              },
              {
                label: "Browse Providers",
                href: "/services",
                icon: "👥",
              },
            ].map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                  isActive(item.href)
                    ? "text-primary-600 bg-primary-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                )}
              >
                <span className="mr-1.5">{item.icon}</span>
                {item.label}
                {isActive(item.href) && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary-600 rounded-full" />
                )}
              </Link>
            ))}

            {/* Cross-Link to Products - Enhanced */}
            <div className="ml-6 pl-6 border-l border-gray-200">
              <Link
                to="/products"
                className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-indigo-600 transition-colors group"
              >
                <div className="p-1.5 rounded-md bg-gray-100 group-hover:bg-indigo-50 transition-colors">
                  <ShoppingBag size={14} />
                </div>
                <span>Shop Products</span>
                <span className="group-hover:translate-x-0.5 transition-transform">
                  →
                </span>
              </Link>
            </div>
          </nav>

          {/* 3. Right Actions - Enhanced */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Search Bar - Enhanced */}
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-72 pl-11 pr-4 py-2.5 bg-gray-100/80 border-0 rounded-full text-sm focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all duration-200 placeholder:text-gray-400 hover:bg-gray-100"
              />
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
            </form>

            {user ? (
              <>
                {/* Notifications */}
                <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
                  <Bell size={20} />
                  <Badge className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white" />
                </button>

                {/* Messages */}
                <Link
                  to="/messages"
                  className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <MessageSquare size={20} />
                  <Badge className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white" />
                </Link>

                {/* Profile Dropdown - Enhanced */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 hover:bg-gray-50 px-2 py-1.5 rounded-full transition-all duration-200 border border-transparent hover:border-gray-200">
                      <Avatar className="w-9 h-9 border-2 border-white shadow-sm">
                        <AvatarImage src={providerProfile?.logo_url} />
                        <AvatarFallback className="bg-gradient-to-br from-primary-100 to-primary-200 text-primary-700 font-semibold text-sm">
                          {providerProfile?.provider_name?.[0] ||
                            user.user_metadata.full_name?.[0] ||
                            "U"}
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDown size={16} className="text-gray-400" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900">
                            {user.user_metadata.full_name}
                          </p>
                          {providerProfile?.is_verified && (
                            <Badge
                              variant="default"
                              className="h-4 text-[9px] px-1"
                            >
                              ✓ Verified
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link
                        to="/services/dashboard"
                        className="flex items-center w-full"
                      >
                        <UserCircle className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link to="/orders" className="flex items-center w-full">
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        <span>My Orders</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link to="/settings" className="flex items-center w-full">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    {!providerProfile && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          asChild
                          className="cursor-pointer text-primary-600"
                        >
                          <Link
                            to="/services/onboarding"
                            className="flex items-center w-full font-medium"
                          >
                            <Briefcase className="mr-2 h-4 w-4" />
                            <span>Become a Provider</span>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => navigate("/login")}
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                >
                  Log In
                </Button>
                <Button
                  onClick={() => navigate("/signup")}
                  className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:scale-105"
                >
                  Join Now
                </Button>
              </div>
            )}
          </div>

          {/* 4. Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown - Enhanced */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 absolute w-full shadow-2xl">
          <div className="px-4 py-6 space-y-3 max-h-[80vh] overflow-y-auto">
            {/* Search on Mobile */}
            <form onSubmit={handleSearch} className="relative mb-4">
              <input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-100 border-0 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              />
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
            </form>

            <div className="space-y-1">
              <Link
                to="/services/programming"
                className="flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <span>💻</span>
                Find Talent
              </Link>
              <Link
                to="/services/healthcare"
                className="flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <span>🏥</span>
                Healthcare
              </Link>
              <Link
                to="/services"
                className="flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <span>👥</span>
                Browse Providers
              </Link>
            </div>

            <div className="border-t border-gray-100 my-4"></div>

            <Link
              to="/products"
              className="flex items-center gap-3 px-4 py-3 text-base font-medium text-indigo-600 bg-indigo-50 rounded-xl transition-colors"
            >
              <ShoppingBag size={18} />
              Shop Products →
            </Link>

            <div className="border-t border-gray-100 my-4"></div>

            {user ? (
              <>
                <Link
                  to="/services/dashboard"
                  className="flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <UserCircle size={20} />
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <LogOut size={20} />
                  Sign Out
                </button>
              </>
            ) : (
              <div className="space-y-2">
                <Link
                  to="/login"
                  className="flex items-center justify-center px-4 py-3 text-base font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="flex items-center justify-center px-4 py-3 text-base font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors"
                >
                  Join Now
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
