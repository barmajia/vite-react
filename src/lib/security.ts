/**
 * Security Module — Rate Limiting, Session Validation & Security Constants
 *
 * SECURITY BEST PRACTICES:
 * 1. Client-side rate limiting is a UX measure only - server-side enforcement is required
 * 2. Never trust client-side validation for security-critical operations
 * 3. Always validate and sanitize data on both client and server
 * 4. Use RLS (Row Level Security) policies for all database operations
 * 5. Implement defense in depth with multiple security layers
 * 6. Log all security-relevant events for audit and monitoring
 *
 * @see {@link ./security-utils.ts} For advanced security utilities
 * @see {@link ./security-constants.ts} For security configuration
 * @see {@link ../../SECURITY_IMPLEMENTATION.md} For complete security documentation
 */

// Re-export security constants from dedicated file
export {
  SECURITY_CONSTANTS,
  type SecurityEventType,
  type SecurityLevel,
  type SecurityContext,
  type AuditLogEntry,
  type SanitizationOptions,
  type RateLimitState,
} from "./security-constants";

// Re-export security utilities
export {
  generateSecureToken,
  generateCSRFToken,
  validateCSRFToken,
  detectXSS,
  sanitizeXSS,
  encodeHTML,
  detectSQLInjection,
  detectPathTraversal,
  sanitizeFileName,
  validateFileType,
  RateLimiter,
  rateLimiters,
  AuditLogger,
  auditLogger,
  getSecurityHeaders,
  validateEmail,
  validatePassword,
  maskSensitiveData,
  secureRandom,
  debounceSecurity,
} from "./security-utils";

// Re-export security constants
export { SECURITY_CONSTANTS as SecurityConfig } from "./security-constants";

// Re-export security hooks
export {
  useSecurityInput,
  useSecureFileUpload,
} from "@/hooks/useSecurityInput";

// Re-export security components
export {
  SecurityBoundary,
  useSecurityMonitor,
} from "@/components/SecurityBoundary";

// ========== Rate Limiter ==========

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  blockedUntil: number;
}

/**
 * In-memory rate limiter for client-side abuse prevention.
 * Tracks attempts per action key and blocks after threshold.
 *
 * ⚠️ SECURITY WARNING: This is CLIENT-SIDE only and can be bypassed.
 * Server-side rate limiting (via Supabase Edge Functions or API gateway)
 * is REQUIRED for production security.
 */
class RateLimiter {
  private attempts = new Map<string, RateLimitEntry>();
  private readonly maxAttempts: number;
  private readonly windowMs: number;
  private readonly blockDurationMs: number;

  constructor(
    maxAttempts: number = 5,
    windowMs: number = 60_000,
    blockDurationMs: number = 60_000,
  ) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
    this.blockDurationMs = blockDurationMs;
  }

  /**
   * Check if the action is allowed. Returns true if OK, false if rate-limited.
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const entry = this.attempts.get(key);

    if (!entry) return true;

    // If currently blocked, check if block has expired
    if (entry.blockedUntil > now) return false;

    // If window expired, reset
    if (now - entry.firstAttempt > this.windowMs) {
      this.attempts.delete(key);
      return true;
    }

    return entry.count < this.maxAttempts;
  }

  /**
   * Record an attempt for the given key.
   * Returns remaining attempts, or -1 if blocked.
   */
  recordAttempt(key: string): number {
    const now = Date.now();
    const entry = this.attempts.get(key);

    if (!entry) {
      this.attempts.set(key, {
        count: 1,
        firstAttempt: now,
        blockedUntil: 0,
      });
      return this.maxAttempts - 1;
    }

    // If window expired, reset
    if (now - entry.firstAttempt > this.windowMs) {
      this.attempts.set(key, {
        count: 1,
        firstAttempt: now,
        blockedUntil: 0,
      });
      return this.maxAttempts - 1;
    }

    entry.count++;

    if (entry.count >= this.maxAttempts) {
      entry.blockedUntil = now + this.blockDurationMs;
      this.attempts.set(key, entry);
      return -1;
    }

    this.attempts.set(key, entry);
    return this.maxAttempts - entry.count;
  }

  /**
   * Get seconds remaining on block, or 0 if not blocked.
   */
  getBlockTimeRemaining(key: string): number {
    const entry = this.attempts.get(key);
    if (!entry) return 0;
    const remaining = entry.blockedUntil - Date.now();
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
  }

  /**
   * Clear rate limit for a key (e.g., after successful login)
   */
  clear(key: string): void {
    this.attempts.delete(key);
  }

  /**
   * Clear all rate limit entries (useful for testing)
   */
  clearAll(): void {
    this.attempts.clear();
  }
}

