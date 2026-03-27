/**
 * Service Category Page
 *
 * Displays all services in a specific category
 * Route: /services/:categorySlug
 */

import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Search, Filter, Star, MapPin, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { ServicesHeader } from "@/components/layout/ServicesHeader";
import { Avatar } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  is_verified?: boolean;
  location?: string;
  provider: {
    provider_name: string;
    logo_url?: string;
    is_verified?: boolean;
  } | null;
}

export function ServiceCategoryPage() {
  const { t } = useTranslation();
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listings, setListings] = useState<ServiceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("rating");

  useEffect(() => {
    fetchListings();
  }, [categorySlug, sortBy]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("svc_listings")
        .select(
          `
          *,
          provider:svc_providers (
            provider_name,
            logo_url,
            is_verified
          ),
          category:svc_categories (
            name
          )
        `,
        )
        .eq("is_active", true);

      if (categorySlug) {
        query = query.eq("category_slug", categorySlug);
      }

      const { data, error } = await query.order("rating", { ascending: false });

      if (error) throw error;
      if (data) setListings(data);
    } catch (error) {
      console.error("Error fetching listings:", error);
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <ServicesHeader />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-600 dark:from-indigo-900 dark:to-violet-900 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            {categorySlug ? (
              <span className="capitalize">
                {categorySlug.replace("-", " ")} Services
              </span>
            ) : (
              t("services.allServices")
            )}
          </h1>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl">
            {t("services.categoryDescription")}
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder={t("services.searchServices")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 rounded-full bg-white text-slate-900 border-0 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="h-14 px-8 rounded-full bg-white text-indigo-600 hover:bg-indigo-50 font-semibold"
              >
                {t("common.search")}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Filters & Sort */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-slate-500" />
            <span className="text-slate-700 dark:text-slate-300 font-medium">
              {listings.length} {t("services.servicesFound")}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t("services.sortBy")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">{t("services.topRated")}</SelectItem>
                <SelectItem value="price_low">
                  {t("services.priceLowHigh")}
                </SelectItem>
                <SelectItem value="price_high">
                  {t("services.priceHighLow")}
                </SelectItem>
                <SelectItem value="newest">{t("services.newest")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="border-slate-200 dark:border-slate-800">
                <CardContent className="p-0">
                  <div className="animate-pulse">
                    <div className="h-48 bg-slate-200 dark:bg-slate-800" />
                    <div className="p-6 space-y-3">
                      <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                      <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded w-full mt-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : listings.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <Link
                key={listing.id}
                to={`/services/listing/${listing.slug}`}
                className="group block"
              >
                <Card className="h-full border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 overflow-hidden">
                  <CardContent className="p-0 flex flex-col h-full">
                    {listing.image_url ? (
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={listing.image_url}
                          alt={listing.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {listing.provider?.is_verified && (
                          <Badge className="absolute top-3 right-3 bg-emerald-500 text-white border-0">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {t("services.verified")}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <div className="relative h-48 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <span className="text-6xl text-slate-300 dark:text-slate-600">
                          🎨
                        </span>
                      </div>
                    )}

                    <div className="p-5 flex flex-col flex-grow">
                      <div className="flex items-center justify-between mb-3">
                        <Badge
                          variant="secondary"
                          className="bg-slate-100 dark:bg-slate-800"
                        >
                          {listing.category?.name || t("services.service")}
                        </Badge>
                        {listing.rating && (
                          <div className="flex items-center gap-1 text-amber-500">
                            <Star className="h-4 w-4 fill-current" />
                            <span className="font-bold text-sm">
                              {listing.rating}
                            </span>
                            {listing.reviews_count && (
                              <span className="text-slate-500 text-xs">
                                ({listing.reviews_count})
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {listing.title}
                      </h3>

                      <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 line-clamp-2">
                        {listing.description || t("services.noDescription")}
                      </p>

                      {listing.provider && (
                        <div className="flex items-center gap-3 mb-4">
                          <Avatar
                            name={listing.provider.provider_name}
                            src={listing.provider.logo_url}
                            className="h-8 w-8"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                              {listing.provider.provider_name}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                          {listing.price ? (
                            <div>
                              <span className="text-xs text-slate-500 uppercase">
                                {t("services.startingAt")}
                              </span>
                              <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                                {listing.currency || "$"}
                                {listing.price}
                              </p>
                            </div>
                          ) : (
                            <span className="text-sm font-semibold text-indigo-600">
                              {t("services.contactForPrice")}
                            </span>
                          )}
                          <Button
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full"
                          >
                            {t("services.viewDetails")}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-6">
              <Search className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
              {t("services.noServicesFound")}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              {t("services.tryDifferentCategory")}
            </p>
            <Button
              onClick={() => navigate("/services")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full"
            >
              {t("services.browseAllServices")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
