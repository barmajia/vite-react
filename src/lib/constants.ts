/**
 * Application-wide constants
 */

// App Information
export const APP_NAME = "Aurora";
export const APP_TAGLINE = "Discover Premium Products";
export const APP_VERSION = "1.0.0";

// Routes
export const ROUTES = {
  // Public
  HOME: "/",
  PRODUCTS: "/products",
  PRODUCT_DETAIL: "/products/:asin",
  CATEGORIES: "/categories",
  CATEGORY_PRODUCTS: "/category/:id",
  BRANDS: "/brands",
  BRAND_PRODUCTS: "/brand/:id",
  SERVICES: "/services",
  SERVICES_ONBOARDING: "/services/onboarding",
  ABOUT: "/about",
  CONTACT: "/contact",
  HELP: "/help",

  // Auth
  LOGIN: "/login",
  SIGNUP: "/signup",
  VERIFY_EMAIL: "/verify-email",

  // Customer (Protected)
  CART: "/cart",
  CHECKOUT: "/checkout",
  ORDER_SUCCESS: "/order-success/:id",
  PROFILE: "/profile",
  ORDERS: "/orders",
  ORDER_DETAIL: "/orders/:id",
  WISHLIST: "/wishlist",
  ADDRESSES: "/addresses",
  REVIEWS: "/reviews",
  MESSAGES: "/messages",
  CONVERSATION: "/messages/:id",
  NOTIFICATIONS: "/notifications",
  SETTINGS: "/settings",

  // Errors
  NOT_FOUND: "*",
  SERVER_ERROR: "/error",
} as const;

// Order Status
export const ORDER_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PROCESSING: "processing",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
} as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500",
  confirmed: "bg-blue-500",
  processing: "bg-purple-500",
  shipped: "bg-indigo-500",
  delivered: "bg-green-500",
  cancelled: "bg-red-500",
  refunded: "bg-gray-500",
};

// Notification Types
export const NOTIFICATION_TYPES = {
  ORDER_UPDATE: "order_update",
  MESSAGE: "message",
  PROMOTION: "promotion",
  REVIEW: "review",
  SYSTEM: "system",
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;

// Price Range
export const PRICE_RANGE = {
  MIN: 0,
  MAX: 10000,
  STEP: 10,
} as const;

// Rating
export const RATING = {
  MIN: 1,
  MAX: 5,
} as const;

// Image Upload
export const IMAGE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ["image/jpeg", "image/png", "image/webp"],
  MAX_IMAGES: 5,
} as const;

// Search
export const SEARCH = {
  DEBOUNCE_DELAY: 300,
  MIN_QUERY_LENGTH: 2,
  MAX_QUERY_LENGTH: 100,
} as const;

// Cache
export const CACHE = {
  STALE_TIME: 5 * 60 * 1000, // 5 minutes
  GC_TIME: 10 * 60 * 1000, // 10 minutes
} as const;

// Social Links
export const SOCIAL_LINKS = {
  FACEBOOK: "https://facebook.com/aurura",
  TWITTER: "https://twitter.com/aurora",
  INSTAGRAM: "https://instagram.com/aurora",
  LINKEDIN: "https://linkedin.com/company/aurora",
} as const;

// Contact
export const CONTACT = {
  EMAIL: "contact@aurora.com",
  PHONE: "+201028551087",
} as const;
