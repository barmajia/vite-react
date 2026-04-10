// ============================================
// ROLE-SPECIFIC SIGNUP HOOKS
// Complete implementation with full type safety
// ============================================

import { supabase } from "@/lib/supabase";
import type { RoleSignupResponse } from "@/types/signup";

// ───────────────────────────────────────────
// SELLER SIGNUP
// ───────────────────────────────────────────

/**
 * Creates a seller account:
 * 1. Supabase Auth user
 * 2. public.users (account_type: ['user', 'seller'])
 * 3. public.sellers (account_type: 'seller', is_factory: false)
 * 4. public.user_wallets
 */
export async function sellerSignup(
  email: string,
  password: string,
  fullName: string,
  phone?: string,
  location?: string,
  currency: string = "USD",
): Promise<RoleSignupResponse> {
  // Step 1: Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      data: Object.fromEntries(
        Object.entries({
          full_name: fullName || "",
          phone: phone || null,
          location: location || null,
          currency: currency || "USD",
          account_type: "seller",
        }).filter(([_, v]) => v !== undefined)
      ),
    },
  });

  if (authError) {
    return { success: false, error: authError.message };
  }

  if (!authData.user) {
    return {
      success: false,
      error: "Auth user not created. Please check email confirmation.",
    };
  }

  // Step 2: Call seller_signup RPC to create public schema records
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    "seller_signup",
    {
      p_email: email,
      p_password: password,
      p_full_name: fullName,
      p_phone: phone || null,
      p_location: location || null,
      p_currency: currency,
    } as any,
  );

  if (rpcError) {
    return { success: false, error: rpcError.message };
  }

  return rpcData as RoleSignupResponse;
}

// ───────────────────────────────────────────
// FACTORY SIGNUP
// ───────────────────────────────────────────

/**
 * Creates a factory account:
 * 1. Supabase Auth user
 * 2. public.users (account_type: ['user', 'factory'])
 * 3. public.sellers (account_type: 'factory', is_factory: true)
 * 4. public.user_wallets
 */
export async function factorySignup(
  email: string,
  password: string,
  companyName: string,
  phone?: string,
  location?: string,
  currency: string = "USD",
  specialization?: string,
  productionCapacity?: number,
): Promise<RoleSignupResponse> {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      data: Object.fromEntries(
        Object.entries({
          full_name: companyName || "",
          phone: phone || null,
          location: location || null,
          currency: currency || "USD",
          account_type: "factory",
          company_name: companyName || "",
          specialization: specialization || null,
          production_capacity: productionCapacity || null,
        }).filter(([_, v]) => v !== undefined)
      ),
    },
  });

  if (authError) {
    return { success: false, error: authError.message };
  }

  if (!authData.user) {
    return { success: false, error: "Auth user not created." };
  }

  const { data: rpcData, error: rpcError } = await supabase.rpc(
    "factory_signup",
    {
      p_email: email,
      p_password: password,
      p_full_name: companyName,
      p_phone: phone || null,
      p_location: location || null,
      p_currency: currency,
      p_company_name: companyName,
      p_specialization: specialization || null,
      p_production_capacity: productionCapacity || null,
    } as any,
  );

  if (rpcError) {
    return { success: false, error: rpcError.message };
  }

  return rpcData as RoleSignupResponse;
}

// ───────────────────────────────────────────
// MIDDLEMAN SIGNUP
// ───────────────────────────────────────────

/**
 * Creates a middleman account:
 * 1. Supabase Auth user
 * 2. public.users (account_type: ['user', 'middleman'])
 * 3. public.sellers (account_type: 'middleman', is_middleman: true)
 * 4. public.middle_men
 * 5. public.user_wallets
 */
export async function middlemanSignup(
  email: string,
  password: string,
  fullName: string,
  phone?: string,
  location?: string,
  currency: string = "USD",
  commissionRate: number = 5,
  specialization?: string,
): Promise<RoleSignupResponse> {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      data: Object.fromEntries(
        Object.entries({
          full_name: fullName || "",
          phone: phone || null,
          location: location || null,
          currency: currency || "USD",
          account_type: "middleman",
        }).filter(([_, v]) => v !== undefined)
      ),
    },
  });

  if (authError) {
    return { success: false, error: authError.message };
  }

  if (!authData.user) {
    return { success: false, error: "Auth user not created." };
  }

  const { data: rpcData, error: rpcError } = await supabase.rpc(
    "middleman_signup",
    {
      p_email: email,
      p_password: password,
      p_full_name: fullName,
      p_phone: phone || null,
      p_location: location || null,
      p_currency: currency,
      p_commission_rate: commissionRate,
      p_specialization: specialization || null,
    } as any,
  );

  if (rpcError) {
    return { success: false, error: rpcError.message };
  }

  return rpcData as RoleSignupResponse;
}
