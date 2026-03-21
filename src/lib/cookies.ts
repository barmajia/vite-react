/**
 * Cookie Utility Functions
 * Helper functions for managing cookies in the application
 */

export interface CookieOptions {
  days?: number;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
}

/**
 * Set a cookie with the given name and value
 */
export function setCookie(
  name: string,
  value: string,
  options: CookieOptions = {},
): void {
  const {
    days = 30,
    path = "/",
    domain,
    secure = window.location.protocol === "https:",
    sameSite = "Lax",
  } = options;

  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = `; expires=${date.toUTCString()}`;
  }

  const secureFlag = secure ? "; Secure" : "";
  const sameSiteFlag = `; SameSite=${sameSite}`;
  const domainFlag = domain ? `; domain=${domain}` : "";

  document.cookie = `${name}=${value}${expires}; path=${path}${secureFlag}${sameSiteFlag}${domainFlag}`;
}

/**
 * Get a cookie by name
 */
export function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
}

/**
 * Remove a cookie by name
 */
export function removeCookie(name: string, path = "/"): void {
  document.cookie = `${name}=; path=${path}; max-age=0`;
}

/**
 * Check if a cookie exists
 */
export function hasCookie(name: string): boolean {
  return getCookie(name) !== null;
}

/**
 * Get all cookies as an object
 */
export function getAllCookies(): Record<string, string> {
  const cookies: Record<string, string> = {};
  document.cookie.split(";").forEach((cookie) => {
    const [name, value] = cookie.trim().split("=");
    if (name && value) {
      cookies[name] = decodeURIComponent(value);
    }
  });
  return cookies;
}

/**
 * Clear all cookies (use with caution)
 */
export function clearAllCookies(): void {
  const cookies = getAllCookies();
  Object.keys(cookies).forEach((name) => {
    removeCookie(name);
  });
}

/**
 * Parse a JSON value from a cookie
 */
export function getCookieJSON<T>(name: string): T | null {
  const value = getCookie(name);
  if (!value) return null;
  try {
    return JSON.parse(decodeURIComponent(value));
  } catch {
    return null;
  }
}

/**
 * Set a JSON value as a cookie
 */
export function setCookieJSON(
  name: string,
  value: any,
  options?: CookieOptions,
): void {
  setCookie(name, encodeURIComponent(JSON.stringify(value)), options);
}
