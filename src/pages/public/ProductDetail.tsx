import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ShoppingCart,
  Share2,
  Heart,
  Truck,
  Shield,
  RotateCcw,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProductGallery } from "@/components/products/ProductGallery";
import { StarRating } from "@/components/products/StarRating";
import { ProductGrid } from "@/components/products/ProductGrid";
import {
  useProduct,
  useRelatedProducts,
  useAddReview,
  useSeller,
} from "@/hooks/useProducts";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useConversationCreate } from "@/features/messaging";
import { formatPrice, formatDate } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export function ProductDetail() {
  const { t } = useTranslation();
  const { asin } = useParams<{ asin: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  const addReview = useAddReview();
  const { createConversation, isCreating } = useConversationCreate();

  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: "" });

  const { data: product, isLoading, error } = useProduct(asin || "");
  const { data: seller } = useSeller(product?.seller_id);
  const { data: relatedProducts } = useRelatedProducts(
    product?.category || null,
    asin || "",
    4,
  );

  const handleAddToCart = async () => {
    if (!user) {
      toast.error(t("productDetail.signInToCart"));
      navigate(ROUTES.LOGIN, {
        state: { from: { pathname: window.location.pathname } },
      });
      return;
    }

    if (!product) return;

    try {
      addItem({
        productId: product.id,
        name: product.title,
        price: product.price,
        salePrice: null,
        image_url: Array.isArray(product.images)
          ? (product.images[0] as string)
          : null,
        stock_quantity: product.quantity,
      });
      toast.success(t("productDetail.addedToCart"));
    } catch (_err) {
      toast.error(t("productDetail.failedAddToCart"));
    }
  };

  const handleChatWithSeller = async () => {
    if (!user) {
      toast.error(t("productDetail.signInToChat"));
      navigate(ROUTES.LOGIN, {
        state: { from: { pathname: window.location.pathname } },
      });
      return;
    }

    if (!product?.seller_id) {
      toast.error(t("productDetail.sellerInfoUnavailable"));
      return;
    }

    if (user.id === product.seller_id) {
      toast.error(t("productDetail.cannotChatSelf"));
      return;
    }

    const conversationId = await createConversation(
      product.seller_id,
      product.id,
    );
    if (conversationId) {
      navigate(`/messages/${conversationId}`);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.title,
          text: product?.description || undefined,
          url: window.location.href,
        });
      } catch (_err) {
        // User cancelled or share failed
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success(t("productDetail.linkCopied"));
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast.error(t("productDetail.signInToReview"));
      navigate(ROUTES.LOGIN, {
        state: { from: { pathname: window.location.pathname } },
      });
      return;
    }

    if (!asin) return;

    try {
      await addReview.mutateAsync({
        asin,
        rating: reviewData.rating,
        comment: reviewData.comment || undefined,
      });
      toast.success(t("productDetail.reviewSubmitted"));
      setReviewDialogOpen(false);
      setReviewData({ rating: 5, comment: "" });
    } catch (_err) {
      toast.error(t("productDetail.failedSubmitReview"));
    }
  };

  if (isLoading) {
    return (
      <div className="py-12">
        <LoadingSpinner size="lg" text={t("productDetail.loading")} />
      </div>
    );
  }

  if (error || !product) {
    return (
      <EmptyState
        title={t("productDetail.notFound")}
        description={t("productDetail.notFoundDesc")}
        action={
          <Button onClick={() => navigate(ROUTES.PRODUCTS)}>
            {t("errors.browseProducts")}
          </Button>
        }
      />
    );
  }

  const averageRating = product.reviews?.length
    ? product.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
      product.reviews.length
    : 0;

  return (
    <div className="space-y-8 pt-20">
      {/* Product Details */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Gallery */}
        <div>
          <ProductGallery images={product.images} title={product.title} />
        </div>

        {/* Info */}
        <div className="space-y-6">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">
                  {product.title}
                </h1>
                {seller && (
                  <p className="text-sm text-muted-foreground">
                    {t("productDetail.soldBy")}{" "}
                    <span className="text-primary">
                      {seller.full_name || t("productDetail.seller")}
                    </span>
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleShare}
                  className="shrink-0"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className="shrink-0"
                >
                  <Heart
                    className={`h-4 w-4 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`}
                  />
                </Button>
              </div>
            </div>

            {/* Rating */}
            {product.reviews && product.reviews.length > 0 && (
              <div className="flex items-center gap-4 mt-4">
                <StarRating rating={averageRating} showValue />
                <Link
                  to="#reviews"
                  className="text-sm text-primary hover:underline"
                >
                  {product.reviews.length} {t("product.reviews").toLowerCase()}
                </Link>
              </div>
            )}
          </div>

          <Separator />

          {/* Price */}
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">
                {formatPrice(product.price)}
              </span>
              {product.quantity > 10 && (
                <Badge variant="success">{t("product.inStock")}</Badge>
              )}
              {product.quantity > 0 && product.quantity <= 10 && (
                <Badge variant="warning">
                  {t("productDetail.onlyLeft", { count: product.quantity })}
                </Badge>
              )}
              {product.quantity === 0 && (
                <Badge variant="destructive">{t("product.outOfStock")}</Badge>
              )}
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div>
              <h3 className="font-semibold mb-2">{t("product.description")}</h3>
              <p className="text-muted-foreground">{product.description}</p>
            </div>
          )}

          {/* Quantity & Add to Cart */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Label>{t("product.quantity")}</Label>
              <div className="flex items-center border rounded-md">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-9 w-9 rounded-none"
                >
                  -
                </Button>
                <span className="w-12 text-center">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setQuantity(Math.min(product.quantity, quantity + 1))
                  }
                  className="h-9 w-9 rounded-none"
                  disabled={quantity >= product.quantity}
                >
                  +
                </Button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                size="lg"
                className="flex-1"
                onClick={handleAddToCart}
                disabled={product.quantity === 0}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                {product.quantity === 0
                  ? t("product.outOfStock")
                  : t("product.addToCart")}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  handleAddToCart();
                  navigate(ROUTES.CHECKOUT);
                }}
                disabled={product.quantity === 0}
              >
                {t("productDetail.buyNow")}
              </Button>
            </div>
            <Button
              size="lg"
              variant="secondary"
              onClick={handleChatWithSeller}
              disabled={isCreating || user?.id === product.seller_id}
              className="w-full"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              {isCreating
                ? t("productDetail.startingChat")
                : t("productDetail.askSeller")}
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="flex items-center gap-3 text-sm">
              <Truck className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">{t("productDetail.freeShipping")}</p>
                <p className="text-muted-foreground">
                  {t("productDetail.freeShippingDesc")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">
                  {t("home.features.securePayment")}
                </p>
                <p className="text-muted-foreground">
                  {t("productDetail.securePaymentDesc")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <RotateCcw className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">{t("productDetail.easyReturns")}</p>
                <p className="text-muted-foreground">
                  {t("productDetail.easyReturnsDesc")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MessageSquare className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">{t("productDetail.support247")}</p>
                <p className="text-muted-foreground">
                  {t("productDetail.supportDesc")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <section id="reviews" className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              {t("productDetail.customerReviews")}
            </h2>
            {product.reviews && product.reviews.length > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <StarRating rating={averageRating} size="sm" />
                <span className="text-sm text-muted-foreground">
                  {t("productDetail.basedOnReviews", {
                    count: product.reviews.length,
                  })}
                </span>
              </div>
            )}
          </div>
          <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
            <DialogTrigger asChild>
              <Button>{t("productDetail.writeReview")}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("productDetail.writeReview")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("product.rating")}</Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() =>
                          setReviewData({ ...reviewData, rating: star })
                        }
                        className="text-2xl"
                      >
                        <span
                          className={
                            star <= reviewData.rating
                              ? "text-primary"
                              : "text-muted-foreground"
                          }
                        >
                          ★
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("productDetail.commentOptional")}</Label>
                  <Textarea
                    value={reviewData.comment}
                    onChange={(e) =>
                      setReviewData({ ...reviewData, comment: e.target.value })
                    }
                    placeholder={t("productDetail.commentPlaceholder")}
                    rows={4}
                  />
                </div>
                <Button onClick={handleSubmitReview} className="w-full">
                  {t("productDetail.submitReview")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {product.reviews && product.reviews.length > 0 ? (
          <div className="space-y-4">
            {product.reviews.map((review: any) => {
              const userName =
                typeof review === "object" &&
                review !== null &&
                "user" in review &&
                review.user
                  ? (review.user as { full_name?: string | null })?.full_name
                  : null;
              const displayName = userName || "Anonymous";
              const initial = displayName[0]?.toUpperCase() || "U";

              return (
                <div key={review.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-medium text-sm">{initial}</span>
                      </div>
                      <div>
                        <p className="font-medium">{displayName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(review.created_at)}
                        </p>
                      </div>
                    </div>
                    <StarRating rating={review.rating} size="sm" />
                  </div>
                  {review.comment && (
                    <p className="mt-3 text-muted-foreground">
                      {review.comment}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title={t("productDetail.noReviewsYet")}
            description={t("productDetail.beFirstReview")}
          />
        )}
      </section>

      {/* Related Products */}
      {relatedProducts && relatedProducts.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-6">
            {t("product.relatedProducts")}
          </h2>
          <ProductGrid products={relatedProducts} />
        </section>
      )}
    </div>
  );
}
