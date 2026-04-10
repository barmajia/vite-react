import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Store, 
  TrendingUp, 
  Users, 
  Package, 
  CreditCard, 
  Shield,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Zap,
  BarChart3,
  Globe
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function SellerWelcomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [hasShop, setHasShop] = useState(false);
  const [hasProducts, setHasProducts] = useState(false);

  useEffect(() => {
    checkExistingSetup();
  }, [user]);

  const checkExistingSetup = async () => {
    if (!user) return;
    
    try {
      // Check if user has a shop
      const { data: shopData } = await supabase
        .from("shops")
        .select("id")
        .eq("owner_id", user.id)
        .single();
      
      setHasShop(!!shopData);

      // Check if user has products
      const { data: productData } = await supabase
        .from("products")
        .select("id")
        .eq("seller_id", user.id)
        .limit(1);
      
      setHasProducts(!!productData && productData.length > 0);
    } catch (error) {
      console.error("Error checking setup:", error);
    }
  };

  const handleGetStarted = async () => {
    setIsLoading(true);
    try {
      // Mark onboarding as complete in users table
      const { error: updateError } = await supabase
        .from("users")
        .update({ 
          onboarding_completed: true
        })
        .eq("user_id", user?.id);

      if (updateError) throw updateError;

      toast.success(t("seller.welcome.onboardingComplete"));
      
      if (!hasShop) {
        navigate("/shops/dashboard");
      } else if (!hasProducts) {
        navigate("/products/seller/create");
      } else {
        navigate("/seller/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || t("common.error"));
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: <Store className="h-6 w-6 text-blue-600" />,
      title: t("seller.welcome.features.shop.title"),
      description: t("seller.welcome.features.shop.description"),
    },
    {
      icon: <Package className="h-6 w-6 text-purple-600" />,
      title: t("seller.welcome.features.products.title"),
      description: t("seller.welcome.features.products.description"),
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-green-600" />,
      title: t("seller.welcome.features.analytics.title"),
      description: t("seller.welcome.features.analytics.description"),
    },
    {
      icon: <CreditCard className="h-6 w-6 text-amber-600" />,
      title: t("seller.welcome.features.commission.title"),
      description: t("seller.welcome.features.commission.description"),
    },
    {
      icon: <Users className="h-6 w-6 text-pink-600" />,
      title: t("seller.welcome.features.customers.title"),
      description: t("seller.welcome.features.customers.description"),
    },
    {
      icon: <Shield className="h-6 w-6 text-indigo-600" />,
      title: t("seller.welcome.features.security.title"),
      description: t("seller.welcome.features.security.description"),
    },
  ];

  const steps = [
    {
      number: "01",
      title: t("seller.welcome.steps.setup.title"),
      description: t("seller.welcome.steps.setup.description"),
      action: () => navigate("/shops/dashboard"),
      completed: hasShop,
    },
    {
      number: "02",
      title: t("seller.welcome.steps.products.title"),
      description: t("seller.welcome.steps.products.description"),
      action: () => navigate("/products/seller/create"),
      completed: hasProducts,
    },
    {
      number: "03",
      title: t("seller.welcome.steps.optimize.title"),
      description: t("seller.welcome.steps.optimize.description"),
      action: () => navigate("/seller/analytics"),
      completed: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-gray-600 dark:text-gray-300"
          >
            ← {t("common.back")}
          </Button>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
            <Sparkles className="h-3 w-3 mr-1" />
            {t("seller.welcome.badge")}
          </Badge>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900 mb-6">
            <Store className="h-10 w-10 text-blue-600 dark:text-blue-400" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            {t("seller.welcome.title")}
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            {t("seller.welcome.subtitle")}
          </p>

          {!hasShop && !hasProducts && (
            <Button
              size="lg"
              onClick={handleGetStarted}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg"
            >
              {isLoading ? (
                <>{t("common.loading")}...</>
              ) : (
                <>
                  {t("seller.welcome.getStarted")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          {t("seller.welcome.features.title")}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white/80 dark:bg-gray-800/80 backdrop-blur"
            >
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Setup Steps */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
          {t("seller.welcome.steps.title")}
        </h2>
        
        <div className="max-w-4xl mx-auto space-y-4">
          {steps.map((step, index) => (
            <Card
              key={index}
              className={`border-2 transition-all ${
                step.completed
                  ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-6">
                  <div className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
                    step.completed
                      ? "bg-green-500 text-white"
                      : "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                  }`}>
                    {step.completed ? (
                      <CheckCircle2 className="h-8 w-8" />
                    ) : (
                      step.number
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {step.description}
                    </p>
                    {!step.completed && (
                      <Button
                        onClick={step.action}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {t("seller.welcome.steps.start")}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  {step.completed && (
                    <Badge className="bg-green-500 text-white">
                      {t("seller.welcome.steps.completed")}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="container mx-auto px-4 py-12">
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 border-0 text-white">
          <CardContent className="p-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="flex items-center justify-center mb-4">
                  <BarChart3 className="h-12 w-12" />
                </div>
                <h3 className="text-3xl font-bold mb-2">10M+</h3>
                <p className="text-blue-100">{t("seller.welcome.stats.products")}</p>
              </div>
              <div>
                <div className="flex items-center justify-center mb-4">
                  <Users className="h-12 w-12" />
                </div>
                <h3 className="text-3xl font-bold mb-2">500K+</h3>
                <p className="text-blue-100">{t("seller.welcome.stats.sellers")}</p>
              </div>
              <div>
                <div className="flex items-center justify-center mb-4">
                  <Globe className="h-12 w-12" />
                </div>
                <h3 className="text-3xl font-bold mb-2">190+</h3>
                <p className="text-blue-100">{t("seller.welcome.stats.countries")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-12 text-center">
        <Card className="max-w-3xl mx-auto bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-800">
          <CardContent className="p-8">
            <Zap className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {t("seller.welcome.cta.title")}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t("seller.welcome.cta.description")}
            </p>
            <Button
              size="lg"
              onClick={handleGetStarted}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8"
            >
              {t("seller.welcome.cta.button")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
