import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface ProfileData {
  fullName: string;
  email: string;
  phone: string;
  avatarUrl: string;
}

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState<ProfileData>({
    fullName: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    avatarUrl: user?.user_metadata?.avatar_url || '',
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<ProfileData>) => {
      if (!user) throw new Error('Not authenticated');

      const updates: { full_name?: string; phone?: string; avatar_url?: string } = {};
      
      if (data.fullName !== undefined) updates.full_name = data.fullName;
      if (data.phone !== undefined) updates.phone = data.phone;
      if (data.avatarUrl !== undefined) updates.avatar_url = data.avatarUrl;

      // Update user metadata (name and avatar only - phone requires SMS provider)
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          full_name: updates.full_name,
          avatar_url: updates.avatar_url,
        },
        // Skip phone update - requires SMS provider configuration
        // phone: updates.phone,
      });

      if (metadataError) throw metadataError;

      // Update users table if it exists
      const { error: dbError } = await supabase
        .from('users')
        .update({
          full_name: updates.full_name,
          phone: updates.phone,
          avatar_url: updates.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (dbError && dbError.code !== 'PGRST116') {
        // PGRST116 = row not found, which is ok if table doesn't exist
        console.warn('Could not update users table:', dbError.message);
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      setIsEditing(false);
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async ({ newPassword }: { newPassword: string }) => {
      // Just update the password - user is already authenticated
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      return { success: true };
    },
  });

  const updateFormData = (updates: Partial<ProfileData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const saveProfile = async () => {
    await updateProfileMutation.mutateAsync(formData);
  };

  const changePassword = async (newPassword: string) => {
    await changePasswordMutation.mutateAsync({ newPassword });
  };

  return {
    user,
    formData,
    updateFormData,
    saveProfile,
    isSaving: updateProfileMutation.isPending,
    isEditing,
    setIsEditing,
    changePassword,
    isChangingPassword: changePasswordMutation.isPending,
    error: updateProfileMutation.error || changePasswordMutation.error,
  };
}
