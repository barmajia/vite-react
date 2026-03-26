import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "@/components/shared/Logo";
import {
  Search,
  MessageSquare,
  Menu,
  X,
  ChevronDown,
  LogOut,
  ShoppingBag,
  Bell,
  CheckCircle2,
  ArrowRight,
  Sun,
  Moon,
  LayoutDashboard,
  UserPlus,
  Briefcase,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useSwipeToOpen } from "@/hooks/useSwipeToOpen";
import { supabase } from "@/lib/supabase";
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

export function ServicesHeader() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [providerProfile, setProviderProfile] = useState<{
    id: string;
    provider_name: string | null;
    logo_url: string | null;
    is_verified: boolean | null;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const notificationCount = 2;
  const messageCount = 1;

  const { onTouchStart } = useSwipeToOpen({
    isOpen: isMobileMenuOpen,
    onOpen: () => setIsMobileMenuOpen(true),
    onClose: () => setIsMobileMenuOpen(false),
    threshold: 100,
    direction: "left",
    edgeWidth: 20,
  });

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
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
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const getProviderProfile = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from("svc_providers")
          .select("id, provider_name, logo_url, is_verified")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching provider profile:", error);
          return;
        }

        if (data) {
          setProviderProfile(data);
        }
      } catch (err) {
        console.error("Unexpected error fetching provider profile:", err);
      }
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

  const isActive = (path: string) => {
    if (path === "/services") {
      return location.pathname === "/services" || location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const navItems = [
    {
      label: t("services.findTalent"),
      href: "/services/programming",
    },
    {
      label: t("services.healthcare"),
      href: "/services/health",
    },
    {
      label: t("services.allServices"),
      href: "/services",
    },
  ];

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
          isScrolled
            ? "bg-white/95 backdrop-blur-lg shadow-lg shadow-gray-200/50 dark:bg-gray-950/95 dark:border-gray-800 dark:shadow-gray-900/50"
            : "bg-white/90 backdrop-blur-md dark:bg-gray-950/90 dark:border-gray-800",
        )}
      >
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo Section */}
            <Link
              to="/services"
              className="flex items-center gap-3 group hover:opacity-90 transition-opacity"
            >
              <Logo size="xl" showText={true} />
            </Link>

            {/* Center Navigation - Desktop */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className={cn(
                    "relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                    isActive(item.href)
                      ? "text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20"
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800",
                  )}
                >
                  {item.label}
                  {isActive(item.href) && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-violet-600 dark:bg-violet-400 rounded-full" />
                  )}
                </Link>
              ))}
            </nav>

            {/* Right Actions - Desktop */}
            <div className="hidden md:flex items-center gap-3">
              {/* Products Cross-Link */}
              <Link
                to="/products"
                className="group flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
              >
                <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 group-hover:bg-violet-50 dark:group-hover:bg-violet-900/20 transition-colors">
                  <ShoppingBag size={14} strokeWidth={2.5} />
                </div>
                <span className="hidden xl:inline">
                  {t("services.shopProducts")}
                </span>
                <ArrowRight
                  size={14}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </Link>

              <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

              {/* Search */}
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder={t("services.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-0 rounded-full text-sm text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition-all placeholder:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                />
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  size={17}
                />
              </form>

              {/* Theme Toggle - Enhanced Visibility */}
              <button
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="relative p-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-yellow-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-all hover:scale-110 shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700"
                aria-label="Toggle theme"
                title={
                  theme === "light"
                    ? "Switch to Dark Mode 🌙"
                    : "Switch to Light Mode ☀️"
                }
              >
                {theme === "light" ? (
                  <Moon className="h-5 w-5 text-indigo-600" />
                ) : (
                  <Sun className="h-5 w-5 text-amber-500" />
                )}
              </button>

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
                    to="/services/messages"
                    className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                  >
                    <MessageSquare size={20} />
                    {messageCount > 0 && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-950" />
                    )}
                  </Link>

                  {/* Language Switcher */}
                  <LanguageSwitcher />

                  {/* Profile Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1.5 rounded-full transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                        <Avatar
                          name={
                            providerProfile?.provider_name ||
                            user.user_metadata.full_name
                          }
                          src={providerProfile?.logo_url}
                          size="md"
                          className="w-9 h-9 border-2 border-gray-200 dark:border-gray-700 shadow-sm"
                        />
                        <ChevronDown
                          size={15}
                          className="text-gray-500 dark:text-gray-400"
                        />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-64 rounded-xl shadow-xl border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-700"
                    >
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {user.user_metadata.full_name}
                            </p>
                            {providerProfile?.is_verified && (
                              <Badge className="h-4 text-[8px] px-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400">
                                <CheckCircle2 size={10} className="mr-0.5" />
                                {t("services.verified")}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                      <DropdownMenuItem
                        asChild
                        className="cursor-pointer text-gray-700 dark:text-gray-200 dark:focus:bg-gray-700"
                      >
                        <Link
                          to="/services/dashboard"
                          className="flex items-center"
                        >
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          <span>{t("common.dashboard")}</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        asChild
                        className="cursor-pointer text-gray-700 dark:text-gray-200 dark:focus:bg-gray-700"
                      >
                        <Link to="/orders" className="flex items-center">
                          <ShoppingBag className="mr-2 h-4 w-4" />
                          <span>{t("common.orders")}</span>
                        </Link>
                      </DropdownMenuItem>
                      {!providerProfile && (
                        <>
                          <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                          <DropdownMenuItem
                            asChild
                            className="cursor-pointer text-violet-600 dark:text-violet-400 dark:focus:bg-gray-700"
                          >
                            <Link
                              to={"/services/onboarding"}
                              className="flex items-center font-medium"
                            >
                              <Briefcase className="mr-2 h-4 w-4" />
                              <span>{t("services.becomeProvider")}</span>
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>{t("auth.signOut")}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => navigate("/login")}
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    {t("auth.signIn")}
                  </Button>
                  <Button
                    onClick={() => navigate("/services/onboarding")}
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50"
                  >
                    {t("auth.joinNow")}
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-2 lg:hidden">
              {/* Mobile Menu Button */}
              <button
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
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
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
            onTouchStart={onTouchStart}
          />

          {/* Drawer */}
          <div
            className="fixed top-0 right-0 z-50 h-full w-[300px] bg-white dark:bg-gray-950 shadow-2xl lg:hidden flex flex-col"
            onTouchStart={onTouchStart}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
              <span className="font-bold text-lg text-gray-900 dark:text-white">
                {t("services.auroraServices")}
              </span>
              <div className="flex items-center gap-2">
                {/* Language Switcher */}
                <LanguageSwitcher />
                {/* Theme Toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                >
                  {theme === "light" ? (
                    <Moon className="h-5 w-5" />
                  ) : (
                    <Sun className="h-5 w-5 text-amber-500" />
                  )}
                </Button>
                <button
                  className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Search */}
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder={t("services.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl text-sm text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
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
                    key={item.label}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 text-base font-medium rounded-xl transition-colors",
                      isActive(item.href)
                        ? "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              {/* Products Cross-Link */}
              <Link
                to="/products"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 rounded-xl shadow-md transition-all"
              >
                <ShoppingBag size={18} />
                {t("services.shopProducts")}
              </Link>

              <div className="border-t border-gray-100 dark:border-gray-800 my-4" />

              {user ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <Avatar
                      name={user.user_metadata.full_name}
                      src={user.user_metadata.avatar_url}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {user.user_metadata.full_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/services/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
                  >
                    <LayoutDashboard size={20} />
                    {t("common.dashboard")}
                  </Link>
                  <Link
                    to="/services/messages"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
                  >
                    <MessageSquare size={20} />
                    {t("common.messages")}
                    {messageCount > 0 && (
                      <Badge className="ml-auto bg-red-500">
                        {messageCount}
                      </Badge>
                    )}
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                  >
                    <LogOut size={20} />
                    {t("auth.signOut")}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
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
                      navigate("/services/onboarding");
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    {t("auth.joinNow")}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
