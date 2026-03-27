// src/features/health/pages/PharmacyList.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Search,
  MapPin,
  Clock,
  Phone,
  Star,
  Filter,
  CheckCircle2,
  Truck,
  Pill,
  CreditCard,
  Shield,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Navigation,
  Heart,
  Share2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabase";
import { supabaseHealth } from "../api/supabaseHealth";
import { toast } from "sonner";
import { PharmacyHeader } from "../components/PharmacyHeader";

interface Pharmacy {
  id: string;
  user_id: string;
  pharmacy_name: string;
  license_number?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  operating_hours?: {
    monday?: { open: string; close: string; is_open: boolean };
    tuesday?: { open: string; close: string; is_open: boolean };
    wednesday?: { open: string; close: string; is_open: boolean };
    thursday?: { open: string; close: string; is_open: boolean };
    friday?: { open: string; close: string; is_open: boolean };
    saturday?: { open: string; close: string; is_open: boolean };
    sunday?: { open: string; close: string; is_open: boolean };
  };
  delivery_available: boolean;
  delivery_radius_km?: number;
  prescription_acceptance: boolean;
  insurance_accepted?: string[];
  is_verified: boolean;
  rating_avg?: number;
  review_count?: number;
  services?: string[];
  created_at: string;
}

const PharmacyList: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"rating" | "distance" | "name">(
    "rating",
  );
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    deliveryAvailable: false,
    prescriptionAcceptance: false,
    verifiedOnly: false,
    openNow: false,
  });
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    fetchPharmacies();
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.warn("Geolocation error:", error);
        },
      );
    }
  };

  const fetchPharmacies = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabaseHealth
        .from("health_pharmacy_profiles")
        .select("*")
        .eq("is_verified", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setPharmacies(data);
    } catch (error) {
      console.error("Error fetching pharmacies:", error);
      toast.error("Failed to load pharmacies");
    } finally {
      setLoading(false);
    }
  };

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Check if pharmacy is open now
  const isOpenNow = (operatingHours: any): boolean => {
    if (!operatingHours) return false;
    const now = new Date();
    const days = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const currentDay = days[now.getDay()];
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    const dayHours = operatingHours[currentDay];
    if (!dayHours || !dayHours.is_open) return false;

    return currentTime >= dayHours.open && currentTime <= dayHours.close;
  };

  const filteredPharmacies = useMemo(() => {
    let filtered = [...pharmacies];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.pharmacy_name.toLowerCase().includes(query) ||
          p.location?.toLowerCase().includes(query) ||
          p.services?.some((s) => s.toLowerCase().includes(query)),
      );
    }

    // Feature filters
    if (filters.deliveryAvailable) {
      filtered = filtered.filter((p) => p.delivery_available);
    }
    if (filters.prescriptionAcceptance) {
      filtered = filtered.filter((p) => p.prescription_acceptance);
    }
    if (filters.verifiedOnly) {
      filtered = filtered.filter((p) => p.is_verified);
    }
    if (filters.openNow) {
      filtered = filtered.filter((p) => isOpenNow(p.operating_hours));
    }

    // Sorting
    if (sortBy === "rating") {
      filtered.sort((a, b) => (b.rating_avg || 0) - (a.rating_avg || 0));
    } else if (sortBy === "name") {
      filtered.sort((a, b) => a.pharmacy_name.localeCompare(b.pharmacy_name));
    } else if (sortBy === "distance" && userLocation) {
      filtered.sort((a, b) => {
        const distA = a.latitude
          ? calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              a.latitude,
              a.longitude,
            )
          : 999;
        const distB = b.latitude
          ? calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              b.latitude,
              b.longitude,
            )
          : 999;
        return distA - distB;
      });
    }

    return filtered;
  }, [pharmacies, searchQuery, filters, sortBy, userLocation]);

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  const handleShare = (pharmacy: Pharmacy) => {
    if (navigator.share) {
      navigator.share({
        title: pharmacy.pharmacy_name,
        text: `Check out ${pharmacy.pharmacy_name} on Aurora Health`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#0f172a]">
        <PharmacyHeader />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="relative z-10 flex flex-col items-center">
            <div className="relative w-24 h-24 flex items-center justify-center mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-100 dark:border-emerald-900 shadow-inner" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 border-r-emerald-500 animate-spin" />
              <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-full shadow-lg flex items-center justify-center z-10">
                <Pill className="w-8 h-8 text-emerald-500 animate-pulse" />
              </div>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500">
              {t("pharmacy.loading")}
            </h2>
            <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
              {t("pharmacy.findingPharmacies")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#0f172a]">
      <PharmacyHeader />

      {/* Hero Section */}
      <div className="relative pt-24 pb-12 px-4 overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-700 dark:from-emerald-900 dark:to-teal-900">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-white/5 rounded-full blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-white/5 rounded-full blur-[100px]" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-8">
            <Badge className="bg-emerald-500/20 text-emerald-200 border-emerald-400/30 text-sm px-4 py-1.5 rounded-full mb-4">
              <Pill className="w-4 h-4 mr-2 inline" />
              Pharmacy Network
            </Badge>

            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tight">
              Find Nearby Pharmacies
            </h1>
            <p className="text-xl text-emerald-100 max-w-3xl mx-auto">
              Get your prescriptions filled at verified pharmacies near you.
              Home delivery available.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search pharmacies by name or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 rounded-full bg-white text-slate-900 border-0 focus:ring-2 focus:ring-emerald-500"
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
                  <Badge className="ml-2 bg-emerald-500 text-white">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
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
                  onClick={() =>
                    setFilters({
                      deliveryAvailable: false,
                      prescriptionAcceptance: false,
                      verifiedOnly: false,
                      openNow: false,
                    })
                  }
                  className="text-slate-500"
                >
                  Clear All
                </Button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="delivery"
                    checked={filters.deliveryAvailable}
                    onCheckedChange={(checked) =>
                      setFilters({
                        ...filters,
                        deliveryAvailable: checked as boolean,
                      })
                    }
                  />
                  <label
                    htmlFor="delivery"
                    className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2"
                  >
                    <Truck className="h-4 w-4" />
                    Delivery Available
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="prescription"
                    checked={filters.prescriptionAcceptance}
                    onCheckedChange={(checked) =>
                      setFilters({
                        ...filters,
                        prescriptionAcceptance: checked as boolean,
                      })
                    }
                  />
                  <label
                    htmlFor="prescription"
                    className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2"
                  >
                    <Pill className="h-4 w-4" />
                    Accepts Prescriptions
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="verified"
                    checked={filters.verifiedOnly}
                    onCheckedChange={(checked) =>
                      setFilters({
                        ...filters,
                        verifiedOnly: checked as boolean,
                      })
                    }
                  />
                  <label
                    htmlFor="verified"
                    className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Verified Only
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="openNow"
                    checked={filters.openNow}
                    onCheckedChange={(checked) =>
                      setFilters({ ...filters, openNow: checked as boolean })
                    }
                  />
                  <label
                    htmlFor="openNow"
                    className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2"
                  >
                    <Clock className="h-4 w-4" />
                    Open Now
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results Count & Sort */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-slate-600 dark:text-slate-400">
            <span className="font-bold text-slate-900 dark:text-white">
              {filteredPharmacies.length}
            </span>{" "}
            pharmacies found
          </p>

          <div className="flex items-center gap-4">
            {userLocation && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                <Navigation className="h-3 w-3 mr-1" />
                Using your location
              </Badge>
            )}

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Top Rated</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                {userLocation && (
                  <SelectItem value="distance">Distance (Nearest)</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Pharmacies Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        {filteredPharmacies.length === 0 ? (
          <Card className="border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-6">
                <Pill className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                No Pharmacies Found
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Try adjusting your search or filters to find what you're looking
                for.
              </p>
              <Button
                onClick={() => {
                  setSearchQuery("");
                  setFilters({
                    deliveryAvailable: false,
                    prescriptionAcceptance: false,
                    verifiedOnly: false,
                    openNow: false,
                  });
                }}
                variant="outline"
              >
                Clear All Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPharmacies.map((pharmacy) => {
              const isOpen = isOpenNow(pharmacy.operating_hours);
              const distance =
                userLocation && pharmacy.latitude
                  ? calculateDistance(
                      userLocation.latitude,
                      userLocation.longitude,
                      pharmacy.latitude,
                      pharmacy.longitude,
                    ).toFixed(1)
                  : null;

              return (
                <Card
                  key={pharmacy.id}
                  className="group border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 overflow-hidden"
                >
                  <CardContent className="p-0">
                    {/* Header with Gradient */}
                    <div className="relative h-32 bg-gradient-to-br from-emerald-500 to-teal-600 dark:from-emerald-700 dark:to-teal-800">
                      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                      <div className="absolute -bottom-12 left-6">
                        <div className="w-24 h-24 rounded-2xl bg-white dark:bg-slate-900 border-4 border-white dark:border-slate-900 shadow-lg flex items-center justify-center">
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center">
                            <Pill className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                          </div>
                        </div>
                      </div>
                      <div className="absolute top-4 right-4 flex gap-2">
                        {pharmacy.is_verified && (
                          <Badge className="bg-emerald-500/90 text-white border-0 backdrop-blur-md">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                        {pharmacy.delivery_available && (
                          <Badge className="bg-blue-500/90 text-white border-0 backdrop-blur-md">
                            <Truck className="h-3 w-3 mr-1" />
                            Delivery
                          </Badge>
                        )}
                      </div>
                      <div className="absolute top-4 left-4">
                        <Badge
                          className={
                            isOpen
                              ? "bg-emerald-500/90 text-white border-0"
                              : "bg-red-500/90 text-white border-0"
                          }
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          {isOpen ? "Open Now" : "Closed"}
                        </Badge>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="pt-16 px-6 pb-6">
                      <div className="mb-4">
                        <h3 className="font-bold text-xl text-slate-900 dark:text-white mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {pharmacy.pharmacy_name}
                        </h3>
                        {pharmacy.location && (
                          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                            <MapPin className="h-4 w-4" />
                            {pharmacy.location}
                            {distance && (
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                ({distance} km)
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Services */}
                      {pharmacy.services && pharmacy.services.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {pharmacy.services.slice(0, 3).map((service, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                            >
                              {service}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Contact Info */}
                      <div className="space-y-2 mb-4">
                        {pharmacy.phone && (
                          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                            <Phone className="h-4 w-4" />
                            {pharmacy.phone}
                          </div>
                        )}
                        {pharmacy.prescription_acceptance && (
                          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                            <Pill className="h-4 w-4" />
                            Accepts Prescriptions
                          </div>
                        )}
                        {pharmacy.delivery_available && (
                          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                            <Truck className="h-4 w-4" />
                            {pharmacy.delivery_radius_km
                              ? `Delivery within ${pharmacy.delivery_radius_km} km`
                              : "Home Delivery Available"}
                          </div>
                        )}
                      </div>

                      {/* Insurance */}
                      {pharmacy.insurance_accepted &&
                        pharmacy.insurance_accepted.length > 0 && (
                          <div className="mb-4">
                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
                              <Shield className="h-4 w-4" />
                              Insurance Accepted:
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {pharmacy.insurance_accepted
                                .slice(0, 3)
                                .map((ins, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {ins}
                                  </Badge>
                                ))}
                              {pharmacy.insurance_accepted.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{pharmacy.insurance_accepted.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                      {/* Rating */}
                      {pharmacy.rating_avg && (
                        <div className="flex items-center gap-2 mb-4">
                          <div className="flex text-amber-500">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < Math.floor(pharmacy.rating_avg!)
                                    ? "fill-current"
                                    : "text-slate-300 dark:text-slate-600"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {pharmacy.rating_avg.toFixed(1)}
                          </span>
                          {pharmacy.review_count && (
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                              ({pharmacy.review_count} reviews)
                            </span>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleShare(pharmacy)}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            <Phone className="h-4 w-4 mr-2" />
                            Call
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            navigate(`/services/health/pharmacy/${pharmacy.id}`)
                          }
                        >
                          View Details
                          <ChevronDown className="h-4 w-4 ml-2 rotate-[-90deg]" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Spacer */}
      <div className="h-24 bg-slate-50 dark:bg-slate-950" />
    </div>
  );
};

export default PharmacyList;
