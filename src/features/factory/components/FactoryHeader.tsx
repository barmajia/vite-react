import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Factory,
  LogOut,
  User,
  Package,
  TrendingUp,
  Settings,
  ChevronDown,
  BarChart3,
  MessageSquare,
  Menu,
  X,
  CheckCircle2,
  Moon,
  Sun,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/Logo";

interface FactoryProfile {
  id: string;
  user_id: string;
  company_name: string | null;
  full_name: string;
  email: string;
  is_verified: boolean;
  avatar_url: string | null;
  production_capacity: string | null;
  specialization: string | null;
}

export function FactoryHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [factoryProfile, setFactoryProfile] = useState<FactoryProfile | null>(
    null,
  );

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch factory profile
  useEffect(() => {
    const fetchFactoryProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("sellers")
          .select(
            "user_id, company_name, full_name, email, is_verified, avatar_url, production_capacity, specialization",
          )
          .eq("user_id", user.id)
          .eq("is_factory", true)
          .maybeSingle();

        if (error) return;
        if (data) {
          setFactoryProfile({
            id: user.id,
            ...data,
          });
        }
      } catch {
        // Silently fail
      }
    };
    fetchFactoryProfile();
  }, [user]);

  // Close dropdowns on route change
  useEffect(() => {
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/factory");
  };

  const navLinks = [
    { to: "/factory/dashboard", label: "Dashboard", icon: BarChart3 },
    { to: "/factory/dashboard/production", label: "Production", icon: Package },
    { to: "/factory/dashboard/quotes", label: "Quotes", icon: MessageSquare },
    {
      to: "/factory/dashboard/connections",
      label: "Connections",
      icon: TrendingUp,
    },
  ];

  // If not logged in, show public header
  if (!user) {
    return (
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
            {/* Logo */}
            <Link
              to="/factory"
              className="flex items-center gap-3 group transition-transform duration-500 hover:scale-105"
            >
              <div className="relative">
                <div className="absolute -inset-2 bg-blue-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <Factory className="h-10 w-10 text-blue-500 relative z-10" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black italic tracking-tighter leading-none text-white group-hover:text-blue-400 transition-colors">
                  AURORA
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60 leading-none mt-1 text-white/80">
                  Factory Portal
                </span>
              </div>
            </Link>

            {/* Auth Buttons */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="p-3 glass bg-white/5 hover:bg-white/10 text-foreground/60 hover:text-foreground rounded-2xl transition-all duration-500 hover:scale-110 border border-white/10"
              >
                {theme === "light" ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5 text-amber-400" />
                )}
              </button>
              <Link to="/factory/login">
                <button className="glass bg-white/5 border-white/10 h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                  Login
                </button>
              </Link>
              <Link to="/factory/signup">
                <button className="h-12 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/30 hover:scale-105 transition-all">
                  Sign Up
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>
    );
  }

  // If logged in, show authenticated header
  return (
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
          {/* Logo */}
          <Link
            to="/factory/dashboard"
            className="flex items-center gap-3 group transition-transform duration-500 hover:scale-105"
          >
            <div className="relative">
              <div className="absolute -inset-2 bg-blue-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Factory className="h-10 w-10 text-blue-500 relative z-10" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black italic tracking-tighter leading-none text-white group-hover:text-blue-400 transition-colors">
                AURORA
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60 leading-none mt-1 text-white/80">
                {factoryProfile?.company_name || "Factory Dashboard"}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-2">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all duration-500",
                  location.pathname.startsWith(to)
                    ? "text-blue-500 bg-blue-500/5 border border-blue-500/20"
                    : "text-foreground/60 hover:text-foreground hover:bg-white/5 border border-transparent",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>

          {/* Profile Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="p-3 glass bg-white/5 hover:bg-white/10 text-foreground/60 hover:text-foreground rounded-2xl transition-all duration-500 hover:scale-110 border border-white/10"
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5 text-amber-400" />
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 glass bg-white/5 border-white/10 hover:bg-white/10 p-2 rounded-2xl transition-all duration-500 group"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                  {factoryProfile?.full_name?.charAt(0).toUpperCase() ||
                    user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="hidden lg:flex flex-col items-start pr-2">
                  <span className="text-[10px] font-black italic tracking-tight">
                    {factoryProfile?.full_name || "Factory User"}
                  </span>
                  <span className="text-[8px] font-black uppercase tracking-widest text-blue-500/60">
                    {factoryProfile?.is_verified ? "Verified" : "Pending"}
                  </span>
                </div>
                <ChevronDown
                  size={14}
                  className="hidden lg:block text-muted-foreground/60 transition-transform"
                />
              </button>

              {/* Dropdown */}
              {isProfileOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 glass p-4 rounded-[2rem] shadow-2xl border-white/10 z-[200]">
                  <div className="flex items-center gap-4 p-4 mb-2">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                      {factoryProfile?.full_name?.charAt(0).toUpperCase() ||
                        user.email?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black italic">
                        {factoryProfile?.full_name || "Factory User"}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 truncate">
                        {user.email}
                      </p>
                      {factoryProfile?.is_verified && (
                        <div className="flex items-center gap-1 mt-1">
                          <CheckCircle2 className="h-3 w-3 text-blue-500" />
                          <span className="text-[9px] font-black uppercase text-blue-500">
                            Verified Factory
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 mb-2">
                    <Link
                      to="/factory/dashboard"
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all"
                    >
                      <BarChart3 className="h-4 w-4 text-blue-500" />
                      <span className="text-xs font-bold">Dashboard</span>
                    </Link>
                    <Link
                      to="/factory/dashboard/production"
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all"
                    >
                      <Package className="h-4 w-4 text-blue-500" />
                      <span className="text-xs font-bold">Production</span>
                    </Link>
                    <Link
                      to="/factory/dashboard/settings"
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all"
                    >
                      <Settings className="h-4 w-4 text-blue-500" />
                      <span className="text-xs font-bold">Settings</span>
                    </Link>
                  </div>

                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all font-black uppercase text-[10px] tracking-widest"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-3 glass bg-white/5 hover:bg-white/10 text-foreground rounded-2xl transition-all duration-500 lg:hidden border border-white/10"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-16 z-[150] bg-background/95 backdrop-blur-3xl p-6 animate-in slide-in-from-right duration-300">
          <nav className="space-y-4">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Icon className="h-6 w-6 text-blue-500" />
                <span className="text-sm font-black uppercase tracking-widest">
                  {label}
                </span>
              </Link>
            ))}
            <div className="pt-4 border-t border-white/10">
              <Link
                to="/factory/dashboard"
                className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <User className="h-6 w-6 text-blue-500" />
                <span className="text-sm font-black uppercase tracking-widest">
                  Profile
                </span>
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-4 p-4 rounded-2xl bg-rose-500/10 text-rose-500 transition-all mt-2"
              >
                <LogOut className="h-6 w-6" />
                <span className="text-sm font-black uppercase tracking-widest">
                  Sign Out
                </span>
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
