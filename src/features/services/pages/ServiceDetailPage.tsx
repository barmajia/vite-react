import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Star,
  Clock,
  CheckCircle,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useServiceRole } from "@/hooks/useServiceRole";
import { useServices, type ServiceListing } from "../hooks/useServices";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";

export function ServiceDetailPage() {
  const { listingSlug } = useParams<{ listingSlug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  useServiceRole(); // Check if user is a provider
  const { getListingBySlug } = useServices();
  const { t } = useTranslation();
  const [listing, setListing] = useState<ServiceListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [requirements, setRequirements] = useState("");
  const [isOwnListing, setIsOwnListing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!listingSlug) return;

      setLoading(true);
      const data = await getListingBySlug(listingSlug);
      setListing(data);
      setLoading(false);
    };

    fetchData();
  }, [listingSlug, getListingBySlug]);

  useEffect(() => {
    if (user && listing) {
      setIsOwnListing(listing.provider_id === user.id);
    }
  }, [user, listing]);

  const handleOrder = () => {
    if (!user) {
      toast.error(t("serviceDetail.signInToBook"));
      navigate("/login", {
        state: { from: { pathname: window.location.pathname } },
      });
      return;
    }

    if (isOwnListing) {
      toast.error("You cannot book your own listing");
      return;
    }

    // Navigate to booking page with listing ID
    navigate(`/services/listing/${listing!.id}/book`);
  };

  const handleContact = async () => {
    if (!user) {
      toast.error(t("serviceDetail.signInToContact"));
      navigate("/login", {
        state: { from: { pathname: window.location.pathname } },
      });
      return;
    }

    if (isOwnListing) {
      toast.error("You cannot contact yourself");
      return;
    }

    try {
      // Create or get conversation using RPC function
      const { data: conversationId, error } = await supabase.rpc(
        "get_or_create_service_conversation",
        {
          p_provider_id: listing!.provider_id,
          p_listing_id: listing!.id,
        },
      );

      if (error) throw error;

      toast.success("Opening conversation...");
      navigate(`/services/messages/${conversationId}`);
    } catch (err: any) {
      console.error("Error creating conversation:", err);
      toast.error("Failed to start conversation. Please try again.");
    }
  };

  const formatPrice = () => {
    if (!listing?.price) return t("serviceDetail.contactForPricing");
    const currency = listing.currency === "EGP" ? "EGP" : "$";
    return `${currency}${listing.price.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{t("serviceDetail.loading")}</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">
            {t("serviceDetail.notFound")}
          </h2>
          <Button asChild>
            <Link to="/services">{t("serviceDetail.browseServices")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Button variant="ghost" asChild className="mb-6">
        <Link to="/services">
          <ArrowLeft size={16} className="mr-2" />
          {t("services.backToServices")}
        </Link>
      </Button>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Title & Description */}
          <div>
            <h1 className="text-3xl font-bold mb-4">{listing.title}</h1>
            {listing.description && (
              <div className="prose max-w-none">
                <p className="text-muted-foreground whitespace-pre-line">
                  {listing.description}
                </p>
              </div>
            )}
          </div>

          {/* Provider Info */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-lg font-semibold">
                  {listing.provider_id.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-lg">
                    {t("serviceDetail.serviceProvider")}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Star
                      size={14}
                      className="text-yellow-400 fill-yellow-400"
                    />
                    <span>
                      {t("serviceDetail.providerSince", {
                        date: new Date(listing.created_at).toLocaleDateString(),
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Booking */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardContent className="p-6 space-y-6">
              {/* Price */}
              <div>
                <div className="text-3xl font-bold text-primary mb-2">
                  {formatPrice()}
                </div>
              </div>

              <Separator />

              {/* Requirements */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("serviceDetail.projectReqs")}
                </label>
                <Textarea
                  placeholder={t("serviceDetail.reqPlaceholder")}
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  rows={5}
                  className="resize-none"
                />
              </div>

              {/* Order Button */}
              <Button className="w-full" size="lg" onClick={handleOrder}>
                <CheckCircle size={18} className="mr-2" />
                {t("serviceDetail.bookService")}
              </Button>

              {/* Contact Button */}
              <Button
                variant="outline"
                className="w-full"
                onClick={handleContact}
                disabled={isOwnListing}
              >
                <MessageSquare size={18} className="mr-2" />
                {t("serviceDetail.contactProvider")}
              </Button>

              {isOwnListing && (
                <p className="text-xs text-center text-muted-foreground">
                  This is your own listing
                </p>
              )}

              {/* Features */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle size={16} className="text-green-500" />
                  <span>{t("serviceDetail.secureBooking")}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle size={16} className="text-green-500" />
                  <span>{t("serviceDetail.satisfactionGuaranteed")}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock size={16} />
                  <span>{t("serviceDetail.fastDelivery")}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
