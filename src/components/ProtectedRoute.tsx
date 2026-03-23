import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Optional: restrict to specific account types */
  allowedAccountTypes?: string[];
  /** Optional: custom redirect path (default: /login) */
  redirectTo?: string;
}

/**
 * Route guard component that redirects unauthenticated users to login.
 * Preserves the intended destination via `returnTo` query parameter.
 *
 * Usage:
 *   <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
 *   <Route path="/factory/*" element={<ProtectedRoute allowedAccountTypes={["factory"]}><FactoryDashboard /></ProtectedRoute>} />
 */
export function ProtectedRoute({
  children,
  allowedAccountTypes,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while auth state resolves
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-accent border-t-transparent" />
          <p className="text-sm text-muted-foreground">Verifying access…</p>
        </div>
      </div>
    );
  }

  // Redirect unauthenticated users
  if (!user) {
    const returnTo = encodeURIComponent(
      location.pathname + location.search + location.hash,
    );
    return <Navigate to={`${redirectTo}?returnTo=${returnTo}`} replace />;
  }

  // Check account type restriction
  if (allowedAccountTypes && allowedAccountTypes.length > 0) {
    const accountType = user.user_metadata?.account_type;
    if (!accountType || !allowedAccountTypes.includes(accountType)) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center max-w-md p-8">
            <div className="text-5xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-6">
              You don't have permission to access this page. This area is
              restricted to {allowedAccountTypes.join(" / ")} accounts.
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
