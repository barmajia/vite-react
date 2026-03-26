/**
 * Aurora E-commerce Security Constants
 * Comprehensive security configuration for the application
 */

// Session & Authentication Security
export const SECURITY_CONSTANTS = {
  // Session timeout (2 hours in seconds)
  SESSION_TIMEOUT: 7200,
  
  // Password requirements
  PASSWORD_CONFIG: {
    MIN_LENGTH: 12,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL_CHARS: true,
    MAX_HISTORY: 5, // Prevent reuse of last 5 passwords
  },
  
  // Rate limiting
  RATE_LIMITS: {
    LOGIN_ATTEMPTS: 5,
    LOGIN_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    SIGNUP_ATTEMPTS: 3,
    SIGNUP_WINDOW_MS: 60 * 60 * 1000, // 1 hour
    PASSWORD_RESET_ATTEMPTS: 3,
    PASSWORD_RESET_WINDOW_MS: 60 * 60 * 1000, // 1 hour
    API_REQUESTS_PER_MINUTE: 100,
    FILE_UPLOADS_PER_HOUR: 20,
  },
  
  // Account lockout
  ACCOUNT_LOCKOUT: {
    MAX_FAILED_ATTEMPTS: 5,
    LOCKOUT_DURATION_MS: 30 * 60 * 1000, // 30 minutes
  },
  
  // Cookie security
  COOKIE_CONFIG: {
    SECURE: true,
    SAME_SITE: 'strict' as const,
    PATH: '/',
    MAX_AGE: 7200, // 2 hours
  },
  
  // CORS configuration
  CORS_CONFIG: {
    ALLOWED_ORIGINS: [
      'https://aurora-ecommerce.com',
      'https://www.aurora-ecommerce.com',
      'https://app.aurora-ecommerce.com',
    ],
    ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    ALLOWED_HEADERS: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  },
  
  // File upload security
  FILE_UPLOAD_CONFIG: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    MAX_FILES_PER_UPLOAD: 5,
  },
  
  // Input validation
  INPUT_VALIDATION: {
    MAX_USERNAME_LENGTH: 30,
    MAX_EMAIL_LENGTH: 254,
    MAX_PASSWORD_LENGTH: 128,
    MAX_INPUT_LENGTH: 10000,
    MAX_COMMENT_LENGTH: 2000,
  },
  
  // Security headers
  SECURITY_HEADERS: {
    CONTENT_SECURITY_POLICY: "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    X_FRAME_OPTIONS: 'DENY',
    X_CONTENT_TYPE_OPTIONS: 'nosniff',
    X_XSS_PROTECTION: '1; mode=block',
    REFERRER_POLICY: 'strict-origin-when-cross-origin',
    PERMISSIONS_POLICY: 'geolocation=(self), microphone=(), camera=()',
    STRICT_TRANSPORT_SECURITY: 'max-age=31536000; includeSubDomains; preload',
  },
  
  // Encryption
  ENCRYPTION_CONFIG: {
    ALGORITHM: 'AES-256-GCM',
    KEY_LENGTH: 256,
    IV_LENGTH: 16,
    SALT_LENGTH: 32,
  },
  
  // Audit logging
  AUDIT_LOG_CONFIG: {
    ENABLED: true,
    LOG_LEVEL: 'info',
    RETENTION_DAYS: 90,
    EVENTS_TO_LOG: [
      'login',
      'logout',
      'password_change',
      'email_change',
      'profile_update',
      'payment_attempt',
      'file_upload',
      'data_export',
      'account_deletion',
    ],
  },
  
  // Sensitive data patterns (for detection and sanitization)
  SENSITIVE_DATA_PATTERNS: {
    CREDIT_CARD: /\b(?:\d{4}[- ]?){3}\d{4}\b/,
    SSN: /\b\d{3}-\d{2}-\d{4}\b/,
    EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
    PHONE: /\b(?:\+?\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}\b/,
  },
};

// Security event types for audit logging
export type SecurityEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'LOGOUT'
  | 'PASSWORD_CHANGE'
  | 'PASSWORD_RESET_REQUEST'
  | 'EMAIL_CHANGE_REQUEST'
  | 'EMAIL_CHANGE_COMPLETE'
  | 'PROFILE_UPDATE'
  | 'PAYMENT_INITIATED'
  | 'PAYMENT_COMPLETED'
  | 'PAYMENT_FAILED'
  | 'FILE_UPLOAD'
  | 'FILE_DOWNLOAD'
  | 'DATA_EXPORT'
  | 'ACCOUNT_DELETION_REQUEST'
  | 'SUSPICIOUS_ACTIVITY'
  | 'RATE_LIMIT_EXCEEDED'
  | 'CSRF_VIOLATION'
  | 'XSS_ATTEMPT'
  | 'SQL_INJECTION_ATTEMPT';

// Security levels
export type SecurityLevel = 'low' | 'medium' | 'high' | 'critical';

// Security context for different operations
export interface SecurityContext {
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  action: string;
  resource?: string;
  timestamp: Date;
}

// Audit log entry structure
export interface AuditLogEntry {
  id: string;
  event: SecurityEventType;
  securityLevel: SecurityLevel;
  context: SecurityContext;
  details: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

// Input sanitization options
export interface SanitizationOptions {
  allowHtml?: boolean;
  allowedTags?: string[];
  max_length?: number;
  trim?: boolean;
  encode?: boolean;
}

// Rate limiter state
export interface RateLimitState {
  attempts: number;
  firstAttempt: number;
  blockedUntil?: number;
}

export default SECURITY_CONSTANTS;
