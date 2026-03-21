import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ShoppingCart,
  User,
  Search,
  Menu,
  Moon,
  Sun,
  Bell,
  LogOut,
  X,
  ChevronDown,
  CheckCircle2,
  LayoutDashboard,
  ShoppingBag,
  Briefcase,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
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
import { ROUTES } from "@/lib/constants";
import { MobileNav } from "./MobileNav";
import { NotificationBell } from "./NotificationBell";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export function Header() {
  const { t } = useTranslation();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [providerProfile, setProviderProfile] = useState<any>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const getProviderProfile = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("svc_providers")
        .select("id, provider_name, logo_url, is_verified")
        .eq("user_id", user.id);

      if (!error && data && data.length > 0) {
        setProviderProfile(data[0]);
      }
    };
    getProviderProfile();
  }, [user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(
        `${ROUTES.PRODUCTS}?q=${encodeURIComponent(searchQuery.trim())}`,
      );
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate(ROUTES.HOME);
  };

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo Section */}
            <Link
              to={ROUTES.HOME}
              className="flex items-center gap-3 group hover:opacity-90 transition-opacity"
            >
              <div className="relative">
                <div className="bg-gradient-to-br from-violet-600 to-indigo-600 text-white p-2.5 rounded-xl shadow-lg shadow-violet-500/30 group-hover:shadow-violet-500/50 transition-all duration-300 group-hover:scale-105">
                  <ShoppingBag size={22} strokeWidth={2.5} />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-gray-200 bg-clip-text text-transparent leading-none">
                  AURORA
                </span>
                <span className="text-[9px] font-semibold text-violet-600 dark:text-violet-400 tracking-[0.25em] uppercase">
                  {t("s h o p")}
                </span>
              </div>
            </Link>

            {/* Center Navigation - Desktop */}
            <nav className="hidden lg:flex items-center gap-1">
              {[
                { label: t("nav.products"), href: ROUTES.PRODUCTS },
                { label: t("nav.services"), href: "/services" },
                { label: t("nav.categories"), href: ROUTES.CATEGORIES },
                { label: t("nav.about"), href: ROUTES.ABOUT },
                { label: t("nav.contact"), href: ROUTES.CONTACT },
              ].map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className={cn(
                    "relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                    location.pathname === item.href
                      ? "text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20"
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800",
                  )}
                >
                  {item.label}
                  {location.pathname === item.href && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-violet-600 dark:bg-violet-400 rounded-full" />
                  )}
                </Link>
              ))}
            </nav>

            {/* Right Actions - Desktop */}
            <div className="hidden md:flex items-center gap-3">
              {/* Services Cross-Link */}
              <Link
                to="/services"
                className="group flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
              >
                <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 group-hover:bg-violet-50 dark:group-hover:bg-violet-900/20 transition-colors">
                  <Briefcase size={14} strokeWidth={2.5} />
                </div>
                <span className="hidden xl:inline">{t("nav.services")}</span>
              </Link>

              <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

              {/* Search */}
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder={t("common.searchProducts")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-0 rounded-full text-sm text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition-all placeholder:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                />
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  size={17}
                />
              </form>

              {user ? (
                <>
                  {/* Theme Toggle - One Click */}
                  <button
                    onClick={() =>
                      setTheme(theme === "light" ? "dark" : "light")
                    }
                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all hover:scale-110"
                    aria-label="Toggle theme"
                    title={
                      theme === "light"
                        ? "Switch to Dark Mode"
                        : "Switch to Light Mode"
                    }
                  >
                    {theme === "light" ? (
                      <Moon className="h-5 w-5" />
                    ) : (
                      <Sun className="h-5 w-5 text-amber-500" />
                    )}
                  </button>

                  {/* Language Switcher */}
                  <LanguageSwitcher />

                  {/* Notifications */}
                  {user && <NotificationBell />}

                  {/* Cart */}
                  <button
                    onClick={() => navigate(ROUTES.CART)}
                    className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                  >
                    <ShoppingCart size={20} />
                    {itemCount > 0 && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900" />
                    )}
                  </button>

                  {/* Profile Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 px-2 py-1.5 rounded-full transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                        <Avatar
                          name={user.user_metadata.full_name || user.email}
                          src={user.user_metadata.avatar_url}
                          size="md"
                          className="w-9 h-9 border-2 border-white dark:border-gray-700 shadow-sm"
                        />
                        <ChevronDown size={15} className="text-gray-400" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-64 rounded-xl shadow-xl border-gray-100 dark:bg-gray-800 dark:border-gray-700"
                    >
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {user.user_metadata.full_name || t("common.user")}
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
                      <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-700" />
                      <DropdownMenuItem
                        onClick={() => navigate(ROUTES.PROFILE)}
                        className="cursor-pointer dark:text-gray-200 dark:focus:bg-gray-700"
                      >
                        <User className="mr-2 h-4 w-4" />
                        <span>{t("common.profile")}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => navigate(ROUTES.ORDERS)}
                        className="cursor-pointer dark:text-gray-200 dark:focus:bg-gray-700"
                      >
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        <span>{t("common.orders")}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => navigate(ROUTES.ADDRESSES)}
                        className="cursor-pointer dark:text-gray-200 dark:focus:bg-gray-700"
                      >
                        <Bell className="mr-2 h-4 w-4" />
                        <span>{t("common.addresses")}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => navigate(ROUTES.SETTINGS)}
                        className="cursor-pointer dark:text-gray-200 dark:focus:bg-gray-700"
                      >
                        <Moon className="mr-2 h-4 w-4" />
                        <span>{t("common.settings")}</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-700" />
                      <DropdownMenuItem
                        onClick={handleSignOut}
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
                    onClick={() => navigate(ROUTES.LOGIN)}
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    {t("auth.signIn")}
                  </Button>
                  <Button
                    onClick={() => navigate(ROUTES.SIGNUP)}
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50"
                  >
                    {t("auth.joinNow")}
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-2 lg:hidden">
              {/* Theme Toggle - Mobile */}
              <button
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "light" ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5 text-amber-500" />
                )}
              </button>

              {/* Mobile Menu Button */}
              <button
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              >
                {isMobileNavOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />
    </>
  );
}
