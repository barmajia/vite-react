import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useServices, type ServiceListing } from "../hooks/useServices";

export function ServiceDetailPage() {
  const { listingSlug } = useParams<{ listingSlug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getListingBySlug } = useServices();
  const [listing, setListing] = useState<ServiceListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [requirements, setRequirements] = useState("");

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

  const handleOrder = () => {
    if (!user) {
      toast.error("Please sign in to book this service");
      navigate("/login", {
        state: { from: { pathname: window.location.pathname } },
      });
      return;
    }

    toast.success("Service booking feature coming soon!");
    // Future: Implement svc_orders table
  };

  const formatPrice = () => {
    if (!listing?.price_numeric) return "Contact for pricing";
    return `$${listing.price_numeric.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading service details...</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Service not found</h2>
          <Button asChild>
            <Link to="/services">Browse Services</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Button variant="ghost" asChild className="mb-6">
        <Link
          to={
            listing.category_slug
              ? `/services/${listing.category_slug}`
              : "/services"
          }
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Services
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
                  <p className="font-semibold text-lg">Service Provider</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Star
                      size={14}
                      className="text-yellow-400 fill-yellow-400"
                    />
                    <span>
                      Provider since{" "}
                      {new Date(listing.created_at).toLocaleDateString()}
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
                  Project Requirements
                </label>
                <Textarea
                  placeholder="Describe your project requirements, timeline, and any specific needs..."
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  rows={5}
                  className="resize-none"
                />
              </div>

              {/* Order Button */}
              <Button className="w-full" size="lg" onClick={handleOrder}>
                <CheckCircle size={18} className="mr-2" />
                Book This Service
              </Button>

              {/* Features */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle size={16} className="text-green-500" />
                  <span>Secure booking</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle size={16} className="text-green-500" />
                  <span>Satisfaction guaranteed</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock size={16} />
                  <span>Fast delivery</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
