import { Link, useNavigate, useLocation, Outlet, Navigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  User,
  LogOut,
  Store,
  Sparkles,
  ChevronDown,
  Menu,
  X,
  ShieldAlert,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/Logo";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SellerProfile = {
  user_id: string;
  full_name: string;
  store_name: string | null;
  account_type: string;
};

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  prefix: string;
};

// ---------------------------------------------------------------------------
// Navigation config
// ---------------------------------------------------------------------------

const SELLER_NAV: NavItem[] = [
  { label: "Dashboard", href: "/seller", icon: LayoutDashboard, prefix: "/seller" },
  { label: "Products", href: "/seller/products", icon: Package, prefix: "/seller/products" },
  { label: "Orders", href: "/seller/orders", icon: ShoppingCart, prefix: "/seller/orders" },
  { label: "Profile", href: "/seller/profile", icon: User, prefix: "/seller/profile" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SellerLayout() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // ---- 1. Redirect if not authenticated -----------------------------------
  if (loading) {
    return <AuthLoadingState />;
  }

  if (!user) {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />;
  }

  // ---- 2. Verify seller role (not factory, not customer) ------------------
  // We check both the cached Nexus profile and the DB for the authoritative value.
  if (profileLoading) {
    return <AuthLoadingState />;
  }

  const accountType = profile?.account_type ?? user.user_metadata?.account_type;

  if (!accountType || accountType !== "seller") {
    return <Navigate to="/unauthorized" replace />;
  }

  // ---- 3. Fetch seller profile on mount -----------------------------------
  useEffect(() => {
    let cancelled = false;

    const fetchProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("users")
          .select("user_id, full_name, account_type")
          .eq("user_id", user.id)
          .maybeSingle();

        if (cancelled) return;

        if (error || !data) {
          // Fall back to auth metadata
          setProfile({
            user_id: user.id,
            full_name: user.user_metadata?.full_name || "Seller",
            store_name: null,
            account_type: user.user_metadata?.account_type || "unknown",
          });
        } else {
          setProfile({
            user_id: data.user_id,
            full_name: data.full_name || user.user_metadata?.full_name || "Seller",
            store_name: null,
            account_type: data.account_type || user.user_metadata?.account_type,
          });
        }
      } catch {
        if (!cancelled) {
          setProfile({
            user_id: user.id,
            full_name: user.user_metadata?.full_name || "Seller",
            store_name: null,
            account_type: user.user_metadata?.account_type || "unknown",
          });
        }
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    };

    fetchProfile();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // ---- 4. Close dropdowns on route change ---------------------------------
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname]);

  // ---- 5. Close dropdown on outside click ---------------------------------
  useEffect(() => {
    if (!userDropdownOpen) return;

    const handler = () => setUserDropdownOpen(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [userDropdownOpen]);

  // ---- 6. Handle sign out -------------------------------------------------
  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await signOut();
      navigate("/login");
    } catch {
      // Navigation still happens via signOut internals
    } finally {
      setSigningOut(false);
    }
  };

  // ---- 7. Render ----------------------------------------------------------
  const displayName = profile?.full_name ?? user.user_metadata?.full_name ?? "SELLER_NODE";
  const currentPath = location.pathname;

  return (
    <div className="min-h-screen bg-background relative">
      {/* Aurora background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-primary/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-violet-500/5 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      {/* ---- Top Header Bar ---- */}
      <header className="fixed top-0 left-0 right-0 z-[100] py-2 bg-background/40 backdrop-blur-3xl border-b border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo + Title */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute -inset-2 bg-primary/20 rounded-full blur-xl opacity-60" />
                <Logo size="md" showText={false} />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black italic tracking-tighter leading-none text-primary">
                  AURORA
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 leading-none mt-1">
                  Seller Hub
                </span>
              </div>
            </div>

            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center gap-2">
              {SELLER_NAV.map((item) => {
                const isActive =
                  currentPath === item.href ||
                  (item.prefix !== "/seller" && currentPath.startsWith(item.prefix));

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "relative px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all duration-500 overflow-hidden group flex items-center gap-2",
                      isActive
                        ? "text-primary bg-primary/5 shadow-inner border border-primary/20"
                        : "text-foreground/60 hover:text-foreground hover:bg-white/5 border border-transparent",
                    )}
                  >
                    <item.icon className="h-3.5 w-3.5 opacity-60" />
                    <span className="relative z-10">{item.label}</span>
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-50" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right-side actions */}
            <div className="flex items-center gap-3">
              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-3 glass bg-white/5 hover:bg-white/10 text-foreground/60 hover:text-foreground rounded-2xl transition-all duration-500 border border-white/10 active:scale-95"
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>

              {/* User dropdown */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setUserDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-3 glass bg-white/5 border-white/10 hover:bg-white/10 p-2 rounded-2xl transition-all duration-500 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/20 border-2 border-white/20 shadow-xl flex items-center justify-center">
                    <Store className="h-5 w-5 text-primary" />
                  </div>
                  <div className="hidden lg:flex flex-col items-start pr-2">
                    <span className="text-[10px] font-black italic tracking-tight">
                      {displayName}
                    </span>
                    <span className="text-[8px] font-black uppercase tracking-widest text-primary/60">
                      Seller Node
                    </span>
                  </div>
                  <ChevronDown
                    size={14}
                    className="hidden lg:block text-muted-foreground/60 transition-transform group-data-[state=open]:rotate-180"
                  />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 glass p-4 rounded-[2rem] shadow-2xl border-white/10 animate-in fade-in slide-in-from-top-4 duration-300 z-[120]">
                    <div className="flex items-center gap-3 p-3 mb-3 border-b border-white/5">
                      <div className="w-12 h-12 rounded-2xl bg-primary/20 border-2 border-white/10 flex items-center justify-center flex-shrink-0">
                        <Store className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black italic tracking-tight truncate">
                          {displayName}
                        </p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1">
                      {SELLER_NAV.map((item) => (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex flex-col items-center justify-center gap-2 h-20 cursor-pointer glass hover:bg-primary/20 hover:text-primary rounded-2xl transition-all duration-500 border-white/5 active:scale-95 text-foreground/60"
                        >
                          <item.icon className="h-5 w-5 opacity-60" />
                          <span className="text-[9px] font-black uppercase tracking-widest">
                            {item.label}
                          </span>
                        </Link>
                      ))}
                    </div>

                    <button
                      onClick={handleSignOut}
                      disabled={signingOut}
                      className={cn(
                        "w-full mt-3 cursor-pointer text-rose-500 focus:text-white focus:bg-rose-500/80 rounded-[1.5rem] py-4 flex items-center justify-center font-black uppercase tracking-[0.3em] text-[10px] transition-all border border-white/5 hover:bg-rose-500/10 disabled:opacity-50 disabled:cursor-not-allowed",
                      )}
                    >
                      {signingOut ? (
                        <span className="animate-pulse">Signing out...</span>
                      ) : (
                        <>
                          <LogOut className="h-4 w-4 mr-2" />
                          Sign Out
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ---- Mobile Slide-out Menu ---- */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[110] md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-72 glass border-l border-white/10 p-6 pt-20 shadow-2xl animate-in slide-in-from-right duration-300">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl hover:bg-white/10 transition-colors"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/5">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 border-2 border-white/10 flex items-center justify-center">
                <Store className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-black italic tracking-tight">{displayName}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">
                  Seller Node
                </p>
              </div>
            </div>

            <nav className="space-y-1">
              {SELLER_NAV.map((item) => {
                const isActive =
                  currentPath === item.href ||
                  (item.prefix !== "/seller" && currentPath.startsWith(item.prefix));

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-4 rounded-2xl transition-all duration-500 text-sm font-bold",
                      isActive
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-foreground/60 hover:bg-white/5 hover:text-foreground border border-transparent",
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="w-full mt-6 flex items-center justify-center gap-2 py-4 rounded-2xl text-rose-500 hover:bg-rose-500/10 border border-white/5 transition-all duration-500 font-black uppercase tracking-[0.2em] text-[10px] disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              {signingOut ? "Signing out..." : "Sign Out"}
            </button>
          </div>
        </div>
      )}

      {/* ---- Main Content ---- */}
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Loading skeleton shown while auth state or profile is being resolved */
function AuthLoadingState() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="absolute -inset-4 bg-primary/20 rounded-full blur-xl animate-pulse" />
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent relative z-10" />
        </div>
        <p className="text-sm text-muted-foreground font-black uppercase tracking-[0.2em]">
          Verifying seller access…
        </p>
      </div>
    </div>
  );
}

/** Unauthorized state shown when user role is not seller */
function SellerUnauthorizedState() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md p-8 glass rounded-[2rem] border-white/10 shadow-2xl">
        <div className="relative inline-block mb-6">
          <div className="absolute -inset-4 bg-rose-500/20 rounded-full blur-xl animate-pulse" />
          <ShieldAlert className="w-16 h-16 text-rose-500 relative z-10" />
        </div>
        <h2 className="text-2xl font-black italic tracking-tighter mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-6 text-sm">
          Seller access is required. Your account does not have the seller role.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/"
            className="px-6 py-3 glass bg-white/5 border-white/10 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-white/10 transition-all duration-500"
          >
            Go Home
          </Link>
          <Link
            to="/login"
            className="px-6 py-3 bg-primary/20 border border-primary/20 rounded-2xl text-sm font-black uppercase tracking-widest text-primary hover:bg-primary/30 transition-all duration-500"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export { SellerUnauthorizedState };
