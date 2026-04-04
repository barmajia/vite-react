/**
 * Security Utilities Tests
 * Tests for XSS, SQL injection, CSRF, and other security functions
 */

import {
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
  validateEmail,
  validatePassword,
  maskSensitiveData,
  secureRandom,
  RateLimiter,
} from "../../lib/security-utils";

describe("Security Utilities", () => {
  describe("generateSecureToken", () => {
    it("should generate a token of specified length", () => {
      const token = generateSecureToken(32);
      expect(token).toHaveLength(64); // 32 bytes = 64 hex characters
    });

    it("should generate different tokens each time", () => {
      const token1 = generateSecureToken(32);
      const token2 = generateSecureToken(32);
      expect(token1).not.toBe(token2);
    });

    it("should generate hex string", () => {
      const token = generateSecureToken(16);
      expect(token).toMatch(/^[0-9a-f]+$/);
    });

    it("should use default length of 32", () => {
      const token = generateSecureToken();
      expect(token).toHaveLength(64);
    });
  });

  describe("generateCSRFToken", () => {
    it("should generate a token with timestamp prefix", () => {
      const token = generateCSRFToken();
      const parts = token.split(".");
      expect(parts).toHaveLength(2);
      expect(parts[0]).toMatch(/^\d+$/); // timestamp
      expect(parts[1]).toHaveLength(64); // 32 bytes hex
    });

    it("should generate unique tokens", () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe("validateCSRFToken", () => {
    it("should validate a fresh token", () => {
      const token = generateCSRFToken();
      expect(validateCSRFToken(token)).toBe(true);
    });

    it("should reject expired tokens", () => {
      // Create a token with an old timestamp (1 hour ago)
      const oldTimestamp = Date.now() - 3600000;
      const oldToken = `${oldTimestamp}.${"a".repeat(64)}`;
      expect(validateCSRFToken(oldToken, 1000)).toBe(false);
    });

    it("should reject invalid tokens", () => {
      expect(validateCSRFToken("invalid")).toBe(false);
      expect(validateCSRFToken("")).toBe(false);
      expect(validateCSRFToken("no-dot")).toBe(false);
    });
  });

  describe("detectXSS", () => {
    it("should detect script tags", () => {
      expect(detectXSS('<script>alert("xss")</script>')).toBe(true);
      expect(detectXSS('<script src="evil.js"></script>')).toBe(true);
    });

    it("should detect javascript: protocol", () => {
      expect(detectXSS("javascript:alert(1)")).toBe(true);
      expect(detectXSS('<a href="javascript:alert(1)">click</a>')).toBe(true);
    });

    it("should detect event handlers", () => {
      expect(detectXSS('<img onerror="alert(1)">')).toBe(true);
      expect(detectXSS('<svg onload="alert(1)">')).toBe(true);
      expect(detectXSS('<body onpageshow="alert(1)">')).toBe(true);
    });

    it("should detect iframe and object tags", () => {
      expect(detectXSS('<iframe src="evil.com"></iframe>')).toBe(true);
      expect(detectXSS('<object data="evil.swf"></object>')).toBe(true);
    });

    it("should handle encoded XSS", () => {
      expect(detectXSS("&lt;script&gt;alert(1)&lt;/script&gt;")).toBe(true);
    });

    it("should return false for safe input", () => {
      expect(detectXSS("Hello World")).toBe(false);
      expect(detectXSS("<p>Safe HTML</p>")).toBe(false);
      expect(detectXSS("<b>Bold text</b>")).toBe(false);
    });

    it("should handle empty/null input", () => {
      expect(detectXSS("")).toBe(false);
      expect(detectXSS(null as unknown as string)).toBe(false);
      expect(detectXSS(undefined as unknown as string)).toBe(false);
    });
  });

  describe("sanitizeXSS", () => {
    it("should remove script tags", () => {
      const input = '<script>alert("xss")</script>Hello';
      const sanitized = sanitizeXSS(input);
      expect(sanitized).not.toContain("<script>");
    });

    it("should replace javascript: protocol", () => {
      const input = "javascript:alert(1)";
      const sanitized = sanitizeXSS(input);
      expect(sanitized).toContain("blocked:");
    });

    it("should remove event handlers", () => {
      const input = '<img src="x" onerror="alert(1)">';
      const sanitized = sanitizeXSS(input);
      expect(sanitized).not.toContain("onerror");
    });

    it("should encode HTML when allowBasicHTML is false", () => {
      const input = "<script>alert(1)</script>";
      const sanitized = sanitizeXSS(input, { allowBasicHTML: false });
      expect(sanitized).toContain("&lt;");
    });

    it("should handle empty input", () => {
      expect(sanitizeXSS("")).toBe("");
    });
  });

  describe("encodeHTML", () => {
    it("should encode special characters", () => {
      expect(encodeHTML("<")).toBe("&lt;");
      expect(encodeHTML(">")).toBe("&gt;");
      expect(encodeHTML("&")).toBe("&amp;");
      expect(encodeHTML('"')).toBe("&quot;");
      expect(encodeHTML("'")).toBe("&#39;");
    });

    it("should encode multiple characters", () => {
      const input = "<script>&\"'</script>";
      const encoded = encodeHTML(input);
      expect(encoded).toBe(
        "&lt;script&gt;&amp;&quot;&#39;&lt;&#x2F;script&gt;",
      );
    });

    it("should handle empty string", () => {
      expect(encodeHTML("")).toBe("");
    });
  });

  describe("detectSQLInjection", () => {
    it("should detect SELECT injection", () => {
      expect(detectSQLInjection("SELECT * FROM users WHERE id=1 OR 1=1")).toBe(
        true,
      );
    });

    it("should detect UNION injection", () => {
      expect(detectSQLInjection("1 UNION SELECT * FROM users")).toBe(true);
    });

    it("should detect DROP injection", () => {
      expect(detectSQLInjection("'; DROP TABLE users; --")).toBe(true);
    });

    it("should detect comment injection", () => {
      expect(detectSQLInjection("admin'--")).toBe(true);
    });

    it("should return false for safe input", () => {
      expect(detectSQLInjection("Hello World")).toBe(false);
      expect(detectSQLInjection("SELECT ME")).toBe(false); // Not SQL injection context
    });

    it("should require multiple patterns to reduce false positives", () => {
      // Single pattern should not trigger
      expect(detectSQLInjection("SELECT")).toBe(false);
    });
  });

  describe("detectPathTraversal", () => {
    it("should detect basic path traversal", () => {
      expect(detectPathTraversal("../../../etc/passwd")).toBe(true);
      expect(detectPathTraversal("..\\..\\..\\windows\\system32")).toBe(true);
    });

    it("should detect encoded path traversal", () => {
      expect(detectPathTraversal("%2e%2e%2f%2e%2e%2f")).toBe(true);
      expect(detectPathTraversal("%2e%2e/")).toBe(true);
    });

    it("should return false for safe paths", () => {
      expect(detectPathTraversal("/home/user/file.txt")).toBe(false);
      expect(detectPathTraversal("C:\\Users\\file.txt")).toBe(false);
    });
  });

  describe("sanitizeFileName", () => {
    it("should remove dangerous characters", () => {
      expect(sanitizeFileName("file<>.txt")).toBe("file--.txt");
      expect(sanitizeFileName("file?.txt")).toBe("file-.txt");
    });

    it("should remove leading dots", () => {
      expect(sanitizeFileName(".hidden")).toBe("hidden");
      expect(sanitizeFileName("..hidden")).toBe("hidden");
    });

    it("should limit length", () => {
      const longName = "a".repeat(300) + ".txt";
      expect(sanitizeFileName(longName).length).toBeLessThanOrEqual(255);
    });

    it("should handle double extensions", () => {
      expect(sanitizeFileName("file.tar.gz")).toBe("file.tar.gz");
    });

    it("should handle empty result", () => {
      expect(sanitizeFileName("...")).toBe("unnamed_file");
    });
  });

  describe("validateFileType", () => {
    it("should allow valid image types", () => {
      expect(validateFileType("image.jpg", "image/jpeg")).toBe(true);
      expect(validateFileType("image.png", "image/png")).toBe(true);
      expect(validateFileType("image.gif", "image/gif")).toBe(true);
    });

    it("should allow valid document types", () => {
      expect(validateFileType("document.pdf", "application/pdf")).toBe(true);
      expect(validateFileType("document.doc", "application/msword")).toBe(true);
    });

    it("should reject invalid types", () => {
      expect(validateFileType("script.exe", "application/x-executable")).toBe(
        false,
      );
      expect(validateFileType("script.php", "application/x-php")).toBe(false);
    });

    it("should reject mismatched extension and MIME type", () => {
      expect(validateFileType("image.exe", "image/jpeg")).toBe(false);
    });
  });

  describe("validateEmail", () => {
    it("should validate correct emails", () => {
      expect(validateEmail("user@example.com")).toBe(true);
      expect(validateEmail("user.name+tag@example.co.uk")).toBe(true);
      expect(validateEmail("user@sub.example.com")).toBe(true);
    });

    it("should reject invalid emails", () => {
      expect(validateEmail("invalid")).toBe(false);
      expect(validateEmail("user@")).toBe(false);
      expect(validateEmail("@example.com")).toBe(false);
      expect(validateEmail("user@example")).toBe(false);
    });

    it("should reject too long emails", () => {
      const longEmail = "a".repeat(255) + "@example.com";
      expect(validateEmail(longEmail)).toBe(false);
    });
  });

  describe("validatePassword", () => {
    it("should accept strong passwords", () => {
      const result = validatePassword("SecurePass123!");
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject short passwords", () => {
      const result = validatePassword("Short1!");
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining("at least 12 characters"),
      );
    });

    it("should reject passwords without uppercase", () => {
      const result = validatePassword("securepass123!");
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining("uppercase"),
      );
    });

    it("should reject passwords without lowercase", () => {
      const result = validatePassword("SECUREPASS123!");
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining("lowercase"),
      );
    });

    it("should reject passwords without numbers", () => {
      const result = validatePassword("SecurePass!!!");
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(expect.stringContaining("number"));
    });

    it("should reject passwords without special characters", () => {
      const result = validatePassword("SecurePass123");
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.stringContaining("special character"),
      );
    });
  });

  describe("maskSensitiveData", () => {
    it("should mask email", () => {
      expect(maskSensitiveData("user@example.com", "email")).toBe(
        "us***@example.com",
      );
    });

    it("should mask phone", () => {
      expect(maskSensitiveData("1234567890", "phone")).toBe("123***7890");
    });

    it("should mask credit card", () => {
      expect(maskSensitiveData("1234567890123456", "credit_card")).toBe(
        "1234 **** **** 3456",
      );
    });

    it("should mask SSN", () => {
      expect(maskSensitiveData("123-45-6789", "ssn")).toBe("***-**-6789");
    });
  });

  describe("secureRandom", () => {
    it("should generate number within range", () => {
      for (let i = 0; i < 100; i++) {
        const num = secureRandom(1, 10);
        expect(num).toBeGreaterThanOrEqual(1);
        expect(num).toBeLessThanOrEqual(10);
      }
    });

    it("should generate different numbers", () => {
      const numbers = new Set();
      for (let i = 0; i < 100; i++) {
        numbers.add(secureRandom(1, 1000000));
      }
      expect(numbers.size).toBeGreaterThan(50); // Should have variety
    });
  });

  describe("RateLimiter", () => {
    let limiter: RateLimiter;

    beforeEach(() => {
      limiter = new RateLimiter(3, 60000); // 3 attempts per minute
    });

    it("should allow requests under limit", () => {
      expect(limiter.isRateLimited("user1")).toBe(false);
      expect(limiter.isRateLimited("user1")).toBe(false);
      expect(limiter.isRateLimited("user1")).toBe(false);
    });

    it("should block requests over limit", () => {
      limiter.isRateLimited("user2");
      limiter.isRateLimited("user2");
      limiter.isRateLimited("user2");
      expect(limiter.isRateLimited("user2")).toBe(true);
    });

    it("should track different keys separately", () => {
      limiter.isRateLimited("userA");
      limiter.isRateLimited("userA");
      limiter.isRateLimited("userA");

      expect(limiter.isRateLimited("userA")).toBe(true);
      expect(limiter.isRateLimited("userB")).toBe(false);
    });

    it("should return remaining attempts", () => {
      expect(limiter.getRemainingAttempts("user3")).toBe(3);
      limiter.isRateLimited("user3");
      expect(limiter.getRemainingAttempts("user3")).toBe(2);
      limiter.isRateLimited("user3");
      expect(limiter.getRemainingAttempts("user3")).toBe(1);
    });

    it("should reset limiter", () => {
      limiter.isRateLimited("user4");
      limiter.isRateLimited("user4");
      limiter.reset("user4");
      expect(limiter.getRemainingAttempts("user4")).toBe(3);
    });
  });
});
