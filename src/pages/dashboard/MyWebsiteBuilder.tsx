import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWebsiteSettings } from '@/hooks/useWebsiteSettings';
import { useSiteCatalog } from '@/hooks/useSiteCatalog';
import { TemplateSelector } from '@/components/website/TemplateSelector';
import { SettingsForm } from '@/components/website/SettingsForm';
import { CatalogManager } from '@/components/website/CatalogManager';
import { LimitProgressBar } from '@/components/website/LimitProgressBar';
import { SitePreview } from '@/components/website/SitePreview';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';

export default function MyWebsiteBuilder() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('setup');
  const [error, setError] = useState<string | null>(null);

  const userId = user?.id || '';
  const accountType = profile?.account_type || 'seller';

  const { data: settings, isLoading: loadSettings, upsert } = useWebsiteSettings(userId);
  const { items: catalog, isLoading: loadCatalog, add, remove, limitInfo } = useSiteCatalog(userId, accountType);

  if (!userId) return <div className="p-6">Auth required</div>;
  if (loadSettings || loadCatalog) return <div className="p-6">Loading...</div>;

  const handleAddProduct = async (product: { id: string; price: number }) => {
    setError(null);
    try {
      await add.mutateAsync({ product_id: product.id, display_price: product.price });
    } catch (err: any) {
      if (err.message === 'LIMIT_EXCEEDED') {
        setError('⚠️ Middleman catalog limit reached (75,000 EGP). Remove items to add more.');
      }
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Your Storefront Builder</h1>
        {settings?.status === 'active' && settings?.site_slug && (
          <a 
            href={`https://${settings.site_slug}.yourdomain.com`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            View Live Site ↗
          </a>
        )}
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200 text-red-700">
          {error}
        </Card>
      )}

      {limitInfo && (
        <Card className="p-4 bg-amber-50 border-amber-200">
          <h3 className="font-medium text-amber-800 mb-2">Catalog Value Tracker</h3>
          <LimitProgressBar current={limitInfo.current} limit={limitInfo.limit} pct={limitInfo.pct} />
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="setup">1. Template & Settings</TabsTrigger>
          <TabsTrigger value="catalog">2. Product Catalog</TabsTrigger>
          <TabsTrigger value="preview">3. Preview & Publish</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="grid md:grid-cols-2 gap-6 mt-4">
          <TemplateSelector 
            selected={settings?.template_id || ''} 
            onSelect={(id) => upsert.mutate({ template_id: id, status: 'draft' })} 
          />
          <SettingsForm 
            initial={settings?.settings || {}} 
            onSave={(s) => upsert.mutate({ settings: s })} 
          />
        </TabsContent>

        <TabsContent value="catalog" className="mt-4">
          <CatalogManager 
            catalog={catalog} 
            onAdd={handleAddProduct} 
            onRemove={(id) => remove.mutate(id)} 
            role={accountType}
          />
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <SitePreview settings={settings} catalog={catalog} />
          <div className="flex justify-end mt-4">
            <Button 
              onClick={() => upsert.mutate({ status: 'active' })}
              disabled={!settings?.template_id || catalog.length === 0 || upsert.isPending}
            >
              {upsert.isPending ? 'Publishing...' : 'Publish Website'}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}