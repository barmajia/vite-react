/**
 * Security Module — Rate Limiting, Session Validation & Security Constants
 */

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
 * Note: This is a CLIENT-SIDE measure. Server-side rate limiting
 * (via Supabase / Vercel / API gateway) is still required.
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
}

// ========== Singleton Instances ==========

/** Rate limiter for authentication attempts (5 attempts per 60s, blocked for 60s) */
export const authRateLimiter = new RateLimiter(5, 60_000, 60_000);

/** Rate limiter for password reset requests (3 per 5 min, blocked for 5 min) */
export const resetRateLimiter = new RateLimiter(3, 300_000, 300_000);

/** Rate limiter for message sending (30 messages per minute) */
export const messageRateLimiter = new RateLimiter(30, 60_000, 30_000);

// ========== Security Constants ==========

export const SECURITY_CONFIG = {
  /** Minimum password length */
  MIN_PASSWORD_LENGTH: 8,
  /** Maximum input field length */
  MAX_INPUT_LENGTH: 500,
  /** Maximum search query length */
  MAX_SEARCH_LENGTH: 200,
  /** Maximum message length */
  MAX_MESSAGE_LENGTH: 5000,
  /** Session check interval (ms) */
  SESSION_CHECK_INTERVAL: 5 * 60 * 1000, // 5 minutes
  /** Auth token cookie name */
  AUTH_COOKIE_NAME: "aurora-auth-token",
} as const;
