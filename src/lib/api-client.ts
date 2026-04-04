/**
 * Centralized API Client with TanStack Query Integration
 * 
 * Provides a unified interface for all API calls with:
 * - Automatic retry logic
 * - Request/response interceptors
 * - Error handling standardization
 * - Caching strategy
 * - Rate limiting
 */

import { QueryClient, QueryFunction, MutationFunction } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { checkRateLimit } from "@/lib/chat-security";

// ───────────────────────────────────────────────────────────────
// Configuration
// ───────────────────────────────────────────────────────────────

const API_CONFIG = {
  DEFAULT_RETRIES: 3,
  DEFAULT_RETRY_DELAY: 1000, // ms
  DEFAULT_TIMEOUT: 30000, // ms
  DEFAULT_STALE_TIME: 5 * 60 * 1000, // 5 minutes
  DEFAULT_CACHE_TIME: 10 * 60 * 1000, // 10 minutes
  RATE_LIMIT_REQUESTS: 10,
  RATE_LIMIT_WINDOW: 60000, // 1 minute
};

// ───────────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────────

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  status?: number;
}

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  status: number;
}

// ───────────────────────────────────────────────────────────────
// Error Handling
// ───────────────────────────────────────────────────────────────

const formatError = (error: any, context?: string): ApiError => {
  console.error(`API Error${context ? ` in ${context}` : ""}:`, error);

  // Supabase error format
  if (error?.message) {
    return {
      code: error.code || "UNKNOWN_ERROR",
      message: sanitizeErrorMessage(error.message),
      details: error.details,
      status: error.status,
    };
  }

  // Network error
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return {
      code: "NETWORK_ERROR",
      message: "Unable to connect to server. Please check your internet connection.",
      status: 0,
    };
  }

  // Generic error
  return {
    code: "UNKNOWN_ERROR",
    message: "An unexpected error occurred. Please try again.",
  };
};

const sanitizeErrorMessage = (message: string): string => {
  // Remove sensitive information from error messages
  const sensitivePatterns = [
    /password/i,
    /token/i,
    /secret/i,
    /key/i,
    /credential/i,
  ];

  let sanitized = message;

  // Don't expose internal details in production
  if (import.meta.env.PROD) {
    // Check for sensitive patterns
    for (const pattern of sensitivePatterns) {
      if (pattern.test(sanitized)) {
        return "An authentication error occurred. Please log in again.";
      }
    }

    // Limit error message length
    if (sanitized.length > 200) {
      return "An error occurred. Please try again.";
    }
  }

  return sanitized;
};

// ───────────────────────────────────────────────────────────────
// Request Wrapper
// ───────────────────────────────────────────────────────────────

interface RequestOptions {
  rateLimitKey?: string;
  timeout?: number;
  retries?: number;
  shouldRetry?: (error: any) => boolean;
}

const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]);
};

export const apiRequest = async <T,>({
  requestFn,
  options = {},
  context = "apiRequest",
}: {
  requestFn: () => Promise<T>;
  options?: RequestOptions;
  context?: string;
}): Promise<ApiResponse<T>> => {
  const {
    rateLimitKey,
    timeout = API_CONFIG.DEFAULT_TIMEOUT,
    retries = API_CONFIG.DEFAULT_RETRIES,
    shouldRetry,
  } = options;

  // Check rate limit
  if (rateLimitKey && !checkRateLimit(rateLimitKey, API_CONFIG.RATE_LIMIT_REQUESTS, API_CONFIG.RATE_LIMIT_WINDOW)) {
    return {
      data: null,
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests. Please wait a moment and try again.",
        status: 429,
      },
      status: 429,
    };
  }

  let lastError: any;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await withTimeout(requestFn(), timeout);
      return {
        data: result as T,
        error: null,
        status: 200,
      };
    } catch (error) {
      lastError = error;

      // Check if we should retry
      const canRetry = attempt < retries && (!shouldRetry || shouldRetry(error));

      if (!canRetry) {
        break;
      }

      // Exponential backoff
      const delay = API_CONFIG.DEFAULT_RETRY_DELAY * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return {
    data: null,
    error: formatError(lastError, context),
    status: lastError?.status || 500,
  };
};

// ───────────────────────────────────────────────────────────────
// Supabase-Specific Helpers
// ───────────────────────────────────────────────────────────────

