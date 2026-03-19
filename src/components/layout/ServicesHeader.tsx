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
  UserCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [providerProfile, setProviderProfile] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

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
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          isScrolled
            ? "bg-white shadow-2xl shadow-gray-300/60 border-b border-gray-200 pb-2"
            : "bg-white/90 backdrop-blur-md",
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-18">
            {/* Logo Section */}
            <Link to="/services" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="bg-gradient-to-br from-violet-600 to-indigo-600 text-white p-2.5 rounded-xl shadow-lg shadow-violet-500/30 group-hover:shadow-violet-500/50 transition-all duration-300 group-hover:scale-105">
                  <Briefcase size={22} strokeWidth={2.5} />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent leading-none">
                  Aurora
                </span>
                <span className="text-[9px] font-semibold text-violet-600 tracking-[0.25em] uppercase">
                  Services
                </span>
              </div>
            </Link>

            {/* Center Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {[
                {
                  label: t("services.findTalent"),
                  href: "/services/programming",
                  icon: "",
                },
                {
                  label: t("services.healthcare"),
                  href: "/services/healthcare",
                  icon: "",
                },
                { label: t("services.allServices"), href: "/services", icon: "✨" },
              ].map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className={cn(
                    "relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                    isActive(item.href)
                      ? "text-violet-700 bg-violet-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                  )}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                  {isActive(item.href) && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-violet-600 rounded-full" />
                  )}
                </Link>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="hidden md:flex items-center gap-3">
              {/* Products Cross-Link */}
              <Link
                to="/products"
                className="group flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-600 hover:text-indigo-600 transition-colors"
              >
                <div className="p-1.5 rounded-lg bg-gray-100 group-hover:bg-indigo-50 transition-colors">
                  <ShoppingBag size={14} strokeWidth={2.5} />
                </div>
                <span className="hidden xl:inline">{t("services.shopProducts")}</span>
                <ArrowRight
                  size={14}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </Link>

              <div className="w-px h-6 bg-gray-200" />

              {/* Search */}
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder={t("services.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10 pr-4 py-2 bg-gray-100/80 border-0 rounded-full text-sm focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition-all placeholder:text-gray-400 hover:bg-gray-100"
                />
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  size={17}
                />
              </form>

              {user ? (
                <>
                  {/* Notifications */}
                  <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                  </button>

                  {/* Messages */}
                  <Link
                    to="/services/messages"
                    className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <MessageSquare size={20} />
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                  </Link>

                  {/* Profile Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 hover:bg-gray-50 px-2 py-1.5 rounded-full transition-all border border-transparent hover:border-gray-200">
                        <Avatar
                          name={
                            providerProfile?.provider_name ||
                            user.user_metadata.full_name
                          }
                          src={providerProfile?.logo_url}
                          size="md"
                          className="w-9 h-9 border-2 border-white shadow-sm"
                        />
                        <ChevronDown size={15} className="text-gray-400" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-64 rounded-xl shadow-xl border-gray-100"
                    >
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-900">
                              {user.user_metadata.full_name}
                            </p>
                            {providerProfile?.is_verified && (
                              <Badge className="h-4 text-[8px] px-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                                <CheckCircle2 size={10} className="mr-0.5" />
                                {t("services.verified")}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-gray-100" />
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link
                          to="/services/dashboard"
                          className="flex items-center"
                        >
                          <UserCircle className="mr-2 h-4 w-4" />
                          <span>{t("common.dashboard")}</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link to="/orders" className="flex items-center">
                          <ShoppingBag className="mr-2 h-4 w-4" />
                          <span>{t("common.orders")}</span>
                        </Link>
                      </DropdownMenuItem>
                      {!providerProfile && (
                        <>
                          <DropdownMenuSeparator className="bg-gray-100" />
                          <DropdownMenuItem
                            asChild
                            className="cursor-pointer text-violet-600"
                          >
                            <Link
                              to="/services/onboarding"
                              className="flex items-center font-medium"
                            >
                              <Briefcase className="mr-2 h-4 w-4" />
                              <span>{t("services.becomeProvider")}</span>
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator className="bg-gray-100" />
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
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
                    className="text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  >
                    {t("auth.signIn")}
                  </Button>
                  <Button
                    onClick={() => navigate("/signup")}
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50"
                  >
                    {t("auth.joinNow")}
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
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
          />

          {/* Drawer */}
          <div className="fixed top-0 right-0 z-50 h-full w-[300px] bg-white shadow-2xl lg:hidden overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <span className="font-bold text-lg">{t("services.auroraServices")}</span>
              <button
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X size={22} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              {/* Search */}
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder={t("services.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-100 border-0 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                />
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />
              </form>

              {/* Navigation */}
              <div className="space-y-1">
                <Link
                  to="/services/programming"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-700 hover:bg-violet-50 hover:text-violet-700 rounded-xl transition-colors"
                >
                  <span>💻</span>
                  {t("services.findTalent")}
                </Link>
                <Link
                  to="/services/healthcare"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-700 hover:bg-violet-50 hover:text-violet-700 rounded-xl transition-colors"
                >
                  <span>🏥</span>
                  {t("services.healthcare")}
                </Link>
                <Link
                  to="/services"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-700 hover:bg-violet-50 hover:text-violet-700 rounded-xl transition-colors"
                >
                  <span>✨</span>
                  {t("services.allServices")}
                </Link>
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

              <div className="border-t border-gray-100 my-4" />

              {user ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
                    <Avatar
                      name={user.user_metadata.full_name}
                      src={user.user_metadata.avatar_url}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.user_metadata.full_name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/services/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    <UserCircle size={20} />
                    {t("common.dashboard")}
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
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
                      navigate("/signup");
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                  >
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
