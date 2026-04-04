import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { AuthProvider } from "@/hooks/useAuth";
import { PreferencesProvider } from "@/context/PreferencesContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { useTranslation } from "react-i18next";
import { useAppRoutes } from "@/routes";

function App() {
  const { t } = useTranslation();
  const routes = useAppRoutes();

  return (
    <ThemeProvider>
      <AuthProvider>
        <PreferencesProvider>
          <CurrencyProvider>
            <Toaster position="top-right" richColors />
            <ErrorBoundary
              fallback={
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">
                      {t("common.error")}
                    </h1>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded"
                    >
                      {t("common.refreshPage")}
                    </button>
                  </div>
                </div>
              }
            >
              <CookieConsentBanner />
              {routes}
            </ErrorBoundary>
          </CurrencyProvider>
        </PreferencesProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
