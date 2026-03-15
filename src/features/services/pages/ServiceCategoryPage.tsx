import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ServiceProviderCard } from '../components/ServiceProviderCard';
import { useServices, type ServiceProvider, type ServiceCategory } from '../hooks/useServices';

export function ServiceCategoryPage() {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const { getProvidersByCategory, getCategories } = useServices();
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [category, setCategory] = useState<ServiceCategory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!categorySlug) return;

      setLoading(true);
      const [cats, providersData] = await Promise.all([
        getCategories(),
        getProvidersByCategory(categorySlug),
      ]);

      const currentCategory = cats.find((c) => c.slug === categorySlug) || null;
      setCategory(currentCategory);
      setProviders(providersData);
      setLoading(false);
    };

    fetchData();
  }, [categorySlug, getProvidersByCategory, getCategories]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading providers...</p>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Category not found</h2>
          <Button asChild>
            <Link to="/services">Browse All Services</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/services">
            <ArrowLeft size={16} className="mr-2" />
            Back to Services
          </Link>
        </Button>
        <h1 className="text-4xl font-bold mb-2">{category.name}</h1>
        {category.description && (
          <p className="text-muted-foreground text-lg">{category.description}</p>
        )}
      </div>

      {/* Providers Grid */}
      {providers.length > 0 ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              {providers.length} {providers.length === 1 ? 'Provider' : 'Providers'} Found
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map((provider) => (
              <ServiceProviderCard key={provider.id} provider={provider} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold mb-2">No providers in this category yet</h3>
          <p className="text-muted-foreground mb-6">
            Check back later or explore other categories
          </p>
          <Button asChild>
            <Link to="/services">Browse All Services</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
