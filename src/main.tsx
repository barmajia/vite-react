import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import "./index.css";
import "./i18n/config"; // Initialize i18next
import { RTL_LANGUAGES, LANGUAGE_STORAGE_KEY } from "./i18n/config";

// Apply saved language direction on initial load
function applyStoredLanguage() {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored) {
    document.documentElement.lang = stored;
    document.documentElement.dir = RTL_LANGUAGES.includes(stored) ? "rtl" : "ltr";
  }
}
applyStoredLanguage();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
