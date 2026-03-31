import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes with clsx
 * Handles conditional classes and merges conflicting classes properly
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a price value to a readable string
 * @param price - The price value to format
 * @param currency - Currency code (default: EGP for Egyptian Pound)
 */
export function formatPrice(price: number, currency: string = "EGP"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(price);
}

/**
 * Format price with Arabic locale for RTL languages
 */
export function formatPriceArabic(
  price: number,
  currency: string = "EGP",
): string {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(price);
}

/**
 * Format a date to a readable string
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

/**
 * Format a relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)} days ago`;

  return formatDate(date);
}

/**
 * Truncate text to a maximum length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate a unique ID (client-side fallback)
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Debounce function for search inputs
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
 * Get Supabase URL from environment or use hardcoded fallback
 * This ensures images work both locally and in production (Vercel)
 */
function getSupabaseUrl(): string {
  // Try environment variable first
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  if (envUrl) return envUrl;

  // Hardcoded fallback - this ensures production works even without env vars
  return "https://ofovfxsfazlwvcakpuer.supabase.co";
}

/**
 * Get image URL from product images JSON
 * Handles multiple formats: full URLs, relative paths, or objects with url property
 */
export function getProductImage(images: unknown, index: number = 0): string {
  // Fallback placeholder - use a data URI with a simple placeholder design
  const placeholderSvg =
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"%3E%3Crect fill="%23f0f0f0" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="24" fill="%23999" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E';

  if (!images || !Array.isArray(images)) return placeholderSvg;

  const image = images[index];
  if (!image) return placeholderSvg;

  // If it's an object, try to extract the URL
  if (typeof image === "object") {
    const obj = image as Record<string, unknown>;
    const url = obj.url || obj.imageUrl || obj.src || obj.path || obj.file_url;
    if (url) return String(url);
    return placeholderSvg;
  }

  // Convert to string
  const urlString = String(image);

  // If already a full URL (starts with http/https), return as is
  if (urlString.startsWith("http://") || urlString.startsWith("https://")) {
    return urlString;
  }

  // If it's a storage URL path (starts with /storage/), prepend Supabase URL
  if (urlString.startsWith("/storage/")) {
    return `${getSupabaseUrl()}${urlString}`;
  }

  // Construct Supabase storage URL for relative paths
  return `${getSupabaseUrl()}/storage/v1/object/public/product-images/${urlString}`;
}

/**
 * Build full image URL from relative path or return existing URL
 * @param imagePath - Image path or full URL
 * @returns Full image URL
 */
export function buildImageUrl(imagePath: string | null | undefined): string {
  const placeholderSvg =
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"%3E%3Crect fill="%23f0f0f0" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="24" fill="%23999" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
  if (!imagePath) return placeholderSvg;

  // If already a full URL (starts with http/https), return as is
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  // If it's a storage URL path (starts with /storage/), prepend Supabase URL
  if (imagePath.startsWith("/storage/")) {
    return `${getSupabaseUrl()}${imagePath}`;
  }

  // Construct Supabase storage URL for relative paths
  return `${getSupabaseUrl()}/storage/v1/object/public/product-images/${imagePath}`;
}
