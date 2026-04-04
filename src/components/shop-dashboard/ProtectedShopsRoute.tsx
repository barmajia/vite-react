import { useEffect, useState } from "react";
import { Navigate, Outlet, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

type AuthState = "loading" | "unauthenticated" | "authenticated";
type ShopState = "loading" | "ready" | "needs-setup";

export function ProtectedShopsRoute() {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [shopState, setShopState] = useState<ShopState>("loading");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    async function init() {
      // 1. Check authentication
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setAuthState("unauthenticated");
        return;
      }

      setAuthState("authenticated");

      // 2. Fetch user profile to get account_type
      const { data: profile } = await supabase
        .from("users")
        .select("account_type")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!profile) {
        // User profile doesn't exist, redirect to signup
        navigate("/signup", { state: { redirect: location.pathname } });
        return;
      }

      // 3. Ensure shop exists (auto-creates if missing)
      await supabase.rpc("ensure_shop_exists");

      // 4. Check shop status
      const { data: shop } = await supabase
        .from("shops")
        .select("id, status, shop_type, template_id")
        .eq("owner_id", session.user.id)
        .maybeSingle();

      if (!shop || shop.status !== "active") {
        setShopState("needs-setup");
        // Redirect to setup wizard
        navigate("/shops/setup", { replace: true });
      } else {
        setShopState("ready");
      }
    }

    init();
  }, [navigate, location]);

  if (authState === "loading" || shopState === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Loading your shop...
          </p>
        </div>
      </div>
    );
  }

  if (authState === "unauthenticated") {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  return <Outlet />;
}
