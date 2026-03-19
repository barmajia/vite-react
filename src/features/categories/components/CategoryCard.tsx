import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import type { Category } from "@/types/database";

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  const { t } = useTranslation();

  // Try to get translated name from categories translations
  const translatedName = t(`categories.${category.slug}`, {
    defaultValue: category.name,
  });

  return (
    <Link to={`/categories/${category.slug}`} className="group">
      <Card className="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 bg-surface">
        {category.image_url && (
          <div className="aspect-square overflow-hidden">
            <img
              src={category.image_url}
              alt={translatedName}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
          </div>
        )}
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg group-hover:text-accent transition-colors">
            {translatedName}
          </h3>
          {category.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {category.description}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
