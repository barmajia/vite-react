// src/components/layout/ServicesHeader.tsx
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  MessageSquare,
  Menu,
  X,
  LogOut,
  ShoppingBag,
  Bell,
  Sun,
  Moon,
  LayoutDashboard,
  Briefcase,
  Users,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Logo } from "@/components/shared/Logo";
import { Activity, Shield } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ServicesHeader() {
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
  const [notificationCount, setNotificationCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchProfiles = async () => {
      if (!user) return;
      try {
        const { data: svcData } = await supabase
          .from("svc_providers")
          .select("id, provider_name, logo_url, is_verified")
          .eq("user_id", user.id)
          .maybeSingle();

        if (svcData) setProviderProfile(svcData);
      } catch (err) {
        console.error("Error fetching header profiles:", err);
      }
    };
    fetchProfiles();
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

        const { count: msgCount } = await supabase
          .from("conversation_participants")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

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
    navigate("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/services?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isActive = (path: string) => {
    if (path === "/services") return location.pathname === "/services";
    return location.pathname.startsWith(path);
  };

  const isHealthRoute = location.pathname.startsWith("/health");

  const mainNavItems = isHealthRoute 
    ? [
        { label: "Health Matrix", href: "/health", icon: Activity },
        { label: "Care Nexus", href: "/health/doctor-registration", icon: Shield },
      ]
    : [
        { label: "Elite Tech", href: "/services/tech", icon: Briefcase },
        { label: "Global Matrix", href: "/services", icon: Sparkles },
      ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-[100] transition-all duration-700 h-20 flex items-center",
        isScrolled
          ? "bg-background/80 backdrop-blur-[30px] border-b border-white/5 shadow-[0_10px_40px_-5px_rgba(0,0,0,0.4)]"
          : "bg-transparent border-b border-transparent"
      )}
    >
      <div className="max-w-8xl mx-auto px-6 lg:px-12 w-full">
        <div className="flex justify-between items-center gap-8">
          
          <Link
            to={isHealthRoute ? "/health" : "/services"}
            className="flex items-center gap-4 group relative"
          >
            <div className={cn(
              "p-2 glass border border-white/20 rounded-2xl group-hover:scale-110 transition-all duration-500 shadow-2xl",
              isHealthRoute ? "bg-rose-500/10 shadow-rose-500/20" : "bg-primary/10 shadow-primary/20"
            )}>
              <Logo size="lg" showText={false} />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black italic tracking-tighter leading-none text-foreground group-hover:text-primary transition-colors">
                {isHealthRoute ? "HEALTH" : "SERVICES"}
              </span>
              <span className="text-[8px] font-black uppercase tracking-[0.4em] text-foreground/30 italic">Nexus Architecture</span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-2 p-1.5 glass bg-white/5 border border-white/10 rounded-2xl backdrop-blur-2xl">
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "relative px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center gap-2",
                  isActive(item.href)
                    ? "bg-primary text-white shadow-lg shadow-primary/30 active:scale-95"
                    : "text-foreground/40 hover:text-foreground hover:bg-white/5"
                )}
              >
                <item.icon className={cn("h-3.5 w-3.5", isActive(item.href) ? "text-white" : "text-primary/60")} />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <form onSubmit={handleSearch} className="relative hidden xl:block group/search">
               <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-foreground/20 group-focus-within/search:text-primary transition-colors" />
               </div>
               <input
                 type="text"
                 placeholder="Search Matrix..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-48 pl-10 pr-4 py-2.5 bg-black/20 backdrop-blur-3xl border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest placeholder:text-foreground/10 focus:w-72 focus:bg-black/40 focus:border-primary/40 focus:ring-4 focus:ring-primary/10 transition-all outline-none"
               />
            </form>

            <div className="h-6 w-px bg-white/10 hidden md:block" />

            {user && (
              <div className="flex items-center gap-1.5">
                <Link to="/services/chat" className="relative group p-2.5 rounded-xl hover:bg-white/5 transition-all active:scale-90 overflow-hidden">
                  <MessageSquare className="h-5 w-5 text-foreground/40 group-hover:text-primary transition-colors" />
                  {messageCount > 0 && (
                    <span className="absolute top-2 right-2 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-primary border-2 border-background"></span>
                    </span>
                  )}
                </Link>
                <button className="relative group p-2.5 rounded-xl hover:bg-white/5 transition-all active:scale-90">
                  <Bell className="h-5 w-5 text-foreground/40 group-hover:text-primary transition-colors" />
                  {notificationCount > 0 && (
                    <span className="absolute top-2 right-2 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-primary border-2 border-background"></span>
                    </span>
                  )}
                </button>
              </div>
            )}

            {user ? (
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-3 p-1 rounded-2xl pl-3 hover:bg-white/5 transition-all group">
                       <div className="flex flex-col items-end">
                          <span className="text-[10px] font-black uppercase tracking-widest leading-none text-foreground/80 group-hover:text-primary transition-colors">
                            {user.user_metadata.full_name?.split(" ")[0]}
                          </span>
                          <span className="text-[7px] font-black uppercase tracking-[0.3em] text-foreground/20 italic">ID: {user.id.slice(0, 4)}</span>
                       </div>
                       <Avatar
                          name={user.user_metadata.full_name}
                          src={providerProfile?.logo_url}
                          className="w-10 h-10 border-2 border-white/10 rounded-xl group-hover:border-primary/40 transition-all shadow-lg"
                        />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 glass-card rounded-[2rem] border-white/20 p-2 shadow-2xl backdrop-blur-3xl">
                     <DropdownMenuLabel className="p-4 space-y-1">
                        <p className="text-sm font-black italic tracking-tighter uppercase">{user.user_metadata.full_name}</p>
                        <p className="text-[10px] font-medium text-foreground/40">{user.email}</p>
                     </DropdownMenuLabel>
                     <DropdownMenuSeparator className="bg-white/5" />
                     <DropdownMenuItem asChild className="rounded-xl p-3 focus:bg-primary/10 focus:text-primary transition-all">
                        <Link to="/services/dashboard" className="flex items-center">
                          <LayoutDashboard className="mr-3 h-4 w-4" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Dashboard</span>
                        </Link>
                     </DropdownMenuItem>
                     <DropdownMenuItem asChild className="rounded-xl p-3 focus:bg-primary/10 focus:text-primary transition-all">
                        <Link to="/profile" className="flex items-center">
                          <Users className="mr-3 h-4 w-4" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Global Profile</span>
                        </Link>
                     </DropdownMenuItem>
                     <DropdownMenuSeparator className="bg-white/5" />
                     <DropdownMenuItem onClick={handleLogout} className="rounded-xl p-3 text-red-500 focus:bg-red-500/10 focus:text-red-500 transition-all">
                        <LogOut className="mr-3 h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Disconnect</span>
                     </DropdownMenuItem>
                  </DropdownMenuContent>
               </DropdownMenu>
            ) : (
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    onClick={() => navigate("/login")}
                    className="text-[10px] font-black uppercase tracking-widest text-foreground/60 hover:text-foreground"
                  >
                    Authorize
                  </Button>
                  <Button
                    onClick={() => navigate("/signup")}
                    className="bg-primary hover:bg-primary/90 text-white rounded-xl h-10 px-6 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                  >
                    Initialize Account
                  </Button>
                </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="w-10 h-10 p-0 flex items-center justify-center glass bg-white/5 border border-white/10 rounded-xl text-foreground/40 hover:text-primary transition-all overflow-hidden relative"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              <div className="relative h-5 w-5">
                 <Sun className="h-5 w-5 transition-transform duration-500 absolute rotate-0 scale-100 dark:-rotate-90 dark:scale-0" />
                 <Moon className="h-5 w-5 transition-transform duration-500 absolute rotate-90 scale-0 dark:rotate-0 dark:scale-100 dark:text-amber-400" />
              </div>
            </Button>

            <Button
                variant="ghost"
                size="sm"
                className="lg:hidden w-10 h-10 glass border-white/10 rounded-xl"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </Button>

          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[200] lg:hidden">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsMobileMenuOpen(false)} />
           <div className="absolute top-0 right-0 h-full w-[300px] glass bg-black/20 border-l border-white/10 p-8 pt-12 flex flex-col gap-10 shadow-2xl backdrop-blur-[50px]">
              <div className="flex items-center justify-between">
                 <Logo size="lg" />
                 <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => setIsMobileMenuOpen(false)}>
                    <X className="h-6 w-6" />
                 </Button>
              </div>
              
              <nav className="flex flex-col gap-4">
                 {mainNavItems.map((item) => (
                   <Link
                     key={item.href}
                     to={item.href}
                     onClick={() => setIsMobileMenuOpen(false)}
                     className="px-6 py-4 glass bg-white/5 border border-white/5 rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] flex items-center gap-4 text-foreground/60 hover:text-primary hover:border-primary/40 transition-all"
                   >
                     <item.icon className="h-5 w-5" />
                     {item.label}
                   </Link>
                 ))}
              </nav>

              <div className="mt-auto space-y-4">
                 <Button onClick={() => navigate("/products")} className="w-full h-14 rounded-2xl glass border-white/10 flex items-center justify-between px-8 text-[10px] font-black uppercase tracking-widest text-foreground group transition-all">
                    <span>Shop Products</span>
                    <ShoppingBag className="group-hover:scale-110 transition-transform" />
                 </Button>
                 {user && (
                    <Button onClick={handleLogout} className="w-full h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest">
                       Sign Out Matrix
                    </Button>
                 )}
              </div>
           </div>
        </div>
      )}
    </header>
  );
}
