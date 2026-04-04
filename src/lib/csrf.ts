/**
 * CSRF Protection Module
 *
 * Provides token-based CSRF protection for sensitive operations.
 * Tokens are stored in sessionStorage and sent with API requests.
 *
 * SECURITY NOTE: Actual CSRF token validation MUST happen server-side
 * (in Supabase Edge Functions). This client-side validateCsrfToken
 * is provided for UX feedback only (e.g., showing error messages).
 * Never rely on client-side validation for security decisions.
 */

const CSRF_TOKEN_KEY = "aurora-csrf-token";
const CSRF_TOKEN_EXPIRY_KEY = "aurora-csrf-token-expires";

/**
 * Generate a cryptographically secure random token
 */
function generateSecureToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Get or create CSRF token for current session
 */
export function getCsrfToken(): string {
  const existingToken = sessionStorage.getItem(CSRF_TOKEN_KEY);
  const expiry = sessionStorage.getItem(CSRF_TOKEN_EXPIRY_KEY);

  // Check if token exists and is still valid (24 hours)
  if (existingToken && expiry) {
    const expiryTime = parseInt(expiry, 10);
    if (Date.now() < expiryTime) {
      return existingToken;
    }
  }

  // Generate new token (valid for 24 hours)
  const newToken = generateSecureToken();
  const newExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  sessionStorage.setItem(CSRF_TOKEN_KEY, newToken);
  sessionStorage.setItem(CSRF_TOKEN_EXPIRY_KEY, newExpiry.toString());

  return newToken;
}

/**
 * Clear CSRF token (on logout)
 */
export function clearCsrfToken(): void {
  sessionStorage.removeItem(CSRF_TOKEN_KEY);
  sessionStorage.removeItem(CSRF_TOKEN_EXPIRY_KEY);
}

/**
 * Get CSRF token headers for API requests
 */
export function getCsrfHeaders(): Record<string, string> {
  const token = getCsrfToken();
  return {
    "X-CSRF-Token": token,
  };
}

/**
 * Client-side CSRF token check for UX feedback only.
 *
 * SECURITY WARNING: This does NOT provide actual CSRF protection.
 * Both the token and validation run in the same client context,
 * so a CSRF attack would include the token automatically.
 *
 * REAL CSRF PROTECTION MUST HAPPEN SERVER-SIDE:
 * 1. Supabase Edge Functions should read X-CSRF-Token from request headers
 * 2. Compare it against the session token stored server-side
 * 3. Reject the request if tokens don't match
 *
 * Use this function only to show error messages to the user
 * after the server has already rejected the request.
 */
export function validateCsrfToken(token: string): boolean {
  const storedToken = sessionStorage.getItem(CSRF_TOKEN_KEY);
  const expiry = sessionStorage.getItem(CSRF_TOKEN_EXPIRY_KEY);

  if (!storedToken || !expiry) return false;

  const expiryTime = parseInt(expiry, 10);
  if (Date.now() >= expiryTime) return false;

  return token === storedToken;
}
