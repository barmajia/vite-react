import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, Share2, Heart, Truck, Shield, RotateCcw, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ProductGallery } from '@/components/products/ProductGallery';
import { StarRating } from '@/components/products/StarRating';
import { ProductGrid } from '@/components/products/ProductGrid';
import { useProduct, useRelatedProducts, useAddReview, useSeller } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice, formatDate } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export function ProductDetail() {
  const { asin } = useParams<{ asin: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  const addReview = useAddReview();
  
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });

  const { data: product, isLoading, error } = useProduct(asin || '');
  const { data: seller } = useSeller(product?.seller_id);
  const { data: relatedProducts } = useRelatedProducts(
    product?.category || null,
    asin || '',
    4
  );

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Please sign in to add items to cart');
      navigate(ROUTES.LOGIN, { state: { from: { pathname: window.location.pathname } } });
      return;
    }

    if (!product) return;

    try {
      await addItem(product, quantity);
      toast.success('Added to cart!');
    } catch (_err) {
      toast.error('Failed to add to cart');
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
      toast.success('Link copied to clipboard!');
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast.error('Please sign in to write a review');
      navigate(ROUTES.LOGIN, { state: { from: { pathname: window.location.pathname } } });
      return;
    }

    if (!asin) return;

    try {
      await addReview.mutateAsync({
        asin,
        rating: reviewData.rating,
        comment: reviewData.comment || undefined,
      });
      toast.success('Review submitted!');
      setReviewDialogOpen(false);
      setReviewData({ rating: 5, comment: '' });
    } catch (_err) {
      toast.error('Failed to submit review');
    }
  };

  if (isLoading) {
    return (
      <div className="py-12">
        <LoadingSpinner size="lg" text="Loading product..." />
      </div>
    );
  }

  if (error || !product) {
    return (
      <EmptyState
        title="Product not found"
        description="The product you're looking for doesn't exist or has been removed."
        action={
          <Button onClick={() => navigate(ROUTES.PRODUCTS)}>
            Browse Products
          </Button>
        }
      />
    );
  }

  const averageRating = product.reviews?.length
    ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
    : 0;

  return (
    <div className="space-y-8">
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
                    Sold by{' '}
                    <span className="text-primary">
                      {seller.full_name || 'Seller'}
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
                  <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
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
                  {product.reviews.length} reviews
                </Link>
              </div>
            )}
          </div>

          <Separator />

          {/* Price */}
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{formatPrice(product.price)}</span>
              {product.quantity > 10 && (
                <Badge variant="success">In Stock</Badge>
              )}
              {product.quantity > 0 && product.quantity <= 10 && (
                <Badge variant="warning">Only {product.quantity} left</Badge>
              )}
              {product.quantity === 0 && (
                <Badge variant="destructive">Out of Stock</Badge>
              )}
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{product.description}</p>
            </div>
          )}

          {/* Quantity & Add to Cart */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Label>Quantity</Label>
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
                  onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
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
                {product.quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
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
                Buy Now
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="flex items-center gap-3 text-sm">
              <Truck className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Free Shipping</p>
                <p className="text-muted-foreground">On orders over $50</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Secure Payment</p>
                <p className="text-muted-foreground">100% protected</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <RotateCcw className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Easy Returns</p>
                <p className="text-muted-foreground">30-day policy</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MessageSquare className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">24/7 Support</p>
                <p className="text-muted-foreground">Here to help</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <section id="reviews" className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Customer Reviews</h2>
            {product.reviews && product.reviews.length > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <StarRating rating={averageRating} size="sm" />
                <span className="text-sm text-muted-foreground">
                  Based on {product.reviews.length} reviews
                </span>
              </div>
            )}
          </div>
          <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
            <DialogTrigger asChild>
              <Button>Write a Review</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Write a Review</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Rating</Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setReviewData({ ...reviewData, rating: star })}
                        className="text-2xl"
                      >
                        <span className={star <= reviewData.rating ? 'text-primary' : 'text-muted-foreground'}>
                          ★
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Comment (optional)</Label>
                  <Textarea
                    value={reviewData.comment}
                    onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                    placeholder="Share your experience with this product..."
                    rows={4}
                  />
                </div>
                <Button onClick={handleSubmitReview} className="w-full">
                  Submit Review
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {product.reviews && product.reviews.length > 0 ? (
          <div className="space-y-4">
            {product.reviews.map((review) => {
              const userName = typeof review === 'object' && review !== null && 'user' in review && review.user 
                ? (review.user as { full_name?: string | null })?.full_name 
                : null;
              const displayName = userName || 'Anonymous';
              const initial = displayName[0]?.toUpperCase() || 'U';
              
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
                    <p className="mt-3 text-muted-foreground">{review.comment}</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No reviews yet"
            description="Be the first to review this product"
          />
        )}
      </section>

      {/* Related Products */}
      {relatedProducts && relatedProducts.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-6">Related Products</h2>
          <ProductGrid products={relatedProducts} />
        </section>
      )}
    </div>
  );
}
