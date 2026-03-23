import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Briefcase,
  ShoppingBag,
  ArrowRight,
  Star,
  Users,
  Zap,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

export function ServicesGateway() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 pt-20">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0f172a] to-[#1e293b] dark:from-blue-600 dark:to-blue-800 flex items-center justify-center shadow-lg shadow-slate-900/30 dark:shadow-blue-500/50">
              <Briefcase className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-[#0f172a] to-[#1e293b] dark:from-blue-600 dark:to-blue-800 bg-clip-text text-transparent">
            {t("gateway.welcomeTitle")}
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            {t("gateway.welcomeSubtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/services")}
              className="text-lg px-8 bg-gradient-to-r from-[#0f172a] to-[#1e293b] dark:from-blue-600 dark:to-blue-800 hover:from-[#0f172a]/90 hover:to-[#1e293b]/90 dark:hover:from-blue-700 dark:hover:to-blue-900 text-white shadow-lg shadow-slate-900/30 dark:shadow-blue-500/50"
            >
              {t("gateway.findServices")}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/products")}
              className="text-lg px-8 border-2 border-[#0f172a] dark:border-blue-600 text-[#0f172a] dark:text-blue-600 hover:bg-gray-100 dark:hover:bg-blue-50"
            >
              <ShoppingBag className="mr-2 h-5 w-5" />
              {t("gateway.shopProducts")}
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-16">
          <Card
            className="group cursor-pointer hover:shadow-2xl transition-all duration-300 border-2 hover:border-[#0f172a] dark:hover:border-blue-500 overflow-hidden"
            onClick={() => navigate("/services")}
          >
            <CardContent className="p-0">
              <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] dark:from-blue-600 dark:to-blue-800 p-8 text-white relative">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:linear-gradient(to_bottom_right,transparent,black_30%,black_70%,transparent)] pointer-events-none" />
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6 shadow-lg">
                    <Briefcase className="h-10 w-10" />
                  </div>
                  <h2 className="text-3xl font-bold mb-4">
                    {t("gateway.hireExperts")}
                  </h2>
                  <p className="text-white/90 mb-6">
                    {t("gateway.hireExpertsDesc")}
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-300" />
                      <span>{t("gateway.devDesigners")}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-300" />
                      <span>{t("gateway.medicalConsult")}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-amber-300" />
                      <span>{t("gateway.quickTurnaround")}</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="p-6 bg-background">
                <Button
                  className="w-full bg-gradient-to-br from-[#0f172a] to-[#1e293b] dark:from-blue-600 dark:to-blue-800 hover:from-[#0f172a]/90 hover:to-[#1e293b]/90 dark:hover:from-blue-700 dark:hover:to-blue-900 text-white font-semibold shadow-lg shadow-slate-900/30 dark:shadow-blue-500/50 relative overflow-hidden"
                  size="lg"
                >
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[size:16px_16px] [mask-image:linear-gradient(to_bottom_right,transparent,black_40%,black)] pointer-events-none" />
                  <span className="relative">
                    {t("gateway.exploreServices")}
                  </span>
                  <ArrowRight className="ml-2 h-5 w-5 relative" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card
            className="group cursor-pointer hover:shadow-2xl transition-all duration-300 border-2 hover:border-[#0f172a] dark:hover:border-blue-500 overflow-hidden"
            onClick={() => navigate("/products")}
          >
            <CardContent className="p-0">
              <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] dark:from-blue-600 dark:to-blue-800 p-8 text-white relative">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:linear-gradient(to_bottom_right,transparent,black_30%,black_70%,transparent)] pointer-events-none" />
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6 shadow-lg">
                    <ShoppingBag className="h-10 w-10" />
                  </div>
                  <h2 className="text-3xl font-bold mb-4">
                    {t("gateway.shopProductsCard")}
                  </h2>
                  <p className="text-white/90 mb-6">
                    {t("gateway.shopProductsDesc")}
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-300" />
                      <span>{t("gateway.electronicsMore")}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-300" />
                      <span>{t("gateway.trustedSellers")}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-amber-300" />
                      <span>{t("gateway.fastShipping")}</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="p-6 bg-background">
                <Button
                  className="w-full bg-gradient-to-br from-[#0f172a] to-[#1e293b] dark:from-blue-600 dark:to-blue-800 hover:from-[#0f172a]/90 hover:to-[#1e293b]/90 dark:hover:from-blue-700 dark:hover:to-blue-900 text-white font-semibold shadow-lg shadow-slate-900/30 dark:shadow-blue-500/50 relative overflow-hidden"
                  size="lg"
                  variant="outline"
                >
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.15)_1px,transparent_1px)] bg-[size:16px_16px] [mask-image:linear-gradient(to_bottom_right,transparent,black_40%,black)] pointer-events-none" />
                  <span className="relative">
                    {t("gateway.browseProducts")}
                  </span>
                  <ArrowRight className="ml-2 h-5 w-5 relative" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {!user && (
          <div className="text-center max-w-2xl mx-auto">
            <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4">
                  {t("gateway.serviceProvider")}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {t("gateway.serviceProviderDesc")}
                </p>
                <Button size="lg" onClick={() => navigate("/signup")}>
                  {t("gateway.becomeProvider")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="text-center mt-16 text-sm text-muted-foreground">
          <p>
            {t("gateway.alreadyHaveAccount")}{" "}
            <Link
              to="/login"
              className="text-[#0f172a] dark:text-blue-600 hover:underline font-medium"
            >
              {t("gateway.signIn")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
