/**
 * Service Detail Page
 *
 * Displays detailed information about a service listing
 * Route: /services/listing/:listingId
 */

import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Star,
  MapPin,
  CheckCircle2,
  Clock,
  Calendar,
  MessageSquare,
  Heart,
  Share2,
  Shield,
  Award,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ServicesHeader } from "@/components/layout/ServicesHeader";

interface ServiceDetail {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number | null;
  price_type: string | null;
  currency: string | null;
  images: string[] | null;
  deliverables: string[] | null;
  requirements: string[] | null;
  rating?: number;
  reviews_count?: number;
  total_bookings?: number;
  response_time?: string;
  is_active: boolean;
  provider: {
    id: string;
    provider_name: string;
    logo_url?: string;
    is_verified?: boolean;
    location?: string;
    bio?: string;
    rating_avg?: number;
    total_bookings?: number;
  } | null;
  category: {
    name: string;
    slug: string;
  } | null;
}

export function ServiceDetailPage() {
  const { t } = useTranslation();
  const { listingId } = useParams<{ listingId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [service, setService] = useState<ServiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    fetchService();
  }, [listingId]);

  const fetchService = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("svc_listings")
        .select(
          `
          *,
          provider:svc_providers (
            id,
            provider_name,
            logo_url,
            is_verified,
            location,
            bio,
            rating_avg,
            total_bookings
          ),
          category:svc_categories (
            name,
            slug
          )
        `,
        )
        .eq("slug", listingId)
        .single();

      if (error) throw error;
      if (data) setService(data);
    } catch (error) {
      console.error("Error fetching service:", error);
      toast.error(t("services.failedToLoadService"));
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = () => {
    if (!user) {
      toast.error(t("auth.pleaseLogin"));
      navigate("/login");
      return;
    }
    navigate(`/services/listing/${listingId}/book`);
  };

  const handleContactProvider = () => {
    if (!user) {
      toast.error(t("auth.pleaseLogin"));
      navigate("/login");
      return;
    }
    toast.info(t("services.contactFeatureComingSoon"));
  };

  const handleWishlist = async () => {
    if (!user) {
      toast.error(t("auth.pleaseLogin"));
      navigate("/login");
      return;
    }
    setIsWishlisted(!isWishlisted);
    toast.success(
      isWishlisted
        ? t("services.removedFromWishlist")
        : t("services.addedToWishlist"),
    );
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: service?.title,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success(t("common.linkCopied"));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <ServicesHeader />
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="animate-pulse space-y-8">
            <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
            <div className="space-y-4">
              <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            {t("services.serviceNotFound")}
          </h2>
          <Button onClick={() => navigate("/services")}>
            {t("services.browseAllServices")}
          </Button>
        </div>
      </div>
    );
  }

  const images = service.images || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <ServicesHeader />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link to="/services" className="hover:text-indigo-600">
            {t("services.allServices")}
          </Link>
          {service.category && (
            <>
              <span>/</span>
              <Link
                to={`/services/${service.category.slug}`}
                className="hover:text-indigo-600"
              >
                {service.category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-medium">
            {service.title}
          </span>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <Card className="overflow-hidden border-slate-200 dark:border-slate-800">
              <CardContent className="p-0">
                {images.length > 0 ? (
                  <>
                    <div className="relative h-96 bg-slate-100 dark:bg-slate-800">
                      <img
                        src={images[selectedImage]}
                        alt={service.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {images.length > 1 && (
                      <div className="flex gap-2 p-4 overflow-x-auto">
                        {images.map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedImage(idx)}
                            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                              selectedImage === idx
                                ? "border-indigo-600"
                                : "border-transparent hover:border-slate-300"
                            }`}
                          >
                            <img
                              src={img}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="h-96 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <span className="text-8xl">🎨</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Service Info */}
            <Card className="border-slate-200 dark:border-slate-800">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
                      {service.title}
                    </h1>
                    {service.category && (
                      <Badge
                        variant="secondary"
                        className="bg-slate-100 dark:bg-slate-800"
                      >
                        {service.category.name}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleWishlist}
                      className="rounded-full"
                    >
                      <Heart
                        className={`h-5 w-5 ${
                          isWishlisted ? "fill-red-500 text-red-500" : ""
                        }`}
                      />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleShare}
                      className="rounded-full"
                    >
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {/* Rating & Stats */}
                <div className="flex items-center gap-6 flex-wrap">
                  {service.rating && (
                    <div className="flex items-center gap-2">
                      <div className="flex text-amber-500">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < Math.floor(service.rating!)
                                ? "fill-current"
                                : "text-slate-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {service.rating}
                      </span>
                      {service.reviews_count && (
                        <span className="text-slate-500">
                          ({service.reviews_count} {t("services.reviews")})
                        </span>
                      )}
                    </div>
                  )}
                  {service.total_bookings && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      <span>
                        {service.total_bookings} {t("services.completedOrders")}
                      </span>
                    </div>
                  )}
                  {service.provider?.is_verified && (
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {t("services.verifiedProvider")}
                    </Badge>
                  )}
                </div>

                {/* Description */}
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                    {t("services.aboutThisService")}
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 whitespace-pre-line">
                    {service.description || t("services.noDescription")}
                  </p>
                </div>

                {/* Deliverables */}
                {service.deliverables && service.deliverables.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                      {t("services.whatYouGet")}
                    </h2>
                    <ul className="space-y-2">
                      {service.deliverables.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span className="text-slate-600 dark:text-slate-400">
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Requirements */}
                {service.requirements && service.requirements.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                      {t("services.requirements")}
                    </h2>
                    <ul className="space-y-2">
                      {service.requirements.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <Award className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                          <span className="text-slate-600 dark:text-slate-400">
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Provider Info */}
            {service.provider && (
              <Card className="border-slate-200 dark:border-slate-800">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                    {t("services.aboutProvider")}
                  </h2>
                  <div className="flex items-start gap-4">
                    <Avatar
                      name={service.provider.provider_name}
                      src={service.provider.logo_url}
                      className="h-16 w-16"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                          {service.provider.provider_name}
                        </h3>
                        {service.provider.is_verified && (
                          <Badge className="bg-emerald-100 text-emerald-700">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {t("services.verified")}
                          </Badge>
                        )}
                      </div>
                      {service.provider.location && (
                        <div className="flex items-center gap-2 text-slate-500 mb-3">
                          <MapPin className="h-4 w-4" />
                          {service.provider.location}
                        </div>
                      )}
                      {service.provider.bio && (
                        <p className="text-slate-600 dark:text-slate-400 mb-4">
                          {service.provider.bio}
                        </p>
                      )}
                      <div className="flex items-center gap-6 text-sm">
                        {service.provider.rating_avg && (
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-amber-500 fill-current" />
                            <span className="font-medium">
                              {service.provider.rating_avg}
                            </span>
                            <span className="text-slate-500">
                              {t("services.rating")}
                            </span>
                          </div>
                        )}
                        {service.provider.total_bookings && (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-indigo-500" />
                            <span className="font-medium">
                              {service.provider.total_bookings}
                            </span>
                            <span className="text-slate-500">
                              {t("services.orders")}
                            </span>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() =>
                          navigate(`/services/provider/${service.provider?.id}`)
                        }
                      >
                        {t("services.viewProfile")}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Booking Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 border-slate-200 dark:border-slate-800">
              <CardContent className="p-6 space-y-6">
                {/* Price */}
                <div>
                  {service.price ? (
                    <>
                      <span className="text-sm text-slate-500">
                        {t("services.startingAt")}
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                          {service.currency || "$"}
                          {service.price}
                        </span>
                        {service.price_type && (
                          <span className="text-slate-500">
                            /{service.price_type}
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <span className="text-lg font-semibold text-indigo-600">
                      {t("services.contactForPrice")}
                    </span>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-3">
                  {service.response_time && (
                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                      <Clock className="h-5 w-5 text-indigo-500" />
                      <span>
                        {t("services.responseTime")}: {service.response_time}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                    <Shield className="h-5 w-5 text-emerald-500" />
                    <span>{t("services.paymentProtection")}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    <span>{t("services.easyBooking")}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <Button
                    className="w-full h-12 text-lg bg-indigo-600 hover:bg-indigo-700"
                    onClick={handleBookNow}
                  >
                    {t("services.bookNow")}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-12"
                    onClick={handleContactProvider}
                  >
                    <MessageSquare className="h-5 w-5 mr-2" />
                    {t("services.contactProvider")}
                  </Button>
                </div>

                {/* Trust Badges */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Shield className="h-4 w-4" />
                      {t("services.secure")}
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      {t("services.verified")}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
