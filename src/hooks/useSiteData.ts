import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface SiteProduct {
  id: string;
  title: string;
  display_price: number;
  image_url?: string;
  description?: string;
  is_available?: boolean;
  quantity?: number;
}

interface SiteSettings {
  id: string;
  user_id: string;
  template_id: string;
  site_slug: string;
  status: 'draft' | 'active';
  settings: Record<string, any>;
}

interface SiteData {
  settings: SiteSettings;
  catalog: SiteProduct[];
}

export const useSiteData = (slug: string): {
  settings: SiteSettings | null;
  catalog: SiteProduct[];
  isLoading: boolean;
  error: Error | null;
} => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<SiteData, Error>({
    queryKey: ['site-data', slug],
    queryFn: async () => {
      if (!slug) throw new Error('No slug provided');

      const { data: settings, error: sErr } = await supabase
        .from('website_settings')
        .select('*')
        .eq('site_slug', slug)
        .eq('status', 'active')
        .maybeSingle();

      if (sErr) throw sErr;
      if (!settings) throw new Error('Site not found');

      const { data: catalog, error: cErr } = await supabase
        .from('site_catalog')
        .select('display_price, products(id, title, image_url, description, quantity, is_deleted)')
        .eq('user_id', settings.user_id)
        .eq('is_active', true);

      if (cErr) throw cErr;

      const formattedProducts: SiteProduct[] = (catalog || []).map((c: any) => ({
        id: c.products?.id,
        title: c.products?.title || 'Product',
        display_price: c.display_price,
        image_url: c.products?.image_url,
        description: c.products?.description,
        quantity: c.products?.quantity ?? 0,
        is_available: c.products?.is_deleted !== true && (c.products?.quantity ?? 0) > 0,
      }));

      return { settings, catalog: formattedProducts };
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
    enabled: !!slug,
  });

  // Real-time stock updates
  useEffect(() => {
    if (!data?.settings?.user_id) return;

    const channel = supabase
      .channel('stock-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
          filter: `seller_id=eq.${data.settings.user_id}`,
        },
        (payload) => {
          queryClient.setQueryData(['site-data', slug], (old: SiteData | undefined) => {
            if (!old) return old;
            
            const updatedCatalog = old.catalog.map((product) => {
              if (product.id === payload.new.id) {
                return {
                  ...product,
                  quantity: payload.new.quantity ?? 0,
                  is_available: payload.new.is_deleted !== true && (payload.new.quantity ?? 0) > 0,
                };
              }
              return product;
            });
            
            return { ...old, catalog: updatedCatalog };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [data?.settings?.user_id, slug, queryClient]);

  return {
    settings: data?.settings || null,
    catalog: data?.catalog || [],
    isLoading,
    error: error || null,
  };
};