// ========== Singleton Instances ==========

/** Rate limiter for authentication attempts (5 attempts per 60s, blocked for 60s) */
export const authRateLimiter = new RateLimiter(5, 60_000, 60_000);

/** Rate limiter for password reset requests (3 per 5 min, blocked for 5 min) */
export const resetRateLimiter = new RateLimiter(3, 300_000, 300_000);

/** Rate limiter for message sending (30 messages per minute) */
export const messageRateLimiter = new RateLimiter(30, 60_000, 30_000);

/** Rate limiter for signup attempts (2 per 10 min, blocked for 10 min) */
export const signupRateLimiter = new RateLimiter(2, 600_000, 600_000);

/** Rate limiter for checkout/payment attempts (3 per 5 min) */
export const checkoutRateLimiter = new RateLimiter(3, 300_000, 300_000);

// ========== Security Constants ==========

export const SECURITY_CONFIG = {
  /** Minimum password length */
  MIN_PASSWORD_LENGTH: 8,
  /** Recommended password length for strong security */
  RECOMMENDED_PASSWORD_LENGTH: 12,
  /** Maximum input field length */
  MAX_INPUT_LENGTH: 500,
  /** Maximum search query length */
  MAX_SEARCH_LENGTH: 200,
  /** Maximum message length */
  MAX_MESSAGE_LENGTH: 5000,
  /** Maximum file upload size (in bytes) - 10MB */
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  /** Allowed file extensions for uploads */
  ALLOWED_FILE_EXTENSIONS: [
    "jpg",
    "jpeg",
    "png",
    "gif",
    "webp",
    "pdf",
    "doc",
    "docx",
  ],
  /** Session check interval (ms) */
  SESSION_CHECK_INTERVAL: 5 * 60 * 1000, // 5 minutes
  /** Auth token cookie name */
  AUTH_COOKIE_NAME: "aurora-auth-token",
  /** CSRF token session key */
  CSRF_TOKEN_KEY: "aurora-csrf-token",
  /** Session timeout (30 days in seconds) */
  SESSION_TIMEOUT: 30 * 24 * 60 * 60,
  /** Inactivity timeout (24 hours in ms) */
  INACTIVITY_TIMEOUT: 24 * 60 * 60 * 1000,
} as const;

/**
 * Security-sensitive operations that require additional validation
 */
export const SENSITIVE_OPERATIONS = {
  PAYMENT: "payment",
  PASSWORD_CHANGE: "password_change",
  EMAIL_CHANGE: "email_change",
  ACCOUNT_DELETE: "account_delete",
  API_KEY_GENERATE: "api_key_generate",
} as const;

/**
 * Check if an operation requires additional security validation
 */
export function isSensitiveOperation(operation: string): boolean {
  return Object.values(SENSITIVE_OPERATIONS).includes(operation as any);
}

/**
 * Validate file upload for security
 */
export function validateFileUpload(file: File): {
  valid: boolean;
  error?: string;
} {
  // Check file size
  if (file.size > SECURITY_CONFIG.MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum limit of ${SECURITY_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`,
    };
  }

  // Check file extension
  const extension = file.name.split(".").pop()?.toLowerCase();
  const allowedExtensions =
    SECURITY_CONFIG.ALLOWED_FILE_EXTENSIONS as readonly string[];
  if (!extension || !allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${SECURITY_CONFIG.ALLOWED_FILE_EXTENSIONS.join(", ")}`,
    };
  }

  // Check MIME type for additional security
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (file.type && !allowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file type detected",
    };
  }

  return { valid: true };
}

// Note: generateSecureToken is now exported from security-utils.ts
// This function is kept for backward compatibility but deprecated
/**
 * @deprecated Use generateSecureToken from security-utils.ts instead
 */
export function generateSecureTokenLegacy(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Debounce function to prevent rapid-fire API calls
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit execution frequency
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
