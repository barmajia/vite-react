import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const TIER_LIMITS: Record<string, number> = {
  tier_75k: 75000,
  tier_150k: 150000,
  tier_250k: 250000,
  tier_500k: 500000,
  tier_1m: 1000000,
  tier_2m: 2000000,
};

export const TIERS = [
  { id: 'tier_75k', label: 'Starter', limit: '75,000 EGP', price: 0 },
  { id: 'tier_150k', label: 'Growth', limit: '150,000 EGP', price: 0 },
  { id: 'tier_250k', label: 'Professional', limit: '250,000 EGP', price: 0 },
  { id: 'tier_500k', label: 'Business', limit: '500,000 EGP', price: 0 },
  { id: 'tier_1m', label: 'Enterprise', limit: '1,000,000 EGP', price: 0 },
  { id: 'tier_2m', label: 'Elite', limit: '2,000,000 EGP', price: 0 },
];

interface SiteCatalogItem {
  id: string;
  user_id: string;
  product_id: string;
  display_price: number;
  products?: {
    title: string;
    price: number;
    image_url: string | null;
  };
}

interface LimitInfo {
  current: number;
  limit: number;
  pct: number;
  tier: string;
}

export const useSiteCatalog = (userId: string, role: string) => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['site-catalog-with-tier', userId],
    queryFn: async () => {
      const [catalogRes, profileRes] = await Promise.all([
        supabase
          .from('site_catalog')
          .select('*, products(title, price, image_url)')
          .eq('user_id', userId),
        role === 'middleman'
          ? supabase.from('middleman_profiles').select('tier').eq('user_id', userId).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);

      if (catalogRes.error) throw catalogRes.error;
      return {
        items: catalogRes.data || [],
        tier: role === 'middleman' ? profileRes.data?.tier || 'tier_75k' : null,
      };
    },
  });

  const items = data?.items || [];
  const tier = data?.tier || 'tier_75k';
  const limit = role === 'middleman' ? TIER_LIMITS[tier] || TIER_LIMITS.tier_75k : 0;
  const currentTotal = items.reduce((sum, i) => sum + Number(i.display_price), 0);
  const pct = limit > 0 ? Math.min(100, (currentTotal / limit) * 100) : 0;

  const add = useMutation({
    mutationFn: async (product: { product_id: string; display_price: number }) => {
      const { error } = await supabase.from('site_catalog').insert({
        user_id: userId,
        ...product,
      });

      if (error?.message?.includes('Catalog limit exceeded')) {
        throw new Error('LIMIT_EXCEEDED');
      }
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-catalog-with-tier', userId] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('site_catalog').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-catalog-with-tier', userId] });
    },
  });

  const limitInfo: LimitInfo | null =
    role === 'middleman'
      ? {
          current: currentTotal,
          limit,
          pct,
          tier,
        }
      : null;

  return {
    items,
    tier,
    isLoading,
    add,
    remove,
    limitInfo,
    currentTotal,
    limit,
    pct,
  };
};