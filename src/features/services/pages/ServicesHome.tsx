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
  TrendingUp,
  Globe,
  Wallet,
  CheckCircle2,
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
      const { data: categoriesData } = await supabase
        .from("svc_categories")
        .select("*")
        .order("name");

      if (categoriesData) {
        setCategories(categoriesData);
      }

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      <ServicesHeader />

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[100px]" />
          <div className="absolute top-40 -left-40 w-[500px] h-[500px] bg-violet-500/10 dark:bg-violet-500/20 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800 rounded-full mb-8 shadow-sm">
              <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                The Premier Services Marketplace
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight leading-tight">
              Connect with Top <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">
                Industry Experts
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 mb-10 max-w-3xl mx-auto font-medium">
              Whether you're looking to hire top talent or offering your own
              professional services, Aurora is your growth engine.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 max-w-3xl mx-auto">
              {/* Search Bar */}
              <form
                onSubmit={handleSearch}
                className="w-full sm:flex-1 relative"
              >
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Find the perfect service..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-14 pr-4 h-14 w-full text-lg rounded-full border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 dark:text-white focus:border-indigo-500 focus:ring-indigo-500/20 shadow-lg shadow-slate-200/50 dark:shadow-none transition-all"
                />
                <Button
                  type="submit"
                  size="lg"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-6 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  Search
                </Button>
              </form>

              {/* Provider CTA */}
              <Button
                onClick={() =>
                  navigate(user ? "/services/onboarding" : "/signup")
                }
                size="lg"
                className="w-full sm:w-auto h-10 px-6 rounded-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 hover:border-indigo-600 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-lg shadow-slate-200/50 dark:shadow-none transition-all font-bold"
              >
                Become a Provider
              </Button>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 text-sm font-medium text-slate-500 dark:text-slate-400 mt-8">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-500" />
              <span>Secure Payments</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <span>Verified Professionals</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              <span>Fast Delivery</span>
            </div>
          </div>
        </div>
      </div>

      {/* For Providers Section - Highlighted Area */}
      <div className="py-24 px-4 bg-slate-900 dark:bg-slate-900 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="text-white space-y-8 text-center lg:text-left">
              <Badge className="bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border-indigo-500/30 text-sm px-4 py-1.5 rounded-full mb-4">
                For Freelancers & Agencies
              </Badge>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
                Turn your expertise into a thriving business.
              </h2>
              <p className="text-lg text-slate-400 max-w-xl mx-auto lg:mx-0">
                Join our elite community of service providers. Get instant
                access to thousands of buyers worldwide, secure your payments,
                and grow your freelance career on Aurora.
              </p>

              <ul className="space-y-4 max-w-lg text-left mx-auto lg:mx-0">
                {[
                  "Global reach to millions of active buyers",
                  "Guaranteed payments and escrow protection",
                  "Advanced analytics and growth tools",
                  "Dedicated support for top-rated sellers",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-slate-300"
                  >
                    <CheckCircle2 className="h-6 w-6 text-emerald-400 flex-shrink-0" />
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  size="lg"
                  onClick={() =>
                    navigate(user ? "/services/onboarding" : "/signup")
                  }
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-14 px-8 rounded-full shadow-lg shadow-indigo-600/20"
                >
                  Start Selling Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative">
              <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 blur-2xl rounded-full" />
              <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-xl relative z-10 hover:-translate-y-2 transition-transform duration-300">
                <CardContent className="p-8">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-6">
                    <Globe className="h-7 w-7 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Global Audience
                  </h3>
                  <p className="text-slate-400">
                    Present your portfolio to clients from over 150 countries.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-xl relative z-10 hover:-translate-y-2 transition-transform duration-300 sm:translate-y-8">
                <CardContent className="p-8">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-6">
                    <Wallet className="h-7 w-7 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Secure Earnings
                  </h3>
                  <p className="text-slate-400">
                    Get paid on time, every time with our protected escrow
                    system.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-xl relative z-10 hover:-translate-y-2 transition-transform duration-300">
                <CardContent className="p-8">
                  <div className="w-14 h-14 rounded-2xl bg-violet-500/20 flex items-center justify-center mb-6">
                    <TrendingUp className="h-7 w-7 text-violet-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Scale Up
                  </h3>
                  <p className="text-slate-400">
                    Build your agency and brand with premium seller features.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-xl relative z-10 hover:-translate-y-2 transition-transform duration-300 sm:translate-y-8">
                <CardContent className="p-8">
                  <div className="w-14 h-14 rounded-2xl bg-rose-500/20 flex items-center justify-center mb-6">
                    <Briefcase className="h-7 w-7 text-rose-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Work Your Way
                  </h3>
                  <p className="text-slate-400">
                    Offer custom packages and set your own terms and pricing.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Service Categories */}
      <div className="py-24 px-4 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
              Explore capabilities
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium">
              Find precisely the skills you need across our diverse network of
              professionals.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categories.map((category) => {
              const IconComponent = getCategoryIcon(category.slug);
              return (
                <Link
                  key={category.id}
                  to={`/services/${category.slug}`}
                  className="group block"
                >
                  <Card className="h-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1">
                    <CardContent className="p-8 text-center flex flex-col items-center justify-center h-full">
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800 mb-6 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 group-hover:scale-110 transition-all duration-300">
                        <IconComponent className="h-10 w-10 text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                        {category.description || t("services.exploreCategory")}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Featured Listings */}
      <div className="py-24 px-4 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-6">
            <div className="text-center md:text-left">
              <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
                Featured Services
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 font-medium">
                Outstanding work from our top-rated providers.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/services")}
              className="rounded-full h-12 px-6 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold transition-all"
            >
              Browse All Services
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card
                  key={i}
                  className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50"
                >
                  <CardContent className="p-0">
                    <div className="animate-pulse">
                      <div className="h-60 bg-slate-200 dark:bg-slate-800" />
                      <div className="p-6 space-y-4">
                        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded w-full mt-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : featuredListings.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredListings.map((listing) => (
                <Link
                  key={listing.id}
                  to={`/services/listing/${listing.slug}`}
                  className="group block h-full"
                >
                  <Card className="h-full border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 overflow-hidden flex flex-col">
                    <CardContent className="p-0 flex flex-col h-full">
                      {listing.image_url ? (
                        <div className="relative h-60 overflow-hidden">
                          <img
                            src={listing.image_url}
                            alt={listing.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          {listing.provider?.is_verified && (
                            <Badge className="absolute top-4 right-4 bg-emerald-500/90 text-white border-0 backdrop-blur-md">
                              <Shield className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <div className="relative h-60 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <Briefcase className="h-16 w-16 text-slate-300 dark:text-slate-600" />
                        </div>
                      )}
                      <div className="p-6 flex flex-col flex-grow">
                        <div className="flex items-center justify-between gap-4 mb-4">
                          <Badge
                            variant="secondary"
                            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-0"
                          >
                            {listing.category?.name || "Service"}
                          </Badge>
                          {listing.rating && (
                            <div className="flex items-center gap-1.5 text-amber-500">
                              <Star className="h-4 w-4 fill-current" />
                              <span className="font-bold">
                                {listing.rating}
                              </span>
                              {listing.reviews_count && (
                                <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                                  ({listing.reviews_count})
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {listing.title}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-6 line-clamp-2">
                          {listing.description || t("services.noDescription")}
                        </p>
                        <div className="mt-auto">
                          <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
                            {listing.provider && (
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                                  {listing.provider.provider_name.charAt(0)}
                                </div>
                                <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                                  {listing.provider.provider_name}
                                </span>
                              </div>
                            )}
                            <div className="text-right">
                              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                                Starting At
                              </span>
                              {listing.price ? (
                                <div className="flex items-baseline gap-1">
                                  <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                                    {listing.currency || "$"}
                                    {listing.price}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-sm font-semibold text-indigo-600">
                                  Contact
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border border-slate-200 dark:border-slate-800">
              <Briefcase className="h-20 w-20 text-slate-300 dark:text-slate-600 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                No Services Available Yet
              </h3>
              <p className="text-lg text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
                Be the very first professional to list your services and start
                earning immediately.
              </p>
              {!user && (
                <Button
                  size="lg"
                  onClick={() => navigate("/signup")}
                  className="bg-indigo-600 hover:bg-indigo-700 rounded-full h-14 px-8 font-bold"
                >
                  Create an Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="h-24 bg-slate-50 dark:bg-slate-950" />
    </div>
  );
}
