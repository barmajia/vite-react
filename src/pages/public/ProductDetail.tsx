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
  Star,
  Check,
  ChevronRight,
  Info,
  MessageCircle,
} from "lucide-react";
import {
  Button,
  Badge,
  Separator,
  TextArea,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Label,
} from "@/components/ui";
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
import { formatPrice, formatDate } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { toast } from "sonner";
import { useWishlist } from "@/features/wishlist/hooks/useWishlist";

export function ProductDetail() {
  const { t } = useTranslation();
  const { asin } = useParams<{ asin: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  const addReview = useAddReview();
  const { toggleWishlist, isInWishlist, isAdding } = useWishlist();

  const [quantity, setQuantity] = useState(1);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: "" });

  const { data: product, isLoading, error } = useProduct(asin || "");
  const { data: seller } = useSeller(product?.seller_id);
  const { data: relatedProducts } = useRelatedProducts(
    product?.category || null,
    asin || "",
    4,
  );

  const wishlisted = product ? isInWishlist(product.id) : false;

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
      <div className="container mx-auto px-4 py-32">
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="aspect-square rounded-3xl bg-white/5 border border-white/10 animate-pulse" />
          <div className="space-y-6">
            <div className="h-10 w-2/3 bg-white/5 rounded-lg animate-pulse" />
            <div className="h-6 w-1/3 bg-white/5 rounded-lg animate-pulse" />
            <div className="h-24 w-full bg-white/5 rounded-lg animate-pulse" />
            <div className="h-12 w-1/2 bg-white/5 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-32 flex items-center justify-center">
        <div className="glass-card p-12 text-center max-w-md animate-in fade-in zoom-in duration-500">
          <Info className="h-16 w-16 text-primary/50 mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-4">
            {t("productDetail.notFound")}
          </h1>
          <p className="text-muted-foreground mb-8">
            {t("productDetail.notFoundDesc")}
          </p>
          <Button className="glass" onClick={() => navigate(ROUTES.PRODUCTS)}>
            {t("errors.browseProducts")}
          </Button>
        </div>
      </div>
    );
  }

  const averageRating = product.reviews?.length
    ? product.reviews.reduce(
        (sum: number, r: any) => sum + (r.rating || 0),
        0,
      ) / product.reviews.length
    : 0;

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-500 pt-32 pb-20">
      <div className="container mx-auto px-4">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8 animate-in fade-in slide-in-from-left duration-500">
          <Link
            to={ROUTES.HOME}
            className="hover:text-primary transition-colors"
          >
            {t("nav.home")}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link
            to={ROUTES.PRODUCTS}
            className="hover:text-primary transition-colors"
          >
            {t("nav.products")}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground truncate max-w-[200px]">
            {product.title}
          </span>
        </nav>

        {/* Product Grid */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left: Gallery */}
          <div className="animate-in fade-in slide-in-from-top-6 duration-700">
            <div className="glass-card overflow-hidden group">
              <ProductGallery images={product.images} title={product.title} />
            </div>

            {/* Features Glass Card */}
            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="glass shadow-sm p-4 rounded-2xl flex flex-col items-center text-center gap-2 hover:bg-white/10 transition-colors cursor-default">
                <Truck className="h-6 w-6 text-primary" />
                <span className="text-xs font-semibold">
                  {t("productDetail.freeShipping")}
                </span>
              </div>
              <div className="glass shadow-sm p-4 rounded-2xl flex flex-col items-center text-center gap-2 hover:bg-white/10 transition-colors cursor-default">
                <Shield className="h-6 w-6 text-primary" />
                <span className="text-xs font-semibold">
                  {t("home.features.securePayment")}
                </span>
              </div>
              <div className="glass shadow-sm p-4 rounded-2xl flex flex-col items-center text-center gap-2 hover:bg-white/10 transition-colors cursor-default">
                <RotateCcw className="h-6 w-6 text-primary" />
                <span className="text-xs font-semibold">
                  {t("productDetail.easyReturns")}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Info */}
          <div className="space-y-8 animate-in fade-in slide-in-from-right-6 duration-700">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 mb-2">
                {product.category && (
                  <Badge
                    variant="outline"
                    className="glass capitalize rounded-full px-4 border-primary/20"
                  >
                    {product.category}
                  </Badge>
                )}
                {product.quantity > 0 ? (
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 rounded-full px-4">
                    <Check className="h-3 w-3 mr-1" />
                    {t("product.inStock")}
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="rounded-full px-4">
                    {t("product.outOfStock")}
                  </Badge>
                )}
              </div>

              <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">
                {product.title}
              </h1>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <StarRating rating={averageRating} showValue />
                  <span className="text-sm text-muted-foreground">
                    ({product.reviews?.length || 0}{" "}
                    {t("product.reviews").toLowerCase()})
                  </span>
                </div>
                {seller && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">
                      {t("productDetail.soldBy")}
                    </span>
                    <Link
                      to={`/seller/${product.seller_id}`}
                      className="text-primary font-medium hover:underline"
                    >
                      {seller.full_name || t("productDetail.seller")}
                    </Link>
                  </div>
                )}
              </div>
            </div>

            <Separator className="bg-white/10" />

            {/* Pricing Section */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-4">
                <span className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  {formatPrice(product.price)}
                </span>
                {product.price > 1000 && (
                  <span className="text-lg text-muted-foreground line-through decoration-red-500/50">
                    {formatPrice(product.price * 1.2)}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Info className="h-4 w-4" />
                {t("productDetail.vatIncluded")}
              </p>
            </div>

            {/* Description Glass Container */}
            <div className="glass-card p-6 rounded-3xl space-y-3">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                {t("product.description")}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {product.description || t("product.noDescription")}
              </p>
            </div>

            {/* Interaction Bar */}
            <div className="glass-card p-6 rounded-3xl space-y-6 sticky top-24 z-10 transition-transform duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Label className="font-bold text-lg">
                    {t("product.quantity")}
                  </Label>
                  <div className="flex items-center glass rounded-2xl p-1 border-primary/10">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="h-10 w-10 hover:bg-white/10 rounded-xl"
                    >
                      -
                    </Button>
                    <span className="w-10 text-center font-bold">
                      {quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setQuantity(Math.min(product.quantity, quantity + 1))
                      }
                      className="h-10 w-10 hover:bg-white/10 rounded-xl"
                      disabled={quantity >= product.quantity}
                    >
                      +
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                    className="glass border-primary/20 rounded-xl h-12 w-12"
                  >
                    <Share2 className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if (!user) {
                        toast.error("Please sign in to add to wishlist");
                        navigate(ROUTES.LOGIN, {
                          state: {
                            from: { pathname: window.location.pathname },
                          },
                        });
                        return;
                      }
                      if (!product) return;

                      const added = await toggleWishlist(product.id);
                      toast.success(
                        added ? "Added to wishlist" : "Removed from wishlist",
                      );
                    }}
                    disabled={isAdding}
                    className={`glass border-primary/20 rounded-xl h-12 w-12 transition-all duration-300 ${wishlisted ? "bg-red-500 text-white border-red-500 scale-110" : ""}`}
                  >
                    <Heart
                      className={`h-5 w-5 ${wishlisted ? "fill-current" : ""}`}
                    />
                  </Button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="flex-1 glass bg-primary hover:bg-primary/90 text-white h-14 text-lg rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95"
                  onClick={handleAddToCart}
                  disabled={product.quantity === 0}
                >
                  <ShoppingCart className="mr-3 h-5 w-5" />
                  {product.quantity === 0
                    ? t("product.outOfStock")
                    : t("product.addToCart")}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="flex-1 glass border-primary/30 h-14 text-lg rounded-2xl hover:bg-primary/5 transition-all active:scale-95"
                  onClick={() => {
                    handleAddToCart();
                    navigate(ROUTES.CHECKOUT);
                  }}
                  disabled={product.quantity === 0}
                >
                  {t("productDetail.buyNow")}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Sections */}
        <div className="mt-24 space-y-24">
          {/* Reviews */}
          <section id="reviews" className="space-y-12">
            <div className="flex items-end justify-between border-b border-white/10 pb-6">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">
                  {t("productDetail.customerReviews")}
                </h2>
                {product.reviews && product.reviews.length > 0 && (
                  <div className="flex items-center gap-3">
                    <StarRating rating={averageRating} size="sm" />
                    <span className="text-sm text-muted-foreground font-medium">
                      {t("productDetail.basedOnReviews", {
                        count: product.reviews.length,
                      })}
                    </span>
                  </div>
                )}
              </div>
              <Dialog
                open={reviewDialogOpen}
                onOpenChange={setReviewDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button className="glass bg-white !text-black hover:bg-white/90 rounded-2xl px-8 h-12 font-bold shadow-xl shadow-white/5">
                    {t("productDetail.writeReview")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-card border-white/20 p-8 rounded-3xl max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">
                      {t("productDetail.writeReview")}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 mt-6">
                    <div className="space-y-3">
                      <Label className="text-lg font-semibold">
                        {t("product.rating")}
                      </Label>
                      <div className="flex gap-4 p-4 glass rounded-2xl justify-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() =>
                              setReviewData({ ...reviewData, rating: star })
                            }
                            className="text-3xl transition-transform hover:scale-125 active:scale-90"
                          >
                            <Star
                              className={`h-8 w-8 ${star <= reviewData.rating ? "fill-yellow-400 text-yellow-400" : "text-white/20"}`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-lg font-semibold">
                        {t("productDetail.commentOptional")}
                      </Label>
                      <TextArea
                        value={reviewData.comment}
                        onChange={(e) =>
                          setReviewData({
                            ...reviewData,
                            comment: e.target.value,
                          })
                        }
                        placeholder={t("productDetail.commentPlaceholder")}
                        className="glass bg-white/5 border-white/10 rounded-2xl p-4 focus:ring-primary/50"
                        rows={4}
                      />
                    </div>
                    <Button
                      onClick={handleSubmitReview}
                      className="w-full glass bg-primary hover:bg-primary/90 text-white h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20"
                    >
                      {t("productDetail.submitReview")}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {product.reviews && product.reviews.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {product.reviews.map((review: any, idx: number) => {
                  const userName =
                    typeof review === "object" &&
                    review !== null &&
                    "user" in review &&
                    review.user
                      ? (review.user as { full_name?: string | null })
                          ?.full_name
                      : null;
                  const displayName = userName || "Anonymous";
                  const initial = displayName[0]?.toUpperCase() || "U";

                  return (
                    <div
                      key={review.id}
                      className="glass-card p-6 rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-500"
                      style={{ animationDelay: `${idx * 100}ms` }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10 shadow-inner">
                            <span className="font-bold text-primary">
                              {initial}
                            </span>
                          </div>
                          <div>
                            <p className="font-bold text-lg leading-none mb-1">
                              {displayName}
                            </p>
                            <p className="text-xs text-muted-foreground font-medium">
                              {formatDate(review.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`h-4 w-4 ${s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-white/10"}`}
                            />
                          ))}
                        </div>
                      </div>
                      <Separator className="bg-white/5 mb-4" />
                      {review.comment && (
                        <p className="text-muted-foreground leading-relaxed italic">
                          "{review.comment}"
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="glass-card p-12 text-center rounded-3xl">
                <MessageCircle className="h-12 w-12 text-primary/30 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">
                  {t("productDetail.noReviewsYet")}
                </h3>
                <p className="text-muted-foreground">
                  {t("productDetail.beFirstReview")}
                </p>
              </div>
            )}
          </section>

          {/* Related Products */}
          {relatedProducts && relatedProducts.length > 0 && (
            <section className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold">
                  {t("product.relatedProducts")}
                </h2>
                <div className="h-1 w-24 bg-gradient-to-r from-primary to-transparent rounded-full" />
              </div>
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <ProductGrid products={relatedProducts} />
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
