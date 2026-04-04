import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Lock, Shield } from "lucide-react";

interface SecureRoomProps {
  children: React.ReactNode;
  requiredRole?: "customer" | "seller" | "driver" | "middleman" | "admin";
  fallback?: React.ReactNode;
}

export default function SecureRoom({
  children,
  requiredRole,
  fallback,
}: SecureRoomProps) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    checkAuthorization();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requiredRole]);

  const checkAuthorization = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsAuthorized(false);
        setLoading(false);
        return;
      }

      // Get user's account type/role
      const { data: userData } = await supabase
        .from("users")
        .select("account_type")
        .eq("user_id", user.id)
        .single();

      const role = userData?.account_type || "customer";
      setUserRole(role);

      if (requiredRole) {
        setIsAuthorized(role === requiredRole);
      } else {
        setIsAuthorized(true);
      }
    } catch (error) {
      console.error("Authorization check failed:", error);
      setIsAuthorized(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthorized) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Alert variant="destructive" className="bg-red-50 border-red-200">
        <Lock className="h-4 w-4" />
        <AlertDescription className="ml-2">
          <p className="font-medium">Access Denied</p>
          <p className="text-sm text-red-700">
            {requiredRole
              ? `This area is restricted to ${requiredRole}s only.`
              : "You do not have permission to access this area."}
            {userRole && (
              <span className="block mt-1">
                Your current role: <strong>{userRole}</strong>
              </span>
            )}
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}

interface SecurityBadgeProps {
  level?: "basic" | "enhanced" | "maximum";
}

export function SecurityBadge({ level = "basic" }: SecurityBadgeProps) {
  const config = {
    basic: {
      icon: Shield,
      label: "Secure",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    enhanced: {
      icon: Lock,
      label: "Enhanced Security",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    maximum: {
      icon: AlertCircle,
      label: "Maximum Security",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  };

  const { icon: Icon, label, color, bgColor } = config[level];

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${bgColor}`}
    >
      <Icon className={`h-4 w-4 ${color}`} />
      <span className={`text-xs font-medium ${color}`}>{label}</span>
    </div>
  );
}
