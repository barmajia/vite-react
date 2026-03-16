import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useServices,
  type ServiceCategory,
  type ServiceListing,
} from "../hooks/useServices";

export function ServiceCategoryPage() {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const { getCategories, getListingsByCategory } = useServices();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [listings, setListings] = useState<ServiceListing[]>([]);
  const [category, setCategory] = useState<ServiceCategory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!categorySlug) return;

      setLoading(true);
      const [cats, listingsData] = await Promise.all([
        getCategories(),
        getListingsByCategory(categorySlug),
      ]);

      setCategories(cats);
      const currentCategory = cats.find((c) => c.slug === categorySlug) || null;
      setCategory(currentCategory);
      setListings(listingsData);
      setLoading(false);
    };

    fetchData();
  }, [
    categorySlug,
    getProvidersByCategory,
    getCategories,
    getListingsByCategory,
  ]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading services...</p>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Category not found</h2>
          <Button asChild>
            <Link to="/services">Browse All Services</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/services">
            <ArrowLeft size={16} className="mr-2" />
            Back to Services
          </Link>
        </Button>
        <h1 className="text-4xl font-bold mb-2">{category.name}</h1>
      </div>

      {/* Listings Grid */}
      {listings.length > 0 ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              {listings.length} {listings.length === 1 ? "Listing" : "Listings"}{" "}
              Found
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <Link
                key={listing.id}
                to={`/services/listing/${listing.slug}`}
                className="p-6 bg-card border rounded-xl hover:shadow-lg hover:border-primary transition-all"
              >
                <h3 className="font-semibold text-lg mb-2">{listing.title}</h3>
                {listing.price_numeric && (
                  <p className="text-primary font-bold mb-2">
                    ${listing.price_numeric.toFixed(2)}
                  </p>
                )}
                {listing.description && (
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                    {listing.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Provider: {listing.provider_id.slice(0, 8)}...</span>
                  <span className="text-primary">View Details →</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12 bg-muted rounded-xl">
          <h3 className="text-xl font-semibold mb-2">
            No listings in this category yet
          </h3>
          <p className="text-muted-foreground mb-6">
            Check back later or explore other categories
          </p>
          <Button asChild>
            <Link to="/services">Browse All Services</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
