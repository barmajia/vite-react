import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function useSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ["settings", "profile", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch role-specific data
  const { data: roleData } = useQuery({
    queryKey: ["settings", "role", profile?.account_type],
    queryFn: async () => {
      if (!profile) return null;

      switch (profile.account_type) {
        case "seller":
        case "factory":
          const { data: seller } = await supabase
            .from("sellers")
            .select("*")
            .eq("user_id", profile.user_id)
            .maybeSingle();
          return seller;

        case "middleman":
          const { data: middleman } = await supabase
            .from("middleman_profiles")
            .select("*")
            .eq("user_id", profile.user_id)
            .maybeSingle();
          return middleman;

        case "delivery":
          const { data: delivery } = await supabase
            .from("delivery_profiles")
            .select("*")
            .eq("user_id", profile.user_id)
            .maybeSingle();
          return delivery;

        default:
          return null;
      }
    },
    enabled: !!profile,
  });

  // Fetch addresses
  const { data: addresses } = useQuery({
    queryKey: ["settings", "addresses", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("shipping_addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: {
      full_name: string;
      phone: string;
      avatar_url: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("users")
        .update({
          full_name: data.full_name,
          phone: data.phone,
          avatar_url: data.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "profile"] });
      toast.success("Profile updated successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to update profile: ${error.message}`);
    },
  });

  // Update seller settings mutation
  const updateSellerMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("sellers")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "role"] });
      toast.success("Business settings updated");
    },
    onError: (error: any) => {
      toast.error(`Failed to update settings: ${error.message}`);
    },
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async ({ newPassword }: { newPassword: string }) => {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Password updated successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to update password: ${error.message}`);
    },
  });

  // Update email mutation
  const updateEmailMutation = useMutation({
    mutationFn: async (newEmail: string) => {
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Confirmation email sent. Please check your inbox.");
    },
    onError: (error: any) => {
      toast.error(`Failed to update email: ${error.message}`);
    },
  });

  // Delete account mutation (placeholder - requires Edge Function)
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      // Note: Supabase doesn't allow direct user deletion from client
      // Create a support ticket or use Edge Function
      toast.error("Please contact support to delete your account");
      throw new Error("Account deletion requires support assistance");
    },
  });

  // Sign out
  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    window.location.reload();
  };

  return {
    profile,
    roleData,
    addresses,
    isLoading,
    updateProfile: updateProfileMutation.mutateAsync,
    updateSeller: updateSellerMutation.mutateAsync,
    updatePassword: updatePasswordMutation.mutateAsync,
    updateEmail: updateEmailMutation.mutateAsync,
    deleteAccount: deleteAccountMutation.mutateAsync,
    signOut,
    isUpdatingProfile: updateProfileMutation.isPending,
    isUpdatingPassword: updatePasswordMutation.isPending,
  };
}
