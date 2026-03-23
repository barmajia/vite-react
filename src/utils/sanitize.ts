/**
 * Security Utilities — Input Sanitization, Validation & Regex Safety
 */

/**
 * Strip HTML tags and trim whitespace to prevent XSS via user input
 */
export function sanitizeInput(str: string): string {
  return str
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/[<>]/g, "") // Remove any remaining angle brackets
    .trim();
}

/**
 * Escape special regex characters to prevent regex injection
 * Use this before passing user-provided strings into `new RegExp()`
 */
export function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Password strength validation result
 */
export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
  strength: "weak" | "fair" | "strong" | "very-strong";
}

/**
 * Validate password strength.
 * Requirements:
 *  - Minimum 8 characters
 *  - At least 1 uppercase letter
 *  - At least 1 lowercase letter
 *  - At least 1 number
 *  - At least 1 special character (recommended but not blocking)
 */
export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];
  let score = 0;

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  } else {
    score++;
  }

  if (password.length >= 12) score++;

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  } else {
    score++;
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  } else {
    score++;
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  } else {
    score++;
  }

  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    score++;
  }

  let strength: PasswordValidation["strength"];
  if (score <= 2) strength = "weak";
  else if (score <= 3) strength = "fair";
  else if (score <= 5) strength = "strong";
  else strength = "very-strong";

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
}

/**
 * Sanitize search query — remove SQL-like patterns and limit length
 */
export function sanitizeSearchQuery(query: string, maxLength = 200): string {
  return sanitizeInput(query)
    .replace(/['";\\]/g, "") // Remove quotes and backslashes
    .substring(0, maxLength);
}

/**
 * Validate and sanitize a URL to prevent javascript: protocol attacks
 */
export function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  // Block javascript:, data:, vbscript: protocols
  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return "#";
  }
  return trimmed;
}
