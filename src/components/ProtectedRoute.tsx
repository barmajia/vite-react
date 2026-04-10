import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Lock } from "lucide-react";
import { isValidReturnUrl } from "@/lib/security";

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
 * Includes open redirect protection.
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
  const { user, profile, loading } = useAuth();
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
    const destination = location.pathname + location.search + location.hash;

    // Only set returnTo if it's a valid relative URL (open redirect protection)
    if (isValidReturnUrl(destination)) {
      const returnTo = encodeURIComponent(destination);
      return <Navigate to={`${redirectTo}?returnTo=${returnTo}`} replace />;
    }

    // Invalid destination - just redirect to login
    return <Navigate to={redirectTo} replace />;
  }

  // Check account type restriction
  if (allowedAccountTypes && allowedAccountTypes.length > 0) {
    // Use profile.account_type from database (fresh) instead of user_metadata (stale JWT)
    // account_type can be an array like ['user', 'seller'] or a single string
    const rawAccountType =
      profile?.account_type || user.user_metadata?.account_type;
    const accountTypes = Array.isArray(rawAccountType)
      ? rawAccountType
      : [rawAccountType];

    // Check if ANY of the user's types matches ANY of the allowed types
    const hasAccess = accountTypes.some(
      (type) => type && allowedAccountTypes.includes(type),
    );

    if (!hasAccess) {
      // Log access denial for audit purposes
      console.warn(
        `[ProtectedRoute] Access denied: user ${user.id.slice(0, 8)}... ` +
          `with types [${accountTypes.join(", ")}] ` +
          `tried to access [${allowedAccountTypes.join(", ")}] ` +
          `at ${location.pathname}`,
      );

      return (
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center max-w-md p-8">
            <Lock className="w-16 h-16 mx-auto mb-4 text-destructive" />
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
