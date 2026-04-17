import { Card } from '@/components/ui/card';

interface Settings {
  template_id: string | null;
  site_slug: string | null;
  settings: Record<string, any>;
  status: string;
}

interface CatalogItem {
  id: string;
  product_id: string;
  display_price: number;
  products?: {
    title: string;
    price: number;
    image_url: string | null;
  };
}

interface SitePreviewProps {
  settings: Settings | null | undefined;
  catalog: CatalogItem[];
}

export function SitePreview({ settings, catalog }: SitePreviewProps) {
  const siteName = settings?.settings?.site_name || 'My Store';
  const siteDescription = settings?.settings?.site_description || '';
  const primaryColor = settings?.settings?.primary_color || '#000000';
  const template = settings?.template_id || 'minimal';

  const renderPreview = () => {
    if (catalog.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          Add products to see preview
        </div>
      );
    }

    switch (template) {
      case 'grid':
        return (
          <div className="grid grid-cols-3 gap-4">
            {catalog.slice(0, 6).map((item) => (
              <div key={item.id} className="border rounded-lg overflow-hidden">
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  {item.products?.image_url ? (
                    <img src={item.products.image_url} alt={item.products.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl">📦</span>
                  )}
                </div>
                <div className="p-2">
                  <p className="font-medium text-sm truncate">{item.products?.title || 'Product'}</p>
                  <p className="font-bold" style={{ color: primaryColor }}>{Number(item.display_price).toLocaleString()} EGP</p>
                </div>
              </div>
            ))}
          </div>
        );
      case 'showcase':
        return (
          <div className="space-y-4">
            {catalog.slice(0, 4).map((item) => (
              <div key={item.id} className="flex gap-4 border rounded-lg overflow-hidden">
                <div className="w-32 h-32 bg-gray-100 flex items-center justify-center">
                  {item.products?.image_url ? (
                    <img src={item.products.image_url} alt={item.products.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl">📦</span>
                  )}
                </div>
                <div className="flex-1 p-4">
                  <p className="font-medium">{item.products?.title || 'Product'}</p>
                  <p className="text-sm text-gray-500">{siteDescription}</p>
                  <p className="font-bold mt-2" style={{ color: primaryColor }}>{Number(item.display_price).toLocaleString()} EGP</p>
                </div>
              </div>
            ))}
          </div>
        );
      default:
        return (
          <div className="grid grid-cols-2 gap-4">
            {catalog.slice(0, 4).map((item) => (
              <div key={item.id} className="border rounded-lg p-4 text-center">
                <div className="aspect-square bg-gray-100 rounded mb-2 flex items-center justify-center">
                  {item.products?.image_url ? (
                    <img src={item.products.image_url} alt={item.products.title} className="w-full h-full object-cover rounded" />
                  ) : (
                    <span className="text-3xl">📦</span>
                  )}
                </div>
                <p className="font-medium text-sm">{item.products?.title || 'Product'}</p>
                <p className="font-bold" style={{ color: primaryColor }}>{Number(item.display_price).toLocaleString()} EGP</p>
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Site Preview</h3>
      <Card className="p-4 bg-gray-50">
        <div className="border-b pb-4 mb-4">
          <h2 className="text-xl font-bold" style={{ color: primaryColor }}>{siteName}</h2>
          {siteDescription && <p className="text-sm text-gray-500">{siteDescription}</p>}
          {settings?.site_slug && (
            <p className="text-xs text-gray-400">{settings.site_slug}.yourdomain.com</p>
          )}
        </div>
        <div className="min-h-[300px]">
          {renderPreview()}
        </div>
        {catalog.length > 0 && (
          <div className="text-center text-sm text-gray-500 mt-4">
            +{catalog.length - 4} more products
          </div>
        )}
      </Card>
    </div>
  );
}