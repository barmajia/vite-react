/**
 * Chat Security Utilities
 * 
 * Provides input sanitization, validation, and security measures
 * for all chat-related operations to prevent XSS, SQL injection,
 * and other common vulnerabilities.
 */

import { escapeRegExp } from "@/utils/sanitize";

// ───────────────────────────────────────────────────────────────
// Input Validation Constants
// ───────────────────────────────────────────────────────────────

const MAX_SEARCH_LENGTH = 100;
const MAX_MESSAGE_LENGTH = 5000;
const MAX_DISPLAY_NAME_LENGTH = 50;
const ALLOWED_SEARCH_CHARS = /^[a-zA-Z0-9\s@._-]+$/;
const DANGEROUS_PATTERNS = [
  /<script/i,
  /javascript:/i,
  /on\w+\s*=/i,
  /data:text\/html/i,
  /vbscript:/i,
];

// ───────────────────────────────────────────────────────────────
// Input Sanitization Functions
// ───────────────────────────────────────────────────────────────

/**
 * Sanitize search query for user lookup
 * Prevents SQL injection and XSS attacks
 */
export const sanitizeSearchQuery = (query: string): string => {
  if (!query || typeof query !== "string") {
    return "";
  }

  // Trim and limit length
  let sanitized = query.trim().slice(0, MAX_SEARCH_LENGTH);

  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(sanitized)) {
      console.warn("Blocked potentially malicious search query");
      return "";
    }
  }

  // Only allow safe characters
  if (!ALLOWED_SEARCH_CHARS.test(sanitized)) {
    // Remove disallowed characters instead of rejecting entirely
    sanitized = sanitized.replace(/[^a-zA-Z0-9\s@._-]/g, "");
  }

  // Escape special regex characters if used in client-side filtering
  return escapeRegExp(sanitized);
};

/**
 * Sanitize message content before sending
 * Prevents XSS and script injection
 */
export const sanitizeMessageContent = (content: string): string => {
  if (!content || typeof content !== "string") {
    return "";
  }

  // Limit message length
  let sanitized = content.slice(0, MAX_MESSAGE_LENGTH);

  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(sanitized)) {
      console.warn("Blocked potentially malicious message content");
      // Remove dangerous content instead of rejecting entirely
      sanitized = sanitized
        .replace(/<script[^>]*>.*?<\/script>/gi, "")
        .replace(/javascript:/gi, "")
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "");
    }
  }

  // Strip HTML tags (allow only basic text formatting if needed)
  sanitized = sanitized.replace(/<[^>]*>/g, "");

  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, " ").trim();

  return sanitized;
};

/**
 * Sanitize display name for conversations
 */
export const sanitizeDisplayName = (name: string): string => {
  if (!name || typeof name !== "string") {
    return "Untitled Conversation";
  }

  let sanitized = name.trim().slice(0, MAX_DISPLAY_NAME_LENGTH);

  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(sanitized)) {
      console.warn("Blocked potentially malicious display name");
      return "Untitled Conversation";
    }
  }

  // Remove HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, "");

  // Allow only alphanumeric, spaces, and basic punctuation
  sanitized = sanitized.replace(/[^\w\s\-.,!?()]/g, "");

  return sanitized || "Untitled Conversation";
};

// ───────────────────────────────────────────────────────────────
// UUID Validation
// ───────────────────────────────────────────────────────────────

/**
 * Validate UUID format before passing to database functions
 */
export const isValidUUID = (uuid: string | null | undefined): boolean => {
  if (!uuid || typeof uuid !== "string") {
    return false;
  }

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// ───────────────────────────────────────────────────────────────
// Safe RPC Call Wrapper
// ───────────────────────────────────────────────────────────────

/**
 * Safely call Supabase RPC functions with input validation
 */
export const safeRpcCall = async <T>({
  supabase,
  functionName,
  params,
  validateInputs = true,
}: {
  supabase: any;
  functionName: string;
  params: Record<string, any>;
  validateInputs?: boolean;
}): Promise<{ data: T | null; error: any }> => {
  try {
    // Validate UUID parameters
    if (validateInputs) {
      for (const [key, value] of Object.entries(params)) {
        if (key.includes("_id") || key.endsWith("Id")) {
          if (!isValidUUID(value)) {
            return {
              data: null,
              error: { message: `Invalid UUID format for parameter: ${key}` },
            };
          }
        }

        // Sanitize string parameters
        if (typeof value === "string") {
          if (key.includes("query") || key.includes("search")) {
            params[key] = sanitizeSearchQuery(value);
          } else if (key.includes("message") || key.includes("content")) {
            params[key] = sanitizeMessageContent(value);
          } else if (key.includes("name") || key.includes("display")) {
            params[key] = sanitizeDisplayName(value);
          }
        }
      }
    }

    // Execute RPC call
    const { data, error } = await supabase.rpc(functionName, params);

    if (error) {
      console.error(`RPC Error (${functionName}):`, error.message);
      return { data: null, error };
    }

    return { data: data as T, error: null };
  } catch (error) {
    console.error(`RPC Exception (${functionName}):`, error);
    return {
      data: null,
      error: { message: "An unexpected error occurred" },
    };
  }
};

// ───────────────────────────────────────────────────────────────
// Rate Limiting Helper
// ───────────────────────────────────────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * Simple client-side rate limiting for API calls
 */
export const checkRateLimit = (
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60000,
): boolean => {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
};

/**
 * Get remaining requests for a rate-limited operation
 */
export const getRemainingRequests = (
  key: string,
  maxRequests: number = 10,
): number => {
  const record = rateLimitMap.get(key);
  const now = Date.now();

  if (!record || now > record.resetTime) {
    return maxRequests;
  }

  return Math.max(0, maxRequests - record.count);
};

// ───────────────────────────────────────────────────────────────
// Export All Security Functions
// ───────────────────────────────────────────────────────────────

export default {
  sanitizeSearchQuery,
  sanitizeMessageContent,
  sanitizeDisplayName,
  isValidUUID,
  safeRpcCall,
  checkRateLimit,
  getRemainingRequests,
};
