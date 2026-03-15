import { Link } from 'react-router-dom';
import { MapPin, Star, CheckCircle, Building2, User, Hospital } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ServiceProvider } from '../hooks/useServices';

interface ServiceProviderCardProps {
  provider: ServiceProvider;
}

export function ServiceProviderCard({ provider }: ServiceProviderCardProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'company':
        return <Building2 size={16} />;
      case 'hospital':
        return <Hospital size={16} />;
      default:
        return <User size={16} />;
    }
  };

  const getTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg">
      {/* Cover Image */}
      <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-500 relative overflow-hidden">
        {provider.cover_image_url && (
          <img
            src={provider.cover_image_url}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <CardContent className="px-5 pb-5 relative">
        {/* Avatar & Badge */}
        <div className="flex justify-between items-end -mt-10 mb-3">
          <div className="w-20 h-20 rounded-xl border-4 border-white object-cover bg-white overflow-hidden">
            {provider.logo_url ? (
              <img
                src={provider.logo_url}
                alt={provider.provider_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <User size={40} className="text-muted-foreground" />
              </div>
            )}
          </div>
          {provider.is_verified && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <CheckCircle size={12} /> Verified
            </Badge>
          )}
        </div>

        {/* Provider Info */}
        <Link
          to={`/services/provider/${provider.id}`}
          className="block hover:text-primary transition-colors"
        >
          <h3 className="font-bold text-lg text-foreground hover:text-primary truncate">
            {provider.provider_name}
          </h3>
        </Link>

        {/* Type & Location */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2 flex-wrap">
          <Badge variant="outline" className="text-xs">
            {getIcon(provider.provider_type)}
            <span className="ml-1">{getTypeLabel(provider.provider_type)}</span>
          </Badge>
          {provider.location_city && (
            <span className="flex items-center gap-1 text-xs">
              <MapPin size={14} /> {provider.location_city}
            </span>
          )}
        </div>

        {/* Tagline/Description */}
        <p className="text-muted-foreground text-sm line-clamp-2 mb-4 h-10">
          {provider.tagline || provider.description}
        </p>

        {/* Stats */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-1">
            <Star size={16} className="text-yellow-400 fill-yellow-400" />
            <span className="font-bold text-foreground">
              {provider.average_rating?.toFixed(1) || '0.0'}
            </span>
            <span className="text-muted-foreground text-xs">
              ({provider.review_count} reviews)
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            {provider.total_jobs_completed} jobs completed
          </div>
        </div>

        {/* Skills Tags */}
        {provider.specialties && provider.specialties.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {provider.specialties.slice(0, 3).map((skill, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {provider.specialties.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{provider.specialties.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
