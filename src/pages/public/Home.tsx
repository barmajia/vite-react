import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ShoppingBag,
  Truck,
  Shield,
  Star,
  Zap,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/products/ProductGrid";
import { useFeaturedProducts } from "@/hooks/useProducts";
import { ROUTES } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";

export function Home() {
  const { t } = useTranslation();
  const { data: featuredProducts, isLoading } = useFeaturedProducts(8);
  const navigate = useNavigate();

  const categories = [
    {
      id: "1",
      name: t("home.categories.electronics"),
      icon: "📱",
      color: "from-gray-700 to-gray-900",
    },
    {
      id: "2",
      name: t("home.categories.fashion"),
      icon: "👕",
      color: "from-gray-600 to-gray-800",
    },
    {
      id: "3",
      name: t("home.categories.homeGarden"),
      icon: "🏠",
      color: "from-gray-500 to-gray-700",
    },
    {
      id: "4",
      name: t("home.categories.sports"),
      icon: "⚽",
      color: "from-gray-400 to-gray-600",
    },
    {
      id: "5",
      name: t("home.categories.beauty"),
      icon: "💄",
      color: "from-gray-300 to-gray-500",
    },
    {
      id: "6",
      name: t("home.categories.books"),
      icon: "📚",
      color: "from-gray-200 to-gray-400",
    },
  ];

  const features = [
    {
      icon: <ShoppingBag className="h-6 w-6" />,
      title: t("home.features.wideSelection"),
      description: t("home.features.wideSelectionDesc"),
    },
    {
      icon: <Truck className="h-6 w-6" />,
      title: t("home.features.fastShipping"),
      description: t("home.features.fastShippingDesc"),
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: t("home.features.securePayment"),
      description: t("home.features.securePaymentDesc"),
    },
    {
      icon: <Star className="h-6 w-6" />,
      title: t("home.features.qualityGuaranteed"),
      description: t("home.features.qualityGuaranteedDesc"),
    },
  ];

  return (
    <div className="space-y-16 pb-16 pt-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-accent to-muted text-background">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative px-6 py-16 md:py-24 md:px-12">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-background/10 px-4 py-2 text-sm backdrop-blur">
              <Zap className="h-4 w-4" />
              <span>{t("home.newArrivals")}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              {t("home.heroTitle")}
            </h1>
            <p className="text-lg md:text-xl text-background/80 max-w-2xl">
              {t("home.heroSubtitle")}
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                className="bg-background text-foreground hover:bg-background/90"
                onClick={() => navigate(ROUTES.PRODUCTS)}
              >
                {t("home.shopNow")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-background bg-background/10 text-foreground hover:bg-background/20"
                onClick={() => navigate(ROUTES.CATEGORIES)}
              >
                {t("home.browseCategories")}
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-background/10 rounded-full blur-3xl" />
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-background/10 rounded-full blur-3xl" />
      </section>

      {/* Categories */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{t("home.shopByCategory")}</h2>
          <Link
            to={ROUTES.CATEGORIES}
            className="text-primary hover:underline text-sm font-medium flex items-center"
          >
            {t("home.viewAll")}
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`${ROUTES.CATEGORY_PRODUCTS.replace(":id", category.id)}`}
              className="group"
            >
              <div
                className={`aspect-square rounded-2xl bg-gradient-to-br ${category.color} p-6 flex flex-col items-center justify-center gap-3 transition-transform group-hover:scale-105`}
              >
                <span className="text-4xl">{category.icon}</span>
                <span className="font-medium text-center text-white">
                  {category.name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{t("home.featuredProducts")}</h2>
          <Link
            to={ROUTES.PRODUCTS}
            className="text-primary hover:underline text-sm font-medium flex items-center"
          >
            {t("home.viewAll")}
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ProductGrid products={featuredProducts || []} />
        )}
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => (
          <div
            key={index}
            className="p-6 rounded-xl border bg-card hover:shadow-lg transition-shadow"
          >
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
              {feature.icon}
            </div>
            <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
            <p className="text-muted-foreground">{feature.description}</p>
          </div>
        ))}
      </section>

      {/* Newsletter */}
      <section className="rounded-2xl bg-gradient-to-br from-primary via-accent to-muted text-background p-8 md:p-12">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold">{t("home.newsletter.title")}</h2>
          <p className="text-background/80">{t("home.newsletter.subtitle")}</p>
          <form
            className="flex flex-col sm:flex-row gap-3"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              placeholder={t("home.newsletter.emailPlaceholder")}
              className="flex-1 px-4 py-3 rounded-lg bg-background/10 border border-background/20 text-background placeholder:text-background/60 focus:outline-none focus:ring-2 focus:ring-background/30"
            />
            <Button
              type="submit"
              size="lg"
              className="bg-background text-foreground hover:bg-background/90 whitespace-nowrap"
            >
              {t("home.newsletter.subscribe")}
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
