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
  Palette,
  Wrench,
  Sparkles,
  Zap,
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

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
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
          "fixed top-0 left-0 right-0 z-[100] transition-all duration-700",
          isScrolled
            ? "py-2 bg-background/40 backdrop-blur-3xl border-b border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
            : "py-6 bg-transparent border-b border-transparent",
        )}
      >
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo Section */}
            <div className="flex items-center gap-12">
              <Link
                to={ROUTES.HOME}
                className="flex items-center gap-3 group transition-transform duration-500 hover:scale-105 active:scale-95"
              >
                <div className="relative">
                  <div className="absolute -inset-2 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <Logo size="md" showText={false} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-black italic tracking-tighter leading-none group-hover:text-primary transition-colors">AURORA</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 leading-none mt-1">Ecosystem</span>
                </div>
              </Link>

              {/* Primary Navigation - Desktop */}
              <nav className="hidden xl:flex items-center gap-2">
                <Link
                  to={ROUTES.PRODUCTS}
                  className={cn(
                    "relative px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all duration-500 overflow-hidden group",
                    location.pathname.startsWith(ROUTES.PRODUCTS)
                      ? "text-primary bg-primary/5 shadow-inner border border-primary/20"
                      : "text-foreground/60 hover:text-foreground hover:bg-white/5 border border-transparent",
                  )}
                >
                  <span className="relative z-10">{t("nav.products")}</span>
                  {location.pathname.startsWith(ROUTES.PRODUCTS) && (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-50" />
                  )}
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        "group px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl gap-2 flex items-center transition-all duration-500 border border-transparent",
                        location.pathname.startsWith("/services")
                          ? "text-primary bg-primary/5 border-primary/20"
                          : "text-foreground/60 hover:text-foreground hover:bg-white/5",
                      )}
                    >
                      {t("nav.services")}
                      <ChevronDown className="h-3.5 w-3.5 transition-transform duration-500 group-data-[state=open]:rotate-180 opacity-50" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    sideOffset={12}
                    className="w-[580px] glass p-6 rounded-[2rem] shadow-2xl border-white/10 animate-in fade-in zoom-in-95 duration-300"
                  >
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-1 space-y-4">
                           <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 px-2 italic">Standard Nodes</h3>
                           {[
                             {
                               title: "Programming",
                               href: "/services/programmer",
                               icon: Code,
                               desc: "Elite software engineering & architecture.",
                               color: "text-cyan-500",
                               bgColor: "bg-cyan-500/10",
                             },
                             {
                               title: "Translation",
                               href: "/services/translator",
                               icon: Globe,
                               desc: "Global linguistic & localization services.",
                               color: "text-amber-500",
                               bgColor: "bg-amber-500/10",
                             },
                           ].map((item) => (
                             <DropdownMenuItem key={item.href} asChild className="p-0 bg-transparent focus:bg-transparent">
                               <Link
                                 to={item.href}
                                 className="flex items-start gap-4 p-4 rounded-[1.5rem] hover:bg-white/5 border border-transparent hover:border-white/10 transition-all duration-500 group"
                               >
                                 <div className={`p-3 rounded-2xl ${item.bgColor} flex-shrink-0 transition-all duration-500 group-hover:scale-110 shadow-lg group-hover:shadow-primary/20`}>
                                   <item.icon className={`h-6 w-6 ${item.color}`} />
                                 </div>
                                 <div>
                                   <p className="text-sm font-black italic tracking-tight">{item.title}</p>
                                   <p className="text-[10px] font-bold text-muted-foreground/60 mt-1 uppercase tracking-tight leading-tight">{item.desc}</p>
                                 </div>
                               </Link>
                             </DropdownMenuItem>
                           ))}
                        </div>
                        <div className="col-span-1 space-y-4">
                           <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 px-2 italic">Specialized Ops</h3>
                           {[
                             {
                               title: "Design",
                               href: "/services/designer",
                               icon: Palette,
                               desc: "Creative visual identity & UI/UX design.",
                               color: "text-violet-500",
                               bgColor: "bg-violet-500/10",
                             },
                             {
                               title: "Home Fix",
                               href: "/services/home",
                               icon: Wrench,
                               desc: "Elite maintenance & smart home ops.",
                               color: "text-emerald-500",
                               bgColor: "bg-emerald-500/10",
                             }
                           ].map((item) => (
                             <DropdownMenuItem key={item.href} asChild className="p-0 bg-transparent focus:bg-transparent">
                                 <Link
                                   to={item.href}
                                   className="flex items-start gap-4 p-4 rounded-[1.5rem] hover:bg-white/5 border border-transparent hover:border-white/10 transition-all duration-500 group"
                                 >
                                   <div className={`p-3 rounded-2xl ${item.bgColor} flex-shrink-0 transition-all duration-500 group-hover:scale-110 shadow-lg group-hover:shadow-primary/20`}>
                                     <item.icon className={`h-6 w-6 ${item.color}`} />
                                   </div>
                                   <div>
                                     <p className="text-sm font-black italic tracking-tight">{item.title}</p>
                                     <p className="text-[10px] font-bold text-muted-foreground/60 mt-1 uppercase tracking-tight leading-tight">{item.desc}</p>
                                   </div>
                                 </Link>
                               </DropdownMenuItem>
                           ))}
                        </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </nav>
            </div>

            {/* Utility & Profile Actions */}
            <div className="flex items-center gap-6">
              <form onSubmit={handleSearch} className="hidden lg:relative group lg:block">
                <input
                  type="text"
                  placeholder={t("common.searchProducts") || "INITIATE SEARCH..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  className={cn(
                    "w-48 pl-12 pr-6 py-3 glass bg-white/5 border-white/10 rounded-2xl text-[10px] font-black tracking-widest uppercase focus:w-80 outline-none transition-all duration-700 placeholder:text-muted-foreground/40",
                    isSearchFocused && "border-primary/40 shadow-[0_0_30px_rgba(59,130,246,0.15)] ring-1 ring-primary/20 bg-white/10",
                  )}
                />
                <Search
                  className={cn(
                    "absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-all duration-500",
                    isSearchFocused && "text-primary scale-125 rotate-12",
                  )}
                  size={15}
                />
                {!isSearchFocused && searchQuery === "" && (
                   <span className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center h-5 px-1.5 border border-white/10 rounded text-[9px] font-black text-muted-foreground/30 font-mono tracking-tighter">CMD K</span>
                )}
              </form>

              <div className="flex items-center gap-2">
                {/* Theme Toggle */}
                <button
                  onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                  className="p-3 glass bg-white/5 hover:bg-white/10 text-foreground/60 hover:text-foreground rounded-2xl transition-all duration-500 hover:scale-110 border border-white/10 active:scale-95 group"
                  aria-label="Toggle theme"
                >
                  {theme === "light" ? (
                    <Moon className="h-5 w-5 transition-transform group-hover:rotate-12" />
                  ) : (
                    <Sun className="h-5 w-5 text-amber-400 animate-pulse transition-transform group-hover:rotate-45" />
                  )}
                </button>

                {user ? (
                  <>
                    <div className="hidden lg:flex items-center gap-2">
                        {/* Language Switcher */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="glass bg-white/5 border-white/10 h-11 px-4 rounded-2xl hover:bg-white/10 text-[10px] font-black uppercase tracking-widest gap-2"
                            >
                              <Globe className="h-4 w-4 text-primary/60" />
                              <span className="tracking-tighter italic">{currentLang.code.toUpperCase()}</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            sideOffset={12}
                            align="end"
                            className="w-56 glass p-2 rounded-2xl border-white/10 shadow-2xl"
                          >
                            <DropdownMenuLabel className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 italic flex items-center gap-2">
                               <Globe className="h-3 w-3" />
                               Global Matrix
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-white/5" />
                            {supportedLanguages.map((lang) => (
                              <DropdownMenuItem
                                key={lang.code}
                                onClick={() => setLanguage(lang.code)}
                                className={cn(
                                  "rounded-xl px-4 py-3 mb-1 cursor-pointer transition-all duration-300 font-bold text-xs gap-3",
                                  currentLang.code === lang.code
                                    ? "bg-primary/20 text-primary border-white/5"
                                    : "hover:bg-white/5",
                                )}
                              >
                                <span className="text-xl leading-none">{lang.flag}</span>
                                <span className="flex-1 uppercase tracking-tight">{lang.nativeName}</span>
                                {currentLang.code === lang.code && <CheckCircle2 className="h-3.5 w-3.5" />}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <NotificationBell />

                        <button
                          onClick={() => navigate(ROUTES.CART)}
                          className="relative p-3 glass bg-white/5 border-white/10 text-foreground/60 hover:text-primary hover:bg-white/10 rounded-2xl transition-all duration-500 hover:scale-110 active:scale-95 group"
                        >
                          <ShoppingCart size={18} className="group-hover:-rotate-12 transition-transform" />
                          {itemCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[20px] h-[20px] px-1 bg-primary text-white text-[10px] font-black italic rounded-xl shadow-lg shadow-primary/30 border border-white/10">
                              {itemCount > 99 ? "99+" : itemCount}
                            </span>
                          )}
                        </button>
                    </div>

                    {/* Profile Interaction Block */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-3 glass bg-white/5 border-white/10 hover:bg-white/10 p-2 rounded-2xl transition-all duration-500 group">
                          <Avatar
                            name={user.user_metadata.full_name || user.email}
                            src={user.user_metadata.avatar_url}
                            className="w-10 h-10 border-2 border-white/20 shadow-xl rounded-xl"
                          />
                          <div className="hidden lg:flex flex-col items-start pr-2">
                             <span className="text-[10px] font-black italic tracking-tight">{user.user_metadata.full_name || "USER_ROOT"}</span>
                             <span className="text-[8px] font-black uppercase tracking-widest text-primary/60">Verified Node</span>
                          </div>
                          <ChevronDown size={14} className="hidden lg:block text-muted-foreground/60 transition-transform group-data-[state=open]:rotate-180" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        sideOffset={12}
                        className="w-72 glass p-4 rounded-[2.5rem] shadow-2xl border-white/10 animate-in fade-in slide-in-from-top-4 duration-500"
                      >
                        <DropdownMenuLabel className="font-normal p-4">
                          <div className="flex items-center gap-4">
                            <Avatar
                              name={user.user_metadata.full_name || user.email}
                              src={user.user_metadata.avatar_url}
                              className="w-16 h-16 border-4 border-white/10 rounded-3xl shadow-2xl"
                            />
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="text-lg font-black italic tracking-tighter leading-none">
                                  {user.user_metadata.full_name || "OPERATOR"}
                                </p>
                              </div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 truncate max-w-[140px] italic">
                                {user.email}
                              </p>
                              {providerProfile?.is_verified && (
                                <Badge className="mt-1 h-5 text-[9px] font-black uppercase px-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full">
                                  <CheckCircle2 size={10} className="mr-1" />
                                  AUTHENTICATED
                                </Badge>
                              )}
                            </div>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/5 my-2" />
                        <div className="space-y-1 grid grid-cols-2 gap-1 p-1">
                           <DropdownMenuItem
                            onClick={() => navigate(ROUTES.PROFILE)}
                            className="flex flex-col items-center justify-center gap-2 h-24 cursor-pointer glass hover:bg-primary/20 hover:text-primary rounded-3xl transition-all duration-500 border-white/5 active:scale-95"
                          >
                            <User className="h-6 w-6 opacity-60" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Profile</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => navigate(ROUTES.ORDERS)}
                            className="flex flex-col items-center justify-center gap-2 h-24 cursor-pointer glass hover:bg-primary/20 hover:text-primary rounded-3xl transition-all duration-500 border-white/5 active:scale-95"
                          >
                            <ShoppingBag className="h-6 w-6 opacity-60" />
                            <span className="text-[10px] font-black uppercase tracking-widest">History</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => navigate(ROUTES.ADDRESSES)}
                            className="flex flex-col items-center justify-center gap-2 h-24 cursor-pointer glass hover:bg-primary/20 hover:text-primary rounded-3xl transition-all duration-500 border-white/5 active:scale-95"
                          >
                            <Briefcase className="h-6 w-6 opacity-60" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Nodes</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => navigate(ROUTES.SETTINGS)}
                            className="flex flex-col items-center justify-center gap-2 h-24 cursor-pointer glass hover:bg-primary/20 hover:text-primary rounded-3xl transition-all duration-500 border-white/5 active:scale-95"
                          >
                            <Sparkles className="h-6 w-6 opacity-60" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Engine</span>
                          </DropdownMenuItem>
                        </div>
                        <DropdownMenuSeparator className="bg-white/5 my-3" />
                        <DropdownMenuItem
                          onClick={handleSignOut}
                          className="cursor-pointer text-rose-500 focus:text-white focus:bg-rose-500/80 rounded-[1.5rem] py-4 flex items-center justify-center font-black uppercase tracking-[0.3em] text-[10px] transition-all"
                        >
                          <LogOut className="mr-3 h-4 w-4" />
                          <span>TERMINATE SESSION</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                ) : (
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      onClick={() => navigate(ROUTES.LOGIN)}
                      className="glass bg-white/5 border-white/10 h-12 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95"
                    >
                      {t("auth.signIn")}
                    </Button>
                    <button
                      onClick={() => navigate(ROUTES.SIGNUP)}
                      className="h-12 px-8 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      {t("auth.joinNow")}
                    </button>
                  </div>
                )}

                {/* Mobile Menu Toggle */}
                <button
                  type="button"
                  className="p-3 glass bg-white/5 hover:bg-white/10 text-foreground rounded-2xl transition-all duration-500 lg:hidden relative border border-white/10 active:scale-90"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsMobileNavOpen((prev) => !prev);
                  }}
                  aria-label="Toggle menu"
                >
                  {isMobileNavOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
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
