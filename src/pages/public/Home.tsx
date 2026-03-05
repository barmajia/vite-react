import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ShoppingBag, Truck, Shield, Star, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductGrid } from '@/components/products/ProductGrid';
import { useFeaturedProducts } from '@/hooks/useProducts';
import { ROUTES } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';

export function Home() {
  const { data: featuredProducts, isLoading } = useFeaturedProducts(8);
  const navigate = useNavigate();

  const categories = [
    { id: '1', name: 'Electronics', icon: '📱', color: 'from-gray-700 to-gray-900' },
    { id: '2', name: 'Fashion', icon: '👕', color: 'from-gray-600 to-gray-800' },
    { id: '3', name: 'Home & Garden', icon: '🏠', color: 'from-gray-500 to-gray-700' },
    { id: '4', name: 'Sports', icon: '⚽', color: 'from-gray-400 to-gray-600' },
    { id: '5', name: 'Beauty', icon: '💄', color: 'from-gray-300 to-gray-500' },
    { id: '6', name: 'Books', icon: '📚', color: 'from-gray-200 to-gray-400' },
  ];

  const features = [
    {
      icon: <ShoppingBag className="h-6 w-6" />,
      title: 'Wide Selection',
      description: 'Discover thousands of products from verified sellers worldwide',
    },
    {
      icon: <Truck className="h-6 w-6" />,
      title: 'Fast Shipping',
      description: 'Free delivery on orders over $50 with express shipping options',
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Secure Payment',
      description: 'Your transactions are protected with industry-leading security',
    },
    {
      icon: <Star className="h-6 w-6" />,
      title: 'Quality Guaranteed',
      description: 'All products are verified for authenticity and quality',
    },
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-accent to-muted text-background">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative px-6 py-16 md:py-24 md:px-12">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-background/10 px-4 py-2 text-sm backdrop-blur">
              <Zap className="h-4 w-4" />
              <span>New Season Arrivals</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Discover Premium Products
            </h1>
            <p className="text-lg md:text-xl text-background/80 max-w-2xl">
              Shop from thousands of verified sellers. Quality meets convenience with Aurora's curated marketplace.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                className="bg-background text-foreground hover:bg-background/90"
                onClick={() => navigate(ROUTES.PRODUCTS)}
              >
                Shop Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-background text-background hover:bg-background/10"
                onClick={() => navigate(ROUTES.CATEGORIES)}
              >
                Browse Categories
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-background/10 rounded-full blur-3xl" />
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-background/10 rounded-full blur-3xl" />
      </section>

      {/* Categories */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Shop by Category</h2>
          <Link
            to={ROUTES.CATEGORIES}
            className="text-primary hover:underline text-sm font-medium flex items-center"
          >
            View All
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`${ROUTES.CATEGORY_PRODUCTS.replace(':id', category.id)}`}
              className="group"
            >
              <div
                className={`aspect-square rounded-2xl bg-gradient-to-br ${category.color} p-6 flex flex-col items-center justify-center gap-3 transition-transform group-hover:scale-105`}
              >
                <span className="text-4xl">{category.icon}</span>
                <span className="font-medium text-center text-white">
                  {category.name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Featured Products</h2>
          <Link
            to={ROUTES.PRODUCTS}
            className="text-primary hover:underline text-sm font-medium flex items-center"
          >
            View All
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ProductGrid products={featuredProducts || []} />
        )}
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => (
          <div
            key={index}
            className="p-6 rounded-xl border bg-card hover:shadow-lg transition-shadow"
          >
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
              {feature.icon}
            </div>
            <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
            <p className="text-muted-foreground">{feature.description}</p>
          </div>
        ))}
      </section>

      {/* Newsletter */}
      <section className="rounded-2xl bg-gradient-to-br from-primary via-accent to-muted text-background p-8 md:p-12">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold">Stay in the Loop</h2>
          <p className="text-background/80">
            Subscribe to our newsletter for exclusive deals, new arrivals, and insider-only discounts.
          </p>
          <form className="flex flex-col sm:flex-row gap-3" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg bg-background/10 border border-background/20 text-background placeholder:text-background/60 focus:outline-none focus:ring-2 focus:ring-background/30"
            />
            <Button
              type="submit"
              size="lg"
              className="bg-background text-foreground hover:bg-background/90 whitespace-nowrap"
            >
              Subscribe
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
