import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useWishlist } from '../hooks/useWishlist';
import { WishlistItem } from '../components/WishlistItem';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, ShoppingCart } from 'lucide-react';

export function WishlistPage() {
  const { user, loading } = useAuth();
  const { items, isLoading, removeFromWishlist, isRemoving } = useWishlist();

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Wishlist</h1>
        <div className="grid gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-muted mb-6">
          <Heart className="w-12 h-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Your wishlist is empty</h2>
        <p className="text-muted-foreground mb-6">
          Save items you love by clicking the heart icon on product cards.
        </p>
        <Button size="lg" asChild>
          <a href="/products">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Browse Products
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">My Wishlist ({items.length} items)</h1>
      <div className="grid gap-4">
        {items.map((item) => (
          <WishlistItem
            key={item.id}
            item={item}
            onRemove={removeFromWishlist}
            isRemoving={isRemoving}
          />
        ))}
      </div>
    </div>
  );
}
