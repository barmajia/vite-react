import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export interface ServiceRole {
  isProvider: boolean;
  isCustomer: boolean;
  providerId: string | null;
  loading: boolean;
}

/**
 * Hook to determine if the current user is a service provider or customer
 * A user can be both - they're a provider if they have a record in svc_providers
 */
export function useServiceRole() {
  const { user } = useAuth();
  const [isProvider, setIsProvider] = useState(false);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsProvider(false);
      setProviderId(null);
      setLoading(false);
      return;
    }

    const checkProvider = async () => {
      try {
        const { data, error } = await supabase
          .from('svc_providers')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking provider status:', error);
          setIsProvider(false);
          setProviderId(null);
        } else {
          setIsProvider(!!data);
          setProviderId(data?.id || null);
        }
      } catch (err) {
        console.error('Error in useServiceRole:', err);
        setIsProvider(false);
        setProviderId(null);
      } finally {
        setLoading(false);
      }
    };

    checkProvider();
  }, [user]);

  return {
    isProvider,
    isCustomer: !isProvider, // If not a provider, they're a customer
    providerId,
    loading,
  };
}
