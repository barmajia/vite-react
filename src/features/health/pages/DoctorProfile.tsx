// src/features/health/pages/DoctorProfile.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  MapPin,
  Star,
  Clock,
  Calendar,
  Phone,
  Mail,
  Award,
  CheckCircle2,
  Heart,
  Share2,
  MessageSquare,
  Stethoscope,
  Building,
  GraduationCap,
  Languages,
  Video,
  DollarSign,
  Users,
  FileText,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  AlertCircle,
  Shield,
  TrendingUp,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { supabaseHealth } from "../api/supabaseHealth";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ServicesHeader } from "@/components/layout/ServicesHeader";
import type { HealthDoctorProfile } from "../types";

interface Review {
  id: string;
  rating: number;
  title: string;
  comment: string;
  created_at: string;
  patient_name: string;
  is_verified: boolean;
}

const DoctorProfile: React.FC = () => {
  const { t } = useTranslation();
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [doctor, setDoctor] = useState<HealthDoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState("about");

  useEffect(() => {
    fetchDoctor();
    fetchReviews();
  }, [doctorId]);

  const fetchDoctor = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabaseHealth
        .from("health_doctor_profiles")
        .select(
          `
          *,
          users:user_id (
            id,
            email,
            full_name,
            avatar_url,
            phone,
            created_at
          )
        `,
        )
        .eq("user_id", doctorId)
        .single();

      if (error) throw error;
      if (data) setDoctor(data);
    } catch (error) {
      console.error("Error fetching doctor:", error);
      toast.error(t("health.failedToLoadDoctor"));
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabaseHealth
        .from("health_reviews")
        .select(
          `
          *,
          patients:user_id (
            full_name,
            avatar_url
          )
        `,
        )
        .eq("doctor_id", doctorId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      if (data) setReviews(data);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  const handleBookAppointment = () => {
    if (!user) {
      toast.error(t("auth.pleaseLogin"));
      navigate("/login");
      return;
    }
    navigate(`/services/health/doctor/${doctorId}/book`);
  };

  const handleContact = () => {
    if (!user) {
      toast.error(t("auth.pleaseLogin"));
      navigate("/login");
      return;
    }
    toast.info(t("health.contactFeatureComingSoon"));
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
        ? t("health.removedFromFavorites")
        : t("health.addedToFavorites"),
    );
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: doctor?.users?.full_name,
        text: `Check out Dr. ${doctor?.users?.full_name} on Aurora Health`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success(t("common.linkCopied"));
    }
  };

  const ratingBreakdown = useMemo(() => {
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((review) => {
      breakdown[review.rating as keyof typeof breakdown]++;
    });
    return breakdown;
  }, [reviews]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#0f172a]">
        <ServicesHeader />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative w-24 h-24 flex items-center justify-center mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-100 dark:border-indigo-900 shadow-inner" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 border-r-indigo-500 animate-spin" />
              <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-full shadow-lg flex items-center justify-center z-10">
                <Stethoscope className="w-8 h-8 text-rose-500 animate-pulse" />
              </div>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-rose-500">
              Loading Doctor Profile...
            </h2>
            <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
              Fetching doctor information
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#0f172a]">
        <ServicesHeader />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center max-w-md px-4">
            <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Doctor Not Found
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              The doctor profile you're looking for doesn't exist or has been
              removed.
            </p>
            <Button
              onClick={() => navigate("/services/health/doctors")}
              className="bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700"
            >
              Browse Doctors
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#0f172a]">
      <ServicesHeader />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-6">
          <Link
            to="/services/health"
            className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
          >
            {t("health.healthcare")}
          </Link>
          <span>/</span>
          <Link
            to="/services/health/doctors"
            className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
          >
            {t("health.doctors")}
          </Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-medium">
            {doctor.users?.full_name}
          </span>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header Card */}
            <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
              <CardContent className="p-0">
                {/* Cover Image */}
                <div className="relative h-48 bg-gradient-to-br from-rose-500 to-indigo-600 dark:from-rose-700 dark:to-indigo-800">
                  <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                  <div className="absolute -bottom-16 left-8">
                    <div className="w-32 h-32 rounded-2xl bg-white dark:bg-slate-900 border-4 border-white dark:border-slate-900 shadow-xl flex items-center justify-center">
                      <Avatar
                        name={doctor.users?.full_name}
                        src={doctor.users?.avatar_url}
                        className="w-28 h-28"
                      />
                    </div>
                  </div>
                  {doctor.is_verified && (
                    <Badge className="absolute top-4 right-4 bg-emerald-500/90 text-white border-0 backdrop-blur-md">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Verified Doctor
                    </Badge>
                  )}
                </div>

                {/* Info Section */}
                <div className="pt-20 px-6 pb-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
                        {doctor.users?.full_name}
                      </h1>
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-3">
                        <Stethoscope className="h-4 w-4" />
                        <span className="font-medium">
                          {doctor.specialization}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                        {doctor.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {doctor.location}
                          </div>
                        )}
                        {doctor.years_of_experience && (
                          <div className="flex items-center gap-1">
                            <Award className="h-4 w-4" />
                            {doctor.years_of_experience} years experience
                          </div>
                        )}
                        {doctor.rating_avg && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                            {doctor.rating_avg.toFixed(1)} (
                            {doctor.review_count || 0} reviews)
                          </div>
                        )}
                      </div>
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
                            isWishlisted ? "fill-rose-500 text-rose-500" : ""
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

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        {doctor.total_appointments || 0}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Appointments
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        {doctor.rating_avg?.toFixed(1) || "0"}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Rating
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        {doctor.review_count || 0}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Reviews
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs Section */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-6"
            >
              <TabsList className="grid w-full grid-cols-4 bg-slate-100 dark:bg-slate-800">
                <TabsTrigger value="about">{t("health.about")}</TabsTrigger>
                <TabsTrigger value="education">
                  {t("health.education")}
                </TabsTrigger>
                <TabsTrigger value="availability">
                  {t("health.availability")}
                </TabsTrigger>
                <TabsTrigger value="reviews">{t("health.reviews")}</TabsTrigger>
              </TabsList>

              {/* About Tab */}
              <TabsContent value="about" className="space-y-6">
                <Card className="border-slate-200 dark:border-slate-800">
                  <CardContent className="p-6 space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                        About Dr. {doctor.users?.full_name?.split(" ")[0]}
                      </h2>
                      <p className="text-slate-600 dark:text-slate-400 whitespace-pre-line leading-relaxed">
                        {doctor.bio ||
                          "No bio available. This doctor hasn't added a personal description yet."}
                      </p>
                    </div>

                    {/* Consultation Types */}
                    {doctor.consultation_types &&
                      doctor.consultation_types.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                            Consultation Types
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {doctor.consultation_types.map((type, idx) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400"
                              >
                                {type === "in_clinic" ? (
                                  <>
                                    <Building className="h-3 w-3 mr-1" />
                                    In-Clinic
                                  </>
                                ) : type === "online" ? (
                                  <>
                                    <Video className="h-3 w-3 mr-1" />
                                    Online Video
                                  </>
                                ) : (
                                  <>
                                    <Phone className="h-3 w-3 mr-1" />
                                    Phone
                                  </>
                                )}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Hospital Affiliations */}
                    {doctor.hospital_affiliations &&
                      doctor.hospital_affiliations.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                            Hospital Affiliations
                          </h3>
                          <ul className="space-y-2">
                            {doctor.hospital_affiliations.map(
                              (hospital, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-center gap-2 text-slate-600 dark:text-slate-400"
                                >
                                  <Building className="h-4 w-4 text-rose-500 flex-shrink-0" />
                                  {hospital}
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                      )}

                    {/* Languages */}
                    {doctor.languages && doctor.languages.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                          Languages Spoken
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {doctor.languages.map((lang, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="flex items-center gap-1"
                            >
                              <Languages className="h-3 w-3" />
                              {lang}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Insurance */}
                    {doctor.accepts_insurance && doctor.accepted_insurances && (
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                          Insurance Accepted
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {doctor.accepted_insurances.map((insurance, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                            >
                              <Shield className="h-3 w-3 mr-1" />
                              {insurance}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Education Tab */}
              <TabsContent value="education" className="space-y-6">
                <Card className="border-slate-200 dark:border-slate-800">
                  <CardContent className="p-6 space-y-6">
                    {/* Education */}
                    {doctor.education && doctor.education.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                          <GraduationCap className="h-5 w-5 text-rose-500" />
                          Education
                        </h3>
                        <ul className="space-y-3">
                          {doctor.education.map((edu, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                              <div className="w-2 h-2 rounded-full bg-rose-500 mt-2 flex-shrink-0" />
                              <span className="text-slate-600 dark:text-slate-400">
                                {edu}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Certifications */}
                    {doctor.certifications &&
                      doctor.certifications.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Award className="h-5 w-5 text-rose-500" />
                            Certifications & Licenses
                          </h3>
                          <ul className="space-y-3">
                            {doctor.certifications.map((cert, idx) => (
                              <li key={idx} className="flex items-start gap-3">
                                <div className="w-2 h-2 rounded-full bg-rose-500 mt-2 flex-shrink-0" />
                                <span className="text-slate-600 dark:text-slate-400">
                                  {cert}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                    {/* License Info */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                        License Information
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">
                            License Number:
                          </span>
                          <span className="font-medium text-slate-900 dark:text-white">
                            {doctor.license_number}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">
                            Status:
                          </span>
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        </div>
                        {doctor.license_country && (
                          <div className="flex justify-between">
                            <span className="text-slate-500 dark:text-slate-400">
                              Country:
                            </span>
                            <span className="font-medium text-slate-900 dark:text-white">
                              {doctor.license_country}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Availability Tab */}
              <TabsContent value="availability" className="space-y-6">
                <Card className="border-slate-200 dark:border-slate-800">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-rose-500" />
                      Weekly Schedule
                    </h3>
                    <div className="space-y-3">
                      {doctor.availability_schedule &&
                      doctor.availability_schedule.length > 0 ? (
                        doctor.availability_schedule.map((day, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800"
                          >
                            <span className="font-medium text-slate-900 dark:text-white capitalize">
                              {day.day}
                            </span>
                            <div className="flex gap-2">
                              {day.is_day_off ? (
                                <Badge
                                  variant="secondary"
                                  className="bg-slate-200 dark:bg-slate-700"
                                >
                                  Day Off
                                </Badge>
                              ) : (
                                day.slots.map((slot, slotIdx) => (
                                  <Badge
                                    key={slotIdx}
                                    variant="secondary"
                                    className="bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400"
                                  >
                                    {slot.start} - {slot.end}
                                  </Badge>
                                ))
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-slate-500 dark:text-slate-400 text-center py-8">
                          No availability schedule set. Please contact the
                          doctor's office.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="space-y-6">
                <Card className="border-slate-200 dark:border-slate-800">
                  <CardContent className="p-6 space-y-6">
                    {/* Rating Summary */}
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-5xl font-extrabold text-slate-900 dark:text-white mb-2">
                          {doctor.rating_avg?.toFixed(1) || "0"}
                        </div>
                        <div className="flex text-amber-500 justify-center mb-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-5 w-5 ${
                                i < Math.floor(doctor.rating_avg || 0)
                                  ? "fill-current"
                                  : "text-slate-300 dark:text-slate-600"
                              }`}
                            />
                          ))}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {doctor.review_count || 0} reviews
                        </div>
                      </div>

                      <Separator orientation="vertical" className="h-32" />

                      {/* Rating Breakdown */}
                      <div className="flex-1 space-y-2">
                        {[5, 4, 3, 2, 1].map((rating) => (
                          <div key={rating} className="flex items-center gap-2">
                            <span className="text-sm text-slate-600 dark:text-slate-400 w-3">
                              {rating}
                            </span>
                            <Progress
                              value={
                                (ratingBreakdown[
                                  rating as keyof typeof ratingBreakdown
                                ] /
                                  (doctor.review_count || 1)) *
                                100
                              }
                              className="flex-1 h-2"
                            />
                            <span className="text-sm text-slate-500 dark:text-slate-400 w-8">
                              {
                                ratingBreakdown[
                                  rating as keyof typeof ratingBreakdown
                                ]
                              }
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Reviews List */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Patient Reviews
                      </h3>
                      {reviews.length > 0 ? (
                        <>
                          {reviews
                            .slice(0, showAllReviews ? reviews.length : 3)
                            .map((review) => (
                              <div
                                key={review.id}
                                className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 space-y-3"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <Avatar
                                      name={review.patient_name}
                                      className="h-10 w-10"
                                    />
                                    <div>
                                      <div className="font-medium text-slate-900 dark:text-white">
                                        {review.patient_name}
                                      </div>
                                      <div className="text-xs text-slate-500 dark:text-slate-400">
                                        {new Date(
                                          review.created_at,
                                        ).toLocaleDateString()}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="flex text-amber-500">
                                      {[...Array(5)].map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`h-4 w-4 ${
                                            i < review.rating
                                              ? "fill-current"
                                              : "text-slate-300 dark:text-slate-600"
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    {review.is_verified && (
                                      <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Verified
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                {review.title && (
                                  <div className="font-medium text-slate-900 dark:text-white">
                                    {review.title}
                                  </div>
                                )}
                                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                  {review.comment}
                                </p>
                              </div>
                            ))}
                          {reviews.length > 3 && (
                            <Button
                              variant="ghost"
                              onClick={() => setShowAllReviews(!showAllReviews)}
                              className="w-full"
                            >
                              {showAllReviews ? (
                                <>
                                  <ChevronUp className="h-4 w-4 mr-2" />
                                  Show Less
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-4 w-4 mr-2" />
                                  Show All {reviews.length} Reviews
                                </>
                              )}
                            </Button>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-12">
                          <FileText className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                            No Reviews Yet
                          </h3>
                          <p className="text-slate-500 dark:text-slate-400">
                            Be the first patient to review this doctor
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Booking Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 border-slate-200 dark:border-slate-800">
              <CardContent className="p-6 space-y-6">
                {/* Price */}
                <div>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    Consultation Fee
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                      ${doctor.consultation_fee || "0"}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      /session
                    </span>
                  </div>
                  {doctor.emergency_fee && (
                    <div className="mt-2 text-sm text-rose-600 dark:text-rose-400">
                      Emergency: ${doctor.emergency_fee}
                    </div>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-3">
                  {doctor.emergency_availability && (
                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                      <AlertCircle className="h-5 w-5 text-rose-500" />
                      <span>Emergency Available</span>
                    </div>
                  )}
                  {doctor.consultation_types?.includes("online") && (
                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                      <Video className="h-5 w-5 text-blue-500" />
                      <span>Online Consultation</span>
                    </div>
                  )}
                  {doctor.consultation_types?.includes("in_clinic") && (
                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                      <Building className="h-5 w-5 text-emerald-500" />
                      <span>Clinic Visit</span>
                    </div>
                  )}
                  {doctor.accepts_insurance && (
                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                      <Shield className="h-5 w-5 text-indigo-500" />
                      <span>Accepts Insurance</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <span>Verified License</span>
                  </div>
                </div>

                <Separator />

                {/* Actions */}
                <div className="space-y-3">
                  <Button
                    className="w-full h-12 text-lg bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700"
                    onClick={handleBookAppointment}
                  >
                    <CalendarDays className="h-5 w-5 mr-2" />
                    Book Appointment
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-12"
                    onClick={handleContact}
                  >
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Contact Doctor
                  </Button>
                </div>

                {/* Contact Info */}
                <Separator />

                <div className="space-y-3 text-sm">
                  {doctor.users?.phone && (
                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                      <Phone className="h-4 w-4" />
                      <span>{doctor.users.phone}</span>
                    </div>
                  )}
                  {doctor.users?.email && (
                    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                      <Mail className="h-4 w-4" />
                      <span>{doctor.users.email}</span>
                    </div>
                  )}
                </div>

                {/* Trust Badges */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <Shield className="h-4 w-4" />
                      <span>Secure Booking</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Verified</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer Spacer */}
      <div className="h-24 bg-slate-50 dark:bg-slate-950" />
    </div>
  );
};

export default DoctorProfile;
