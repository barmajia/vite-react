import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useServices } from "../hooks/useServices";

export function ServiceDetailPage() {
  const { listingSlug } = useParams<{ listingSlug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getListingBySlug, createOrder } = useServices();
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requirements, setRequirements] = useState("");
  const [ordering, setOrdering] = useState(false);

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

  const handleOrder = async () => {
    if (!user) {
      toast.error("Please sign in to book this service");
      navigate("/login", {
        state: { from: { pathname: window.location.pathname } },
      });
      return;
    }

    if (!listing) return;

    setOrdering(true);
    try {
      const result = await createOrder(
        listing.id,
        listing.provider_id,
        requirements,
      );
      if (result) {
        toast.success("Service booked successfully!");
        navigate(`/orders/${result.id}`);
      } else {
        toast.error("Failed to book service");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to book service");
    } finally {
      setOrdering(false);
    }
  };

  const formatPrice = () => {
    if (!listing?.price) return "Contact for pricing";
    const price = listing.price.toFixed(2);
    switch (listing.price_type) {
      case "hourly":
        return `$${price}/hour`;
      case "monthly":
        return `$${price}/month`;
      default:
        return `$${price}`;
    }
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

  const provider = listing.svc_providers;
  const subcategory = listing.svc_subcategories;
  const category = subcategory?.svc_categories;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Button variant="ghost" asChild className="mb-6">
        <Link to={category ? `/services/${category.slug}` : "/services"}>
          <ArrowLeft size={16} className="mr-2" />
          Back to {category?.name || "Services"}
        </Link>
      </Button>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Images */}
          {listing.images && listing.images.length > 0 && (
            <div className="aspect-video rounded-xl overflow-hidden bg-muted">
              <img
                src={listing.images[0]}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Title & Description */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              {subcategory && (
                <Badge variant="outline">{subcategory.name}</Badge>
              )}
              {listing.is_featured && <Badge>Featured</Badge>}
            </div>
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
          {provider && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  {provider.logo_url ? (
                    <img
                      src={provider.logo_url}
                      alt={provider.provider_name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-muted" />
                  )}
                  <div className="flex-1">
                    <Link
                      to={`/services/provider/${provider.id}`}
                      className="font-semibold text-lg hover:text-primary"
                    >
                      {provider.provider_name}
                    </Link>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Star
                          size={14}
                          className="text-yellow-400 fill-yellow-400"
                        />
                        <span>
                          {provider.average_rating?.toFixed(1) || "0.0"}
                        </span>
                        <span>({provider.review_count} reviews)</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" asChild>
                    <Link to={`/services/provider/${provider.id}`}>
                      View Profile
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
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
                {listing.delivery_days && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock size={16} />
                    <span>
                      {listing.delivery_days}{" "}
                      {listing.delivery_days === 1 ? "day" : "days"} delivery
                    </span>
                  </div>
                )}
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
              <Button
                className="w-full"
                size="lg"
                onClick={handleOrder}
                disabled={ordering}
              >
                {ordering ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} className="mr-2" />
                    Book This Service
                  </>
                )}
              </Button>

              {/* Features */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle size={16} className="text-green-500" />
                  <span>Secure payment</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle size={16} className="text-green-500" />
                  <span>Satisfaction guaranteed</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle size={16} className="text-green-500" />
                  <span>Free revisions</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
