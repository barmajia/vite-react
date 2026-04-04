import { useState, useEffect, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

// ─────────────────────────────────────────────────────────────
// TypeScript Interfaces aligned with Supabase schema
// ─────────────────────────────────────────────────────────────

export type AccountType =
  | "user"
  | "customer"
  | "seller"
  | "factory"
  | "middleman"
  | "delivery"
  | "freelancer"
  | "doctor"
  | "pharmacy"
  | "admin"
  | "support";

export interface UserProfile {
  id: string; // users.id (PK)
  user_id: string; // FK to auth.users.id
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  account_type: AccountType;
  preferred_language: string; // default 'eg'
  preferred_currency: string; // default 'EGP'
  theme_preference: "light" | "dark" | "system";
  sidebar_state: { collapsed: boolean }; // JSONB
  created_at: string;
  updated_at: string;
}

export interface SellerProfile {
  user_id: string;
  email: string;
  full_name: string;
  firstname: string | null;
  second_name: string | null;
  thirdname: string | null;
  fourth_name: string | null;
  phone: string | null;
  location: string | null;
  currency: string;
  account_type: AccountType;
  is_verified: boolean;
  latitude: number | null;
  longitude: number | null;
  is_factory: boolean;
  factory_license_url: string | null;
  min_order_quantity: number;
  wholesale_discount: number;
  accepts_returns: boolean;
  production_capacity: string | null;
  verified_at: string | null;
  allow_product_chats: boolean;
  allow_custom_requests: boolean;
  avatar_url: string | null;
  bio: string | null;
  response_rate: number;
  created_at: string;
  updated_at: string;
}

export interface ProfileFormData {
  // Core user fields
  full_name: string;
  phone: string;
  avatar_url: string;

  // Preferences
  preferred_language: string;
  preferred_currency: string;
  theme_preference: "light" | "dark" | "system";
  sidebar_collapsed: boolean;

  // Seller-specific fields (optional, only if account_type is seller/factory)
  store_name?: string;
  location?: string;
  bio?: string;
  allow_product_chats?: boolean;
  allow_custom_requests?: boolean;
}

// ─────────────────────────────────────────────────────────────
// Main Hook
// ─────────────────────────────────────────────────────────────

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [accountType, setAccountType] = useState<AccountType>("user");

  // Initialize form data with defaults matching schema
  const [formData, setFormData] = useState<ProfileFormData>({
    full_name: user?.user_metadata?.full_name || "",
    phone: user?.phone || "",
    avatar_url: user?.user_metadata?.avatar_url || "",
    preferred_language: "eg",
    preferred_currency: "EGP",
    theme_preference: "light",
    sidebar_collapsed: false,
    // Seller fields initialized empty - populated after fetch
  });

  // Fetch user profile + preferences on mount
  useEffect(() => {
    if (user?.id) {
      fetchUserProfile(user.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      // Fetch from users table (RLS: users can view own profile)
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select(
          `
          id,
          user_id,
          email,
          full_name,
          phone,
          avatar_url,
          account_type,
          preferred_language,
          preferred_currency,
          theme_preference,
          sidebar_state,
          created_at,
          updated_at
        `,
        )
        .eq("user_id", userId)
        .maybeSingle();

      if (profileError && profileError.code !== "PGRST116") {
        console.warn("Could not fetch profile:", profileError.message);
        return;
      }

      if (profile) {
        setAccountType(profile.account_type as AccountType);
        setFormData((prev) => ({
          ...prev,
          full_name: profile.full_name || prev.full_name,
          phone: profile.phone || prev.phone,
          avatar_url: profile.avatar_url || prev.avatar_url,
          preferred_language: profile.preferred_language || "eg",
          preferred_currency: profile.preferred_currency || "EGP",
          theme_preference:
            (profile.theme_preference as "light" | "dark" | "system") ||
            "light",
          sidebar_collapsed: profile.sidebar_state?.collapsed ?? false,
        }));

        // If seller/factory, fetch seller profile too
        if (
          profile.account_type === "seller" ||
          profile.account_type === "factory"
        ) {
          fetchSellerProfile(userId);
        }
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  }, []);

  const fetchSellerProfile = useCallback(async (userId: string) => {
    try {
      const { data: seller, error } = await supabase
        .from("sellers")
        .select(
          `
          user_id,
          location,
          bio,
          allow_product_chats,
          allow_custom_requests,
          store_name,
          is_verified,
          latitude,
          longitude
        `,
        )
        .eq("user_id", userId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.warn("Could not fetch seller profile:", error.message);
        return;
      }

      if (seller) {
        setFormData((prev) => ({
          ...prev,
          location: seller.location || prev.location,
          bio: seller.bio || prev.bio,
          allow_product_chats: seller.allow_product_chats,
          allow_custom_requests: seller.allow_custom_requests,
          store_name: seller.store_name || prev.store_name,
        }));
      }
    } catch (err) {
      console.error("Error fetching seller profile:", err);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────
  // Update Profile Mutation
  // ─────────────────────────────────────────────────────────────
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<ProfileFormData>) => {
      if (!user) throw new Error("Not authenticated");

      const updates: Record<string, any> = {};

      // Map form fields to database columns
      if (data.full_name !== undefined) updates.full_name = data.full_name;
      if (data.phone !== undefined) updates.phone = data.phone;
      if (data.avatar_url !== undefined) updates.avatar_url = data.avatar_url;
      if (data.preferred_language !== undefined)
        updates.preferred_language = data.preferred_language;
      if (data.preferred_currency !== undefined)
        updates.preferred_currency = data.preferred_currency;
      if (data.theme_preference !== undefined)
        updates.theme_preference = data.theme_preference;
      if (data.sidebar_collapsed !== undefined) {
        updates.sidebar_state = { collapsed: data.sidebar_collapsed };
      }
      updates.updated_at = new Date().toISOString();

      // 1. Update auth.users metadata (name, avatar, phone*)
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: updates.full_name,
          avatar_url: updates.avatar_url,
          // phone requires SMS provider - skip for now
        },
      });
      if (authError) throw authError;

      // 2. Update users table (RLS: users can update own profile)
      const { error: dbError } = await supabase
        .from("users")
        .update(updates)
        .eq("user_id", user.id);

      // PGRST116 = row not found (table might not exist yet)
      if (dbError && dbError.code !== "PGRST116") {
        throw new Error(`Failed to update profile: ${dbError.message}`);
      }

      // 3. If seller/factory, update seller table too
      if (
        (accountType === "seller" || accountType === "factory") &&
        (data.store_name || data.location || data.bio !== undefined)
      ) {
        const sellerUpdates: Record<string, any> = {};
        if (data.store_name !== undefined)
          sellerUpdates.store_name = data.store_name;
        if (data.location !== undefined) sellerUpdates.location = data.location;
        if (data.bio !== undefined) sellerUpdates.bio = data.bio;
        if (data.allow_product_chats !== undefined)
          sellerUpdates.allow_product_chats = data.allow_product_chats;
        if (data.allow_custom_requests !== undefined)
          sellerUpdates.allow_custom_requests = data.allow_custom_requests;
        sellerUpdates.updated_at = new Date().toISOString();

        const { error: sellerError } = await supabase
          .from("sellers")
          .update(sellerUpdates)
          .eq("user_id", user.id);

        if (sellerError && sellerError.code !== "PGRST116") {
          console.warn("Could not update seller profile:", sellerError.message);
          // Don't throw - core profile update succeeded
        }
      }

      return { success: true };
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      if (accountType === "seller" || accountType === "factory") {
        queryClient.invalidateQueries({ queryKey: ["seller", user?.id] });
      }
      setIsEditing(false);
    },
    onError: (error: Error) => {
      console.error("Profile update failed:", error);
      // Could add toast notification here
    },
  });

  // ─────────────────────────────────────────────────────────────
  // Change Password Mutation
  // ─────────────────────────────────────────────────────────────
  const changePasswordMutation = useMutation({
    mutationFn: async ({
      currentPassword,
      newPassword,
    }: {
      currentPassword?: string;
      newPassword: string;
    }) => {
      // Supabase Auth handles password updates directly
      // Note: currentPassword is NOT required by Supabase Auth API
      // If you need to verify current password, implement via Edge Function

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        // Common error codes:
        // weak_password: Password too weak
        // same_password: New password same as old
        if (error.message?.includes("weak")) {
          throw new Error("Password must be at least 6 characters");
        }
        throw error;
      }

      return { success: true };
    },
    onSuccess: () => {
      // Optional: force re-authentication or show success message
    },
  });

  // ─────────────────────────────────────────────────────────────
  // Helper Functions
  // ─────────────────────────────────────────────────────────────

  const updateFormData = useCallback((updates: Partial<ProfileFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  const saveProfile = useCallback(async () => {
    await updateProfileMutation.mutateAsync(formData);
  }, [formData, updateProfileMutation]);

  const changePassword = useCallback(
    async (newPassword: string, currentPassword?: string) => {
      await changePasswordMutation.mutateAsync({
        newPassword,
        currentPassword,
      });
    },
    [changePasswordMutation],
  );

  const resetForm = useCallback(() => {
    // Re-fetch from server to reset to saved values
    if (user?.id) {
      fetchUserProfile(user.id);
    }
  }, [user?.id, fetchUserProfile]);

  const refreshProfile = useCallback(() => {
    if (user?.id) {
      fetchUserProfile(user.id);
    }
  }, [user?.id, fetchUserProfile]);

  // ─────────────────────────────────────────────────────────────
  // Return Hook API
  // ─────────────────────────────────────────────────────────────

  return {
    // State
    user,
    formData,
    accountType,
    isEditing,

    // Actions
    updateFormData,
    saveProfile,
    setIsEditing,
    changePassword,
    resetForm,
    refreshProfile,

    // Loading states
    isSaving: updateProfileMutation.isPending,
    isChangingPassword: changePasswordMutation.isPending,
    isLoading: !user, // Initial load

    // Errors
    error: updateProfileMutation.error || changePasswordMutation.error,

    // Mutation objects for advanced use
    updateMutation: updateProfileMutation,
    passwordMutation: changePasswordMutation,
  };
}
