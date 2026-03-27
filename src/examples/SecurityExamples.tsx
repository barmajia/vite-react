/**
 * Security Implementation Examples
 *
 * This file demonstrates how to use the security features in your components
 */

import React from "react";
import {
  // Security utilities
  detectXSS,
  sanitizeXSS,
  detectSQLInjection,
  generateCSRFToken,
  validateCSRFToken,
  auditLogger,
  rateLimiters,

  // Hooks
  useSecurityInput,
  useSecureFileUpload,
  useSecurityMonitor,

  // Components
  SecurityBoundary,

  // Types
  type SecurityEventType,
} from "@/lib/security";

import { validateEmail, validatePassword } from "@/utils/sanitize";

/**
 * Example 1: Secure Form with Input Validation
 */
export function SecureFormExample() {
  // Email input with validation
  const emailInput = useSecurityInput({
    type: "email",
    required: true,
    validateXSS: true,
    validateSQLInjection: true,
  });

  // Password input with strength validation
  const passwordInput = useSecurityInput({
    type: "password",
    required: true,
    minLength: 12,
    validateXSS: true,
  });

  // Comment input with sanitization
  const commentInput = useSecurityInput({
    type: "text",
    maxLength: 2000,
    validateXSS: true,
    sanitize: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all inputs
    const emailValid = emailInput.validate();
    const passwordValid = passwordInput.validate();
    const commentValid = commentInput.validate();

    if (
      !emailValid.isValid ||
      !passwordValid.isValid ||
      !commentValid.isValid
    ) {
      return;
    }

    // Generate CSRF token for form submission
    const csrfToken = generateCSRFToken();

    // Log the action
    auditLogger.log(
      "PROFILE_UPDATE",
      "low",
      {
        action: "User submitted secure form",
        timestamp: new Date(),
      },
      { formType: "registration" },
    );

    // Submit with CSRF token
    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({
          email: emailInput.value,
          password: passwordInput.value,
          comment: commentInput.value,
        }),
      });

      if (response.ok) {
        console.log("Form submitted securely!");
      }
    } catch (error) {
      console.error("Submission error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Email Field */}
      <div>
        <label>Email</label>
        <input {...emailInput.inputProps} placeholder="Enter email" />
        {emailInput.touched &&
          emailInput.validation.errors.map((err) => (
            <div key={err} className="error">
              {err}
            </div>
          ))}
        {emailInput.validation.hasThreat && (
          <div className="threat">Security threat detected!</div>
        )}
      </div>

      {/* Password Field */}
      <div>
        <label>Password</label>
        <input {...passwordInput.inputProps} type="password" />
        {passwordInput.touched &&
          passwordInput.validation.errors.map((err) => (
            <div key={err} className="error">
              {err}
            </div>
          ))}
      </div>

      {/* Comment Field */}
      <div>
        <label>Comment</label>
        <textarea {...commentInput.inputProps} />
        {commentInput.validation.warnings.map((warn) => (
          <div key={warn} className="warning">
            {warn}
          </div>
        ))}
      </div>

      <button type="submit">Submit Securely</button>
    </form>
  );
}

/**
 * Example 2: Secure File Upload
 */
export function SecureFileUploadExample() {
  const {
    files,
    validation,
    handleFileChange,
    removeFile,
    clearFiles,
    uploading,
    setUploading,
  } = useSecureFileUpload({
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ["image/jpeg", "image/png", "application/pdf"],
    maxFiles: 5,
  });

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);

    // Log upload attempt
    auditLogger.log(
      "FILE_UPLOAD",
      "low",
      {
        action: "File upload initiated",
        timestamp: new Date(),
      },
      {
        fileCount: files.length,
        fileNames: files.map((f) => f.name),
        totalSize: files.reduce((sum, f) => sum + f.size, 0),
      },
    );

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        console.log("Files uploaded successfully!");
        clearFiles();
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        multiple
        onChange={handleFileChange}
        accept="image/*,.pdf"
      />

      {validation.errors.map((err) => (
        <div key={err} className="error">
          {err}
        </div>
      ))}

      {validation.warnings.map((warn) => (
        <div key={warn} className="warning">
          {warn}
        </div>
      ))}

      {files.map((file, index) => (
        <div key={index}>
          <span>
            {file.name} ({(file.size / 1024).toFixed(2)} KB)
          </span>
          <button onClick={() => removeFile(index)}>Remove</button>
        </div>
      ))}

      <button onClick={handleUpload} disabled={uploading || files.length === 0}>
        {uploading ? "Uploading..." : `Upload ${files.length} file(s)`}
      </button>
    </div>
  );
}

/**
 * Example 3: Component with Security Boundary
 */
