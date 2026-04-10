import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Factory, 
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
  Globe,
  Clock,
  Award
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function FactoryWelcomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [hasQuotes, setHasQuotes] = useState(false);
  const [hasConnections, setHasConnections] = useState(false);

  useEffect(() => {
    checkExistingSetup();
  }, [user]);

  const checkExistingSetup = async () => {
    if (!user) return;
    
    try {
      // Check if user has factory profile
      const { data: factoryData } = await supabase
        .from("factories")
        .select("id")
        .eq("user_id", user.id)
        .single();
      
      setHasProfile(!!factoryData);

      // Check if user has quotes
      const { data: quoteData } = await supabase
        .from("factory_quotes")
        .select("id")
        .eq("factory_id", factoryData?.id || user.id)
        .limit(1);
      
      setHasQuotes(!!quoteData && quoteData.length > 0);

      // Check connections
      const { data: connectionData } = await supabase
        .from("factory_connections")
        .select("id")
        .eq("factory_id", factoryData?.id || user.id)
        .limit(1);
      
      setHasConnections(!!connectionData && connectionData.length > 0);
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

      toast.success(t("factory.welcome.onboardingComplete"));
      
      if (!hasProfile) {
        navigate("/factory/profile/setup");
      } else if (!hasQuotes) {
        navigate("/factory/quotes");
      } else {
        navigate("/factory/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || t("common.error"));
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: <Factory className="h-6 w-6 text-blue-600" />,
      title: t("factory.welcome.features.profile.title"),
      description: t("factory.welcome.features.profile.description"),
    },
    {
      icon: <Package className="h-6 w-6 text-purple-600" />,
      title: t("factory.welcome.features.production.title"),
      description: t("factory.welcome.features.production.description"),
    },
    {
      icon: <CreditCard className="h-6 w-6 text-green-600" />,
      title: t("factory.welcome.features.quotes.title"),
      description: t("factory.welcome.features.quotes.description"),
    },
    {
      icon: <Users className="h-6 w-6 text-amber-600" />,
      title: t("factory.welcome.features.connections.title"),
      description: t("factory.welcome.features.connections.description"),
    },
    {
      icon: <Clock className="h-6 w-6 text-pink-600" />,
      title: t("factory.welcome.features.tracking.title"),
      description: t("factory.welcome.features.tracking.description"),
    },
    {
      icon: <Shield className="h-6 w-6 text-indigo-600" />,
      title: t("factory.welcome.features.security.title"),
      description: t("factory.welcome.features.security.description"),
    },
  ];

  const steps = [
    {
      number: "01",
      title: t("factory.welcome.steps.profile.title"),
      description: t("factory.welcome.steps.profile.description"),
      action: () => navigate("/factory/profile/setup"),
      completed: hasProfile,
    },
    {
      number: "02",
      title: t("factory.welcome.steps.capabilities.title"),
      description: t("factory.welcome.steps.capabilities.description"),
      action: () => navigate("/factory/production"),
      completed: false,
    },
    {
      number: "03",
      title: t("factory.welcome.steps.quotes.title"),
      description: t("factory.welcome.steps.quotes.description"),
      action: () => navigate("/factory/quotes"),
      completed: hasQuotes,
    },
    {
      number: "04",
      title: t("factory.welcome.steps.network.title"),
      description: t("factory.welcome.steps.network.description"),
      action: () => navigate("/factory/connections"),
      completed: hasConnections,
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
            {t("factory.welcome.badge")}
          </Badge>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900 mb-6">
            <Factory className="h-10 w-10 text-blue-600 dark:text-blue-400" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            {t("factory.welcome.title")}
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            {t("factory.welcome.subtitle")}
          </p>

          {!hasProfile && (
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
                  {t("factory.welcome.getStarted")}
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
          {t("factory.welcome.features.title")}
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
          {t("factory.welcome.steps.title")}
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
                        {t("factory.welcome.steps.start")}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  {step.completed && (
                    <Badge className="bg-green-500 text-white">
                      {t("factory.welcome.steps.completed")}
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
                <h3 className="text-3xl font-bold mb-2">$50M+</h3>
                <p className="text-blue-100">{t("factory.welcome.stats.orders")}</p>
              </div>
              <div>
                <div className="flex items-center justify-center mb-4">
                  <Award className="h-12 w-12" />
                </div>
                <h3 className="text-3xl font-bold mb-2">5K+</h3>
                <p className="text-blue-100">{t("factory.welcome.stats.factories")}</p>
              </div>
              <div>
                <div className="flex items-center justify-center mb-4">
                  <Globe className="h-12 w-12" />
                </div>
                <h3 className="text-3xl font-bold mb-2">80+</h3>
                <p className="text-blue-100">{t("factory.welcome.stats.countries")}</p>
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
              {t("factory.welcome.cta.title")}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t("factory.welcome.cta.description")}
            </p>
            <Button
              size="lg"
              onClick={handleGetStarted}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8"
            >
              {t("factory.welcome.cta.button")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
