import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

interface ServiceCategoryWithSubcategories {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  subcategories: {
    id: string;
    name: string;
    slug: string;
  }[];
}

interface ServiceListing {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number | null;
  price_type: string | null;
  currency: string | null;
  provider: {
    provider_name: string;
  } | null;
}

export function ServiceCategoryPage() {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const { t } = useTranslation();
  const [category, setCategory] =
    useState<ServiceCategoryWithSubcategories | null>(null);
  const [listings, setListings] = useState<ServiceListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!categorySlug) return;

      setLoading(true);
      try {
        // Fetch category with subcategories
        const { data: categoryData } = await supabase
          .from("svc_categories")
          .select(
            `
            *,
            subcategories:svc_subcategories (
              id,
              name,
              slug
            )
          `,
          )
          .eq("slug", categorySlug)
          .single();

        if (categoryData) {
          setCategory(categoryData);

          // Fetch listings from all subcategories in this category
          const subcategoryIds = categoryData.subcategories.map((s) => s.id);

          if (subcategoryIds.length > 0) {
            const { data: listingsData } = await supabase
              .from("svc_listings")
              .select(
                `
                *,
                provider:svc_providers (
                  provider_name
                )
              `,
              )
              .in("subcategory_id", subcategoryIds)
              .eq("is_active", true)
              .order("created_at", { ascending: false });

            setListings(listingsData || []);
          }
        }
      } catch (error) {
        console.error("Error fetching category:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [categorySlug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{t("services.loading")}</p>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">
            {t("services.categoryNotFound")}
          </h2>
          <Button asChild>
            <Link to="/services">{t("services.browseAll")}</Link>
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
            {t("services.backToServices")}
          </Link>
        </Button>
        <h1 className="text-4xl font-bold mb-2">{category.name}</h1>

        {/* DEBUG BANNER */}
        <div className="bg-green-200 dark:bg-green-800 text-black p-6 rounded-2xl mb-8 shadow-lg border-4 border-green-400 font-bold text-lg flex items-center gap-3">
          🔍 DEBUG: ServiceCategoryPage (/services/{categorySlug})
          <div className="ml-auto">
            Slug:{" "}
            <span className="font-mono bg-white px-2 py-1 rounded text-sm">
              {categorySlug}
            </span>{" "}
            | Category:{" "}
            <span className="font-mono bg-white px-2 py-1 rounded text-sm">
              {category?.name || "Loading..."}
            </span>{" "}
            | Listings:{" "}
            <span className="font-mono bg-white px-2 py-1 rounded text-sm">
              {listings.length}
            </span>
          </div>
        </div>
        {category.description && (
          <p className="text-muted-foreground">{category.description}</p>
        )}
      </div>

      {/* Subcategories */}
      {category.subcategories.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">
            {t("services.subcategories")}
          </h3>
          <div className="flex flex-wrap gap-2">
            {category.subcategories.map((sub) => (
              <Badge key={sub.id} variant="secondary" className="text-sm">
                {sub.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Listings Grid */}
      {listings.length > 0 ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              {t("services.listingsFound", { count: listings.length })}
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
                {listing.price && (
                  <p className="text-primary font-bold mb-2">
                    {listing.currency === "EGP" ? "EGP" : "$"}
                    {listing.price.toFixed(2)}
                    {listing.price_type && (
                      <span className="text-sm text-muted-foreground">
                        /{listing.price_type}
                      </span>
                    )}
                  </p>
                )}
                {listing.description && (
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                    {listing.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {t("services.provider")}{" "}
                    {listing.provider?.provider_name?.slice(0, 20) ||
                      t("services.unknown")}
                  </span>
                  <span className="text-primary">
                    {t("services.viewDetails")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12 bg-muted rounded-xl">
          <h3 className="text-xl font-semibold mb-2">
            {t("services.noListings")}
          </h3>
          <p className="text-muted-foreground mb-6">
            {t("services.checkBack")}
          </p>
          <Button asChild>
            <Link to="/services">{t("services.browseAll")}</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
