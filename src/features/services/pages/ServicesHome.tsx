import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Briefcase,
  Code,
  Palette,
  Stethoscope,
  Building2,
  Wrench,
  GraduationCap,
  Scale,
  ArrowRight,
  Search,
  Star,
  Users,
  Zap,
  Shield,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { ServicesHeader } from "@/components/layout/ServicesHeader";

interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon?: string;
}

interface ServiceListing {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number | null;
  price_type: string | null;
  currency: string | null;
  image_url: string | null;
  rating?: number;
  reviews_count?: number;
  provider: {
    provider_name: string;
    is_verified?: boolean;
  } | null;
  category: {
    name: string;
  } | null;
}

export function ServicesHome() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [featuredListings, setFeaturedListings] = useState<ServiceListing[]>(
    [],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch service categories
      const { data: categoriesData } = await supabase
        .from("svc_categories")
        .select("*")
        .order("name");

      if (categoriesData) {
        setCategories(categoriesData);
      }

      // Fetch featured service listings
      const { data: listingsData } = await supabase
        .from("svc_listings")
        .select(
          `
          *,
          provider:svc_providers (
            provider_name,
            is_verified
          ),
          category:svc_categories (
            name
          )
        `,
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(6);

      if (listingsData) {
        setFeaturedListings(listingsData);
      }
    } catch (error) {
      console.error("Error fetching services data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/services?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const getCategoryIcon = (slug: string) => {
    const iconMap: Record<string, any> = {
      programming: Code,
      design: Palette,
      healthcare: Stethoscope,
      business: Building2,
      home: Wrench,
      education: GraduationCap,
      legal: Scale,
      writing: Code,
      marketing: Sparkles,
    };
    return iconMap[slug] || Briefcase;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-blue-50 via-white to-brand-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <ServicesHeader />

      {/* Hero Section */}
      <div className="pt-32 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue-100 dark:bg-brand-blue-900/30 rounded-full mb-6">
              <Sparkles className="h-4 w-4 text-brand-blue-600 dark:text-brand-blue-400" />
              <span className="text-sm font-medium text-brand-blue-600 dark:text-brand-blue-400">
                {t("services.findExperts")}
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              {t("services.heroTitle")}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
              {t("services.heroSubtitle")}
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder={t("services.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 h-14 text-lg rounded-full border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white focus:border-brand-blue-500 dark:focus:border-brand-blue-400"
                />
                <Button
                  type="submit"
                  size="lg"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-10 rounded-full bg-brand-blue-600 hover:bg-brand-blue-700"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            {[
              {
                icon: Shield,
                label: t("services.verified"),
                desc: t("services.verifiedDesc"),
              },
              {
                icon: Star,
                label: t("services.topRated"),
                desc: t("services.topRatedDesc"),
              },
              {
                icon: Zap,
                label: t("services.fastDelivery"),
                desc: t("services.fastDeliveryDesc"),
              },
              {
                icon: Users,
                label: t("services.expertPros"),
                desc: t("services.expertProsDesc"),
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center p-4 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700"
              >
                <item.icon className="h-8 w-8 text-brand-blue-600 dark:text-brand-blue-400 mb-2" />
                <span className="font-semibold text-gray-900 dark:text-white">
                  {item.label}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  {item.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Service Categories */}
      <div className="py-16 px-4 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t("services.browseCategories")}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t("services.categoriesSubtitle")}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categories.map((category) => {
              const IconComponent = getCategoryIcon(category.slug);
              return (
                <Link
                  key={category.id}
                  to={`/services/${category.slug}`}
                  className="group"
                >
                  <Card className="h-full border-2 border-gray-200 dark:border-gray-700 hover:border-brand-blue-500 dark:hover:border-brand-blue-400 transition-all duration-300 hover:shadow-lg bg-white dark:bg-gray-800">
                    <CardContent className="p-6 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-blue-100 to-brand-purple-100 dark:from-brand-blue-900/30 dark:to-brand-purple-900/30 mb-4 group-hover:scale-110 transition-transform">
                        <IconComponent className="h-8 w-8 text-brand-blue-600 dark:text-brand-blue-400" />
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {category.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                        {category.description || t("services.exploreCategory")}
                      </p>
                      <div className="mt-4 flex items-center justify-center text-brand-blue-600 dark:text-brand-blue-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        {t("services.explore")}
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Featured Listings */}
      <div className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {t("services.featuredServices")}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {t("services.featuredSubtitle")}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/services")}
              className="hidden md:flex items-center gap-2 border-gray-300 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              {t("services.viewAll")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card
                  key={i}
                  className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                >
                  <CardContent className="p-4">
                    <div className="animate-pulse space-y-4">
                      <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : featuredListings.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredListings.map((listing) => (
                <Link
                  key={listing.id}
                  to={`/services/listing/${listing.slug}`}
                  className="group"
                >
                  <Card className="h-full border-2 border-gray-200 dark:border-gray-700 hover:border-brand-blue-500 dark:hover:border-brand-blue-400 transition-all duration-300 hover:shadow-xl bg-white dark:bg-gray-800 overflow-hidden">
                    <CardContent className="p-0">
                      {listing.image_url ? (
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={listing.image_url}
                            alt={listing.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          {listing.provider?.is_verified && (
                            <Badge className="absolute top-2 right-2 bg-emerald-500">
                              <Shield className="h-3 w-3 mr-1" />
                              {t("services.verified")}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <div className="relative h-48 bg-gradient-to-br from-brand-blue-100 to-brand-purple-100 dark:from-brand-blue-900/30 dark:to-brand-purple-900/30 flex items-center justify-center">
                          <Briefcase className="h-16 w-16 text-brand-blue-600 dark:text-brand-blue-400 opacity-50" />
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant="outline"
                            className="text-xs border-gray-300 dark:border-gray-600"
                          >
                            {listing.category?.name || t("services.service")}
                          </Badge>
                          {listing.rating && (
                            <div className="flex items-center gap-1 text-amber-500">
                              <Star className="h-3 w-3 fill-current" />
                              <span className="text-xs font-medium">
                                {listing.rating}
                              </span>
                              {listing.reviews_count && (
                                <span className="text-xs text-gray-500">
                                  ({listing.reviews_count})
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-brand-blue-600 dark:group-hover:text-brand-blue-400 transition-colors">
                          {listing.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                          {listing.description || t("services.noDescription")}
                        </p>
                        <div className="flex items-center justify-between">
                          <div>
                            {listing.price ? (
                              <div className="flex items-baseline gap-1">
                                <span className="text-lg font-bold text-gray-900 dark:text-white">
                                  {listing.currency || "$"}
                                  {listing.price}
                                </span>
                                {listing.price_type && (
                                  <span className="text-xs text-gray-500">
                                    /{listing.price_type}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">
                                {t("services.contactForPricing")}
                              </span>
                            )}
                          </div>
                          <Button
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity bg-brand-blue-600 hover:bg-brand-blue-700"
                          >
                            {t("services.viewDetails")}
                          </Button>
                        </div>
                        {listing.provider && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-blue-500 to-brand-purple-500 flex items-center justify-center text-white text-xs font-bold">
                              {listing.provider.provider_name.charAt(0)}
                            </div>
                            <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                              {listing.provider.provider_name}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Briefcase className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {t("services.noListings")}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {t("services.noListingsDesc")}
              </p>
              {!user && (
                <Button
                  onClick={() => navigate("/signup")}
                  className="bg-brand-blue-600 hover:bg-brand-blue-700"
                >
                  {t("services.getStarted")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          <div className="text-center mt-8 md:hidden">
            <Button
              variant="outline"
              onClick={() => navigate("/services")}
              className="w-full border-gray-300 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              {t("services.viewAll")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 px-4 bg-gradient-to-r from-brand-blue-600 to-brand-purple-600 dark:from-brand-blue-800 dark:to-brand-purple-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t("services.readyToStart")}
          </h2>
          <p className="text-xl text-white/90 mb-8">
            {t("services.readyToStartDesc")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!user ? (
              <>
                <Button
                  size="lg"
                  onClick={() => navigate("/signup")}
                  className="bg-white text-brand-blue-600 hover:bg-gray-100"
                >
                  {t("services.joinNow")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/login")}
                  className="border-white text-white hover:bg-white/10"
                >
                  {t("auth.signIn")}
                </Button>
              </>
            ) : (
              <Button
                size="lg"
                onClick={() => navigate("/services/onboarding")}
                className="bg-white text-brand-blue-600 hover:bg-gray-100"
              >
                {t("services.becomeProvider")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Footer Spacing */}
      <div className="h-20" />
    </div>
  );
}
