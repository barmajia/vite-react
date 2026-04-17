import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { SellerDashboardHeader } from "@/components/layout/SellerDashboardHeader";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const noLayoutRoutes = [
  "/login",
  "/signup",
  "/signup/middleman",
  "/auth/callback",
  "/forgot-password",
  "/update-password",
  "/complete-profile",
];

export function Layout() {
  const location = useLocation();
  useAuth();

  const showLayout = !noLayoutRoutes.some((route) =>
    location.pathname.startsWith(route),
  );
  const isServicesRoute = location.pathname.startsWith("/services");
  const isHealthRoute =
    location.pathname.startsWith("/health") ||
    location.pathname.startsWith("/pharmacy") ||
    location.pathname.startsWith("/hospital") ||
    location.pathname.startsWith("/doctor");

  // Check if current route is a middleman route (has its own header)
  const isMiddlemanRoute = location.pathname.startsWith("/middleman");

  // Check if current route is a seller dashboard route
  const isSellerRoute =
    location.pathname.startsWith("/seller") ||
    location.pathname.startsWith("/dashboard") ||
    location.pathname.startsWith("/onboarding");

  // Check if current route is a factory route
  const isFactoryRoute = location.pathname.startsWith("/factory");

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header logic: Standalone modules (Seller, Factory, Middleman, Services, Health) handle their own headers */}
      {showLayout &&
        !isHealthRoute &&
        !isServicesRoute &&
        !isMiddlemanRoute &&
        !isFactoryRoute &&
        !isSellerRoute && (
          <Header />
        )}
      <main
        className={cn(
          "flex-1",
          isServicesRoute || isHealthRoute || isMiddlemanRoute || isFactoryRoute || isSellerRoute
            ? "pt-0"
            : "pt-24",
        )}
      >
        <Outlet />
      </main>
      {showLayout &&
        !isServicesRoute &&
        !isSellerRoute &&
        !isMiddlemanRoute && <Footer />}
    </div>
  );
}
