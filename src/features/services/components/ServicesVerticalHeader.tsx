// src/features/services/components/ServicesVerticalHeader.tsx
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Code,
  Globe,
  Palette,
  Wrench,
  Search,
  MessageSquare,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Users,
  Briefcase,
  Moon,
  Sun
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Logo } from "@/components/shared/Logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useServiceRole } from "@/hooks/useServiceRole";

type Vertical = "programmer" | "translator" | "designer" | "home" | "generic";

export function ServicesVerticalHeader() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isProvider } = useServiceRole();
  const { theme, setTheme } = useTheme();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const getVertical = (): Vertical => {
    if (location.pathname.includes("/services/programmer")) return "programmer";
    if (location.pathname.includes("/services/translator")) return "translator";
    if (location.pathname.includes("/services/designer")) return "designer";
    if (location.pathname.includes("/services/home")) return "home";
    return "generic";
  };

  const currentVertical = getVertical();

  const verticalConfig: Record<Vertical, { color: string; icon: any; label: string; tag: string }> = {
    programmer: { color: "cyan", icon: Code, label: t('servicesNexus.programmer.label', 'Neural Coding'), tag: t('servicesNexus.programmer.tag', 'High-Level Architecture') },
    translator: { color: "amber", icon: Globe, label: t('servicesNexus.translator.label', 'Global Lingua'), tag: t('servicesNexus.translator.tag', 'Cultural Sync') },
    designer: { color: "violet", icon: Palette, label: t('servicesNexus.designer.label', 'Visual Identity'), tag: t('servicesNexus.designer.tag', 'Experience Engine') },
    home: { color: "emerald", icon: Wrench, label: t('servicesNexus.home.label', 'Habitat Ops'), tag: t('servicesNexus.home.tag', 'Infrastructure Sync') },
    generic: { color: "primary", icon: Briefcase, label: t('servicesNexus.generic.label', 'Global Matrix'), tag: t('servicesNexus.generic.tag', 'Full-Spectrum Services') }
  };

  const { color: activeColor, icon: Icon, label, tag } = verticalConfig[currentVertical];

  const getStyles = (color: string) => {
    const themeStyles: Record<string, { glass: string; text: string; active: string; shadow: string; border: string }> = {
      cyan: {
        glass: "bg-cyan-500/10 border-cyan-500/20",
        text: "text-cyan-500",
        active: "bg-cyan-500 text-white shadow-cyan-500/30",
        shadow: "shadow-cyan-500/10",
        border: "border-cyan-500/40"
      },
      amber: {
        glass: "bg-amber-500/10 border-amber-500/20",
        text: "text-amber-500",
        active: "bg-amber-500 text-white shadow-amber-500/30",
        shadow: "shadow-amber-500/10",
        border: "border-amber-500/40"
      },
      violet: {
        glass: "bg-violet-500/10 border-violet-500/20",
        text: "text-violet-500",
        active: "bg-violet-500 text-white shadow-violet-500/30",
        shadow: "shadow-violet-500/10",
        border: "border-violet-500/40"
      },
      emerald: {
        glass: "bg-emerald-500/10 border-emerald-500/20",
        text: "text-emerald-500",
        active: "bg-emerald-500 text-white shadow-emerald-500/30",
        shadow: "shadow-emerald-500/10",
        border: "border-emerald-500/40"
      },
      primary: {
        glass: "bg-primary/10 border-primary/20",
        text: "text-primary",
        active: "bg-primary text-white shadow-primary/30",
        shadow: "shadow-primary/10",
        border: "border-primary/40"
      }
    };
    return themeStyles[color] || themeStyles.primary;
  };

  const currentStyles = getStyles(activeColor);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-[100] transition-all duration-700 h-24 flex items-center",
      isScrolled ? "bg-background/80 backdrop-blur-[30px] border-b border-white/5 shadow-2xl" : "bg-transparent border-b border-transparent"
    )}>
      <div className="w-full px-6 lg:px-12 flex justify-between items-center gap-8">
        <Link to="/services" className="flex items-center gap-5 group">
          <div className={cn("p-3 glass transition-all duration-700 border rounded-[1.5rem] shadow-2xl", currentStyles.glass, currentStyles.shadow, "group-hover:scale-110")}>
            <Icon className={cn("h-6 w-6 transition-transform group-hover:rotate-12", currentStyles.text)} />
          </div>
          <div className="flex flex-col">
            <span className={cn("text-2xl font-black italic tracking-tighter leading-none transition-colors", `group-hover:${currentStyles.text}`)}>{label}</span>
            <span className="text-[7px] font-black uppercase tracking-[0.6em] text-foreground/20 italic">{tag}</span>
          </div>
        </Link>

        {/* Global Navigation */}
        <nav className="hidden lg:flex items-center gap-2 p-2 glass bg-white/5 border border-white/10 rounded-[2rem]">
          {[
            { path: "/services/programmer", icon: Code, c: "cyan", l: "Devs" },
            { path: "/services/translator", icon: Globe, c: "amber", l: "Linguists" },
            { path: "/services/designer", icon: Palette, c: "violet", l: "Designers" },
            { path: "/services/home", icon: Wrench, c: "emerald", l: "Maintenance" },
          ].map((item) => {
            const itemStyle = getStyles(item.c);
            return (
              <Link key={item.path} to={item.path} className={cn(
                "px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-[1.25rem] transition-all flex items-center gap-2",
                isActive(item.path) ? itemStyle.active : "text-foreground/40 hover:text-foreground hover:bg-white/5"
              )}>
                <item.icon className={cn("h-4 w-4", isActive(item.path) ? "text-white" : itemStyle.text)} />
                {item.l}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <form className="relative hidden xl:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/20" />
            <input
              type="text"
              placeholder="Search Sync..."
              className="w-48 pl-10 pr-4 py-3 bg-black/20 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:w-64 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-4 p-1 pl-4 hover:bg-white/5 transition-all group rounded-[1.5rem]">
                  <div className="flex flex-col items-end">
                    <span className={cn("text-[10px] font-black uppercase tracking-widest leading-none", `group-hover:${currentStyles.text}`)}>{user.user_metadata.full_name?.split(" ")[0]}</span>
                    <span className="text-[7px] font-black uppercase tracking-widest text-foreground/20 italic">ID: {user.id.slice(0, 4)}</span>
                  </div>
                  <Avatar name={user.user_metadata.full_name} src={user.user_metadata.avatar_url} className={cn("w-12 h-12 rounded-2xl border-2 transition-all shadow-xl", `group-hover:${currentStyles.border}`)} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 glass rounded-[2.5rem] border-white/20 p-2 shadow-2xl backdrop-blur-3xl">
                <DropdownMenuLabel className="p-5 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", currentStyles.text.replace('text-', 'bg-'))} />
                    <p className="text-sm font-black italic tracking-tighter uppercase">{user.user_metadata.full_name}</p>
                  </div>
                  <p className="text-[10px] font-medium text-foreground/40 pl-4">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem asChild className={cn("rounded-2xl p-4 transition-all hover:translate-x-2", currentStyles.active.split(' ').slice(0, 1).join('').replace('bg-', 'focus:bg-').concat('/10 focus:text-inherit'))}>
                   <Link to="/services/dashboard" className="flex items-center">
                      <LayoutDashboard className="mr-3 h-4 w-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Dashboard Matrix</span>
                   </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className={cn("rounded-2xl p-4 transition-all hover:translate-x-2", currentStyles.active.split(' ').slice(0, 1).join('').replace('bg-', 'focus:bg-').concat('/10 focus:text-inherit'))}>
                   <Link to="/profile" className="flex items-center">
                      <Users className="mr-3 h-4 w-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Citizen Profile</span>
                   </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem onClick={handleLogout} className="rounded-2xl p-4 text-rose-500 focus:bg-rose-500/10 transition-all">
                   <LogOut className="mr-3 h-4 w-4" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Terminate Session</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate("/login")} className="text-[10px] font-black uppercase tracking-widest text-foreground/40 hover:text-foreground">Authorize</Button>
              <Button onClick={() => navigate("/services/provider/signup")} className={cn("text-white rounded-2xl h-12 px-8 text-[10px] font-black uppercase tracking-widest shadow-2xl transition-all", currentStyles.active)}>Initiate Profile</Button>
            </div>
          )}

          <Button variant="ghost" className="w-12 h-12 rounded-2xl glass bg-white/5 border border-white/10" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5 text-amber-500" />}
          </Button>

          <Button variant="ghost" className="lg:hidden w-12 h-12 glass border-white/10 rounded-2xl" onClick={() => setIsMobileMenuOpen(true)}>
             <Menu size={24} />
          </Button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[200]">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsMobileMenuOpen(false)} />
           <div className="absolute top-0 right-0 h-full w-[300px] glass bg-black/40 border-l border-white/10 p-10 flex flex-col gap-8 animate-slide-in-right">
              <Logo size="lg" />
              <nav className="flex flex-col gap-4 mt-8">
                 {[
                   { path: "/services/programmer", icon: Code, label: "Neural Coding" },
                   { path: "/services/translator", icon: Globe, label: "Global Lingua" },
                   { path: "/services/designer", icon: Palette, label: "Visual Identity" },
                   { path: "/services/home", icon: Wrench, label: "Habitat Ops" },
                 ].map(item => (
                   <Link key={item.path} to={item.path} onClick={() => setIsMobileMenuOpen(false)} className="p-5 glass rounded-2xl flex items-center gap-4 text-[12px] font-black uppercase tracking-widest text-foreground/60 hover:text-primary transition-all">
                      <item.icon className="h-5 w-5" />
                      {item.label}
                   </Link>
                 ))}
              </nav>
           </div>
        </div>
      )}
    </header>
  );
}
