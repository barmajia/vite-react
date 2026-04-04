/**
 * Hospital Detail Page
 * Route: /services/health/hospitals/:hospitalId
 *
 * Displays detailed information about a hospital/clinic
 * Uses existing sellers + products tables
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Star,
  CheckCircle2,
  Calendar,
  MessageSquare,
  Share2,
  Heart,
  Award,
  Users,
  Building2,
  Stethoscope,
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
import { Separator } from "@/components/ui/separator";

interface HospitalDetail {
  id: string;
  name: string;
  location: string | null;
  phone: string | null;
  email: string | null;
  avatar: string | null;
  isVerified: boolean;
  joinedDate: string;
  description: string | null;
  specialties: string[];
  features: string[];
  servicesCount: number;
  averageRating: number;
  totalReviews: number;
  healthProducts: any[];
  stats: {
    totalServices: number;
    averageRating: number;
    totalReviews: number;
  };
}

export function HospitalDetailPage() {
  const { t } = useTranslation();
  const { hospitalId } = useParams<{ hospitalId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hospital, setHospital] = useState<HospitalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    fetchHospital();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hospitalId]);

  const fetchHospital = async () => {
    setLoading(true);
    try {
      // Get hospital (seller) details
      const { data: seller, error: sellerError } = await supabase
        .from("sellers")
        .select(
          `
          *,
          users (avatar_url, phone, email)
        `,
        )
        .eq("user_id", hospitalId)
        .eq("account_type", "seller")
        .single();

      if (sellerError) throw sellerError;
      if (!seller) {
        toast.error(t("health.hospitalNotFound"));
        navigate("/services/health/hospitals");
        return;
      }

      // Get health-related products (services offered by hospital)
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select(
          `
          *,
          reviews (rating)
        `,
        )
        .eq("seller_id", seller.id)
        .eq("category", "Health & Medical")
        .eq("status", "active")
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (productsError) throw productsError;

      // Calculate stats
      const healthProducts = products || [];
      const totalReviews = healthProducts.reduce(
        (sum, p) => sum + (p.review_count || 0),
        0,
      );
      const averageRating =
        healthProducts.length > 0
          ? healthProducts.reduce(
              (sum, p) => sum + (p.average_rating || 0),
              0,
            ) / healthProducts.length
          : 0;

      // Extract unique specialties and features
      const specialties = [
        ...new Set(healthProducts.map((p) => p.subcategory).filter(Boolean)),
      ];
      const features = [
        ...new Set(healthProducts.flatMap((p) => p.attributes?.features || [])),
      ];

      setHospital({
        id: seller.user_id,
        name: seller.full_name,
        location: seller.location,
        phone: seller.phone || seller.users?.phone,
        email: seller.users?.email,
        avatar: seller.users?.avatar_url,
        isVerified: seller.is_verified,
        joinedDate: seller.created_at,
        description: seller.bio,
        specialties,
        features,
        servicesCount: healthProducts.length,
        averageRating: parseFloat(averageRating.toFixed(2)),
        totalReviews,
        healthProducts,
        stats: {
          totalServices: healthProducts.length,
          averageRating: parseFloat(averageRating.toFixed(2)),
          totalReviews,
        },
      });
    } catch (error) {
      console.error("Error fetching hospital:", error);
      toast.error(t("health.failedToLoadHospital"));
    } finally {
      setLoading(false);
    }
  };

  const handleContactHospital = () => {
    if (!user) {
      toast.error(t("auth.pleaseLogin"));
      navigate("/login");
      return;
    }
    toast.info(t("health.contactFeatureComingSoon"));
  };

  const handleBookAppointment = (service?: any) => {
    if (!user) {
      toast.error(t("auth.pleaseLogin"));
      navigate("/login");
      return;
    }
    if (service) {
      navigate(
        `/services/health/hospitals/${hospitalId}/book?service=${service.id}`,
      );
    } else {
      toast.info(t("health.bookAppointmentFeatureComingSoon"));
    }
  };

  const handleWishlist = () => {
    if (!user) {
      toast.error(t("auth.pleaseLogin"));
      navigate("/login");
      return;
    }
    setIsWishlisted(!isWishlisted);
    toast.success(
      isWishlisted
        ? t("health.removedFromWishlist")
        : t("health.addedToWishlist"),
    );
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: hospital?.name,
        text: t("health.checkOutHospital"),
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success(t("common.linkCopied"));
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= Math.floor(rating)
                ? "fill-amber-400 text-amber-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <ServicesHeader />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">
              {t("health.loadingHospital")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <ServicesHeader />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center max-w-md">
            <Building2 className="h-20 w-20 text-slate-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {t("health.hospitalNotFound")}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {t("health.hospitalNotFoundDesc")}
            </p>
            <Button onClick={() => navigate("/services/health/hospitals")}>
              {t("health.browseHospitals")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <ServicesHeader />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-900 dark:to-teal-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-start gap-6">
            <Avatar
              src={hospital.avatar}
              name={hospital.name}
              className="h-24 w-24 border-4 border-white/30"
            />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{hospital.name}</h1>
                {hospital.isVerified && (
                  <Badge className="bg-emerald-500/90 text-white border-0">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {t("health.verified")}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-emerald-100">
                {renderStars(hospital.averageRating)}
                <span>
                  {hospital.averageRating} ({hospital.totalReviews}{" "}
                  {t("health.reviews")})
                </span>
                <span>•</span>
                <span>
                  {hospital.servicesCount} {t("health.services")}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleWishlist}
                className="bg-white/10 hover:bg-white/20 text-white"
              >
                <Heart
                  className={`h-5 w-5 ${isWishlisted ? "fill-white" : ""}`}
                />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleShare}
                className="bg-white/10 hover:bg-white/20 text-white"
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Hospital */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                  {t("health.aboutHospital")}
                </h2>
                {hospital.description ? (
                  <p className="text-slate-600 dark:text-slate-400">
                    {hospital.description}
                  </p>
                ) : (
                  <p className="text-slate-400 italic">
                    {t("health.noDescription")}
                  </p>
                )}

                {/* Hospital Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-sm text-slate-500">
                        {t("health.experience")}
                      </p>
                      <p className="font-semibold">
                        {Math.floor(
                          (new Date().getTime() -
                            new Date(hospital.joinedDate).getTime()) /
                            (1000 * 60 * 60 * 24 * 365),
                        )}{" "}
                        {t("health.years")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-sm text-slate-500">
                        {t("health.patientsServed")}
                      </p>
                      <p className="font-semibold">{hospital.totalReviews}+</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Stethoscope className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-sm text-slate-500">
                        {t("health.servicesOffered")}
                      </p>
                      <p className="font-semibold">{hospital.servicesCount}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Specialties */}
            {hospital.specialties.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                    {t("health.specialties")}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {hospital.specialties.map((specialty, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      >
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Services Offered */}
            {hospital.healthProducts.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                    {t("health.servicesOffered")}
                  </h2>
                  <div className="space-y-4">
                    {hospital.healthProducts.map((service) => (
                      <div
                        key={service.id}
                        className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                              {service.title}
                            </h3>
                            {service.description && (
                              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                                {service.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                              {service.average_rating && (
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                  <span>{service.average_rating}</span>
                                </div>
                              )}
                              {service.review_count && (
                                <span>
                                  ({service.review_count} {t("health.reviews")})
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {service.price ? (
                              <>
                                <p className="text-sm text-slate-500">
                                  {t("health.startingAt")}
                                </p>
                                <p className="text-lg font-bold text-emerald-600">
                                  {service.currency}
                                  {service.price.toFixed(2)}
                                </p>
                              </>
                            ) : (
                              <p className="text-sm text-slate-500">
                                {t("health.contactForPrice")}
                              </p>
                            )}
                            <Button
                              size="sm"
                              className="mt-2 bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => handleBookAppointment(service)}
                            >
                              {t("health.bookNow")}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Features & Amenities */}
            {hospital.features.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                    {t("health.featuresAmenities")}
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {hospital.features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-slate-600 dark:text-slate-400"
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Card */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  {t("health.contactInformation")}
                </h3>
                <Separator />

                {hospital.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-emerald-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">
                        {t("health.location")}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {hospital.location}
                      </p>
                    </div>
                  </div>
                )}

                {hospital.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-sm font-medium">{t("health.phone")}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {hospital.phone}
                      </p>
                    </div>
                  </div>
                )}

                {hospital.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-sm font-medium">{t("health.email")}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                        {hospital.email}
                      </p>
                    </div>
                  </div>
                )}

                <div className="pt-4 space-y-2">
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => handleBookAppointment()}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    {t("health.bookAppointment")}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleContactHospital}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {t("health.contactHospital")}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Opening Hours */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-emerald-600" />
                  {t("health.openingHours")}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">
                      {t("health.weekdays")}
                    </span>
                    <span className="font-medium">8:00 AM - 8:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">
                      {t("health.saturday")}
                    </span>
                    <span className="font-medium">9:00 AM - 5:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">
                      {t("health.sunday")}
                    </span>
                    <span className="font-medium text-emerald-600">
                      {t("health.emergencyOnly")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Insurance Accepted */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                  {t("health.insuranceAccepted")}
                </h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Blue Cross</Badge>
                  <Badge variant="outline">Aetna</Badge>
                  <Badge variant="outline">Cigna</Badge>
                  <Badge variant="outline">UnitedHealth</Badge>
                  <Badge variant="outline">Medicare</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
