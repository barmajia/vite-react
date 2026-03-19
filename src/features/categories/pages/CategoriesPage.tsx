import { useState } from "react";
import { useCategories } from "../hooks/useCategories";
import { CategoryCard } from "../components/CategoryCard";
import { CategoryHeader } from "../components/CategoryHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslation } from "react-i18next";

export function CategoriesPage() {
  const { t } = useTranslation();
  const [parentId, setParentId] = useState<string | undefined>(undefined);
  const { data: categories, isLoading, error } = useCategories(parentId);

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto mt-8">
        <AlertDescription>
          {t("common.error")}: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <CategoryHeader
        title={t("category.shopByCategory")}
        description={t("category.exploreCategories")}
      />

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setParentId(undefined)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            parentId === undefined
              ? "bg-accent text-white"
              : "bg-surface hover:bg-muted"
          }`}
        >
          {t("category.allCategories")}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))
        ) : categories?.length === 0 ? (
          <p className="col-span-full text-center text-muted-foreground py-12">
            {t("category.noCategories")}
          </p>
        ) : (
          categories?.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))
        )}
      </div>
    </div>
  );
}
