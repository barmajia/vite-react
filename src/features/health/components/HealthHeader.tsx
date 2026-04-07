// src/features/health/components/HealthHeader.tsx
import { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  MessageSquare,
  LogOut,
  Bell,
  Sun,
  Moon,
  LayoutDashboard,
  HeartPulse,
  Stethoscope,
  Building,
  Pill,
  Users,
  Shield,
  Zap,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/lib/supabase";
import { supabaseHealth } from "../api/supabaseHealth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HealthProviderProfile {
  id: string;
  specialization?: string;
  is_verified?: boolean;
  clinic_name?: string;
}

export function HealthHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [userRole, setUserRole] = useState<
    "patient" | "doctor" | "admin" | null
  >(null);
  const [providerProfile, setProviderProfile] =
    useState<HealthProviderProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationCount, setNotificationCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);

  // Dynamic Theme Matrix
  const isPharmacyRoute = useMemo(
    () =>
      location.pathname.includes("/health/pharmacies") ||
      location.pathname.includes("/health/pharmacy"),
    [location.pathname],
  );
  const themeColor = isPharmacyRoute ? "emerald" : "rose";
  const themeHex = isPharmacyRoute ? "16, 185, 129" : "244, 63, 94"; // Tailwind emerald-500 vs rose-500

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        setUserRole("patient");
        return;
      }
      try {
        const { data: adminData } = await supabase
          .from("admin_users")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (adminData) {
          setUserRole("admin");
          return;
        }

        const { data: doctorData } = await supabaseHealth
          .from("health_doctor_profiles")
          .select("id, specialization, is_verified, clinic_name")
          .eq("user_id", user.id)
          .maybeSingle();

        if (doctorData) {
          setUserRole("doctor");
          setProviderProfile(doctorData);
          return;
        }
        setUserRole("patient");
      } catch (error) {
        console.error("Error checking user role:", error);
        setUserRole("patient");
      }
    };
    checkUserRole();
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
          .or(`doctor_id.eq.${user.id}`);

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
    navigate("/health");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(
        `/health/doctors?search=${encodeURIComponent(searchQuery.trim())}`,
      );
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { label: "Providers", href: "/health/doctors", icon: Stethoscope },
    { label: "Pharmacies", href: "/health/pharmacies", icon: Pill },
    { label: "Facilities", href: "/health/hospitals", icon: Building },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-[100] transition-all duration-700 h-20 flex items-center",
        isScrolled
          ? "bg-background/80 backdrop-blur-[30px] border-b border-white/5 shadow-2xl shadow-black/50"
          : "bg-transparent border-b border-transparent",
      )}
      style={{
        // @ts-expect-error - CSS custom property for theme shadow
        "--header-shadow": `rgba(${themeHex}, 0.15)`,
      }}
    >
      {isScrolled && (
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 h-px transition-colors duration-700",
            `bg-${themeColor}-500/20`,
          )}
        />
      )}

      <div className="max-w-8xl mx-auto px-6 lg:px-12 w-full">
        <div className="flex justify-between items-center gap-8">
          {/* LOGO - Dynamic Sector Identity */}
          <Link to="/health" className="flex items-center gap-4 group">
            <div
              className={cn(
                "p-2.5 glass border rounded-2xl group-hover:scale-110 transition-all duration-700 shadow-2xl",
                isPharmacyRoute
                  ? "bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/20"
                  : "bg-rose-500/10 border-rose-500/20 shadow-rose-500/20",
              )}
            >
              <HeartPulse
                className={cn(
                  "h-6 w-6 animate-pulse transition-colors duration-700",
                  `text-${themeColor}-500`,
                )}
              />
            </div>
            <div className="flex flex-col">
              <span
                className={cn(
                  "text-xl font-black italic tracking-tighter leading-none text-foreground transition-colors duration-700",
                  `group-hover:text-${themeColor}-500`,
                )}
              >
                {isPharmacyRoute ? "PHARMA" : "HEALTH"}{" "}
                <span className="text-foreground/20">CORE</span>
              </span>
              <span className="text-[8px] font-black uppercase tracking-[0.4em] text-foreground/30 italic">
                Bio-System Nexus
              </span>
            </div>
          </Link>

          {/* MAIN NAV - Adaptive Sector Blocks */}
          <nav className="hidden lg:flex items-center gap-2 p-1.5 glass bg-white/5 border border-white/10 rounded-2xl backdrop-blur-2xl">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "relative px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-500 flex items-center gap-2",
                  isActive(item.href)
                    ? `bg-${themeColor}-500 text-white shadow-lg shadow-${themeColor}-500/30`
                    : "text-foreground/40 hover:text-foreground hover:bg-white/5",
                )}
              >
                <item.icon
                  className={cn(
                    "h-3.5 w-3.5 transition-colors duration-700",
                    isActive(item.href)
                      ? "text-white"
                      : `text-${themeColor}-500/60`,
                  )}
                />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* ACTIONS */}
          <div className="flex items-center gap-3">
            {/* Search - Sector Focused */}
            <form
              onSubmit={handleSearch}
              className="relative hidden xl:block group/search"
            >
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search
                  className={cn(
                    "h-4 w-4 text-foreground/20 group-focus-within/search:transition-colors group-focus-within/search:duration-700",
                    `group-focus-within/search:text-${themeColor}-500`,
                  )}
                />
              </div>
              <input
                type="text"
                placeholder="Identify Node..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "w-44 pl-10 pr-4 py-2.5 bg-black/20 backdrop-blur-3xl border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest placeholder:text-foreground/10 transition-all outline-none",
                  `focus:w-64 focus:bg-black/40 focus:border-${themeColor}-500/40 focus:ring-4 focus:ring-${themeColor}-500/10`,
                )}
              />
            </form>

            <div className="h-6 w-px bg-white/10 hidden md:block" />

            {/* Notifications adaptive stream */}
            {user && (
              <div className="flex items-center gap-1">
                <Link
                  to="/health/messages"
                  className="relative group p-2.5 rounded-xl hover:bg-white/5 transition-all overflow-hidden"
                >
                  <MessageSquare
                    className={cn(
                      "h-5 w-5 text-foreground/40 transition-colors duration-700",
                      `group-hover:text-${themeColor}-500`,
                    )}
                  />
                  {messageCount > 0 && (
                    <span className="absolute top-2 right-2 flex h-3 w-3">
                      <span
                        className={cn(
                          "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                          `bg-${themeColor}-500`,
                        )}
                      ></span>
                      <span
                        className={cn(
                          "relative inline-flex rounded-full h-3 w-3 border-2 border-background",
                          `bg-${themeColor}-500`,
                        )}
                      ></span>
                    </span>
                  )}
                </Link>
                <button className="relative group p-2.5 rounded-xl hover:bg-white/5 transition-all">
                  <Bell
                    className={cn(
                      "h-5 w-5 text-foreground/40 transition-colors duration-700",
                      `group-hover:text-${themeColor}-500`,
                    )}
                  />
                  {notificationCount > 0 && (
                    <span className="absolute top-2 right-2 flex h-3 w-3">
                      <span
                        className={cn(
                          "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                          `bg-${themeColor}-500`,
                        )}
                      ></span>
                      <span
                        className={cn(
                          "relative inline-flex rounded-full h-3 w-3 border-2 border-background",
                          `bg-${themeColor}-500`,
                        )}
                      ></span>
                    </span>
                  )}
                </button>
              </div>
            )}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 p-1 rounded-2xl pl-3 hover:bg-white/5 transition-all group">
                    <div className="flex flex-col items-end text-right">
                      <span
                        className={cn(
                          "text-[10px] font-black uppercase tracking-widest leading-none text-foreground/80 transition-colors duration-700",
                          `group-hover:text-${themeColor}-500`,
                        )}
                      >
                        {user.user_metadata.full_name?.split(" ")[0]}
                      </span>
                      <span className="text-[7px] font-black uppercase tracking-[0.3em] text-foreground/20 italic">
                        {userRole?.toUpperCase()} MODE
                      </span>
                    </div>
                    <Avatar
                      name={user.user_metadata.full_name}
                      src={user.user_metadata.avatar_url}
                      className={cn(
                        "w-10 h-10 border-2 border-white/10 rounded-xl transition-all shadow-lg",
                        `group-hover:border-${themeColor}-500/40`,
                      )}
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-64 glass-card rounded-[2rem] border-white/20 p-2 shadow-2xl backdrop-blur-3xl"
                >
                  <DropdownMenuLabel className="p-4 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black italic tracking-tighter uppercase">
                        {user.user_metadata.full_name}
                      </p>
                      {providerProfile?.is_verified && (
                        <Shield className="h-3 w-3 text-emerald-500" />
                      )}
                    </div>
                    <p className="text-[10px] font-medium text-foreground/40">
                      {user.email}
                    </p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/5" />
                  <DropdownMenuItem
                    asChild
                    className={cn(
                      "rounded-xl p-3 transition-all cursor-pointer",
                      `focus:bg-${themeColor}-500/10 focus:text-${themeColor}-500`,
                    )}
                  >
                    <Link
                      to={
                        userRole === "doctor"
                          ? "/health/doctor/dashboard"
                          : "/health/patient/dashboard"
                      }
                      className="flex items-center"
                    >
                      <LayoutDashboard className="mr-3 h-4 w-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        Medical Dashboard
                      </span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    asChild
                    className={cn(
                      "rounded-xl p-3 transition-all cursor-pointer",
                      `focus:bg-${themeColor}-500/10 focus:text-${themeColor}-500`,
                    )}
                  >
                    <Link to="/profile" className="flex items-center">
                      <Users className="mr-3 h-4 w-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        Citizen Profile
                      </span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/5" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="rounded-xl p-3 text-red-500 focus:bg-red-500/10 focus:text-red-500 transition-all cursor-pointer"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Terminate Session
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={() => navigate("/login")}
                  className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white"
                >
                  Authenticate
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate("/health/patient/signup")}
                  className={cn(
                    "rounded-xl border-white/10 h-10 px-6 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all",
                  )}
                >
                  Patient Join
                </Button>
                <Button
                  onClick={() => navigate("/health/doctor/signup")}
                  className={cn(
                    "text-white rounded-xl h-10 px-6 text-[10px] font-black uppercase tracking-widest shadow-lg transition-all duration-700",
                    `bg-${themeColor}-500 hover:bg-${themeColor}-600 shadow-${themeColor}-500/20`,
                  )}
                >
                  Medical Signup
                </Button>
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "w-10 h-10 p-0 flex items-center justify-center glass bg-white/5 border border-white/10 rounded-xl text-foreground/40 transition-all duration-700",
                `hover:text-${themeColor}-500`,
              )}
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              <div className="relative h-5 w-5">
                <Sun className="h-5 w-5 transition-transform duration-500 absolute rotate-0 scale-100 dark:-rotate-90 dark:scale-0" />
                <Moon className="h-5 w-5 transition-transform duration-500 absolute rotate-90 scale-0 dark:rotate-0 dark:scale-100 dark:text-amber-400" />
              </div>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
