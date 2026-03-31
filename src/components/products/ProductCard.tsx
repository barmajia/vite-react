import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Star, Heart, Eye, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/types/database";
import { formatPrice, getProductImage } from "@/lib/utils";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { initiateProductChat } from "@/lib/chat-product";
import { useAuth } from "@/hooks/useAuth";
import { showToast } from "@/lib/toast";

interface ProductCardProps {
  product: Product & {
    average_rating?: number;
    review_count?: number;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const imageUrl = getProductImage(product.images);

  // Debug: Log image data to console
  console.log("ProductCard - Product ASIN:", product.asin);
  console.log("ProductCard - Raw images:", product.images);
  console.log("ProductCard - Image URL:", imageUrl);

  // Calculate discount percentage if there was a compare price logic
  const hasDiscount = product.price && product.price > 0;

  const handleChatWithSeller = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if user is authenticated
    if (!user) {
      showToast("info", t("common.loginRequired"), {
        description:
          t("common.loginToChat") || "Please log in to chat with the seller",
      });
      navigate("/login", { state: { returnTo: `/products/${product.asin}` } });
      return;
    }

    setIsChatLoading(true);
    try {
      const conversationId = await initiateProductChat(
        product.seller_id,
        product.asin,
        product.title,
      );

      if (conversationId) {
        navigate(
          `/chat?id=${user.id}&connectedTo=${product.seller_id}&conversationId=${conversationId}`,
        );
        showToast("success", t("chat.chatStarted") || "Chat Started", {
          description: t("chat.chatWithSeller") || "Chat opened with seller",
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to start chat";
      showToast("error", t("common.error"), {
        description: errorMessage,
      });
      console.error("Chat error:", error);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <Card
      className="group relative flex flex-col overflow-hidden border border-gray-200 dark:border-[#0f172a]/50 bg-white dark:bg-[#0f172a] transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 rounded-xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Section */}
      <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-[#1e293b]">
        {/* Product Image */}
        <Link to={`/products/${product.asin}`} className="block h-full w-full">
          <img
            src={imageUrl}
            alt={product.title}
            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </Link>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          {product.quantity === 0 && (
            <Badge className="bg-red-500/90 backdrop-blur-sm text-white border-0 shadow-sm">
              {t("product.outOfStock")}
            </Badge>
          )}
          {product.quantity &&
            product.quantity < 10 &&
            product.quantity > 0 && (
              <Badge className="bg-orange-500/90 backdrop-blur-sm text-white border-0 shadow-sm">
                {t("product.lowStock")}
              </Badge>
            )}
          {hasDiscount && (
            <Badge className="bg-green-500/90 backdrop-blur-sm text-white border-0 shadow-sm">
              {t("product.sale")}
            </Badge>
          )}
        </div>

        {/* Quick Actions (Hover) */}
        <div
          className={cn(
            "absolute inset-0 bg-black/20 backdrop-blur-[2px] transition-opacity duration-300 flex items-center justify-center gap-2 z-20",
            isHovered ? "opacity-100" : "opacity-0",
          )}
        >
          <Button
            variant="secondary"
            size="icon"
            className="h-10 w-10 rounded-full bg-white/90 hover:bg-white text-gray-900 shadow-lg transform transition-transform hover:scale-110"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsWishlisted(!isWishlisted);
            }}
            aria-label={t("common.addToWishlist")}
          >
            <Heart
              className={cn(
                "h-5 w-5 transition-colors",
                isWishlisted ? "fill-red-500 text-red-500" : "text-gray-700",
              )}
            />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            asChild
            className="h-10 w-10 rounded-full bg-white/90 hover:bg-white text-gray-900 shadow-lg transform transition-transform hover:scale-110"
          >
            <Link
              to={`/products/${product.asin}`}
              onClick={(e) => e.stopPropagation()}
            >
              <Eye className="h-5 w-5" />
            </Link>
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-10 w-10 rounded-full bg-white/90 hover:bg-white text-gray-900 shadow-lg transform transition-transform hover:scale-110"
            onClick={handleChatWithSeller}
            disabled={isChatLoading}
            aria-label={t("chat.chatWithSeller") || "Chat with seller"}
          >
            <MessageSquare className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Content Section */}
      <CardContent className="p-4 flex flex-col flex-1 gap-3">
        {/* Category & Title */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            {product.category || t("product.unknownBrand")}
          </p>
          <Link to={`/products/${product.asin}`}>
            <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              {product.title}
            </h3>
          </Link>
        </div>

        {/* Rating */}
        {product.average_rating && (
          <div className="flex items-center gap-1">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-3 w-3",
                    i < Math.floor(product.average_rating!)
                      ? "fill-current"
                      : "text-gray-300 dark:text-gray-600",
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              ({product.review_count || 0})
            </span>
          </div>
        )}

        {/* Price & Action */}
        <div className="mt-auto pt-2 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col">
              {product.price ? (
                <>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatPrice(product.price)}
                  </span>
                  {hasDiscount && (
                    <span className="text-xs text-muted-foreground line-through">
                      {formatPrice(product.price * 1.2)}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {t("product.contactForPrice")}
                </span>
              )}
            </div>

            <Button
              size="icon"
              className={cn(
                "h-10 w-10 rounded-lg shrink-0 transition-all",
                product.quantity === 0
                  ? "bg-gray-100 text-gray-400 dark:bg-[#1e293b] dark:text-gray-600 cursor-not-allowed"
                  : "bg-[#0f172a] dark:bg-blue-600 text-white hover:bg-[#0f172a]/90 dark:hover:bg-blue-700 shadow-md hover:shadow-lg",
              )}
              disabled={product.quantity === 0}
              aria-label={t("common.addToCart")}
            >
              <ShoppingCart className="h-5 w-5" />
            </Button>
          </div>

          {/* Chat with Seller Button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 text-xs sm:text-sm"
            onClick={handleChatWithSeller}
            disabled={isChatLoading}
          >
            <MessageSquare className="h-4 w-4" />
            {isChatLoading
              ? t("common.loading")
              : t("chat.chatWithSeller") || "Chat with Seller"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
