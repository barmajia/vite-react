import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TradingAccountType } from '../types/trading-chat';

export const useUserAccountType = (userId: string | null) => {
  const [accountType, setAccountType] = useState<TradingAccountType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccountType = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('account_type')
          .eq('user_id', userId)
          .single();

        if (error) throw error;

        setAccountType(data?.account_type as TradingAccountType || 'user');
      } catch (err: any) {
        setError(err.message);
        setAccountType('user'); // Default to user
      } finally {
        setLoading(false);
      }
    };

    fetchAccountType();
  }, [userId]);

  return { accountType, loading, error };
};
