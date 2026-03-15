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
 */
export function formatPrice(price: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
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
 * Get image URL from product images JSON
 */
export function getProductImage(images: unknown, index: number = 0): string {
  if (!images || !Array.isArray(images)) return "/placeholder-product.png";

  const image = images[index];
  if (!image) return "/placeholder-product.png";

  // If it's an object, try to extract the URL
  if (typeof image === "object") {
    const obj = image as Record<string, unknown>;
    const url = obj.url || obj.imageUrl || obj.src || obj.path || obj.file_url;
    if (url) return String(url);
    return "/placeholder-product.png";
  }

  // Convert to string
  const urlString = String(image);

  // If already a full URL, return as is
  if (urlString.startsWith("http://") || urlString.startsWith("https://")) {
    return urlString;
  }

  // Construct Supabase storage URL
  const supabaseUrl =
    import.meta.env.VITE_SUPABASE_URL ||
    "https://ofovfxsfazlwvcakpuer.supabase.co";
  return `${supabaseUrl}/storage/v1/object/public/product-images/${urlString}`;
}

/**
 * Build full image URL from relative path or return existing URL
 * @param imagePath - Image path or full URL
 * @returns Full image URL
 */
export function buildImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath) return "/placeholder-product.png";

  // If already a full URL, return as is
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  // Construct Supabase storage URL
  const supabaseUrl =
    import.meta.env.VITE_SUPABASE_URL ||
    "https://ofovfxsfazlwvcakpuer.supabase.co";
  return `${supabaseUrl}/storage/v1/object/public/product-images/${imagePath}`;
}