export const supabaseQuery = async <T,>({
  queryFn,
  context = "supabaseQuery",
  options,
}: {
  queryFn: () => Promise<{ data: T | null; error: any }>;
  context?: string;
  options?: RequestOptions;
}): Promise<ApiResponse<T>> => {
  return apiRequest({
    requestFn: async () => {
      const { data, error } = await queryFn();

      if (error) {
        throw error;
      }

      if (data === null) {
        throw new Error("No data returned");
      }

      return data;
    },
    options,
    context,
  });
};

export const supabaseMutation = async <T,>({
  mutationFn,
  context = "supabaseMutation",
  options,
}: {
  mutationFn: () => Promise<{ data: T | null; error: any }>;
  context?: string;
  options?: RequestOptions;
}): Promise<ApiResponse<T>> => {
  return supabaseQuery({ queryFn: mutationFn, context, options });
};

// ───────────────────────────────────────────────────────────────
// Query Client Configuration
// ───────────────────────────────────────────────────────────────

export const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: API_CONFIG.DEFAULT_STALE_TIME,
        cacheTime: API_CONFIG.DEFAULT_CACHE_TIME,
        retry: API_CONFIG.DEFAULT_RETRIES,
        retryDelay: (attemptIndex) =>
          Math.min(API_CONFIG.DEFAULT_RETRY_DELAY * Math.pow(2, attemptIndex), 30000),
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        throwOnError: false,
      },
      mutations: {
        retry: 1,
        retryDelay: API_CONFIG.DEFAULT_RETRY_DELAY,
      },
    },
  });
};

export const queryClient = createQueryClient();

// ───────────────────────────────────────────────────────────────
// Query Key Factory
// ───────────────────────────────────────────────────────────────

export const queryKeys = {
  // Auth
  auth: {
    all: ["auth"] as const,
    user: () => [...queryKeys.auth.all, "user"] as const,
    session: () => [...queryKeys.auth.all, "session"] as const,
  },

  // Products
  products: {
    all: ["products"] as const,
    list: (filters?: any) => [...queryKeys.products.all, "list", filters] as const,
    detail: (asin: string) => [...queryKeys.products.all, "detail", asin] as const,
    categories: () => [...queryKeys.products.all, "categories"] as const,
  },

  // Orders
  orders: {
    all: ["orders"] as const,
    list: (filters?: any) => [...queryKeys.orders.all, "list", filters] as const,
    detail: (id: string) => [...queryKeys.orders.all, "detail", id] as const,
  },

  // Cart
  cart: {
    all: ["cart"] as const,
    current: () => [...queryKeys.cart.all, "current"] as const,
  },

  // Services
  services: {
    all: ["services"] as const,
    list: (filters?: any) => [...queryKeys.services.all, "list", filters] as const,
    detail: (id: string) => [...queryKeys.services.all, "detail", id] as const,
    bookings: (filters?: any) => [...queryKeys.services.all, "bookings", filters] as const,
  },

  // Chat
  chat: {
    all: ["chat"] as const,
    conversations: () => [...queryKeys.chat.all, "conversations"] as const,
    messages: (conversationId: string) => [...queryKeys.chat.all, "messages", conversationId] as const,
    participants: (conversationId: string) => [...queryKeys.chat.all, "participants", conversationId] as const,
  },

  // Profile
  profile: {
    all: ["profile"] as const,
    current: () => [...queryKeys.profile.all, "current"] as const,
    public: (userId: string) => [...queryKeys.profile.all, "public", userId] as const,
  },

  // Wallet
  wallet: {
    all: ["wallet"] as const,
    balance: () => [...queryKeys.wallet.all, "balance"] as const,
    transactions: (filters?: any) => [...queryKeys.wallet.all, "transactions", filters] as const,
  },

  // Admin
  admin: {
    all: ["admin"] as const,
    users: (filters?: any) => [...queryKeys.admin.all, "users", filters] as const,
    products: (filters?: any) => [...queryKeys.admin.all, "products", filters] as const,
    orders: (filters?: any) => [...queryKeys.admin.all, "orders", filters] as const,
  },
};

// ───────────────────────────────────────────────────────────────
// Export All
// ───────────────────────────────────────────────────────────────

export default {
  apiRequest,
  supabaseQuery,
  supabaseMutation,
  queryClient,
  queryKeys,
  API_CONFIG,
};
