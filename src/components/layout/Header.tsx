import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ShoppingCart,
  User,
  Search,
  Menu,
  Moon,
  Sun,
  LogOut,
  X,
  ChevronDown,
  CheckCircle2,
  ShoppingBag,
  Briefcase,
  Globe,
  Code,
  Stethoscope,
  Home as HomeIcon,
  Camera,
  Heart,
  Sparkles,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useLanguage } from "@/hooks/useLanguage";
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
import { Logo } from "@/components/shared/Logo";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export function Header() {
  const { t } = useTranslation();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { itemCount } = useCart();
  const { currentLang, setLanguage, supportedLanguages } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [providerProfile, setProviderProfile] = useState<any>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const hasManualChoice = !!localStorage.getItem("aurora-language");
  const geoLang = sessionStorage.getItem("aurora-geo-lang");
  const isAutoDetected =
    !hasManualChoice && !!geoLang && geoLang === currentLang.code;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const getProviderProfile = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from("svc_providers")
          .select("id, provider_name, logo_url, is_verified")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) return;
        if (data) setProviderProfile(data);
      } catch {
        // Silently fail
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
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b",
          isScrolled
            ? "bg-white/80 backdrop-blur-xl shadow-lg shadow-gray-200/30 dark:bg-gray-950/80 dark:border-gray-800/50"
            : "bg-white/60 backdrop-blur-xl dark:bg-gray-950/60 border-gray-200/50 dark:border-gray-800/50",
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link
              to={ROUTES.HOME}
              className="flex items-center gap-2 hover:opacity-90 transition-all duration-300 hover:scale-105"
            >
              <Logo size="md" showText={true} />
            </Link>

            {/* Center Navigation - Desktop */}
            <nav className="hidden lg:flex items-center gap-1">
              <Link
                to={ROUTES.PRODUCTS}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300",
                  location.pathname.startsWith(ROUTES.PRODUCTS)
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-900/30"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50/80 dark:hover:bg-gray-800/50",
                )}
              >
                {t("nav.products")}
                {location.pathname.startsWith(ROUTES.PRODUCTS) && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
                )}
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "px-4 py-2 text-sm font-medium rounded-xl gap-2 transition-all duration-300",
                      location.pathname.startsWith("/services")
                        ? "text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-900/30"
                        : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50/80 dark:hover:bg-gray-800/50",
                    )}
                  >
                    {t("nav.services")}
                    <ChevronDown className="h-4 w-4 transition-transform duration-300 group-data-[state=open]:rotate-180" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="center"
                  className="w-[520px] p-4 rounded-2xl shadow-2xl border-gray-200/50 dark:border-gray-800/50"
                >
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        title: t("services.tech"),
                        href: "/services/tech",
                        icon: Code,
                        desc: t("services.techDesc"),
                        color: "text-blue-600 dark:text-blue-400",
                        bgColor: "bg-blue-100 dark:bg-blue-900/30",
                      },
                      {
                        title: t("services.healthcare"),
                        href: "/services/health",
                        icon: Stethoscope,
                        desc: t("services.healthcareDesc"),
                        color: "text-emerald-600 dark:text-emerald-400",
                        bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
                      },
                      {
                        title: t("services.home"),
                        href: "/services/home",
                        icon: HomeIcon,
                        desc: t("services.homeDesc"),
                        color: "text-purple-600 dark:text-purple-400",
                        bgColor: "bg-purple-100 dark:bg-purple-900/30",
                      },
                      {
                        title: t("services.custom"),
                        href: "/services/custom",
                        icon: Camera,
                        desc: t("services.customDesc"),
                        color: "text-amber-600 dark:text-amber-400",
                        bgColor: "bg-amber-100 dark:bg-amber-900/30",
                      },
                    ].map((item) => (
                      <DropdownMenuItem key={item.href} asChild className="p-0">
                        <Link
                          to={item.href}
                          className="flex items-start gap-3 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-300 w-full group"
                        >
                          <div
                            className={`p-2.5 rounded-xl ${item.bgColor} flex-shrink-0 transition-transform duration-300 group-hover:scale-110`}
                          >
                            <item.icon className={`h-5 w-5 ${item.color}`} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {item.title}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {item.desc}
                            </p>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>

            {/* Right Actions - Desktop */}
            <div className="hidden md:flex items-center gap-3">
              {/* Search */}
              <form onSubmit={handleSearch} className="relative group">
                <input
                  type="text"
                  placeholder={t("common.searchProducts") || "Search..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  className={cn(
                    "w-56 pl-10 pr-4 py-2.5 bg-gray-100/80 dark:bg-gray-800/80 border border-transparent rounded-2xl text-sm text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 focus:outline-none transition-all duration-300 placeholder:text-gray-400 hover:bg-gray-200/80 dark:hover:bg-gray-700/80",
                    isSearchFocused && "w-72",
                  )}
                />
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition-all duration-300 group-focus-within:text-blue-500"
                  size={17}
                />
              </form>

              {/* Theme Toggle */}
              <button
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="relative p-2.5 bg-gray-100/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-lg border border-gray-200/50 dark:border-gray-700/50"
                aria-label="Toggle theme"
              >
                {theme === "light" ? (
                  <Moon className="h-5 w-5 text-slate-700" />
                ) : (
                  <Sun className="h-5 w-5 text-amber-500" />
                )}
              </button>

              {user ? (
                <>
                  {/* Language Switcher */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-1.5 px-2.5 h-9 rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-800/80"
                      >
                        <Globe className="h-4 w-4 shrink-0 text-gray-600 dark:text-gray-300" />
                        <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-300">
                          {currentLang.flag} {currentLang.code.toUpperCase()}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      sideOffset={8}
                      align="end"
                      className="w-52 max-h-80 overflow-y-auto rounded-xl shadow-xl border-gray-200/50 dark:border-gray-800/50"
                    >
                      <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground font-normal">
                        <Globe className="h-3.5 w-3.5" />
                        {t("common.language")}
                        {isAutoDetected && (
                          <span className="ml-auto text-[10px] rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5">
                            {t("common.autoDetected")}
                          </span>
                        )}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {supportedLanguages.map((lang) => (
                        <DropdownMenuItem
                          key={lang.code}
                          onClick={() => setLanguage(lang.code)}
                          className={cn(
                            "flex items-center gap-3 cursor-pointer rounded-lg transition-all duration-200",
                            currentLang.code === lang.code
                              ? "bg-blue-50 dark:bg-blue-900/30 font-medium text-blue-600 dark:text-blue-400"
                              : "hover:bg-gray-50 dark:hover:bg-gray-800/50",
                          )}
                        >
                          <span className="text-base leading-none">
                            {lang.flag}
                          </span>
                          <span className="flex-1 text-sm">
                            {lang.nativeName}
                          </span>
                          {currentLang.code === lang.code && (
                            <span className="text-blue-600 dark:text-blue-400 text-xs">
                              ✓
                            </span>
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Notifications */}
                  <NotificationBell />

                  {/* Cart */}
                  <button
                    onClick={() => navigate(ROUTES.CART)}
                    className="relative p-2.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-gray-800/80 rounded-xl transition-all duration-300 hover:scale-110"
                  >
                    <ShoppingCart size={20} />
                    {itemCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white dark:border-gray-950">
                        {itemCount > 99 ? "99+" : itemCount}
                      </span>
                    )}
                  </button>

                  {/* Wishlist */}
                  <button
                    onClick={() => navigate(ROUTES.WISHLIST)}
                    className="relative p-2.5 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 rounded-xl transition-all duration-300 hover:scale-110"
                  >
                    <Heart size={20} />
                  </button>

                  {/* Profile Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 px-2 py-1.5 rounded-xl transition-all duration-300 border border-transparent hover:border-gray-200/50 dark:hover:border-gray-700/50">
                        <Avatar
                          name={user.user_metadata.full_name || user.email}
                          src={user.user_metadata.avatar_url}
                          size="md"
                          className="w-9 h-9 border-2 border-white dark:border-gray-800 shadow-sm"
                        />
                        <ChevronDown
                          size={15}
                          className="text-gray-400 transition-transform duration-300"
                        />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-64 rounded-2xl shadow-2xl border-gray-200/50 dark:bg-gray-800/50 dark:border-gray-700/50"
                    >
                      <DropdownMenuLabel className="font-normal p-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={user.user_metadata.full_name || user.email}
                            src={user.user_metadata.avatar_url}
                            size="lg"
                            className="w-12 h-12 border-2 border-gray-200 dark:border-gray-700"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {user.user_metadata.full_name ||
                                  t("common.user")}
                              </p>
                              {providerProfile?.is_verified && (
                                <Badge className="h-4 text-[8px] px-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400">
                                  <CheckCircle2 size={10} className="mr-0.5" />
                                  {t("services.verified")}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-700/50" />
                      <DropdownMenuItem
                        onClick={() => navigate(ROUTES.PROFILE)}
                        className="cursor-pointer dark:text-gray-200 dark:focus:bg-gray-700/50 rounded-lg mx-1"
                      >
                        <User className="mr-2.5 h-4 w-4" />
                        <span>{t("common.profile")}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => navigate(ROUTES.ORDERS)}
                        className="cursor-pointer dark:text-gray-200 dark:focus:bg-gray-700/50 rounded-lg mx-1"
                      >
                        <ShoppingBag className="mr-2.5 h-4 w-4" />
                        <span>{t("common.orders")}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => navigate(ROUTES.ADDRESSES)}
                        className="cursor-pointer dark:text-gray-200 dark:focus:bg-gray-700/50 rounded-lg mx-1"
                      >
                        <Briefcase className="mr-2.5 h-4 w-4" />
                        <span>{t("common.addresses")}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => navigate(ROUTES.SETTINGS)}
                        className="cursor-pointer dark:text-gray-200 dark:focus:bg-gray-700/50 rounded-lg mx-1"
                      >
                        <Sparkles className="mr-2.5 h-4 w-4" />
                        <span>{t("common.settings")}</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-700/50" />
                      <DropdownMenuItem
                        onClick={handleSignOut}
                        className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20 rounded-lg mx-1"
                      >
                        <LogOut className="mr-2.5 h-4 w-4" />
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
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-gray-800/80 rounded-xl px-4"
                  >
                    {t("auth.signIn")}
                  </Button>
                  <Button
                    onClick={() => navigate(ROUTES.SIGNUP)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105"
                  >
                    {t("auth.joinNow")}
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 rounded-xl transition-all duration-300 lg:hidden z-50 relative"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsMobileNavOpen((prev) => !prev);
              }}
              aria-label="Toggle menu"
              aria-expanded={isMobileNavOpen}
            >
              {isMobileNavOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
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
