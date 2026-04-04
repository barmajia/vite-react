// src/features/health/pages/DoctorList.tsx
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  Filter,
  MapPin,
  Star,
  Calendar,
  Video,
  Building,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  Heart,
  Brain,
  Bone,
  Baby,
  Eye,
  Activity,
  ArrowRight,
  X,
} from "lucide-react";
import { getVerifiedDoctors } from "../api/supabaseHealth";
import type { HealthDoctorProfile } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ServicesHeader } from "@/components/layout/ServicesHeader";

const DoctorList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, _setSearchParams] = useSearchParams();
  const [doctors, setDoctors] = useState<HealthDoctorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] =
    useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("rating");
  const [consultationType, setConsultationType] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [showFilters, setShowFilters] = useState(false);

  const isEmergency = searchParams.get("emergency") === "true";

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const data = await getVerifiedDoctors();
      setDoctors(data);
    } catch (error) {
      console.error("Error loading doctors:", error);
      toast.error("Failed to load doctors. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort doctors
  const filteredDoctors = useMemo(() => {
    let filtered = [...doctors];

    // Emergency filter
    if (isEmergency) {
      filtered = filtered.filter((d) => d.emergency_availability);
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.specialization.toLowerCase().includes(query) ||
          d.bio?.toLowerCase().includes(query) ||
          d.location?.toLowerCase().includes(query) ||
          d.languages?.some((lang) => lang.toLowerCase().includes(query)),
      );
    }

    // Specialization filter
    if (selectedSpecialization !== "all") {
      filtered = filtered.filter(
        (d) =>
          d.specialization.toLowerCase() ===
          selectedSpecialization.toLowerCase(),
      );
    }

    // Consultation type filter
    if (consultationType !== "all") {
      filtered = filtered.filter((d) =>
        d.consultation_types?.includes(consultationType as any),
      );
    }

    // Price range filter
    const feeField = isEmergency ? "emergency_fee" : "consultation_fee";
    filtered = filtered.filter(
      (d) =>
        d[feeField] &&
        d[feeField]! >= priceRange[0] &&
        d[feeField]! <= priceRange[1],
    );

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return (b.rating_avg || 0) - (a.rating_avg || 0);
        case "fee_low":
          return (a[feeField] || 0) - (b[feeField] || 0);
        case "fee_high":
          return (b[feeField] || 0) - (a[feeField] || 0);
        case "experience":
          return (b.years_of_experience || 0) - (a.years_of_experience || 0);
        case "reviews":
          return (b.review_count || 0) - (a.review_count || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [
    doctors,
    searchQuery,
    selectedSpecialization,
    sortBy,
    consultationType,
    priceRange,
    isEmergency,
  ]);

  const getSpecializationIcon = (specialization: string) => {
    const spec = specialization.toLowerCase();
    if (spec.includes("cardio")) return <Heart className="h-5 w-5" />;
    if (spec.includes("neuro")) return <Brain className="h-5 w-5" />;
    if (spec.includes("ortho") || spec.includes("bone"))
      return <Bone className="h-5 w-5" />;
    if (spec.includes("pediatric") || spec.includes("child"))
      return <Baby className="h-5 w-5" />;
    if (spec.includes("eye") || spec.includes("ophthal"))
      return <Eye className="h-5 w-5" />;
    if (spec.includes("dent")) return <Activity className="h-5 w-5" />;
    return <Stethoscope className="h-5 w-5" />;
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedSpecialization("all");
    setConsultationType("all");
    setPriceRange([0, 500]);
    setSortBy("rating");
  };

  const activeFiltersCount = [
    selectedSpecialization !== "all",
    consultationType !== "all",
    priceRange[0] > 0 || priceRange[1] < 500,
  ].filter(Boolean).length;

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
              Finding Doctors...
            </h2>
            <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
              Searching our verified network
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#0f172a]">
      <ServicesHeader />

      {/* Hero Section */}
      <div className="relative pt-24 pb-12 px-4 overflow-hidden bg-gradient-to-br from-rose-600 to-indigo-700 dark:from-rose-900 dark:to-indigo-900">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-white/5 rounded-full blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px]" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-8">
            <Badge className="bg-rose-500/20 text-rose-200 border-rose-400/30 text-sm px-4 py-1.5 rounded-full mb-4">
              {isEmergency ? (
                <>
                  <AlertCircle className="w-4 h-4 mr-2 inline" />
                  Emergency Care
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2 inline" />
                  Verified Doctors
                </>
              )}
            </Badge>

            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tight">
              {isEmergency ? "🚑 Emergency Doctors" : "Find Your Doctor"}
            </h1>
            <p className="text-xl text-rose-100 max-w-3xl mx-auto">
              {isEmergency
                ? "Connect with available doctors for urgent care"
                : "Browse our network of verified healthcare professionals"}
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search by specialization, name, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 rounded-full bg-white text-slate-900 border-0 focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                size="lg"
                className="h-14 px-6 rounded-full bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Filter className="h-5 w-5 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge className="ml-2 bg-rose-500 text-white">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          {isEmergency && (
            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                onClick={() => navigate("/services/health/doctors")}
                className="text-white hover:bg-white/10"
              >
                View All Doctors
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Card className="border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Filters
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-slate-500"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Specialization */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Specialization
                  </label>
                  <Select
                    value={selectedSpecialization}
                    onValueChange={setSelectedSpecialization}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select specialization" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Specializations</SelectItem>
                      <SelectItem value="cardiology">Cardiology</SelectItem>
                      <SelectItem value="dermatology">Dermatology</SelectItem>
                      <SelectItem value="pediatrics">Pediatrics</SelectItem>
                      <SelectItem value="orthopedics">Orthopedics</SelectItem>
                      <SelectItem value="neurology">Neurology</SelectItem>
                      <SelectItem value="general">General Practice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Consultation Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Consultation Type
                  </label>
                  <Select
                    value={consultationType}
                    onValueChange={setConsultationType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="in_clinic">In-Clinic</SelectItem>
                      <SelectItem value="online">Online Video</SelectItem>
                      <SelectItem value="home_visit">Home Visit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort By */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Sort By
                  </label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rating">Top Rated</SelectItem>
                      <SelectItem value="fee_low">
                        Price: Low to High
                      </SelectItem>
                      <SelectItem value="fee_high">
                        Price: High to Low
                      </SelectItem>
                      <SelectItem value="experience">
                        Most Experienced
                      </SelectItem>
                      <SelectItem value="reviews">Most Reviews</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Price Range: ${priceRange[0]} - ${priceRange[1]}
                  </label>
                  <Input
                    type="range"
                    min="0"
                    max="500"
                    value={priceRange[1]}
                    onChange={(e) =>
                      setPriceRange([priceRange[0], parseInt(e.target.value)])
                    }
                    className="w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results Count */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <p className="text-slate-600 dark:text-slate-400">
            <span className="font-bold text-slate-900 dark:text-white">
              {filteredDoctors.length}
            </span>{" "}
            doctors found
            {isEmergency && (
              <span className="text-rose-600 dark:text-rose-400 font-medium">
                {" "}
                (Emergency Available)
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Doctors Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        {filteredDoctors.length === 0 ? (
          <Card className="border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-6">
                <Stethoscope className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                No Doctors Found
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Try adjusting your search or filters to find what you're looking
                for.
              </p>
              <Button onClick={clearFilters} variant="outline">
                Clear All Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map((doctor) => (
              <Card
                key={doctor.id}
                className="group border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur hover:border-rose-300 dark:hover:border-rose-700 transition-all duration-300 hover:shadow-xl hover:shadow-rose-500/10 hover:-translate-y-1 overflow-hidden"
              >
                <CardContent className="p-0">
                  {/* Header with Gradient */}
                  <div className="relative h-32 bg-gradient-to-br from-rose-500 to-indigo-600 dark:from-rose-700 dark:to-indigo-800">
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                    <div className="absolute -bottom-12 left-6">
                      <div className="w-24 h-24 rounded-2xl bg-white dark:bg-slate-900 border-4 border-white dark:border-slate-900 shadow-lg flex items-center justify-center">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-rose-100 to-indigo-100 dark:from-rose-900/30 dark:to-indigo-900/30 flex items-center justify-center">
                          {getSpecializationIcon(doctor.specialization)}
                        </div>
                      </div>
                    </div>
                    {doctor.is_verified && (
                      <Badge className="absolute top-4 right-4 bg-emerald-500/90 text-white border-0 backdrop-blur-md">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>

                  {/* Content */}
                  <div className="pt-16 px-6 pb-6">
                    <div className="mb-4">
                      <h3 className="font-bold text-xl text-slate-900 dark:text-white mb-1 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                        {doctor.specialization}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <span>License: {doctor.license_number}</span>
                        {doctor.years_of_experience && (
                          <>
                            <span>•</span>
                            <span>{doctor.years_of_experience} years exp.</span>
                          </>
                        )}
                      </div>
                    </div>

                    {doctor.bio && (
                      <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">
                        {doctor.bio}
                      </p>
                    )}

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {doctor.consultation_types?.includes("online") && (
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                        >
                          <Video className="h-3 w-3 mr-1" />
                          Online
                        </Badge>
                      )}
                      {doctor.consultation_types?.includes("in_clinic") && (
                        <Badge
                          variant="secondary"
                          className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                        >
                          <Building className="h-3 w-3 mr-1" />
                          In-Clinic
                        </Badge>
                      )}
                      {doctor.emergency_availability && (
                        <Badge className="bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Emergency
                        </Badge>
                      )}
                    </div>

                    {/* Location & Languages */}
                    <div className="space-y-2 mb-4">
                      {doctor.location && (
                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                          <MapPin className="h-4 w-4" />
                          {doctor.location}
                        </div>
                      )}
                      {doctor.languages && doctor.languages.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                          <span>🌐</span>
                          {doctor.languages.join(", ")}
                        </div>
                      )}
                    </div>

                    {/* Rating */}
                    {doctor.rating_avg && (
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex text-amber-500">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < Math.floor(doctor.rating_avg!)
                                  ? "fill-current"
                                  : "text-slate-300 dark:text-slate-600"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {doctor.rating_avg.toFixed(1)}
                        </span>
                        {doctor.review_count && (
                          <span className="text-sm text-slate-500 dark:text-slate-400">
                            ({doctor.review_count} reviews)
                          </span>
                        )}
                      </div>
                    )}

                    {/* Price & Action */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 uppercase">
                          {isEmergency ? "Emergency Fee" : "Consultation"}
                        </span>
                        <p
                          className={`font-extrabold text-2xl ${
                            isEmergency
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-slate-900 dark:text-white"
                          }`}
                        >
                          $
                          {isEmergency
                            ? doctor.emergency_fee || doctor.consultation_fee
                            : doctor.consultation_fee}
                        </p>
                      </div>
                      <Button
                        onClick={() =>
                          navigate(
                            `/services/health/doctor/${doctor.user_id}${
                              isEmergency ? "?emergency=true" : ""
                            }`,
                          )
                        }
                        className={`rounded-full font-semibold ${
                          isEmergency
                            ? "bg-rose-600 hover:bg-rose-700 text-white"
                            : "bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 text-white"
                        }`}
                      >
                        {isEmergency ? "Emergency" : "Book"}
                        <Calendar className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Footer Spacer */}
      <div className="h-24 bg-slate-50 dark:bg-slate-950" />
    </div>
  );
};

export default DoctorList;
