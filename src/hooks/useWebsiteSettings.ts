import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface WebsiteSettings {
  id?: string;
  user_id: string;
  template_id: string | null;
  site_slug: string | null;
  status: 'draft' | 'active';
  settings: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export const useWebsiteSettings = (userId: string) => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['website-settings', userId],
    queryFn: async (): Promise<WebsiteSettings | null> => {
      const { data: settings, error } = await supabase
        .from('website_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      return settings;
    },
  });

  const upsert = useMutation({
    mutationFn: async (payload: Partial<WebsiteSettings>): Promise<WebsiteSettings> => {
      const { data, error } = await supabase
        .from('website_settings')
        .upsert({ 
          user_id: userId, 
          ...payload 
        }, { onConflict: 'user_id' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website-settings', userId] });
    },
  });

  return { data, isLoading, upsert };
};