import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { parseAuthHash, type AuthHashParams } from "@/utils/authHash";
import { runAuthFlow } from "@/services/authFlow";
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
        // Use centralized parser and flow resolver
        const hashParams = parseAuthHash(window.location.hash);
        const flow = await runAuthFlow(hashParams, supabase);

        if (flow.path) {
          navigate(flow.path, { replace: true });
        }
        if (flow.toast) {
          if (flow.toastType === "success") toast.success(flow.toast);
          else toast.error(flow.toast);
        }
        setIsProcessing(false);
      } catch (err) {
        console.error("Auth callback error:", err);
        // Fallback error messaging
        setError(t("auth.signInFailed"));
        toast.error(t("auth.googleAuthFailed"));
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
