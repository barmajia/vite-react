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
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <Briefcase className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t("gateway.welcomeTitle")}
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            {t("gateway.welcomeSubtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/services")}
              className="text-lg px-8"
            >
              {t("gateway.findServices")}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/products")}
              className="text-lg px-8"
            >
              <ShoppingBag className="mr-2 h-5 w-5" />
              {t("gateway.shopProducts")}
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-16">
          <Card
            className="group cursor-pointer hover:shadow-2xl transition-all duration-300 border-2 hover:border-primary overflow-hidden"
            onClick={() => navigate("/services")}
          >
            <CardContent className="p-0">
              <div className="bg-gradient-to-br from-primary to-primary/80 p-8 text-primary-foreground">
                <Briefcase className="h-16 w-16 mb-6" />
                <h2 className="text-3xl font-bold mb-4">
                  {t("gateway.hireExperts")}
                </h2>
                <p className="text-primary-foreground/90 mb-6">
                  {t("gateway.hireExpertsDesc")}
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    <span>{t("gateway.devDesigners")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <span>{t("gateway.medicalConsult")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    <span>{t("gateway.quickTurnaround")}</span>
                  </li>
                </ul>
              </div>
              <div className="p-6 bg-background">
                <Button className="w-full" size="lg">
                  {t("gateway.exploreServices")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card
            className="group cursor-pointer hover:shadow-2xl transition-all duration-300 border-2 hover:border-accent overflow-hidden"
            onClick={() => navigate("/products")}
          >
            <CardContent className="p-0">
              <div className="bg-gradient-to-br from-accent to-accent/80 p-8 text-accent-foreground">
                <ShoppingBag className="h-16 w-16 mb-6" />
                <h2 className="text-3xl font-bold mb-4">
                  {t("gateway.shopProductsCard")}
                </h2>
                <p className="text-accent-foreground/90 mb-6">
                  {t("gateway.shopProductsDesc")}
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    <span>{t("gateway.electronicsMore")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <span>{t("gateway.trustedSellers")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    <span>{t("gateway.fastShipping")}</span>
                  </li>
                </ul>
              </div>
              <div className="p-6 bg-background">
                <Button className="w-full" size="lg" variant="outline">
                  {t("gateway.browseProducts")}
                  <ArrowRight className="ml-2 h-5 w-5" />
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
              className="text-primary hover:underline font-medium"
            >
              {t("gateway.signIn")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
