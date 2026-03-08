import { useParams } from "react-router-dom";
import { useCategoryBySlug } from "../hooks/useCategories";
import { useProducts } from "@/hooks/useProducts";
import { ProductGrid } from "@/components/products/ProductGrid";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function CategoryProductsPage() {
  const { slug } = useParams<{ slug: string }>();

  const {
    data: category,
    isLoading: categoryLoading,
    error: categoryError,
  } = useCategoryBySlug(slug!);

  const {
    data: productsData,
    isLoading: productsLoading,
  } = useProducts({
    category: category?.name,
    page: 1,
    limit: 20,
  });

  if (categoryError) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto mt-8">
        <AlertDescription>{categoryError.message}</AlertDescription>
      </Alert>
    );
  }

  if (!category && !categoryLoading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-2">Category not found</h1>
        <p className="text-muted-foreground">
          The category you're looking for doesn't exist or is inactive.
        </p>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
        {category.description && (
          <p className="text-muted-foreground">{category.description}</p>
        )}
      </div>

      <ProductGrid products={productsData?.products ?? []} isLoading={productsLoading} />
    </div>
  );
}
