import { Link } from "react-router-dom";
import { ShoppingCart, Star, Heart, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/types/database";
import { formatPrice, getProductImage } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface ProductCardProps {
  product: Product & {
    average_rating?: number;
    review_count?: number;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const { t } = useTranslation();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const imageUrl = getProductImage(product.images);

  return (
    <Card
      className="group overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 border border-gray-200 dark:border-[#0f172a] bg-white dark:bg-[#0f172a]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Light Blue Top Border Accent for Light Mode */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-blue-600 dark:hidden" />

      {/* Image Header with Background */}
      <div className="relative h-64 overflow-hidden">
        {/* Background Image with Zoom Effect */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500"
          style={{
            backgroundImage: `url(${imageUrl})`,
            transform: isHovered ? "scale(1.1)" : "scale(1)",
          }}
        />

        {/* Gradient Overlay - Dark at bottom, transparent at top */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Clickable overlay linking to product detail */}
        <Link
          to={`${ROUTES.PRODUCT_DETAIL.replace(":asin", product.id)}`}
          className="absolute inset-0 z-10"
          onClick={(e) => e.stopPropagation()}
        />

        {/* Content Overlaid on Image */}
        <div className="absolute inset-0 p-4 flex flex-col justify-end z-20 pointer-events-none">
          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 pointer-events-auto">
            {product.quantity === 0 && (
              <Badge className="bg-red-600 text-white border-0 font-semibold shadow-lg">
                {t("product.outOfStock")}
              </Badge>
            )}
            {product.quantity &&
              product.quantity < 10 &&
              product.quantity > 0 && (
                <Badge className="bg-orange-600 text-white border-0 font-semibold shadow-lg">
                  Only {product.quantity} left
                </Badge>
              )}
          </div>

          {/* Wishlist & Quick View Buttons */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 pointer-events-auto">
            <Button
              variant="secondary"
              size="icon"
              className={`h-9 w-9 rounded-full shadow-lg transition-all duration-300 ${
                isHovered
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 translate-x-4"
              }`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsWishlisted(!isWishlisted);
              }}
            >
              <Heart
                className={`h-4 w-4 transition-colors ${
                  isWishlisted ? "fill-red-500 text-red-500" : "text-white"
                }`}
              />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className={`h-9 w-9 rounded-full shadow-lg transition-all duration-300 ${
                isHovered
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 translate-x-4"
              }`}
            >
              <Eye className="h-4 w-4 text-white" />
            </Button>
          </div>

          {/* Product Title Over Image */}
          <div className="mb-3 pointer-events-auto">
            <h3 className="font-bold text-lg text-white line-clamp-2 drop-shadow-lg hover:text-blue-300 transition-colors cursor-pointer">
              {product.title}
            </h3>
          </div>

          {/* Rating Over Image */}
          {product.average_rating && (
            <div className="flex items-center gap-1 mb-2 pointer-events-auto">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-semibold text-white">
                {product.average_rating.toFixed(1)}
              </span>
              {product.review_count && (
                <span className="text-xs text-gray-300">
                  ({product.review_count} reviews)
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Content Section */}
      <CardContent className="p-4 space-y-3">
        {/* Price and Add to Cart */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            {product.price && (
              <>
                <span className="text-2xl font-bold text-foreground dark:text-white">
                  {formatPrice(product.price)}
                </span>
                {product.price > 0 && (
                  <span className="text-sm text-muted-foreground dark:text-gray-400 line-through">
                    {formatPrice(product.price * 1.2)}
                  </span>
                )}
              </>
            )}
          </div>
          <Button
            size="icon"
            className="h-10 w-10 rounded-full bg-[#0f172a] dark:bg-blue-600 hover:bg-[#0f172a]/90 dark:hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-110"
            disabled={product.quantity === 0}
          >
            <ShoppingCart className="h-5 w-5" />
          </Button>
        </div>

        {/* Additional Info */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground dark:text-gray-400">
            {product.quantity && product.quantity > 0 ? (
              <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                In Stock
              </span>
            ) : (
              <span className="text-red-600 dark:text-red-400">
                Out of Stock
              </span>
            )}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
