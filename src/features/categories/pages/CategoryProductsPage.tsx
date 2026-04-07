import { useParams, Link, useNavigate } from "react-router-dom";
import { useCategoryBySlug } from "../hooks/useCategories";
import { useProducts } from "@/hooks/useProducts";
import { ProductGrid } from "@/components/products/ProductGrid";
import { Alert, AlertDescription, Button, Skeleton } from "@/components/ui";
import { useTranslation } from "react-i18next";
import { ChevronRight, LayoutGrid } from "lucide-react";

export function CategoryProductsPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const {
    data: category,
    isLoading: categoryLoading,
    error: categoryError,
  } = useCategoryBySlug(slug!);

  const { data: productsData, isLoading: productsLoading } = useProducts({
    category: category?.name,
    page: 1,
    limit: 20,
  });

  if (categoryError) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Alert
          variant="destructive"
          className="max-w-2xl mx-auto glass shadow-2xl border-destructive/20"
        >
          <AlertDescription className="text-lg py-2">
            {categoryError.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (categoryLoading) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="space-y-4 mb-12">
          <Skeleton className="h-12 w-64 glass-card" />
          <Skeleton className="h-6 w-full max-w-lg glass-card" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-80 w-full glass-card rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <div className="text-8xl mb-6">🔍</div>
        <h1 className="text-3xl font-bold mb-4">{t("category.notFound")}</h1>
        <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
          {t("category.notFoundDesc") ||
            "We couldn't find the category you're looking for. It might have been moved or deleted."}
        </p>
        <Button
          size="lg"
          className="rounded-2xl"
          onClick={() => navigate("/categories")}
        >
          {t("category.browseAll")}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Category Hero */}
      <div className="relative py-20 mb-12 overflow-hidden bg-slate-950">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-blue-900/10 to-transparent" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-10">
            <div className="space-y-4 max-w-3xl animate-in fade-in slide-in-from-left-4 duration-700">
              <nav className="flex items-center gap-2 text-sm text-white/50 mb-4">
                <Link to="/" className="hover:text-white transition-colors">
                  {t("common.home")}
                </Link>
                <ChevronRight className="h-4 w-4" />
                <Link
                  to="/categories"
                  className="hover:text-white transition-colors"
                >
                  {t("common.categories")}
                </Link>
                <ChevronRight className="h-4 w-4" />
                <span className="text-primary font-medium">
                  {category.name}
                </span>
              </nav>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-white/10 text-white/80 text-xs font-medium mb-4">
                <LayoutGrid className="h-4 w-4" />
                <span>
                  {productsData?.totalCount ?? 0} {t("category.productsFound")}
                </span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight">
                {t(`categories.${slug}`, { defaultValue: category.name })}
              </h1>
              {category.description && (
                <p className="text-xl text-white/60 leading-relaxed max-w-2xl">
                  {category.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000">
          <ProductGrid
            products={productsData?.products ?? []}
            isLoading={productsLoading}
          />
        </div>
      </div>
    </div>
  );
}
