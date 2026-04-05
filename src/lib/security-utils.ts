/**
 * Aurora E-commerce Advanced Security Utilities
 * Comprehensive security functions for protecting the application
 */

import {
  SECURITY_CONSTANTS,
  SecurityEventType,
  SecurityLevel,
  AuditLogEntry,
  SecurityContext,
} from "./security-constants";

/**
 * Generate a cryptographically secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Generate a CSRF token with timestamp
 */
export function generateCSRFToken(): string {
  const timestamp = Date.now().toString();
  const randomToken = generateSecureToken(32);
  return `${timestamp}.${randomToken}`;
}

/**
 * Validate CSRF token (check if not expired)
 */
export function validateCSRFToken(
  token: string,
  maxAge: number = 3600000,
): boolean {
  try {
    const [timestamp] = token.split(".");
    const tokenTime = parseInt(timestamp, 10);
    const now = Date.now();
    return now - tokenTime < maxAge;
  } catch {
    return false;
  }
}

/**
 * Enhanced XSS detection and prevention
 */
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<\s*img[^>]+onerror\s*=/gi,
  /<\s*svg[^>]+onload\s*=/gi,
  /<\s*iframe[^>]*>/gi,
  /<\s*object[^>]*>/gi,
  /<\s*embed[^>]*>/gi,
  /expression\s*\(/gi,
  /url\s*\(\s*['"]?\s*javascript:/gi,
  /vbscript:/gi,
  /data:text\/html/gi,
];

export function detectXSS(input: string): boolean {
  if (!input || typeof input !== "string") return false;

  const decodedInput = decodeHTMLEntities(input);
  return XSS_PATTERNS.some((pattern) => pattern.test(decodedInput));
}

/**
 * Sanitize string to prevent XSS
 */
export function sanitizeXSS(
  input: string,
  options: { allowBasicHTML?: boolean } = {},
): string {
  if (!input) return "";

  let sanitized = input;

  // Remove script tags and content
  sanitized = sanitized.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    "",
  );

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, "blocked:");

  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, "");
  sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, "");

  // Remove dangerous tags
  if (!options.allowBasicHTML) {
    sanitized = sanitized.replace(
      /<\s*(script|iframe|object|embed|frame|frameset|applet|meta|link|style|form|input|button|textarea|select)[^>]*>/gi,
      "",
    );
  }

  // Encode remaining HTML if not allowing HTML
  if (!options.allowBasicHTML) {
    sanitized = encodeHTML(sanitized);
  }

  return sanitized;
}

/**
 * Decode HTML entities for inspection
 */
function decodeHTMLEntities(input: string): string {
  const entities: Record<string, string> = {
    "&lt;": "<",
    "&gt;": ">",
    "&amp;": "&",
    "&quot;": '"',
    "&#39;": "'",
    "&#x27;": "'",
    "&#x2F;": "/",
    "&#x60;": "`",
  };

  return input.replace(/&[^;]+;/g, (entity) => entities[entity] || entity);
}

/**
 * Encode HTML special characters
 */
