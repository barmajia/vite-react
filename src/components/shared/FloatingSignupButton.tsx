import { useNavigate, useLocation } from "react-router-dom";
import { Sparkles, ChevronUp } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";

// Pages where the floating button should NOT appear
const HIDDEN_ROUTES = [
  ROUTES.LOGIN,
  ROUTES.SIGNUP,
  "/seller/login",
  "/seller/signup",
  "/factory/login",
  "/middleman/login",
  "/auth/callback",
  "/complete-profile",
];

export function FloatingSignupButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Hide on auth pages and when user is logged in
  const shouldHide =
    user || HIDDEN_ROUTES.some((route) => location.pathname.startsWith(route));

  // Show button after scrolling down
  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 200);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-hide expanded menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setIsExpanded(false);
    if (isExpanded) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [isExpanded]);

  if (shouldHide || !isVisible) return null;

  const handleMainClick = () => {
    navigate(ROUTES.SIGNUP);
    setIsExpanded(false);
  };

  const handleRoleClick = (role: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const routes: Record<string, string> = {
      customer: ROUTES.SIGNUP,
      seller: "/seller/signup",
      factory: "/services/signup?role=factory",
      middleman: "/signup/middleman",
    };
    navigate(routes[role] || ROUTES.SIGNUP);
    setIsExpanded(false);
  };

  return (
    <div
      className={cn(
        "fixed bottom-8 right-8 z-[9999] transition-all duration-500",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0",
      )}
    >
      <div className="relative">
        {/* Expanded Menu */}
        {isExpanded && (
          <div className="absolute bottom-20 right-0 w-64 glass p-3 rounded-[2rem] shadow-2xl border-white/10 animate-in fade-in zoom-in-95 duration-300">
            <div className="px-3 py-2 mb-2">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/60 italic">
                Choose your role to join
              </p>
            </div>
            <button
              onClick={(e) => handleRoleClick("customer", e)}
              className="w-full flex items-center gap-3 p-3 mb-1 rounded-xl hover:bg-white/5 transition-all duration-300 group"
            >
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-xs font-bold italic">Customer</p>
                <p className="text-[9px] text-muted-foreground/60 uppercase tracking-tight">
                  Start shopping
                </p>
              </div>
            </button>
            <button
              onClick={(e) => handleRoleClick("seller", e)}
              className="w-full flex items-center gap-3 p-3 mb-1 rounded-xl hover:bg-white/5 transition-all duration-300 group"
            >
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Sparkles className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-xs font-bold italic">Seller</p>
                <p className="text-[9px] text-muted-foreground/60 uppercase tracking-tight">
                  Sell products
                </p>
              </div>
            </button>
            <button
              onClick={(e) => handleRoleClick("factory", e)}
              className="w-full flex items-center gap-3 p-3 mb-1 rounded-xl hover:bg-white/5 transition-all duration-300 group"
            >
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Sparkles className="h-4 w-4 text-blue-500" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-xs font-bold italic">Factory</p>
                <p className="text-[9px] text-muted-foreground/60 uppercase tracking-tight">
                  Manufacture & supply
                </p>
              </div>
            </button>
            <button
              onClick={(e) => handleRoleClick("middleman", e)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all duration-300 group"
            >
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Sparkles className="h-4 w-4 text-amber-500" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-xs font-bold italic">Middleman</p>
                <p className="text-[9px] text-muted-foreground/60 uppercase tracking-tight">
                  Connect & earn
                </p>
              </div>
            </button>
          </div>
        )}

        {/* Main Button */}
        <button
          onClick={handleMainClick}
          onDoubleClick={() => setIsExpanded(!isExpanded)}
          className="group relative h-14 w-14 bg-gradient-to-br from-primary to-blue-600 text-white rounded-2xl shadow-2xl shadow-primary/30 hover:scale-110 active:scale-95 transition-all duration-500 overflow-hidden"
          aria-label="Sign up"
        >
          {/* Shimmer Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

          {/* Icon */}
          <div className="relative z-10 flex items-center justify-center h-full">
            {isExpanded ? (
              <ChevronUp className="h-6 w-6 animate-in fade-in duration-300" />
            ) : (
              <Sparkles className="h-6 w-6 animate-pulse" />
            )}
          </div>

          {/* Pulse Ring */}
          <div className="absolute inset-0 rounded-2xl bg-primary/20 animate-ping opacity-50" />
        </button>

        {/* Tooltip */}
        {!isExpanded && (
          <div className="absolute -top-10 right-0 px-3 py-1.5 glass bg-white/10 border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 duration-500">
            Join Aurora
            <div className="absolute -bottom-1 right-6 w-2 h-2 bg-white/10 rotate-45 border-r border-b border-white/10" />
          </div>
        )}
      </div>
    </div>
  );
}
