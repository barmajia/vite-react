/**
 * Security utilities for URL validation and redirect protection.
 * Prevents open redirect attacks, phishing, and other URL-based exploits.
 */

/**
 * Security configuration constants
 */
export const SECURITY_CONFIG = {
  // Password requirements
  MIN_PASSWORD_LENGTH: 8,
  RECOMMENDED_PASSWORD_LENGTH: 12,
  MAX_PASSWORD_LENGTH: 128,

  // Input sanitization
  MAX_INPUT_LENGTH: 10000,
  MAX_MESSAGE_LENGTH: 5000,
  MAX_NAME_LENGTH: 256,

  // Session security
  SESSION_TIMEOUT: 86400, // 24 hours in seconds
  AUTH_COOKIE_NAME: "aurora-auth-session",

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: 60000, // 1 minute
  RATE_LIMIT_MAX_REQUESTS: 10,
  AUTH_RATE_LIMIT_MAX: 5, // 5 login attempts per window
  AUTH_RATE_LIMIT_WINDOW_MS: 300000, // 5 minutes
  SIGNUP_RATE_LIMIT_MAX: 3, // 3 signups per window
  SIGNUP_RATE_LIMIT_WINDOW_MS: 600000, // 10 minutes

  // Content security
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
} as const;

/**
 * Simple rate limiter class
 */
class RateLimiter {
  private attempts: Map<string, number[]>;
  private maxAttempts: number;
  private windowMs: number;

  constructor(maxAttempts: number, windowMs: number) {
    this.attempts = new Map();
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    const recentAttempts = attempts.filter((t) => now - t < this.windowMs);
    return recentAttempts.length < this.maxAttempts;
  }

  recordAttempt(key: string): void {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    attempts.push(now);
    // Clean old attempts
    this.attempts.set(
      key,
      attempts.filter((t) => now - t < this.windowMs),
    );
  }

  getBlockTimeRemaining(key: string): number {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    const recentAttempts = attempts.filter((t) => now - t < this.windowMs);
    if (recentAttempts.length < this.maxAttempts) return 0;
    const oldestInWindow = recentAttempts[0];
    return Math.ceil((this.windowMs - (now - oldestInWindow)) / 1000);
  }

  clear(key: string): void {
    this.attempts.delete(key);
  }
}

/**
 * Rate limiters for authentication
 */
export const authRateLimiter = new RateLimiter(
  SECURITY_CONFIG.AUTH_RATE_LIMIT_MAX,
  SECURITY_CONFIG.AUTH_RATE_LIMIT_WINDOW_MS,
);

export const signupRateLimiter = new RateLimiter(
  SECURITY_CONFIG.SIGNUP_RATE_LIMIT_MAX,
  SECURITY_CONFIG.SIGNUP_RATE_LIMIT_WINDOW_MS,
);

/**
 * Validates a return URL to prevent open redirect attacks.
 * Only allows safe relative URLs starting with /
 *
 * @param url - The URL to validate
 * @returns true if the URL is safe, false otherwise
 *
 * @example
 * isValidReturnUrl("/dashboard") // true
 * isValidReturnUrl("//evil.com") // false
 * isValidReturnUrl("https://evil.com") // false
 * isValidReturnUrl("/path\\@evil.com") // false
 */
export function isValidReturnUrl(url: string): boolean {
  if (!url || typeof url !== "string") {
    return false;
  }

  const decoded = decodeURIComponent(url);

  return (
    decoded.startsWith("/") &&
    !decoded.startsWith("//") &&
    !decoded.includes("://") &&
    !decoded.includes("\\") &&
    !decoded.includes("\n") &&
    !decoded.includes("\r") &&
    !decoded.includes("\t")
  );
}

/**
 * Sanitizes a return URL, returning it if valid or a safe default if not.
 *
 * @param url - The URL to sanitize
 * @param defaultUrl - The fallback URL if validation fails (default: "/")
 * @returns The validated URL or the default
 *
 * @example
 * sanitizeReturnUrl("/dashboard", "/") // "/dashboard"
 * sanitizeReturnUrl("//evil.com", "/") // "/"
 */
export function sanitizeReturnUrl(url: string, defaultUrl = "/"): string {
  return isValidReturnUrl(url) ? url : defaultUrl;
}

/**
 * Checks if a URL is potentially dangerous (phishing, XSS, etc.)
 *
 * @param url - The URL to check
 * @returns true if the URL is dangerous, false otherwise
 */
export function isDangerousUrl(url: string): boolean {
  if (!url || typeof url !== "string") {
    return false;
  }

  const decoded = decodeURIComponent(url).toLowerCase();

  // Check for javascript: protocol (XSS)
  if (decoded.includes("javascript:")) {
    return true;
  }

  // Check for data: protocol (XSS)
  if (decoded.includes("data:")) {
    return true;
  }

  // Check for vbscript: protocol (legacy XSS)
  if (decoded.includes("vbscript:")) {
    return true;
  }

  // Check for external URLs
  if (decoded.includes("://")) {
    return true;
  }

  // Check for protocol-relative URLs
  if (decoded.startsWith("//")) {
    return true;
  }

  // Check for backslash (IE/Edge bypass)
  if (decoded.includes("\\")) {
    return true;
  }

  return false;
}
