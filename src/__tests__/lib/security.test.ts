import {
  isValidReturnUrl,
  sanitizeReturnUrl,
  isDangerousUrl,
} from "../../lib/security";
import { sanitizeXSS } from "../../lib/security-utils";

describe("Security Utilities", () => {
  describe("sanitizeXSS", () => {
    test("removes script tags by default and escapes HTML", () => {
      const input = "<script>alert('xss')</script><p>Hi</p>";
      const expected = "&lt;p&gt;Hi&lt;/p&gt;";
      expect(sanitizeXSS(input)).toBe(expected);
    });

    test("preserves basic HTML when allowed", () => {
      const input = "<script>alert('xss')</script><p>Hi</p>";
      const expected = "<p>Hi</p>";
      expect(sanitizeXSS(input, { allowBasicHTML: true })).toBe(expected);
    });

    test("removes event handlers and dangerous attributes by default", () => {
      const input = "<div onclick='evil()'>Click</div>";
      const expected = "&lt;div&gt;Click&lt;/div&gt;";
      expect(sanitizeXSS(input)).toBe(expected);
      expect(sanitizeXSS(input, { allowBasicHTML: true })).toBe("<div>Click</div>");
    });
  });
  describe("isValidReturnUrl", () => {
    test("allows safe relative URLs", () => {
      expect(isValidReturnUrl("/")).toBe(true);
      expect(isValidReturnUrl("/dashboard")).toBe(true);
      expect(isValidReturnUrl("/products/123")).toBe(true);
      expect(isValidReturnUrl("/checkout?step=1")).toBe(true);
    });

    test("rejects protocol-relative URLs", () => {
      expect(isValidReturnUrl("//evil.com")).toBe(false);
      expect(isValidReturnUrl("//example.com/path")).toBe(false);
    });

    test("rejects absolute URLs with protocols", () => {
      expect(isValidReturnUrl("https://evil.com")).toBe(false);
      expect(isValidReturnUrl("http://evil.com")).toBe(false);
    });

    test("rejects backslash attacks", () => {
      expect(isValidReturnUrl("/\\evil.com")).toBe(false);
      expect(isValidReturnUrl("/path\\@evil.com")).toBe(false);
    });

    test("rejects URLs with newlines/tabs", () => {
      expect(isValidReturnUrl("/path\n evil.com")).toBe(false);
      expect(isValidReturnUrl("/path\r evil.com")).toBe(false);
    });

    test("rejects empty or invalid inputs", () => {
      expect(isValidReturnUrl("")).toBe(false);
      expect(isValidReturnUrl(null as any)).toBe(false);
      expect(isValidReturnUrl(undefined as any)).toBe(false);
    });

    test("handles URL-encoded characters", () => {
      expect(isValidReturnUrl("%2f%2fevil.com")).toBe(false);
      expect(isValidReturnUrl("/products%2F123")).toBe(true);
    });
  });

  describe("sanitizeReturnUrl", () => {
    test("returns valid URLs", () => {
      expect(sanitizeReturnUrl("/dashboard")).toBe("/dashboard");
    });

    test("returns default for invalid URLs", () => {
      expect(sanitizeReturnUrl("//evil.com")).toBe("/");
      expect(sanitizeReturnUrl("https://evil.com")).toBe("/");
    });

    test("allows custom default URL", () => {
      expect(sanitizeReturnUrl("//evil.com", "/safe")).toBe("/safe");
    });
  });

  describe("isDangerousUrl", () => {
    test("detects javascript: protocol", () => {
      expect(isDangerousUrl("javascript:alert('XSS')")).toBe(true);
    });

    test("detects data: protocol", () => {
      expect(isDangerousUrl("data:text/html,<script>alert(1)</script>")).toBe(
        true,
      );
    });

    test("detects external URLs", () => {
      expect(isDangerousUrl("https://evil.com")).toBe(true);
    });

    test("detects backslash attacks", () => {
      expect(isDangerousUrl("/\\evil.com")).toBe(true);
    });

    test("allows safe relative URLs", () => {
      expect(isDangerousUrl("/dashboard")).toBe(false);
    });
  });
});
