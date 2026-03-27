// src/features/health/components/PharmacyHeader.tsx
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  MessageSquare,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Bell,
  CheckCircle2,
  Sun,
  Moon,
  LayoutDashboard,
  Pill,
  Truck,
  Clock,
  FileText,
  Heart,
  Shield,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/lib/supabase";
import { supabaseHealth } from "../api/supabaseHealth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

interface PharmacyProviderProfile {
  id: string;
  pharmacy_name?: string;
  is_verified?: boolean;
  location?: string;
}

export function PharmacyHeader() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [providerProfile, setProviderProfile] =
    useState<PharmacyProviderProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationCount, setNotificationCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const checkProviderStatus = async () => {
      if (!user) return;
      try {
        const { data } = await supabaseHealth
          .from("health_pharmacy_profiles")
          .select("id, pharmacy_name, is_verified, location")
          .eq("user_id", user.id)
          .maybeSingle();

        if (data) {
          setProviderProfile(data);
        }
      } catch (error) {
        console.error("Error checking pharmacy profile:", error);
      }
    };

    checkProviderStatus();
  }, [user]);

  useEffect(() => {
    const fetchCounts = async () => {
      if (!user) return;
      try {
        const { count: notifCount } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_read", false);

        const { count: msgCount } = await supabaseHealth
          .from("health_conversations")
          .select("*", { count: "exact", head: true })
          .eq("patient_id", user.id)
          .or(`pharmacy_id.eq.${user.id}`);

        setNotificationCount(notifCount || 0);
        setMessageCount(msgCount || 0);
      } catch (error) {
        console.error("Error fetching counts:", error);
      }
    };
    fetchCounts();
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate("/services/health/pharmacies");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(
        `/services/health/pharmacies?search=${encodeURIComponent(searchQuery.trim())}`,
      );
    }
  };

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const navItems = [
    {
      label: t("pharmacy.findPharmacies"),
      href: "/services/health/pharmacies",
      icon: Pill,
    },
    {
      label: t("pharmacy.prescriptions"),
      href: "/services/health/patient/dashboard?tab=prescriptions",
      icon: FileText,
    },
    {
      label: t("pharmacy.delivery"),
      href: "/services/health/pharmacies?delivery=true",
      icon: Truck,
    },
  ];

  const patientNavItems = [
    {
      label: t("health.dashboard"),
      href: "/services/health/patient/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: t("health.appointments"),
      href: "/services/health/patient/dashboard?tab=appointments",
      icon: Clock,
    },
    {
      label: t("pharmacy.prescriptions"),
      href: "/services/health/patient/dashboard?tab=prescriptions",
      icon: Pill,
    },
  ];

  const providerNavItems = [
    {
      label: t("pharmacy.dashboard"),
      href: "/services/health/pharmacy/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: t("pharmacy.orders"),
      href: "/services/health/pharmacy/dashboard?tab=orders",
      icon: FileText,
    },
    {
      label: t("pharmacy.inventory"),
      href: "/services/health/pharmacy/dashboard?tab=inventory",
      icon: Pill,
    },
  ];

  const getRoleNavItems = () => {
    if (providerProfile) {
      return providerNavItems;
    }
    return patientNavItems;
  };

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
          isScrolled
            ? "bg-white/95 backdrop-blur-lg shadow-lg shadow-emerald-200/50 dark:bg-[#0f172a]/95 dark:border-[#1e293b]"
            : "bg-white/90 backdrop-blur-md dark:bg-[#0f172a]/90 dark:border-[#1e293b]",
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              to="/services/health/pharmacies"
              className="flex-shrink-0 flex items-center gap-2"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Pill className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  {t("Aurora Pharmacy")}
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 -mt-1">
                  {t("pharmacy.tagline")}
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2",
                    isActive(item.href)
                      ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                  {isActive(item.href) && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-600 dark:bg-emerald-400 rounded-full" />
                  )}
                </Link>
              ))}

              {/* Role-Based Dashboard */}
              {user && (
                <NavigationMenu>
                  <NavigationMenuList>
                    <NavigationMenuItem>
                      <NavigationMenuTrigger
                        className={cn(
                          "text-sm font-medium flex items-center gap-2",
                          isActive("/services/health/pharmacy/dashboard") ||
                            isActive("/services/health/patient/dashboard")
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-gray-600 dark:text-gray-300",
                        )}
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        {providerProfile
                          ? t("pharmacy.providerDashboard")
                          : t("health.dashboard")}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-[300px] gap-2 p-4">
                          {getRoleNavItems().map((navItem) => (
                            <li key={navItem.href}>
                              <NavigationMenuLink asChild>
                                <Link
                                  to={navItem.href}
                                  className="block p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    <navItem.icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                    <div>
                                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {navItem.label}
                                      </p>
                                    </div>
                                  </div>
                                </Link>
                              </NavigationMenuLink>
                            </li>
                          ))}
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  </NavigationMenuList>
                </NavigationMenu>
              )}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {/* Search - Desktop */}
              <form
                onSubmit={handleSearch}
                className="hidden md:block relative"
              >
                <input
                  type="text"
                  placeholder={t("pharmacy.searchPharmacies")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-0 rounded-full text-sm text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                />
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  size={17}
                />
              </form>

              {/* Theme Toggle */}
              <button
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="p-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-yellow-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-all"
              >
                {theme === "light" ? (
                  <Moon className="h-5 w-5 text-indigo-600" />
                ) : (
                  <Sun className="h-5 w-5 text-amber-500" />
                )}
              </button>

              {/* Language Switcher */}
              <LanguageSwitcher />

              {user ? (
                <>
                  {/* Notifications */}
                  <button className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                    <Bell size={20} />
                    {notificationCount > 0 && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-950" />
                    )}
                  </button>

                  {/* Messages */}
                  <Link
                    to="/services/health/messages"
                    className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                  >
                    <MessageSquare size={20} />
                    {messageCount > 0 && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-950" />
                    )}
                  </Link>

                  {/* Profile Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1.5 rounded-full transition-all">
                        <Avatar
                          name={
                            providerProfile?.pharmacy_name ||
                            user.user_metadata.full_name
                          }
                          src={user.user_metadata.avatar_url}
                          className="w-9 h-9 border-2 border-gray-200 dark:border-gray-700"
                        />
                        <ChevronDown size={15} className="text-gray-500" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                      <DropdownMenuLabel>
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold">
                              {user.user_metadata.full_name}
                            </p>
                            {providerProfile?.is_verified && (
                              <Badge className="h-4 text-[8px] px-1 bg-emerald-100 text-emerald-700">
                                <CheckCircle2 size={10} className="mr-0.5" />
                                {t("pharmacy.verified")}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{user.email}</p>
                          {providerProfile && (
                            <Badge
                              variant="secondary"
                              className="w-fit text-[10px]"
                            >
                              {t("pharmacy.pharmacy")}
                            </Badge>
                          )}
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />

                      {/* Dashboard based on role */}
                      {getRoleNavItems().map((item) => (
                        <DropdownMenuItem key={item.href} asChild>
                          <Link to={item.href}>
                            <item.icon className="mr-2 h-4 w-4" />
                            {item.label}
                          </Link>
                        </DropdownMenuItem>
                      ))}

                      <DropdownMenuItem asChild>
                        <Link to="/profile">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          {t("common.profile")}
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="text-red-600"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        {t("auth.signOut")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => navigate("/login")}
                    className="text-sm font-medium"
                  >
                    {t("auth.signIn")}
                  </Button>
                  <Button
                    onClick={() => navigate("/services/health/pharmacy/signup")}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-2 rounded-full text-sm font-semibold"
                  >
                    <Pill className="mr-2 h-4 w-4" />
                    {t("pharmacy.registerPharmacy")}
                  </Button>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed top-0 right-0 z-50 h-full w-[300px] bg-white dark:bg-gray-950 shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Pill className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg">
                  {t("pharmacy.auroraPharmacy")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <LanguageSwitcher />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                >
                  {theme === "light" ? (
                    <Moon className="h-5 w-5" />
                  ) : (
                    <Sun className="h-5 w-5 text-amber-500" />
                  )}
                </Button>
                <button
                  className="p-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Search */}
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder={t("pharmacy.searchPharmacies")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl"
                />
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
              </form>

              {/* Navigation */}
              <div className="space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-base font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <item.icon size={20} />
                    {item.label}
                  </Link>
                ))}
              </div>

              {/* Role-Based Navigation */}
              {user && (
                <>
                  <div className="border-t border-gray-100 dark:border-gray-800 my-4" />
                  <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                    {t("health.dashboard")}
                  </p>
                  <div className="space-y-1">
                    {getRoleNavItems().map((item) => (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-base font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <item.icon size={20} />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </>
              )}

              {user ? (
                <div className="space-y-2 pt-4 border-t">
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
                  >
                    <LogOut size={20} />
                    {t("auth.signOut")}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigate("/login");
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full"
                  >
                    {t("auth.signIn")}
                  </Button>
                  <Button
                    onClick={() => {
                      navigate("/services/health/pharmacy/signup");
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600"
                  >
                    <Pill className="mr-2 h-4 w-4" />
                    {t("pharmacy.registerPharmacy")}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