export function ProtectedComponentExample() {
  const { trackAction } = useSecurityMonitor({
    enableXSSProtection: true,
    enableClickjackingProtection: true,
    enableRateLimiting: true,
    onSecurityViolation: (type, details) => {
      console.warn("Security violation detected:", type, details);
      // Handle violation (redirect, show warning, etc.)
    },
  });

  const handleButtonClick = () => {
    // Track action for rate limiting
    if (!trackAction("button_click", 10, 60000)) {
      alert("Too many attempts. Please slow down.");
      return;
    }

    console.log("Button clicked!");
  };

  return (
    <SecurityBoundary
      enableLogging={true}
      onSecurityError={(error, errorInfo) => {
        console.error("Security error caught:", error);
        auditLogger.log(
          "SUSPICIOUS_ACTIVITY",
          "high",
          {
            action: "Component error",
            timestamp: new Date(),
          },
          {
            error: error.message,
            componentStack: errorInfo.componentStack,
          },
        );
      }}
    >
      <div>
        <h2>Protected Component</h2>
        <button onClick={handleButtonClick}>Click Me</button>
      </div>
    </SecurityBoundary>
  );
}

/**
 * Example 4: Secure Login Form with Rate Limiting
 */
export function SecureLoginFormExample() {
  const emailInput = useSecurityInput({
    type: "email",
    required: true,
    validateXSS: true,
  });

  const passwordInput = useSecurityInput({
    type: "password",
    required: true,
  });

  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Check rate limit
    const email = emailInput.value;
    if (rateLimiters.login.isRateLimited(email)) {
      const resetTime = rateLimiters.login.getResetTime(email);
      const waitTime = Math.ceil(((resetTime || 0) - Date.now()) / 60000);
      setError(`Too many attempts. Please try again in ${waitTime} minutes.`);

      auditLogger.log(
        "RATE_LIMIT_EXCEEDED",
        "medium",
        {
          action: "Login rate limit exceeded",
          timestamp: new Date(),
        },
        { email },
      );
      return;
    }

    // Validate inputs
    if (!emailInput.validate().isValid || !passwordInput.validate().isValid) {
      return;
    }

    // Check for threats
    if (emailInput.validation.hasThreat || passwordInput.validation.hasThreat) {
      auditLogger.log(
        "XSS_ATTEMPT",
        "critical",
        {
          action: "Malicious input detected in login",
          timestamp: new Date(),
        },
        { email },
      );
      setError("Invalid input detected");
      return;
    }

    setLoading(true);
    const csrfToken = generateCSRFToken();

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({
          email: emailInput.value,
          password: passwordInput.value,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || "Login failed");

        // Log failed login
        auditLogger.log(
          "LOGIN_FAILURE",
          "medium",
          {
            action: "Login attempt failed",
            timestamp: new Date(),
          },
          { email, reason: data.message },
        );
      } else {
        // Log successful login
        auditLogger.log(
          "LOGIN_SUCCESS",
          "low",
          {
            action: "User logged in successfully",
            timestamp: new Date(),
          },
          { email },
        );
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input {...emailInput.inputProps} placeholder="Email" />
      <input
        {...passwordInput.inputProps}
        type="password"
        placeholder="Password"
      />

      {error && <div className="error">{error}</div>}

      <button type="submit" disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}

/**
 * Example 5: Security Utility Functions Usage
 */
export function SecurityUtilitiesExample() {
  // Generate CSRF token
  const token = generateCSRFToken();

  // Validate CSRF token
  const isValidToken = validateCSRFToken(token);

  // Detect XSS
  const suspiciousInput = '<script>alert("xss")</script>';
  const hasXSS = detectXSS(suspiciousInput); // true

  // Sanitize XSS
  const sanitized = sanitizeXSS(suspiciousInput); // '&lt;script&gt;alert("xss")&lt;/script&gt;'

  // Detect SQL Injection
  const sqlAttempt = "SELECT * FROM users WHERE id=1 OR 1=1";
  const hasSQLInjection = detectSQLInjection(sqlAttempt); // true

  // Validate email
  const validEmail = validateEmail("user@example.com"); // true

  // Validate password strength
  const passwordValidation = validatePassword("Weak1!");
  console.log(passwordValidation.errors); // Array of strength requirements

  return (
    <div>
      <p>CSRF Token: {token}</p>
      <p>Token Valid: {isValidToken ? "Yes" : "No"}</p>
      <p>XSS Detected: {hasXSS ? "Yes" : "No"}</p>
      <p>Sanitized: {sanitized}</p>
      <p>SQL Injection: {hasSQLInjection ? "Detected" : "Clean"}</p>
    </div>
  );
}

export default {
  SecureFormExample,
  SecureFileUploadExample,
  ProtectedComponentExample,
  SecureLoginFormExample,
  SecurityUtilitiesExample,
};