export function encodeHTML(input: string): string {
  const htmlEntities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    "/": "&#x2F;",
    "`": "&#x60;",
    "=": "&#x3D;",
  };

  return input.replace(/[&<>"'`=/]/g, (char) => htmlEntities[char]);
}

/**
 * SQL Injection Detection
 */
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)/gi,
  /(--|#|/\*|\*\/)/g,
  /(\bOR\b\s+\d+\s*=\s*\d+)/gi,
  /(\bAND\b\s+\d+\s*=\s*\d+)/gi,
  /('\s*(OR|AND)\s*'?\d+\s*=\s*'?)/gi,
  /;\s*(DROP|DELETE|TRUNCATE|ALTER)/gi,
  /WAITFOR\s+DELAY/gi,
  /BENCHMARK\s*\(/gi,
  /SLEEP\s*\(/gi,
];

export function detectSQLInjection(input: string): boolean {
  if (!input || typeof input !== "string") return false;

  // Check for multiple SQL patterns
  const matches = SQL_INJECTION_PATTERNS.filter((pattern) =>
    pattern.test(input),
  );
  return matches.length >= 2; // Require at least 2 matches to reduce false positives
}

/**
 * Path Traversal Detection
 */
const PATH_TRAVERSAL_PATTERNS = [
  /\.\.\//g,
  /\.\.\\/g,
  /%2e%2e%2f/gi,
  /%2e%2e\//gi,
  /\.\.%2f/gi,
  /%2e%2e\\%2f/gi,
  /%252e%252e%252f/gi,
  /%c0%ae%c0%ae\//gi,
  /%c1%9c\//gi,
];

export function detectPathTraversal(input: string): boolean {
  if (!input || typeof input !== "string") return false;
  return PATH_TRAVERSAL_PATTERNS.some((pattern) => pattern.test(input));
}

/**
 * Validate and sanitize file name
 */
export function sanitizeFileName(fileName: string): string {
  // Remove path components
  const sanitized = fileName.replace(/[/\\?%*:|"<>]/g, "-");

  // Remove hidden file indicators
  const noHidden = sanitized.replace(/^\./g, "");

  // Limit length
  const maxLength = 255;
  const truncated = noHidden.substring(0, maxLength);

  // Ensure no double extensions
  const parts = truncated.split(".");
  if (parts.length > 2) {
    return `${parts[0]}.${parts[parts.length - 1]}`;
  }

  return truncated || "unnamed_file";
}

/**
 * Validate file type by extension and MIME type
 */
export function validateFileType(fileName: string, mimeType: string): boolean {
  const extension = fileName.split(".").pop()?.toLowerCase();

  const allowedExtensions = new Set([
    // Images
    "jpg",
    "jpeg",
    "png",
    "gif",
    "webp",
    "svg",
    // Documents
    "pdf",
    "doc",
    "docx",
    "txt",
    "rtf",
    // Archives
    "zip",
    "rar",
    "7z",
  ]);

  const allowedMimeTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "application/zip",
  ]);

  return (
    allowedExtensions.has(extension || "") && allowedMimeTypes.has(mimeType)
  );
}

/**
 * Rate Limiter Class
 */
export class RateLimiter {
  private store: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(
    private maxAttempts: number,
    private windowMs: number,
  ) {}

  isRateLimited(key: string): boolean {
    const now = Date.now();
    const record = this.store.get(key);

    if (!record) {
      this.store.set(key, { count: 1, resetTime: now + this.windowMs });
      return false;
    }

    if (now > record.resetTime) {
      this.store.set(key, { count: 1, resetTime: now + this.windowMs });
      return false;
    }

    if (record.count >= this.maxAttempts) {
      return true;
    }

    record.count++;
    return false;
  }

  getRemainingAttempts(key: string): number {
    const record = this.store.get(key);
    if (!record) return this.maxAttempts;

    const now = Date.now();
    if (now > record.resetTime) return this.maxAttempts;

    return Math.max(0, this.maxAttempts - record.count);
  }

  getResetTime(key: string): number | null {
    const record = this.store.get(key);
    return record?.resetTime || null;
  }

  reset(key: string): void {
    this.store.delete(key);
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

/**
 * Create rate limiters for different actions
 */
export const rateLimiters = {
  login: new RateLimiter(
    SECURITY_CONSTANTS.RATE_LIMITS.LOGIN_ATTEMPTS,
    SECURITY_CONSTANTS.RATE_LIMITS.LOGIN_WINDOW_MS,
  ),
  signup: new RateLimiter(
    SECURITY_CONSTANTS.RATE_LIMITS.SIGNUP_ATTEMPTS,
    SECURITY_CONSTANTS.RATE_LIMITS.SIGNUP_WINDOW_MS,
  ),
  passwordReset: new RateLimiter(
    SECURITY_CONSTANTS.RATE_LIMITS.PASSWORD_RESET_ATTEMPTS,
    SECURITY_CONSTANTS.RATE_LIMITS.PASSWORD_RESET_WINDOW_MS,
  ),
  api: new RateLimiter(
    SECURITY_CONSTANTS.RATE_LIMITS.API_REQUESTS_PER_MINUTE,
    60000,
  ),
};

/**
 * Audit Logger
 */
export class AuditLogger {
  private logs: AuditLogEntry[] = [];
  private maxLogs = 1000;

  log(
    event: SecurityEventType,
    securityLevel: SecurityLevel,
    context: SecurityContext,
    details: Record<string, unknown> = {},
  ): void {
    if (!SECURITY_CONSTANTS.AUDIT_LOG_CONFIG.ENABLED) return;

    const entry: AuditLogEntry = {
      id: generateSecureToken(16),
      event,
      securityLevel,
      context,
      details,
      ipAddress: context.ipAddress || "unknown",
      userAgent: context.userAgent || "unknown",
      timestamp: context.timestamp || new Date(),
    };

    this.logs.push(entry);

    // Limit log size
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.log("[AUDIT]", event, securityLevel, entry);
    }

    // In production, send to backend logging service
    if (!import.meta.env.DEV) {
      this.sendToBackend(entry);
    }
  }

  private async sendToBackend(entry: AuditLogEntry): Promise<void> {
    try {
      // Send to your logging endpoint
      await fetch("/api/audit-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      console.error("Failed to send audit log:", error);
    }
  }

  getLogs(): AuditLogEntry[] {
    return [...this.logs];
  }

  clear(): void {
    this.logs = [];
  }
}

export const auditLogger = new AuditLogger();

/**
 * Security Headers Helper
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    "Content-Security-Policy":
      SECURITY_CONSTANTS.SECURITY_HEADERS.CONTENT_SECURITY_POLICY,
    "X-Frame-Options": SECURITY_CONSTANTS.SECURITY_HEADERS.X_FRAME_OPTIONS,
    "X-Content-Type-Options":
      SECURITY_CONSTANTS.SECURITY_HEADERS.X_CONTENT_TYPE_OPTIONS,
    "X-XSS-Protection": SECURITY_CONSTANTS.SECURITY_HEADERS.X_XSS_PROTECTION,
    "Referrer-Policy": SECURITY_CONSTANTS.SECURITY_HEADERS.REFERRER_POLICY,
    "Permissions-Policy":
      SECURITY_CONSTANTS.SECURITY_HEADERS.PERMISSIONS_POLICY,
    "Strict-Transport-Security":
      SECURITY_CONSTANTS.SECURITY_HEADERS.STRICT_TRANSPORT_SECURITY,
  };
}

/**
 * Validate email format with enhanced security
 */
export function validateEmail(email: string): boolean {
  if (
    !email ||
    email.length > SECURITY_CONSTANTS.INPUT_VALIDATION.MAX_EMAIL_LENGTH
  ) {
    return false;
  }

  // RFC 5322 compliant email regex
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const config = SECURITY_CONSTANTS.PASSWORD_CONFIG;

  if (password.length < config.MIN_LENGTH) {
    errors.push(
      `Password must be at least ${config.MIN_LENGTH} characters long`,
    );
  }

  if (config.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (config.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (config.REQUIRE_NUMBERS && !/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  if (
    config.REQUIRE_SPECIAL_CHARS &&
    !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password)
  ) {
    errors.push("Password must contain at least one special character");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Mask sensitive data for display
 */
export function maskSensitiveData(
  data: string,
  type: "email" | "phone" | "credit_card" | "ssn",
): string {
  switch (type) {
    case "email":
      return data.replace(/(.{2}).*(@)/, "$1***$2");
    case "phone":
      return data.replace(/(\d{3}).*(\d{4})/, "$1***$2");
    case "credit_card":
      return data.replace(/(\d{4}).*(\d{4})/, "$1 **** **** $2");
    case "ssn":
      return data.replace(/.*-(\d{4})/, "***-**-$1");
    default:
      return data;
  }
}

/**
 * Secure random number generator
 */
export function secureRandom(min: number, max: number): number {
  const range = max - min + 1;
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return min + (array[0] % range);
}

/**
 * Debounce security-sensitive operations
 */
export function debounceSecurity<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
  securityContext: { userId?: string; action: string },
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      // Log rapid attempts as suspicious
      auditLogger.log(
        "SUSPICIOUS_ACTIVITY",
        "medium",
        {
          userId: securityContext.userId,
          action: `Rapid ${securityContext.action} attempts`,
          timestamp: new Date(),
        },
        { debounceWait: wait },
      );
      clearTimeout(timeout);
    }

    timeout = setTimeout(later, wait);
  };
}

export default {
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
};
