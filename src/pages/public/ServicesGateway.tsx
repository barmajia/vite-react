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
import { Logo } from "@/components/shared/Logo";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

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
        <LoadingSpinner size="lg" showLogo text="Loading Aurora..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 pt-20">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-5xl mx-auto mb-16">
          <div className="flex justify-center mb-6 w-22 h-22">
            <Logo
              size="xl"
              showText={false}
              className="hover:scale-150 transition-transform duration-300 w-24 h-24"
            />
          </div>
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-gray-200 bg-clip-text text-transparent">
            {t("gateway.welcomeTitle")}
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            {t("gateway.welcomeSubtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/services")}
              className="text-lg px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
            >
              {t("gateway.findServices")}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/products")}
              className="text-lg px-8 border-2 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              <ShoppingBag className="mr-2 h-5 w-5" />
              {t("gateway.shopProducts")}
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-16">
          <Card
            className="group cursor-pointer hover:shadow-2xl transition-all duration-300 border-2 hover:border-blue-500 dark:hover:border-blue-400 overflow-hidden"
            onClick={() => navigate("/services")}
          >
            <CardContent className="p-0">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-8 text-white relative">
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
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
                  size="lg"
                >
                  {t("gateway.exploreServices")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card
            className="group cursor-pointer hover:shadow-2xl transition-all duration-300 border-2 hover:border-blue-500 dark:hover:border-blue-400 overflow-hidden"
            onClick={() => navigate("/products")}
          >
            <CardContent className="p-0">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-8 text-white relative">
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
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
                  size="lg"
                  variant="outline"
                >
                  {t("gateway.browseProducts")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {!user && (
          <div className="text-center max-w-2xl mx-auto">
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                  {t("gateway.serviceProvider")}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {t("gateway.serviceProviderDesc")}
                </p>
                <Button
                  size="lg"
                  onClick={() => navigate("/signup")}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30"
                >
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
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              {t("gateway.signIn")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
