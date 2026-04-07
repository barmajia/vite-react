import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the hash from URL (Supabase returns data in hash)
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.substring(1));

        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        const errorCode = params.get("error");
        const errorDescription = params.get("error_description");
        const type = params.get("type"); // recovery, invite, signup, etc.

        // Handle OAuth errors
        if (errorCode) {
          setError(t("auth.googleAuthFailed"));
          toast.error(t("auth.googleAuthFailed"));
          setIsProcessing(false);
          return;
        }

        // Handle recovery type (password reset link)
        if (type === "recovery") {
          // Check if we have a session from the recovery link
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session) {
            // Valid recovery session - redirect to update password
            navigate("/update-password", { replace: true });
          } else {
            // No session - redirect to forgot password to request new link
            toast.error(
              "Password reset link is invalid or has expired. Please request a new one.",
            );
            navigate("/forgot-password", { replace: true });
          }
          return;
        }

        // Handle invite type
        if (type === "invite") {
          if (accessToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || "",
            });

            if (error) throw error;

            toast.success("You've been invited to join Aurora!");
            navigate("/signup", { replace: true });
          } else {
            navigate("/signup", { replace: true });
          }
          return;
        }

        // Handle signup type (email verification)
        if (type === "signup") {
          toast.success("Email verified successfully! Please sign in.");
          navigate("/login", { replace: true });
          return;
        }

        // Handle OAuth access token (Google, etc.)
        if (accessToken) {
          // Set the session from the OAuth callback
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || "",
          });

          if (error) {
            throw error;
          }

          // Check if this is a Google signup with account_type
          const storedAccountType = sessionStorage.getItem(
            "google_signup_account_type",
          );

          if (storedAccountType) {
            const {
              data: { user },
            } = await supabase.auth.getUser();

            if (user && !user.user_metadata?.account_type) {
              await supabase.auth.updateUser({
                data: { account_type: storedAccountType },
              });
            }

            sessionStorage.removeItem("google_signup_account_type");
            toast.success("Signed up with Google successfully!");

            // Redirect to complete profile page
            navigate("/complete-profile", { replace: true });
            return;
          } else {
            toast.success(t("auth.googleAuthSuccess"));
          }

          // Check user role and redirect appropriately
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (user) {
            // Check if user has a service provider profile
            const { data: provider } = await supabase
              .from("svc_providers")
              .select("id, status")
              .eq("user_id", user.id)
              .single();

            if (provider) {
              if (provider.status === "pending_review") {
                navigate("/services/dashboard/pending");
                return;
              }
              navigate("/services/dashboard");
              return;
            }
          }

          // Default redirect
          navigate("/services");
          return;
        }

        // If no access token, try to get existing session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          navigate("/services");
        } else {
          navigate("/login");
        }
      } catch (err) {
        console.error("Auth callback error:", err);

        // Provide more specific error messages
        if (err instanceof Error) {
          const msg = err.message.toLowerCase();
          if (msg.includes("expired") || msg.includes("invalid")) {
            toast.error(
              "This link has expired or is invalid. Please request a new one.",
            );
          } else {
            toast.error(t("auth.googleAuthFailed"));
          }
        } else {
          toast.error(t("auth.googleAuthFailed"));
        }

        setError(t("auth.signInFailed"));
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [navigate, t]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-blue-50 via-white to-brand-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="text-center">
        {isProcessing ? (
          <>
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-indigo-600" />
            <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
              {t("auth.completingSignIn")}
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {t("auth.pleaseWait")}
            </p>
          </>
        ) : error ? (
          <>
            <XCircle className="h-12 w-12 mx-auto text-red-500" />
            <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
              {t("auth.signInFailed")}
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">{error}</p>
            <button
              onClick={() => navigate("/login")}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              {t("auth.backToLogin")}
            </button>
          </>
        ) : (
          <>
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
            <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
              {t("auth.signInSuccess")}
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {t("auth.redirecting")}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
