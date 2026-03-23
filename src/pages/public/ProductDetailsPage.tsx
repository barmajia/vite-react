import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { ShoppingCart, Loader2, AlertCircle, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";
import { ROUTES } from "@/lib/constants";
import { buildImageUrl } from "@/lib/utils";

const ProductDetailsPage = () => {
  const { asin } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [thumbnailErrors, setThumbnailErrors] = useState<boolean[]>([]);

  // Use the shared utility for image URLs
  const getImageUrl = buildImageUrl;

  // Fetch Product Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch Product Details
        const { data, error: fetchError } = await supabase
          .from("products")
          .select(
            `
            id,
            title,
            description,
            brand,
            price,
            quantity,
            status,
            images,
            category,
            subcategory,
            seller_id
          `,
          )
          .eq("asin", asin)
          .maybeSingle();

        if (fetchError) throw fetchError;
        if (!data) {
          setError("Product not found or inactive.");
          return;
        }

        setProduct(data);
      } catch (err: any) {
        console.error("Error fetching product:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [asin]);

  // Add to Cart Logic
  const handleAddToCart = async () => {
    if (!user) {
      toast.error("Please log in to add items to your cart");
      navigate(ROUTES.LOGIN, {
        state: { from: { pathname: window.location.pathname } },
      });
      return;
    }

    if (!product) return;

    setAddingToCart(true);
    try {
      await addItem({
        productId: product.id,
        name: product.title,
        price: product.price,
        salePrice: null,
        image_url:
          Array.isArray(product.images) && product.images.length > 0
            ? getImageUrl(product.images[0])
            : null,
        stock_quantity: product.quantity,
      });
      toast.success("Added to cart successfully!");
    } catch (err: any) {
      console.error("Cart error:", err);
      toast.error("Failed to add to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">{error || "Product not found"}</p>
        <Button onClick={() => navigate(ROUTES.PRODUCTS)}>
          Browse Products
        </Button>
      </div>
    );
  }

  // Parse images
  const images = Array.isArray(product.images) ? product.images : [];
  const mainImage =
    images.length > 0 ? getImageUrl(images[0]) : "/placeholder.png";
  const hasImageError = imageError || images.length === 0;

  const handleThumbnailClick = (index: number) => {
    if (!thumbnailErrors[index] && images[index]) {
      setImageError(false);
      const newImages = [...images];
      const temp = newImages[0];
      newImages[0] = newImages[index];
      newImages[index] = temp;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 pt-20">
      <div className="lg:grid lg:grid-cols-2 lg:gap-x-8">
        {/* Image Gallery */}
        <div className="flex flex-col gap-4">
          <div className="w-full aspect-square flex items-center justify-center bg-white rounded-lg shadow-md border p-8">
            {hasImageError ? (
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <ImageOff className="h-16 w-16" />
                <p className="text-sm">No image available</p>
              </div>
            ) : (
              <img
                src={mainImage}
                alt={product.title}
                className="max-w-full max-h-full object-contain"
                onError={() => setImageError(true)}
              />
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img: string, idx: number) => {
                const imgUrl = getImageUrl(img);
                const isBroken = thumbnailErrors[idx];
                return (
                  <div
                    key={idx}
                    className={`w-[60px] h-[60px] flex-shrink-0 bg-white rounded border p-2 cursor-pointer hover:ring-2 hover:ring-primary transition-all ${
                      isBroken ? "opacity-50" : ""
                    }`}
                    onClick={() => !isBroken && handleThumbnailClick(idx)}
                  >
                    {isBroken ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageOff className="h-6 w-6 text-muted-foreground" />
                      </div>
                    ) : (
                      <img
                        src={imgUrl}
                        alt={`Thumbnail ${idx}`}
                        className="w-full h-full object-contain"
                        onError={() => {
                          const newErrors = [...thumbnailErrors];
                          newErrors[idx] = true;
                          setThumbnailErrors(newErrors);
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="mt-10 px-4 sm:px-0 sm:mt-16 lg:mt-0 space-y-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
              {product.title}
            </h1>
            {product.brand && (
              <p className="mt-2 text-sm text-gray-500">
                Brand: {product.brand}
              </p>
            )}
            {product.category && (
              <p className="mt-1 text-sm text-gray-500">
                Category: {product.category}
                {product.subcategory && ` > ${product.subcategory}`}
              </p>
            )}
          </div>

          <div>
            <p className="text-3xl text-gray-900 font-bold">
              ${product.price?.toFixed(2)}
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <div className="text-base text-gray-700 whitespace-pre-line">
              {product.description}
            </div>
          </div>

          {/* Stock Status */}
          <div>
            {product.quantity > 0 ? (
              <p className="text-sm text-green-600 font-semibold">
                In Stock ({product.quantity} available)
              </p>
            ) : (
              <p className="text-sm text-red-600 font-semibold">Out of Stock</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={handleAddToCart}
              disabled={addingToCart || product.quantity === 0}
              className="flex-1"
              size="lg"
            >
              {addingToCart ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <ShoppingCart className="mr-2 h-5 w-5" />
              )}
              {product.quantity === 0 ? "Sold Out" : "Add to Cart"}
            </Button>
          </div>

          <p className="text-xs text-gray-500">
            Sold by:{" "}
            {product.seller_id === user?.id ? "You" : "Verified Seller"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsPage;
