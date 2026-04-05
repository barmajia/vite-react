/**
 * Security Utilities — Input Sanitization, Validation & Safety
 *
 * SECURITY BEST PRACTICES:
 * 1. Always sanitize user input before storage and display
 * 2. Never trust client-side validation alone
 * 3. Use parameterized queries (Supabase handles this)
 * 4. Encode output to prevent XSS
 */

import { SECURITY_CONFIG } from "@/lib/security";

/**
 * Strip HTML tags and trim whitespace to prevent XSS via user input
 */
export function sanitizeInput(str: string): string {
  if (!str) return "";

  return str
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/[<>]/g, "") // Remove any remaining angle brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/data:/gi, "") // Remove data: protocol
    .replace(/vbscript:/gi, "") // Remove vbscript: protocol
    .trim();
}

/**
 * Escape special regex characters to prevent regex injection
 * Use this before passing user-provided strings into `new RegExp()`
 */
export function escapeRegExp(str: string): string {
  if (!str) return "";
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Password strength validation result
 */
export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
  strength: "weak" | "fair" | "strong" | "very-strong";
  score: number;
}

/**
 * Validate password strength.
 * Requirements:
 *  - Minimum 8 characters (configurable)
 *  - At least 1 uppercase letter
 *  - At least 1 lowercase letter
 *  - At least 1 number
 *  - At least 1 special character (recommended but not blocking)
 */
export function validatePassword(password: string): PasswordValidation {
  if (!password) {
    return {
      isValid: false,
      errors: ["Password is required"],
      strength: "weak",
      score: 0,
    };
  }

  const errors: string[] = [];
  let score = 0;

  // Length check
  if (password.length < SECURITY_CONFIG.MIN_PASSWORD_LENGTH) {
    errors.push(
      `Password must be at least ${SECURITY_CONFIG.MIN_PASSWORD_LENGTH} characters long`,
    );
  } else {
    score++;
  }

  // Bonus for longer passwords
  if (password.length >= SECURITY_CONFIG.RECOMMENDED_PASSWORD_LENGTH) {
    score++;
  }

  // Uppercase check
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  } else {
    score++;
  }

  // Lowercase check
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  } else {
    score++;
  }

  // Number check
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  } else {
    score++;
  }

  // Special character check (bonus)
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    score++;
  }

  // Check for common weak passwords
  const weakPasswords = [
    "password",
    "123456",
    "12345678",
    "qwerty",
    "abc123",
    "password123",
    "admin",
    "letmein",
    "welcome",
    "monkey",
    "dragon",
    "master",
    "login",
    "passw0rd",
    "shadow",
  ];

  if (weakPasswords.includes(password.toLowerCase())) {
    errors.push("Password is too common. Please choose a stronger password");
    score = Math.min(score, 2); // Cap score for weak passwords
  }

  // Check for sequential characters
  const sequentialPatterns = [
    /12345678|23456789|34567890/,
    /abcdefgh|bcdefghi|cdefghij/,
    /qwerty|asdfgh|zxcvbn/,
  ];

  if (
    sequentialPatterns.some((pattern) => pattern.test(password.toLowerCase()))
  ) {
    errors.push(
      "Password contains sequential characters. Please choose a stronger password",
    );
    score = Math.min(score, 3);
  }

  // Determine strength
  let strength: PasswordValidation["strength"];
  if (score <= 2) strength = "weak";
  else if (score <= 3) strength = "fair";
  else if (score <= 5) strength = "strong";
  else strength = "very-strong";

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score,
  };
}

/**
 * Sanitize search query — remove SQL-like patterns and limit length
 */
