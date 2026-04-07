import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Header } from "@/components/layout/Header";
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

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      {showLayout && !isHealthRoute && !isServicesRoute && <Header />}
      <main
        className={cn(
          "flex-1",
          isServicesRoute || isHealthRoute ? "pt-0" : "pt-24",
        )}
      >
        <Outlet />
      </main>
      {showLayout && !isServicesRoute && <Footer />}
    </div>
  );
}
