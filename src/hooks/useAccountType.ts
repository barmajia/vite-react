/**
 * useAccountType Hook
 * Provides consistent, type-safe account type checking across the app.
 * Always uses the database-sourced profile data (not stale JWT metadata).
 */

import { useAuth } from "@/hooks/useAuth";

export interface AccountTypeInfo {
  /** Raw account types from database (e.g., ['user', 'seller']) */
  rawTypes: string[];
  /** Primary role (first non-'user' type) */
  primary: string | null;
  /** Convenience booleans */
  isCustomer: boolean;
  isSeller: boolean;
  isFactory: boolean;
  isMiddleman: boolean;
  isDelivery: boolean;
  isAdmin: boolean;
  /** Check if user has ANY of the specified types */
  hasAny: (...types: string[]) => boolean;
  /** Check if user has ALL of the specified types */
  hasAll: (...types: string[]) => boolean;
}

export function useAccountType(): AccountTypeInfo {
  const { profile, user } = useAuth();

  // Always prefer DB-sourced profile over JWT metadata
  const rawAccountType = profile?.account_type || user?.user_metadata?.account_type;

  // Normalize to array
  const rawTypes = Array.isArray(rawAccountType)
    ? rawAccountType
    : rawAccountType
      ? [rawAccountType]
      : [];

  // Primary role is the first non-'user' type
  const primary = rawTypes.find((t) => t !== "user") || rawTypes[0] || null;

  // Convenience booleans
  const hasType = (type: string) => rawTypes.includes(type);

  return {
    rawTypes,
    primary,
    isCustomer: hasType("customer"),
    isSeller: hasType("seller"),
    isFactory: hasType("factory"),
    isMiddleman: hasType("middleman"),
    isDelivery: hasType("delivery") || hasType("delivery_driver"),
    isAdmin: hasType("admin"),
    hasAny: (...types: string[]) => types.some((t) => hasType(t)),
    hasAll: (...types: string[]) => types.every((t) => hasType(t)),
  };
}
