import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';

const TIERS = [
  { id: 'tier_75k', label: 'Starter', limit: '75,000 EGP', color: 'bg-gray-200' },
  { id: 'tier_150k', label: 'Growth', limit: '150,000 EGP', color: 'bg-blue-200' },
  { id: 'tier_250k', label: 'Professional', limit: '250,000 EGP', color: 'bg-purple-200' },
  { id: 'tier_500k', label: 'Business', limit: '500,000 EGP', color: 'bg-orange-200' },
  { id: 'tier_1m', label: 'Enterprise', limit: '1,000,000 EGP', color: 'bg-yellow-200' },
  { id: 'tier_2m', label: 'Elite', limit: '2,000,000 EGP', color: 'bg-green-200' },
];

interface TierManagerProps {
  userId: string;
  currentTier: string;
  onSuccess?: () => void;
}

export function TierManager({ userId, currentTier, onSuccess }: TierManagerProps) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const upgradeTier = useMutation({
    mutationFn: async (newTier: string) => {
      const { error } = await supabase
        .from('middleman_profiles')
        .update({ tier: newTier, updated_at: new Date().toISOString() })
        .eq('user_id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-catalog-with-tier', userId] });
      onSuccess?.();
    },
  });

  const handleUpgrade = async (newTier: string) => {
    setLoading(true);
    try {
      await upgradeTier.mutateAsync(newTier);
    } catch (err) {
      console.error('Tier update failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-3">Upgrade Your Tier</h3>
      <p className="text-sm text-gray-500 mb-4">Select a higher tier to increase your catalog limit.</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {TIERS.map((t) => (
          <button
            key={t.id}
            disabled={loading || t.id === currentTier}
            onClick={() => handleUpgrade(t.id)}
            className={`p-3 rounded-lg border text-left transition ${
              t.id === currentTier
                ? 'ring-2 ring-black bg-gray-50'
                : 'hover:border-gray-400'
            } ${t.color} bg-opacity-30 disabled:opacity-50`}
          >
            <div className="font-bold">{t.label}</div>
            <div className="text-sm opacity-80">{t.limit}</div>
            {t.id === currentTier && (
              <span className="text-xs font-medium mt-1 block">✓ Current</span>
            )}
          </button>
        ))}
      </div>
    </Card>
  );
}