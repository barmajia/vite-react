/**
 * Hospital Detail Page
 * Route: /services/health/hospitals/:hospitalId
 *
 * Displays detailed information about a hospital/clinic
 * Uses new hospitals table with hospital_type column
 */

import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
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
  Bed,
  AlertCircle,
  Globe,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { HealthHeader } from "../components/HealthHeader";
import { Separator } from "@/components/ui/separator";

// Hospital type mapping for display
const HOSPITAL_TYPE_LABELS: Record<string, string> = {
  general: "General Hospital",
  specialized: "Specialized Center",
  clinic: "Clinic",
  dental: "Dental Clinic",
  teaching: "Teaching Hospital",
  public: "Public Hospital",
  private: "Private Hospital",
  emergency: "Emergency Center",
  maternity: "Maternity Hospital",
  psychiatric: "Psychiatric Center",
  rehabilitation: "Rehabilitation Center",
  veterinary: "Veterinary Clinic",
};

interface HospitalDetail {
  id: string;
  owner_user_id: string;
  name: string;
  slug: string;
  location: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  avatar_url: string | null;
  cover_image_url: string | null;
  hospital_type: string;
  is_verified: boolean;
  is_active: boolean;
  description: string | null;
  specialties: string[];
  features: string[];
  opening_hours: Record<string, string>;
  bed_capacity: number | null;
  emergency_services: boolean;
  average_rating: number;
  total_reviews: number;
  total_services: number;
  joinedDate: string;
  healthProducts: any[];
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
  }, [hospitalId]);

  const fetchHospital = async () => {
    setLoading(true);
    try {
      // Get hospital details from new hospitals table
      const { data: hospitalData, error: hospitalError } = await supabase
        .from("hospitals")
        .select(
          `
          *,
          health_services:products(
            id,
            title,
            description,
            price,
            currency,
            category,
            subcategory,
            attributes,
            average_rating,
            review_count,
            images,
            status
          )
        `,
        )
        .eq("id", hospitalId)
        .eq("is_active", true)
        .single();

      if (hospitalError) throw hospitalError;
      if (!hospitalData) {
        toast.error(t("health.hospitalNotFound"));
        navigate("/health/hospitals");
        return;
      }

      // Filter health-related services
      const healthProducts = (hospitalData.health_services || []).filter(
        (p: any) => p.category === "Health & Medical" && p.status === "active",
      );

      setHospital({
        ...hospitalData,
        healthProducts,
        // Ensure arrays exist
        specialties: hospitalData.specialties || [],
        features: hospitalData.features || [],
        opening_hours: hospitalData.opening_hours || {},
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
    if (hospital?.email) {
      window.location.href = `mailto:${hospital.email}`;
    } else if (hospital?.phone) {
      window.location.href = `tel:${hospital.phone}`;
    } else {
      toast.info(t("health.contactFeatureComingSoon"));
    }
  };

  const handleBookAppointment = (service?: any) => {
    if (!user) {
      toast.error(t("auth.pleaseLogin"));
      navigate("/login");
      return;
    }
    if (service) {
      navigate(`/health/hospitals/${hospitalId}/book?service=${service.id}`);
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

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: hospital?.name,
          text: t("health.checkOutHospital"),
          url: shareUrl,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          navigator.clipboard.writeText(shareUrl);
          toast.success(t("common.linkCopied"));
        }
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
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
              star <= Math.round(rating)
                ? "fill-amber-400 text-amber-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const formatOpeningHours = (hours: Record<string, string>) => {
    const days = [
      { key: "monday", label: t("health.monday") },
      { key: "tuesday", label: t("health.tuesday") },
      { key: "wednesday", label: t("health.wednesday") },
      { key: "thursday", label: t("health.thursday") },
      { key: "friday", label: t("health.friday") },
      { key: "saturday", label: t("health.saturday") },
      { key: "sunday", label: t("health.sunday") },
    ];
    return days.map((day) => ({
      day: day.label,
      hours: hours[day.key] || t("health.closed"),
      isEmergency: day.key === "sunday" && hospital?.emergency_services,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <HealthHeader />
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
        <HealthHeader />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center max-w-md px-4">
            <Building2 className="h-20 w-20 text-slate-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {t("health.hospitalNotFound")}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {t("health.hospitalNotFoundDesc")}
            </p>
            <Button onClick={() => navigate("/health/hospitals")}>
              {t("health.browseHospitals")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const hospitalTypeLabel =
    HOSPITAL_TYPE_LABELS[hospital.hospital_type] || hospital.hospital_type;
  const openingHours = formatOpeningHours(hospital.opening_hours);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <HealthHeader />

      {/* Hero Section with Cover Image */}
      <div className="relative bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-900 dark:to-teal-900 text-white">
        {hospital.cover_image_url && (
          <div className="absolute inset-0 opacity-20">
            <img
              src={hospital.cover_image_url}
              alt={hospital.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="relative max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <Avatar
              src={hospital.avatar_url}
              name={hospital.name}
              className="h-24 w-24 border-4 border-white/30 shadow-lg"
            />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{hospital.name}</h1>
                <div className="flex items-center gap-2">
                  {hospital.is_verified && (
                    <Badge className="bg-emerald-500/90 text-white border-0">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {t("health.verified")}
                    </Badge>
                  )}
                  <Badge
                    variant="secondary"
                    className="bg-white/20 text-white border-0"
                  >
                    {hospitalTypeLabel}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-emerald-100">
                {renderStars(hospital.average_rating)}
                <span>
                  {hospital.average_rating} ({hospital.total_reviews}{" "}
                  {t("health.reviews")})
                </span>
                <span>•</span>
                <span>
                  {hospital.total_services} {t("health.services")}
                </span>
                {hospital.emergency_services && (
                  <>
                    <span>•</span>
                    <Badge className="bg-red-500/90 text-white border-0 text-xs">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {t("health.emergencyAvailable")}
                    </Badge>
                  </>
                )}
              </div>
              {hospital.location && (
                <div className="flex items-center gap-2 mt-2 text-emerald-100/90">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{hospital.location}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleWishlist}
                className="bg-white/10 hover:bg-white/20 text-white"
              >
                <Heart
                  className={`h-5 w-5 ${isWishlisted ? "fill-white" : ""}`}
                />
              </Button>
              <Button
                variant="ghost"
                size="sm"
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
              <CardHeader>
                <CardTitle>{t("health.aboutHospital")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {hospital.description ? (
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {hospital.description}
                  </p>
                ) : (
                  <p className="text-slate-400 italic">
                    {t("health.noDescription")}
                  </p>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                  <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <Award className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                    <p className="text-xs text-slate-500">
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
                  <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <Users className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                    <p className="text-xs text-slate-500">
                      {t("health.patientsServed")}
                    </p>
                    <p className="font-semibold">{hospital.total_reviews}+</p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <Stethoscope className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                    <p className="text-xs text-slate-500">
                      {t("health.servicesOffered")}
                    </p>
                    <p className="font-semibold">{hospital.total_services}</p>
                  </div>
                  {hospital.bed_capacity && (
                    <div className="text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <Bed className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                      <p className="text-xs text-slate-500">
                        {t("health.bedCapacity")}
                      </p>
                      <p className="font-semibold">{hospital.bed_capacity}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Specialties */}
            {hospital.specialties.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("health.specialties")}</CardTitle>
                </CardHeader>
                <CardContent>
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
                <CardHeader>
                  <CardTitle>{t("health.servicesOffered")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {hospital.healthProducts.map((service) => (
                      <div
                        key={service.id}
                        className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                              {service.title}
                            </h3>
                            {service.subcategory && (
                              <Badge variant="outline" className="mb-2 text-xs">
                                {service.subcategory}
                              </Badge>
                            )}
                            {service.description && (
                              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                                {service.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                              {service.average_rating > 0 && (
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                  <span>{service.average_rating}</span>
                                </div>
                              )}
                              {service.review_count > 0 && (
                                <span>
                                  ({service.review_count} {t("health.reviews")})
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right sm:text-left">
                            {service.price ? (
                              <>
                                <p className="text-sm text-slate-500">
                                  {t("health.startingAt")}
                                </p>
                                <p className="text-lg font-bold text-emerald-600">
                                  {service.currency} {service.price.toFixed(2)}
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
                <CardHeader>
                  <CardTitle>{t("health.featuresAmenities")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {hospital.features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-slate-600 dark:text-slate-400"
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
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
              <CardHeader>
                <CardTitle className="text-lg">
                  {t("health.contactInformation")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {hospital.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">
                        {t("health.address")}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {hospital.address}
                        {hospital.city && `, ${hospital.city}`}
                        {hospital.state && `, ${hospital.state}`}
                        {hospital.country && `, ${hospital.country}`}
                      </p>
                    </div>
                  </div>
                )}
                {hospital.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{t("health.phone")}</p>
                      <a
                        href={`tel:${hospital.phone}`}
                        className="text-sm text-emerald-600 hover:underline"
                      >
                        {hospital.phone}
                      </a>
                    </div>
                  </div>
                )}
                {hospital.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{t("health.email")}</p>
                      <a
                        href={`mailto:${hospital.email}`}
                        className="text-sm text-emerald-600 hover:underline truncate block"
                      >
                        {hospital.email}
                      </a>
                    </div>
                  </div>
                )}
                {hospital.website_url && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">
                        {t("health.website")}
                      </p>
                      <a
                        href={hospital.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-emerald-600 hover:underline truncate block"
                      >
                        {hospital.website_url.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                  </div>
                )}

                <Separator className="my-4" />

                <div className="space-y-2">
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
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-emerald-600" />
                  {t("health.openingHours")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {openingHours.map((slot, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center"
                    >
                      <span className="text-slate-600 dark:text-slate-400">
                        {slot.day}
                      </span>
                      <span
                        className={`font-medium ${slot.isEmergency ? "text-emerald-600" : ""}`}
                      >
                        {slot.isEmergency
                          ? t("health.emergencyOnly")
                          : slot.hours}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Insurance Accepted (Static for now - can be made dynamic) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {t("health.insuranceAccepted")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Blue Cross",
                    "Aetna",
                    "Cigna",
                    "UnitedHealth",
                    "Medicare",
                  ].map((insurer) => (
                    <Badge key={insurer} variant="outline" className="text-xs">
                      {insurer}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Location Map Placeholder */}
            {hospital.latitude && hospital.longitude && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {t("health.location")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                    <div className="text-center text-slate-500">
                      <MapPin className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">{t("health.mapComingSoon")}</p>
                      <p className="text-xs mt-1">
                        {hospital.latitude?.toFixed(4)},{" "}
                        {hospital.longitude?.toFixed(4)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
