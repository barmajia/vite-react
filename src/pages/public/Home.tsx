import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ShoppingBag,
  Truck,
  Shield,
  Star,
  Zap,
  Users,
  TrendingUp,
  Handshake,
  Package,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProductGrid } from "@/components/products/ProductGrid";
import { useFeaturedProducts } from "@/hooks/useProducts";
import { ROUTES } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";

export function Home() {
  const { t } = useTranslation();
  const { data: featuredProducts, isLoading } = useFeaturedProducts(8);
  const navigate = useNavigate();

  const roles = [
    {
      icon: <ShoppingBag className="h-8 w-8" />,
      title: "Customer",
      description: "Browse and buy products from sellers",
      link: "/signup",
      color: "hover:border-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      icon: <Package className="h-8 w-8" />,
      title: "Seller",
      description: "Sell products to customers and factories",
      link: "/signup",
      color: "hover:border-green-500",
      bgColor: "bg-green-50",
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Factory",
      description: "Manufacture products for wholesale",
      link: "/signup",
      color: "hover:border-orange-500",
      bgColor: "bg-orange-50",
    },
    {
      icon: <Handshake className="h-8 w-8" />,
      title: "Middleman",
      description: "Connect buyers and sellers, earn commissions",
      link: "/signup/middleman",
      color: "hover:border-purple-500",
      bgColor: "bg-purple-50",
    },
    {
      icon: <Truck className="h-8 w-8" />,
      title: "Delivery",
      description: "Deliver orders and earn per delivery",
      link: "/signup",
      color: "hover:border-red-500",
      bgColor: "bg-red-50",
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
  ];

  return (
    <div className="space-y-16 pb-16 pt-20">
      {/* Hero Section - Multi-Role Platform */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-accent to-muted text-background">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative px-6 py-16 md:py-24 md:px-12">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-background/10 px-4 py-2 text-sm backdrop-blur">
              <Zap className="h-4 w-4" />
              <span>{t("home.multiRolePlatform")}</span>
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
                onClick={() => navigate("/signup")}
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-background bg-background/10 text-foreground hover:bg-background/20"
                onClick={() => navigate("/products")}
              >
                Browse Products
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-background/10 rounded-full blur-3xl" />
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-background/10 rounded-full blur-3xl" />
      </section>

      {/* Choose Your Role */}
      <section>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Choose Your Role</h2>
          <p className="text-muted-foreground">
            Join our platform as any of these roles and start your journey
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => (
            <Link key={role.title} to={role.link}>
              <Card className={`h-full transition-all ${role.color} border-2`}>
                <CardHeader>
                  <div
                    className={`w-16 h-16 rounded-lg ${role.bgColor} flex items-center justify-center text-primary mb-4`}
                  >
                    {role.icon}
                  </div>
                  <CardTitle className="text-xl">{role.title}</CardTitle>
                  <CardDescription>{role.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    Join as {role.title}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Featured Products</h2>
          <Link
            to={ROUTES.PRODUCTS}
            className="text-primary hover:underline text-sm font-medium flex items-center"
          >
            View All
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

      {/* Categories */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Shop by Category</h2>
          <Link
            to={ROUTES.CATEGORIES}
            className="text-primary hover:underline text-sm font-medium flex items-center"
          >
            View All
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

      {/* Platform Features */}
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

      {/* Why Choose Us */}
      <section className="rounded-2xl bg-gradient-to-br from-primary via-accent to-muted text-background p-8 md:p-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Why Choose Aurora?</h2>
            <p className="text-background/80">
              A complete B2B2C ecosystem connecting everyone in the supply chain
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-background/80" />
              <h3 className="font-semibold text-lg mb-2">
                Multi-Role Platform
              </h3>
              <p className="text-sm text-background/70">
                5 different roles working together seamlessly
              </p>
            </div>
            <div className="text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-background/80" />
              <h3 className="font-semibold text-lg mb-2">Secure & Trusted</h3>
              <p className="text-sm text-background/70">
                Verified users and secure transactions
              </p>
            </div>
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-background/80" />
              <h3 className="font-semibold text-lg mb-2">Grow Your Business</h3>
              <p className="text-sm text-background/70">
                Tools and analytics to scale your operations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center py-12">
        <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          Join thousands of users already using Aurora to buy, sell, and grow
          their businesses
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button size="lg" onClick={() => navigate("/signup")}>
            Create Free Account
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate("/login")}
          >
            Sign In
          </Button>
        </div>
      </section>
    </div>
  );
}