export function sanitizeSearchQuery(query: string, maxLength = 200): string {
  if (!query) return "";

  return sanitizeInput(query)
    .replace(/['";\\]/g, "") // Remove quotes and backslashes
    .replace(
      /(--|\bOR\b|\bAND\b|\bSELECT\b|\bDROP\b|\bDELETE\b|\bUPDATE\b|\bINSERT\b)/gi,
      "",
    ) // Remove SQL keywords
    .substring(0, maxLength);
}

/**
 * Validate and sanitize a URL to prevent javascript: protocol attacks
 */
export function sanitizeUrl(url: string): string {
  if (!url) return "#";

  const trimmed = url.trim();

  // Block dangerous protocols
  const dangerousProtocols = ["javascript:", "data:", "vbscript:", "file:"];

  if (
    dangerousProtocols.some((protocol) =>
      trimmed.toLowerCase().startsWith(protocol),
    )
  ) {
    console.warn("Blocked dangerous URL protocol:", trimmed);
    return "#";
  }

  // Allow http, https, mailto, tel
  const allowedProtocols = ["http:", "https:", "mailto:", "tel:"];
  if (
    trimmed.includes(":") &&
    !allowedProtocols.some((protocol) =>
      trimmed.toLowerCase().startsWith(protocol),
    )
  ) {
    console.warn("Blocked unknown URL protocol:", trimmed);
    return "#";
  }

  return trimmed;
}

/**
 * Sanitize rich text content (for messages, comments, etc.)
 * Allows basic formatting but removes dangerous tags
 */
export function sanitizeRichText(html: string): string {
  if (!html) return "";

  // Remove dangerous tags completely
  const dangerousTags = [
    "script",
    "iframe",
    "object",
    "embed",
    "form",
    "input",
    "button",
    "textarea",
    "select",
    "link",
    "meta",
    "base",
    "style",
  ];

  let sanitized = html;

  // Remove dangerous tags with their content
  dangerousTags.forEach((tag) => {
    const regex = new RegExp(`<${tag}[^>]*>.*?</${tag}>`, "gi");
    sanitized = sanitized.replace(regex, "");

    // Also remove self-closing dangerous tags
    const selfClosingRegex = new RegExp(`<${tag}[^>]*\/?>`, "gi");
    sanitized = sanitized.replace(selfClosingRegex, "");
  });

  // Remove event handlers (onclick, onerror, onload, etc.)
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, "");
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*[^\s>]*/gi, "");

  // Remove javascript: in href/src attributes
  sanitized = sanitized.replace(
    /(href|src)\s*=\s*["']javascript:[^"']*["']/gi,
    '$1="#"',
  );

  return sanitized;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  if (!email) return false;

  // RFC 5322 compliant email regex
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate phone number format (international)
 */
export function validatePhone(phone: string): boolean {
  if (!phone) return false;

  // Remove common separators
  const cleaned = phone.replace(/[\s\-().]/g, "");

  // Check if it's a valid international phone number (8-15 digits)
  const phoneRegex = /^\+?[1-9]\d{7,14}$/;

  return phoneRegex.test(cleaned);
}

/**
 * Sanitize file name to prevent directory traversal and special character issues
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName) return "unnamed";

  // Remove path components
  const baseName = fileName.split(/[\\/]/).pop() || "unnamed";

  // Remove or replace dangerous characters
  const sanitized = baseName
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\.{2,}/g, ".") // Replace multiple dots with single dot
    .replace(/^\.+/, "") // Remove leading dots
    .substring(0, 255); // Limit length

  return sanitized || "unnamed";
}

/**
 * Check for SQL injection patterns in input
 */
export function detectSqlInjection(input: string): boolean {
  if (!input) return false;

  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b)/i,
    /(--|;|\/\*|\*\/)/, // SQL comments
    /(\bOR\b\s+\d+\s*=\s*\d+)/i, // OR 1=1 style attacks
    /(\bAND\b\s+\d+\s*=\s*\d+)/i, // AND 1=1 style attacks
    /('\s*(OR|AND)\s*'?)/i, // ' OR ' style attacks
    /(EXEC|EXECUTE|XP_)/i, // SQL Server execution
    /(LOAD_FILE|INTO\s+OUTFILE|INTO\s+DUMPFILE)/i, // File operations
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}

/**
 * Check for XSS patterns in input
 */
export function detectXss(input: string): boolean {
  if (!input) return false;

  const xssPatterns = [
    /<script[^>]*>/i,
    /<\/script>/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers
    /<iframe[^>]*>/i,
    /<object[^>]*>/i,
    /<embed[^>]*>/i,
    /<svg[^>]*onload/i,
    /<img[^>]*onerror/i,
    /expression\s*\(/i, // CSS expression
    /url\s*\(\s*["']?\s*javascript:/i, // CSS javascript URL
  ];

  return xssPatterns.some((pattern) => pattern.test(input));
}

/**
 * Comprehensive input validation with security checks
 */
export function validateInput(
  input: string,
  options: {
    maxLength?: number;
    allowHtml?: boolean;
    checkSqlInjection?: boolean;
    checkXss?: boolean;
  } = {},
): { valid: boolean; error?: string; sanitized: string } {
  const {
    maxLength = SECURITY_CONFIG.MAX_INPUT_LENGTH,
    allowHtml = false,
    checkSqlInjection = true,
    checkXss = true,
  } = options;

  if (!input || input.trim() === "") {
    return { valid: false, error: "Input is required", sanitized: "" };
  }

  // Check length
  if (input.length > maxLength) {
    return {
      valid: false,
      error: `Input exceeds maximum length of ${maxLength} characters`,
      sanitized: "",
    };
  }

  // Check for SQL injection
  if (checkSqlInjection && detectSqlInjection(input)) {
    console.warn("Potential SQL injection detected:", input.substring(0, 100));
    return { valid: false, error: "Invalid input detected", sanitized: "" };
  }

  // Check for XSS
  if (checkXss && detectXss(input)) {
    console.warn("Potential XSS attack detected:", input.substring(0, 100));
    return { valid: false, error: "Invalid input detected", sanitized: "" };
  }

  // Sanitize based on type
  const sanitized = allowHtml ? sanitizeRichText(input) : sanitizeInput(input);

  return { valid: true, sanitized };
}

/**
 * Create a debounced version of a function for rate limiting UI interactions
 */
export function createDebouncedValidator<
  T extends (...args: unknown[]) => unknown,
>(
  func: T,
  delay: number = 300,
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return new Promise((resolve) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        const result = func(...args);
        resolve(result);
      }, delay);
    });
  };
}
