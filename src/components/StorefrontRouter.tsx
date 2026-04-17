import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSiteData } from '@/hooks/useSiteData';
import { TemplateRenderer } from '@/templates';
import { CartProvider } from '@/context/CartProvider';
import { Loader2 } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const PUBLIC_STORE_ROUTES = ['/store', '/s'];

const isPublicStorePath = (pathname: string): boolean => {
  return PUBLIC_STORE_ROUTES.some(route => pathname.startsWith(route));
};

const extractSlugFromPath = (pathname: string): string | null => {
  for (const route of PUBLIC_STORE_ROUTES) {
    if (pathname.startsWith(route)) {
      const parts = pathname.split('/').filter(Boolean);
      const routeIndex = parts.indexOf(route.replace('/', ''));
      if (routeIndex !== -1 && parts[routeIndex + 1]) {
        return parts[routeIndex + 1];
      }
    }
  }
  return null;
};

const extractSlugFromSubdomain = (hostname: string): string | null => {
  const excluded = ['localhost', 'vercel.app', 'vercel.dev', 'webcontainer.io'];
  if (excluded.some(e => hostname.includes(e))) return null;
  
  if (hostname.includes('.')) {
    return hostname.split('.')[0];
  }
  return null;
};

export const StorefrontRouter = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [slug, setSlug] = useState<string | null>(null);

  useEffect(() => {
    const hostname = window.location.hostname;
    const pathname = location.pathname;
    
    let extractedSlug: string | null = null;
    
    if (hostname !== 'localhost' && !hostname.includes('vercel')) {
      extractedSlug = extractSlugFromSubdomain(hostname);
    }
    
    if (!extractedSlug) {
      extractedSlug = extractSlugFromPath(pathname);
    }
    
    if (extractedSlug) {
      setSlug(extractedSlug);
    } else {
      navigate('/');
    }
  }, [location.pathname, navigate]);

  const { settings, catalog, isLoading, error } = useSiteData(slug || '');

  // SEO Meta Injection
  useEffect(() => {
    if (settings) {
      const siteName = settings.settings?.site_name || settings.site_slug || 'Store';
      document.title = `${siteName} | Shop`;
      
      // Meta description
      let metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement;
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', settings.settings?.site_description || `Shop at ${siteName}`);
      
      // Open Graph
      let ogTitle = document.querySelector('meta[property="og:title"]') as HTMLMetaElement;
      if (!ogTitle) {
        ogTitle = document.createElement('meta');
        ogTitle.setAttribute('property', 'og:title');
        document.head.appendChild(ogTitle);
      }
      ogTitle.setAttribute('content', siteName);
      
      let ogDesc = document.querySelector('meta[property="og:description"]') as HTMLMetaElement;
      if (!ogDesc) {
        ogDesc = document.createElement('meta');
        ogDesc.setAttribute('property', 'og:description');
        document.head.appendChild(ogDesc);
      }
      ogDesc.setAttribute('content', settings.settings?.site_description || `Visit ${siteName}`);
    }
    
    return () => {
      document.title = 'Aurora';
    };
  }, [settings]);

  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Loading store...</p>
        </div>
      </div>
    );
  }

  if (error || !settings || settings.status !== 'active') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-6">
          <h1 className="text-2xl font-bold mb-2">Store Not Found</h1>
          <p className="text-gray-500">This storefront doesn't exist or is unpublished.</p>
        </div>
      </div>
    );
  }

  return (
    <CartProvider>
      <ErrorBoundary
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center p-6">
              <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
              <p className="text-gray-500">Please try refreshing the page.</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-black text-white rounded"
              >
                Refresh
              </button>
            </div>
          </div>
        }
      >
        <TemplateRenderer
          siteName={settings.settings?.site_name || settings.site_slug}
          products={catalog}
          settings={settings.settings}
        />
      </ErrorBoundary>
    </CartProvider>
  );
};