import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ChatUser } from '../types/chat';

export const useCurrentUser = () => {
  const [user, setUser] = useState<ChatUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser) {
          setUser(null);
          setLoading(false);
          return;
        }

        const { data, error: err } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', authUser.id)
          .single();

        if (err) throw err;

        setUser({
          id: data.id,
          user_id: data.user_id,
          email: data.email,
          full_name: data.full_name,
          phone: data.phone,
          avatar_url: data.avatar_url,
          account_type: data.account_type,
          is_online: true,
          is_verified: false,
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, loading, error };
};
