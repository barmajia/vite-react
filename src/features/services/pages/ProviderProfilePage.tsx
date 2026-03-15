import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Star, CheckCircle, Building2, User, Hospital, Briefcase, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useServices, type ServiceProvider, type ServiceListing, type ServicePortfolio } from '../hooks/useServices';
import { ServiceListingCard } from '../components/ServiceListingCard';

export function ProviderProfilePage() {
  const { providerId } = useParams<{ providerId: string }>();
  const { getProviderById } = useServices();
  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [listings, setListings] = useState<ServiceListing[]>([]);
  const [portfolio, setPortfolio] = useState<ServicePortfolio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!providerId) return;

      setLoading(true);
      const data = await getProviderById(providerId);
      if (data) {
        setProvider(data);
        // @ts-ignore - listings and portfolio come from the join
        setListings(data.svc_listings || []);
        // @ts-ignore
        setPortfolio(data.svc_portfolio || []);
      }
      setLoading(false);
    };

    fetchData();
  }, [providerId, getProviderById]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'company':
        return <Building2 size={20} />;
      case 'hospital':
        return <Hospital size={20} />;
      default:
        return <User size={20} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading provider profile...</p>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Provider not found</h2>
          <Button asChild>
            <Link to="/services">Browse Services</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Cover Image */}
      <div className="h-48 md:h-64 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-t-2xl relative overflow-hidden">
        {provider.cover_image_url && (
          <img
            src={provider.cover_image_url}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Profile Header */}
      <div className="bg-card border border-t-0 rounded-b-2xl p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Avatar */}
          <div className="w-32 h-32 rounded-2xl border-4 border-background -mt-20 overflow-hidden bg-white shadow-lg">
            {provider.logo_url ? (
              <img
                src={provider.logo_url}
                alt={provider.provider_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                {getIcon(provider.provider_type)}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h1 className="text-3xl font-bold mb-2">{provider.provider_name}</h1>
                <p className="text-muted-foreground text-lg">{provider.tagline || provider.description}</p>
              </div>
              {provider.is_verified && (
                <Badge variant="secondary" className="flex items-center gap-1 text-sm">
                  <CheckCircle size={16} /> Verified
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                {getIcon(provider.provider_type)}
                <span className="capitalize">{provider.provider_type}</span>
              </div>
              {provider.location_city && (
                <div className="flex items-center gap-1">
                  <MapPin size={16} />
                  <span>{provider.location_city}{provider.location_country && `, ${provider.location_country}`}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Star size={16} className="text-yellow-400 fill-yellow-400" />
                <span className="font-semibold text-foreground">
                  {provider.average_rating?.toFixed(1) || '0.0'}
                </span>
                <span>({provider.review_count} reviews)</span>
              </div>
              <div className="flex items-center gap-1">
                <Briefcase size={16} />
                <span>{provider.total_jobs_completed} jobs completed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        {(provider.email || provider.phone || provider.website) && (
          <>
            <Separator className="my-6" />
            <div className="flex flex-wrap gap-4">
              {provider.email && (
                <a href={`mailto:${provider.email}`} className="text-primary hover:underline text-sm">
                  📧 {provider.email}
                </a>
              )}
              {provider.phone && (
                <a href={`tel:${provider.phone}`} className="text-primary hover:underline text-sm">
                  📞 {provider.phone}
                </a>
              )}
              {provider.website && (
                <a href={provider.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
                  🌐 Website
                </a>
              )}
            </div>
          </>
        )}
      </div>

      {/* Services/Listings */}
      {listings.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Services Offered</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.filter((l) => l.is_active).map((listing) => (
              <ServiceListingCard
                key={listing.id}
                listing={{
                  ...listing,
                  svc_providers: {
                    provider_name: provider.provider_name,
                    logo_url: provider.logo_url,
                    average_rating: provider.average_rating,
                  },
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Portfolio */}
      {portfolio.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Portfolio</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolio.map((item) => (
              <Card key={item.id}>
                {item.images && item.images.length > 0 && (
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </div>
                )}
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  {item.description && (
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    {item.completed_at && (
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>{new Date(item.completed_at).toLocaleDateString()}</span>
                      </div>
                    )}
                    {item.project_url && (
                      <a
                        href={item.project_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        View Project →
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Specialties/Skills */}
      {provider.specialties && provider.specialties.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-6">Skills & Expertise</h2>
          <div className="flex flex-wrap gap-2">
            {provider.specialties.map((skill, idx) => (
              <Badge key={idx} variant="secondary" className="text-sm px-4 py-2">
                {skill}
              </Badge>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
